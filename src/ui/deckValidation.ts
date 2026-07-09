/**
 * Reine UI-seitige Deckbau-Validierung. Die Engine prüft Decklisten NICHT
 * selbst (`engine.createGame` nimmt schlicht `Record<string, number>`
 * entgegen, s. `src/engine/create-game.ts`) - die Regel "min. 40 Karten,
 * max. 4 Kopien pro id (Terrains unbegrenzt)" steht nur als Kommentar bei
 * `Decklist` (`src/model/cards.ts`). Diese Datei setzt genau diesen
 * Kommentar in eine kleine, reine Prüf-Funktion um, damit der Deckbau-Screen
 * den "Weiter"/"Spiel starten"-Button erst freigibt, wenn die Deckliste
 * plausibel ist. Keine Spielregel, keine Engine-Logik - nur UI-Gate.
 */

import type { CardPool } from "../model";

export const MIN_DECK_SIZE = 40;
export const MAX_COPIES_NON_TERRAIN = 4;

export interface DeckValidation {
  /** Gesamtzahl aller Karten (Summe aller Kopien, inkl. Terrains). */
  total: number;
  /** Non-Terrain-Einträge mit mehr als MAX_COPIES_NON_TERRAIN Kopien. */
  tooManyCopies: Array<{ id: string; name: string; count: number }>;
  valid: boolean;
  /** Kurzer, menschenlesbarer Status für die Anzeige im Deckbau-Screen. */
  statusText: string;
}

export function validateDecklist(pool: CardPool, decklist: Record<string, number>): DeckValidation {
  let total = 0;
  const tooManyCopies: Array<{ id: string; name: string; count: number }> = [];

  for (const [id, count] of Object.entries(decklist)) {
    if (!count || count <= 0) continue;
    total += count;
    const def = pool[id];
    const isTerrain = def?.type === "terrain";
    if (!isTerrain && count > MAX_COPIES_NON_TERRAIN) {
      tooManyCopies.push({ id, name: def?.name ?? id, count });
    }
  }

  const valid = total >= MIN_DECK_SIZE && tooManyCopies.length === 0;

  let statusText: string;
  if (total < MIN_DECK_SIZE) {
    statusText = `${total}/${MIN_DECK_SIZE} Karten - noch ${MIN_DECK_SIZE - total} Karte(n) nötig`;
  } else if (tooManyCopies.length > 0) {
    const names = tooManyCopies.map((t) => `${t.name} (${t.count}×)`).join(", ");
    statusText = `${total} Karten - zu viele Kopien: ${names} (max. ${MAX_COPIES_NON_TERRAIN})`;
  } else {
    statusText = `${total} Karten - Deck gültig`;
  }

  return { total, tooManyCopies, valid, statusText };
}
