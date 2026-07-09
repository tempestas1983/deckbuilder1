/**
 * Effekt-Interpreter: führt Effect[]-Listen (DSL aus src/model/abilities.ts)
 * bei Stack-Resolution aus. Ein Effekt pro Funktion, damit jedes Primitiv
 * isoliert testbar ist (rules-engine.md 9.4).
 *
 * v0.1-Lücken (bewusst, siehe docs/engine-status.md):
 * - `scry`: kein Player-Action-Kanal, um die Reihenfolge zu wählen -> No-Op
 *   (Karten bleiben unverändert oben in der Library). Muss der Architect
 *   entscheiden (neue PlayerAction "reorderTopOfLibrary" o.ä.).
 * - `addMana` mit color:"any": es gibt keine Aktion, mit der ein Spieler die
 *   Farbe wählt -> wird als "colorless" gutgeschrieben (Vereinfachung).
 * - `createToken`: Token-CardDefinition muss im Pool existieren und
 *   isToken=true haben; keine Validierung, dass es tatsächlich ein Token ist.
 */

import type {
  Amount,
  CardPool,
  ChosenTarget,
  Effect,
  EffectRecipient,
  GameEvent,
  GameState,
  InstanceId,
  PlayerId,
} from "../model";
import { getDefinition } from "./card-defs";
import { drawCard, leaveBattlefield, moveCard, createCardInstance } from "./zones";
import { computeEffectiveKeywords } from "./stats";
import { nextRandom } from "./rng";
import { otherPlayer } from "./util";
import { applyDamageToPermanent } from "./damage";

export interface EffectContext {
  controller: PlayerId;
  /** Undefined an Position i = Ziel i war bei Resolution nicht mehr legal (Teil-Fizzle). */
  chosenTargets: Array<ChosenTarget | undefined>;
  chosenX?: number;
  /** Quelle: bei Spells die Spell-Karteninstanz, bei Fähigkeiten das Quell-Permanent. */
  self: InstanceId;
  eventSubject?: InstanceId | PlayerId;
}

type Resolved =
  | { kind: "permanent"; instanceId: InstanceId }
  | { kind: "player"; playerId: PlayerId }
  | { kind: "stackObject"; stackObjectId: string };

function chosenToResolved(chosen: ChosenTarget): Resolved {
  if (chosen.kind === "permanent") return { kind: "permanent", instanceId: chosen.instanceId };
  if (chosen.kind === "player") return { kind: "player", playerId: chosen.playerId };
  return { kind: "stackObject", stackObjectId: chosen.stackObjectId };
}

function resolveRecipients(state: GameState, recipient: EffectRecipient, ctx: EffectContext): Resolved[] {
  switch (recipient) {
    case "self":
      return [{ kind: "permanent", instanceId: ctx.self }];
    case "controller":
      return [{ kind: "player", playerId: ctx.controller }];
    case "opponent":
      return [{ kind: "player", playerId: otherPlayer(state, ctx.controller) }];
    case "eachOpponent":
      return [{ kind: "player", playerId: otherPlayer(state, ctx.controller) }];
    case "eventSubject": {
      if (ctx.eventSubject === undefined) return [];
      if (ctx.eventSubject in state.players) {
        return [{ kind: "player", playerId: ctx.eventSubject as PlayerId }];
      }
      return [{ kind: "permanent", instanceId: ctx.eventSubject as InstanceId }];
    }
    default: {
      const chosen = ctx.chosenTargets[recipient.target];
      if (!chosen) return [];
      return [chosenToResolved(chosen)];
    }
  }
}

export function computeAmount(state: GameState, pool: CardPool, amount: Amount, ctx: EffectContext): number {
  if (typeof amount === "number") return amount;
  if (amount.kind === "x") return ctx.chosenX ?? 0;
  const opponent = otherPlayer(state, ctx.controller);
  switch (amount.what) {
    case "ownUnits":
      return state.players[ctx.controller].battlefield.filter(
        (id) => getDefinition(pool, state.cards[id]!.definitionId).type === "unit",
      ).length;
    case "opponentUnits":
      return state.players[opponent].battlefield.filter(
        (id) => getDefinition(pool, state.cards[id]!.definitionId).type === "unit",
      ).length;
    case "ownCardsInHand":
      return state.players[ctx.controller].hand.length;
    case "ownCardsInGraveyard":
      return state.players[ctx.controller].graveyard.length;
    case "countersOnSelf": {
      const ps = state.cards[ctx.self]?.permanentState;
      if (!ps || !amount.counterType) return 0;
      return ps.counters[amount.counterType] ?? 0;
    }
    default:
      return 0;
  }
}

