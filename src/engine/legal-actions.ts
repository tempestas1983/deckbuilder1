/**
 * getLegalActions: Enumeration spielbarer Aktionen für einen Spieler im
 * aktuellen State. v0.2-Abdeckung reicht für die geforderten "einfachen
 * Fälle" (Karte spielen bei Priority+Mana, Priority passen) sowie
 * grundlegende Combat-Deklarationen und PendingDecision-Kandidaten.
 *
 * Vertragspräzisierung (rules-engine.md 9.6, RulesEngine-Interface-Kommentar):
 * diese Liste ist bewusst NICHT erschöpfend - `applyAction` bleibt die
 * Legalitäts-Wahrheit. BEWUSST NICHT vollständig (siehe docs/engine-status.md):
 * - Karten/Fähigkeiten mit MEHR ALS EINEM Zielslot werden nicht kombinatorisch
 *   enumeriert (nur 0 oder 1 Slot). TODO für game-architect/Erweiterung.
 * - X-Kosten-Karten werden nicht enumeriert (welches X soll geraten werden?
 *   rules-engine.md 4: "getLegalActions enumeriert X-Werte nicht"). Frontend
 *   muss dafür eine eigene Eingabe bauen und `applyAction` direkt mit
 *   gewähltem `chosenX` aufrufen (Legalität wird dort geprüft).
 * - declareAttackers/declareBlockers: nur Einzel-Kandidaten (kein Angreifer /
 *   genau ein Angreifer bzw. kein Block / genau ein Block) werden enumeriert,
 *   keine kombinatorische Teilmengenbildung (kombinatorisch bei > ein paar
 *   Units schnell riesig). Bei aktiver `guardian`-Pflicht (rules-engine.md 6)
 *   werden NUR Einzel-Blocks enumeriert, die die Pflicht erfüllen (bzw. gar
 *   keine, wenn mehr als eine guardian-Unit gleichzeitig blocken muss - das
 *   ist kombinatorisch und wird bewusst nicht angeboten). Frontend kann
 *   dennoch JEDE legale Kombination per applyAction einreichen.
 * - discardToHandSize: wird NICHT enumeriert (kombinatorisch, spielerabhängige
 *   Wahl). Frontend erkennt die Pflicht daran, dass state.step === "cleanup",
 *   state.priorityPlayer === undefined (und state.pendingDecision ===
 *   undefined) und hand.length > 7 ist, und muss selbst eine
 *   cardInstanceIds-Liste der richtigen Länge zusammenstellen.
 * - resolveDecision (chooseTriggerTargets): nur bei genau einem Zielslot
 *   enumeriert (gleiche Begründung wie oben).
 * - v0.3: X-Kosten auf aktivierten Fähigkeiten (rules-engine.md 4 + 9.12)
 *   werden wie X-Spells NICHT enumeriert (gleiche Begründung). Modale
 *   Spells/Fähigkeiten (rules-engine.md 4 + 9.13) liefern GENAU EINEN
 *   Kandidaten ohne chosenMode/chosenTargets (anders als X-Kosten: nicht
 *   komplett ausgelassen), sofern mindestens ein Modus wählbar ist -
 *   Frontend fragt Modus + Ziele separat ab. `resolveDecision` bei
 *   "mulligan" enumeriert beide Antworten vollständig, bei "chooseMode"
 *   einen Kandidaten pro `selectableModes`-Eintrag.
 */

import type {
  Ability,
  CardDefinition,
  CardInstance,
  CardPool,
  ChosenTarget,
  GameState,
  PendingDecision,
  PlayerAction,
  PlayerId,
} from "../model";
import { getDefinition, getDefinitionForInstance } from "./card-defs";
import { canPayCost } from "./mana";
import { computeSpellCostDelta } from "./stats";
import { canActivateAbilityNow, canCastNow, canPlayTerrainNow, hasPriority } from "./legality";
import { enumerateLegalTargets } from "./targets";
import { selectableModeIndices } from "./modal";
import { guardianUnitsRequiringBlock, isLegalAttacker, isLegalBlock } from "./combat";
import { otherPlayer } from "./util";

