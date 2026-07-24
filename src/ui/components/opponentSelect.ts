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
import { AI_DECKS } from "../aiDecks";
import { h, text } from "../h";

/**
 * Sentinel-Wert der "Zufällig"-Option im Deck-Dropdown - identisch zum
 * gleichnamigen Konstrukt in components/deckBuilder.ts (kein AI_DECKS-Index
 * ist jemals negativ, daher kollisionsfrei).
 */
const RANDOM_AI_DECK_VALUE = "-1";

export interface OpponentSelectOptions {
  onChooseBot: (difficulty: BotDifficulty) => void;
  onChooseHotseat: () => void;
  /**
   * Welchen der 7 kuratierten `aiDecks.ts#AI_DECKS`-Archetypen der Bot spielen
   * soll - `undefined` = "Zufällig" (Default), s. store.ts#getChosenAiDeckArchetype.
   */
  chosenAiDeckArchetype: number | undefined;
  onChangeAiDeckArchetype: (next: number | undefined) => void;
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
      // Deck-Wahl für den KI-Gegner. Der Regler stand bisher AUSSCHLIESSLICH im
      // player2-Deckbau-Screen (components/deckBuilder.ts#botDeckSelect, nur
      // sichtbar bei `botControlled`) - genau dieser Screen wird beim regulären
      // Weg über die Gegner-Auswahl aber komplett übersprungen
      // (render.ts#renderDeckBuilder/onConfirm), und player1s eigener Deckbau
      // zeigt ihn wegen `botControlled: false` nie. Die Einstellung existierte
      // damit, war im normalen Spielablauf jedoch unerreichbar (Spielerbericht
      // "es fehlt die Option, das Deck des Gegners zu wählen"). Sie gehört
      // ohnehin hierher: es ist eine Aussage über den GEGNER, nicht übers
      // eigene Deck.
      //
      // Das Geheimhaltungs-Prinzip aus aiDecks.ts bleibt gewahrt - "Zufällig"
      // ist weiterhin Default und verrät nichts; wer gezielt einen Namen
      // auswählt, kennt ihn ohnehin schon.
      h("label", { class: "opponent-select-deck-label" }, [
        text("Deck des Gegners: "),
        h(
          "select",
          {
            class: "opponent-select-deck-select",
            title:
              opts.chosenAiDeckArchetype !== undefined
                ? AI_DECKS[opts.chosenAiDeckArchetype]?.description ?? ""
                : "Zieht beim Partiestart eines der 7 kuratierten Archetyp-Decks per Zufall - der Name bleibt verborgen, bis er sich im Spiel zeigt.",
            onchange: (ev: Event) => {
              const value = (ev.target as HTMLSelectElement).value;
              opts.onChangeAiDeckArchetype(value === RANDOM_AI_DECK_VALUE ? undefined : Number(value));
            },
          },
          [
            h("option", { value: RANDOM_AI_DECK_VALUE, selected: opts.chosenAiDeckArchetype === undefined }, [
              text("Zufällig"),
            ]),
            ...AI_DECKS.map((deck, index) =>
              h(
                "option",
                {
                  value: String(index),
                  selected: opts.chosenAiDeckArchetype === index,
                  title: deck.description,
                },
                [text(deck.name)],
              ),
            ),
          ],
        ),
      ]),
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
