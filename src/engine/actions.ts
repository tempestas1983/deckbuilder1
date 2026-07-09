/**
 * applyAction: validiert eine PlayerAction gegen den (unveränderten) State
 * und führt sie bei Erfolg auf einer Kopie aus (Hybrid-Modell,
 * rules-engine.md 9.1). Bei Validierungsfehlern wird der Original-State
 * unverändert zurückgegeben (siehe ApplyActionResult.error).
 *
 * v0.2-Abdeckung: passPriority, castSpell (inkl. X-Kosten), playTerrain,
 * activateAbility, declareAttackers, declareBlockers (inkl. `guardian`-
 * Blockpflicht), discardToHandSize, resolveDecision (nur
 * `chooseTriggerTargets` implementiert, siehe triggers.ts), concede.
 */

import type {
  ApplyActionResult,
  CardPool,
  DecisionChoice,
  GameEvent,
  GameState,
  PlayerAction,
  PlayerId,
} from "../model";
import { getDefinition, getDefinitionForInstance } from "./card-defs";
import { findZone, leaveBattlefield, moveCard } from "./zones";
import { canPayCost, payCost } from "./mana";
import { computeSpellCostDelta } from "./stats";
import { areAllTargetsLegal } from "./targets";
import { pushActivatedAbilityToStack, pushSpellToStack } from "./stack";
import { executeEffects } from "./effects";
import { fireEnterBattlefieldTriggers, fireSpellCastTriggers, pushResolvedTriggerToStack } from "./triggers";
import {
  applyOrderBlockers,
  buildOrderBlockersDecision,
  declareAttackers,
  declareBlockers,
  guardianUnitsRequiringBlock,
  isLegalAttacker,
  isLegalBlock,
} from "./combat";
import { runStateBasedActionsLoop } from "./sba";
import { checkStateBeforePriority, finishCleanup, handleBothPassed, openPriorityWindow, resumePriorityAfterDecision } from "./turn";
import { canActivateAbilityNow, canCastNow, canPlayTerrainNow, hasPriority } from "./legality";
import { otherPlayer } from "./util";

function fail(state: GameState, message: string): ApplyActionResult {
  return { state, events: [], error: message };
}

export function applyAction(state: GameState, action: PlayerAction, pool: CardPool): ApplyActionResult {
  const error = validate(state, pool, action);
  if (error) return fail(state, error);

  const draft = structuredClone(state);
  const events: GameEvent[] = [];
  perform(draft, pool, events, action);
  return { state: draft, events };
}

// ---------------------------------------------------------------------------
// Validierung (liest NUR den Original-State, mutiert nichts)
// ---------------------------------------------------------------------------

