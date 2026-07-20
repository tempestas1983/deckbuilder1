// @vitest-environment jsdom
/**
 * Dauerhafter End-to-End-UI-Test für den geführten Tutorial-Modus (v0.1.16,
 * s. docs/frontend-status.md) - Vorbild: golden-path.test.ts/vs-bot.test.ts
 * (echter App-Start, ausschließlich echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
 * erzeugte DOM, kein direkter store.dispatch()-Bypass für die geprüfte
 * Interaktion).
 *
 * Deckt den in docs/frontend-status.md (v0.1.16) beschriebenen Fluss ab
 * (seit dem "echtes Hauptmenü"-Umbau startet die App im Hauptmenü statt
 * direkt im Deckbau, "Tutorial" ist dort einer von drei Menüpunkten):
 * Hauptmenü -> "Tutorial" (überspringt Gegner-Auswahl UND den kompletten
 * Deckbau, inkl. Spieler-2-Screen) -> Partie läuft mit den festen Decks aus
 * tutorialDeck.ts + festem Seed,
 * Spieler 2 automatisch bot-gesteuert ("medium") -> geführte Schritt-Sequenz
 * läuft durch: Starthand/Mulligan-Hinweis -> Prioritäts-Konzept ->
 * Terrain spielen (Instruktion -> Aktion -> Bestätigung) -> Terrain für Mana
 * antippen (Instruktion -> Aktion -> Bestätigung) -> nächster Schritt
 * (Kreatur beschwören) erscheint -> das "?"-Hilfe-Panel zeigt alle Schritte
 * an, auch schon erledigte/noch ausstehende -> "Zurück zum Hauptmenü" führt
 * zurück zum normalen Deckbau-Screen.
 *
 * Da `startTutorial()` `createGame` mit einem FESTEN Seed aufruft (kein
 * `Math.random()`-Aufruf in diesem Pfad, anders als beim normalen
 * "Zufällig füllen"/Demo-Deck-Flow), ist dieser Test bereits ohne
 * Math.random()-Mocking deterministisch.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonWithText, click, queryAll, queryOne, tapUntappedPermanent } from "./testHelpers";

describe("Tutorial-Modus (v0.1.16)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "Startbildschirm -> Tutorial starten -> Schritt-Sequenz (Mulligan-Hinweis, Priorität, Terrain, Mana, nächster Schritt) -> Hilfe-Panel -> zurück zum Hauptmenü",
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
      const { TUTORIAL_STEPS, tutorialStepIndexOf } = await import("../tutorialContent");
      setBotMoveDelayMs(0);

      const root = document.createElement("div");
      document.body.append(root);
      // Wie main.ts: erst abonnieren, DANACH den ersten Render anstoßen.
      subscribe(() => render(root));
      render(root);

      // Startbildschirm = Hauptmenü - "Tutorial" ist einer der drei
      // Hauptmenü-Buttons (s. components/mainMenu.ts), seit dem "echtes
      // Hauptmenü"-Umbau nicht mehr ein Button im player1-Deckbau-Screen.
      expect(getAppPhase()).toEqual({ kind: "mainMenu" });
      const tutorialBtn = queryOne<HTMLButtonElement>(root, ".main-menu-tutorial-btn");
      expect(tutorialBtn.textContent).toContain("Tutorial");

      click(tutorialBtn);

      // Gegner-Auswahl UND der komplette Deckbau (beide Spieler) wurden
      // übersprungen - die Partie läuft direkt mit den festen
      // tutorialDeck.ts-Decks.
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

      const dismissModalBubble = (expectedTitle: string): void => {
        const bubble = queryOne(root, ".tutorial-tip-bubble");
        expect(bubble.querySelector(".tutorial-tip-title")?.textContent).toBe(expectedTitle);
        const dismissBtn = queryOne<HTMLButtonElement>(bubble, ".tutorial-tip-dismiss-btn");
        expect(dismissBtn.textContent).toBe("Weiter");
        click(dismissBtn);
      };

      // Schritt 0 ("mulliganIntro"): reiner Info-Schritt, direkt nach
      // Partiestart sichtbar - BEVOR überhaupt eine Mulligan-Entscheidung
      // getroffen wurde (detect ist trivial `true`, s. tutorialContent.ts).
      dismissModalBubble(TUTORIAL_STEPS[tutorialStepIndexOf("mulliganIntro")]!.instruction.title);

      // Direkt danach kann bereits eine automatische Bot-Kette laufen
      // (Spieler 1 beginnt im Tutorial zwar IMMER, s. store.ts#startTutorial,
      // aber Spieler 2s eigene Mulligan-Entscheidung läuft trotzdem sofort
      // automatisch über den Bot-Loop, sobald keine modale Bubble mehr
      // aussteht).
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

      // Schritt 1 ("priorityIntro"): spätestens jetzt (erstes echtes
      // Priority-Fenster der Partie) muss die Bubble erscheinen.
      dismissModalBubble(TUTORIAL_STEPS[tutorialStepIndexOf("priorityIntro")]!.instruction.title);
      await waitForBot();

      // Schritt 2 ("playTerrain"): nicht-modales Instruktions-Banner (KEINE
      // Bubble, blockiert nichts) mit hervorgehobener Terrain-Handkarte.
      const playTerrainStep = TUTORIAL_STEPS[tutorialStepIndexOf("playTerrain")]!;
      let banner = queryOne(root, ".tutorial-instruction-banner");
      expect(banner.querySelector(".tutorial-instruction-title")?.textContent).toBe(playTerrainStep.instruction.title);
      expect(root.querySelector(".tutorial-tip-bubble")).toBeFalsy();
      const terrainHandCard = queryAll<HTMLElement>(root, ".hand-card").find(
        (el) => el.querySelector(".hand-card-name")?.textContent === "Flammenkuppe",
      );
      expect(terrainHandCard?.classList.contains("tutorial-glow")).toBe(true);

      // Terrain sind nur in der eigenen Hauptphase spielbar (Timing) - das
      // erste Priority-Fenster der Partie ist Upkeep, nicht Main1: erst
      // durch die vorangehenden Schritte (Upkeep/Draw) passen, bis der
      // "Terrain legen"-Button tatsächlich erscheint.
      let mainPhaseGuard = 0;
      while (!buttonWithText(root, ".btn.btn-play", "Terrain legen") && mainPhaseGuard < 10) {
        click(queryOne<HTMLButtonElement>(root, ".btn-pass"));
        await waitForBot();
        mainPhaseGuard++;
      }
      expect(mainPhaseGuard).toBeLessThan(10);

      // Tatsächliche Aktion ausführen: Terrain spielen -> Bestätigung erscheint.
      click(buttonWithText(root, ".btn.btn-play", "Terrain legen"));
      dismissModalBubble(playTerrainStep.confirmation.title);
      await waitForBot();

      // Schritt 3 ("tapForMana"): Instruktions-Banner + hervorgehobenes
      // eigenes (ungetapptes) Terrain auf dem Spielfeld.
      const tapForManaStep = TUTORIAL_STEPS[tutorialStepIndexOf("tapForMana")]!;
      banner = queryOne(root, ".tutorial-instruction-banner");
      expect(banner.querySelector(".tutorial-instruction-title")?.textContent).toBe(tapForManaStep.instruction.title);
      const terrainTile = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile").find(
        (el) => el.querySelector(".card-tile-name")?.textContent === "Flammenkuppe",
      );
      expect(terrainTile?.classList.contains("tutorial-glow")).toBe(true);

      // Terrain antippen -> Mana im Pool -> Bestätigung erscheint.
      tapUntappedPermanent(root, "Flammenkuppe");
      dismissModalBubble(tapForManaStep.confirmation.title);
      await waitForBot();

      // Schritt 4 ("castCreature"): der NÄCHSTE Schritt erscheint tatsächlich
      // (Kern-Nachweis der Sequenz-Steuerung) - mit diesem Seed ist mit 1
      // verfügbarem Mana turn 1 noch keine Kreatur bezahlbar, das
      // Instruktions-Banner bleibt also (bewusst nicht-blockierend) sichtbar,
      // bis genug Mana/eine Kreatur verfügbar ist.
      const castCreatureStep = TUTORIAL_STEPS[tutorialStepIndexOf("castCreature")]!;
      banner = queryOne(root, ".tutorial-instruction-banner");
      expect(banner.querySelector(".tutorial-instruction-title")?.textContent).toBe(castCreatureStep.instruction.title);

      // Sicherheitsnetz "Schritt überspringen" ist jederzeit verfügbar (Auftrag:
      // kein kompletter Lockout) - rückt die Sequenz weiter, ohne die Aktion
      // tatsächlich ausgeführt zu haben.
      const skipBtn = queryOne<HTMLButtonElement>(banner, ".tutorial-skip-btn");
      expect(skipBtn.textContent).toBe("Schritt überspringen");
      click(skipBtn);
      const nextBanner = queryOne(root, ".tutorial-instruction-banner");
      expect(nextBanner.querySelector(".tutorial-instruction-title")?.textContent).toBe(
        TUTORIAL_STEPS[tutorialStepIndexOf("chooseTriggerTarget")]!.instruction.title,
      );

      // Das "?"-Hilfe-Panel bleibt jederzeit abrufbar (Auftrag Punkt 4) - auch
      // für schon erledigte UND noch nicht erreichte Schritte, unabhängig vom
      // aktuellen Spielstand/Sequenz-Fortschritt.
      const helpBtn = queryOne<HTMLButtonElement>(root, ".tutorial-help-btn");
      expect(root.querySelector(".tutorial-help-panel")).toBeFalsy();
      click(helpBtn);
      const helpPanel = queryOne(root, ".tutorial-help-panel");
      const entryTitles = queryAll(helpPanel, ".tutorial-help-entry-title").map((el) => el.textContent);
      expect(entryTitles).toEqual(TUTORIAL_STEPS.map((s) => s.instruction.title));
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
      expect(getAppPhase()).toEqual({ kind: "mainMenu" });
      expect(root.querySelector(".main-menu-screen")).toBeTruthy();
      expect(isTutorialActive()).toBe(false);
      expect(isBotControlled("player2")).toBe(false);

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
    30000,
  );
});
