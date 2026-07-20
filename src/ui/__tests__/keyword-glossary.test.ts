// @vitest-environment jsdom
/**
 * Keyword-Glossar (v0.1.14, s. docs/frontend-status.md): Nutzer-Feedback -
 * Karten zeigen Schlüsselwörter im Regeltext (z.B. "Todesberührung." bei
 * `core.abyssal-lurker`), ohne dass irgendwo im UI nachschlagbar war, was das
 * bedeutet. Deckt beide Auftragsteile ab, jeweils über echte Klicks auf das
 * von `render()` erzeugte DOM (kein direkter store-Aufruf für das geprüfte
 * Verhalten selbst), exakt das Muster aus golden-path.test.ts:
 *
 * 1. In-Context-Hervorhebung + Klick-Popover im Kartentext (hier über den
 *    Deckbau-Pool geprüft, der denselben `ruleTextNodes`-Baustein wie
 *    Hand-/Battlefield-Karten verwendet, s. components/keywordText.ts).
 * 2. Globales, vom Tutorial-Modus unabhängiges Nachschlagewerk (alle 9
 *    Keywords), erreichbar über einen immer sichtbaren "? Schlüsselwörter"-
 *    Button - hier sowohl im Deckbau-Screen als auch (nach Spielstart) im
 *    Status-Header der laufenden Partie geprüft.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

function click(el: Element | null | undefined): void {
  if (!el) throw new Error("click(): Element nicht gefunden.");
  el.dispatchEvent(new Event("click", { bubbles: true }));
}

function queryOne<T extends Element = Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Element nicht gefunden: ${selector}`);
  return el;
}

describe("Keyword-Glossar (v0.1.14)", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  it("Deckbau-Pool: 'Todesberührung' im Regeltext von core.abyssal-lurker ist hervorgehoben, Hover-Tooltip + Klick-Popover zeigen die Erklärung", async () => {
    const { render } = await import("../render");
    const { subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root); // Hauptmenü (App-Startzustand)
    click(queryOne(root, ".main-menu-new-game-btn"));
    click(queryOne(root, ".opponent-select-hotseat-btn")); // -> Deckbau-Screen Spieler 1

    const row = queryOne(root, '[data-card-id="core.abyssal-lurker"]');
    const span = queryOne<HTMLElement>(row, ".keyword-highlight");
    expect(span.textContent).toBe("Todesberührung");
    // Natives title-Attribut = Hover-Tooltip (Auftrag Punkt 2, "einfachste robuste Lösung").
    expect(span.getAttribute("title")).toContain("reicht aus, um die getroffene Kreatur zu töten");
    // Der Rest des Regeltexts bleibt normaler, nicht hervorgehobener Text.
    expect(queryOne(row, ".card-frame-text").textContent).toBe("Todesberührung.");

    // Kein Popover offen, bevor geklickt wurde.
    expect(root.querySelector(".keyword-popover-bubble")).toBeFalsy();

    click(span);

    const bubble = queryOne(root, ".keyword-popover-bubble");
    expect(bubble.textContent).toContain("Todesberührung");
    expect(bubble.textContent).toContain("reicht aus, um die getroffene Kreatur zu töten");

    // Schließen über den eigenen "Schließen"-Button in der Sprechblase.
    click(queryOne(root, ".keyword-popover-close-btn"));
    expect(root.querySelector(".keyword-popover-bubble")).toBeFalsy();
  });

  it("Globales Nachschlagewerk: '? Schlüsselwörter'-Button ist schon im Deckbau UND in jeder laufenden Partie (auch außerhalb des Tutorials) erreichbar und listet alle 9 Keywords", async () => {
    const { render } = await import("../render");
    const { subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    click(queryOne(root, ".main-menu-new-game-btn"));
    click(queryOne(root, ".opponent-select-hotseat-btn")); // -> Deckbau-Screen Spieler 1

    // Schon im Deckbau-Screen erreichbar (Auftrag: Karten im Pool zeigen
    // dieselben Schlüsselwörter, die Verwirrung ist nicht auf die laufende
    // Partie beschränkt).
    const deckbuilderGlossaryBtn = queryOne<HTMLButtonElement>(root, '[data-testid="keyword-glossary-btn"]');
    click(deckbuilderGlossaryBtn);
    let panel = queryOne(root, '[data-testid="keyword-glossary-panel"]');
    const expectedTitles = [
      "Eile",
      "Flieger",
      "Reichweite",
      "Wachsam",
      "Lebensverbindung",
      "Wächter",
      "Trampelschaden",
      "Erststurm",
      "Todesberührung",
    ];
    for (const title of expectedTitles) {
      expect(panel.textContent).toContain(title);
    }
    expect(Array.from(root.querySelectorAll(".tutorial-help-entry")).length).toBe(9);

    // Schließen (Klick auf das Backdrop selbst, wie beim bestehenden
    // Tutorial-Hilfe-Panel).
    click(panel);
    expect(root.querySelector('[data-testid="keyword-glossary-panel"]')).toBeFalsy();

    // Zufällig füllen + Deck bestätigen (beide Spieler), um in die laufende
    // Partie zu kommen - der Button muss dort GENAUSO sichtbar sein, OHNE
    // dass ein Tutorial gestartet wurde (Kernpunkt des Auftrags: "nicht nur
    // im Tutorial-Modus").
    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    expect(root.querySelector(".deckbuilder-screen")).toBeFalsy();
    expect(root.querySelector(".status-bar")).toBeTruthy();

    const ingameGlossaryBtn = queryOne<HTMLButtonElement>(root, '[data-testid="keyword-glossary-btn"]');
    click(ingameGlossaryBtn);
    panel = queryOne(root, '[data-testid="keyword-glossary-panel"]');
    expect(panel.textContent).toContain("Todesberührung");
    expect(Array.from(root.querySelectorAll(".tutorial-help-entry")).length).toBe(9);
  });
});
