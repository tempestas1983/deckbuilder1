/**
 * State-Based Actions (rules-engine.md Abschnitt 7). Wird in einer Schleife
 * ausgeführt, bis kein Durchlauf mehr etwas ändert - erst danach werden
 * Pending-Trigger auf den Stack gelegt (siehe turn.ts: openPriorityWindow).
 *
 * v0.1-Abdeckung: alle 7 SBAs aus dem Regelwerk. Bewusst NICHT abgedeckt:
 * komplexere Legalitätsprüfungen für Auren (nur "Ziel existiert noch auf dem
 * Battlefield", kein Recheck von TargetSpec-Filtern wie Controller/Cardtype -
 * TODO, an game-architect: reicht das für v0.1 oder soll Aura-Legalität
 * denselben Filter wie beim Anlegen erneut prüfen?).
 */

import type { CardPool, GameEvent, GameState, InstanceId, PlayerId } from "../model";
import { getDefinition } from "./card-defs";
import { leaveBattlefield } from "./zones";
import { computeEffectiveStats } from "./stats";
import { fireDeathTriggers } from "./triggers";

function allBattlefieldInstances(state: GameState): Array<{ instanceId: InstanceId; playerId: PlayerId }> {
  const result: Array<{ instanceId: InstanceId; playerId: PlayerId }> = [];
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    for (const instanceId of state.players[playerId].battlefield) {
      result.push({ instanceId, playerId });
    }
  }
  return result;
}

/** Ein Durchlauf aller SBAs. Rückgabe: wurde etwas verändert? */
function runOnce(state: GameState, pool: CardPool, events: GameEvent[]): boolean {
  let changed = false;

  // SBA 6: +1/+1 und -1/-1 Marken annihilieren sich paarweise.
  for (const { instanceId } of allBattlefieldInstances(state)) {
    const ps = state.cards[instanceId]?.permanentState;
    if (!ps) continue;
    const plus = ps.counters.plus1plus1 ?? 0;
    const minus = ps.counters.minus1minus1 ?? 0;
    if (plus > 0 && minus > 0) {
      const cancel = Math.min(plus, minus);
      ps.counters.plus1plus1 = plus - cancel;
      ps.counters.minus1minus1 = minus - cancel;
      events.push({ kind: "countersChanged", instanceId, counterType: "plus1plus1", delta: -cancel });
      events.push({ kind: "countersChanged", instanceId, counterType: "minus1minus1", delta: -cancel });
      changed = true;
    }
  }

  // SBA 3+4: Units mit Toughness <= 0 oder letalem Schaden sterben.
  const dying: Array<{ instanceId: InstanceId; controller: PlayerId; definitionId: string }> = [];
  for (const { instanceId, playerId } of allBattlefieldInstances(state)) {
    const card = state.cards[instanceId];
    if (!card?.permanentState) continue;
    const def = getDefinition(pool, card.definitionId);
    if (def.type !== "unit") continue;
    const stats = computeEffectiveStats(state, pool, instanceId);
    // v0.2.3 (deathtouch, rules-engine.md 6d/7): Schaden > 0 von einer
    // deathtouch-Quelle gilt unabhängig von der Toughness als letal.
    if (
      stats.toughness <= 0 ||
      card.permanentState.damageMarked >= stats.toughness ||
      card.permanentState.deathtouchDamage
    ) {
      dying.push({ instanceId, controller: playerId, definitionId: card.definitionId });
    }
  }
  for (const d of dying) {
    // Erneut prüfen: könnte durch vorherige Iteration dieser Schleife bereits entfernt worden sein
    // (z.B. durch eine Aura, die mit ihr verschwand - in v0.1 nicht möglich, defensiv trotzdem).
    if (!state.cards[d.instanceId]?.permanentState) continue;
    leaveBattlefield(state, pool, events, d.instanceId, "graveyard");
    events.push({ kind: "unitDied", instanceId: d.instanceId });
    fireDeathTriggers(state, pool, d.instanceId, d.definitionId, d.controller);
    changed = true;
  }

  // SBA 5: Auren ohne (mehr) legales Ziel gehen in den Graveyard.
  const illegalAuras: InstanceId[] = [];
  for (const { instanceId } of allBattlefieldInstances(state)) {
    const card = state.cards[instanceId];
    if (!card?.permanentState?.attachedTo) continue;
    const def = getDefinition(pool, card.definitionId);
    if (def.type !== "enchantment" || def.enchantKind !== "aura") continue;
    const target = state.cards[card.permanentState.attachedTo];
    if (!target || !target.permanentState) {
      illegalAuras.push(instanceId);
    }
  }
  for (const id of illegalAuras) {
    leaveBattlefield(state, pool, events, id, "graveyard");
    changed = true;
  }

  // SBA 1+2: Lebenspunkte <= 0 bzw. Ziehversuch aus leerer Library.
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    const p = state.players[playerId];
    if (p.hasLost) continue;
    if (p.life <= 0) {
      p.hasLost = true;
      events.push({ kind: "playerLost", player: playerId, reason: "life" });
      changed = true;
    } else if (p.attemptedDrawFromEmptyLibrary) {
      p.hasLost = true;
      events.push({ kind: "playerLost", player: playerId, reason: "deck" });
      changed = true;
    }
  }

  return changed;
}

/** Führt SBAs wiederholt aus, bis ein Durchlauf nichts mehr ändert. */
export function runStateBasedActionsLoop(state: GameState, pool: CardPool, events: GameEvent[]): void {
  let guard = 0;
  while (runOnce(state, pool, events)) {
    guard += 1;
    if (guard > 1000) {
      throw new Error("runStateBasedActionsLoop: keine Konvergenz nach 1000 Durchläufen (Endlosschleife?)");
    }
  }
  checkGameEnd(state, events);
}

function checkGameEnd(state: GameState, events: GameEvent[]): void {
  if (state.winner !== undefined) return;
  const playerIds = Object.keys(state.players) as PlayerId[];
  const losers = playerIds.filter((p) => state.players[p].hasLost);
  if (losers.length === 0) return;
  if (losers.length === playerIds.length) {
    state.winner = "draw";
  } else {
    state.winner = playerIds.find((p) => !losers.includes(p));
  }
  events.push({ kind: "gameEnded", winner: state.winner! });
}
