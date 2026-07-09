import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { BEAR, MODAL_ABILITY_RELIC, MODAL_CHARM_SPELL, MODAL_TRIGGER_UNIT, buildTestPool, standardTestDecks } from "./fixtures";
import { addManaToPool, advanceToStep, applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

/**
 * Modal-Effekte "wähle eines -" (rules-engine.md 4 + Entscheidung 9.13, v0.3):
 * Moduswahl vor X- und Zielwahl. Spells/aktivierte Fähigkeiten tragen
 * `chosenMode` atomar in der Aktion; getriggerte Fähigkeiten bekommen die
 * PendingDecision "chooseMode" (Auto-Pick bei genau einem wählbaren Modus).
 */
describe("Modal-Effekte: Spells (rules-engine.md 4 + 9.13)", () => {
  it("chosenMode=0 (mit Ziel) resolvt nur die Effekte dieses Modus", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 61, startingPlayer: "player1" });

    const enemyUnit = putOnBattlefield(created, BEAR, "player2");
    const spell = giveCardInHand(created, pool, MODAL_CHARM_SPELL, "player1");
    addManaToPool(created, "player1", "colorless", 1);

    let state = applyOk(engine, created, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenMode: 0,
      chosenTargets: [{ kind: "permanent", instanceId: enemyUnit }],
    });
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "spell", chosenMode: 0 });

    const handSizeBefore = state.players.player1.hand.length;
    state = bothPass(engine, state);
    expect(state.players.player2.battlefield).not.toContain(enemyUnit); // Modus 0: zerstört
    expect(state.players.player1.hand.length).toBe(handSizeBefore); // Modus 1 (Karte ziehen) NICHT ausgeführt
  });

  it("chosenMode=1 (ohne Ziel) resolvt den anderen Modus", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 62, startingPlayer: "player1" });

    const spell = giveCardInHand(created, pool, MODAL_CHARM_SPELL, "player1");
    addManaToPool(created, "player1", "colorless", 1);

    let state = applyOk(engine, created, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenMode: 1,
      chosenTargets: [],
    });
    const handSizeBefore = state.players.player1.hand.length;
    state = bothPass(engine, state);
    expect(state.players.player1.hand.length).toBe(handSizeBefore + 1); // Modus 1: Karte gezogen
  });

  it("fehlendes chosenMode bei modaler Karte wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 63, startingPlayer: "player1" });
    const spell = giveCardInHand(state, pool, MODAL_CHARM_SPELL, "player1");
    addManaToPool(state, "player1", "colorless", 1);

    const result = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();
  });

  it("ein Modus ohne legales Ziel ist NICHT wählbar - Cast mit diesem chosenMode wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 64, startingPlayer: "player1" });
    // player2 kontrolliert KEINE Unit -> Modus 0 (zerstöre gegnerische Unit) hat kein legales Ziel.
    const spell = giveCardInHand(state, pool, MODAL_CHARM_SPELL, "player1");
    addManaToPool(state, "player1", "colorless", 1);

    const result = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenMode: 0,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();

    // Modus 1 (kein Ziel nötig) bleibt wählbar.
    const ok = engine.applyAction(state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: spell,
      chosenMode: 1,
      chosenTargets: [],
    });
    expect(ok.error).toBeUndefined();
  });

  it("getLegalActions liefert für eine modale Karte GENAU EINEN Kandidaten ohne chosenMode/chosenTargets", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 65, startingPlayer: "player1" });
    const spell = giveCardInHand(state, pool, MODAL_CHARM_SPELL, "player1");
    addManaToPool(state, "player1", "colorless", 1);

    const legal = getLegalActions(state, "player1", pool);
    const candidates = legal.filter((a) => a.kind === "castSpell" && a.cardInstanceId === spell);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toEqual({ kind: "castSpell", player: "player1", cardInstanceId: spell, chosenTargets: [] });
  });
});

