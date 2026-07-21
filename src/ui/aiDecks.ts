/**
 * Kuratierte Archetyp-Decklisten für den KI-Gegner (Card-Designer, erste
 * Reihe — s. Auftrag "KI-Deck-Kuratierung", 2026-07-20).
 *
 * Hintergrund: Bisher zieht eine neue Partie gegen die KI ihr Deck über
 * `buildDemoDeck` (src/ui/deck.ts) — eine rein zufällige Ziehung von bis zu
 * 40 verschiedenen Nicht-Terrain-Karten quer über ALLE 5 Farben, ohne jede
 * Farbfokussierung oder Kurven-/Synergie-Überlegung. Diese Datei liefert
 * stattdessen echte, von Hand aus dem "core"-Pool (`src/cards/starter-set.ts`,
 * 300 Karten, Überblick in `docs/cards/starter-set.md`) zusammengestellte
 * 2-Farben-Archetypen (plus einer bewussten Mono-Ausnahme), jede mit klarer
 * Identität, echter Mana-Kurve und Deckbau-typischen Kopienzahlen (bis zu 4
 * pro Nicht-Terrain-Karte, s. `deckValidation.ts`). Die technische
 * Verdrahtung (KI zieht beim Partiestart aus einem dieser Decks statt aus
 * `buildDemoDeck`) ist NICHT Teil dieser Datei — das übernimmt der
 * frontend-engineer separat.
 *
 * Format je Deck: `Record<Karten-ID, Kopienzahl>`, Stil/Struktur angelehnt
 * an `src/ui/tutorialDeck.ts` (Kartenpool-IDs, keine Engine-Logik hier).
 * Jedes Deck landet bei ~60 Karten (Richtwert wie `buildDemoDeck`s
 * Zielgröße), mit echten Schwerpunktkarten (3-4 Kopien) statt "1x von
 * allem" wie im bewusst minimalistischen Tutorial-Deck. Terrain-Anzahl ist
 * NICHT auf die feste 4x-Regel aus `buildDemoDeck` beschränkt (Terrains
 * unterliegen laut `deckValidation.ts#MAX_COPIES_NON_TERRAIN` ohnehin keiner
 * Kopiengrenze) — hier je nach Deck 18-22 Terrains, aufgeteilt auf die
 * jeweiligen Deckfarben, für eine verlässliche Manabasis.
 *
 * Auswahl der Kombinationen (Auftrag: "wohl meist 2 Farben, selten auch mal
 * 3 oder nur eine Farbe", NICHT alle 10 Zwei-Farben-Paare durchdeklinieren):
 * bewusst nur 6 der 10 möglichen Farbpaare gewählt, und zwar die mit der
 * klarsten mechanischen Synergie im tatsächlichen Kartenpool, plus eine
 * Mono-Variante als bewusste Ausnahme (s. Farbthemen unten). Nicht
 * verwendete Paare (flame-tide, flame-light, wild-tide, light-void) wurden
 * geprüft, aber bewusst ausgelassen, weil ihre Farbthemen im Pool weniger
 * klar ineinandergreifen als die sechs gewählten Paare.
 *
 * Farbthemen (s. docs/cards/starter-set.md für Details):
 * - flame: Aggression, Direktschaden, swift/airborne/firstStrike.
 * - tide: Tempo, Kartenvorteil, Bounce/Tap, vigilant/lifelink/firstStrike.
 * - wild: Wachstum (+1/+1-Marken), große/zähe Körper, trample/guardian,
 *   Token-Erzeugung.
 * - light: Lebensgewinn, Verteidigung (guardian/hohe Toughness), Token-
 *   Erzeugung.
 * - void: Opfer/Tod-Trigger (Kartenzug/Schaden/Marken beim Sterben),
 *   bedingungslose Entfernung, Drain (Schaden+Lebensgewinn).
 *
 * Die 7 Decks dieser ersten Reihe:
 * 1. Flame-Wild "Sengende Wildnis" (Aggro/Stampede)
 * 2. Tide-Light "Gezeiten der Standhaftigkeit" (Kontrolle/Verteidigung)
 * 3. Flame-Void "Aschen des Untergangs" (Aggro-Opfer)
 * 4. Wild-Light "Wächter des Hains" (Midrange, Marken/Token)
 * 5. Void-Wild "Verrottender Wildwuchs" (Midrange, Attrition/Token-Tod-Wert)
 * 6. Tide-Void "Strömung der Verdammnis" (Kontrolle/Kartenvorteil)
 * 7. Mono-Flame "Reiner Zorn" (reines Aggro, bewusste Ein-Farb-Ausnahme)
 *
 * Alle Karten-IDs wurden gegen `src/cards/starter-set.ts` geprüft (Kosten,
 * Statlines, Fähigkeitstexte); keine Engine-Ausführung/Simulation wurde
 * durchgeführt (dieser Agent hat keinen Werkzeugzugriff darauf) — die
 * Zusammenstellung beruht auf sorgfältiger manueller Pool-Durchsicht
 * (Kostenverteilung, Farbverteilung, Kreatur-/Zauber-Mix, Mana-Kurve).
 */

