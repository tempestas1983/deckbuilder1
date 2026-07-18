import { describe, expect, it } from "vitest";
import type { PlayerId } from "../../model";
import { createRulesEngine } from "../engine";
import { getLegalActions } from "../legal-actions";
import { starterSet } from "../../cards/starter-set";
import {
  BEAR,
  BOLT,
  DEATH_REMOVAL_UNIT,
  DEATH_TRIGGER_UNIT,
  DESTROY_ANY_SPELL,
  EXILE_ANY_SPELL,
  FLAME_TERRAIN,
  RETURN_ANY_SPELL,
  SELF_DEATH_RELIC,
  SELF_DEATH_UNIT,
  TOKEN_BEAR,
  buildTestPool,
  standardTestDecks,
} from "./fixtures";
import { addManaToPool, advanceToStep, applyOk, bothPass, giveCardInHand, putOnBattlefield } from "./test-helpers";

describe("Trigger (APNAP-Grundfall) und weitere Regelfälle", () => {
  it("onUnitDied-Trigger (eigene Unit stirbt) zieht dem Controller eine Karte", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const herald = putOnBattlefield(state, DEATH_TRIGGER_UNIT, "player1");
    const victim = putOnBattlefield(state, BEAR, "player1");
    const bolt = giveCardInHand(state, pool, BOLT, "player1");
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    const handSizeBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // Blitz resolvt -> Bär stirbt (SBA) -> Death-Trigger wird eingereiht
    expect(state.players.player1.graveyard).toContain(victim);
    expect(state.stack).toHaveLength(1); // Death-Trigger wartet auf dem Stack
    expect(state.stack[0]!.kind).toBe("triggeredAbility");

    state = bothPass(engine, state); // Trigger resolvt -> zieht 1 Karte
    expect(state.players.player1.hand.length).toBe(handSizeBefore + 1); // Bolt hatte die Hand schon vorher verlassen
    void herald;
  });

  it("Terrain darf nur 1x pro Zug gespielt werden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const t1 = giveCardInHand(state, pool, FLAME_TERRAIN, "player1");
    const t2 = giveCardInHand(state, pool, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, { kind: "playTerrain", player: "player1", cardInstanceId: t1 });
    expect(state.players.player1.terrainsPlayedThisTurn).toBe(1);

    const result = engine.applyAction(state, { kind: "playTerrain", player: "player1", cardInstanceId: t2 });
    expect(result.error).toBeDefined();
  });

  it("getLegalActions: passPriority ist immer enthalten, Terrain aus der Hand ist spielbar", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const terrain = giveCardInHand(state, pool, FLAME_TERRAIN, "player1");
    const legal = getLegalActions(state, "player1", pool);

    expect(legal.some((a) => a.kind === "passPriority")).toBe(true);
    expect(legal.some((a) => a.kind === "playTerrain" && a.cardInstanceId === terrain)).toBe(true);
    // Der nicht-priorisierte Spieler darf (außer concede) nichts tun.
    const legalOpponent = getLegalActions(state, "player2", pool);
    expect(legalOpponent).toEqual([{ kind: "concede", player: "player2" }]);
  });

  it("discardToHandSize: im Cleanup muss auf 7 Handkarten abgeworfen werden", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    // 2 zusätzliche Karten auf die Hand -> 9 Handkarten.
    giveCardInHand(state, pool, BEAR, "player1");
    giveCardInHand(state, pool, BEAR, "player1");
    expect(state.players.player1.hand.length).toBe(9);

    state = advanceToStep(engine, state, "cleanup");
    expect(state.priorityPlayer).toBeUndefined(); // wartet auf discardToHandSize

    const toDiscard = state.players.player1.hand.slice(0, 2);
    const result = engine.applyAction(state, {
      kind: "discardToHandSize",
      player: "player1",
      cardInstanceIds: toDiscard,
    });
    expect(result.error).toBeUndefined();
    expect(result.state.players.player1.hand.length).toBe(7);
    expect(result.state.players.player1.graveyard).toEqual(expect.arrayContaining(toDiscard));
  });

  it("concede: Spieler verliert sofort, Gegner gewinnt", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    const { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });

    const result = engine.applyAction(state, { kind: "concede", player: "player1" });
    expect(result.error).toBeUndefined();
    expect(result.state.players.player1.hasLost).toBe(true);
    expect(result.state.winner).toBe("player2");
  });
});

