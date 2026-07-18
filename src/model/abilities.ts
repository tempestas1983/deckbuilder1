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
   * X-Kosten. Geklärt (rules-engine.md 4): X wird beim Casten/Aktivieren
   * gewählt — Reihenfolge: ankündigen -> Modus wählen (falls modal, v0.3) ->
   * X wählen (>= 0) -> Ziele wählen -> bezahlen. X wird als `chosenX` am
   * Stack-Objekt gespeichert; `Amount { kind: "x" }` liest es bei Resolution.
   * v0.3 (rules-engine.md 4, Entscheidung 9.12): erlaubt auf Spells UND
   * aktivierten Fähigkeiten (`activateAbility`/StackObject "activatedAbility"
   * haben ein chosenX-Feld). AUSNAHME: Mana-Fähigkeiten (isManaAbility)
   * dürfen KEINE X-Kosten haben — sie resolven ohne Stack und damit ohne
   * chosenX-Kontext; die Engine lehnt solche Definitionen ab.
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
 *
 * v0.3.2 (rules-engine.md 4/5 + Entscheidung 9.14) — "eventSubject" auf
 * Nicht-Permanents: Die Referenz bleibt auch bestehen, wenn das Objekt das
 * Battlefield schon verlassen hat (onUnitDied/onDeath: die Karte liegt beim
 * Resolven bereits im Graveyard; Token können komplett gelöscht sein, SBA 7).
 * Permanent-bezogene Effekte (dealDamage auf Permanents, destroyPermanent,
 * exilePermanent, returnToHand, tapPermanent, untapPermanent, modifyStats,
 * grantKeyword, addCounters, removeCounters) überspringen einen solchen
 * Nicht-Permanent-Empfänger STILL (kein Fehler, kein Event, KEINE
 * Ersatzwirkung in der neuen Zone — exilePermanent verbannt nie aus dem
 * Graveyard). Konsequenz fürs Kartendesign:
 * - onUnitDied/onDeath + permanent-bezogener Effekt auf "eventSubject" ist
 *   zulässig, aber GARANTIERT wirkungslos (Subjekt ist beim Resolven nie
 *   mehr Permanent) — bitte nicht bauen.
 * - onDamageReceived (eventSubject = Schadensquelle, kann noch leben) bleibt
 *   der tragende Anwendungsfall (Vergeltung, 9.10); tote Quelle → stiller
 *   Fizzle.
 * - "Verbanne die gestorbene Karte" (Removal-bei-Tod) braucht ein künftiges
 *   Graveyard-Primitiv (rules-engine.md 10), keine Zweckentfremdung von
 *   exilePermanent.
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
// Modal-Effekte ("wähle eines —", v0.3)
// ---------------------------------------------------------------------------

/**
 * EIN Modus eines modalen Spells / einer modalen Fähigkeit
 * (rules-engine.md 4, Entscheidung 9.13). Träger deklarieren
 * `modes: EffectMode[]` (mindestens 2 Einträge) STATT der flachen
 * targets/effects-Felder; der Spieler wählt bei Cast/Aktivierung/Stacken
 * genau EINEN Modus (`chosenMode` = Index in modes[]), dessen effects bei
 * Resolution ausgeführt werden.
 *
 * Regeln (verbindlich, Details rules-engine.md 4):
 * - Jeder Modus hat seine EIGENEN Zielslots; `chosenTargets` und die
 *   Fizzle-Prüfung beziehen sich ausschließlich auf die targets des
 *   gewählten Modus (Index = Slot innerhalb des Modus).
 * - Ein Modus ist nur wählbar, wenn jeder seiner Zielslots mindestens ein
 *   legales Ziel hat (Modi ohne targets sind immer wählbar). Ist KEIN Modus
 *   wählbar, ist der Spell nicht castbar / die Fähigkeit nicht aktivierbar /
 *   der Trigger verpufft beim Stacken.
 * - Der Modus wird bei Resolution NICHT neu gewählt oder erneut geprüft
 *   (nur seine Ziele, normale Fizzle-Regel) — MTG-konform.
 * - v0.3-Minimalversion: genau EIN Modus wird gewählt ("wähle eines");
 *   "wähle zwei"/konfigurierbare Anzahl ist bewusst vertagt (rules-engine.md 10).
 */
