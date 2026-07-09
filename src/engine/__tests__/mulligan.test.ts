import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { buildTestPool, standardTestDecks } from "./fixtures";
import { applyOk } from "./test-helpers";

/**
 * Mulligan (Paris-Variante, rules-engine.md 1b + Entscheidung 9.11, v0.3):
 * neu mischen + eine Karte weniger auf die Hand, streng sequentiell
 * (Startspieler zuerst, komplett fertig, dann der andere).
 */
describe("Mulligan (rules-engine.md 1b + 9.11)", () => {
  it("createGame endet standardmäßig mit einer offenen mulligan-Decision für den Startspieler (Default skipMulligans=false)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 200, startingPlayer: "player1" });

    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player1", timesMulliganed: 0 });
    expect(state.priorityPlayer).toBeUndefined();
    expect(state.resumePriorityTo).toBeUndefined();
    expect(state.step).toBe("untap"); // das Spiel hat noch gar nicht "gesteppt"
    expect(state.players.player1.mulligans).toBe(0);
    expect(state.players.player2.mulligans).toBe(0);
  });

  it("skipMulligans: true überspringt die Phase komplett (Verhalten wie bis v0.2.4)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 200, skipMulligans: true, startingPlayer: "player1" });

    expect(state.pendingDecision).toBeUndefined();
    expect(state.step).toBe("upkeep");
    expect(state.priorityPlayer).toBe("player1");
  });

  it("getLegalActions liefert bei mulligan BEIDE Antworten (behalten/mulliganen) für den betroffenen Spieler, nur concede für den anderen", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 200, startingPlayer: "player1" });

    const legalP1 = getLegalActions(state, "player1", pool);
    const resolveCandidates = legalP1.filter((a) => a.kind === "resolveDecision");
    expect(resolveCandidates).toHaveLength(2);
    expect(resolveCandidates).toContainEqual({
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "mulligan", takeMulligan: true },
    });
    expect(resolveCandidates).toContainEqual({
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "mulligan", takeMulligan: false },
    });

    const legalP2 = getLegalActions(state, "player2", pool);
    expect(legalP2).toEqual([{ kind: "concede", player: "player2" }]);
  });

  it("resolveDecision durch den nicht betroffenen Spieler wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 200, startingPlayer: "player1" });

    const result = engine.applyAction(state, {
      kind: "resolveDecision",
      player: "player2",
      choice: { kind: "mulligan", takeMulligan: false },
    });
    expect(result.error).toBeDefined();
  });

  it("behalten (takeMulligan=false): Startspieler fertig -> der andere Spieler ist als Nächstes dran", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, seed: 200, startingPlayer: "player1" });
    const handP1Before = [...created.players.player1.hand];

    const state = applyOk(engine, created, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "mulligan", takeMulligan: false },
    });

    expect(state.players.player1.hand).toEqual(handP1Before); // unverändert
    expect(state.players.player1.mulligans).toBe(0);
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player2", timesMulliganed: 0 });
    expect(state.priorityPlayer).toBeUndefined();
    expect(state.step).toBe("untap"); // weiterhin kein Step-Start
  });

  it("mulliganen (takeMulligan=true): Hand wird gemischt zurückgelegt, eine Karte weniger gezogen, gleicher Spieler bekommt die nächste Decision", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, seed: 201, startingPlayer: "player1" });
    const originalHand = [...created.players.player1.hand];
    const librarySizeBefore = created.players.player1.library.length;

    const state = applyOk(engine, created, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "mulligan", takeMulligan: true },
    });

    expect(state.players.player1.hand).toHaveLength(6); // 7 - 1
    expect(state.players.player1.mulligans).toBe(1);
    // Alle ursprünglichen 7 Handkarten sind zurück in der Library (+ ggf. neu gezogen).
    expect(state.players.player1.library.length).toBe(librarySizeBefore + originalHand.length - 6);
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player1", timesMulliganed: 1 });
  });

  it("mulliganTaken-Event wird mit der neuen Handgröße emittiert", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, seed: 202, startingPlayer: "player1" });

    const result = engine.applyAction(created, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "mulligan", takeMulligan: true },
    });
    expect(result.error).toBeUndefined();
    expect(result.events).toContainEqual({ kind: "mulliganTaken", player: "player1", newHandSize: 6 });
  });

  it("wiederholtes Mulliganen zählt hoch (7 -> 6 -> 5)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 203, startingPlayer: "player1" });

    state = applyOk(engine, state, { kind: "resolveDecision", player: "player1", choice: { kind: "mulligan", takeMulligan: true } });
    expect(state.players.player1.hand).toHaveLength(6);
    state = applyOk(engine, state, { kind: "resolveDecision", player: "player1", choice: { kind: "mulligan", takeMulligan: true } });
    expect(state.players.player1.hand).toHaveLength(5);
    expect(state.players.player1.mulligans).toBe(2);
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player1", timesMulliganed: 2 });
  });

  it("Handgröße 0 nach dem 7. Mulligan: automatisches Behalten ohne weitere Decision, dann der andere Spieler", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 204, startingPlayer: "player1" });

    for (let i = 0; i < 7; i++) {
      state = applyOk(engine, state, { kind: "resolveDecision", player: "player1", choice: { kind: "mulligan", takeMulligan: true } });
    }
    expect(state.players.player1.hand).toHaveLength(0);
    expect(state.players.player1.mulligans).toBe(7);
    // Keine weitere Decision für player1 (Handgröße 0) - direkt weiter zu player2.
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player2", timesMulliganed: 0 });
  });

  it("streng sequentiell: erst wenn BEIDE Spieler fertig sind, beginnt Zug 1 mit dem Untap Step", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, seed: 205, startingPlayer: "player1" });

    state = applyOk(engine, state, { kind: "resolveDecision", player: "player1", choice: { kind: "mulligan", takeMulligan: true } });
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player1" }); // weiterhin player1
    state = applyOk(engine, state, { kind: "resolveDecision", player: "player1", choice: { kind: "mulligan", takeMulligan: false } });
    expect(state.pendingDecision).toMatchObject({ kind: "mulligan", player: "player2", timesMulliganed: 0 });
    expect(state.step).toBe("untap"); // noch immer kein Zugstart

    state = applyOk(engine, state, { kind: "resolveDecision", player: "player2", choice: { kind: "mulligan", takeMulligan: false } });

    // Beide fertig -> Zug 1 beginnt (Untap ohne Priority-Fenster -> automatisch bis Upkeep).
    expect(state.pendingDecision).toBeUndefined();
    expect(state.step).toBe("upkeep");
    expect(state.priorityPlayer).toBe("player1");
  });

  it("declareAttackers/passPriority sind waehrend der Mulligan-Phase illegal", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, seed: 206, startingPlayer: "player1" });

    const passResult = engine.applyAction(state, { kind: "passPriority", player: "player1" });
    expect(passResult.error).toBeDefined();
    const attackResult = engine.applyAction(state, { kind: "declareAttackers", player: "player1", attackers: [] });
    expect(attackResult.error).toBeDefined();
  });
});
