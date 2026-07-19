/**
 * Fest kuratierte Decklisten + Seed für den Tutorial-Modus (v0.1.11, s.
 * docs/frontend-status.md, Auftrag Punkt 1 + 2).
 *
 * Bewusst KLEIN und einfarbig pro Spieler (statt der zufälligen ~60-Karten-
 * `buildDemoDeck`-Mischung, s. deck.ts) — das Ziel ist Nachvollziehbarkeit,
 * nicht Balancing/Abwechslung: jede Karte hat einen klaren Zweck für genau
 * eines der in tutorialContent.ts erklärten Kernkonzepte.
 *
 * Spieler 1 (Mensch, flame): core.cinder-pup (Vanilla-Kreatur ohne
 * Fähigkeiten), core.ember-whelp (Keyword `airborne` + ETB-Trigger, exakt die
 * Beispielkarte aus docs/README.md), core.wildfire-boar (größerer Körper mit
 * `trample` fürs Angreifen/Blocken), core.fire-jolt (Zauberspruch mit Ziel,
 * Schadens-„Removal"), core.blazing-frenzy (Buff-Zauberspruch, +2/+0 bis Ende
 * des Zuges) + core.flame-ridge (Terrain/Manaquelle).
 *
 * Spieler 2 (KI, tide — andere Farbe als Spieler 1, damit die Partie nicht
 * spiegelbildlich verläuft): core.tide-scout (Vanilla-Kreatur),
 * core.harbor-warden (Keyword `guardian`, muss blocken können — zeigt eine
 * zweite Keyword-Kreatur), core.tidal-serpent (größerer Körper mit `reach`),
 * core.tidal-rebuke (Zauberspruch mit Ziel, „Bounce"-Removal, ebenfalls exakt
 * die Beispielkarte aus docs/README.md), core.tidal-surge (Buff-Zauberspruch)
 * + core.tide-cove (Terrain/Manaquelle).
 *
 * Jede Nicht-Terrain-Karte 4× (Obergrenze laut deckValidation.ts), 20×
 * Terrain -> 40 Karten pro Spieler (deckValidation.ts#MIN_DECK_SIZE) bei nur
 * sechs verschiedenen Karten pro Spieler ("kleine, überschaubare Decks" laut
 * Auftrag).
 *
 * `TUTORIAL_SEED` ist ein fester, beliebig gewählter Wert (kein
 * Balancing-Anspruch) — `createGame` verwendet ihn deterministisch für
 * Mischen/Ziehen (s. `docs/rules-engine.md`/`src/model/game-state.ts`
 * `CreateGameConfig.seed`), macht die Tutorial-Partie also reproduzierbar
 * (Auftrag Punkt 1). Keine Engine-Änderung nötig.
 *
 * Der Startspieler-Münzwurf wird für das Tutorial zusätzlich explizit
 * überschrieben (`store.ts#startTutorial` übergibt `startingPlayer:
 * "player1"` an `createGame`, s. `CreateGameConfig.startingPlayer`) — player1
 * (Mensch) soll IMMER als erstes handeln können, statt ggf. den gesamten
 * ersten Zug tatenlos zusehen zu müssen, während player2 (Bot) spielt. Nur
 * für diesen Tutorial-Pfad; normale Partien bleiben beim zufälligen
 * Münzwurf.
 */

export const TUTORIAL_SEED = 20260718;

export const TUTORIAL_DECK_PLAYER1: Record<string, number> = {
  "core.cinder-pup": 4,
  "core.ember-whelp": 4,
  "core.wildfire-boar": 4,
  "core.fire-jolt": 4,
  "core.blazing-frenzy": 4,
  "core.flame-ridge": 20,
};

export const TUTORIAL_DECK_PLAYER2: Record<string, number> = {
  "core.tide-scout": 4,
  "core.harbor-warden": 4,
  "core.tidal-serpent": 4,
  "core.tidal-rebuke": 4,
  "core.tidal-surge": 4,
  "core.tide-cove": 20,
};
