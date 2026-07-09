/**
 * Zug-/Step-Automatik und Priority-Fenster (rules-engine.md Abschnitt 2+3).
 *
 * Kernschleife (siehe rules-engine.md 3, Konsequenz für die Engine):
 *   SBA-Check -> Trigger einreihen -> Priority vergeben -> Aktion/Pass ->
 *   ggf. Resolution/Stepwechsel -> von vorn.
 *
 * Turn-based actions ohne Priority-Fenster (untap, Ziehen, Cleanup-Abwurf)
 * werden hier automatisch abgewickelt; Steps, die eine erzwungene
 * Spieler-Entscheidung brauchen (Declare Attackers/Blockers, Cleanup-Abwurf
 * bei Handkartenlimit-Überschreitung), lassen `priorityPlayer` bewusst
 * `undefined` und WARTEN auf die passende PlayerAction (siehe actions.ts).
 *
 * TODO / bewusste v0.1-Lücke: Die Cleanup-Sonderregel ("greift eine SBA oder
 * ein Trigger während Cleanup, gibt es ein Priority-Fenster und danach einen
 * WEITEREN Cleanup Step", rules-engine.md 2) ist nur EINMAL simplifiziert
 * umgesetzt: nach dem einen Extra-Fenster geht es direkt in den nächsten Zug,
 * statt Cleanup erneut komplett zu durchlaufen (erneuter Handkarten-Check
 * fehlt z.B., falls ein Trigger Karten auf die Hand brächte). Für v0.1-Karten
 * (ohne solche Cleanup-Trigger) ist das unkritisch; vor komplexeren Karten
 * bitte mit game-architect klären.
 */

import type { CardPool, GameEvent, GameState, PlayerId, TurnStep } from "../model";
import { drawCard } from "./zones";
import { runStateBasedActionsLoop } from "./sba";
import { flushPendingTriggersToStack, fireUpkeepOrEndStepTriggers } from "./triggers";
import { resolveTopOfStack } from "./stack";
import { clearCombatState, currentAttackers, dealCombatDamage } from "./combat";
import { clearAllManaPools, otherPlayer } from "./util";

const STEP_ORDER: TurnStep[] = [
  "untap",
  "upkeep",
  "draw",
  "main1",
  "beginCombat",
  "declareAttackers",
  "declareBlockers",
  "combatDamage",
  "endCombat",
  "main2",
  "endStep",
  "cleanup",
];

const STEPS_WITH_PRIORITY: ReadonlySet<TurnStep> = new Set<TurnStep>([
  "upkeep",
  "draw",
  "main1",
  "beginCombat",
  "combatDamage",
  "endCombat",
  "main2",
  "endStep",
]);

export function hasPriorityWindow(step: TurnStep): boolean {
  return STEPS_WITH_PRIORITY.has(step);
}

/**
 * SBA-Schleife + Trigger-Stacking, wie es VOR JEDER Priority-Vergabe laufen
 * muss (rules-engine.md 3.3) - auch vor einem einfachen Weiterreichen der
 * Priority an den anderen Spieler nach einem einzelnen Pass (nicht nur beim
 * "beide haben gepasst"-Fall). Gibt zurück, ob das Spiel dabei beendet wurde
 * bzw. ob eine PendingDecision (rules-engine.md 9.7) die Priority-Vergabe
 * blockiert (`GameState.pendingDecision` ist dann gesetzt).
 */
export function checkStateBeforePriority(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
): { gameEnded: boolean; decisionPending: boolean } {
  runStateBasedActionsLoop(state, pool, events);
  if (state.winner !== undefined) return { gameEnded: true, decisionPending: false };
  if (state.pendingDecision !== undefined) return { gameEnded: false, decisionPending: true };
  flushPendingTriggersToStack(state, pool, events);
  return { gameEnded: false, decisionPending: state.pendingDecision !== undefined };
}

