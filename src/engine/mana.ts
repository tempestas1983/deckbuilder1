/**
 * Mana-Bezahlung (rules-engine.md 9.5): Spieler aktiviert Mana-Fähigkeiten
 * explizit (kein Auto-Tap) -> Mana landet im ManaPool -> Casten/Aktivieren
 * konsumiert daraus. Diese Datei prüft Bezahlbarkeit und zieht Kosten ab.
 */

import type { ManaColor, ManaCost, ManaPool } from "../model";

const COLORS: ManaColor[] = ["flame", "tide", "wild", "light", "void"];

/**
 * Löst die X-Kosten in eine konkrete Gesamtkostenrechnung auf.
 * `genericDelta` (optional, Default 0) ist die Summe aller `costChange`-
 * Static-Modifier, die auf diesen Cast wirken (siehe `stats.ts#computeSpellCostDelta`).
 * Nur die GENERISCHEN Kosten werden verändert, nie Farbanteile; das Ergebnis
 * wird bei 0 gekappt (kein negativer Gesamtpreis, analog zu MTG-Kostenreduktion).
 */
export function totalGenericCost(cost: ManaCost, chosenX: number | undefined, genericDelta = 0): number {
  const x = cost.x ? chosenX ?? 0 : 0;
  return Math.max(0, (cost.generic ?? 0) + x + genericDelta);
}

export function canPayCost(pool: ManaPool, cost: ManaCost, chosenX: number | undefined, genericDelta = 0): boolean {
  if (cost.x && (chosenX === undefined || chosenX < 0)) return false;
  for (const color of COLORS) {
    const need = cost[color] ?? 0;
    if (need > pool[color]) return false;
  }
  let leftover = 0;
  for (const color of COLORS) {
    leftover += pool[color] - (cost[color] ?? 0);
  }
  leftover += pool.colorless;
  return leftover >= totalGenericCost(cost, chosenX, genericDelta);
}

/**
 * Zieht die Kosten vom Manapool ab (mutiert pool). Aufrufer muss vorher
 * canPayCost geprüft haben - diese Funktion wirft, wenn nicht bezahlbar,
 * um stille Inkonsistenzen zu vermeiden.
 */
export function payCost(pool: ManaPool, cost: ManaCost, chosenX: number | undefined, genericDelta = 0): void {
  if (!canPayCost(pool, cost, chosenX, genericDelta)) {
    throw new Error("payCost: Kosten nicht bezahlbar (canPayCost vorher prüfen)");
  }
  for (const color of COLORS) {
    const need = cost[color] ?? 0;
    pool[color] -= need;
  }
  let genericRemaining = totalGenericCost(cost, chosenX, genericDelta);
  // Generische Kosten zuerst aus Farblos, dann aus übrig gebliebenem farbigem Mana.
  const takeColorless = Math.min(pool.colorless, genericRemaining);
  pool.colorless -= takeColorless;
  genericRemaining -= takeColorless;
  for (const color of COLORS) {
    if (genericRemaining <= 0) break;
    const take = Math.min(pool[color], genericRemaining);
    pool[color] -= take;
    genericRemaining -= take;
  }
}

export function emptyManaPool(): ManaPool {
  return { flame: 0, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 };
}