describe("effects.ts-Regression: eventSubject-Fizzle für permanent-bezogene Effekte (rules-engine.md 9.14, v0.3.4)", () => {
  it("onUnitDied + destroyPermanent/exilePermanent/returnToHand auf eventSubject: gestorbenes TOKEN -> kein Crash, kein Effekt, übrige Effekte des Triggers wirken normal", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const keeper = putOnBattlefield(state, DEATH_REMOVAL_UNIT, "player1");
    const victim = putOnBattlefield(state, TOKEN_BEAR, "player1"); // 2/2 TOKEN
    const bolt = giveCardInHand(state, pool, BOLT, "player1"); // 3 Schaden, letal
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    const handSizeBefore = state.players.player1.hand.length;

    // Vor dem Fix (rules-engine.md 9.14): destroyPermanent/exilePermanent/
    // returnToHand riefen leaveBattlefield fuer die (per SBA 7 bereits
    // endgueltig geloeschte) Token-Instanz UNGEGUARDET auf -> Crash
    // ("leaveBattlefield: unbekannte InstanceId ..."). Nach dem Fix laeuft
    // die Resolution sauber durch.
    expect(() => {
      state = bothPass(engine, state); // Blitz resolvt -> Token stirbt (SBA 7, endgueltig geloescht) -> Trigger wird eingereiht
    }).not.toThrow();

    expect(state.cards[victim]).toBeUndefined(); // Token endgueltig weg, kein Graveyard-Eintrag
    expect(state.stack).toHaveLength(1);
    expect(state.stack[0]!.kind).toBe("triggeredAbility");

    expect(() => {
      state = bothPass(engine, state); // Trigger resolvt: drawCards + 3x guarded No-Op auf eventSubject
    }).not.toThrow();

    // Nur der drawCards-Effekt hat gewirkt - die drei permanent-bezogenen
    // Effekte sind still uebersprungen worden (kein Fehler, keine Zonen-
    // Manipulation, keine zusaetzliche Handkarte durch returnToHand).
    expect(state.players.player1.hand.length).toBe(handSizeBefore + 1);
    void keeper;
  });

  it("onUnitDied + destroyPermanent/exilePermanent/returnToHand auf eventSubject: gestorbene NICHT-Token-Karte im Friedhof bleibt unangetastet", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 21, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const keeper = putOnBattlefield(state, DEATH_REMOVAL_UNIT, "player1");
    const victim = putOnBattlefield(state, BEAR, "player1"); // 2/2, normale (Nicht-Token-)Karte
    const bolt = giveCardInHand(state, pool, BOLT, "player1");
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    state = bothPass(engine, state); // Blitz resolvt -> Bär stirbt (SBA) -> Trigger wird eingereiht
    expect(state.players.player1.graveyard).toContain(victim);
    expect(state.stack).toHaveLength(1);

    const handSizeBefore = state.players.player1.hand.length;
    const graveyardSizeBefore = state.players.player1.graveyard.length;

    state = bothPass(engine, state); // Trigger resolvt: drawCards + guarded No-Ops (kein "Raise Dead", keine Ex-Graveyard-Verbannung)

    expect(state.players.player1.hand.length).toBe(handSizeBefore + 1);
    // Die tote Karte bleibt exakt dort, wo sie ist (Friedhof) - destroyPermanent/
    // exilePermanent/returnToHand haben sie NICHT bewegt.
    expect(state.players.player1.graveyard).toContain(victim);
    expect(state.players.player1.graveyard.length).toBe(graveyardSizeBefore);
    expect(state.players.player1.exile).not.toContain(victim);
    expect(state.cards[victim]!.permanentState).toBeUndefined();
    void keeper;
  });
});

