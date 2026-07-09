/**
 * Berechnung effektiver Werte für Permanents: Power/Toughness und aktive
 * Keywords. Kein Layer-System (rules-engine.md 9.3) - feste Reihenfolge:
 * Basiswerte -> Marken (+1/+1, -1/-1) -> statische/temporäre Modifikatoren
 * in Timestamp-Reihenfolge der Quelle.
 *
 * v0.1-Vereinfachung: Nur StaticAbility-Scopes "self"/"ownUnits"/
 * "opponentUnits"/"allUnits"/"attachedTo" werden ausgewertet; Keyword-Entzug
 * ("verliert Keyword X") ist laut Modell nicht vorgesehen (additiv only).
 */

import type { CardPool, GameState, InstanceId, Keyword, PlayerId } from "../model";
import { getDefinition, getDefinitionForInstance } from "./card-defs";

export interface EffectiveStats {
  power: number;
  toughness: number;
}

interface StaticSource {
  sourceInstanceId: InstanceId;
  timestamp: number;
  controller: PlayerId;
}

function allBattlefieldPermanents(state: GameState): InstanceId[] {
  const result: InstanceId[] = [];
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    result.push(...state.players[playerId].battlefield);
  }
  return result;
}

function staticSourcesAffecting(
  state: GameState,
  pool: CardPool,
  targetInstanceId: InstanceId,
): Array<{ sourceInstanceId: InstanceId; timestamp: number; kind: "stats" | "keyword"; stats?: { power: number; toughness: number }; keyword?: Keyword }> {
  const target = state.cards[targetInstanceId];
  if (!target || !target.permanentState) return [];
  const results: Array<{
    sourceInstanceId: InstanceId;
    timestamp: number;
    kind: "stats" | "keyword";
    stats?: { power: number; toughness: number };
    keyword?: Keyword;
  }> = [];

  for (const sourceId of allBattlefieldPermanents(state)) {
    const sourceCard = state.cards[sourceId];
    if (!sourceCard || !sourceCard.permanentState) continue;
    const def = getDefinition(pool, sourceCard.definitionId);
    const abilities = "abilities" in def ? def.abilities ?? [] : [];
    for (const ability of abilities) {
      if (ability.kind !== "static") continue;
      const inScope = isInScope(state, sourceId, sourceCard.controller, targetInstanceId, ability.scope);
      if (!inScope) continue;
      if (ability.modifier.kind === "stats") {
        results.push({
          sourceInstanceId: sourceId,
          timestamp: sourceCard.permanentState.timestamp,
          kind: "stats",
          stats: { power: ability.modifier.power, toughness: ability.modifier.toughness },
        });
      } else if (ability.modifier.kind === "grantKeyword") {
        results.push({
          sourceInstanceId: sourceId,
          timestamp: sourceCard.permanentState.timestamp,
          kind: "keyword",
          keyword: ability.modifier.keyword,
        });
      }
    }
  }
  return results.sort((a, b) => a.timestamp - b.timestamp);
}

function isInScope(
  state: GameState,
  sourceInstanceId: InstanceId,
  sourceController: PlayerId,
  targetInstanceId: InstanceId,
  scope: { kind: "self" | "attachedTo" | "ownUnits" | "opponentUnits" | "allUnits" },
): boolean {
  const target = state.cards[targetInstanceId];
  if (!target) return false;
  switch (scope.kind) {
    case "self":
      return sourceInstanceId === targetInstanceId;
    case "attachedTo": {
      const source = state.cards[sourceInstanceId];
      return source?.permanentState?.attachedTo === targetInstanceId;
    }
    case "ownUnits":
      return target.controller === sourceController;
    case "opponentUnits":
      return target.controller !== sourceController;
    case "allUnits":
      return true;
    default:
      return false;
  }
}

