/**
 * Bot-vs-Bot-Simulation: mehrere vollständige Partien mit `chooseAction`
 * (src/ai/simpleBot.ts) gegen sich selbst, über den echten "core"-Kartenpool
 * (`src/cards/starter-set.ts`, 109 Karten). Ziel (siehe docs/ai-status.md):
 * - Die Engine liefert NIE einen `error` zurück (der Bot darf nie eine
 *   illegale Aktion versuchen).
 * - Jede Partie endet regulär (Sieger oder Unentschieden) innerhalb eines
 *   Sicherheitslimits an Aktionen, keine Endlosschleife.
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { starterSet } from "../../cards/starter-set";
import { chooseAction } from "../simpleBot";
import type { CardPool, GameState, PlayerId, RulesEngine } from "../../model";

const MAX_ACTIONS = 2000;

/**
 * Deterministische Deckliste aus dem vollen Pool: alle Terrains 4x, bis zu
 * 40 verschiedene Nicht-Terrain-Karten je 1x (stabile Pool-Reihenfolge,
 * KEIN Math.random() — anders als `src/ui/deck.ts#buildDemoDeck`, das für
 * UI-Komfort bewusst nicht deterministisch ist). Damit bleibt die
 * Deckzusammensetzung über Testläufe hinweg reproduzierbar; die Partien
 * selbst variieren trotzdem über den Engine-Seed (Mischen/Münzwurf/Ziehen).
 */
function buildDeterministicDeck(pool: CardPool): Record<string, number> {
  const deck: Record<string, number> = {};
  const nonTerrainIds: string[] = [];
  for (const def of Object.values(pool)) {
    if (def.isToken) continue;
    if (def.type === "terrain") {
      deck[def.id] = 4;
    } else {
      nonTerrainIds.push(def.id);
    }
  }
  for (const id of nonTerrainIds.slice(0, 40)) {
    deck[id] = 1;
  }
  return deck;
}

/**
 * Bestimmt, welcher Spieler gerade "am Zug" ist, eine Aktion zu liefern
 * (Nutzungsvertrag von `chooseAction`, siehe docs/ai-status.md): Priority,
 * eine an ihn gerichtete PendingDecision, oder eine fällige
 * Combat-/Cleanup-Turn-Based-Action ohne Priority-Fenster. Gibt `undefined`
 * zurück, wenn (nach den turn.ts-Automatismen) niemand handeln muss - das
 * sollte laut Engine-Vertrag nach jeder abgeschlossenen Aktion nicht
 * vorkommen, solange das Spiel läuft.
 */
function actingPlayer(state: GameState): PlayerId | undefined {
  if (state.pendingDecision) return state.pendingDecision.player;
  if (state.priorityPlayer) return state.priorityPlayer;
  if (state.priorityPlayer === undefined && state.pendingDecision === undefined) {
    if (state.step === "declareAttackers") return state.activePlayer;
    if (state.step === "declareBlockers") {
      return state.activePlayer === "player1" ? "player2" : "player1";
    }
    if (state.step === "cleanup" && state.players[state.activePlayer].hand.length > 7) {
      return state.activePlayer;
    }
  }
  return undefined;
}

function playFullGame(
  engine: RulesEngine,
  pool: CardPool,
  seed: number,
): { state: GameState; actions: number } {
  const decks = { player1: buildDeterministicDeck(pool), player2: buildDeterministicDeck(pool) };
  let state = engine.createGame({ decks, seed }).state;
  let actions = 0;

  while (state.winner === undefined && actions < MAX_ACTIONS) {
    const actor = actingPlayer(state);
    if (!actor) {
      throw new Error(
        `Kein Akteur bestimmbar: step=${state.step}, priorityPlayer=${state.priorityPlayer}, ` +
          `pendingDecision=${state.pendingDecision?.kind}, actions=${actions}`,
      );
    }
    const action = chooseAction(engine, pool, state, actor);
    const result = engine.applyAction(state, action);
    if (result.error) {
      throw new Error(
        `Bot hat eine illegale Aktion versucht (Aktion #${actions}): ${result.error}\n` +
          `Aktion: ${JSON.stringify(action)}`,
      );
    }
    state = result.state;
    actions += 1;
  }

  return { state, actions };
}

describe("SimpleBot: vollständige Bot-vs-Bot-Partien (echter core-Kartenpool)", () => {
  const engine = createRulesEngine(starterSet);
  const seeds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const seed of seeds) {
    it(`Seed ${seed}: Partie endet regulär, keine illegale Aktion, kein Endlosdurchlauf`, () => {
      const { state, actions } = playFullGame(engine, starterSet, seed);
      expect(actions).toBeLessThan(MAX_ACTIONS);
      expect(state.winner).toBeDefined(); // Sieger ODER "draw"
      expect(["player1", "player2", "draw"]).toContain(state.winner);
    });
  }

  it("beide Spieler verlieren nie durch eine vom Bot verursachte Engine-Ablehnung (Stichprobe über alle Seeds)", () => {
    // playFullGame wirft bereits bei jedem result.error - dieser Test
    // dokumentiert die Zusicherung explizit als eigenen, benannten Fall.
    for (const seed of [11, 12, 13]) {
      const { state } = playFullGame(engine, starterSet, seed);
      expect(state.winner).toBeDefined();
    }
  });
});
