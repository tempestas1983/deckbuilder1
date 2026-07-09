/**
 * Kampf (rules-engine.md Abschnitt 6). v0.2-Umfang: Angreifer/Blocker
 * deklarieren, gleichzeitiger Kampfschaden, airborne/reach-Evasion,
 * lifelink, `guardian`-Blockpflicht (final spezifiziert, siehe
 * `guardianUnitsRequiringBlock` unten). NICHT umgesetzt:
 * - Mehrfachangriffe auf verschiedene Ziele (v0.1: Angriffsziel ist immer der
 *   gegnerische Spieler).
 */

import type { CardPool, GameEvent, GameState, InstanceId, PlayerId } from "../model";
import { getDefinitionForInstance } from "./card-defs";
import { computeEffectiveKeywords, computeEffectiveStats } from "./stats";
import { fireSelfCombatTrigger } from "./triggers";
import { otherPlayer } from "./util";

export function currentAttackers(state: GameState, player: PlayerId): InstanceId[] {
  return state.players[player].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );
}

export function isLegalAttacker(state: GameState, pool: CardPool, player: PlayerId, instanceId: InstanceId): boolean {
  const card = state.cards[instanceId];
  if (!card || card.controller !== player || !card.permanentState) return false;
  const def = getDefinitionForInstance(pool, state, instanceId);
  if (def.type !== "unit") return false;
  if (card.permanentState.tapped) return false;
  if (card.permanentState.summoningSick) {
    const keywords = computeEffectiveKeywords(state, pool, instanceId);
    if (!keywords.has("swift")) return false;
  }
  return true;
}

export function declareAttackers(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  player: PlayerId,
  attackers: InstanceId[],
): void {
  for (const instanceId of attackers) {
    const ps = state.cards[instanceId]!.permanentState!;
    ps.combat = { role: "attacker" };
    const keywords = computeEffectiveKeywords(state, pool, instanceId);
    if (!keywords.has("vigilant")) {
      ps.tapped = true;
      events.push({ kind: "permanentTapped", instanceId });
    }
  }
  events.push({ kind: "attackersDeclared", attackers });
  for (const instanceId of attackers) {
    fireSelfCombatTrigger(state, pool, instanceId, "onAttackDeclared");
  }
}

export function isLegalBlock(
  state: GameState,
  pool: CardPool,
  defender: PlayerId,
  blocker: InstanceId,
  attacker: InstanceId,
): boolean {
  const blockerCard = state.cards[blocker];
  if (!blockerCard || blockerCard.controller !== defender || !blockerCard.permanentState) return false;
  if (blockerCard.permanentState.tapped) return false;
  if (blockerCard.permanentState.combat?.role === "blocker") return false; // schon zugeordnet
  const attackerCard = state.cards[attacker];
  if (!attackerCard?.permanentState || attackerCard.permanentState.combat?.role !== "attacker") return false;

  const attackerKeywords = computeEffectiveKeywords(state, pool, attacker);
  if (attackerKeywords.has("airborne")) {
    const blockerKeywords = computeEffectiveKeywords(state, pool, blocker);
    if (!blockerKeywords.has("airborne") && !blockerKeywords.has("reach")) return false;
  }
  return true;
}

/**
 * `guardian`-Blockpflicht (rules-engine.md Abschnitt 6, final v0.2):
 * Jede ungetappte guardian-Unit des VERTEIDIGERS muss einem Angreifer als
 * Blocker zugeordnet werden, sofern für sie mindestens ein legaler Block
 * existiert (Evasion beachten). Snapshot bei Deklaration: nur der Zustand
 * JETZT (Zeitpunkt des Aufrufs, i.d.R. bei Validierung der declareBlockers-
 * Aktion) zählt - vorher getappt = keine Pflicht, späteres Tappen entfernt
 * einen bereits deklarierten Block nicht (das betrifft diese Funktion nicht
 * mehr, da sie nur zum Deklarationszeitpunkt aufgerufen wird). Gibt die
 * InstanceIds aller Units zurück, die als Blocker auftauchen MÜSSEN
 * (irgendeinem legalen Angreifer zugeordnet - der Verteidiger wählt frei,
 * welchem).
 */
export function guardianUnitsRequiringBlock(state: GameState, pool: CardPool, defender: PlayerId): InstanceId[] {
  const attacker = otherPlayer(state, defender);
  const attackers = currentAttackers(state, attacker);
  const required: InstanceId[] = [];
  for (const instanceId of state.players[defender].battlefield) {
    const card = state.cards[instanceId];
    if (!card?.permanentState || card.permanentState.tapped) continue;
    const def = getDefinitionForInstance(pool, state, instanceId);
    if (def.type !== "unit") continue;
    if (!computeEffectiveKeywords(state, pool, instanceId).has("guardian")) continue;
    const hasLegalBlock = attackers.some((a) => isLegalBlock(state, pool, defender, instanceId, a));
    if (hasLegalBlock) required.push(instanceId);
  }
  return required;
}

