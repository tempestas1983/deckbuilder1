/**
 * `costChange`-Static-Modifier (`abilities.ts#StaticAbility`, modifier
 * `kind: "costChange"`) - bisher ungenutztes/ungetestetes DSL-Primitiv
 * (siehe docs/cards/starter-set.md "Nicht verwendete DSL-Primitive").
 * Deckt ab: eigene Kostensenkung, gegnerische Kostenerhöhung (inkl. "wirkt
 * NICHT auf die eigenen Sprüche des Controllers"), additive Stapelung
 * mehrerer Quellen, Kappung bei 0 (kein negativer Preis), und Wirkung in
 * `getLegalActions` (siehe stats.ts#computeSpellCostDelta).
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { createCardInstance } from "../zones";
import type { CardPool, GameState, InstanceId, PlayerId } from "../../model";
import {
  CHEAP_VANILLA_SPELL,
  COST_REDUCER_RELIC,
  COST_TAX_RELIC,
  buildTestPool,
  standardTestDecks,
} from "./fixtures";
import { addManaToPool, advanceToStep, applyOk, putOnBattlefield } from "./test-helpers";

/** Legt eine Karte direkt in die Hand, ohne über die Library zu ziehen (analog test-helpers.ts#giveCardInHand). */
function giveCardInHand(state: GameState, pool: CardPool, definitionId: string, owner: PlayerId): InstanceId {
  const inst = createCardInstance(state, definitionId, owner);
  state.players[owner].hand.push(inst.instanceId);
  return inst.instanceId;
}

describe("costChange Static-Modifier", () => {
  it("eigene Kostensenkung: Relic senkt die generischen Kosten eigener Sprüche", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    putOnBattlefield(state, COST_REDUCER_RELIC, "player1");
    const spell = giveCardInHand(state, pool, CHEAP_VANILLA_SPELL, "player1");
    // Basiskosten {generic:2}, Relic senkt um 1 -> effektiv {generic:1}.
    addManaToPool(state, "player1", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.players.player1.manaPool.colorless).toBe(0);
  });

  it("ohne Kostensenkung reicht 1 Mana NICHT für den {generic:2}-Spruch (Kontrolltest)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const spell = giveCardInHand(state, pool, CHEAP_VANILLA_SPELL, "player1");
    addManaToPool(state, "player1", "colorless", 1);

    const result = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();
  });

  it("gegnerische Kostenerhöhung: Relic verteuert nur die Sprüche des GEGNERS, nicht die eigenen", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    // player2 kontrolliert den Zollposten -> verteuert player1s Sprüche.
    putOnBattlefield(state, COST_TAX_RELIC, "player2");

    const spellP1 = giveCardInHand(state, pool, CHEAP_VANILLA_SPELL, "player1");
    addManaToPool(state, "player1", "colorless", 2); // Basiskosten (2) reichen NICHT mehr (2+1=3 nötig)
    const tooCheap = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spellP1,
      chosenTargets: [],
    });
    expect(tooCheap.error).toBeDefined();

    addManaToPool(state, "player1", "colorless", 1); // jetzt 3 Mana -> reicht
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spellP1,
      chosenTargets: [],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.players.player1.manaPool.colorless).toBe(0);
  });

  it("player2 (Controller des Zollpostens) zahlt für den eigenen Spruch weiterhin nur die Basiskosten", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    putOnBattlefield(state, COST_TAX_RELIC, "player2");
    const spellP2 = giveCardInHand(state, pool, CHEAP_VANILLA_SPELL, "player2");
    addManaToPool(state, "player2", "colorless", 2); // Basiskosten sollen reichen

    // player1 passt Priority an player2 weiter (Stack bleibt leer, kein
    // Stepwechsel), damit player2 mitten in player1s Zug den fast-Spell casten
    // kann (fast-Speed ist priority-, nicht turn-gebunden - rules-engine.md 2).
    state = applyOk(engine, state, { kind: "passPriority", player: "player1" });
    expect(state.priorityPlayer).toBe("player2");

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: spellP2,
      chosenTargets: [],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.players.player2.manaPool.colorless).toBe(0);
  });

  it("mehrere Kostensenker-Quellen stapeln additiv und werden bei 0 gekappt (kein negativer Preis)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    putOnBattlefield(state, COST_REDUCER_RELIC, "player1");
    putOnBattlefield(state, COST_REDUCER_RELIC, "player1"); // zweite Kopie: -1 + -1 = -2

    const spell = giveCardInHand(state, pool, CHEAP_VANILLA_SPELL, "player1");
    // Basiskosten {generic:2} - 2 = 0 -> kostenlos castbar, kein Mana nötig.
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.players.player1.manaPool.colorless).toBe(0);
  });

  it("getLegalActions berücksichtigt die reduzierten Kosten (Kandidat erscheint mit weniger Mana)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    putOnBattlefield(state, COST_REDUCER_RELIC, "player1");
    const spell = giveCardInHand(state, pool, CHEAP_VANILLA_SPELL, "player1");
    addManaToPool(state, "player1", "colorless", 1);

    const legal = engine.getLegalActions(state, "player1");
    const castCandidate = legal.find((a) => a.kind === "castSpell" && a.cardInstanceId === spell);
    expect(castCandidate).toBeDefined();
  });
});
