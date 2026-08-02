// @vitest-environment jsdom
/**
 * Dauerhafter UI-Test für "Weiter bis was passiert" (Nutzer-Feedback
 * 2026-08-02: "muss bei JEDEM Priority-Fenster einzeln passen, nur weil eine
 * Handkarte theoretisch castbar bleibt, die gerade gar nicht gespielt werden
 * soll" - s. store.ts#passUntilSomethingHappens/
 * shouldContinuePassingUntilSomethingHappens).
 *
 * Vorbedingung exakt wie in priority-mana-tap.test.ts (gleiches Deck/gleiche
 * Kartenauswahl, bewusst wiederverwendet statt eines neuen Szenarios): player1
 * hat 3 UNGETAPPTE Void-Rift-Terrains und den {2}{void}-Schrein in der Hand -
 * `hasRealPriorityChoice(player1)` ist DESHALB `true` (hypothetisch über
 * Mana-Tap castbar), obwohl der Mana-Pool gerade leer ist. Genau dieser
 * "theoretisch castbar, aber gerade nicht gewollt"-Fall ist der im Auftrag
 * beschriebene Root Cause: ohne den neuen Button müsste player1 in main1,
 * beginCombat, (declareAttackers/declareBlockers automatisch, da keine
 * Kreaturen im Spiel), combatDamage, endCombat JEWEILS einzeln manuell passen,
 * bevor er in main2 wieder etwas entscheiden kann.
 *
 * player2 hat im gesamten Test kein einziges Permanent im Spiel (der
 * Autopilot spielt für player2 nie Terrain, s. autoAdvanceToReadyMain1) -
 * player2 passt daher die ganze Partie über bereits automatisch (Auftrag Teil
 * 1, hasRealPriorityChoice(player2) === false), der Test bleibt dadurch
 * deterministisch ohne Bot-Timer/Hotseat-Klicks für player2.
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
  queryOne,
  registerCardName,
} from "./testHelpers";

const HOLLOWDUSK_SHRINE = "core.hollowdusk-shrine"; // {2}{void}-Verzauberung, kein Ziel nötig
const VOID_RIFT = "core.void-rift"; // Terrain, tap: 1 Leere-Mana

registerCardName(HOLLOWDUSK_SHRINE, starterSet[HOLLOWDUSK_SHRINE]!.name);
registerCardName(VOID_RIFT, starterSet[VOID_RIFT]!.name);

describe('"Weiter bis was passiert" - überspringt mehrere eigene Priority-Fenster bis zur eigenen nächsten Hauptphase', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("ein Klick springt von main1 (mit theoretisch castbarem Zauber) direkt zu main2 desselben Zuges, ohne etwas zu tappen/spielen", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(4711));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    buildDeckByClicking(root, { [HOLLOWDUSK_SHRINE]: 4, [VOID_RIFT]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    const humanPlayer = "player1";

    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: VOID_RIFT,
      targetTerrainCount: 2,
      protectedCardId: HOLLOWDUSK_SHRINE,
      targetPlayer: humanPlayer,
    });

    // Drittes Terrain legen (Landdrop verbraucht) - bringt player1 auf 3
    // ungetappte Quellen bei weiterhin leerem Mana-Pool, exakt die
    // Ausgangslage aus priority-mana-tap.test.ts.
    const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
    expect(terrainBtn).toBeTruthy();
    click(terrainBtn);

    let state = getState();
    const startTurnNumber = state.turnNumber;
    expect(state.step).toBe("main1");
    expect(state.priorityPlayer).toBe(humanPlayer);
    expect(state.stack.length).toBe(0);
    expect(
      state.players[humanPlayer].battlefield.filter((id) => state.cards[id]?.definitionId === VOID_RIFT).length,
    ).toBe(3);
    expect(Object.values(state.players[humanPlayer].manaPool).every((n) => n === 0)).toBe(true);
    const handBefore = [...state.players[humanPlayer].hand];

    // Spotlight-Banner zeigt BEIDE Buttons - der bestehende "Überspringen"
    // (einzelner Pass) bleibt unverändert vorhanden, s. Auftrag "kein Ersatz,
    // nur eine Ergänzung".
    expect(root.querySelector(".decision-spotlight-skip-btn")).toBeTruthy();
    const skipUntilBtn = root.querySelector<HTMLButtonElement>(".decision-spotlight-skip-until-btn");
    expect(skipUntilBtn).toBeTruthy();
    expect(skipUntilBtn!.disabled).toBe(false);

    // DER entscheidende Klick: statt main1/beginCombat/.../endCombat jeweils
    // einzeln manuell zu passen, läuft das jetzt synchron in einem Rutsch
    // durch (kein Bot im Spiel, s. Dateikommentar) - bis zur eigenen main2.
    click(skipUntilBtn!);

    state = getState();
    expect(state.turnNumber).toBe(startTurnNumber); // derselbe Zug, nicht etwa schon der nächste
    expect(state.step).toBe("main2");
    expect(state.activePlayer).toBe(humanPlayer);
    expect(state.priorityPlayer).toBe(humanPlayer); // hält GENAU hier wieder an, statt endlos weiterzupassen

    // Nichts wurde durch den automatischen Lauf selbst verändert: kein Mana
    // getappt, kein Zauber gecastet, kein Terrain zusätzlich gelegt.
    expect(state.stack.length).toBe(0);
    expect(Object.values(state.players[humanPlayer].manaPool).every((n) => n === 0)).toBe(true);
    expect(
      state.players[humanPlayer].battlefield.filter((id) => state.cards[id]?.definitionId === VOID_RIFT).length,
    ).toBe(3);
    expect(
      state.players[humanPlayer].battlefield.every((id) => state.cards[id]?.permanentState?.tapped !== true),
    ).toBe(true);
    expect(state.players[humanPlayer].hand).toEqual(handBefore);

    // In main2 zeigt sich exakt dieselbe "theoretisch castbar"-Situation
    // wieder (Spotlight-Banner erneut da, inkl. beider Buttons) - der Vorgang
    // war ein EINMALIGER Lauf, kein Dauer-Modus.
    expect(root.querySelector(".decision-spotlight-skip-until-btn")).toBeTruthy();

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
