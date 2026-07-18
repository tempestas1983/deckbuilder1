/**
 * Gemeinsames Board-Modell für die KI-Schwierigkeitsstufen (v2, siehe
 * docs/ai-status.md Abschnitt "v2: Schwierigkeitsstufen").
 *
 * ARCHITEKTUR-VORGABE (wie src/ai/simpleBot.ts): reiner Konsument — liest
 * ausschließlich die öffentlich typisierten `CardPool`/`GameState`-Strukturen
 * aus `src/model`, KEINE Imports aus `src/engine/*`.
 *
 * Wichtigster Unterschied zu den `rough*`-Schätzern in simpleBot.ts (v1):
 * `effectiveStats`/`hasEffectiveKeyword` berücksichtigen zusätzlich die
 * STATISCHEN Fähigkeiten ALLER Battlefield-Permanents (Anthems, Auren,
 * Debuffs, fremd gewährte Keywords) — das schließt die dokumentierte
 * v1-Schwäche Nr. 2 (docs/ai-status.md Abschnitt 6) für die Stufen, die
 * dieses Modul nutzen. Bewusst KEIN Layer-System: statische Stat-Deltas sind
 * additiv (identisch zur Engine-Reihenfolge-Irrelevanz bei reinen
 * Additionen); costChange-Statics sind hier irrelevant (die Engine
 * berücksichtigt sie bereits bei der Kandidaten-Enumeration).
 */

import type {
  Ability,
  CardDefinition,
  CardPool,
  ChosenTarget,
  EffectMode,
  GameState,
  InstanceId,
  Keyword,
  ManaCost,
  PlayerAction,
  PlayerId,
  RulesEngine,
  TargetSpec,
} from "../model";

export function otherPlayerId(player: PlayerId): PlayerId {
  return player === "player1" ? "player2" : "player1";
}

export function manaCostTotal(cost: ManaCost | undefined): number {
  if (!cost) return 0;
  return (
    (cost.generic ?? 0) +
    (cost.flame ?? 0) +
    (cost.tide ?? 0) +
    (cost.wild ?? 0) +
    (cost.light ?? 0) +
    (cost.void ?? 0)
  );
}

export function abilitiesOf(pool: CardPool, state: GameState, instanceId: InstanceId): Ability[] {
  const card = state.cards[instanceId];
  const def: CardDefinition | undefined = card && pool[card.definitionId];
  return def && "abilities" in def ? (def.abilities ?? []) : [];
}

/** Basis-Keyword (Karten-Definition) ODER temporär gewährtes Keyword desselben Permanents — identisch zu simpleBot.ts#hasBaseKeyword. */
export function hasBaseKeyword(pool: CardPool, state: GameState, instanceId: InstanceId, keyword: Keyword): boolean {
  if (abilitiesOf(pool, state, instanceId).some((a) => a.kind === "keyword" && a.keyword === keyword)) return true;
  const card = state.cards[instanceId];
  return card?.permanentState?.temporaryModifiers.some((m) => m.keyword === keyword) ?? false;
}

/** Grobe Basis-Power (ohne fremde Statics) — identisch zur v1-Schätzung in simpleBot.ts. */
export function roughPower(pool: CardPool, state: GameState, instanceId: InstanceId): number {
  return roughStat(pool, state, instanceId, "power");
}

/** Grobe Basis-Toughness (ohne fremde Statics) — identisch zur v1-Schätzung in simpleBot.ts. */
export function roughToughness(pool: CardPool, state: GameState, instanceId: InstanceId): number {
  return roughStat(pool, state, instanceId, "toughness");
}

function roughStat(pool: CardPool, state: GameState, instanceId: InstanceId, which: "power" | "toughness"): number {
  const card = state.cards[instanceId];
  if (!card) return 0;
  const def = pool[card.definitionId];
  if (def?.type !== "unit") return 0;
  const ps = card.permanentState;
  const plus = ps?.counters.plus1plus1 ?? 0;
  const minus = ps?.counters.minus1minus1 ?? 0;
  let value = (which === "power" ? def.power : def.toughness) + plus - minus;
  for (const mod of ps?.temporaryModifiers ?? []) {
    if (mod.stats) value += which === "power" ? mod.stats.power : mod.stats.toughness;
  }
  return value;
}

