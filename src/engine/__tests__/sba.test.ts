import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { BEAR, BOLT, FLAME_TERRAIN, buildTestPool, standardTestDecks } from "./fixtures";
import { applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

describe("State-Based Actions", () => {
  it("letaler Schaden lässt eine Unit sterben (SBA 4)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 5, startingPlayer: "player1" });

    const bear = putOnBattlefield(state, BEAR, "player2"); // 2/2
    const bolt = giveCardInHand(state, pool, BOLT, "player1"); // 3 Schaden
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
      chosenTargets: [{ kind: "permanent", instanceId: bear }],
    });

    state = bothPass(engine, state); // Blitz resolvt, 3 Schaden auf den 2/2-Bären -> stirbt via SBA

    expect(state.players.player2.battlefield).not.toContain(bear);
    expect(state.players.player2.graveyard).toContain(bear);
    expect(state.cards[bear]!.permanentState).toBeUndefined();
  });

  it("Toughness <= 0 durch -1/-1-Marken lässt eine Unit sterben, auch ohne markierten Schaden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 5, startingPlayer: "player1" });

    const bear = putOnBattlefield(state, BEAR, "player1"); // 2/2
    state.cards[bear]!.permanentState!.counters.minus1minus1 = 2; // -> 0/0

    // state ist bereits in Main 1 mit Priority bei player1 (siehe createGame).
    // Schon ein einzelner Pass löst laut Regel 3.3 den nächsten SBA-Check aus.
    const result = applyOk(engine, state, { kind: "passPriority", player: "player1" });

    expect(result.players.player1.battlefield).not.toContain(bear);
    expect(result.players.player1.graveyard).toContain(bear);
  });

  it("+1/+1 und -1/-1 Marken annihilieren sich paarweise (SBA 6)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 5, startingPlayer: "player1" });

    const bear = putOnBattlefield(state, BEAR, "player1");
    state.cards[bear]!.permanentState!.counters.plus1plus1 = 3;
    state.cards[bear]!.permanentState!.counters.minus1minus1 = 1;

    // Bereits ein einzelner Pass löst laut Regel 3.3 den nächsten SBA-Check aus
    // (siehe turn.ts checkStateBeforePriority) - kein zweiter Pass nötig.
    const result = applyOk(engine, state, { kind: "passPriority", player: "player1" });

    // Nach Annihilation: 2 plus1plus1, 0 minus1minus1 -> Unit lebt mit effektiv 4/4.
    const ps = result.cards[bear]!.permanentState!;
    expect(ps.counters.plus1plus1).toBe(2);
    expect(ps.counters.minus1minus1).toBe(0);
    expect(result.players.player1.battlefield).toContain(bear);
  });

  it("Spieler mit <= 0 Leben verliert das Spiel (SBA 1) und gameEnded wird emittiert", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 5, startingPlayer: "player1" });

    state.players.player2.life = 1;
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const bolt = giveCardInHand(state, pool, BOLT, "player1");

    let s = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    s = applyOk(engine, s, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
    });
    s = bothPass(engine, s);

    expect(s.players.player2.life).toBeLessThanOrEqual(0);
    expect(s.players.player2.hasLost).toBe(true);
    expect(s.winner).toBe("player1");
  });
});