describe("Modal-Effekte: aktivierte Fähigkeiten (rules-engine.md 4 + 9.13)", () => {
  it("chosenMode ist Teil der activateAbility-Aktion (atomar, keine Decision)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 66, startingPlayer: "player1" });

    const relic = putOnBattlefield(created, MODAL_ABILITY_RELIC, "player1");
    addManaToPool(created, "player1", "colorless", 1);

    let state = applyOk(engine, created, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenMode: 1, // "gewinne 1 Leben", kein Ziel
      chosenTargets: [],
    });
    expect(state.pendingDecision).toBeUndefined();
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "activatedAbility", chosenMode: 1 });

    const lifeBefore = state.players.player1.life;
    state = bothPass(engine, state);
    expect(state.players.player1.life).toBe(lifeBefore + 1);
  });

  it("fehlendes chosenMode bei modaler Fähigkeit wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 67, startingPlayer: "player1" });
    const relic = putOnBattlefield(state, MODAL_ABILITY_RELIC, "player1");
    addManaToPool(state, "player1", "colorless", 1);

    const result = engine.applyAction(state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: relic,
      abilityIndex: 0,
      chosenTargets: [],
    });
    expect(result.error).toBeDefined();
  });
});

describe("Modal-Effekte: getriggerte Fähigkeiten / PendingDecision chooseMode (rules-engine.md 4 + 9.13)", () => {
  it("Auto-Pick: genau ein wählbarer Modus -> keine Decision, resolvt sofort", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 68, startingPlayer: "player1" });
    // player2 kontrolliert KEINE Unit -> Modus 0 (zerstöre gegnerische Unit)
    // hat kein legales Ziel -> nur Modus 1 (Karte ziehen) ist wählbar.
    const oracle = giveCardInHand(created, pool, MODAL_TRIGGER_UNIT, "player1");
    // MODAL_TRIGGER_UNIT ist eine Unit (Sorcery-Speed) -> braucht Main 1.
    let state = advanceToStep(engine, created, "main1");
    addManaToPool(state, "player1", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: oracle,
      chosenTargets: [],
    });
    const handSizeBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // Unit resolvt -> ETB-Trigger feuert -> Auto-Pick Modus 1 -> sofort gestackt

    expect(state.pendingDecision).toBeUndefined();
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "triggeredAbility", chosenMode: 1 });

    state = bothPass(engine, state); // Trigger resolvt: Karte gezogen
    expect(state.players.player1.hand.length).toBe(handSizeBefore + 1);
  });

  it("mehrere wählbare Modi -> PendingDecision chooseMode mit selectableModes, gefolgt von normaler Resolution", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 69, startingPlayer: "player1" });
    const enemyUnit = putOnBattlefield(created, BEAR, "player2"); // macht Modus 0 wählbar
    const oracle = giveCardInHand(created, pool, MODAL_TRIGGER_UNIT, "player1");
    let state = advanceToStep(engine, created, "main1");
    addManaToPool(state, "player1", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: oracle,
      chosenTargets: [],
    });
    state = bothPass(engine, state); // Unit resolvt -> ETB-Trigger feuert -> beide Modi wählbar -> Decision

    expect(state.pendingDecision).toMatchObject({ kind: "chooseMode", player: "player1", selectableModes: [0, 1] });
    expect(state.stack).toHaveLength(0);

    // getLegalActions: ein Kandidat pro selectableModes-Eintrag.
    const legal = getLegalActions(state, "player1", pool);
    const resolveCandidates = legal.filter((a) => a.kind === "resolveDecision");
    expect(resolveCandidates).toHaveLength(2);

    state = applyOk(engine, state, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "chooseMode", modeIndex: 0 },
    });
    expect(state.pendingDecision).toBeUndefined();
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({ kind: "triggeredAbility", chosenMode: 0 });

    state = bothPass(engine, state); // Trigger resolvt: Modus 0 - zerstöre die gegnerische Unit
    expect(state.players.player2.battlefield).not.toContain(enemyUnit);
  });

  it("ungültiger modeIndex bei chooseMode wird abgelehnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 70, startingPlayer: "player1" });
    putOnBattlefield(created, BEAR, "player2");
    const oracle = giveCardInHand(created, pool, MODAL_TRIGGER_UNIT, "player1");
    let state = advanceToStep(engine, created, "main1");
    addManaToPool(state, "player1", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: oracle,
      chosenTargets: [],
    });
    state = bothPass(engine, state);
    expect(state.pendingDecision?.kind).toBe("chooseMode");

    const result = engine.applyAction(state, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "chooseMode", modeIndex: 5 },
    });
    expect(result.error).toBeDefined();
  });

  /**
   * v0.3.1 (rules-engine.md 9.13, Nachtrag zum vorher gemeldeten
   * Modellkonflikt): volle Ketten-Decision chooseMode -> chooseTriggerTargets
   * MIT persistiertem chosenMode über beide resolveDecision-Roundtrips
   * hinweg, bis zum korrekt gestackten StackObject.chosenMode. Ersetzt den
   * früheren Interims-Auto-Pick-Fallback.
   */
  it("volle Kette: chooseMode -> chooseTriggerTargets (mehrdeutige Ziele im gewählten Modus) -> korrektes StackObject.chosenMode", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state: created } = engine.createGame({ decks, skipMulligans: true, seed: 71, startingPlayer: "player1" });

    // ZWEI gegnerische Units -> Modus 0 ("zerstöre gegnerische Unit deiner
    // Wahl") ist wählbar UND hat selbst einen mehrdeutigen Zielslot.
    const enemyBearA = putOnBattlefield(created, BEAR, "player2");
    const enemyBearB = putOnBattlefield(created, BEAR, "player2");
    const oracle = giveCardInHand(created, pool, MODAL_TRIGGER_UNIT, "player1");
    let state = advanceToStep(engine, created, "main1");
    addManaToPool(state, "player1", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: oracle,
      chosenTargets: [],
    });
    state = bothPass(engine, state); // Unit resolvt -> ETB-Trigger feuert -> 2 wählbare Modi -> chooseMode-Decision

    expect(state.pendingDecision).toMatchObject({ kind: "chooseMode", player: "player1", selectableModes: [0, 1] });

    // Modus 0 wählen ("zerstöre gegnerische Unit deiner Wahl") - dessen
    // Zielslot ist mit ZWEI gegnerischen Units selbst mehrdeutig -> statt
    // sofort zu stacken, folgt jetzt die Ketten-Decision chooseTriggerTargets.
    state = applyOk(engine, state, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "chooseMode", modeIndex: 0 },
    });

    expect(state.pendingDecision).toMatchObject({
      kind: "chooseTriggerTargets",
      player: "player1",
      sourceInstanceId: oracle,
      chosenMode: 0,
    });
    expect(state.stack).toHaveLength(0); // noch nicht gestackt

    // getLegalActions: 1 Zielslot -> alle legalen Einzelziele als Kandidaten
    // (beide gegnerischen Bären), inkl. korrektem chosenMode-Kontext.
    const legal = getLegalActions(state, "player1", pool);
    const resolveCandidates = legal.filter((a) => a.kind === "resolveDecision");
    expect(resolveCandidates).toHaveLength(2);

    state = applyOk(engine, state, {
      kind: "resolveDecision",
      player: "player1",
      choice: { kind: "chooseTriggerTargets", chosenTargets: [{ kind: "permanent", instanceId: enemyBearA }] },
    });

    expect(state.pendingDecision).toBeUndefined();
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]).toMatchObject({
      kind: "triggeredAbility",
      chosenMode: 0,
      chosenTargets: [{ kind: "permanent", instanceId: enemyBearA }],
    });

    state = bothPass(engine, state); // Trigger resolvt: Modus 0 - zerstöre GENAU das gewählte Ziel
    expect(state.players.player2.battlefield).not.toContain(enemyBearA);
    expect(state.players.player2.battlefield).toContain(enemyBearB); // NICHT betroffen
  });
});
