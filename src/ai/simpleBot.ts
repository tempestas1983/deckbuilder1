/**
 * Einfacher, regelbasierter KI-Gegner (v1) — bewusst simpel, kein
 * Balancing-Anspruch. Fundament für einen späteren, spezialisierten
 * Schwierigkeitsstufen-Ausbau (siehe docs/ai-status.md).
 *
 * ARCHITEKTUR-VORGABE (Game-Architect): Dieses Modul spielt AUSSCHLIESSLICH
 * über die öffentliche `RulesEngine`-Schnittstelle (`createGame`,
 * `getLegalActions`, `applyAction`) — reiner Konsument, exakt wie das UI
 * (`src/ui/store.ts`). Keine Erweiterung/Änderung an `src/engine/*` oder
 * `src/model/*`; keine Imports aus `src/engine/*`-Internals (kein
 * `computeEffectiveStats`, `isLegalAttacker`, `canPayCost`, ...). Genau wie
 * `src/ui/store.ts` hält dieses Modul den `CardPool` separat von der
 * `RulesEngine`-Instanz (Kartendaten sind über die Engine-Schnittstelle
 * selbst nicht erreichbar — `GameState` enthält nur `definitionId`s).
 *
 * Wo genau die Grenzen dieser strengen "nur getLegalActions"-Vorgabe liegen
 * und wie hier bewusst und dokumentiert davon abgewichen wird (Kampf-
 * Deklarationen, Cleanup-Abwurf), steht ausführlich in docs/ai-status.md
 * (Abschnitt "Abweichungen von der reinen Kandidatenliste").
 */

import type {
  Ability,
  CardDefinition,
  CardPool,
  ChosenTarget,
  Effect,
  GameState,
  InstanceId,
  Keyword,
  ManaCost,
  PendingDecision,
  PlayerAction,
  PlayerId,
  RulesEngine,
} from "../model";
// boardEval ist wie dieses Modul ein reiner Konsument (CardPool+GameState,
// keine Engine-Internals). Genutzt wird es hier AUSSCHLIESSLICH für zwei
// LEGALITÄTS-relevante Stellen (beides Funde der Farb-Balance-Analyse übers
// 300-Karten-Set, siehe docs/ai-status.md Abschnitt 10):
// 1. Blocker-Konstruktion mit effektiven Keywords (inkl. statischer
//    Fremd-Grants wie guardian-Auren — mit reinen Basis-Keywords reichte der
//    Bot eine von der Engine abgelehnte, leere Blockdeklaration ein).
// 2. Vervollständigung modaler Cast-/Activate-Kandidaten (getLegalActions
//    liefert sie laut Vertrag OHNE chosenMode/chosenTargets; roh eingereicht
//    lehnt applyAction sie mit "Modus fehlt" ab).
// Die HEURISTIK-Qualität (rough*-Schätzer, Angriffs-/Removal-Bewertung)
// bleibt bewusst die dokumentierte v1-Vereinfachung ohne fremde Statics
// (docs/ai-status.md 6.2).
import { canBlockPairEffective, expandModalCandidate, hasEffectiveKeyword } from "./boardEval";

// ---------------------------------------------------------------------------
// Öffentliche Kernfunktion
// ---------------------------------------------------------------------------

/**
 * Wählt IMMER eine legale Aktion. Fallback ist immer `passPriority` (bzw.
 * als allerletzter Ausweg `concede`, falls selbst das nicht verfügbar ist —
 * sollte im laufenden Spiel nie vorkommen, siehe docs/ai-status.md).
 *
 * Reihenfolge der Heuristiken (siehe docs/ai-status.md für Details):
 * 1. Ausstehende PendingDecision des Bots auflösen.
 * 2. Terrain spielen, falls noch keins in diesem Zug gespielt.
 * 3. Beste leistbare castSpell-/activateAbility-Option wählen.
 * 4. Angreifer deklarieren.
 * 5. Blocker deklarieren.
 * 6. Sonst: passPriority.
 *
 * Zusätzlich (nicht Teil der 6 Kernheuristiken, aber für vollständige
 * Partien nötig): Handkarten-Abwurf im Cleanup (discardToHandSize), siehe
 * docs/ai-status.md.
 */
