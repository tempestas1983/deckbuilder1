import { describe, expect, it } from "vitest";
import type { GameEvent, GameState, InstanceId, RulesEngine } from "../../model";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { leaveBattlefield } from "../zones";
import {
  BEAR,
  DAMAGE_TRIGGER_UNIT,
  LIFELINK_UNIT,
  VIGILANT_BEAR,
  buildTestPool,
  standardTestDecks,
} from "./fixtures";
import {
  advanceToStep,
  applyOk,
  bothPass,
  makeNotSummoningSick,
  putOnBattlefield,
  resolveOrderBlockersAsDeclared,
} from "./test-helpers";

/**
 * Härtungstests für rules-engine.md 6a/6b/6c/9.8 (v0.2.2). Ergänzt
 * combat.test.ts (Grundfälle) und guardian.test.ts (guardian-Pflicht) um
 * die vom Game-Architect beim Review präzisierten Randfälle:
 * - §6d(1)/9.8 Mehrfachblock-Schadensreihenfolge: seit v0.2.3 REVIDIERT -
 *   der ANGREIFER wählt via `orderBlockers`-PendingDecision (nicht mehr die
 *   Deklarationsreihenfolge des Verteidigers). Letzter Blocker erhält
 *   weiterhin (ohne trample) den GESAMTEN Rest statt nur letale Menge.
 * - §6b Zonenwechsel zwischen Declare Blockers und Combat Damage ("geblockt
 *   bleibt geblockt", kein Trample-Durchschlag ohne Blocker/Angreifer).
 * - §6c Schaden <= 0 ist kein Schaden (kein Lebensverlust, kein
 *   lifelink-Gewinn, kein Trigger, kein Event) - inkl. Regressionstests für
 *   die beiden vom Architect gefundenen Bugs in combat.ts#dealCombatDamage.
 */

function advanceToDeclareAttackers(engine: RulesEngine, state: GameState): GameState {
  let s = advanceToStep(engine, state, "main1");
  s = bothPass(engine, s); // -> beginCombat
  s = bothPass(engine, s); // -> declareAttackers (Turn-Based Action, priorityPlayer undefined)
  expect(s.step).toBe("declareAttackers");
  expect(s.priorityPlayer).toBeUndefined();
  return s;
}

/**
 * Simuliert eine bereits resolvte Instant-Response ("Kill-Spell trifft"),
 * OHNE den vollen Cast/Stack-Umweg zu gehen - reines Test-Arrangement wie in
 * test-helpers.ts (direkte State-Manipulation ist dort bewusst kein Teil der
 * öffentlichen Engine-API, siehe Datei-Kommentar dort). Der resultierende
 * State (Karte im Graveyard, permanentState verworfen, priorityPlayer/Stack
 * unverändert) ist ununterscheidbar von einem echten Instant, das im selben
 * Priority-Fenster resolvt wäre.
 */
function killPermanent(state: GameState, pool: ReturnType<typeof buildTestPool>, instanceId: InstanceId): void {
  const events: GameEvent[] = [];
  leaveBattlefield(state, pool, events, instanceId, "graveyard");
}

/** Fügt einer bereits im Spiel befindlichen Unit einen "bis Zugende"-Statmodifikator hinzu (Debuff-Simulation). */
function boostStats(state: GameState, instanceId: InstanceId, powerDelta: number, toughnessDelta: number): void {
  const ps = state.cards[instanceId]!.permanentState!;
  ps.temporaryModifiers.push({ duration: "endOfTurn", stats: { power: powerDelta, toughness: toughnessDelta } });
}

/** Wie bothPass, gibt aber zusätzlich die Events des LETZTEN passPriority zurück (für Event-Assertions). */
function bothPassCapturingEvents(engine: RulesEngine, state: GameState): { state: GameState; events: GameEvent[] } {
  const firstPasser = state.priorityPlayer;
  expect(firstPasser).toBeDefined();
  const mid = applyOk(engine, state, { kind: "passPriority", player: firstPasser! });
  const secondPasser = mid.priorityPlayer;
  expect(secondPasser).toBeDefined();
  const result = engine.applyAction(mid, { kind: "passPriority", player: secondPasser! });
  expect(result.error).toBeUndefined();
  return { state: result.state, events: result.events };
}

