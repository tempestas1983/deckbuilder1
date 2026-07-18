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
  // Batch 4 (v0.7) — neue Kombinationen bestehender Bausteine, u.a. erste
  // Nutzung von onAttackDeclared/onBlockDeclared (siehe Balancing-Notizen
  // "Batch 4" in docs/cards/starter-set.md).
  // ---------------------------------------------------------------------

  // Erste Nutzung von `onAttackDeclared` im Pool (Engine feuert es bereits
  // beim Deklarieren als Angreifer, siehe combat.ts) — feuert unabhängig
  // davon, ob der Angriff geblockt wird oder durchkommt (anders als
  // core.tideshard-rogues onDealtCombatDamageToPlayer, das Evasion braucht).
  // Body unter core.storm-strider (3/2 swift, 3 Mana) angesetzt, da die
  // garantierte Wiederholbarkeit den Malus rechtfertigt.
  "core.raidhorn-berserker": {
    id: "core.raidhorn-berserker",
    name: "Sturmruf-Berserker",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 2, flame: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onAttackDeclared", what: "self" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 1 }],
        text: "Immer wenn der Sturmruf-Berserker als Angreifer deklariert wird, füge deinem Gegner 1 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite createToken-ETB-Unit im Pool (nach core.aureate-caller, light) —
  // identischer Preis (3 Mana), aber aggressivere Statverteilung (2/1 statt
  // 2/2), passend zu flames dünnerer Toughness-Identität (vgl. core.leech­
  // spawn/core.thistlehide-healer als etabliertes Muster gleicher Effekt/
  // Preis, unterschiedliche Statverteilung je Farbidentität).
  "core.cinderwing-fledgling": {
    id: "core.cinderwing-fledgling",
    name: "Glutschwingen-Junges",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 2, flame: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.spirit-token", count: 1 },
        ],
        text: "Wenn das Glutschwingen-Junge ins Spiel kommt, erschaffe einen 1/1 Lichtgeist-Token mit Flieger.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 5 (v0.8): zweite Nutzung von `onDamageReceived` im Pool (nach
  // core.thornrage-boar, wild) — komplementäres Vergeltungsdesign: aggressive
  // Statline (3/2 statt 2/3) mit schwächerer Vergeltung (1 statt 2 Schaden),
  // gleicher Preis (3 Mana). Siehe Balancing-Notizen "Batch 5".
  "core.cinderlash-brute": {
    id: "core.cinderlash-brute",
    name: "Glutpeitschen-Schläger",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 2, flame: 1 },
    power: 3,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDamageReceived", what: "self" },
        effects: [{ kind: "dealDamage", to: "eventSubject", amount: 1 }],
        text: "Immer wenn der Glutpeitschen-Schläger Schaden erhält, fügt er der Schadensquelle 1 Schaden zu.",
      },
    ],
    rulesText: "Vergeltung: 1 Schaden an die Schadensquelle bei jedem erhaltenen Schaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 6: vierte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility (nach core.sunward-vanguard,
  // light/lifelink; core.thornhide-brawler, wild/trample; core.dawnfeather-
  // scout, light/airborne) — erste flame-Karte dieses Musters. Effektiv 3/1
  // Eile für 2 Mana (Basis 2/1 + statisches +1/+0), common wie die anderen
  // nicht-trample-Vertreter dieser Familie (reine Druckkosmetik, siehe
  // Balancing-Notiz „scope:self" aus Batch 3).
  "core.cinderborn-raider": {
    id: "core.cinderborn-raider",
    name: "Glutgeborener Plünderer",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 1, flame: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "swift" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Diese Einheit erhält permanent +1/+0 (angeboren).",
      },
    ],
    rulesText: "Eile. Angeborene Stärke: permanent +1/+0.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 7 — Units: liberale Wiederverwendung bewährter Bausteine,
  // u.a. drei echte Keyword-Farb-Lücken geschlossen (reach/void,
  // lifelink/tide, deathtouch/light — siehe Balancing-Notizen „Batch 7"
  // in docs/cards/starter-set.md).
  // -----------------------------------------------------------------

  // Zweite airborne-Karte in flame (nach core.ember-whelp, dort mit ETB-
  // Trigger statt reiner Statline) — reine Vanilla+Keyword-Statline,
  // identischer Preispunkt/identische Statline wie core.wraithwing-stalker
  // (void, 2/1 airborne, 2 Mana).
  "core.cinderdrift-wing": {
    id: "core.cinderdrift-wing",
    name: "Aschentrift-Schwinge",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 1, flame: 1 },
    power: 2,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "airborne" }],
    rulesText: "Flieger.",
    rarity: "common",
    set: "core",
  },

  // Vierte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility (nach core.sunward-vanguard/
  // light+lifelink, core.thornhide-brawler/wild+trample, core.cinderborn-
  // raider/flame+swift) — erste trample-Variante in flame. Effektiv 3/2
  // Trampelschaden für 3 Mana, common wie die übrigen nicht-trample-
  // Vertreter dieser Familie (reine Druckkosmetik, siehe Balancing-Notiz
  // „scope:self" aus Batch 3).
  "core.cinderclad-raider": {
    id: "core.cinderclad-raider",
    name: "Aschgewandeter Räuber",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 2, flame: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "trample" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Diese Einheit erhält permanent +1/+0 (angeboren).",
      },
    ],
    rulesText: "Trampelschaden. Angeborene Stärke: permanent +1/+0.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 8 — Units: Hauptfokus dieses Batches ist die neue,
  // typ-agnostische/ursachenunabhängige `onDeath{self}`-Semantik
  // (rules-engine.md 9.15, engine-status.md v0.3.5) — "Parting Shot"-
  // Designs, deren Sterbe-Payoff jetzt GARANTIERT auch bei Entfernung
  // durch destroyPermanent-Removal (core.doomreap-edict) oder eigene
  // sacrificeSelf-Kosten feuert, nicht mehr nur bei Kampf-/SBA-Tod.
  // Details/Balancing-Begründung siehe „Batch 8"-Abschnitt in
  // docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // Erste flame-Kopie des core.husk-crawler/core.plaguebound-wretch-
  // Musters (2 Mana, zerbrechlicher Körper, onDeath-Payoff) — hier mit
  // direktem Schaden statt Kartenziehen/Marke. Bewusst der schwächste
  // der drei Payoff-Typen (1 statt 2 Schaden), da unbedingt (kein Ziel
  // nötig, anders als plaguebound-wretchs Marke) und laut 9.15
  // garantiert auch bei jedem destroyPermanent-Removal auslöst, nicht
  // nur bei Kampf-/SBA-Tod.
  "core.cinderwake-marauder": {
    id: "core.cinderwake-marauder",
    name: "Aschwoge-Plünderer",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 1, flame: 1 },
    power: 3,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 1 }],
        text: "Wenn der Aschwoge-Plünderer stirbt, füge deinem Gegner 1 Schaden zu.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Fünfte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility (nach core.cinderborn-
  // raider/flame+swift, core.cinderclad-raider/flame+trample, core.
  // tidecrest-warden/tide+vigilant) — erste vigilant-Variante in flame.
  // Effektiv 3/1 wachsam für 2 Mana.
  "core.cinderwatch-raider": {
    id: "core.cinderwatch-raider",
    name: "Aschwacht-Plünderer",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 1, flame: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "vigilant" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Diese Einheit erhält permanent +1/+0 (angeboren).",
      },
    ],
    rulesText: "Wachsam. Angeborene Stärke: permanent +1/+0.",
    rarity: "common",
    set: "core",
  },

  // Zweite Farbe für das ETB-`tapPermanent`-Muster (nach core.
  // tidebind-courser/core.tideshaper-adept, tide) — aggressiverer
  // Körper (3/1 statt 2/2, gleicher Preis 3 Mana), passend zu flames
  // dünnerer Toughness-Identität.
  "core.ashbrand-vanguard": {
    id: "core.ashbrand-vanguard",
    name: "Aschbrand-Vorhut",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 2, flame: 1 },
    power: 3,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "Wenn die Aschbrand-Vorhut ins Spiel kommt, tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 9 (v0.12, Abschlussbatch) — Units: liberale Wiederverwendung
  // bewährter Bausteine, um exakt auf 300 Karten zu kommen. Details/
  // Zielplanung siehe „Batch 9" in docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // Neunte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — erste airborne-Variante
  // in flame (nach core.cinderborn-raider/swift, core.cinderclad-raider/
  // trample, core.cinderwatch-raider/vigilant). Effektiv 3/2 Flieger für
  // 3 Mana, ein Tick teurer als die reinen 2-Mana-Vertreter dieser
  // Familie, da Evasion stärker als swift/vigilant/trample allein ist.
  "core.brandwing-harrier": {
    id: "core.brandwing-harrier",
    name: "Brandschwingen-Falke",
    type: "unit",
    subtypes: ["Elementarwesen"],
    cost: { generic: 2, flame: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "airborne" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Diese Einheit erhält permanent +1/+0 (angeboren).",
      },
    ],
    rulesText: "Flieger. Angeborene Stärke: permanent +1/+0.",
    rarity: "common",
    set: "core",
  },

  // Vierte Nutzung von `onBlockDeclared` im Pool (nach core.wardflame-
  // sentinel/light, core.tideshell-warden/tide, core.thornbound-guard/
  // wild) — erste flame-Variante, hier mit `dealDamage` an den Gegner
  // statt gainLife/addCounters (neue Effekt-Paarung für diesen Trigger,
  // kein neues Primitiv). Gleiche Statline/gleicher Preis wie core.
  // wardflame-sentinel (3 Mana, 1/4).
  "core.brandwatch-mercenary": {
    id: "core.brandwatch-mercenary",
    name: "Brandwacht-Söldner",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 2, flame: 1 },
    power: 1,
    toughness: 4,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onBlockDeclared", what: "self" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 1 }],
        text: "Immer wenn der Brandwacht-Söldner als Blocker deklariert wird, füge deinem Gegner 1 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Günstigster firstStrike-Körper im Set (1 Mana, reine Vanilla-
  // Statline 1/1) — analog zu core.emberpaw-cub/core.thicket-fang als
  // Referenzwert „Keyword allein trägt die gesamten Kosten".
  "core.brandblade-fledgling": {
    id: "core.brandblade-fledgling",
    name: "Brandklinge-Lehrling",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { flame: 1 },
    power: 1,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "firstStrike" }],
    rulesText: "Erststurm.",
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

  // Batch 4 (v0.7): vigilant + ETB-tapPermanent kombiniert (bisher getrennt:
  // reines vigilant z.B. core.flame-watch, reines ETB-Tap core.tidebind-
  // courser) - direkter Vergleich zu core.tidebind-courser (2/2, ETB-Tap,
  // 3 Mana, kein Keyword): vigilant kostet hier +1 Mana obendrauf, gleiche
  // Statline.
  "core.tideshaper-adept": {
    id: "core.tideshaper-adept",
    name: "Flutformerin",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 3, tide: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "vigilant" },
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "Wenn die Flutformerin ins Spiel kommt, tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rulesText: "Wachsam.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 4 (v0.7): erste Nutzung von removeCounters als ETB-Effekt auf
  // einem Unit-Koerper (bisher nur als Spell/Relic-Faehigkeit: core.wither-
  // touch/core.corrosive-clamp). Entfernt nur EINEN Marker (statt zwei) und
  // traegt dafuer einen schwachen Koerper (1/2) fuer 2 Mana.
  "core.silt-warden": {
    id: "core.silt-warden",
    name: "Schlickwächterin",
    type: "unit",
    subtypes: ["Krake"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"] }],
        effects: [{ kind: "removeCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "Wenn die Schlickwächterin ins Spiel kommt, entferne einen +1/+1-Marker von einer Kreatur deiner Wahl.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Batch 4 (v0.7): dritte Nutzung von modes im Pool, erste auf einer
  // Unit-ETB mit zwei echten Alternativen inkl. Zielwahl in einem Modus
  // (core.current-diplomat hatte nur EINEN zielbehafteten Modus; hier ist
  // Bounce der staerkere der beiden) - bewusst mit dem bisher schwaechsten
  // Koerper (1/1) fuer 3 Mana bepreist, da "ziehe eine Karte ODER banne eine
  // gegnerische Kreatur temporaer auf die Hand" mindestens so gut ist wie
  // core.current-seer bzw. core.tidal-rebuke einzeln.
  "core.mistveil-trickster": {
    id: "core.mistveil-trickster",
    name: "Nebelschleier-Gauklerin",
    type: "unit",
    subtypes: ["Schurkin", "Geist"],
    cost: { generic: 2, tide: 1 },
    power: 1,
    toughness: 1,
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
            text: "Bringe eine gegnerische Kreatur deiner Wahl auf die Hand ihres Besitzers zurück.",
            targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
            effects: [{ kind: "returnToHand", what: { target: 0 } }],
          },
        ],
        text: "Wenn die Nebelschleier-Gauklerin ins Spiel kommt, waehle eins: Ziehe eine Karte. Oder: Bringe eine gegnerische Kreatur deiner Wahl auf die Hand ihres Besitzers zurück.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 5 (v0.8): zweite Nutzung von `onBlockDeclared` im Pool (nach
  // core.wardflame-sentinel, light) — schwächere/billigere Skalierung
  // desselben Musters: 2 Mana statt 3, 1/3 statt 1/4, 1 Leben statt 2 pro
  // Block. Siehe Balancing-Notizen "Batch 5".
  "core.tideshell-warden": {
    id: "core.tideshell-warden",
    name: "Flutschalen-Wächterin",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 3,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onBlockDeclared", what: "self" },
        effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
        text: "Immer wenn die Flutschalen-Wächterin als Blocker deklariert wird, gewinnst du 1 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 6: `swift` nachgetragen für tide (siehe Fahrplan in
  // docs/cards/starter-set.md — bisher einzige Farbe ohne diese Keyword-
  // Ability, an keiner Stelle als bewusste Farbidentitäts-Lücke
  // dokumentiert). Günstigster Preispunkt (1 Mana, 1/1), identisch zu
  // core.emberpaw-cub (flame) — bewusste 1:1-Übernahme in eine neue Farbe.
  "core.tidewhip-skirmisher": {
    id: "core.tidewhip-skirmisher",
    name: "Flutpeitschen-Plänklerin",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { tide: 1 },
    power: 1,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "swift" }],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  // Vierte Farbe für das `createToken`-ETB-Body-Muster (nach core.cinderwing-
  // fledgling/flame, core.aureate-caller/light) — schafft einen 1/1 Licht­
  // geist-Token mit Flieger. Statverteilung defensiver als die Vorbilder
  // (1/3 statt 2/2, Gesamtwert identisch), passend zu tides defensiver
  // Identität.
  "core.tidespawn-caller": {
    id: "core.tidespawn-caller",
    name: "Flutbrut-Ruferin",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 2, tide: 1 },
    power: 1,
    toughness: 3,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.spirit-token", count: 1 },
        ],
        text: "Wenn die Flutbrut-Ruferin ins Spiel kommt, erschaffe einen 1/1 Lichtgeist-Token mit Flieger.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 7: `lifelink`-Farblücke geschlossen (bisher fehlte tide als
  // einzige nicht dokumentiert ausgeschlossene Farbe — siehe Keyword-
  // Abdeckungstabelle). Defensive Statverteilung (1/3 statt core.sun-
  // acolytes 2/2, gleicher Preis 2 Mana), passend zu tides Identität.
  "core.tidewell-cleric": {
    id: "core.tidewell-cleric",
    name: "Flutquell-Klerikerin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "lifelink" }],
    rulesText: "Lebensverbindung.",
    rarity: "common",
    set: "core",
  },

  // Fünfte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — erste Kombination mit
  // `vigilant` (tides Signatur-Keyword). Effektiv 1/3 wachsam für 2 Mana.
  "core.tidecrest-warden": {
    id: "core.tidecrest-warden",
    name: "Flutkamm-Wächterin",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "vigilant" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Diese Einheit erhält permanent +0/+1 (angeboren).",
      },
    ],
    rulesText: "Wachsam. Angeborene Zähigkeit: permanent +0/+1.",
    rarity: "common",
    set: "core",
  },

  // Zweite tide-Kopie des husk-crawler-Musters (onDeath: Kartenziehen) —
  // identischer Payoff, defensivere Statline (1/3 statt 3/1, gleicher
  // Preis 2 Mana), passend zu tides defensiver Identität. Feuert nach
  // 9.15 jetzt auch bei Kampftod im Block/Trade UND bei jedem
  // destroyPermanent-Removal.
  "core.tideborn-remnant": {
    id: "core.tideborn-remnant",
    name: "Flutgeborenes Überbleibsel",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 3,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Wenn das Flutgeborene Überbleibsel stirbt, ziehe eine Karte.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Sechste Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — erste airborne-
  // Variante (nach core.dawnfeather-scout, light, identische Statline/
  // identischer Preis: 1/3 Flieger für 2 Mana, bewusste 1:1-Übernahme
  // in eine neue Farbe).
  "core.tidewing-warden": {
    id: "core.tidewing-warden",
    name: "Flutschwingen-Wächterin",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "airborne" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Diese Einheit erhält permanent +0/+1 (angeboren).",
      },
    ],
    rulesText: "Flieger. Angeborene Zähigkeit: permanent +0/+1.",
    rarity: "common",
    set: "core",
  },

  // Batch 9: `trample` bei tide nachgetragen — die letzte verbleibende,
  // NICHT dokumentiert ausgeschlossene Keyword-Farb-Lücke im gesamten
  // Set (siehe Keywords-/Farbidentität-Abschnitt, seit Batch 7 als
  // Kandidat vorgemerkt). Reine Vanilla+Keyword-Statline, defensiver als
  // die übrigen Vertreter des trample-Quartetts (2/3 statt z.B. core.
  // wildfire-boars 3/3 für denselben Preis), passend zu tides
  // defensiver Identität statt einer reinen Kopie der aggressiveren
  // Statlines.
  "core.tidesurge-crasher": {
    id: "core.tidesurge-crasher",
    name: "Gezeitensturm-Brecher",
    type: "unit",
    subtypes: ["Krake"],
    cost: { generic: 1, tide: 1 },
    power: 2,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "trample" }],
    rulesText: "Trampelschaden.",
    rarity: "common",
    set: "core",
  },

  // Zehnte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — dritte tide-Variante
  // (nach core.tidecrest-warden/vigilant, core.tidewing-warden/
  // airborne), hier `firstStrike`. Effektiv 1/3 Erststurm für 2 Mana.
  "core.tidefang-sentinel": {
    id: "core.tidefang-sentinel",
    name: "Flutzahn-Wächterin",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 1, tide: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "firstStrike" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Diese Einheit erhält permanent +0/+1 (angeboren).",
      },
    ],
    rulesText: "Erststurm. Angeborene Zähigkeit: permanent +0/+1.",
    rarity: "common",
    set: "core",
  },

  // Dritte Nutzung von `onDamageReceived` im Pool (nach core.thornrage-
  // boar/wild, core.cinderlash-brute/flame) — erste tide-Variante,
  // schwächste Vergeltung der drei (1 statt 2/1 Schaden) bei der
  // zähesten Statline (1/4), passend zu tides defensiver Identität.
  "core.tidewrath-guardian": {
    id: "core.tidewrath-guardian",
    name: "Flutzorn-Wächter",
    type: "unit",
    subtypes: ["Wassergeist"],
    cost: { generic: 2, tide: 1 },
    power: 1,
    toughness: 4,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDamageReceived", what: "self" },
        effects: [{ kind: "dealDamage", to: "eventSubject", amount: 1 }],
        text: "Immer wenn der Flutzorn-Wächter Schaden erhält, fügt er der Schadensquelle 1 Schaden zu.",
      },
    ],
    rulesText: "Vergeltung: 1 Schaden an die Schadensquelle bei jedem erhaltenen Schaden.",
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

  // Balance-Korrektur (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur nach empirischer Prüfung"): Toughness 4 -> 3
  // (Statline war mit core.thornback-warden 2/4 einer der Gesamt-Stats-
  // Ausreißer der wild-3-Mana-Stufe, siehe unten). Die Vergleichsnotiz bei
  // core.thornrage-boar unten bezieht sich auf diese aktualisierte 2/3-Linie.
  "core.thornback-warden": {
    id: "core.thornback-warden",
    name: "Dornwächter",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "reach" }],
    rulesText: "Reichweite.",
    rarity: "common",
    set: "core",
  },

  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2 (wild, nach erfolgloser Runde 1)"): Toughness
  // 5 -> 4 UND Fähigkeitskosten {1}{Wild} -> {2}{Wild}. Grund: ein
  // unbegrenzt wiederholbarer +1/+1-Marker-Mana-Sink ohne vergleichbares
  // Gegenstück in anderen Farben derselben Rarity war der klarste
  // "strukturelle" (nicht nur statlinien-basierte) Vorsprung von wild in
  // langen/kontrollierten Partien — Runde 1 hatte nur Units angefasst und
  // diese Fähigkeit unverändert gelassen.
  //
  // Balance-Korrektur Runde 3 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 3"): die Runde-2-Korrektur (Kostenerhöhung
  // allein) hat das strukturelle Problem NICHT behoben — mit genug
  // überschüssigem Mana (genau das Szenario in langen Partien gegen
  // tide/light) ließ sich die Fähigkeit weiterhin beliebig oft pro Zug
  // aktivieren, nur teurer pro Aktivierung. Zusatzkosten `{ kind: "tap" }`
  // ergänzt: begrenzt die Aktivierung jetzt hart auf 1×/Zug (identisch zum
  // in diesem Pool etablierten Muster für jeden anderen wiederholbaren
  // Mana-Sink, z. B. core.rootgrowth-idol, core.foundry-anvil) UND erzeugt
  // eine echte Entscheidung: der Hain-Ältester kann in einem Zug entweder
  // angreifen ODER die Fähigkeit aktivieren, nicht beides (Tap-Kosten auf
  // einer Kreatur statt einem Relic — im Pool bisher nicht genutzt, aber
  // dasselbe generische `AdditionalCost`-Primitiv, keine neue Modellfrage).
  "core.grove-elder": {
    id: "core.grove-elder",
    name: "Hain-Ältester",
    type: "unit",
    subtypes: ["Baumhüter"],
    cost: { generic: 3, wild: 2 },
    power: 3,
    toughness: 4,
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2, wild: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [
          { kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 },
        ],
        text: "{2}{Wild}, Tappe den Hain-Ältesten: Lege einen +1/+1-Marker auf eine Unit deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // v0.2.3 Batch 1: dritte guardian-Karte im Set (nach core.temple-sentinel
  // und core.harbor-warden), mittlerer Preispunkt zwischen beiden.
  // Balance-Korrektur: Toughness 4 -> 3 (siehe "Balance-Korrektur nach
  // empirischer Prüfung" unten). Die "mittlerer Preispunkt"-Einordnung
  // zwischen core.harbor-warden (2 Mana, 1/5) und core.temple-sentinel
  // (4 Mana, 2/5) bleibt sinngemäß erhalten (2/3 liegt weiterhin zwischen
  // den beiden Referenzkarten in Power, mit etwas weniger Toughness als
  // beide — vertretbar, da guardian laut Regelwerk auf defensiven Linien
  // ohnehin kaum Nachteil bedeutet).
  "core.bramblehide-sentinel": {
    id: "core.bramblehide-sentinel",
    name: "Dornfellwächter",
    type: "unit",
    subtypes: ["Bestie", "Wächter"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 3,
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

  // Balance-Korrektur (siehe "Balance-Korrektur nach empirischer Prüfung"
  // unten): Toughness 5 -> 4. War mit Gesamt-Stats 10 (5/5) der klarste
  // Ausreißer im gesamten 4-5-Mana-Top-End des Sets (auch wild-intern
  // höher als core.grove-elder, ebenfalls 5 Mana, Gesamt-Stats 8) — jetzt
  // 5/4 Trample für 5 Mana, auf Augenhöhe mit core.sunforged-colossus
  // (light, 5 Mana, 4/5 Trample, Gesamt-Stats 9, einziger direkt
  // vergleichbarer Einzel-Keyword-Trample-Körper auf derselben Kostenstufe
  // im Set).
  "core.overgrowth-colossus": {
    id: "core.overgrowth-colossus",
    name: "Wucherkoloss",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 3, wild: 2 },
    power: 5,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "trample" }],
    rulesText: "Trampelschaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Balance-Korrektur: Toughness 3 -> 2 (siehe "Balance-Korrektur nach
  // empirischer Prüfung" unten). Bleibt oberhalb der 2-Mana-lifelink-
  // Referenzen core.sun-acolyte (light, 2/2) und core.tidewell-cleric
  // (tide, 1/3) — ein moderater, aber kein übertriebener Zuwachs für +1 Mana.
  "core.thistlehide-healer": {
    id: "core.thistlehide-healer",
    name: "Distelfell-Heilerin",
    type: "unit",
    subtypes: ["Bestie", "Kleriker"],
    cost: { generic: 2, wild: 1 },
    power: 3,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "lifelink" }],
    rulesText: "Lebensverbindung.",
    rarity: "common",
    set: "core",
  },

  // Batch 2 (v0.4): erste Testkarte für `addCounters` als ETB-Selbstbuff
  // (statt wiederholbare Fähigkeit wie core.grove-elder). Gedruckt 2/2
  // (Balance-Korrektur, ursprünglich 2/3 — siehe "Balance-Korrektur nach
  // empirischer Prüfung" unten), durch den +1/+1-Marker effektiv 3/3 für
  // 3 Mana — auf Augenhöhe mit core.grove-calfs Vanilla-Projektion (2/3
  // für 2 Mana), aber der Marker ist dauerhaft und daher anfällig für
  // `removeCounters`-Antworten (core.wither-touch, core.corrosive-clamp),
  // anders als ein reiner Stat-Bonus.
  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2"): gedruckt 2/2 -> 1/2 (zusätzlich zur
  // Runde-1-Korrektur 2/3 -> 2/2), parallel zu core.stoneguard-paragon
  // (nahezu identisches Muster: Grundkörper + permanenter +1/+1 auf sich
  // selbst), damit beide mechanisch verwandten Karten auf derselben
  // effektiven Statline (2/3 für 3 Mana) landen, statt dass einer der
  // beiden Baupläne nach Runde 2 zum neuen Ausreißer wird.
  "core.moss-elder": {
    id: "core.moss-elder",
    name: "Moosältester",
    type: "unit",
    subtypes: ["Baumhüter"],
    cost: { generic: 2, wild: 1 },
    power: 1,
    toughness: 2,
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
  // die direkt mit +1/+1 höher gedruckt wäre (3/3 statt 2/2 für 3 Mana,
  // Balance-Korrektur — ursprünglich 3/4 statt 2/3, siehe
  // "Balance-Korrektur nach empirischer Prüfung" unten) — dient in erster
  // Linie als Modell-Abdeckungstest, siehe Balancing-Notizen.
  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2"): gedruckt 2/2 -> 1/2 (zusätzlich zur
  // Runde-1-Korrektur 2/3 -> 2/2). Grund: der `StaticAbility scope:"self"`-
  // Bonus ist KEIN Marker — er ist von keiner der bestehenden Counter-
  // Antworten (core.wither-touch, core.tidewash-cleanse, core.corrosive-
  // clamp) entfernbar und damit strukturell widerstandsfähiger als das
  // mechanisch fast identische ETB-Marker-Muster (core.moss-elder), obwohl
  // Runde 1 beide Karten identisch behandelt hatte. Effektive Statline
  // jetzt 2/3 (vorher 3/3) für 3 Mana.
  "core.stoneguard-paragon": {
    id: "core.stoneguard-paragon",
    name: "Steinwacht-Musterbild",
    type: "unit",
    subtypes: ["Golem"],
    cost: { generic: 2, wild: 1 },
    power: 1,
    toughness: 2,
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
  // Pending-Queue, Abschnitt 5). Statline ursprünglich unter der von
  // core.thornback-warden (2/4, reach, gleicher Preis 3 Mana) angesetzt —
  // reach schützt nur gegen Flieger, die Vergeltung hier wirkt gegen JEDEN
  // Schaden inkl. Brand-Spells, daher der Abzug auf 2/3. Nachtrag (Balance-
  // Korrektur nach empirischer Prüfung, siehe Abschnitt unten):
  // core.thornback-warden wurde im selben Pass auf 2/3 korrigiert (war
  // ebenfalls ein Stats-Ausreißer) — beide Karten liegen jetzt auf
  // derselben Statline; das ist unproblematisch, da die Vergeltung
  // weiterhin der breiter nutzbare Effekt bleibt (reach nur gegen
  // Flieger). core.thornrage-boar selbst wurde in diesem Pass NICHT
  // reduziert, da seine Statline bereits als Ausgleich für die Fähigkeit
  // dokumentiert war.
  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2"): Vergeltungsschaden 2 -> 1. Runde 1 hatte
  // diese Karte bewusst unangetastet gelassen ("Statline bereits als
  // Ausgleich dokumentiert") — die eigentliche Statline (2/3) war nie das
  // Problem, sondern dass die drei später gebauten Zweitkopien desselben
  // Musters (core.cinderlash-brute/flame, core.lucent-retaliator/light,
  // core.hollowveil-reaver/void) alle nur 1 Vergeltungsschaden austeilen,
  // core.thornrage-boar aber weiterhin 2 — bei ansonsten gleichwertiger
  // Statline die stärkste Version des geteilten Effekts exklusiv in wild.
  // Jetzt exakt auf Fähigkeitsniveau der übrigen drei Farben.
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
        effects: [{ kind: "dealDamage", to: "eventSubject", amount: 1 }],
        text: "Immer wenn der Dornwut-Keiler Schaden erhält, fügt er der Schadensquelle 1 Schaden zu.",
      },
    ],
    rulesText: "Vergeltung: 1 Schaden an die Schadensquelle bei jedem erhaltenen Schaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 4 (v0.7): StaticAbility scope:"self" kombiniert mit einer echten
  // KeywordAbility (analog core.sunward-vanguard, dort lifelink+Stats) -
  // hier trample+Stats. Balance-Korrektur (siehe "Balance-Korrektur nach
  // empirischer Prüfung" unten): Grunddruckwert 2/2 -> 2/1, damit die
  // TATSÄCHLICHE Battlefield-Statline (Grunddruck + permanenter Static-
  // Bonus) von effektiv 3/4 auf effektiv 3/3 Trample für 3 Mana sinkt —
  // jetzt exakt auf Augenhöhe mit core.wildfire-boar (flame, 3/3 Trample,
  // gleicher Preis) statt einen Punkt zäher. Wichtig für die Diagnose: der
  // reine Rohwert-Vergleich (gedruckte power+toughness-Felder) in der
  // Bot-Simulations-Analyse zählt bei dieser Karte nur 2/2=4, obwohl die
  // reale Battlefield-Statline dank des Static-Modifiers schon vorher 3/4=7
  // war — eine der beiden weiteren Karten dieser Art (siehe auch
  // core.stoneguard-paragon, core.thornreach-strider) im Set, die dadurch
  // im Rohwert-Schnitt UNTERSCHÄTZT waren. Deshalb wurde diese Karte trotz
  // eines Rohwerts unterhalb des 5,0-Schnitts ebenfalls korrigiert.
  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2"): Static-Bonus +1/+2 -> +1/+1 (zusätzlich
  // zur Runde-1-Korrektur des Grunddrucks 2/2 -> 2/1). Grund: derselbe
  // Nicht-Entfernbarkeits-Faktor wie bei core.stoneguard-paragon — anders
  // als core.moss-elders Marker ist dieser Bonus durch keine bestehende
  // Counter-Antwort erreichbar. Runde 1 hatte diese Karte exakt auf
  // core.wildfire-boars Niveau (flame, 3/3 trample) gebracht; das war
  // selbst noch der obere Rand der 3-Mana-Stufe, nicht der Zielkorridor.
  // Effektive Statline jetzt 3/2 Trampelschaden (vorher 3/3) für 3 Mana.
  "core.thornhide-brawler": {
    id: "core.thornhide-brawler",
    name: "Dornhaut-Raufbold",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "trample" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Diese Einheit erhält permanent +1/+1 (angeboren).",
      },
    ],
    rulesText: "Trampelschaden. Angeborene Stärke: permanent +1/+1.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 4 (v0.7): modales ETB-Gegenstueck zu core.moss-elder (ETB fester
  // Selbst-Marker, ursprünglich 2/3 fuer 3 Mana, nach Balance-Korrektur
  // 2/2 — siehe "Balance-Korrektur nach empirischer Prüfung" unten) - hier
  // waehlbar zwischen Selbst-Marker (identisch zu moss-elder) und Marker
  // auf eine ANDERE eigene Kreatur. Druckwert 2/2 bleibt unveraendert (war
  // schon vor der Korrektur der niedrigere Referenzpunkt); die
  // Flexibilitaet gleicht das jetzt geringere Delta zu moss-elder aus.
  "core.bramblewild-shaman": {
    id: "core.bramblewild-shaman",
    name: "Dornwild-Schamanin",
    type: "unit",
    subtypes: ["Druide"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [],
        modes: [
          {
            text: "Lege einen +1/+1-Marker auf diese Kreatur.",
            effects: [{ kind: "addCounters", what: "self", counterType: "plus1plus1", count: 1 }],
          },
          {
            text: "Lege einen +1/+1-Marker auf eine andere Kreatur deiner Wahl, die du kontrollierst.",
            targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
            effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
          },
        ],
        text: "Wenn die Dornwild-Schamanin ins Spiel kommt, waehle eins: Lege einen +1/+1-Marker auf diese Kreatur. Oder: Lege einen +1/+1-Marker auf eine andere Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 5 (v0.8): erste `firstStrike`-Karte in wild (bisher flame/tide/
  // light/void, siehe Keyword-Abdeckungstabelle) — keine dokumentierte
  // Farb-Ausschlussregel wie bei guardian/flame, daher unproblematische
  // Lücke. Identische Statline wie core.riftfin-duelist (tide, 1/3, 2 Mana)
  // — bewusst identisch bepreist, siehe Balancing-Notizen "Batch 5".
  "core.thornviper-skirmisher": {
    id: "core.thornviper-skirmisher",
    name: "Dornotter-Plänklerin",
    type: "unit",
    subtypes: ["Schlange"],
    cost: { generic: 1, wild: 1 },
    power: 1,
    toughness: 3,
    abilities: [{ kind: "keyword", keyword: "firstStrike" }],
    rulesText: "Erststurm.",
    rarity: "common",
    set: "core",
  },

  // Batch 6: `swift` nachgetragen für wild (zweite der beiden im Fahrplan
  // genannten Lücken, nach core.tidewhip-skirmisher/tide). Identische
  // Statline wie core.zealous-vanguard (light, 2/1 swift, 2 Mana) — bewusste
  // 1:1-Übernahme des etablierten Preispunkts in eine neue Farbe.
  "core.thornrush-sprinter": {
    id: "core.thornrush-sprinter",
    name: "Dornhast-Flitzer",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 1, wild: 1 },
    power: 2,
    toughness: 1,
    abilities: [{ kind: "keyword", keyword: "swift" }],
    rulesText: "Eile.",
    rarity: "common",
    set: "core",
  },

  // Dritte Nutzung von `onBlockDeclared` im Pool (nach core.wardflame-
  // sentinel/light, core.tideshell-warden/tide) — hier statt gainLife mit
  // `addCounters` kombiniert (neue Effekt-Paarung für diesen Trigger, kein
  // neues Primitiv): die Wächterin wächst mit jedem deklarierten Block
  // dauerhaft. Passend zu wilds Wachstums-Identität, ursprünglich gleicher
  // Preispunkt/Statline wie core.wardflame-sentinel (3 Mana, 1/4). Balance-
  // Korrektur (siehe "Balance-Korrektur nach empirischer Prüfung" unten):
  // Toughness 4 -> 3, damit weicht die Karte jetzt bewusst von core.
  // wardflame-sentinel ab (dessen Statline unverändert bleibt — dieser
  // Pass betrifft ausschließlich wild) — vertretbar, weil der `addCounters`-
  // Wachstumseffekt hier PERMANENT ist, während wardflame-sentinels
  // gainLife-Effekt keinen Board-Wert aufbaut.
  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2"): Toughness 3 -> 2 (zusätzlich zur
  // Runde-1-Korrektur 4 -> 3). Grund: der Marker hier ist PERMANENT und
  // stapelt sich über beliebig viele Blocks (echtes Board-Wachstum), anders
  // als core.wardflame-sentinels/core.tideshell-wardens `gainLife` (nur
  // einmaliger Wert pro Block) — ein zäherer Ausgangskörper für denselben
  // Trigger ist strukturell mehr wert als bei den Lifegain-Vergleichskarten
  // und rechtfertigt eine schwächere Startstatline.
  "core.thornbound-guard": {
    id: "core.thornbound-guard",
    name: "Dorngebundene Wächterin",
    type: "unit",
    subtypes: ["Bestie", "Wächter"],
    cost: { generic: 2, wild: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onBlockDeclared", what: "self" },
        effects: [{ kind: "addCounters", what: "self", counterType: "plus1plus1", count: 1 }],
        text: "Immer wenn die Dorngebundene Wächterin als Blocker deklariert wird, lege einen +1/+1-Marker auf sie.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 7: `airborne`-Farblücke geschlossen (bisher fehlte wild als
  // einzige nicht dokumentiert ausgeschlossene Farbe — airborne deckt jetzt
  // alle 5 Farben ab). Ursprünglich defensivere Statverteilung (2/3 statt
  // core.aerie-benedictions 2/2, gleicher Preis 3 Mana). Balance-Korrektur
  // (siehe "Balance-Korrektur nach empirischer Prüfung" unten): Toughness
  // 3 -> 2, jetzt exakt gleiche Statline wie core.aerie-benediction (light,
  // 2/2 airborne, ebenfalls 3 Mana) — die zuvor dokumentierte höhere
  // Toughness-Identität von wild war an dieser Stelle Teil des empirisch
  // festgestellten Effizienz-Vorsprungs.
  "core.sporewing-strider": {
    id: "core.sporewing-strider",
    name: "Sporenschwinge",
    type: "unit",
    subtypes: ["Pflanzenwesen"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "airborne" }],
    rulesText: "Flieger.",
    rarity: "common",
    set: "core",
  },

  // Neue modale ETB-Kombination (bisher ungenutzte Zusammenstellung
  // bereits bewährter Einzeleffekte, kein neues Primitiv): wähle zwischen
  // einem Selbst-Marker (core.moss-elders fester ETB-Effekt) und Lebens­
  // gewinn (core.dawn-medics fester ETB-Effekt). Schwächerer Körper (1/2
  // statt core.moss-elders ursprünglich 2/3, nach Balance-Korrektur 2/2 —
  // siehe "Balance-Korrektur nach empirischer Prüfung" unten — für
  // denselben Preis) gleicht die Wahlfreiheit aus, analog core.
  // current-diplomat/core.mistveil-tricksters Logik.
  "core.thornwild-forager": {
    id: "core.thornwild-forager",
    name: "Dornwild-Sammlerin",
    type: "unit",
    subtypes: ["Druide"],
    cost: { generic: 2, wild: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [],
        modes: [
          {
            text: "Lege einen +1/+1-Marker auf diese Kreatur.",
            effects: [{ kind: "addCounters", what: "self", counterType: "plus1plus1", count: 1 }],
          },
          {
            text: "Gewinne 2 Leben.",
            effects: [{ kind: "gainLife", who: "controller", amount: 2 }],
          },
        ],
        text: "Wenn die Dornwild-Sammlerin ins Spiel kommt, wähle eins — Lege einen +1/+1-Marker auf diese Kreatur. Oder: Gewinne 2 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite guardian-Karte in wild (nach core.bramblehide-sentinel, 3 Mana,
  // ursprünglich 2/4, nach Balance-Korrektur 2/3 — siehe "Balance-Korrektur
  // nach empirischer Prüfung" unten) — billigerer, noch defensiverer
  // Preispunkt (2 Mana, 1/4), analog zu core.harbor-warden (tide) und
  // core.gravebound-warden (void) auf demselben Preisniveau.
  "core.rootbound-sentinel": {
    id: "core.rootbound-sentinel",
    name: "Wurzelgebundener Wächter",
    type: "unit",
    subtypes: ["Baumhüter", "Wächter"],
    cost: { generic: 1, wild: 1 },
    power: 1,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "guardian" }],
    rulesText: "Wächter.",
    rarity: "uncommon",
    set: "core",
  },

  // Dritte Kopie des husk-crawler-Musters, aber mit `createToken` statt
  // Kartenziehen/Marke — erste Kombination von `createToken` mit
  // `onDeath` im Pool (bisher nur als ETB-Effekt genutzt: core.
  // cinderwing-fledgling u.a.). "Auch im Tod geht das Wachstum weiter":
  // hinterlässt einen 1/1 Sprössling, wenn die Streunerin stirbt — egal
  // ob im Kampf oder durch destroyPermanent-Removal (9.15).
  "core.mosswake-drifter": {
    id: "core.mosswake-drifter",
    name: "Moosweck-Streunerin",
    type: "unit",
    subtypes: ["Pflanzenwesen"],
    cost: { generic: 1, wild: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.sprout-token", count: 1 },
        ],
        text: "Wenn die Moosweck-Streunerin stirbt, erschaffe einen 1/1 Sprössling-Token.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Neue ETB-Kombination (bisher ungenutzte Zusammenstellung bereits
  // bewährter Bausteine, kein neues Primitiv): direkter Einzelziel-ETB-
  // Marker auf eine andere eigene Kreatur (nicht modal wie core.
  // bramblewild-shaman, nicht auf sich selbst wie core.moss-elder).
  // Schwacher Körper (1/1) für 2 Mana, da der volle Wert der Karte in
  // der Unterstützung einer anderen Kreatur liegt.
  "core.verdant-shaman": {
    id: "core.verdant-shaman",
    name: "Grünwuchs-Schamanin",
    type: "unit",
    subtypes: ["Druide"],
    cost: { generic: 1, wild: 1 },
    power: 1,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "Wenn die Grünwuchs-Schamanin ins Spiel kommt, lege einen +1/+1-Marker auf eine andere Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Vierte Farbe für das `createToken`-ETB-Body-Muster (nach core.
  // cinderwing-fledgling/flame, core.aureate-caller/light, core.
  // tidespawn-caller/tide) — schließt die letzte fehlende Farbe dieser
  // Familie. Statverteilung analog zu den Vorbildern (2/2 für 3 Mana).
  "core.thornseed-caller": {
    id: "core.thornseed-caller",
    name: "Dornsaat-Ruferin",
    type: "unit",
    subtypes: ["Druide"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.sprout-token", count: 1 },
        ],
        text: "Wenn die Dornsaat-Ruferin ins Spiel kommt, erschaffe einen 1/1 Sprössling-Token.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Reine Vanilla-Statline (kein `abilities`-Feld). Balance-Korrektur
  // (siehe "Balance-Korrektur nach empirischer Prüfung" unten): Toughness
  // 4 -> 3 — ursprünglich 3/4 (Gesamt-Stats 7) war der klarste Vanilla-
  // Ausreißer der gesamten wild-3-Mana-Stufe (kein Keyword, keine
  // Fähigkeit, die den Aufpreis rechtfertigt). 3/3 bleibt weiterhin über
  // core.grove-calfs Vanilla-Projektion (2/3 für 2 Mana), passend zu wilds
  // Identität großer, zäher Körper — nur nicht mehr das Maximum im Set.
  "core.ironhide-bison": {
    id: "core.ironhide-bison",
    name: "Eisenhaut-Bison",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, wild: 1 },
    power: 3,
    toughness: 3,
    rulesText: "Keine Fähigkeiten.",
    rarity: "common",
    set: "core",
  },

  // Elfte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — erste `reach`-Variante
  // in wild (nach core.thornhide-brawler/trample). Balance-Korrektur
  // (siehe "Balance-Korrektur nach empirischer Prüfung" unten): Grunddruck
  // 2/3 -> 2/2, damit sinkt die tatsächliche Battlefield-Statline
  // (Grunddruck + permanenter Static-Bonus) von effektiv 3/3 auf effektiv
  // 3/2 Reichweite für 3 Mana.
  "core.thornreach-strider": {
    id: "core.thornreach-strider",
    name: "Dornreich-Wandler",
    type: "unit",
    subtypes: ["Bestie"],
    cost: { generic: 2, wild: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "reach" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Diese Einheit erhält permanent +1/+0 (angeboren).",
      },
    ],
    rulesText: "Reichweite. Angeborene Stärke: permanent +1/+0.",
    rarity: "common",
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

  // Batch 4 (v0.7): erste Nutzung von onBlockDeclared im Pool (Engine
  // feuert es bereits beim Deklarieren als Blocker, siehe combat.ts) -
  // defensives Gegenstueck zu core.raidhorn-berserkers onAttackDeclared.
  // Hoher Toughness-Koerper (1/4) passend zu lights defensiver Identitaet;
  // 2 Leben pro Block ist ein moderater, aber wiederholbarer Lifegain-Wert.
  "core.wardflame-sentinel": {
    id: "core.wardflame-sentinel",
    name: "Schildglut-Wächterin",
    type: "unit",
    subtypes: ["Wächter"],
    cost: { generic: 2, light: 1 },
    power: 1,
    toughness: 4,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onBlockDeclared", what: "self" },
        effects: [{ kind: "gainLife", who: "controller", amount: 2 }],
        text: "Immer wenn die Schildglut-Wächterin als Blocker deklariert wird, gewinnst du 2 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 4 (v0.7): erste Nutzung von costChange auf einer Unit (bisher nur
  // Relic/Enchantment: core.forgeheart-crucible, core.cinderforge-charm).
  // Gleicher Preis wie core.cinderforge-charm (3 Mana), aber auf einem sehr
  // zerbrechlichen Koerper (1/2) statt einer Enchantment - stirbt an jedem
  // Removal/Combat-Trade, anders als eine Enchantment, die ausschliesslich
  // ueber core.gravetide-obelisk-artige, dedizierte Permanent-Entfernung
  // angreifbar ist. Als rare eingestuft wie beide bestehenden costChange-
  // Traeger.
  "core.tithehall-warden": {
    id: "core.tithehall-warden",
    name: "Zehnthallen-Hüterin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 2, light: 1 },
    power: 1,
    toughness: 2,
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

  // Batch 5 (v0.8): dritte Nutzung von `StaticAbility scope:self` + Modifier
  // "stats" kombiniert mit einer echten KeywordAbility (nach core.sunward-
  // vanguard, lifelink, und core.thornhide-brawler, trample) — hier
  // airborne. Effektiv 1/3 Flieger für 2 Mana, etwas zäher als core.aerie-
  // benediction (2/2 airborne, gleicher Preis), passend zu lights
  // defensiverer Statlinien-Tendenz bei gleichem Preispunkt.
  "core.dawnfeather-scout": {
    id: "core.dawnfeather-scout",
    name: "Morgenfeder-Kundschafterin",
    type: "unit",
    subtypes: ["Geist"],
    cost: { generic: 1, light: 1 },
    power: 1,
    toughness: 2,
    abilities: [
      { kind: "keyword", keyword: "airborne" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Diese Einheit erhält permanent +0/+1 (angeboren).",
      },
    ],
    rulesText: "Flieger. Angeborene Zähigkeit: permanent +0/+1.",
    rarity: "common",
    set: "core",
  },

  // Batch 6: dritte Nutzung von `onDamageReceived` im Pool (nach core.thorn­
  // rage-boar/wild, core.cinderlash-brute/flame) — defensive Statverteilung
  // (1/4) passend zu lights Identität, schwächste Vergeltung der drei Karten
  // (1 Schaden), gleicher Preis (3 Mana) wie beide Vorbilder.
  "core.lucent-retaliator": {
    id: "core.lucent-retaliator",
    name: "Leuchtende Vergelterin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 2, light: 1 },
    power: 1,
    toughness: 4,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDamageReceived", what: "self" },
        effects: [{ kind: "dealDamage", to: "eventSubject", amount: 1 }],
        text: "Immer wenn die Leuchtende Vergelterin Schaden erhält, fügt sie der Schadensquelle 1 Schaden zu.",
      },
    ],
    rulesText: "Vergeltung: 1 Schaden an die Schadensquelle bei jedem erhaltenen Schaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Batch 7: `deathtouch`-Farblücke geschlossen (bisher fehlte light als
  // einzige nicht dokumentiert ausgeschlossene Farbe — siehe Keyword-
  // Abdeckungstabelle). Günstigster Preispunkt, identisch zu core.abyssal-
  // lurker (tide, 1/2, 2 Mana) — bewusste 1:1-Übernahme in eine neue Farbe.
  "core.banelight-templar": {
    id: "core.banelight-templar",
    name: "Bannlicht-Templerin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 1,
    toughness: 2,
    abilities: [{ kind: "keyword", keyword: "deathtouch" }],
    rulesText: "Todesberührung.",
    rarity: "common",
    set: "core",
  },

  // Zweite guardian-Karte in light (nach core.temple-sentinel, 4 Mana,
  // 2/5) — billigerer Preispunkt (2 Mana, 1/4), analog zu core.harbor-
  // warden/core.gravebound-warden/core.rootbound-sentinel auf demselben
  // Preisniveau in anderen Farben.
  "core.wardlight-acolyte": {
    id: "core.wardlight-acolyte",
    name: "Schutzlicht-Akolythin",
    type: "unit",
    subtypes: ["Kleriker", "Wächter"],
    cost: { generic: 1, light: 1 },
    power: 1,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "guardian" }],
    rulesText: "Wächter.",
    rarity: "uncommon",
    set: "core",
  },

  // Dritte Kopie des husk-crawler-Musters, hier mit `gainLife` statt
  // Kartenziehen/Marke/Token — passend zu lights Lebensgewinn-
  // Identität. Höherer Payoff-Betrag (3 Leben) gleicht die im
  // Direktvergleich meist schwächer eingeschätzte Einzelressource
  // "Leben" gegenüber "Karte"/"Marke"/"Token" an dieselbe Wertstufe an.
  "core.sunfall-martyr": {
    id: "core.sunfall-martyr",
    name: "Sonnenfall-Märtyrerin",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "gainLife", who: "controller", amount: 3 }],
        text: "Wenn die Sonnenfall-Märtyrerin stirbt, gewinnst du 3 Leben.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Siebte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — erste firstStrike-
  // Variante (nach core.ash-duelist/core.dawnblade-adept, beide reine
  // KeywordAbility ohne Static-Kombo). Effektiv 2/2 Erststurm für 2
  // Mana — identische Endstatline wie beide Vorbilder, hier über die
  // Kombination aus Basis-Statline + Static-Modifier konstruiert
  // (reiner Modell-Abdeckungstest, siehe Balancing-Notiz zu core.
  // stoneguard-paragon aus Batch 3).
  "core.sunblade-vanguard": {
    id: "core.sunblade-vanguard",
    name: "Sonnenklingen-Vorhut",
    type: "unit",
    subtypes: ["Kleriker"],
    cost: { generic: 1, light: 1 },
    power: 1,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "firstStrike" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Diese Einheit erhält permanent +1/+1 (angeboren).",
      },
    ],
    rulesText: "Erststurm. Angeborene Stärke: permanent +1/+1.",
    rarity: "common",
    set: "core",
  },

  // Zweite `firstStrike`+`stats`-scope:self-Kombination in light (nach
  // core.sunblade-vanguard, dort 1/1 Basis + Static +1/+1 = effektiv
  // 2/2 für 2 Mana) — hier ein anderer Preispunkt/Split: 2/1 Basis +
  // Static +1/+0 = effektiv 3/1 für 2 Mana, identischer Preis/identische
  // Endstärke wie core.cinderborn-raider (flame).
  "core.dawnborn-duelist": {
    id: "core.dawnborn-duelist",
    name: "Morgengeborener Duellant",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 1, light: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      { kind: "keyword", keyword: "firstStrike" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Diese Einheit erhält permanent +1/+0 (angeboren).",
      },
    ],
    rulesText: "Erststurm. Angeborene Stärke: permanent +1/+0.",
    rarity: "common",
    set: "core",
  },

  // Vierte Nutzung von `onAttackDeclared` im Pool (nach core.raidhorn-
  // berserker/flame u.a.) — erste Kombination mit `gainLife` statt
  // `dealDamage` (neue Effekt-Paarung für diesen Trigger, kein neues
  // Primitiv), passend zu lights Lebensgewinn-Identität. Gleiche
  // Statline/gleicher Preis wie core.raidhorn-berserker (3 Mana, 2/2).
  "core.dawnrise-champion": {
    id: "core.dawnrise-champion",
    name: "Morgenaufgangs-Champion",
    type: "unit",
    subtypes: ["Krieger"],
    cost: { generic: 2, light: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onAttackDeclared", what: "self" },
        effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
        text: "Immer wenn der Morgenaufgangs-Champion als Angreifer deklariert wird, gewinnst du 1 Leben.",
      },
    ],
    rarity: "uncommon",
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

  // Batch 4 (v0.7): onDeath-Gegenstueck zu core.husk-crawler (Marker statt
  // Karte) - Aas-/Vergeltungsdesign: stirbt der Wicht, hinterlaesst er
  // einen -1/-1-Marker auf einer gegnerischen Kreatur. Aggressive,
  // zerbrechliche Statline (2/1) wie core.husk-crawler, common wie dieses.
  "core.plaguebound-wretch": {
    id: "core.plaguebound-wretch",
    name: "Seuchengebundener Wicht",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 1, void: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "minus1minus1", count: 1 }],
        text: "Wenn der Seuchengebundene Wicht stirbt, lege einen -1/-1-Marker auf eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Batch 5 (v0.8): dritte Nutzung von `onAttackDeclared` im Pool (nach
  // core.raidhorn-berserker, flame) — void-typische Umsetzung über
  // `loseLife` statt `dealDamage` (kein "Schaden" im Regelsinn, siehe
  // Balancing-Notiz zu core.hexbind-lash), sonst identischer Preis/Statline/
  // Swing-Wert (1 Punkt) wie das flame-Original. Siehe Balancing-Notizen
  // "Batch 5".
  "core.hollowmarch-reaver": {
    id: "core.hollowmarch-reaver",
    name: "Hohlmarsch-Plünderer",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 2, void: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onAttackDeclared", what: "self" },
        effects: [{ kind: "loseLife", who: "opponent", amount: 1 }],
        text: "Immer wenn der Hohlmarsch-Plünderer als Angreifer deklariert wird, verliert dein Gegner 1 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 6: vierte Farbe für das `createToken`-ETB-Body-Muster (nach
  // core.cinderwing-fledgling/flame, core.aureate-caller/light, core.tide­
  // spawn-caller/tide) — schafft einen 1/1 Gebeinknecht-Token statt eines
  // Lichtgeistes, passend zu voids Untoten-Thematik. Identische Statline wie
  // core.cinderwing-fledgling (2/1, 3 Mana).
  "core.grimspawn-channeler": {
    id: "core.grimspawn-channeler",
    name: "Grimmbrut-Kanalisiererin",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 2, void: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.skeleton-token", count: 1 },
        ],
        text: "Wenn die Grimmbrut-Kanalisiererin ins Spiel kommt, erschaffe einen 1/1 Gebeinknecht-Token.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Batch 7: `reach`-Farblücke geschlossen (bisher fehlte void ohne
  // dokumentierte Ausschluss-Begründung — siehe Keyword-Abdeckungstabelle).
  // Identischer Preispunkt/identische Statline wie core.sunhaven-guard
  // (light, 1/4, 2 Mana) — bewusste 1:1-Übernahme in eine neue Farbe.
  "core.hollowreach-stalker": {
    id: "core.hollowreach-stalker",
    name: "Hohlgriff-Pirscher",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 1, void: 1 },
    power: 1,
    toughness: 4,
    abilities: [{ kind: "keyword", keyword: "reach" }],
    rulesText: "Reichweite.",
    rarity: "common",
    set: "core",
  },

  // Vierte Nutzung von `onDamageReceived` im Pool (nach core.thornrage-
  // boar/wild, core.cinderlash-brute/flame, core.lucent-retaliator/light) —
  // erste void-Kopie, identischer Preis/identische Statline/identische
  // Vergeltungsstärke wie core.cinderlash-brute (3 Mana, 2/2 hier statt
  // 3/2, 1 Schaden).
  "core.hollowveil-reaver": {
    id: "core.hollowveil-reaver",
    name: "Hohlschleier-Plünderer",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 2, void: 1 },
    power: 2,
    toughness: 2,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDamageReceived", what: "self" },
        effects: [{ kind: "dealDamage", to: "eventSubject", amount: 1 }],
        text: "Immer wenn der Hohlschleier-Plünderer Schaden erhält, fügt er der Schadensquelle 1 Schaden zu.",
      },
    ],
    rulesText: "Vergeltung: 1 Schaden an die Schadensquelle bei jedem erhaltenen Schaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Erstes "Removal-Magnet"-Parting-Shot-Design: bewusst KEIN
  // zerbrechlicher Aggro-Körper wie core.husk-crawler/core.plaguebound-
  // wretch, sondern eine zähe 2/4-Statline, die im Kampf kaum stirbt und
  // den Gegner faktisch zu einem Entfernungszauber zwingt. Genau das
  // macht die neue, ursachenunabhängige onDeath-Semantik (9.15) hier
  // spürbar: vor dem Fix hätte core.doomreap-edict (`destroyPermanent`)
  // diese Karte "sauber" entfernt, ohne den Kartenzug auszulösen —
  // jetzt liefert sie ihren vollen Wert auch dann. `core.banishment-
  // rite` (`exilePermanent`) bleibt die einzige Ausnahme, die den
  // Trigger weiterhin umgeht (kein Tod laut 9.15). Stärkerer Payoff (2
  // Karten statt 1) und höherer Preis/Rarity (3 Mana, rare) als core.
  // husk-crawler/core.plaguebound-wretch, da die Statline selbst schon
  // einen echten Widerstandswert hat statt nur den Payoff abzusichern.
  "core.gravebound-oracle": {
    id: "core.gravebound-oracle",
    name: "Grabgebundene Seherin",
    type: "unit",
    subtypes: ["Untoter", "Seherin"],
    cost: { generic: 2, void: 1 },
    power: 2,
    toughness: 4,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "drawCards", who: "controller", count: 2 }],
        text: "Wenn die Grabgebundene Seherin stirbt, ziehe zwei Karten.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Achte Nutzung von `StaticAbility scope:self` + Modifier "stats"
  // kombiniert mit einer echten KeywordAbility — erste reach-Variante
  // (nach core.thornback-warden/wild, core.sunhaven-guard/light, und
  // core.hollowreach-stalker/void selbst als reine KeywordAbility).
  // Effektiv 1/4 Reichweite für 2 Mana.
  "core.hollowdepth-warden": {
    id: "core.hollowdepth-warden",
    name: "Hohltiefen-Wächterin",
    type: "unit",
    subtypes: ["Untoter", "Wächter"],
    cost: { generic: 1, void: 1 },
    power: 1,
    toughness: 3,
    abilities: [
      { kind: "keyword", keyword: "reach" },
      {
        kind: "static",
        scope: { kind: "self" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Diese Einheit erhält permanent +0/+1 (angeboren).",
      },
    ],
    rulesText: "Reichweite. Angeborene Zähigkeit: permanent +0/+1.",
    rarity: "common",
    set: "core",
  },

  // Finisher-Statline, die zwei bereits einzeln etablierte Keywords
  // kombiniert (`trample`+`lifelink`, jeweils bereits in void vertreten,
  // aber bisher nicht zusammen) — bewusst KEINE Kombination aus der
  // „gefährlichen Trio"-Liste in rules-engine.md 6d(4) (anders als core.
  // void-assassin), sondern ein reiner Lebens-/Druck-Swing ohne
  // Kampfmathematik-Verzerrung. Als teuerster reiner Statline-Finisher
  // im Set (5 Mana, 4/4) bewusst `rare`, aber ohne die extreme
  // Fragilität von core.void-assassin (1/1).
  "core.hollowmaw-devourer": {
    id: "core.hollowmaw-devourer",
    name: "Hohlrachen-Verschlinger",
    type: "unit",
    subtypes: ["Untoter", "Bestie"],
    cost: { generic: 3, void: 2 },
    power: 4,
    toughness: 4,
    abilities: [
      { kind: "keyword", keyword: "trample" },
      { kind: "keyword", keyword: "lifelink" },
    ],
    rulesText: "Trampelschaden. Lebensverbindung.",
    rarity: "rare",
    set: "core",
  },

  // Fünfte Farbe für das `createToken`-ETB-Body-Muster (nach core.
  // cinderwing-fledgling/flame, core.aureate-caller/light, core.
  // tidespawn-caller/tide, core.thornseed-caller/wild) — schließt diese
  // Familie über alle 5 Farben ab. Aggressivere Statverteilung (2/1
  // statt 2/2) mit „Untoter"-Ableger-Flavor (Skelett-Token), passend zu
  // voids Identität.
  "core.gravecall-summoner": {
    id: "core.gravecall-summoner",
    name: "Grabruf-Beschwörerin",
    type: "unit",
    subtypes: ["Untoter"],
    cost: { generic: 2, void: 1 },
    power: 2,
    toughness: 1,
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEnterBattlefield", what: "self" },
        effects: [
          { kind: "createToken", who: "controller", tokenDefinitionId: "core.skeleton-token", count: 1 },
        ],
        text: "Wenn die Grabruf-Beschwörerin ins Spiel kommt, erschaffe einen 1/1 Gebeinknecht-Token.",
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

  // -----------------------------------------------------------------
  // Batch 4 (v0.7) — Spells: Schwerpunkt modifyStats/grantKeyword mit
  // duration:"permanent" (bisher nur "endOfTurn" im Pool, siehe Balancing-
  // Notizen "Batch 4"), sowie neue Kombinationen bestehender Effekte
  // (mehrere Zielslots, gemischte loseLife+drawCards etc.).
  // -----------------------------------------------------------------

  // Erste Nutzung von modifyStats mit duration:"permanent" im Pool (bisher
  // nur "endOfTurn": core.blazing-frenzy/core.aegis-ward). Neue Preisregel:
  // permanent kostet gegenueber der endOfTurn-Variante +1 Mana bei sonst
  // identischem Effekt - hier core.blazing-frenzys +2/+0 (1 Mana) permanent
  // fuer 2 Mana.
  "core.moltenscale-graft": {
    id: "core.moltenscale-graft",
    name: "Schmelzschuppen-Veredelung",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 2, toughness: 0 }, duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent +2/+0 (angeboren).",
    rarity: "common",
    set: "core",
  },

  // Groessere, aber ineffizientere Brand-Variante (Vergleich core.fire-jolt
  // 2/1, core.flame-lance 3/2, core.inferno-surge X-Skalierung) - schliesst
  // die Effizienzkurve nach oben mit einem fixen Preispunkt ab.
  "core.cataclysm-brand": {
    id: "core.cataclysm-brand",
    name: "Kataklysmen-Brandmal",
    type: "spell",
    speed: "fast",
    cost: { generic: 3, flame: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 5 }],
    rulesText: "Füge einem Ziel deiner Wahl 5 Schaden zu.",
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von ZWEI unabhaengigen Zielslots auf einem Spell (bisher
  // maximal ein targets-Eintrag pro Karte) - teilt core.fire-jolts Gesamt­
  // schaden (2) auf bis zu zwei Ziele auf, fuer doppelten Mana-Preis:
  // schlechtere Effizienz als fire-jolt, dafuer Flexibilitaet gegen zwei
  // kleine Ziele gleichzeitig.
  "core.twin-cinder": {
    id: "core.twin-cinder",
    name: "Zwillingsglut",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, flame: 1 },
    targets: [{ kind: "unitOrPlayer" }, { kind: "unitOrPlayer" }],
    effects: [
      { kind: "dealDamage", to: { target: 0 }, amount: 1 },
      { kind: "dealDamage", to: { target: 1 }, amount: 1 },
    ],
    rulesText: "Füge bis zu zwei Zielen deiner Wahl je 1 Schaden zu.",
    rarity: "uncommon",
    set: "core",
  },

  // Zwei Zielslots (analog core.twin-cinder), hier fuer core.tidal-rebukes
  // Bounce-Effekt - bewusst auf GEGNERISCHE Kreaturen beschraenkt (anders
  // als tidal-rebukes "any") und doppelt bepreist (4 statt 2 Mana) fuer den
  // zweiten Bounce.
  "core.riptide-purge": {
    id: "core.riptide-purge",
    name: "Doppelflut",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, tide: 2 },
    targets: [
      { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
      { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
    ],
    effects: [
      { kind: "returnToHand", what: { target: 0 } },
      { kind: "returnToHand", what: { target: 1 } },
    ],
    rulesText: "Bringe bis zu zwei gegnerische Kreaturen deiner Wahl auf die Hand ihres Besitzers zurück.",
    rarity: "uncommon",
    set: "core",
  },

  // Dritter modifyStats-Trick (endOfTurn) im Pool, nach core.blazing-frenzy
  // (flame, +2/+0) und core.aegis-ward (light, +0/+3) - tides balancierte
  // Verteilung (+1/+2), passend zu ihrer Tempo-/defensiven Identitaet,
  // gleicher Gesamtwert (3) wie aegis-ward, gleicher Preis (2).
  "core.tidal-surge": {
    id: "core.tidal-surge",
    name: "Gezeitenschwall",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 1, toughness: 2 }, duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges +1/+2.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von grantKeyword mit duration:"permanent" im Pool (bisher
  // fuenf Tricks, alle "endOfTurn": core.reckless-charge usw.) - dieselbe
  // "+1 Mana fuer permanent"-Regel wie bei modifyStats: core.bramble-surges
  // Trample (endOfTurn, 1 Mana) wird hier dauerhaft fuer 3 Mana.
  "core.rootbound-mark": {
    id: "core.rootbound-mark",
    name: "Wurzelgebundenes Mal",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "trample", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Trampelschaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Permanente Variante von core.aegis-ward (+0/+3 endOfTurn, 2 Mana) nach
  // derselben "+1 Mana"-Regel wie core.moltenscale-graft/core.rootbound-mark.
  "core.aegis-oath": {
    id: "core.aegis-oath",
    name: "Ägis-Schwur",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 0, toughness: 3 }, duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent +0/+3 (angeboren).",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von grantKeyword mit reach als Effekt (bisher nur swift/
  // airborne/trample/deathtouch/firstStrike als Tricks) - billigster der
  // Tricks (1 Mana, analog core.second-winds Situativitaet: nur relevant
  // gegen angreifende Flieger).
  "core.skyward-ward": {
    id: "core.skyward-ward",
    name: "Himmelswärts-Schutz",
    type: "spell",
    speed: "fast",
    cost: { light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "reach", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Reichweite.",
    rarity: "common",
    set: "core",
  },

  // Kombiniert loseLife (core.hexbind-lash) mit Kartenziehen - schwaecherer
  // Lebensverlust (1 statt 2) fuer denselben Mehrpreis wie core.soul-siphons
  // Kombination aus dealDamage+gainLife, hier als reiner Cantrip-Drain.
  "core.wraithcall-pact": {
    id: "core.wraithcall-pact",
    name: "Schattenruf-Pakt",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 1 },
    effects: [
      { kind: "loseLife", who: "opponent", amount: 1 },
      { kind: "drawCards", who: "controller", count: 1 },
    ],
    rulesText: "Dein Gegner verliert 1 Leben; ziehe eine Karte.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 5 (v0.8) — Spells: überwiegend Zweitkopien/Preispunkt-Varianten
  // bereits bewährter Effekt-Bausteine in neuen Farben (explizit erwünscht,
  // siehe Balancing-Notizen "Batch 5").
  // -----------------------------------------------------------------

  // Zweite Nutzung von `grantKeyword` trample/endOfTurn (nach core.bramble-
  // surge, wild) — identischer Effekt/Preis, andere Farbe (flame hat
  // trample bereits als KeywordAbility, core.wildfire-boar).
  "core.ember-briar": {
    id: "core.ember-briar",
    name: "Glutdorn",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "trample", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Trampelschaden.",
    rarity: "common",
    set: "core",
  },

  // Schließt die Brand-Kurve nach oben (core.fire-jolt 1/2, core.flame-lance
  // 2/3, core.cataclysm-brand 4/5) mit einem dritten Zwischenpunkt: 3 Mana
  // für 4 Schaden, exakt auf der linearen "+1 Schaden pro +1 Mana"-Kurve.
  "core.scorch-bolt": {
    id: "core.scorch-bolt",
    name: "Sengender Bolzen",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, flame: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 4 }],
    rulesText: "Füge einem Ziel deiner Wahl 4 Schaden zu.",
    rarity: "common",
    set: "core",
  },

  // Zweite Nutzung von `untapPermanent` als Effekt (nach core.second-wind,
  // light) — identischer Effekt/Preis (1 Mana), andere Farbe.
  "core.tidal-renewal": {
    id: "core.tidal-renewal",
    name: "Gezeitenerneuerung",
    type: "spell",
    speed: "fast",
    cost: { tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "untapPermanent", what: { target: 0 } }],
    rulesText: "Enttappe eine Kreatur deiner Wahl, die du kontrollierst.",
    rarity: "common",
    set: "core",
  },

  // Vierte `modifyStats`-endOfTurn-Karte (nach core.blazing-frenzy +2/+0,
  // core.aegis-ward +0/+3, core.tidal-surge +1/+2) — schließt wild als
  // letzte fehlende Farbe dieses Musters, Gesamtwert 3 wie die tide-Variante,
  // aggressiverer Split (+2/+1) passend zu wilds Statlinien-Identität.
  "core.wildheart-surge": {
    id: "core.wildheart-surge",
    name: "Wildherz-Schwall",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 2, toughness: 1 }, duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges +2/+1.",
    rarity: "common",
    set: "core",
  },

  // Sechster `grantKeyword`-Trick (nach swift/airborne/trample/deathtouch/
  // firstStrike/reach) und erste Nutzung von `lifelink` als temporärer
  // Effekt statt fester KeywordAbility — passend zu lights Lifelink-
  // Identität, gleicher Preispunkt wie core.wings-of-dawn/core.venom-brand
  // (2 Mana), da ein garantierter Lifelink-Schwung vor dem Kampf ähnlich
  // situativ stark ist wie Evasion oder ein garantierter Trade.
  "core.blessed-vigor": {
    id: "core.blessed-vigor",
    name: "Gesegnete Kraft",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "lifelink", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges Lebensverbindung.",
    rarity: "common",
    set: "core",
  },

  // Kombiniert `gainLife` mit `drawCards` (Gegenstück zu core.wraithcall-
  // pacts loseLife+drawCards, void) — schwächerer Lebensgewinn als core.
  // healing-light (2 statt 4) für denselben Mehrpreis gegenüber einem
  // reinen Cantrip, analog zur dortigen Kosten-Logik.
  "core.radiant-insight": {
    id: "core.radiant-insight",
    name: "Strahlende Einsicht",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, light: 1 },
    effects: [
      { kind: "gainLife", who: "controller", amount: 2 },
      { kind: "drawCards", who: "controller", count: 1 },
    ],
    rulesText: "Gewinne 2 Leben; ziehe eine Karte.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von `TargetSpec` `{ kind: "stackObject", objectKind:
  // "ability" }` im Pool (bisher nur "spell" bei core.silence-ban) —
  // schließt eine bisher ungenutzte Modellvariante. Konteret AUSSCHLIESSLICH
  // aktivierte/getriggerte Fähigkeiten auf dem Stack, keine Zaubersprüche —
  // enger Anwendungsbereich, daher billiger (1 statt 2 Mana) als
  // core.silence-ban.
  "core.silence-ward": {
    id: "core.silence-ward",
    name: "Stiller Bann",
    type: "spell",
    speed: "fast",
    cost: { void: 1 },
    targets: [{ kind: "stackObject", objectKind: "ability" }],
    effects: [{ kind: "counterStackObject", what: { target: 0 } }],
    rulesText: "Kontere eine aktivierte oder getriggerte Fähigkeit deiner Wahl auf dem Stack.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 6 — Spells: Schwerpunkt weitere `duration:"permanent"`-Varianten,
  // ein zweites Zwei-Zielslot-Paar (Tap statt Bounce/Schaden, Marken statt
  // Schaden), sowie die letzte unbenutzte `TargetSpec`-Variante
  // (`stackObject` `objectKind:"any"`). Details siehe Balancing-Notizen
  // „Batch 6" in docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // Permanente Variante von core.reckless-charge (swift, endOfTurn, 1 Mana)
  // nach der seit Batch 4 etablierten „+1 Mana für permanent"-Regel.
  "core.emberstride-brand": {
    id: "core.emberstride-brand",
    name: "Glutschritt-Brandmal",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "swift", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Eile.",
    rarity: "common",
    set: "core",
  },

  // Cantrip-Burn: kombiniert `dealDamage` mit `drawCards` (Gegenstück zu
  // core.wraithcall-pact, void, loseLife+drawCards, und core.radiant-
  // insight, light, gainLife+drawCards) — flame-typisch mit gezieltem
  // Schaden statt fixem Spieler-Effekt. Schwächerer Schaden als core.fire-
  // jolt (1 statt 2) für denselben Mehrpreis wie die beiden anderen
  // Cantrip-Paare.
  "core.emberflash-bolt": {
    id: "core.emberflash-bolt",
    name: "Glutblitz-Bolzen",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, flame: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [
      { kind: "dealDamage", to: { target: 0 }, amount: 1 },
      { kind: "drawCards", who: "controller", count: 1 },
    ],
    rulesText: "Füge einem Ziel deiner Wahl 1 Schaden zu; ziehe eine Karte.",
    rarity: "common",
    set: "core",
  },

  // Permanente Variante von core.tidal-surge (+1/+2, endOfTurn, 2 Mana) nach
  // derselben „+1 Mana"-Regel wie core.moltenscale-graft/core.aegis-oath.
  "core.tidalbound-growth": {
    id: "core.tidalbound-growth",
    name: "Flutgebundenes Wachstum",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 1, toughness: 2 }, duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent +1/+2.",
    rarity: "common",
    set: "core",
  },

  // Zweites Zwei-Zielslot-Paar (nach core.twin-cinder/core.riptide-purge,
  // Batch 4) — hier für `tapPermanent` statt Schaden/Bounce: verdoppelt
  // core.riptide-snares Einzel-Tap-Effekt. Bewusst NICHT auf den vollen
  // Doppelpreis (4 Mana, analog riptide-purge) angehoben, da ein Tap nur
  // eine Runde lang wirkt (schwächer als ein Bounce, der den Gegner zum
  // Neu-Casten zwingt) — daher 3 statt 4 Mana.
  "core.doubletide-snare": {
    id: "core.doubletide-snare",
    name: "Doppelflutfessel",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, tide: 1 },
    targets: [
      { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
      { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
    ],
    effects: [
      { kind: "tapPermanent", what: { target: 0 } },
      { kind: "tapPermanent", what: { target: 1 } },
    ],
    rulesText: "Tappe bis zu zwei Kreaturen deiner Wahl, die dein Gegner kontrolliert.",
    rarity: "uncommon",
    set: "core",
  },

  // Zwei-Zielslot-Variante für `addCounters` (nach core.twin-cinder/core.
  // riptide-purge) — verteilt zwei +1/+1-Marken auf bis zu zwei eigene
  // Kreaturen, wilds Wachstumsthema. Gleicher Preis wie core.twin-cinder
  // (2 Mana) für denselben Gesamtwert (2 Marken).
  "core.twinroot-blessing": {
    id: "core.twinroot-blessing",
    name: "Zwillingswurzel-Segen",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, wild: 1 },
    targets: [
      { kind: "permanent", cardTypes: ["unit"], controller: "own" },
      { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    ],
    effects: [
      { kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 },
      { kind: "addCounters", what: { target: 1 }, counterType: "plus1plus1", count: 1 },
    ],
    rulesText: "Lege je einen +1/+1-Marker auf bis zu zwei Kreaturen deiner Wahl, die du kontrollierst.",
    rarity: "uncommon",
    set: "core",
  },

  // Permanente Variante von core.wings-of-dawn (airborne, endOfTurn, 2 Mana)
  // nach der „+1 Mana"-Regel. Dauerhafte Evasion ist stärker als ein
  // dauerhafter Stat-/Trample-Grant (kann nicht durch reach/airborne-
  // Blocker umgangen werden), daher wie core.rootbound-mark (trample
  // permanent, +2 statt +1 Mana) eingestuft statt +1.
  "core.aureate-wings": {
    id: "core.aureate-wings",
    name: "Goldene Schwingen",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, light: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "airborne", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Flugfähigkeit.",
    rarity: "uncommon",
    set: "core",
  },

  // Größerer, aber `slow`-Lebensgewinn (Gegenstück zu core.healing-light,
  // fast, 4 Leben für 2 Mana) — gleiche Rate pro Mana (2 Leben/Mana), aber
  // Sorcery-Speed statt Instant-Speed als Preis für den höheren Einzelwert,
  // analog zur linearen Brand-Kurve (Rate konstant, Flexibilität sinkt).
  "core.radiant-mercy": {
    id: "core.radiant-mercy",
    name: "Strahlende Gnade",
    type: "spell",
    speed: "slow",
    cost: { generic: 2, light: 2 },
    effects: [{ kind: "gainLife", who: "controller", amount: 8 }],
    rulesText: "Gewinne 8 Leben.",
    rarity: "uncommon",
    set: "core",
  },

  // Letzte unbenutzte `TargetSpec`-Variante: `stackObject` `objectKind:
  // "any"` (bisher nur "spell" bei core.silence-ban, "ability" bei core.
  // silence-ward). Kontert BEIDES — Zaubersprüche UND aktivierte/getriggerte
  // Fähigkeiten — daher der teuerste und einzige `rare` Konter im Set (3
  // statt 2/1 Mana).
  "core.silence-veil": {
    id: "core.silence-veil",
    name: "Schleier des Schweigens",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 2 },
    targets: [{ kind: "stackObject", objectKind: "any" }],
    effects: [{ kind: "counterStackObject", what: { target: 0 } }],
    rulesText: "Kontere einen Zauberspruch, eine aktivierte oder eine getriggerte Fähigkeit deiner Wahl auf dem Stack.",
    rarity: "rare",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 7 — Spells: liberale Wiederverwendung bewährter Bausteine
  // (weitere `grantKeyword`-permanent-Preispunkte, ein dritter/vierter
  // `createToken`-Symmetrie-Spell, ein Einzelziel-`addCounters`-Spell, ein
  // zweiter Zwei-Zielslot-Debuff). Details siehe Balancing-Notizen
  // „Batch 7" in docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // grantKeyword trample mit duration:"permanent" in flame (nach core.
  // ember-briars trample/endOfTurn, 1 Mana) — nach der seit Batch 4
  // etablierten „+2 Mana für permanentes Trample"-Regel (analog core.
  // rootbound-mark, wild).
  "core.cinderroot-brand": {
    id: "core.cinderroot-brand",
    name: "Aschwurzel-Brandmal",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "trample", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Trampelschaden.",
    rarity: "uncommon",
    set: "core",
  },

  // Dritte Farbe für das `createToken`-Symmetrie-Spell-Paar (nach core.
  // seedling-swarm/wild, core.grave-legion/void) — nutzt core.spirit-token
  // (bereits als flame-ETB-Token bei core.cinderwing-fledgling etabliert).
  // Identischer Preispunkt/identische Statline (2 Mana, zwei 1/1-Token,
  // slow).
  "core.emberwake-rally": {
    id: "core.emberwake-rally",
    name: "Glutwach-Aufgebot",
    type: "spell",
    speed: "slow",
    cost: { generic: 1, flame: 1 },
    effects: [
      { kind: "createToken", who: "controller", tokenDefinitionId: "core.spirit-token", count: 2 },
    ],
    rulesText: "Erschaffe zwei 1/1 Lichtgeist-Kreaturen mit Flieger.",
    rarity: "common",
    set: "core",
  },

  // grantKeyword lifelink mit duration:"permanent" (erste Nutzung dieser
  // Kombination) — nach der „+1 Mana für permanent"-Regel gegenüber core.
  // blessed-vigors lifelink/endOfTurn (2 Mana, light).
  "core.tidebound-vow": {
    id: "core.tidebound-vow",
    name: "Flutgebundener Schwur",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "lifelink", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Lebensverbindung.",
    rarity: "uncommon",
    set: "core",
  },

  // Erste Spell-Nutzung von `removeCounters` für `minus1minus1` (bisher nur
  // als Relic-Fähigkeit: core.wardglow-censer) — direktes Gegenstück zu
  // core.wither-touch (tide, entfernt plus1plus1), hier für den anderen
  // Counter-Typ. Gleicher Preis (2 Mana), common statt uncommon, da
  // core.wardglow-censer bereits eine wiederholbare Antwort bietet und
  // diese Karte nicht mehr die einzige Lösung im Pool ist.
  "core.tidewash-cleanse": {
    id: "core.tidewash-cleanse",
    name: "Flutwäsche",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"] }],
    effects: [{ kind: "removeCounters", what: { target: 0 }, counterType: "minus1minus1", count: 2 }],
    rulesText: "Entferne bis zu zwei -1/-1-Marken von einer Kreatur deiner Wahl.",
    rarity: "common",
    set: "core",
  },

  // Erste Einzelziel-Spell-Nutzung von `addCounters` (plus1plus1) — bisher
  // nur als Zwei-Zielslot-Variante (core.twinroot-blessing) oder ETB/
  // Aktivierungs-Effekt. Zwei Marken auf EIN Ziel statt je einer auf zwei
  // Ziele, gleicher Gesamtwert/Preis wie core.twinroot-blessing (2 Mana).
  // Balance-Korrektur Runde 2 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 2"): Kosten {1}{Wild} -> {2}{Wild}. Grund:
  // Cross-Farb-Vergleich der "permanent"-Effekt-Familie zeigt eine
  // etablierte Preisregel ("+1 Mana gegenüber der endOfTurn-Variante" bzw.
  // "+1 Mana pro zusätzlicher Effekt-Stufe", siehe core.rootbound-mark/
  // core.aegis-oath) — 2 Marken auf EIN Ziel (effektiv permanent +2/+2,
  // die stärkste Einzelziel-Permanent-Buff-Variante im gesamten Set) kostete
  // bisher dieselben 2 Mana wie core.twinroot-blessings schwächere,
  // aufgeteilte Variante (je 1 Marke auf zwei Ziele) und war damit gegenüber
  // der Familie unterbepreist. Runde 1 hatte ausschließlich Units
  // angefasst; dies ist die einzige Spell-Korrektur in Runde 2.
  "core.wildroot-graft": {
    id: "core.wildroot-graft",
    name: "Wildwurzel-Veredelung",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 2 }],
    rulesText: "Lege zwei +1/+1-Marken auf eine Kreatur deiner Wahl, die du kontrollierst.",
    rarity: "common",
    set: "core",
  },

  // Vierte Farbe für das `createToken`-Symmetrie-Spell-Paar (nach core.
  // seedling-swarm/wild, core.grave-legion/void, core.emberwake-rally/
  // flame) — besonders passende Flavor-Wahl, da core.spirit-token
  // ("Lichtgeist") ohnehin lights Namensgebung trägt. Identischer
  // Preispunkt (2 Mana, zwei 1/1-Token, slow).
  "core.aurora-swarm": {
    id: "core.aurora-swarm",
    name: "Schwarm der Morgenröte",
    type: "spell",
    speed: "slow",
    cost: { generic: 1, light: 1 },
    effects: [
      { kind: "createToken", who: "controller", tokenDefinitionId: "core.spirit-token", count: 2 },
    ],
    rulesText: "Erschaffe zwei 1/1 Lichtgeist-Kreaturen mit Flieger.",
    rarity: "common",
    set: "core",
  },

  // Dritte Nutzung von zwei unabhängigen Zielslots auf einem Spell (nach
  // core.twin-cinder/core.riptide-purge, Batch 4, und core.doubletide-
  // snare/core.twinroot-blessing, Batch 6) — hier für `addCounters`
  // `minus1minus1` statt `plus1plus1`, das void-Gegenstück zu core.
  // twinroot-blessing (wild). Gleicher Preis (2 Mana) für denselben
  // Gesamtwert (2 Marken).
  "core.direbrood-curse": {
    id: "core.direbrood-curse",
    name: "Fluch der Unheilsbrut",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 1 },
    targets: [
      { kind: "permanent", cardTypes: ["unit"] },
      { kind: "permanent", cardTypes: ["unit"] },
    ],
    effects: [
      { kind: "addCounters", what: { target: 0 }, counterType: "minus1minus1", count: 1 },
      { kind: "addCounters", what: { target: 1 }, counterType: "minus1minus1", count: 1 },
    ],
    rulesText: "Lege je eine -1/-1-Marke auf bis zu zwei Kreaturen deiner Wahl.",
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 8 — Spells: schließt die letzten beiden fehlenden Keywords im
  // "grantKeyword als Effekt"-Baukasten (vigilant, guardian — bisher
  // NUR als KeywordAbility/StaticAbility-Modifier verliehen, nie als
  // zeitlich befristeter Spell-/Fähigkeits-Effekt), plus liberale
  // Wiederverwendung weiterer bewährter Bausteine in neuen Farben/
  // Preispunkten. Details siehe Balancing-Notizen „Batch 8".
  // -----------------------------------------------------------------

  // Permanente Variante von core.embermarch-brand (firstStrike,
  // endOfTurn, 2 Mana) nach der seit Batch 4 etablierten „+2 Mana für
  // permanentes Kampf-Keyword"-Regel (analog core.rootbound-mark,
  // trample permanent).
  "core.emberguard-brand": {
    id: "core.emberguard-brand",
    name: "Glutwacht-Brandmal",
    type: "spell",
    speed: "fast",
    cost: { generic: 3, flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "firstStrike", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Erststurm.",
    rarity: "uncommon",
    set: "core",
  },

  // Achter `grantKeyword`-Trick (nach swift/airborne/trample/deathtouch/
  // firstStrike/reach/lifelink) und erste Nutzung von `vigilant` als
  // temporärer Effekt statt fester KeywordAbility/StaticAbility-
  // Modifier — passend zu tides Signatur-Keyword, billigster
  // Preispunkt (1 Mana) wie core.second-wind/core.tidal-renewal.
  "core.vigilwave-charm": {
    id: "core.vigilwave-charm",
    name: "Wachsamkeitswoge",
    type: "spell",
    speed: "fast",
    cost: { tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "vigilant", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, ist bis zum Ende des Zuges wachsam.",
    rarity: "common",
    set: "core",
  },

  // Farbige Zweitkopie von core.rootbane-wither (wild, Einzelziel-
  // `minus1minus1` count 2, 2 Mana) — identischer Preis/Effekt, andere
  // Farbe. Ohne `controller`-Einschränkung im Zielslot (trifft jede
  // Kreatur, wie core.wither-touch/core.tidewash-cleanse), passend zu
  // tides bereits etablierten "trifft alles"-Counter-Werkzeugen.
  "core.tidebane-wither": {
    id: "core.tidebane-wither",
    name: "Flutbann-Fäulnis",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"] }],
    effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "minus1minus1", count: 2 }],
    rulesText: "Lege zwei -1/-1-Marken auf eine Kreatur deiner Wahl.",
    rarity: "uncommon",
    set: "core",
  },

  // Neunter `grantKeyword`-Trick und letzte Nutzung von `guardian` als
  // temporärer Effekt (bisher nur als KeywordAbility/StaticAbility-
  // Modifier) — schließt damit den "grantKeyword als Effekt"-Baukasten
  // für ALLE 9 Keywords im Set vollständig ab (siehe Balancing-Notiz
  // „Batch 8"). Passend zu wilds Guardian-Identität, billigster
  // Preispunkt (1 Mana) wie core.vigilwave-charm.
  "core.wildwatch-oath": {
    id: "core.wildwatch-oath",
    name: "Wildwacht-Schwur",
    type: "spell",
    speed: "fast",
    cost: { wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "guardian", duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die du kontrollierst, ist bis zum Ende des Zuges eine Wächterin.",
    rarity: "common",
    set: "core",
  },

  // Farbige Zweitkopie von core.twinroot-blessing (wild, zwei
  // Zielslots, je ein +1/+1-Marker) — identischer Preis/Effekt, andere
  // Farbe, passend zu lights Segens-Flavor.
  "core.dawnroot-blessing": {
    id: "core.dawnroot-blessing",
    name: "Morgenwurzel-Segen",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, light: 1 },
    targets: [
      { kind: "permanent", cardTypes: ["unit"], controller: "own" },
      { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    ],
    effects: [
      { kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 },
      { kind: "addCounters", what: { target: 1 }, counterType: "plus1plus1", count: 1 },
    ],
    rulesText: "Lege je einen +1/+1-Marker auf bis zu zwei Kreaturen deiner Wahl, die du kontrollierst.",
    rarity: "uncommon",
    set: "core",
  },

  // Farbige Zweitkopie von core.tidalbound-growth (tide, `modifyStats`
  // permanent +1/+2, 3 Mana) — identischer Preis/Effekt, andere Farbe.
  "core.hollowdrain-oath": {
    id: "core.hollowdrain-oath",
    name: "Hohlsog-Schwur",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, void: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 1, toughness: 2 }, duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent +1/+2.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von `grantKeyword` `reach` mit `duration:"permanent"`
  // (bisher nur endOfTurn: core.skyward-ward, light) — nach der „+1
  // Mana für permanent"-Regel (reach verschiebt die Kampfmathematik
  // weniger drastisch als trample/airborne/firstStrike, daher die
  // niedrigere Preisstufe statt +2).
  "core.hollowreach-oath": {
    id: "core.hollowreach-oath",
    name: "Hohlgriff-Schwur",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, void: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "reach", duration: "permanent" }],
    rulesText: "Zielkreatur, die du kontrollierst, erhält permanent Reichweite.",
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 9 (v0.12, Abschlussbatch) — Spells: liberale Wiederverwendung
  // bewährter Bausteine. Details siehe „Batch 9" in
  // docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // Schließt die Brand-Kurve nach core.fire-jolt (1 Mana/2 Schaden),
  // core.flame-lance (2 Mana/3 Schaden) und core.scorch-bolt (3 Mana/4
  // Schaden) um eine weitere Stufe nach oben ab: 4 Mana für 5 Schaden,
  // fortgesetzte abnehmende Mana-Effizienz pro Schadenspunkt, damit
  // teure Burn-Spells das frühe Spiel nicht dominieren.
  "core.pyreblast-cannon": {
    id: "core.pyreblast-cannon",
    name: "Feuerofen-Kanonade",
    type: "spell",
    speed: "fast",
    cost: { generic: 3, flame: 1 },
    targets: [{ kind: "unitOrPlayer" }],
    effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 5 }],
    rulesText: "Füge einem Ziel deiner Wahl 5 Schaden zu.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von `modifyStats` mit negativem Modifier auf einer
  // GEGNERISCHEN Kreatur (bisher nur als Buff auf eigene Kreaturen:
  // core.blazing-frenzy/core.aegis-ward u.a.) — funktional ein
  // Combat-Trick/Pseudo-Removal gegen kleine Blocker/Angreifer, billig
  // und nur bis Zugende, daher `common` trotz Zielwahl auf dem Gegner.
  "core.searing-curse": {
    id: "core.searing-curse",
    name: "Sengender Fluch",
    type: "spell",
    speed: "fast",
    cost: { flame: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
    effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: -2, toughness: -2 }, duration: "endOfTurn" }],
    rulesText: "Zielkreatur, die dein Gegner kontrolliert, erhält bis zum Ende des Zuges -2/-2.",
    rarity: "common",
    set: "core",
  },

  // Reiner Kartenvorteils-Spell (2 Karten für 3 Mana, `slow`), passend zu
  // tides Kartenvorteil-Identität — kein Zusatzeffekt, der Wert liegt
  // vollständig im Kartenzug.
  "core.tidal-insight": {
    id: "core.tidal-insight",
    name: "Flutweisheit",
    type: "spell",
    speed: "slow",
    cost: { generic: 2, tide: 1 },
    effects: [{ kind: "drawCards", who: "controller", count: 2 }],
    rulesText: "Ziehe zwei Karten.",
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `returnToHand` auf einem Nicht-Unit-Permanent
  // (bisher konnte nur core.gravetide-obelisk gegnerische Relics/
  // Enchantments/Terrains gezielt angreifen, dort per `destroyPermanent`)
  // — schwächer als destroy (der Gegner kann das Permanent erneut
  // spielen), dafür `fast` statt an ein Tap-Relic gebunden. Passend zu
  // tides Bounce-/Tempo-Identität.
  "core.tiderend-wave": {
    id: "core.tiderend-wave",
    name: "Flutriss-Woge",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, tide: 1 },
    targets: [{ kind: "permanent", cardTypes: ["relic", "enchantment", "terrain"], controller: "opponent" }],
    effects: [{ kind: "returnToHand", what: { target: 0 } }],
    rulesText: "Bringe ein Relikt, eine Verzauberung oder ein Terrain deiner Wahl, das dein Gegner kontrolliert, auf seine Hand zurück.",
    rarity: "uncommon",
    set: "core",
  },

  // Einzelziel-`addCounters`-Spell mit `count: 2` auf einem eigenen
  // Ziel (bisher nur als Zwei-Ziel-Variante mit je 1 Marker: core.
  // rootbound-mark-Familie/core.aurora-swarm) — hier zwei Marker auf
  // EINEM Ziel statt je einem auf zwei Zielen, passend zu wilds
  // Wachstums-Identität.
  "core.wildgrowth-surge": {
    id: "core.wildgrowth-surge",
    name: "Wildwuchs-Schub",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, wild: 1 },
    targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
    effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 2 }],
    rulesText: "Lege zwei +1/+1-Marken auf eine Kreatur deiner Wahl, die du kontrollierst.",
    rarity: "common",
    set: "core",
  },

  // `gainLife`+`scry`-Kombination (nach core.moonlit-augury, wild, 2
  // Leben + scry) — hier passend zu lights stärkerer Lebensgewinn-
  // Identität mit 3 statt 2 Leben, scry weiterhin bewusst mit 0 Wert
  // bepreist (§9.7 No-Op).
  "core.brightpath-vision": {
    id: "core.brightpath-vision",
    name: "Lichtpfad-Vision",
    type: "spell",
    speed: "fast",
    cost: { generic: 1, light: 1 },
    effects: [
      { kind: "gainLife", who: "controller", amount: 3 },
      { kind: "scry", who: "controller", count: 1 },
    ],
    rulesText: "Gewinne 3 Leben. Sieh dir die oberste Karte deiner Bibliothek an und lege sie oben oder unten auf die Bibliothek zurück.",
    rarity: "common",
    set: "core",
  },

  // Größere Variante von core.healing-light (4 Leben für 2 Mana) auf
  // derselben Mana-Effizienz-Rate (2 Leben pro Mana), hier auf 3 Mana
  // hochskaliert (6 Leben) — reine Größen-Zweitkopie ohne neuen Effekt.
  "core.dawnglow-mercy": {
    id: "core.dawnglow-mercy",
    name: "Morgenglanz-Gnade",
    type: "spell",
    speed: "fast",
    cost: { generic: 2, light: 1 },
    effects: [{ kind: "gainLife", who: "controller", amount: 6 }],
    rulesText: "Gewinne 6 Leben.",
    rarity: "common",
    set: "core",
  },

  // Erste Nutzung von `exilePermanent` auf einem breiteren Zielsatz
  // (`cardTypes: ["unit", "relic", "enchantment"]` statt nur `["unit"]`
  // wie core.banishment-rite) — die einzige zweite bedingungslose
  // Exile-Removal-Karte im Set, bewusst noch teurer (5 statt 4 Mana,
  // `slow`) und breiter einsetzbar, daher ebenfalls `rare`. Dominiert
  // core.banishment-rite nicht: dort günstiger, aber nur gegen Units.
  "core.hollowbanish-verdict": {
    id: "core.hollowbanish-verdict",
    name: "Hohlbann-Verdikt",
    type: "spell",
    speed: "slow",
    cost: { generic: 3, void: 2 },
    targets: [{ kind: "permanent", cardTypes: ["unit", "relic", "enchantment"], controller: "opponent" }],
    effects: [{ kind: "exilePermanent", what: { target: 0 } }],
    rulesText: "Verbanne ein Permanent deiner Wahl (Unit, Relikt oder Verzauberung), das dein Gegner kontrolliert.",
    rarity: "rare",
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

  // Farblose, teurere Variante von core.grove-elders Fähigkeit — seit
  // Balance-Korrektur Runde 2 (docs/cards/starter-set.md) kostet
  // grove-elders Aktivierung {2}{Wild} (3 Mana) statt vormals {1}{Wild} (2
  // Mana); Kosten hier von {2} auf {3} generisch angehoben, damit der
  // "farblos, aber schwächer/teurer"-Trade-off gegenüber grove-elder
  // erhalten bleibt.
  //
  // Balance-Korrektur Runde 3 (siehe docs/cards/starter-set.md, Abschnitt
  // "Balance-Korrektur Runde 3"): Zusatzkosten `{ kind: "tap" }` ergänzt,
  // parallel zur core.grove-elder-Korrektur — war nach der Runde-2-
  // Kostenerhöhung die letzte verbleibende Fähigkeit im GESAMTEN 300-
  // Karten-Pool, die einen wiederholbaren Marken-/Stat-Effekt ohne
  // jede Aktivierungs-Begrenzung (kein Tap/sacrificeSelf/payLife/
  // discardCards) erlaubte — bei genug Mana beliebig oft pro Zug
  // aktivierbar. Wichtiger methodischer Befund dabei: Diese Karte ist
  // ein FARBLOSES Relic und wird vom Bot-Analyse-Tool
  // (`color-balance.analysis.test.ts`) bewusst aus allen Mono-Farb-
  // Testdecks ausgeschlossen ("keine farblosen Relics" — siehe Abschnitt
  // "Empirische Balance-Prüfung (Bot-Simulation)" oben) — diese Korrektur
  // wirkt sich also NICHT auf die gemessene wild-Siegquote aus (das tut
  // nur core.grove-elder selbst, da farbig). Sie wird trotzdem
  // vorgenommen, weil der Auftrag beide Karten explizit gemeinsam nennt
  // und ein echtes Real-Play-/Konsistenz-Ungleichgewicht bestehen bliebe,
  // wenn nur die wild-Karte begrenzt würde, ihr farbloses Pendant aber
  // weiterhin uneingeschränkt in JEDEM Deck spielbar bliebe. Kosten
  // unverändert bei {3} pro Aktivierung.
  "core.growth-totem": {
    id: "core.growth-totem",
    name: "Wachstumstotem",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 3 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "{3}, Tappe das Wachstumstotem: Lege einen +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
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

  // -----------------------------------------------------------------
  // Batch 4 (v0.7) — Relics: neue Kombinationen bestehender Bausteine
  // (siehe Balancing-Notizen "Batch 4"), alle farblos gemäß der Design-
  // Linie "Relics möglichst farblos".
  // -----------------------------------------------------------------

  // Reine scry-Relic-Fähigkeit (bisher nur Unit-ETB/Spell-Effekt) -
  // wiederholbar, aber bei aktuell wertlosem scry (§9.7 No-Op) bewusst
  // billig und common bepreist, analog core.tidereader-oracle/core.moonlit-
  // augury.
  "core.farsight-lens": {
    id: "core.farsight-lens",
    name: "Weitsicht-Linse",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "scry", who: "controller", count: 1 }],
        text: "{1}, Tappe die Weitsicht-Linse: Sieh dir die oberste Karte deiner Bibliothek an und lege sie oben oder unten auf die Bibliothek zurück.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // modifyStats (permanent) als wiederholbarer Mana-Sink - Gegenstück zu
  // core.growth-totems +1/+1-Marker-Sink ({3} Cast, {2} Aktivierung, seit
  // Balance-Korrektur Runde 3 ebenfalls mit Tap-Kosten): hier nur +1/+0
  // (kein +1/+1), dafür NICHT durch removeCounters entfernbar (kein
  // Marker-Objekt) - echter Trade-off, kein strikt schwächeres/stärkeres
  // Werkzeug.
  "core.foundry-anvil": {
    id: "core.foundry-anvil",
    name: "Schmiedeambos",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 1, toughness: 0 }, duration: "permanent" }],
        text: "{2}, Tappe den Schmiedeambos: Zielkreatur, die du kontrollierst, erhält permanent +1/+0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // X-Kosten-Mana-Sink #2 (nach core.cinderwrack-engine, X-Schaden) - hier
  // X-Lebensgewinn statt X-Schaden. Lebensgewinn gewinnt anders als Schaden
  // keine Partien im Alleingang, daher billiger im Cast (3 statt 4) und
  // uncommon statt rare.
  "core.wellspring-cistern": {
    id: "core.wellspring-cistern",
    name: "Quellzisterne",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { x: true },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "gainLife", who: "controller", amount: { kind: "x" } }],
        text: "{X}, Tappe die Quellzisterne: Gewinne X Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // discardCards als AdditionalCost, hier für Schaden statt Kartenziehen
  // (core.wraithbound-ledger). Netto-Kartennachteil pro Aktivierung (anders
  // als wraithbound-ledgers Netto-Vorteil +1 Karte), dafür wiederholbare
  // Schadensquelle aus überschüssigen Handkarten.
  "core.ashen-ledger": {
    id: "core.ashen-ledger",
    name: "Aschfahles Kontobuch",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "discardCards", count: 1 }],
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
        text: "{1}, wirf die oberste Karte deiner Hand ab: Füge einem Ziel deiner Wahl 2 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Kombination von StaticAbility UND ActivatedAbility auf demselben
  // Relic (bisher immer nur eine der beiden Fähigkeitsarten pro Relic) -
  // vereint mechanisch core.wardstone-idol (+0/+1 ownUnits) und core.chain-
  // manacles ({1}+Tap: tappe gegnerische Kreatur) auf einer Karte. Da das
  // einen Kartenslot spart (ein Permanent statt zwei), ist der Preis nicht
  // nur additiv (2+2=4), sondern zusätzlich rare statt uncommon, um die
  // Konsolidierungs-Prämie abzubilden.
  "core.wardsteel-bastion": {
    id: "core.wardsteel-bastion",
    name: "Wardstahl-Bollwerk",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Units, die du kontrollierst, erhalten +0/+1.",
      },
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "{1}, Tappe das Wardstahl-Bollwerk: Tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // modes erstmals auf einer ActivatedAbility (bisher nur Spell/Triggered­
  // Ability: core.void-covenant, core.current-diplomat) - wiederholbarer
  // Mana-Sink mit Wahlfreiheit zwischen drei moderaten Effekten, daher wie
  // core.cinderwrack-engine (ebenfalls wiederholbarer Sink) hoch bepreist im
  // Cast und rare.
  "core.myriad-cog": {
    id: "core.myriad-cog",
    name: "Vielfaches Zahnrad",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        effects: [],
        modes: [
          {
            text: "Ziehe eine Karte.",
            effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          },
          {
            text: "Füge einem Ziel deiner Wahl 2 Schaden zu.",
            targets: [{ kind: "unitOrPlayer" }],
            effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
          },
          {
            text: "Gewinne 3 Leben.",
            effects: [{ kind: "gainLife", who: "controller", amount: 3 }],
          },
        ],
        text: "{2}, Tappe das Vielfache Zahnrad: Wähle eins — Ziehe eine Karte. Oder: Füge einem Ziel deiner Wahl 2 Schaden zu. Oder: Gewinne 3 Leben.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 5 (v0.8) — Relics: weitere farblose scope:ownUnits/opponentUnits/
  // allUnits-Varianten (schließt Farb-/Split-Paare), ein neuer Kombi-Typ
  // (`grantKeyword` auf scope:ownUnits, bisher nur scope:self), zwei weitere
  // Static+Activated-Konsolidierungs-Relics, eine `minus1minus1`-Antwort
  // (bisher fehlend im Pool) und ein zweiter X-Kosten-Mana-Sink. Details
  // siehe Balancing-Notizen "Batch 5".
  // -----------------------------------------------------------------

  // Dritte scope:ownUnits-Stats-Variante (nach core.iron-standard +1/+0 und
  // core.warforged-standard +1/+1) — reine Toughness-Anthem, gleicher
  // Preispunkt wie core.iron-standard (3 generisch).
  "core.bastionplate-standard": {
    id: "core.bastionplate-standard",
    name: "Bastionplatten-Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 0, toughness: 2 },
        text: "Units, die du kontrollierst, erhalten +0/+2.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite scope:opponentUnits-Relic (nach core.dominion-collar -0/-1) —
  // power- statt toughness-fokussierter Split, gleicher Preis (3 generisch).
  // Bildet zusammen mit core.abyssal-undertow (Enchantment, tide) ein neues
  // farblos/farbig-Paar für diesen Scope.
  "core.shackleweight-idol": {
    id: "core.shackleweight-idol",
    name: "Fesselgewicht-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "opponentUnits" },
        modifier: { kind: "stats", power: -1, toughness: 0 },
        text: "Kreaturen, die dein Gegner kontrolliert, erhalten -1/-0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite scope:allUnits-Relic (nach core.warhorn-standard +1/+0) —
  // toughness- statt power-fokussierter Split, gleicher Preis (2 generisch).
  // Bildet zusammen mit core.titanroot-canopy (Enchantment, wild) ein neues
  // farblos/farbig-Paar für diesen Scope.
  "core.ironhide-banner": {
    id: "core.ironhide-banner",
    name: "Eisenhaut-Banner",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "allUnits" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Alle Kreaturen im Spiel erhalten +0/+1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `StaticAbility`-Modifier `grantKeyword` mit
  // scope:"ownUnits" (bisher ausschließlich scope:"self", core.emberborn-
  // sprinter) — ein Keyword-Anthem für alle eigenen Kreaturen. Bewusst mit
  // `reach` (schwächstes/situativstes Keyword) als erste Testkarte dieser
  // neuen Kombination, um das Risiko einer Überbewertung gering zu halten.
  "core.skywatch-lattice": {
    id: "core.skywatch-lattice",
    name: "Himmelswacht-Gitterwerk",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "reach" },
        text: "Units, die du kontrollierst, haben Reichweite.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweiter X-Kosten-Mana-Sink (nach core.cinderwrack-engine, X Schaden) —
  // hier X +1/+1-Marker statt X Schaden. Da Marker dauerhaft sind (anders
  // als Einmalschaden), gleicher Cast-Preis/gleiche Rarity wie core.
  // cinderwrack-engine (4 generisch, rare).
  "core.wellhoard-forge": {
    id: "core.wellhoard-forge",
    name: "Hortquell-Schmiede",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "activated",
        manaCost: { x: true },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: { kind: "x" } }],
        text: "{X}, Tappe die Hortquell-Schmiede: Lege X +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Zweite Kombination von StaticAbility UND ActivatedAbility auf einem
  // Relic (nach core.wardsteel-bastion, +0/+1 ownUnits + Tap-Gegner-Effekt)
  // — hier +1/+0 ownUnits + wiederholbares Kartenziehen. Gleicher Preis/
  // Rarity wie wardsteel-bastion (4 generisch, rare), da dieselbe
  // Konsolidierungs-Logik gilt.
  "core.ironforge-loom": {
    id: "core.ironforge-loom",
    name: "Eisenschmiede-Webstuhl",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 1, toughness: 0 },
        text: "Units, die du kontrollierst, erhalten +1/+0.",
      },
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "{1}, Tappe den Eisenschmiede-Webstuhl: Ziehe eine Karte.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Erste direkte Antwort auf `minus1minus1`-Marken im Pool (bisher gab es
  // laut Balancing-Notiz "Batch 3" KEINE Möglichkeit, sie zu entfernen —
  // core.wither-touch/core.corrosive-clamp entfernen ausschließlich
  // "plus1plus1"). Gegenstück zu core.corrosive-clamp (gleicher Preis/
  // Aktivierungskosten), aber für den anderen Counter-Typ.
  "core.wardglow-censer": {
    id: "core.wardglow-censer",
    name: "Schutzglut-Räuchergefäß",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"] }],
        effects: [{ kind: "removeCounters", what: { target: 0 }, counterType: "minus1minus1", count: 2 }],
        text: "{2}, Tappe das Schutzglut-Räuchergefäß: Entferne bis zu zwei -1/-1-Marken von einer Kreatur deiner Wahl.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite `payLife`-AdditionalCost-Relic (nach core.soulforged-censer,
  // payLife 2 + Tap: ziehe 1 Karte) — hier derselbe Kosten-Baustein für
  // wiederholbaren Schaden statt Kartenziehen.
  "core.bloodforge-brand": {
    id: "core.bloodforge-brand",
    name: "Blutschmiede-Brandmal",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "payLife", amount: 2 }, { kind: "tap" }],
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
        text: "Zahle 2 Leben, Tappe das Blutschmiede-Brandmal: Füge einem Ziel deiner Wahl 2 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `modifyStats` (endOfTurn) auf einer wiederholbaren
  // Relic-Fähigkeit (bisher nur als Spell-Einmaleffekt: core.blazing-frenzy
  // u.a.) — ein repetierbarer Kampf-Trick-Motor, farblos gemäß Design-Linie.
  "core.battleforge-idol": {
    id: "core.battleforge-idol",
    name: "Kampfschmiede-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: 1, toughness: 1 }, duration: "endOfTurn" }],
        text: "{1}, Tappe das Kampfschmiede-Idol: Zielkreatur, die du kontrollierst, erhält bis zum Ende des Zuges +1/+1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `sacrificeSelf` als AdditionalCost auf einem Relic
  // (bisher nur auf Units: core.soul-drainer) — ein einmaliger Wert-Ausstieg
  // statt einer wiederholbaren Fähigkeit. Bewusst SCHWÄCHER pro
  // investiertem Mana als core.healing-light (3 statt 4 Leben für
  // ebenfalls 2 Mana insgesamt), da Timing-Flexibilität (jederzeit
  // aktivierbar, sobald das Relic im Spiel ist) den Malus rechtfertigt.
  "core.emberglass-ward": {
    id: "core.emberglass-ward",
    name: "Glutglas-Schutzsiegel",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        effects: [{ kind: "gainLife", who: "controller", amount: 3 }],
        text: "Opfere das Glutglas-Schutzsiegel: Gewinne 3 Leben.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 6 — Relics: eine dritte Static+Activated-Konsolidierungskarte,
  // ein weiterer `costChange`-Vertreter (farblos, opponentSpells), zwei
  // weitere Mana-Sinks (Keyword-Grant permanent, X-Kosten loseLife), sowie
  // Zweitkopien von `untapPermanent`/`sacrificeSelf`/`modes` auf neuen
  // Preispunkten. Alle farblos gemäß Design-Linie „Relics möglichst
  // farblos". Details siehe Balancing-Notizen „Batch 6".
  // -----------------------------------------------------------------

  // Farbloses Gegenstück zu core.tariff-spire (Enchantment, tide,
  // opponentSpells +1, {2}{Flut}) — dieselbe „farblos&teurer"-Logik wie
  // core.forgeheart-crucible vs. core.cinderforge-charm, hier auf die
  // Kostenerhöhungs-Variante angewendet. {4} generisch, rare wie alle
  // bisherigen `costChange`-Karten.
  "core.leaden-toll": {
    id: "core.leaden-toll",
    name: "Bleierner Zoll",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
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

  // Dritte Kombination von StaticAbility UND ActivatedAbility auf einem
  // Relic (nach core.wardsteel-bastion/core.ironforge-loom) — vereint
  // core.wardstone-idols +0/+1-Anthem mit core.chain-manacles' Tap-Effekt.
  // Gleicher Preis/Rarity wie die beiden Vorbilder (4 generisch, rare),
  // dieselbe Konsolidierungs-Prämien-Logik.
  "core.bastion-forgeworks": {
    id: "core.bastion-forgeworks",
    name: "Bastionschmiede",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Units, die du kontrollierst, erhalten +0/+1.",
      },
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "{1}, Tappe die Bastionschmiede: Tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // `untapPermanent` als wiederholbare Relic-Fähigkeit (bisher nur als
  // Einmaleffekt: core.second-wind/core.tidal-renewal) — Gegenstück zu
  // core.chain-manacles (Tap statt Untap). Gleicher Preis/gleiche
  // Aktivierungskosten wie chain-manacles, uncommon.
  "core.clockwork-mainspring": {
    id: "core.clockwork-mainspring",
    name: "Uhrwerk-Triebfeder",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "untapPermanent", what: { target: 0 } }],
        text: "{1}, Tappe die Uhrwerk-Triebfeder: Enttappe eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite `sacrificeSelf`-Relic (nach core.emberglass-ward, gainLife 3) —
  // hier Kartenvorteil statt Lebensgewinn. Einmaliger Wert-Ausstieg ohne
  // Aktivierungskosten (nur das Opfer selbst), bewusst günstig im Cast (1
  // generisch), da der gesamte Wert erst beim späteren Opfern realisiert
  // wird (Tempoverlust: zwei Kartenzüge statt einem).
  "core.wisproot-cache": {
    id: "core.wisproot-cache",
    name: "Wisproot-Cache",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 1 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        effects: [{ kind: "drawCards", who: "controller", count: 2 }],
        text: "Opfere den Wisproot-Cache: Ziehe zwei Karten.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite `modes`-ActivatedAbility (nach core.myriad-cog) — schwächere,
  // billigere Variante mit nur zwei statt drei Modi und niedrigeren Cast-/
  // Aktivierungskosten, daher uncommon statt rare.
  "core.twinpath-cog": {
    id: "core.twinpath-cog",
    name: "Zwiepfad-Zahnrad",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        effects: [],
        modes: [
          {
            text: "Ziehe eine Karte.",
            effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          },
          {
            text: "Füge einem Ziel deiner Wahl 2 Schaden zu.",
            targets: [{ kind: "unitOrPlayer" }],
            effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
          },
        ],
        text: "{1}, Tappe das Zwiepfad-Zahnrad: Wähle eins — Ziehe eine Karte. Oder: Füge einem Ziel deiner Wahl 2 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // `grantKeyword` mit `duration:"permanent"` erstmals auf einer
  // `ActivatedAbility` (bisher nur als Spell-Effekt: core.rootbound-mark/
  // core.emberstride-brand/core.aureate-wings) — wiederholbarer Mana-Sink,
  // analog core.foundry-anvil (dort `modifyStats` permanent statt
  // `grantKeyword`). Gleicher Preis/gleiche Rarity wie foundry-anvil.
  "core.hearthforge-anvil": {
    id: "core.hearthforge-anvil",
    name: "Herdschmiede-Amboss",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "swift", duration: "permanent" }],
        text: "{2}, Tappe den Herdschmiede-Amboss: Zielkreatur, die du kontrollierst, erhält permanent Eile.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Dritter X-Kosten-Mana-Sink (nach core.cinderwrack-engine, X Schaden;
  // core.wellhoard-forge, X +1/+1-Marker) — hier X Lebensverlust NUR beim
  // gegnerischen Spieler (kein Kreatur-Ziel möglich, anders als
  // cinderwrack-engine). Gleicher Cast-Preis wie cinderwrack-engine (4
  // generisch), aber eine Rarity-Stufe niedriger (uncommon statt rare), da
  // die engere Zielbeschränkung (kein Removal gegen Blocker) den fehlenden
  // Rarity-Aufschlag rechtfertigt — dieselbe Abwägung wie bei core.
  // wellspring-cistern (X-Lebensgewinn, ebenfalls uncommon).
  "core.direful-siphon": {
    id: "core.direful-siphon",
    name: "Unheilvoller Aderlass",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "activated",
        manaCost: { x: true },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "loseLife", who: "opponent", amount: { kind: "x" } }],
        text: "{X}, Tappe den Unheilvollen Aderlass: Dein Gegner verliert X Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 7 — Relics: liberale Wiederverwendung bewährter Bausteine
  // (weitere scope:opponentUnits/allUnits-Varianten, ein zweiter farbloser
  // ownUnits-Keyword-Anthem, zusätzliche AdditionalCost-Kombinationen).
  // Alle farblos gemäß Design-Linie „Relics möglichst farblos". Details
  // siehe Balancing-Notizen „Batch 7".
  // -----------------------------------------------------------------

  // Dritte scope:opponentUnits-Relic/Enchantment-Karte insgesamt (nach
  // core.dominion-collar -0/-1 und core.shackleweight-idol -1/-0, beide 3
  // Mana) — reine Toughness-Variante mit doppelter Magnitude (-0/-2),
  // daher teurer (4 statt 3 Mana), gleiche Rarity-Stufe wie das farbige
  // Gegenstück core.blightmire-shroud (void, -1/-1, 4 Mana, rare) — hier
  // aber uncommon, da nur EIN Stat betroffen ist statt beider.
  "core.gloomweight-idol": {
    id: "core.gloomweight-idol",
    name: "Trübnisgewicht-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "opponentUnits" },
        modifier: { kind: "stats", power: 0, toughness: -2 },
        text: "Kreaturen, die dein Gegner kontrolliert, erhalten -0/-2.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Farbloses Gegenstück zu core.titanroot-canopy (Enchantment, wild,
  // allUnits +1/+1, 2 Mana, uncommon) — dieselbe „farblos&teurer"-Logik wie
  // bei core.iron-standard vs. core.wildgrowth-field, hier auf den
  // symmetrischen allUnits-Buff angewendet: {3} generisch statt {2}{Wild},
  // gleiche Rarity (uncommon), da symmetrische Buffs strukturell schwächer
  // sind als asymmetrische (siehe Balancing-Notiz zum bestehenden
  // allUnits-Buff-Paar aus Batch 5).
  "core.allfield-standard": {
    id: "core.allfield-standard",
    name: "Allfeld-Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "allUnits" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Alle Kreaturen im Spiel erhalten +1/+1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Dritte `payLife`-AdditionalCost-Relic (nach core.soulforged-censer,
  // Kartenziehen, und core.bloodforge-brand, Schaden) — hier für
  // `addCounters` statt Kartenziehen/Schaden: wiederholbarer +1/+1-Marker-
  // Sink gegen Lebenspunkte statt Mana, farblos gemäß Design-Linie.
  "core.vitalward-sigil": {
    id: "core.vitalward-sigil",
    name: "Lebenswacht-Siegel",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "payLife", amount: 2 }, { kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "Zahle 2 Leben, Tappe das Lebenswacht-Siegel: Lege einen +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Dritte `discardCards`-AdditionalCost-Relic (nach core.wraithbound-
  // ledger, Kartenziehen, und core.ashen-ledger, Schaden) — hier für
  // `gainLife` statt Kartenziehen/Schaden, klassisches "Karte gegen Leben"-
  // Tauschwerkzeug.
  "core.hollowed-satchel": {
    id: "core.hollowed-satchel",
    name: "Hohle Satteltasche",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "discardCards", count: 1 }],
        effects: [{ kind: "gainLife", who: "controller", amount: 3 }],
        text: "{1}, wirf die oberste Karte deiner Hand ab: Gewinne 3 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Dritte `sacrificeSelf`-Relic (nach core.emberglass-ward, gainLife 3,
  // und core.wisproot-cache, Kartenziehen) — hier für gezielten Schaden
  // statt Lebensgewinn/Kartenvorteil. Bewusst günstig im Cast (1
  // generisch), da der Wert erst beim späteren Opfern realisiert wird,
  // analog zu den beiden Vorbildern.
  "core.cinderfall-idol": {
    id: "core.cinderfall-idol",
    name: "Aschfall-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 1 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 2 }],
        text: "Opfere das Aschfall-Idol: Füge einem Ziel deiner Wahl 2 Schaden zu.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Zweite farblose `grantKeyword`-`ownUnits`-Anthem-Relic (nach core.
  // skywatch-lattice, reach, 3 Mana) — hier mit `swift` statt `reach`.
  // Gleicher Preis/gleiche Rarity wie das Vorbild (3 generisch, uncommon).
  "core.skyforge-standard": {
    id: "core.skyforge-standard",
    name: "Himmelsschmiede-Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "swift" },
        text: "Units, die du kontrollierst, haben Eile.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 8 — Relics: ein neues onDeath-Beispiel auf einem Nicht-Unit-
  // Permanent (zeigt, dass `sacrificeSelf` jetzt selbst `onDeath{self}`
  // auslöst, siehe Balancing-Notizen „Batch 8"), plus liberale
  // Wiederverwendung weiterer bewährter Bausteine. Alle farblos gemäß
  // Design-Linie „Relics möglichst farblos".
  // -----------------------------------------------------------------

  // Erstes Nicht-Unit-`onDeath{self}`-Beispiel im Pool (rules-engine.md
  // 9.15): kombiniert eine `sacrificeSelf`-Activated-Ability MIT einem
  // `onDeath{self}`-Trigger auf demselben Permanent. Opfert der
  // Controller das Relikt selbst, feuern jetzt BEIDE Effekte (Opfern
  // ZÄHLT als Tod, siehe 9.15) — macht die eigene Aktivierung effektiv
  // zu "Ziehe zwei Karten" (identischer Gesamtwert wie core.wisproot-
  // cache). Wird das Relikt dagegen vom GEGNER zerstört (z.B. über
  // core.gravetide-obelisk, das gezielt Relics/Enchantments/Terrains
  // angreifen kann), feuert NUR der onDeath-Trigger (1 Karte) — der
  // Controller hat die Aktivierung nie gewählt. Genau dieser
  // Resilienz-Fall gegen gegnerische Entfernung existierte vor dem
  // 9.15-Fix nicht (destroyPermanent löste onDeath damals gar nicht
  // aus) und rechtfertigt den höheren Preis gegenüber core.wisproot-
  // cache (2 statt 1 Mana) trotz identischem Bestfall-Wert.
  "core.duskbound-cairn": {
    id: "core.duskbound-cairn",
    name: "Dämmerbund-Kairn",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Opfere den Dämmerbund-Kairn: Ziehe eine Karte.",
      },
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Wenn der Dämmerbund-Kairn stirbt, ziehe eine Karte.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Relic-Nutzung von `discardCards` als direkter Effekt (bisher
  // nur als AdditionalCost oder als Spell-Effekt: core.mind-rot) —
  // symmetrisches Gegenstück zu core.clockwork-brooch (Kartenziehen,
  // {1}+Tap, 2 Mana Cast, uncommon): trifft stattdessen den Gegner.
  "core.hollowed-locket": {
    id: "core.hollowed-locket",
    name: "Ausgehöhltes Medaillon",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 1 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "discardCards", who: "opponent", count: 1, random: true }],
        text: "{1}, Tappe das Ausgehöhlte Medaillon: Dein Gegner wirft eine zufällig bestimmte Karte ab.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // `grantKeyword` mit `duration:"permanent"` auf einer wiederholbaren
  // Relic-Fähigkeit — zweite Kombination dieser Art (nach core.
  // hearthforge-anvil, swift) — hier `airborne` statt `swift`. Gleicher
  // Preis/gleiche Rarity wie das Vorbild (3 Mana Cast, {2}+Tap
  // Aktivierung, uncommon).
  "core.skyclad-anvil": {
    id: "core.skyclad-anvil",
    name: "Himmelsgewandter Amboss",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 3 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "grantKeyword", what: { target: 0 }, keyword: "airborne", duration: "permanent" }],
        text: "{2}, Tappe den Himmelsgewandten Amboss: Zielkreatur, die du kontrollierst, erhält permanent Flugfähigkeit.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Vierte `payLife`-AdditionalCost-Relic (nach core.soulforged-censer,
  // core.bloodforge-brand, core.vitalward-sigil) — erste Kombination
  // mit `modifyStats` (endOfTurn) statt Kartenziehen/Schaden/Marken:
  // ein wiederholbarer Debuff-Mana-Sink gegen Leben statt Mana, farblos
  // gemäß Design-Linie.
  "core.direful-clasp": {
    id: "core.direful-clasp",
    name: "Unheilvolle Spange",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "payLife", amount: 2 }, { kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "modifyStats", what: { target: 0 }, modifier: { power: -2, toughness: 0 }, duration: "endOfTurn" }],
        text: "Zahle 2 Leben, Tappe die Unheilvolle Spange: Zielkreatur, die dein Gegner kontrolliert, erhält bis zum Ende des Zuges -2/-0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // `removeCounters` als wiederholbare Relic-Fähigkeit für `plus1plus1`
  // (bisher nur `minus1minus1`: core.wardglow-censer) — direktes
  // Gegenstück zu core.wither-touch (Spell), hier als Mana-Sink statt
  // Einmaleffekt.
  "core.witherglass-idol": {
    id: "core.witherglass-idol",
    name: "Welkglas-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 1 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"] }],
        effects: [{ kind: "removeCounters", what: { target: 0 }, counterType: "plus1plus1", count: 2 }],
        text: "{1}, Tappe das Welkglas-Idol: Entferne bis zu zwei +1/+1-Marken von einer Kreatur deiner Wahl.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Vierte `sacrificeSelf`-Relic (nach core.emberglass-ward/gainLife,
  // core.wisproot-cache/Kartenziehen, core.cinderfall-idol/Schaden) —
  // erste Kombination mit `addCounters`: statt eines Drain-/Wert-
  // Effekts ein einmaliger Pump auf eine eigene Kreatur.
  "core.rootbound-effigy": {
    id: "core.rootbound-effigy",
    name: "Wurzelgebundene Effigie",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 1 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 2 }],
        text: "Opfere die Wurzelgebundene Effigie: Lege zwei +1/+1-Marken auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 9 (v0.12, Abschlussbatch) — Relics: liberale Wiederverwendung
  // bewährter Bausteine, alle farblos gemäß Design-Linie „Relics
  // möglichst farblos". Details siehe „Batch 9" in
  // docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // Dritter X-Kosten-Mana-Sink im Pool (nach core.cinderwrack-engine/
  // Schaden, core.wellspring-cistern/Lebensgewinn, core.direful-siphon/
  // Lebensverlust, core.wellhoard-forge/Marken) — erste Kombination mit
  // `drawCards` (`count: {kind:"x"}`, vom Modell bereits als `Amount`
  // unterstützt). Kartenziehen skaliert am stärksten mit X, daher wie
  // die anderen X-Sinks teuer im Cast (4 generisch) und `rare`.
  "core.endless-archive": {
    id: "core.endless-archive",
    name: "Endloses Archiv",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "activated",
        manaCost: { x: true },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "drawCards", who: "controller", count: { kind: "x" } }],
        text: "{X}, Tappe das Endlose Archiv: Ziehe X Karten.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Dritte farblose `grantKeyword`-`ownUnits`-Anthem-Relic (nach core.
  // skywatch-lattice/reach, core.skyforge-standard/swift) — hier
  // erstmals mit einem starken Kampf-Keyword (`firstStrike`) statt
  // reach/swift. Analog zur bereits etablierten Regel bei den
  // Enchantment-Pendants (core.dawnward-standard/core.tidalguard-
  // standard, beide `rare`): ein board-weiter, dauerhafter firstStrike-
  // Anthem ist deutlich stärker als reach/swift-Anthems, daher auch als
  // Relic teurer (4 statt 3 generisch) und `rare` statt `uncommon`.
  "core.vanguard-standard": {
    id: "core.vanguard-standard",
    name: "Vorhut-Feldzeichen",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 4 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "firstStrike" },
        text: "Units, die du kontrollierst, haben Erststurm.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Fünfte `sacrificeSelf`-Relic (nach core.emberglass-ward/gainLife,
  // core.wisproot-cache/Kartenziehen, core.cinderfall-idol/Schaden,
  // core.rootbound-effigy/Marken) — erste Kombination mit
  // `destroyPermanent`: ein einmaliges Removal-Werkzeug, das Karte UND
  // Relic-Slot kostet. Bewusst auf demselben Preis-/Rarity-Niveau wie
  // core.doomreap-edict (3 Mana, uncommon), hier aber 2 Mana Cast + der
  // Verlust des Relikts selbst als Gesamtinvestition.
  "core.forsaken-snare": {
    id: "core.forsaken-snare",
    name: "Verlassene Falle",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "sacrificeSelf" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
        text: "Opfere die Verlassene Falle: Zerstöre eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Fünfte `payLife`-AdditionalCost-Relic (nach core.soulforged-censer,
  // core.bloodforge-brand, core.vitalward-sigil, core.direful-clasp) —
  // Gegenstück zu core.bloodforge-brand (payLife 2 + Tap: 2 Schaden),
  // hier auf 3 Schaden hochskaliert bei identischen Zusatzkosten — reine
  // Größen-Zweitkopie, kein neuer Effekt.
  "core.bloodpact-shackle": {
    id: "core.bloodpact-shackle",
    name: "Blutpakt-Fessel",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        additionalCosts: [{ kind: "payLife", amount: 2 }, { kind: "tap" }],
        targets: [{ kind: "unitOrPlayer" }],
        effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 3 }],
        text: "Zahle 2 Leben, Tappe die Blutpakt-Fessel: Füge einem Ziel deiner Wahl 3 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Einfachster wiederholbarer Lebensgewinn-Sink im Pool (kein
  // `payLife`/`discardCards`, nur Mana + Tap) — bewusst schwach (1 Leben
  // pro Aktivierung) und `common`, reiner Einsteiger-Preispunkt.
  "core.wellspring-charm": {
    id: "core.wellspring-charm",
    name: "Quellzauber-Amulett",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
        text: "{1}, Tappe das Quellzauber-Amulett: Gewinne 1 Leben.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Wiederholbarer Einzelmarker-Sink (Gegenstück zu core.growth-totem,
  // dort {3} — seit Balance-Korrektur Runde 3 ebenfalls mit Tap-Kosten,
  // siehe dort) — hier billiger pro Aktivierung ({1}), sonst identisch
  // begrenzt (1×/Zug via Tap-Kosten).
  "core.rootgrowth-idol": {
    id: "core.rootgrowth-idol",
    name: "Wurzelwuchs-Idol",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 1 },
        additionalCosts: [{ kind: "tap" }],
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "{1}, Tappe das Wurzelwuchs-Idol: Lege einen +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Einfachster wiederholbarer Lebensverlust-Sink im Pool (Gegenstück zu
  // core.wellspring-charm, hier gegen den Gegner statt Lebensgewinn für
  // den Controller) — bewusst schwach (1 Leben pro Aktivierung) und
  // `common`.
  "core.wraithbound-manacle": {
    id: "core.wraithbound-manacle",
    name: "Schattengebundene Fessel",
    type: "relic",
    subtypes: ["Wunderwerk"],
    cost: { generic: 2 },
    abilities: [
      {
        kind: "activated",
        manaCost: { generic: 2 },
        additionalCosts: [{ kind: "tap" }],
        effects: [{ kind: "loseLife", who: "opponent", amount: 1 }],
        text: "{2}, Tappe die Schattengebundene Fessel: Dein Gegner verliert 1 Leben.",
      },
    ],
    rarity: "common",
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

  // -----------------------------------------------------------------
  // Batch 4 (v0.7) — Enchantments: ein Vertreter pro Farbe, Schwerpunkt
  // neue Trigger-Kombinationen (onUpkeep/onSpellCast/onEndStep/onUnitDied
  // mit bisher ungenutzten Effekt-Paarungen). Details siehe Balancing-
  // Notizen "Batch 4".
  // -----------------------------------------------------------------

  // onUpkeep-Gegenstück zu core.dawnrise-sanctuary (light, +1 Leben), hier
  // direkter Schaden statt Lebensgewinn - etwas stärker (verkürzt die
  // Partie aktiv statt sie nur zu verlängern), daher teurer (3 statt 2
  // Mana) und rare statt uncommon.
  "core.ashborn-brand": {
    id: "core.ashborn-brand",
    name: "Aschgeborenes Brandmal",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, flame: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUpkeep", whoseTurn: "own" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 1 }],
        text: "Zu Beginn deines Bereitschaftssegments fügt das Aschgeborene Brandmal deinem Gegner 1 Schaden zu.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // onSpellCast (bisher nur core.warding-thorns, wild) kombiniert mit scry
  // statt Schaden - da scry aktuell ein No-Op ist (§9.7), bewusst billig
  // (2 Mana) und common bepreist, analog core.tidereader-oracle/core.moon­
  // lit-augury. Feuert wie warding-thorns bei JEDER selbst gecasteten
  // nicht-Terrain-Karte, nicht nur bei Spells.
  "core.tidebound-archive": {
    id: "core.tidebound-archive",
    name: "Flutgebundenes Archiv",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, tide: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onSpellCast", caster: "own" },
        effects: [{ kind: "scry", who: "controller", count: 1 }],
        text: "Immer wenn du eine Karte spielst, sieh dir die oberste Karte deiner Bibliothek an und lege sie oben oder unten auf die Bibliothek zurück.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // onEndStep (bisher nur core.grasping-shadows, void, mit discardCards)
  // hier mit addCounters auf ein bei jedem Auslösen frei wählbares Ziel -
  // wandelt die eigene Endphase dauerhaft in eine Marken-Engine um, analog
  // core.verdant-return (onUnitDied -> createToken), gleicher Preis/Rarity.
  "core.wildseed-grove": {
    id: "core.wildseed-grove",
    name: "Wildsaat-Hain",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, wild: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEndStep", whoseTurn: "own" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "Zu Beginn deines Endsegments lege einen +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // onUnitDied (controller: "own") mit gainLife statt createToken
  // (core.verdant-return) - "Märtyrer"-Design: kompensiert eigene Verluste
  // statt sie in neue Körper umzuwandeln. Schwächer/enger als verdant-
  // return (kein Boardimpact), daher uncommon statt rare.
  "core.sanctified-remains": {
    id: "core.sanctified-remains",
    name: "Geweihte Gebeine",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, light: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUnitDied", controller: "own" },
        effects: [{ kind: "gainLife", who: "controller", amount: 2 }],
        text: "Immer wenn eine Kreatur, die du kontrollierst, stirbt, gewinnst du 2 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // onUnitDied (controller: "opponent") mit loseLife statt createToken/
  // gainLife - bestraft den Gegner für JEDEN Verlust einer eigenen Kreatur
  // (Kampf, eigenes Opfer, gegnerisches Removal), ohne eventSubject zu
  // benötigen (Ziel ist relativ zum Controller, nicht die gestorbene
  // Einheit selbst). Vergleichbar breit/stark wie core.warding-thorns
  // (onSpellCast, 1 Schaden pro gegnerischem Zauber, 3 Mana rare) - gleicher
  // Preispunkt und dieselbe Einstufung.
  "core.witherplague-shrine": {
    id: "core.witherplague-shrine",
    name: "Seuchenwelk-Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, void: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUnitDied", controller: "opponent" },
        effects: [{ kind: "loseLife", who: "opponent", amount: 1 }],
        text: "Immer wenn eine Kreatur, die dein Gegner kontrolliert, stirbt, verliert er 1 Leben.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 5 (v0.8) — Enchantments: Schwerpunkt Aura-Vielfalt (7 der 10
  // neuen Enchantments sind Auren, siehe Balancing-Notizen "Batch 5") und
  // weitere scope:opponentUnits/allUnits-Paare.
  // -----------------------------------------------------------------

  // Vierte Curse-Aura im Set (nach core.rootrot-curse -1/-2 wild,
  // core.riptide-shackles -2/-1 tide) — reine Toughness-Variante,
  // vervollständigt zusammen mit core.hollowcurse-brand (void, -3/-0) das
  // "Curse-Aura-Quartett" über 4 der 5 Farben (light bewusst ausgelassen,
  // passend zu lights fehlender Curse-Identität). Gleicher Gesamtwert (-3),
  // gleicher Preis (2 Mana) wie die beiden bestehenden Curse-Auren.
  "core.ashbound-curse": {
    id: "core.ashbound-curse",
    name: "Fluch der Aschenbindung",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, flame: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 0, toughness: -3 },
        text: "Die verzauberte Unit erhält -0/-3.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `StaticAbility`-Modifier `grantKeyword` mit
  // scope:"attachedTo" (bisher nur scope:"self", core.emberborn-sprinter) —
  // eine Aura, die dauerhaft ein Keyword verleiht statt Stats. Preislich an
  // den bestehenden Stat-Buff-Auren orientiert (core.blessing-of-
  // steadfastness u.a., 2 Mana für "permanent, solange die Aura hält"): ein
  // relevantes Keyword ist ungefähr gleichwertig zu deren Gesamtwert 3,
  // siehe Balancing-Notizen "Batch 5" für die ausführliche Preisbegründung.
  "core.emberclad-brand": {
    id: "core.emberclad-brand",
    name: "Glutgewandtes Brandmal",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, flame: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "firstStrike" },
        text: "Die verzauberte Unit hat Erststurm.",
      },
    ],
    rulesText: "Erststurm (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Zweite Aura mit `grantKeyword` (nach core.emberclad-brand, flame) —
  // verleiht `vigilant`, tides Signatur-Keyword. Gleicher Preis (2 Mana) wie
  // alle Keyword-Auren dieses Batches.
  "core.tidewarden-sigil": {
    id: "core.tidewarden-sigil",
    name: "Flutwart-Siegel",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, tide: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "vigilant" },
        text: "Die verzauberte Unit ist wachsam.",
      },
    ],
    rulesText: "Wachsam (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Zweite scope:opponentUnits-Enchantment (nach core.blightmire-shroud,
  // void, -1/-1) — power-fokussierter Split (-2/-0) statt balanciert,
  // bildet mit core.shackleweight-idol (Relic, farblos, -1/-0) ein neues
  // farblos/farbig-Paar für diesen Scope. Gleicher Preis/Rarity wie
  // core.blightmire-shroud (4 Mana, rare) — gleiche Gesamtmagnitude (2).
  "core.abyssal-undertow": {
    id: "core.abyssal-undertow",
    name: "Abgrundsog",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, tide: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "opponentUnits" },
        modifier: { kind: "stats", power: -2, toughness: 0 },
        text: "Kreaturen, die dein Gegner kontrolliert, erhalten -2/-0.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Neue Trigger/Effekt-Kombination: `onUpkeep` + `tapPermanent` (bisher
  // feuerte onUpkeep nur mit gainLife/dealDamage). WICHTIG für die Timing-
  // Logik: der Trigger muss im EIGENEN Bereitschaftssegment feuern (nicht
  // im eigenen Endsegment!), da ein am eigenen Endsegment getapptes
  // gegnerisches Ziel bereits vor dem eigenen nächsten Kampf durch DESSEN
  // Enttapp-Schritt wieder enttappt wäre und der Effekt wirkungslos
  // verpuffen würde — onUpkeep tappt dagegen zu Beginn des EIGENEN Zuges
  // und hält das Ziel über den gesamten eigenen Zug (inkl. Kampf) hinweg
  // fest. Wiederholbarer Einzelziel-Tap-Lock mit freier Zielwahl jede
  // Runde ist ein starkes Kontrollwerkzeug, daher hoch bepreist (5 Mana,
  // rare) — auf demselben Preisniveau wie core.grasping-shadows.
  "core.tidereave-current": {
    id: "core.tidereave-current",
    name: "Flutraub-Strömung",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 3, tide: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUpkeep", whoseTurn: "own" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
        effects: [{ kind: "tapPermanent", what: { target: 0 } }],
        text: "Zu Beginn deines Bereitschaftssegments tappe eine Kreatur deiner Wahl, die dein Gegner kontrolliert.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Farbige, symmetrische allUnits-Stats-Variante — Gegenstück zu
  // core.warhorn-standard (Relic, farblos, allUnits +1/+0, 2 Mana): +1/+1
  // statt +1/+0, aber weiterhin symmetrisch (trifft auch den Gegner) und
  // daher nach derselben "-1 Mana gegenüber dem einseitigen Äquivalent"-
  // Logik bepreist wie core.iron-standard -> core.warhorn-standard: hier
  // core.wildgrowth-field (ownUnits +1/+1, wild, 3 Mana, rare) minus 1 =
  // 2 Mana. Eine Stufe schwächer eingestuft als wildgrowth-field (uncommon
  // statt rare), da die Symmetrie den Nettovorteil für den Controller
  // spürbar senkt (Wide-Board-Payoff, kein bedingungsloser Anthem, siehe
  // Balancing-Notiz zum bestehenden allUnits-Paar).
  "core.titanroot-canopy": {
    id: "core.titanroot-canopy",
    name: "Titanwurzel-Blätterdach",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, wild: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "allUnits" },
        modifier: { kind: "stats", power: 1, toughness: 1 },
        text: "Alle Kreaturen im Spiel erhalten +1/+1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Dritte Aura mit `grantKeyword` (nach core.emberclad-brand/core.
  // tidewarden-sigil) — verleiht `trample`, permanent solange die Aura
  // hält. Gegenstück zu core.rootbound-mark (Spell, wild, trample
  // permanent auf die Kreatur selbst, 3 Mana, unentfernbar außer über die
  // Kreatur) — die Aura-Variante ist günstiger (2 statt 3 Mana), dafür über
  // core.gravetide-obelisk-artige Enchantment-Entfernung angreifbar.
  "core.thornclad-ward": {
    id: "core.thornclad-ward",
    name: "Dorngewandeter Schutz",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, wild: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "trample" },
        text: "Die verzauberte Unit hat Trampelschaden.",
      },
    ],
    rulesText: "Trampelschaden (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Vierte Aura mit `grantKeyword` — verleiht `guardian`. Da die Aura vom
  // Controller freiwillig auf eine eigene Kreatur gelegt wird, ist die
  // "Zwangsblock"-Eigenschaft von guardian hier praktisch reiner Zusatznutzen
  // (man wählt ohnehin eine gute Blockerin als Ziel) — passend zu lights
  // defensiver Identität, gleicher Preis (2 Mana) wie die übrigen
  // Keyword-Auren.
  "core.sanctum-ward": {
    id: "core.sanctum-ward",
    name: "Heiligtums-Schutz",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, light: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "guardian" },
        text: "Die verzauberte Unit ist eine Wächterin.",
      },
    ],
    rulesText: "Wächter (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Fünfte und letzte Aura mit `grantKeyword` — verleiht `lifelink`.
  // Schließt voids Aura-Lücke (void hatte vor diesem Batch KEINE einzige
  // Aura im Pool, nur globale Enchantments, siehe Balancing-Notizen
  // "Batch 5"). Gleicher Preis (2 Mana) wie die übrigen Keyword-Auren.
  "core.soulbound-embrace": {
    id: "core.soulbound-embrace",
    name: "Seelengebundene Umarmung",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, void: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "lifelink" },
        text: "Die verzauberte Unit hat Lebensverbindung.",
      },
    ],
    rulesText: "Lebensverbindung (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Fünfte Curse-Aura, komplettiert das "Curse-Aura-Quartett" (siehe
  // core.ashbound-curse oben) — reine Power-Variante in void, passend zu
  // voids Gift-/Fäulnis-Thematik. Gleicher Gesamtwert (-3), gleicher Preis
  // (2 Mana) wie die drei anderen Curse-Auren. Zusammen mit core.
  // soulbound-embrace ist dies voids zweite Aura und schließt damit voids
  // vollständigen Aura-Fehlbestand.
  "core.hollowcurse-brand": {
    id: "core.hollowcurse-brand",
    name: "Hohlfluch-Brandmal",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, void: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "opponent" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: -3, toughness: 0 },
        text: "Die verzauberte Unit erhält -3/-0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 6 — Enchantments: farbige `costChange`-Gegenstücke (tide
  // ownSpells-1, void opponentSpells+1), zweites `onUnitDied`-Punisher-
  // Enchantment (flame, dealDamage), zwei farbige Gegenstücke zum
  // `grantKeyword`-`ownUnits`-Anthem (bisher nur farblos: core.skywatch-
  // lattice), eine sechste Keyword-Aura (`deathtouch`, void), sowie ein
  // neues `onUpkeep`/`onEndStep`-Effekt-Paar (drawCards/loseLife). Details
  // siehe Balancing-Notizen „Batch 6".
  // -----------------------------------------------------------------

  // Zweites `onUnitDied`-Punisher-Enchantment (nach core.witherplague-
  // shrine, void, loseLife) — hier mit `dealDamage` statt `loseLife`,
  // flame-typisch. Gleicher Preis/gleiche Rarity wie das void-Vorbild (3
  // Mana, rare), da beide Effekte in ihrer Breite/Häufigkeit identisch sind.
  "core.ashclaim-shrine": {
    id: "core.ashclaim-shrine",
    name: "Aschanspruch-Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, flame: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUnitDied", controller: "opponent" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 1 }],
        text: "Immer wenn eine Kreatur, die dein Gegner kontrolliert, stirbt, fügt der Aschanspruch-Schrein ihm 1 Schaden zu.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Farbige, günstigere Variante von core.forgeheart-crucible (Relic,
  // farblos, {4}, ownSpells -1) — dritte Farbe für diesen Preispunkt nach
  // core.cinderforge-charm (flame). Gleicher Preis/gleiche Rarity wie
  // cinderforge-charm (3 Mana, rare).
  "core.tidecraft-charm": {
    id: "core.tidecraft-charm",
    name: "Flutwerk-Amulett",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, tide: 1 },
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

  // Farbiges Gegenstück zu core.skywatch-lattice (Relic, farblos, {3},
  // `grantKeyword` reach scope:ownUnits) — dieselbe „farbig&billiger vs.
  // farblos&teurer"-Logik wie beim bestehenden ownUnits-Stats-Paar (core.
  // iron-standard vs. core.wildgrowth-field), hier mit `vigilant` statt
  // `reach` (wilds Signatur-Tempo-Keyword), passend zu wilds Wachstums-/
  // Board-Identität. {1}{Wild} statt {3} generisch (2 statt 3 Mana),
  // uncommon wie das Vorbild.
  "core.wildroot-banner": {
    id: "core.wildroot-banner",
    name: "Wildwurzel-Banner",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, wild: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "vigilant" },
        text: "Units, die du kontrollierst, sind wachsam.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweites farbiges Gegenstück zu core.skywatch-lattice — hier mit `reach`
  // selbst (identischer Keyword-Grant, andere Farbe), passend zu lights
  // defensiver Identität. Gleicher Preis/gleiche Rarity wie core.wildroot-
  // banner (2 Mana, uncommon); bildet zusammen mit dem farblosen Original
  // ein vollständiges farblos/farbig-Paar für diesen Anthem-Typ.
  "core.sunwatch-canopy": {
    id: "core.sunwatch-canopy",
    name: "Sonnenwacht-Blätterdach",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, light: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "reach" },
        text: "Units, die du kontrollierst, haben Reichweite.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste Nutzung von `onUpkeep` kombiniert mit `drawCards` im Pool (bisher
  // nur gainLife/dealDamage: core.dawnrise-sanctuary/core.ashborn-brand) —
  // ein unbedingtes, wiederkehrendes Kartenzieh-Werkzeug ohne laufende
  // Zusatzkosten. Stärkste/teuerste Karte des Batches (5 Mana), auf
  // demselben Preisniveau wie core.grasping-shadows/core.tidereave-current
  // eingestuft: repetitiver, unbeantwortbarer Kartenvorteil über ein langes
  // Spiel ist strukturell mindestens ebenso stark wie diese beiden
  // etablierten Top-Rares.
  "core.dawnwell-archive": {
    id: "core.dawnwell-archive",
    name: "Morgenquell-Archiv",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 3, light: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUpkeep", whoseTurn: "own" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Zu Beginn deines Bereitschaftssegments ziehe eine Karte.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Farbige, günstigere Variante von core.leaden-toll (Relic, farblos, {4},
  // opponentSpells +1) — dieselbe Logik wie core.tariff-spire vs. core.
  // forgeheart-crucible, hier auf void statt tide angewendet. Gleicher
  // Preis/gleiche Rarity wie core.tariff-spire (3 Mana, rare).
  "core.voidtoll-shrine": {
    id: "core.voidtoll-shrine",
    name: "Leerenzoll-Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, void: 1 },
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

  // Sechste Aura mit `grantKeyword` (nach core.emberclad-brand/core.
  // tidewarden-sigil/core.thornclad-ward/core.sanctum-ward/core.soulbound-
  // embrace) — erste mit `deathtouch`, passend zu voids Gift-/Fäulnis-
  // Signaturkeyword. Gleicher Preis wie die übrigen Keyword-Auren (2 Mana);
  // uncommon wie alle fünf Vorbilder trotz des potenten Keywords, da die
  // Aura an ein eigenes, angreifbares Anlege-Objekt gebunden bleibt.
  "core.witherfang-veil": {
    id: "core.witherfang-veil",
    name: "Fäulzahn-Schleier",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, void: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "deathtouch" },
        text: "Die verzauberte Unit hat Todesberührung.",
      },
    ],
    rulesText: "Todesberührung (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Neue Trigger/Effekt-Kombination: `onEndStep` + `loseLife` (bisher
  // feuerte onEndStep nur mit discardCards/addCounters: core.grasping-
  // shadows/core.wildseed-grove). Unbedingter, wiederkehrender Lebens­
  // verlust beim Gegner — Gegenstück im Timing zu core.ashborn-brand
  // (onUpkeep + dealDamage, flame, 3 Mana, rare): gleiche Kosten/Rarity, da
  // `loseLife` denselben "verkürzt die Partie aktiv"-Charakter hat wie
  // `dealDamage` (siehe Balancing-Notiz core.hexbind-lash) und `onEndStep`
  // ebenso zuverlässig wie `onUpkeep` einmal pro eigenem Zug feuert.
  "core.hollowdusk-shrine": {
    id: "core.hollowdusk-shrine",
    name: "Hohldämmerungs-Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, void: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEndStep", whoseTurn: "own" },
        effects: [{ kind: "loseLife", who: "opponent", amount: 1 }],
        text: "Zu Beginn deines Endsegments verliert dein Gegner 1 Leben.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 7 — Enchantments: liberale Wiederverwendung bewährter Bausteine
  // (eine siebte Keyword-Aura mit neuem Keyword, ein weiterer farbiger
  // ownUnits-Keyword-Anthem, ein erster ownUnits-Keyword-Anthem mit
  // firstStrike, ein Trigger-Swap onUpkeep->onEndStep, ein neues
  // onUnitDied-Effekt-Paar, ein weiterer allUnits-Debuff). Details siehe
  // Balancing-Notizen „Batch 7".
  // -----------------------------------------------------------------

  // Siebte Aura mit `grantKeyword` (nach firstStrike/vigilant/trample/
  // guardian/lifelink/deathtouch) — erste mit `swift`. Gleicher Preis/
  // gleiche Rarity wie die übrigen sechs Keyword-Auren (2 Mana, uncommon).
  "core.cinderbound-mark": {
    id: "core.cinderbound-mark",
    name: "Aschgebundenes Mal",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, flame: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "grantKeyword", keyword: "swift" },
        text: "Die verzauberte Unit hat Eile.",
      },
    ],
    rulesText: "Eile (durch die Aura verliehen).",
    rarity: "uncommon",
    set: "core",
  },

  // Neue Trigger/Effekt-Kombination: `onUnitDied` (controller: "own") mit
  // `drawCards` statt `gainLife`/`createToken` (bisher core.sanctified-
  // remains/light/gainLife, core.verdant-return/wild/createToken) — wandelt
  // eigene Verluste dauerhaft in Kartenvorteil um. Preislich/rarity-mäßig
  // auf demselben Niveau wie core.verdant-return eingestuft (4 Mana, rare),
  // da Kartenvorteil strukturell mindestens ebenso wertvoll ist wie ein
  // Ersatzkörper.
  "core.tidebound-elegy": {
    id: "core.tidebound-elegy",
    name: "Flutgebundene Klage",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, tide: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUnitDied", controller: "own" },
        effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        text: "Immer wenn eine Kreatur, die du kontrollierst, stirbt, ziehe eine Karte.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Dritte farbige `grantKeyword`-`ownUnits`-Anthem-Enchantment (nach core.
  // wildroot-banner/wild/vigilant, core.sunwatch-canopy/light/reach) —
  // zweiter wild-Vertreter dieser Kombination, hier mit `reach` statt
  // `vigilant`. Gleicher Preis/gleiche Rarity wie die beiden Vorbilder (2
  // Mana, uncommon).
  "core.thornreach-standard": {
    id: "core.thornreach-standard",
    name: "Dorngriff-Feldzeichen",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, wild: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "reach" },
        text: "Units, die du kontrollierst, haben Reichweite.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Erste `grantKeyword`-`ownUnits`-Anthem-Kombination mit `firstStrike`
  // (bisher nur reach/vigilant bei dieser Kombination, siehe core.
  // skywatch-lattice/core.wildroot-banner/core.sunwatch-canopy/core.
  // thornreach-standard) — ein board-weiter Erststurm-Grant ist strukturell
  // stärker als die bisherigen, eher defensiven Keywords (reach/vigilant),
  // da er direkt Kampfmathematik zugunsten des Controllers verschiebt,
  // daher teurer (4 statt 2 Mana) und rare statt uncommon.
  "core.dawnward-standard": {
    id: "core.dawnward-standard",
    name: "Morgenwacht-Feldzeichen",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, light: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "firstStrike" },
        text: "Units, die du kontrollierst, haben Erststurm.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Trigger-Swap `onEndStep` statt `onUpkeep` (bisher core.dawnrise-
  // sanctuary, light, onUpkeep+gainLife 1, 2 Mana, uncommon) — identischer
  // Effekt/Preis/Rarity, nur anderes Timing (eigenes Endsegment statt
  // eigenes Bereitschaftssegment), analog zum bereits etablierten Swap
  // core.ashborn-brand/core.hollowdusk-shrine (onUpkeep vs. onEndStep +
  // dealDamage/loseLife).
  "core.duskglow-ward": {
    id: "core.duskglow-ward",
    name: "Dämmerglut-Schutz",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, light: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onEndStep", whoseTurn: "own" },
        effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
        text: "Zu Beginn deines Endsegments gewinnst du 1 Leben.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Dritte scope:allUnits-Karte insgesamt (nach core.warhorn-standard,
  // Relic, +1/+0, und core.titanroot-canopy, Enchantment, wild, +1/+1) —
  // erste Nutzung in void, reiner Power-Debuff (-1/-0) statt Buff.
  // Symmetrisch (trifft beide Spieler), daher wie die bestehenden
  // allUnits-Karten moderat bepreist (2 Mana) und uncommon statt rare.
  "core.entropic-hollow": {
    id: "core.entropic-hollow",
    name: "Entropische Leere",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, void: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "allUnits" },
        modifier: { kind: "stats", power: -1, toughness: 0 },
        text: "Alle Kreaturen im Spiel erhalten -1/-0.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 8 — Enchantments: zweites Nicht-Unit-`onDeath{self}`-Beispiel
  // (Enchantment statt Relic, void) sowie liberale Wiederverwendung
  // weiterer bewährter Bausteine. Details siehe Balancing-Notizen
  // „Batch 8".
  // -----------------------------------------------------------------

  // Vierte "reine Stats"-Aura im Set (nach core.blessing-of-
  // steadfastness +1/+2, core.mantle-of-thorns +2/+1, core.brand-of-
  // fury +3/+0, alle Gesamtwert 3 für 2 Mana) — erste mit Gesamtwert 4
  // für 3 Mana (dieselbe "+1 Mana pro +1 Gesamtwert"-Rate).
  "core.cinderwrath-mantle": {
    id: "core.cinderwrath-mantle",
    name: "Aschzorn-Mantel",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 2, flame: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 3, toughness: 1 },
        text: "Die verzauberte Unit erhält +3/+1.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite `grantKeyword`-`ownUnits`-Anthem-Kombination mit
  // `firstStrike` (nach core.dawnward-standard, light, 4 Mana, rare) —
  // identischer Preis/identische Rarity wie das Vorbild, andere Farbe.
  "core.tidalguard-standard": {
    id: "core.tidalguard-standard",
    name: "Flutwacht-Feldzeichen",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, tide: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "firstStrike" },
        text: "Units, die du kontrollierst, haben Erststurm.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Trigger-Swap `onUpkeep` statt `onEndStep` für die `addCounters`-
  // Engine (bisher nur core.wildseed-grove, onEndStep, 4 Mana, rare) —
  // identischer Effekt/Preis/Rarity, nur anderes Timing, analog zu den
  // bereits etablierten onUpkeep/onEndStep-Swaps (core.dawnrise-
  // sanctuary/core.duskglow-ward, core.ashborn-brand/core.hollowdusk-
  // shrine).
  "core.rootwake-shrine": {
    id: "core.rootwake-shrine",
    name: "Wurzelweck-Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, wild: 2 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onUpkeep", whoseTurn: "own" },
        targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
        effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
        text: "Zu Beginn deines Bereitschaftssegments lege einen +1/+1-Marker auf eine Kreatur deiner Wahl, die du kontrollierst.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Neue Trigger/Effekt-Kombination: `onSpellCast` (caster: "own") mit
  // `gainLife` statt Schaden/scry (bisher core.warding-thorns/wild/
  // dealDamage bei GEGNERISCHEM Cast, core.tidebound-archive/tide/scry
  // bei EIGENEM Cast) — feuert bei JEDER selbst gecasteten
  // nicht-Terrain-Karte, nicht nur bei Spells. Bewusst niedrig
  // bepreist/common wie core.tidebound-archive, da der Einzelwert pro
  // Auslösung (1 Leben) gering ist.
  "core.dawncast-shrine": {
    id: "core.dawncast-shrine",
    name: "Morgenzauber-Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, light: 1 },
    abilities: [
      {
        kind: "triggered",
        trigger: { kind: "onSpellCast", caster: "own" },
        effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
        text: "Immer wenn du eine Karte spielst, gewinnst du 1 Leben.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Erste "positive" Stats-Aura in void (bisher nur Curse-Auren mit
  // negativen Werten: core.hollowcurse-brand, und Keyword-Auren: core.
  // soulbound-embrace/core.witherfang-veil) — Gesamtwert 4 für 3 Mana,
  // dieselbe Preisrate wie core.cinderwrath-mantle (flame, oben).
  "core.hollowvein-mantle": {
    id: "core.hollowvein-mantle",
    name: "Hohlader-Mantel",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 2, void: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 2, toughness: 2 },
        text: "Die verzauberte Unit erhält +2/+2.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweites Nicht-Unit-`onDeath{self}`-Beispiel im Pool (nach core.
  // duskbound-cairn, Relic) — hier auf einer Enchantment: kombiniert
  // einen kleinen laufenden ownUnits-Anthem MIT einem Schadens-Payoff,
  // falls das Enchantment selbst stirbt. Bisher war core.gravetide-
  // obelisk die einzige Karte im Set, die gezielt gegnerische Relics/
  // Enchantments/Terrains zerstören kann — genau dieser (bisher
  // folgenlose) Angriffsvektor wird mit diesem Enchantment erstmals
  // "bestraft": Zerstört der Gegner diesen Schrein darüber, erhält er
  // 2 Schaden zurück; würde der Controller ihn selbst opfern können
  // (aktuell keine Pool-Karte kann eigene Enchantments opfern, aber die
  // Regel gilt typ-agnostisch, 9.15), feuerte derselbe Trigger ebenso.
  // Bewusst moderat bepreist (3 Mana, uncommon) — der laufende Anthem
  // allein wäre einen Tick billiger (vgl. core.wardstone-idol, Relic,
  // 2 Mana, +0/+1 ownUnits), der Aufpreis ist die Entfernungs-
  // "Versicherung".
  "core.gravebound-shrine": {
    id: "core.gravebound-shrine",
    name: "Grabgebundener Schrein",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, void: 1 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "stats", power: 0, toughness: 1 },
        text: "Units, die du kontrollierst, erhalten +0/+1.",
      },
      {
        kind: "triggered",
        trigger: { kind: "onDeath", what: "self" },
        effects: [{ kind: "dealDamage", to: "opponent", amount: 2 }],
        text: "Wenn der Grabgebundene Schrein stirbt, füge deinem Gegner 2 Schaden zu.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // -----------------------------------------------------------------
  // Batch 9 (v0.12, Abschlussbatch) — Enchantments: liberale
  // Wiederverwendung bewährter Bausteine. Details siehe „Batch 9" in
  // docs/cards/starter-set.md.
  // -----------------------------------------------------------------

  // Zweite Buff-Aura in flame (nach core.brand-of-fury, +3/+0, uncommon)
  // — hier mit demselben Gesamtwert (3) wie core.mantle-of-thorns (wild)
  // und core.blessing-of-steadfastness (light), nur in flame umgesetzt:
  // reine Farb-Zweitkopie desselben etablierten Preispunkts (2 Mana,
  // common).
  "core.ashbound-brazier": {
    id: "core.ashbound-brazier",
    name: "Aschgebundene Feuerschale",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, flame: 1 },
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

  // Zweite reine Toughness-Aura im Set (nach core.blessing-of-
  // steadfastness +1/+2) — hier ohne Power-Anteil, ausschließlich
  // Zähigkeit (+0/+2), passend zu tides defensiver Identität.
  "core.tidewash-veil": {
    id: "core.tidewash-veil",
    name: "Flutschleier",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, tide: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 0, toughness: 2 },
        text: "Die verzauberte Unit erhält +0/+2.",
      },
    ],
    rarity: "common",
    set: "core",
  },

  // Zweite +2/+2-Kombi-Aura im Set (nach core.hollowvein-mantle, void) —
  // identischer Preis/identischer Effekt, hier in wild statt void, passend
  // zu wilds Wachstums-/Statbonus-Identität.
  "core.bramblecoat-mantle": {
    id: "core.bramblecoat-mantle",
    name: "Dornmantel-Umhang",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 2, wild: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 2, toughness: 2 },
        text: "Die verzauberte Unit erhält +2/+2.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite Kopie von core.dawnrise-sanctuary (light, onUpkeep+gainLife 1,
  // 2 Mana, uncommon) in einer neuen Farbe — identischer Effekt/
  // identischer Preis, gleiche Rarity, reine Farb-Zweitkopie.
  "core.mossheart-grove": {
    id: "core.mossheart-grove",
    name: "Moosherz-Hain",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 1, wild: 1 },
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

  // Dritte +2/+2-Kombi-Aura im Set (nach core.hollowvein-mantle/void,
  // core.bramblecoat-mantle/wild) — identischer Preis/identischer
  // Effekt, hier in light als dritte Farbe dieses Musters.
  "core.sunveil-mantle": {
    id: "core.sunveil-mantle",
    name: "Sonnenschleier-Mantel",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 2, light: 1 },
    auraTarget: { kind: "permanent", cardTypes: ["unit"], controller: "own" },
    abilities: [
      {
        kind: "static",
        scope: { kind: "attachedTo" },
        modifier: { kind: "stats", power: 2, toughness: 2 },
        text: "Die verzauberte Unit erhält +2/+2.",
      },
    ],
    rarity: "uncommon",
    set: "core",
  },

  // Zweite farbige `grantKeyword`-`ownUnits`-Anthem-Enchantment mit
  // einem starken, nicht-Kampf-Keyword: nach core.dawnward-standard/
  // core.tidalguard-standard (beide `firstStrike`, `rare`) hier erstmals
  // `lifelink` board-weit — potenziell noch swingier (kompletter
  // Lebens-Swing über das ganze Board statt nur Kampfmathematik), daher
  // auf demselben Preis-/Rarity-Niveau (4 Mana, `rare`) wie die beiden
  // firstStrike-Vorbilder.
  "core.dawnhaven-covenant": {
    id: "core.dawnhaven-covenant",
    name: "Morgenhort-Bund",
    type: "enchantment",
    enchantKind: "global",
    cost: { generic: 2, light: 2 },
    abilities: [
      {
        kind: "static",
        scope: { kind: "ownUnits" },
        modifier: { kind: "grantKeyword", keyword: "lifelink" },
        text: "Units, die du kontrollierst, haben Lebensverbindung.",
      },
    ],
    rarity: "rare",
    set: "core",
  },

  // Vierte Curse-Aura im Set (nach core.rootrot-curse -1/-2 wild, core.
  // riptide-shackles -2/-1 tide, core.ashbound-curse -0/-3 flame) —
  // identischer Gesamtwert (-3), hier in void als vierte Farbe dieses
  // Musters (identischer Split wie das wild-Vorbild), gleicher Preis/
  // gleiche Rarity (2 Mana, uncommon).
  "core.hollowbind-curse": {
    id: "core.hollowbind-curse",
    name: "Hohlbann-Fluch",
    type: "enchantment",
    enchantKind: "aura",
    cost: { generic: 1, void: 1 },
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
};

export default starterSet;