function validate(state: GameState, pool: CardPool, action: PlayerAction): string | undefined {
  switch (action.kind) {
    case "passPriority": {
      if (!hasPriority(state, action.player)) return "Spieler hat gerade keine Priority.";
      return undefined;
    }
    case "castSpell": {
      const zone = findZone(state, action.cardInstanceId);
      if (!zone || zone.zone !== "hand" || zone.player !== action.player) {
        return "Karte ist nicht in der Hand dieses Spielers.";
      }
      const def = getDefinitionForInstance(pool, state, action.cardInstanceId);
      if (def.type === "terrain") return "Terrains werden über playTerrain gespielt, nicht castSpell.";
      if (!canCastNow(state, action.player, def)) return "Zauber ist jetzt nicht castbar (Timing/Priority).";
      const targetSpecs =
        def.type === "spell" ? def.targets : def.type === "enchantment" && def.enchantKind === "aura" ? [def.auraTarget!] : undefined;
      if (!areAllTargetsLegal(state, pool, targetSpecs, action.chosenTargets, action.player)) {
        return "Ziele sind nicht legal.";
      }
      if (def.cost.x && (action.chosenX === undefined || action.chosenX < 0)) {
        return "X-Kosten: chosenX fehlt oder ist negativ.";
      }
      const costDelta = computeSpellCostDelta(state, pool, action.player);
      if (!canPayCost(state.players[action.player].manaPool, def.cost, action.chosenX, costDelta)) {
        return "Nicht genug Mana im Pool.";
      }
      return undefined;
    }
    case "playTerrain": {
      const zone = findZone(state, action.cardInstanceId);
      if (!zone || zone.zone !== "hand" || zone.player !== action.player) {
        return "Karte ist nicht in der Hand dieses Spielers.";
      }
      const def = getDefinitionForInstance(pool, state, action.cardInstanceId);
      if (def.type !== "terrain") return "Karte ist kein Terrain.";
      if (!canPlayTerrainNow(state, action.player)) {
        return "Terrain jetzt nicht spielbar (Timing/Priority/Limit erreicht).";
      }
      return undefined;
    }
    case "activateAbility": {
      const card = state.cards[action.sourceInstanceId];
      if (!card || card.controller !== action.player || !card.permanentState) {
        return "Quelle ist kein Permanent dieses Spielers.";
      }
      const def = getDefinition(pool, card.definitionId);
      const abilities = "abilities" in def ? def.abilities ?? [] : [];
      const ability = abilities[action.abilityIndex];
      if (!ability || ability.kind !== "activated") return "Keine aktivierte Fähigkeit an diesem Index.";
      if (!canActivateAbilityNow(state, action.player, ability)) return "Fähigkeit jetzt nicht aktivierbar.";
      if (!areAllTargetsLegal(state, pool, ability.targets, action.chosenTargets, action.player)) {
        return "Ziele sind nicht legal.";
      }
      for (const cost of ability.additionalCosts ?? []) {
        if (cost.kind === "tap") {
          if (card.permanentState.tapped) return "Quelle ist bereits getappt.";
          if (card.permanentState.summoningSick && def.type === "unit") {
            // Swift-Check erfolgt hier bewusst nicht über computeEffectiveKeywords,
            // um einen Zyklus zu vermeiden; Fähigkeiten mit tap-Kosten UND swift
            // sind in v0.1 selten - TODO: bei Bedarf swift-Ausnahme ergänzen.
            return "Quelle hat Summoning Sickness (Tap-Kosten-Fähigkeit nicht nutzbar).";
          }
        } else if (cost.kind === "payLife") {
          if (state.players[action.player].life < cost.amount) return "Nicht genug Leben.";
        } else if (cost.kind === "discardCards") {
          if (state.players[action.player].hand.length < cost.count) return "Nicht genug Karten auf der Hand.";
        } else if (cost.kind === "removeCounters") {
          if ((card.permanentState.counters[cost.counterType] ?? 0) < cost.count) return "Nicht genug Marken.";
        }
      }
      if (!canPayCost(state.players[action.player].manaPool, ability.manaCost ?? {}, undefined)) {
        return "Nicht genug Mana im Pool.";
      }
      return undefined;
    }
    case "declareAttackers": {
      if (state.step !== "declareAttackers" || state.priorityPlayer !== undefined || state.pendingDecision !== undefined) {
        return "Gerade keine Declare-Attackers-Entscheidung fällig.";
      }
      if (action.player !== state.activePlayer) return "Nur der aktive Spieler deklariert Angreifer.";
      const seen = new Set<string>();
      for (const id of action.attackers) {
        if (seen.has(id)) return "Angreifer doppelt angegeben.";
        seen.add(id);
        if (!isLegalAttacker(state, pool, action.player, id)) return `Ungültiger Angreifer: ${id}`;
      }
      return undefined;
    }
    case "declareBlockers": {
      if (state.step !== "declareBlockers" || state.priorityPlayer !== undefined || state.pendingDecision !== undefined) {
        return "Gerade keine Declare-Blockers-Entscheidung fällig.";
      }
      const defender = otherPlayer(state, state.activePlayer);
      if (action.player !== defender) return "Nur der verteidigende Spieler deklariert Blocker.";
      const usedBlockers = new Set<string>();
      for (const b of action.blocks) {
        if (usedBlockers.has(b.blocker)) return "Blocker mehrfach zugeordnet.";
        usedBlockers.add(b.blocker);
        if (!isLegalBlock(state, pool, action.player, b.blocker, b.attacker)) {
          return `Ungültiger Block: ${b.blocker} -> ${b.attacker}`;
        }
      }
      // guardian-Blockpflicht (rules-engine.md 6, final v0.2): jede qualifizierende
      // guardian-Unit MUSS irgendeinem Angreifer als Blocker zugeordnet sein.
      const requiredGuardians = guardianUnitsRequiringBlock(state, pool, action.player);
      const blockerIds = new Set(action.blocks.map((b) => b.blocker));
      for (const guardianId of requiredGuardians) {
        if (!blockerIds.has(guardianId)) {
          return `guardian-Pflicht verletzt: Unit ${guardianId} muss einen Angreifer blocken.`;
        }
      }
      return undefined;
    }
    case "discardToHandSize": {
      if (state.step !== "cleanup" || state.priorityPlayer !== undefined || state.pendingDecision !== undefined) {
        return "Gerade kein Abwurf auf Handkartenlimit fällig.";
      }
      if (action.player !== state.activePlayer) return "Nur der aktive Spieler wirft im Cleanup ab.";
      const hand = state.players[action.player].hand;
      const required = Math.max(0, hand.length - 7);
      if (action.cardInstanceIds.length !== required) return `Es müssen genau ${required} Karten abgeworfen werden.`;
      const seen = new Set<string>();
      for (const id of action.cardInstanceIds) {
        if (seen.has(id)) return "Karte doppelt zum Abwerfen angegeben.";
        seen.add(id);
        if (!hand.includes(id)) return `Karte nicht in der Hand: ${id}`;
      }
      return undefined;
    }
    case "resolveDecision": {
      return validateResolveDecision(state, pool, action.player, action.choice);
    }
    case "concede": {
      return undefined;
    }
    default: {
      const _exhaustive: never = action;
      return `Unbekannte Aktion: ${JSON.stringify(_exhaustive)}`;
    }
  }
}

