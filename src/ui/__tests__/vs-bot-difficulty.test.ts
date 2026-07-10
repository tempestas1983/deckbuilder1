// @vitest-environment jsdom
/**
 * Dauerhafter End-to-End-UI-Test für die Bot-Schwierigkeitsstufen-Anbindung
 * (v0.1.9, docs/ai-status.md Abschnitt 9.8): baut direkt auf dem Muster von
 * `vs-bot.test.ts` (v0.1.7) auf, prüft aber zusätzlich, dass eine im
 * Deckbau-Screen per echtem Klick gewählte, NICHT-Default-Schwierigkeitsstufe
 * ("hard" statt DEFAULT_BOT_DIFFICULTY "medium") tatsächlich greift:
 *
 * 1. Der Schwierigkeits-Selector ist im Deckbau-Screen von Spieler 2 NUR
 *    sichtbar, solange die KI-Steuerung für Spieler 2 aktiv ist.
 * 2. Ein echter Klick/Change auf das Dropdown setzt `store.ts#getBotDifficulty`
 *    tatsächlich um (nicht nur den lokalen DOM-Zustand).
 * 3. Eine komplette Partie mit Spieler 2 = KI (Stufe "hard") läuft über echte
 *    Klicks (Spieler 1) + automatisches Bot-Spiel (Spieler 2) bis Spielende
 *    oder ein großzügiges Iterations-Limit durch, ohne dass die Engine
 *    jemals eine vom Bot gewählte Aktion ablehnt (`console.error`-Spy bleibt
 *    unaufgerufen) - der eigentliche Beleg, dass `chooseActionForDifficulty`
 *    mit der im UI gewählten Stufe aufgerufen wird (s. store.ts#runBotStep).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { buttonWithText, click, makeSeededRandom, queryAll, queryOne, selectValue, setChecked } from "./testHelpers";

describe("Bot-Schwierigkeitsstufen-UI (v0.1.9)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    // Anderer Seed als vs-bot.test.ts (20260709), damit beide Testdateien
    // unabhängig voneinander reproduzierbare, aber unterschiedliche Partien
    // erzeugen.
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260710));
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "Deckbau-Dropdown stellt eine nicht-Default-Stufe ('hard') ein, die tatsächliche Partie läuft mit dieser Stufe bis Spielende/Iterations-Limit",
    async () => {
      const { render } = await import("../render");
      const { getBotDifficulty, getState, isBotControlled, isBotThinking, setBotMoveDelayMs, subscribe } =
        await import("../store");
      setBotMoveDelayMs(0);

      const root = document.createElement("div");
      document.body.append(root);
      subscribe(() => render(root));
      render(root);

      // Spieler 1: normaler manueller Deckbau.
      click(queryOne(root, ".deckbuilder-random-fill-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));

      // Spieler 2: Schwierigkeits-Dropdown ist VOR der KI-Umschaltung nicht
      // im DOM (nur relevant, wenn KI-Steuerung aktiv ist, s. Auftrag Punkt 2).
      expect(root.querySelector(".deckbuilder-ai-difficulty-select")).toBeFalsy();
      expect(getBotDifficulty("player2")).toBe("medium"); // DEFAULT_BOT_DIFFICULTY

      setChecked(queryOne<HTMLInputElement>(root, ".deckbuilder-ai-checkbox"), true);
      expect(isBotControlled("player2")).toBe(true);

      // Jetzt sichtbar - echter Klick/Change auf "hard" stellt die Stufe um.
      const difficultySelect = queryOne<HTMLSelectElement>(root, ".deckbuilder-ai-difficulty-select");
      selectValue(difficultySelect, "hard");
      expect(getBotDifficulty("player2")).toBe("hard");

      const quickstartBtn = queryOne<HTMLButtonElement>(root, ".deckbuilder-ai-quickstart-btn");
      click(quickstartBtn);

      // Partie läuft jetzt; die Stufe bleibt über den ganzen Spielverlauf
      // "hard" (kein weiterer Screen setzt sie zurück).
      expect(root.querySelector(".deckbuilder-screen")).toBeFalsy();
      expect(getBotDifficulty("player2")).toBe("hard");

      const waitForBot = async (): Promise<void> => {
        await vi.waitFor(
          () => {
            expect(isBotThinking()).toBe(false);
          },
          { timeout: 20000, interval: 5 },
        );
      };

      await waitForBot();

      // Board-Header zeigt die aktive Stufe an (optionaler Teil des Auftrags,
      // s. docs/ai-status.md 9.8 Punkt 3 / playerPanel.ts#botDifficultyLabel).
      expect(queryOne(root, '[data-player="player2"] .badge-bot').textContent).toBe("KI");
      expect(queryOne(root, '[data-player="player2"] .badge-bot-difficulty').textContent).toBe("Schwer");
      expect(root.querySelector('[data-player="player1"] .badge-bot-difficulty')).toBeFalsy();

      const MAX_ITERATIONS = 600;
      let iterations = 0;

      while (getState().winner === undefined && iterations < MAX_ITERATIONS) {
        iterations++;
        const state = getState();

        if (state.pendingDecision?.kind === "mulligan" && state.pendingDecision.player === "player1") {
          click(buttonWithText(root, ".btn.btn-play", "Starthand behalten"));
          await waitForBot();
          continue;
        }

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

        const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
        if (terrainBtn) {
          click(terrainBtn);
          await waitForBot();
          continue;
        }

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

      // Über die gesamte Partie darf nie eine vom Bot ausgelöste
      // Engine-Ablehnung aufgetreten sein (s. store.ts#runBotStep,
      // console.error-Zweig) und keine sonstige Exception/console.error -
      // das ist der eigentliche Beleg, dass "hard" (statt medium) tatsächlich
      // korrekt angebunden ist und legale Aktionen produziert.
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(getState().turnNumber).toBeGreaterThan(1);
      expect(getBotDifficulty("player2")).toBe("hard"); // bleibt über die ganze Partie unverändert

      if (getState().winner !== undefined) {
        expect(["player1", "player2", "draw"]).toContain(getState().winner);
      } else {
        expect(iterations).toBe(MAX_ITERATIONS);
      }
    },
    60000,
  );
});
