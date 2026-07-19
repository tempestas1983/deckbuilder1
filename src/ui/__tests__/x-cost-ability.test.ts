// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für X-Kosten auf aktivierten Fähigkeiten (v0.1.6,
 * rules-engine.md 4 + Entscheidung 9.12 - bisher deckte der xInput/xTarget-
 * UI-Mechanismus laut docs/frontend-status.md NUR castSpell ab). Testkarte
 * laut Auftrag: `core.cinderwrack-engine` ("Sengende Kriegsmaschine",
 * Relikt mit `{X}, tap: X Schaden`-Fähigkeit).
 *
 * Deck-Aufbau + Mana-Vorbereitung über denselben generischen Klick-Autopilot
 * wie modal-effects.test.ts; die eigentlich geprüfte Interaktion (X eingeben
 * -> Ziel wählen) läuft ausschließlich über echte
 * `element.dispatchEvent(new Event("click"))`-Aufrufe.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import {
  autoAdvanceToReadyMain1,
  buildDeckByClicking,
  buttonWithText,
  captureStateDuring,
  click,
  keepAllMulligans,
  makeSeededRandom,
  queryOne,
  registerCardName,
  tapUntappedPermanent,
} from "./testHelpers";

const CINDERWRACK_ENGINE = "core.cinderwrack-engine";
const VOID_RIFT = "core.void-rift";

registerCardName(CINDERWRACK_ENGINE, starterSet[CINDERWRACK_ENGINE]!.name);
registerCardName(VOID_RIFT, starterSet[VOID_RIFT]!.name);

