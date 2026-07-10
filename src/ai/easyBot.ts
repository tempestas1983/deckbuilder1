/**
 * Schwierigkeitsstufe LEICHT (v2, siehe docs/ai-status.md): bewusst schwacher,
 * aber regelkonformer Gegner. Kernidee: absichtliche Fehler statt kaputter
 * Regeln — der Bot spielt IMMER legale Aktionen (Partien laufen sauber durch),
 * trifft aber zufällige/naive Entscheidungen:
 *
 * - Mulligan: behält JEDE Starthand (auch 0 Terrains).
 * - PendingDecisions (Trigger-Ziele, Modi): zufälliger Kandidat — trifft
 *   damit regelmäßig auch eigene Permanents mit Removal-Triggern.
 * - Castet nur mit 60% Wahrscheinlichkeit pro Fenster und wählt dann einen
 *   ZUFÄLLIGEN castbaren Kandidaten (keine Bewertung, kein Removal-Fokus).
 * - Ignoriert aktivierte Nicht-Mana-Fähigkeiten komplett (auch das absichtlich:
 *   verhindert zugleich den in docs/ai-status.md Abschnitt 5 beschriebenen
 *   "Armee leer tappen"-Degenerationsfall, ohne die v1-Bremse zu brauchen).
 * - Greift mit einer ZUFÄLLIGEN Teilmenge an (50% pro Unit, keine Blocker-Mathematik
 *   — rennt in schlechte Blocks).
 * - Blockt selten (25% pro Unit) und ohne Tauschwert-Prüfung (sinnlose Chumps);
 *   nur guardian-Pflichten werden immer erfüllt (sonst illegal).
 * - Discard im Cleanup: zufällige Karten (wirft auch seine besten weg).
 *
 * Zufall ist DETERMINISTISCH aus dem GameState abgeleitet (mulberry32 über
 * rngState/nextObjectNumber/turnNumber): dieselbe Stellung ergibt immer
 * dieselbe Aktion — reproduzierbare Tests, keine Flakiness.
 *
 * ARCHITEKTUR-VORGABE (wie simpleBot.ts): reiner Konsument der öffentlichen
 * RulesEngine-Schnittstelle; Kampf-/Discard-Konstruktion folgt exakt den in
 * docs/ai-status.md Abschnitt 3 dokumentierten, vom Engine-Vertrag
 * sanktionierten Mustern.
 */

import type {
  CardPool,
  GameState,
  InstanceId,
  PlayerAction,
  PlayerId,
  RulesEngine,
} from "../model";
import { hasBaseKeyword, otherPlayerId } from "./boardEval";

// ---------------------------------------------------------------------------
// Deterministischer Zufall pro Stellung
// ---------------------------------------------------------------------------

/** Klassisches mulberry32 — klein, gut genug für Spielentscheidungen. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** PRNG, dessen Seed sich aus dem GameState ableitet (deterministisch pro Stellung). */
function rngForState(state: GameState): () => number {
  const seed =
    (Math.imul(state.rngState.seed, 0x9e3779b1) ^
      Math.imul(state.rngState.counter, 0x85ebca6b) ^
      Math.imul(state.nextObjectNumber, 0xc2b2ae35) ^
      Math.imul(state.turnNumber, 101)) >>>
    0;
  return mulberry32(seed);
}

function pickRandom<T>(items: T[], rand: () => number): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(rand() * items.length) % items.length];
}

// ---------------------------------------------------------------------------
// Öffentliche Kernfunktion
// ---------------------------------------------------------------------------

/** Wahrscheinlichkeit, in einem Priority-Fenster überhaupt zu casten. */
const CAST_PROBABILITY = 0.6;
/** Wahrscheinlichkeit pro Unit, als Angreifer deklariert zu werden. */
const ATTACK_PROBABILITY = 0.5;
/** Wahrscheinlichkeit pro Unit, freiwillig zu blocken. */
const BLOCK_PROBABILITY = 0.25;