export function chooseAction(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
): PlayerAction {
  if (state.winner !== undefined) {
    // Defensiv: chooseAction sollte nach Spielende nicht mehr aufgerufen
    // werden (siehe docs/ai-status.md, "Nutzungsvertrag"). getLegalActions
    // liefert dann ohnehin [] — es gibt keine echte legale Aktion mehr.
    return { kind: "concede", player };
  }

  const legal = engine.getLegalActions(state, player);
  if (legal.length === 0) {
    return { kind: "concede", player };
  }

  // 1. Pending Decision zuerst.
  if (state.pendingDecision && state.pendingDecision.player === player) {
    const decisionAction = choosePendingDecisionAction(pool, state, state.pendingDecision, legal);
    if (decisionAction) return decisionAction;
  }

  // Cleanup-Abwurf (nicht Teil der 6 Kernheuristiken, siehe Modul-Doku oben
  // und docs/ai-status.md): getLegalActions enumeriert discardToHandSize
  // bewusst nicht (kombinatorisch) — die Pflicht wird stattdessen direkt aus
  // GameState erkannt und die Aktion selbst konstruiert.
  if (
    state.step === "cleanup" &&
    state.priorityPlayer === undefined &&
    state.pendingDecision === undefined &&
    state.activePlayer === player &&
    state.players[player].hand.length > 7
  ) {
    return chooseDiscardAction(pool, state, player);
  }

  // 2. Terrain spielen.
  const terrainAction = legal.find((a): a is Extract<PlayerAction, { kind: "playTerrain" }> => a.kind === "playTerrain");
  if (terrainAction) return terrainAction;

  // 3. Beste castSpell-/activateAbility-Option.
  const castOrActivate = chooseBestCastOrActivate(engine, pool, state, legal, player);
  if (castOrActivate) return castOrActivate;

  // 4. Angreifer deklarieren (Konstruktion aus einzeln validierten
  // Kandidaten, siehe docs/ai-status.md).
  const attackAction = chooseAttackAction(pool, state, legal, player);
  if (attackAction) return attackAction;

  // 5. Blocker deklarieren (eigene Konstruktion aus GameState, siehe
  // docs/ai-status.md — nötig wegen der guardian-Enumerationslücke).
  if (
    state.step === "declareBlockers" &&
    state.priorityPlayer === undefined &&
    state.pendingDecision === undefined &&
    otherPlayerId(state.activePlayer) === player
  ) {
    return chooseBlockAction(pool, state, player);
  }

  // 6. Sonst: passen.
  const pass = legal.find((a) => a.kind === "passPriority");
  if (pass) return pass;

  const concede = legal.find((a) => a.kind === "concede");
  if (concede) return concede;

  // Sollte laut RulesEngine-Vertrag nie erreicht werden (concede ist nur bei
  // state.winner !== undefined abwesend, was oben bereits behandelt ist).
  return legal[0]!;
}

// ---------------------------------------------------------------------------
// Pending Decisions
// ---------------------------------------------------------------------------

function choosePendingDecisionAction(
  pool: CardPool,
  state: GameState,
  decision: PendingDecision,
  legal: PlayerAction[],
): PlayerAction | undefined {
  const resolveCandidates = legal.filter(
    (a): a is Extract<PlayerAction, { kind: "resolveDecision" }> => a.kind === "resolveDecision",
  );
  if (resolveCandidates.length === 0) return undefined;

  switch (decision.kind) {
    case "mulligan": {
      const hand = state.players[decision.player].hand;
      const terrainCount = hand.filter((id) => {
        const card = state.cards[id];
        const def = card && pool[card.definitionId];
        return def?.type === "terrain";
      }).length;
      // Heuristik: Starthand behalten, außer 0-1 Terrains oder >5 Terrains
      // unter den (aktuellen) Handkarten.
      const wantMulligan = terrainCount <= 1 || terrainCount > 5;
      return (
        resolveCandidates.find((a) => a.choice.kind === "mulligan" && a.choice.takeMulligan === wantMulligan) ??
        resolveCandidates[0]
      );
    }
    case "chooseMode": {
      // Ersten wählbaren Modus nehmen (Reihenfolge = decision.selectableModes).
      return (
        [...resolveCandidates].sort((a, b) => {
          const ma = a.choice.kind === "chooseMode" ? a.choice.modeIndex : 0;
          const mb = b.choice.kind === "chooseMode" ? b.choice.modeIndex : 0;
          return ma - mb;
        })[0] ?? resolveCandidates[0]
      );
    }
    case "orderBlockers": {
      // getLegalActions liefert genau einen Kandidaten (unveränderte
      // Deklarationsreihenfolge) — den unverändert bestätigen.
      return resolveCandidates[0];
    }
    case "chooseTriggerTargets": {
      return pickTriggerTargetCandidate(pool, state, decision, resolveCandidates);
    }
    default:
      return resolveCandidates[0];
  }
}

