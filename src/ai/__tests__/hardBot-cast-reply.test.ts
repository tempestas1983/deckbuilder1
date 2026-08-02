/**
 * 2-Ply gegen billige Gegenantwort des hard-Bots (siehe hardBot.ts,
 * Moduldoku Punkt 6 / Funktion evaluateCastCandidateEnd): Die Top-K-
 * Shortlist in chooseBestCastOrActivateHard bewertete Cast-/Activate-
 * Kandidaten bisher NUR isoliert (1-Ply) — direkt nach der eigenen Aktion,
 * OHNE zu berücksichtigen, dass danach (typischer Fall: eine eigene
 * reaktive fast-Karte im gegnerischen Zug) wieder der GEGNER Priorität
 * bekommt und selbst noch etwas Bezahlbares tut.
 *
 * Dieser Test baut genau diese Falle deterministisch nach (analog zum
 * Lethal-Check-Test hardBot-lethal.test.ts):
 * - Der Bot (player1) hält während des gegnerischen Zugs (player2 aktiv,
 *   Stack leer) Priorität und hat GENAU 1 Mana — reicht für GENAU eine von
 *   zwei fast-Karten:
 *   - "Kleiner Blitz" (1 Mana, 9 Leben gewinnen): isoliert (1-Ply) etwas
 *     WENIGER wertvoll als Verbannung (Eval-Gewicht 1.0 -> +9).
 *   - "Verbannung" (1 Mana, zerstört eine gegnerische 3/3-Kreatur):
 *     isoliert klar wertvoller (Removal-Bonus + unitValue*2.2 -> +13.2) —
 *     die normale 1-Ply-Wahl bevorzugt sie klar.
 * - Der Gegner hat exakt 1 Mana UND eine eigene fast-Karte ("Vergeltung",
 *   7 Schaden direkt ins Gesicht) auf der Hand — nach JEDER der beiden
 *   Bot-Aktionen bekommt der Gegner (aktiver Spieler) die Priorität zurück
 *   und kann "Vergeltung" sofort casten (billige Gegenantwort: die
 *   statisch einzige verfügbare Option des Gegners, also auch das, was
 *   opponentCheapResponseCandidates findet).
 * - Der Bot steht bei 5 Leben: Nach "Verbannung" bleibt er bei 5 Leben ->
 *   "Vergeltung" (7 Schaden) tötet ihn (Partie verloren, -10000 im Eval).
 *   Nach "Kleiner Blitz" steht er bei 14 Leben -> "Vergeltung" (7 Schaden)
 *   lässt ihn bei 7 Leben klar überleben (sogar netto über dem
 *   Ausgangswert von 5 -> übersteht auch den MIN_EVAL_GAIN-Vergleich
 *   gegen die unveränderte Ausgangsstellung, s. Gegenprobe unten).
 *
 * Erwartung: Der hard-Bot castet "Kleiner Blitz" (nicht "Verbannung"),
 * obwohl "Verbannung" isoliert (1-Ply) klar besser aussieht — nur die
 * billige Gegenantwort-Simulation (2-Ply) deckt die tödliche Falle auf.
 *
 * Gegenprobe (wie beim Lethal-Check: Beweis, dass die Falle bei isolierter
 * 1-Ply-Bewertung tatsächlich zuschlagen WÜRDE): "Verbannung" hat den klar
 * höheren isolierten (1-Ply) Score als "Kleiner Blitz" (jeweils NACH
 * vollständiger Stack-Auflösung, aber OHNE die Gegenantwort-Simulation) —
 * eine rein isolierte Bewertung (ohne den neuen 2-Ply-Zweig) würde sie
 * wählen; erst die Gegenantwort-Simulation macht daraus den Fehlgriff
 * sichtbar und verhindert ihn.
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { createCardInstance, moveCard } from "../../engine";
import { chooseActionForDifficulty } from "../difficulty";
import { evaluateState } from "../boardEval";
import type { CardPool, GameState, PlayerAction, RulesEngine } from "../../model";

const REPLY_POOL: CardPool = {
  "reply-test.filler-terrain": {
    id: "reply-test.filler-terrain",
    name: "Ödland",
    type: "terrain",
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "flame", amount: 1 }],
        isManaAbility: true,
      },
    ],
  },
  "reply-test.small-heal": {
    id: "reply-test.small-heal",
    name: "Kleiner Blitz",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    effects: [{ kind: "gainLife", who: "controller", amount: 9 }],
  },
  "reply-test.banish": {
    id: "reply-test.banish",
    name: "Verbannung",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
    effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
  },
  "reply-test.target-unit": {
    id: "reply-test.target-unit",
    name: "Wachtroll",
    type: "unit",
    cost: { generic: 3 },
    power: 3,
    toughness: 3,
  },
  "reply-test.retaliate": {
    id: "reply-test.retaliate",
    name: "Vergeltung",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    effects: [{ kind: "dealDamage", to: "opponent", amount: 7 }],
  },
};

/** Lokale Kopie des test-helpers.ts-Musters — bewusst dupliziert, wie hardBot-lethal.test.ts es bereits vormacht. */
function applyOk(engine: RulesEngine, state: GameState, action: PlayerAction): GameState {
  const result = engine.applyAction(state, action);
  if (result.error) {
    throw new Error(`Erwartete legale Aktion, bekam Fehler: ${result.error} (Aktion: ${JSON.stringify(action)})`);
  }
  return result.state;
}

