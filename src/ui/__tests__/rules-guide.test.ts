// @vitest-environment jsdom
/**
 * "Anleitung"-Panel (vierter Hauptmenü-Button, s. components/mainMenu.ts/
 * rulesGuidePanel.ts, store.ts#isRulesGuideOpen/toggleRulesGuide) - reiner
 * Lesestoff-Screen, KEIN eigener AppPhase-Screen, daher analog zu
 * keyword-glossary.test.ts/main-menu.test.ts geprüft: Hauptmenü bleibt die
 * ganze Zeit die aktive AppPhase, nur das Overlay-Panel öffnet/schließt.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { click, queryOne } from "./testHelpers";

describe('"Anleitung"-Panel im Hauptmenü', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    window.localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Hauptmenü -> Anleitung öffnet ein Panel mit allen vier Abschnitten (inkl. eingebettetem Schlüsselwörter-Glossar) und schließt sauber wieder", async () => {
    const { render } = await import("../render");
    const { getAppPhase, subscribe } = await import("../store");

    const root = document.createElement("div");
    document.body.append(root);
    subscribe(() => render(root));
    render(root);

    expect(getAppPhase()).toEqual({ kind: "mainMenu" });
    expect(root.querySelector('[data-testid="rules-guide-panel"]')).toBeFalsy();

    click(queryOne(root, '[data-testid="rules-guide-btn"]'));

    // Bewusst KEIN eigener AppPhase-Screen - das Hauptmenü bleibt darunter aktiv.
    expect(getAppPhase()).toEqual({ kind: "mainMenu" });
    const panel = queryOne(root, '[data-testid="rules-guide-panel"]');
    expect(panel).toBeTruthy();

    const body = queryOne(root, '[data-testid="rules-guide-body"]');
    const sectionTitles = Array.from(body.querySelectorAll(".rules-guide-section-title")).map((el) => el.textContent);
    expect(sectionTitles).toEqual(["Kartentypen", "Schlüsselwörter", "Tipps & Tricks - Spiel", "Tipps & Tricks - Deckbau"]);

    const sections = Array.from(body.querySelectorAll(".rules-guide-section"));
    const cardTypeSection = sections[0]!;
    const keywordSection = sections[1]!;

    // Kartentypen-Abschnitt (wortwörtlich aus docs/rules-engine.md übernommen).
    const entryTitles = Array.from(cardTypeSection.querySelectorAll(".tutorial-help-entry-title")).map(
      (el) => el.textContent,
    );
    expect(entryTitles).toEqual(["Einheiten", "Zauber", "Relikte", "Verzauberungen", "Terrains"]);

    // Schlüsselwörter-Abschnitt bindet dasselbe Glossar wie der eigenständige
    // "? Schlüsselwörter"-Button ein (s. keyword-glossary.test.ts) - alle 9
    // Einträge, hier eingebettet OHNE ein zweites Backdrop-Panel zu öffnen.
    expect(root.querySelector('[data-testid="keyword-glossary-panel"]')).toBeFalsy();
    const keywordTitles = Array.from(keywordSection.querySelectorAll(".tutorial-help-entry-title")).map(
      (el) => el.textContent,
    );
    expect(keywordTitles.length).toBe(9);

    // Tipps-Abschnitte als einfache Listen.
    const tips = Array.from(body.querySelectorAll(".rules-guide-tip")).map((el) => el.textContent);
    expect(tips.length).toBeGreaterThanOrEqual(8);
    expect(tips.some((t) => t?.includes("Wächter-Einheiten"))).toBe(true);
    expect(tips.some((t) => t?.includes("Mana-Kurve"))).toBe(true);

    // Schließen über den Backdrop-Klick (Klick INS Panel selbst propagiert
    // nicht weiter, s. rulesGuidePanel.ts) - gleiches Muster wie alle
    // übrigen `.tutorial-help-backdrop`-Panels in diesem Projekt.
    click(panel);
    expect(root.querySelector('[data-testid="rules-guide-panel"]')).toBeFalsy();
    expect(getAppPhase()).toEqual({ kind: "mainMenu" });

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