function validateResolveDecision(
  state: GameState,
  pool: CardPool,
  player: PlayerId,
  choice: DecisionChoice,
): string | undefined {
  const decision = state.pendingDecision;
  if (!decision) return "Keine Spielerentscheidung ausstehend.";
  if (decision.player !== player) return "Ein anderer Spieler ist zur Entscheidung aufgerufen.";
  if (decision.kind !== choice.kind) return "Die Antwort passt nicht zur ausstehenden Entscheidung.";

  switch (decision.kind) {
    case "chooseTriggerTargets": {
      if (choice.kind !== "chooseTriggerTargets") return "Falscher Antworttyp.";
      const def = getDefinitionForInstance(pool, state, decision.sourceInstanceId);
      const abilities = "abilities" in def ? def.abilities ?? [] : [];
      const ability = abilities[decision.abilityIndex];
      if (!ability || ability.kind !== "triggered") return "Ungültige Trigger-Referenz in der Entscheidung.";
      const specs = ability.targets ?? [];
      if (choice.chosenTargets.length !== specs.length) return "Falsche Anzahl gewählter Ziele.";
      if (!areAllTargetsLegal(state, pool, specs, choice.chosenTargets, decision.player)) {
        return "Gewählte Ziele sind nicht legal.";
      }
      return undefined;
    }
    case "orderBlockers": {
      if (choice.kind !== "orderBlockers") return "Falscher Antworttyp.";
      // rules-engine.md 9.9 Punkt 5: exakt die gelisteten Angreifer, je eine
      // Permutation exakt der gelisteten Blocker - sonst Ablehnung.
      const declared = decision.attackers;
      if (choice.orders.length !== declared.length) return "Falsche Anzahl geordneter Angreifer.";
      const declaredByAttacker = new Map(declared.map((d) => [d.attacker, d.blockers]));
      const seenAttackers = new Set<string>();
      for (const order of choice.orders) {
        if (seenAttackers.has(order.attacker)) return "Angreifer doppelt in der Reihenfolge angegeben.";
        seenAttackers.add(order.attacker);
        const expectedBlockers = declaredByAttacker.get(order.attacker);
        if (!expectedBlockers) return `Angreifer nicht Teil der Entscheidung: ${order.attacker}`;
        if (order.blockers.length !== expectedBlockers.length) {
          return `Falsche Anzahl Blocker für Angreifer ${order.attacker}.`;
        }
        const expected = new Set(expectedBlockers);
        const seenBlockers = new Set<string>();
        for (const blockerId of order.blockers) {
          if (seenBlockers.has(blockerId)) return "Blocker doppelt in der Reihenfolge angegeben.";
          seenBlockers.add(blockerId);
          if (!expected.has(blockerId)) return `Blocker nicht Teil des ursprünglichen Blocks: ${blockerId}`;
        }
      }
      return undefined;
    }
    default:
      // chooseManaColor/chooseDiscard/orderScry: v0.2 setzt diese PendingDecisions
      // noch nie (Auto-Defaults bleiben, siehe rules-engine.md 9.7) - dieser Zweig
      // ist aktuell unerreichbar, aber zukunftssicher statt eigenmächtig zu raten.
      return "Diese Art von Entscheidung wird von der Engine noch nicht unterstützt.";
  }
}

