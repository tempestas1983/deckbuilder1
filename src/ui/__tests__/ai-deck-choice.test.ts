// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test: Auftrag "welches Deck spielt die KI, oder ob es
 * zufällig gewählt wird" (2026-07-21) - der Mensch kann im player2-Deckbau-
 * Screen (KI-Umschalter aktiv, s. components/deckBuilder.ts#aiToggle) statt
 * der bisherigen reinen Zufallsziehung (aiDecks.ts#pickRandomAiDeck) gezielt
 * einen der 7 kuratierten AI_DECKS-Archetypen für den Bot-Gegner festlegen -
 * oder (Default, unveränderte Vorgeschichte) weiterhin "Zufällig" spielen
 * lassen.
 *
 * Deckt beide über aiDecks.ts#resolveAiDeck zusammengeführten Aufrufstellen
 * ab (s. render.ts):
 * 1. "...+ weiter"-Quickstart-Button direkt auf dem player2-Screen
 *    (Button-Label wechselt bei expliziter Auswahl vom generischen
 *    "Zufälliges KI-Deck + weiter").
 * 2. Der automatische player2-Auto-Fill-Pfad, wenn der Gegner schon VOR
 *    player1s eigenem Deckbau über die Gegner-Auswahl als KI festgelegt wurde
 *    (store.ts#chooseOpponentBot, player2-Screen wird dabei komplett
 *    übersprungen) - die einmal getroffene Archetyp-Festlegung bleibt (wie
 *    botControlled/botDifficulty) für den Rest der Sitzung erhalten, s.
 *    store.ts#getChosenAiDeckArchetype-Kommentar.
 *
 * Bewusst NICHT erneut geprüft: das Geheimhaltungsverhalten des
 * "Zufällig"-Default-Falls selbst - das ist unverändert und bereits durch
 * vs-bot.test.ts/vs-bot-difficulty.test.ts abgedeckt.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AI_DECKS } from "../aiDecks";
import {
  buttonWithText,
  click,
  enterHotseatNewGame,
  makeSeededRandom,
  queryOne,
  selectValue,
  setChecked,
} from "./testHelpers";

describe("Bot-Deck-Archetyp-Auswahl (Auftrag 'welches Deck spielt die KI', 2026-07-21)", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260721));
  });

  it("Select bietet 'Zufällig' (Default) + alle 7 Archetypen, aber NUR solange die KI-Steuerung aktiv ist", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    // player2-Screen VOR Aktivierung der KI-Steuerung: kein Bot-Deck-Select.
    expect(root.querySelector(".deckbuilder-ai-deck-select")).toBeFalsy();

    setChecked(queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox"), true);

    const select = queryOne<HTMLSelectElement>(root, ".deckbuilder-ai-deck-select");
    const optionLabels = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(optionLabels).toEqual(["Zufällig", ...AI_DECKS.map((d) => d.name)]);
    expect(select.value).toBe("random"); // Default: unverändertes Zufallsverhalten
    expect(store.getChosenAiDeckArchetype("player2")).toBeUndefined();
  });

  it("Explizite Auswahl + Quickstart lädt genau diesen Archetyp für den Bot (nicht zufällig), Button-Label nennt den Namen", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    setChecked(queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox"), true);
    const targetIndex = 4; // "Verrottender Wildwuchs"
    selectValue(queryOne<HTMLSelectElement>(root, ".deckbuilder-ai-deck-select"), String(targetIndex));
    expect(store.getChosenAiDeckArchetype("player2")).toBe(targetIndex);

    const quickstartBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-ai-quickstart-btn");
    expect(quickstartBtn.textContent).toBe(`"${AI_DECKS[targetIndex]!.name}" laden + weiter`);
    click(quickstartBtn);

    expect(store.getDecklist("player2")).toEqual(AI_DECKS[targetIndex]!.decklist);
  });

  it("Zurück auf 'Zufällig' umgestellt entfernt eine vorherige Auswahl wieder (Sentinel-Wert, kein Fallback auf Index 0)", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    setChecked(queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox"), true);
    selectValue(queryOne<HTMLSelectElement>(root, ".deckbuilder-ai-deck-select"), "3");
    expect(store.getChosenAiDeckArchetype("player2")).toBe(3);

    selectValue(queryOne<HTMLSelectElement>(root, ".deckbuilder-ai-deck-select"), "random");
    expect(store.getChosenAiDeckArchetype("player2")).toBeUndefined();

    const quickstartBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-ai-quickstart-btn");
    expect(quickstartBtn.textContent).toBe("Zufälliges KI-Deck + weiter");
  });

  it(
    "Einmal gewählter Archetyp bleibt für die restliche Sitzung gesetzt und greift auch beim automatischen player2-Auto-Fill (Gegner-Auswahl -> KI, VOR player1s Deckbau, player2-Screen wird dabei übersprungen)",
    async () => {
      const { render } = await import("../render");
      const store = await import("../store");
      const root = document.createElement("div");
      document.body.append(root);
      store.subscribe(() => render(root));
      render(root);
      enterHotseatNewGame(root);

      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));

      setChecked(queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox"), true);
      const targetIndex = 6; // "Reiner Zorn"
      selectValue(queryOne<HTMLSelectElement>(root, ".deckbuilder-ai-deck-select"), String(targetIndex));
      click(queryOne<HTMLButtonElement>(root, ".deckbuilder-ai-quickstart-btn"));

      expect(store.getDecklist("player2")).toEqual(AI_DECKS[targetIndex]!.decklist);

      // Zurück zum Hauptmenü aus der laufenden Partie heraus (stoppt auch
      // einen evtl. schon angestoßenen Bot-Zug-Timer, s. store.ts#backToMainMenu).
      click(buttonWithText(root, ".btn.btn-cancel", "Zurück zum Hauptmenü")!);
      expect(store.getAppPhase()).toEqual({ kind: "mainMenu" });

      // Neue Partie über die Gegner-Auswahl (chooseOpponentBot) starten - der
      // player2-Deckbau-Screen (und damit das Archetyp-Select) wird dabei
      // komplett übersprungen; die zuvor getroffene Archetyp-Wahl muss
      // trotzdem greifen statt erneut zufällig gezogen zu werden.
      click(queryOne(root, ".main-menu-new-game-btn"));
      click(queryOne<HTMLButtonElement>(root, '.opponent-select-difficulty-btn[data-difficulty="easy"]'));
      expect(root.querySelector(".deckbuilder-ai-deck-select")).toBeFalsy(); // player2-Screen übersprungen

      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));

      expect(store.getDecklist("player2")).toEqual(AI_DECKS[targetIndex]!.decklist);
    },
  );
});