export function declareBlockers(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  blocks: Array<{ blocker: InstanceId; attacker: InstanceId }>,
): void {
  for (const { blocker, attacker } of blocks) {
    const blockerPs = state.cards[blocker]!.permanentState!;
    blockerPs.combat = { role: "blocker", blocking: attacker };
    const attackerPs = state.cards[attacker]!.permanentState!;
    if (!attackerPs.combat) attackerPs.combat = { role: "attacker" };
    attackerPs.combat.blockedBy = [...(attackerPs.combat.blockedBy ?? []), blocker];
  }
  events.push({ kind: "blockersDeclared", blocks });
  for (const { blocker } of blocks) {
    fireSelfCombatTrigger(state, pool, blocker, "onBlockDeclared");
  }
}

/**
 * Kampfschaden (Turn-Based Action des Combat-Damage-Steps, kein Stack-
 * Objekt). Alle Schäden gleichzeitig, kein First-Strike-Analog (rules-
 * engine.md 6).
 */
export function dealCombatDamage(state: GameState, pool: CardPool, events: GameEvent[], activePlayer: PlayerId): void {
  const defender = otherPlayer(state, activePlayer);
  const attackers = currentAttackers(state, activePlayer);

  // Schaden wird erst am Ende aller Berechnungen angewendet, damit "gleichzeitig" stimmt.
  // Einzeleinträge (statt nur aggregierter Summen) behalten die Quelle für Events/Lifelink.
  const permanentDamageInstances: Array<{ id: InstanceId; amount: number; sourceId: InstanceId }> = [];
  const playerDamageInstances: Array<{ id: PlayerId; amount: number; sourceId: InstanceId }> = [];
  const permanentDamageSoFar = new Map<InstanceId, number>();
  const lifelinkGains = new Map<PlayerId, number>();

  const addPermanentDamage = (id: InstanceId, amount: number, sourceController: PlayerId, sourceId: InstanceId) => {
    permanentDamageInstances.push({ id, amount, sourceId });
    permanentDamageSoFar.set(id, (permanentDamageSoFar.get(id) ?? 0) + amount);
    if (computeEffectiveKeywords(state, pool, sourceId).has("lifelink")) {
      lifelinkGains.set(sourceController, (lifelinkGains.get(sourceController) ?? 0) + amount);
    }
  };
  const addPlayerDamage = (id: PlayerId, amount: number, sourceController: PlayerId, sourceId: InstanceId) => {
    playerDamageInstances.push({ id, amount, sourceId });
    if (computeEffectiveKeywords(state, pool, sourceId).has("lifelink")) {
      lifelinkGains.set(sourceController, (lifelinkGains.get(sourceController) ?? 0) + amount);
    }
  };

  for (const attackerId of attackers) {
    const attackerCard = state.cards[attackerId]!;
    const ps = attackerCard.permanentState!;
    const { power } = computeEffectiveStats(state, pool, attackerId);
    const blockedBy = ps.combat?.blockedBy ?? [];

    if (blockedBy.length === 0) {
      addPlayerDamage(defender, power, attackerCard.controller, attackerId);
      fireSelfCombatTrigger(state, pool, attackerId, "onDealtCombatDamageToPlayer");
    } else {
      let remaining = power;
      blockedBy.forEach((blockerId, index) => {
        const isLast = index === blockedBy.length - 1;
        const blockerPs = state.cards[blockerId]?.permanentState;
        if (!blockerPs) return;
        const { toughness: blockerToughness } = computeEffectiveStats(state, pool, blockerId);
        const lethalNeeded = Math.max(0, blockerToughness - blockerPs.damageMarked - (permanentDamageSoFar.get(blockerId) ?? 0));
        const assign = isLast ? remaining : Math.min(remaining, lethalNeeded);
        remaining -= assign;
        if (assign > 0) addPermanentDamage(blockerId, assign, attackerCard.controller, attackerId);
      });
      // Jeder Blocker schlägt mit voller Power gleichzeitig zurück.
      for (const blockerId of blockedBy) {
        const blockerCard = state.cards[blockerId];
        if (!blockerCard?.permanentState) continue;
        const { power: blockerPower } = computeEffectiveStats(state, pool, blockerId);
        addPermanentDamage(attackerId, blockerPower, blockerCard.controller, blockerId);
      }
    }
  }

  for (const { id, amount, sourceId } of permanentDamageInstances) {
    const ps = state.cards[id]?.permanentState;
    if (!ps || amount <= 0) continue;
    ps.damageMarked += amount;
    events.push({ kind: "damageDealt", to: id, amount, source: sourceId });
  }
  for (const { id, amount, sourceId } of playerDamageInstances) {
    if (amount <= 0) continue;
    state.players[id].life -= amount;
    events.push({ kind: "damageDealt", to: id, amount, source: sourceId });
    events.push({ kind: "lifeChanged", player: id, delta: -amount, newTotal: state.players[id].life });
  }
  for (const [playerId, amount] of lifelinkGains) {
    state.players[playerId].life += amount;
    events.push({ kind: "lifeChanged", player: playerId, delta: amount, newTotal: state.players[playerId].life });
  }
}

/** Setzt Kampf-Zuordnungen zurück (Ende der Combat Phase). Tapped-Status bleibt erhalten. */
export function clearCombatState(state: GameState): void {
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    for (const instanceId of state.players[playerId].battlefield) {
      const ps = state.cards[instanceId]?.permanentState;
      if (ps) ps.combat = undefined;
    }
  }
}
