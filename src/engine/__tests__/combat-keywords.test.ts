import { describe, expect, it } from "vitest";
import type { GameEvent, GameState, InstanceId, RulesEngine } from "../../model";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { leaveBattlefield } from "../zones";
import {
  BEAR,
  DEATHTOUCH_UNIT,
  FIRST_STRIKE_DEATHTOUCH_UNIT,
  FIRST_STRIKE_TRAMPLE_UNIT,
  FIRST_STRIKE_UNIT,
  TRAMPLE_DEATHTOUCH_UNIT,
  TRAMPLE_UNIT,
  buildTestPool,
  standardTestDecks,
} from "./fixtures";
import {
  advanceToStep,
  applyOk,
  bothPass,
  makeNotSummoningSick,
  putOnBattlefield,
  resolveOrderBlockers,
  resolveOrderBlockersAsDeclared,
} from "./test-helpers";

/**
 * Tests für das Kampf-Keyword-Paket v0.2.3 (rules-engine.md 6d, Entscheidung
 * 9.9): `trample`, `firstStrike`, `deathtouch` sowie die dazugehörige
 * angreifer-gewählte `orderBlockers`-PendingDecision (Revision von 9.8,
 * siehe combat-edge-cases.test.ts für die reine Mehrfachblock-Reihenfolge
 * ohne die neuen Keywords). Kombinatorik gemäß 6d(4).
 */

function advanceToDeclareAttackers(engine: RulesEngine, state: GameState): GameState {
  let s = advanceToStep(engine, state, "main1");
  s = bothPass(engine, s); // -> beginCombat
  s = bothPass(engine, s); // -> declareAttackers (Turn-Based Action, priorityPlayer undefined)
  expect(s.step).toBe("declareAttackers");
  expect(s.priorityPlayer).toBeUndefined();
  return s;
}

/** Reines Test-Arrangement (siehe combat-edge-cases.test.ts): simuliert eine bereits resolvte Instant-Antwort. */
function killPermanent(state: GameState, pool: ReturnType<typeof buildTestPool>, instanceId: InstanceId): void {
  const events: GameEvent[] = [];
  leaveBattlefield(state, pool, events, instanceId, "graveyard");
}

/** Fügt einer Unit einen "bis Zugende"-Statmodifikator hinzu (Boost/Debuff-Simulation). */
function boostStats(state: GameState, instanceId: InstanceId, powerDelta: number, toughnessDelta: number): void {
  const ps = state.cards[instanceId]!.permanentState!;
  ps.temporaryModifiers.push({ duration: "endOfTurn", stats: { power: powerDelta, toughness: toughnessDelta } });
}

