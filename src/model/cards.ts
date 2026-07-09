/**
 * Kartendatenmodell: statische Kartendefinitionen ("Druckbild" der Karte).
 *
 * Eine CardDefinition beschreibt die Karte, wie sie im Kartenpool existiert —
 * unveränderlich und JSON-serialisierbar. Der veränderliche Laufzeitzustand
 * (getappt, Marken, markierter Schaden, Zone, ...) lebt getrennt davon in
 * src/model/game-state.ts (CardInstance / PermanentState).
 *
 * Regelsemantik der Kartentypen: docs/rules-engine.md Abschnitt 1 und 2.
 */

import type { Ability, ManaCost, TargetSpec, Effect } from "./abilities";

// ---------------------------------------------------------------------------
// Kartentypen
// ---------------------------------------------------------------------------

/**
 * Die sechs Kartentypen (MTG-Vorbild in Klammern):
 * - unit        (Creature)   Permanent mit Power/Toughness, kämpft
 * - spell       (Instant/Sorcery, je nach speed) Einmaleffekt, nie Permanent
 * - relic       (Artifact)   Permanent, farblose Werkzeuge
 * - enchantment (Enchantment/Aura) Permanent; subtype "aura" wird angelegt
 * - terrain     (Land)       Manaquelle, geht nicht über den Stack, 1x/Zug
 */
export type CardType =
  | "unit"
  | "spell"
  | "relic"
  | "enchantment"
  | "terrain";

/** Instant- vs. Sorcery-Timing für Spells (rules-engine.md 2, Main Steps). */
export type SpellSpeed = "fast" | "slow";

/**
 * Freie thematische Untertypen (z.B. "Drache", "Golem", "Wald").
 * Regeln referenzieren Subtypen nur über Effekt-/Trigger-Filter (spätere
 * DSL-Erweiterung); v0.1 sind sie primär Flavor + Deckbau-Filter.
 */
export type Subtype = string;

// ---------------------------------------------------------------------------
// Typ-spezifische Anteile (Discriminated Union über "type")
// ---------------------------------------------------------------------------

/** Für alle Kartentypen identische Felder. */
export interface CardDefinitionBase {
  /** Eindeutige, stabile ID im Kartenpool, z.B. "core.emberling". Format: <set>.<slug> */
  id: string;
  /** Anzeigename (vom Card-Designer, eigene Namen — keine MTG-Kopien). */
  name: string;
  subtypes?: Subtype[];
  /**
   * Regeltext für die Anzeige. Maßgeblich für die Engine sind ausschließlich
   * abilities/effects — der Text ist redundante, menschenlesbare Beschreibung.
   */
  rulesText?: string;
  /** Flavor-Text ohne Regelwirkung. */
  flavorText?: string;
  /** Tokens existieren nur auf dem Battlefield (SBA 7) und stecken in keinem Deck. */
  isToken?: boolean;
  /** Set-/Pool-Zuordnung für den Card-Designer. */
  set?: string;
  rarity?: "common" | "uncommon" | "rare" | "mythic";
}

export interface UnitCard extends CardDefinitionBase {
  type: "unit";
  cost: ManaCost;
  power: number;
  toughness: number;
  abilities?: Ability[];
}

export interface SpellCard extends CardDefinitionBase {
  type: "spell";
  cost: ManaCost;
  speed: SpellSpeed;
  /** Zielslots; Effekte referenzieren sie über { target: index }. */
  targets?: TargetSpec[];
  /** Wird bei Resolution in Reihenfolge ausgeführt, danach Karte -> Graveyard. */
  effects: Effect[];
}

export interface RelicCard extends CardDefinitionBase {
  type: "relic";
  cost: ManaCost;
  abilities?: Ability[];
}

export interface EnchantmentCard extends CardDefinitionBase {
  type: "enchantment";
  cost: ManaCost;
  /**
   * "global": steht frei auf dem Battlefield.
   * "aura":   braucht beim Casten ein Ziel (auraTarget) und liegt danach an
   *           diesem Objekt an (PermanentState.attachedTo). Verliert es sein
   *           Objekt, greift SBA 5 (Graveyard).
   */
  enchantKind: "global" | "aura";
  /**
   * Pflicht bei enchantKind "aura": woran die Aura angelegt werden darf.
   *
   * Geklärt (Architect, v0.1): Eine Aura hat genau EIN Anlege-Objekt.
   * `auraTarget` ist die Zielwahl beim Casten (wie ein einzelner Zielslot);
   * nach Resolution zeigt PermanentState.attachedTo der Aura auf dieses
   * Objekt. ALLE Fähigkeiten der Aura mit scope { kind: "attachedTo" }
   * beziehen sich implizit auf dasselbe, eine attachedTo-Objekt — Auren mit
   * mehreren Fähigkeiten und unterschiedlichen Anlege-Bezügen gibt es nicht.
   */
  auraTarget?: TargetSpec;
  abilities?: Ability[];
}

export interface TerrainCard extends CardDefinitionBase {
  type: "terrain";
  /**
   * Terrains kosten nichts und gehen nicht über den Stack.
   * Ihre Manaproduktion ist eine aktivierte Mana-Fähigkeit
   * (isManaAbility: true, Kosten: tap) in abilities.
   */
  abilities: Ability[];
  /** true = kommt getappt ins Spiel (für Dual-Terrain-Balancing). */
  entersTapped?: boolean;
}

/** Eine Karte im Kartenpool. Discriminated Union über `type`. */
export type CardDefinition =
  | UnitCard
  | SpellCard
  | RelicCard
  | EnchantmentCard
  | TerrainCard;

// ---------------------------------------------------------------------------
// Kartenpool & Decks
// ---------------------------------------------------------------------------

/** Der gesamte verfügbare Kartenpool, Schlüssel = CardDefinition.id. */
export type CardPool = Record<string, CardDefinition>;

/** Deckliste: nur Referenzen auf Definition-IDs, dadurch trivial serialisierbar. */
export interface Decklist {
  name: string;
  /** definitionId -> Anzahl. v0.1-Deckbauregeln: min. 40 Karten, max. 4 pro id (Terrains unbegrenzt). */
  cards: Record<string, number>;
}
