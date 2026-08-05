// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für den Autosave/Fortsetzen-Mechanismus ("Spielspeicher
 * in der Partie", Nutzer-Auftrag: eine laufende Partie verlassen und später
 * fortsetzen können - s. store.ts#SavedGamePayload/hasSavedGame/
 * getSavedGameSummary/resumeSavedGame/autosaveGameForEvent).
 *
 * Deckt den End-to-End-Pfad AB APP-START ab (echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
 * erzeugte DOM, wie golden-path.test.ts/game-history.test.ts) - ein
 * "Reload" wird dabei über `vi.resetModules()` + einen frischen
 * `import("../store")`/`import("../render")` simuliert (genau wie
 * juice-toggle.test.ts das für den Musik-/SFX-/Effekte-Toggle-Persistenz-Test
 * macht): der frische Modul-Load liest den Autosave beim Modul-Init aus dem
 * ECHTEN `window.localStorage` (kein In-Memory-Bypass), deckt also den
 * kompletten JSON-Roundtrip inklusive `isSavedGamePayloadShape`-Prüfung ab.
 *
 * 1. Roundtrip: Hotseat-Partie bis nach dem ersten Terrain-Legen -> Autosave
 *    liegt in localStorage -> "Reload" -> Hauptmenü zeigt "Weiter spielen"
 *    mit korrekter Vorschau -> Klick darauf reproduziert den GENAUEN
 *    GameState (inkl. Terrain auf dem Battlefield) OHNE eine neue Partie zu
 *    erzeugen (kein neuer Münzwurf/keine neuen Starthände).
 * 2. Tutorial-Partien werden NICHT autogesichert (kein localStorage-Eintrag
 *    während der laufenden Tutorial-Partie).
 * 3. Der Autosave wird bei "gameEnded" (hier: Aufgeben) sofort gelöscht.
 * 4. Fortsetzen rekonstruiert Bot-Steuerung/-Schwierigkeit exakt (KI-Partie)
 *    UND Hotseat (kein Bot) getrennt geprüft.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buttonWithText,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryOne,
} from "./testHelpers";

const SAVED_GAME_STORAGE_KEY = "deckbuilder1.savedGame";

/** Passt Priorität über echte Klicks, bis `main1` erreicht ist - identisches Muster wie golden-path.test.ts. */
function passToMain1(root: ParentNode): void {
  const currentStepText = () => queryOne(root, '[data-testid="turn-flow-current-step"]').textContent ?? "";
  let guard = 0;
  while (!currentStepText().includes("main1") && guard < 20) {
    const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
    expect(passBtn).toBeTruthy();
    click(passBtn);
    guard++;
  }
  expect(currentStepText()).toContain("main1");
}

