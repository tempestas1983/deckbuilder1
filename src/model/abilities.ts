/**
 * Effekt- und Fähigkeiten-DSL (Daten-Repräsentation, keine Logik).
 *
 * Design-Entscheidung 9.4 in docs/rules-engine.md: Fähigkeiten sind reine,
 * JSON-serialisierbare Daten (Discriminated Unions). Die Engine interpretiert
 * die Primitive; Card-Designer kombiniert sie, ohne Engine-Code anzufassen.
 *
 * Erweiterungen der DSL (neue Effect-/Trigger-Varianten) gehen über den
 * Game-Architect, damit Regelwerk und Engine konsistent bleiben.
 */

// ---------------------------------------------------------------------------
// Ressourcen / Kosten
// ---------------------------------------------------------------------------

/** Die fünf Manafarben des Spiels. */
export type ManaColor = "flame" | "tide" | "wild" | "light" | "void";

/**
 * Manakosten. `generic` ist mit beliebigem Mana bezahlbar,
 * Farbeinträge nur mit Mana der jeweiligen Farbe.
 * Beispiel { generic: 2, flame: 1 } entspricht "2R" in MTG-Notation.
 */
export interface ManaCost {
  generic?: number;
  flame?: number;
  tide?: number;
  wild?: number;
  light?: number;
  void?: number;
  /**
   * X-Kosten. Geklärt (rules-engine.md 4): X wird beim Casten gewählt —
   * Reihenfolge: ankündigen -> X wählen (>= 0) -> Ziele wählen -> bezahlen.
   * X wird als `chosenX` am Stack-Objekt gespeichert; `Amount { kind: "x" }`
   * liest es bei Resolution. v0.1: nur auf Spells erlaubt, NICHT auf
   * aktivierten Fähigkeiten (activateAbility hat kein chosenX-Feld).
   */
  x?: boolean;
}

/**
 * Nicht-Mana-Kosten für aktivierte Fähigkeiten.
 * `tap` = Quelle tappen (Units mit Summoning Sickness können das nicht).
 */
export type AdditionalCost =
  | { kind: "tap" }
  | { kind: "sacrificeSelf" }
  | { kind: "payLife"; amount: number }
  | { kind: "discardCards"; count: number }
  | { kind: "removeCounters"; counterType: string; count: number };

// ---------------------------------------------------------------------------
// Mengen (statisch oder dynamisch)
// ---------------------------------------------------------------------------

/**
 * Zahlwert in Effekten. Entweder fix, oder zur Resolution-Zeit berechnet.
 */
export type Amount =
  | number
  | { kind: "x" } // das beim Casten gewählte X
  | {
      kind: "count";
      /** Was gezählt wird, aus Sicht des Controllers der Fähigkeit. */
      what:
        | "ownUnits"
        | "opponentUnits"
        | "ownCardsInHand"
        | "ownCardsInGraveyard"
        | "countersOnSelf";
      /** Nur für what = "countersOnSelf": welcher Marken-Typ. */
      counterType?: string;
    };

// ---------------------------------------------------------------------------
// Targeting
// ---------------------------------------------------------------------------

/** Wessen Objekte/Spieler als Ziel infrage kommen (aus Controller-Sicht). */
export type ControllerFilter = "any" | "own" | "opponent";

/**
 * Beschreibung EINES Zielslots. Karten/Fähigkeiten können mehrere Slots haben
 * (targets: TargetSpec[]); Effekte referenzieren Slots per Index.
 * Ziele werden beim Auf-den-Stack-Legen gewählt und bei Resolution
 * erneut geprüft (Fizzle-Regel, siehe docs/rules-engine.md Abschnitt 4).
 *
 * Bestätigt (Architect, v0.1): Fähigkeiten/Spells GANZ OHNE targets-Array
 * sind ein regulärer, dauerhaft unterstützter Fall — Effekte verwenden dann
 * ausschließlich fixe EffectRecipient-Werte ("self"/"controller"/"opponent"/
 * "eachOpponent"/"eventSubject"). Die Engine darf für solche Objekte keine
 * Zielwahl oder Ziel-Validierung verlangen; die Fizzle-Regel greift dort
 * nicht (keine Ziele = kann nicht mangels legaler Ziele fizzeln).
 */
