// @vitest-environment jsdom
/**
 * Eingeklappter Terrain-Stapel auf dem Battlefield (Spielerbericht 2026-07-24:
 * "Terrain werden schnell zu viele und nehmen viel Platz weg ... ein
 * 'gestapelter' Terrain-Blick, der sich beim Anklicken zu den einzelnen
 * Terrain-Karten aufklappt, die man dann tappen kann").
 *
 * Zweigeteilt, weil die beiden Hälften ganz unterschiedlich teuer sind:
 *
 * 1. Die reine Aufbereitung (`manaColorsProduced`, `terrainPile`) wird direkt
 *    geprüft - ohne Partie, ohne Klickstrecke.
 * 2. Die Verdrahtung im Battlefield (Schwelle, Auf-/Zuklappen, Tappen danach)
 *    braucht eine echte Partie und läuft deshalb in EINEM Integrationstest,
 *    der die teure Vorbereitung nur einmal bezahlt.
 *
 * Der wichtigste Teil ist 2.: ein eingeklapptes Terrain ist nicht anklickbar,
 * also muss nachweisbar sein, dass man nach dem Aufklappen wirklich wieder ganz
 * normal Mana erzeugen kann - sonst hätte das Entrümpeln Spielfunktionen
 * gekostet.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import { manaColorsProduced } from "../cardInfo";
import { terrainPile, terrainPileCollapseHandle, type TerrainPileEntry } from "../components/terrainPile";
import {
  autoAdvanceToReadyMain1,
  buildDeckByClicking,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryAll,
  queryOne,
  registerCardName,
} from "./testHelpers";
import type { GameState } from "../../model";

const FLAME_RIDGE = "core.flame-ridge";
const TIDE_COVE = "core.tide-cove";
const CINDER_PUP = "core.cinder-pup";

registerCardName(FLAME_RIDGE, starterSet[FLAME_RIDGE]!.name);
registerCardName(CINDER_PUP, starterSet[CINDER_PUP]!.name);

const RIDGE_NAME = starterSet[FLAME_RIDGE]!.name;

/** Muss mit render.ts#TERRAIN_PILE_MIN übereinstimmen. */
const TERRAIN_PILE_MIN = 4;

function entry(definitionId: string, instanceId: string, tapped: boolean): TerrainPileEntry {
  return { instanceId, def: starterSet[definitionId]!, tapped };
}

describe("Terrain-Stapel: Aufbereitung", () => {
  it("manaColorsProduced liest die Farbe aus der Mana-Fähigkeit der Karte", () => {
    expect(manaColorsProduced(starterSet[FLAME_RIDGE]!)).toEqual(["flame"]);
    expect(manaColorsProduced(starterSet[TIDE_COVE]!)).toEqual(["tide"]);
    // Eine Einheit ohne Mana-Fähigkeit erzeugt keine Farben.
    expect(manaColorsProduced(starterSet[CINDER_PUP]!)).toEqual([]);
  });

  it("zeigt Gesamtzahl, ungetappte Anzahl und die noch verfügbaren Farben", () => {
    const pile = terrainPile(
      [
        entry(FLAME_RIDGE, "t1", false),
        entry(FLAME_RIDGE, "t2", false),
        entry(TIDE_COVE, "t3", false),
        entry(TIDE_COVE, "t4", true),
        entry(FLAME_RIDGE, "t5", true),
      ],
      { onToggle: () => undefined, own: true },
    );

    expect(pile.getAttribute("data-terrain-count")).toBe("5");
    expect(pile.getAttribute("data-terrain-untapped")).toBe("3");
    expect(pile.querySelector(".terrain-pile-count")?.textContent).toBe("5");
    expect(pile.querySelector(".terrain-pile-ready")?.textContent).toBe("3 bereit");

    // Pips zählen NUR die ungetappten (2x Flamme, 1x Flut) - getappte Terrains
    // sind diese Runde kein verfügbares Mana mehr.
    const pips = queryAll(pile, ".mana-pip").map((p) => [p.className, p.textContent]);
    expect(pips).toEqual([
      ["mana-pip mana-flame", "2"],
      ["mana-pip mana-tide", "1"],
    ]);
    expect(pile.classList.contains("terrain-pile-exhausted")).toBe(false);
  });

  it("markiert einen komplett getappten Stapel als erschöpft und zeigt keine Farb-Pips", () => {
    const pile = terrainPile([entry(FLAME_RIDGE, "t1", true), entry(TIDE_COVE, "t2", true)], {
      onToggle: () => undefined,
      own: true,
    });

    expect(pile.classList.contains("terrain-pile-exhausted")).toBe(true);
    expect(pile.querySelector(".terrain-pile-ready")?.textContent).toBe("alle getappt");
    expect(pile.querySelectorAll(".mana-pip")).toHaveLength(0);
  });

  it("meldet Klicks auf Stapel und Einklapp-Kachel", () => {
    let expanded = 0;
    const pile = terrainPile([entry(FLAME_RIDGE, "t1", false)], { onToggle: () => expanded++, own: true });
    click(pile);
    expect(expanded).toBe(1);

    let collapsed = 0;
    const handle = terrainPileCollapseHandle(4, () => collapsed++);
    expect(handle.classList.contains("terrain-pile-expanded")).toBe(true);
    click(handle);
    expect(collapsed).toBe(1);
  });
});

