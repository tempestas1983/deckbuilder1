/**
 * Schwierigkeitsstufen-Tests (v2, siehe docs/ai-status.md):
 *
 * 1. Stärkevergleich (Sanity-Check "tatsächlich stärker, nicht nur anders"):
 *    Bot-vs-Bot-Serien über feste Seeds, beide Rollenzuordnungen pro Seed
 *    (neutralisiert Startspieler-/Münzwurf-Vorteil). Erwartung: die höhere
 *    Stufe gewinnt jede Paarung mehrheitlich. Da Engine (Seed) UND alle drei
 *    Bots deterministisch sind, sind die Ergebnisse reproduzierbar — keine
 *    Flakiness.
 * 2. Vollständigkeit: jede Stufe spielt komplette Partien ohne einzige von
 *    der Engine abgelehnte Aktion (playMatch wirft sonst).
 * 3. Determinismus der leichten Stufe (Zufall ist aus dem GameState
 *    abgeleitet, keine echte Zufallsquelle).
 * 4. Performance-Budget der schweren Stufe (Lookahead darf die UI nicht
 *    spürbar einfrieren).
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { starterSet } from "../../cards/starter-set";
import { chooseActionForDifficulty, type BotDifficulty } from "../difficulty";
import type { CardPool, GameState, PlayerId, RulesEngine } from "../../model";

const MAX_ACTIONS = 2000;

/** Deterministische Deckliste — identisch zu simpleBot.test.ts (siehe dort). */
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

/** Wer muss handeln? Identische Fallunterscheidung wie simpleBot.test.ts / store.ts. */
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

interface MatchResult {
  winner: PlayerId | "draw";
  actions: number;
  /** Maximale Dauer eines einzelnen chooseAction-Aufrufs in ms (Performance-Check). */
  maxDecisionMs: number;
}

function playMatch(
  engine: RulesEngine,
  pool: CardPool,
  seed: number,
  difficulties: Record<PlayerId, BotDifficulty>,
): MatchResult {
  const decks = { player1: buildDeterministicDeck(pool), player2: buildDeterministicDeck(pool) };
  let state = engine.createGame({ decks, seed }).state;
  let actions = 0;
  let maxDecisionMs = 0;

  while (state.winner === undefined && actions < MAX_ACTIONS) {
    const actor = actingPlayer(state);
    if (!actor) {
      throw new Error(`Kein Akteur bestimmbar: step=${state.step}, actions=${actions}`);
    }
    const start = performance.now();
    const action = chooseActionForDifficulty(engine, pool, state, actor, difficulties[actor]);
    maxDecisionMs = Math.max(maxDecisionMs, performance.now() - start);
    const result = engine.applyAction(state, action);
    if (result.error) {
      throw new Error(
        `Bot (${difficulties[actor]}) hat eine illegale Aktion versucht (Aktion #${actions}): ${result.error}\n` +
          `Aktion: ${JSON.stringify(action)}`,
      );
    }
    state = result.state;
    actions += 1;
  }

  if (state.winner === undefined) {
    throw new Error(`Partie nicht beendet nach ${MAX_ACTIONS} Aktionen (${difficulties.player1} vs ${difficulties.player2}, Seed ${seed})`);
  }
  return { winner: state.winner, actions, maxDecisionMs };
}

interface SeriesResult {
  higherWins: number;
  lowerWins: number;
  draws: number;
  games: number;
  maxDecisionMs: number;
}

/**
 * Spielt jede Seed-Zahl ZWEIMAL (einmal je Rollenzuordnung) — der Münzwurf-/
 * Startspieler-Vorteil eines Seeds trifft damit beide Stufen gleich oft.
 */
function runSeries(
  engine: RulesEngine,
  pool: CardPool,
  lower: BotDifficulty,
  higher: BotDifficulty,
  seeds: number[],
): SeriesResult {
  const result: SeriesResult = { higherWins: 0, lowerWins: 0, draws: 0, games: 0, maxDecisionMs: 0 };
  for (const seed of seeds) {
    for (const higherAs of ["player1", "player2"] as const) {
      const difficulties: Record<PlayerId, BotDifficulty> = {
        player1: higherAs === "player1" ? higher : lower,
        player2: higherAs === "player2" ? higher : lower,
      };
      const match = playMatch(engine, pool, seed, difficulties);
      result.games += 1;
      result.maxDecisionMs = Math.max(result.maxDecisionMs, match.maxDecisionMs);
      if (match.winner === "draw") result.draws += 1;
      else if (match.winner === higherAs) result.higherWins += 1;
      else result.lowerWins += 1;
    }
  }
  return result;
}