export type TargetSpec =
  | {
      kind: "permanent";
      /** Zulässige Kartentypen; leer/undefined = alle Permanents. */
      cardTypes?: Array<"unit" | "relic" | "enchantment" | "terrain">;
      controller?: ControllerFilter;
      /** Optionale Zusatzfilter. */
      mustBeTapped?: boolean;
      mustBeAttacking?: boolean;
    }
  | { kind: "player"; controller?: ControllerFilter }
  | {
      /** Unit ODER Spieler ("any target" in MTG-Sprache). */
      kind: "unitOrPlayer";
      controller?: ControllerFilter;
    }
  | {
      /** Ein Objekt auf dem Stack (für Counterspell-Effekte). */
      kind: "stackObject";
      /** Nur Spells, nur Fähigkeiten, oder beides. */
      objectKind?: "spell" | "ability" | "any";
    };

/**
 * Referenz auf den Empfänger eines Effekts.
 * - "self": die Quelle der Fähigkeit (das Permanent / der resolvende Spell)
 * - "controller"/"opponent": Spieler relativ zum Controller
 * - { target: n }: das im Zielslot n gewählte Ziel
 * - "eventSubject": das Objekt, das den Trigger ausgelöst hat
 *   (z.B. die gestorbene Unit bei onUnitDied) — nur in Triggered Abilities gültig.
 */
export type EffectRecipient =
  | "self"
  | "controller"
  | "opponent"
  | "eachOpponent"
  | "eventSubject"
  | { target: number };

// ---------------------------------------------------------------------------
// Effekt-Primitive
// ---------------------------------------------------------------------------

/** Stat-Modifikation, z.B. +2/+2 bis Zugende. */
export interface StatModifier {
  power: number;
  toughness: number;
}

/**
 * Atomare, von der Engine interpretierte Effekte.
 * Ein Spell / eine Fähigkeit trägt eine Liste `Effect[]`, die bei Resolution
 * in Reihenfolge ausgeführt wird.
 */
export type Effect =
  | { kind: "dealDamage"; to: EffectRecipient; amount: Amount }
  | { kind: "gainLife"; who: EffectRecipient; amount: Amount }
  | { kind: "loseLife"; who: EffectRecipient; amount: Amount }
  | { kind: "drawCards"; who: EffectRecipient; count: Amount }
  | { kind: "discardCards"; who: EffectRecipient; count: Amount; random?: boolean }
  | { kind: "destroyPermanent"; what: EffectRecipient }
  | { kind: "returnToHand"; what: EffectRecipient }
  | { kind: "exilePermanent"; what: EffectRecipient }
  | { kind: "tapPermanent"; what: EffectRecipient }
  | { kind: "untapPermanent"; what: EffectRecipient }
  | { kind: "counterStackObject"; what: EffectRecipient }
  | {
      kind: "modifyStats";
      what: EffectRecipient;
      modifier: StatModifier;
      duration: "endOfTurn" | "permanent";
    }
  | {
      kind: "grantKeyword";
      what: EffectRecipient;
      keyword: Keyword;
      duration: "endOfTurn" | "permanent";
    }
  | { kind: "addCounters"; what: EffectRecipient; counterType: string; count: Amount }
  | { kind: "removeCounters"; what: EffectRecipient; counterType: string; count: Amount }
  | { kind: "addMana"; color: ManaColor | "any"; amount: Amount }
  | {
      kind: "createToken";
      who: EffectRecipient;
      /** Referenz auf eine CardDefinition mit isToken=true. */
      tokenDefinitionId: string;
      count: Amount;
    }
  | {
      /** Oberste N Karten der eigenen Library ansehen/ordnen — bewusst simpel. */
      kind: "scry";
      who: EffectRecipient;
      count: Amount;
    };

// ---------------------------------------------------------------------------
// Keywords (statische Kurz-Fähigkeiten)
// ---------------------------------------------------------------------------

