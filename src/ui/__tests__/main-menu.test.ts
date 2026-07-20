// @vitest-environment jsdom
/**
 * Dauerhafter End-to-End-UI-Test für das "echtes Hauptmenü statt
 * Direkteinstieg"-Umbau (s. types.ts#AppPhase, components/mainMenu.ts/
 * opponentSelect.ts, store.ts#startNewGameFlow/chooseOpponentBot/
 * chooseOpponentHotseat/openDeckBuilderStandalone/backToMainMenu).
 *
 * golden-path.test.ts/vs-bot.test.ts/vs-bot-difficulty.test.ts/
 * tutorial.test.ts decken weiterhin den BISHERIGEN Deckbau-/Bot-/Tutorial-
 * Ablauf NACH dem Hauptmenü ab (jetzt jeweils über "Neues Spiel" -> "2
 * Spieler" bzw. "Tutorial" erreicht) - diese Datei prüft stattdessen die drei
 * dadurch neu hinzugekommenen Klickpfade selbst:
 *
 * 1. Hauptmenü -> "Neues Spiel" -> KI-Schwierigkeit wählen -> player1 baut
 *    sein Deck -> die Partie startet SOFORT gegen den Bot, der
 *    player2-Deckbau-Screen wird dabei komplett übersprungen (automatisches
 *    Zufallsdeck für player2, exakt wie beim bisherigen "Zufälliges
 *    KI-Deck + weiter"-Kurzstart, nur jetzt schon vor player1s Deckbau
 *    ausgelöst statt danach).
 * 2. Hauptmenü -> "Deck Builder" -> Deck bauen + unter einem Namen speichern,
 *    OHNE dass danach automatisch eine Partie beginnt -> "Zurück zum
 *    Hauptmenü" führt zurück, das gespeicherte Deck bleibt erhalten.
 * 3. "Zurück zum Hauptmenü" aus einer laufenden (Nicht-Tutorial-)Partie führt
 *    zurück zum Hauptmenü, nicht mehr direkt in den Deckbau (Auftrag Punkt 2).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonWithText, click, makeSeededRandom, queryOne } from "./testHelpers";

describe("Hauptmenü (echtes Hauptmenü statt Direkteinstieg)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260720));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "Hauptmenü -> Neues Spiel -> KI-Schwierigkeit wählen -> player1 baut Deck -> Partie startet direkt gegen den Bot, player2-Deckbau-Screen wird übersprungen",
    async () => {
      const { render } = await import("../render");
      const { getAppPhase, getBotDifficulty, getDecklist, isBotControlled, subscribe } = await import("../store");

      const root = document.createElement("div");
      document.body.append(root);
      subscribe(() => render(root));
      render(root);

      expect(getAppPhase()).toEqual({ kind: "mainMenu" });
      expect(root.querySelector(".main-menu-screen")).toBeTruthy();

      click(queryOne(root, ".main-menu-new-game-btn"));
      expect(getAppPhase()).toEqual({ kind: "opponentSelect" });
      expect(root.querySelector(".opponent-select-screen")).toBeTruthy();

      const hardBtn = queryOne<HTMLButtonElement>(root, '.opponent-select-difficulty-btn[data-difficulty="hard"]');
      click(hardBtn);

      // Sofort nach der Schwierigkeitswahl: player1-Deckbau-Screen, player2
      // ist schon als bot-gesteuert (Stufe "hard") markiert - VOR player1s
      // eigenem Deckbau, nicht erst danach.
      expect(getAppPhase()).toEqual({ kind: "deckbuild", player: "player1", mode: "newGame" });
      expect(isBotControlled("player2")).toBe(true);
      expect(getBotDifficulty("player2")).toBe("hard");
      expect(root.querySelector(".deckbuilder-ai-toggle")).toBeFalsy(); // player1-Screen hat keinen KI-Umschalter

      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));

      // Die Partie läuft jetzt direkt - der player2-Deckbau-Screen wurde
      // komplett übersprungen (kein Zwischenstopp bei
      // { kind: "deckbuild", player: "player2" }, den ein Test hier
      // beobachten könnte).
      expect(getAppPhase()).toEqual({ kind: "playing" });
      expect(root.querySelector(".deckbuilder-screen")).toBeFalsy();
      expect(Object.keys(getDecklist("player2")).length).toBeGreaterThan(0);
      expect(queryOne(root, '[data-player="player2"] .badge-bot').textContent).toBe("KI");
      expect(root.querySelector('[data-player="player1"] .badge-bot')).toBeFalsy();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
    20000,
  );

  it("Hauptmenü -> Deck Builder -> Deck bauen + speichern, OHNE dass eine Partie startet -> Zurück zum Hauptmenü", async () => {
    const { render } = await import("../render");
    const { getAppPhase, listSavedDecks, subscribe } = await import("../store");

    const root = document.createElement("div");
    document.body.append(root);
    subscribe(() => render(root));
    render(root);

    click(queryOne(root, ".main-menu-deckbuilder-btn"));
    expect(getAppPhase()).toEqual({ kind: "deckbuild", player: "player1", mode: "standalone" });
    // Kein "Weiter"/"Spiel starten"-Button in diesem Modus - stattdessen
    // direkt zurück ins Hauptmenü.
    expect(root.querySelector(".deckbuilder-confirm-btn")).toBeFalsy();
    expect(root.querySelector(".deckbuilder-back-to-menu-btn")).toBeTruthy();

    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    expect(queryOne(root, ".deckbuilder-status").textContent).toContain("Deck gültig");

    // Unter einem Namen speichern (benannte Deck-Verwaltung, s.
    // components/savedDecksPanel.ts) - unabhängig vom eigentlichen
    // Partie-Einstieg funktionsfähig.
    click(queryOne(root, '[data-testid="save-deck-btn"]'));
    const nameInput = queryOne<HTMLInputElement>(root, '[data-testid="save-deck-name-input"]');
    nameInput.value = "Mein Taverne-Deck";
    nameInput.dispatchEvent(new Event("input", { bubbles: true }));
    click(queryOne<HTMLButtonElement>(root, '[data-testid="save-deck-confirm-btn"]'));

    expect(listSavedDecks().some((d) => d.name === "Mein Taverne-Deck")).toBe(true);

    // "Zurück zum Hauptmenü" - es wurde zu keinem Zeitpunkt eine Partie
    // gestartet (kein initGame()-Aufruf, s. store.ts#openDeckBuilderStandalone).
    click(queryOne(root, ".deckbuilder-back-to-menu-btn"));
    expect(getAppPhase()).toEqual({ kind: "mainMenu" });
    expect(root.querySelector(".main-menu-screen")).toBeTruthy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('"Zurück zum Hauptmenü" aus einer laufenden Partie (kein Tutorial) führt zurück zum Hauptmenü, nicht in den Deckbau', async () => {
    const { render } = await import("../render");
    const { getAppPhase, subscribe } = await import("../store");

    const root = document.createElement("div");
    document.body.append(root);
    subscribe(() => render(root));
    render(root);

    // Normaler Hotseat-Einstieg (wie golden-path.test.ts).
    click(queryOne(root, ".main-menu-new-game-btn"));
    click(queryOne(root, ".opponent-select-hotseat-btn"));
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(getAppPhase()).toEqual({ kind: "playing" });

    click(buttonWithText(root, ".btn.btn-cancel", "Zurück zum Hauptmenü"));
    expect(getAppPhase()).toEqual({ kind: "mainMenu" });
    expect(root.querySelector(".main-menu-screen")).toBeTruthy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
