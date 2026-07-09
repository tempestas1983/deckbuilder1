import { describe, expect, it } from "vitest";
import type { GameState, RulesEngine } from "../../model";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { AIRBORNE_UNIT, BEAR, GUARDIAN_UNIT, buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, bothPass, makeNotSummoningSick, putOnBattlefield } from "./test-helpers";

/**
 * guardian-Blockpflicht, final spezifiziert in rules-engine.md Abschnitt 6:
 * Jede ungetappte guardian-Unit des Verteidigers MUSS einem Angreifer als
 * Blocker zugeordnet werden, sofern für sie ein legaler Block existiert.
 * Angreifer-Wahl frei, Snapshot bei Deklaration, im Angriff wirkungslos.
 */
function toDeclareAttackers(engine: RulesEngine, state: GameState): GameState {
  let s = advanceToStep(engine, state, "main1");
  s = bothPass(engine, s); // -> beginCombat
  s = bothPass(engine, s); // -> declareAttackers
  return s;
}

describe("guardian-Blockpflicht (rules-engine.md 6)", () => {
  it("declareBlockers ohne Block der guardian-Unit wird abgelehnt, mit Block akzeptiert", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 31, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, BEAR, "player1");
    makeNotSummoningSick(state, attacker);
    const guardian = putOnBattlefield(state, GUARDIAN_UNIT, "player2");

    state = toDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state); // -> declareBlockers
    expect(state.step).toBe("declareBlockers");

    const noBlock = engine.applyAction(state, { kind: "declareBlockers", player: "player2", blocks: [] });
    expect(noBlock.error).toBeDefined();
    expect(noBlock.error).toMatch(/guardian/i);

    const withBlock = engine.applyAction(state, {
      kind: "declareBlockers",
      player: "player2",
      blocks: [{ blocker: guardian, attacker }],
    });
    expect(withBlock.error).toBeUndefined();
  });

  it("getLegalActions bietet bei aktiver guardian-Pflicht keinen 'kein Block'-Kandidaten, nur pflichterfüllende", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 31, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, BEAR, "player1");
    makeNotSummoningSick(state, attacker);
    const guardian = putOnBattlefield(state, GUARDIAN_UNIT, "player2");

    state = toDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state);

    const legal = getLegalActions(state, "player2", pool).filter((a) => a.kind === "declareBlockers");
    expect(legal.length).toBeGreaterThan(0);
    for (const action of legal) {
      if (action.kind !== "declareBlockers") continue;
      expect(action.blocks.length).toBeGreaterThan(0);
      expect(action.blocks.some((b) => b.blocker === guardian)).toBe(true);
    }
  });

  it("eine VOR der Deklaration getappte guardian-Unit hat keine Blockpflicht (Snapshot)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 31, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, BEAR, "player1");
    makeNotSummoningSick(state, attacker);
    const guardian = putOnBattlefield(state, GUARDIAN_UNIT, "player2");
    state.cards[guardian]!.permanentState!.tapped = true; // vor der Deklaration getappt

    state = toDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state);

    const result = engine.applyAction(state, { kind: "declareBlockers", player: "player2", blocks: [] });
    expect(result.error).toBeUndefined();
  });

  it("guardian ohne legalen Block (Angreifer airborne, guardian ohne reach/airborne) hat keine Pflicht", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 31, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, AIRBORNE_UNIT, "player1");
    makeNotSummoningSick(state, attacker);
    putOnBattlefield(state, GUARDIAN_UNIT, "player2"); // kein reach/airborne

    state = toDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state);

    const result = engine.applyAction(state, { kind: "declareBlockers", player: "player2", blocks: [] });
    expect(result.error).toBeUndefined();
  });

  it("guardian auf der Angreiferseite hat keine Wirkung", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 31, startingPlayer: "player1" });

    const attackingGuardian = putOnBattlefield(state, GUARDIAN_UNIT, "player1");
    makeNotSummoningSick(state, attackingGuardian);
    putOnBattlefield(state, BEAR, "player2"); // Verteidiger hat keine guardian-Pflicht

    state = toDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attackingGuardian] });
    state = bothPass(engine, state);

    const result = engine.applyAction(state, { kind: "declareBlockers", player: "player2", blocks: [] });
    expect(result.error).toBeUndefined();
  });
});
