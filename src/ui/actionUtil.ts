/**
 * Kleine Hilfsfunktionen rund um PlayerAction-Kandidaten aus getLegalActions,
 * um sie in der Targeting-UI adressieren zu können (kein Regel-Code, nur
 * Struktur-Zugriff auf die vom Engine-Interface gelieferten Objekte).
 */

import type { CardDefinition, CardPool, ChosenTarget, EffectMode, GameState, InstanceId, PlayerAction, PlayerId, TargetSpec } from "../model";
import { cardDef } from "./cardInfo";
import { targetKeyOf, type CastSource } from "./types";

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

// ---------------------------------------------------------------------------
// CastSource-Helfer (v0.3, rules-engine.md 4/9.12/9.13): vereinheitlichen
// castSpell (Handkarte) und activateAbility (Battlefield-Fähigkeit) für den
// gemeinsamen Modus-/X-/Ziel-Eingabe-Flow (types.ts#UiMode "modeSelect"/
// "xInput"/"xTarget"). Reines Auslesen von CardPool/GameState-Daten (kein
// Regel-Code) + Bau der finalen PlayerAction - dieselbe Abgrenzung wie beim
// Rest dieser Datei.
// ---------------------------------------------------------------------------

function sourceInstanceIdOf(source: CastSource): InstanceId {
  return source.kind === "spell" ? source.cardInstanceId : source.sourceInstanceId;
}

/** Kartenname der Quelle (Anzeige in Modus-/X-Panels). */
export function sourceName(pool: CardPool, state: GameState, source: CastSource): string {
  return cardDef(pool, state, sourceInstanceIdOf(source)).name;
}

/** Modi der Quelle, falls modal (SpellCard.modes bzw. ActivatedAbility.modes am gewählten abilityIndex). */
export function sourceModes(pool: CardPool, state: GameState, source: CastSource): EffectMode[] | undefined {
  const def = cardDef(pool, state, sourceInstanceIdOf(source));
  if (source.kind === "spell") {
    return def.type === "spell" ? def.modes : undefined;
  }
  const ability = "abilities" in def ? def.abilities?.[source.abilityIndex] : undefined;
  return ability?.kind === "activated" ? ability.modes : undefined;
}

/** true, wenn die Quelle X-Kosten hat (Spell-cost.x bzw. ActivatedAbility.manaCost.x). */
export function sourceHasXCost(pool: CardPool, state: GameState, source: CastSource): boolean {
  const def = cardDef(pool, state, sourceInstanceIdOf(source));
  if (source.kind === "spell") {
    return "cost" in def && !!def.cost.x;
  }
  const ability = "abilities" in def ? def.abilities?.[source.abilityIndex] : undefined;
  return ability?.kind === "activated" ? !!ability.manaCost?.x : false;
}

/**
 * Zielslots der Quelle - bei gesetztem chosenMode die des gewählten Modus
 * (9.13: "chosenTargets beziehen sich dann auf die targets DIESES Modus"),
 * sonst die Top-Level-targets von Spell/Fähigkeit.
 */
export function sourceTargets(
  pool: CardPool,
  state: GameState,
  source: CastSource,
  chosenMode?: number,
): TargetSpec[] | undefined {
  if (chosenMode !== undefined) {
    return sourceModes(pool, state, source)?.[chosenMode]?.targets;
  }
  const def = cardDef(pool, state, sourceInstanceIdOf(source));
  if (source.kind === "spell") {
    return def.type === "spell" ? def.targets : undefined;
  }
  const ability = "abilities" in def ? def.abilities?.[source.abilityIndex] : undefined;
  return ability?.kind === "activated" ? ability.targets : undefined;
}

/** Baut die finale castSpell-/activateAbility-Aktion aus einer CastSource + gesammelten Eingaben. */
export function buildCastAction(
  source: CastSource,
  player: PlayerId,
  chosenTargets: ChosenTarget[],
  chosenX?: number,
  chosenMode?: number,
): PlayerAction {
  if (source.kind === "spell") {
    return { kind: "castSpell", player, cardInstanceId: source.cardInstanceId, chosenTargets, chosenX, chosenMode };
  }
  return {
    kind: "activateAbility",
    player,
    sourceInstanceId: source.sourceInstanceId,
    abilityIndex: source.abilityIndex,
    chosenTargets,
    chosenX,
    chosenMode,
  };
}

/** Alle activateAbility-Kandidaten aus getLegalActions für eine bestimmte Quelle, sauber getypt. */
export function activateAbilityCandidatesFor(
  candidates: PlayerAction[],
  sourceInstanceId: InstanceId,
): Array<Extract<PlayerAction, { kind: "activateAbility" }>> {
  return candidates.filter(
    (a): a is Extract<PlayerAction, { kind: "activateAbility" }> =>
      a.kind === "activateAbility" && a.sourceInstanceId === sourceInstanceId,
  );
}