// ---------------------------------------------------------------------
// 1. Flame-Wild — "Sengende Wildnis" (Aggro/Stampede)
// ---------------------------------------------------------------------
//
// Spielidee: frühe, günstige Flamme-Angreifer (swift/firstStrike, viele
// 1-2-Mana-Körper) erzeugen ab Zug 1-2 Druck; Wildnis liefert ab Zug 3
// zähere Trample-Körper, die auch gegen Blocker durchkommen, und
// core.overgrowth-colossus als Curve-Topper. Direktschaden
// (core.fire-jolt/core.flame-lance) räumt Blocker aus dem Weg oder geht
// direkt aufs Gesicht, wenn das Board schon dominiert.
// Schlüsselkarten: core.wildfire-boar (3/3 Trample für 3, früher
// Dauerdruck), core.cinderborn-raider (effektiv 3/1 swift für 2 Mana,
// aggressivste 2-Drop-Rate im Set), core.overgrowth-colossus (5/4
// Trample, schließt Spiele, die das frühe Tempo nicht schon entschieden
// hat).
export const AI_DECK_FLAME_WILD_AGGRO: Record<string, number> = {
  // Units — flame
  "core.cinder-pup": 3,
  "core.emberpaw-cub": 3,
  "core.brandblade-fledgling": 2,
  "core.cinderborn-raider": 4,
  "core.ash-duelist": 2,
  "core.wildfire-boar": 4,
  "core.raidhorn-berserker": 2,
  // Units — wild
  "core.thicket-fang": 2,
  "core.grove-calf": 2,
  "core.thornrush-sprinter": 2,
  "core.thornhide-brawler": 3,
  "core.overgrowth-colossus": 2,
  // Spells
  "core.fire-jolt": 3,
  "core.flame-lance": 2,
  "core.blazing-frenzy": 2,
  "core.bramble-surge": 2,
  // Terrain (Mana-Basis, flame leicht schwerer wegen mehr Ein-Pip-1-2-Drops)
  "core.flame-ridge": 11,
  "core.wild-glade": 9,
};

// ---------------------------------------------------------------------
// 2. Tide-Light — "Gezeiten der Standhaftigkeit" (Kontrolle/Verteidigung)
// ---------------------------------------------------------------------
//
// Spielidee: zähe, defensive Körper (guardian/hohe Toughness) und Tempo-
// Werkzeuge (Bounce, Tap-down) verzögern den Gegner, während Kartenvorteil
// (core.current-seer, core.current-diplomat) und Lebensgewinn
// (core.healing-light) das Spiel in die Länge ziehen, bis
// core.sunforged-colossus oder ein Abnutzungsvorteil das Spiel entscheidet.
// Schlüsselkarten: core.harbor-warden (1/5 guardian für 2 Mana, extrem
// früher Blocker), core.tidal-rebuke (Bounce-Tempo/-Antwort auf alles),
// core.banishment-rite (bedingungslose Entfernung als Notbremse).
export const AI_DECK_TIDE_LIGHT_CONTROL: Record<string, number> = {
  // Units — tide
  "core.tide-scout": 2,
  "core.current-seer": 3,
  "core.tide-warden": 3,
  "core.harbor-warden": 3,
  "core.tidal-serpent": 3,
  "core.current-diplomat": 2,
  // Units — light
  "core.dawn-medic": 2,
  "core.wardlight-acolyte": 2,
  "core.temple-sentinel": 2,
  "core.sunforged-colossus": 2,
  // Spells
  "core.tidal-rebuke": 3,
  "core.riptide-snare": 2,
  "core.healing-light": 3,
  "core.aegis-ward": 2,
  "core.banishment-rite": 2,
  "core.wither-touch": 2,
  // Terrain
  "core.tide-cove": 11,
  "core.light-altar": 11,
};

