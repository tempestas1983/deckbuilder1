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
  /** v0.3 (Modal-Spells, rules-engine.md 4 + 9.13): Index in SpellCard.modes. */
  chosenMode?: number,
): string {
  moveToStack(state, events, cardInstanceId);
  const id = nextStackObjectId(state);
  const obj: StackObject = { kind: "spell", id, cardInstanceId, controller, chosenTargets, chosenX, chosenMode };
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
  /** v0.3 (rules-engine.md 4 + 9.12): Gewähltes X bei X-Kosten (analog Spells). */
  chosenX?: number,
  /** v0.3 (Modal-Fähigkeiten, rules-engine.md 4 + 9.13): Index in ActivatedAbility.modes. */
  chosenMode?: number,
): string {
  const id = nextStackObjectId(state);
  const obj: StackObject = {
    kind: "activatedAbility",
    id,
    sourceInstanceId,
    abilityIndex,
    controller,
    chosenTargets,
    chosenX,
    chosenMode,
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

  // v0.3 (Modal-Spells, rules-engine.md 4 + 9.13): Bei Resolution werden
  // ausschließlich modes[chosenMode].effects ausgeführt; der Modus wird HIER
  // nicht erneut gewählt/geprüft - nur seine Ziele (normale Fizzle-Regel).
  const isModal = def.type === "spell" && !!def.modes && def.modes.length > 0;
  const modalMode = isModal ? def.modes![obj.chosenMode ?? -1] : undefined;
  const targetSpecs = isModal
    ? modalMode?.targets
    : def.type === "spell"
      ? def.targets
      : def.type === "enchantment" && def.enchantKind === "aura"
        ? [def.auraTarget!]
        : undefined;
  const effectsToRun = isModal ? modalMode?.effects ?? [] : def.type === "spell" ? def.effects : [];
  const filtered = filterLegalTargets(state, pool, targetSpecs, obj.chosenTargets, obj.controller);

  const requiredTargets = targetSpecs?.length ?? 0;
  const allIllegal = requiredTargets > 0 && filtered.every((t) => t === undefined);
  if (allIllegal) {
    moveCard(state, events, obj.cardInstanceId, card.owner, "graveyard");
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }

  if (def.type === "spell") {
    executeEffects(state, pool, events, effectsToRun, {
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
  // v0.3: state.cards[obj.sourceInstanceId] kann fehlen, wenn die Quelle
  // inzwischen als Token endgültig entfernt wurde (SBA 7) - getDefinition("")
  // würde crashen statt sauber zu "verpuffen" (analog 9.10 Punkt 4).
  const sourceCard = state.cards[obj.sourceInstanceId];
  if (!sourceCard) {
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }
  const def = getDefinition(pool, sourceCard.definitionId);
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  const ability = abilities[obj.abilityIndex];
  if (!ability || (ability.kind !== "activated" && ability.kind !== "triggered")) {
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }

  // v0.3 (Modal-Fähigkeiten, rules-engine.md 4 + 9.13): analog zu Spells -
  // bei Resolution ausschließlich modes[chosenMode].effects, Modus wird
  // NICHT erneut gewählt/geprüft.
  const isModal = !!ability.modes && ability.modes.length > 0;
  const modalMode = isModal ? ability.modes![obj.chosenMode ?? -1] : undefined;
  const targetSpecs = isModal ? modalMode?.targets : ability.targets;
  const effectsToRun = isModal ? modalMode?.effects ?? [] : ability.effects;

  const filtered = filterLegalTargets(state, pool, targetSpecs, obj.chosenTargets, obj.controller);
  const requiredTargets = targetSpecs?.length ?? 0;
  const allIllegal = requiredTargets > 0 && filtered.every((t) => t === undefined);
  if (allIllegal) {
    events.push({ kind: "stackObjectFizzled", stackObjectId: obj.id });
    return;
  }

  executeEffects(state, pool, events, effectsToRun, {
    controller: obj.controller,
    chosenTargets: filtered,
    // v0.3 (rules-engine.md 4 + 9.12): chosenX existiert nur an "activatedAbility".
    chosenX: obj.kind === "activatedAbility" ? obj.chosenX : undefined,
    self: obj.sourceInstanceId,
    eventSubject: obj.kind === "triggeredAbility" ? obj.eventSubject : undefined,
  });
  events.push({ kind: "stackObjectResolved", stackObjectId: obj.id });
}
