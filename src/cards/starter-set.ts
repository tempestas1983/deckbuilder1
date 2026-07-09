/**
 * Starter-Set "core" (Validierungs-Kartenpaket)
 *
 * Zweck: Kleines, aber über alle 6 Kartentypen und alle 5 Manafarben
 * gestreutes Kartenset, um das Datenmodell (src/model/) gegen echte
 * Karteninhalte zu testen, bevor der volle "core"-Pool (40-60 Karten,
 * siehe docs/README.md "Nächste Schritte -> card-designer") entsteht.
 *
 * Balancing-Notizen (inkl. v0.2-Update nach Game-Architect-Feedback):
 * docs/cards/starter-set.md
 *
 * Alle Karten nutzen ausschließlich vorhandene Effect-/TriggerCondition-/
 * Keyword-Primitive aus src/model/abilities.ts. Keine Engine-Logik hier.
 */

import type { CardPool } from "../model";

export const starterSet: CardPool = {
  // ---------------------------------------------------------------------
  // Terrains (1 pro Farbe, reine Mana-Fähigkeit, kein Stack, kein Cost)
  // ---------------------------------------------------------------------

  "core.flame-ridge": {
    id: "core.flame-ridge",
    name: "Flammenkuppe",
    type: "terrain",
    subtypes: ["Gebirge"],
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "flame", amount: 1 }],
        isManaAbility: true,
        text: "Tappen: Erzeuge 1 Flamme-Mana.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.tide-cove": {
    id: "core.tide-cove",
    name: "Gezeitenbucht",
    type: "terrain",
    subtypes: ["Küste"],
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "tide", amount: 1 }],
        isManaAbility: true,
        text: "Tappen: Erzeuge 1 Flut-Mana.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.wild-glade": {
    id: "core.wild-glade",
    name: "Wildlichtung",
    type: "terrain",
    subtypes: ["Wald"],
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "wild", amount: 1 }],
        isManaAbility: true,
        text: "Tappen: Erzeuge 1 Wildnis-Mana.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.light-altar": {
    id: "core.light-altar",
    name: "Lichtaltar",
    type: "terrain",
    subtypes: ["Tempel"],
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "light", amount: 1 }],
        isManaAbility: true,
        text: "Tappen: Erzeuge 1 Licht-Mana.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.void-rift": {
    id: "core.void-rift",
    name: "Leerenspalte",
    type: "terrain",
    subtypes: ["Ödnis"],
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "addMana", color: "void", amount: 1 }],
        isManaAbility: true,
        text: "Tappen: Erzeuge 1 Leere-Mana.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Token-Definitionen (Batch 2, v0.4) — Hilfskarten für `createToken`.
  // isToken:true schließt sie vom Deckbau aus (src/ui/deck.ts); sie
  // existieren ausschließlich als Referenzziel für `tokenDefinitionId`.
  // Bewusst schlicht gehalten (Vanilla bzw. ein Keyword), damit die
  // erzeugenden Karten (nicht die Token) den Powerlevel tragen.
  // ---------------------------------------------------------------------

  "core.sprout-token": {
    id: "core.sprout-token",
    name: "Sprössling",
    type: "unit",
    subtypes: ["Pflanzenwesen"],
    cost: {},
    power: 1,
    toughness: 1,
    isToken: true,
    rulesText: "Keine Fähigkeiten.",
    rarity: "common",
    set: "core",
  },

  "core.spirit-token": {
    id: "core.spirit-token",
    name: "Lichtgeist",
    type: "unit",
    subtypes: ["Geist"],
    cost: {},
    power: 1,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "airborne" }],
    isToken: true,
    rulesText: "Flieger.",
    rarity: "common",
    set: "core",
  },

  "core.skeleton-token": {
    id: "core.skeleton-token",
    name: "Gebeinknecht",
    type: "unit",
    subtypes: ["Untoter"],
    cost: {},
    power: 1,
    toughness: 1,
    isToken: true,
    rulesText: "Keine Fähigkeiten.",
    rarity: "common",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Units — Flame (aggressiv, Direktschaden, Eile/Flieger)
  // ---------------------------------------------------------------------

  "core.cinder-pup": {
    id: "core.cinder-pup",
    name: "Glutpfote",
    type: "unit",
    subtypes: ["Wolf"],
    cost: { flame: 1 },
    power: 1,
    toughness: 1,
    rulesText: "Keine Fähigkeiten.",
    rarity: "common",
    set: "core",
  },

  // Referenzkarte aus docs/README.md ("Beispielkarte") — bewusst identisch
  // übernommen, damit Doku-Beispiel und Kartenpool nicht auseinanderlaufen.
  "core.ember-whelp": {
    id: "core.ember-whelp",
    name: "Glutwelpe",
    type: "unit",
    subtypes: ["Drache"],
    cost: { generic: 1, flame: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "airborne" },
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 1 }],
        text: "Wenn der Glutwelpe ins Spiel kommt, füge einem Ziel 1 Schaden zu.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.storm-strider": {
    id: "core.storm-strider",
    name: "Sturmschreiter",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 2, flame: 1 },
    power: 3,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "swift" }],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  // v0.2.3 Batch 1 (Kampf-Keyword-Ausbau, docs/cards/starter-set.md):
  // firstStrike-Testkarte, matcht bewusst die 2/2-für-2-Vanilla-Rate 1:1
  // (Vergleich core.dawnblade-adept, light — identische Statline).
  "core.ash-duelist": {
    id: "core.ash-duelist",
    name: "Aschenduellant",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 1, flame: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "firstStrike" }],
    rulesText: "Erststurm.",
    rarity: "common",
    set: "core",
  },

  // Günstigster swift-Körper im Set: reine Vanilla-Statline (1/1) trägt die
  // gesamte "Kosten" des Keywords, siehe Balancing-Notizen.
  "core.emberpaw-cub": {
    id: "core.emberpaw-cub",
    name: "Glutpranke",
    type: "unit",
    subtypes: ["Wolf"],
    cost: { flame: 1 },
    power: 1,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "swift" }],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  "core.wildfire-boar": {
    id: "core.wildfire-boar",
    name: "Wildfeuerkeiler",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, flame: 1 },
    power: 3,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "trample" }],
    rulesText: "Trampelschaden.",
    rarity: "common",
    set: "core",
  },

  // Batch 2 (v0.4): erste vigilant-Karte in flame (bisher nur tide/wild).
  // Leicht schwächere Toughness als core.tide-warden (2/2 statt 2/3) für
  // denselben Preis, passend zu flames dünnerer Toughness-Identität.
  "core.flame-watch": {
    id: "core.flame-watch",
    name: "Flammenwache",
    type: "unit",
    subtypes: ["Krieger", "Wächter"],
    cost: { generic: 1, flame: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "vigilant" }],
    rulesText: "Wachsam.",
    rarity: "common",
    set: "core",
  },

  // Batch 3 (v0.5): Testkarte für StaticAbility-Modifier `grantKeyword`
  // (bisher ungenutzter dritter Modifier-Typ neben "stats"/"costChange") in
  // Kombination mit scope:"self" — verleiht der tragenden Karte ein Keyword
  // über eine statische Fähigkeit statt über die feste KeywordAbility.
  // Mechanisch/balancetechnisch 1:1 identisch zu core.emberpaw-cub (1 Mana,
  // 1/1, swift als KeywordAbility) — bewusst identisch bepreist, siehe
  // Balancing-Notizen ("scope:self ist rein additiv, keine neue Design-
  // Achse").
  "core.emberborn-sprinter": {
    id: "core.emberborn-sprinter",
    name: "Flammengeborener Läufer",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { flame: 1 },
    power: 1,
    toughness: 1,
    abilities: [
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "grantKeyword", keyword: "swift" },
        text: "Diese Einheit hat Eile.",
      },
    ],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Units — Tide (Tempo, Kartenvorteil, defensive Statlines)
  // ---------------------------------------------------------------------

  "core.tide-scout": {
    id: "core.tide-scout",
    name: "Gezeitenkundschafter",
    type: "unit",
    subtypes: ["Späher"],
    cost: { tide: 1 },
    power: 1,
    toughness: 2,
    rulesText: "Keine Fähigkeiten.",
    rarity: "common",
    set: "core",
  },

  "core.current-seer": {
    id: "core.current-seer",
    name: "Strömungsseher",
    type: "unit",
    subtypes: ["Geist"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Wenn der Strömungsseher ins Spiel kommt, ziehe eine Karte.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // v0.2.3 Batch 1: erste vigilant-Testkarte im echten Pool (bisher 0).
  "core.tide-warden": {
    id: "core.tide-warden",
    name: "Gezeitenwächterin",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 1, tide: 1 },
    power: 2,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "vigilant" }],
    rulesText: "Wachsam.",
    rarity: "common",
    set: "core",
  },

  "core.riftfin-duelist": {
    id: "core.riftfin-duelist",
    name: "Riftflossen-Duellant",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "firstStrike" }],
    rulesText: "Erststurm.",
    rarity: "common",
    set: "core",
  },

  // Cheapster deathtouch-Blocker im Set nach core.thicket-fang; siehe
  // Balancing-Notizen für den Vergleich beider Preispunkte.
  "core.abyssal-lurker": {
    id: "core.abyssal-lurker",
    name: "Abgrundlauerer",
    type: "unit",
    subtypes: ["Krake"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "deathtouch" }],
    rulesText: "Todesberührung.",
    rarity: "common",
    set: "core",
  },

  "core.tidal-serpent": {
    id: "core.tidal-serpent",
    name: "Flutschlange",
    type: "unit",
    subtypes: ["Seeschlange"],
    cost: { generic: 2, tide: 1 },
    power: 2,
    toughness: 5,
    abilities: [{ kind: "keyword", keyword: "reach" }],
    rulesText: "Reichweite.",
    rarity: "common",
    set: "core",
  },

  // Zweite guardian-Karte im Set (nach core.temple-sentinel), bewusst
  // billiger und noch defensiver (1 Power statt 2) — siehe Balancing-Notizen.
  "core.harbor-warden": {
    id: "core.harbor-warden",
    name: "Hafenwächter",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 5,
    abilities: [{ kind: "keyword", keyword: "guardian" }],
    rulesText: "Wächter.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 2 (v0.4): erste Testkarte für `tapPermanent` als getriggerten
  // Effekt (statt als Spell/Fähigkeit) — ETB tappt eine gegnerische Unit.
  // Unterdurchschnittlicher Körper (2/2 für 3) analog core.ember-whelp:
  // Tempo-Ping statt Damage-Ping.
  "core.tidebind-courser": {
    id: "core.tidebind-courser",
    name: "Flutbann-Kurier",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 2, tide: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "Wenn der Flutbann-Kurier ins Spiel kommt, tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 3 (v0.5): erste Nutzung von `scry` im Pool. Bewusst als reiner
  // ETB-Bonus neben einem unterdurchschnittlichen Körper gedruckt — `scry`
  // ist laut Regelwerk §9.7 aktuell ein No-Op in der Engine (kein
  // Spielerentscheidungskanal für die Reihenfolgewahl), daher wird die Karte
  // bepreist, ALS OB scry gar keinen Wert beisteuert (siehe Balancing-Notiz).
  "core.tidereader-oracle": {
    id: "core.tidereader-oracle",
    name: "Gezeitenleserin",
    type: "unit",
    subtypes: ["Seherin"],
    cost: { generic: 1, tide: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [{ kind: "scry", who: "controller", count: 1 }],
        text: "Wenn die Gezeitenleserin ins Spiel kommt, sieh dir die oberste Karte deiner Bibliothek an und lege sie oben oder unten auf die Bibliothek zurück.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Batch 3 (v0.5): erste Nutzung von `onDealtCombatDamageToPlayer` (bisher
  // ungenutzte TriggerCondition, in der Engine vollständig verdrahtet —
  // siehe combat.ts). Klassischer "verbindet mit dem Gegner"-Value-Engine,
  // daher hinter Evasion (airborne) versteckt und moderat teuer/uncommon,
  // damit sie nicht zu zuverlässig durchkommt.
  "core.tideshard-rogue": {
    id: "core.tideshard-rogue",
    name: "Flutscherben-Schleicherin",
    type: "unit",
    subtypes: ["Schurkin", "Geist"],
    cost: { generic: 2, tide: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "airborne" },
      {
        kind: "triggered",
        trigger: { kind: "onDealtCombatDamageToPlayer", what: "self" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Immer wenn die Flutscherben-Schleicherin einem Spieler Kampfschaden zufügt, ziehe eine Karte.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.3 Modell-Update (Modal-Effekte, rules-engine.md 4 + 9.13): erste
  // Testkarte für `modes` auf einer TriggeredAbility (statt Spell/aktivierter
  // Fähigkeit) — deckt gezielt die neue PendingDecision "chooseMode" ab,
  // inkl. Auto-Pick-Fall (steht kein gegnerisches Ziel für Modus 2 zur
  // Verfügung, ist nur Modus 1 wählbar und wird laut 9.13 ohne Nachfrage
  // gewählt). Bewusst unterdurchschnittlicher Körper (1/2 statt
  // core.tidebind-couriers 2/2 für denselben Preis): die Wahlmöglichkeit
  // zwischen "ziehe eine Karte" (mind. so gut wie core.current-seers ETB)
  // und "tappe eine gegnerische Kreatur" (identisch zu core.tidebind-
  // couriers festem Effekt) ist strikt mindestens so gut wie jede der
  // beiden Einzelkarten für sich — der Statline-Abzug gleicht diesen
  // Flexibilitätsvorteil aus.
  "core.current-diplomat": {
    id: "core.current-diplomat",
    name: "Strömungsdiplomatin",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 2, tide: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [],
        modes: [
          {
            text: "Ziehe eine Karte.",
            effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          },
          {
            text: "Tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
            targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
            effects: [{ kind: "tapPermanent", what: { target: 0 } }],
          },
        ],
        text: "Wenn die Strömungsdiplomatin ins Spiel kommt, wähle eins — Ziehe eine Karte. Oder: Tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Units — Wild (große Körper, Zähigkeit, Marken/Wachstum)
  // ---------------------------------------------------------------------

  "core.grove-calf": {
    id: "core.grove-calf",
    name: "Waldkalb",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 1, wild: 1 },
    power: 2,
    toughness: 3,
    rulesText: "Keine Fähigkeiten.",
    rarity: "common",
    set: "core",
  },

  "core.thornback-warden": {
    id: "core.thornback-warden",
    name: "Dornwächter",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "reach" }],
    rulesText: "Reichweite.",
    rarity: "common",
    set: "core",
  },

  "core.grove-elder": {
    id: "core.grove-elder",
    name: "Hain-Ältester",
    type: "unit",
    subtypes: ["Baumhüter"],
    cost: { generic: 3, wild: 2 },
    power: 3,
    toughness: 5,
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1, wild: 1 },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [
          { kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 },
        ],
        text: "{1}{Wild}: Lege einen +1/+1-Marker auf eine Unit deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.2.3 Batch 1: dritte guardian-Karte im Set (nach core.temple-sentinel
  // und core.harbor-warden), mittlerer Preispunkt zwischen beiden.
  "core.bramblehide-sentinel": {
    id: "core.bramblehide-sentinel",
    name: "Dornfellwächter",
    type: "unit",
    subtypes: ["Bestie", "Wächter"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "guardian" }],
    rulesText: "Wächter.",
    rarity: "uncommon",
    set: "core",
  },

  "core.stonebark-elder": {
    id: "core.stonebark-elder",
    name: "Steinrinden-Ältester",
    type: "unit",
    subtypes: ["Baumhüter"],
    cost: { generic: 2, wild: 2 },
    power: 4,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "vigilant" }],
    rulesText: "Wachsam.",
    rarity: "uncommon",
    set: "core",
  },

  // Günstigster deathtouch-Körper im Set (1 Mana, reine Vanilla-Statline
  // 1/1) — der defensive Gegenpol zu core.grave-viper (void), siehe
  // Balancing-Notizen.
  "core.thicket-fang": {
    id: "core.thicket-fang",
    name: "Dickichtreißzahn",
    type: "unit",
    subtypes: ["Schlange"],
    cost: { wild: 1 },
    power: 1,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "deathtouch" }],
    rulesText: "Todesberührung.",
    rarity: "common",
    set: "core",
  },

  "core.overgrowth-colossus": {
    id: "core.overgrowth-colossus",
    name: "Wucherkoloss",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 3, wild: 2 },
    power: 5,
    toughness: 5,
    abilities: [{ kind: "keyword", keyword: "trample" }],
    rulesText: "Trampelschaden.",
    rarity: "uncommon",
    set: "core",
  },

  "core.thistlehide-healer": {
    id: "core.thistlehide-healer",
    name: "Distelfell-Heilerin",
    type: "unit",
    subtypes: ["Bestie", "Kleriker"],
    cost: { generic: 2, wild: 1 },
    power: 3,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "lifelink" }],
    rulesText: "Lebensverbindung.",
    rarity: "common",
    set: "core",
  },

  // Batch 2 (v0.4): erste Testkarte für `addCounters` als ETB-Selbstbuff
  // (statt wiederholbare Fähigkeit wie core.grove-elder). Gedruckt 2/3,
  // durch den +1/+1-Marker effektiv 3/4 für 3 Mana — leicht über
  // core.grove-calfs Vanilla-Projektion (2/3 für 2), aber der Marker ist
  // dauerhaft und daher anfällig für `removeCounters`-Antworten
  // (core.wither-touch, core.corrosive-clamp), anders als ein reiner
  // Stat-Bonus.
  "core.moss-elder": {
    id: "core.moss-elder",
    name: "Moosältester",
    type: "unit",
    subtypes: ["Baumhüter"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 3,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [{ kind: "addCounters", what: "self", counterType: "plus1plus1", count: 1 }],
        text: "Wenn der Moosältester ins Spiel kommt, lege einen +1/+1-Marker auf ihn.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Batch 3 (v0.5): erste Testkarte für StaticAbility scope:"self" +
  // Modifier "stats" (isoliert von scope:"ownUnits"-Anthems wie
  // core.iron-standard/core.wildgrowth-field, die ALLE eigenen Units
  // treffen). Mechanisch/balancetechnisch ununterscheidbar von einer Karte,
  // die direkt mit +1/+1 höher gedruckt wäre (3/4 statt 2/3 für 3 Mana) —
  // dient in erster Linie als Modell-Abdeckungstest, siehe Balancing-Notizen.
  "core.stoneguard-paragon": {
    id: "core.stoneguard-paragon",
    name: "Steinwacht-Musterbild",
    type: "unit",
    subtypes: ["Golem"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 3,
    abilities: [
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Diese Einheit erhält permanent +1/+1 (angeboren).",
      },
    ],
    rulesText: "Angeborene Stärke: permanent +1/+1.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 3 (v0.5): schließt `removeCounters` als AdditionalCost auf
  // aktivierten Fähigkeiten ab (bisher nur als Effekt genutzt, core.wither-
  // touch/core.corrosive-clamp). ETB-Marker (bewährtes, sicher
  // funktionierendes Muster wie core.moss-elder) statt eines Triggers auf
  // erlittenen Schaden — die TriggerCondition "onDamageReceived" wird vom
  // Engine-Code aktuell NIRGENDS gefeuert (siehe Rückmeldung an
  // Game-Architect/Engine-Engineer unten), daher bewusst nicht verwendet.
  "core.thornwarden-ascetic": {
    id: "core.thornwarden-ascetic",
    name: "Dornwart-Asket",
    type: "unit",
    subtypes: ["Druide"],
    cost: { generic: 1, wild: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [{ kind: "addCounters", what: "self", counterType: "plus1plus1", count: 1 }],
        text: "Wenn der Dornwart-Asket ins Spiel kommt, lege einen +1/+1-Marker auf ihn.",
      },
      {
        kind: "activated",
        additionalCosts: [{ kind: "removeCounters", counterType: "plus1plus1", count: 1 }],
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
        text: "Entferne einen +1/+1-Marker vom Dornwart-Asketen: Füge einem Ziel deiner Wahl 2 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.3 Modell-Update (`onDamageReceived` verdrahtet, rules-engine.md 5 +
  // 9.10): erste Testkarte für diesen Trigger im Pool (bis v0.2.4 laut
  // Balancing-Notizen in docs/cards/starter-set.md "reserviert, nicht
  // verwenden" — mit v0.3 vom Architekten freigegeben). Vergeltungsdesign
  // über EffectRecipient "eventSubject" (= Schadensquelle, NICHT die eigene
  // Instanz): jede Schadensquelle, die den Keiler trifft — Kampf- oder
  // Effekt-Schaden, jede Instanz einzeln, siehe Granularitäts-Regel in
  // Abschnitt 5 —, erhält 2 Schaden zurück. Bewusst KEIN Token-Design
  // (Architekt-Vorgabe 9.10 Punkt 4): eine reguläre Pool-Karte, deren
  // Definition beim Stacken des Triggers auch nach dem eigenen Tod noch
  // auflösbar bleibt (letaler Schaden feuert, der Trigger überlebt in der
  // Pending-Queue, Abschnitt 5). Statline unter der von
  // core.thornback-warden (2/4, reach, gleicher Preis 3 Mana) — reach
  // schützt nur gegen Flieger, die Vergeltung hier wirkt gegen JEDEN
  // Schaden inkl. Brand-Spells, daher der Abzug auf 2/3.
  "core.thornrage-boar": {
    id: "core.thornrage-boar",
    name: "Dornwut-Keiler",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 3,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDamageReceived", what: "self" },
        effects: [{ kind: "dealDamage", to: "eventSubject", amount: 2 }],
        text: "Immer wenn der Dornwut-Keiler Schaden erhält, fügt er der Schadensquelle 2 Schaden zu.",
      },
    ],
    rulesText: "Vergeltung: 2 Schaden an die Schadensquelle bei jedem erhaltenen Schaden.",
    rarity: "uncommon",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Units — Light (Lebensgewinn, Verteidigung, Guardian-Testkarte)
  // ---------------------------------------------------------------------

  "core.sun-acolyte": {
    id: "core.sun-acolyte",
    name: "Sonnenschwester",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "lifelink" }],
    rulesText: "Lebensverbindung.",
    rarity: "common",
    set: "core",
  },

  // guardian-Regel seit v0.2 final spezifiziert (docs/rules-engine.md
  // Abschnitt 6): Pflicht gilt pro ungetappter guardian-Unit des
  // Verteidigers, sofern ein legaler Block existiert; welchen Angreifer sie
  // blockt, wählt der Verteidiger frei; Snapshot bei Deklaration (vorher
  // getappt = keine Pflicht, nachträgliches Tappen entfernt den Block nicht).
  "core.temple-sentinel": {
    id: "core.temple-sentinel",
    name: "Tempelwächter",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 2, light: 2 },
    power: 2,
    toughness: 5,
    abilities: [{ kind: "keyword", keyword: "guardian" }],
    rulesText: "Wächter.",
    rarity: "uncommon",
    set: "core",
  },

  "core.dawn-medic": {
    id: "core.dawn-medic",
    name: "Morgendliche Heilerin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [{ kind: "gainLife", who: "controller", amount: 2 }],
        text: "Wenn die Morgendliche Heilerin ins Spiel kommt, gewinne 2 Leben.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // v0.2.3 Batch 1: zweite airborne-Karte im Set (nach core.ember-whelp,
  // flame). Bewusst reine Vanilla+Keyword-Statline (kein ETB), leicht
  // teurer als ember-whelp damit sie dessen Referenzwert nicht übertrifft.
  "core.aerie-benediction": {
    id: "core.aerie-benediction",
    name: "Federsegen",
    type: "unit",
    subtypes: ["Geist"],
    cost: { generic: 2, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "airborne" }],
    rulesText: "Flieger.",
    rarity: "common",
    set: "core",
  },

  "core.sunhaven-guard": {
    id: "core.sunhaven-guard",
    name: "Sonnenhort-Wache",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 1, light: 1 },
    power: 1,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "reach" }],
    rulesText: "Reichweite.",
    rarity: "common",
    set: "core",
  },

  // firstStrike-Testkarte mit identischer Statline zu core.ash-duelist
  // (flame) — bewusst symmetrisch, damit die "Kosten" des Keywords
  // farbunabhängig konsistent bleiben.
  "core.dawnblade-adept": {
    id: "core.dawnblade-adept",
    name: "Morgenklingen-Adeptin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "firstStrike" }],
    rulesText: "Erststurm.",
    rarity: "common",
    set: "core",
  },

  "core.sunforged-colossus": {
    id: "core.sunforged-colossus",
    name: "Sonnengeschmiedeter Koloss",
    type: "unit",
    subtypes: ["Konstrukt"],
    cost: { generic: 3, light: 2 },
    power: 4,
    toughness: 5,
    abilities: [{ kind: "keyword", keyword: "trample" }],
    rulesText: "Trampelschaden.",
    rarity: "uncommon",
    set: "core",
  },

  "core.zealous-vanguard": {
    id: "core.zealous-vanguard",
    name: "Eifervorhut",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "swift" }],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  // Batch 2 (v0.4): erste Testkarte für `createToken` auf einer Unit (ETB).
  // Körper (2/2 für 3) unter Vanilla-Rate, ausgeglichen durch einen
  // zusätzlichen 1/1-Flieger-Token — Gesamtstatline (3/3 über 2 Körper)
  // liegt nahe an Vanilla-Rate, aber auf zwei Körper verteilt (Breite statt
  // Größe), analog core.ember-whelps "Body + Einmal-Value"-Muster.
  "core.aureate-caller": {
    id: "core.aureate-caller",
    name: "Goldene Ruferin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 2, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.spirit-token", count: 1 },
        ],
        text: "Wenn die Goldene Ruferin ins Spiel kommt, erschaffe einen 1/1 Lichtgeist-Token mit Flieger.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 3 (v0.5): zweite scope:"self"-Testkarte (nach core.stoneguard-
  // paragon, wild), diesmal kombiniert mit einem echten Keyword (lifelink)
  // statt isoliert — zeigt, dass scope:"self"-Stats additiv neben einer
  // KeywordAbility funktionieren. Effektiv 2/3 Lifelink für 2 Mana (leicht
  // über core.thistlehide-healers Rate von 3/3 für 3, siehe Balancing-
  // Notizen).
  "core.sunward-vanguard": {
    id: "core.sunward-vanguard",
    name: "Sonnenwärts-Vorkämpferin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "lifelink" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Diese Einheit erhält permanent +0/+1 (angeboren).",
      },
    ],
    rulesText: "Lebensverbindung. Angeborene Zähigkeit: permanent +0/+1.",
    rarity: "common",
    set: "core",
  },

  // Batch 3 (v0.5): letzte fehlende Farbe für `vigilant` (siehe Keyword-
  // Abdeckungstabelle in docs/cards/starter-set.md — bisher 4 von 5 Farben).
  // Statline identisch zu core.flame-watch (2/2 für 2 Mana).
  "core.sunlit-vigil": {
    id: "core.sunlit-vigil",
    name: "Sonnenlicht-Wache",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "vigilant" }],
    rulesText: "Wachsam.",
    rarity: "common",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Units — Void (Opfer, Verlust-für-Wert, Tod-Trigger)
  // ---------------------------------------------------------------------

  "core.husk-crawler": {
    id: "core.husk-crawler",
    name: "Hüllenkriecher",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 1, void: 1 },
    power: 3,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Wenn der Hüllenkriecher stirbt, ziehe eine Karte.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.soul-drainer": {
    id: "core.soul-drainer",
    name: "Seelenzehrer",
    type: "unit",
    subtypes: ["Dämon"],
    cost: { generic: 2, void: 2 },
    power: 3,
    toughness: 3,
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        effects: [
          { kind: "dealDamage", to: "opponent", amount: 2 },
          { kind: "gainLife", who: "controller", amount: 2 },
        ],
        text: "Opfere den Seelenzehrer: Er fügt deinem Gegner 2 Schaden zu, du gewinnst 2 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.2.3 Batch 1: aggressiverer deathtouch-Preispunkt (2 Power statt 1),
  // Gegenstück zu core.thicket-fang (wild) — siehe Balancing-Notizen.
  "core.grave-viper": {
    id: "core.grave-viper",
    name: "Grabotter",
    type: "unit",
    subtypes: ["Schlange", "Untoter"],
    cost: { generic: 1, void: 1 },
    power: 2,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "deathtouch" }],
    rulesText: "Todesberührung.",
    rarity: "common",
    set: "core",
  },

  "core.hollow-ravager": {
    id: "core.hollow-ravager",
    name: "Hohlwüter",
    type: "unit",
    subtypes: ["Dämon"],
    cost: { generic: 2, void: 2 },
    power: 4,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "trample" }],
    rulesText: "Trampelschaden.",
    rarity: "uncommon",
    set: "core",
  },

  "core.wraithwing-stalker": {
    id: "core.wraithwing-stalker",
    name: "Schwingenschatten",
    type: "unit",
    subtypes: ["Geist"],
    cost: { generic: 1, void: 1 },
    power: 2,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "airborne" }],
    rulesText: "Flieger.",
    rarity: "common",
    set: "core",
  },

  "core.leechspawn": {
    id: "core.leechspawn",
    name: "Blutbrut",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 2, void: 1 },
    power: 3,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "lifelink" }],
    rulesText: "Lebensverbindung.",
    rarity: "common",
    set: "core",
  },

  "core.pit-reaver": {
    id: "core.pit-reaver",
    name: "Gruben-Plünderer",
    type: "unit",
    subtypes: ["Räuber"],
    cost: { void: 1 },
    power: 1,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "swift" }],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  // Einzige Kombinationskarte des Batches (firstStrike + deathtouch, siehe
  // rules-engine.md 6d(4)): bewusst auf der kleinstmöglichen Statline (1/1)
  // und teuer/rar bepreist — ausführliche Begründung in den
  // Balancing-Notizen unten.
  "core.void-assassin": {
    id: "core.void-assassin",
    name: "Leerenassassine",
    type: "unit",
    subtypes: ["Dämon", "Attentäter"],
    cost: { generic: 3, void: 2 },
    power: 1,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "firstStrike" },
      { kind: "keyword", keyword: "deathtouch" },
    ],
    rulesText: "Erststurm. Todesberührung.",
    rarity: "rare",
    set: "core",
  },

  // Batch 2 (v0.4): zweite vigilant-Karte außerhalb tide/wild (nach
  // core.flame-watch) — vigilant deckt jetzt 4 von 5 Farben ab (nur light
  // fehlt noch), siehe Keyword-Abdeckungstabelle.
  "core.void-marshal": {
    id: "core.void-marshal",
    name: "Leerenmarschall",
    type: "unit",
    subtypes: ["Untoter", "Anführer"],
    cost: { generic: 2, void: 1 },
    power: 2,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "vigilant" }],
    rulesText: "Wachsam.",
    rarity: "common",
    set: "core",
  },

  // Batch 3 (v0.5): erste Nutzung des Counter-Typs "minus1minus1" im Pool
  // (Engine berechnet ihn seit Batch 2 bereits mit, siehe stats.ts, aber
  // keine Karte nutzte ihn bisher — siehe offene Beobachtung in v0.4).
  // Anders als die Curse-Auren (core.rootrot-curse/core.riptide-shackles)
  // ist dieser Debuff NICHT an ein zerstörbares Anlege-Objekt gebunden und
  // NICHT durch Bounce der Aura umkehrbar — dafür aber auch nicht durch
  // core.wither-touch/core.corrosive-clamp entfernbar (die entfernen nur
  // "plus1plus1"), siehe Balancing-Notizen.
  "core.rot-touched-stalker": {
    id: "core.rot-touched-stalker",
    name: "Fäulnisberührter Pirscher",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 1, void: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "minus1minus1", count: 1 }],
        text: "Wenn der Fäulnisberührte Pirscher ins Spiel kommt, lege einen -1/-1-Marker auf eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 3 (v0.5): vierte guardian-Farbe (nach light/wild/tide) — nur
  // flame hat weiterhin kein guardian, passend zu flames rein aggressiver
  // Identität ohne defensive Keywords, siehe Keyword-Abdeckungstabelle.
  "core.gravebound-warden": {
    id: "core.gravebound-warden",
    name: "Grabgebundener Wärter",
    type: "unit",
    subtypes: ["Untoter", "Wächter"],
    cost: { generic: 2, void: 1 },
    power: 1,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "guardian" }],
    rulesText: "Wächter.",
    rarity: "uncommon",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Spells
  // ---------------------------------------------------------------------

  "core.fire-jolt": {
    id: "core.fire-jolt",
    name: "Feuerstoß",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
    rulesText: "Füge einem Ziel deiner Wahl 2 Schaden zu.",
    rarity: "common",
    set: "core",
  },

  // v0.2.3 Batch 1: teurere, aber höher skalierte Burn-Alternative zu
  // core.fire-jolt (schlechtere Mana-Effizienz pro Schadenspunkt bewusst,
  // siehe Balancing-Notizen).
  "core.flame-lance": {
    id: "core.flame-lance",
    name: "Feuerlanze",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, flame: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 3 }],
    rulesText: "Füge einem Ziel deiner Wahl 3 Schaden zu.",
    rarity: "common",
    set: "core",
  },

  // Referenzkarte aus docs/README.md ("Beispielkarte") — identisch übernommen.
  "core.tidal-rebuke": {
    id: "core.tidal-rebuke",
    name: "Gezeitenschelte",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"] }],
    effects: [{ kind: "returnToHand", what: { target: 0 } }],
    rulesText: "Bringe eine Unit deiner Wahl auf die Hand ihres Besitzers zurück.",
    rarity: "common",
    set: "core",
  },

  "core.silence-ban": {
    id: "core.silence-ban",
    name: "Bann des Schweigens",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 1 },
    targets: [{ kind: "stackObject", objectKind: "spell" }],
    effects: [{ kind: "counterStackObject", what: { target: 0 } }],
    rulesText: "Kontere einen Zauberspruch deiner Wahl.",
    rarity: "uncommon",
    set: "core",
  },

  "core.banishment-rite": {
    id: "core.banishment-rite",
    name: "Verbannungsritus",
    type: "spell",
    speed: "slow",
    cost: { generic: 2, light: 2 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
    effects: [{ kind: "exilePermanent", what: { target: 0 } }],
    rulesText: "Verbanne eine gegnerische Unit deiner Wahl.",
    rarity: "rare",
    set: "core",
  },

  // v0.2.3 Batch 1: erster Spell im Set ganz ohne targets-Array (Effekt
  // nutzt nur den fixen EffectRecipient "controller") — bereits seit v0.2
  // als regulärer Fall bestätigt (siehe TargetSpec-Kommentar in
  // abilities.ts), bisher aber nur auf aktivierten/getriggerten
  // Fähigkeiten genutzt (core.soul-drainer u.a.), nicht auf einem Spell.
  "core.healing-light": {
    id: "core.healing-light",
    name: "Heilendes Licht",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, light: 1 },
    effects: [{ kind: "gainLife", who: "controller", amount: 4 }],
    rulesText: "Gewinne 4 Leben.",
    rarity: "common",
    set: "core",
  },

  // X-Kosten seit v0.2 geklärt (docs/rules-engine.md Abschnitt 4): Ankündigen
  // -> X wählen (>=0) -> Ziele wählen -> bezahlen; chosenX am Stack-Objekt,
  // Amount { kind: "x" } liest es bei Resolution. Testkarte für dieses Muster.
  "core.inferno-surge": {
    id: "core.inferno-surge",
    name: "Feuersturz",
    type: "spell",
    speed: "fast",
    cost: { flame: 1, x: true },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [{ kind: "dealDamage", to: { target: 0 }, amount: { kind: "x" } }],
    rulesText: "Wähle X. Füge einem Ziel deiner Wahl X Schaden zu.",
    rarity: "uncommon",
    set: "core",
  },

  // Instant-Speed-Alternative zu core.soul-drainers Opfer-Fähigkeit
  // (gleiche Werte: 2 Schaden + 2 Leben), kostet dafür echtes Mana statt
  // eines Opfers und kann eine Unit statt zwingend den Gegner treffen —
  // mischt gezielten Effekt (target 0) und fixen Empfänger (controller)
  // in derselben Effektliste.
  "core.soul-siphon": {
    id: "core.soul-siphon",
    name: "Seelenzapfer",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [
      { kind: "dealDamage", to: { target: 0 }, amount: 2 },
      { kind: "gainLife", who: "controller", amount: 2 },
    ],
    rulesText: "Füge einem Ziel deiner Wahl 2 Schaden zu; du gewinnst 2 Leben.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 2 (v0.4, Phase B) — Spells: Schwerpunkt auf den fünf bisher
  // ungenutzten Effekt-Primitiven (createToken, grantKeyword als Effekt,
  // tapPermanent/untapPermanent als Effekt, removeCounters, discardCards).
  // Details/Vergleiche siehe Balancing-Notizen in docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // grantKeyword als Effekt (temporärer Buff bis Zugende, NICHT die
  // statische KeywordAbility). Günstigster Preispunkt im Batch: Eile allein
  // auf einer bereits im Spiel befindlichen Kreatur ist ein enges,
  // situatives Werkzeug (Überraschungsangriff/-block), daher 1 Mana.
  "core.reckless-charge": {
    id: "core.reckless-charge",
    name: "Waghalsiger Sturmlauf",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "swift", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Eile.",
    rarity: "common",
    set: "core",
  },

  // grantKeyword-Trick #2: Evasion für den Alpha-Strike, passend zu lights
  // etablierter airborne-Identität (core.aerie-benediction).
  "core.wings-of-dawn": {
    id: "core.wings-of-dawn",
    name: "Schwingen der Morgenröte",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "airborne", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Flugfähigkeit.",
    rarity: "common",
    set: "core",
  },

  // grantKeyword-Trick #3: deathtouch temporär zu verleihen ist der
  // stärkste der vier Tricks (macht jede Kreatur zu einem garantierten
  // Trade unabhängig von Power/Toughness, analog core.void-assassins
  // Kombo-Logik aus 6d(4)) — daher teurer (2 statt 1 Mana) und uncommon
  // statt common, passend zu voids Premium-Interaktions-Identität.
  "core.venom-brand": {
    id: "core.venom-brand",
    name: "Giftmal",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "deathtouch", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Todesberührung.",
    rarity: "uncommon",
    set: "core",
  },

  // grantKeyword-Trick #4: trample allein ist nur relevant, falls geblockt
  // wird (siehe trample-Quartett-Notiz aus Batch 1) — daher der billigste
  // der vier Tricks.
  "core.bramble-surge": {
    id: "core.bramble-surge",
    name: "Dornenstoß",
    type: "spell",
    speed: "fast",
    cost: { wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "trample", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Trampelschaden.",
    rarity: "common",
    set: "core",
  },

  // tapPermanent als Effekt (Removal-lite/Tempo, NICHT der additionalCosts-
  // Fall "tap" als Bezahlung). Klassisches tide-Tempo-Werkzeug: verhindert
  // einen Block oder einen Angriff für eine Runde, zerstört aber nichts.
  "core.riptide-snare": {
    id: "core.riptide-snare",
    name: "Flutfessel",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
    effects: [{ kind: "tapPermanent", what: { target: 0 } }],
    rulesText: "Tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
    rarity: "common",
    set: "core",
  },

  // untapPermanent als Effekt: enttappt eine eigene Kreatur, z.B. um sie
  // nach dem Angriff wieder als Blocker verfügbar zu machen oder eine
  // getappte Manafähigkeit/aktivierte Fähigkeit ein zweites Mal zu nutzen.
  "core.second-wind": {
    id: "core.second-wind",
    name: "Zweiter Atem",
    type: "spell",
    speed: "fast",
    cost: { light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "untapPermanent", what: { target: 0 } }],
    rulesText: "Enttappe eine Kreatur deiner Wahl, die du kontrollierst.",
    rarity: "common",
    set: "core",
  },

  // removeCounters als Effekt: gezielte Antwort auf +1/+1-Marken-Strategien
  // (core.grove-elder, core.moss-elder). Bewusst in tide statt void
  // eingeordnet ("Strom zehrt Marken aus") und als einziges direktes
  // Counter-Removal im Set uncommon statt common, da situativ stark gegen
  // bestimmte Decks, sonst tot in der Hand.
  "core.wither-touch": {
    id: "core.wither-touch",
    name: "Auszehrender Strom",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"] }],
    effects: [{ kind: "removeCounters", what: { target: 0 }, counterType: "plus1plus1", count: 2 }],
    rulesText: "Entferne bis zu zwei +1/+1-Marken von einer Kreatur deiner Wahl.",
    rarity: "uncommon",
    set: "core",
  },

  // discardCards als Effekt (NICHT additionalCosts). Sorcery-Speed passend
  // zu voids Kontroll-/Drain-Identität; `random:true`, da die Engine keinen
  // Auswahlkanal für den abwerfenden Spieler kennt (deterministisches
  // hand[0] wäre keine echte "Wahl") — siehe Kommentar in effects.ts.
  "core.mind-rot": {
    id: "core.mind-rot",
    name: "Geistesfäule",
    type: "spell",
    speed: "slow",
    cost: { generic: 1, void: 1 },
    effects: [{ kind: "discardCards", who: "opponent", count: 1, random: true }],
    rulesText: "Dein Gegner wirft eine zufällig bestimmte Karte ab.",
    rarity: "common",
    set: "core",
  },

  // createToken-Symmetriepaar #1 (wild): 2 Mana für zwei 1/1-Token, analog
  // zum firstStrike-Symmetriepaar aus Batch 1 als farbunabhängiger
  // Referenzpreis für "Token-Spawner". Slow, da reiner Board-Aufbau ohne
  // Interaktionswert.
  "core.seedling-swarm": {
    id: "core.seedling-swarm",
    name: "Schwarm der Sprösslinge",
    type: "spell",
    speed: "slow",
    cost: { generic: 1, wild: 1 },
    effects: [
      { kind: "createToken", who: "controller", tokenDefinitionId: "core.sprout-token", count: 2 },
    ],
    rulesText: "Erschaffe zwei 1/1 Sprössling-Kreaturen.",
    rarity: "common",
    set: "core",
  },

  // createToken-Symmetriepaar #2 (void): identischer Preispunkt/Statline
  // wie core.seedling-swarm, siehe Balancing-Notiz "Token-Symmetriepaar".
  "core.grave-legion": {
    id: "core.grave-legion",
    name: "Grablegion",
    type: "spell",
    speed: "slow",
    cost: { generic: 1, void: 1 },
    effects: [
      { kind: "createToken", who: "controller", tokenDefinitionId: "core.skeleton-token", count: 2 },
    ],
    rulesText: "Erschaffe zwei 1/1 Gebeinknecht-Kreaturen.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 3 (v0.5, Phase B) — Spells: Schwerpunkt scry, `minus1minus1`,
  // sowie die bisher komplett ungenutzten Effekte `modifyStats`,
  // `loseLife` und `destroyPermanent` (siehe Balancing-Notizen in
  // docs/cards/starter-set.md, Abschnitt "Batch 3").
  // -----------------------------------------------------------------

  // Zweite scry-Karte im Batch: der reale Wert steckt komplett in der
  // Lebenspunkte-Gewinn-Hälfte (2 statt core.healing-lights 4, siehe dort),
  // scry wird bewusst mit 0 Wert bepreist (aktuell No-Op, §9.7).
  "core.moonlit-augury": {
    id: "core.moonlit-augury",
    name: "Mondlicht-Weissagung",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, wild: 1 },
    effects: [
      { kind: "gainLife", who: "controller", amount: 2 },
      { kind: "scry", who: "controller", count: 1 },
    ],
    rulesText: "Gewinne 2 Leben. Sieh dir die oberste Karte deiner Bibliothek an und lege sie oben oder unten auf die Bibliothek zurück.",
    rarity: "common",
    set: "core",
  },

  // `minus1minus1`-Marken als eigenständiger Debuff-Spell (Gegenstück zu
  // core.rot-touched-stalker, void) — siehe Balancing-Notiz zum
  // Unterschied gegenüber den Curse-Auren.
  "core.rootbane-wither": {
    id: "core.rootbane-wither",
    name: "Wurzelbann-Fäulnis",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"] }],
    effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "minus1minus1", count: 2 }],
    rulesText: "Lege zwei -1/-1-Marken auf eine Kreatur deiner Wahl.",
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `modifyStats` im Pool (bisher wurde jeder temporäre
  // Buff über `grantKeyword` als Effekt oder `addCounters` dargestellt,
  // reiner Stat-Trick fehlte). Aggressiver Combat-Trick, flame-typisch.
  "core.blazing-frenzy": {
    id: "core.blazing-frenzy",
    name: "Lodernder Rausch",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 2, toughness: 0 }, duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges +2/+0.",
    rarity: "common",
    set: "core",
  },

  // Defensiver `modifyStats`-Trick, Gegenstück zu core.blazing-frenzy
  // (gleicher Gesamtwert 2, Toughness- statt Power-fokussiert, passend zu
  // lights defensiver Identität).
  "core.aegis-ward": {
    id: "core.aegis-ward",
    name: "Ägis-Schutz",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 0, toughness: 3 }, duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges +0/+3.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von `loseLife` im Pool. Anders als core.fire-jolt (2
  // Schaden an EIN BELIEBIGES Ziel) trifft dieser Effekt ausschließlich den
  // gegnerischen Spieler, dafür ist es kein "Schaden" — löst weder
  // deathtouch-Markierung noch lifelink beim Verursacher aus und kann durch
  // keine Schadens-bezogene Interaktion verhindert werden. Reine
  // Spieler-Drain-Karte, daher trotz Zielbeschränkung auf demselben
  // Preispunkt wie fire-jolt (1 Mana).
  "core.hexbind-lash": {
    id: "core.hexbind-lash",
    name: "Fluchband-Peitsche",
    type: "spell",
    speed: "fast",
    cost: { void: 1 },
    effects: [{ kind: "loseLife", who: "opponent", amount: 2 }],
    rulesText: "Dein Gegner verliert 2 Leben.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von `destroyPermanent` im Pool (bisher war
  // core.banishment-rite mit `exilePermanent` die einzige harte
  // Entfernungskarte). Bewusst BILLIGER als banishment-rite (3 statt 4
  // Mana): destroy lässt anders als exile Tod-Trigger des Ziels zu (z.B.
  // core.husk-crawler zieht dem Gegner eine Karte) und ist mit
  // Reanimations-/Recursion-Effekten interagierbar — der Preis-Malus für
  // exile gegenüber destroy ist also inhaltlich gerechtfertigt, nicht nur
  // Zahlenkosmetik.
  "core.doomreap-edict": {
    id: "core.doomreap-edict",
    name: "Verhängnisernte",
    type: "spell",
    speed: "slow",
    cost: { generic: 2, void: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
    effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
    rulesText: "Zerstöre eine gegnerische Kreatur deiner Wahl.",
    rarity: "uncommon",
    set: "core",
  },

  // Fünfter `grantKeyword`-Trick (nach dem Batch-2-Quartett swift/airborne/
  // trample/deathtouch): firstStrike temporär, komplettiert damit alle
  // fünf "aggressiven" Kampf-Keywords als Einmal-Trick. Gleicher Preispunkt
  // wie core.venom-brand (deathtouch), da ein garantierter Erststurm auf
  // einem bereits starken Angreifer ebenfalls einen Kampf einseitig
  // entscheiden kann.
  "core.embermarch-brand": {
    id: "core.embermarch-brand",
    name: "Glutmarsch-Brandmal",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "firstStrike", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Erststurm.",
    rarity: "uncommon",
    set: "core",
  },

  // v0.3 Modell-Update (Modal-Effekte, rules-engine.md 4 + 9.13): Testkarte
  // für `modes` auf einem `spell(fast)` — "Charm"-artig mit 3 Modi (Modus 1
  // mit Zielslot, Modi 2/3 ohne), Moduswahl vor Zielwahl (`chosenMode` an
  // der castSpell-Aktion, wie in 4/9.13 spezifiziert). Preislich am
  // teuersten Einzelmodus orientiert plus Flexibilitätsaufschlag: Modus 1
  // entspricht core.fire-jolt (1 Mana, 2 Schaden an ein beliebiges Ziel),
  // Modus 2 entspricht core.mind-rots Effekt (dort 2 Mana, `slow`-only —
  // hier `fast`-Speed, also strikt stärker als Einzelkarte), Modus 3 ist
  // ein reiner Karten-Cantrip. Da immer nur EIN Modus zum Zug kommt (kein
  // additiver Wert gegenüber den Einzelkarten), hält {2}{Leere} (3 Mana) die
  // Karte über core.mind-rots Solo-Preis, ohne einen der drei Effekte für
  // sich zu dominieren.
  "core.void-covenant": {
    id: "core.void-covenant",
    name: "Bund der Leere",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, void: 1 },
    effects: [],
    modes: [
      {
        text: "Füge einer Kreatur oder einem Spieler deiner Wahl 2 Schaden zu.",
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
      },
      {
        text: "Dein Gegner wirft eine zufällig bestimmte Karte ab.",
        effects: [{ kind: "discardCards", who: "opponent", count: 1, random: true }],
      },
      {
        text: "Ziehe eine Karte.",
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
      },
    ],
    rulesText: "Wähle eins — Füge einer Kreatur oder einem Spieler deiner Wahl 2 Schaden zu. Oder: Dein Gegner wirft eine zufällig bestimmte Karte ab. Oder: Ziehe eine Karte.",
    rarity: "uncommon",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Relic
  // ---------------------------------------------------------------------

  "core.clockwork-brooch": {
    id: "core.clockwork-brooch",
    name: "Uhrwerkbrosche",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "{1}, Tappe die Uhrwerkbrosche: Ziehe eine Karte.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Testkarte für eine "reine" StaticAbility auf einem Nicht-Enchantment-
  // Permanent (auf Wunsch des Game-Architect, v0.2). Farblose Kosten passend
  // zur bestätigten Design-Linie "Relics möglichst farblos".
  "core.iron-standard": {
    id: "core.iron-standard",
    name: "Eisernes Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Units, die du kontrollierst, erhalten +1/+0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.2.3 Batch 1: defensiver, billigerer Gegenpol zu core.iron-standard
  // (+0/+1 statt +1/+0, 2 statt 3 generisches Mana) — siehe Balancing-Notizen.
  "core.wardstone-idol": {
    id: "core.wardstone-idol",
    name: "Wardstein-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Units, die du kontrollierst, erhalten +0/+1.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Batch 2 (v0.4): tapPermanent als wiederholbare Relic-Fähigkeit
  // (Tempo-/Control-Werkzeug, farblos gemäß Design-Linie "Relics möglichst
  // farblos"). Kosten {1}+Tap pro Aktivierung halten es langsamer als
  // core.riptide-snare (einmalig, aber ohne wiederkehrende Mana-Investition).
  "core.chain-manacles": {
    id: "core.chain-manacles",
    name: "Kettenfessel",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "{1}, Tappe die Kettenfessel: Tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 2 (v0.4): removeCounters als wiederholbare Relic-Fähigkeit —
  // Farblose Antwort auf +1/+1-Marken-Strategien, Gegenstück zu
  // core.wither-touch (Spell, einmalig, farbig) als "Werkzeug statt
  // Einmaleffekt"-Variante.
  "core.corrosive-clamp": {
    id: "core.corrosive-clamp",
    name: "Zersetzende Klammer",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"] }],
        effects: [{ kind: "removeCounters", what: { target: 0 }, counterType: "plus1plus1", count: 2 }],
        text: "{2}, Tappe die Zersetzende Klammer: Entferne bis zu zwei +1/+1-Marken von einer Kreatur deiner Wahl.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Farblose, teurere Variante von core.grove-elders {1}{Wild}-Fähigkeit
  // (kein Tap-Kosten, aber {2} statt {1}{Wild} pro Aktivierung UND ein
  // eigenständiger 3-Mana-Permanent-Slot statt an einen 3/5-Körper
  // gebunden) — klassischer "farblos, aber schwächer/teurer"-Trade-off.
  "core.growth-totem": {
    id: "core.growth-totem",
    name: "Wachstumstotem",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "{2}: Lege einen +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Farbloses Gegenstück zu core.wildgrowth-field (wild, {2}{Wild}, +1/+1
  // ownUnits, rare): identischer Effekt, aber teurer (4 statt 3 Mana) und
  // farblos — dieselbe Trade-off-Logik wie core.iron-standard vs.
  // core.wildgrowth-field, hier auf die stärkere +1/+1-Variante angewendet.
  "core.warforged-standard": {
    id: "core.warforged-standard",
    name: "Kriegsgeschmiedetes Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Units, die du kontrollierst, erhalten +1/+1.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 3 (v0.5, Phase B) — Relics: Schwerpunkt `costChange`, `scope:
  // opponentUnits`/`scope: allUnits`, sowie die AdditionalCost-Varianten
  // `payLife`/`discardCards` (bisher nur `tap`/`sacrificeSelf` im Pool).
  // -----------------------------------------------------------------

  // Erste `costChange`-Karte im Pool (Static-Modifier, von der Engine seit
  // Batch 3 implementiert/getestet, siehe cost-change.test.ts). `scope` ist
  // für diesen Modifier wirkungslos (nur `modifier.appliesTo` zählt, siehe
  // stats.ts#computeSpellCostDelta) — trotzdem auf "self" gesetzt, wie vom
  // Engine-Engineer empfohlen. Betrifft ALLES, was der Controller über
  // `castSpell` spielt (Units/Spells/Relics/Enchantments, nicht nur
  // Karten vom Typ "spell"), daher ein sehr starker, deckweiter
  // Beschleunigungs-Effekt — entsprechend teuer (4 generisches Mana) und
  // rare. Farblose, teurere Version von core.cinderforge-charm (siehe
  // Enchantments), analog zur etablierten "farblos aber teurer"-Logik.
  "core.forgeheart-crucible": {
    id: "core.forgeheart-crucible",
    name: "Schmiedeherz-Tiegel",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "costChange", appliesTo: "ownSpells", genericDelta: -1 },
        text: "Deine Zaubersprüche kosten {1} weniger (generisch).",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Erste Nutzung von `scope: "opponentUnits"` im Pool. Farblose,
  // schwächere Variante (-0/-1 statt -1/-1) neben dem stärkeren, farbigen
  // core.blightmire-shroud (Enchantment, void, -1/-1) — dieselbe
  // "farblos&schwächer vs. farbig&stärker"-Logik wie beim bestehenden
  // ownUnits-Paar core.iron-standard/core.wildgrowth-field.
  "core.dominion-collar": {
    id: "core.dominion-collar",
    name: "Bann-Halsband",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "opponentUnits" },
        modifier: { kind: "stats", power: 0, toughness: -1 },
        text: "Kreaturen, die dein Gegner kontrolliert, erhalten -0/-1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `scope: "allUnits"` im Pool. Symmetrischer Buff
  // (trifft EIGENE und GEGNERISCHE Kreaturen gleichermaßen) — bewusst
  // schwächer bepreist als core.iron-standard (ownUnits, +1/+0, 3 Mana),
  // da der Effekt dem Gegner denselben Vorteil verschafft: nur sinnvoll,
  // wenn der Controller mehr/wichtigere Kreaturen hat als der Gegner. Siehe
  // ausführliche Balancing-Notiz zum allUnits-Paar (mit core.ashfall-
  // plague) in docs/cards/starter-set.md.
  "core.warhorn-standard": {
    id: "core.warhorn-standard",
    name: "Kriegshorn-Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "allUnits" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Alle Kreaturen im Spiel erhalten +1/+0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `payLife` als AdditionalCost auf einer aktivierten
  // Fähigkeit (Engine validiert/zahlt es bereits vollständig, siehe
  // actions.ts). Klassisches "Leben statt Mana"-Kartenzieh-Werkzeug,
  // farblos gemäß Design-Linie "Relics möglichst farblos".
  "core.soulforged-censer": {
    id: "core.soulforged-censer",
    name: "Seelengeschmiedetes Räuchergefäß",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "payLife", amount: 2 }, { kind: "tap" }],
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Zahle 2 Leben, Tappe das Seelengeschmiedete Räuchergefäß: Ziehe eine Karte.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `discardCards` als AdditionalCost (statt als Effekt
  // wie core.mind-rot/core.grasping-shadows). Wirft deterministisch die
  // oberste Handkarte ab (Engine kennt keinen Auswahlkanal für den
  // zahlenden Spieler, analog zur `random`-Einschränkung bei
  // discardCards-als-Effekt) — klassisches "Loot"-Werkzeug: eine Karte
  // gegen zwei tauschen, Netto-Kartenvorteil +1 für {1} und Tempoverlust.
  "core.wraithbound-ledger": {
    id: "core.wraithbound-ledger",
    name: "Schattengebundenes Kontobuch",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "discardCards", count: 1 }],
        effects: [{ kind: "drawCards", who: "controller", count: 2 }],
        text: "{1}, wirf die oberste Karte deiner Hand ab: Ziehe zwei Karten.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Nutzt `destroyPermanent` als wiederholbare Fähigkeit UND schließt eine
  // echte Pool-Lücke: bisher gab es KEINE Möglichkeit, gegnerische Relics/
  // Enchantments/Terrains zu entfernen (core.banishment-rite/core.doomreap-
  // edict zielen beide nur auf Units). Langsam (3 Mana Cast + {2}+Tap pro
  // Aktivierung) und ohne Farbzwang, passend zu "Relics möglichst farblos".
  "core.gravetide-obelisk": {
    id: "core.gravetide-obelisk",
    name: "Grabflut-Obelisk",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["relic", "enchantment", "terrain"] }],
        effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
        text: "{2}, Tappe den Grabflut-Obelisken: Zerstöre ein Relikt, eine Verzauberung oder ein Terrain deiner Wahl.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.3 Modell-Update (X-Kosten auf aktivierten Fähigkeiten, rules-engine.md
  // 4 + 9.12): erste Testkarte für `chosenX` an einer `activateAbility`
  // (bisher nur auf Spells wie core.inferno-surge). Reiner Mana-Sink,
  // wiederholbar (Tap-Kosten begrenzt auf 1×/Zug) statt Einmaleffekt wie
  // core.inferno-surge — daher deutlich teurer im Cast ({4} generisch,
  // `rare`) und ohne Farbbindung (Design-Linie "Relics möglichst farblos").
  // KEINE Mana-Fähigkeit (hat Ziele und geht über den Stack) — das Verbot
  // aus 9.12 für isManaAbility+X gilt hier nicht.
  "core.cinderwrack-engine": {
    id: "core.cinderwrack-engine",
    name: "Sengende Kriegsmaschine",
    type: "relic",
    subtypes: ["Wunderwerk", "Belagerungsgerät"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "activated",
        manaCost: { x: true },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: { kind: "x" } }],
        text: "{X}, Tappe die Sengende Kriegsmaschine: Füge einem Ziel deiner Wahl X Schaden zu.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // ---------------------------------------------------------------------
  // Enchantments (aura + global)
  // ---------------------------------------------------------------------

  "core.blessing-of-steadfastness": {
    id: "core.blessing-of-steadfastness",
    name: "Segen der Standhaftigkeit",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, light: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 1, toughness: 2 },
        text: "Die verzauberte Unit erhält +1/+2.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  "core.wildgrowth-field": {
    id: "core.wildgrowth-field",
    name: "Wildwuchsfeld",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, wild: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Units, die du kontrollierst, erhalten +1/+1.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // v0.2.3 Batch 1: aggressiver Gegenpol zu core.blessing-of-steadfastness
  // (+2/+1 statt +1/+2, gleicher Stat-Gesamtwert 3) — siehe Balancing-Notizen.
  "core.mantle-of-thorns": {
    id: "core.mantle-of-thorns",
    name: "Dornenmantel",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, wild: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 2, toughness: 1 },
        text: "Die verzauberte Unit erhält +2/+1.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Batch 2 (v0.4): erste "reine Power"-Aura im Set (+3/+0), Gesamtwert 3
  // wie core.blessing-of-steadfastness (+1/+2) und core.mantle-of-thorns
  // (+2/+1) — komplettiert die Verteilungs-Extreme derselben Preisklasse
  // (2 Mana, Gesamtwert 3). Keine Toughness-Absicherung macht sie anfälliger
  // gegen Removal/Blocks als die beiden anderen, dafür maximaler
  // Offense-Payoff — passt zu flames Identität.
  "core.brand-of-fury": {
    id: "core.brand-of-fury",
    name: "Brandmal der Wut",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, flame: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 3, toughness: 0 },
        text: "Die verzauberte Unit erhält +3/+0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste "Fluch"-Aura im Set: legt sich auf eine GEGNERISCHE Unit statt
  // eine eigene (auraTarget mit controller:"opponent"). Toughness-lastige
  // Variante (-1/-2, "Fäule schwächt die Substanz") — Gegenstück zu
  // core.riptide-shackles (tide, power-lastig), gleicher Gesamtwert (-3)
  // wie das flame/wild/light-Buff-Trio, hier als Debuff. Pseudo-Removal
  // gegen kleine Kreaturen, aber deutlich billiger als das bedingungslose
  // core.banishment-rite (2 statt 4 Mana), da nur schwächt statt entfernt.
  "core.rootrot-curse": {
    id: "core.rootrot-curse",
    name: "Fluch der Wurzelfäule",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, wild: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: -1, toughness: -2 },
        text: "Die verzauberte Unit erhält -1/-2.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Power-lastiges Gegenstück zu core.rootrot-curse (-2/-1, "Fesseln
  // lähmen den Angriff") — identischer Preis/Gesamtwert, entgegengesetzte
  // Verteilung, passend zu tides Tempo-Identität (Angreifer entschärfen
  // statt Kreaturen zu töten).
  "core.riptide-shackles": {
    id: "core.riptide-shackles",
    name: "Flutschellen",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, tide: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: -2, toughness: -1 },
        text: "Die verzauberte Unit erhält -2/-1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Farbige, stärkere Variante von core.wardstone-idol (Relic, farblos,
  // {2}, +0/+1): +0/+2 für {2}{Licht}{Licht} — dieselbe "farbig&stärker vs.
  // farblos&schwächer"-Logik wie core.wildgrowth-field vs. core.iron-standard,
  // hier auf die Toughness-Anthem-Linie angewendet.
  "core.sunlit-canopy": {
    id: "core.sunlit-canopy",
    name: "Sonnendach",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, light: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 0, toughness: 2 },
        text: "Units, die du kontrollierst, erhalten +0/+2.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // createToken als wiederkehrender Trigger (nicht einmalig wie
  // core.seedling-swarm): wandelt "eigene Kreatur stirbt" dauerhaft in
  // Boardpräsenz um. Starke Value-Engine im langen Spiel, daher hoch
  // bepreist (4 Mana) und rare, wie core.wildgrowth-field als zweites
  // rare-Enchantment in wild.
  "core.verdant-return": {
    id: "core.verdant-return",
    name: "Grüne Wiederkehr",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, wild: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUnitDied", controller: "own" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.sprout-token", count: 1 },
        ],
        text: "Immer wenn eine Kreatur, die du kontrollierst, stirbt, erschaffe einen 1/1 Sprössling-Token.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // discardCards als wiederkehrender Trigger (Gegenstück zu core.mind-rot,
  // einmalig): zwingt den Gegner jede eigene Endphase zum Kartenverlust.
  // Stärkstes Enchantment im Set (unbeantwortbare, wiederkehrende
  // Ressourcen-Erosion ohne eigene Karteninvestition pro Aktivierung),
  // daher teuerste Karte des Batches (5 Mana) und rare.
  "core.grasping-shadows": {
    id: "core.grasping-shadows",
    name: "Greifende Schatten",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 3, void: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEndStep", whoseTurn: "own" },
        effects: [{ kind: "discardCards", who: "eachOpponent", count: 1, random: true }],
        text: "Zu Beginn deines Endsegments wirft dein Gegner eine zufällig bestimmte Karte ab.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 3 (v0.5, Phase B) — Enchantments: Schwerpunkt `costChange`
  // (farbige, günstigere Gegenstücke zu den beiden Batch-3-Relics),
  // `scope: opponentUnits`/`scope: allUnits` (farbige, stärkere
  // Gegenstücke), sowie `onUpkeep` und `onSpellCast` (beide bisher
  // ungenutzte, aber von der Engine vollständig verdrahtete
  // TriggerConditions, siehe turn.ts/triggers.ts).
  // -----------------------------------------------------------------

  // Farbige, günstigere Variante von core.forgeheart-crucible (Relic,
  // farblos, {4}) — dieselbe "farbig&billiger vs. farblos&teurer"-Logik wie
  // core.wildgrowth-field vs. core.iron-standard. Wirkt auf ALLES, was der
  // Controller castet (nicht nur Karten vom Typ "spell"), daher trotz
  // niedrigerer Kosten als core.iron-standard/core.wildgrowth-field-Tier
  // bereits als eigenständiger deckweiter Beschleuniger rare.
  "core.cinderforge-charm": {
    id: "core.cinderforge-charm",
    name: "Glutschmiede-Amulett",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, flame: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "costChange", appliesTo: "ownSpells", genericDelta: -1 },
        text: "Deine Zaubersprüche kosten {1} weniger (generisch).",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Gegenstück zu core.cinderforge-charm: verteuert stattdessen ALLES, was
  // der GEGNER castet, um {1} generisch — ein reines Prison-/Control-
  // Werkzeug ohne eigenen Boardimpact, daher wie core.grasping-shadows als
  // teure, langfristig wirkende rare-Engine eingestuft.
  "core.tariff-spire": {
    id: "core.tariff-spire",
    name: "Zollturm",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, tide: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "costChange", appliesTo: "opponentSpells", genericDelta: 1 },
        text: "Zaubersprüche deines Gegners kosten {1} mehr (generisch).",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Farbige, stärkere Variante von core.dominion-collar (Relic, farblos,
  // -0/-1): -1/-1 für {2}{Leere}{Leere}. Asymmetrisch (trifft NUR den
  // Gegner) und dauerhaft für JEDE zukünftig gespielte gegnerische Einheit
  // wirksam — mächtiger als ein einmaliger Board-Wipe, da es sich nicht
  // "verbraucht". Entsprechend hoch bepreist und rare.
  "core.blightmire-shroud": {
    id: "core.blightmire-shroud",
    name: "Fäulmoor-Schleier",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, void: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "opponentUnits" },
        modifier: { kind: "stats", power: -1, toughness: -1 },
        text: "Kreaturen, die dein Gegner kontrolliert, erhalten -1/-1.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Farbige, stärkere Variante von core.warhorn-standard (Relic, farblos,
  // allUnits +1/+0): -1/-1 für ALLE Kreaturen im Spiel, eigene wie
  // gegnerische. Bewusst in flame statt einer defensiven Farbe verortet
  // ("verbrannte Erde" — passt zu flames rücksichtsloser Identität: auch
  // die eigenen kleinen Kreaturen trifft es). Symmetrisch UND permanent
  // (nicht nur ein einmaliger Wipe, sondern eine dauerhafte Erschwernis für
  // JEDE künftig gespielte 1-Toughness-Kreatur beider Spieler) — siehe
  // ausführliche Balancing-Notiz zum allUnits-Paar unten.
  "core.ashfall-plague": {
    id: "core.ashfall-plague",
    name: "Aschfall-Seuche",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, flame: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "allUnits" },
        modifier: { kind: "stats", power: -1, toughness: -1 },
        text: "Alle Kreaturen im Spiel erhalten -1/-1.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Erste Nutzung von `onUpkeep` im Pool (Engine feuert es bereits pro
  // Bereitschaftssegment, siehe turn.ts). Bewusst niedrig bepreist/
  // uncommon: 1 Leben pro eigenem Zug ist ein langsamer, kleiner Vorteil
  // (Gegenstück im Tempo zu core.dawn-medics einmaligen 2 Leben, hier
  // dafür wiederkehrend und ohne Kartenverbrauch nach dem Cast).
  "core.dawnrise-sanctuary": {
    id: "core.dawnrise-sanctuary",
    name: "Morgenaufgangs-Heiligtum",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, light: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUpkeep", whoseTurn: "own" },
        effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
        text: "Zu Beginn deines Bereitschaftssegments gewinnst du 1 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `onSpellCast` im Pool (Engine feuert es bereits bei
  // jedem `castSpell`, siehe actions.ts/triggers.ts) — klassischer
  // "Bestrafer": OHNE `spellSpeed`-Einschränkung feuert er bei JEDER
  // nicht-Terrain-Karte, die der Gegner spielt (Units/Spells/Relics/
  // Enchantments), nicht nur bei Karten vom Typ "spell". Dieser breite
  // Anwendungsbereich (analog zu costChange) macht die Karte über ein
  // ganzes Spiel potenziell sehr stark, daher trotz moderater Kosten rare.
  "core.warding-thorns": {
    id: "core.warding-thorns",
    name: "Wehrdorn-Hecke",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, wild: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onSpellCast", caster: "opponent" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 1 }],
        text: "Immer wenn dein Gegner eine Karte spielt, fügt ihm die Wehrdorn-Hecke 1 Schaden zu.",
      },
    ],
    rarity: "rare",
    set: "core",
  },
};

export default starterSet;
