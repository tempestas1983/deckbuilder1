/**
 * Gegner-Auswahl: Zwischenschritt zwischen "Neues Spiel" (Hauptmenü, s.
 * components/mainMenu.ts) und dem eigentlichen Deckbau (s.
 * store.ts#startNewGameFlow/chooseOpponentBot/chooseOpponentHotseat,
 * types.ts#AppPhase). Zwei Optionen:
 *
 * - Eine der drei KI-Schwierigkeitsstufen (`BOT_DIFFICULTIES` aus
 *   `src/ai/difficulty.ts`, dieselbe Quelle wie der bisherige
 *   Schwierigkeits-Selector im player2-Deckbau-Screen) - markiert player2
 *   sofort als bot-gesteuert und führt zu player1s Deckbau. Der
 *   player2-Deckbau-Screen wird danach komplett übersprungen (automatisches
 *   Zufallsdeck + direkter Partiestart, sobald player1 bestätigt hat, s.
 *   render.ts#renderDeckBuilder).
 * - "2 Spieler" (Hotseat): player2 bleibt/wird menschlich gesteuert, baut
 *   nach player1 wie gehabt sein eigenes Deck (unverändertes Verhalten
 *   gegenüber dem Stand vor diesem Screen).
 *
 * Reine Optionen-Komponente wie mainMenu.ts/deckBuilderScreen - keine eigene
 * Navigations-/Store-Logik hier.
 */

import { BOT_DIFFICULTIES, BOT_DIFFICULTY_LABELS, BOT_DISPLAY_NAMES, type BotDifficulty } from "../../ai";
import { h, text } from "../h";

export interface OpponentSelectOptions {
  onChooseBot: (difficulty: BotDifficulty) => void;
  onChooseHotseat: () => void;
  /** Zurück zum Hauptmenü, ohne einen Gegner zu wählen. */
  onBack: () => void;
}

export function opponentSelectScreen(opts: OpponentSelectOptions): HTMLElement {
  return h("div", { class: "opponent-select-screen" }, [
    h("h2", { class: "opponent-select-title" }, [text("Wer sitzt euch gegenüber?")]),
    h("div", { class: "opponent-select-section" }, [
      h("div", { class: "opponent-select-section-heading" }, [text("Gegen die Taverne spielen (KI)")]),
      h(
        "div",
        { class: "opponent-select-difficulty-list" },
        BOT_DIFFICULTIES.map((d) =>
          h(
            "button",
            {
              class: "btn btn-play opponent-select-difficulty-btn",
              "data-difficulty": d,
              onclick: () => opts.onChooseBot(d),
            },
            [
              h("span", { class: "opponent-select-difficulty-name" }, [text(BOT_DISPLAY_NAMES[d])]),
              h("span", { class: "opponent-select-difficulty-label" }, [text(BOT_DIFFICULTY_LABELS[d])]),
            ],
          ),
        ),
      ),
    ]),
    h("div", { class: "opponent-select-section" }, [
      h("div", { class: "opponent-select-section-heading" }, [text("Gegen einen zweiten Menschen spielen")]),
      h(
        "button",
        { class: "btn opponent-select-hotseat-btn", onclick: opts.onChooseHotseat },
        [text("2 Spieler (Hotseat)")],
      ),
    ]),
    h("button", { class: "btn btn-cancel opponent-select-back-btn", onclick: opts.onBack }, [text("Zurück zum Hauptmenü")]),
  ]);
}