/** Bringt einen Angreifer + seine (>= 1) Blocker bis zum letzten Antwortfenster vor Combat Damage (Declare-Blockers-Fenster). */
function setUpAttackAndBlock(
  engine: RulesEngine,
  state: GameState,
  attacker: InstanceId,
  blocks: Array<{ blocker: InstanceId; attacker: InstanceId }>,
): GameState {
  let s = advanceToDeclareAttackers(engine, state);
  s = applyOk(engine, s, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
  s = bothPass(engine, s); // -> declareBlockers
  s = applyOk(engine, s, { kind: "declareBlockers", player: "player2", blocks });
  if (s.pendingDecision?.kind === "orderBlockers") {
    s = resolveOrderBlockersAsDeclared(engine, s);
  }
  return s;
}

describe("Kampf-Keyword-Paket v0.2.3 (rules-engine.md 6d/9.9)", () => {
  describe("trample", () => {
    it("Überschuss über die letale Menge des einzigen Blockers hinaus trifft den Verteidiger", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4 trample
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      // Letal für den Blocker: 2 (Toughness). Überschuss 4-2=2 trifft den Spieler.
      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player2.graveyard).toContain(blocker);
      expect(state.players.player2.life).toBe(18); // 20 - 2 Überschuss
      // Angreifer bekommt regulär Rückschaden vom Blocker (2), überlebt (Toughness 4).
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(2);
    });

    it("6b(2) revidiert: sterben ALLE Blocker vor Combat Damage, schlägt der trample-Angreifer mit VOLLER Power durch (statt gar nicht)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4 trample
      const blocker = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      // Instant-Response tötet den einzigen Blocker im Declare-Blockers-Fenster.
      killPermanent(state, pool, blocker);

      state = bothPass(engine, state); // -> combatDamage

      // "Geblockt bleibt geblockt", ABER mit trample geht die GESAMTE Power (4) an den Spieler.
      expect(state.players.player2.life).toBe(16); // 20 - 4
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(0); // kein Blocker mehr da, kein Rückschaden
    });

    it("Mehrfachblock: exakt letale Menge pro Blocker (Angreifer-Reihenfolge egal bei genug Power), Rest an den Spieler", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4 trample
      const blockerA = putOnBattlefield(state, BEAR, "player2"); // 2/2, letal 2
      const blockerB = putOnBattlefield(state, BEAR, "player2"); // 2/2, letal 2
      makeNotSummoningSick(state, attacker);

      state = setUpAttackAndBlock(engine, state, attacker, [
        { blocker: blockerA, attacker },
        { blocker: blockerB, attacker },
      ]);
      const { state: afterDamage, events } = (() => {
        const firstPasser = state.priorityPlayer!;
        const mid = applyOk(engine, state, { kind: "passPriority", player: firstPasser });
        const secondPasser = mid.priorityPlayer!;
        const result = engine.applyAction(mid, { kind: "passPriority", player: secondPasser });
        expect(result.error).toBeUndefined();
        return { state: result.state, events: result.events };
      })();
      state = afterDamage;

      const dmgTo = (id: InstanceId) =>
        events.find((e): e is Extract<GameEvent, { kind: "damageDealt" }> => e.kind === "damageDealt" && e.to === id);
      expect(dmgTo(blockerA)?.amount).toBe(2);
      expect(dmgTo(blockerB)?.amount).toBe(2);
      expect(state.players.player2.life).toBe(20); // 4 Power - 2 - 2 = 0 Überschuss
      expect(state.players.player2.graveyard).toContain(blockerA);
      expect(state.players.player2.graveyard).toContain(blockerB);
    });

    it("Angreifer-gewählte orderBlockers-Reihenfolge entscheidet bei knapper Power, WER von zwei Blockern überlebt", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4 trample -> 3/4
      const blockerX = putOnBattlefield(state, BEAR, "player2"); // 2/2, letal 2
      const blockerY = putOnBattlefield(state, BEAR, "player2"); // 2/2, letal 2
      makeNotSummoningSick(state, attacker);
      boostStats(state, attacker, -1, 0); // Power 4 -> 3: reicht nur für EINEN vollen Kill

      let s = advanceToDeclareAttackers(engine, state);
      s = applyOk(engine, s, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      s = bothPass(engine, s); // -> declareBlockers
      s = applyOk(engine, s, {
        kind: "declareBlockers",
        player: "player2",
        blocks: [
          { blocker: blockerX, attacker },
          { blocker: blockerY, attacker },
        ],
      });
      expect(s.pendingDecision?.kind).toBe("orderBlockers");
      // Angreifer wählt EXPLIZIT: Y zuerst (Y bekommt die vollen letalen 2, X nur den Rest 1).
      s = resolveOrderBlockers(engine, s, [{ attacker, blockers: [blockerY, blockerX] }]);

      const firstPasser = s.priorityPlayer!;
      const mid = applyOk(engine, s, { kind: "passPriority", player: firstPasser });
      const secondPasser = mid.priorityPlayer!;
      const result = engine.applyAction(mid, { kind: "passPriority", player: secondPasser });
      expect(result.error).toBeUndefined();
      s = result.state;

      expect(s.players.player2.graveyard).toContain(blockerY); // volle letale Menge (2) zuerst zugewiesen -> stirbt
      expect(s.players.player2.battlefield).toContain(blockerX); // bekommt nur den Rest (1) -> überlebt
      expect(s.cards[blockerX]!.permanentState!.damageMarked).toBe(1);
      expect(s.players.player2.life).toBe(20); // Power komplett verbraucht, kein Überschuss zum Spieler
    });
  });

  describe("deathtouch", () => {
    it("1 Schaden einer deathtouch-Quelle ist unabhängig von der Toughness letal (SBA 4)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, DEATHTOUCH_UNIT, "player1"); // 1/1 deathtouch
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 2/10 (Toughness weit über dem tatsächlichen Schaden)
      makeNotSummoningSick(state, attacker);
      boostStats(state, blocker, 0, 8);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player2.graveyard).toContain(blocker);
    });

    it("§6c bleibt unverändert: Schaden <= 0 einer deathtouch-Quelle setzt KEIN Flag, Blocker überlebt", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, DEATHTOUCH_UNIT, "player1"); // 1/1 deathtouch
      const blocker = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);

      let s = advanceToDeclareAttackers(engine, state);
      s = applyOk(engine, s, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      s = bothPass(engine, s); // -> declareBlockers
      boostStats(s, attacker, -1, 0); // Power 1 -> 0
      s = applyOk(engine, s, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });
      s = bothPass(engine, s); // -> combatDamage + SBA

      expect(s.players.player2.battlefield).toContain(blocker);
      expect(s.cards[blocker]!.permanentState!.damageMarked).toBe(0);
      expect(s.cards[blocker]!.permanentState!.deathtouchDamage).toBeFalsy();
    });

    it("Mehrfachblock: Angreifer-Power < Blockerzahl -> orderBlockers-Wahl entscheidet, WER stirbt (6d(4))", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, DEATHTOUCH_UNIT, "player1"); // 1/1 deathtouch -> 2/1
      const blockerA = putOnBattlefield(state, BEAR, "player2");
      const blockerB = putOnBattlefield(state, BEAR, "player2");
      const blockerC = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);
      boostStats(state, attacker, 1, 0); // Power 1 -> 2: reicht nur für 2 von 3 Blockern

      let s = advanceToDeclareAttackers(engine, state);
      s = applyOk(engine, s, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      s = bothPass(engine, s); // -> declareBlockers
      s = applyOk(engine, s, {
        kind: "declareBlockers",
        player: "player2",
        blocks: [
          { blocker: blockerA, attacker },
          { blocker: blockerB, attacker },
          { blocker: blockerC, attacker },
        ],
      });
      expect(s.pendingDecision?.kind).toBe("orderBlockers");
      // Angreifer wählt explizit: C und A sterben, B (in der Mitte der Wahl) überlebt.
      s = resolveOrderBlockers(engine, s, [{ attacker, blockers: [blockerC, blockerA, blockerB] }]);

      const firstPasser = s.priorityPlayer!;
      const mid = applyOk(engine, s, { kind: "passPriority", player: firstPasser });
      const result = engine.applyAction(mid, { kind: "passPriority", player: mid.priorityPlayer! });
      expect(result.error).toBeUndefined();
      s = result.state;

      expect(s.players.player2.graveyard).toContain(blockerC);
      expect(s.players.player2.graveyard).toContain(blockerA);
      expect(s.players.player2.battlefield).toContain(blockerB); // kein Schaden mehr übrig -> überlebt
      expect(s.cards[blockerB]!.permanentState!.damageMarked).toBe(0);
    });
  });

  describe("firstStrike", () => {
    it("firstStrike-Angreifer tötet den regulären Blocker in der frühen Runde -> kein Rückschaden mehr", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, FIRST_STRIKE_UNIT, "player1"); // 2/2 firstStrike
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2 (letal genau bei 2)
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player2.graveyard).toContain(blocker);
      // Blocker ist tot, bevor er (in der regulären Runde) hätte zurückschlagen können.
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(0);
    });

    it("regulärer Blocker OHNE firstStrike schlägt einen NICHT-firstStrike-Angreifer weiterhin normal zurück (Regression: unveränderter Ablauf ohne firstStrike-Teilnehmer)", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1");
      const blocker = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      // Ohne firstStrike-Teilnehmer: EINE Runde, beide Seiten treffen sich gegenseitig letal.
      expect(state.players.player1.battlefield).not.toContain(attacker);
      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player1.graveyard).toContain(attacker);
      expect(state.players.player2.graveyard).toContain(blocker);
    });

    it("firstStrike-Blocker tötet einen Angreifer OHNE firstStrike, bevor dieser zuschlagen kann", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, BEAR, "player1"); // 2/2
      const blocker = putOnBattlefield(state, FIRST_STRIKE_UNIT, "player2"); // 2/2 firstStrike
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      expect(state.players.player1.battlefield).not.toContain(attacker);
      expect(state.players.player1.graveyard).toContain(attacker);
      // Angreifer ist tot, bevor er in der regulären Runde hätte zuschlagen können.
      expect(state.players.player2.battlefield).toContain(blocker);
      expect(state.cards[blocker]!.permanentState!.damageMarked).toBe(0);
    });
  });

  describe("Kombinatorik (rules-engine.md 6d(4))", () => {
    it("firstStrike + deathtouch: tötet bereits in der frühen Runde, Opfer schlägt NICHT mehr zurück", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, FIRST_STRIKE_DEATHTOUCH_UNIT, "player1"); // 1/1 firstStrike+deathtouch
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2 -> 2/10, würde regulären 1-Schaden locker überleben
      makeNotSummoningSick(state, attacker);
      boostStats(state, blocker, 0, 8);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      // Deathtouch macht den 1 Schaden letal, firstStrike sorgt dafür, dass das VOR der Vergeltung passiert.
      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player2.graveyard).toContain(blocker);
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(0);
    });

    it("firstStrike + trample: Überschuss schlägt schon in der frühen Runde durch, KEIN zweiter Durchschlag in Runde 2", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, FIRST_STRIKE_TRAMPLE_UNIT, "player1"); // 4/4 firstStrike+trample
      const blocker = putOnBattlefield(state, BEAR, "player2"); // 2/2, letal 2
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      // Genau EIN Trample-Durchschlag (4-2=2), nicht zwei (wäre 4 bei doppeltem Durchschlag).
      expect(state.players.player2.life).toBe(18);
      expect(state.players.player2.battlefield).not.toContain(blocker);
      expect(state.players.player2.graveyard).toContain(blocker);
      // Angreifer hat firstStrike -> Blocker (stirbt in Runde 1) kann nie zurückschlagen.
      expect(state.players.player1.battlefield).toContain(attacker);
      expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(0);
    });

    it("trample + deathtouch: letale Menge = 1 pro Blocker, fast die gesamte Power schlägt durch", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_DEATHTOUCH_UNIT, "player1"); // 4/4 trample+deathtouch
      const blockerA = putOnBattlefield(state, BEAR, "player2"); // 2/2
      const blockerB = putOnBattlefield(state, BEAR, "player2"); // 2/2
      makeNotSummoningSick(state, attacker);

      state = setUpAttackAndBlock(engine, state, attacker, [
        { blocker: blockerA, attacker },
        { blocker: blockerB, attacker },
      ]);
      const firstPasser = state.priorityPlayer!;
      const mid = applyOk(engine, state, { kind: "passPriority", player: firstPasser });
      const result = engine.applyAction(mid, { kind: "passPriority", player: mid.priorityPlayer! });
      expect(result.error).toBeUndefined();
      state = result.state;

      // Nur 1+1=2 von 4 Power werden für die Blocker "verbraucht" (letal je 1 statt Toughness 2) - 2 gehen durch.
      expect(state.players.player2.life).toBe(18);
      expect(state.players.player2.graveyard).toContain(blockerA);
      expect(state.players.player2.graveyard).toContain(blockerB);
    });

    it("firstStrike-Blocker gegen trample-Angreifer ohne firstStrike: stirbt der Angreifer in der Zwischen-SBA, teilt er KEINEN Schaden (auch keinen trample-Durchschlag) aus", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4 trample, KEIN firstStrike
      const blocker = putOnBattlefield(state, FIRST_STRIKE_UNIT, "player2"); // 2/2 firstStrike
      makeNotSummoningSick(state, attacker);
      makeNotSummoningSick(state, blocker);
      boostStats(state, attacker, 0, -2); // Toughness 4 -> 2: der firstStrike-Blocker (Power 2) tötet ihn in Runde 1

      state = setUpAttackAndBlock(engine, state, attacker, [{ blocker, attacker }]);
      state = bothPass(engine, state); // -> combatDamage + SBA

      expect(state.players.player1.battlefield).not.toContain(attacker);
      expect(state.players.player1.graveyard).toContain(attacker);
      // Kein Schaden an den Blocker, kein Trample-Durchschlag an den Spieler.
      expect(state.players.player2.life).toBe(20);
      expect(state.players.player2.battlefield).toContain(blocker);
      expect(state.cards[blocker]!.permanentState!.damageMarked).toBe(0);
    });
  });

  describe("getLegalActions bei orderBlockers", () => {
    it("liefert mindestens einen gültigen resolveDecision-Kandidaten, enumeriert aber keine Permutationen", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1");
      const blockerA = putOnBattlefield(state, BEAR, "player2");
      const blockerB = putOnBattlefield(state, BEAR, "player2");
      makeNotSummoningSick(state, attacker);

      let s = advanceToDeclareAttackers(engine, state);
      s = applyOk(engine, s, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      s = bothPass(engine, s); // -> declareBlockers
      s = applyOk(engine, s, {
        kind: "declareBlockers",
        player: "player2",
        blocks: [
          { blocker: blockerA, attacker },
          { blocker: blockerB, attacker },
        ],
      });
      expect(s.pendingDecision?.kind).toBe("orderBlockers");

      const actionsForAttacker = getLegalActions(s, "player1", pool);
      const resolveCandidates = actionsForAttacker.filter((a) => a.kind === "resolveDecision");
      expect(resolveCandidates.length).toBeGreaterThanOrEqual(1);
      expect(resolveCandidates[0]).toMatchObject({
        kind: "resolveDecision",
        choice: { kind: "orderBlockers" },
      });

      // Der Verteidiger darf die Entscheidung nicht treffen (nur concede legal).
      const actionsForDefender = getLegalActions(s, "player2", pool);
      expect(actionsForDefender.every((a) => a.kind === "concede")).toBe(true);
    });

    it("resolveDecision lehnt eine falsche Permutation (fremder Blocker) ab", () => {
      const pool = buildTestPool();
      const decks = standardTestDecks();
      const engine = createRulesEngine(pool);
      let { state } = engine.createGame({ decks, seed: 9, startingPlayer: "player1" });

      const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1");
      const blockerA = putOnBattlefield(state, BEAR, "player2");
      const blockerB = putOnBattlefield(state, BEAR, "player2");
      const outsider = putOnBattlefield(state, BEAR, "player2"); // nicht Teil des Blocks
      makeNotSummoningSick(state, attacker);

      let s = advanceToDeclareAttackers(engine, state);
      s = applyOk(engine, s, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
      s = bothPass(engine, s);
      s = applyOk(engine, s, {
        kind: "declareBlockers",
        player: "player2",
        blocks: [
          { blocker: blockerA, attacker },
          { blocker: blockerB, attacker },
        ],
      });
      expect(s.pendingDecision?.kind).toBe("orderBlockers");

      const result = engine.applyAction(s, {
        kind: "resolveDecision",
        player: "player1",
        choice: { kind: "orderBlockers", orders: [{ attacker, blockers: [blockerA, outsider] }] },
      });
      expect(result.error).toBeDefined();
      expect(result.state).toBe(s); // unveränderter State bei Ablehnung
    });
  });
});
