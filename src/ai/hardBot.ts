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
 * 4. LETHAL-CHECK (siehe Abschnitt "Lethal-Check" unten): Das 1-Ply-Lookahead
 *    bewertet jeden Cast-/Activate-/Attack-Kandidaten NUR isoliert und
 *    vergleicht die resultierenden Einzel-Bewertungen — ein Direktschaden-
 *    Zauber aufs gegnerische Gesicht sieht darin oft schwächer aus als eine
 *    größere Kreatur zu spielen (unitValue ist mit 2.2 gewichtet, ein
 *    Lebenspunkt nur mit 1.0), obwohl BEIDE Aktionen zusammen mit einem
 *    Alpha-Strike diesen Zug siegen würden. Bevor die normale 1-Ply-Wahl
 *    greift, prüft ein billiger, gezielter Sonderfall genau diese
 *    Kombination: "alles rein" (Alpha-Strike + alle bezahlbaren
 *    Face-Damage-Zauber/-Fähigkeiten dieses Zugs) — findet er eine wirklich
 *    tödliche Reihenfolge, wird deren nächster Schritt bevorzugt gespielt.
 * 5. MANA-ZURÜCKHALTEN (siehe chooseBestCastOrActivateHard, Funktion
 *    shouldHoldManaBack): Im eigenen Main-Phase-Fenster tappt der Bot nicht
 *    blind jede verfügbare Manaquelle für eine nur marginal wertvolle
 *    Cast-/Activate-Option — hat er eine bezahlbare, "typischerweise
 *    reaktive" fast-Karte (Removal/Direktschaden) auf der Hand UND würde das
 *    nächste Tappen genau diese Karte für später (gegnerischer Zug,
 *    Zugende) unbezahlbar machen, wird die marginale Option übersprungen
 *    (Terrains bleiben ungetappt). Kartenpool-Fakt: 62 von 72 Spells sind
 *    "fast" (jederzeit bei Priorität castbar) — Mana-Zurückhalten für
 *    reaktive Plays ist damit ein spielerisch relevanter Mechanismus.
 * 6. 2-PLY GEGEN BILLIGE GEGENANTWORT (siehe evaluateCastCandidateEnd): Die
 *    bereits vorhandene Top-K-Shortlist (toSimulate) wird nicht mehr nur
 *    isoliert (1-Ply) bewertet — hat NACH dem eigenen simulierten Zug
 *    tatsächlich der GEGNER Priorität (typischer Fall: eine eigene reaktive
 *    fast-Karte im gegnerischen Zug), wird zusätzlich EINE billige,
 *    heuristisch plausible Gegenantwort (Gegners statisch bester Cast/
 *    Activate ODER Passen — KEIN eigenes Lookahead, KEINE Suche über alle
 *    gegnerischen Optionen) durchsimuliert und der für uns SCHLECHTERE der
 *    beiden Ausgänge verwendet. Kein rekursiver Baum: Kosten bleiben bei
 *    ca. K × (1-2) statt K × N (N = alle gegnerischen legalen Aktionen).
 *
 * PERFORMANCE-BUDGET (UI darf nicht einfrieren): pro chooseActionHard-Aufruf
 * werden höchstens MAX_SIMULATED_ACTIONS applyAction-Simulationen verbraucht
 * (structuredClone-basiert, siehe Engine); Kandidaten werden vorab statisch
 * vorsortiert und auf MAX_SIMULATED_CANDIDATES begrenzt. Ist das Budget
 * erschöpft, fällt die Wahl auf die statische Vorsortierung zurück (nie auf
 * eine illegale Aktion). Der 2-Ply-Gegenantwort-Zweig (Punkt 6) hat einen
 * eigenen Mindest-Restbudget-Schwellwert (CAST_REPLY_MIN_BUDGET), unterhalb
 * dessen er gar nicht erst versucht wird — er darf das Budget für die
 * restlichen Kandidaten sowie Angriffs-/Block-Simulation nicht aushungern.
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
  TargetSpec,
} from "../model";
import {
  abilitiesOf,
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
/** Max. Top-Level-Aktionen EINER Lethal-Plan-Probe (siehe Abschnitt "Lethal-Check"). */
const LETHAL_MAX_PLAN_STEPS = 24;
/** Unter diesem Rest-Budget wird der Lethal-Check gar nicht erst versucht (spart ihn fürs 1-Ply-Fallback auf). */
const LETHAL_MIN_BUDGET = 30;
/** Marginal-Schwelle (Aufgabe "Mana-zurückhalten"): unterhalb dieses Eval-Gewinns wird eine Cast-/Activate-Option zugunsten offenen Manas übersprungen. */
const MANA_HOLD_BACK_GAIN_CEILING = 1.0;
/** Unter diesem Rest-Budget wird der 2-Ply-Gegenantwort-Zweig (siehe evaluateCastCandidateEnd) gar nicht erst versucht. */
const CAST_REPLY_MIN_BUDGET = 20;

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

  // 2.5 Lethal-Check (siehe Abschnitt "Lethal-Check" unten): Gibt es einen
  // billig geprüften "Alles-rein"-Plan (Alpha-Strike + alle bezahlbaren
  // Face-Damage-Zauber/-Fähigkeiten), der den Gegner DIESEN Zug auf <= 0
  // Leben bringt? Falls ja, dessen nächsten Schritt bevorzugen — sticht die
  // normale isolierte 1-Ply-Wahl unten (die einen offensichtlichen Kill
  // übersehen kann, siehe Moduldoku Punkt 4).
  const lethalAction = findLethalAction(engine, pool, state, legal, player, budget);
  if (lethalAction) return lethalAction;

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

  // Mana-Zurückhalten (Moduldoku Punkt 5, Funktion shouldHoldManaBack): true
  // heißt "das nächste Tappen JETZT würde eine bezahlbare reaktive fast-Karte
  // auf der Hand für später unbezahlbar machen" — gilt nur im eigenen
  // Main-Phase-Fenster (im reaktiven Fenster selbst soll ganz normal
  // gecastet/aktiviert werden).
  const holdBack = shouldHoldManaBack(pool, state, player, ownMain);

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
      // 2-Ply gegen billige Gegenantwort (Moduldoku Punkt 6) statt reinem
      // 1-Ply evaluateState(end) — s. evaluateCastCandidateEnd.
      const score = evaluateCastCandidateEnd(engine, pool, end, player, budget);
      if (score > bestEval) {
        bestEval = score;
        best = action;
      }
    }
    if (best) {
      // Mana-Zurückhalten: nur eine WIRKLICH marginale eigene Option wird zu
      // Gunsten offenen Manas übersprungen (s. shouldHoldManaBack) — ein
      // klar lohnender Kandidat wird immer gespielt, "gelegentlich" bezieht
      // sich also auf schwache Optionen, nicht auf jede Gelegenheit.
      if (!(holdBack && bestEval - baseline < MANA_HOLD_BACK_GAIN_CEILING)) return best;
    }
    if (!simulatedAny) {
      // Budget erschöpft, bevor irgendetwas simuliert werden konnte: statischer
      // Fallback wie v1 (bester vorsortierter Kandidat, wenn er nach v1-Maßstab
      // klar lohnend aussieht — Removal/Unit-Cast haben staticScore > 1).
      const top = candidates[0];
      if (top && top.staticScore > 1 && !holdBack) return top.action;
    }
  }

  // Finaler Mana-Aufbau-Fallback (wie v1): Wenn kein Kandidat lohnt, aber die
  // Hand Nicht-Terrains enthält, weiter Manaquellen tappen — deckt auch den
  // Fall ab, dass der Pool zwar groß genug, aber farblich falsch gefüllt ist
  // (inkrementelles Tappen erfasst nach und nach alle Quellen). Mana-
  // Zurückhalten (holdBack) unterdrückt genau DIESEN proaktiven Tap-Schritt
  // — das ist der Mechanismus, der Terrains tatsächlich ungetappt lässt
  // (bereits getappte/im Pool liegende Mana ist ohnehin verloren, sobald der
  // Step endet, s. shouldHoldManaBack-Doku).
  if (
    ownMain &&
    !holdBack &&
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
// Mana-Zurückhalten (Moduldoku Punkt 5): eigenes Main-Phase-Fenster hält
// gelegentlich Manaquellen ungetappt, um im gegnerischen Zug (oder am
// eigenen Zugende) auf eine "fast"-Karte reagieren zu können, statt jede
// marginale eigene Option sofort zu spielen.
// ---------------------------------------------------------------------------
//
// Engine-Fakt (rules-engine.md 1, s. src/engine/util.ts#clearAllManaPools):
// "Der Manapool leert sich am Ende jedes Steps und jeder Phase" — bereits
// GETAPPTE Manaquellen (bzw. bereits im Pool liegendes Mana) sind beim
// nächsten Schritt ohnehin verloren, ob sie diesen Step noch für eine
// marginale eigene Option ausgegeben werden oder nicht. Der einzige Hebel,
// der eine Manaquelle tatsächlich für SPÄTER (gegnerischer Zug, eigenes
// Zugende) verfügbar hält, ist deshalb, sie JETZT NICHT zu tappen — d.h.
// den proaktiven "Finalen Mana-Aufbau-Fallback" (unten in
// chooseBestCastOrActivateHard) für eine schwache Gelegenheit zu
// unterdrücken. shouldHoldManaBack gate't zusätzlich das Casten einer
// selbst nur marginal wertvollen Option (Kartenvorteil: die Karte bleibt
// verfügbar, statt auf ein schwaches Ziel verschwendet zu werden).

/** Ist `definitionId` eine "typischerweise reaktive" fast-Karte (Removal/Direktschaden — dieselben Effekt-Arten wie HARMFUL_EFFECT_KINDS)? Rein strukturell, wie die Lethal-Check-Vorfilter unten. */
function isTypicallyReactiveHandCard(pool: CardPool, definitionId: string): boolean {
  const def = pool[definitionId];
  if (!def || def.type !== "spell" || def.speed !== "fast") return false;
  const modes = cardEffectModes(pool, definitionId);
  if (!modes) return false;
  return modes.some(({ effects }) => effects.some((e) => HARMFUL_EFFECT_KINDS.has(e.kind)));
}

/** Anzahl UNGETAPPTER eigener Permanents mit Mana-Fähigkeit (nicht farbgenau — bewusst grob, wie der Rest des Moduls). */
function untappedManaSourceCount(pool: CardPool, state: GameState, player: PlayerId): number {
  let count = 0;
  for (const instanceId of state.players[player].battlefield) {
    const card = state.cards[instanceId];
    if (!card?.permanentState || card.permanentState.tapped) continue;
    if (abilitiesOf(pool, state, instanceId).some((a) => a.kind === "activated" && a.isManaAbility)) count += 1;
  }
  return count;
}

/**
 * true, wenn der Bot GENAU noch so viele ungetappte Manaquellen hat, wie
 * eine bezahlbare, typischerweise reaktive fast-Karte auf der Hand kostet —
 * jedes weitere Tappen JETZT würde diese Karte für später unbezahlbar
 * machen. Bewusst NUR dieser exakte Grenzfall (nicht "immer, wenn
 * irgendeine reaktive Karte auf der Hand liegt"): reichlich Restmana bleibt
 * unangetastet nutzbar; ist die Karte ohnehin unbezahlbar (zu wenige Quellen
 * insgesamt), lohnt Zurückhalten nicht. Nur im EIGENEN Main-Phase-Fenster
 * relevant (ownMain) — im reaktiven Fenster selbst soll der Bot ganz normal
 * spielen (das übernimmt weiterhin die normale 1-Ply/2-Ply-Wahl oben).
 */
function shouldHoldManaBack(pool: CardPool, state: GameState, player: PlayerId, ownMain: boolean): boolean {
  if (!ownMain) return false;
  const untapped = untappedManaSourceCount(pool, state, player);
  if (untapped <= 0) return false;
  return state.players[player].hand.some((instanceId) => {
    const card = state.cards[instanceId];
    if (!card || !isTypicallyReactiveHandCard(pool, card.definitionId)) return false;
    const def = pool[card.definitionId];
    const cost = def && "cost" in def ? manaCostTotal(def.cost) : 0;
    return cost > 0 && cost === untapped;
  });
}

// ---------------------------------------------------------------------------
// 2-Ply gegen billige Gegenantwort (Moduldoku Punkt 6): erweitert die
// Top-K-Shortlist-Bewertung in chooseBestCastOrActivateHard um EINE billige
// Gegenantwort, statt jeden Kandidaten nur isoliert (1-Ply) zu bewerten.
// ---------------------------------------------------------------------------

/**
 * Billige "Gegenantwort"-Kandidaten für evaluateCastCandidateEnd: KEINE
 * Suche über alle gegnerischen Optionen — nur zwei plausible, billig
 * bestimmbare Antworten: "passen" (Status quo) und "die statisch beste
 * eigene Cast-/Activate-Option casten" (dieselbe staticCastScore/
 * staticActivateScore-Vorsortierung wie oben, hier aus GEGNERSICHT — KEIN
 * eigenes Lookahead für die Gegenantwort selbst, das wäre bereits die teure
 * rekursive Suche, die dieser Mittelweg vermeiden soll).
 */
function opponentCheapResponseCandidates(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  opponent: PlayerId,
): PlayerAction[] {
  const legal = engine.getLegalActions(state, opponent);
  const responses: PlayerAction[] = [];
  const passAction = legal.find((a) => a.kind === "passPriority");
  if (passAction) responses.push(passAction);

  let best: PlayerAction | undefined;
  let bestScore = -Infinity;
  for (const action of legal) {
    if (action.kind === "castSpell") {
      const options = expandModalCandidate(engine, pool, state, action) ?? [action];
      for (const option of options) {
        if (option.kind !== "castSpell") continue;
        const score = staticCastScore(pool, state, opponent, option);
        if (score > bestScore) {
          bestScore = score;
          best = option;
        }
      }
      continue;
    }
    if (action.kind === "activateAbility") {
      const ability = abilitiesOf(pool, state, action.sourceInstanceId)[action.abilityIndex];
      if (ability?.kind === "activated" && ability.isManaAbility) continue;
      const options = expandModalCandidate(engine, pool, state, action) ?? [action];
      for (const option of options) {
        if (option.kind !== "activateAbility") continue;
        const score = staticActivateScore(pool, state, opponent, option, ability);
        if (score > bestScore) {
          bestScore = score;
          best = option;
        }
      }
    }
  }
  if (best) responses.push(best);
  return responses;
}

/**
 * Bewertet den Endzustand NACH dem eigenen simulierten Cast-/Activate-
 * Kandidaten (siehe Moduldoku Punkt 6). Hat nach der eigenen Aktion
 * (Stack-Abwicklung bis zur Ruhe) tatsächlich der GEGNER Priorität —
 * typischer Fall: eine eigene reaktive fast-Karte im gegnerischen Zug, nach
 * deren Auflösung die Priorität wieder an den (aktiven) Gegner zurückfällt —
 * wird zusätzlich EINE der billigen Gegenantworten (s.
 * opponentCheapResponseCandidates) durchsimuliert und der für uns
 * SCHLECHTERE der geprüften Ausgänge zurückgegeben (der Gegner sucht sich
 * unter den paar billig geprüften Antworten die für uns ungünstigste aus —
 * kein Best-Response-Beweis, nur eine billige Näherung). In allen anderen
 * Fällen (eigene Priorität — der Normalfall im eigenen Main-Phase-Fenster,
 * Sieg/Niederlage bereits entschieden, Budget zu knapp, keine
 * Antwortkandidaten) bleibt es beim reinen 1-Ply-Ergebnis.
 */
function evaluateCastCandidateEnd(
  engine: RulesEngine,
  pool: CardPool,
  end: GameState,
  player: PlayerId,
  budget: SimBudget,
): number {
  const base = evaluateState(pool, end, player);
  const opponent = otherPlayerId(player);
  if (end.winner !== undefined || end.priorityPlayer !== opponent || budget.remaining < CAST_REPLY_MIN_BUDGET) {
    return base;
  }
  const responses = opponentCheapResponseCandidates(engine, pool, end, opponent);
  if (responses.length === 0) return base;

  let worst = base; // Fallback bleibt der 1-Ply-Wert, falls keine Antwort simulierbar ist.
  let anySimulated = false;
  for (const response of responses) {
    if (budget.remaining <= 0) break;
    const after = simulateToQuiescence(engine, pool, end, response, budget);
    if (!after) continue;
    const score = evaluateState(pool, after, player);
    if (!anySimulated || score < worst) worst = score;
    anySimulated = true;
  }
  return worst;
}

// ---------------------------------------------------------------------------
// Lethal-Check: "Alles-rein"-Pläne (Alpha-Strike + Face-Damage) billig prüfen
// ---------------------------------------------------------------------------
//
// Motivation (Moduldoku Punkt 4): Das normale 1-Ply-Lookahead bewertet jeden
// Cast-/Activate-/Attack-Kandidaten NUR isoliert. Ein Direktschaden-Zauber
// aufs gegnerische Gesicht verliert diesen Einzelvergleich fast immer gegen
// eine Kreatur (unitValue-Gewicht 2.2 vs. Lebenspunkt-Gewicht 1.0), auch wenn
// Zauber + Alpha-Strike ZUSAMMEN diesen Zug gewinnen würden. Statt echter
// Mehr-Ply-Suche (zu teuer fürs Budget) wird deshalb NUR der pragmatische
// Spezialfall geprüft: kann der Bot DIESEN Zug lethal spielen, wenn er
// möglichst viele seiner Ressourcen (Angreifer + Face-Damage-Karten) einsetzt?
//
// Vorgehen: Zwei "Alles-rein"-Reihenfolgen ("burnFirst": erst alle bezahlbaren
// Face-Damage-Zauber inkl. dafür nötigem Mana-Tappen, dann Alpha-Strike;
// "attackFirst": erst Alpha-Strike, danach noch verbliebene Face-Damage-
// Zauber) werden je EINMAL vollständig durchsimuliert — mit derselben
// Simulationsinfrastruktur (safeApplyForSim/pickDecisionForSim) wie das
// übrige Modul, inkl. Kampf-Abwicklung mit dem "blockt gut"-Gegnermodell
// (heuristicBlockAction), damit ein gefundener Kill nicht auf einer
// optimistischen "Gegner blockt nicht"-Annahme beruht. Nur wenn eine der
// beiden Proben tatsächlich mit Gegner-Leben <= 0 endet, wird ihr ERSTER
// Schritt zurückgegeben — alle weiteren Schritte des Plans werden NICHT
// vorab angewendet, sondern bei den folgenden chooseActionHard-Aufrufen aus
// dem dann echten Folgezustand neu hergeleitet (gleiches zustandsloses
// Nachrechnen wie überall sonst im Modul).
//
// Billig bleiben (keine kombinatorische Suche): ein billiger Vorfilter
// (mightBeLethalThisTurn — reine Feldabfragen, keine Simulation) lässt die
// beiden Proben in der übergroßen Mehrheit der Züge gar nicht erst starten;
// nur wenn Angriffs-Schadenspotenzial + mindestens eine Face-Damage-Karte
// überhaupt in Reichweite des gegnerischen Lebens liegen könnten, werden sie
// versucht. Bewusste Grenze (wie X-Kosten, Modul-übliches Muster): X-Kosten-
// Zauber enumeriert getLegalActions ohnehin nie, und rohe modale Kandidaten
// tragen nur STRUKTURELL (nicht mit exaktem Betrag) zum Vorfilter bei — für
// den eigentlichen Beweis zählt ausschließlich die echte Simulation.

/** Rein strukturelle effects+targets-Sicht einer Wirkung (Modus ODER Nicht-Modus, vereinheitlicht). */
interface EffectsWithTargets {
  targets?: TargetSpec[];
  effects: Effect[];
}

/** Alle Wirkungs-"Varianten" (Modi, oder ein einzelner Eintrag bei Nicht-Modal) einer Spell-Definition. */
function cardEffectModes(pool: CardPool, definitionId: string): EffectsWithTargets[] | undefined {
  const def = pool[definitionId];
  if (!def || def.type !== "spell") return undefined;
  if (def.modes && def.modes.length > 0) return def.modes.map((m) => ({ targets: m.targets, effects: m.effects }));
  return [{ targets: def.targets, effects: def.effects ?? [] }];
}

/** Wie cardEffectModes, für eine aktivierte Fähigkeit (Mana-Fähigkeiten sind nie Face-Damage -> undefined). */
function abilityEffectModes(
  pool: CardPool,
  state: GameState,
  sourceInstanceId: InstanceId,
  abilityIndex: number,
): EffectsWithTargets[] | undefined {
  const ability = abilitiesOf(pool, state, sourceInstanceId)[abilityIndex];
  if (!ability || ability.kind !== "activated" || ability.isManaAbility) return undefined;
  if (ability.modes && ability.modes.length > 0) return ability.modes.map((m) => ({ targets: m.targets, effects: m.effects }));
  return [{ targets: ability.targets, effects: ability.effects }];
}

/** Enthält irgendeine der Varianten einen dealDamage/loseLife-Effekt, der (fix oder über einen Spieler-Zielslot) den Gegner treffen KÖNNTE? Rein strukturell, kein konkretes Ziel/Betrag. */
function structuralFaceDamagePotential(modes: EffectsWithTargets[]): boolean {
  return modes.some(({ targets, effects }) =>
    effects.some((effect) => {
      if (effect.kind !== "dealDamage" && effect.kind !== "loseLife") return false;
      const recipient = effect.kind === "dealDamage" ? effect.to : effect.who;
      if (recipient === "opponent" || recipient === "eachOpponent") return true;
      if (typeof recipient === "object" && "target" in recipient) {
        const spec = targets?.[recipient.target];
        return spec?.kind === "player" || spec?.kind === "unitOrPlayer";
      }
      return false;
    }),
  );
}

/** Vorfilter-Test für einen rohen (ggf. noch nicht modus-vervollständigten) castSpell-/activateAbility-Kandidaten. */
function actionMightDealFaceDamage(pool: CardPool, state: GameState, action: PlayerAction): boolean {
  if (action.kind === "castSpell") {
    const card = state.cards[action.cardInstanceId];
    if (!card) return false;
    const modes = cardEffectModes(pool, card.definitionId);
    return modes !== undefined && structuralFaceDamagePotential(modes);
  }
  if (action.kind === "activateAbility") {
    const modes = abilityEffectModes(pool, state, action.sourceInstanceId, action.abilityIndex);
    return modes !== undefined && structuralFaceDamagePotential(modes);
  }
  return false;
}

/** Hat die Hand noch eine strukturell face-damage-fähige Karte (unabhängig von aktueller Bezahlbarkeit)? Steuert, ob sich weiteres Mana-Tappen im Rollout überhaupt lohnen kann. */
function handHasPotentialFaceDamageSpell(pool: CardPool, state: GameState, player: PlayerId): boolean {
  return state.players[player].hand.some((id) => {
    const card = state.cards[id];
    if (!card) return false;
    const modes = cardEffectModes(pool, card.definitionId);
    return modes !== undefined && structuralFaceDamagePotential(modes);
  });
}

/** Optimistische Obergrenze des diesen Zug noch erzielbaren Kampfschadens (ignoriert Blocker bewusst -> nur als billiger Vorfilter, NIE für die eigentliche Lethal-Entscheidung). */
function potentialAttackPower(pool: CardPool, state: GameState, player: PlayerId): number {
  let total = 0;
  for (const id of state.players[player].battlefield) {
    const card = state.cards[id];
    const ps = card?.permanentState;
    if (!ps || !card || pool[card.definitionId]?.type !== "unit") continue;
    if (ps.combat?.role === "attacker") {
      total += Math.max(effectiveStats(pool, state, id).power, 0);
      continue;
    }
    if (ps.combat?.role === "blocker" || ps.tapped) continue;
    if (ps.summoningSick && !hasEffectiveKeyword(pool, state, id, "swift")) continue;
    total += Math.max(effectiveStats(pool, state, id).power, 0);
  }
  return total;
}

/**
 * Billiger Vorfilter OHNE jede Simulation: Nur wenn das optimistische
 * Angriffs-Schadenspotenzial allein schon reicht, ODER mindestens eine
 * strukturell face-damage-fähige Aktion aktuell legal ist, lohnt sich der
 * (teurere) simulierte Lethal-Check überhaupt. Bewusst optimistisch (nie ein
 * falsches Negativ) — ein "false positive" hier kostet nur ein wenig Budget
 * in den beiden Rollouts, ein falsches Negativ würde einen echten Kill
 * verpassen.
 */
function mightBeLethalThisTurn(pool: CardPool, state: GameState, player: PlayerId, legal: PlayerAction[]): boolean {
  const opponent = otherPlayerId(player);
  const life = state.players[opponent].life;
  if (life <= 0) return true;
  if (potentialAttackPower(pool, state, player) >= life) return true;
  return legal.some((action) => actionMightDealFaceDamage(pool, state, action));
}

/** Effekte eines KONKRETEN Cast-/Activate-Kandidaten (Modus bereits gewählt, falls modal); undefined = kein Cast/Activate oder Modus noch offen. */
function candidateEffects(pool: CardPool, state: GameState, action: PlayerAction): Effect[] | undefined {
  if (action.kind === "castSpell") {
    const card = state.cards[action.cardInstanceId];
    const def = card && pool[card.definitionId];
    if (!def || def.type !== "spell") return undefined;
    if (def.modes && def.modes.length > 0) {
      if (action.chosenMode === undefined) return undefined;
      return def.modes[action.chosenMode]?.effects ?? [];
    }
    return def.effects ?? [];
  }
  if (action.kind === "activateAbility") {
    const ability = abilitiesOf(pool, state, action.sourceInstanceId)[action.abilityIndex];
    if (!ability || ability.kind !== "activated") return undefined;
    if (ability.modes && ability.modes.length > 0) {
      if (action.chosenMode === undefined) return undefined;
      return ability.modes[action.chosenMode]?.effects ?? [];
    }
    return ability.effects ?? [];
  }
  return undefined;
}

/** Zielt ein KONKRETER Cast-/Activate-Kandidat (chosenTargets bereits belegt) mit dealDamage/loseLife auf den Gegner-SPIELER (Face)? */
function dealsFaceDamageToOpponent(pool: CardPool, state: GameState, opponent: PlayerId, action: PlayerAction): boolean {
  const effects = candidateEffects(pool, state, action);
  if (!effects) return false;
  const chosenTargets = action.kind === "castSpell" || action.kind === "activateAbility" ? action.chosenTargets : [];
  return effects.some((effect) => {
    if (effect.kind !== "dealDamage" && effect.kind !== "loseLife") return false;
    const recipient = effect.kind === "dealDamage" ? effect.to : effect.who;
    if (recipient === "opponent" || recipient === "eachOpponent") return true;
    if (typeof recipient === "object" && "target" in recipient) {
      const target = chosenTargets[recipient.target];
      return target?.kind === "player" && target.playerId === opponent;
    }
    return false;
  });
}

/** Erster (Modus-vervollständigter, falls nötig) Face-Damage-Kandidat aus `legal` — analog zum Modal-Muster in chooseBestCastOrActivateHard. */
function bestFaceDamageCandidate(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  opponent: PlayerId,
  legal: PlayerAction[],
): PlayerAction | undefined {
  for (const action of legal) {
    if (action.kind !== "castSpell" && action.kind !== "activateAbility") continue;
    if (action.chosenMode === undefined) {
      const completions = expandModalCandidate(engine, pool, state, action);
      if (completions !== undefined) {
        const hit = completions.find((c) => dealsFaceDamageToOpponent(pool, state, opponent, c));
        if (hit) return hit;
        continue;
      }
    }
    if (dealsFaceDamageToOpponent(pool, state, opponent, action)) return action;
  }
  return undefined;
}

function isManaAbilityCandidate(
  pool: CardPool,
  state: GameState,
  action: Extract<PlayerAction, { kind: "activateAbility" }>,
): boolean {
  const ability = abilitiesOf(pool, state, action.sourceInstanceId)[action.abilityIndex];
  return ability?.kind === "activated" && !!ability.isManaAbility;
}

/**
 * Simuliert EINE "Alles-rein"-Reihenfolge vollständig (bis Sieg/Niederlage,
 * Rundenende des Spielers, Budget- oder Schritt-Erschöpfung) und liefert den
 * ERSTEN darin tatsächlich angewendeten Schritt plus ob die Probe lethal
 * endete. "burnFirst": bei jedem eigenen Priority-Fenster zuerst versuchen,
 * einen Face-Damage-Kandidaten zu casten/aktivieren bzw. dafür Mana zu
 * tappen; erst wenn nichts mehr geht, weiterpassen (das bringt die Probe zum
 * declareAttackers-Fenster). "attackFirst": vor dem Alpha-Strike NICHT
 * casten (nur weiterpassen), danach genau wie "burnFirst" (deckt den Fall
 * ab, dass ein Angreifer z.B. selbst eine benötigte Mana-Fähigkeit hat und
 * das Tappen zum Angreifen ihn sonst verbraucht hätte — hier bewusst
 * zweitrangig, aber billig genug, um als zweite Probe mitzunehmen).
 */
function simulateLethalRollout(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  ordering: "burnFirst" | "attackFirst",
  budget: SimBudget,
): { firstAction: PlayerAction; lethal: boolean } | undefined {
  const opponent = otherPlayerId(player);
  let current = state;
  let firstAction: PlayerAction | undefined;
  let attackedThisCombat = false;

  const apply = (action: PlayerAction): boolean => {
    if (budget.remaining <= 0) return false;
    budget.remaining -= 1;
    const result = safeApplyForSim(engine, current, action);
    if (result.error) return false;
    if (firstAction === undefined) firstAction = action;
    current = result.state;
    return true;
  };

  for (let step = 0; step < LETHAL_MAX_PLAN_STEPS; step++) {
    if (current.winner !== undefined) break;
    if (current.players[opponent].life <= 0) break;
    if (current.activePlayer !== player) break; // Zugwechsel -> "diesen Zug lethal" ist erledigt/gescheitert
    if (current.step === "cleanup") break; // nichts mehr zu entscheiden diesen Zug

    if (current.pendingDecision) {
      const decision = current.pendingDecision;
      const candidates = engine
        .getLegalActions(current, decision.player)
        .filter((a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision");
      if (candidates.length === 0) break;
      if (!apply(pickDecisionForSim(pool, current, decision, candidates))) break;
      continue;
    }

    if (current.priorityPlayer === undefined) {
      if (current.step === "declareAttackers" && current.activePlayer === player && !attackedThisCombat) {
        const attackerIds = engine
          .getLegalActions(current, player)
          .filter((a): a is Extract<PlayerAction, { kind: "declareAttackers" }> => a.kind === "declareAttackers")
          .flatMap((a) => a.attackers);
        attackedThisCombat = true;
        if (!apply({ kind: "declareAttackers", player, attackers: attackerIds })) break;
        continue;
      }
      if (current.step === "declareBlockers" && current.activePlayer === player) {
        // Verteidigungsmodell "Gegner blockt gut" (dieselbe Heuristik wie das
        // "bestBlocks"-Gegnermodell in chooseAttackActionHard) — ein hier
        // gefundener Kill soll NICHT auf optimistischem Nicht-Blocken beruhen.
        if (budget.remaining <= 0) break;
        budget.remaining -= 1;
        const result = engine.applyAction(current, heuristicBlockAction(pool, current, opponent));
        if (result.error) break;
        current = result.state;
        continue;
      }
      break; // kein bekanntes Aktionsfenster mehr -> Probe hier beenden
    }

    if (current.priorityPlayer !== player) {
      // Kein Instant-Speed-Gegenspiel modelliert (Moduldoku/rules-engine.md 9.1) -> weiterpassen.
      if (!apply({ kind: "passPriority", player: current.priorityPlayer })) break;
      continue;
    }

    const ownLegal = engine.getLegalActions(current, player);
    const wantBurnNow = ordering === "burnFirst" || attackedThisCombat;
    if (wantBurnNow) {
      const burnCandidate = bestFaceDamageCandidate(engine, pool, current, opponent, ownLegal);
      if (burnCandidate) {
        if (apply(burnCandidate)) continue;
        break;
      }
      if (handHasPotentialFaceDamageSpell(pool, current, player)) {
        const manaTap = ownLegal.find(
          (a): a is Extract<PlayerAction, { kind: "activateAbility" }> =>
            a.kind === "activateAbility" && isManaAbilityCandidate(pool, current, a),
        );
        if (manaTap) {
          if (apply(manaTap)) continue;
          break;
        }
      }
    }
    if (!apply({ kind: "passPriority", player })) break;
  }

  if (firstAction === undefined) return undefined;
  const lethal = current.winner === player || current.players[opponent].life <= 0;
  return { firstAction, lethal };
}

/**
 * Öffentlicher Einstieg des Lethal-Checks (siehe Abschnittsdoku oben). Nur
 * im eigenen Zug relevant (Alpha-Strike-Kombos ergeben nur dort Sinn); alle
 * anderen Rückgaben `undefined` bedeuten "kein Lethal-Plan gefunden/versucht
 * -> normale 1-Ply-Wahl entscheidet unverändert weiter".
 */
function findLethalAction(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  legal: PlayerAction[],
  player: PlayerId,
  budget: SimBudget,
): PlayerAction | undefined {
  if (state.activePlayer !== player) return undefined;
  if (state.pendingDecision) return undefined; // eigene Top-Level-Decisions sind bereits vorher behandelt
  if (budget.remaining < LETHAL_MIN_BUDGET) return undefined;
  const opponent = otherPlayerId(player);
  if (state.players[opponent].life <= 0 || state.winner !== undefined) return undefined;
  if (!mightBeLethalThisTurn(pool, state, player, legal)) return undefined;

  const burnFirst = simulateLethalRollout(engine, pool, state, player, "burnFirst", budget);
  if (burnFirst?.lethal) return burnFirst.firstAction;
  const attackFirst = simulateLethalRollout(engine, pool, state, player, "attackFirst", budget);
  if (attackFirst?.lethal) return attackFirst.firstAction;
  return undefined;
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