const HARMFUL_EFFECT_KINDS = new Set<Effect["kind"]>(["dealDamage", "destroyPermanent", "exilePermanent"]);

function pickTriggerTargetCandidate(
  pool: CardPool,
  state: GameState,
  decision: Extract<PendingDecision, { kind: "chooseTriggerTargets" }>,
  resolveCandidates: Array<Extract<PlayerAction, { kind: "resolveDecision" }>>,
): PlayerAction {
  const sourceCard = state.cards[decision.sourceInstanceId];
  const def: CardDefinition | undefined = sourceCard && pool[sourceCard.definitionId];
  const abilities: Ability[] = def && "abilities" in def ? (def.abilities ?? []) : [];
  const ability = abilities[decision.abilityIndex];

  let harmful = false;
  if (ability?.kind === "triggered") {
    const effects: Effect[] = decision.chosenMode !== undefined ? (ability.modes?.[decision.chosenMode]?.effects ?? []) : (ability.effects ?? []);
    harmful = effects.some((e) => HARMFUL_EFFECT_KINDS.has(e.kind));
  }

  if (harmful) {
    const opponentTarget = resolveCandidates.find((a) => {
      if (a.choice.kind !== "chooseTriggerTargets") return false;
      const t = a.choice.chosenTargets[0];
      if (!t) return false;
      if (t.kind === "permanent") return state.cards[t.instanceId]?.controller !== decision.player;
      if (t.kind === "player") return t.playerId !== decision.player;
      return false;
    });
    if (opponentTarget) return opponentTarget;
  }

  return resolveCandidates[0]!;
}

// ---------------------------------------------------------------------------
// Cleanup-Abwurf (discardToHandSize) — siehe Modul-Doku oben
// ---------------------------------------------------------------------------

function chooseDiscardAction(pool: CardPool, state: GameState, player: PlayerId): PlayerAction {
  const hand = state.players[player].hand;
  const overflow = Math.max(0, hand.length - 7);
  const scored = hand
    .map((id) => ({ id, value: handCardValue(pool, state, id) }))
    .sort((a, b) => a.value - b.value);
  const cardInstanceIds = scored.slice(0, overflow).map((s) => s.id);
  return { kind: "discardToHandSize", player, cardInstanceIds };
}

function handCardValue(pool: CardPool, state: GameState, instanceId: InstanceId): number {
  const card = state.cards[instanceId];
  const def = card && pool[card.definitionId];
  if (!def) return 0;
  if (def.type === "unit") return def.power + def.toughness;
  if (def.type === "terrain") return 1; // ein paar Terrains lohnt es sich zu behalten
  return 2; // Spells/Relics/Enchantments: grobe mittlere Priorität
}

// ---------------------------------------------------------------------------
// Terrain / Cast / Activate
// ---------------------------------------------------------------------------

/**
 * Steps VOR der eigenen Declare-Attackers-Entscheidung (rules-engine.md
 * Abschnitt 2) — hier sollen tap-kostende (Nicht-Mana-)Fähigkeiten NICHT
 * proaktiv auf potenziellen Angreifern verbraucht werden, siehe
 * `wouldTapPotentialAttacker` unten.
 */
const PRE_COMBAT_OWN_STEPS = new Set<GameState["step"]>(["untap", "upkeep", "draw", "main1", "beginCombat"]);