// ---------------------------------------------------------------------------
// Effektive Stats/Keywords inkl. statischer Fremd-Effekte
// ---------------------------------------------------------------------------

/**
 * Liefert alle InstanceIds, auf die eine statische Fähigkeit einer Quelle
 * wirkt — nur Units, außer bei scope self/attachedTo (dort entscheidet der
 * Aufrufer über die Anwendbarkeit des Modifikators).
 */
function staticApplies(
  pool: CardPool,
  state: GameState,
  sourceId: InstanceId,
  scope: Extract<Ability, { kind: "static" }>["scope"],
  targetId: InstanceId,
): boolean {
  const source = state.cards[sourceId];
  const target = state.cards[targetId];
  if (!source?.permanentState || !target?.permanentState) return false;

  switch (scope.kind) {
    case "self":
      return sourceId === targetId;
    case "attachedTo":
      return source.permanentState.attachedTo === targetId;
    case "ownUnits":
      return target.controller === source.controller && pool[target.definitionId]?.type === "unit";
    case "opponentUnits":
      return target.controller !== source.controller && pool[target.definitionId]?.type === "unit";
    case "allUnits":
      return pool[target.definitionId]?.type === "unit";
    default:
      return false;
  }
}

function forEachBattlefieldStatic(
  pool: CardPool,
  state: GameState,
  visit: (sourceId: InstanceId, ability: Extract<Ability, { kind: "static" }>) => void,
): void {
  for (const playerId of ["player1", "player2"] as const) {
    for (const sourceId of state.players[playerId].battlefield) {
      for (const ability of abilitiesOf(pool, state, sourceId)) {
        if (ability.kind === "static") visit(sourceId, ability);
      }
    }
  }
}

/**
 * Effektive Power/Toughness einer Unit: Basiswerte + Marken + temporäre
 * Modifikatoren (wie v1) PLUS additive Stat-Statics aller Battlefield-
 * Permanents (Anthems/Auren/Debuffs).
 */
export function effectiveStats(
  pool: CardPool,
  state: GameState,
  instanceId: InstanceId,
): { power: number; toughness: number } {
  let power = roughPower(pool, state, instanceId);
  let toughness = roughToughness(pool, state, instanceId);
  const card = state.cards[instanceId];
  if (!card?.permanentState || pool[card.definitionId]?.type !== "unit") return { power, toughness };

  forEachBattlefieldStatic(pool, state, (sourceId, ability) => {
    if (ability.modifier.kind !== "stats") return;
    if (!staticApplies(pool, state, sourceId, ability.scope, instanceId)) return;
    power += ability.modifier.power;
    toughness += ability.modifier.toughness;
  });
  return { power, toughness };
}

/** Effektives Keyword: Basis + temporär + statisch gewährt (auch von fremden Permanents). */
export function hasEffectiveKeyword(pool: CardPool, state: GameState, instanceId: InstanceId, keyword: Keyword): boolean {
  if (hasBaseKeyword(pool, state, instanceId, keyword)) return true;
  let granted = false;
  forEachBattlefieldStatic(pool, state, (sourceId, ability) => {
    if (granted) return;
    if (ability.modifier.kind !== "grantKeyword" || ability.modifier.keyword !== keyword) return;
    if (staticApplies(pool, state, sourceId, ability.scope, instanceId)) granted = true;
  });
  return granted;
}

// ---------------------------------------------------------------------------
// Wertfunktionen / Board-Bewertung
// ---------------------------------------------------------------------------

/** Bonuswert pro Keyword für die Unit-Bewertung (nachvollziehbar grob, dokumentiert in docs/ai-status.md). */
const KEYWORD_BONUS: Record<Keyword, number> = {
  airborne: 1.0,
  firstStrike: 1.0,
  deathtouch: 1.0,
  trample: 0.75,
  lifelink: 0.75,
  swift: 0.5,
  vigilant: 0.5,
  guardian: 0.25,
  reach: 0.25,
};