// ---------------------------------------------------------------------
// 3. Flame-Void — "Aschen des Untergangs" (Aggro-Opfer)
// ---------------------------------------------------------------------
//
// Spielidee: aggressive, bewusst zerbrechliche Körper, die im Kampf oder
// Zusatzwert liefern, wenn sie sterben (core.cinderwake-marauder,
// core.husk-crawler, core.plaguebound-wretch) — jeder Kampftod des
// Gegners ist gut für dich. Void liefert dazu bedingungslose Entfernung
// (core.doomreap-edict) und Drain-Spells, die gleichzeitig Druck machen
// und Leben abfedern.
// Schlüsselkarten: core.gravebound-oracle (2/4-„Removal-Magnet", der bei
// JEDEM Tod zwei Karten zieht — auch bei destroyPermanent-Entfernung),
// core.cinderwake-marauder (3/1 für 2 Mana, Schaden beim Sterben),
// core.doomreap-edict (günstige, bedingungslose Kreatur-Entfernung).
export const AI_DECK_FLAME_VOID_SACRIFICE: Record<string, number> = {
  // Units — flame
  "core.cinder-pup": 3,
  "core.emberborn-sprinter": 2,
  "core.cinderwake-marauder": 3,
  "core.raidhorn-berserker": 2,
  "core.ash-duelist": 2,
  // Units — void
  "core.pit-reaver": 2,
  "core.husk-crawler": 3,
  "core.grave-viper": 2,
  "core.plaguebound-wretch": 3,
  "core.gravebound-oracle": 2,
  // Spells
  "core.fire-jolt": 4,
  "core.hexbind-lash": 3,
  "core.doomreap-edict": 3,
  "core.soul-siphon": 2,
  "core.blazing-frenzy": 2,
  // Terrain
  "core.flame-ridge": 11,
  "core.void-rift": 11,
};

// ---------------------------------------------------------------------
// 4. Wild-Light — "Wächter des Hains" (Midrange, Marken/Token)
// ---------------------------------------------------------------------
//
// Spielidee: solides, zähes Midrange mit +1/+1-Marken-Wachstum
// (core.moss-elder, core.twinroot-blessing) und Token-Breite
// (core.aureate-caller, core.seedling-swarm), abgesichert durch
// Lebensgewinn (core.sun-acolyte, core.healing-light) und guardian-
// Blocker. Beide Farben teilen sich dieselbe "größer/zäher werden und
// aussitzen"-Spielweise, bis core.overgrowth-colossus oder
// core.sunforged-colossus das Spiel für sich entscheiden.
// Schlüsselkarten: core.twinroot-blessing (verteilt dauerhaftes
// Wachstum auf zwei Körper für nur 2 Mana), core.stonebark-elder (4/4
// vigilant, blockt UND greift an), core.sun-acolyte (2/2 lifelink,
// stabilisiert früh).
export const AI_DECK_WILD_LIGHT_MIDRANGE: Record<string, number> = {
  // Units — wild
  "core.grove-calf": 3,
  "core.moss-elder": 3,
  "core.thornwarden-ascetic": 2,
  "core.bramblehide-sentinel": 3,
  "core.stonebark-elder": 2,
  "core.overgrowth-colossus": 2,
  // Units — light
  "core.dawn-medic": 2,
  "core.sun-acolyte": 3,
  "core.aureate-caller": 2,
  "core.sunforged-colossus": 2,
  // Spells
  "core.twinroot-blessing": 4,
  "core.wildroot-graft": 2,
  "core.healing-light": 2,
  "core.seedling-swarm": 2,
  "core.aegis-ward": 2,
  "core.bramble-surge": 2,
  // Terrain
  "core.wild-glade": 12,
  "core.light-altar": 10,
};