describe("Kampf - Edge Cases (rules-engine.md 6a/6b/6c/9.8/6d)", () => {
  it("§6d(1)/9.8 (v0.2.3 revidiert) Mehrfachblock: ANGREIFER legt via orderBlockers die Reihenfolge fest, letzter Blocker bekommt den GESAMTEN Rest", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, BEAR, "player1"); // 2/2 -> 10/10
    makeNotSummoningSick(state, attacker);
    boostStats(state, attacker, 8, 8);

    const blockerA = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 1/2
    boostStats(state, blockerA, -1, 0);
    const blockerB = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 1/3
    boostStats(state, blockerB, -1, 1);
    const blockerC = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 1/1
    boostStats(state, blockerC, -1, -1);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state); // -> declareBlockers
    state = applyOk(engine, state, {
      kind: "declareBlockers",
      player: "player2",
      // Block-Deklaration selbst ist seit v0.2.3 NICHT mehr schadensrelevant.
      blocks: [
        { blocker: blockerA, attacker },
        { blocker: blockerB, attacker },
        { blocker: blockerC, attacker },
      ],
    });

    // v0.2.3: >= 2 Blocker auf einem Angreifer -> orderBlockers-Decision des
    // ANGREIFERS, VOR dem Priority-Fenster des Steps (6d(1), Revision 9.8).
    expect(state.pendingDecision?.kind).toBe("orderBlockers");
    expect(state.priorityPlayer).toBeUndefined();
    if (state.pendingDecision?.kind === "orderBlockers") {
      expect(state.pendingDecision.player).toBe("player1"); // der Angreifer wählt
      expect(state.pendingDecision.attackers).toEqual([{ attacker, blockers: [blockerA, blockerB, blockerC] }]);
    }
    // Angreifer bestätigt die Reihenfolge A, B, C (identisch zur Deklaration).
    state = resolveOrderBlockersAsDeclared(engine, state);
    expect(state.priorityPlayer).toBe("player1");

    const { state: afterDamage, events } = bothPassCapturingEvents(engine, state); // -> combatDamage
    state = afterDamage;
    expect(state.step).toBe("combatDamage");

    const dmgTo = (id: InstanceId) =>
      events.find((e): e is Extract<GameEvent, { kind: "damageDealt" }> => e.kind === "damageDealt" && e.to === id);

    // A zuerst: genau letal (2). B danach: genau letal (3). C zuletzt: GESAMTER Rest (10-2-3=5), nicht nur letal (1).
    expect(dmgTo(blockerA)?.amount).toBe(2);
    expect(dmgTo(blockerB)?.amount).toBe(3);
    expect(dmgTo(blockerC)?.amount).toBe(5);

    // SBA hat alle drei Blocker (letal getroffen) abgeräumt.
    expect(state.players.player2.graveyard).toContain(blockerA);
    expect(state.players.player2.graveyard).toContain(blockerB);
    expect(state.players.player2.graveyard).toContain(blockerC);
    // Kein Trample-Analog -> der Überschuss (5 statt letal 1 bei C) trifft NICHT den Verteidiger.
    expect(state.players.player2.life).toBe(20);

    // Angreifer erhält 1+1+1=3 Rückschaden von den drei Blockern, überlebt (10 Toughness).
    expect(state.players.player1.battlefield).toContain(attacker);
    expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(3);
  });

  it("vigilant-Angreifer bleibt nach Declare Attackers ungetappt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, VIGILANT_BEAR, "player1");
    makeNotSummoningSick(state, attacker);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });

    expect(state.cards[attacker]!.permanentState?.tapped).toBe(false);
    expect(state.cards[attacker]!.permanentState?.combat?.role).toBe("attacker");
  });

  describe("lifelink im Kampf", () => {
    it("ungeblockt: Controller gewinnt Leben in Höhe des zugefügten Schadens", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, LIFELINK_UNIT, "player1"); // 2/2 lifelink
      makeNotSummoningSick(state, attacker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [] });

      state = bothPass(engine, state); // -> combatDamage

      expect(state.players.player2.life).toBe(18); // 20 - 2
      expect(state.players.player1.life).toBe(22); // 20 + 2 (lifelink)
    });

    it("geblockt: Controller gewinnt Leben auch für Schaden an den Blocker", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, LIFELINK_UNIT, "player1"); // 2/2 lifelink
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });

      state = bothPass(engine, state); // -> combatDamage + SBA

      expect(state.players.player2.life).toBe(20); // kein Spielerschaden (geblockt)
      expect(state.players.player1.life).toBe(22); // lifelink auch für Schaden an Permanents
      expect(state.players.player2.battlefield).not.toContain(blocker); // 2 Schaden = letal
    });

    it("Regression: Power <= 0 (Debuff) verursacht KEINEN (insbesondere keinen negativen) Lebensgewinn - Bugfix combat.ts#addPlayerDamage", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, LIFELINK_UNIT, "player1"); // 2/2 lifelink
      makeNotSummoningSick(state, attacker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers (letztes Antwortfenster vor Schaden, §6a)
      // Debuff im Declare-Blockers-Fenster: Power 2 -> -3 (deutlich negativ, nicht nur 0).
      boostStats(state, attacker, -5, 0);
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [] });

      state = bothPass(engine, state); // -> combatDamage

      // Vor dem Fix: addPlayerDamage akkumulierte lifelinkGains VOR der amount<=0-Prüfung,
      // wodurch ein negativer Schadensbetrag den Controller Leben KOSTEN konnte.
      expect(state.players.player1.life).toBe(20);
      expect(state.players.player2.life).toBe(20);
    });
  });

  describe("§6b Zonenwechsel zwischen Declare Blockers und Combat Damage", () => {
    it("Blocker stirbt im Declare-Blockers-Fenster -> Angreifer schlägt NICHT beim Verteidiger durch (kein Trample-Analog)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1");
      const blocker = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });
      expect(state.step).toBe("declareBlockers");
      expect(state.priorityPlayer).toBe("player1"); // letztes Antwortfenster vor Schaden (§6a)

      // Instant-Response tötet den Blocker, bevor Combat Damage läuft.
      killPermanent(state, pool, blocker);
      expect(state.cards[blocker]!.permanentState).toBeUndefined();

      expect(() => {
        state = bothPass(engine, state); // -> combatDamage
      }).not.toThrow();

      expect(state.step).toBe("combatDamage");
      // "Geblockt bleibt geblockt": kein Schaden beim Verteidiger, kein Durchschlagen.
      expect(state.players.player2.life).toBe(20);
      // Der Angreifer erhält auch keinen Schaden zurück (Blocker ist weg).
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(0);
    });

    it("Angreifer stirbt im Declare-Blockers-Fenster -> Blocker verrechnet nichts", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1");
      const blocker = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });

      killPermanent(state, pool, attacker);
      expect(state.cards[attacker]!.permanentState).toBeUndefined();

      expect(() => {
        state = bothPass(engine, state); // -> combatDamage
      }).not.toThrow();

      expect(state.step).toBe("combatDamage");
      // Blocker verrechnet nichts (weder empfangen noch ausgeteilt).
      expect(state.players.player2.battlefield).toContain(blocker);
      expect(state.cards[blocker]!.permanentState!.damageMarked).toBe(0);
      expect(state.players.player1.life).toBe(20);
    });

    it("Mehrfachblock: stirbt der (array-)letzte Blocker im Declare-Blockers-Fenster, bekommt der tatsächlich letzte ÜBERLEBENDE Blocker den vollen Restschaden (§6b + §9.8 kombiniert)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1"); // 2/2 -> 10/10
      makeNotSummoningSick(state, attacker);
      boostStats(state, attacker, 8, 8);

      const blockerA = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 1/2 (letal 2)
      boostStats(state, blockerA, -1, 0);
      const blockerB = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 1/3 (letal 3)
      boostStats(state, blockerB, -1, 1);
      const blockerC = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 1/1, wird VOR Combat Damage getötet
      boostStats(state, blockerC, -1, -1);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, {
        kind: "declareBlockers",
        player: "player2",
        // Deklarationsreihenfolge A, B, C - C ist der nominal letzte Eintrag.
        blocks: [
          { blocker: blockerA, attacker },
          { blocker: blockerB, attacker },
          { blocker: blockerC, attacker },
        ],
      });
      // v0.2.3: Angreifer bestätigt die Reihenfolge A, B, C, bevor das
      // Priority-Fenster öffnet (6d(1), Revision 9.8).
      expect(state.pendingDecision?.kind).toBe("orderBlockers");
      state = resolveOrderBlockersAsDeclared(engine, state);
      expect(state.priorityPlayer).toBe("player1"); // letztes Antwortfenster vor Schaden (§6a)

      // Instant-Response tötet den (array-)letzten Blocker C, bevor Combat Damage läuft.
      killPermanent(state, pool, blockerC);
      expect(state.cards[blockerC]!.permanentState).toBeUndefined();

      const { state: afterDamage, events } = bothPassCapturingEvents(engine, state); // -> combatDamage
      state = afterDamage;
      expect(state.step).toBe("combatDamage");

      const dmgTo = (id: InstanceId) =>
        events.find((e): e is Extract<GameEvent, { kind: "damageDealt" }> => e.kind === "damageDealt" && e.to === id);

      // A bekommt weiterhin nur die letale Menge (2).
      expect(dmgTo(blockerA)?.amount).toBe(2);
      // B ist jetzt der tatsächlich LETZTE ÜBERLEBENDE Blocker und bekommt den
      // GESAMTEN Rest (10-2=8), NICHT nur seine letale Menge (3) - vor dem Fix
      // wäre der Überschuss (5) wirkungslos verpufft, weil "isLast" am toten
      // (array-)letzten Eintrag C hing.
      expect(dmgTo(blockerB)?.amount).toBe(8);
      // C bekam gar keinen Schaden zugewiesen (schon tot, kein damageDealt-Event für C).
      expect(dmgTo(blockerC)).toBeUndefined();

      expect(state.players.player2.battlefield).not.toContain(blockerA);
      expect(state.players.player2.battlefield).not.toContain(blockerB);
      expect(state.players.player2.graveyard).toContain(blockerA);
      expect(state.players.player2.graveyard).toContain(blockerB);
      // Kein Trample-Analog -> der Überschuss trifft NICHT den Verteidiger.
      expect(state.players.player2.life).toBe(20);
    });
  });

  describe("§6c Schaden <= 0 ist kein Schaden", () => {
    it("0-Power-Angreifer (Debuff), ungeblockt: kein Schaden, kein Event, kein Trigger, keine Exception (Bugfix combat.ts#onDealtCombatDamageToPlayer)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, DAMAGE_TRIGGER_UNIT, "player1"); // 1/1
      makeNotSummoningSick(state, attacker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      // Debuff im Declare-Blockers-Fenster: Power 1 -> 0.
      boostStats(state, attacker, -1, 0);
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [] });

      const handSizeBefore = state.players.player1.hand.length;
      let events: GameEvent[] = [];
      expect(() => {
        const result = bothPassCapturingEvents(engine, state); // -> combatDamage
        state = result.state;
        events = result.events;
      }).not.toThrow();

      expect(state.step).toBe("combatDamage");
      expect(state.players.player2.life).toBe(20);
      // Vor dem Fix feuerte onDealtCombatDamageToPlayer bedingungslos (auch bei power<=0).
      expect(events.some((e) => e.kind === "triggerFired")).toBe(false);
      expect(events.some((e) => e.kind === "damageDealt")).toBe(false);
      expect(events.some((e) => e.kind === "lifeChanged")).toBe(false);
      expect(state.pendingTriggers).toHaveLength(0);
      expect(state.stack).toHaveLength(0);
      expect(state.players.player1.hand.length).toBe(handSizeBefore); // kein Kartenzug durch den (nicht gefeuerten) Trigger
    });

    it("Kontrolle: bei Power > 0 feuert derselbe Trigger normal (Angriffs-/Schadens-Pfad bleibt sonst funktionsfähig)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, DAMAGE_TRIGGER_UNIT, "player1"); // 1/1
      makeNotSummoningSick(state, attacker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [] });

      const { state: afterDamage, events } = bothPassCapturingEvents(engine, state); // -> combatDamage
      state = afterDamage;

      expect(state.players.player2.life).toBe(19);
      expect(events.some((e) => e.kind === "triggerFired" && e.sourceInstanceId === attacker)).toBe(true);
    });

    it("0-Power-Angreifer (Debuff), geblockt: kein Schaden an den Blocker; Blocker teilt weiterhin regulär aus", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1"); // 2/2
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      boostStats(state, attacker, -2, 0); // Power 2 -> 0
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });

      state = bothPass(engine, state); // -> combatDamage + SBA

      // Blocker bekommt keinen Schaden vom 0-Power-Angreifer, überlebt unbeschadet.
      expect(state.players.player2.battlefield).toContain(blocker);
      expect(state.cards[blocker]!.permanentState!.damageMarked).toBe(0);
      // Angreifer bekommt weiterhin regulär Schaden vom Blocker zurück (2, letal) und stirbt.
      expect(state.players.player1.battlefield).not.toContain(attacker);
      expect(state.players.player1.graveyard).toContain(attacker);
    });

    it("0-Power-Blocker: nimmt regulären Schaden vom Angreifer, richtet selbst aber keinen Schaden an", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1"); // 2/2
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = advanceToDeclareAttackers(engine, state);
      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers
      state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });
      boostStats(state, blocker, -2, 0); // Power 2 -> 0, NACH der Deklaration (Block bleibt bestehen, §6b Punkt 4)

      state = bothPass(engine, state); // -> combatDamage + SBA

      // Blocker nimmt regulär letalen Schaden vom Angreifer (2, unverändert), stirbt.
      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player2.graveyard).toContain(blocker);
      // Angreifer bekommt KEINEN Rückschaden (Blocker-Power 0), bleibt unbeschadet.
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(0);
    });
  });

  describe("getLegalActions bei Declare Attackers/Blockers (bestehende guardian-Filterung bleibt unberührt)", () => {
    it("liefert plausible Kandidaten für Declare Attackers und Declare Blockers ohne guardian", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1");
      const blocker = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = advanceToDeclareAttackers(engine, state);
      const attackerActions = getLegalActions(state, "player1", pool).filter((a) => a.kind === "declareAttackers");
      expect(attackerActions.some((a) => a.kind === "declareAttackers" && a.attackers.length === 0)).toBe(true);
      expect(attackerActions.some((a) => a.kind === "declareAttackers" && a.attackers.includes(attacker))).toBe(true);

      state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      state = bothPass(engine, state); // -> declareBlockers

      const blockerActions = getLegalActions(state, "player2", pool).filter((a) => a.kind === "declareBlockers");
      expect(blockerActions.some((a) => a.kind === "declareBlockers" && a.blocks.length === 0)).toBe(true);
      expect(
        blockerActions.some(
          (a) => a.kind === "declareBlockers" && a.blocks.some((b) => b.blocker === blocker && b.attacker === attacker),
        ),
      ).toBe(true);
    });
  });
});