export interface EffectMode {
  /** Anzeigetext des Modus (Aufzählungspunkt hinter "Wähle eines —"). */
  text?: string;
  /** Zielslots NUR dieses Modus; Effekte referenzieren sie per { target: index }. */
  targets?: TargetSpec[];
  /** Wird bei Resolution in Reihenfolge ausgeführt, wenn dieser Modus gewählt wurde. */
  effects: Effect[];
}

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
 *
 * v0.2.3 (Kampf-Keyword-Paket, rules-engine.md 6d + 9.9; interne IDs bewusst
 * nah am MTG-Vorbild, Anzeigenamen darf der Card-Designer flavoren):
 * - trample:     (nur im Angriff) Überschuss-Kampfschaden über die letale
 *                Menge aller zugeordneten Blocker hinaus trifft den
 *                verteidigenden Spieler. Zuteilung deterministisch: exakt
 *                letale Menge pro Blocker (bei deathtouch: 1) in
 *                blockedBy-Reihenfolge, Rest zum Spieler. Sind alle Blocker
 *                entfernt, geht die GESAMTE Power an den Spieler (6b(2)).
 *                Auf Blockern wirkungslos.
 * - firstStrike: teilt Kampfschaden in der frühen Schadensrunde aus und in
 *                der regulären Runde NICHT mehr (kein Double-Strike-Analog).
 *                Kein eigener Step: interne zweite Runde innerhalb der
 *                Combat-Damage-Turn-Based-Action mit Zwischen-SBA-Durchlauf
 *                ohne Priority (rules-engine.md 6d(2)).
 * - deathtouch:  Jeder Schaden > 0 dieser Quelle gilt als letal — setzt
 *                PermanentState.deathtouchDamage (SBA 4) und senkt die
 *                "letale Menge" bei der Schadenszuteilung auf 1. Gilt für
 *                JEDEN Schaden der Quelle (auch dealDamage-Effekte einer
 *                deathtouch-Unit), nicht nur Kampfschaden. Schaden <= 0
 *                bleibt kein Schaden (6c) und setzt kein Flag.
 */
export type Keyword =
  | "swift"
  | "airborne"
  | "reach"
  | "vigilant"
  | "lifelink"
  | "guardian"
  | "trample"
  | "firstStrike"
  | "deathtouch";

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

/**
 * Wann eine Triggered Ability feuert. "self" bezieht sich auf die Quelle.
 * Ablauf (Pending-Queue → Stack, APNAP): docs/rules-engine.md Abschnitt 5.
 *
 * `onDamageReceived` (v0.3 verdrahtet, rules-engine.md 5 + Entscheidung 9.10;
 * war bis v0.2.4 nur reserviert):
 * - Feuert, wenn dieses Permanent Schaden > 0 erhält — Kampf- UND
 *   Effekt-Schaden, einmal PRO Schadensereignis (bei Mehrfachblock also
 *   einmal pro Schadensquelle, bei firstStrike pro Schadensrunde).
 * - Schaden <= 0 feuert nicht (6c). Letaler Schaden feuert: die Quelle
 *   stirbt erst danach in der SBA-Prüfung, der Trigger bleibt in der
 *   Pending-Queue und wird normal gestackt (MTG-analog). Ausnahme als
 *   dokumentierte Vereinfachung: Token-Quellen, deren Instanz SBA 7 vor dem
 *   Stacken löscht — dort verpufft der Trigger.
 * - `eventSubject` ist die SCHADENSQUELLE (nicht das getroffene Permanent
 *   selbst) — ermöglicht Vergeltungs-Designs via EffectRecipient
 *   "eventSubject". Abweichung von den übrigen Self-Combat-Triggern
 *   (dort eventSubject = self) ist beabsichtigt.
 * - `what: "self"` betrifft nur Permanents; "Spieler erleidet Schaden" ist
 *   ein separater, bewusst NICHT modellierter Trigger (rules-engine.md 10).
 */
