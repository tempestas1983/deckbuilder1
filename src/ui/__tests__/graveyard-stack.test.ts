// @vitest-environment jsdom
/**
 * Feature "Friedhof-Kachel-Stapel" (Spielerbericht: "Friedhof zeigt jede
 * Karte einzeln in voller Größe, verschwendet viel Platz für eine Zone, die
 * selten im Detail inspiziert wird", s. components/graveyardStack.ts):
 * - leerer Friedhof bleibt UNVERÄNDERT der bisherige Leer-Hinweis.
 * - nicht-leerer Friedhof zeigt nur noch EINE eingeklappte Stapel-Kachel
 *   (echtes Kartenbild der obersten/zuletzt hinzugekommenen Karte, s.
 *   Auftrag "Friedhof ist öffentliche Information") mit Zahl-Badge ab 2
 *   Karten - Klick öffnet ein Popover mit der vollständigen Liste, Schließen
 *   per "Schließen"-Button ODER per Klick auf den Hintergrund (identisches
 *   Muster wie keyword-glossary.test.ts für keywordGlossaryPanel).
 *
 * Nutzt den Cleanup-Zwangsabwurf (rules-engine.md 2, `discardToHandSize`) als
 * einfachsten Weg, um mehrere BEKANNTE Karten kontrolliert in den Friedhof zu
 * bringen (kein Kampf/Sterben nötig) - dieselbe Mechanik, die
 * testHelpers.ts#autoAdvanceToReadyMain1 im Cleanup ohnehin schon per echtem
 * Klick bedient.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import type { GameState, PlayerId } from "../../model";
import {
  buildDeckByClicking,
  buttonWithText,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryAll,
  queryOne,
  registerCardName,
} from "./testHelpers";

const VOID_RIFT = "core.void-rift"; // Terrain, tap: 1 Leere-Mana
const FLAME_RIDGE = "core.flame-ridge"; // Terrain, tap: 1 Flamme-Mana

registerCardName(VOID_RIFT, starterSet[VOID_RIFT]!.name);
registerCardName(FLAME_RIDGE, starterSet[FLAME_RIDGE]!.name);

/**
 * Bespoke-Autopilot: spielt NIE ein Terrain (bewusst, damit die Hand über
 * mehrere Züge hinweg über 7 Karten hinaus wächst und der Cleanup-
 * Zwangsabwurf mehrfach greift) - hält sonst wie
 * testHelpers.ts#autoAdvanceToReadyMain1 Mulligan/Combat/Cleanup/Priority am
 * Laufen, bis `player`s Friedhof mindestens `desiredCount` Karten enthält.
 */
