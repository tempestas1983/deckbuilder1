import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import {
  AMBIGUOUS_ETB_UNIT,
  BEAR,
  BOLT,
  ENEMY_UNIT_TARGET_UNIT,
  FLAME_TERRAIN,
  SPELL_WATCHER,
  buildTestPool,
  standardTestDecks,
} from "./fixtures";
import { advanceToStep, applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

/**
 * Pending-Decision-Kanal (rules-engine.md 9.7): Trigger-Zielwahl bei
 * mehrdeutigen Belegungen pausiert die Engine (kein Priority, kein
 * Stepwechsel), bis `resolveDecision` geantwortet hat.
 */
describe("PendingDecision: chooseTriggerTargets", () => {
  function setupAmbiguousCast(seed: number) {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const existingUnit = putOnBattlefield(state, BEAR, "player1"); // 2. eigene Unit -> Mehrdeutigkeit
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const sprite = giveCardInHand(state, pool, AMBIGUOUS_ETB_UNIT, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, { kind: "castSpell", player: "player1", cardInstanceId: sprite, chosenTargets: [] });
    state = bothPass(engine, state); // Sprössling resolvt -> ETB feuert -> mehrdeutig -> pendingDecision

    return { pool, engine, state, existingUnit, sprite };
  }

  it("setzt pendingDecision statt automatisch zu wählen, blockiert Priority", () => {
    const { state, sprite } = setupAmbiguousCast(41);

    expect(state.pendingDecision).toBeDefined();
    expect(state.pendingDecision?.kind).toBe("chooseTriggerTargets");
    expect(state.pendingDecision).toMatchObject({ kind: "chooseTriggerTargets", player: "player1", sourceInstanceId: sprite });
    expect(state.priorityPlayer).toBeUndefined();
    expect(state.stack).toHaveLength(0); // Trigger liegt noch NICHT auf dem Stack
  });

  it("getLegalActions liefert resolveDecision-Kandidaten nur für den betroffenen Spieler", () => {
    const { pool, state } = setupAmbiguousCast(41);

    const legalP1 = getLegalActions(state, "player1", pool);
    const resolveCandidates = legalP1.filter((a) => a.kind === "resolveDecision");
    expect(resolveCandidates.length).toBe(2); // Bär + Sprössling selbst

    const legalP2 = getLegalActions(state, "player2", pool);
    expect(legalP2).toEqual([{ kind: "concede", player: "player2" }]);
  });

  it("resolveDecision durch den falschen Spieler wird abgelehnt", () => {
    const { engine, state, existingUnit } = setupAmbiguousCast(41);
    const result = engine.applyAction(state, {
      kind: "resolveDecision",
      player: "player2",
      choice: { kind: "chooseTriggerTargets", chosenTargets: [{ kind: "permanent", instanceId: existingUnit }] },
    });
    expect(result.error).toBeDefined();
  });

  it("resolveDecision stackt den Trigger mit dem gewählten Ziel; danach normale Resolution", () => {
    const { engine, state, existingUnit } = setupAmbiguousCast(41);

    let s = applyOk(engine, state, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "chooseTriggerTargets", chosenTargets: [{ kind: "permanent", instanceId: existingUnit }] },
    });
    expect(s.pendingDecision).toBeUndefined();
    expect(s.stack).toHaveLength(1);
    expect(s.stack[0]!.kind).toBe("triggeredAbility");
    expect(s.priorityPlayer).toBe("player1");

    s = bothPass(engine, s); // Trigger resolvt -> +1/+1 auf den Bären
    expect(s.cards[existingUnit]!.permanentState!.counters.plus1plus1).toBe(1);
  });

  it("ein Trigger ohne legales Ziel verpufft (kein Stack-Objekt, keine Decision)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 42, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const marker = giveCardInHand(state, pool, ENEMY_UNIT_TARGET_UNIT, "player1");
    // player2 kontrolliert KEINE Unit -> targets:[{permanent, controller:"opponent"}] hat keine Option.

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, { kind: "castSpell", player: "player1", cardInstanceId: marker, chosenTargets: [] });
    state = bothPass(engine, state);

    expect(state.players.player1.battlefield).toContain(marker); // Unit selbst resolvt normal
    expect(state.pendingDecision).toBeUndefined();
    expect(state.stack).toHaveLength(0); // Trigger wurde nicht gestackt
    expect(state.priorityPlayer).toBe("player1");
  });
});