function castSpellCandidates(state: GameState, pool: CardPool, player: PlayerId): PlayerAction[] {
  const result: PlayerAction[] = [];
  for (const cardInstanceId of state.players[player].hand) {
    const card = state.cards[cardInstanceId];
    if (!card) continue;
    const def = getDefinition(pool, card.definitionId);
    if (def.type === "terrain") continue; // separat über playTerrain
    if (!canCastNow(state, player, def)) continue;
    if (def.cost.x) continue; // TODO: X-Kosten werden nicht enumeriert, siehe Datei-Kommentar.

    const costDelta = computeSpellCostDelta(state, pool, player);

    // v0.3 (Modal-Spells, rules-engine.md 4 + 9.13): wie X-Kosten liefert
    // getLegalActions hier NUR einen Kandidaten OHNE chosenMode/chosenTargets
    // (Frontend fragt Modus + Ziele separat ab) - Modus-x-Ziel-Kombinationen
    // werden nicht enumeriert. Ist KEIN Modus wählbar, ist die Karte gerade
    // nicht castbar (analog "kein legales Ziel beim Ansagen").
    if (def.type === "spell" && def.modes && def.modes.length > 0) {
      const selectable = selectableModeIndices(state, pool, def.modes, player);
      if (selectable.length === 0) continue;
      if (canPayCost(state.players[player].manaPool, def.cost, undefined, costDelta)) {
        result.push({ kind: "castSpell", player, cardInstanceId, chosenTargets: [] });
      }
      continue;
    }

    const targetSpecs =
      def.type === "spell" ? def.targets : def.type === "enchantment" && def.enchantKind === "aura" ? [def.auraTarget!] : undefined;

    if (!targetSpecs || targetSpecs.length === 0) {
      if (canPayCost(state.players[player].manaPool, def.cost, undefined, costDelta)) {
        result.push({ kind: "castSpell", player, cardInstanceId, chosenTargets: [] });
      }
      continue;
    }
    if (targetSpecs.length === 1) {
      if (!canPayCost(state.players[player].manaPool, def.cost, undefined, costDelta)) continue;
      const options = enumerateLegalTargets(state, pool, targetSpecs[0]!, player);
      for (const target of options) {
        result.push({ kind: "castSpell", player, cardInstanceId, chosenTargets: [target] });
      }
    }
    // targetSpecs.length > 1: nicht enumeriert, siehe Datei-Kommentar.
  }
  return result;
}

function playTerrainCandidates(state: GameState, pool: CardPool, player: PlayerId): PlayerAction[] {
  const result: PlayerAction[] = [];
  if (!canPlayTerrainNow(state, player)) return result;
  for (const cardInstanceId of state.players[player].hand) {
    const card = state.cards[cardInstanceId];
    if (!card) continue;
    const def = getDefinition(pool, card.definitionId);
    if (def.type === "terrain") {
      result.push({ kind: "playTerrain", player, cardInstanceId });
    }
  }
  return result;
}

/**
 * Bezahlbarkeit ALLER `AdditionalCost`-Varianten einer aktivierten Fähigkeit
 * gegen den aktuellen Zustand ("tap"/"payLife"/"discardCards"/
 * "removeCounters") — muss exakt dieselben Prüfungen wie die
 * `activateAbility`-Validierung in `actions.ts#validateAction` abdecken.
 *
 * Bugfix (gefunden beim Bot-vs-Bot-Testen, siehe docs/ai-status.md /
 * docs/engine-status.md): Vor diesem Fix prüfte diese Funktion nur "tap" -
 * `getLegalActions` konnte dadurch einen `activateAbility`-Kandidaten
 * liefern (z.B. mit `removeCounters`-Zusatzkosten), den `applyAction`
 * anschließend als illegal ablehnte ("Nicht genug Marken."). Das verletzt
 * den `getLegalActions`-Vertrag ("garantiert enumeriert werden ... mit 0
 * oder 1 Zielslot" impliziert: enumerierte Kandidaten sind tatsächlich
 * ausführbar) und hätte auch im echten UI zu einem anklickbaren, aber
 * fehlschlagenden Fähigkeiten-Button führen können.
 */