export function chooseActionEasy(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
): PlayerAction {
  if (state.winner !== undefined) return { kind: "concede", player };
  const legal = engine.getLegalActions(state, player);
  if (legal.length === 0) return { kind: "concede", player };

  const rand = rngForState(state);

  // 1. PendingDecision: Mulligan nie nehmen, sonst zufälliger Kandidat.
  if (state.pendingDecision && state.pendingDecision.player === player) {
    const candidates = legal.filter(
      (a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision",
    );
    if (candidates.length > 0) {
      if (state.pendingDecision.kind === "mulligan") {
        return candidates.find((a) => a.choice.kind === "mulligan" && !a.choice.takeMulligan) ?? candidates[0]!;
      }
      return pickRandom(candidates, rand)!;
    }
  }

  // Cleanup-Abwurf (Pflicht-Erkennung direkt aus GameState, siehe
  // docs/ai-status.md 3.2): zufällige Karten abwerfen.
  if (
    state.step === "cleanup" &&
    state.priorityPlayer === undefined &&
    state.pendingDecision === undefined &&
    state.activePlayer === player &&
    state.players[player].hand.length > 7
  ) {
    const hand = [...state.players[player].hand];
    const overflow = hand.length - 7;
    const discards: InstanceId[] = [];
    for (let i = 0; i < overflow; i++) {
      const idx = Math.floor(rand() * hand.length) % hand.length;
      discards.push(hand.splice(idx, 1)[0]!);
    }
    return { kind: "discardToHandSize", player, cardInstanceIds: discards };
  }

  // 2. Terrain immer spielen (hält die Partie am Laufen — bewusst KEIN
  // absichtlicher Fehler, sonst degenerieren Partien in Deck-Auszehr-Marathons).
  const terrainAction = legal.find((a) => a.kind === "playTerrain");
  if (terrainAction) return terrainAction;

  // 3. Zufälliger Cast — nur mit CAST_PROBABILITY, nur Spells/Units/etc.,
  // NIE aktivierte Nicht-Mana-Fähigkeiten (siehe Modul-Doku oben).
  const casts = legal.filter((a): a is Extract<PlayerAction, { kind: "castSpell" }> => a.kind === "castSpell");
  if (casts.length > 0 && rand() < CAST_PROBABILITY) {
    return pickRandom(casts, rand)!;
  }

  // Mana-Aufbau nur in der eigenen Main-Phase (dieselbe Bremse wie v1, siehe
  // docs/ai-status.md Abschnitt 5 Fund 2 — ohne sie verhungert der Bot am Mana),
  // und nur solange nichts castbar ist.
  if (casts.length === 0 && state.activePlayer === player && (state.step === "main1" || state.step === "main2")) {
    const handHasNonTerrain = state.players[player].hand.some((id) => {
      const card = state.cards[id];
      return card !== undefined && pool[card.definitionId]?.type !== "terrain";
    });
    if (handHasNonTerrain) {
      const manaAbility = legal.find((a) => {
        if (a.kind !== "activateAbility") return false;
        const card = state.cards[a.sourceInstanceId];
        const def = card && pool[card.definitionId];
        const abilities = def && "abilities" in def ? (def.abilities ?? []) : [];
        const ability = abilities[a.abilityIndex];
        return ability?.kind === "activated" && ability.isManaAbility === true;
      });
      if (manaAbility) return manaAbility;
    }
  }

  // 4. Angriff: zufällige Teilmenge der einzeln legalen Angreifer.
  const declareCandidates = legal.filter(
    (a): a is Extract<PlayerAction, { kind: "declareAttackers" }> => a.kind === "declareAttackers",
  );
  if (declareCandidates.length > 0) {
    const singleAttackerIds = declareCandidates.filter((a) => a.attackers.length === 1).map((a) => a.attackers[0]!);
    const chosen = singleAttackerIds.filter(() => rand() < ATTACK_PROBABILITY);
    if (chosen.length > 0) return { kind: "declareAttackers", player, attackers: chosen };
    return (
      declareCandidates.find((a) => a.attackers.length === 0) ?? { kind: "declareAttackers", player, attackers: [] }
    );
  }

  // 5. Blocker: guardian-Pflicht erfüllen, sonst selten und wahllos blocken.
  if (
    state.step === "declareBlockers" &&
    state.priorityPlayer === undefined &&
    state.pendingDecision === undefined &&
    otherPlayerId(state.activePlayer) === player
  ) {
    return chooseBlockActionEasy(pool, state, player, rand);
  }

  // 6. Sonst passen.
  const pass = legal.find((a) => a.kind === "passPriority");
  if (pass) return pass;
  const concede = legal.find((a) => a.kind === "concede");
  if (concede) return concede;
  return legal[0]!;
}

// ---------------------------------------------------------------------------
// Blocker (eigene Konstruktion aus GameState, Muster + Restrisiko wie
// simpleBot.ts / docs/ai-status.md 3.1 — nur Basis-Keywords)
// ---------------------------------------------------------------------------

function chooseBlockActionEasy(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  rand: () => number,
): PlayerAction {
  const attackerIds = state.players[state.activePlayer].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );
  const ownUnits = state.players[player].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    return pool[card.definitionId]?.type === "unit";
  });

  const blocks: Array<{ blocker: InstanceId; attacker: InstanceId }> = [];
  const used = new Set<InstanceId>();

  // guardian-Pflicht: jede ungetappte guardian-Unit mit legalem Block MUSS blocken.
  for (const unit of ownUnits) {
    if (!hasBaseKeyword(pool, state, unit, "guardian")) continue;
    const options = attackerIds.filter((a) => canBlockPairBase(pool, state, unit, a));
    const target = pickRandom(options, rand);
    if (target === undefined) continue;
    blocks.push({ blocker: unit, attacker: target });
    used.add(unit);
  }

  // Freiwillige Blocks: selten, wahllos, ohne Tauschwert-Prüfung.
  for (const unit of ownUnits) {
    if (used.has(unit)) continue;
    if (rand() >= BLOCK_PROBABILITY) continue;
    const options = attackerIds.filter((a) => canBlockPairBase(pool, state, unit, a));
    const target = pickRandom(options, rand);
    if (target === undefined) continue;
    blocks.push({ blocker: unit, attacker: target });
    used.add(unit);
  }

  return { kind: "declareBlockers", player, blocks };
}

/** Vereinfachte Block-Legalität (nur Basis-Keywords) — identisch zur v1-Prüfung in simpleBot.ts. */
function canBlockPairBase(pool: CardPool, state: GameState, blockerId: InstanceId, attackerId: InstanceId): boolean {
  const blockerCard = state.cards[blockerId];
  if (!blockerCard?.permanentState || blockerCard.permanentState.tapped) return false;
  if (blockerCard.permanentState.combat?.role === "blocker") return false;
  if (pool[blockerCard.definitionId]?.type !== "unit") return false;

  const attackerCard = state.cards[attackerId];
  if (!attackerCard?.permanentState || attackerCard.permanentState.combat?.role !== "attacker") return false;

  if (hasBaseKeyword(pool, state, attackerId, "airborne")) {
    if (!hasBaseKeyword(pool, state, blockerId, "airborne") && !hasBaseKeyword(pool, state, blockerId, "reach")) {
      return false;
    }
  }
  return true;
}
