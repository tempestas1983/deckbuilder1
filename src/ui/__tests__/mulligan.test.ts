// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für die Mulligan-Entscheidung (v0.1.6, rules-engine.md
 * 1b + Entscheidung 9.11, Paris-Variante). Deckt beide Zweige der Decision
 * über echte Klicks ab: mulliganen (neu mischen, eine Karte weniger) und
 * behalten. Baut auf demselben App-Start-Muster wie golden-path.test.ts auf
 * (Deckbau -> Spielstart), prüft aber die Mulligan-Phase selbst statt sie
 * per keepAllMulligans() zu überspringen.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonWithText, click, enterHotseatNewGame, makeSeededRandom, queryOne } from "./testHelpers";

describe("Mulligan-UI (v0.1.6)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(4711));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Mulliganen (ablehnen der Starthand) verkleinert die Hand um 1 und zählt PlayerState.mulligans hoch, danach behalten beendet die Phase für diesen Spieler", async () => {
    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // Deckbau beider Spieler (wie golden-path.test.ts) - Deckinhalt ist für
    // diesen Test irrelevant, nur Handgröße/mulligans-Zähler zählen.
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    // createGame endet jetzt (Engine-Default skipMulligans: false) mit einer
    // offenen mulligan-PendingDecision für den Startspieler.
    let state = getState();
    expect(state.pendingDecision?.kind).toBe("mulligan");
    const startingPlayer = state.pendingDecision!.player;
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", timesMulliganed: 0 });
    expect(state.players[startingPlayer].hand.length).toBe(7);
    expect(state.players[startingPlayer].mulligans).toBe(0);
    expect(queryOne(root, ".mulligan-panel").textContent).toContain(startingPlayer);

    // 1) Mulliganen ("ablehnen" der Starthand): neue Hand mit 6 Karten,
    // mulligans-Zähler hoch, Decision bleibt beim SELBEN Spieler (streng
    // sequentiell, rules-engine.md 1b).
    click(buttonWithText(root, ".btn.btn-cancel", "Mulligan (neu mischen)"));
    state = getState();
    expect(state.pendingDecision).toMatchObject({
      kind: "mulligan",
      player: startingPlayer,
      timesMulliganed: 1,
    });
    expect(state.players[startingPlayer].hand.length).toBe(6);
    expect(state.players[startingPlayer].mulligans).toBe(1);

    // 2) Jetzt behalten (annehmen): Phase für diesen Spieler ist beendet,
    // Decision geht (sequentiell) an den anderen Spieler über - die
    // gemulligante Hand (6 Karten) bleibt unverändert.
    click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
    state = getState();
    expect(state.players[startingPlayer].hand.length).toBe(6);
    expect(state.pendingDecision?.kind).toBe("mulligan");
    const otherPlayer = state.pendingDecision!.player;
    expect(otherPlayer).not.toBe(startingPlayer);
    expect(state.players[otherPlayer].hand.length).toBe(7);

    // 3) Zweiter Spieler behält direkt -> Mulligan-Phase komplett beendet,
    // das Spiel steht am Untap Step (Priority noch nicht vergeben, da Untap
    // kein Priority-Fenster hat, rules-engine.md Abschnitt 2).
    click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
    state = getState();
    expect(state.pendingDecision).toBeUndefined();
    expect(root.querySelector(".mulligan-panel")).toBeFalsy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