const ALL_KEYWORDS = Object.keys(KEYWORD_BONUS) as Keyword[];

/**
 * Wert einer Unit auf dem Battlefield: effektive Power + effektive Toughness
 * + Keyword-Boni. Markierter Schaden zählt bewusst NICHT als Substanzverlust
 * (er heilt im Cleanup — nur echte Tode ändern den Board-Wert; die
 * verbleibende Toughness INNERHALB eines Kampfes berücksichtigt fightOutcome
 * separat). Nicht-Units haben den Wert 0 (separat bewertet).
 */
export function unitValue(pool: CardPool, state: GameState, instanceId: InstanceId): number {
  const card = state.cards[instanceId];
  if (!card?.permanentState) return 0;
  const def = pool[card.definitionId];
  if (def?.type !== "unit") return 0;
  const { power, toughness } = effectiveStats(pool, state, instanceId);
  let value = Math.max(power, 0) + Math.max(toughness, 0);
  for (const keyword of ALL_KEYWORDS) {
    if (hasEffectiveKeyword(pool, state, instanceId, keyword)) value += KEYWORD_BONUS[keyword];
  }
  return value;
}

/** Gewichte der Board-Bewertung — bewusst als benannte Konstanten (Erklärbarkeit). */
export const EVAL_WEIGHTS = {
  /** 1 Lebenspunkt Differenz. */
  life: 1.0,
  /** 1 Punkt unitValue auf dem Battlefield. */
  unit: 2.2,
  /** Relic/Enchantment auf dem Battlefield (pauschale Nützlichkeit). */
  otherPermanent: 1.0,
  /** Terrain auf dem Battlefield (Mana-Entwicklung). */
  terrain: 0.5,
  /** 1 Handkarte (Kartenvorteil / künftige Optionen). */
  handCard: 0.7,
  /** Strafwert, wenn die eigene Library leer ist (Deck-Tod droht beim nächsten Draw). */
  emptyLibrary: 50,
  /** Sieg/Niederlage. */
  win: 10_000,
} as const;

/**
 * Board-Bewertung aus Sicht von `player` (höher = besser). Symmetrisch:
 * evaluateState(p1) === -evaluateState(p2), außer bei "draw" (0/0).
 */
export function evaluateState(pool: CardPool, state: GameState, player: PlayerId): number {
  const opponent = otherPlayerId(player);
  if (state.winner === player) return EVAL_WEIGHTS.win;
  if (state.winner === opponent) return -EVAL_WEIGHTS.win;
  if (state.winner === "draw") return 0;

  let score = (state.players[player].life - state.players[opponent].life) * EVAL_WEIGHTS.life;
  score += sideScore(pool, state, player) - sideScore(pool, state, opponent);
  score += (state.players[player].hand.length - state.players[opponent].hand.length) * EVAL_WEIGHTS.handCard;
  if (state.players[player].library.length === 0) score -= EVAL_WEIGHTS.emptyLibrary;
  if (state.players[opponent].library.length === 0) score += EVAL_WEIGHTS.emptyLibrary;
  return score;
}

function sideScore(pool: CardPool, state: GameState, player: PlayerId): number {
  let score = 0;
  for (const instanceId of state.players[player].battlefield) {
    const card = state.cards[instanceId];
    const def = card && pool[card.definitionId];
    if (!def) continue;
    if (def.type === "unit") score += unitValue(pool, state, instanceId) * EVAL_WEIGHTS.unit;
    else if (def.type === "terrain") score += EVAL_WEIGHTS.terrain;
    else score += EVAL_WEIGHTS.otherPermanent;
  }
  return score;
}

// ---------------------------------------------------------------------------
// Kampf-Mathematik (für Angriffs-/Block-Entscheidungen der hohen Stufe)
// ---------------------------------------------------------------------------

export interface FightResult {
  attackerDies: boolean;
  blockerDies: boolean;
}

