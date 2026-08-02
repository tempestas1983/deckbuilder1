// @vitest-environment jsdom
/**
 * "Mehr Juice" (Nutzer-Feedback 2026-08-02, "spürbarere visuelle Rückmeldung
 * bei Spielaktionen ... ausdrücklich MIT einem An/Aus-Toggle") - Tests für
 * `store.ts#isJuiceEnabled`/`toggleJuiceEnabled` (eigener An/Aus-Zustand,
 * exakt nach demselben Persistenz-Muster wie `isSfxEnabled`/`toggleSfxEnabled`)
 * UND dafür, dass der Toggle den tatsächlichen Effekt-Mechanismus
 * (`store.ts#applyJuiceForEvent`/`getJuicePlayerEffect`) wirklich gated,
 * nicht nur ein wirkungsloses Flag ist.
 *
 * Test 1 ist reiner State-/localStorage-Test (Default AN, Umschalten,
 * Persistenz über einen Modul-Reload hinweg - vgl. deck-persistence.test.ts).
 * Test 2 fährt über ECHTE Klicks eine reale Partie bis zu einem direkten
 * Schadenszauber ("Feuerstoß", core.fire-jolt: {flame} 1, Ziel Spieler/
 * Einheit, 2 Schaden) ins Gesicht des Gegners und prüft, dass daraufhin
 * `getJuicePlayerEffect("player2") === "hit"` UND die Spieler-Kachel die
 * `.juice-hit-shake`-Klasse trägt - Test 3 wiederholt denselben Ablauf mit
 * VORHER ausgeschaltetem Toggle und erwartet, dass trotz identischem
 * Schaden KEIN Effekt gesetzt wird (das eigentliche Spielgeschehen - der
 * Lebensverlust - bleibt davon unberührt, nur die Kosmetik entfällt).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import {
  buildDeckByClicking,
  buttonWithText,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryOne,
  registerCardName,
  tapUntappedPermanent,
} from "./testHelpers";

const FIRE_JOLT = "core.fire-jolt"; // {flame} 1, Ziel Einheit/Spieler, 2 Schaden
const FLAME_RIDGE = "core.flame-ridge"; // Terrain, tap: 1 Flamme-Mana

registerCardName(FIRE_JOLT, starterSet[FIRE_JOLT]!.name);
registerCardName(FLAME_RIDGE, starterSet[FLAME_RIDGE]!.name);

const RIDGE_NAME = starterSet[FLAME_RIDGE]!.name;
const JOLT_NAME = starterSet[FIRE_JOLT]!.name;

const EFFECTS_ENABLED_STORAGE_KEY = "deckbuilder1.effectsEnabled";

describe("Juice-Toggle (store.ts#isJuiceEnabled/toggleJuiceEnabled)", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    window.localStorage.clear();
  });

  it("startet standardmäßig AN, lässt sich umschalten und bleibt über einen Modul-Reload hinweg persistiert", async () => {
    const store = await import("../store");
    expect(store.isJuiceEnabled()).toBe(true);
    expect(window.localStorage.getItem(EFFECTS_ENABLED_STORAGE_KEY)).toBeNull();

    store.toggleJuiceEnabled();
    expect(store.isJuiceEnabled()).toBe(false);
    expect(window.localStorage.getItem(EFFECTS_ENABLED_STORAGE_KEY)).toBe("false");

    // Frischer Modul-Load (wie ein Seitenreload) - der zuvor gespeicherte
    // Wert muss übernommen werden, genau wie bei sfxEnabled/musicEnabled.
    vi.resetModules();
    const reloaded = await import("../store");
    expect(reloaded.isJuiceEnabled()).toBe(false);

    reloaded.toggleJuiceEnabled();
    expect(reloaded.isJuiceEnabled()).toBe(true);
    expect(window.localStorage.getItem(EFFECTS_ENABLED_STORAGE_KEY)).toBe("true");
  });

  it("der Status-Leisten-Button spiegelt den Zustand und schaltet ihn per echtem Klick um", async () => {
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);

    // Die Status-Leiste (inkl. Musik-/SFX-/Juice-Toggle) existiert nur
    // während einer laufenden Partie (render.ts#statusBar) - eine minimale
    // Hotseat-Partie reicht, der eigentliche Spielverlauf ist hier egal.
    enterHotseatNewGame(root);
    buildDeckByClicking(root, { [FIRE_JOLT]: 4, [FLAME_RIDGE]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    expect(store.getAppPhase()).toEqual({ kind: "playing" });

    const btn = () => queryOne<HTMLButtonElement>(root, '[data-testid="juice-toggle-btn"]');
    expect(btn().textContent).toBe("Effekte: An");

    click(btn());
    expect(btn().textContent).toBe("Effekte: Aus");
    expect(store.isJuiceEnabled()).toBe(false);
    expect(window.localStorage.getItem(EFFECTS_ENABLED_STORAGE_KEY)).toBe("false");

    click(btn());
    expect(btn().textContent).toBe("Effekte: An");
    expect(store.isJuiceEnabled()).toBe(true);
  });

  /**
   * Baut eine echte Hotseat-Partie bis zu dem Punkt auf, an dem player1
   * genau eine getappte Flammenkuppe (1 Flamme-Mana) UND Feuerstoß in der
   * Hand hat, castet Feuerstoß auf player2 (Ziel-Klick auf dessen Panel,
   * s. render.ts#playerArea) und passt Priorität, bis der Zauber auflöst und
   * player2 Leben verliert. Rein UI-Klick-getrieben, kein store.dispatch()-
   * Bypass - die eigentlich geprüfte Interaktion ist genau dieser Ablauf.
   */
  async function castFireJoltAtPlayer2() {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260802));
    const { render } = await import("../render");
    const store = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);
    store.subscribe(() => render(root));
    render(root);

    enterHotseatNewGame(root);
    buildDeckByClicking(root, { [FIRE_JOLT]: 4, [FLAME_RIDGE]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    // Bis player1 in Main1 Priority hat, mind. 1 Flammenkuppe kontrolliert
    // UND Feuerstoß in der Hand hat - reiner Autopilot (s. testHelpers.ts).
    for (let step = 0; step < 400; step++) {
      const state = store.getState();
      if (state.winner !== undefined) throw new Error("Partie vorzeitig beendet.");
      const ready =
        state.step === "main1" &&
        state.priorityPlayer === "player1" &&
        !state.pendingDecision &&
        state.players.player1.battlefield.some((id) => state.cards[id]?.definitionId === FLAME_RIDGE) &&
        state.players.player1.hand.some((id) => state.cards[id]?.definitionId === FIRE_JOLT);
      if (ready) break;

      const mulliganKeep = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
      if (mulliganKeep) {
        click(mulliganKeep);
        continue;
      }
      if (state.step === "main1" && state.priorityPlayer === "player1" && !state.pendingDecision) {
        const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
        if (terrainBtn) {
          click(terrainBtn);
          continue;
        }
      }
      if (root.querySelector(".discard-toggle")) {
        const required = state.players[state.activePlayer].hand.length - 7;
        const alreadySelected = root.querySelectorAll(".discard-toggle.selected").length;
        if (alreadySelected < required) {
          const toggle = root.querySelector<HTMLElement>(".discard-toggle:not(.selected)");
          if (toggle) {
            click(toggle);
            continue;
          }
        }
        const confirm = buttonWithText(root, ".btn.btn-play", "Abwerfen bestätigen");
        if (confirm && !confirm.disabled) {
          click(confirm);
          continue;
        }
      }
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      if (passBtn) {
        click(passBtn);
        continue;
      }
      const spotlightSkip = root.querySelector<HTMLButtonElement>(".decision-spotlight-skip-btn");
      if (spotlightSkip) {
        click(spotlightSkip);
        continue;
      }
      const noAttackers = buttonWithText(root, ".btn.btn-cancel", "Keine Angreifer");
      if (noAttackers) {
        click(noAttackers);
        continue;
      }
      const noBlockers = buttonWithText(root, ".btn.btn-cancel", "Keine Blocker");
      if (noBlockers) {
        click(noBlockers);
        continue;
      }
      throw new Error(`castFireJoltAtPlayer2: unbekannter Zustand (step=${state.step}, pending=${state.pendingDecision?.kind})`);
    }

    tapUntappedPermanent(root, RIDGE_NAME);

    const joltPlayBtn = Array.from(root.querySelectorAll<HTMLButtonElement>(".hand-card .btn.btn-play")).find(
      (b) => b.closest(".hand-card")?.querySelector(".hand-card-name")?.textContent === JOLT_NAME,
    );
    if (!joltPlayBtn) throw new Error("Feuerstoß-„Spielen“-Button nicht gefunden.");
    click(joltPlayBtn);

    // WICHTIG: den Lebenswert VOR dem Ziel-Klick lesen - beide Spieler haben
    // hier keine echte Priority-Wahl mehr übrig (store.ts#advanceAutomation),
    // der Zauber löst deshalb SYNCHRON im selben Klick auf (kein weiteres
    // Passen nötig).
    const initialLife = store.getState().players.player2.life;
    const player2Panel = queryOne<HTMLElement>(root, '.player-panel[data-player="player2"]');
    click(player2Panel);

    expect(store.getState().players.player2.life).toBeLessThan(initialLife);
    return { root, store };
  }

  it("Feuerstoß ins Gesicht löst bei eingeschalteten Effekten das Treffer-Zucken auf player2 aus", async () => {
    const { root, store } = await castFireJoltAtPlayer2();

    expect(store.getJuicePlayerEffect("player2")).toBe("hit");
    const player2Panel = queryOne<HTMLElement>(root, '.player-panel[data-player="player2"]');
    expect(player2Panel.classList.contains("juice-hit-shake")).toBe(true);
  });

  it("bei ausgeschalteten Effekten bleibt der Lebensverlust real, aber KEIN Treffer-Zucken erscheint", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260802));
    const early = await import("../store");
    early.toggleJuiceEnabled();
    expect(early.isJuiceEnabled()).toBe(false);

    const { root, store } = await castFireJoltAtPlayer2();
    expect(store.isJuiceEnabled()).toBe(false);

    expect(store.getJuicePlayerEffect("player2")).toBeUndefined();
    const player2Panel = queryOne<HTMLElement>(root, '.player-panel[data-player="player2"]');
    expect(player2Panel.classList.contains("juice-hit-shake")).toBe(false);
  });
});