function dealDamageToPlayer(
  state: GameState,
  events: GameEvent[],
  player: PlayerId,
  amount: number,
  source: InstanceId,
): void {
  state.players[player].life -= amount;
  events.push({ kind: "damageDealt", to: player, amount, source });
  events.push({ kind: "lifeChanged", player, delta: -amount, newTotal: state.players[player].life });
}

function applyLifelinkIfApplicable(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  source: InstanceId,
  amount: number,
): void {
  const sourceCard = state.cards[source];
  if (!sourceCard?.permanentState) return;
  const keywords = computeEffectiveKeywords(state, pool, source);
  if (keywords.has("lifelink") && amount > 0) {
    gainLife(state, events, sourceCard.controller, amount);
  }
}

function gainLife(state: GameState, events: GameEvent[], player: PlayerId, amount: number): void {
  state.players[player].life += amount;
  events.push({ kind: "lifeChanged", player, delta: amount, newTotal: state.players[player].life });
}

function loseLife(state: GameState, events: GameEvent[], player: PlayerId, amount: number): void {
  state.players[player].life -= amount;
  events.push({ kind: "lifeChanged", player, delta: -amount, newTotal: state.players[player].life });
}

/** Führt eine Liste von Effekten in Reihenfolge aus. */
export function executeEffects(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  effects: Effect[],
  ctx: EffectContext,
): void {
  for (const effect of effects) {
    executeEffect(state, pool, events, effect, ctx);
  }
}