/**
 * Summe aller `costChange`-Static-Modifier, die das Casten eines Spells durch
 * `casterPlayerId` gerade verteuern/verbilligen (rules-engine.md 9.3,
 * `abilities.ts#StaticAbility` modifier `kind: "costChange"`). Wirkt NUR auf
 * die generischen Kosten von Spells (`ManaCost.generic` + ggf. X), niemals auf
 * Farbanteile oder Fähigkeitskosten (`activateAbility`) - siehe Kommentar am
 * Modell-Typ ("Kosten von Spells").
 *
 * Anmerkung zu `StaticAbility.scope`: Für `costChange` ist bereits über
 * `modifier.appliesTo` ("ownSpells"/"opponentSpells", relativ zum Controller
 * der Quelle) eindeutig festgelegt, wessen Casts betroffen sind - ein
 * zusätzlicher `scope`-Filter (self/attachedTo/ownUnits/opponentUnits/
 * allUnits) hat für Spells keinen sinnvollen Gegenstand (kein Zielpermanent).
 * Diese Funktion ignoriert `scope` daher bewusst für `costChange`-Modifier;
 * die Quellkarte muss trotzdem irgendeinen `scope`-Wert angeben (TS-Pflichtfeld).
 * Rückfrage an den Game-Architect steht aus, ob `scope` hier künftig eine
 * andere Bedeutung bekommen soll - siehe docs/engine-status.md.
 */
export function computeSpellCostDelta(
  state: GameState,
  pool: CardPool,
  casterPlayerId: PlayerId,
): number {
  let delta = 0;
  for (const sourceId of allBattlefieldPermanents(state)) {
    const sourceCard = state.cards[sourceId];
    if (!sourceCard || !sourceCard.permanentState) continue;
    const def = getDefinition(pool, sourceCard.definitionId);
    const abilities = "abilities" in def ? def.abilities ?? [] : [];
    for (const ability of abilities) {
      if (ability.kind !== "static" || ability.modifier.kind !== "costChange") continue;
      const isOwnController = sourceCard.controller === casterPlayerId;
      if (ability.modifier.appliesTo === "ownSpells" && isOwnController) {
        delta += ability.modifier.genericDelta;
      } else if (ability.modifier.appliesTo === "opponentSpells" && !isOwnController) {
        delta += ability.modifier.genericDelta;
      }
    }
  }
  return delta;
}

/** Effektive Power/Toughness einer Unit-Permanent-Instanz. */
export function computeEffectiveStats(
  state: GameState,
  pool: CardPool,
  instanceId: InstanceId,
): EffectiveStats {
  const card = state.cards[instanceId];
  const ps = card?.permanentState;
  const def = getDefinitionForInstance(pool, state, instanceId);
  if (def.type !== "unit" || !ps) {
    return { power: 0, toughness: 0 };
  }
  let power = def.power;
  let toughness = def.toughness;

  // Marken
  const plus = ps.counters.plus1plus1 ?? 0;
  const minus = ps.counters.minus1minus1 ?? 0;
  power += plus - minus;
  toughness += plus - minus;

  // Temporäre Modifikatoren (bis Zugende), in Reihenfolge ihrer Entstehung
  // (Array-Reihenfolge = Entstehungsreihenfolge, kein separater Timestamp nötig)
  for (const mod of ps.temporaryModifiers) {
    if (mod.stats) {
      power += mod.stats.power;
      toughness += mod.stats.toughness;
    }
  }

  // Statische Fähigkeiten anderer/eigener Permanents, Timestamp-Reihenfolge der Quelle
  for (const src of staticSourcesAffecting(state, pool, instanceId)) {
    if (src.kind === "stats" && src.stats) {
      power += src.stats.power;
      toughness += src.stats.toughness;
    }
  }

  return { power, toughness };
}

/** Aktive Keywords einer Permanent-Instanz (additiv: Basis + gewährte). */
export function computeEffectiveKeywords(
  state: GameState,
  pool: CardPool,
  instanceId: InstanceId,
): Set<Keyword> {
  const def = getDefinitionForInstance(pool, state, instanceId);
  const keywords = new Set<Keyword>();
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  for (const ability of abilities) {
    if (ability.kind === "keyword") keywords.add(ability.keyword);
  }

  const card = state.cards[instanceId];
  const ps = card?.permanentState;
  if (ps) {
    for (const mod of ps.temporaryModifiers) {
      if (mod.keyword) keywords.add(mod.keyword);
    }
  }

  for (const src of staticSourcesAffecting(state, pool, instanceId)) {
    if (src.kind === "keyword" && src.keyword) keywords.add(src.keyword);
  }

  return keywords;
}
