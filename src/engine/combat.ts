/**
 * Kampf (rules-engine.md Abschnitt 6). Angreifer/Blocker deklarieren,
 * airborne/reach-Evasion, lifelink, `guardian`-Blockpflicht (final
 * spezifiziert, siehe `guardianUnitsRequiringBlock` unten). v0.2.3
 * (Kampf-Keyword-Paket, rules-engine.md 6d/9.9): `trample`, `firstStrike`,
 * `deathtouch` + angreifer-gewählte Mehrfachblock-Reihenfolge
 * (`PendingDecision "orderBlockers"`, Revision von 9.8). NICHT umgesetzt:
 * - Mehrfachangriffe auf verschiedene Ziele (v0.1: Angriffsziel ist immer der
 *   gegnerische Spieler).
 * - Double Strike (bewusst vertagt, rules-engine.md 9.9/10).
 */

import type { CardPool, GameEvent, GameState, InstanceId, PendingDecision, PlayerId } from "../model";
import { getDefinitionForInstance } from "./card-defs";
import { runStateBasedActionsLoop } from "./sba";
import { computeEffectiveKeywords, computeEffectiveStats } from "./stats";
import { fireSelfCombatTrigger } from "./triggers";
import { applyDamageToPermanent } from "./damage";
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
 * v0.2.3 (rules-engine.md 6d(1), Revision von 9.8): Baut die
 * `orderBlockers`-PendingDecision, falls mindestens ein Angreifer >= 2
 * Blocker hat - sonst `undefined` (kein zusätzlicher Interaktionsschritt bei
 * Einfachblocks). Wird unmittelbar nach `declareBlockers`, VOR dem
 * Priority-Fenster des Steps, aufgerufen (siehe actions.ts).
 */
export function buildOrderBlockersDecision(state: GameState, activePlayer: PlayerId): PendingDecision | undefined {
  const attackers = currentAttackers(state, activePlayer);
  const multiBlocked: Array<{ attacker: InstanceId; blockers: InstanceId[] }> = [];
  for (const attackerId of attackers) {
    const blockedBy = state.cards[attackerId]?.permanentState?.combat?.blockedBy ?? [];
    if (blockedBy.length >= 2) {
      multiBlocked.push({ attacker: attackerId, blockers: [...blockedBy] });
    }
  }
  if (multiBlocked.length === 0) return undefined;
  return { kind: "orderBlockers", player: activePlayer, attackers: multiBlocked };
}

/**
 * Wendet die vom Angreifer via `orderBlockers`-Decision gewählte Reihenfolge
 * an (überschreibt `CombatAssignment.blockedBy` je Angreifer). Validierung
 * der Antwort ist bereits in actions.ts#validateResolveDecision erfolgt.
 */
export function applyOrderBlockers(
  state: GameState,
  orders: Array<{ attacker: InstanceId; blockers: InstanceId[] }>,
): void {
  for (const order of orders) {
    const ps = state.cards[order.attacker]?.permanentState;
    if (ps?.combat) ps.combat.blockedBy = [...order.blockers];
  }
}

function hasKeyword(state: GameState, pool: CardPool, instanceId: InstanceId, keyword: "firstStrike" | "trample" | "deathtouch"): boolean {
  return computeEffectiveKeywords(state, pool, instanceId).has(keyword);
}

/**
 * Eine Schadensrunde (rules-engine.md 6d(2)/(3)): Alle Teilnehmer, für die
 * `participates` true liefert, teilen ihren Kampfschaden gleichzeitig aus.
 * Angreifer- und Blocker-Richtung sind unabhängig (ein Angreifer ohne
 * firstStrike kann in Runde 1 trotzdem Schaden von einem firstStrike-Blocker
 * erhalten, teilt selbst aber erst in Runde 2 aus). Innerhalb einer Runde
 * wird erst vollständig berechnet, dann angewendet ("gleichzeitig" - ein in
 * dieser Runde sterbender Blocker beeinflusst nicht die Berechnung für
 * andere Teilnehmer derselben Runde).
 */
