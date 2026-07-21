// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test: der menschliche Spieler kann im Deckbau-Screen eines
 * der 7 kuratierten Archetyp-Decks (`aiDecks.ts#AI_DECKS`) namentlich
 * auswählen und direkt als eigene Deckliste laden - zusätzliche, klar
 * benannte Alternative neben "Zufällig füllen" (s. frontend-status.md,
 * "Archetyp-Deckauswahl für den menschlichen Spieler").
 *
 * Bewusst NICHT geprüft: `pickRandomAiDeck()`/dessen Geheimhaltungsverhalten
 * für den Bot-Gegner - das bleibt unverändert und ist bereits durch
 * vs-bot.test.ts abgedeckt.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AI_DECKS } from "../aiDecks";
import { click, enterHotseatNewGame, queryOne, selectValue } from "./testHelpers";

describe("Archetyp-Deck-Auswahl im Deckbau (menschlicher Spieler)", () => {
  // Frisches store.ts/render.ts-Modul pro Test (gleiches Muster wie
  // deck-persistence.test.ts) - store.ts hält seinen Zustand modul-scoped,
  // ohne Reset würde ein Test im Deckbau-Zustand des vorherigen Tests
  // aufsetzen statt frisch im Hauptmenü zu starten.
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  it("Auswahl-Dropdown listet alle 7 AI_DECKS-Archetypen mit Namen auf", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    const select = queryOne<HTMLSelectElement>(root, ".deckbuilder-archetype-select");
    const optionLabels = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(optionLabels).toEqual(AI_DECKS.map((d) => d.name));
  });

  it("'Archetyp-Deck laden' übernimmt genau die Decklist des ausgewählten Archetyps", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // Deck vor der Auswahl ist leer.
    expect(store.getDecklist("player1")).toEqual({});

    // Dritten Archetyp ("Aschen des Untergangs") auswählen und laden.
    const targetIndex = 2;
    selectValue(queryOne<HTMLSelectElement>(root, ".deckbuilder-archetype-select"), String(targetIndex));
    click(queryOne(root, ".deckbuilder-archetype-load-btn"));

    expect(store.getDecklist("player1")).toEqual(AI_DECKS[targetIndex]!.decklist);

    // Das übernommene Deck ist eines der kuratierten Decks -> bereits gültig
    // (>= 40 Karten, s. deckValidation.ts), der "Weiter"-Button ist also
    // nutzbar, ohne dass manuell nachjustiert werden musste.
    expect(queryOne(root, ".deckbuilder-status").textContent).toContain("Deck gültig");
    expect(queryOne<HTMLButtonElement>(root, ".deckbuilder-confirm-btn").disabled).toBe(false);
  });

  it("'Zufällig füllen' bleibt als eigenständige, unveränderte Alternative erhalten", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    expect(queryOne(root, ".deckbuilder-random-fill-btn")).toBeTruthy();
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    expect(Object.keys(store.getDecklist("player1")).length).toBeGreaterThan(0);
  });
});
