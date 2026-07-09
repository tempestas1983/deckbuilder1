/**
 * Modal-Effekte "wähle eines -" (rules-engine.md 4 + Entscheidung 9.13, v0.3):
 * gemeinsame Hilfsfunktion für Spells, aktivierte und getriggerte Fähigkeiten
 * mit `modes: EffectMode[]`.
 */

import type { CardPool, EffectMode, GameState, PlayerId } from "../model";
import { enumerateLegalTargets } from "./targets";

/**
 * Indizes der aktuell WÄHLBAREN Modi: jeder Zielslot des Modus hat mindestens
 * ein legales Ziel (Modi ohne `targets` sind immer wählbar). Reihenfolge wie
 * in `modes[]`.
 */
export function selectableModeIndices(
  state: GameState,
  pool: CardPool,
  modes: EffectMode[],
  controller: PlayerId,
): number[] {
  const result: number[] = [];
  modes.forEach((mode, index) => {
    const specs = mode.targets ?? [];
    const allSlotsHaveATarget = specs.every((spec) => enumerateLegalTargets(state, pool, spec, controller).length > 0);
    if (allSlotsHaveATarget) result.push(index);
  });
  return result;
}
