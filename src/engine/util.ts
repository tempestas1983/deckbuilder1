import type { GameState, PlayerId } from "../model";
import { emptyManaPool } from "./mana";

/** Der jeweils andere Spieler (v0.1: exakt 2 Spieler, rules-engine.md 1). */
export function otherPlayer(state: GameState, player: PlayerId): PlayerId {
  const ids = Object.keys(state.players) as PlayerId[];
  const other = ids.find((p) => p !== player);
  if (!other) throw new Error(`otherPlayer: kein zweiter Spieler gefunden (player=${player})`);
  return other;
}

/** "Der Manapool leert sich am Ende jedes Steps und jeder Phase" (rules-engine.md 1). */
export function clearAllManaPools(state: GameState): void {
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    state.players[playerId].manaPool = emptyManaPool();
  }
}
