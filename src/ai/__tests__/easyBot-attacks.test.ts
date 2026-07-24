/**
 * Regressionstests zum Spielerbericht "der leichte Gegner greift kein einziges
 * Mal an, nicht mal wenn er Kreaturen hat und ich nicht" (2026-07-24).
 *
 * Ursache war NICHT die absichtlich niedrige ATTACK_PROBABILITY, sondern die
 * Seed-Ableitung des deterministischen PRNG (s. easyBot.ts#rngForState):
 * `rngState.counter` bleibt über eine ganze Partie konstant und
 * `nextObjectNumber` läuft im Gleichschritt mit `turnNumber` — der Seed bewegte
 * sich damit auf einer einzigen monotonen Kurve, und die "Münze pro Einheit"
 * fiel über eine Partie hinweg reihenweise gleich aus. Gemessen über 100+
 * Partien mit echten Archetyp-Decks: in 24,6 % aller Partien mit mindestens
 * einer Angriffsgelegenheit blieb der Bot KOMPLETT passiv.
 *
 * Die beiden Tests hier sichern die zwei Teile des Fixes ab:
 * 1. Kontext-gesalzener Seed ⇒ Angriffe verteilen sich wieder über die Partie.
 * 2. "Freier Angriff": kann der Gegner überhaupt nicht blocken, wird immer
 *    angegriffen (Plausibilitäts-Untergrenze — ein Bot, der bei leerem
 *    gegnerischem Board zusieht, wirkt kaputt statt schwach).
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { starterSet } from "../../cards/starter-set";
import { chooseActionForDifficulty } from "../difficulty";
import { AI_DECKS } from "../../ui/aiDecks";
import type { GameState, PlayerId, RulesEngine } from "../../model";

const MAX_ACTIONS = 3000;

/** Identische Fallunterscheidung wie difficulty.test.ts / store.ts#actingPlayer. */
function actingPlayer(state: GameState): PlayerId | undefined {
  if (state.pendingDecision) return state.pendingDecision.player;
  if (state.priorityPlayer) return state.priorityPlayer;
  if (state.step === "declareAttackers") return state.activePlayer;
  if (state.step === "declareBlockers") return state.activePlayer === "player1" ? "player2" : "player1";
  if (state.step === "cleanup" && state.players[state.activePlayer].hand.length > 7) return state.activePlayer;
  return undefined;
}

describe("easyBot: Angriffsverhalten", () => {
  it("bleibt nur selten eine ganze Partie lang passiv", () => {
    const engine: RulesEngine = createRulesEngine(starterSet);
    const pool = starterSet;

    let gamesWithChances = 0;
    let gamesWithoutAnyAttack = 0;
    let windows = 0;
    let declared = 0;

    // Kreuzprodukt echter Archetyp-Decks über feste Seeds (deterministisch).
    for (let botDeck = 0; botDeck < AI_DECKS.length; botDeck++) {
      for (let humanDeck = 0; humanDeck < AI_DECKS.length; humanDeck++) {
        for (const seed of [7, 101, 4242]) {
          const decks = {
            player1: AI_DECKS[humanDeck]!.decklist,
            player2: AI_DECKS[botDeck]!.decklist,
          };
          let state = engine.createGame({ decks, seed }).state;
          let actions = 0;
          let gameWindows = 0;
          let gameDeclared = 0;

          while (state.winner === undefined && actions < MAX_ACTIONS) {
            const actor = actingPlayer(state);
            if (!actor) break;
            const action = chooseActionForDifficulty(
              engine,
              pool,
              state,
              actor,
              actor === "player2" ? "easy" : "medium",
            );
            if (actor === "player2" && action.kind === "declareAttackers") {
              const hasLegalAttacker = engine
                .getLegalActions(state, actor)
                .some((a) => a.kind === "declareAttackers" && a.attackers.length === 1);
              if (hasLegalAttacker) gameWindows += 1;
              if (action.attackers.length > 0) gameDeclared += 1;
            }
            const result = engine.applyAction(state, action);
            expect(result.error).toBeUndefined();
            state = result.state;
            actions += 1;
          }

          if (gameWindows > 0) {
            gamesWithChances += 1;
            windows += gameWindows;
            declared += gameDeclared;
            if (gameDeclared === 0) gamesWithoutAnyAttack += 1;
          }
        }
      }
    }

    expect(gamesWithChances).toBeGreaterThan(50);
    // Vor dem Fix: 24,6 % komplett passive Partien und 48,1 % genutzte Fenster.
    // Danach gemessen: 7,0 % bzw. 71,6 %. Die Schwellen lassen bewusst Luft —
    // die leichte Stufe DARF eine Gelegenheit auslassen, nur nicht systematisch.
    expect(gamesWithoutAnyAttack / gamesWithChances).toBeLessThan(0.15);
    expect(declared / windows).toBeGreaterThan(0.6);
  }, 600000);

  it("greift immer an, wenn der Gegner keinen einzigen Blocker hat", () => {
    const engine: RulesEngine = createRulesEngine(starterSet);
    const pool = starterSet;

    let checked = 0;

    for (let botDeck = 0; botDeck < AI_DECKS.length; botDeck++) {
      for (const seed of [7, 101, 4242]) {
        const decks = { player1: AI_DECKS[0]!.decklist, player2: AI_DECKS[botDeck]!.decklist };
        let state = engine.createGame({ decks, seed }).state;
        let actions = 0;

        while (state.winner === undefined && actions < MAX_ACTIONS) {
          const actor = actingPlayer(state);
          if (!actor) break;
          const action = chooseActionForDifficulty(engine, pool, state, actor, actor === "player2" ? "easy" : "medium");

          if (actor === "player2" && action.kind === "declareAttackers") {
            const legalAttackers = engine
              .getLegalActions(state, actor)
              .filter(
                (a): a is Extract<typeof a, { kind: "declareAttackers" }> =>
                  a.kind === "declareAttackers" && a.attackers.length === 1,
              );
            const humanHasBlocker = state.players.player1.battlefield.some((id) => {
              const card = state.cards[id];
              if (!card?.permanentState || card.permanentState.tapped) return false;
              return pool[card.definitionId]?.type === "unit";
            });
            if (legalAttackers.length > 0 && !humanHasBlocker) {
              checked += 1;
              expect(action.attackers).toHaveLength(legalAttackers.length);
            }
          }

          const result = engine.applyAction(state, action);
          expect(result.error).toBeUndefined();
          state = result.state;
          actions += 1;
        }
      }
    }

    expect(checked).toBeGreaterThan(0);
  }, 600000);
});
