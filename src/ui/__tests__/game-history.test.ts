// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für den Spielverlauf/Statistik-Screen (s.
 * store.ts#recordGameHistoryForEvent/listGameHistory/GameHistoryEntry,
 * components/statsScreen.ts, types.ts#AppPhase "stats").
 *
 * Deckt den End-to-End-Pfad ab APP-START ab (nur echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
 * erzeugte DOM, wie golden-path.test.ts/concede.test.ts - kein direkter
 * store.dispatch()-Aufruf für die geprüfte Interaktion):
 *
 * 1. Hotseat-Partie (player1 vs. echter zweiter Mensch) -> player1 gibt auf
 *    -> Niederlage-Eintrag mit Gegnertyp "human" landet in localStorage
 *    (`deckbuilder1.gameHistory`) -> "Zurück zum Hauptmenü" -> "Statistik"
 *    zeigt den Eintrag im chronologischen Verlauf UND in der aggregierten
 *    Bilanz an.
 * 2. Partie gegen einen KI-Gegner (Schwierigkeit "hard") -> player1 gibt auf
 *    -> Niederlage-Eintrag mit Gegnertyp {kind: "bot", difficulty: "hard"} -
 *    zusammen mit Test 1 ergibt das zwei Einträge, die aggregierte Bilanz
 *    schlüsselt sie getrennt nach Gegnertyp auf (Auftrag: "ggf. pro
 *    Schwierigkeitsstufe").
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

const GAME_HISTORY_STORAGE_KEY = "deckbuilder1.gameHistory";

describe("Spielverlauf/Statistik-Screen", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    window.localStorage.clear();
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260802));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Hotseat-Partie bis zum Ende (Aufgeben) -> Verlauf-Eintrag landet in localStorage -> Statistik-Screen zeigt ihn an", async () => {
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

    // Noch KEIN Verlauf-Eintrag, solange die Partie läuft.
    expect(window.localStorage.getItem(GAME_HISTORY_STORAGE_KEY)).toBeFalsy();

    vi.spyOn(window, "confirm").mockReturnValue(true);
    click(queryOne<HTMLButtonElement>(root, '[data-testid="concede-player1"]'));

    const state = store.getState();
    expect(state.winner).toBe("player2"); // player1 hat aufgegeben -> Niederlage aus player1-Sicht

    // --- localStorage-Persistenz ---
    const raw = window.localStorage.getItem(GAME_HISTORY_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const stored: Array<{ result: string; opponent: unknown; playedAt: string }> = JSON.parse(raw!);
    expect(stored).toHaveLength(1);
    expect(stored[0]!.result).toBe("loss");
    expect(stored[0]!.opponent).toEqual({ kind: "human" });
    expect(typeof stored[0]!.playedAt).toBe("string");

    expect(store.listGameHistory()).toHaveLength(1);
    expect(store.listGameHistory()[0]!.result).toBe("loss");
    expect(store.listGameHistory()[0]!.opponent).toEqual({ kind: "human" });

    // --- Statistik-Screen: erreichbar vom Hauptmenü, zeigt den Eintrag ---
    click(buttonWithText(root, ".btn.btn-cancel", "Zurück zum Hauptmenü"));
    expect(store.getAppPhase()).toEqual({ kind: "mainMenu" });

    click(queryOne(root, ".main-menu-stats-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "stats" });
    expect(root.querySelector(".stats-screen")).toBeTruthy();

    const historyRows = root.querySelectorAll('[data-testid="stats-history-row"]');
    expect(historyRows).toHaveLength(1);
    expect(historyRows[0]!.textContent).toContain("Niederlage");
    expect(historyRows[0]!.textContent).toContain("Mensch (Hotseat)");

    const aggregateRows = root.querySelectorAll('[data-testid="stats-aggregate-row"]');
    expect(aggregateRows.length).toBeGreaterThanOrEqual(2); // "Gesamt" + mindestens eine Gegnertyp-Zeile
    expect(aggregateRows[0]!.textContent).toContain("Gesamt");
    expect(aggregateRows[0]!.textContent).toContain("0 Siege");
    expect(aggregateRows[0]!.textContent).toContain("1 Niederlagen");

    // "Zurück zum Hauptmenü" verlässt den Statistik-Screen wieder.
    click(queryOne(root, ".stats-back-to-menu-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "mainMenu" });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it(
    "Partie gegen KI (Schwierigkeit 'hard', Aufgeben) -> Verlauf-Eintrag mit Gegnertyp bot/hard, aggregierte Bilanz schlüsselt nach Schwierigkeitsstufe auf",
    async () => {
      const { render } = await import("../render");
      const store = await import("../store");
      store.setBotMoveDelayMs(0);
      const root = document.createElement("div");
      document.body.append(root);

      store.subscribe(() => render(root));
      render(root);

      click(queryOne(root, ".main-menu-new-game-btn"));
      click(queryOne<HTMLButtonElement>(root, '.opponent-select-difficulty-btn[data-difficulty="hard"]'));
      expect(store.getBotDifficulty("player2")).toBe("hard");

      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));
      expect(store.getAppPhase()).toEqual({ kind: "playing" });

      const waitForBot = async (): Promise<void> => {
        await vi.waitFor(
          () => {
            expect(store.isBotThinking()).toBe(false);
          },
          { timeout: 20000, interval: 5 },
        );
      };
      await waitForBot();

      // player1s eigene Mulligan-Entscheidung(en) beiseite räumen, falls
      // noch offen (der Bot behandelt seine eigene automatisch, s. runBotStep).
      for (let i = 0; i < 5; i++) {
        const pending = store.getState().pendingDecision;
        if (pending?.kind !== "mulligan" || pending.player !== "player1") break;
        click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
        await waitForBot();
      }

      vi.spyOn(window, "confirm").mockReturnValue(true);
      click(queryOne<HTMLButtonElement>(root, '[data-testid="concede-player1"]'));
      await waitForBot();

      expect(store.getState().winner).toBe("player2");

      const stored: Array<{ result: string; opponent: unknown }> = JSON.parse(
        window.localStorage.getItem(GAME_HISTORY_STORAGE_KEY)!,
      );
      expect(stored).toHaveLength(1);
      expect(stored[0]!.result).toBe("loss");
      expect(stored[0]!.opponent).toEqual({ kind: "bot", difficulty: "hard" });

      click(buttonWithText(root, ".btn.btn-cancel", "Zurück zum Hauptmenü"));
      click(queryOne(root, ".main-menu-stats-btn"));

      const historyRows = root.querySelectorAll('[data-testid="stats-history-row"]');
      expect(historyRows).toHaveLength(1);
      expect(historyRows[0]!.textContent).toContain("KI - Schwer");

      const aggregateRows = Array.from(root.querySelectorAll('[data-testid="stats-aggregate-row"]'));
      const hardRow = aggregateRows.find((el) => el.textContent?.includes("KI - Schwer"));
      expect(hardRow).toBeTruthy();
      expect(hardRow!.textContent).toContain("1 Niederlagen");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
    20000,
  );
});
