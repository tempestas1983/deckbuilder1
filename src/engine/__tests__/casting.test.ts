import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { BEAR, EMBER_WHELP, FLAME_TERRAIN, buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

describe("Casten und Resolven (einfacher Fall)", () => {
  it("Unit casten und resolven lässt sie mit Summoning Sickness ins Battlefield kommen", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const whelp = giveCardInHand(state, pool, EMBER_WHELP, "player1");

    // Terrain für Mana aktivieren.
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    expect(state.players.player1.manaPool.flame).toBe(1);

    // Unit casten.
    const beforeCast = state;
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: whelp,
      chosenTargets: [],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.players.player1.manaPool.flame).toBe(0); // Mana wurde verbraucht
    expect(state.players.player1.hand).not.toContain(whelp); // Karte hat die Hand verlassen
    expect(beforeCast.players.player1.hand).toContain(whelp); // Original-State unverändert (Immutabilität)

    // Beide passen -> Stack resolvt: Unit betritt das Battlefield.
    state = bothPass(engine, state);
    expect(state.players.player1.battlefield).toContain(whelp);
    expect(state.cards[whelp]!.permanentState?.summoningSick).toBe(true);
    expect(state.cards[whelp]!.permanentState?.tapped).toBe(false);

    // ETB-Trigger wurde eingereiht und beim nächsten Priority-Zeitpunkt gestackt.
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]!.kind).toBe("triggeredAbility");

    // Beide passen erneut -> ETB-Trigger resolvt: 1 Schaden am Gegner (opponent-only Ziel, siehe fixtures.ts).
    const lifeBefore = state.players.player2.life;
    state = bothPass(engine, state);
    expect(state.stack).toHaveLength(0);
    expect(state.players.player2.life).toBe(lifeBefore - 1);
  });

  it("Mana-Zahlung schlägt fehl ohne genug Mana (State bleibt unverändert)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const created = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    const state = advanceToStep(engine, created.state, "main1");

    const whelp = giveCardInHand(state, pool, EMBER_WHELP, "player1");
    // Kein Terrain, kein Mana im Pool.

    const result = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: whelp,
      chosenTargets: [],
    });

    expect(result.error).toBeDefined();
    expect(result.state).toBe(state); // unverändert zurückgegeben
    expect(result.events).toHaveLength(0);
    expect(state.players.player1.hand).toContain(whelp); // Karte immer noch in der Hand
  });

  it("Unit mit generischen Kosten (2) benötigt 2 Mana beliebiger Farbe", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 3, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const bear = giveCardInHand(state, pool, BEAR, "player1");
    const t1 = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const t2 = putOnBattlefield(state, FLAME_TERRAIN, "player1");

    // Nur 1 Mana verfügbar -> Cast schlägt fehl.
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: t1,
      abilityIndex: 0,
      chosenTargets: [],
    });
    const tooEarly = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bear,
      chosenTargets: [],
    });
    expect(tooEarly.error).toBeDefined();

    // Zweites Mana aktivieren -> jetzt bezahlbar.
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: t2,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bear,
      chosenTargets: [],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.players.player1.manaPool.flame).toBe(0);
  });
});
