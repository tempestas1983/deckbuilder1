/**
 * Mulligan-Phase (rules-engine.md 1b + Entscheidung 9.11, v0.3): klassische
 * Paris-Variante, streng sequentiell (Startspieler zuerst, dann der andere).
 * Liegt außerhalb jeder Priority-Vergabe (`resumePriorityTo` bleibt
 * unberührt) - `createGame` setzt die initiale Decision statt sofort
 * `beginStep("untap")` aufzurufen (Ausnahme: `CreateGameConfig.skipMulligans`).
 */

import type { CardPool, GameEvent, GameState, PendingDecision, PlayerId } from "../model";
import { drawCard, moveCard } from "./zones";
import { shuffleInPlace } from "./rng";
import { beginStep } from "./turn";
import { otherPlayer } from "./util";

const STARTING_HAND_SIZE = 7;

/** Initiale Decision für den Startspieler, von `createGame` gesetzt. */
export function buildInitialMulliganDecision(activePlayer: PlayerId): PendingDecision {
  return { kind: "mulligan", player: activePlayer, timesMulliganed: 0 };
}

/**
 * Löst eine ausstehende `mulligan`-Decision auf (`actions.ts#perform`).
 * `decision.player` ist entweder der Startspieler (== `state.activePlayer`,
 * der während der gesamten Mulligan-Phase unverändert bleibt, da `beginTurn`
 * erst NACH der Phase läuft) oder der zweite Spieler.
 */
export function resolveMulliganDecision(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  decision: Extract<PendingDecision, { kind: "mulligan" }>,
  takeMulligan: boolean,
): void {
  const player = decision.player;
  events.push({ kind: "decisionResolved", player, decisionKind: "mulligan" });

  if (takeMulligan) {
    // Hand vollständig in die Library, mischen, dann eine Karte weniger ziehen (1b Punkt 2).
    const hand = [...state.players[player].hand];
    for (const cardInstanceId of hand) {
      moveCard(state, events, cardInstanceId, player, "library");
    }
    shuffleInPlace(state, state.players[player].library);

    state.players[player].mulligans += 1;
    const newHandSize = STARTING_HAND_SIZE - state.players[player].mulligans;
    for (let i = 0; i < newHandSize; i++) {
      drawCard(state, events, player);
    }
    events.push({ kind: "mulliganTaken", player, newHandSize });

    if (newHandSize > 0) {
      state.pendingDecision = { kind: "mulligan", player, timesMulliganed: state.players[player].mulligans };
      events.push({ kind: "decisionRequired", player, decisionKind: "mulligan" });
      return;
    }
    // Handgröße 0 -> automatisches Behalten, keine weitere Decision (1b Punkt 2, letzter Satz).
  }

  advancePastPlayer(state, pool, events, player);
}

/** Nach "behalten" (oder automatischem Behalten bei Handgröße 0): nächster Spieler dran, oder Phase beendet. */
function advancePastPlayer(state: GameState, pool: CardPool, events: GameEvent[], player: PlayerId): void {
  state.pendingDecision = undefined;
  if (player === state.activePlayer) {
    // Startspieler ist fertig -> der andere Spieler beginnt seine Mulligan-
    // Entscheidungen (1b Punkt 3, streng sequentiell).
    const next = otherPlayer(state, player);
    state.pendingDecision = { kind: "mulligan", player: next, timesMulliganed: 0 };
    events.push({ kind: "decisionRequired", player: next, decisionKind: "mulligan" });
    return;
  }
  // Beide Spieler fertig -> Zug 1 beginnt mit dem Untap Step (1b Punkt 3, letzter Satz).
  beginStep(state, pool, events, "untap");
}
