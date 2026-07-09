import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep } from "./test-helpers";

describe("createGame", () => {
  it("ist deterministisch bei gleichem Seed", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);

    const a = engine.createGame({ decks, skipMulligans: true, seed: 42 });
    const b = engine.createGame({ decks, skipMulligans: true, seed: 42 });

    expect(a.state.players.player1.hand).toEqual(b.state.players.player1.hand);
    expect(a.state.players.player2.hand).toEqual(b.state.players.player2.hand);
    expect(a.state.players.player1.library).toEqual(b.state.players.player1.library);
  });

  it("liefert unterschiedliche Reihenfolgen bei unterschiedlichem Seed", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);

    const a = engine.createGame({ decks, skipMulligans: true, seed: 1 });
    const b = engine.createGame({ decks, skipMulligans: true, seed: 2 });

    expect(a.state.players.player1.hand).not.toEqual(b.state.players.player1.hand);
  });

  it("startet mit 7 Handkarten pro Spieler, 20 Leben, player1 aktiv, player1 hat Priority (Upkeep)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 7, startingPlayer: "player1" });

    expect(state.players.player1.hand).toHaveLength(7);
    expect(state.players.player2.hand).toHaveLength(7);
    expect(state.players.player1.life).toBe(20);
    expect(state.players.player2.life).toBe(20);
    expect(state.activePlayer).toBe("player1");
    expect(state.turnNumber).toBe(1);
    // createGame lässt automatisch nur Steps OHNE Priority-Fenster durchlaufen
    // (hier: untap). Upkeep HAT ein Priority-Fenster (rules-engine.md 2) und
    // wartet daher wie jeder andere Priority-Step auf echte PlayerActions.
    expect(state.step).toBe("upkeep");
    expect(state.priorityPlayer).toBe("player1");
    expect(state.stack).toHaveLength(0);

    const atMain1 = advanceToStep(engine, state, "main1");
    expect(atMain1.priorityPlayer).toBe("player1");
    expect(atMain1.stack).toHaveLength(0);
  });

  it("überspringt den ersten Draw Step des Startspielers (rules-engine.md 2)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state, events } = engine.createGame({ decks, skipMulligans: true, seed: 7, startingPlayer: "player1" });

    const deckSize = Object.values(decks.player1).reduce((a, b) => a + b, 0);
    expect(state.players.player1.library).toHaveLength(deckSize - 7);

    // Jetzt tatsächlich bis zum (übersprungenen) Draw Step vorpassen und
    // sicherstellen, dass player1 dabei NICHT zusätzlich gezogen hat.
    const atDraw = advanceToStep(engine, state, "draw");
    expect(atDraw.players.player1.hand).toHaveLength(7);
    expect(atDraw.players.player1.library).toHaveLength(deckSize - 7);

    // 7 Starthand-Karten PRO Spieler (2 Spieler) - kein zusätzlicher Draw-Step-Zug,
    // da createGame den ersten Draw Step (Priority-Fenster) noch gar nicht erreicht
    // (siehe vorigen Test: createGame stoppt bereits bei Upkeep).
    const cardDrawnEvents = events.filter((e) => e.kind === "cardDrawn");
    expect(cardDrawnEvents).toHaveLength(14);
  });

  it("startingPlayer in der Config überschreibt den Münzwurf (rules-engine.md 1a)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);

    const p1 = engine.createGame({ decks, skipMulligans: true, seed: 100, startingPlayer: "player1" });
    expect(p1.state.activePlayer).toBe("player1");
    expect(p1.events[0]).toMatchObject({ kind: "gameStarted", startingPlayer: "player1" });

    const p2 = engine.createGame({ decks, skipMulligans: true, seed: 100, startingPlayer: "player2" });
    expect(p2.state.activePlayer).toBe("player2");
    expect(p2.events[0]).toMatchObject({ kind: "gameStarted", startingPlayer: "player2" });
  });

  it("Münzwurf ohne Override ist der erste RNG-Verbrauch und deterministisch pro Seed", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);

    const a = engine.createGame({ decks, skipMulligans: true, seed: 777 });
    const b = engine.createGame({ decks, skipMulligans: true, seed: 777 });
    expect(a.state.activePlayer).toBe(b.state.activePlayer);
    expect(["player1", "player2"]).toContain(a.state.activePlayer);
  });
});
