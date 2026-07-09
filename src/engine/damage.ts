/**
 * Zentraler "Schaden an Permanent anwenden"-Helfer (rules-engine.md 5 +
 * Entscheidung 9.10, v0.3): markiert Schaden, setzt ggf. das deathtouch-Flag,
 * emittiert `damageDealt` und feuert `onDamageReceived` - genutzt sowohl vom
 * Kampfschaden (`combat.ts#dealCombatDamageRound`) als auch von
 * `effects.ts#dealDamage`, um die deathtouch-/Trigger-Logik nicht doppelt zu
 * pflegen (Empfehlung 9.10 Punkt 1: EIN zentraler Helfer statt zwei
 * Feuerstellen).
 *
 * §6c gilt einheitlich für beide Pfade: Schaden <= 0 ist kein Schaden -
 * markiert nichts, setzt kein deathtouch-Flag, emittiert kein Event und
 * feuert keinen Trigger. Das ist eine kleine Verhaltensangleichung ggü. dem
 * bisherigen `effects.ts#dealDamageToPermanent` (das amount<=0 bisher NICHT
 * herausfilterte) - konsistent mit combat.ts und mit der v0.3-Doku
 * ("Schaden <= 0 feuert nicht, konsistent mit 6c"), siehe docs/engine-status.md.
 */

import type { CardPool, GameEvent, GameState, InstanceId } from "../model";
import { computeEffectiveKeywords } from "./stats";
import { fireOnDamageReceivedTrigger } from "./triggers";

export function applyDamageToPermanent(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  targetInstanceId: InstanceId,
  amount: number,
  sourceInstanceId: InstanceId,
): void {
  const ps = state.cards[targetInstanceId]?.permanentState;
  if (!ps || amount <= 0) return; // §6c: Schaden <= 0 ist kein Schadensereignis.

  ps.damageMarked += amount;
  // v0.2.3 (deathtouch, rules-engine.md 6d): gilt für JEDEN Schaden der
  // Quelle, nicht nur Kampfschaden.
  if (computeEffectiveKeywords(state, pool, sourceInstanceId).has("deathtouch")) {
    ps.deathtouchDamage = true;
  }
  events.push({ kind: "damageDealt", to: targetInstanceId, amount, source: sourceInstanceId });
  // v0.3 (rules-engine.md 5 + 9.10): onDamageReceived feuert einmal pro
  // Schadensereignis, eventSubject = Schadensquelle (nicht das getroffene
  // Permanent selbst). Letaler Schaden feuert trotzdem - die Quelle stirbt
  // (falls überhaupt) erst später via SBA, der Trigger bleibt so lange in
  // der Pending-Queue.
  fireOnDamageReceivedTrigger(state, pool, targetInstanceId, sourceInstanceId);
}