/**
 * Öffnet ein NEUES Priority-Fenster (setzt consecutivePasses zurück): SBA-
 * Schleife -> Trigger stacken -> Priority vergeben. `recipient` ist explizit,
 * weil nach einer Aktion (Cast/Aktivieren) DERSELBE Spieler erneut Priority
 * erhält (rules-engine.md 3.2) - das muss nicht der aktive Spieler sein
 * (z.B. Antwort des nicht-aktiven Spielers). Bei Step-Beginn und nach einer
 * Resolution ist recipient = activePlayer (rules-engine.md 3.1/3.5).
 *
 * v0.2.1 (Pending Decisions, rules-engine.md 9.7 letzter Absatz): Bricht das
 * Trigger-Stacken mit einer PendingDecision ab, wird `recipient` in
 * `GameState.resumePriorityTo` gemerkt (statt verloren zu gehen) - siehe
 * `resumePriorityAfterDecision` unten, das nach `resolveDecision` genau
 * dorthin vergibt, statt pauschal an `activePlayer`.
 *
 * Für das einfache Weiterreichen der Priority nach einem einzelnen Pass
 * (Stack/Step unverändert) siehe stattdessen `checkStateBeforePriority` +
 * manuelles Setzen von priorityPlayer/resumePriorityTo in actions.ts - dort
 * darf consecutivePasses NICHT zurückgesetzt werden, sonst geht die "beide
 * haben gepasst"-Erkennung verloren.
 */
export function openPriorityWindow(state: GameState, pool: CardPool, events: GameEvent[], recipient: PlayerId): void {
  const { gameEnded, decisionPending } = checkStateBeforePriority(state, pool, events);
  if (gameEnded) {
    state.priorityPlayer = undefined;
    state.resumePriorityTo = undefined;
    return;
  }
  if (decisionPending) {
    state.priorityPlayer = undefined;
    state.resumePriorityTo = recipient;
    return;
  }
  state.priorityPlayer = recipient;
  state.resumePriorityTo = undefined;
  state.consecutivePasses = [];
  events.push({ kind: "priorityGained", player: recipient });
}

/**
 * Wird nach `resolveDecision` aufgerufen, um eine durch eine PendingDecision
 * unterbrochene Priority-Vergabe fortzusetzen (rules-engine.md 9.7, letzter
 * Absatz). Läuft die normale Vor-Priority-Schleife erneut (weitere Trigger
 * dürfen wieder pausieren - `resumePriorityTo` bleibt dabei unverändert
 * stehen, überlebt also Ketten mehrerer Decisions). Ist `resumePriorityTo`
 * nicht gesetzt, lag die aufgelöste Decision AUSSERHALB einer Priority-
 * Vergabe (z.B. künftige `chooseDiscard`/`orderScry` während Kosten-/
 * Resolution-Abwicklung) - dafür gibt es aktuell keinen eigenen
 * "Wiederaufnahme"-Codepfad, da noch keine solche Decision von der Engine
 * erzeugt wird (TODO für deren Migration, siehe docs/engine-status.md).
 */
export function resumePriorityAfterDecision(state: GameState, pool: CardPool, events: GameEvent[]): void {
  const recipient = state.resumePriorityTo;
  if (recipient === undefined) return;

  const { gameEnded, decisionPending } = checkStateBeforePriority(state, pool, events);
  if (gameEnded) {
    state.priorityPlayer = undefined;
    state.resumePriorityTo = undefined;
    return;
  }
  if (decisionPending) {
    // Nächster Trigger in der Kette ist ebenfalls mehrdeutig - resumePriorityTo
    // bleibt unverändert stehen (s. Doku oben), priorityPlayer bleibt undefined.
    state.priorityPlayer = undefined;
    return;
  }
  state.priorityPlayer = recipient;
  state.resumePriorityTo = undefined;
  state.consecutivePasses = [];
  events.push({ kind: "priorityGained", player: recipient });
}

function computeNextStep(state: GameState): TurnStep | "newTurn" {
  if (state.step === "declareAttackers" && currentAttackers(state, state.activePlayer).length === 0) {
    return "endCombat";
  }
  const idx = STEP_ORDER.indexOf(state.step);
  if (idx === STEP_ORDER.length - 1) return "newTurn";
  return STEP_ORDER[idx + 1]!;
}

/** Wird aufgerufen, wenn im aktuellen Step beide Spieler bei leerem Stack gepasst haben. */
export function advanceStep(state: GameState, pool: CardPool, events: GameEvent[]): void {
  const next = computeNextStep(state);
  if (next === "newTurn") {
    beginTurn(state, pool, events);
  } else {
    beginStep(state, pool, events, next);
  }
}

/**
 * Wird aufgerufen, wenn beide Spieler nacheinander gepasst haben
 * (rules-engine.md 3.5): Stack nicht leer -> resolven, Stack leer -> Step
 * wechseln.
 */
export function handleBothPassed(state: GameState, pool: CardPool, events: GameEvent[]): void {
  state.consecutivePasses = [];
  if (state.stack.length > 0) {
    resolveTopOfStack(state, pool, events);
    openPriorityWindow(state, pool, events, state.activePlayer);
  } else {
    advanceStep(state, pool, events);
  }
}