function advanceUntilGraveyardHas(
  root: ParentNode,
  getState: () => GameState,
  player: PlayerId,
  desiredCount: number,
): void {
  const maxSteps = 800;
  for (let step = 0; step < maxSteps; step++) {
    const state = getState();
    if (state.winner !== undefined) throw new Error("advanceUntilGraveyardHas: Spiel ist vorzeitig beendet.");
    if (state.players[player].graveyard.length >= desiredCount) return;

    const mulliganKeep = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
    if (mulliganKeep) {
      click(mulliganKeep);
      continue;
    }

    if (root.querySelector(".discard-toggle")) {
      const required = state.players[state.activePlayer].hand.length - 7;
      const alreadySelected = queryAll(root, ".discard-toggle.selected").length;
      if (alreadySelected < required) {
        const nextToggle = queryAll<HTMLElement>(root, ".discard-toggle:not(.selected)")[0];
        if (nextToggle) {
          click(nextToggle);
          continue;
        }
      }
      const discardConfirm = buttonWithText(root, ".btn.btn-play", "Abwerfen bestätigen");
      if (discardConfirm && !discardConfirm.disabled) {
        click(discardConfirm);
        continue;
      }
    }

    const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
    if (passBtn) {
      click(passBtn);
      continue;
    }

    const spotlightSkipBtn = root.querySelector<HTMLButtonElement>(".decision-spotlight-skip-btn");
    if (spotlightSkipBtn) {
      click(spotlightSkipBtn);
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

    throw new Error(
      `advanceUntilGraveyardHas: unbekannter Zustand (step=${state.step}, priorityPlayer=${state.priorityPlayer}, pendingDecision=${state.pendingDecision?.kind})`,
    );
  }
  throw new Error("advanceUntilGraveyardHas: maxSteps erreicht - Zielzustand nicht erreicht.");
}

describe("Friedhof-Kachel-Stapel (components/graveyardStack.ts)", () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
  });

  it("leerer Friedhof zeigt weiterhin den unveränderten Leer-Hinweis (kein Stapel, kein Popover)", async () => {
    const { render } = await import("../render");
    const { subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    click(queryOne(root, ".deckbuilder-random-fill-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    expect(root.querySelectorAll(".graveyard-zone .empty-hint").length).toBeGreaterThan(0);
    expect(root.querySelector(".graveyard-stack")).toBeFalsy();
    expect(root.querySelector('[data-testid="graveyard-popover"]')).toBeFalsy();
  });

  it("Friedhof mit 2 Karten: eingeklappte Stapel-Kachel mit Zahl-Badge '2', Klick öffnet Popover mit beiden Karten, Schließen per Button UND per Backdrop-Klick", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(1234));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // 40 Karten: 2 Terrain-Sorten, damit der Friedhof am Ende zwei
    // UNTERSCHIEDLICHE Kartennamen enthalten kann (keine Kopie-Obergrenze
    // für Terrains).
    buildDeckByClicking(root, { [VOID_RIFT]: 20, [FLAME_RIDGE]: 20 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    const humanPlayer: PlayerId = "player1";
    advanceUntilGraveyardHas(root, getState, humanPlayer, 2);

    const state = getState();
    expect(state.players[humanPlayer].graveyard.length).toBeGreaterThanOrEqual(2);
    const topId = state.players[humanPlayer].graveyard[state.players[humanPlayer].graveyard.length - 1]!;
    const topName = starterSet[state.cards[topId]!.definitionId]!.name;
    const graveyardNames = state.players[humanPlayer].graveyard.map((id) => starterSet[state.cards[id]!.definitionId]!.name);

    // Eingeklappte Stapel-Kachel: genau EINE `.graveyard-stack`-Kachel für
    // player1s Friedhof, zeigt die oberste Karte + Zahl-Badge.
    const stackTiles = queryAll<HTMLElement>(root, ".graveyard-stack");
    expect(stackTiles.length).toBeGreaterThanOrEqual(1);
    const p1StackTile = stackTiles.find((el) => el.querySelector(".card-tile-name")?.textContent === topName)!;
    expect(p1StackTile).toBeTruthy();
    expect(p1StackTile.querySelector(".hand-card-hidden-stack-count")?.textContent).toBe(
      String(state.players[humanPlayer].graveyard.length),
    );
    // Nur EINE Kachel im Friedhof-Bereich (nicht mehr jede Karte einzeln).
    expect(queryAll(root, ".player-zone-block-graveyard .card-tile").length).toBeLessThanOrEqual(stackTiles.length);

    // Kein Popover offen, bevor geklickt wurde.
    expect(root.querySelector('[data-testid="graveyard-popover"]')).toBeFalsy();

    click(p1StackTile);

    const popover = queryOne(root, '[data-testid="graveyard-popover"]');
    for (const name of graveyardNames) {
      expect(popover.textContent).toContain(name);
    }
    const popoverCardTiles = queryAll(popover as ParentNode, ".graveyard-popover-grid .card-tile");
    expect(popoverCardTiles.length).toBe(state.players[humanPlayer].graveyard.length);

    // Schließen über den "Schließen"-Button im Popover.
    click(queryOne(root, ".graveyard-popover-panel button.btn-cancel"));
    expect(root.querySelector('[data-testid="graveyard-popover"]')).toBeFalsy();

    // Erneut öffnen, diesmal per Klick auf den Hintergrund (Backdrop)
    // schließen (identisches Dismiss-Muster wie keywordGlossaryPanel).
    click(queryAll<HTMLElement>(root, ".graveyard-stack").find((el) => el.querySelector(".card-tile-name")?.textContent === topName)!);
    const reopenedPopover = queryOne(root, '[data-testid="graveyard-popover"]');
    click(reopenedPopover);
    expect(root.querySelector('[data-testid="graveyard-popover"]')).toBeFalsy();
  });
});