describe("Zonenbasierte Todesdefinition für onDeath/onUnitDied (rules-engine.md 9.15, v0.3.5)", () => {
  it("onDeath{self} feuert weiterhin bei SBA-Tod (Regressionsschutz, unverändertes Verhalten)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 1, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    putOnBattlefield(state, SELF_DEATH_UNIT, "player1"); // 2/1
    const bolt = giveCardInHand(state, pool, BOLT, "player1"); // 3 Schaden, letal
    const victim = state.players.player1.battlefield[0]!;
    const terrain = putOnBattlefield(state, FLAME_TERRAIN, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: terrain,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player1",
      cardInstanceId: bolt,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    state = bothPass(engine, state); // Blitz resolvt -> letaler Schaden -> SBA-Tod -> onDeath wird eingereiht
    expect(state.players.player1.graveyard).toContain(victim);
    expect(state.stack).toHaveLength(1);

    const handBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // onDeath-Trigger resolvt
    expect(state.players.player1.hand.length).toBe(handBefore + 1);
  });

  it("onDeath{self} feuert NEU bei Tod durch destroyPermanent (vor 9.15 ein stillschweigender Bug)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    // startingPlayer player2, damit player2 in Main 1 direkt Priority hat
    // (DESTROY_ANY_SPELL ist "fast", aber castSpell prüft trotzdem hasPriority).
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 1, startingPlayer: "player2" });
    state = advanceToStep(engine, state, "main1");

    const victim = putOnBattlefield(state, SELF_DEATH_UNIT, "player1");
    const edict = giveCardInHand(state, pool, DESTROY_ANY_SPELL, "player2");
    addManaToPool(state, "player2", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: edict,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    state = bothPass(engine, state); // Zerstörungsritual resolvt -> destroyPermanent -> Tod
    expect(state.players.player1.graveyard).toContain(victim);
    expect(state.stack).toHaveLength(1); // onDeath-Trigger

    const handBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // onDeath-Trigger resolvt
    expect(state.players.player1.hand.length).toBe(handBefore + 1);
  });

  it("onDeath{self} feuert NEU bei Tod durch sacrificeSelf-Zusatzkosten (vor 9.15 ein stillschweigender Bug)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 1, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const victim = putOnBattlefield(state, SELF_DEATH_UNIT, "player1");

    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: victim,
      abilityIndex: 1, // die sacrificeSelf-Fähigkeit (opfere dich: gewinne 1 Leben)
      chosenTargets: [],
    });

    expect(state.players.player1.graveyard).toContain(victim); // Opfer ist sofort Teil der Kosten (vor Resolution)
    expect(state.stack.length).toBeGreaterThanOrEqual(1); // mind. der onDeath-Trigger liegt bereits/gleich auf dem Stack

    const handBefore = state.players.player1.hand.length;
    // Stack vollständig abräumen (aktivierte Fähigkeit selbst + onDeath-Trigger,
    // Reihenfolge irrelevant für diesen Test).
    let guard = 0;
    while (state.stack.length > 0) {
      state = bothPass(engine, state);
      guard += 1;
      if (guard > 10) throw new Error("Stack wurde nicht leer - Test hängt.");
    }
    expect(state.players.player1.hand.length).toBe(handBefore + 1); // onDeath hat gezogen
  });

  it("onDeath{self} feuert NICHT bei exilePermanent (kein Tod, dokumentiertes Design 9.15)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 1, startingPlayer: "player2" });
    state = advanceToStep(engine, state, "main1");

    const victim = putOnBattlefield(state, SELF_DEATH_UNIT, "player1");
    const banish = giveCardInHand(state, pool, EXILE_ANY_SPELL, "player2");
    addManaToPool(state, "player2", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: banish,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    const handBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // Bannritual resolvt -> exilePermanent, KEIN Tod

    expect(state.players.player1.exile).toContain(victim);
    expect(state.players.player1.graveyard).not.toContain(victim);
    expect(state.stack).toHaveLength(0); // kein onDeath-Trigger wurde eingereiht
    expect(state.players.player1.hand.length).toBe(handBefore); // keine Karte gezogen
  });

  it("onDeath{self} feuert NICHT bei returnToHand (kein Tod, dokumentiertes Design 9.15)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 1, startingPlayer: "player2" });
    state = advanceToStep(engine, state, "main1");

    const victim = putOnBattlefield(state, SELF_DEATH_UNIT, "player1");
    const recall = giveCardInHand(state, pool, RETURN_ANY_SPELL, "player2");
    addManaToPool(state, "player2", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: recall,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    const handBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // Rückrufritual resolvt -> returnToHand, KEIN Tod

    expect(state.players.player1.hand).toContain(victim); // die Karte selbst liegt jetzt auf der Hand ...
    expect(state.players.player1.graveyard).not.toContain(victim);
    expect(state.stack).toHaveLength(0); // ... aber kein onDeath-Trigger wurde eingereiht
    // Handgröße +1 kommt NUR vom zurückgeholten Objekt selbst, nicht von einem
    // zusätzlichen drawCards-Effekt (der würde +2 statt +1 bedeuten).
    expect(state.players.player1.hand.length).toBe(handBefore + 1);
  });

  it("onDeath{self} ist typ-agnostisch (feuert auch für Nicht-Units) UND onUnitDied bleibt unit-only (feuert NICHT beim Tod eines Nicht-Unit-Permanents)", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 1, startingPlayer: "player2" });
    state = advanceToStep(engine, state, "main1");

    // Beobachter: feuert (nur) bei fremdem ODER eigenem UNIT-Tod (controller: "own").
    putOnBattlefield(state, DEATH_TRIGGER_UNIT, "player1");
    const victim = putOnBattlefield(state, SELF_DEATH_RELIC, "player1"); // Nicht-Unit
    const edict = giveCardInHand(state, pool, DESTROY_ANY_SPELL, "player2");
    addManaToPool(state, "player2", "colorless", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: edict,
      chosenTargets: [{ kind: "permanent", instanceId: victim }],
    });

    state = bothPass(engine, state); // Zerstörungsritual resolvt -> Relic stirbt (Nicht-Unit)
    expect(state.players.player1.graveyard).toContain(victim);
    // Nur EIN Trigger wurde eingereiht: das Relic's eigenes onDeath{self}
    // (typ-agnostisch). Der DEATH_TRIGGER_UNIT-Beobachter (onUnitDied) darf
    // NICHT mitfeuern, weil das sterbende Objekt keine Unit ist.
    expect(state.stack).toHaveLength(1);

    const handBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // das eine onDeath-Trigger resolvt
    // Genau EINE zusätzliche Karte (nicht zwei) - der Beobachter hat nicht mitgefeuert.
    expect(state.players.player1.hand.length).toBe(handBefore + 1);
  });
});