/**
 * Fund beim Testen (siehe docs/ai-status.md): Ohne diese Bremse aktiviert
 * die Bot-Heuristik #3 ("beste leistbare Option") auch tap-kostende
 * Nicht-Mana-Fähigkeiten von Units in der eigenen Precombat-Phase — dadurch
 * wird die eigene Angriffsarmee JEDEN Zug vor `declareAttackers` leer
 * getappt, und Heuristik #4 (Angriff) läuft komplett leer (Partien enden
 * dann nur noch übers Deck-Auszehren statt über Lebenspunkte). Fähigkeiten
 * mit `additionalCosts: tap` auf einer Unit, die JETZT noch potenziell
 * angreifen könnte (ungetappt, nicht bereits durch Summoning Sickness aus
 * dem Rennen), werden daher in der eigenen Precombat-Phase zurückgestellt
 * — sie bleiben in späteren Fenstern (nach der Angriffsdeklaration, im
 * gegnerischen Zug, in Main 2) weiterhin normal verfügbar.
 */
function wouldTapPotentialAttacker(
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
  if (sourceCard.permanentState.summoningSick && !hasBaseKeyword(pool, state, action.sourceInstanceId, "swift")) {
    return false; // kann diesen Zug ohnehin nicht angreifen -> kein Verlust
  }
  return true;
}

function chooseBestCastOrActivate(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  legal: PlayerAction[],
  player: PlayerId,
): PlayerAction | undefined {
  const scored: Array<{ action: PlayerAction; score: number }> = [];
  const manaAbilityCandidates: PlayerAction[] = [];

  for (const action of legal) {
    if (action.kind === "castSpell") {
      // Modale Kandidaten kommen laut getLegalActions-Vertrag OHNE
      // chosenMode/chosenTargets und müssen konsumentenseitig vervollständigt
      // werden (boardEval.ts#expandModalCandidate, engine-validierter Dry-Run)
      // — der rohe Kandidat selbst würde von applyAction abgelehnt.
      const modalCompletions = expandModalCandidate(engine, pool, state, action);
      if (modalCompletions !== undefined) {
        for (const completed of modalCompletions) {
          if (completed.kind !== "castSpell") continue;
          scored.push({ action: completed, score: scoreCastSpell(pool, state, player, completed) });
        }
        continue;
      }
      scored.push({ action, score: scoreCastSpell(pool, state, player, action) });
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
      if (wouldTapPotentialAttacker(pool, state, player, action, ability)) {
        continue;
      }
      // Modale Fähigkeiten: analog zu castSpell vervollständigen.
      const modalCompletions = expandModalCandidate(engine, pool, state, action);
      if (modalCompletions !== undefined) {
        for (const completed of modalCompletions) {
          if (completed.kind !== "activateAbility") continue;
          scored.push({ action: completed, score: scoreActivateAbility(pool, state, player, completed, ability) });
        }
        continue;
      }
      scored.push({ action, score: scoreActivateAbility(pool, state, player, action, ability) });
    }
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b.score - a.score);
    return scored[0]!.action;
  }

  // Kein direkt lohnender Cast/Activate verfügbar: Mana-Fähigkeit aktivieren
  // (baut Mana für spätere Aktionen im SELBEN Priority-Fenster auf — der
  // Manapool leert sich am Step-/Phasenende, rules-engine.md 1).
  //
  // Fund beim Testen (siehe docs/ai-status.md): Diese Vorab-Tap-Heuristik
  // darf NICHT in jedem Priority-Fenster greifen. Sorcery-Speed-Karten
  // (Units, Terrains, spell(slow)) sind ohnehin nur in der EIGENEN Main-
  // Phase castbar (rules-engine.md 2) — Mana, das z.B. im Upkeep oder im
  // gegnerischen Zug getappt wird, verfällt ungenutzt am Step-Ende und fehlt
  // dann in Main 1/2 (die betroffenen Terrains bleiben bis zum nächsten
  // eigenen Untap Step getappt). Ohne diese Einschränkung tappt der Bot
  // seine Manaquellen faktisch JEDEN Zug schon im Upkeep leer, bevor Main 1
  // überhaupt beginnt — die Partie hat dann de facto nie genug Mana für
  // echte Käufe. Daher: proaktives Vorab-Tappen nur in der eigenen Main-
  // Phase (main1/main2), wo der Bot das Mana im selben Fenster auch
  // tatsächlich verbrauchen kann.
  if (manaAbilityCandidates.length > 0 && state.activePlayer === player && (state.step === "main1" || state.step === "main2")) {
    return manaAbilityCandidates[0]!;
  }

  return undefined;
}

