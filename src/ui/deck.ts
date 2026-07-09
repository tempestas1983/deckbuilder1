/**
 * Baut eine simple Demo-Deckliste aus einem CardPool.
 *
 * Kein Deckbuilder, keine Spielregel - reine Dateninitialisierung fuer die
 * Prototyp-Partie: alle Nicht-Terrain-Karten 1x, alle Terrains 4x (Deckbau-
 * Minimum von 40 Karten aus src/model/cards.ts wird damit erreicht, siehe
 * Kommentar an `Decklist`). Ein echter Deckbuilder ist ausserhalb des
 * Aufgabenbereichs dieses Schritts (frontend-engineer baut hier nur das
 * Spielbrett, kein Deckbau-UI).
 */

import type { CardPool } from "../model";

export function buildDemoDeck(pool: CardPool): Record<string, number> {
  const deck: Record<string, number> = {};
  for (const def of Object.values(pool)) {
    if (def.isToken) continue;
    deck[def.id] = def.type === "terrain" ? 4 : 1;
  }
  return deck;
}
