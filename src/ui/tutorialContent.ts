/**
 * Reine Textdaten für den Tutorial-Modus (v0.1.11, s. docs/frontend-status.md).
 *
 * Kein Spiellogik-Code — nur eine geordnete Liste kurzer Erklär-Texte, die
 * `store.ts` (Auslöse-Logik, welcher Tipp gerade "pending" ist) und
 * `render.ts`/`components/tutorialOverlay.ts` (Anzeige: einzelne Sprechblase
 * beim ersten Auftreten + das jederzeit abrufbare "?"-Panel mit allen Texten)
 * konsumieren. Die Reihenfolge hier ist zugleich die Anzeigereihenfolge im
 * "?"-Panel (nicht zwingend die Reihenfolge, in der die Tipps im tatsächlichen
 * Spielverlauf auftreten — das hängt vom Zufall/Zugreihenfolge ab).
 */

export type TutorialTipId =
  | "priority"
  | "terrain"
  | "creature"
  | "spell"
  | "attack"
  | "block"
  | "ability"
  | "complete";

export interface TutorialTip {
  id: TutorialTipId;
  title: string;
  body: string;
}

/**
 * Die sechs "Kernkonzepte" laut Auftrag (Punkt 3) — sind sie alle einmal
 * gezeigt worden, erscheint automatisch der Abschluss-Hinweis ("complete").
 * `ability` ist laut Auftrag optional/zusätzlich und zählt bewusst NICHT zu
 * den Kernkonzepten (das aktuelle Tutorial-Kartenset enthält keine Karte mit
 * einer eigenen, nicht-Mana-aktivierten Fähigkeit — der Tipp bleibt trotzdem
 * generisch vorbereitet, falls ein künftiges Tutorial-Deck so eine Karte
 * bekommt, s. store.ts#maybeQueueTutorialTips).
 */
export const TUTORIAL_CORE_TIP_IDS: readonly TutorialTipId[] = [
  "priority",
  "terrain",
  "creature",
  "spell",
  "attack",
  "block",
];

export const TUTORIAL_TIPS: readonly TutorialTip[] = [
  {
    id: "priority",
    title: "Mana, Phasen & Priorität",
    body: `Ein Zug läuft durch mehrere feste Phasen/Schritte (Upkeep, Draw, Main, Combat, ...). In jedem Schritt bekommen beide Spieler nacheinander "Priorität" — das heißt, sie DÜRFEN etwas tun (eine Karte spielen, eine Fähigkeit aktivieren), müssen aber nicht. "Priorität passen" bedeutet "ich möchte gerade nichts (weiteres) tun". Erst wenn BEIDE Spieler nacheinander passen, geht es zum nächsten Schritt weiter.`,
  },
  {
    id: "terrain",
    title: "Terrain spielen",
    body: `Terrains sind eure Manaquellen: Ihr dürft pro Zug genau EIN Terrain aus der Hand spielen. Einmal im Spiel liefert es per Antippen (Tap) Mana einer Farbe, mit dem ihr später Karten bezahlt.`,
  },
  {
    id: "creature",
    title: "Eine Kreatur beschwören",
    body: `Beim Ausspielen einer Kreatur bezahlt ihr ihre Mana-Kosten, danach kommt sie aufs Battlefield. Sie ist in diesem Zug noch "krank" (frisch beschworen) und kann deshalb NICHT angreifen — erst ab eurem nächsten Zug ist sie einsatzbereit (außer sie hat eine Eile-artige Fähigkeit).`,
  },
  {
    id: "spell",
    title: "Einen Zauberspruch wirken",
    body: `Zaubersprüche kosten Mana und brauchen manchmal ein Ziel (z. B. eine gegnerische Kreatur oder einen Spieler). Der Spruch landet zunächst auf dem Stack, löst danach seinen Effekt aus und wandert anschließend auf den Friedhof — er bleibt NICHT auf dem Spielfeld liegen (anders als Kreaturen).`,
  },
  {
    id: "attack",
    title: "Angreifer erklären",
    body: `In der Angriffsphase wählt der aktive Spieler aus, welche seiner einsatzbereiten Kreaturen angreifen. Erklärte Angreifer werden getappt (außer sie haben eine Ausnahme-Fähigkeit) und können vom Gegner geblockt werden.`,
  },
  {
    id: "block",
    title: "Blocker erklären",
    body: `Der verteidigende Spieler wählt aus, welche seiner ungetappten Kreaturen welchen Angreifer blocken. Danach wird der Kampfschaden gleichzeitig zugeteilt: geblockte Angreifer treffen ihre Blocker (nicht den Spieler), ungeblockte Angreifer treffen den verteidigenden Spieler direkt.`,
  },
  {
    id: "ability",
    title: "Aktivierte Fähigkeit nutzen",
    body: `Manche Karten haben eine Fähigkeit, die ihr aktiv einsetzen könnt (oft gegen Mana- und/oder Tap-Kosten) — sie steht dann als eigener Klick-Button am Permanent bereit, statt automatisch zu passieren.`,
  },
  {
    id: "complete",
    title: "Bereit fürs echte Spiel!",
    body: `Das waren die wichtigsten Grundlagen. Ihr könnt diese Partie gerne zu Ende spielen oder jederzeit über "Zurück zum Hauptmenü" aussteigen und ein echtes Deck bauen — alle Erklärungen bleiben über das "?"-Symbol weiterhin abrufbar.`,
  },
];

export function tutorialTip(id: TutorialTipId): TutorialTip {
  const tip = TUTORIAL_TIPS.find((t) => t.id === id);
  if (!tip) throw new Error(`Unbekannte TutorialTipId: ${id}`);
  return tip;
}
