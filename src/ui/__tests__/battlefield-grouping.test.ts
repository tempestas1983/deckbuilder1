// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für den Battlefield-Umbau (Nutzer-Auftrag "battlefield
 * sollte sortiert sein ... terrain nebeneinander und nach art sortiert ...
 * eine Verzauberung AUF einer Kreatur muss leicht darüber liegen",
 * render.ts#battlefieldZone):
 *
 * 1. Battlefield-Kacheln erscheinen nach Kartentyp gruppiert (Terrains vor
 *    Einheiten), nicht mehr in roher Spielreihenfolge.
 * 2. Eine an ein Ziel angelegte Aura erscheint NICHT als eigene Kachel in der
 *    Reihe, sondern als überlappende Mini-Kachel direkt bei ihrem Ziel
 *    (`.battlefield-slot`/`.battlefield-aura-badge`).
 * 3. Der Action-Glow ("zuletzt betroffene Karte", s. store.ts) landet auch
 *    dann noch auf der RICHTIGEN Kachel, wenn die Anzeige-Reihenfolge (durch
 *    1./2.) von der rohen `battlefield`-Array-Reihenfolge abweicht - das ist
 *    hier absichtlich der Fall: die zuletzt gelegte Terrain-Kachel landet im
 *    rohen Array HINTER der zwischenzeitlich gecasteten Einheit, wird aber
 *    in der Typ-Gruppierung VOR ihr angezeigt (Index != Anzeigeposition).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import {
  autoAdvanceToReadyMain1,
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

const LIGHT_ALTAR = "core.light-altar";
const SUN_ACOLYTE = "core.sun-acolyte"; // {generic:1, light:1} Unit, kein Cast-Ziel nötig
const BLESSING = "core.blessing-of-steadfastness"; // {generic:1, light:1} Aura, Ziel: eigene Unit

registerCardName(LIGHT_ALTAR, starterSet[LIGHT_ALTAR]!.name);
registerCardName(SUN_ACOLYTE, starterSet[SUN_ACOLYTE]!.name);
registerCardName(BLESSING, starterSet[BLESSING]!.name);

const LIGHT_ALTAR_NAME = starterSet[LIGHT_ALTAR]!.name;
const SUN_ACOLYTE_NAME = starterSet[SUN_ACOLYTE]!.name;
const BLESSING_NAME = starterSet[BLESSING]!.name;

function untappedTerrainTiles(root: ParentNode): HTMLElement[] {
  return queryAll<HTMLElement>(root, ".battlefield-zone .card-tile.targetable").filter(
    (t) => t.querySelector(".card-tile-name")?.textContent === LIGHT_ALTAR_NAME,
  );
}

function resolveStack(root: ParentNode, getState: () => import("../../model").GameState): void {
  while (getState().stack.length > 0) {
    const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
    if (!passBtn) break;
    click(passBtn);
  }
}

describe("Battlefield-Gruppierung + Aura-Overlay + Action-Glow (Nutzer-Auftrag, 2026-07-22)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it(
    "Terrains gruppiert vor Einheiten, Aura überlappend an ihrem Ziel, Action-Glow ID-korrekt trotz abweichender Anzeige-Reihenfolge",
    async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(2026722));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    buildDeckByClicking(root, { [SUN_ACOLYTE]: 4, [BLESSING]: 4, [LIGHT_ALTAR]: 32 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    const humanPlayer = "player1";

    // Phase 1: 2 Terrains + Einheit in der Hand -> Einheit casten (rohe
    // battlefield-Reihenfolge bisher: [terrain, terrain, unit]).
    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: LIGHT_ALTAR,
      targetTerrainCount: 2,
      protectedCardId: SUN_ACOLYTE,
      targetPlayer: humanPlayer,
    });

    let terrainTiles = untappedTerrainTiles(root);
    expect(terrainTiles.length).toBe(2);
    click(terrainTiles[0]!);
    click(untappedTerrainTiles(root)[0]!); // frisch requerien - DOM wurde neu gebaut

    const acolyteBtn = buttonWithText(root, ".btn.btn-play", "Spielen");
    expect(acolyteBtn).toBeTruthy();
    click(acolyteBtn);
    resolveStack(root, getState);

    expect(
      getState().players[humanPlayer].battlefield.some((id) => getState().cards[id]?.definitionId === SUN_ACOLYTE),
    ).toBe(true);

    // Phase 2: mindestens ein WEITERES Terrain (Auftrag: "es landet im rohen
    // Array HINTER der Einheit") + die Aura in der Hand -> Aura auf die
    // Einheit casten. Rohe battlefield-Reihenfolge danach z.B.
    // [terrain, terrain, unit, terrain(, ...), aura] - die Aura wird nach
    // Resolution aus der Anzeige-Reihenfolge herausgefiltert (s.
    // battlefieldZone), das zuletzt gelegte Terrain bleibt aber ROH hinter
    // der Einheit, während es in der TYP-GRUPPIERTEN Anzeige vor ihr steht.
    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: LIGHT_ALTAR,
      targetTerrainCount: 3,
      protectedCardId: BLESSING,
      targetPlayer: humanPlayer,
    });

    const rawIdsBeforeAura = getState().players[humanPlayer].battlefield;
    const acolyteInstanceId = rawIdsBeforeAura.find((id) => getState().cards[id]?.definitionId === SUN_ACOLYTE)!;
    const acolyteRawIndex = rawIdsBeforeAura.indexOf(acolyteInstanceId);
    // Kernvoraussetzung des Tests: mindestens ein Terrain wurde NACH der
    // Einheit ins rohe Array aufgenommen (sonst wäre die alte indexbasierte
    // Zuordnung zufällig noch richtig gewesen und der Test würde nichts beweisen).
    expect(rawIdsBeforeAura.length).toBeGreaterThan(acolyteRawIndex + 1);

    // Aura casten: NUR die ersten beiden (rohe Reihenfolge = Anzeige-
    // Reihenfolge innerhalb der Terrain-Gruppe) Terrains für Mana tappen -
    // das zuletzt gelegte Terrain bleibt für den Action-Glow-Nachweis unten
    // bewusst ungetappt.
    terrainTiles = untappedTerrainTiles(root);
    expect(terrainTiles.length).toBeGreaterThanOrEqual(3);
    click(terrainTiles[0]!);
    click(untappedTerrainTiles(root)[0]!);

    const blessingHandCard = queryAll<HTMLElement>(root, ".hand-card").find(
      (el) => el.querySelector(".hand-card-name")?.textContent === BLESSING_NAME,
    );
    expect(blessingHandCard).toBeTruthy();
    const targetBtn = buttonWithText(blessingHandCard as HTMLElement, ".btn.btn-play", "Spielen (Ziel wählen)");
    expect(targetBtn).toBeTruthy();
    click(targetBtn);

    // Ziel: die eigene Einheit auf dem Battlefield anklicken.
    const acolyteTile = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile.targetable").find(
      (t) => t.querySelector(".card-tile-name")?.textContent === SUN_ACOLYTE_NAME,
    );
    expect(acolyteTile).toBeTruthy();
    click(acolyteTile);
    resolveStack(root, getState);

    const stateAfterAura = getState();
    expect(stateAfterAura.cards[acolyteInstanceId]?.permanentState?.attachments.length).toBe(1);
    const auraInstanceId = stateAfterAura.cards[acolyteInstanceId]!.permanentState!.attachments[0]!;
    expect(stateAfterAura.cards[auraInstanceId]?.permanentState?.attachedTo).toBe(acolyteInstanceId);

    // --- 1. + 2. Grouping/Overlay-Nachweis ---------------------------------
    const battlefieldZoneEl = queryAll<HTMLElement>(root, ".battlefield-zone").find((z) => z.children.length > 0)!;
    expect(battlefieldZoneEl).toBeTruthy();

    const topLevelNames = Array.from(battlefieldZoneEl.children).map((child) => {
      const primaryTile = child.classList.contains("card-tile") ? child : child.querySelector(":scope > .card-tile");
      return primaryTile?.querySelector(".card-tile-name")?.textContent ?? null;
    });

    // Die Aura darf NIRGENDS als eigenständiger Top-Level-Eintrag auftauchen.
    expect(topLevelNames).not.toContain(BLESSING_NAME);
    // Genau eine Einheiten-Kachel, ganz am Ende (nach allen Terrains, s.
    // BATTLEFIELD_TYPE_ORDER).
    const acolyteTopLevelIndex = topLevelNames.indexOf(SUN_ACOLYTE_NAME);
    expect(acolyteTopLevelIndex).toBeGreaterThan(-1);
    expect(topLevelNames.slice(0, acolyteTopLevelIndex).every((n) => n === LIGHT_ALTAR_NAME)).toBe(true);
    expect(topLevelNames.slice(acolyteTopLevelIndex + 1)).toEqual([]);

    // Die Aura hängt als überlappende Mini-Kachel direkt am Slot der Einheit.
    const acolyteSlot = battlefieldZoneEl.children[acolyteTopLevelIndex] as HTMLElement;
    expect(acolyteSlot.classList.contains("battlefield-slot")).toBe(true);
    expect(acolyteSlot.classList.contains("battlefield-slot-has-aura")).toBe(true);
    const auraBadge = acolyteSlot.querySelector(".battlefield-aura-badge");
    expect(auraBadge).toBeTruthy();
    expect(auraBadge?.querySelector(".card-tile-name")?.textContent).toBe(BLESSING_NAME);

    // Insgesamt genau EIN Vorkommen der Aura im gesamten Battlefield-DOM.
    const allBlessingTiles = queryAll(battlefieldZoneEl, ".card-tile-name").filter(
      (el) => el.textContent === BLESSING_NAME,
    );
    expect(allBlessingTiles.length).toBe(1);

    // --- 3. Action-Glow-ID-Nachweis -----------------------------------------
    // Residuale Glow-Zustände aus den vorangegangenen Aktionen abklingen
    // lassen (RECENT_ACTION_GLOW_MS = 1200, store.ts), damit die folgende
    // Prüfung ausschließlich den GLEICH ausgelösten Tap zeigt.
    await new Promise((resolve) => setTimeout(resolve, 1400));

    // Zwei Terrains sind bereits diesen Zug für die Aura getappt (s.o.) -
    // "das zuletzt hinzugekommene, noch ungetappte" ist deshalb bewusst NICHT
    // zwingend das einzige getappte Terrain danach; entscheidend ist NUR, ob
    // genau DIESES Terrain (nicht irgendein anderes) das Glow bekommt.
    const allTerrainTilesBeforeTap = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile").filter(
      (t) => t.querySelector(".card-tile-name")?.textContent === LIGHT_ALTAR_NAME,
    );
    const tapTargetPosition = allTerrainTilesBeforeTap.length - 1; // letztes Terrain in Anzeige-Reihenfolge
    expect(allTerrainTilesBeforeTap[tapTargetPosition]!.classList.contains("targetable")).toBe(true);
    click(allTerrainTilesBeforeTap[tapTargetPosition]!);

    const terrainTilesAfterTap = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile").filter(
      (t) => t.querySelector(".card-tile-name")?.textContent === LIGHT_ALTAR_NAME,
    );
    expect(terrainTilesAfterTap.length).toBe(allTerrainTilesBeforeTap.length);
    const glowing = terrainTilesAfterTap.filter((t) => t.classList.contains("action-glow"));

    // Genau EIN Terrain leuchtet gerade auf, und zwar exakt dasjenige, das
    // eben angeklickt wurde (letzte Position in der Anzeige-Reihenfolge) -
    // das beweist die ID- statt indexbasierte Zuordnung: die alte
    // indexbasierte Fassung hätte hier (durch die Typ-Gruppierung/
    // Aura-Auslagerung, s.o., die den rohen battlefield-Index dieses
    // Terrains von der Anzeigeposition entkoppelt) fälschlich eine ANDERE
    // Kachel (die Einheit oder ein anderes Terrain) hervorgehoben.
    expect(glowing.length).toBe(1);
    expect(glowing[0]).toBe(terrainTilesAfterTap[tapTargetPosition]);
    expect(terrainTilesAfterTap[tapTargetPosition]!.classList.contains("tapped")).toBe(true);

    // Die Einheiten-Kachel selbst UND die Aura-Mini-Kachel dürfen davon
    // unberührt sein.
    const acolyteTileAfter = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile").find(
      (t) => t.querySelector(".card-tile-name")?.textContent === SUN_ACOLYTE_NAME,
    );
    expect(acolyteTileAfter?.classList.contains("action-glow")).toBe(false);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
    },
    // Höheres Timeout als der 5000ms-Default (Vitest): dieser Test wartet
    // absichtlich RECENT_ACTION_GLOW_MS (1200ms, store.ts) + Puffer ab, um
    // residuale Glow-Zustände aus vorangegangenen Aktionen abklingen zu
    // lassen, bevor der eigentliche Action-Glow-Nachweis geprüft wird -
    // zusätzlich zu den ohnehin mehrsekündigen Deck-/Turn-Vorbereitungs-
    // schritten braucht dieser Test spürbar mehr Luft als der Default.
    15000,
  );
});