/**
 * Erwarteter Ausgang eines 1:1-Kampfs Angreifer vs. Blocker mit effektiven
 * Stats und den Kampf-Keywords firstStrike/deathtouch (markierter Schaden
 * senkt die verbleibende Toughness). Bewusst OHNE trample (betrifft nur den
 * Durchbruch-Schaden, nicht das Überleben der Beteiligten).
 */
export function fightOutcome(pool: CardPool, state: GameState, attackerId: InstanceId, blockerId: InstanceId): FightResult {
  const a = effectiveStats(pool, state, attackerId);
  const b = effectiveStats(pool, state, blockerId);
  const aTough = a.toughness - (state.cards[attackerId]?.permanentState?.damageMarked ?? 0);
  const bTough = b.toughness - (state.cards[blockerId]?.permanentState?.damageMarked ?? 0);
  const aDeathtouch = hasEffectiveKeyword(pool, state, attackerId, "deathtouch");
  const bDeathtouch = hasEffectiveKeyword(pool, state, blockerId, "deathtouch");
  const aFirst = hasEffectiveKeyword(pool, state, attackerId, "firstStrike");
  const bFirst = hasEffectiveKeyword(pool, state, blockerId, "firstStrike");

  const kills = (power: number, deathtouch: boolean, targetToughness: number): boolean =>
    power >= targetToughness || (deathtouch && power > 0);

  if (aFirst && !bFirst) {
    const blockerDies = kills(a.power, aDeathtouch, bTough);
    const attackerDies = blockerDies ? false : kills(b.power, bDeathtouch, aTough);
    return { attackerDies, blockerDies };
  }
  if (bFirst && !aFirst) {
    const attackerDies = kills(b.power, bDeathtouch, aTough);
    const blockerDies = attackerDies ? false : kills(a.power, aDeathtouch, bTough);
    return { attackerDies, blockerDies };
  }
  return {
    attackerDies: kills(b.power, bDeathtouch, aTough),
    blockerDies: kills(a.power, aDeathtouch, bTough),
  };
}

/**
 * Darf `blockerId` den Angreifer `attackerId` blocken? Vereinfachte
 * Konsumenten-Prüfung wie simpleBot.ts#canBlockPair, aber mit EFFEKTIVEN
 * Keywords (inkl. statischer Fremd-Grants) statt nur Basis-Keywords.
 */
