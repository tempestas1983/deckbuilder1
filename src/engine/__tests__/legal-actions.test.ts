import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { buildTestPool, standardTestDecks, UNAFFORDABLE_COSTS_RELIC } from "./fixtures";
import { applyOk, putOnBattlefield } from "./test-helpers";

/**
 * Regressionstest für den in docs/ai-status.md gemeldeten und in
 * docs/engine-status.md dokumentierten Bugfix:
 * `legal-actions.ts#activateAbilityCandidates` prüfte VOR dem Fix nur die
 * "tap"-AdditionalCost auf Bezahlbarkeit, nicht "payLife"/"discardCards"/
 * "removeCounters" — obwohl `applyAction` (actions.ts) genau diese drei sehr
 * wohl validiert. `getLegalActions` konnte dadurch einen Kandidaten liefern,
 * den `applyAction` anschließend als illegal ablehnte (beobachtet beim
 * Bot-vs-Bot-Testen: "Nicht genug Marken." bei einer removeCounters-Kosten-
 * Fähigkeit).
 */
describe("getLegalActions: additionalCosts-Bezahlbarkeit bei activateAbility (Bugfix-Regression)", () => {
  it("removeCounters: Fähigkeit erscheint NICHT in getLegalActions, solange die Marke fehlt - applyAction lehnt sie konsistent ab", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 300, skipMulligans: true, startingPlayer: "player1" });

    const relicId = putOnBattlefield(state, UNAFFORDABLE_COSTS_RELIC, "player1");
    // Keine "charge"-Marke vorhanden (frisch aufs Battlefield gelegt).
    expect(state.cards[relicId]!.permanentState!.counters.charge ?? 0).toBe(0);

    const legal = getLegalActions(state, "player1", pool);
    const removeCountersCandidate = legal.find(
      (a) => a.kind === "activateAbility" && a.sourceInstanceId === relicId && a.abilityIndex === 0,
    );
    expect(removeCountersCandidate).toBeUndefined();

    // Konsistenzcheck: applyAction lehnt den (hypothetisch von einem
    // Konsumenten erfundenen) Kandidaten ebenfalls ab - getLegalActions und
    // applyAction stimmen jetzt überein.
    const result = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relicId,
      abilityIndex: 0,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();

    // Mit Marke: Kandidat erscheint UND ist tatsächlich ausführbar.
    state.cards[relicId]!.permanentState!.counters.charge = 1;
    const legalWithCounter = getLegalActions(state, "player1", pool);
    const candidate = legalWithCounter.find(
      (a) => a.kind === "activateAbility" && a.sourceInstanceId === relicId && a.abilityIndex === 0,
    );
    expect(candidate).toBeDefined();
    const applied = applyOk(engine, state, candidate!);
    expect(applied.cards[relicId]!.permanentState!.counters.charge ?? 0).toBe(0);
  });

  it("payLife: Fähigkeit mit unbezahlbaren Lebenspunkten-Kosten erscheint NICHT in getLegalActions", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 301, skipMulligans: true, startingPlayer: "player1" });

    const relicId = putOnBattlefield(state, UNAFFORDABLE_COSTS_RELIC, "player1");
    expect(state.players.player1.life).toBe(20); // < 25 geforderte payLife-Kosten

    const legal = getLegalActions(state, "player1", pool);
    const payLifeCandidate = legal.find(
      (a) => a.kind === "activateAbility" && a.sourceInstanceId === relicId && a.abilityIndex === 1,
    );
    expect(payLifeCandidate).toBeUndefined();

    const result = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relicId,
      abilityIndex: 1,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();
  });

  it("discardCards: Fähigkeit mit mehr Abwurf-Kosten als Handkarten erscheint NICHT in getLegalActions", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 302, skipMulligans: true, startingPlayer: "player1" });

    const relicId = putOnBattlefield(state, UNAFFORDABLE_COSTS_RELIC, "player1");
    expect(state.players.player1.hand.length).toBeLessThan(10); // < 10 geforderte discardCards-Kosten

    const legal = getLegalActions(state, "player1", pool);
    const discardCandidate = legal.find(
      (a) => a.kind === "activateAbility" && a.sourceInstanceId === relicId && a.abilityIndex === 2,
    );
    expect(discardCandidate).toBeUndefined();

    const result = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relicId,
      abilityIndex: 2,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();
  });
});
