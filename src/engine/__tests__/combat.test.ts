import { describe, expect, it } from "vitest";
import type { GameState, RulesEngine } from "../../model";
import { createRulesEngine } from "../engine";
import { AIRBORNE_UNIT, BEAR, buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, bothPass, makeNotSummoningSick, putOnBattlefield } from "./test-helpers";

function advanceToDeclareAttackers(engine: RulesEngine, state: GameState): GameState {
  let s = advanceToStep(engine, state, "main1");
  s = bothPass(engine, s); // -> beginCombat
  expect(s.step).toBe("beginCombat");
  s = bothPass(engine, s); // -> declareAttackers (Turn-Based Action, priorityPlayer undefined)
  expect(s.step).toBe("declareAttackers");
  expect(s.priorityPlayer).toBeUndefined();
  return s;
}

describe("Kampf (Grundfälle)", () => {
  it("ungeblockter Angreifer fügt dem Verteidiger Schaden zu", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 9, startingPlayer: "player1" });

    const bear = putOnBattlefield(state, BEAR, "player1");
    makeNotSummoningSick(state, bear);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [bear] });
    expect(state.cards[bear]!.permanentState?.tapped).toBe(true);
    expect(state.step).toBe("declareAttackers");
    expect(state.priorityPlayer).toBe("player1");

    state = bothPass(engine, state); // -> declareBlockers
    expect(state.step).toBe("declareBlockers");
    state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [] });

    const lifeBefore = state.players.player2.life;
    state = bothPass(engine, state); // -> combatDamage (Schaden wird automatisch zugewiesen)
    expect(state.step).toBe("combatDamage");
    expect(state.players.player2.life).toBe(lifeBefore - 2);
  });

  it("geblockter Angreifer tauscht Schaden mit dem Blocker (beide sterben bei 2/2 vs 2/2)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 9, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, BEAR, "player1");
    const blocker = putOnBattlefield(state, BEAR, "player2");
    makeNotSummoningSick(state, attacker);
    makeNotSummoningSick(state, blocker);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state); // -> declareBlockers
    state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });

    state = bothPass(engine, state); // -> combatDamage + SBA-Check danach

    expect(state.players.player1.battlefield).not.toContain(attacker);
    expect(state.players.player2.battlefield).not.toContain(blocker);
    expect(state.players.player1.graveyard).toContain(attacker);
    expect(state.players.player2.graveyard).toContain(blocker);
  });

  it("airborne-Angreifer kann nicht von einer Nicht-airborne/reach-Unit geblockt werden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 9, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, AIRBORNE_UNIT, "player1");
    const groundBlocker = putOnBattlefield(state, BEAR, "player2");
    makeNotSummoningSick(state, attacker);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state); // -> declareBlockers

    const result = engine.applyAction(state, {
      kind: "declareBlockers",
      player: "player2",
      blocks: [{ blocker: groundBlocker, attacker }],
    });
    expect(result.error).toBeDefined();
  });
});
