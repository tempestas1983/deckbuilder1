// @vitest-environment jsdom
/**
 * Kampfbericht nach jedem Kampf (Nutzer-Feedback 2026-07-25: "wir brauchen
 * nach jedem Kampf eine kurze Übersicht, was passiert ist"), s.
 * combatSummary.ts + components/combatSummaryPanel.ts.
 *
 * Die Mitschrift wird gegen einen ECHTEN Event-Strom geprüft: eine echte
 * Partie wird mit der echten Engine bis durch den Kampf gefahren (wie in den
 * Engine-Tests), und jedes dabei anfallende GameEvent geht durch denselben
 * `record()`-Aufruf, den store.ts#processEvents im laufenden Spiel benutzt.
 * Ein handgebauter Ereignisstrom würde genau den interessanten Teil verfehlen -
 * nämlich ob die Engine die Ereignisse überhaupt so, mit diesen Feldern und in
 * dieser Reihenfolge liefert.
 *
 * Der Testpool (engine/__tests__/fixtures.ts) liefert die Fälle: ein Bär (2/2)
 * gegen einen Bären ist beidseitig tödlich, ein Flieger kommt an einem
 * Bodenblocker vorbei.
 */

import { beforeEach, describe, expect, it } from "vitest";
import type { GameState, InstanceId, PlayerAction, PlayerId, RulesEngine } from "../../model";
import { createRulesEngine } from "../../engine/engine";
import { AIRBORNE_UNIT, BEAR, buildTestPool, standardTestDecks } from "../../engine/__tests__/fixtures";
import { advanceToStep, bothPass, makeNotSummoningSick, putOnBattlefield } from "../../engine/__tests__/test-helpers";
import { createCombatSummaryTracker, type CombatSummary, type CombatSummaryTracker } from "../combatSummary";
import { combatSummaryPanel } from "../components/combatSummaryPanel";
import { click, queryAll, queryOne } from "./testHelpers";

const pool = buildTestPool();

/**
 * Fährt eine echte Partie durch einen kompletten Kampf und schreibt dabei
 * jeden Event-Batch mit - exakt wie store.ts#processEvents. Der Tracker wird
 * hier mit denselben Nachschlage-Funktionen versorgt wie im Store, nur gegen
 * den lokal fortgeschriebenen State.
 */
function runCombat(attackerDefs: string[], blockerDefs: string[], assignBlocks: boolean): CombatSummary | undefined {
  const engine: RulesEngine = createRulesEngine(pool);
  let state: GameState = engine.createGame({
    decks: standardTestDecks(),
    skipMulligans: true,
    seed: 20260725,
    startingPlayer: "player1",
  }).state;

  const tracker: CombatSummaryTracker = createCombatSummaryTracker({
    nameOf: (id) => pool[state.cards[id]!.definitionId]!.name,
    controllerOf: (id) => state.cards[id]?.controller,
    activePlayer: () => state.activePlayer,
    turnNumber: () => state.turnNumber,
  });

  const attackers = attackerDefs.map((defId) => {
    const id = putOnBattlefield(state, defId, "player1");
    makeNotSummoningSick(state, id);
    return id;
  });
  const blockers = blockerDefs.map((defId) => putOnBattlefield(state, defId, "player2"));

  // Vorlauf bis zum Kampf ist nicht Gegenstand des Tests - die Mitschrift
  // beginnt ohnehin erst bei attackersDeclared.
  state = advanceToStep(engine, state, "main1");
  state = bothPass(engine, state);
  state = bothPass(engine, state);
  expect(state.step).toBe("declareAttackers");

  const apply = (action: PlayerAction): void => {
    const result = engine.applyAction(state, action);
    if (result.error) throw new Error(`Unerwarteter Fehler: ${result.error} (${JSON.stringify(action)})`);
    // Reihenfolge wie im Store: erst den neuen State setzen, dann die Events
    // mitschreiben (nameOf/controllerOf lesen den aktuellen State).
    state = result.state;
    for (const e of result.events) tracker.record(e);
  };

  apply({ kind: "declareAttackers", player: "player1", attackers });
  while (state.priorityPlayer !== undefined) apply({ kind: "passPriority", player: state.priorityPlayer });
  expect(state.step).toBe("declareBlockers");

  const blocks = assignBlocks
    ? blockers.map((blocker, i) => ({ blocker, attacker: attackers[Math.min(i, attackers.length - 1)]! }))
    : [];
  apply({ kind: "declareBlockers", player: "player2", blocks });

  // Weiter bis aus dem Kampf heraus - der Bericht wird beim ersten
  // Nicht-Kampf-Step finalisiert (s. combatSummary.ts#COMBAT_STEPS).
  let guard = 0;
  while (state.step !== "main2" && state.winner === undefined && guard++ < 40) {
    if (state.pendingDecision?.kind === "orderBlockers") {
      const decision = state.pendingDecision;
      apply({
        kind: "resolveDecision",
        player: decision.player,
        choice: {
          kind: "orderBlockers",
          orders: decision.attackers.map((a) => ({ attacker: a.attacker, blockers: [...a.blockers] })),
        },
      });
      continue;
    }
    if (state.priorityPlayer !== undefined) {
      apply({ kind: "passPriority", player: state.priorityPlayer });
      continue;
    }
    throw new Error(`Feststecken bei step=${state.step}, pending=${state.pendingDecision?.kind}`);
  }

  return tracker.completed();
}