describe("Spielstand-Autosave (store.ts#hasSavedGame/getSavedGameSummary/resumeSavedGame)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260711));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Hotseat-Partie bis zum Terrain-Legen -> Autosave in localStorage -> 'Weiter spielen' reproduziert exakt denselben GameState", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);

    enterHotseatNewGame(root);
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "playing" });

    // Noch VOR jeder echten Aktion (nur die initiale Starthand-Ziehung) muss
    // bereits ein Autosave existieren - Auftrag "automatisch nach
    // state-verändernden Aktionen", createGame zählt dazu.
    expect(window.localStorage.getItem(SAVED_GAME_STORAGE_KEY)).toBeTruthy();

    keepAllMulligans(root);
    passToMain1(root);

    const priorityPlayer = store.getState().priorityPlayer;
    expect(priorityPlayer).toBeDefined();
    const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
    expect(terrainBtn).toBeTruthy();
    click(terrainBtn);
    expect(store.getState().players[priorityPlayer!].battlefield.length).toBeGreaterThan(0);

    // --- Zustand VOR dem "Verlassen" einfrieren ---
    const stateBefore = store.getState();
    const rawBefore = window.localStorage.getItem(SAVED_GAME_STORAGE_KEY);
    expect(rawBefore).toBeTruthy();
    const parsedBefore = JSON.parse(rawBefore!);
    expect(parsedBefore.version).toBe(1);
    expect(parsedBefore.state.turnNumber).toBe(stateBefore.turnNumber);
    expect(parsedBefore.opponent).toEqual({ kind: "human" });
    expect(parsedBefore.botControlledPlayers).toEqual([]);

    expect(store.hasSavedGame()).toBe(true);
    const summaryBefore = store.getSavedGameSummary();
    expect(summaryBefore?.turnNumber).toBe(stateBefore.turnNumber);
    expect(summaryBefore?.opponent).toEqual({ kind: "human" });
    expect(typeof summaryBefore?.savedAt).toBe("string");

    // --- "App neu starten" (frischer Modul-Load, liest den echten localStorage neu ein) ---
    vi.resetModules();
    const { render: renderAfter } = await import("../render");
    const storeAfter = await import("../store");
    const rootAfter = document.createElement("div");
    document.body.append(rootAfter);
    storeAfter.subscribe(() => renderAfter(rootAfter));
    renderAfter(rootAfter);

    expect(storeAfter.getAppPhase()).toEqual({ kind: "mainMenu" });
    expect(storeAfter.hasSavedGame()).toBe(true);
    const summaryAfter = storeAfter.getSavedGameSummary();
    expect(summaryAfter).toEqual(summaryBefore);

    const resumeBtn = rootAfter.querySelector<HTMLButtonElement>(".main-menu-resume-game-btn");
    expect(resumeBtn).toBeTruthy();
    expect(resumeBtn!.textContent).toContain("Weiter spielen");
    expect(resumeBtn!.textContent).toContain(`Zug ${stateBefore.turnNumber}`);

    click(resumeBtn);
    expect(storeAfter.getAppPhase()).toEqual({ kind: "playing" });

    // Voller Roundtrip: derselbe GameState (keine neue Partie, kein neuer
    // Münzwurf/neue Starthände) - JSON-Roundtrip auf beiden Seiten, damit
    // strukturell (nicht referenziell) verglichen wird, exakt wie tatsächlich
    // persistiert/gelesen.
    expect(JSON.parse(JSON.stringify(storeAfter.getState()))).toEqual(JSON.parse(JSON.stringify(stateBefore)));

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Tutorial-Partien werden NICHT autogesichert", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);

    click(queryOne(root, ".main-menu-tutorial-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "playing" });
    expect(store.isTutorialActive()).toBe(true);

    // Ein paar echte Aktionen durchklicken (Mulligan behalten, ggf. passen) -
    // trotzdem darf während der gesamten Tutorial-Partie nie ein Autosave
    // entstehen.
    for (let i = 0; i < 5; i++) {
      const keepBtn = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
      if (keepBtn) {
        click(keepBtn);
        continue;
      }
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      if (passBtn) click(passBtn);
    }

    expect(window.localStorage.getItem(SAVED_GAME_STORAGE_KEY)).toBeFalsy();
    expect(store.hasSavedGame()).toBe(false);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Der Autosave wird bei Spielende (Aufgeben) sofort gelöscht", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);

    enterHotseatNewGame(root);
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "playing" });

    keepAllMulligans(root);
    expect(window.localStorage.getItem(SAVED_GAME_STORAGE_KEY)).toBeTruthy();
    expect(store.hasSavedGame()).toBe(true);

    vi.spyOn(window, "confirm").mockReturnValue(true);
    click(queryOne<HTMLButtonElement>(root, '[data-testid="concede-player1"]'));

    expect(store.getState().winner).toBeDefined();
    expect(window.localStorage.getItem(SAVED_GAME_STORAGE_KEY)).toBeFalsy();
    expect(store.hasSavedGame()).toBe(false);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Fortsetzen rekonstruiert Bot-Steuerung/-Schwierigkeit exakt (KI-Partie) bzw. Hotseat (kein Bot)", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    store.setBotMoveDelayMs(0);
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);

    click(queryOne(root, ".main-menu-new-game-btn"));
    click(queryOne<HTMLButtonElement>(root, '.opponent-select-difficulty-btn[data-difficulty="hard"]'));
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "playing" });
    expect(store.isBotControlled("player2")).toBe(true);
    expect(store.getBotDifficulty("player2")).toBe("hard");

    const waitForBot = async (): Promise<void> => {
      await vi.waitFor(
        () => {
          expect(store.isBotThinking()).toBe(false);
        },
        { timeout: 20000, interval: 5 },
      );
    };
    await waitForBot();
    for (let i = 0; i < 5; i++) {
      const pending = store.getState().pendingDecision;
      if (pending?.kind !== "mulligan" || pending.player !== "player1") break;
      click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
      await waitForBot();
    }

    expect(window.localStorage.getItem(SAVED_GAME_STORAGE_KEY)).toBeTruthy();
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_GAME_STORAGE_KEY)!);
    expect(parsed.botControlledPlayers).toEqual(["player2"]);
    expect(parsed.botDifficulty).toEqual({ player1: "medium", player2: "hard" });
    expect(parsed.opponent).toEqual({ kind: "bot", difficulty: "hard" });

    // "Reload" -> frischer Modul-Zustand kennt player2 zunächst NICHT als
    // bot-gesteuert (Default player1/player2 beide "medium"/nicht bot) - erst
    // resumeSavedGame() muss das aus der Payload rekonstruieren.
    vi.resetModules();
    const { render: renderAfter } = await import("../render");
    const storeAfter = await import("../store");
    expect(storeAfter.isBotControlled("player2")).toBe(false);

    const rootAfter = document.createElement("div");
    document.body.append(rootAfter);
    storeAfter.subscribe(() => renderAfter(rootAfter));
    renderAfter(rootAfter);

    storeAfter.resumeSavedGame();
    expect(storeAfter.getAppPhase()).toEqual({ kind: "playing" });
    expect(storeAfter.isBotControlled("player2")).toBe(true);
    expect(storeAfter.isBotControlled("player1")).toBe(false);
    expect(storeAfter.getBotDifficulty("player2")).toBe("hard");

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