describe("X-Kosten-Fähigkeit aktivieren (v0.1.6)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("core.cinderwrack-engine: {X}-Fähigkeit aktivieren -> X eingeben -> Ziel wählen -> Stack zeigt chosenX/chosenTargets", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(555111));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);

    // Beide Spieler: 4x cinderwrack-engine ({generic:4}-Relikt) + 36x
    // void-rift (Terrains unbegrenzt) - Terrains zahlen generische Kosten
    // problemlos mit (mana.ts: generische Kosten sind farbunabhängig).
    buildDeckByClicking(root, { [CINDERWRACK_ENGINE]: 4, [VOID_RIFT]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    // Bewusst fest "player1" statt (vormals) `getState().activePlayer`: seit
    // "Gegner-Hand ist komplett sichtbar" (render.ts#handZone) zeigt die UI
    // NUR player1s Hand interaktiv an (jede andere Hand nur verdeckt/nicht
    // klickbar) - der `.hand-card`-Klick unten (Relikt "Spielen") würde bei
    // einem zufällig als player2 startenden Münzwurf ins Leere laufen.
    // `autoAdvanceToReadyMain1` ist ohnehin turn-/spielerunabhängig (spielt
    // einfach so viele eigene Züge des Zielspielers wie nötig durch), das
    // Testverhalten bleibt inhaltlich unverändert.
    const humanPlayer = "player1";
    const opponent = "player2";

    // Autopilot: 4 Terrains nötig, um {generic:4} für das Relikt zu bezahlen.
    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: VOID_RIFT,
      targetTerrainCount: 4,
      protectedCardId: CINDERWRACK_ENGINE,
      targetPlayer: humanPlayer,
    });

    const terrainName = starterSet[VOID_RIFT]!.name;
    for (let i = 0; i < 4; i++) tapUntappedPermanent(root, terrainName);

    const manaBefore = getState().players[humanPlayer].manaPool;
    expect(manaBefore.void + manaBefore.colorless).toBeGreaterThanOrEqual(4);

    // Relikt casten: keine Modi/X auf dem Spell selbst -> direkter "Spielen"-Button.
    const relicName = starterSet[CINDERWRACK_ENGINE]!.name;
    const relicHandCard = Array.from(root.querySelectorAll(".hand-card")).find(
      (el) => el.querySelector(".hand-card-name")?.textContent === relicName,
    );
    expect(relicHandCard).toBeTruthy();

    // Seit store.ts#advanceAutomation (Auftrag "automatisch passen, wenn's
    // keine echte Wahl gibt") kann dieser Klick SYNCHRON eine ganze Kette
    // auslösen: casten -> beide Spieler passen automatisch (in diesem
    // Testaufbau hat danach keiner von beiden irgendeine andere legale
    // Aktion) -> das Relikt landet SOFORT auf dem Battlefield, ohne dass
    // noch zwei manuelle "Priorität passen"-Klicks nötig wären.
    // `captureStateDuring` fängt trotzdem den Zwischenzustand (Spell auf dem
    // Stack) ab, BEVOR er automatisch wieder verschwindet.
    const castState = captureStateDuring(
      subscribe,
      getState,
      () => click(buttonWithText(relicHandCard as HTMLElement, ".btn.btn-play", "Spielen")),
      (s) => s.stack.length === 1,
    );
    expect(castState).toBeDefined();

    // Danach ggf. noch ausstehende "Priorität passen"-Klicks (falls doch
    // noch eine echte Wahl bestand) - tolerant statt starr auf "genau 2
    // Klicks", s.o.
    while (getState().stack.length > 0) {
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      if (!passBtn) break;
      click(passBtn);
    }

    let state = getState();
    expect(state.stack.length).toBe(0);
    expect(state.players[humanPlayer].battlefield.some((id) => state.cards[id]?.definitionId === CINDERWRACK_ENGINE)).toBe(
      true,
    );
    expect(state.step).toBe("main1");
    expect(state.priorityPlayer).toBe(humanPlayer);

    // Interaktion unter Test: getLegalActions liefert für X-Kosten-
    // Fähigkeiten laut Vertrag GAR KEINEN Kandidaten (docs/engine-status.md,
    // Entscheidung 9.12) - das Relikt-Tile muss trotzdem antippbar sein und
    // in die neue X-Eingabe-UI führen (analog zu X-Kosten-Spells in der Hand).
    // X=0: Das Casten des Relikts hat bereits alle 4 vorbereiteten Terrains
    // verbraucht ({generic:4}) - X=0 prüft exakt denselben UI-Mechanismus
    // (X eingeben -> Ziel wählen -> chosenX am Stack-Objekt), ohne dass für
    // die Aktivierung selbst weiteres Mana nötig wäre (nur die "tap"-
    // Zusatzkosten, die Summoning Sickness betrifft laut rules-engine.md 8
    // nur Units - das frisch gecastete Relikt darf sofort tappen).
    tapUntappedPermanent(root, relicName);
    expect(queryOne(root, ".x-input-panel").textContent).toContain(relicName);

    const xInput = queryOne<HTMLInputElement>(root, ".x-input");
    xInput.value = "0";
    xInput.dispatchEvent(new Event("input", { bubbles: true }));
    click(buttonWithText(root, ".x-input-panel .btn.btn-play", "Weiter"));

    // Die Fähigkeit hat targets: [{kind: "unitOrPlayer"}] -> nach X folgt Zielwahl.
    expect(queryOne(root, ".action-banner").textContent).toContain("X=0");

    const opponentLifeBefore = getState().players[opponent].life;
    const opponentPanel = queryOne(root, `.player-panel[data-player="${opponent}"]`);

    // s. Kommentar bei der Relikt-Cast-Stelle oben: derselbe Klick kann
    // dank automatischem Passen (Auftrag) synchron bis zur Resolution
    // durchlaufen - `captureStateDuring` sichert den Zwischenzustand
    // (aktivierte Fähigkeit MIT chosenX/chosenTargets auf dem Stack) ab.
    const activateState = captureStateDuring(
      subscribe,
      getState,
      () => click(opponentPanel),
      (s) => s.stack.length === 1 && s.stack[0]?.kind === "activatedAbility",
    );
    expect(activateState).toBeDefined();
    const stackObj = activateState!.stack[0]!;
    expect(stackObj.kind).toBe("activatedAbility");
    if (stackObj.kind === "activatedAbility") {
      expect(stackObj.chosenX).toBe(0);
      expect(stackObj.chosenTargets).toEqual([{ kind: "player", playerId: opponent }]);
    }

    // Danach ggf. noch ausstehende "Priorität passen"-Klicks (X=0 Schaden ist
    // laut rules-engine.md §6c/9.10 kein Schadensereignis - Leben bleibt
    // unverändert, aber Stack-/Ziel-/X-Wahl selbst sind oben bereits
    // verifiziert) - tolerant statt starr auf "genau 2 Klicks", s.o.
    while (getState().stack.length > 0) {
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      if (!passBtn) break;
      click(passBtn);
    }

    state = getState();
    expect(state.stack.length).toBe(0);
    expect(state.players[opponent].life).toBe(opponentLifeBefore);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
