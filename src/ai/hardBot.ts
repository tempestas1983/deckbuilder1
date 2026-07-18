/**
 * Schwierigkeitsstufe SCHWER (v2, siehe docs/ai-status.md): baut auf der
 * v1-Heuristik-Struktur (simpleBot.ts) auf, ersetzt aber die groben
 * Ein-Schritt-Schätzungen durch:
 *
 * 1. Budgetiertes 1-Ply-LOOKAHEAD über echte `applyAction`-Simulation
 *    (rules-engine.md 9.1: applyAction ist pure/deterministisch): Jeder
 *    Cast-/Activate-Kandidat und jede eigene Trigger-Ziel-/Modus-Wahl wird
 *    bis zur "Ruhe" simuliert (Stack leer, keine PendingDecision — beide
 *    Seiten passen, Annahme: kein Instant-Speed-Gegenspiel, was für die
 *    aktuellen Bots zutrifft) und der Ergebnis-Zustand mit `evaluateState`
 *    (boardEval.ts) bewertet. Gewählt wird der Kandidat mit der besten
 *    Bewertung — nur wenn er die aktuelle Stellung um mindestens
 *    MIN_EVAL_GAIN verbessert (verhindert sinnlose Casts, z.B. Removal auf
 *    das eigene Board).
 * 2. EFFEKTIVE Stats/Keywords inkl. statischer Fremd-Effekte (Anthems etc.,
 *    boardEval.ts) statt der v1-`rough*`-Schätzer — schließt die
 *    dokumentierte v1-Schwäche Nr. 2.
 * 3. Echte Kampf-Mathematik (fightOutcome, boardEval.ts) mit
 *    firstStrike/deathtouch für Angriffs- UND Block-Entscheidungen, plus
 *    Alpha-Strike-Erkennung (lethaler Gesamtangriff) und
 *    Überlebens-Chump-Blocks bei drohendem Tod (trample-bewusst).
 *
 * PERFORMANCE-BUDGET (UI darf nicht einfrieren): pro chooseActionHard-Aufruf
 * werden höchstens MAX_SIMULATED_ACTIONS applyAction-Simulationen verbraucht
 * (structuredClone-basiert, siehe Engine); Kandidaten werden vorab statisch
 * vorsortiert und auf MAX_SIMULATED_CANDIDATES begrenzt. Ist das Budget
 * erschöpft, fällt die Wahl auf die statische Vorsortierung zurück (nie auf
 * eine illegale Aktion).
 *
 * ARCHITEKTUR-VORGABE (wie simpleBot.ts): reiner Konsument der öffentlichen
 * RulesEngine-Schnittstelle (getLegalActions/applyAction) — keine
 * Engine-/Model-Internals. Kampf-/Discard-Konstruktion folgt den in
 * docs/ai-status.md Abschnitt 3 dokumentierten Vertrags-Mustern.
 */

import type {
  Ability,
  CardPool,
  ChosenTarget,
  Effect,
  GameState,
  InstanceId,
  PendingDecision,
  PlayerAction,
  PlayerId,
  RulesEngine,
} from "../model";
import {
  canBlockPairEffective,
  effectiveStats,
  evaluateState,
  expandModalCandidate,
  fightOutcome,
  hasEffectiveKeyword,
  manaCostTotal,
  otherPlayerId,
  unitValue,
} from "./boardEval";

// ---------------------------------------------------------------------------
// Budget-Konstanten (siehe Modul-Doku)
// ---------------------------------------------------------------------------

/** Max. applyAction-Simulationen pro chooseActionHard-Aufruf. */
const MAX_SIMULATED_ACTIONS = 400;
/** Max. Folge-Aktionen pro Kandidaten-Rollout (Stack-Abwicklung). */
const MAX_ROLLOUT_STEPS = 40;
/** Max. Anzahl per Lookahead simulierter Cast-/Activate-Kandidaten. */
const MAX_SIMULATED_CANDIDATES = 12;
/** Mindest-Bewertungsgewinn, damit ein Kandidat der Passivität vorgezogen wird. */
const MIN_EVAL_GAIN = 0.05;

interface SimBudget {
  remaining: number;
}

// ---------------------------------------------------------------------------
// Öffentliche Kernfunktion
// ---------------------------------------------------------------------------

export function chooseActionHard(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
): PlayerAction {
  if (state.winner !== undefined) return { kind: "concede", player };
  const legal = engine.getLegalActions(state, player);
  if (legal.length === 0) return { kind: "concede", player };

  const budget: SimBudget = { remaining: MAX_SIMULATED_ACTIONS };

  // 1. PendingDecision zuerst.
  if (state.pendingDecision && state.pendingDecision.player === player) {
    const decisionAction = choosePendingDecisionHard(engine, pool, state, state.pendingDecision, legal, player, budget);
    if (decisionAction) return decisionAction;
  }

  // Cleanup-Abwurf (Pflicht-Erkennung direkt aus GameState, docs/ai-status.md 3.2).
  if (
    state.step === "cleanup" &&
    state.priorityPlayer === undefined &&
    state.pendingDecision === undefined &&
    state.activePlayer === player &&
    state.players[player].hand.length > 7
  ) {
    return chooseDiscardActionHard(pool, state, player);
  }

  // 2. Terrain spielen.
  const terrainAction = legal.find((a) => a.kind === "playTerrain");
  if (terrainAction) return terrainAction;

  // 3. Cast/Activate per Lookahead-Bewertung.
  const castOrActivate = chooseBestCastOrActivateHard(engine, pool, state, legal, player, budget);
  if (castOrActivate) return castOrActivate;

  // 4. Angreifer (Kampf-Mathematik + Alpha-Strike-Erkennung + Kampf-Simulation).
  const attackAction = chooseAttackActionHard(engine, pool, state, legal, player, budget);
  if (attackAction) return attackAction;

  // 5. Blocker (eigene Konstruktion aus GameState, docs/ai-status.md 3.1;
  // Auswahl zwischen mehreren Zuordnungs-Kandidaten per Kampf-Simulation).
  if (
    state.step === "declareBlockers" &&
    state.priorityPlayer === undefined &&
    state.pendingDecision === undefined &&
    otherPlayerId(state.activePlayer) === player
  ) {
    return chooseBlockActionHard(engine, pool, state, player, budget);
  }

  // 6. Sonst passen.
  const pass = legal.find((a) => a.kind === "passPriority");
  if (pass) return pass;
  const concede = legal.find((a) => a.kind === "concede");
  if (concede) return concede;
  return legal[0]!;
}

