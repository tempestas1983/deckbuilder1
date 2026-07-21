// @vitest-environment jsdom
/**
 * Regressionstest für den Bugfix "Spieler wird nach Terrain-Legen automatisch
 * übersprungen, ohne je Mana tappen zu können" (s. docs/frontend-status.md,
 * Bugfix-Eintrag zu store.ts#hasRealPriorityChoice/isRealPriorityCandidate).
 *
 * Reproduziertes Szenario (vom Orchestrator live im Browser bestätigt):
 * Spieler hat ein bereits gelegtes, UNGETAPPTES Terrain UND eine mit leerem
 * Mana-Pool unbezahlbare, aber mit genug getapptem Mana bezahlbare Handkarte
 * ("Hohldämmerungs-Schrein", {2}{void}) - sonst keine andere Aktion außer
 * "Priorität passen" und dem Mana-Tap selbst. Vor dem Fix schloss
 * `isRealPriorityCandidate` reine Mana-Fähigkeiten UNBEDINGT von der
 * "echte Wahl"-Zählung aus, ohne zu prüfen, ob das dadurch erreichbare Mana
 * die Handkarte bezahlbar machen WÜRDE - `hasRealPriorityChoice` lieferte
 * `false`, `autoResolvableActionFor` passte automatisch, der Spieler kam nie
 * dazu, sein Terrain zu tappen oder die Karte zu casten.
 *
 * Deckt das Szenario über ECHTE Klicks/dispatch ab (kein direkter
 * `hasRealPriorityChoice`-Aufruf) - Vorbild: golden-path.test.ts/
 * x-cost-ability.test.ts, gleiches testHelpers.ts-Muster.
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

const HOLLOWDUSK_SHRINE = "core.hollowdusk-shrine"; // {2}{void}-Verzauberung, kein Ziel nötig
const VOID_RIFT = "core.void-rift"; // Terrain, tap: 1 Leere-Mana

registerCardName(HOLLOWDUSK_SHRINE, starterSet[HOLLOWDUSK_SHRINE]!.name);
registerCardName(VOID_RIFT, starterSet[VOID_RIFT]!.name);

describe("Priorität nach Terrain-Legen: kein Auto-Pass, solange getapptes Mana etwas bezahlbar machen würde (Bugfix)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("Terrain #3 legen (Landdrop verbraucht) -> Spieler behält Priorität, kann tappen und den Schrein anschließend casten", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(4711));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // Beide Spieler: 4x Schrein ({2}{void}) + 36x Leerenspalte (Terrain,
    // Leere-Mana) - exakt 40 Karten, gleiches Muster wie x-cost-ability.test.ts.
    buildDeckByClicking(root, { [HOLLOWDUSK_SHRINE]: 4, [VOID_RIFT]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    // Fest "player1": nur dessen Hand ist interaktiv (s. Kommentar in
    // x-cost-ability.test.ts). autoAdvanceToReadyMain1 ist turn-/
    // spielerreihenfolge-unabhängig (passt einfach, bis player1 dran ist).
    const humanPlayer = "player1";

    // Bewusst NUR 2 Terrains über den Autopilot vorbereiten (nicht 3, wie für
    // die vollen {2}{void}-Kosten nötig wären) - der DRITTE, entscheidende
    // Terrain-Klick unten wird manuell ausgelöst, damit dieser Test genau den
    // Moment direkt danach inspizieren kann (kein Rateergebnis über mehrere
    // vom Autopilot verschluckte Automatik-Schritte hinweg).
    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: VOID_RIFT,
      targetTerrainCount: 2,
      protectedCardId: HOLLOWDUSK_SHRINE,
      targetPlayer: humanPlayer,
    });

    let state = getState();
    expect(state.step).toBe("main1");
    expect(state.priorityPlayer).toBe(humanPlayer);
    expect(state.players[humanPlayer].battlefield.filter((id) => state.cards[id]?.definitionId === VOID_RIFT).length).toBe(
      2,
    );
    const poolBefore = state.players[humanPlayer].manaPool;
    expect(Object.values(poolBefore).every((n) => n === 0)).toBe(true);

    // DER entscheidende Klick: drittes Terrain legen. Bringt den Pool auf 3
    // ungetappte Quellen, der Mana-Pool bleibt dabei weiterhin LEER (Legen
    // tappt nichts) - exakt die reproduzierte Szenario-Vorbedingung.
    const battlefieldBefore = state.players[humanPlayer].battlefield.length;
    const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
    expect(terrainBtn).toBeTruthy();
    click(terrainBtn);

    // Bugfix-Kern: NACH diesem einen Klick (der store-intern synchron bis zur
    // nächsten echten Entscheidung automatisiert) MUSS player1 die Priorität
    // in main1 behalten - nicht automatisch übersprungen werden, nur weil der
    // Mana-Pool gerade leer ist und die einzigen "echten" Kandidaten reine
    // Mana-Fähigkeiten wären.
    state = getState();
    expect(state.step).toBe("main1");
    expect(state.priorityPlayer).toBe(humanPlayer);
    expect(state.stack.length).toBe(0);
    expect(state.players[humanPlayer].battlefield.length).toBe(battlefieldBefore + 1);
    expect(
      state.players[humanPlayer].battlefield.filter((id) => state.cards[id]?.definitionId === VOID_RIFT).length,
    ).toBe(3);
    expect(Object.values(state.players[humanPlayer].manaPool).every((n) => n === 0)).toBe(true);
    expect(state.players[humanPlayer].hand.some((id) => state.cards[id]?.definitionId === HOLLOWDUSK_SHRINE)).toBe(true);

    // Landdrop ist für diesen Zug verbraucht: kein weiterer "Terrain legen"-Button.
    expect(buttonWithText(root, ".btn.btn-play", "Terrain legen")).toBeUndefined();

    // Alle 3 Leerenspalten tappen (Mana-Fähigkeiten bleiben normal manuell
    // klickbar - nur ihr ALLEINIGES Vorhandensein zählte zuvor fälschlich als
    // "keine echte Wahl").
    const terrainName = starterSet[VOID_RIFT]!.name;
    for (let i = 0; i < 3; i++) tapUntappedPermanent(root, terrainName);

    state = getState();
    expect(state.priorityPlayer).toBe(humanPlayer); // Tappen selbst passt auch nicht automatisch weiter
    const poolAfterTap = state.players[humanPlayer].manaPool;
    expect(poolAfterTap.void + poolAfterTap.colorless).toBeGreaterThanOrEqual(3);

    // Jetzt ist der Schrein bezahlbar: "Spielen"-Button auf der Handkarte.
    const shrineName = starterSet[HOLLOWDUSK_SHRINE]!.name;
    const shrineHandCard = Array.from(root.querySelectorAll(".hand-card")).find(
      (el) => el.querySelector(".hand-card-name")?.textContent === shrineName,
    );
    expect(shrineHandCard).toBeTruthy();

    const castState = captureStateDuring(
      subscribe,
      getState,
      () => click(buttonWithText(shrineHandCard as HTMLElement, ".btn.btn-play", "Spielen")),
      (s) => s.stack.length === 1,
    );
    expect(castState).toBeDefined();

    while (getState().stack.length > 0) {
      const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
      if (!passBtn) break;
      click(passBtn);
    }

    state = getState();
    expect(state.stack.length).toBe(0);
    expect(
      state.players[humanPlayer].battlefield.some((id) => state.cards[id]?.definitionId === HOLLOWDUSK_SHRINE),
    ).toBe(true);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
