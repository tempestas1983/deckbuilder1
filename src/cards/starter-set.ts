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
};

export default starterSet;