function describeSeries(lower: BotDifficulty, higher: BotDifficulty, s: SeriesResult): string {
  return (
    `${higher} vs ${lower}: ${s.higherWins}:${s.lowerWins} für ${higher} ` +
    `(+${s.draws} Unentschieden, ${s.games} Partien, max. Entscheidung ${s.maxDecisionMs.toFixed(1)} ms)`
  );
}

describe("Schwierigkeitsstufen: Stärkevergleich (höhere Stufe schlägt niedrigere mehrheitlich)", () => {
  const engine = createRulesEngine(starterSet);

  // Seed-Auswahl: deterministisch über 12 Seeds pro Paarung. Seed 13
  // (medium vs easy) traf zuvor einen Engine-Crash (dealCombatDamage bei
  // Token-Kampfteilnehmern, die in der firstStrike-Schadensrunde per SBA 7
  // gelöscht wurden) — seit dem Engine-Fix (docs/engine-status.md v0.3.3,
  // combat.ts) läuft er fehlerfrei durch und ist wieder Teil der Serie.
  const pairings: Array<{ lower: BotDifficulty; higher: BotDifficulty; seeds: number[] }> = [
    { lower: "easy", higher: "medium", seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    { lower: "medium", higher: "hard", seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
    { lower: "easy", higher: "hard", seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  ];

  for (const { lower, higher, seeds } of pairings) {
    it(
      `${higher} schlägt ${lower} mehrheitlich (${seeds.length * 2} Partien, beide Rollenzuordnungen)`,
      () => {
        const series = runSeries(engine, starterSet, lower, higher, seeds);
        const summary = describeSeries(lower, higher, series);
        // eslint-disable-next-line no-console
        console.log(summary);
        // Kernbehauptung: echt stärker, nicht nur anders.
        expect(series.higherWins, summary).toBeGreaterThan(series.lowerWins);
        // Und zwar deutlich: mindestens 60% der entschiedenen Partien.
        const decisive = series.higherWins + series.lowerWins;
        expect(series.higherWins / Math.max(decisive, 1), summary).toBeGreaterThanOrEqual(0.6);
      },
      { timeout: 300_000 },
    );
  }
});

describe("Schwierigkeitsstufen: Vollständigkeit & Verträge", () => {
  const engine = createRulesEngine(starterSet);

  it("easy vs easy: Partien enden regulär ohne illegale Aktionen", { timeout: 120_000 }, () => {
    for (const seed of [21, 22, 23]) {
      const match = playMatch(engine, starterSet, seed, { player1: "easy", player2: "easy" });
      expect(["player1", "player2", "draw"]).toContain(match.winner);
      expect(match.actions).toBeLessThan(MAX_ACTIONS);
    }
  });

  it("hard vs hard: Partien enden regulär ohne illegale Aktionen", { timeout: 120_000 }, () => {
    for (const seed of [21, 22, 23]) {
      const match = playMatch(engine, starterSet, seed, { player1: "hard", player2: "hard" });
      expect(["player1", "player2", "draw"]).toContain(match.winner);
      expect(match.actions).toBeLessThan(MAX_ACTIONS);
    }
  });

  it("easy ist deterministisch: dieselbe Stellung liefert immer dieselbe Aktion", () => {
    const decks = { player1: buildDeterministicDeck(starterSet), player2: buildDeterministicDeck(starterSet) };
    let state = createRulesEngine(starterSet).createGame({ decks, seed: 42 }).state;
    // Einige Züge weit spielen und an jeder Stellung Doppelaufruf vergleichen.
    let checked = 0;
    for (let i = 0; i < 200 && state.winner === undefined; i++) {
      const actor = actingPlayer(state);
      if (!actor) break;
      const a1 = chooseActionForDifficulty(engine, starterSet, state, actor, "easy");
      const a2 = chooseActionForDifficulty(engine, starterSet, state, actor, "easy");
      expect(a2).toEqual(a1);
      checked += 1;
      const result = engine.applyAction(state, a1);
      expect(result.error).toBeUndefined();
      state = result.state;
    }
    expect(checked).toBeGreaterThan(50);
  });

  it("hard: keine Einzelentscheidung friert die UI ein (Budget greift)", { timeout: 120_000 }, () => {
    const match = playMatch(engine, starterSet, 7, { player1: "hard", player2: "hard" });
    // Großzügige Schranke gegen CI-/Maschinen-Varianz; typisch sind < 100 ms.
    expect(match.maxDecisionMs).toBeLessThan(1000);
  });
});