function dealCombatDamageRound(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  defender: PlayerId,
  attackers: InstanceId[],
  participates: (id: InstanceId) => boolean,
): void {
  const permanentDamageInstances: Array<{ id: InstanceId; amount: number; sourceId: InstanceId }> = [];
  const playerDamageInstances: Array<{ id: PlayerId; amount: number; sourceId: InstanceId }> = [];
  const permanentDamageSoFar = new Map<InstanceId, number>();
  const lifelinkGains = new Map<PlayerId, number>();

  // §6c: Schaden <= 0 ist kein Schaden - insbesondere kein lifelink-Gewinn.
  // Der lifelink-Zähler wird deshalb nur für amount > 0 akkumuliert, auch
  // wenn die Roh-Beträge (u.a. für die spätere amount<=0-Filterung beim
  // Anwenden) weiterhin unverändert in den *Instances-Arrays landen.
  const addPermanentDamage = (id: InstanceId, amount: number, sourceController: PlayerId, sourceId: InstanceId) => {
    permanentDamageInstances.push({ id, amount, sourceId });
    permanentDamageSoFar.set(id, (permanentDamageSoFar.get(id) ?? 0) + amount);
    if (amount > 0 && computeEffectiveKeywords(state, pool, sourceId).has("lifelink")) {
      lifelinkGains.set(sourceController, (lifelinkGains.get(sourceController) ?? 0) + amount);
    }
  };
  const addPlayerDamage = (id: PlayerId, amount: number, sourceController: PlayerId, sourceId: InstanceId) => {
    playerDamageInstances.push({ id, amount, sourceId });
    if (amount > 0 && computeEffectiveKeywords(state, pool, sourceId).has("lifelink")) {
      lifelinkGains.set(sourceController, (lifelinkGains.get(sourceController) ?? 0) + amount);
    }
  };

  for (const attackerId of attackers) {
    const attackerCard = state.cards[attackerId];
    // §6b(3): Der Angreifer selbst hat das Battlefield verlassen -> weder er
    // noch seine (ehemaligen) Blocker verrechnen in dieser Runde irgendetwas.
    if (!attackerCard?.permanentState) continue;
    const ps = attackerCard.permanentState;
    const blockedBy = ps.combat?.blockedBy ?? [];

    // --- Angreifer teilt aus (nur falls er in dieser Runde an der Reihe ist) ---
    if (participates(attackerId)) {
      const { power } = computeEffectiveStats(state, pool, attackerId);
      const hasTrample = hasKeyword(state, pool, attackerId, "trample");
      const hasDeathtouch = hasKeyword(state, pool, attackerId, "deathtouch");

      if (blockedBy.length === 0) {
        addPlayerDamage(defender, power, attackerCard.controller, attackerId);
        // §6c: Schaden <= 0 ist kein Schadensereignis - kein Trigger.
        if (power > 0) fireSelfCombatTrigger(state, pool, attackerId, "onDealtCombatDamageToPlayer");
      } else {
        // §9.8/§6b: "isLast" muss den tatsächlich LETZTEN NOCH LEBENDEN
        // Blocker meinen, nicht den nominal letzten Array-Eintrag - stirbt der
        // (array-)letzte Blocker vor dieser Runde, muss der Restschaden beim
        // tatsächlich letzten überlebenden Blocker landen (ohne trample).
        const aliveBlockerIds = blockedBy.filter((id) => state.cards[id]?.permanentState !== undefined);

        if (aliveBlockerIds.length === 0) {
          // §6b(2), v0.2.3 revidiert: "geblockt bleibt geblockt" - ohne
          // trample verpufft der Schaden weiterhin komplett; MIT trample
          // schlägt die GESAMTE Power beim Verteidiger durch.
          if (hasTrample && power > 0) {
            addPlayerDamage(defender, power, attackerCard.controller, attackerId);
            fireSelfCombatTrigger(state, pool, attackerId, "onDealtCombatDamageToPlayer");
          }
        } else {
          let remaining = power;
          const lastAliveBlockerId = aliveBlockerIds[aliveBlockerIds.length - 1];
          blockedBy.forEach((blockerId) => {
            const blockerPs = state.cards[blockerId]?.permanentState;
            if (!blockerPs) return; // toter/entfernter Blocker: 0 zugewiesen, übersprungen (§6b)
            const { toughness: blockerToughness } = computeEffectiveStats(state, pool, blockerId);
            // §6d(3): letale Menge = 1 bei deathtouch, sonst Toughness minus
            // bereits vorhandenem/zugewiesenem Schaden.
            const lethalNeeded = hasDeathtouch
              ? 1
              : Math.max(0, blockerToughness - blockerPs.damageMarked - (permanentDamageSoFar.get(blockerId) ?? 0));
            let assign: number;
            if (hasTrample) {
              // §6d(3) mit trample: deterministisch exakt letale Menge, kein
              // freiwilliges Überzuteilen (9.9 Punkt 3).
              assign = Math.min(remaining, lethalNeeded);
            } else {
              const isLast = blockerId === lastAliveBlockerId;
              assign = isLast ? remaining : Math.min(remaining, lethalNeeded);
            }
            remaining -= assign;
            if (assign > 0) addPermanentDamage(blockerId, assign, attackerCard.controller, attackerId);
          });
          if (hasTrample && remaining > 0) {
            addPlayerDamage(defender, remaining, attackerCard.controller, attackerId);
            fireSelfCombatTrigger(state, pool, attackerId, "onDealtCombatDamageToPlayer");
          }
        }
      }
    }

    // --- Blocker schlagen zurück (nur die, die in dieser Runde an der Reihe sind) ---
    for (const blockerId of blockedBy) {
      if (!participates(blockerId)) continue;
      const blockerCard = state.cards[blockerId];
      if (!blockerCard?.permanentState) continue;
      const { power: blockerPower } = computeEffectiveStats(state, pool, blockerId);
      addPermanentDamage(attackerId, blockerPower, blockerCard.controller, blockerId);
    }
  }

  for (const { id, amount, sourceId } of permanentDamageInstances) {
    // v0.3 (rules-engine.md 5 + 9.10): zentraler Helfer statt Inline-Logik -
    // markiert Schaden, setzt ggf. deathtouchDamage (§6d/§7 SBA 4), emittiert
    // damageDealt und feuert onDamageReceived (amount <= 0 -> No-Op, §6c).
    applyDamageToPermanent(state, pool, events, id, amount, sourceId);
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

/**
 * Kampfschaden (Turn-Based Action des Combat-Damage-Steps, kein Stack-
 * Objekt). rules-engine.md 6d(2): Bis zu ZWEI interne Schadensrunden -
 * bleibt EINE Turn-Based Action, kein neuer Step, kein zusätzliches
 * Priority-Fenster. Gibt es keinen firstStrike-Teilnehmer, entfällt die
 * frühe Runde ersatzlos (Verhalten bleibt wie vor v0.2.3).
 */
export function dealCombatDamage(state: GameState, pool: CardPool, events: GameEvent[], activePlayer: PlayerId): void {
  const defender = otherPlayer(state, activePlayer);
  const attackers = currentAttackers(state, activePlayer);

  const allParticipantIds: InstanceId[] = [];
  for (const attackerId of attackers) {
    allParticipantIds.push(attackerId);
    const blockedBy = state.cards[attackerId]?.permanentState?.combat?.blockedBy ?? [];
    allParticipantIds.push(...blockedBy);
  }
  const anyFirstStrike = allParticipantIds.some((id) => hasKeyword(state, pool, id, "firstStrike"));

  if (anyFirstStrike) {
    dealCombatDamageRound(state, pool, events, defender, attackers, (id) => hasKeyword(state, pool, id, "firstStrike"));
    // §6d(2) Zwischen-SBA-Durchlauf: OHNE Priority zu vergeben, Trigger
    // bleiben in der Pending-Queue (werden erst im Priority-Fenster des
    // Steps gestackt) - runStateBasedActionsLoop stackt selbst nie Trigger.
    runStateBasedActionsLoop(state, pool, events);
    dealCombatDamageRound(state, pool, events, defender, attackers, (id) => !hasKeyword(state, pool, id, "firstStrike"));
  } else {
    dealCombatDamageRound(state, pool, events, defender, attackers, () => true);
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