describe("Terrain-Stapel im Battlefield (Spielerbericht 2026-07-24)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "klappt ab der Schwelle ein, per Klick wieder auf - und danach lässt sich ganz normal für Mana tappen",
    async () => {
      vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(72420261));

      const { render } = await import("../render");
      const { getState, subscribe } = await import("../store");
      const root = document.createElement("div");
      document.body.append(root);

      subscribe(() => render(root));
      render(root);
      enterHotseatNewGame(root);

      // Reines Terrain-Deck: dieser Test castet nie etwas, braucht aber eine
      // eng kontrollierte Terrain-Anzahl. Ohne Einheiten hält der Autopilot
      // exakt bei `targetTerrainCount` an (eine Flammenkuppe ist bei 40 Kopien
      // immer in der Hand, die zweite Halte-Bedingung ist damit sofort erfüllt)
      // - mit einer Einheit als `protectedCardId` hinge das dagegen davon ab,
      // wann der Zufall sie zieht, und die Terrain-Reihe wäre bis dahin längst
      // über die Schwelle hinausgewachsen.
      buildDeckByClicking(root, { [FLAME_RIDGE]: 40 });
      click(queryOne(root, ".deckbuilder-confirm-btn"));
      click(queryOne(root, ".deckbuilder-copy-p1-btn"));
      click(queryOne(root, ".deckbuilder-confirm-btn"));
      keepAllMulligans(root);

      const terrainCount = (state: GameState) =>
        state.players.player1.battlefield.filter((id) => state.cards[id]?.definitionId === FLAME_RIDGE).length;
      const terrainTiles = () =>
        queryAll<HTMLElement>(root, ".battlefield-zone .card-tile").filter(
          (t) => t.querySelector(".card-tile-name")?.textContent === RIDGE_NAME,
        );

      // --- Unterhalb der Schwelle: ganz normale Einzelkacheln ---------------
      autoAdvanceToReadyMain1({
        root,
        getState,
        terrainId: FLAME_RIDGE,
        targetTerrainCount: 2,
        protectedCardId: FLAME_RIDGE,
        targetPlayer: "player1",
      });
      // Sichert die Aussagekraft der nächsten Zeile ab: wären hier schon
      // TERRAIN_PILE_MIN Terrains im Spiel, würde "kein Stapel" nichts beweisen.
      expect(terrainCount(getState())).toBeLessThan(TERRAIN_PILE_MIN);
      expect(root.querySelector(".terrain-pile")).toBeFalsy();
      expect(terrainTiles().length).toBe(terrainCount(getState()));

      // --- Ab der Schwelle: eine Stapel-Kachel statt N Einzelkacheln --------
      autoAdvanceToReadyMain1({
        root,
        getState,
        terrainId: FLAME_RIDGE,
        targetTerrainCount: TERRAIN_PILE_MIN,
        protectedCardId: FLAME_RIDGE,
        targetPlayer: "player1",
      });

      const total = terrainCount(getState());
      expect(total).toBeGreaterThanOrEqual(TERRAIN_PILE_MIN);

      const pile = queryOne<HTMLElement>(root, ".terrain-pile");
      expect(pile.getAttribute("data-terrain-count")).toBe(String(total));
      // Der eigentliche Zweck: die Einzelkacheln sind weg, der Platz ist frei.
      expect(terrainTiles()).toHaveLength(0);

      // --- Aufklappen -> Einzelkacheln zurück, Stapel wird zur Rückweg-Kachel
      click(pile);
      expect(terrainTiles()).toHaveLength(total);
      expect(root.querySelector(".terrain-pile-expanded")).toBeTruthy();

      // --- Und tappen funktioniert danach unverändert -----------------------
      const manaBefore = getState().players.player1.manaPool.flame ?? 0;
      const untapped = terrainTiles().filter((t) => t.classList.contains("targetable"));
      expect(untapped.length).toBeGreaterThan(0);
      click(untapped[0]!);
      expect(getState().players.player1.manaPool.flame ?? 0).toBe(manaBefore + 1);

      // --- Wieder einklappen ------------------------------------------------
      click(queryOne(root, ".terrain-pile-expanded"));
      expect(terrainTiles()).toHaveLength(0);
      const collapsedAgain = queryOne<HTMLElement>(root, ".terrain-pile");
      // Ein Terrain ist jetzt getappt - der Stapel sagt das, ohne dass man ihn
      // dafür aufklappen muss (sonst wäre das Einklappen ein Informationsverlust).
      expect(collapsedAgain.getAttribute("data-terrain-untapped")).toBe(String(total - 1));

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
    20000,
  );
});