describe("Kampfbericht: Mitschrift aus echten Engine-Events", () => {
  it("hält fest, wer durchkam, wie viel Schaden ankam und wer gefallen ist", () => {
    // Zwei Angreifer, EIN Blocker: der Bär wird geblockt (2/2 gegen 2/2 ist
    // beidseitig tödlich), der Flieger kommt vorbei und macht Schaden.
    const summary = runCombat([BEAR, AIRBORNE_UNIT], [BEAR], true);

    expect(summary).toBeDefined();
    expect(summary!.attackingPlayer).toBe("player1");
    expect(summary!.defendingPlayer).toBe("player2");

    const bear = summary!.attackers[0]!;
    expect(bear.blockers).toHaveLength(1);
    expect(bear.damageToDefendingPlayer).toBe(0);

    const flier = summary!.attackers[1]!;
    expect(flier.blockers).toEqual([]);
    expect(flier.damageToDefendingPlayer).toBeGreaterThan(0);
    expect(summary!.damageToDefendingPlayer).toBe(flier.damageToDefendingPlayer);

    // Beide Bären sterben - und zwar je einer pro Seite.
    expect(summary!.casualties).toHaveLength(2);
    expect(summary!.casualties.map((c) => c.controller).sort()).toEqual(["player1", "player2"]);
  });

  it("ohne Blocker kommt alles durch und niemand stirbt", () => {
    const summary = runCombat([BEAR], [BEAR], false);

    expect(summary).toBeDefined();
    expect(summary!.attackers[0]!.blockers).toEqual([]);
    expect(summary!.damageToDefendingPlayer).toBeGreaterThan(0);
    expect(summary!.casualties).toEqual([]);
  });
});

describe("Kampfbericht: Mitschrift-Randfälle", () => {
  const ctx = {
    nameOf: (id: InstanceId) => `Karte-${id}`,
    controllerOf: () => "player1" as PlayerId,
    activePlayer: () => "player1" as PlayerId,
    turnNumber: () => 4,
  };

  it("ein Kampf ohne Angreifer erzeugt gar keinen Bericht", () => {
    const tracker = createCombatSummaryTracker(ctx);
    tracker.record({ kind: "attackersDeclared", attackers: [] });
    tracker.record({ kind: "stepBegan", step: "main2" });
    expect(tracker.completed()).toBeUndefined();
  });

  it("erst der Step NACH dem Kampf schließt den Bericht ab", () => {
    const tracker = createCombatSummaryTracker(ctx);
    tracker.record({ kind: "attackersDeclared", attackers: ["card1"] });
    // Solange der Kampf läuft, gibt es noch nichts zu lesen.
    tracker.record({ kind: "stepBegan", step: "declareBlockers" });
    tracker.record({ kind: "stepBegan", step: "combatDamage" });
    tracker.record({ kind: "stepBegan", step: "endCombat" });
    expect(tracker.completed()).toBeUndefined();

    tracker.record({ kind: "stepBegan", step: "main2" });
    expect(tracker.completed()?.attackers.map((a) => a.name)).toEqual(["Karte-card1"]);
  });

  it("ein Spielende mitten im Kampf schließt den Bericht trotzdem ab", () => {
    // Sonst ginge ausgerechnet der entscheidende Kampf verloren - danach
    // kommt kein weiterer Step mehr.
    const tracker = createCombatSummaryTracker(ctx);
    tracker.record({ kind: "attackersDeclared", attackers: ["card1"] });
    tracker.record({ kind: "damageDealt", to: "player2", amount: 20, source: "card1" });
    tracker.record({ kind: "gameEnded", winner: "player1" });

    expect(tracker.completed()?.damageToDefendingPlayer).toBe(20);
  });

  it("ein neuer Kampf verwirft den vorherigen Bericht", () => {
    const tracker = createCombatSummaryTracker(ctx);
    tracker.record({ kind: "attackersDeclared", attackers: ["card1"] });
    tracker.record({ kind: "stepBegan", step: "main2" });
    expect(tracker.completed()).toBeDefined();

    tracker.record({ kind: "attackersDeclared", attackers: ["card2"] });
    expect(tracker.completed()).toBeUndefined();
  });

  it("zählt nur Schaden am verteidigenden SPIELER, nicht an Einheiten", () => {
    const tracker = createCombatSummaryTracker(ctx);
    tracker.record({ kind: "attackersDeclared", attackers: ["card1"] });
    tracker.record({ kind: "damageDealt", to: "card9", amount: 5, source: "card1" }); // an einen Blocker
    tracker.record({ kind: "damageDealt", to: "player2", amount: 3, source: "card1" });
    tracker.record({ kind: "stepBegan", step: "main2" });

    expect(tracker.completed()?.damageToDefendingPlayer).toBe(3);
  });
});

