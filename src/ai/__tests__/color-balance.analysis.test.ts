/**
 * ANALYSE-TOOL, KEIN CORRECTNESS-TEST.
 *
 * Empirische Farb-Balance-Prüfung des 300-Karten-Starter-Sets über
 * Bot-vs-Bot-Simulationen (siehe docs/cards/starter-set.md, Abschnitt
 * "Empirische Balance-Prüfung (Bot-Simulation)").
 *
 * In der Standard-Testsuite (npm test / CI) wird diese Datei ÜBERSPRUNGEN
 * (describe.skip), weil sie mehrere Minuten läuft und keine Korrektheit
 * prüft, sondern Balance-Statistiken erhebt. Ausführen mit:
 *
 *   BALANCE_ANALYSIS=1 npx vitest run src/ai/__tests__/color-balance.analysis.test.ts
 *
 * (PowerShell: $env:BALANCE_ANALYSIS="1"; npx vitest run src/ai/__tests__/color-balance.analysis.test.ts)
 *
 * Optionale Parameter (Robustheits-Checks):
 *   BALANCE_ANALYSIS_BOT=easy|medium|hard   (Default: medium)
 *   BALANCE_ANALYSIS_SEEDS=<n>              (Default: 15 -> 30 Partien/Paarung)
 *
 * Vorgehen:
 * - Pro Farbe ein deterministisches Mono-Farb-Deck: 1 Kopie jeder
 *   Nicht-Terrain-Karte der Farbe (Farbe = Farb-Pip in den Manakosten;
 *   das Set enthält keine mehrfarbigen Karten) + 32 Basis-Terrains der
 *   Farbe. Regelkonform (>= 40 Karten, <= 4 Kopien pro Nicht-Terrain).
 * - BEWUSSTE Abweichungen vom "realistischen" Deckbau (im Doku-Abschnitt
 *   begründet): keine farblosen Relics (würden das Farb-Signal nur
 *   symmetrisch verdünnen), keine X-Kosten-Karten (Bots casten sie nie,
 *   da getLegalActions sie nicht enumeriert — wäre eine tote Karte NUR
 *   für die eine Farbe mit X-Karte).
 * - Alle 10 Farbpaarungen, N Seeds x beide Rollenzuordnungen, identischer
 *   Bot ("medium" = simpleBot) auf beiden Seiten -> nur die Kartenqualität
 *   unterscheidet die Seiten, nicht die KI-Stärke.
 *
 * WICHTIGE EINSCHRÄNKUNG: grobes Signal, kein Beweis. Details und
 * Interpretation im o. g. Doku-Abschnitt.
 */

import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../../engine";
import { starterSet } from "../../cards/starter-set";
import { chooseActionForDifficulty, type BotDifficulty } from "../difficulty";
import type { CardPool, GameState, ManaColor, PlayerId, RulesEngine } from "../../model";

const RUN_ANALYSIS = process.env.BALANCE_ANALYSIS === "1";
const MAX_ACTIONS = 4000;
/** Bot-Stufe für BEIDE Seiten (gleich stark — nur die Karten unterscheiden sich). */
const BOT: BotDifficulty = (["easy", "medium", "hard"] as const).find(
  (d) => d === process.env.BALANCE_ANALYSIS_BOT,
) ?? "medium";
/** Seeds pro Paarung; jede Paarung läuft 2x pro Seed (beide Rollenzuordnungen). */
const SEED_COUNT = Number.parseInt(process.env.BALANCE_ANALYSIS_SEEDS ?? "15", 10) || 15;
const SEEDS = Array.from({ length: SEED_COUNT }, (_, i) => i + 1);

const COLORS: ManaColor[] = ["flame", "tide", "wild", "light", "void"];

const TERRAIN_FOR_COLOR: Record<ManaColor, string> = {
  flame: "core.flame-ridge",
  tide: "core.tide-cove",
  wild: "core.wild-glade",
  light: "core.light-altar",
  void: "core.void-rift",
};

/**
 * Mono-Farb-Deck: 1 Kopie jeder Nicht-Token-, Nicht-Terrain-, Nicht-X-Karte,
 * deren Manakosten einen Pip der Farbe enthalten (Set hat keine Multicolor-
 * Karten), plus 32 Basis-Terrains (~40 % Terrain-Anteil bei ~80 Karten,
 * passend zur flachen Kurve des Sets mit Maximum bei 2-3 Mana).
 */
function buildMonoColorDeck(pool: CardPool, color: ManaColor): Record<string, number> {
  const deck: Record<string, number> = {};
  const ids = Object.values(pool)
    .filter((def) => {
      if (def.isToken || def.type === "terrain") return false;
      if (!("cost" in def) || def.cost === undefined) return false;
      if (def.cost.x) return false; // Bots casten X-Karten nie (getLegalActions enumeriert sie nicht).
      return (def.cost[color] ?? 0) > 0;
    })
    .map((def) => def.id)
    .sort(); // deterministische Reihenfolge, unabhängig von der Pool-Definitionsreihenfolge
  for (const id of ids) deck[id] = 1;
  deck[TERRAIN_FOR_COLOR[color]] = 32;
  return deck;
}