// ---------------------------------------------------------------------
// 5. Void-Wild — "Verrottender Wildwuchs" (Midrange, Attrition)
// ---------------------------------------------------------------------
//
// Spielidee: Grind-Midrange, bei dem so gut wie jeder eigene Verlust
// direkt in Wert umgewandelt wird — sterbende Wild-Einheiten hinterlassen
// Token (core.mosswake-drifter), sterbende Void-Einheiten liefern
// Kartenzug oder -1/-1-Marken (core.husk-crawler, core.plaguebound-wretch,
// core.gravebound-oracle). Token-Erzeugung aus beiden Farben
// (core.grimspawn-channeler, core.gravecall-summoner, core.thornseed-
// caller) füllt das Board mit Opfermaterial, während core.doomreap-edict/
// core.rootbane-wither das gegnerische Board gezielt abräumen.
// Schlüsselkarten: core.gravebound-oracle (2 Karten bei JEDEM Tod, auch
// durch gegnerisches Removal), core.mosswake-drifter (hinterlässt beim
// Sterben einen 1/1-Sprössling — Opfermaterial erneuert sich selbst),
// core.doomreap-edict (bedingungslose Entfernung, löst gegnerische
// onDeath-Trigger NICHT eigenständig aus, räumt aber Blocker weg).
export const AI_DECK_VOID_WILD_ATTRITION: Record<string, number> = {
  // Units — wild
  "core.mosswake-drifter": 3,
  "core.verdant-shaman": 2,
  "core.thornwild-forager": 2,
  "core.thornseed-caller": 2,
  "core.overgrowth-colossus": 2,
  // Units — void
  "core.husk-crawler": 3,
  "core.plaguebound-wretch": 3,
  "core.grimspawn-channeler": 2,
  "core.gravecall-summoner": 2,
  "core.gravebound-oracle": 2,
  // Spells
  "core.rootbane-wither": 2,
  "core.doomreap-edict": 3,
  "core.grave-legion": 2,
  "core.seedling-swarm": 2,
  "core.wildroot-graft": 2,
  "core.twinroot-blessing": 2,
  "core.mind-rot": 2,
  // Terrain
  "core.wild-glade": 11,
  "core.void-rift": 11,
};

// ---------------------------------------------------------------------
// 6. Tide-Void — "Strömung der Verdammnis" (Kontrolle/Kartenvorteil)
// ---------------------------------------------------------------------
//
// Spielidee: klassische Kontrolle — Kartenvorteil (core.current-seer,
// core.tidal-insight), Tempo/Antworten (core.tidal-rebuke,
// core.silence-ban) und bedingungslose Entfernung (core.doomreap-edict)
// halten den Gegner in Schach, bis core.hollowmaw-devourer (4/4 Trample
// + Lebensverbindung) oder schierer Kartenvorteil das Spiel entscheidet.
// Drain-Spells (core.hexbind-lash, core.soul-siphon) sorgen nebenbei für
// Uhr-Druck, ohne die Kontroll-Spielweise zu verlassen.
// Schlüsselkarten: core.gravebound-oracle (2 Karten bei jedem Tod),
// core.silence-ban (Konter gegen die gefährlichste gegnerische Karte),
// core.hollowmaw-devourer (seltener echter Abschluss-Körper einer sonst
// reinen Wert-/Antwort-Liste).
export const AI_DECK_TIDE_VOID_CONTROL: Record<string, number> = {
  // Units — tide
  "core.current-seer": 3,
  "core.tide-warden": 2,
  "core.tidal-serpent": 2,
  "core.tideshard-rogue": 2,
  // Units — void
  "core.void-marshal": 2,
  "core.gravebound-warden": 2,
  "core.gravebound-oracle": 2,
  "core.hollowmaw-devourer": 2,
  "core.husk-crawler": 2,
  // Spells
  "core.silence-ban": 2,
  "core.doomreap-edict": 3,
  "core.tidal-rebuke": 4,
  "core.mind-rot": 2,
  "core.tidal-insight": 2,
  "core.hexbind-lash": 3,
  "core.soul-siphon": 3,
  // Terrain
  "core.tide-cove": 11,
  "core.void-rift": 11,
};

