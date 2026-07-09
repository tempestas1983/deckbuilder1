import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, bothPass } from "./test-helpers";

describe("Zug-/Step-Automatik", () => {
  it("durchläuft einen kompletten Zug automatisch bis zu Main 1 des nächsten Zuges (Spielerwechsel, Draw Step diesmal NICHT übersprungen)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 13, startingPlayer: "player1" });

    expect(state.turnNumber).toBe(1);
    expect(state.activePlayer).toBe("player1");
    state = advanceToStep(engine, state, "main1"); // Upkeep/Draw-Priority-Fenster durchpassen

    state = bothPass(engine, state); // main1 -> beginCombat
    expect(state.step).toBe("beginCombat");

    state = bothPass(engine, state); // beginCombat -> declareAttackers (Turn-Based Action wartet)
    expect(state.step).toBe("declareAttackers");
    expect(state.priorityPlayer).toBeUndefined();

    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [] });
    expect(state.priorityPlayer).toBe("player1"); // Priority-Fenster trotz 0 Angreifern

    state = bothPass(engine, state); // 0 Angreifer -> Declare Blockers & Combat Damage werden übersprungen
    expect(state.step).toBe("endCombat");

    state = bothPass(engine, state); // -> main2
    expect(state.step).toBe("main2");

    state = bothPass(engine, state); // -> endStep
    expect(state.step).toBe("endStep");

    state = bothPass(engine, state); // -> cleanup -> (kein Abwurf nötig) -> neuer Zug -> Upkeep

    expect(state.turnNumber).toBe(2);
    expect(state.activePlayer).toBe("player2");
    state = advanceToStep(engine, state, "main1");
    expect(state.priorityPlayer).toBe("player2");

    // Draw Step wird NUR im allerersten Zug des Spiels übersprungen - Zug 2 zieht normal.
    const deckSize = Object.values(decks.player2).reduce((a, b) => a + b, 0);
    expect(state.players.player2.library).toHaveLength(deckSize - 7 - 1);
    expect(state.players.player2.hand).toHaveLength(8);
  });

  it("Manapool leert sich beim Step-Wechsel", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 13, startingPlayer: "player1" });
    expect(state.step).toBe("upkeep");

    state.players.player1.manaPool.flame = 3; // Testvorbedingung direkt gesetzt

    state = bothPass(engine, state); // upkeep -> draw (Step-Wechsel)
    expect(state.step).toBe("draw");
    expect(state.players.player1.manaPool.flame).toBe(0);
  });
});