// ---------------------------------------------------------------------------
// Simulation: Aktion anwenden und Stack bis zur Ruhe abwickeln
// ---------------------------------------------------------------------------

const HARMFUL_EFFECT_KINDS = new Set<Effect["kind"]>(["dealDamage", "destroyPermanent", "exilePermanent"]);

/**
 * applyAction-Wrapper NUR für Simulationen: Die Engine kann in seltenen
 * Zuständen werfen statt einen error zurückzugeben (beim Bauen gefunden und
 * an den Koordinator gemeldet, siehe docs/ai-status.md "Gefundener
 * Engine-Bug v2": dealCombatDamage ruft hasKeyword auf Token-Teilnehmer auf,
 * die in der firstStrike-Schadensrunde per SBA 7 endgültig GELÖSCHT wurden —
 * getDefinitionForInstance wirft dann). Eine hypothetische Simulationslinie
 * darf den Bot niemals crashen — der betroffene Kandidat gilt stattdessen
 * als unbewertbar. Echte (vom Aufrufer angewendete) Aktionen laufen bewusst
 * NICHT über diesen Wrapper.
 */
function safeApplyForSim(
  engine: RulesEngine,
  state: GameState,
  action: PlayerAction,
): { state: GameState; error?: string } {
  try {
    const result = engine.applyAction(state, action);
    return { state: result.state, error: result.error };
  } catch (e) {
    return { state, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Wendet `action` auf `state` an und wickelt anschließend den Stack ab, bis
 * kein Stack-Objekt und keine PendingDecision mehr aussteht (beide Spieler
 * passen; verschachtelte Decisions werden mit einer schnellen Heuristik
 * aufgelöst — siehe pickDecisionForSim). Steps werden NIE weitergeschaltet
 * (bei leerem Stack + vergebener Priority wird gestoppt), damit die Bewertung
 * die aktuelle Phase vergleichbar abbildet.
 *
 * Liefert undefined, wenn das Budget schon vor dem ersten Schritt erschöpft
 * ist oder die Aktion selbst abgelehnt wird (defensiv — laut Vertrag sollten
 * nur legale Kandidaten ankommen).
 */
function simulateToQuiescence(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  action: PlayerAction,
  budget: SimBudget,
): GameState | undefined {
  if (budget.remaining <= 0) return undefined;
  budget.remaining -= 1;
  const first = safeApplyForSim(engine, state, action);
  if (first.error) return undefined;
  let current = first.state;

  for (let i = 0; i < MAX_ROLLOUT_STEPS; i++) {
    if (current.winner !== undefined) return current;

    if (current.pendingDecision) {
      const decision = current.pendingDecision;
      const candidates = engine
        .getLegalActions(current, decision.player)
        .filter((a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision");
      if (candidates.length === 0) return current; // defensiv: nichts Sinnvolles möglich
      const pick = pickDecisionForSim(pool, current, decision, candidates);
      if (budget.remaining <= 0) return current;
      budget.remaining -= 1;
      const result = safeApplyForSim(engine, current, pick);
      if (result.error) return current;
      current = result.state;
      continue;
    }

    if (current.stack.length > 0 && current.priorityPlayer !== undefined) {
      if (budget.remaining <= 0) return current;
      budget.remaining -= 1;
      const result = safeApplyForSim(engine, current, { kind: "passPriority", player: current.priorityPlayer });
      if (result.error) return current;
      current = result.state;
      continue;
    }

    return current; // Stack leer, keine Decision -> Ruhe erreicht
  }
  return current;
}

/**
 * Schnelle Decision-Heuristik INNERHALB eines Rollouts (für beide Spieler,
 * bewusst nicht rekursiv simuliert): schädliche Trigger auf das wertvollste
 * gegnerische Ziel, nützliche auf das wertvollste eigene — sonst erster
 * Kandidat. Aus Sicht des jeweiligen decision.player, damit die Simulation
 * auch gegnerische Trigger plausibel (nicht bot-freundlich verzerrt) auflöst.
 */
function pickDecisionForSim(
  pool: CardPool,
  state: GameState,
  decision: PendingDecision,
  candidates: Array<Extract<PlayerAction, { kind: "resolveDecision" }>>,
): PlayerAction {
  if (decision.kind !== "chooseTriggerTargets") return candidates[0]!;

  const sourceCard = state.cards[decision.sourceInstanceId];
  const def = sourceCard && pool[sourceCard.definitionId];
  const abilities: Ability[] = def && "abilities" in def ? (def.abilities ?? []) : [];
  const ability = abilities[decision.abilityIndex];
  let harmful = false;
  if (ability?.kind === "triggered") {
    const effects: Effect[] =
      decision.chosenMode !== undefined ? (ability.modes?.[decision.chosenMode]?.effects ?? []) : (ability.effects ?? []);
    harmful = effects.some((e) => HARMFUL_EFFECT_KINDS.has(e.kind));
  }

  let best: PlayerAction | undefined;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    if (candidate.choice.kind !== "chooseTriggerTargets") continue;
    const target = candidate.choice.chosenTargets[0];
    const score = triggerTargetScore(pool, state, decision.player, target, harmful);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best ?? candidates[0]!;
}

function triggerTargetScore(
  pool: CardPool,
  state: GameState,
  decisionPlayer: PlayerId,
  target: ChosenTarget | undefined,
  harmful: boolean,
): number {
  if (!target) return 0;
  if (target.kind === "player") {
    const isOpponent = target.playerId !== decisionPlayer;
    return harmful === isOpponent ? 1 : -1;
  }
  if (target.kind !== "permanent") return 0;
  const card = state.cards[target.instanceId];
  if (!card) return 0;
  const isOpponent = card.controller !== decisionPlayer;
  const value = unitValue(pool, state, target.instanceId);
  // Schädlich: gegnerisches Ziel gut (je wertvoller, desto besser), eigenes schlecht.
  // Nützlich: umgekehrt.
  if (harmful === isOpponent) return 2 + value;
  return -(2 + value);
}

// ---------------------------------------------------------------------------
// Pending Decisions (eigene, oberste Ebene): per Lookahead bewerten
// ---------------------------------------------------------------------------

function choosePendingDecisionHard(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  decision: PendingDecision,
  legal: PlayerAction[],
  player: PlayerId,
  budget: SimBudget,
): PlayerAction | undefined {
  const candidates = legal.filter(
    (a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision",
  );
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  if (decision.kind === "mulligan") {
    // Nicht sinnvoll simulierbar (Neuziehen ist verdeckt-zufällig):
    // Kurven-Heuristik — 2-5 Terrains behalten, aber nie unter Handgröße 5
    // weitermulliganen (Kartennachteil wiegt schwerer als eine mäßige Kurve).
    const hand = state.players[decision.player].hand;
    const terrainCount = hand.filter((id) => {
      const card = state.cards[id];
      return card !== undefined && pool[card.definitionId]?.type === "terrain";
    }).length;
    const wantMulligan = decision.timesMulliganed < 2 && (terrainCount <= 1 || terrainCount > 5);
    return (
      candidates.find((a) => a.choice.kind === "mulligan" && a.choice.takeMulligan === wantMulligan) ?? candidates[0]
    );
  }

  if (decision.kind === "orderBlockers") {
    // getLegalActions liefert genau einen (gültigen) Kandidaten — bestätigen.
    return candidates[0];
  }

  // chooseMode / chooseTriggerTargets / künftige Decisions: jeden Kandidaten
  // simulieren und den mit der besten Bewertung wählen. Fallback bei
  // erschöpftem Budget: Heuristik wie im Rollout.
  let best: PlayerAction | undefined;
  let bestEval = -Infinity;
  for (const candidate of candidates) {
    const end = simulateToQuiescence(engine, pool, state, candidate, budget);
    if (!end) continue;
    const score = evaluateState(pool, end, player);
    if (score > bestEval) {
      bestEval = score;
      best = candidate;
    }
  }
  if (best) return best;
  return pickDecisionForSim(pool, state, decision, candidates);
}

// ---------------------------------------------------------------------------
// Cleanup-Abwurf
// ---------------------------------------------------------------------------

function chooseDiscardActionHard(pool: CardPool, state: GameState, player: PlayerId): PlayerAction {
  const hand = state.players[player].hand;
  const overflow = Math.max(0, hand.length - 7);
  const battlefieldTerrains = state.players[player].battlefield.filter((id) => {
    const card = state.cards[id];
    return card !== undefined && pool[card.definitionId]?.type === "terrain";
  }).length;

  const scored = hand
    .map((id) => ({ id, value: handCardValueHard(pool, state, id, battlefieldTerrains) }))
    .sort((a, b) => a.value - b.value);
  return { kind: "discardToHandSize", player, cardInstanceIds: scored.slice(0, overflow).map((s) => s.id) };
}

/**
 * Kontextsensitiver Handkarten-Wert: Terrains sind viel wert, solange die
 * eigene Mana-Basis klein ist, und fast wertlos ab 6 Terrains im Spiel;
 * Units nach Power+Toughness; Spells/Relics/Enchantments mittlere Priorität.
 */
function handCardValueHard(pool: CardPool, state: GameState, instanceId: InstanceId, battlefieldTerrains: number): number {
  const card = state.cards[instanceId];
  const def = card && pool[card.definitionId];
  if (!def) return 0;
  if (def.type === "terrain") return battlefieldTerrains >= 6 ? 0.5 : 2.5;
  if (def.type === "unit") return def.power + def.toughness;
  return 3;
}

// ---------------------------------------------------------------------------
// Cast/Activate per Lookahead
// ---------------------------------------------------------------------------

/** Steps VOR der eigenen Declare-Attackers-Entscheidung (wie simpleBot.ts). */
const PRE_COMBAT_OWN_STEPS = new Set<GameState["step"]>(["untap", "upkeep", "draw", "main1", "beginCombat"]);

/**
 * Dieselbe Bremse wie simpleBot.ts#wouldTapPotentialAttacker (docs/ai-status.md
 * Abschnitt 5 Fund 1), aber mit EFFEKTIVEN Keywords: tap-kostende
 * Nicht-Mana-Fähigkeiten potenzieller Angreifer nicht vor dem eigenen
 * declareAttackers verbrauchen. Nötig, weil die Board-Bewertung getappte und
 * ungetappte Units gleich bewertet — das Lookahead allein würde den
 * Angriffsverlust nicht sehen.
 */
function wouldTapPotentialAttackerHard(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  action: Extract<PlayerAction, { kind: "activateAbility" }>,
  ability: Ability | undefined,
): boolean {
  if (state.activePlayer !== player || !PRE_COMBAT_OWN_STEPS.has(state.step)) return false;
  if (!ability || ability.kind !== "activated") return false;
  if (!ability.additionalCosts?.some((c) => c.kind === "tap")) return false;

  const sourceCard = state.cards[action.sourceInstanceId];
  if (!sourceCard?.permanentState || sourceCard.permanentState.tapped) return false;
  if (pool[sourceCard.definitionId]?.type !== "unit") return false;
  if (sourceCard.permanentState.summoningSick && !hasEffectiveKeyword(pool, state, action.sourceInstanceId, "swift")) {
    return false;
  }
  return true;
}

function chooseBestCastOrActivateHard(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  legal: PlayerAction[],
  player: PlayerId,
  budget: SimBudget,
): PlayerAction | undefined {
  const candidates: Array<{ action: PlayerAction; staticScore: number }> = [];
  const manaAbilityCandidates: PlayerAction[] = [];

  for (const action of legal) {
    if (action.kind === "castSpell") {
      // Modale Kandidaten kommen laut getLegalActions-Vertrag OHNE
      // chosenMode/chosenTargets — roh eingereicht (auch in der Simulation)
      // lehnt applyAction sie ab; vorher wurden sie dadurch still verworfen
      // (Fund der Farb-Balance-Analyse, docs/ai-status.md Abschnitt 10).
      // Jetzt: engine-validierte Vervollständigungen erzeugen; jede einzelne
      // durchläuft anschließend das normale Lookahead.
      const modalCompletions = expandModalCandidate(engine, pool, state, action);
      if (modalCompletions !== undefined) {
        for (const completed of modalCompletions) {
          if (completed.kind !== "castSpell") continue;
          candidates.push({ action: completed, staticScore: staticCastScore(pool, state, player, completed) });
        }
        continue;
      }
      candidates.push({ action, staticScore: staticCastScore(pool, state, player, action) });
      continue;
    }
    if (action.kind === "activateAbility") {
      const sourceCard = state.cards[action.sourceInstanceId];
      const def = sourceCard && pool[sourceCard.definitionId];
      const abilities: Ability[] = def && "abilities" in def ? (def.abilities ?? []) : [];
      const ability = abilities[action.abilityIndex];
      if (ability?.kind === "activated" && ability.isManaAbility) {
        manaAbilityCandidates.push(action);
        continue;
      }
      if (wouldTapPotentialAttackerHard(pool, state, player, action, ability)) continue;
      // Modale Fähigkeiten: analog zu castSpell vervollständigen.
      const modalCompletions = expandModalCandidate(engine, pool, state, action);
      if (modalCompletions !== undefined) {
        for (const completed of modalCompletions) {
          if (completed.kind !== "activateAbility") continue;
          candidates.push({ action: completed, staticScore: staticActivateScore(pool, state, player, completed, ability) });
        }
        continue;
      }
      candidates.push({ action, staticScore: staticActivateScore(pool, state, player, action, ability) });
    }
  }

  // Anmerkung (beim Bauen per A/B-Serie verworfen): Eine "erst ALLE
  // Manaquellen tappen, dann entscheiden"-Regel (Kurven-Optimierung) hat den
  // Stärkevergleich gegen medium messbar VERSCHLECHTERT (29:20 vs. 32:17
  // über 49 Partien) — das inkrementelle v1-Muster (unten als Fallback)
  // castet im selben Fenster früher und farbsicherer. Daher bewusst beim
  // v1-Verhalten geblieben.
  const ownMain = state.activePlayer === player && (state.step === "main1" || state.step === "main2");

  if (candidates.length > 0) {
    candidates.sort((a, b) => b.staticScore - a.staticScore);
    const toSimulate = candidates.slice(0, MAX_SIMULATED_CANDIDATES);

    const baseline = evaluateState(pool, state, player);
    let best: PlayerAction | undefined;
    let bestEval = baseline + MIN_EVAL_GAIN;
    let simulatedAny = false;
    for (const { action } of toSimulate) {
      const end = simulateToQuiescence(engine, pool, state, action, budget);
      if (!end) continue;
      simulatedAny = true;
      const score = evaluateState(pool, end, player);
      if (score > bestEval) {
        bestEval = score;
        best = action;
      }
    }
    if (best) return best;
    if (!simulatedAny) {
      // Budget erschöpft, bevor irgendetwas simuliert werden konnte: statischer
      // Fallback wie v1 (bester vorsortierter Kandidat, wenn er nach v1-Maßstab
      // klar lohnend aussieht — Removal/Unit-Cast haben staticScore > 1).
      const top = candidates[0];
      if (top && top.staticScore > 1) return top.action;
    }
  }

  // Finaler Mana-Aufbau-Fallback (wie v1): Wenn kein Kandidat lohnt, aber die
  // Hand Nicht-Terrains enthält, weiter Manaquellen tappen — deckt auch den
  // Fall ab, dass der Pool zwar groß genug, aber farblich falsch gefüllt ist
  // (inkrementelles Tappen erfasst nach und nach alle Quellen).
  if (
    ownMain &&
    manaAbilityCandidates.length > 0 &&
    state.players[player].hand.some((id) => {
      const card = state.cards[id];
      return card !== undefined && pool[card.definitionId]?.type !== "terrain";
    })
  ) {
    return manaAbilityCandidates[0]!;
  }

  return undefined;
}

/** Statische Vorsortierung (nur Ranking vor der Simulation, kein Endurteil). */
function staticCastScore(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  action: Extract<PlayerAction, { kind: "castSpell" }>,
): number {
  const card = state.cards[action.cardInstanceId];
  const def = card && pool[card.definitionId];
  if (!def) return 0;
  const denom = Math.max(manaCostTotal("cost" in def ? def.cost : undefined), 1);
  if (def.type === "unit") return (def.power + def.toughness) / denom;
  if (def.type === "spell") {
    const removal = staticRemovalScore(pool, state, player, def.effects ?? [], action.chosenTargets);
    if (removal !== undefined) return 10 + removal / denom;
    return 1 / denom;
  }
  return 0.5 / denom;
}

function staticActivateScore(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  action: Extract<PlayerAction, { kind: "activateAbility" }>,
  ability: Ability | undefined,
): number {
  if (!ability || ability.kind !== "activated") return 0;
  const denom = Math.max(manaCostTotal(ability.manaCost), 1);
  const effects: Effect[] =
    action.chosenMode !== undefined ? (ability.modes?.[action.chosenMode]?.effects ?? []) : (ability.effects ?? []);
  const removal = staticRemovalScore(pool, state, player, effects, action.chosenTargets);
  if (removal !== undefined) return 10 + removal / denom;
  return 0.3 / denom;
}

function staticRemovalScore(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  effects: Effect[],
  chosenTargets: ChosenTarget[],
): number | undefined {
  if (!effects.some((e) => HARMFUL_EFFECT_KINDS.has(e.kind))) return undefined;
  const target = chosenTargets[0];
  if (!target || target.kind !== "permanent") return undefined;
  const targetCard = state.cards[target.instanceId];
  if (!targetCard || targetCard.controller === player) return undefined;
  if (pool[targetCard.definitionId]?.type !== "unit") return undefined;
  return unitValue(pool, state, target.instanceId);
}

// ---------------------------------------------------------------------------
// Kampf: Angreifer (Konstruktion aus einzeln validierten Kandidaten,
// Muster wie simpleBot.ts / docs/ai-status.md 3.1)
// ---------------------------------------------------------------------------

function chooseAttackActionHard(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  legal: PlayerAction[],
  player: PlayerId,
  budget: SimBudget,
): PlayerAction | undefined {
  const declareCandidates = legal.filter(
    (a): a is Extract<PlayerAction, { kind: "declareAttackers" }> => a.kind === "declareAttackers",
  );
  if (declareCandidates.length === 0) return undefined;

  const emptyCandidate: PlayerAction =
    declareCandidates.find((a) => a.attackers.length === 0) ?? { kind: "declareAttackers", player, attackers: [] };
  const singleAttackerIds = declareCandidates.filter((a) => a.attackers.length === 1).map((a) => a.attackers[0]!);
  if (singleAttackerIds.length === 0) return emptyCandidate;

  const opponent = otherPlayerId(player);
  const opponentBlockers = state.players[opponent].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    return pool[card.definitionId]?.type === "unit";
  });

  // Alpha-Strike-Erkennung: Der Gegner kann höchstens einen Angreifer pro
  // ungetapptem Blocker vollständig abfangen (konservativ: jeder Blocker
  // kann jeden Angreifer blocken und absorbiert dessen GESAMTE Power, kein
  // trample-Durchbruch eingerechnet). Blockt er die stärksten, kommt
  // mindestens die Restsumme durch — reicht die zum Sieg, greift alles an.
  const powers = singleAttackerIds
    .map((id) => Math.max(effectiveStats(pool, state, id).power, 0))
    .sort((a, b) => b - a);
  const minDamageThrough = powers.slice(opponentBlockers.length).reduce((sum, p) => sum + p, 0);
  if (minDamageThrough >= state.players[opponent].life) {
    return { kind: "declareAttackers", player, attackers: singleAttackerIds };
  }

  const heuristicSet = heuristicAttackerSet(pool, state, player, singleAttackerIds, opponentBlockers);

  // Kampf-Simulation: einige plausible Angreifer-Teilmengen werden mit ZWEI
  // Gegner-Modellen durchgespielt ("blockt gut" via chooseBlockActionHard aus
  // Gegnersicht vs. "blockt nur guardian-Pflichten") und der Mittelwert der
  // Bewertungen verglichen. Der Mittelwert ist bewusst KEIN Best-Response:
  // ein reines "Gegner blockt perfekt"-Modell würde Angriffe systematisch
  // entwerten und in dieselbe Kampf-Lähmung führen wie der v1-Fund
  // (docs/ai-status.md Abschnitt 5 Fund 1) — der No-Block-Zweig hält den
  // Wert von Face-Schaden im Spiel, der Good-Block-Zweig bestraft Angriffe,
  // die in gute Blocks laufen.
  const candidateSets: InstanceId[][] = [];
  const seen = new Set<string>();
  const addSet = (ids: InstanceId[]): void => {
    const key = [...ids].sort().join(",");
    if (seen.has(key)) return;
    seen.add(key);
    candidateSets.push(ids);
  };
  addSet(heuristicSet);
  addSet(singleAttackerIds);
  addSet([]);
  if (heuristicSet.length > 1) {
    const smallest = [...heuristicSet].sort((a, b) => unitValue(pool, state, a) - unitValue(pool, state, b))[0]!;
    addSet(heuristicSet.filter((id) => id !== smallest));
  }

  let bestSet: InstanceId[] | undefined;
  let bestScore = -Infinity;
  for (const set of candidateSets) {
    const scoreGoodBlocks = simulateCombatBranch(engine, pool, state, player, set, "bestBlocks", budget);
    const scoreNoBlocks = simulateCombatBranch(engine, pool, state, player, set, "guardianOnly", budget);
    if (scoreGoodBlocks === undefined || scoreNoBlocks === undefined) continue;
    const score = (scoreGoodBlocks + scoreNoBlocks) / 2;
    if (score > bestScore) {
      bestScore = score;
      bestSet = set;
    }
  }

  const chosen = bestSet ?? heuristicSet; // Fallback: Heuristik, falls Budget/Sim nicht reichte
  if (chosen.length === 0) return emptyCandidate;
  return { kind: "declareAttackers", player, attackers: chosen };
}

/**
 * Heuristische Basis-Angreifermenge (Kandidaten-Generator für die Simulation
 * und Fallback bei erschöpftem Budget):
 * - Kein Angreifer, den ein (1:1 reservierter) Blocker ohne Gegenwert töten
 *   würde (fightOutcome mit firstStrike/deathtouch, Reservierung wie v1 —
 *   docs/ai-status.md Abschnitt 5 Fund 1).
 * - Race-Bewusstsein: Könnte das GESAMTE gegnerische Board nächsten Zug
 *   tödlich zurückschlagen (dann ist alles ungetappt und nicht mehr
 *   summoning-sick), bleiben die zähesten Nicht-vigilant-Units als Blocker
 *   zu Hause. Bewusst NUR bei konkret drohendem Tod.
 */
function heuristicAttackerSet(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  singleAttackerIds: InstanceId[],
  opponentBlockers: InstanceId[],
): InstanceId[] {
  const opponent = otherPlayerId(player);
  const sortedAttackerIds = [...singleAttackerIds].sort(
    (a, b) => unitValue(pool, state, b) - unitValue(pool, state, a),
  );
  const availableBlockers = [...opponentBlockers];
  let chosen: InstanceId[] = [];
  for (const attackerId of sortedAttackerIds) {
    const threatIndex = findFreeKillBlockerIndex(pool, state, attackerId, availableBlockers);
    if (threatIndex !== -1) {
      availableBlockers.splice(threatIndex, 1);
      continue;
    }
    chosen.push(attackerId);
  }

  const opponentUnits = state.players[opponent].battlefield.filter((id) => {
    const card = state.cards[id];
    return card?.permanentState !== undefined && pool[card.definitionId]?.type === "unit";
  });
  const counterPower = opponentUnits.reduce((sum, id) => sum + Math.max(effectiveStats(pool, state, id).power, 0), 0);
  const life = state.players[player].life;
  if (counterPower >= life && opponentUnits.length > 0 && chosen.length > 0) {
    const avgAttack = counterPower / opponentUnits.length;
    const deficit = counterPower - life + 1;
    const blockersNeeded = Math.ceil(deficit / Math.max(avgAttack, 1));
    const holdBackOrder = [...chosen]
      .filter((id) => !hasEffectiveKeyword(pool, state, id, "vigilant"))
      .sort((a, b) => effectiveStats(pool, state, b).toughness - effectiveStats(pool, state, a).toughness);
    const heldBack = new Set<InstanceId>(holdBackOrder.slice(0, Math.max(blockersNeeded, 0)));
    chosen = chosen.filter((id) => !heldBack.has(id));
  }
  return chosen;
}

/**
 * Simuliert einen kompletten Kampf ab `declareAttackers` bis zum Beginn von
 * endCombat/main2 (Blocks des Gegners nach `blockMode`, Trigger-Decisions
 * per Rollout-Heuristik, Priority wird immer gepasst) und bewertet den
 * Endzustand aus Sicht von `player`. undefined bei erschöpftem Budget vor
 * dem ersten Schritt oder abgelehnter Aktion (Kandidat dann unbewertbar).
 */
function simulateCombatBranch(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  attackers: InstanceId[],
  blockMode: "bestBlocks" | "guardianOnly",
  budget: SimBudget,
): number | undefined {
  if (budget.remaining <= 0) return undefined;
  budget.remaining -= 1;
  const first = safeApplyForSim(engine, state, { kind: "declareAttackers", player, attackers });
  if (first.error) return undefined;
  let current = first.state;
  const opponent = otherPlayerId(player);

  for (let i = 0; i < 60; i++) {
    if (current.winner !== undefined) break;
    if (current.step === "endCombat" || current.step === "main2") break;

    if (current.pendingDecision) {
      const decision = current.pendingDecision;
      const candidates = engine
        .getLegalActions(current, decision.player)
        .filter((a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision");
      if (candidates.length === 0) break;
      const pick = pickDecisionForSim(pool, current, decision, candidates);
      if (budget.remaining <= 0) break;
      budget.remaining -= 1;
      const result = safeApplyForSim(engine, current, pick);
      if (result.error) break;
      current = result.state;
      continue;
    }

    if (current.step === "declareBlockers" && current.priorityPlayer === undefined) {
      const blockAction =
        blockMode === "bestBlocks"
          ? heuristicBlockAction(pool, current, opponent)
          : guardianOnlyBlockAction(pool, current, opponent);
      if (budget.remaining <= 0) break;
      budget.remaining -= 1;
      const result = engine.applyAction(current, blockAction);
      if (result.error) return undefined; // Blockmodell illegal -> Kandidat nicht bewertbar
      current = result.state;
      continue;
    }

    if (current.priorityPlayer !== undefined) {
      if (budget.remaining <= 0) break;
      budget.remaining -= 1;
      const result = safeApplyForSim(engine, current, { kind: "passPriority", player: current.priorityPlayer });
      if (result.error) break;
      current = result.state;
      continue;
    }

    break; // nichts mehr zu tun (defensiv)
  }
  return evaluateState(pool, current, player);
}

/** Index des ersten verfügbaren Blockers, der den Angreifer ohne Gegenwert töten würde (-1 falls keiner). */
function findFreeKillBlockerIndex(
  pool: CardPool,
  state: GameState,
  attackerId: InstanceId,
  availableBlockers: InstanceId[],
): number {
  const attackerAirborne = hasEffectiveKeyword(pool, state, attackerId, "airborne");
  for (let i = 0; i < availableBlockers.length; i++) {
    const blockerId = availableBlockers[i]!;
    if (attackerAirborne) {
      const canBlockAir =
        hasEffectiveKeyword(pool, state, blockerId, "airborne") || hasEffectiveKeyword(pool, state, blockerId, "reach");
      if (!canBlockAir) continue;
    }
    const outcome = fightOutcome(pool, state, attackerId, blockerId);
    if (outcome.attackerDies && !outcome.blockerDies) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Kampf: Blocker (eigene Konstruktion aus GameState, docs/ai-status.md 3.1;
// Restrisiko-Reduktion ggü. v1: effektive Keywords inkl. statischer Grants)
// ---------------------------------------------------------------------------

/**
 * Blockwahl per Kampf-Simulation: mehrere plausible Zuordnungs-Kandidaten
 * (Heuristik, Nur-Pflichten, Aggressiv, Gang-Block auf den größten
 * ungeblockten Angreifer) werden komplett durchgespielt (Schadensrunden,
 * Trigger, SBAs) und der Kandidat mit der besten Ergebnis-Bewertung gewählt.
 * Fallback bei erschöpftem Budget: die reine Heuristik.
 */
function chooseBlockActionHard(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  budget: SimBudget,
): PlayerAction {
  const heuristic = heuristicBlockAction(pool, state, player);
  const candidates: PlayerAction[] = [heuristic];
  const seen = new Set<string>([blocksKey(heuristic)]);
  const addCandidate = (action: PlayerAction): void => {
    const key = blocksKey(action);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(action);
  };
  addCandidate(guardianOnlyBlockAction(pool, state, player));
  addCandidate(aggressiveBlockAction(pool, state, player));
  const gang = gangBlockAction(pool, state, player, heuristic);
  if (gang) addCandidate(gang);

  let best: PlayerAction | undefined;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const score = simulateBlockBranch(engine, pool, state, player, candidate, budget);
    if (score === undefined) continue;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best ?? heuristic;
}

function blocksKey(action: PlayerAction): string {
  if (action.kind !== "declareBlockers") return "";
  return action.blocks
    .map((b) => `${b.blocker}>${b.attacker}`)
    .sort()
    .join(",");
}

/**
 * Simuliert eine Block-Deklaration bis endCombat/main2 (orderBlockers wählt
 * der ANGREIFER — im Rollout der erste Kandidat = Deklarationsreihenfolge)
 * und bewertet den Endzustand aus Verteidigersicht.
 */
function simulateBlockBranch(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  blockAction: PlayerAction,
  budget: SimBudget,
): number | undefined {
  if (budget.remaining <= 0) return undefined;
  budget.remaining -= 1;
  const first = safeApplyForSim(engine, state, blockAction);
  if (first.error) return undefined;
  let current = first.state;

  for (let i = 0; i < 60; i++) {
    if (current.winner !== undefined) break;
    if (current.step === "endCombat" || current.step === "main2") break;

    if (current.pendingDecision) {
      const decision = current.pendingDecision;
      const decisionCandidates = engine
        .getLegalActions(current, decision.player)
        .filter((a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision");
      if (decisionCandidates.length === 0) break;
      const pick = pickDecisionForSim(pool, current, decision, decisionCandidates);
      if (budget.remaining <= 0) break;
      budget.remaining -= 1;
      const result = safeApplyForSim(engine, current, pick);
      if (result.error) break;
      current = result.state;
      continue;
    }

    if (current.priorityPlayer !== undefined) {
      if (budget.remaining <= 0) break;
      budget.remaining -= 1;
      const result = safeApplyForSim(engine, current, { kind: "passPriority", player: current.priorityPlayer });
      if (result.error) break;
      current = result.state;
      continue;
    }

    break;
  }
  return evaluateState(pool, current, player);
}

/**
 * Aggressiver Kandidat: JEDE verfügbare Unit blockt ihren besten Angreifer
 * (nach blockDesirability, inkl. unvorteilhafter Blocks) — die Simulation
 * entscheidet, ob sich das gegen den konkreten Angriff lohnt.
 */
function aggressiveBlockAction(pool: CardPool, state: GameState, player: PlayerId): PlayerAction {
  const attackerIds = state.players[state.activePlayer].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );
  const ownUnits = state.players[player].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    return pool[card.definitionId]?.type === "unit";
  });

  const blocks: Array<{ blocker: InstanceId; attacker: InstanceId }> = [];
  const blockedAttackers = new Set<InstanceId>();
  for (const unit of ownUnits) {
    const options = attackerIds.filter((a) => canBlockPairEffective(pool, state, unit, a));
    if (options.length === 0) continue;
    // Ungeblockte Angreifer bevorzugen (Schadensverteilung), dann Ranking.
    const best = [...options].sort((a, b) => {
      const aUnblocked = blockedAttackers.has(a) ? 0 : 1;
      const bUnblocked = blockedAttackers.has(b) ? 0 : 1;
      if (aUnblocked !== bUnblocked) return bUnblocked - aUnblocked;
      return blockDesirability(pool, state, unit, b) - blockDesirability(pool, state, unit, a);
    })[0]!;
    blocks.push({ blocker: unit, attacker: best });
    blockedAttackers.add(best);
  }
  return { kind: "declareBlockers", player, blocks };
}

/**
 * Gang-Block-Kandidat: Heuristik-Blocks plus ZWEI zusätzliche Blocker auf den
 * wertvollsten noch ungeblockten Angreifer, sofern ihre gemeinsame Power ihn
 * tötet (bzw. einer deathtouch hat). undefined, wenn kein solches Paar
 * existiert.
 */
function gangBlockAction(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  heuristic: PlayerAction,
): PlayerAction | undefined {
  if (heuristic.kind !== "declareBlockers") return undefined;
  const usedBlockers = new Set(heuristic.blocks.map((b) => b.blocker));
  const blockedAttackers = new Set(heuristic.blocks.map((b) => b.attacker));

  const attackerIds = state.players[state.activePlayer].battlefield
    .filter((id) => state.cards[id]?.permanentState?.combat?.role === "attacker")
    .filter((id) => !blockedAttackers.has(id))
    .sort((a, b) => unitValue(pool, state, b) - unitValue(pool, state, a));
  const freeUnits = state.players[player].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    if (usedBlockers.has(id)) return false;
    return pool[card.definitionId]?.type === "unit";
  });

  for (const attackerId of attackerIds) {
    const legalBlockers = freeUnits.filter((id) => canBlockPairEffective(pool, state, id, attackerId));
    if (legalBlockers.length < 2) continue;
    const attackerTough =
      effectiveStats(pool, state, attackerId).toughness - (state.cards[attackerId]?.permanentState?.damageMarked ?? 0);
    // Die zwei stärksten legalen Blocker kombinieren.
    const pair = [...legalBlockers]
      .sort((a, b) => effectiveStats(pool, state, b).power - effectiveStats(pool, state, a).power)
      .slice(0, 2);
    const combinedPower = pair.reduce((sum, id) => sum + Math.max(effectiveStats(pool, state, id).power, 0), 0);
    const hasDeathtouch = pair.some((id) => hasEffectiveKeyword(pool, state, id, "deathtouch"));
    if (combinedPower < attackerTough && !hasDeathtouch) continue;
    return {
      kind: "declareBlockers",
      player,
      blocks: [...heuristic.blocks, ...pair.map((blocker) => ({ blocker, attacker: attackerId }))],
    };
  }
  return undefined;
}

/**
 * Heuristische Block-Zuordnung (Kandidaten-Generator, Fallback und
 * Gegner-Modell "blockt gut" in der Angriffs-Simulation — bewusst OHNE
 * eigene Simulation, sonst Rekursion).
 */
function heuristicBlockAction(pool: CardPool, state: GameState, player: PlayerId): PlayerAction {
  const attackerIds = state.players[state.activePlayer].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );
  const ownUnits = state.players[player].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    return pool[card.definitionId]?.type === "unit";
  });

  const blocks: Array<{ blocker: InstanceId; attacker: InstanceId }> = [];
  const usedBlockers = new Set<InstanceId>();
  const blockedAttackers = new Map<InstanceId, InstanceId[]>();

  const assign = (blocker: InstanceId, attacker: InstanceId): void => {
    blocks.push({ blocker, attacker });
    usedBlockers.add(blocker);
    blockedAttackers.set(attacker, [...(blockedAttackers.get(attacker) ?? []), blocker]);
  };

  // 1. guardian-Pflichten (effektive Keywords) — bester Block je guardian.
  for (const unit of ownUnits) {
    if (!hasEffectiveKeyword(pool, state, unit, "guardian")) continue;
    const options = attackerIds.filter((a) => canBlockPairEffective(pool, state, unit, a));
    if (options.length === 0) continue;
    const best = [...options].sort((a, b) => blockDesirability(pool, state, unit, b) - blockDesirability(pool, state, unit, a))[0]!;
    assign(unit, best);
  }

  // Erwarteter Durchbruch-Schaden bei aktueller Zuordnung.
  const projectedDamage = (): number =>
    attackerIds.reduce((sum, attackerId) => sum + damageThrough(pool, state, attackerId, blockedAttackers.get(attackerId) ?? []), 0);

  const life = state.players[player].life;

  // 2. Wertvolle Blocks (Free-Kill oder guter Tausch) — immer sinnvoll,
  // größte Angreifer zuerst.
  const attackersByThreat = [...attackerIds].sort((a, b) => unitValue(pool, state, b) - unitValue(pool, state, a));
  for (const attackerId of attackersByThreat) {
    if ((blockedAttackers.get(attackerId) ?? []).length > 0) continue;
    let bestBlocker: InstanceId | undefined;
    let bestScore = 0;
    for (const unit of ownUnits) {
      if (usedBlockers.has(unit)) continue;
      if (!canBlockPairEffective(pool, state, unit, attackerId)) continue;
      const score = favorableBlockScore(pool, state, unit, attackerId);
      if (score > bestScore) {
        bestScore = score;
        bestBlocker = unit;
      }
    }
    if (bestBlocker !== undefined) assign(bestBlocker, attackerId);
  }

  // 3. Überlebens-Blocks: Droht der Durchbruch-Schaden tödlich (oder fast
  // tödlich) zu sein, auch ungünstige Chump-Blocks setzen — trample-bewusst
  // (Chump gegen trample reduziert nur um die letale Menge des Blockers).
  if (projectedDamage() >= life) {
    for (const attackerId of attackersByThreat) {
      if (projectedDamage() < life) break;
      if ((blockedAttackers.get(attackerId) ?? []).length > 0) continue;
      const chump = ownUnits.find((unit) => !usedBlockers.has(unit) && canBlockPairEffective(pool, state, unit, attackerId));
      if (chump !== undefined) assign(chump, attackerId);
    }
  }

  return { kind: "declareBlockers", player, blocks };
}

/**
 * Minimal-Blockaktion, die nur die guardian-Pflichten erfüllt (Gegner-Modell
 * "blockt praktisch nicht" für die Kampf-Simulation) — leere Blocks wären
 * bei aktiver guardian-Pflicht illegal und würden den Sim-Zweig zerstören.
 */
function guardianOnlyBlockAction(pool: CardPool, state: GameState, player: PlayerId): PlayerAction {
  const attackerIds = state.players[state.activePlayer].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );
  const blocks: Array<{ blocker: InstanceId; attacker: InstanceId }> = [];
  for (const unit of state.players[player].battlefield) {
    const card = state.cards[unit];
    if (!card?.permanentState || card.permanentState.tapped) continue;
    if (pool[card.definitionId]?.type !== "unit") continue;
    if (!hasEffectiveKeyword(pool, state, unit, "guardian")) continue;
    const options = attackerIds.filter((a) => canBlockPairEffective(pool, state, unit, a));
    if (options.length === 0) continue;
    const best = [...options].sort(
      (a, b) => blockDesirability(pool, state, unit, b) - blockDesirability(pool, state, unit, a),
    )[0]!;
    blocks.push({ blocker: unit, attacker: best });
  }
  return { kind: "declareBlockers", player, blocks };
}

/**
 * Schaden, der trotz zugeordneter Blocker beim Verteidiger ankommt:
 * ungeblockt = volle Power; geblockt ohne trample = 0; geblockt mit trample =
 * Power minus letale Mengen der Blocker (deathtouch: 1 pro Blocker).
 */
function damageThrough(pool: CardPool, state: GameState, attackerId: InstanceId, blockers: InstanceId[]): number {
  const power = Math.max(effectiveStats(pool, state, attackerId).power, 0);
  if (blockers.length === 0) return power;
  if (!hasEffectiveKeyword(pool, state, attackerId, "trample")) return 0;
  const attackerDeathtouch = hasEffectiveKeyword(pool, state, attackerId, "deathtouch");
  let absorbed = 0;
  for (const blockerId of blockers) {
    if (attackerDeathtouch) {
      absorbed += 1;
      continue;
    }
    const card = state.cards[blockerId];
    const remaining = effectiveStats(pool, state, blockerId).toughness - (card?.permanentState?.damageMarked ?? 0);
    absorbed += Math.max(remaining, 1);
  }
  return Math.max(power - absorbed, 0);
}

/**
 * Wert eines FREIWILLIGEN Blocks (0 = nicht blocken):
 * - Free-Kill (Angreifer stirbt, Blocker überlebt): sehr gut.
 * - Beidseitiger Tod: nur bei Tausch nach oben (Angreifer-Wert >= Blocker-Wert).
 * - Überlebens-Block (beide überleben): kostenloser Schadensfänger — Blocker
 *   tappt nicht und heilt im Cleanup; in diesem Regelwerk gibt es kein
 *   Instant-Speed-Gegenspiel, das den Block bestrafen könnte. Nur sinnvoll,
 *   wenn tatsächlich Schaden absorbiert wird (trample-bewusst).
 * - Reines Chumpen: kein freiwilliger Block (übernimmt Stufe 3 bei Lebensgefahr).
 */
function favorableBlockScore(pool: CardPool, state: GameState, blockerId: InstanceId, attackerId: InstanceId): number {
  const outcome = fightOutcome(pool, state, attackerId, blockerId);
  const attackerValue = unitValue(pool, state, attackerId);
  const blockerValue = unitValue(pool, state, blockerId);
  if (outcome.attackerDies && !outcome.blockerDies) return 100 + attackerValue;
  if (outcome.attackerDies && outcome.blockerDies && attackerValue >= blockerValue) {
    return 10 + (attackerValue - blockerValue);
  }
  if (!outcome.attackerDies && !outcome.blockerDies) {
    const attackerPower = Math.max(effectiveStats(pool, state, attackerId).power, 0);
    const absorbed = attackerPower - damageThrough(pool, state, attackerId, [blockerId]);
    if (absorbed >= 1) return 1 + absorbed * 0.5;
  }
  return 0;
}

/** Ranking der Angreifer-Optionen für eine PFLICHT-blockende guardian-Unit. */
function blockDesirability(pool: CardPool, state: GameState, blockerId: InstanceId, attackerId: InstanceId): number {
  const favorable = favorableBlockScore(pool, state, blockerId, attackerId);
  if (favorable > 0) return favorable;
  const outcome = fightOutcome(pool, state, attackerId, blockerId);
  // Muss ohnehin blocken: lieber überleben als sterben, lieber viel Schaden
  // abfangen als wenig.
  const survives = outcome.blockerDies ? 0 : 5;
  return survives + Math.max(effectiveStats(pool, state, attackerId).power, 0) * 0.1;
}