function manaCostTotal(cost: ManaCost | undefined): number {
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

function scoreCastSpell(
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  action: Extract<PlayerAction, { kind: "castSpell" }>,
): number {
  const card = state.cards[action.cardInstanceId];
  const def = card && pool[card.definitionId];
  if (!def) return 0;
  const denom = Math.max(manaCostTotal("cost" in def ? def.cost : undefined), 1);

  if (def.type === "unit") {
    return (def.power + def.toughness) / denom;
  }

  if (def.type === "spell") {
    // Bei modalen (vervollständigten) Kandidaten zählen die Effekte des
    // GEWÄHLTEN Modus, sonst die normalen Spell-Effekte.
    const effects: Effect[] =
      action.chosenMode !== undefined ? (def.modes?.[action.chosenMode]?.effects ?? []) : (def.effects ?? []);
    const removalScore = scoreRemovalTarget(pool, state, player, effects, action.chosenTargets);
    if (removalScore !== undefined) return 10 + removalScore / denom;
    return 1 / denom; // sonst: günstigste verfügbare Option bevorzugen
  }

  // relic / enchantment: moderate Baseline, sonst günstigste Option bevorzugen.
  return 0.5 / denom;
}

function scoreActivateAbility(
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
  const removalScore = scoreRemovalTarget(pool, state, player, effects, action.chosenTargets);
  if (removalScore !== undefined) return 10 + removalScore / denom;
  return 0.3 / denom; // aktivierte Fähigkeiten sind v1 eher Nice-to-have
}

/**
 * Grobe Removal-Heuristik: Hat der Effekt einen "schädlichen" Effekt-Kind
 * (dealDamage/destroyPermanent/exilePermanent) UND das gewählte Ziel ist ein
 * gegnerisches Unit-Permanent, liefert die (rough) Power+Toughness des
 * Ziels als Bonuswert zurück — sonst undefined.
 */
function scoreRemovalTarget(
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
  const targetDef = pool[targetCard.definitionId];
  if (targetDef?.type !== "unit") return undefined;
  return roughPower(pool, state, target.instanceId) + roughToughness(pool, state, target.instanceId);
}

// ---------------------------------------------------------------------------
// Kampf: Angreifer
//
// Sicher aus getLegalActions ableitbar: combatCandidates() (legal-actions.ts)
// enumeriert für declareAttackers IMMER den leeren Kandidaten plus EINEN
// Einzel-Kandidaten pro individuell legalem Angreifer, ohne Sonderfälle
// (anders als bei declareBlockers/guardian, s.u.). Die einzeln legalen
// Angreifer-IDs sind daher direkt aus `legal` extrahierbar; da
// isLegalAttacker ausschließlich pro-Einheit prüft (keine Kombinations-
// regeln), ist jede Kombination individuell legaler Angreifer ebenfalls
// legal — siehe docs/ai-status.md.
// ---------------------------------------------------------------------------

function chooseAttackAction(
  pool: CardPool,
  state: GameState,
  legal: PlayerAction[],
  player: PlayerId,
): PlayerAction | undefined {
  const declareCandidates = legal.filter(
    (a): a is Extract<PlayerAction, { kind: "declareAttackers" }> => a.kind === "declareAttackers",
  );
  if (declareCandidates.length === 0) return undefined;

  const emptyCandidate = declareCandidates.find((a) => a.attackers.length === 0);
  const singleAttackerIds = declareCandidates.filter((a) => a.attackers.length === 1).map((a) => a.attackers[0]!);

  if (singleAttackerIds.length === 0) {
    return emptyCandidate ?? { kind: "declareAttackers", player, attackers: [] };
  }

  const opponent = otherPlayerId(player);
  const opponentBlockers = state.players[opponent].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    const def = pool[card.definitionId];
    return def?.type === "unit";
  });

  // Wichtig (Fund beim Testen, siehe docs/ai-status.md): Ein einzelner
  // gegnerischer Blocker kann immer nur EINEN Angreifer blocken. Ein naiver
  // Check "gibt es IRGENDEINEN gegnerischen Blocker, der mich für lau
  // tötet?" pro Angreifer unabhängig führt bei größeren Boards dazu, dass
  // praktisch JEDER Angriff als riskant gilt (derselbe große Blocker "verbietet"
  // gedanklich jeden kleineren Angreifer gleichzeitig) — beide Bots greifen
  // dann nie mehr an, die Partie endet nur noch übers Deck-Auszehren nach
  // sehr vielen Zügen. Daher: größte Angreifer zuerst prüfen, ein als
  // "würde mich umsonst töten" erkannter Blocker wird für die restliche
  // Bewertung reserviert (aus dem verfügbaren Pool entfernt) statt gegen
  // jeden weiteren Angreifer erneut zu zählen — grobe 1:1-Zuordnung, kein
  // vollständiges Lookahead.
  const sortedAttackerIds = [...singleAttackerIds].sort(
    (a, b) => roughPower(pool, state, b) + roughToughness(pool, state, b) - (roughPower(pool, state, a) + roughToughness(pool, state, a)),
  );
  const availableBlockers = [...opponentBlockers];
  const chosen: InstanceId[] = [];
  for (const attackerId of sortedAttackerIds) {
    const threatIndex = findKillingBlockerIndex(pool, state, attackerId, availableBlockers);
    if (threatIndex !== -1) {
      availableBlockers.splice(threatIndex, 1); // dieser Blocker ist "verbraucht", bedroht keine weiteren Angreifer
      continue;
    }
    chosen.push(attackerId);
  }

  if (chosen.length === 0) {
    return emptyCandidate ?? { kind: "declareAttackers", player, attackers: [] };
  }
  return { kind: "declareAttackers", player, attackers: chosen };
}

