/**
 * Kleine Hilfsfunktionen rund um PlayerAction-Kandidaten aus getLegalActions,
 * um sie in der Targeting-UI adressieren zu können (kein Regel-Code, nur
 * Struktur-Zugriff auf die vom Engine-Interface gelieferten Objekte).
 */

import type { CardDefinition, ChosenTarget, PlayerAction, TargetSpec } from "../model";
import { targetKeyOf } from "./types";

/** Das einzelne gewählte Ziel eines Kandidaten (falls vorhanden). */
export function singleTargetOf(action: PlayerAction): ChosenTarget | undefined {
  if (action.kind === "castSpell" || action.kind === "activateAbility") {
    return action.chosenTargets[0];
  }
  if (action.kind === "resolveDecision" && action.choice.kind === "chooseTriggerTargets") {
    return action.choice.chosenTargets[0];
  }
  return undefined;
}

/** Baut eine Lookup-Map targetKey -> Kandidat für die Klick-Zuordnung im Board. */
export function candidatesByTargetKey(candidates: PlayerAction[]): Map<string, PlayerAction> {
  const map = new Map<string, PlayerAction>();
  for (const candidate of candidates) {
    const target = singleTargetOf(candidate);
    if (target) map.set(targetKeyOf(target), candidate);
  }
  return map;
}

// ---------------------------------------------------------------------------
// X-Kosten-Eingabe-UI (getLegalActions enumeriert X-Karten bewusst nicht,
// siehe docs/engine-status.md) - eigene, bewusst grobe "Form"-Prüfung anhand
// des TargetSpec der Karte selbst (reine Datenauskunft, keine Legalitäts-
// prüfung). applyAction bleibt die Wahrheit; ein Fehlklick zeigt schlicht den
// error-String der Engine an.
// ---------------------------------------------------------------------------

export function xTargetShapeAllowsPermanent(spec: TargetSpec, def: CardDefinition): boolean {
  if (spec.kind === "permanent") {
    if (spec.cardTypes && spec.cardTypes.length > 0) {
      return (spec.cardTypes as string[]).includes(def.type);
    }
    return true;
  }
  if (spec.kind === "unitOrPlayer") return def.type === "unit";
  return false;
}

export function xTargetShapeAllowsPlayer(spec: TargetSpec): boolean {
  return spec.kind === "player" || spec.kind === "unitOrPlayer";
}

export function xTargetShapeAllowsStackObject(spec: TargetSpec): boolean {
  return spec.kind === "stackObject";
}
