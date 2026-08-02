/**
 * Mana-Zurückhalten des hard-Bots (siehe hardBot.ts, Moduldoku Punkt 5 /
 * Funktion shouldHoldManaBack): Bisher tappte der Bot in seinem eigenen
 * Main-Phase-Fenster proaktiv JEDE verfügbare Manaquelle, sobald die Hand
 * eine Nicht-Terrain-Karte enthielt ("Finaler Mana-Aufbau-Fallback",
 * chooseBestCastOrActivateHard) — auch dann, wenn dadurch eine bezahlbare,
 * reaktive fast-Karte (Removal/Direktschaden) für den gegnerischen Zug
 * unbezahlbar wurde.
 *
 * Dieser Test baut die "Falle" deterministisch nach:
 * - Der Bot hat GENAU 2 ungetappte Manaquellen und auf der Hand GENAU eine
 *   bezahlbare, typischerweise reaktive fast-Karte ("Blitzschlag", 2 Mana,
 *   Direktschaden) — sonst nichts Castbares (0 Mana im Pool).
 * - Ohne die neue Heuristik würde der proaktive Mana-Aufbau-Fallback eine
 *   der beiden Quellen sofort tappen ("könnte ja später nützlich sein") —
 *   und Blitzschlag damit für den gegnerischen Zug unbezahlbar machen.
 * - Die neue Heuristik erkennt den exakten Grenzfall (ungetappte Quellen ==
 *   Kosten der reaktiven Karte) und tappt NICHT, der Bot passt stattdessen.
 *
 * Gegenprobe: Passen die Kosten NICHT exakt zur Anzahl ungetappter Quellen
 * (hier: Karte kostet mehr, als selbst alle Quellen zusammen decken könnten
 * — Zurückhalten wäre für diese Karte ohnehin nutzlos), tappt der Bot ganz
 * normal weiter wie zuvor (v1-Verhalten, docs/ai-status.md Abschnitt
 * "Mana-Aufbau-Fallback").
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { createCardInstance, moveCard } from "../../engine";
import { chooseActionForDifficulty } from "../difficulty";
import type { CardPool, GameState, PlayerAction, PlayerId, RulesEngine } from "../../model";

const HOLD_BACK_POOL: CardPool = {
  "hold-back-test.filler-terrain": {
    id: "hold-back-test.filler-terrain",
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
  "hold-back-test.mana-source": {
    id: "hold-back-test.mana-source",
    name: "Feuerquelle",
    type: "relic",
    cost: { generic: 1 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "flame", amount: 1 }],
        isManaAbility: true,
      },
    ],
  },
  "hold-back-test.bolt-2": {
    id: "hold-back-test.bolt-2",
    name: "Blitzschlag",
    type: "spell",
    speed: "fast",
    cost: { flame: 2 },
    effects: [{ kind: "dealDamage", to: "opponent", amount: 2 }],
  },
  "hold-back-test.bolt-3": {
    id: "hold-back-test.bolt-3",
    name: "Großer Blitzschlag",
    type: "spell",
    speed: "fast",
    cost: { flame: 3 },
    effects: [{ kind: "dealDamage", to: "opponent", amount: 3 }],
  },
};

/** Lokale Kopie des test-helpers.ts-Musters — bewusst dupliziert, wie hardBot-lethal.test.ts es bereits vormacht (ai/__tests__ bleibt eigenständig). */
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
  return { "hold-back-test.filler-terrain": 20 };
}

/** Baut die "Falle": 2 ungetappte Manaquellen, GENAU eine bezahlbare reaktive fast-Karte auf der Hand, 0 Mana im Pool. */
function buildHoldBackTrap(engine: RulesEngine, boltDefinitionId: string): GameState {
  const decks = { player1: buildDeck(), player2: buildDeck() };
  let state = engine.createGame({ decks, seed: 1, skipMulligans: true, startingPlayer: "player1" }).state;
  state = advanceToStep(engine, state, "main1");
  expect(state.activePlayer).toBe("player1");
  expect(state.priorityPlayer).toBe("player1");

  // Genau 2 ungetappte Manaquellen (zwei unterschiedliche Permanent-Typen,
  // damit "Manaquelle" nicht zufällig mit "Terrain" verwechselt wird).
  const terrainInst = createCardInstance(state, "hold-back-test.filler-terrain", "player1");
  moveCard(state, [], terrainInst.instanceId, "player1", "battlefield");
  const relicInst = createCardInstance(state, "hold-back-test.mana-source", "player1");
  moveCard(state, [], relicInst.instanceId, "player1", "battlefield");

  // Hand auf GENAU die eine relevante Karte reduzieren (die Starthand
  // besteht sonst nur aus Filler-Terrains, s. buildDeck).
  state.players.player1.hand = [];
  const boltInst = createCardInstance(state, boltDefinitionId, "player1");
  state.players.player1.hand.push(boltInst.instanceId);

  // 0 Mana im Pool — nichts ist gerade castbar, der proaktive
  // Mana-Aufbau-Fallback wäre (ohne die neue Heuristik) der nächste Schritt.
  state.players.player1.manaPool = { flame: 0, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 };

  return state;
}

describe("hardBot: Mana-Zurückhalten", () => {
  const engine = createRulesEngine(HOLD_BACK_POOL);

  it("tappt KEINE Manaquelle, wenn genau eine bezahlbare reaktive fast-Karte auf der Hand ohnehin unbezahlbar würde", () => {
    const state = buildHoldBackTrap(engine, "hold-back-test.bolt-2"); // kostet 2 == 2 ungetappte Quellen
    const action = chooseActionForDifficulty(engine, HOLD_BACK_POOL, state, "player1", "hard");
    expect(action.kind).not.toBe("activateAbility");
    expect(action.kind).not.toBe("castSpell");
    expect(action.kind).toBe("passPriority");

    // Beide Manaquellen sind tatsächlich noch ungetappt.
    const terrainId = state.players.player1.battlefield.find(
      (id) => state.cards[id]?.definitionId === "hold-back-test.filler-terrain",
    );
    const relicId = state.players.player1.battlefield.find(
      (id) => state.cards[id]?.definitionId === "hold-back-test.mana-source",
    );
    expect(state.cards[terrainId!]?.permanentState?.tapped).toBe(false);
    expect(state.cards[relicId!]?.permanentState?.tapped).toBe(false);
  });

  it("Gegenprobe: tappt trotzdem, wenn die reaktive Karte auch mit allen Quellen zusammen unbezahlbar bliebe", () => {
    // "Großer Blitzschlag" kostet 3 Mana, es gibt aber nur 2 Quellen
    // insgesamt -> Zurückhalten wäre für DIESE Karte nutzlos (sie bliebe so
    // oder so unbezahlbar), die Heuristik greift bewusst nicht.
    const state = buildHoldBackTrap(engine, "hold-back-test.bolt-3");
    const action = chooseActionForDifficulty(engine, HOLD_BACK_POOL, state, "player1", "hard");
    expect(action.kind).toBe("activateAbility");
  });
});
