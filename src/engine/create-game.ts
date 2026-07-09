/**
 * Partie-Start: Zonen aus Decklisten aufbauen, mischen (seedbarer RNG),
 * Starthände ziehen, ersten Zug bis zum ersten Priority-Fenster (Upkeep)
 * automatisch durchlaufen.
 *
 * v0.2 (rules-engine.md Abschnitt 1a + 9.6):
 * - Der CardPool kommt NICHT mehr über die Config, sondern per Closure aus
 *   `createRulesEngine(pool)` (siehe engine.ts) - `CreateGameConfig` hat
 *   bewusst kein `pool`-Feld mehr.
 * - Startspieler: Münzwurf über den seedbaren RNG als ALLERERSTER
 *   RNG-Verbrauch der Partie (noch vor dem Mischen), außer
 *   `config.startingPlayer` überschreibt ihn explizit (Tests/Sonderfälle).
 */

import type { CardPool, CreateGameConfig, GameEvent, GameState, PlayerId, PlayerState } from "../model";
import { createCardInstance, drawCard } from "./zones";
import { nextInt, shuffleInPlace } from "./rng";
import { emptyManaPool } from "./mana";
import { beginStep } from "./turn";
import { buildInitialMulliganDecision } from "./mulligan";

const PLAYER_IDS: PlayerId[] = ["player1", "player2"];
const STARTING_HAND_SIZE = 7;
const STARTING_LIFE = 20;

export function createGame(
  pool: CardPool,
  config: CreateGameConfig,
): { state: GameState; events: GameEvent[] } {
  const { decks, seed } = config;
  const events: GameEvent[] = [];

  const state: GameState = {
    cards: {},
    players: {} as Record<PlayerId, PlayerState>,
    activePlayer: "player1", // wird unten ggf. durch den Münzwurf überschrieben
    turnNumber: 1,
    step: "untap",
    priorityPlayer: undefined,
    consecutivePasses: [],
    stack: [],
    pendingTriggers: [],
    pendingDecision: undefined,
    resumePriorityTo: undefined,
    rngState: { seed, counter: 0 },
    nextTimestamp: 0,
    nextObjectNumber: 0,
    winner: undefined,
  };

  // 1a: Münzwurf ist der ERSTE RNG-Verbrauch der Partie, noch vor dem
  // Mischen - sonst wäre der Seed für Tests, die den Startspieler fix
  // vorgeben, nicht mit dem "natürlichen" Münzwurf-Pfad vergleichbar.
  state.activePlayer = config.startingPlayer ?? PLAYER_IDS[nextInt(state, PLAYER_IDS.length)]!;

  for (const playerId of PLAYER_IDS) {
    const library: string[] = [];
    const decklist = decks[playerId] ?? {};
    for (const [definitionId, count] of Object.entries(decklist)) {
      for (let i = 0; i < count; i++) {
        const inst = createCardInstance(state, definitionId, playerId);
        library.push(inst.instanceId);
      }
    }
    const playerState: PlayerState = {
      id: playerId,
      life: STARTING_LIFE,
      library,
      hand: [],
      battlefield: [],
      graveyard: [],
      exile: [],
      manaPool: emptyManaPool(),
      terrainsPlayedThisTurn: 0,
      mulligans: 0,
      attemptedDrawFromEmptyLibrary: false,
      hasLost: false,
    };
    state.players[playerId] = playerState;
  }

  for (const playerId of PLAYER_IDS) {
    shuffleInPlace(state, state.players[playerId].library);
  }

  events.push({ kind: "gameStarted", startingPlayer: state.activePlayer });
  events.push({ kind: "turnBegan", player: state.activePlayer, turnNumber: state.turnNumber });

  for (const playerId of PLAYER_IDS) {
    for (let i = 0; i < STARTING_HAND_SIZE; i++) {
      drawCard(state, events, playerId);
    }
  }
  // Ziehversuch aus leerer Library beim Starthand-Ziehen wäre ein Deckbau-Fehler
  // (min. 40 Karten Pflicht laut Decklist-Dokumentation) - keine SBA-Prüfung hier nötig.

  // v0.3 (rules-engine.md 1b + Entscheidung 9.11): Mulligan-Phase VOR dem
  // ersten Untap Step - createGame endet mit einer offenen "mulligan"-
  // Decision für den Startspieler statt sofort zu steppen. Default false =
  // Mulligan-Phase läuft; skipMulligans überspringt sie (Tests/Komfort).
  if (config.skipMulligans) {
    beginStep(state, pool, events, "untap");
  } else {
    const decision = buildInitialMulliganDecision(state.activePlayer);
    state.pendingDecision = decision;
    events.push({ kind: "decisionRequired", player: state.activePlayer, decisionKind: "mulligan" });
  }

  return { state, events };
}
