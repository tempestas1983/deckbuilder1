/**
 * Seedbarer, deterministischer RNG (rules-engine.md 9.1: "Zufall ... läuft
 * über einen seedbaren RNG im GameState, damit Tests und Replays
 * deterministisch bleiben.").
 *
 * Implementierung: mulberry32 (klein, schnell, ausreichend für Mischen/
 * Münzwürfe in einem Hobby-Projekt - kein kryptographischer Anspruch).
 */

import type { GameState } from "../model";

/** Zieht die nächste Pseudozufallszahl in [0, 1) und aktualisiert rngState.counter. */
export function nextRandom(state: GameState): number {
  // mulberry32: kombiniert seed und counter zu einem 32-bit state.
  let a = (state.rngState.seed + state.rngState.counter * 0x9e3779b9) | 0;
  state.rngState.counter += 1;
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Zieht eine ganze Zahl in [0, maxExclusive). */
export function nextInt(state: GameState, maxExclusive: number): number {
  return Math.floor(nextRandom(state) * maxExclusive);
}

/** Fisher-Yates-Shuffle, deterministisch über den GameState-RNG. Mutiert das übergebene Array in-place. */
export function shuffleInPlace<T>(state: GameState, arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = nextInt(state, i + 1);
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}