describe("Kampfbericht: Darstellung", () => {
  const nameOf = (p: PlayerId) => (p === "player1" ? "Du" : "Ollo");

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function panelFor(summary: CombatSummary): HTMLElement {
    const el = combatSummaryPanel(summary, { nameOf, onDismiss: () => undefined });
    document.body.append(el);
    return el;
  }

  it("nennt den Ausgang je Angreifer und die Verluste beider Seiten", () => {
    const panel = panelFor({
      turnNumber: 5,
      attackingPlayer: "player2",
      defendingPlayer: "player1",
      attackers: [
        { name: "Aschenwelpe", blockers: ["Tempelwache"], damageToDefendingPlayer: 0 },
        { name: "Himmelsspäher", blockers: [], damageToDefendingPlayer: 3 },
      ],
      casualties: [{ name: "Tempelwache", controller: "player1" }],
      damageToDefendingPlayer: 3,
    });

    const title = panel.querySelector(".combat-summary-title")?.textContent ?? "";
    expect(title).toContain("Zug 5");
    expect(title).toContain("Ollo greift an");

    const rows = queryAll(panel, ".combat-summary-attacker");
    expect(rows).toHaveLength(2);
    expect(rows[0]!.textContent).toContain("geblockt von Tempelwache");
    expect(rows[0]!.classList.contains("combat-summary-attacker-blocked")).toBe(true);
    expect(rows[1]!.textContent).toContain("unblockiert · 3 Schaden");
    expect(rows[1]!.classList.contains("combat-summary-attacker-blocked")).toBe(false);

    expect(panel.querySelector(".combat-summary-casualty")?.textContent).toBe("Tempelwache (Du)");
  });

  it("nennt trample-Durchschlag trotz Block und meldet 'keine Verluste'", () => {
    const panel = panelFor({
      turnNumber: 3,
      attackingPlayer: "player1",
      defendingPlayer: "player2",
      attackers: [{ name: "Wüterich", blockers: ["Wicht"], damageToDefendingPlayer: 2 }],
      casualties: [],
      damageToDefendingPlayer: 2,
    });

    expect(panel.querySelector(".combat-summary-attacker-outcome")?.textContent).toBe(
      "geblockt von Wicht · 2 Schaden durchgeschlagen",
    );
    expect(panel.querySelector(".combat-summary-casualties-none")).toBeTruthy();
  });

  it("lässt sich wegklicken", () => {
    let dismissed = 0;
    const panel = combatSummaryPanel(
      {
        turnNumber: 1,
        attackingPlayer: "player1",
        defendingPlayer: "player2",
        attackers: [{ name: "Bär", blockers: [], damageToDefendingPlayer: 2 }],
        casualties: [],
        damageToDefendingPlayer: 2,
      },
      { nameOf, onDismiss: () => dismissed++ },
    );
    document.body.append(panel);

    click(queryOne(panel, ".combat-summary-dismiss-btn"));
    expect(dismissed).toBe(1);
  });
});