function bothPass(engine: RulesEngine, state: GameState): GameState {
  let s = state;
  const first = s.priorityPlayer;
  if (!first) throw new Error("bothPass: keine Priority vergeben.");
  s = applyOk(engine, s, { kind: "passPriority", player: first });
  const second = s.priorityPlayer;
  if (!second) throw new Error("bothPass: keine zweite Priority vergeben.");
  s = applyOk(engine, s, { kind: "passPriority", player: second });
  return s;
}

function advanceToStep(engine: RulesEngine, state: GameState, targetStep: GameState["step"]): GameState {
  let s = state;
  let guard = 0;
  while (s.step !== targetStep) {
    if (s.priorityPlayer === undefined) {
      if (s.step === "declareAttackers") {
        s = applyOk(engine, s, { kind: "declareAttackers", player: s.activePlayer, attackers: [] });
        continue;
      }
      if (s.step === "declareBlockers") {
        const defender = s.activePlayer === "player1" ? "player2" : "player1";
        s = applyOk(engine, s, { kind: "declareBlockers", player: defender, blocks: [] });
        continue;
      }
      throw new Error(`advanceToStep: Step "${s.step}" braucht eine explizite Turn-Based-Action.`);
    }
    s = bothPass(engine, s);
    guard += 1;
    if (guard > 50) throw new Error(`advanceToStep: keine Konvergenz zu "${targetStep}" (bei "${s.step}").`);
  }
  return s;
}

function buildDeck(): Record<string, number> {
  return { "reply-test.filler-terrain": 20 };
}

/**
 * Baut die "Falle": player2 ist aktiv (main1, Stack leer), player1 hält
 * Priorität mit genau 1 Mana und den beiden Kandidatenkarten; player2 hat
 * genau 1 Mana und "Vergeltung" auf der Hand plus eine 2/2 auf dem
 * Battlefield als Verbannungs-Ziel.
 */
