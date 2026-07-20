// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für die localStorage-Deck-Persistenz (v0.1.8, s.
 * docs/frontend-status.md). Bisher (v0.1.5) überlebte eine gebaute Deckliste
 * nur innerhalb desselben Tabs (In-Memory im store.ts-Modul) - ein echter
 * Seiten-Reload verlor sie komplett. Simuliert wird der Reload über
 * `vi.resetModules()` + einen frischen `await import("../store")`: store.ts
 * hält seinen Zustand modul-scoped (s. golden-path.test.ts-Kommentar), ein
 * frischer Modul-Import entspricht also exakt "Store startet wieder bei
 * null" - `window.localStorage` selbst ist dagegen an `window` gebunden und
 * überlebt den Modul-Reset unverändert, genau wie im echten Browser einen
 * Tab-Reload.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, enterHotseatNewGame, queryOne } from "./testHelpers";

describe("Deck-Persistenz über localStorage (v0.1.8)", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  it("Deck bauen -> bestätigen -> simulierter Reload -> Deckbau-Screen ist mit dem gespeicherten Deck vorbefüllt", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // Spieler 1: zufällig füllen + bestätigen (löst store.ts#confirmDeck aus,
    // das seit v0.1.8 zusätzlich in localStorage speichert).
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    const savedP1Deck = store.getDecklist("player1");
    expect(Object.keys(savedP1Deck).length).toBeGreaterThan(0);

    // Spieler 2: Deck von Spieler 1 übernehmen + bestätigen (startet die
    // Partie) - auch player2 wird gespeichert, da er hier NICHT bot-gesteuert
    // ist (Auftrag: "gerne auch Spieler 2 falls kein Bot").
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "playing" });

    const rawP1 = window.localStorage.getItem("deckbuilder1.lastDeck.player1");
    const rawP2 = window.localStorage.getItem("deckbuilder1.lastDeck.player2");
    expect(rawP1).toBeTruthy();
    expect(rawP2).toBeTruthy();
    expect(JSON.parse(rawP1!)).toEqual(savedP1Deck);
    expect(JSON.parse(rawP2!)).toEqual(savedP1Deck); // player2 hat player1s Deck übernommen

    // --- Simulierter Reload: frisches store.ts/render.ts-Modul, aber
    // dasselbe window.localStorage (s. Datei-Kommentar oben). ---
    vi.resetModules();
    document.body.innerHTML = "";
    const { render: renderAfterReload } = await import("../render");
    const storeAfterReload = await import("../store");
    const rootAfterReload = document.createElement("div");
    document.body.append(rootAfterReload);

    // Frischer Modul-Zustand: App startet wie immer im Hauptmenü, OHNE dass
    // irgendjemand in dieser "Session" schon etwas gebaut hätte - "Neues
    // Spiel" -> "2 Spieler" führt zum player1-Deckbau-Screen.
    storeAfterReload.subscribe(() => renderAfterReload(rootAfterReload));
    renderAfterReload(rootAfterReload);
    expect(storeAfterReload.getAppPhase()).toEqual({ kind: "mainMenu" });
    enterHotseatNewGame(rootAfterReload);
    expect(storeAfterReload.getAppPhase()).toEqual({ kind: "deckbuild", player: "player1", mode: "newGame" });

    // Die Vorbefüllung kommt nach dem "Reload" ausschließlich aus
    // localStorage (In-Memory ist ja frisch/leer) und entspricht exakt dem
    // zuvor gespeicherten Deck.
    expect(storeAfterReload.getDecklist("player1")).toEqual(savedP1Deck);
    expect(storeAfterReload.getDecklist("player2")).toEqual(savedP1Deck);

    // Der Deckbau-Screen selbst zeigt das direkt an: schon beim ersten
    // Render (ohne jeden Klick) ist das Deck gültig.
    expect(queryOne(rootAfterReload, ".deckbuilder-status").textContent).toContain("Deck gültig");
    const confirmBtn = queryOne<HTMLButtonElement>(rootAfterReload, ".deckbuilder-confirm-btn");
    expect(confirmBtn.disabled).toBe(false);

    // Stichprobe: eine tatsächlich im gespeicherten Deck enthaltene Karte
    // zeigt im DOM die richtige Kopienzahl an.
    const sampleEntry = Object.entries(savedP1Deck)[0];
    expect(sampleEntry).toBeDefined();
    const [sampleCardId, sampleCount] = sampleEntry!;
    const row = queryOne(rootAfterReload, `[data-card-id="${sampleCardId}"] .deck-pool-row-count`);
    expect(row.textContent).toBe(String(sampleCount));
  });

  it("KI-gesteuertes Spieler-2-Deck (Quickstart) wird NICHT in localStorage gespeichert", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(window.localStorage.getItem("deckbuilder1.lastDeck.player1")).toBeTruthy();

    // Spieler 2: KI aktivieren + Quickstart (setzt bot-gesteuert, füllt
    // zufällig, bestätigt sofort) - das ist kein "vom Nutzer gebautes" Deck.
    const checkbox = queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox");
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    click(queryOne(root, ".deckbuilder-ai-quickstart-btn"));

    expect(store.getAppPhase()).toEqual({ kind: "playing" });
    expect(window.localStorage.getItem("deckbuilder1.lastDeck.player2")).toBeFalsy();
  });

  it("defekter localStorage (z.B. privater Modus) lässt den Deckbau nicht abstürzen", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    const setItemSpy = vi.spyOn(window.localStorage.__proto__, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError (simuliert)");
    });

    store.subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    expect(() => {
      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));
    }).not.toThrow();

    // Der eigentliche App-Flow (Deckbau -> nächster Spieler) funktioniert
    // trotzdem unbeeinträchtigt weiter - nur das Speichern schlägt (leise) fehl.
    expect(store.getAppPhase()).toEqual({ kind: "deckbuild", player: "player2", mode: "newGame" });

    setItemSpy.mockRestore();
  });
});