function executeEffect(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  effect: Effect,
  ctx: EffectContext,
): void {
  switch (effect.kind) {
    case "dealDamage": {
      const amount = computeAmount(state, pool, effect.amount, ctx);
      for (const r of resolveRecipients(state, effect.to, ctx)) {
        if (r.kind === "permanent") {
          applyDamageToPermanent(state, pool, events, r.instanceId, amount, ctx.self);
          applyLifelinkIfApplicable(state, pool, events, ctx.self, amount);
        } else if (r.kind === "player") {
          dealDamageToPlayer(state, events, r.playerId, amount, ctx.self);
          applyLifelinkIfApplicable(state, pool, events, ctx.self, amount);
        }
      }
      break;
    }
    case "gainLife": {
      const amount = computeAmount(state, pool, effect.amount, ctx);
      for (const r of resolveRecipients(state, effect.who, ctx)) {
        if (r.kind === "player") gainLife(state, events, r.playerId, amount);
      }
      break;
    }
    case "loseLife": {
      const amount = computeAmount(state, pool, effect.amount, ctx);
      for (const r of resolveRecipients(state, effect.who, ctx)) {
        if (r.kind === "player") loseLife(state, events, r.playerId, amount);
      }
      break;
    }
    case "drawCards": {
      const count = computeAmount(state, pool, effect.count, ctx);
      for (const r of resolveRecipients(state, effect.who, ctx)) {
        if (r.kind === "player") {
          for (let i = 0; i < count; i++) drawCard(state, events, r.playerId);
        }
      }
      break;
    }
    case "discardCards": {
      const count = computeAmount(state, pool, effect.count, ctx);
      for (const r of resolveRecipients(state, effect.who, ctx)) {
        if (r.kind !== "player") continue;
        const hand = state.players[r.playerId].hand;
        for (let i = 0; i < count && hand.length > 0; i++) {
          const idx = effect.random ? Math.floor(nextRandom(state) * hand.length) : 0;
          const instanceId = hand[idx]!;
          moveCard(state, events, instanceId, r.playerId, "graveyard");
        }
      }
      break;
    }
    case "destroyPermanent": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") leaveBattlefield(state, pool, events, r.instanceId, "graveyard");
      }
      break;
    }
    case "returnToHand": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") leaveBattlefield(state, pool, events, r.instanceId, "hand");
      }
      break;
    }
    case "exilePermanent": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") leaveBattlefield(state, pool, events, r.instanceId, "exile");
      }
      break;
    }
    case "tapPermanent": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") {
          const ps = state.cards[r.instanceId]?.permanentState;
          if (ps && !ps.tapped) {
            ps.tapped = true;
            events.push({ kind: "permanentTapped", instanceId: r.instanceId });
          }
        }
      }
      break;
    }
    case "untapPermanent": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") {
          const ps = state.cards[r.instanceId]?.permanentState;
          if (ps && ps.tapped) {
            ps.tapped = false;
            events.push({ kind: "permanentUntapped", instanceId: r.instanceId });
          }
        }
      }
      break;
    }
    case "counterStackObject": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "stackObject") {
          counterStackObjectById(state, pool, events, r.stackObjectId);
        }
      }
      break;
    }
    case "modifyStats": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") {
          const ps = state.cards[r.instanceId]?.permanentState;
          ps?.temporaryModifiers.push({ duration: effect.duration, stats: effect.modifier });
        }
      }
      break;
    }
    case "grantKeyword": {
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") {
          const ps = state.cards[r.instanceId]?.permanentState;
          ps?.temporaryModifiers.push({ duration: effect.duration, keyword: effect.keyword });
        }
      }
      break;
    }
    case "addCounters": {
      const count = computeAmount(state, pool, effect.count, ctx);
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") {
          const ps = state.cards[r.instanceId]?.permanentState;
          if (ps) {
            ps.counters[effect.counterType] = (ps.counters[effect.counterType] ?? 0) + count;
            events.push({ kind: "countersChanged", instanceId: r.instanceId, counterType: effect.counterType, delta: count });
          }
        }
      }
      break;
    }
    case "removeCounters": {
      const count = computeAmount(state, pool, effect.count, ctx);
      for (const r of resolveRecipients(state, effect.what, ctx)) {
        if (r.kind === "permanent") {
          const ps = state.cards[r.instanceId]?.permanentState;
          if (ps) {
            const current = ps.counters[effect.counterType] ?? 0;
            const removed = Math.min(current, count);
            ps.counters[effect.counterType] = current - removed;
            events.push({ kind: "countersChanged", instanceId: r.instanceId, counterType: effect.counterType, delta: -removed });
          }
        }
      }
      break;
    }
    case "addMana": {
      const amount = computeAmount(state, pool, effect.amount, ctx);
      const pool_ = state.players[ctx.controller].manaPool;
      if (effect.color === "any") {
        pool_.colorless += amount; // Vereinfachung, siehe Datei-Kommentar oben
      } else {
        pool_[effect.color] += amount;
      }
      break;
    }
    case "createToken": {
      const count = computeAmount(state, pool, effect.count, ctx);
      for (const r of resolveRecipients(state, effect.who, ctx)) {
        if (r.kind !== "player") continue;
        for (let i = 0; i < count; i++) {
          const inst = createCardInstance(state, effect.tokenDefinitionId, r.playerId);
          moveCard(state, events, inst.instanceId, r.playerId, "battlefield");
        }
      }
      break;
    }
    case "scry": {
      // TODO(engine): erfordert Player-Entscheidung (Reihenfolge/Ablegen).
      // v0.1: No-Op, siehe Datei-Kommentar oben. An game-architect zurückmelden.
      break;
    }
    default: {
      const _exhaustive: never = effect;
      void _exhaustive;
    }
  }
}

/** Wird auch von stack.ts für Ziel-Fizzle-Fälle genutzt. */
export function counterStackObjectById(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  stackObjectId: string,
): void {
  const idx = state.stack.findIndex((o) => o.id === stackObjectId);
  if (idx === -1) return;
  const obj = state.stack[idx]!;
  state.stack.splice(idx, 1);
  if (obj.kind === "spell") {
    const card = state.cards[obj.cardInstanceId];
    if (card) {
      moveCard(state, events, obj.cardInstanceId, card.owner, "graveyard");
    }
  }
  events.push({ kind: "stackObjectCountered", stackObjectId });
}
