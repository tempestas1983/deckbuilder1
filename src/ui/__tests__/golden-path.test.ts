// @vitest-environment jsdom
/**
 * Dauerhafte UI-Regressionstests (Auftrag "Permanente UI-Regressionstests",
 * v0.1.5). Bis hierhin gab es laut docs/frontend-status.md nur
 * Wegwerf-jsdom-Tests, die nach jeder Verifikationsrunde wieder gelöscht
 * wurden - diese Datei bleibt bewusst im Repo.
 *
 * Deckt den echten End-to-End-Pfad AB APP-START ab (kein direkter
 * store.dispatch()/store.initGame()-Aufruf für die geprüfte Interaktion,
 * nur echte `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von
 * `render()` erzeugte DOM - exakt das Muster aus den v0.1.1/v0.1.2-Klick-
 * Golden-Path-Verifikationen, jetzt aber dauerhaft als Vitest-Test):
 *
 * App-Start (Deckbau-Screen Spieler 1) -> "Zufällig füllen" -> "Weiter"
 * -> Deckbau-Screen Spieler 2 -> "Gleiches Deck wie Spieler 1 übernehmen"
 * -> "Spiel starten" -> Spielbrett -> Priorität passen (Upkeep -> Draw ->
 * Main1) -> Terrain aus der Hand spielen (Battlefield wächst um 1).
 *
 * Jeder Testfall importiert store.ts/render.ts frisch (vi.resetModules()),
 * damit die beiden Tests sich nicht über den modul-scoped Store-Zustand
 * gegenseitig beeinflussen.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

/** Deterministischer Ersatz für Math.random() (mulberry32), s.u. Kommentar am Verwendungsort. */
function makeSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function click(el: Element | null | undefined): void {
  if (!el) throw new Error("click(): Element nicht gefunden.");
  el.dispatchEvent(new Event("click", { bubbles: true }));
}

function queryOne<T extends Element = Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Element nicht gefunden: ${selector}`);
  return el;
}

function buttonWithText(root: ParentNode, selector: string, label: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll<HTMLButtonElement>(selector)).find((b) => b.textContent === label);
}

describe("Frontend Golden Path (End-to-End ab App-Start, v0.1.5)", () => {
  let randomSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    // Fester Seed statt echtem Math.random(): macht buildDemoDeck() (Fisher-
    // Yates-Sampling, deck.ts) und den createGame-Seed (initGame() bildet ihn
    // per Math.random(), store.ts) reproduzierbar - ohne das wäre der
    // "Terrain aus der Hand spielen"-Schritt unten mit einer sehr kleinen,
    // aber nicht-null Wahrscheinlichkeit flaky (Starthand ohne Terrain).
    // Die Engine-eigene RNG (src/engine/rng.ts) ist ohnehin unabhängig von
    // Math.random() (eigener geseedeter mulberry32-State im GameState).
    randomSpy = vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260709));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Deckbau-Validierung: 'Weiter' ist erst nach einem gültigen Deck (>= 40 Karten) aktiv", async () => {
    const { render } = await import("../render");
    const { subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    // Wie main.ts: erst abonnieren, DANACH den ersten Render anstoßen -
    // sonst lösen spätere store-Änderungen (z.B. durch Klicks) keinen
    // Re-Render aus.
    subscribe(() => render(root));
    render(root);

    // Leeres Deck -> Confirm-Button ist gesperrt.
    let confirmBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-confirm-btn");
    expect(confirmBtn.disabled).toBe(true);
    expect(queryOne(root, ".deckbuilder-status").textContent).toContain("0/40");

    // "Zufällig füllen" (nutzt buildDemoDeck() aus deck.ts) -> Deck ist valide.
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    confirmBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-confirm-btn");
    expect(confirmBtn.disabled).toBe(false);
    expect(queryOne(root, ".deckbuilder-status").textContent).toContain("Deck gültig");

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("Kompletter Flow: Deckbau (beide Spieler) -> Spielstart -> Priorität passen -> Terrain spielen", async () => {
    const { render } = await import("../render");
    const { getAppPhase, getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    // Wie main.ts: erst abonnieren, DANACH den ersten Render anstoßen.
    subscribe(() => render(root));
    render(root); // Deckbau-Screen Spieler 1 (Startzustand der App, kein initGame()-Aufruf)
    expect(getAppPhase()).toEqual({ kind: "deckbuild", player: "player1" });
    expect(root.querySelector(".deckbuilder-screen")).toBeTruthy();

    // Spieler 1: Zufällig füllen, dann Weiter.
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(getAppPhase()).toEqual({ kind: "deckbuild", player: "player2" });

    // Spieler 2: Abkürzung "Gleiches Deck wie Spieler 1 übernehmen", dann Spiel starten.
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    const confirmBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-confirm-btn");
    expect(confirmBtn.disabled).toBe(false); // Deck von Spieler 1 übernommen -> bereits valide
    click(confirmBtn);

    // Jetzt läuft die Partie (initGame() wurde intern von confirmDeck() ausgelöst).
    expect(getAppPhase()).toEqual({ kind: "playing" });
    expect(root.querySelector(".deckbuilder-screen")).toBeFalsy();
    expect(queryOne(root, ".status-bar")).toBeTruthy();

    const statusText = () => queryOne(root, ".status-bar").textContent ?? "";

    // Golden Path (v0.1.1): Upkeep -> Draw -> Main1, ausschließlich über
    // echte Klicks auf den "Priorität passen"-Button (nie direkter
    // store.dispatch()-Aufruf für diesen Teil des Tests).
    let guard = 0;
    while (!statusText().includes("Step: main1") && guard < 20) {
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      expect(passBtn).toBeTruthy();
      click(passBtn);
      guard++;
    }
    expect(statusText()).toContain("Step: main1");

    // Terrain aus der Hand spielen: Battlefield des Spielers mit der aktuellen
    // Priorität wächst um genau 1. Der Button existiert nur, wenn
    // getLegalActions tatsächlich eine playTerrain-Aktion für eine Handkarte
    // liefert (siehe render.ts#handZone) - kein clientseitiges Rateergebnis.
    const priorityPlayer = getState().priorityPlayer;
    expect(priorityPlayer).toBeDefined();
    const battlefieldBefore = getState().players[priorityPlayer!].battlefield.length;

    const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
    expect(terrainBtn).toBeTruthy();
    click(terrainBtn);

    const battlefieldAfter = getState().players[priorityPlayer!].battlefield.length;
    expect(battlefieldAfter).toBe(battlefieldBefore + 1);
    expect(getState().step).toBe("main1");

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