/**
 * Fest definierte Schlüsselwort-Fähigkeiten. Semantik in docs/rules-engine.md.
 * - swift:     darf im Ankunftszug angreifen/Tap-Fähigkeiten nutzen (Haste-Analog)
 * - airborne:  nur von airborne/reach blockbar (Flying-Analog)
 * - reach:     darf airborne blocken
 * - vigilant:  tappt beim Angreifen nicht (Vigilance-Analog)
 * - lifelink:  Schaden dieser Unit gibt dem Controller Leben
 * - guardian:  "stellt sich schützend in den Weg". FINALE Regel v0.1
 *              (rules-engine.md Abschnitt 6): Jede ungetappte guardian-Unit,
 *              die der VERTEIDIGENDE Spieler zum Zeitpunkt der
 *              Blocker-Deklaration kontrolliert, muss einem Angreifer als
 *              Blocker zugeordnet werden, sofern für sie mindestens ein
 *              legaler Block existiert. Pflicht gilt pro guardian-Unit;
 *              welchen Angreifer sie blockt, wählt der Verteidiger frei
 *              (unter Beachtung von Evasion). Vorher getappt = keine Pflicht;
 *              nachträgliches Tappen entfernt einen deklarierten Block nicht.
 *              Im Angriff wirkungslos. Enforcement: declareBlockers-Validierung.
 */
export type Keyword =
  | "swift"
  | "airborne"
  | "reach"
  | "vigilant"
  | "lifelink"
  | "guardian";

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

/**
 * Wann eine Triggered Ability feuert. "self" bezieht sich auf die Quelle.
 * Ablauf (Pending-Queue → Stack, APNAP): docs/rules-engine.md Abschnitt 5.
 */
export type TriggerCondition =
  | { kind: "onEnterBattlefield"; what: "self" }
  | { kind: "onDeath"; what: "self" }
  | { kind: "onUnitDied"; controller: ControllerFilter } // eine (fremde/eigene) Unit stirbt
  | { kind: "onUpkeep"; whoseTurn: "own" | "any" }
  | { kind: "onEndStep"; whoseTurn: "own" | "any" }
  | { kind: "onAttackDeclared"; what: "self" }
  | { kind: "onBlockDeclared"; what: "self" }
  | { kind: "onDealtCombatDamageToPlayer"; what: "self" }
  | { kind: "onDamageReceived"; what: "self" }
  | { kind: "onSpellCast"; caster: ControllerFilter; spellSpeed?: "fast" | "slow" };

// ---------------------------------------------------------------------------
// Fähigkeiten
// ---------------------------------------------------------------------------

/** Getriggerte Fähigkeit: "Wenn X passiert, [Ziele wählen und] Effekte ausführen." */
export interface TriggeredAbility {
  kind: "triggered";
  trigger: TriggerCondition;
  targets?: TargetSpec[];
  effects: Effect[];
  /** Optionaler Anzeigetext; maßgeblich ist die Datenstruktur. */
  text?: string;
}

/** Aktivierte Fähigkeit: "[Kosten]: Effekte." Geht über den Stack (außer Mana-Fähigkeit). */
export interface ActivatedAbility {
  kind: "activated";
  manaCost?: ManaCost;
  additionalCosts?: AdditionalCost[];
  targets?: TargetSpec[];
  effects: Effect[];
  /**
   * true = reine Mana-Fähigkeit: resolvt sofort ohne Stack (rules-engine.md 4).
   * Engine validiert: dann keine targets und nur addMana-Effekte.
   */
  isManaAbility?: boolean;
  /** Nur im eigenen Zug bei leerem Stack aktivierbar (Sorcery-Speed). */
  slowOnly?: boolean;
  text?: string;
}

/**
 * Statische Fähigkeit: dauerhaft wirkender Modifikator, kein Stack.
 * Berechnungsreihenfolge: rules-engine.md 9.3 (kein Layer-System).
 */
export interface StaticAbility {
  kind: "static";
  /** Auf wen der Modifikator wirkt. */
  scope:
    | { kind: "self" }
    | { kind: "attachedTo" } // für Auren: das Objekt, an dem die Aura hängt
    | { kind: "ownUnits" }
    | { kind: "opponentUnits" }
    | { kind: "allUnits" };
  modifier:
    | { kind: "stats"; power: number; toughness: number }
    | { kind: "grantKeyword"; keyword: Keyword }
    | {
        kind: "costChange";
        /** Verteuert (+) oder verbilligt (-) generische Kosten von Spells. */
        appliesTo: "ownSpells" | "opponentSpells";
        genericDelta: number;
      };
  text?: string;
}

/** Schlüsselwort als eigenständiger Fähigkeitseintrag auf der Karte. */
export interface KeywordAbility {
  kind: "keyword";
  keyword: Keyword;
}

export type Ability =
  | TriggeredAbility
  | ActivatedAbility
  | StaticAbility
  | KeywordAbility;
