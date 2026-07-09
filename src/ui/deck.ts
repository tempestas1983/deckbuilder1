/**
 * Baut eine simple Demo-Deckliste aus einem CardPool.
 *
 * Kein Deckbuilder, keine Spielregel - reine Dateninitialisierung fuer die
 * Prototyp-Partie.
 *
 * v0.1 (Kartenpool: 27 Karten, 22 davon Nicht-Terrain): "1x jede
 * Nicht-Terrain-Karte + 4x jedes Terrain" ergab ein handhabbares
 * ~42-Karten-Deck und erfuellte nebenbei das 40-Karten-Minimum aus dem
 * `Decklist`-Kommentar (src/model/cards.ts).
 *
 * v0.1.4: Der Kartenpool ist auf 109 Karten (104 Nicht-Terrain) gewachsen.
 * "Alles einmal" wuerde jetzt zu einem ~124-Karten-Deck pro Spieler fuehren -
 * fuer eine Hotseat-Demo unhandlich (sehr lange Partien, unuebersichtliche
 * Bibliothek/Hand). Die Deckgroesse darf daher nicht mehr linear mit dem
 * Kartenpool mitwachsen:
 *
 * - Terrains: weiterhin fest 4x jedes Terrain (mana-relevant, Pool bleibt mit
 *   5 Terrains klein genug, dass "alle" sinnvoll bleibt und jede Manafarbe
 *   garantiert verfuegbar ist).
 * - Nicht-Terrain: eine zufaellige Stichprobe ohne Zurücklegen von bis zu
 *   NON_TERRAIN_TARGET Karten (je 1x) statt des kompletten Pools. Ist der
 *   Pool kleiner als das Ziel (wie noch beim 27-Karten-Set), wird schlicht
 *   der gesamte Nicht-Terrain-Pool genommen - das reproduziert exakt das
 *   alte ~42-Karten-Verhalten fuer kleine Pools, deckelt aber gross
 *   wachsende Pools auf eine feste Zielgroesse.
 *
 * Ergebnis bei 109 Karten: min(104, 40) + 5*4 = 40 + 20 = 60 Karten - im
 * "40-60 Karten"-Rahmen, den schon der Kommentar am Anfang von
 * src/cards/starter-set.ts fuer den vollen "core"-Pool vorsieht.
 *
 * Bewusst NICHT deterministisch/geseedet: Die Zusammensetzung des
 * Demo-Decks ist reine Vorbereitung vor `engine.createGame` (das seinen
 * eigenen, deterministischen Seed fuer Mischen/Ziehen bekommt, siehe
 * store.ts#initGame) - eine bei jedem Aufruf leicht variierende
 * Deckzusammenstellung ist fuer die Demo eher ein Feature (mehr
 * Karten-Abwechslung) als ein Problem.
 *
 * v0.1.5: Es gibt jetzt einen echten Deckbau-Screen (siehe
 * components/deckBuilder.ts) - diese Funktion wird nicht mehr automatisch
 * beim App-Start fuer beide Spieler aufgerufen, sondern dient dort als
 * "Zufaellig fuellen"-Button (ein Ausgangspunkt, den der Spieler danach per
 * +/- Buttons weiter anpassen kann). Bewusst NICHT geloescht - genau dafuer
 * war sie laut "Naechste Schritte" Punkt 6 (v0.1.4-Stand) vorgesehen.
 */

import type { CardPool } from "../model";

/** Feste Kopienzahl pro Terrain (unveraendert seit v0.1). */
const TERRAIN_COPIES = 4;

/** Ziel-Obergrenze fuer verschiedene Nicht-Terrain-Karten im Demo-Deck. */
const NON_TERRAIN_TARGET = 40;

export function buildDemoDeck(pool: CardPool): Record<string, number> {
  const deck: Record<string, number> = {};
  const nonTerrainIds: string[] = [];

  for (const def of Object.values(pool)) {
    if (def.isToken) continue;
    if (def.type === "terrain") {
      deck[def.id] = TERRAIN_COPIES;
    } else {
      nonTerrainIds.push(def.id);
    }
  }

  const sampleSize = Math.min(NON_TERRAIN_TARGET, nonTerrainIds.length);
  for (const id of sampleWithoutReplacement(nonTerrainIds, sampleSize)) {
    deck[id] = 1;
  }

  return deck;
}

/** Fisher-Yates-Teilshuffle: liefert `count` zufaellig gewaehlte, verschiedene Elemente aus `items`. */
function sampleWithoutReplacement<T>(items: readonly T[], count: number): T[] {
  const pool = items.slice();
  const result: T[] = [];
  for (let i = pool.length - 1; i >= 0 && result.length < count; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    result.push(pool[j]!);
    pool[j] = pool[i]!;
  }
  return result;
}
