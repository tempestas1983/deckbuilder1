import { describe, expect, it } from "vitest";
import { createRulesEngine } from "../engine";
import { BEAR, COUNTERSPELL, FLAME_TERRAIN, TIDE_TERRAIN, buildTestPool, standardTestDecks } from "./fixtures";
import { advanceToStep, applyOk, giveCardInHand, putOnBattlefield } from "./test-helpers";

/**
 * Kanonischer Ablauf aus docs/rules-engine.md Abschnitt 4:
 * 1. A castet eine Unit -> Stack: [Unit]. A passt.
 * 2. B antwortet mit einem Gegenzauber (fast) auf die Unit -> Stack: [Unit, Gegenzauber]. B passt, A passt.
 * 3. Gegenzauber resolvt zuerst (LIFO) -> Unit wird gecountert, geht in As Graveyard.
 * 4. Stack leer -> A hat wieder Priority (Main 1 geht weiter).
 */
describe("Priority-Pass resolved den Stack (Counterspell-Beispiel)", () => {
  it("kontert die Unit; danach ist der Stack leer und A hat wieder Priority", () => {
    const pool = buildTestPool();
    const decks = standardTestDecks();
    const engine = createRulesEngine(pool);
    let { state } = engine.createGame({ decks, skipMulligans: true, seed: 11, startingPlayer: "player1" });
    state = advanceToStep(engine, state, "main1");

    const bear = giveCardInHand(state, pool, BEAR, "player1");
    const counter = giveCardInHand(state, pool, COUNTERSPELL, "player2");

    const aTerrain1 = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const aTerrain2 = putOnBattlefield(state, FLAME_TERRAIN, "player1");
    const bFlame = putOnBattlefield(state, FLAME_TERRAIN, "player2");
    const bTide = putOnBattlefield(state, TIDE_TERRAIN, "player2");

    // A (player1, hat zu Beginn von Main 1 Priority) aktiviert beide eigenen
    // Mana-Fähigkeiten - Priority bleibt nach jeder Aktion beim Akteur
    // (rules-engine.md 3.2), player2 hat also noch KEINE Priority.
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: aTerrain1,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player1",
      sourceInstanceId: aTerrain2,
      abilityIndex: 0,
      chosenTargets: [],
    });

    // 1. A castet die Unit.
    state = applyOk(engine, state, { kind: "castSpell", player: "player1", cardInstanceId: bear, chosenTargets: [] });
    expect(state.stack).toHaveLength(1);
    const bearStackId = state.stack[0]!.id;

    state = applyOk(engine, state, { kind: "passPriority", player: "player1" });
    expect(state.priorityPlayer).toBe("player2");

    // B aktiviert jetzt (mit eigener Priority) seine Mana-Fähigkeiten.
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player2",
      sourceInstanceId: bFlame,
      abilityIndex: 0,
      chosenTargets: [],
    });
    state = applyOk(engine, state, {
      kind: "activateAbility",
      player: "player2",
      sourceInstanceId: bTide,
      abilityIndex: 0,
      chosenTargets: [],
    });

    // 2. B antwortet mit dem Gegenzauber, der die Unit auf dem Stack anvisiert.
    state = applyOk(engine, state, {
      kind: "castSpell",
      player: "player2",
      cardInstanceId: counter,
      chosenTargets: [{ kind: "stackObject", stackObjectId: bearStackId }],
    });
    expect(state.stack).toHaveLength(2);

    state = applyOk(engine, state, { kind: "passPriority", player: "player2" });
    expect(state.priorityPlayer).toBe("player1");
    state = applyOk(engine, state, { kind: "passPriority", player: "player1" });

    // 3. Gegenzauber resolvt zuerst (LIFO), entfernt die Unit vom Stack.
    expect(state.stack).toHaveLength(0);
    expect(state.players.player1.graveyard).toContain(bear);
    expect(state.players.player1.battlefield).not.toContain(bear);

    // 4. Stack leer -> aktiver Spieler (A = player1) hat wieder Priority.
    expect(state.priorityPlayer).toBe("player1");
    expect(state.step).toBe("main1");
  });
});