/** Index des ersten verfügbaren Blockers, der den Angreifer ohne Gegenwert töten würde (-1 falls keiner). */
function findKillingBlockerIndex(pool: CardPool, state: GameState, attackerId: InstanceId, availableBlockers: InstanceId[]): number {
  const aPower = roughPower(pool, state, attackerId);
  const aToughness = roughToughness(pool, state, attackerId);
  const attackerAirborne = hasBaseKeyword(pool, state, attackerId, "airborne");

  for (let i = 0; i < availableBlockers.length; i++) {
    const blockerId = availableBlockers[i]!;
    if (attackerAirborne) {
      const canBlockAir = hasBaseKeyword(pool, state, blockerId, "airborne") || hasBaseKeyword(pool, state, blockerId, "reach");
      if (!canBlockAir) continue;
    }
    const bPower = roughPower(pool, state, blockerId);
    const bToughness = roughToughness(pool, state, blockerId);
    const blockerKillsAttacker = bPower >= aToughness;
    const attackerKillsBlocker = aPower >= bToughness;
    if (blockerKillsAttacker && !attackerKillsBlocker) return i;
  }
  return -1;
}

// ---------------------------------------------------------------------------
// Kampf: Blocker
//
// ANDERS als bei Angreifern liefert combatCandidates() für declareBlockers
// bei aktiver guardian-Pflicht (>= 1 pflichtige guardian-Unit) NUR
// eingeschränkte bzw. GAR KEINE Einzel-Kandidaten (siehe legal-actions.ts-
// Kommentar). Die Blockwahl wird daher direkt aus GameState konstruiert.
// Die LEGALITÄTS-Prüfung (guardian-Pflicht, airborne/reach) nutzt seit dem
// 300-Karten-Set effektive Keywords inkl. statischer Fremd-Grants
// (boardEval.ts#hasEffectiveKeyword/canBlockPairEffective) — das frühere
// Nur-Basis-Keyword-Restrisiko aus docs/ai-status.md 3.1 ist damit
// geschlossen. Die BEWERTUNG (isFavorableBlock) bleibt v1-grob.
// ---------------------------------------------------------------------------

