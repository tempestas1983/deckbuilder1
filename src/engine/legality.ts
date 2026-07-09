/**
 * Timing-/Priority-Vorprüfungen, die applyAction (Validierung) UND
 * getLegalActions (Enumeration) gemeinsam nutzen, damit beide konsistent
 * bleiben (rules-engine.md Abschnitt 2+3).
 */

import type { ActivatedAbility, CardDefinition, GameState, PlayerId } from "../model";

export function hasPriority(state: GameState, player: PlayerId): boolean {
  return state.priorityPlayer === player;
}

/** Eigener Zug, passender Main-Step, leerer Stack (Sorcery-Speed-Timing). */
export function isMainPhaseTimingOk(state: GameState, player: PlayerId): boolean {
  return (
    state.activePlayer === player &&
    (state.step === "main1" || state.step === "main2") &&
    state.stack.length === 0
  );
}

/** Darf `player` diese Kartendefinition JETZT casten (Timing, ohne Kosten/Ziele)? */
export function canCastNow(state: GameState, player: PlayerId, def: CardDefinition): boolean {
  if (!hasPriority(state, player)) return false;
  if (def.type === "spell" && def.speed === "fast") return true;
  if (def.type === "terrain") return false; // Terrains gehen über playTerrain, nicht castSpell
  return isMainPhaseTimingOk(state, player);
}

export function canPlayTerrainNow(state: GameState, player: PlayerId): boolean {
  return (
    hasPriority(state, player) &&
    isMainPhaseTimingOk(state, player) &&
    state.players[player].terrainsPlayedThisTurn < 1
  );
}

export function canActivateAbilityNow(state: GameState, player: PlayerId, ability: ActivatedAbility): boolean {
  if (!hasPriority(state, player)) return false;
  if (ability.slowOnly && !isMainPhaseTimingOk(state, player)) return false;
  return true;
}