export type TriggerCondition =
  | { kind: "onEnterBattlefield"; what: "self" }
  // Dieses Permanent stirbt = verlässt das Battlefield RICHTUNG GRAVEYARD,
  // ursachenunabhängig (SBA 3/4, destroyPermanent, sacrificeSelf-Kosten,
  // Aura-SBA 5) und typ-agnostisch (feuert auch für Relic/Enchantment/
  // Terrain — "parting shot"-Designs; Token: Trigger wird gequeued, verpufft
  // aber beim Stacken, da SBA 7 die Instanz löscht). exilePermanent/
  // returnToHand/Countern/Discard sind KEIN Tod (v0.3.3, rules-engine.md 5 +
  // Entscheidung 9.15 — bis v0.3.2 feuerte nur der SBA-Pfad, das war ein Bug).
  | { kind: "onDeath"; what: "self" }
  // Eine (fremde/eigene) Unit stirbt. eventSubject = die gestorbene Karte,
  // die beim Resolven bereits im Graveyard liegt (bzw. gelöscht ist, Token) —
  // permanent-bezogene Effekte auf "eventSubject" fizzeln hier deshalb
  // garantiert still, siehe EffectRecipient-Kommentar oben (v0.3.2, 9.14).
  // Todesdefinition wie bei onDeath (v0.3.3, 9.15): battlefield → graveyard,
  // ursachenunabhängig — feuert aber NUR für sterbende Units (Name = Vertrag).
  | { kind: "onUnitDied"; controller: ControllerFilter }
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
  /**
   * v0.3 (Modal-Effekte, rules-engine.md 4 + 9.13): Ist `modes` gesetzt
   * (mindestens 2 Einträge), MUSS `effects` das leere Array sein und
   * `targets` fehlen — die Engine validiert das und lehnt Verstöße ab.
   * Moduswahl beim Stacken über PendingDecision "chooseMode" (genau ein
   * wählbarer Modus -> Komfort-Auto-Pick, analog Zielwahl); danach ggf.
   * "chooseTriggerTargets" für die Ziele des gewählten Modus.
   */
  modes?: EffectMode[];
  /** Optionaler Anzeigetext; maßgeblich ist die Datenstruktur. */
  text?: string;
}

/** Aktivierte Fähigkeit: "[Kosten]: Effekte." Geht über den Stack (außer Mana-Fähigkeit). */
export interface ActivatedAbility {
  kind: "activated";
  /**
   * v0.3 (rules-engine.md 4 + 9.12): darf X-Kosten enthalten (`x: true`) —
   * X wird bei der Aktivierung gewählt (`chosenX` an der
   * activateAbility-Aktion und am StackObject), Validierung analog Spells.
   * NICHT kombinierbar mit isManaAbility.
   */
  manaCost?: ManaCost;
  additionalCosts?: AdditionalCost[];
  targets?: TargetSpec[];
  effects: Effect[];
  /**
   * v0.3 (Modal-Effekte, rules-engine.md 4 + 9.13): Ist `modes` gesetzt
   * (mindestens 2 Einträge), MUSS `effects` das leere Array sein und
   * `targets` fehlen (Engine validiert). Der Aktivierende wählt den Modus
   * als Teil der Aktion (`chosenMode` an activateAbility), KEINE
   * PendingDecision. NICHT kombinierbar mit isManaAbility.
   */
  modes?: EffectMode[];
  /**
   * true = reine Mana-Fähigkeit: resolvt sofort ohne Stack (rules-engine.md 4).
   * Engine validiert: dann keine targets, keine modes, keine X-Kosten
   * (v0.3) und nur addMana-Effekte.
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
