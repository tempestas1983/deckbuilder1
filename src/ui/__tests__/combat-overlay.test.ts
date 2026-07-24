// @vitest-environment jsdom
/**
 * Fokussierte Blocker-Zuordnung (Spielerbericht 2026-07-24: "die Blocker zu
 * bestimmen ist richtig schwer ... die angreifende Schar in einem
 * hervorgehobenen Fenster, der Rest leicht ausgeblendet, und die Verteidiger
 * wirklich in Position ziehen"), s. components/combatOverlay.ts.
 *
 * Aufbau: die Kampfsituation wird mit der ECHTEN Engine hergestellt
 * (createGame + putOnBattlefield + declareAttackers wie in den Engine-Tests) -
 * nicht per Hand zusammengesteckter GameState und keine erfundene
 * Legalitäts-Tabelle. Die Ansicht bekommt damit genau die Kandidaten, die
 * getLegalActions im echten Spiel liefert; `blockLegalityFromActions` wird
 * gegen diese echten Kandidaten geprüft.
 *
 * Der Testpool (engine/__tests__/fixtures.ts) hat dafür genau die richtigen
 * Karten: ein Flieger (AIRBORNE_UNIT) greift an, am Boden steht ein Bär, der
 * ihn regelbedingt NICHT aufhalten kann - der häufigste Grund, warum ein Block
 * scheitert, und damit der wichtigste Fall für die Hervorhebung.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { GameState, InstanceId, RulesEngine } from "../../model";
import { createRulesEngine } from "../../engine/engine";
import { AIRBORNE_UNIT, BEAR, GUARDIAN_UNIT, buildTestPool, standardTestDecks } from "../../engine/__tests__/fixtures";
import {
  advanceToStep,
  applyOk,
  bothPass,
  makeNotSummoningSick,
  putOnBattlefield,
} from "../../engine/__tests__/test-helpers";
import { blockLegalityFromActions, combatOverlay } from "../components/combatOverlay";
import { click, queryAll, queryOne } from "./testHelpers";

const pool = buildTestPool();

/** Feuert ein Event, das kein `new Event(...)`-Sonderfall ist (jsdom kennt kein DragEvent). */
function fire(el: Element, type: string): void {
  el.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }));
}

/**
 * Baut eine echte Kampfsituation: `attackerDefs` greifen an, `defenderDefs`
 * stehen beim Verteidiger (player2) bereit. Liefert den State im
 * declareBlockers-Step plus die InstanceIds.
 */
function setupCombat(attackerDefs: string[], defenderDefs: string[]): {
  engine: RulesEngine;
  state: GameState;
  attackers: InstanceId[];
  defenders: InstanceId[];
} {
  const engine = createRulesEngine(pool);
  let { state } = engine.createGame({
    decks: standardTestDecks(),
    skipMulligans: true,
    seed: 20260724,
    startingPlayer: "player1",
  });

  const attackers = attackerDefs.map((defId) => {
    const id = putOnBattlefield(state, defId, "player1");
    makeNotSummoningSick(state, id);
    return id;
  });
  const defenders = defenderDefs.map((defId) => putOnBattlefield(state, defId, "player2"));

  state = advanceToStep(engine, state, "main1");
  state = bothPass(engine, state); // -> beginCombat
  state = bothPass(engine, state); // -> declareAttackers
  state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers });
  state = bothPass(engine, state); // -> declareBlockers
  expect(state.step).toBe("declareBlockers");

  return { engine, state, attackers, defenders };
}

describe("Blocker-Zuordnung: Legalität aus der Engine ablesen", () => {
  it("übernimmt die erlaubten Paare aus getLegalActions - ein Bodenkämpfer kann keinen Flieger aufhalten", () => {
    const { engine, state, attackers, defenders } = setupCombat([AIRBORNE_UNIT, BEAR], [BEAR]);
    const [flier, groundAttacker] = attackers as [InstanceId, InstanceId];
    const [groundBlocker] = defenders as [InstanceId];

    const legality = blockLegalityFromActions(engine.getLegalActions(state, "player2"));

    // Ohne guardian-Pflicht bietet die Engine "keine Blocker" an - und genau
    // dann ist ihre Paar-Liste vollständig (s. blockLegalityFromActions).
    expect(legality.noBlocksOffered).toBe(true);
    const allowed = legality.legalAttackersByBlocker.get(groundBlocker);
    expect(allowed?.has(groundAttacker)).toBe(true);
    expect(allowed?.has(flier)).toBe(false);
  });

  it("meldet bei guardian-Blockpflicht, dass 'keine Blocker' kein Ausweg ist", () => {
    const { engine, state } = setupCombat([BEAR], [GUARDIAN_UNIT]);

    const legality = blockLegalityFromActions(engine.getLegalActions(state, "player2"));
    expect(legality.noBlocksOffered).toBe(false);
  });
});