// ---------------------------------------------------------------------
// 7. Mono-Flame — "Reiner Zorn" (reines Aggro, bewusste Ein-Farb-Ausnahme)
// ---------------------------------------------------------------------
//
// Spielidee: der Auftrag erlaubt ausdrücklich gelegentlich eine
// Ein-Farb-Ausnahme — flame eignet sich dafür am besten, weil es die
// einzige Farbe ist, deren Identität (Aggression, Direktschaden) ganz
// ohne Unterstützung einer zweiten Farbe konsistent trägt: eine extrem
// niedrige, lineare Kurve aus swift/firstStrike-1-2-Drops plus direktem
// Brand-Schaden räumt Blocker weg oder geht aufs Gesicht. Keine
// Farbmischungs-Risiken, da nur ein Terrain-Typ nötig ist (18 Terrains
// reichen, da jede Karte nur EIN Pip braucht).
// Schlüsselkarten: core.cinderborn-raider (effektiv 3/1 swift für 2
// Mana), core.wildfire-boar (3/3 Trample für 3 Mana), core.fire-jolt
// (günstigste, flexibelste Entfernung/Reichweite im Deck).
export const AI_DECK_MONO_FLAME_AGGRO: Record<string, number> = {
  // Units
  "core.cinder-pup": 4,
  "core.emberpaw-cub": 4,
  "core.brandblade-fledgling": 3,
  "core.cinderborn-raider": 4,
  "core.cinderwatch-raider": 2,
  "core.ash-duelist": 3,
  "core.cinderwake-marauder": 2,
  "core.storm-strider": 2,
  "core.brandwing-harrier": 1,
  "core.wildfire-boar": 3,
  "core.raidhorn-berserker": 1,
  // Spells
  "core.fire-jolt": 4,
  "core.flame-lance": 3,
  "core.blazing-frenzy": 3,
  "core.scorch-bolt": 1,
  "core.reckless-charge": 1,
  // Terrain
  "core.flame-ridge": 19,
};

/**
 * Gesammelte Liste aller kuratierten KI-Decks für spätere UI-Anzeige
 * (z. B. Deckauswahl beim Starten einer neuen Partie gegen die KI) —
 * enthält Anzeigename, Kurzbeschreibung und die vollständige Decklist.
 * Reihenfolge entspricht der Nummerierung/Reihenfolge oben.
 */
export const AI_DECKS: Array<{ name: string; description: string; decklist: Record<string, number> }> = [
  {
    name: "Sengende Wildnis",
    description: "Flamme-Wildnis-Aggro: frühe swift/firstStrike-Angreifer, ab Zug 3 zähe Trample-Körper, Brand-Schaden räumt den Weg frei.",
    decklist: AI_DECK_FLAME_WILD_AGGRO,
  },
  {
    name: "Gezeiten der Standhaftigkeit",
    description: "Flut-Licht-Kontrolle: guardian-Blocker, Bounce/Tap-Tempo und Lebensgewinn ziehen die Partie in die Länge, bis Kartenvorteil oder ein Koloss entscheidet.",
    decklist: AI_DECK_TIDE_LIGHT_CONTROL,
  },
  {
    name: "Aschen des Untergangs",
    description: "Flamme-Leere-Aggro-Opfer: zerbrechliche Körper mit Tod-Boni, unterstützt von bedingungsloser Entfernung und Drain-Zaubern.",
    decklist: AI_DECK_FLAME_VOID_SACRIFICE,
  },
  {
    name: "Wächter des Hains",
    description: "Wildnis-Licht-Midrange: +1/+1-Marken-Wachstum, Token-Breite und Lebensgewinn für ein zähes, aussitzendes Spiel.",
    decklist: AI_DECK_WILD_LIGHT_MIDRANGE,
  },
  {
    name: "Verrottender Wildwuchs",
    description: "Leere-Wildnis-Attrition: sterbende eigene Kreaturen erzeugen Token oder Kartenzug, gezielte Entfernung räumt das gegnerische Board.",
    decklist: AI_DECK_VOID_WILD_ATTRITION,
  },
  {
    name: "Strömung der Verdammnis",
    description: "Flut-Leere-Kontrolle: Kartenvorteil, Konter und bedingungslose Entfernung halten den Gegner in Schach, bis ein seltener echter Abschluss-Körper das Spiel beendet.",
    decklist: AI_DECK_TIDE_VOID_CONTROL,
  },
  {
    name: "Reiner Zorn",
    description: "Mono-Flamme-Aggro: die bewusste Ein-Farb-Ausnahme — eine extrem niedrige, lineare Kurve aus günstigen Angreifern und Brand-Schaden ohne jedes Farbmischungs-Risiko.",
    decklist: AI_DECK_MONO_FLAME_AGGRO,
  },
];