function additionalCostsPayable(
  state: GameState,
  player: PlayerId,
  card: CardInstance,
  def: CardDefinition,
  ability: Extract<Ability, { kind: "activated" }>,
): boolean {
  for (const cost of ability.additionalCosts ?? []) {
    if (cost.kind === "tap") {
      if (card.permanentState!.tapped) return false;
      if (card.permanentState!.summoningSick && def.type === "unit") return false;
    } else if (cost.kind === "payLife") {
      if (state.players[player].life < cost.amount) return false;
    } else if (cost.kind === "discardCards") {
      if (state.players[player].hand.length < cost.count) return false;
    } else if (cost.kind === "removeCounters") {
      if ((card.permanentState!.counters[cost.counterType] ?? 0) < cost.count) return false;
    }
  }
  return true;
}

function activateAbilityCandidates(state: GameState, pool: CardPool, player: PlayerId): PlayerAction[] {
  const result: PlayerAction[] = [];
  for (const sourceInstanceId of state.players[player].battlefield) {
    const card = state.cards[sourceInstanceId];
    if (!card?.permanentState) continue;
    const def = getDefinition(pool, card.definitionId);
    const abilities = "abilities" in def ? def.abilities ?? [] : [];
    abilities.forEach((ability, abilityIndex) => {
      if (ability.kind !== "activated") return;
      if (!canActivateAbilityNow(state, player, ability)) return;
      if (!additionalCostsPayable(state, player, card, def, ability)) return;
      // v0.3 (rules-engine.md 4 + 9.12): X-Kosten werden wie bei Spells nicht
      // enumeriert (canPayCost mit chosenX=undefined lehnt X-Kosten ohnehin
      // ab - expliziter früher Return für Lesbarkeit, gleiche Linie wie
      // castSpellCandidates).
      if (ability.manaCost?.x) return;
      if (!canPayCost(state.players[player].manaPool, ability.manaCost ?? {}, undefined)) return;

      // v0.3 (Modal-Fähigkeiten, rules-engine.md 4 + 9.13): analog zu
      // castSpellCandidates - ein Kandidat ohne chosenMode/chosenTargets,
      // sofern mindestens ein Modus wählbar ist.
      if (ability.modes && ability.modes.length > 0) {
        const selectable = selectableModeIndices(state, pool, ability.modes, player);
        if (selectable.length === 0) return;
        result.push({ kind: "activateAbility", player, sourceInstanceId, abilityIndex, chosenTargets: [] });
        return;
      }

      const targetSpecs = ability.targets;
      if (!targetSpecs || targetSpecs.length === 0) {
        result.push({ kind: "activateAbility", player, sourceInstanceId, abilityIndex, chosenTargets: [] });
        return;
      }
      if (targetSpecs.length === 1) {
        const options = enumerateLegalTargets(state, pool, targetSpecs[0]!, player);
        for (const target of options) {
          result.push({ kind: "activateAbility", player, sourceInstanceId, abilityIndex, chosenTargets: [target] });
        }
      }
      // targetSpecs.length > 1: nicht enumeriert, siehe Datei-Kommentar.
    });
  }
  return result;
}

function combatCandidates(state: GameState, pool: CardPool, player: PlayerId): PlayerAction[] {
  const result: PlayerAction[] = [];
  if (state.priorityPlayer !== undefined || state.pendingDecision !== undefined) return result;

  if (state.step === "declareAttackers" && state.activePlayer === player) {
    result.push({ kind: "declareAttackers", player, attackers: [] });
    for (const instanceId of state.players[player].battlefield) {
      if (isLegalAttacker(state, pool, player, instanceId)) {
        result.push({ kind: "declareAttackers", player, attackers: [instanceId] });
      }
    }
  }
  if (state.step === "declareBlockers" && otherPlayer(state, state.activePlayer) === player) {
    const requiredGuardians = guardianUnitsRequiringBlock(state, pool, player);
    if (requiredGuardians.length === 0) {
      result.push({ kind: "declareBlockers", player, blocks: [] });
    }
    for (const blocker of state.players[player].battlefield) {
      // Bei > 1 gleichzeitig zu erfüllender guardian-Pflicht ist ein
      // Einzel-Block-Kandidat nie ausreichend legal -> keine Enumeration
      // (siehe Datei-Kommentar oben; applyAction validiert trotzdem jede
      // vollständige, die Pflicht erfüllende Kombination korrekt).
      if (requiredGuardians.length > 1 || (requiredGuardians.length === 1 && !requiredGuardians.includes(blocker))) {
        continue;
      }
      for (const attacker of state.players[state.activePlayer].battlefield) {
        if (isLegalBlock(state, pool, player, blocker, attacker)) {
          result.push({ kind: "declareBlockers", player, blocks: [{ blocker, attacker }] });
        }
      }
    }
  }
  return result;
}

