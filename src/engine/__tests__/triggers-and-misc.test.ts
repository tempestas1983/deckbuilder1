import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { BEAR, BOLT, DEATH_TRIGGER_UNIT, FLAME_TERRAIN, buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

describe("Trigger (APNAP-Grundfall) und weitere Regelfälle", () => {
  it("onUnitDied-Trigger (eigene Unit stirbt) zieht dem Controller eine Karte", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const herald = putOnBattlefield(state, DEATH_TRIGGER_UNIT, "player1");
    const victim = putOnBattlefield(state, BEAR, "player1");
    const bolt = giveCardInHand(state, pool, BOLT, "player1");
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    const handSizeBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // Blitz resolvt -> Bär stirbt (SBA) -> Death-Trigger wird eingereiht
    expect(state.players.player1.graveyard).toContain(victim);
    expect(state.stack).toHaveLength(1); // Death-Trigger wartet auf dem Stack
    expect(state.stack[0]!.kind).toBe("triggeredAbility");

    state = bothPass(engine, state); // Trigger resolvt -> zieht 1 Karte
    expect(state.players.player1.hand.length).toBe(handSizeBefore + 1); // Bolt hatte die Hand schon vorher verlassen
    void herald;
  });

  it("Terrain darf nur 1x pro Zug gespielt werden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const t1 = giveCardInHand(state, pool, FLAME_TERRAIN, "player1");
    const t2 = giveCardInHand(state, pool, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, { kind: "playTerrain", player: "player1", cardInstanceId: t1 });
    expect(state.players.player1.terrainsPlayedThisTurn).toBe(1);

    const result = engine.applyAction(state, { kind: "playTerrain", player: "player1", cardInstanceId: t2 });
    expect(result.error).toBeDefined();
  });

  it("getLegalActions: passPriority ist immer enthalten, Terrain aus der Hand ist spielbar", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const terrain = giveCardInHand(state, pool, FLAME_TERRAIN, "player1");
    const legal = getLegalActions(state, "player1", pool);

    expect(legal.some((a) => a.kind === "passPriority")).toBe(true);
    expect(legal.some((a) => a.kind === "playTerrain" && a.cardInstanceId === terrain)).toBe(true);
    // Der nicht-priorisierte Spieler darf (außer concede) nichts tun.
    const legalOpponent = getLegalActions(state, "player2", pool);
    expect(legalOpponent).toEqual([{ kind: "concede", player: "player2" }]);
  });

  it("discardToHandSize: im Cleanup muss auf 7 Handkarten abgeworfen werden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    // 2 zusätzliche Karten auf die Hand -> 9 Handkarten.
    giveCardInHand(state, pool, BEAR, "player1");
    giveCardInHand(state, pool, BEAR, "player1");
    expect(state.players.player1.hand.length).toBe(9);

    state = advanceToStep(engine, state, "cleanup");
    expect(state.priorityPlayer).toBeUndefined(); // wartet auf discardToHandSize

    const toDiscard = state.players.player1.hand.slice(0, 2);
    const result = engine.applyAction(state, {
      kind: "discardToHandSize",
      player: "player1",
      cardInstanceIds: toDiscard,
    });
    expect(result.error).toBeUndefined();
    expect(result.state.players.player1.hand.length).toBe(7);
    expect(result.state.players.player1.graveyard).toEqual(expect.arrayContaining(toDiscard));
  });

  it("concede: Spieler verliert sofort, Gegner gewinnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });

    const result = engine.applyAction(state, { kind: "concede", player: "player1" });
    expect(result.error).toBeUndefined();
    expect(result.state.players.player1.hasLost).toBe(true);
    expect(result.state.winner).toBe("player2");
  });
});