describe("Blocker-Zuordnung: fokussierte Ansicht (Spielerbericht 2026-07-24)", () => {
  let assigned: Array<{ blocker: InstanceId; attacker: InstanceId }>;
  let removed: InstanceId[];
  let selected: Array<InstanceId | undefined>;
  let confirmed: number;
  let noned: number;

  beforeEach(() => {
    document.body.innerHTML = "";
    assigned = [];
    removed = [];
    selected = [];
    confirmed = 0;
    noned = 0;
  });

  function renderOverlay(
    state: GameState,
    engine: RulesEngine,
    attackers: InstanceId[],
    defenders: InstanceId[],
    pairs: Array<{ blocker: InstanceId; attacker: InstanceId }> = [],
    selectedBlocker?: InstanceId,
  ): HTMLElement {
    const legality = blockLegalityFromActions(engine.getLegalActions(state, "player2"));
    const el = combatOverlay(state, pool, {
      attackers,
      defenders,
      pairs,
      selectedBlocker,
      legalAttackersByBlocker: legality.legalAttackersByBlocker,
      noBlocksOffered: legality.noBlocksOffered,
      onSelectBlocker: (b) => selected.push(b),
      onAssign: (blocker, attacker) => assigned.push({ blocker, attacker }),
      onRemove: (b) => removed.push(b),
      onConfirm: () => confirmed++,
      onNone: () => noned++,
    });
    document.body.append(el);
    return el;
  }

  const slotFor = (root: ParentNode, attacker: InstanceId) =>
    queryOne<HTMLElement>(root, `.combat-attacker-slot[data-attacker="${attacker}"]`);
  const defenderFor = (root: ParentNode, blocker: InstanceId) =>
    queryOne<HTMLElement>(root, `.combat-defender[data-blocker="${blocker}"]`);

  it("zeigt jeden Angreifer als eigenen Ablageplatz und die eigenen Einheiten darunter", () => {
    const { engine, state, attackers, defenders } = setupCombat([BEAR, AIRBORNE_UNIT], [BEAR, GUARDIAN_UNIT]);
    const root = renderOverlay(state, engine, attackers, defenders);

    expect(queryAll(root, ".combat-attacker-slot")).toHaveLength(2);
    expect(queryAll(root, ".combat-defender")).toHaveLength(2);
    // Ziehbar heißt ausdrücklich draggable="true" - ein leerer Attributwert
    // wäre ungültig und würde das Ziehen still abschalten.
    expect(queryAll(root, '.combat-defender[draggable="true"]').length).toBeGreaterThan(0);
    // Noch nichts zugeordnet -> jeder Platz sagt, wohin gezogen werden soll.
    expect(queryAll(root, ".combat-slot-empty")).toHaveLength(2);
    expect(root.querySelector(".combat-focus-sub")?.textContent).toContain("2 ungeblockt");
  });

  it("ein gezogener Verteidiger landet per Ablage beim Angreifer", () => {
    const { engine, state, attackers, defenders } = setupCombat([BEAR], [BEAR]);
    const [attacker] = attackers as [InstanceId];
    const [blocker] = defenders as [InstanceId];
    const root = renderOverlay(state, engine, attackers, defenders);

    fire(defenderFor(root, blocker), "dragstart");
    // Während des Ziehens ist der erlaubte Platz hervorgehoben.
    expect(slotFor(root, attacker).classList.contains("combat-slot-ok")).toBe(true);

    fire(slotFor(root, attacker), "drop");
    expect(assigned).toEqual([{ blocker, attacker }]);
  });

  it("verweigert die Ablage auf einem Angreifer, den dieser Verteidiger nicht aufhalten darf", () => {
    // Zwei Angreifer, damit der Bodenkämpfer überhaupt ziehbar ist (gegen den
    // Bären kann er blocken) - und trotzdem genau EIN Platz gesperrt bleibt.
    const { engine, state, attackers, defenders } = setupCombat([AIRBORNE_UNIT, BEAR], [BEAR]);
    const [flier, groundAttacker] = attackers as [InstanceId, InstanceId];
    const [groundBlocker] = defenders as [InstanceId];
    const root = renderOverlay(state, engine, attackers, defenders);

    fire(defenderFor(root, groundBlocker), "dragstart");
    expect(slotFor(root, groundAttacker).classList.contains("combat-slot-ok")).toBe(true);
    expect(slotFor(root, flier).classList.contains("combat-slot-blocked")).toBe(true);

    fire(slotFor(root, flier), "drop");
    expect(assigned).toEqual([]);

    // Derselbe Verteidiger auf dem erlaubten Platz funktioniert dagegen.
    fire(defenderFor(root, groundBlocker), "dragstart");
    fire(slotFor(root, groundAttacker), "drop");
    expect(assigned).toEqual([{ blocker: groundBlocker, attacker: groundAttacker }]);
  });

  it("der Klickweg bleibt erhalten: Verteidiger anklicken, dann Angreifer anklicken", () => {
    const { engine, state, attackers, defenders } = setupCombat([BEAR], [BEAR]);
    const [attacker] = attackers as [InstanceId];
    const [blocker] = defenders as [InstanceId];

    // Schritt 1: Verteidiger anklicken -> Vormerkung wird gemeldet.
    let root = renderOverlay(state, engine, attackers, defenders);
    click(defenderFor(root, blocker));
    expect(selected).toEqual([blocker]);

    // Schritt 2: mit Vormerkung ordnet ein Klick auf den Angreifer zu.
    document.body.innerHTML = "";
    root = renderOverlay(state, engine, attackers, defenders, [], blocker);
    expect(defenderFor(root, blocker).classList.contains("combat-defender-selected")).toBe(true);
    expect(slotFor(root, attacker).classList.contains("combat-slot-ok")).toBe(true);
    click(slotFor(root, attacker));
    expect(assigned).toEqual([{ blocker, attacker }]);
  });

  it("zeigt einen zugeordneten Blocker beim Angreifer und nimmt ihn per × wieder heraus", () => {
    const { engine, state, attackers, defenders } = setupCombat([BEAR], [BEAR]);
    const [attacker] = attackers as [InstanceId];
    const [blocker] = defenders as [InstanceId];
    const root = renderOverlay(state, engine, attackers, defenders, [{ blocker, attacker }]);

    const slot = slotFor(root, attacker);
    expect(slot.classList.contains("combat-attacker-slot-blocked")).toBe(true);
    expect(slot.querySelectorAll(".combat-assigned")).toHaveLength(1);
    expect(slot.querySelector(".combat-slot-empty")).toBeFalsy();
    // Der Verteidiger unten ist als "schon im Einsatz" markiert und nicht mehr ziehbar.
    expect(defenderFor(root, blocker).classList.contains("combat-defender-used")).toBe(true);
    expect(defenderFor(root, blocker).getAttribute("draggable")).toBe("false");

    click(queryOne(slot, ".combat-remove-btn"));
    expect(removed).toEqual([blocker]);
  });

  it("markiert einen Verteidiger, der laut Engine gar keinen Angreifer aufhalten kann", () => {
    const { engine, state, attackers, defenders } = setupCombat([AIRBORNE_UNIT], [BEAR]);
    const [groundBlocker] = defenders as [InstanceId];
    const root = renderOverlay(state, engine, attackers, defenders);

    const tile = defenderFor(root, groundBlocker);
    expect(tile.classList.contains("combat-defender-useless")).toBe(true);
    // Und ein Klick darauf merkt ihn gar nicht erst vor.
    click(tile);
    expect(selected).toEqual([]);
  });

  it("bietet 'Keine Blocker' nur an, wenn die Engine es auch anbietet (guardian-Pflicht)", () => {
    const frei = setupCombat([BEAR], [BEAR]);
    let root = renderOverlay(frei.state, frei.engine, frei.attackers, frei.defenders);
    click(queryOne(root, ".combat-none-btn"));
    expect(noned).toBe(1);
    expect(root.querySelector(".combat-focus-forced")).toBeFalsy();

    document.body.innerHTML = "";
    const pflicht = setupCombat([BEAR], [GUARDIAN_UNIT]);
    root = renderOverlay(pflicht.state, pflicht.engine, pflicht.attackers, pflicht.defenders);
    expect(root.querySelector(".combat-none-btn")).toBeFalsy();
    expect(root.querySelector(".combat-focus-forced")?.textContent).toContain("Wächter");
  });

  it("bestätigt die gesammelten Blocks", () => {
    const { engine, state, attackers, defenders } = setupCombat([BEAR], [BEAR]);
    const [attacker] = attackers as [InstanceId];
    const [blocker] = defenders as [InstanceId];
    const root = renderOverlay(state, engine, attackers, defenders, [{ blocker, attacker }]);

    const confirmBtn = queryOne<HTMLButtonElement>(root, ".combat-confirm-btn");
    expect(confirmBtn.textContent).toContain("1");
    click(confirmBtn);
    expect(confirmed).toBe(1);
  });
});
