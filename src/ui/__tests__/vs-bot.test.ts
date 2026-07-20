// @vitest-environment jsdom
/**
 * Dauerhafter End-to-End-UI-Test für "Spieler 2 = KI" (v0.1.7): eine
 * komplette Partie Spieler 1 (echte Klicks) gegen Spieler 2 (automatisch via
 * src/ai/simpleBot.ts#chooseAction, angebunden über store.ts) von der
 * Deckbau-Umschaltung bis Spielende bzw. einem großzügigen Zug-/Iterations-
 * Limit - Vorbild: golden-path.test.ts/mulligan.test.ts (echter App-Start,
 * echte element.dispatchEvent(new Event("click"))-Aufrufe, kein direkter
 * store.dispatch()-Bypass für die geprüfte Interaktion).
 *
 * Deckt genau den in docs/frontend-status.md (v0.1.7) beschriebenen Fluss
 * ab: Deckbau Spieler 1 (normal) -> Deckbau-Screen Spieler 2: KI-Umschalter
 * aktivieren -> "Zufälliges KI-Deck + weiter" (überspringt den manuellen
 * Deckbau für Spieler 2 komplett, s. components/deckBuilder.ts) -> Partie
 * läuft: Spieler 1 klickt sich selbst durch (Mulligan behalten, Terrain
 * legen falls möglich, nie angreifen/blocken - bewusst simpel, der Fokus
 * dieses Tests ist die Bot-Anbindung, nicht Spieler-1-Taktik), während
 * store.ts für Spieler 2 automatisch chooseAction()+applyAction() aufruft,
 * sobald dieser an der Reihe ist (Priority, Mulligan, Combat-Deklaration,
 * Cleanup-Abwurf - alles inklusive, s. store.ts#actingPlayer).
 *
 * Timing: store.ts#setBotMoveDelayMs(0) schaltet die (im normalen Betrieb
 * absichtlich sichtbare, s. store.ts-Kommentar) Verzögerung zwischen
 * automatischen Bot-Zügen für den Test aus - die automatischen Züge laufen
 * TROTZDEM über echte setTimeout()-Ticks (kein Store-Bypass); der Test
 * wartet über store.ts#isBotThinking() (Polling per vi.waitFor) darauf, dass
 * ein angestoßener Bot-Zug-Zyklus abgeschlossen ist, bevor er den nächsten
 * menschlichen Klick auslöst.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonWithText, click, enterHotseatNewGame, makeSeededRandom, queryAll, queryOne, setChecked } from "./testHelpers";

describe("Gegen die KI spielen (v0.1.7, Spieler 2 = Bot)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    // Fester Seed: macht buildDemoDeck() (deck.ts) UND den per Math.random()
    // gezogenen Engine-Seed (store.ts#initGame) reproduzierbar - gleiches
    // Muster wie golden-path.test.ts/mulligan.test.ts.
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260709));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "Komplette Partie: Deckbau -> KI-Umschalter für Spieler 2 -> automatisches Bot-Spiel bis Spielende/Iterations-Limit, Spieler 1 ausschließlich über echte Klicks",
    async () => {
      const { render } = await import("../render");
      const { getState, isBotControlled, isBotThinking, setBotMoveDelayMs, subscribe } = await import("../store");
      setBotMoveDelayMs(0);

      const root = document.createElement("div");
      document.body.append(root);
      // Wie main.ts: erst abonnieren, DANACH den ersten Render anstoßen.
      subscribe(() => render(root));
      render(root);
      // Hauptmenü -> "Neues Spiel" -> "2 Spieler" (Hotseat): dieser Test prüft
      // bewusst den bestehenden, manuellen KI-Umschalter AUF dem
      // player2-Deckbau-Screen (statt der neuen Gegner-Auswahl VOR dem
      // Deckbau) - beide Wege setzen dieselbe store.ts-Bot-Steuerung.
      enterHotseatNewGame(root);

      // Spieler 1: ganz normaler manueller Deckbau (Zufällig füllen + Weiter) -
      // die KI-Umschaltung betrifft laut Auftrag ausschließlich Spieler 2.
      expect(root.querySelector(".deckbuilder-ai-toggle")).toBeFalsy(); // player1-Screen hat KEINEN KI-Umschalter
      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));

      // Spieler 2: KI-Umschalter aktivieren -> "Zufälliges KI-Deck + weiter".
      expect(root.querySelector(".deckbuilder-ai-toggle")).toBeTruthy();
      expect(root.querySelector(".deckbuilder-ai-quickstart-btn")).toBeFalsy(); // erst sichtbar NACH Aktivierung
      expect(isBotControlled("player2")).toBe(false);

      setChecked(queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox"), true);
      expect(isBotControlled("player2")).toBe(true);

      const quickstartBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-ai-quickstart-btn");
      click(quickstartBtn);

      // Partie läuft jetzt (initGame() wurde von confirmDeck() via
      // onAiQuickstart in render.ts ausgelöst) - der Deckbau-Screen für
      // Spieler 2 wurde komplett übersprungen.
      expect(root.querySelector(".deckbuilder-screen")).toBeFalsy();
      expect(queryOne(root, ".status-bar")).toBeTruthy();

      const waitForBot = async (): Promise<void> => {
        await vi.waitFor(
          () => {
            expect(isBotThinking()).toBe(false);
          },
          { timeout: 20000, interval: 5 },
        );
      };

      // Direkt nach initGame() kann bereits eine automatische Bot-Kette
      // laufen (z.B. wenn Spieler 2 zufällig Startspieler ist und zuerst
      // über seinen eigenen Mulligan entscheiden muss).
      await waitForBot();

      // Auftrag Punkt 4 (visuelle Kennzeichnung): Spieler-2-Panel zeigt
      // erkennbar ein "KI"-Badge, Spieler-1-Panel NICHT.
      expect(queryOne(root, '[data-player="player2"] .badge-bot').textContent).toBe("KI");
      expect(root.querySelector('[data-player="player1"] .badge-bot')).toBeFalsy();

      const MAX_ITERATIONS = 600;
      let iterations = 0;

      while (getState().winner === undefined && iterations < MAX_ITERATIONS) {
        iterations++;
        const state = getState();

        // 1) Mulligan-Entscheidung von Spieler 1 (Spieler 2 entscheidet
        // seine eigene Mulligan-Decision Bot-seitig automatisch, s.o. - kein
        // Klick dafür nötig).
        if (state.pendingDecision?.kind === "mulligan" && state.pendingDecision.player === "player1") {
          click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
          await waitForBot();
          continue;
        }

        // 2) Cleanup-Abwurf von Spieler 1: einfach die ersten `required`
        // Karten abwerfen (analog zu testHelpers.ts#autoAdvanceToReadyMain1,
        // hier inline, da keine "geschützte" Karte relevant ist - Spieler 1
        // spielt in diesem Test bewusst passiv, s. Modul-Kommentar oben).
        if (root.querySelector(".discard-toggle") && state.activePlayer === "player1") {
          const required = state.players.player1.hand.length - 7;
          const alreadySelected = queryAll(root, ".discard-toggle.selected").length;
          if (alreadySelected < required) {
            click(queryOne<HTMLElement>(root, ".discard-toggle:not(.selected)"));
            await waitForBot();
            continue;
          }
          const discardConfirm = buttonWithText(root, ".btn.btn-play", "Abwerfen bestätigen");
          if (discardConfirm && !discardConfirm.disabled) {
            click(discardConfirm);
            await waitForBot();
            continue;
          }
        }

        // 3) Terrain legen, falls möglich (echte, aber bewusst simple
        // Handlung für Spieler 1).
        const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
        if (terrainBtn) {
          click(terrainBtn);
          await waitForBot();
          continue;
        }

        // 4) Spieler 1 greift nie an/blockt nie (bewusst simpel - der Fokus
        // dieses Tests ist die Bot-Anbindung, nicht Spieler-1-Taktik).
        const noAttackers = buttonWithText(root, ".btn.btn-cancel", "Keine Angreifer");
        if (noAttackers) {
          click(noAttackers);
          await waitForBot();
          continue;
        }
        const noBlockers = buttonWithText(root, ".btn.btn-cancel", "Keine Blocker");
        if (noBlockers) {
          click(noBlockers);
          await waitForBot();
          continue;
        }

        // 5) Sonst: Priorität passen (immer sichtbar/verfügbar, s.
        // render.ts#statusBar, solange priorityPlayer gesetzt ist).
        const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
        if (passBtn) {
          click(passBtn);
          await waitForBot();
          continue;
        }

        throw new Error(
          `Unerwarteter Zustand ohne bekannten Spieler-1-Aktionsknopf: step=${state.step}, ` +
            `pendingDecision=${state.pendingDecision?.kind}, priorityPlayer=${state.priorityPlayer}`,
        );
      }

      // Entweder ist die Partie regulär beendet, oder das großzügige
      // Iterations-Limit wurde erreicht (Auftrag: "bis gameEnded oder ein
      // vernünftiges Zug-Limit") - in BEIDEN Fällen darf während der
      // gesamten Partie nie eine vom Bot ausgelöste Engine-Ablehnung
      // aufgetreten sein (s. store.ts#runBotStep, console.error-Zweig) und
      // keine sonstige Exception/console.error.
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(getState().turnNumber).toBeGreaterThan(1); // Partie ist tatsächlich vorangekommen, nicht sofort steckengeblieben

      if (getState().winner !== undefined) {
        expect(["player1", "player2", "draw"]).toContain(getState().winner);
      } else {
        expect(iterations).toBe(MAX_ITERATIONS);
      }
    },
    30000,
  );
});