/**
 * Randfall aus rules-engine.md 9.7 (letzter Absatz) / `GameState.resumePriorityTo`
 * (v0.2.1): Castet der NICHT-aktive Spieler etwas (hier: einen Instant), das
 * SELBST einen mehrdeutigen Trigger auslöst, muss er nach `resolveDecision`
 * wieder Priority bekommen (rules-engine.md 3.2: "derselbe Spieler erhält
 * erneut Priority") - NICHT der aktive Spieler (der frühere v0.2-Fallback).
 */
describe("resumePriorityTo: Priority-Empfänger nach PendingDecision-Pause", () => {
  it("nicht-aktiver Spieler castet Instant mit mehrdeutigem Trigger-Ziel -> bekommt nach resolveDecision wieder Priority, nicht activePlayer", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 61, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");
    expect(state.activePlayer).toBe("player1");
    expect(state.priorityPlayer).toBe("player1");

    // player2 (nicht aktiv) kontrolliert 2 eigene Units (-> Mehrdeutigkeit für
    // den Zauberwächter-Trigger) sowie ein Terrain für Mana.
    const watcher = putOnBattlefield(state, SPELL_WATCHER, "player2");
    const otherUnit = putOnBattlefield(state, BEAR, "player2");
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player2");
    const bolt = giveCardInHand(state, pool, BOLT, "player2");

    // player1 passt zuerst -> einfaches Weiterreichen der Priority an player2
    // (testet zugleich den "einfacher Pass"-Codepfad in actions.ts).
    state = applyOk(engine, state, { kind: "passPriority", player: "player1" });
    expect(state.priorityPlayer).toBe("player2");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player2",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    expect(state.priorityPlayer).toBe("player2"); // Mana-Fähigkeit: Akteur behält Priority

    // player2 castet den Instant, der SELBST (via Zauberwächter) einen
    // mehrdeutigen Trigger auslöst.
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "player", playerId: "player1" }],
    });

    // Priority-Vergabe an player2 (denselben Akteur) wird durch die
    // PendingDecision pausiert - resumePriorityTo muss player2 sein, NICHT
    // player1 (activePlayer).
    expect(state.priorityPlayer).toBeUndefined();
    expect(state.pendingDecision).toMatchObject({ kind: "chooseTriggerTargets", player: "player2", sourceInstanceId: watcher });
    expect(state.resumePriorityTo).toBe("player2");

    state = applyOk(engine, state, {
      kind: "resolveDecision",
      player: "player2",
      choice: { kind: "chooseTriggerTargets", chosenTargets: [{ kind: "permanent", instanceId: otherUnit }] },
    });

    // Kern der Regression: player2 (nicht activePlayer!) bekommt die Priority zurück.
    expect(state.priorityPlayer).toBe("player2");
    expect(state.resumePriorityTo).toBeUndefined();
    expect(state.stack).toHaveLength(2); // [Bolt, Zauberwächter-Trigger]

    // Restliche Resolution läuft normal weiter (Trigger zuerst, dann Bolt),
    // ohne Fehler - reine Plausibilitätsprüfung, kein erneuter Fokus des Tests.
    const lifeBefore = state.players.player1.life;
    state = bothPass(engine, state); // Trigger resolvt
    expect(state.cards[otherUnit]!.permanentState!.counters.plus1plus1).toBe(1);
    state = bothPass(engine, state); // Bolt resolvt
    expect(state.players.player1.life).toBe(lifeBefore - 3);
  });
});
