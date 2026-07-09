import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { FLAME_TERRAIN, ILLEGAL_MANA_X_RELIC, X_ABILITY_RELIC, X_BOLT, buildTestPool, standardTestDecks } from "./fixtures";
import { addManaToPool, applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

/**
 * X-Kosten (rules-engine.md Abschnitt 4, v0.2 geklärt): Ankündigen -> X >= 0
 * wählen -> Ziele wählen -> bezahlen. `chosenX` wird am Stack-Objekt
 * gespeichert und von `Amount { kind: "x" }` bei Resolution gelesen.
 */
describe("X-Kosten", () => {
  it("castSpell mit chosenX bezahlt X generisches Mana und der Effekt skaliert mit X", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });

    const spell = giveCardInHand(created, pool, X_BOLT, "player1");
    addManaToPool(created, "player1", "flame", 3);

    let state = applyOk(engine, created, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
      chosenX: 3,
    });
    expect(state.stack).toHaveLength(1);
    expect((state.stack[0] as any).chosenX).toBe(3);
    expect(state.players.player1.manaPool.flame).toBe(0); // 3 Mana für X=3 verbraucht

    const lifeBefore = state.players.player2.life;
    state = bothPass(engine, state);
    expect(state.players.player2.life).toBe(lifeBefore - 3);
  });

  it("X=0 ist erlaubt (Effekt macht dann nichts)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const spell = giveCardInHand(created, pool, X_BOLT, "player1");

    let state = applyOk(engine, created, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
      chosenX: 0,
    });
    const lifeBefore = state.players.player2.life;
    state = bothPass(engine, state);
    expect(state.players.player2.life).toBe(lifeBefore);
  });

  it("fehlendes chosenX bei X-Kosten wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const spell = giveCardInHand(state, pool, X_BOLT, "player1");

    const result = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
    });
    expect(result.error).toBeDefined();
  });

  it("zu wenig Mana für das gewählte X wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const spell = giveCardInHand(created, pool, X_BOLT, "player1");
    addManaToPool(created, "player1", "flame", 1);

    const result = engine.applyAction(created, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
      chosenX: 3,
    });
    expect(result.error).toBeDefined();
  });

  it("getLegalActions enumeriert X-Kosten-Karten nicht (Frontend fragt X separat ab)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    giveCardInHand(state, pool, X_BOLT, "player1");
    addManaToPool(state, "player1", "flame", 5);

    const legal = getLegalActions(state, "player1", pool);
    const xBoltCandidates = legal.filter(
      (a) => a.kind === "castSpell" && state.cards[a.cardInstanceId]?.definitionId === X_BOLT,
    );
    expect(xBoltCandidates).toHaveLength(0);
  });
});

/**
 * v0.3 (rules-engine.md 4 + Entscheidung 9.12): X-Kosten jetzt auch auf
 * aktivierten Fähigkeiten - exakt das Spell-Muster (`chosenX` an der Aktion
 * und am Stack-Objekt, keine Enumeration in getLegalActions), plus das
 * Verbot für Mana-Fähigkeiten.
 */
describe("X-Kosten auf aktivierten Fähigkeiten (rules-engine.md 4 + 9.12)", () => {
  it("activateAbility mit chosenX bezahlt X generisches Mana und der Effekt skaliert mit X", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });

    const relic = putOnBattlefield(created, X_ABILITY_RELIC, "player1");
    addManaToPool(created, "player1", "flame", 3);

    let state = applyOk(engine, created, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
      chosenX: 3,
    });
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "activatedAbility", chosenX: 3 });
    expect(state.players.player1.manaPool.flame).toBe(0);

    const lifeBefore = state.players.player2.life;
    state = bothPass(engine, state);
    expect(state.players.player2.life).toBe(lifeBefore - 3);
  });

  it("X=0 ist erlaubt (Effekt macht dann nichts)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const relic = putOnBattlefield(created, X_ABILITY_RELIC, "player1");

    let state = applyOk(engine, created, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
      chosenX: 0,
    });
    const lifeBefore = state.players.player2.life;
    state = bothPass(engine, state);
    expect(state.players.player2.life).toBe(lifeBefore);
  });

  it("fehlendes chosenX bei X-Kosten-Fähigkeit wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const relic = putOnBattlefield(state, X_ABILITY_RELIC, "player1");

    const result = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
    });
    expect(result.error).toBeDefined();
  });

  it("zu wenig Mana für das gewählte X wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const relic = putOnBattlefield(created, X_ABILITY_RELIC, "player1");
    addManaToPool(created, "player1", "flame", 1);

    const result = engine.applyAction(created, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [{ kind: "player", playerId: "player2" }],
      chosenX: 3,
    });
    expect(result.error).toBeDefined();
  });

  it("getLegalActions enumeriert X-Kosten-Fähigkeiten nicht (Frontend fragt X separat ab)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const relic = putOnBattlefield(state, X_ABILITY_RELIC, "player1");
    addManaToPool(state, "player1", "flame", 5);

    const legal = getLegalActions(state, "player1", pool);
    const candidates = legal.filter((a) => a.kind === "activateAbility" && a.sourceInstanceId === relic);
    expect(candidates).toHaveLength(0);
  });

  it("Mana-Fähigkeiten dürfen keine X-Kosten haben (9.12) - Aktivierung wird abgelehnt, egal ob chosenX angegeben ist", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 51, startingPlayer: "player1" });
    const relic = putOnBattlefield(state, ILLEGAL_MANA_X_RELIC, "player1");

    const withX = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [],
      chosenX: 2,
    });
    expect(withX.error).toBeDefined();

    const withoutX = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [],
    });
    expect(withoutX.error).toBeDefined();
  });
});