function buildReplyTrap(engine: RulesEngine): GameState {
  const decks = { player1: buildDeck(), player2: buildDeck() };
  let state = engine.createGame({ decks, seed: 1, skipMulligans: true, startingPlayer: "player1" }).state;
  // Erst player1s eigenen Zug komplett überspringen (nichts Relevantes dort
  // nötig) bis zu player2s main1 mit leerem Stack.
  state = advanceToStep(engine, state, "endStep");
  state = bothPass(engine, state); // -> cleanup
  state = advanceToStep(engine, state, "main1"); // player2s main1 (Zugwechsel)
  expect(state.activePlayer).toBe("player2");
  expect(state.priorityPlayer).toBe("player2");
  // player2 passt einmal -> Priorität geht an player1 (Reaktionsfenster),
  // Stack bleibt leer.
  state = applyOk(engine, state, { kind: "passPriority", player: "player2" });
  expect(state.priorityPlayer).toBe("player1");

  // player1 (Bot): 5 Leben, genau 1 Mana, GENAU die zwei Kandidatenkarten.
  state.players.player1.life = 5;
  state.players.player1.hand = [];
  const smallHealInst = createCardInstance(state, "reply-test.small-heal", "player1");
  state.players.player1.hand.push(smallHealInst.instanceId);
  const banishInst = createCardInstance(state, "reply-test.banish", "player1");
  state.players.player1.hand.push(banishInst.instanceId);
  state.players.player1.manaPool = { flame: 1, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 };

  // player2: genau 1 Mana, "Vergeltung" auf der Hand, ein Verbannungsziel im Spiel.
  state.players.player2.hand = [];
  const retaliateInst = createCardInstance(state, "reply-test.retaliate", "player2");
  state.players.player2.hand.push(retaliateInst.instanceId);
  state.players.player2.manaPool = { flame: 1, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 };
  const targetInst = createCardInstance(state, "reply-test.target-unit", "player2");
  moveCard(state, [], targetInst.instanceId, "player2", "battlefield");
  state.cards[targetInst.instanceId]!.permanentState!.summoningSick = false;

  return state;
}

describe("hardBot: 2-Ply gegen billige Gegenantwort", () => {
  const engine = createRulesEngine(REPLY_POOL);

  it("castet die isoliert schwächere, aber gegen die Gegenantwort überlebensfähige Karte", () => {
    const state = buildReplyTrap(engine);
    const action = chooseActionForDifficulty(engine, REPLY_POOL, state, "player1", "hard");
    expect(action.kind).toBe("castSpell");
    if (action.kind === "castSpell") {
      const card = state.cards[action.cardInstanceId];
      expect(card?.definitionId).toBe("reply-test.small-heal");
    }
  });

  it("Gegenprobe: 'Verbannung' hat isoliert (1-Ply, ohne Gegenantwort) den klar höheren Score als 'Kleiner Blitz'", () => {
    // Beweist, dass die Falle bei rein isolierter Bewertung tatsächlich
    // zuschlagen würde (analog zum Lethal-Check-Gegenbeweis): Zustand NACH
    // vollständiger Auflösung von "Verbannung" (Ziel-Kreatur weg, KEINE
    // Gegenantwort simuliert) wird höher bewertet als der Zustand nach
    // "Kleiner Blitz" — GENAU der Fehlgriff, den die 2-Ply-Erweiterung durch
    // die Gegenantwort-Simulation oben korrigiert.
    const state = buildReplyTrap(engine);
    const banishId = state.players.player1.hand.find((id) => state.cards[id]?.definitionId === "reply-test.banish")!;
    const targetId = state.players.player2.battlefield[0]!;
    const castBanish: PlayerAction = {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: banishId,
      chosenTargets: [{ kind: "permanent", instanceId: targetId }],
    };
    const smallHealId = state.players.player1.hand.find(
      (id) => state.cards[id]?.definitionId === "reply-test.small-heal",
    )!;
    const castSmallHeal: PlayerAction = {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: smallHealId,
      chosenTargets: [],
    };

    // Stack vollständig auflösen (castSpell legt nur auf den Stack — erst
    // beide Pässe lösen den Effekt tatsächlich aus), aber OHNE danach eine
    // Gegenantwort zu casten (das ist genau der Unterschied zum 2-Ply-Pfad).
    const afterBanish = bothPass(engine, applyOk(engine, state, castBanish));
    const afterSmallHeal = bothPass(engine, applyOk(engine, state, castSmallHeal));

    const banishScore = evaluateState(REPLY_POOL, afterBanish, "player1");
    const smallHealScore = evaluateState(REPLY_POOL, afterSmallHeal, "player1");
    expect(banishScore).toBeGreaterThan(smallHealScore);
  });
});
