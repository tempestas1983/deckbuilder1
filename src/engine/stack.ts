/**
 * Stack: Aufbau (Spell/Ability casten/aktivieren) und Resolution
 * (rules-engine.md Abschnitt 4). v0.1 deckt den einfachen Fall (ein Objekt,
 * keine Interaktion mit weiteren Triggern beim Resolven selbst) vollständig
 * ab; mehrere gleichzeitig wartende Trigger folgen dem APNAP-Modell aus
 * triggers.ts.
 */

import type {
  CardPool,
  ChosenTarget,
  GameEvent,
  GameState,
  InstanceId,
  PlayerId,
  StackObject,
} from "../model";
import { getDefinition } from "./card-defs";
import { nextStackObjectId } from "./ids";
import { moveCard, moveToStack } from "./zones";
import { filterLegalTargets } from "./targets";
import { executeEffects } from "./effects";
import { fireEnterBattlefieldTriggers } from "./triggers";

export function pushSpellToStack(
  state: GameState,
  events: GameEvent[],
  cardInstanceId: InstanceId,
  controller: PlayerId,
  chosenTargets: ChosenTarget[],
  chosenX: number | undefined,
): string {
  moveToStack(state, events, cardInstanceId);
  const id = nextStackObjectId(state);
  const obj: StackObject = { kind: "spell", id, cardInstanceId, controller, chosenTargets, chosenX };
  state.stack.push(obj);
  events.push({ kind: "spellCast", stackObjectId: id, cardInstanceId });
  return id;
}

export function pushActivatedAbilityToStack(
  state: GameState,
  events: GameEvent[],
  sourceInstanceId: InstanceId,
  abilityIndex: number,
  controller: PlayerId,
  chosenTargets: ChosenTarget[],
): string {
  const id = nextStackObjectId(state);
  const obj: StackObject = {
    kind: "activatedAbility",
    id,
    sourceInstanceId,
    abilityIndex,
    controller,
    chosenTargets,
  };
  state.stack.push(obj);
  events.push({ kind: "abilityActivated", stackObjectId: id, sourceInstanceId });
  return id;
}

/** Resolvt das oberste Stack-Objekt (falls vorhanden). No-Op bei leerem Stack. */
export function resolveTopOfStack(state: GameState, pool: CardPool, events: GameEvent[]): void {
  const obj = state.stack.pop();
  if (!obj) return;

  if (obj.kind === "spell") {
    resolveSpell(state, pool, events, obj);
  } else {
    resolveAbilityObject(state, pool, events, obj);
  }
}

function resolveSpell(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  obj: Extract<StackObject, { kind: "spell" }>,
): void {
  const card = state.cards[obj.cardInstanceId];
  if (!card) return;
  const def = getDefinition(pool, card.definitionId);

  const targetSpecs =
    def.type === "spell" ? def.targets : def.type === "enchantment" && def.enchantKind === "aura" ? [def.auraTarget!] : undefined;
  const filtered = filterLegalTargets(state, pool, targetSpecs, obj.chosenTargets, obj.controller);

  const requiredTargets = targetSpecs?.length ?? 0;
  const allIllegal = requiredTargets > 0 && filtered.every((t) => t === undefined);
  if (allIllegal) {
    moveCard(state, events, obj.cardInstanceId, card.owner, "graveyard");
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }

  if (def.type === "spell") {
    executeEffects(state, pool, events, def.effects, {
      controller: obj.controller,
      chosenTargets: filtered,
      chosenX: obj.chosenX,
      self: obj.cardInstanceId,
    });
    moveCard(state, events, obj.cardInstanceId, card.owner, "graveyard");
    events.push({ kind: "stackObjectResolved", stackObjectId: obj.id });
    return;
  }

  // unit / relic / enchantment: wird zum Permanent auf dem Battlefield.
  moveCard(state, events, obj.cardInstanceId, card.controller, "battlefield");
  if (def.type === "enchantment" && def.enchantKind === "aura") {
    const attachTarget = filtered[0];
    if (attachTarget?.kind === "permanent") {
      card.permanentState!.attachedTo = attachTarget.instanceId;
      state.cards[attachTarget.instanceId]?.permanentState?.attachments.push(obj.cardInstanceId);
    }
  }
  if (def.type !== "unit") {
    // Nicht-Units haben keine Summoning Sickness (rules-engine.md 8).
    card.permanentState!.summoningSick = false;
  }
  events.push({ kind: "stackObjectResolved", stackObjectId: obj.id });
  fireEnterBattlefieldTriggers(state, pool, obj.cardInstanceId);
}

function resolveAbilityObject(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  obj: Extract<StackObject, { kind: "activatedAbility" | "triggeredAbility" }>,
): void {
  const def = getDefinition(pool, state.cards[obj.sourceInstanceId]?.definitionId ?? "");
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  const ability = abilities[obj.abilityIndex];
  if (!ability || (ability.kind !== "activated" && ability.kind !== "triggered")) {
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }

  const targetSpecs = ability.targets;
  const filtered = filterLegalTargets(state, pool, targetSpecs, obj.chosenTargets, obj.controller);
  const requiredTargets = targetSpecs?.length ?? 0;
  const allIllegal = requiredTargets > 0 && filtered.every((t) => t === undefined);
  if (allIllegal) {
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }

  executeEffects(state, pool, events, ability.effects, {
    controller: obj.controller,
    chosenTargets: filtered,
    self: obj.sourceInstanceId,
    eventSubject: obj.kind === "triggeredAbility" ? obj.eventSubject : undefined,
  });
  events.push({ kind: "stackObjectResolved", stackObjectId: obj.id });
}
