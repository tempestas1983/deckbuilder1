/**
 * Ziel-Legalität: Prüfung (für Cast/Aktivierung und Resolution-Recheck,
 * rules-engine.md Abschnitt 4 "Target-Recheck bei Resolution") sowie
 * Enumeration legaler Ziele (für getLegalActions).
 *
 * v0.1-Vereinfachung: enumerateLegalTargets wird nur für einzelne Zielslots
 * gebraucht (unsere Test-/Beispielkarten haben höchstens einen Slot); für
 * mehrere Slots mit Abhängigkeiten (z.B. "zwei verschiedene Ziele") wäre eine
 * kombinatorische Erweiterung nötig - hier als TODO markiert.
 */

import type {
  CardPool,
  ChosenTarget,
  ControllerFilter,
  GameState,
  PlayerId,
  TargetSpec,
} from "../model";
import { getDefinition } from "./card-defs";

function controllerMatches(
  filter: ControllerFilter | undefined,
  abilityController: PlayerId,
  candidateController: PlayerId,
): boolean {
  if (!filter || filter === "any") return true;
  if (filter === "own") return candidateController === abilityController;
  return candidateController !== abilityController; // "opponent"
}

export function isLegalTarget(
  state: GameState,
  pool: CardPool,
  spec: TargetSpec,
  chosen: ChosenTarget,
  abilityController: PlayerId,
): boolean {
  switch (spec.kind) {
    case "permanent": {
      if (chosen.kind !== "permanent") return false;
      const card = state.cards[chosen.instanceId];
      if (!card || !card.permanentState) return false;
      const def = getDefinition(pool, card.definitionId);
      if (spec.cardTypes && spec.cardTypes.length > 0 && !spec.cardTypes.includes(def.type as any)) {
        return false;
      }
      if (!controllerMatches(spec.controller, abilityController, card.controller)) return false;
      if (spec.mustBeTapped && !card.permanentState.tapped) return false;
      if (spec.mustBeAttacking && card.permanentState.combat?.role !== "attacker") return false;
      return true;
    }
    case "player": {
      if (chosen.kind !== "player") return false;
      return controllerMatches(spec.controller, abilityController, chosen.playerId);
    }
    case "unitOrPlayer": {
      if (chosen.kind === "player") {
        return controllerMatches(spec.controller, abilityController, chosen.playerId);
      }
      if (chosen.kind === "permanent") {
        const card = state.cards[chosen.instanceId];
        if (!card || !card.permanentState) return false;
        const def = getDefinition(pool, card.definitionId);
        if (def.type !== "unit") return false;
        return controllerMatches(spec.controller, abilityController, card.controller);
      }
      return false;
    }
    case "stackObject": {
      if (chosen.kind !== "stackObject") return false;
      const obj = state.stack.find((o) => o.id === chosen.stackObjectId);
      if (!obj) return false;
      if (!spec.objectKind || spec.objectKind === "any") return true;
      if (spec.objectKind === "spell") return obj.kind === "spell";
      return obj.kind === "activatedAbility" || obj.kind === "triggeredAbility";
    }
    default:
      return false;
  }
}

/** Enumeriert alle aktuell legalen Ziele für EINEN Zielslot. */
export function enumerateLegalTargets(
  state: GameState,
  pool: CardPool,
  spec: TargetSpec,
  abilityController: PlayerId,
): ChosenTarget[] {
  const result: ChosenTarget[] = [];
  const playerIds = Object.keys(state.players) as PlayerId[];

  if (spec.kind === "player" || spec.kind === "unitOrPlayer") {
    for (const pid of playerIds) {
      const candidate: ChosenTarget = { kind: "player", playerId: pid };
      if (isLegalTarget(state, pool, spec, candidate, abilityController)) result.push(candidate);
    }
  }
  if (spec.kind === "permanent" || spec.kind === "unitOrPlayer") {
    for (const pid of playerIds) {
      for (const instanceId of state.players[pid].battlefield) {
        const candidate: ChosenTarget = { kind: "permanent", instanceId };
        if (isLegalTarget(state, pool, spec, candidate, abilityController)) result.push(candidate);
      }
    }
  }
  if (spec.kind === "stackObject") {
    for (const obj of state.stack) {
      const candidate: ChosenTarget = { kind: "stackObject", stackObjectId: obj.id };
      if (isLegalTarget(state, pool, spec, candidate, abilityController)) result.push(candidate);
    }
  }
  return result;
}

/** Prüft, ob für jeden Slot mindestens ein legales Ziel gewählt wurde. Leere targets-Liste = immer legal. */
export function areAllTargetsLegal(
  state: GameState,
  pool: CardPool,
  specs: TargetSpec[] | undefined,
  chosen: ChosenTarget[],
  abilityController: PlayerId,
): boolean {
  if (!specs || specs.length === 0) return true;
  if (chosen.length !== specs.length) return false;
  return specs.every((spec, i) => isLegalTarget(state, pool, spec, chosen[i]!, abilityController));
}

/**
 * Für die Resolution: liefert je Slot das gewählte Ziel zurück, wenn (noch)
 * legal, sonst `undefined` ("Sind nur manche Ziele illegal, resolvt der Rest",
 * rules-engine.md Abschnitt 4). Effekte, die auf einen undefined-Slot
 * verweisen, laufen dadurch ins Leere (siehe effects.ts resolveRecipients).
 */
export function filterLegalTargets(
  state: GameState,
  pool: CardPool,
  specs: TargetSpec[] | undefined,
  chosen: ChosenTarget[],
  abilityController: PlayerId,
): Array<ChosenTarget | undefined> {
  if (!specs || specs.length === 0) return [];
  return specs.map((spec, i) => {
    const c = chosen[i];
    if (!c) return undefined;
    return isLegalTarget(state, pool, spec, c, abilityController) ? c : undefined;
  });
}

/** Für den Resolution-Recheck: wie viele der ursprünglich gewählten Ziele sind noch legal? */
export function countLegalTargets(
  state: GameState,
  pool: CardPool,
  specs: TargetSpec[] | undefined,
  chosen: ChosenTarget[],
  abilityController: PlayerId,
): number {
  if (!specs || specs.length === 0) return 0;
  return chosen.filter((c, i) => specs[i] && isLegalTarget(state, pool, specs[i]!, c, abilityController)).length;
}
