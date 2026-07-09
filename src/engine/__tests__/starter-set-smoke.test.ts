import { describe, expect, it } from "vitest";
import type { PlayerId } from "../../model";
import { createRulesEngine } from "../engine";
import { starterSet } from "../../cards/starter-set";

/**
 * Integrations-Rauchtest: Der ECHTE Kartenpool des card-designers (kein
 * Engine-Test-Fixture) muss sich zumindest anstandslos in eine Partie laden
 * und ein paar Runden Priority-Pass/getLegalActions überstehen, ohne dass
 * die Engine auf unbekannte Effekt-/Trigger-Kombinationen wirft. Das ist
 * KEIN Ersatz für card-designer-eigene Balancing-Tests - nur ein
 * Sicherheitsnetz, dass DSL-Nutzung und Engine-Interpretation zusammenpassen.
 */
describe("Starter-Set-Rauchtest (echter Kartenpool)", () => {
  it("createGame + ein paar Priority-Runden laufen ohne Fehler durch", () => {
    const deck: Record<string, number> = {};
    for (const id of Object.keys(starterSet)) deck[id] = 2;
    const decks: Record<PlayerId, Record<string, number>> = { player1: deck, player2: deck };

    const engine = createRulesEngine(starterSet);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 999, startingPlayer: "player1" });

    expect(state.players.player1.hand).toHaveLength(7);
    expect(state.players.player2.hand).toHaveLength(7);

    // Ein paar Runden "beide passen" simulieren (Upkeep -> Draw -> Main 1 -> ...),
    // ohne Karten zu spielen - reiner Automatik-/getLegalActions-Rauchtest.
    let s = state;
    for (let i = 0; i < 20 && s.winner === undefined; i++) {
      if (s.priorityPlayer) {
        const legal = engine.getLegalActions(s, s.priorityPlayer);
        expect(legal.length).toBeGreaterThan(0);
        const result = engine.applyAction(s, { kind: "passPriority", player: s.priorityPlayer });
        expect(result.error).toBeUndefined();
        s = result.state;
      } else if (s.pendingDecision) {
        // Sollte im Rauchtest ohne Kartenspiel nicht vorkommen - defensiv abbrechen.
        break;
      } else if (s.step === "declareAttackers") {
        const result = engine.applyAction(s, { kind: "declareAttackers", player: s.activePlayer, attackers: [] });
        expect(result.error).toBeUndefined();
        s = result.state;
      } else if (s.step === "declareBlockers") {
        const defender = s.activePlayer === "player1" ? "player2" : "player1";
        const result = engine.applyAction(s, { kind: "declareBlockers", player: defender, blocks: [] });
        expect(result.error).toBeUndefined();
        s = result.state;
      } else {
        break;
      }
    }
    expect(s.turnNumber).toBeGreaterThanOrEqual(1);
  });
});