function chooseBlockAction(pool: CardPool, state: GameState, player: PlayerId): PlayerAction {
  const attackerPlayer = state.activePlayer;
  const attackerIds = state.players[attackerPlayer].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );

  const ownUnits = state.players[player].battlefield.filter((id) => {
    const card = state.cards[id];
    if (!card?.permanentState || card.permanentState.tapped) return false;
    return pool[card.definitionId]?.type === "unit";
  });

  const guardians = ownUnits.filter(
    (id) =>
      hasEffectiveKeyword(pool, state, id, "guardian") &&
      attackerIds.some((a) => canBlockPairEffective(pool, state, id, a)),
  );

  const life = state.players[player].life;
  const totalIncoming = attackerIds.reduce((sum, id) => sum + roughPower(pool, state, id), 0);
  const dangerous = life <= 10 || totalIncoming >= 0.3 * life;

  const blocks: Array<{ blocker: InstanceId; attacker: InstanceId }> = [];
  const used = new Set<InstanceId>();

  for (const guardian of guardians) {
    const options = attackerIds.filter((a) => canBlockPairEffective(pool, state, guardian, a));
    const preferred = options.find((a) => isFavorableBlock(pool, state, guardian, a)) ?? options[0];
    if (preferred === undefined) continue;
    blocks.push({ blocker: guardian, attacker: preferred });
    used.add(guardian);
  }

  if (dangerous) {
    for (const unit of ownUnits) {
      if (used.has(unit)) continue;
      const target = attackerIds.find(
        (a) => canBlockPairEffective(pool, state, unit, a) && isFavorableBlock(pool, state, unit, a),
      );
      if (target !== undefined) {
        blocks.push({ blocker: unit, attacker: target });
        used.add(unit);
      }
    }
  }

  return { kind: "declareBlockers", player, blocks };
}

/** "Kein reines Sinnlos-Chumpen": Blocker überlebt ODER tötet/mit-tötet den Angreifer. */
function isFavorableBlock(pool: CardPool, state: GameState, blockerId: InstanceId, attackerId: InstanceId): boolean {
  const bPower = roughPower(pool, state, blockerId);
  const bToughness = roughToughness(pool, state, blockerId);
  const aPower = roughPower(pool, state, attackerId);
  const aToughness = roughToughness(pool, state, attackerId);
  const survives = bToughness > aPower;
  const kills = bPower >= aToughness;
  return survives || kills;
}

// ---------------------------------------------------------------------------
// Grobe Stat-/Keyword-Schätzung (bewusst OHNE Engine-Internals, siehe
// Modul-Doku oben): Basiswerte + Marken (+1/+1 / -1/-1) + "bis Zugende"-
// Modifikatoren desselben Permanents direkt aus GameState. Statische
// Fähigkeiten ANDERER Permanents (Anthems etc.) werden NICHT berücksichtigt
// — dokumentierte v1-Vereinfachung (docs/ai-status.md).
// ---------------------------------------------------------------------------

function roughPower(pool: CardPool, state: GameState, instanceId: InstanceId): number {
  const card = state.cards[instanceId];
  if (!card) return 0;
  const def = pool[card.definitionId];
  if (def?.type !== "unit") return 0;
  const ps = card.permanentState;
  const plus = ps?.counters.plus1plus1 ?? 0;
  const minus = ps?.counters.minus1minus1 ?? 0;
  let power = def.power + plus - minus;
  for (const mod of ps?.temporaryModifiers ?? []) {
    if (mod.stats) power += mod.stats.power;
  }
  return power;
}

function roughToughness(pool: CardPool, state: GameState, instanceId: InstanceId): number {
  const card = state.cards[instanceId];
  if (!card) return 0;
  const def = pool[card.definitionId];
  if (def?.type !== "unit") return 0;
  const ps = card.permanentState;
  const plus = ps?.counters.plus1plus1 ?? 0;
  const minus = ps?.counters.minus1minus1 ?? 0;
  let toughness = def.toughness + plus - minus;
  for (const mod of ps?.temporaryModifiers ?? []) {
    if (mod.stats) toughness += mod.stats.toughness;
  }
  return toughness;
}

/** Basis-Keyword (Karten-Definition) ODER "bis Zugende" gewährtes Keyword desselben Permanents. */
function hasBaseKeyword(pool: CardPool, state: GameState, instanceId: InstanceId, keyword: Keyword): boolean {
  const card = state.cards[instanceId];
  if (!card) return false;
  const def = pool[card.definitionId];
  const abilities: Ability[] = def && "abilities" in def ? (def.abilities ?? []) : [];
  if (abilities.some((a) => a.kind === "keyword" && a.keyword === keyword)) return true;
  return card.permanentState?.temporaryModifiers.some((m) => m.keyword === keyword) ?? false;
}

function otherPlayerId(player: PlayerId): PlayerId {
  return player === "player1" ? "player2" : "player1";
}