/**
 * Liefert die Decklist eines zufällig gewählten Eintrags aus `AI_DECKS`.
 *
 * Verwendet für den Bot-Gegner (s. frontend-engineer-Auftrag "KI zieht aus
 * kuratierten Archetyp-Decks", 2026-07-20) - ersetzt an den entsprechenden
 * Stellen in `src/ui/render.ts` den bisherigen `buildDemoDeck`-Aufruf für
 * player2, wenn dieser bot-gesteuert ist. `buildDemoDeck` selbst bleibt
 * unveraendert und dient weiterhin dem "Zufaellig fuellen"-Button beim
 * MENSCHLICHEN Deckbau (anderer Anwendungsfall).
 *
 * Bewusste Design-Entscheidung: der gewaehlte Archetyp/Deckname wird
 * NIRGENDS in der UI angezeigt/verraten - die Kartensammlung der Bot-KI soll
 * ausschliesslich durchs tatsaechliche Spielen entdeckt werden (s.
 * `handCardHidden`, das die Gegnerhand ohnehin verdeckt). Diese Funktion gibt
 * daher bewusst NUR die Decklist zurueck, nicht den vollen `AI_DECKS`-Eintrag
 * (Name/Beschreibung) - Aufrufer haben so gar nicht erst die Möglichkeit,
 * den Namen versehentlich irgendwo anzuzeigen.
 */
export function pickRandomAiDeck(): Record<string, number> {
  const entry = AI_DECKS[Math.floor(Math.random() * AI_DECKS.length)]!;
  return entry.decklist;
}

/**
 * Löst die tatsächlich für den Bot-Gegner zu verwendende Decklist auf (Auftrag
 * "welches Deck spielt die KI", 2026-07-21, s. store.ts#getChosenAiDeckArchetype/
 * components/deckBuilder.ts#aiToggle): der Mensch kann statt der bisherigen
 * reinen Zufallsziehung gezielt einen der 7 `AI_DECKS`-Archetypen für den Bot
 * festlegen.
 *
 * `chosenIndex === undefined` (Default/"Zufällig" im UI) verhält sich exakt
 * wie `pickRandomAiDeck()` oben, INKLUSIVE dessen Geheimhaltungs-Prinzip - der
 * Archetyp-Name wird auch hier nirgends zurückgegeben, nur die Decklist. Ein
 * gültiger Index gibt stattdessen GENAU die Decklist dieses Eintrags zurück -
 * das widerspricht dem Geheimhaltungs-Prinzip NICHT, da der Mensch diesen
 * Namen in diesem Fall ohnehin selbst im Dropdown ausgewählt hat.
 */
export function resolveAiDeck(chosenIndex: number | undefined): Record<string, number> {
  if (chosenIndex === undefined) return pickRandomAiDeck();
  const entry = AI_DECKS[chosenIndex];
  // Defensiv: ein ungültiger Index (sollte über das UI-Dropdown nie
  // vorkommen) fällt auf dasselbe Zufallsverhalten zurück statt zu crashen.
  return entry ? entry.decklist : pickRandomAiDeck();
}
