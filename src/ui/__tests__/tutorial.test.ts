// @vitest-environment jsdom
/**
 * Dauerhafter End-to-End-UI-Test für den geführten Tutorial-Modus (v0.1.11,
 * s. docs/frontend-status.md) - Vorbild: golden-path.test.ts/vs-bot.test.ts
 * (echter App-Start, ausschließlich echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
 * erzeugte DOM, kein direkter store.dispatch()-Bypass für die geprüfte
 * Interaktion).
 *
 * Deckt den in docs/frontend-status.md (v0.1.11) beschriebenen Fluss ab:
 * Startbildschirm (Deckbau-Screen Spieler 1) -> "Tutorial starten"
 * (überspringt den kompletten restlichen Deckbau, inkl. Spieler-2-Screen)
 * -> Partie läuft mit den festen Decks aus tutorialDeck.ts + festem Seed,
 * Spieler 2 automatisch bot-gesteuert ("medium") -> erste Tutorial-
 * Sprechblase erscheint (spätestens beim ersten Priority-Fenster) und lässt
 * sich wegklicken -> das "?"-Hilfe-Panel zeigt alle Tutorial-Texte an, auch
 * schon gesehene -> "Zurück zum Hauptmenü" führt zurück zum normalen
 * Deckbau-Screen.
 *
 * Da `startTutorial()` `createGame` mit einem FESTEN Seed aufruft (kein
 * `Math.random()`-Aufruf in diesem Pfad, anders als beim normalen
 * "Zufällig füllen"/Demo-Deck-Flow), ist dieser Test bereits ohne
 * Math.random()-Mocking deterministisch.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonWithText, click, queryAll, queryOne } from "./testHelpers";

describe("Tutorial-Modus (v0.1.11)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "Startbildschirm -> Tutorial starten -> erste Sprechblase erscheint und ist wegklickbar -> Hilfe-Panel zeigt alle Tipps -> zurück zum Hauptmenü",
    async () => {
      const { render } = await import("../render");
      const {
        getAppPhase,
        getBotDifficulty,
        getState,
        isBotControlled,
        isBotThinking,
        isTutorialActive,
        setBotMoveDelayMs,
        subscribe,
      } = await import("../store");
      const { tutorialTip, TUTORIAL_TIPS } = await import("../tutorialContent");
      setBotMoveDelayMs(0);

      const root = document.createElement("div");
      document.body.append(root);
      // Wie main.ts: erst abonnieren, DANACH den ersten Render anstoßen.
      subscribe(() => render(root));
      render(root);

      // Startbildschirm = Deckbau-Screen Spieler 1 - "Tutorial starten" ist
      // NUR hier sichtbar (nicht auf dem Spieler-2-Screen, s. deckBuilder.ts).
      expect(getAppPhase()).toEqual({ kind: "deckbuild", player: "player1" });
      const tutorialBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-tutorial-start-btn");
      expect(tutorialBtn.textContent).toBe("Tutorial starten");

      click(tutorialBtn);

      // Der komplette restliche Deckbau (auch Spieler 2) wurde übersprungen -
      // die Partie läuft direkt mit den festen tutorialDeck.ts-Decks.
      expect(getAppPhase()).toEqual({ kind: "playing" });
      expect(root.querySelector(".deckbuilder-screen")).toBeFalsy();
      expect(queryOne(root, ".status-bar")).toBeTruthy();
      expect(isTutorialActive()).toBe(true);

      // Spieler 2 ist automatisch bot-gesteuert, auf der ruhigen "medium"-Stufe
      // (Auftrag Punkt 2: NICHT "hard").
      expect(isBotControlled("player2")).toBe(true);
      expect(getBotDifficulty("player2")).toBe("medium");
      expect(isBotControlled("player1")).toBe(false);

      const waitForBot = async (): Promise<void> => {
        await vi.waitFor(
          () => {
            expect(isBotThinking()).toBe(false);
          },
          { timeout: 20000, interval: 5 },
        );
      };

      // Direkt nach dem Partiestart kann bereits eine automatische Bot-Kette
      // laufen (z.B. wenn Spieler 2 zufällig Startspieler ist und zuerst über
      // seine eigene Mulligan-Entscheidung entscheidet) - UND/ODER die erste
      // Tutorial-Sprechblase ("priority") kann direkt danach anstehen (der
      // Bot-Loop pausiert dafür automatisch, s. store.ts#scheduleBotStepIfNeeded).
      await waitForBot();

      // Spieler 1s eigene Mulligan-Entscheidung (falls nötig) über einen
      // echten Klick behalten - streng sequentiell wie von der Engine
      // vorgegeben (rules-engine.md 1b), Spieler 2s eigene Entscheidung läuft
      // bereits automatisch über den Bot-Loop (s.o.).
      let mulliganGuard = 0;
      while (
        getState().pendingDecision?.kind === "mulligan" &&
        getState().pendingDecision?.player === "player1" &&
        mulliganGuard < 10
      ) {
        click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
        await waitForBot();
        mulliganGuard++;
      }
      expect(mulliganGuard).toBeLessThan(10);

      // Spätestens jetzt (erstes echtes Priority-Fenster der Partie) muss die
      // erste Tutorial-Sprechblase ("Mana, Phasen & Priorität") sichtbar sein.
      const tipBubble = queryOne(root, ".tutorial-tip-bubble");
      expect(tipBubble.querySelector(".tutorial-tip-title")?.textContent).toBe(tutorialTip("priority").title);
      expect(tipBubble.querySelector(".tutorial-tip-body")?.textContent).toBe(tutorialTip("priority").body);

      // Sie ist wegklickbar ("Verstanden") und verschwindet danach.
      const dismissBtn = queryOne<HTMLButtonElement>(tipBubble, ".tutorial-tip-dismiss-btn");
      expect(dismissBtn.textContent).toBe("Verstanden");
      click(dismissBtn);
      expect(root.querySelector(".tutorial-tip-bubble")).toBeFalsy();
      await waitForBot(); // Bot-Loop läuft nach dem Wegklicken automatisch weiter.

      // Das "?"-Hilfe-Panel bleibt jederzeit abrufbar (Auftrag Punkt 4) - auch
      // für schon gesehene UND noch nicht aufgetretene Tipps, unabhängig vom
      // aktuellen Spielstand.
      const helpBtn = queryOne<HTMLButtonElement>(root, ".tutorial-help-btn");
      expect(root.querySelector(".tutorial-help-panel")).toBeFalsy();
      click(helpBtn);
      const helpPanel = queryOne(root, ".tutorial-help-panel");
      const entryTitles = queryAll(helpPanel, ".tutorial-help-entry-title").map((el) => el.textContent);
      expect(entryTitles).toEqual(TUTORIAL_TIPS.map((t) => t.title));
      click(queryOne(helpPanel, ".btn.btn-cancel"));
      expect(root.querySelector(".tutorial-help-panel")).toBeFalsy();

      // "Zurück zum Hauptmenü" (statt "Neues Spiel"-Beschriftung im
      // Tutorial-Modus) führt zurück zum normalen Deckbau UND beendet den
      // Tutorial-Modus/stellt Spieler 2s vorherige Bot-Einstellung wieder her
      // (hier: vorher nicht bot-gesteuert, s. Auftrag Punkt 5, "verändert die
      // normale Partie nicht").
      const backBtn = buttonWithText(root, ".btn.btn-cancel", "Zurück zum Hauptmenü");
      expect(backBtn).toBeTruthy();
      click(backBtn);
      expect(getAppPhase()).toEqual({ kind: "deckbuild", player: "player1" });
      expect(isTutorialActive()).toBe(false);
      expect(isBotControlled("player2")).toBe(false);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
    30000,
  );
});