function resolveDecisionCandidates(
  state: GameState,
  pool: CardPool,
  decision: PendingDecision,
  player: PlayerId,
): PlayerAction[] {
  if (decision.player !== player) return [];
  if (decision.kind === "mulligan") {
    // rules-engine.md 1b: beide Antworten sind immer legal, vollständig enumerierbar.
    return [
      { kind: "resolveDecision", player, choice: { kind: "mulligan", takeMulligan: true } },
      { kind: "resolveDecision", player, choice: { kind: "mulligan", takeMulligan: false } },
    ];
  }
  if (decision.kind === "chooseMode") {
    // rules-engine.md 4 + 9.13: ein Kandidat pro Eintrag in selectableModes.
    return decision.selectableModes.map(
      (modeIndex): PlayerAction => ({
        kind: "resolveDecision",
        player,
        choice: { kind: "chooseMode", modeIndex },
      }),
    );
  }
  if (decision.kind === "orderBlockers") {
    // rules-engine.md 9.9 (Vertragshinweis): mindestens EIN gültiger
    // Kandidat genügt - Permutationen werden NICHT enumeriert. Die
    // Deklarationsreihenfolge (unveränderte blockers-Liste je Angreifer) ist
    // immer eine gültige Permutation.
    return [
      {
        kind: "resolveDecision",
        player,
        choice: {
          kind: "orderBlockers",
          orders: decision.attackers.map((a) => ({ attacker: a.attacker, blockers: [...a.blockers] })),
        },
      },
    ];
  }
  if (decision.kind !== "chooseTriggerTargets") {
    // chooseManaColor/chooseDiscard/orderScry: v0.2 setzt diese noch nie (siehe
    // triggers.ts/effects.ts-Kommentare) - kein Kandidat nötig, aktuell unerreichbar.
    return [];
  }
  const def = getDefinitionForInstance(pool, state, decision.sourceInstanceId);
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  const ability = abilities[decision.abilityIndex];
  if (!ability || ability.kind !== "triggered") return [];
  // v0.3.1 (rules-engine.md 9.13, Nachtrag): bei modalen Triggern (Ketten-
  // Decision chooseMode -> chooseTriggerTargets) beziehen sich die Zielslots
  // auf den in decision.chosenMode bereits gewählten Modus.
  const specs = decision.chosenMode !== undefined ? (ability.modes?.[decision.chosenMode]?.targets ?? []) : (ability.targets ?? []);
  if (specs.length !== 1) return []; // nicht erschöpfend, siehe Datei-Kommentar oben

  const options = enumerateLegalTargets(state, pool, specs[0]!, decision.player);
  return options.map((target): PlayerAction => ({
    kind: "resolveDecision",
    player,
    choice: { kind: "chooseTriggerTargets", chosenTargets: [target] as ChosenTarget[] },
  }));
}

export function getLegalActions(state: GameState, player: PlayerId, pool: CardPool): PlayerAction[] {
  if (state.winner !== undefined) return [];

  if (state.pendingDecision) {
    return [...resolveDecisionCandidates(state, pool, state.pendingDecision, player), { kind: "concede", player }];
  }

  const result: PlayerAction[] = [];
  if (hasPriority(state, player)) {
    result.push({ kind: "passPriority", player });
    result.push(...castSpellCandidates(state, pool, player));
    result.push(...playTerrainCandidates(state, pool, player));
    result.push(...activateAbilityCandidates(state, pool, player));
  }
  result.push(...combatCandidates(state, pool, player));
  result.push({ kind: "concede", player });
  return result;
}
