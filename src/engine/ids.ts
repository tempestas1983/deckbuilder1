/**
 * Erzeugung eindeutiger IDs innerhalb einer Partie. Nutzt die monoton
 * steigenden Zähler in GameState (nextObjectNumber, nextTimestamp), damit
 * IDs deterministisch aus dem Seed/Verlauf folgen (kein Math.random/uuid).
 */

import type { GameState, InstanceId, StackObjectId } from "../model";

export function nextInstanceId(state: GameState): InstanceId {
  const id = `card${state.nextObjectNumber}`;
  state.nextObjectNumber += 1;
  return id;
}

export function nextStackObjectId(state: GameState): StackObjectId {
  const id = `stack${state.nextObjectNumber}`;
  state.nextObjectNumber += 1;
  return id;
}

export function nextTimestamp(state: GameState): number {
  const ts = state.nextTimestamp;
  state.nextTimestamp += 1;
  return ts;
}
