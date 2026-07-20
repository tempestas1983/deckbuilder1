// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für modale Spells (v0.1.6, rules-engine.md 4 +
 * Entscheidung 9.13, atomarer Fall: chosenMode als Teil der castSpell-
 * Aktion). Testkarte laut Auftrag: `core.void-covenant` ("Bund der Leere",
 * 3 Modi, einer davon mit Zielslot `unitOrPlayer`).
 *
 * Deck-Aufbau + Mana-Vorbereitung laufen über einen generischen Klick-
 * "Autopilot" (testHelpers.ts#autoAdvanceToReadyMain1) statt vieler echter
 * Zug-für-Zug-Assertions - die eigentlich geprüfte Interaktion (Modus wählen
 * -> Ziel wählen -> Stack/Resolution) läuft ausschließlich über echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe, exakt das Muster aus
 * golden-path.test.ts.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import {
  autoAdvanceToReadyMain1,
  buildDeckByClicking,
  buttonWithText,
  captureStateDuring,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryOne,
  registerCardName,
  tapUntappedPermanent,
} from "./testHelpers";

const VOID_COVENANT = "core.void-covenant";
const VOID_RIFT = "core.void-rift";

registerCardName(VOID_COVENANT, starterSet[VOID_COVENANT]!.name);
registerCardName(VOID_RIFT, starterSet[VOID_RIFT]!.name);

describe("Modaler Spell casten (v0.1.6)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("core.void-covenant: Modus mit Zielslot wählen -> Ziel wählen -> Stack zeigt chosenMode/chosenTargets, Resolution fügt 2 Schaden zu", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260710));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // Beide Spieler: 4x void-covenant (Deckvalidierungs-Maximum für
    // Nicht-Terrains) + 36x void-rift (Terrains sind unbegrenzt) - reicht,
    // um {generic:2, void:1} zuverlässig bezahlen zu können, ohne dass
    // sonstige Kartenvielfalt die Testvorbereitung verlangsamt.
    buildDeckByClicking(root, { [VOID_COVENANT]: 4, [VOID_RIFT]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    // Bewusst fest "player1" statt (vormals) `getState().activePlayer`: seit
    // "Gegner-Hand ist komplett sichtbar" (render.ts#handZone) zeigt die UI
    // NUR player1s Hand interaktiv an (jede andere Hand nur verdeckt/nicht
    // klickbar) - der globale "Modus wählen"-Button-Klick unten würde bei
    // einem zufällig als player2 startenden Münzwurf nicht existieren.
    // `autoAdvanceToReadyMain1` ist ohnehin turn-/spielerunabhängig (spielt
    // einfach so viele eigene Züge des Zielspielers wie nötig durch), das
    // Testverhalten bleibt inhaltlich unverändert.
    const humanPlayer = "player1";
    const opponent = "player2";

    // Autopilot: passt Priority, spielt automatisch void-rift im eigenen
    // Main1, bis der aktive Spieler 3 Terrains kontrolliert UND
    // void-covenant in der Hand hat (Kosten {generic:2, void:1} = 3 Mana).
    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: VOID_RIFT,
      targetTerrainCount: 3,
      protectedCardId: VOID_COVENANT,
      targetPlayer: humanPlayer,
    });

    const terrainName = starterSet[VOID_RIFT]!.name;
    tapUntappedPermanent(root, terrainName);
    tapUntappedPermanent(root, terrainName);
    tapUntappedPermanent(root, terrainName);

    const manaPoolBefore = getState().players[humanPlayer].manaPool;
    expect(manaPoolBefore.void).toBeGreaterThanOrEqual(1);
    expect(manaPoolBefore.void + manaPoolBefore.colorless).toBeGreaterThanOrEqual(3);

    // Interaktion unter Test: "Modus wählen" (statt "Spielen", da
    // getLegalActions für modale Spells nur EINEN Kandidaten ohne
    // chosenMode liefert, docs/engine-status.md).
    const modeBtn = buttonWithText(root, ".btn.btn-play", "Modus wählen");
    expect(modeBtn).toBeTruthy();
    click(modeBtn);
    expect(queryOne(root, ".mode-select-panel").textContent).toContain("Bund der Leere");

    // Modus 0 hat laut Kartendefinition einen Zielslot (unitOrPlayer) -
    // Klick darauf muss in die Zielwahl-UI führen, NICHT direkt dispatchen.
    const modeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>(".mode-select-btn"));
    expect(modeButtons.length).toBe(3);
    expect(modeButtons[0]!.textContent).toContain("2 Schaden");
    click(modeButtons[0]!);

    expect(getState().stack.length).toBe(0); // noch nicht gecastet - Zielwahl steht noch aus
    const targetBanner = queryOne(root, ".action-banner");
    expect(targetBanner.textContent).toContain("Ziel wählen");

    const opponentLifeBefore = getState().players[opponent].life;

    // Ziel wählen: gegnerischer Spieler (Modus-Zielslot ist "unitOrPlayer",
    // ein Spieler ist ein legales Ziel dafür - kein Kreatur-Ziel nötig).
    const opponentPanel = queryOne(root, `.player-panel[data-player="${opponent}"]`);

    // Seit store.ts#advanceAutomation (Auftrag "automatisch passen, wenn's
    // keine echte Wahl gibt") kann dieser eine Klick SYNCHRON eine ganze
    // Kette auslösen: casten -> beide Spieler passen automatisch (in diesem
    // Testaufbau hat danach keiner von beiden irgendeine andere legale
    // Aktion) -> der Spell resolvt SOFORT, ohne dass noch zwei manuelle
    // "Priorität passen"-Klicks nötig wären. `captureStateDuring` fängt den
    // Zwischenzustand ab (Stack-Objekt MIT chosenMode/chosenTargets),
    // BEVOR er automatisch wieder verschwindet - das ist die eigentliche
    // Kernzusicherung dieses Tests (Stack-/Priority-Nachvollziehbarkeit).
    const castState = captureStateDuring(
      subscribe,
      getState,
      () => click(opponentPanel),
      (s) => s.stack.length === 1 && s.stack[0]?.kind === "spell",
    );
    expect(castState).toBeDefined();
    const stackObj = castState!.stack[0]!;
    expect(stackObj.kind).toBe("spell");
    if (stackObj.kind === "spell") {
      expect(stackObj.chosenMode).toBe(0);
      expect(stackObj.chosenTargets).toEqual([{ kind: "player", playerId: opponent }]);
    }

    // Danach ggf. noch ausstehende "Priorität passen"-Klicks (falls doch
    // noch eine echte Wahl bestand und der Automatik-Zyklus nicht bereits
    // vollständig durchgelaufen ist) - tolerant statt starr auf "genau 2
    // Klicks", s.o.
    while (getState().stack.length > 0) {
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      if (!passBtn) break;
      click(passBtn);
    }

    const state = getState();
    expect(state.stack.length).toBe(0);
    expect(state.players[opponent].life).toBe(opponentLifeBefore - 2);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
