/**
 * Test-Arrange-Helfer: manipulieren einen GameState direkt (nicht über
 * PlayerActions), um Testvorbedingungen schnell herzustellen (z.B. "Spieler
 * hat schon ein Terrain im Spiel"). Das ist bewusst NICHT Teil der
 * öffentlichen Engine-API - nur fürs Testen der eigentlichen Regel-Logik in
 * isolierten Szenarien, ohne jedes Mal mehrere echte Züge simulieren zu
 * müssen.
 */

import { expect } from "vitest";
import type { CardPool, GameState, InstanceId, ManaColor, PlayerAction, PlayerId, RulesEngine, TurnStep } from "../../model";
import { createCardInstance, moveCard } from "../zones";

/** Wendet eine Aktion an und erwartet Erfolg (kein `error`) - sonst schlägt der Test mit Kontext fehl. */
export function applyOk(engine: RulesEngine, state: GameState, action: PlayerAction): GameState {
  const result = engine.applyAction(state, action);
  if (result.error) {
    throw new Error(`Erwartete legale Aktion, bekam Fehler: ${result.error} (Aktion: ${JSON.stringify(action)})`);
  }
  return result.state;
}

/** Beide Spieler passen nacheinander (aktiver Spieler zuerst), üblicher Fall um den Stack/Step voranzutreiben. */
export function bothPass(engine: RulesEngine, state: GameState): GameState {
  let s = state;
  const firstPasser = s.priorityPlayer;
  expect(firstPasser).toBeDefined();
  s = applyOk(engine, s, { kind: "passPriority", player: firstPasser! });
  const secondPasser = s.priorityPlayer;
  expect(secondPasser).toBeDefined();
  s = applyOk(engine, s, { kind: "passPriority", player: secondPasser! });
  return s;
}

/**
 * Passt wiederholt (beide Spieler) bis der Ziel-Step erreicht ist. Nützlich,
 * weil createGame/beginTurn NICHT automatisch durch Priority-Fenster wie
 * Upkeep/Draw "durchrauscht" (dort könnte in einer echten Partie geantwortet
 * werden, siehe rules-engine.md 2) - Tests müssen diese Fenster wie ein
 * Spieler explizit durchpassen.
 */
export function advanceToStep(engine: RulesEngine, state: GameState, targetStep: TurnStep): GameState {
  let s = state;
  let guard = 0;
  while (s.step !== targetStep) {
    if (s.priorityPlayer === undefined) {
      // Bequemlichkeit für Tests, die Combat nur "durchqueren" wollen: ohne
      // Angreifer/Blocker weiterlaufen lassen, statt in jedem Test explizit
      // deklarieren zu müssen. Für Tests, die ECHTEN Combat brauchen, wird
      // stattdessen combat-spezifisch bis "declareAttackers" vorgepasst
      // (siehe combat.test.ts), bevor dieser Helfer hier eingreifen könnte.
      if (s.step === "declareAttackers") {
        s = applyOk(engine, s, { kind: "declareAttackers", player: s.activePlayer, attackers: [] });
        continue;
      }
      if (s.step === "declareBlockers") {
        const defender = s.players.player1.id === s.activePlayer ? "player2" : "player1";
        s = applyOk(engine, s, { kind: "declareBlockers", player: defender, blocks: [] });
        continue;
      }
      throw new Error(
        `advanceToStep: Step "${s.step}" erfordert eine explizite Turn-Based-Action (kein reines Passen möglich), bevor "${targetStep}" erreicht werden kann.`,
      );
    }
    s = bothPass(engine, s);
    guard += 1;
    if (guard > 50) throw new Error(`advanceToStep: keine Konvergenz zu "${targetStep}" (bei "${s.step}" hängengeblieben).`);
  }
  return s;
}

/** Legt eine Karte direkt aus der Hand/"aus dem Nichts" aufs Battlefield des Spielers. */
export function putOnBattlefield(
  state: GameState,
  definitionId: string,
  controller: PlayerId,
): InstanceId {
  const inst = createCardInstance(state, definitionId, controller);
  moveCard(state, [], inst.instanceId, controller, "battlefield");
  return inst.instanceId;
}

/**
 * v0.2.3 (rules-engine.md 6d(1), Revision von 9.8): Löst eine ausstehende
 * `orderBlockers`-Decision mit einer expliziten Reihenfolge auf.
 */
export function resolveOrderBlockers(
  engine: RulesEngine,
  state: GameState,
  orders: Array<{ attacker: InstanceId; blockers: InstanceId[] }>,
): GameState {
  const decision = state.pendingDecision;
  if (!decision || decision.kind !== "orderBlockers") {
    throw new Error("resolveOrderBlockers: keine orderBlockers-Decision ausstehend.");
  }
  return applyOk(engine, state, {
    kind: "resolveDecision",
    player: decision.player,
    choice: { kind: "orderBlockers", orders },
  });
}

/**
 * Löst eine ausstehende `orderBlockers`-Decision mit der (unveränderten)
 * Deklarationsreihenfolge auf - bequem für Tests, denen die konkrete
 * Reihenfolge egal ist (nur DASS sie beantwortet werden muss, ist relevant).
 */
export function resolveOrderBlockersAsDeclared(engine: RulesEngine, state: GameState): GameState {
  const decision = state.pendingDecision;
  if (!decision || decision.kind !== "orderBlockers") {
    throw new Error("resolveOrderBlockersAsDeclared: keine orderBlockers-Decision ausstehend.");
  }
  return resolveOrderBlockers(
    engine,
    state,
    decision.attackers.map((a) => ({ attacker: a.attacker, blockers: [...a.blockers] })),
  );
}

export function makeNotSummoningSick(state: GameState, instanceId: InstanceId): void {
  const ps = state.cards[instanceId]?.permanentState;
  if (ps) ps.summoningSick = false;
}

export function addManaToPool(state: GameState, player: PlayerId, color: ManaColor | "colorless", amount: number): void {
  state.players[player].manaPool[color] += amount;
}

/** Zieht eine bestimmte Definition-ID aus der Library in die Hand (verschiebt sie ans Library-Ende der Suche). Fürs Testen bequemer als echtes Ziehen mit Zufall. */
export function giveCardInHand(state: GameState, pool: CardPool, definitionId: string, owner: PlayerId): InstanceId {
  const inst = createCardInstance(state, definitionId, owner);
  state.players[owner].hand.push(inst.instanceId);
  return inst.instanceId;
}
