import { describe, expect, it } from "vitest";
import type { GameState, RulesEngine } from "../../model";
import { createRulesEngine } from "../engine";
import { BEAR, BOLT, ENRAGE_UNIT, TRAMPLE_UNIT, X_BOLT, buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, bothPass, giveCardInHand, makeNotSummoningSick, putOnBattlefield, resolveOrderBlockersAsDeclared } from "./test-helpers";

/**
 * `onDamageReceived` (v0.3 verdrahtet, rules-engine.md 5 + Entscheidung 9.10):
 * feuert für Kampf- UND Effekt-Schaden > 0 an ein Permanent, einmal pro
 * Schadensereignis; `eventSubject` = Schadensquelle (nicht self). Testkarte
 * `ENRAGE_UNIT` (2/6): "Wenn diese Unit Schaden erhält, füge der
 * Schadensquelle 1 Schaden zu" (Vergeltungs-Design via EffectRecipient
 * "eventSubject").
 */
function advanceToDeclareAttackers(engine: RulesEngine, state: GameState): GameState {
  let s = advanceToStep(engine, state, "main1");
  s = bothPass(engine, s); // -> beginCombat
  s = bothPass(engine, s); // -> declareAttackers
  return s;
}

describe("onDamageReceived (rules-engine.md 5 + 9.10)", () => {
  it("feuert bei Kampfschaden (Blocker erhält Schaden vom Angreifer) und trifft die Schadensquelle zurück", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 71, skipMulligans: true, startingPlayer: "player1" });

    // 4/4-Angreifer statt eines 2/2-Bären, damit er den regulären
    // Rückschaden des Blockers (2) UND die Vergeltung (1) überlebt (3 < 4).
    const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4 (trample ohne Belang hier)
    const blocker = putOnBattlefield(state, ENRAGE_UNIT, "player2"); // 2/6
    makeNotSummoningSick(state, attacker);
    makeNotSummoningSick(state, blocker);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state); // -> declareBlockers
    state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });
    state = bothPass(engine, state); // -> combatDamage, Priority-Fenster danach

    // Trigger wurde gefeuert und liegt bereits gestackt (Auto-Pick, kein Ziel nötig).
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "triggeredAbility", sourceInstanceId: blocker, eventSubject: attacker });

    state = bothPass(engine, state); // Trigger resolvt: 1 Schaden zurück an den Angreifer
    // Angreifer hat 2 (eigener Kampfschaden vom Blocker) + 1 (Vergeltung) = 3 markierten Schaden.
    expect(state.players.player1.battlefield).toContain(attacker);
    expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(3);
  });

  it("feuert bei Effekt-Schaden (dealDamage-Spell), nicht nur bei Kampfschaden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 72, skipMulligans: true, startingPlayer: "player1" });

    const target = putOnBattlefield(state, ENRAGE_UNIT, "player2");
    const bolt = giveCardInHand(state, pool, BOLT, "player1"); // {flame}, 3 Schaden, fast
    // BOLT ist fast/instant - direkt im aktuellen Priority-Fenster (Upkeep,
    // s. createGame) castbar; kein advanceToStep nötig (der Manapool würde
    // bei jedem Step-Wechsel ohnehin geleert, s. rules-engine.md 1).
    state.players.player1.manaPool.flame = 1;

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "permanent", instanceId: target }],
    });
    state = bothPass(engine, state); // Bolt resolvt: 3 Schaden an ENRAGE_UNIT, Trigger feuert

    expect(state.cards[target]!.permanentState!.damageMarked).toBe(3);
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "triggeredAbility", sourceInstanceId: target });
    // eventSubject ist die Bolt-Karteninstanz (keine Permanent mehr, liegt im Graveyard) -
    // die Vergeltung läuft bei Resolution ins Leere, ohne zu crashen.
    state = bothPass(engine, state);
    expect(state.players.player2.battlefield).toContain(target); // 3 < 6 Toughness, überlebt
  });

  it("Schaden <= 0 feuert nicht (§6c-Konsistenz, X=0)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 73, skipMulligans: true, startingPlayer: "player1" });

    const target = putOnBattlefield(state, ENRAGE_UNIT, "player2");
    const spell = giveCardInHand(state, pool, X_BOLT, "player1");

    state = advanceToStep(engine, state, "main1");
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [{ kind: "permanent", instanceId: target }],
      chosenX: 0,
    });
    state = bothPass(engine, state);

    expect(state.cards[target]!.permanentState!.damageMarked).toBe(0);
    expect(state.stack).toHaveLength(0); // kein Trigger gefeuert
  });

  it("Mehrfachblock: ein Trigger PRO Schadensquelle (einmal pro Schadensereignis)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 74, skipMulligans: true, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, ENRAGE_UNIT, "player1"); // 2/6
    const blockerA = putOnBattlefield(state, BEAR, "player2"); // 2/2
    const blockerB = putOnBattlefield(state, BEAR, "player2"); // 2/2
    makeNotSummoningSick(state, attacker);
    makeNotSummoningSick(state, blockerA);
    makeNotSummoningSick(state, blockerB);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state);
    state = applyOk(engine, state, {
      kind: "declareBlockers",
      player: "player2",
      blocks: [
        { blocker: blockerA, attacker },
        { blocker: blockerB, attacker },
      ],
    });
    state = resolveOrderBlockersAsDeclared(engine, state);
    state = bothPass(engine, state); // -> combatDamage + Priority-Fenster

    // Der Angreifer (ENRAGE_UNIT) erhielt Schaden von ZWEI unabhängigen Quellen
    // (blockerA UND blockerB) -> zwei getrennte Trigger, nicht einer gebündelt.
    const triggers = state.stack.filter((o) => o.kind === "triggeredAbility");
    expect(triggers).toHaveLength(2);
    const subjects = triggers.map((t) => (t as any).eventSubject).sort();
    expect(subjects).toEqual([blockerA, blockerB].sort());
  });

  it("letaler Schaden feuert trotzdem - Trigger überlebt den Tod der Quelle und resolvt normal", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 75, skipMulligans: true, startingPlayer: "player1" });

    const attacker = putOnBattlefield(state, TRAMPLE_UNIT, "player1"); // 4/4
    const blocker = putOnBattlefield(state, ENRAGE_UNIT, "player2"); // 2/6 Basiswert
    // Für einen echten Lethal-Test wird die effektive Toughness der
    // ENRAGE_UNIT-Instanz testweise auf 4 gesenkt (temporärer Debuff), damit
    // 4 Kampfschaden vom 4/4-Angreifer exakt letal ist.
    state.cards[blocker]!.permanentState!.temporaryModifiers.push({ duration: "endOfTurn", stats: { power: 0, toughness: -2 } });
    makeNotSummoningSick(state, attacker);
    makeNotSummoningSick(state, blocker);

    state = advanceToDeclareAttackers(engine, state);
    state = applyOk(engine, state, { kind: "declareAttackers", player: "player1", attackers: [attacker] });
    state = bothPass(engine, state);
    state = applyOk(engine, state, { kind: "declareBlockers", player: "player2", blocks: [{ blocker, attacker }] });
    state = bothPass(engine, state); // -> combatDamage (4 Schaden = letal bei Toughness 4) + SBA + Priority-Fenster

    // Der Blocker (Trigger-Quelle) ist tot, aber sein onDamageReceived-Trigger
    // wurde VOR der SBA-Prüfung gefeuert und bleibt in der Pending-Queue ->
    // liegt jetzt auf dem Stack.
    expect(state.players.player2.battlefield).not.toContain(blocker);
    expect(state.players.player2.graveyard).toContain(blocker);
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "triggeredAbility", sourceInstanceId: blocker, eventSubject: attacker });

    state = bothPass(engine, state); // Trigger resolvt: 1 Vergeltungsschaden an den (noch lebenden) Angreifer
    // Angreifer: 2 regulärer Rückschaden vom Blocker + 1 Vergeltung = 3 (< 4 Toughness, überlebt).
    expect(state.players.player1.battlefield).toContain(attacker);
    expect(state.cards[attacker]!.permanentState!.damageMarked).toBe(3);
  });
});
