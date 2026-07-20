// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für den "Aufgeben"-Button (v0.1.8, s.
 * docs/frontend-status.md). Deckt beides ab: (a) ein echter Klick auf den
 * Button + Bestätigung führt tatsächlich zum Spielende (playerLost/gameEnded,
 * wie von der Engine über `concede` bereits unterstützt, s.
 * src/model/game-state.ts), (b) Abbruch der Bestätigung löst NICHTS aus.
 *
 * Wie golden-path.test.ts: ausschließlich echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
 * erzeugte DOM ab echtem App-Start (kein direkter `store.dispatch()`-Aufruf
 * für die geprüfte Interaktion), `window.confirm` wird per `vi.spyOn`
 * kontrolliert (siehe render.ts#playerArea, "einfache Bestätigung" statt
 * eines eigenen Modal-Systems).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, enterHotseatNewGame, keepAllMulligans, makeSeededRandom, queryOne } from "./testHelpers";

describe('"Aufgeben"-Button (v0.1.8)', () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    randomSpy = vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260710));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  async function startGame(): Promise<{ root: HTMLDivElement; store: typeof import("../store") }> {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // Deckbau (Hotseat, keine KI) - beide Spieler zufällig füllen bzw. von
    // Spieler 1 übernehmen, exakt wie im golden-path-Test.
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    return { root, store };
  }

  it("echter Klick + Bestätigung lässt den Spieler verlieren und beendet das Spiel", async () => {
    const { root, store } = await startGame();

    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    // Der Button ist im Spieler-1-Panel über den Test-Marker aus
    // playerPanel.ts ansprechbar (data-testid, nur für Testbarkeit ergänzt).
    const concedeBtn = queryOne<HTMLButtonElement>(root, '[data-testid="concede-player1"]');
    expect(concedeBtn.textContent).toBe("Aufgeben");
    click(concedeBtn);

    expect(confirmSpy).toHaveBeenCalledTimes(1);

    const state = store.getState();
    expect(state.players.player1.hasLost).toBe(true);
    expect(state.winner).toBe("player2");
    expect(root.querySelector(".game-over-banner")?.textContent).toContain("Sieger: player2");

    // Log enthält die Engine-Events (playerLost/gameEnded, s. store.ts#describeEvent).
    const log = store.getLog();
    expect(log.some((line) => line.includes("player1") && line.includes("verliert"))).toBe(true);
    expect(log.some((line) => line.includes("Spiel beendet"))).toBe(true);

    // Nach Spielende gibt es keinen Aufgeben-Button mehr (weder für den
    // Verlierer noch den Gewinner) - render.ts#playerArea blendet ihn aus,
    // sobald state.winner gesetzt ist.
    expect(root.querySelector('[data-testid="concede-player1"]')).toBeFalsy();
    expect(root.querySelector('[data-testid="concede-player2"]')).toBeFalsy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Abbruch der Bestätigung (window.confirm -> false) löst KEINE Aktion aus", async () => {
    const { root, store } = await startGame();

    vi.spyOn(window, "confirm").mockReturnValue(false);
    const stateBefore = store.getState();

    click(queryOne<HTMLButtonElement>(root, '[data-testid="concede-player1"]'));

    const stateAfter = store.getState();
    expect(stateAfter).toBe(stateBefore); // kein dispatch() -> keine State-Änderung
    expect(stateAfter.players.player1.hasLost).toBe(false);
    expect(stateAfter.winner).toBeUndefined();
    // Button ist weiterhin da (Spiel läuft unverändert weiter).
    expect(root.querySelector('[data-testid="concede-player1"]')).toBeTruthy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