export function beginTurn(state: GameState, pool: CardPool, events: GameEvent[]): void {
  state.turnNumber += 1;
  state.activePlayer = otherPlayer(state, state.activePlayer);
  state.players[state.activePlayer].terrainsPlayedThisTurn = 0;
  events.push({ kind: "turnBegan", player: state.activePlayer, turnNumber: state.turnNumber });
  beginStep(state, pool, events, "untap");
}

export function beginStep(state: GameState, pool: CardPool, events: GameEvent[], step: TurnStep): void {
  clearAllManaPools(state); // "Der Manapool leert sich am Ende jedes Steps und jeder Phase" (rules-engine.md 1)
  state.step = step;
  events.push({ kind: "stepBegan", step });

  switch (step) {
    case "untap": {
      const active = state.players[state.activePlayer];
      for (const instanceId of active.battlefield) {
        const ps = state.cards[instanceId]!.permanentState;
        if (!ps) continue;
        if (ps.tapped) {
          ps.tapped = false;
          events.push({ kind: "permanentUntapped", instanceId });
        }
        ps.summoningSick = false;
      }
      // Kein Priority-Fenster -> direkt weiter.
      advanceStep(state, pool, events);
      return;
    }
    case "upkeep": {
      fireUpkeepOrEndStepTriggers(state, pool, "onUpkeep", state.activePlayer);
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "draw": {
      // "Der Spieler, der im ersten Zug des Spiels beginnt, überspringt seinen ersten Draw Step."
      // Turn 1 ist per Definition immer der erste Zug des Startspielers -> hier eindeutig ableitbar.
      if (state.turnNumber !== 1) {
        drawCard(state, events, state.activePlayer);
      }
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "main1":
    case "beginCombat": {
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "declareAttackers": {
      // Turn-based Aktion erfordert Spieler-Input (welche Angreifer) -> siehe actions.ts.
      state.priorityPlayer = undefined;
      return;
    }
    case "declareBlockers": {
      state.priorityPlayer = undefined;
      return;
    }
    case "combatDamage": {
      dealCombatDamage(state, pool, events, state.activePlayer);
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "endCombat": {
      clearCombatState(state);
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "main2": {
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "endStep": {
      fireUpkeepOrEndStepTriggers(state, pool, "onEndStep", state.activePlayer);
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "cleanup": {
      runCleanup(state, pool, events);
      return;
    }
    default: {
      const _exhaustive: never = step;
      void _exhaustive;
    }
  }
}

/** Cleanup Step: Handkartenlimit, Schaden/Bis-Zugende-Effekte entfernen, Ausnahme-Priority-Fenster. */
export function runCleanup(state: GameState, pool: CardPool, events: GameEvent[]): void {
  const active = state.players[state.activePlayer];
  if (active.hand.length > 7) {
    // Wartet auf PlayerAction "discardToHandSize" (siehe actions.ts), das
    // anschließend finishCleanup(...) erneut aufruft.
    state.priorityPlayer = undefined;
    return;
  }
  finishCleanup(state, pool, events);
}

export function finishCleanup(state: GameState, pool: CardPool, events: GameEvent[]): void {
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    for (const instanceId of state.players[playerId].battlefield) {
      const ps = state.cards[instanceId]?.permanentState;
      if (!ps) continue;
      ps.damageMarked = 0;
      ps.temporaryModifiers = ps.temporaryModifiers.filter((m) => m.duration !== "endOfTurn");
    }
  }

  runStateBasedActionsLoop(state, pool, events);
  if (state.winner !== undefined) {
    state.priorityPlayer = undefined;
    return;
  }
  if (state.pendingTriggers.length > 0 || state.pendingDecision !== undefined) {
    // Cleanup-Ausnahme (rules-engine.md 2): Extra-Priority-Fenster, Empfänger
    // ist hier immer der aktive Spieler.
    // TODO: siehe Datei-Kommentar oben - kein vollständiges Re-Loop in Cleanup.
    flushPendingTriggersToStack(state, pool, events);
    if (state.pendingDecision !== undefined) {
      // Trigger-Zielwahl (9.7) blockiert das Extra-Fenster - wartet auf
      // resolveDecision; Empfänger für danach merken (siehe openPriorityWindow).
      state.priorityPlayer = undefined;
      state.resumePriorityTo = state.activePlayer;
      return;
    }
    state.priorityPlayer = state.activePlayer;
    state.resumePriorityTo = undefined;
    state.consecutivePasses = [];
    events.push({ kind: "priorityGained", player: state.activePlayer });
    return;
  }
  beginTurn(state, pool, events);
}