/** Wer muss handeln? Identische Fallunterscheidung wie difficulty.test.ts / store.ts. */
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
  turns: number;
  /** Lebenspunkte des Siegers bei Spielende (Sieg-Marge). */
  winnerLife: number;
}

function playMatch(
  engine: RulesEngine,
  pool: CardPool,
  seed: number,
  decks: Record<PlayerId, Record<string, number>>,
): MatchResult {
  let state = engine.createGame({ decks, seed }).state;
  let actions = 0;
  while (state.winner === undefined && actions < MAX_ACTIONS) {
    const actor = actingPlayer(state);
    if (!actor) throw new Error(`Kein Akteur bestimmbar: step=${state.step}, actions=${actions}`);
    const action = chooseActionForDifficulty(engine, pool, state, actor, BOT);
    const result = engine.applyAction(state, action);
    if (result.error) {
      throw new Error(`Illegale Aktion (#${actions}): ${result.error}\n${JSON.stringify(action)}`);
    }
    state = result.state;
    actions += 1;
  }
  if (state.winner === undefined) {
    // Nicht beendete Partien als Unentschieden werten (Analyse, kein Test).
    return { winner: "draw", actions, turns: state.turnNumber, winnerLife: 0 };
  }
  const winnerLife = state.winner === "draw" ? 0 : state.players[state.winner].life;
  return { winner: state.winner, actions, turns: state.turnNumber, winnerLife };
}

interface ColorTally {
  wins: number;
  losses: number;
  draws: number;
  games: number;
}

(RUN_ANALYSIS ? describe : describe.skip)(
  `Farb-Balance-Analyse: 10 Mono-Farb-Paarungen, ${BOT} vs ${BOT} (${SEED_COUNT} Seeds x 2 Rollen)`,
  () => {
    it(
      "spielt alle Paarungen und berichtet Siegquoten pro Farbe",
      { timeout: 1_800_000 },
      () => {
        const engine = createRulesEngine(starterSet);
        const decks: Record<ManaColor, Record<string, number>> = {
          flame: buildMonoColorDeck(starterSet, "flame"),
          tide: buildMonoColorDeck(starterSet, "tide"),
          wild: buildMonoColorDeck(starterSet, "wild"),
          light: buildMonoColorDeck(starterSet, "light"),
          void: buildMonoColorDeck(starterSet, "void"),
        };
        for (const c of COLORS) {
          const size = Object.values(decks[c]).reduce((a, b) => a + b, 0);
          // eslint-disable-next-line no-console
          console.log(`Deck ${c}: ${size} Karten (${size - 32} Nicht-Terrain + 32 Terrain)`);
          expect(size).toBeGreaterThanOrEqual(40);
        }

        const tally: Record<ManaColor, ColorTally> = Object.fromEntries(
          COLORS.map((c) => [c, { wins: 0, losses: 0, draws: 0, games: 0 }]),
        ) as Record<ManaColor, ColorTally>;
        const pairingLines: string[] = [];

        for (let i = 0; i < COLORS.length; i++) {
          for (let j = i + 1; j < COLORS.length; j++) {
            const a = COLORS[i]!;
            const b = COLORS[j]!;
            let aWins = 0;
            let bWins = 0;
            let draws = 0;
            let totalTurns = 0;
            for (const seed of SEEDS) {
              for (const aAs of ["player1", "player2"] as const) {
                const match = playMatch(engine, starterSet, seed, {
                  player1: aAs === "player1" ? decks[a] : decks[b],
                  player2: aAs === "player2" ? decks[a] : decks[b],
                });
                totalTurns += match.turns;
                if (match.winner === "draw") draws += 1;
                else if (match.winner === aAs) aWins += 1;
                else bWins += 1;
              }
            }
            const games = SEEDS.length * 2;
            tally[a].wins += aWins;
            tally[a].losses += bWins;
            tally[a].draws += draws;
            tally[a].games += games;
            tally[b].wins += bWins;
            tally[b].losses += aWins;
            tally[b].draws += draws;
            tally[b].games += games;
            pairingLines.push(
              `${a} vs ${b}: ${aWins}:${bWins}` +
                (draws > 0 ? ` (+${draws} unentschieden)` : "") +
                ` | Ø ${(totalTurns / games).toFixed(1)} Züge`,
            );
          }
        }

        // eslint-disable-next-line no-console
        console.log("\n--- Paarungen ---\n" + pairingLines.join("\n"));
        const summary = COLORS.map((c) => {
          const t = tally[c];
          const decisive = t.wins + t.losses;
          const rate = decisive > 0 ? ((100 * t.wins) / decisive).toFixed(1) : "n/a";
          return `${c}: ${t.wins}S/${t.losses}N/${t.draws}U über ${t.games} Partien -> ${rate} % Siegquote`;
        });
        // eslint-disable-next-line no-console
        console.log("\n--- Aggregat pro Farbe ---\n" + summary.join("\n"));

        // Keine harte Balance-Assertion (Analyse-Tool): nur Plausibilität,
        // dass überhaupt entschiedene Partien vorliegen.
        for (const c of COLORS) {
          expect(tally[c].games).toBeGreaterThan(0);
        }
      },
    );
  },
);