export function canBlockPairEffective(pool: CardPool, state: GameState, blockerId: InstanceId, attackerId: InstanceId): boolean {
  const blockerCard = state.cards[blockerId];
  if (!blockerCard?.permanentState || blockerCard.permanentState.tapped) return false;
  if (blockerCard.permanentState.combat?.role === "blocker") return false;
  if (pool[blockerCard.definitionId]?.type !== "unit") return false;

  const attackerCard = state.cards[attackerId];
  if (!attackerCard?.permanentState || attackerCard.permanentState.combat?.role !== "attacker") return false;

  if (hasEffectiveKeyword(pool, state, attackerId, "airborne")) {
    if (!hasEffectiveKeyword(pool, state, blockerId, "airborne") && !hasEffectiveKeyword(pool, state, blockerId, "reach")) {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Modale Cast-/Activate-Kandidaten vervollständigen
// ---------------------------------------------------------------------------

/**
 * getLegalActions liefert für modale Spells/Fähigkeiten laut Vertrag
 * (legal-actions.ts, Datei-Kommentar) GENAU EINEN rohen Kandidaten OHNE
 * chosenMode/chosenTargets — `applyAction` lehnt diesen rohen Kandidaten ab
 * ("Modus fehlt"). Der Konsument (UI wie Bot) muss Modus + Ziele selbst
 * ergänzen; das UI fragt beides interaktiv ab, die Bots nutzen diese
 * Funktion. (Fund der Farb-Balance-Analyse übers 300-Karten-Set: vorher
 * reichten medium/easy den rohen Kandidaten unverändert ein -> Engine-Ablehnung;
 * hard hat modale Kandidaten still verworfen, weil die Simulation des rohen
 * Kandidaten immer fehlschlug.)
 *
 * Rückgabe:
 * - undefined  -> Kandidat ist nicht modal (oder hat schon einen Modus):
 *                 unverändert verwenden.
 * - Array      -> alle konkreten, ENGINE-VALIDIERTEN Vervollständigungen
 *                 (Dry-Run über das pure `applyAction` — reine Nutzung der
 *                 öffentlichen Schnittstelle, keine Engine-Internals). Leer,
 *                 falls keine legale Vervollständigung existiert (Kandidat
 *                 überspringen — sollte laut Kandidaten-Vertrag nicht
 *                 vorkommen, defensiv trotzdem möglich).
 *
 * Bewusste Grenze (wie X-Kosten, docs/ai-status.md 9.7): Modi mit >= 2
 * Zielslots werden übersprungen.
 */
export function expandModalCandidate(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  action: PlayerAction,
): PlayerAction[] | undefined {
  if (action.kind !== "castSpell" && action.kind !== "activateAbility") return undefined;
  const modes = modesOfCandidate(pool, state, action);
  if (!modes) return undefined;

  const completions: PlayerAction[] = [];
  for (let modeIndex = 0; modeIndex < modes.length; modeIndex++) {
    const specs = modes[modeIndex]?.targets ?? [];
    if (specs.length > 1) continue; // bewusste Grenze, siehe Doku oben
    const targetSets: ChosenTarget[][] =
      specs.length === 0 ? [[]] : coarseTargetUniverse(state, specs[0]!).map((t) => [t]);
    for (const chosenTargets of targetSets) {
      const completed: PlayerAction = { ...action, chosenMode: modeIndex, chosenTargets };
      // Dry-Run: applyAction ist pure — Fein-Legalität (Zielfilter,
      // Modus-Wählbarkeit, Kosten) prüft vollständig die Engine selbst,
      // hier wird nichts davon dupliziert.
      if (engine.applyAction(state, completed).error === undefined) {
        completions.push(completed);
      }
    }
  }
  return completions;
}

/** Modi eines rohen Cast-/Activate-Kandidaten (undefined = nicht modal/bereits vervollständigt). */
function modesOfCandidate(pool: CardPool, state: GameState, action: PlayerAction): EffectMode[] | undefined {
  if (action.kind === "castSpell") {
    if (action.chosenMode !== undefined) return undefined;
    const card = state.cards[action.cardInstanceId];
    const def = card && pool[card.definitionId];
    if (def?.type === "spell" && def.modes && def.modes.length > 0) return def.modes;
    return undefined;
  }
  if (action.kind === "activateAbility") {
    if (action.chosenMode !== undefined) return undefined;
    const ability = abilitiesOf(pool, state, action.sourceInstanceId)[action.abilityIndex];
    if (ability?.kind === "activated" && ability.modes && ability.modes.length > 0) return ability.modes;
    return undefined;
  }
  return undefined;
}

/**
 * Grobes Ziel-Universum für einen Zielslot — nur die KATEGORIE des Ziels
 * (Permanent/Spieler/Stack-Objekt); alle Feinfilter (cardTypes, controller,
 * mustBeTapped, ...) prüft der applyAction-Dry-Run in expandModalCandidate.
 */
function coarseTargetUniverse(state: GameState, spec: TargetSpec): ChosenTarget[] {
  const permanents: ChosenTarget[] = [];
  for (const playerId of ["player1", "player2"] as const) {
    for (const instanceId of state.players[playerId].battlefield) {
      permanents.push({ kind: "permanent", instanceId });
    }
  }
  const players: ChosenTarget[] = (["player1", "player2"] as const).map((playerId) => ({ kind: "player", playerId }));
  switch (spec.kind) {
    case "permanent":
      return permanents;
    case "player":
      return players;
    case "unitOrPlayer":
      return [...permanents, ...players];
    case "stackObject":
      return state.stack.map((obj) => ({ kind: "stackObject", stackObjectId: obj.id }));
    default:
      return [];
  }
}
