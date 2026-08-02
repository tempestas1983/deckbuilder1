/**
 * Lethal-Check des hard-Bots (siehe docs/ai-status.md / hardBot.ts Abschnitt
 * "Lethal-Check"): Das normale 1-Ply-Lookahead bewertet Cast-/Activate-
 * Kandidaten NUR isoliert — ein Direktschaden-Zauber aufs gegnerische
 * Gesicht verliert diesen Einzelvergleich fast immer gegen eine größere
 * Kreatur (unitValue ist mit 2.2 gewichtet, ein Lebenspunkt nur mit 1.0),
 * selbst wenn Zauber + Alpha-Strike ZUSAMMEN diesen Zug gewinnen würden.
 *
 * Dieser Test baut genau diese Falle deterministisch nach:
 * - Gegner steht bei 5 Leben.
 * - Der Bot hat GENAU 2 Mana (reicht für GENAU eine der beiden Karten).
 * - "Blitzschlag" (2 Mana, 3 Schaden ins Gesicht) UND "Koloss" (2 Mana,
 *   3/3-Kreatur ohne Fähigkeiten) sind beide castbar.
 * - Ein bereits im Spiel stehender 3/3-Angreifer (nicht sommerkrank) kann
 *   ungeblockt angreifen (Gegner hat kein Board).
 * - Isoliert bewertet ist "Koloss casten" für die 1-Ply-Heuristik klar
 *   attraktiver (Board-Wert) als "Blitzschlag casten" (nur Lebenspunkte) —
 *   nur "Blitzschlag + Angriff" gewinnt aber diesen Zug (3 + 3 = 6 >= 5),
 *   "Koloss + Angriff" NICHT (nur 3 Schaden, Gegner bleibt bei 2 Leben).
 *
 * Erwartung: Der hard-Bot castet Blitzschlag (nicht Koloss) und gewinnt die
 * Partie noch in diesem Zug.
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { createCardInstance, moveCard } from "../../engine";
import { chooseActionForDifficulty } from "../difficulty";
import type { CardPool, GameState, PlayerAction, PlayerId, RulesEngine } from "../../model";

const LETHAL_POOL: CardPool = {
  "lethal-test.filler-terrain": {
    id: "lethal-test.filler-terrain",
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
  "lethal-test.bolt": {
    id: "lethal-test.bolt",
    name: "Blitzschlag",
    type: "spell",
    speed: "slow",
    cost: { generic: 2 },
    effects: [{ kind: "dealDamage", to: "opponent", amount: 3 }],
  },
  "lethal-test.colossus": {
    id: "lethal-test.colossus",
    name: "Koloss",
    type: "unit",
    cost: { generic: 2 },
    power: 3,
    toughness: 3,
  },
  "lethal-test.attacker": {
    id: "lethal-test.attacker",
    name: "Vorreiter",
    type: "unit",
    cost: { generic: 1 },
    power: 3,
    toughness: 3,
  },
};

/** Lokale Kopie des test-helpers.ts-Musters (applyOk/bothPass/advanceToStep) — bewusst hier dupliziert statt aus src/engine/__tests__ importiert (ai/__tests__ bleibt eigenständig, wie difficulty.test.ts/simpleBot.test.ts es bereits vormachen). */
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
  // Genug Karten für Starthand + ein paar Züge Puffer; Inhalt ist für den
  // Test irrelevant, die tatsächlich genutzten Karten werden direkt in Hand/
  // Battlefield gesetzt.
  return { "lethal-test.filler-terrain": 20 };
}

function actingPlayer(state: GameState): PlayerId | undefined {
  if (state.pendingDecision) return state.pendingDecision.player;
  if (state.priorityPlayer) return state.priorityPlayer;
  if (state.step === "declareAttackers") return state.activePlayer;
  if (state.step === "declareBlockers") return state.activePlayer === "player1" ? "player2" : "player1";
  if (state.step === "cleanup" && state.players[state.activePlayer].hand.length > 7) return state.activePlayer;
  return undefined;
}

/** Baut die "Falle": Angreifer im Spiel, Blitzschlag + Koloss auf der Hand, genau 2 Mana, Gegner bei 5 Leben. */
function buildLethalTrap(engine: RulesEngine): GameState {
  const decks = { player1: buildDeck(), player2: buildDeck() };
  let state = engine.createGame({ decks, seed: 1, skipMulligans: true, startingPlayer: "player1" }).state;
  state = advanceToStep(engine, state, "main1");
  expect(state.activePlayer).toBe("player1");
  expect(state.priorityPlayer).toBe("player1");

  // Bereits im Spiel stehender, nicht sommerkranker Angreifer.
  const attackerInst = createCardInstance(state, "lethal-test.attacker", "player1");
  moveCard(state, [], attackerInst.instanceId, "player1", "battlefield");
  state.cards[attackerInst.instanceId]!.permanentState!.summoningSick = false;

  // Hand auf genau die zwei relevanten Karten reduzieren (die Starthand
  // besteht sonst nur aus Filler-Terrains, s. buildDeck — die würden sofort
  // per "Terrain spielen"-Schritt gezogen und den Test verfälschen).
  state.players.player1.hand = [];
  const boltInst = createCardInstance(state, "lethal-test.bolt", "player1");
  state.players.player1.hand.push(boltInst.instanceId);
  const colossusInst = createCardInstance(state, "lethal-test.colossus", "player1");
  state.players.player1.hand.push(colossusInst.instanceId);

  // Genau 2 Mana — reicht für GENAU eine der beiden Karten.
  state.players.player1.manaPool.colorless = 2;

  // Gegner bei 5 Leben, kein Board -> der Angreifer kommt ungeblockt durch.
  state.players.player2.life = 5;

  return state;
}

describe("hardBot: Lethal-Check", () => {
  const engine = createRulesEngine(LETHAL_POOL);

  it("castet den Face-Damage-Zauber statt der isoliert 'besseren' Kreatur, wenn nur die Kombination lethal ist", () => {
    const state = buildLethalTrap(engine);
    const action = chooseActionForDifficulty(engine, LETHAL_POOL, state, "player1", "hard");
    expect(action.kind).toBe("castSpell");
    if (action.kind === "castSpell") {
      const card = state.cards[action.cardInstanceId];
      expect(card?.definitionId).toBe("lethal-test.bolt");
    }
  });

  it("gewinnt die Partie noch in diesem Zug (Blitzschlag + Alpha-Strike)", () => {
    let state = buildLethalTrap(engine);
    let actions = 0;
    while (state.winner === undefined && actions < 50) {
      const actor = actingPlayer(state);
      if (!actor) throw new Error(`Kein Akteur bestimmbar: step=${state.step}`);
      const action = chooseActionForDifficulty(engine, LETHAL_POOL, state, actor, "hard");
      state = applyOk(engine, state, action);
      actions += 1;
    }
    expect(state.winner).toBe("player1");
    expect(state.players.player2.life).toBeLessThanOrEqual(0);
  });
});