// ---------------------------------------------------------------------------
// Ausführung (auf dem Draft-State)
// ---------------------------------------------------------------------------

function perform(state: GameState, pool: CardPool, events: GameEvent[], action: PlayerAction): void {
  switch (action.kind) {
    case "passPriority": {
      state.consecutivePasses.push(action.player);
      const distinctPassers = new Set(state.consecutivePasses);
      const playerCount = Object.keys(state.players).length;
      if (distinctPassers.size >= playerCount) {
        handleBothPassed(state, pool, events);
      } else {
        // Einfaches Weiterreichen: SBA/Trigger-Check laut Regel 3.3 findet
        // trotzdem statt, OHNE die "beide gepasst"-Zählung zurückzusetzen
        // (siehe checkStateBeforePriority-Doku in turn.ts). `next` wird VOR
        // dem Check bestimmt, damit er bei einer PendingDecision-Pause als
        // resumePriorityTo gemerkt werden kann (rules-engine.md 9.7).
        const next = otherPlayer(state, action.player);
        const { gameEnded, decisionPending } = checkStateBeforePriority(state, pool, events);
        if (gameEnded) {
          state.priorityPlayer = undefined;
          state.resumePriorityTo = undefined;
          return;
        }
        if (decisionPending) {
          state.priorityPlayer = undefined;
          state.resumePriorityTo = next;
          return;
        }
        state.priorityPlayer = next;
        state.resumePriorityTo = undefined;
        events.push({ kind: "priorityGained", player: next });
      }
      return;
    }
    case "castSpell": {
      const def = getDefinitionForInstance(pool, state, action.cardInstanceId);
      if (def.type === "terrain") return; // durch validate() bereits ausgeschlossen
      const costDelta = computeSpellCostDelta(state, pool, action.player);
      payCost(state.players[action.player].manaPool, def.cost, action.chosenX, costDelta);
      pushSpellToStack(state, events, action.cardInstanceId, action.player, action.chosenTargets, action.chosenX);
      const effectiveSpeed = def.type === "spell" ? def.speed : undefined;
      fireSpellCastTriggers(state, pool, action.player, effectiveSpeed);
      openPriorityWindow(state, pool, events, action.player);
      return;
    }
    case "playTerrain": {
      const def = getDefinitionForInstance(pool, state, action.cardInstanceId);
      state.players[action.player].terrainsPlayedThisTurn += 1;
      moveCard(state, events, action.cardInstanceId, action.player, "battlefield");
      const ps = state.cards[action.cardInstanceId]!.permanentState!;
      ps.summoningSick = false;
      if (def.type === "terrain" && def.entersTapped) {
        ps.tapped = true;
        events.push({ kind: "permanentTapped", instanceId: action.cardInstanceId });
      }
      fireEnterBattlefieldTriggers(state, pool, action.cardInstanceId);
      openPriorityWindow(state, pool, events, action.player);
      return;
    }
    case "activateAbility": {
      const card = state.cards[action.sourceInstanceId]!;
      const def = getDefinition(pool, card.definitionId);
      const abilities = "abilities" in def ? def.abilities ?? [] : [];
      const ability = abilities[action.abilityIndex];
      if (!ability || ability.kind !== "activated") return;

      for (const cost of ability.additionalCosts ?? []) {
        if (cost.kind === "tap") {
          card.permanentState!.tapped = true;
          events.push({ kind: "permanentTapped", instanceId: action.sourceInstanceId });
        } else if (cost.kind === "sacrificeSelf") {
          leaveBattlefield(state, pool, events, action.sourceInstanceId, "graveyard");
        } else if (cost.kind === "payLife") {
          state.players[action.player].life -= cost.amount;
          events.push({
            kind: "lifeChanged",
            player: action.player,
            delta: -cost.amount,
            newTotal: state.players[action.player].life,
          });
        } else if (cost.kind === "discardCards") {
          // TODO: keine Spielerwahl vorgesehen -> wirft die obersten Handkarten (v0.1-Vereinfachung).
          const hand = state.players[action.player].hand;
          for (let i = 0; i < cost.count && hand.length > 0; i++) {
            moveCard(state, events, hand[0]!, action.player, "graveyard");
          }
        } else if (cost.kind === "removeCounters") {
          const ps = card.permanentState!;
          const current = ps.counters[cost.counterType] ?? 0;
          ps.counters[cost.counterType] = Math.max(0, current - cost.count);
          events.push({ kind: "countersChanged", instanceId: action.sourceInstanceId, counterType: cost.counterType, delta: -cost.count });
        }
      }
      payCost(state.players[action.player].manaPool, ability.manaCost ?? {}, undefined);

      if (ability.isManaAbility) {
        // Mana-Fähigkeiten gehen NICHT über den Stack (rules-engine.md 4) - sofortige Resolution.
        executeEffects(state, pool, events, ability.effects, {
          controller: action.player,
          chosenTargets: action.chosenTargets,
          self: action.sourceInstanceId,
        });
      } else {
        pushActivatedAbilityToStack(state, events, action.sourceInstanceId, action.abilityIndex, action.player, action.chosenTargets);
      }
      openPriorityWindow(state, pool, events, action.player);
      return;
    }
    case "declareAttackers": {
      declareAttackers(state, pool, events, action.player, action.attackers);
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "declareBlockers": {
      declareBlockers(state, pool, events, action.blocks);
      // v0.2.3 (rules-engine.md 6d(1), Revision von 9.8): Hat mindestens ein
      // Angreifer >= 2 Blocker, entscheidet der ANGREIFER die Reihenfolge,
      // bevor das Priority-Fenster des Steps öffnet. Liegt außerhalb einer
      // Priority-Vergabe -> resumePriorityTo bleibt unangetastet (9.7).
      const orderDecision = buildOrderBlockersDecision(state, state.activePlayer);
      if (orderDecision) {
        state.pendingDecision = orderDecision;
        state.priorityPlayer = undefined;
        events.push({ kind: "decisionRequired", player: orderDecision.player, decisionKind: "orderBlockers" });
        return;
      }
      openPriorityWindow(state, pool, events, state.activePlayer);
      return;
    }
    case "discardToHandSize": {
      for (const id of action.cardInstanceIds) {
        moveCard(state, events, id, action.player, "graveyard");
      }
      finishCleanup(state, pool, events);
      return;
    }
    case "resolveDecision": {
      const decision = state.pendingDecision;
      if (!decision) return; // durch validate() bereits ausgeschlossen
      if (decision.kind === "chooseTriggerTargets" && action.choice.kind === "chooseTriggerTargets") {
        pushResolvedTriggerToStack(
          state,
          events,
          {
            sourceInstanceId: decision.sourceInstanceId,
            abilityIndex: decision.abilityIndex,
            controller: decision.player,
            eventSubject: decision.eventSubject,
          },
          action.choice.chosenTargets,
        );
        events.push({ kind: "decisionResolved", player: decision.player, decisionKind: "chooseTriggerTargets" });
        state.pendingDecision = undefined;
        // Weitere wartende Trigger könnten noch eine Entscheidung brauchen (erneute
        // Pause, resumePriorityTo bleibt dabei stehen) oder es kann Priority an
        // resumePriorityTo vergeben werden (rules-engine.md 9.7, letzter Absatz).
        resumePriorityAfterDecision(state, pool, events);
        return;
      }
      if (decision.kind === "orderBlockers" && action.choice.kind === "orderBlockers") {
        applyOrderBlockers(state, action.choice.orders);
        events.push({ kind: "decisionResolved", player: decision.player, decisionKind: "orderBlockers" });
        state.pendingDecision = undefined;
        // v0.2.3 (rules-engine.md 6d(1)/9.7): Decision lag AUSSERHALB einer
        // Priority-Vergabe (resumePriorityTo wurde nicht gesetzt) - nach der
        // Auflösung läuft der Ablauf normal weiter, als hätte es die Pause
        // nicht gegeben: das reguläre Priority-Fenster des Declare-Blockers-
        // Steps öffnet jetzt für den aktiven Spieler.
        openPriorityWindow(state, pool, events, state.activePlayer);
        return;
      }
      state.pendingDecision = undefined;
      return;
    }
    case "concede": {
      state.players[action.player].hasLost = true;
      events.push({ kind: "playerLost", player: action.player, reason: "concede" });
      state.consecutivePasses = [];
      runStateBasedActionsLoop(state, pool, events);
      if (state.winner !== undefined) {
        state.priorityPlayer = undefined;
      }
      return;
    }
    default:
      return;
  }
}