describe("Pool-Regressionstest: core.husk-crawler + core.doomreap-edict (rules-engine.md 9.15, v0.3.5)", () => {
  it("onDeath{self} von core.husk-crawler feuert jetzt auch bei Tod durch core.doomreap-edict (destroyPermanent), nicht mehr nur bei Kampf-/SBA-Tod", () => {
    const deck: Record<string, number> = {};
    for (const id of Object.keys(starterSet)) deck[id] = 2;
    const decks: Record<PlayerId, Record<string, number>> = { player1: { ...deck }, player2: { ...deck } };
    const engine = createRulesEngine(starterSet);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 4242, startingPlayer: "player2" });
    state = advanceToStep(engine, state, "main1"); // player2s eigene Main 1 (aktiver Spieler)

    const crawler = putOnBattlefield(state, "core.husk-crawler", "player1");
    const edict = giveCardInHand(state, starterSet, "core.doomreap-edict", "player2");
    addManaToPool(state, "player2", "colorless", 2);
    addManaToPool(state, "player2", "void", 1);

    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: edict,
      chosenTargets: [{ kind: "permanent", instanceId: crawler }],
    });

    const handBefore = state.players.player1.hand.length;
    state = bothPass(engine, state); // Verhängnisernte resolvt -> destroyPermanent -> Hüllenkriecher stirbt
    expect(state.players.player1.graveyard).toContain(crawler);
    expect(state.stack).toHaveLength(1); // onDeath-Trigger ("ziehe eine Karte")

    state = bothPass(engine, state); // Trigger resolvt
    expect(state.players.player1.hand.length).toBe(handBefore + 1);
  });
});
