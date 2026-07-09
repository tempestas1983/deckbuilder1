/**
 * Laufzeit-Spielzustand: Zonen, Karteninstanzen, Permanent-Zustände,
 * Zugstruktur, Priority und Stack.
 *
 * Architektur (docs/rules-engine.md 9.1, Hybrid-Modell):
 *   applyAction(state, action) -> { state', events[] }
 * GameState ist die Quelle der Wahrheit und wird von der Engine als
 * immutabler Snapshot behandelt; GameEvents sind ein Nebenprodukt für
 * Frontend (Animationen, Log) und Trigger-Erkennung.
 *
 * Dieses Modul definiert nur Typen — die Implementierung von applyAction
 * und aller Regeln ist Aufgabe des Engine-Engineer.
 */

import type { CardDefinition } from "./cards";
import type { Keyword, ManaColor, StatModifier, TriggerCondition } from "./abilities";

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

export type PlayerId = "player1" | "player2";

/**
 * Eindeutige ID einer Karteninstanz innerhalb einer Partie (nicht die
 * CardDefinition-ID — zwei Exemplare derselben Karte haben verschiedene
 * InstanceIds). Auch Tokens erhalten InstanceIds.
 */
export type InstanceId = string;

/** Eindeutige ID eines Objekts auf dem Stack. */
export type StackObjectId = string;

// ---------------------------------------------------------------------------
// Zonen
// ---------------------------------------------------------------------------

/** Der Stack ist global; alle übrigen Zonen existieren pro Spieler. */
export type ZoneName =
  | "library"
  | "hand"
  | "battlefield"
  | "graveyard"
  | "exile"
  | "stack";

// ---------------------------------------------------------------------------
// Karteninstanzen & Permanent-Zustand
// ---------------------------------------------------------------------------

/**
 * Eine konkrete Karte in einer Partie. Zone ergibt sich aus der Zonenliste,
 * in der die InstanceId steht (keine redundante zone-Property — eine Quelle
 * der Wahrheit).
 */
export interface CardInstance {
  instanceId: InstanceId;
  /** Referenz in den CardPool. */
  definitionId: string;
  /** Besitzer (wohin die Karte bei Zonenwechseln "nach Hause" geht). */
  owner: PlayerId;
  /** Kontrollierender Spieler (v0.1 immer = owner, Feld für später). */
  controller: PlayerId;
  /** Nur gesetzt, solange die Karte auf dem Battlefield liegt. */
  permanentState?: PermanentState;
}

/**
 * Veränderlicher Zustand eines Permanents (docs/rules-engine.md Abschnitt 8).
 * Wird beim Betreten des Battlefields frisch angelegt und beim Verlassen
 * verworfen (Permanents "vergessen" ihren Zustand, MTG-konform).
 */
export interface PermanentState {
  tapped: boolean;
  /**
   * true, bis der Controller einen Zug mit diesem Permanent begonnen hat.
   * Regelwirkung (Angriff/Tap-Fähigkeiten) betrifft nur Units; Keyword
   * "swift" ignoriert sie.
   */
  summoningSick: boolean;
  /** Markierter Schaden, wird im Cleanup entfernt; Tod via SBA 4. */
  damageMarked: number;
  /**
   * v0.2.3 (deathtouch, rules-engine.md 6d/7): true, sobald das Permanent
   * seit dem letzten Cleanup Schaden > 0 von einer Quelle mit Keyword
   * "deathtouch" erhalten hat (Kampf- UND Effekt-Schaden). SBA 4 behandelt
   * das als letalen Schaden. Reset im Cleanup zusammen mit damageMarked.
   * Optional: fehlend = false.
   */
  deathtouchDamage?: boolean;
  /** Marken, z.B. { plus1plus1: 2, charge: 1 }. Standard-Typen: rules-engine.md 8. */
  counters: Record<string, number>;
  /** Für Auren: das Objekt, an dem dieses Permanent anliegt. */
  attachedTo?: InstanceId;
  /** Auren (später auch Equipment-Relics), die an diesem Permanent anliegen. */
  attachments: InstanceId[];
  /** "Bis Zugende"-Statmodifikationen (Effect modifyStats/grantKeyword). */
  temporaryModifiers: TemporaryModifier[];
  /** Kampfzustand, nur während der Combat Phase gesetzt. */
  combat?: CombatAssignment;
  /**
   * Monoton steigender Zähler des Battlefield-Eintritts; bestimmt die
   * deterministische Reihenfolge statischer Effekte (rules-engine.md 9.3)
   * und gleichzeitiger Trigger desselben Spielers (9.2).
   */
  timestamp: number;
}

export interface TemporaryModifier {
  duration: "endOfTurn" | "permanent";
  stats?: StatModifier;
  keyword?: Keyword;
}

export interface CombatAssignment {
  role: "attacker" | "blocker";
  /** Für Blocker: welcher Angreifer geblockt wird. */
  blocking?: InstanceId;
  /**
   * Für Angreifer: zugeordnete Blocker in Schadensreihenfolge.
   * v0.2.3 (rules-engine.md 6d(1), Revision von 9.8): Bei >= 2 Blockern ist
   * das die vom ANGREIFER via PendingDecision "orderBlockers" gewählte
   * Reihenfolge (die Engine überschreibt die Deklarationsreihenfolge nach
   * resolveDecision); bei 0/1 Blockern die Deklarationsreihenfolge. Die
   * Reihenfolge wird einmal festgelegt und gilt für beide Schadensrunden;
   * tote Blocker werden bei der Zuteilung übersprungen, nicht entfernt.
   */
  blockedBy?: InstanceId[];
}

// ---------------------------------------------------------------------------
// Stack
// ---------------------------------------------------------------------------

/** Gewählte Belegung eines Zielslots (Index = Position in targets[]). */
export type ChosenTarget =
  | { kind: "permanent"; instanceId: InstanceId }
  | { kind: "player"; playerId: PlayerId }
  | { kind: "stackObject"; stackObjectId: StackObjectId };

/**
 * Ein Objekt auf dem Stack (docs/rules-engine.md Abschnitt 4).
 * Resolution: LIFO, oberstes Element = letztes Array-Element von
 * GameState.stack.
 */
export type StackObject =
  | {
      kind: "spell";
      id: StackObjectId;
      /** Die gecastete Karte (liegt logisch in Zone "stack"). */
      cardInstanceId: InstanceId;
      controller: PlayerId;
      chosenTargets: ChosenTarget[];
      /** Gewähltes X bei X-Kosten. */
      chosenX?: number;
    }
  | {
      kind: "activatedAbility";
      id: StackObjectId;
      /** Quelle der Fähigkeit (bleibt in ihrer Zone liegen). */
      sourceInstanceId: InstanceId;
      /** Index der Fähigkeit in CardDefinition.abilities. */
      abilityIndex: number;
      controller: PlayerId;
      chosenTargets: ChosenTarget[];
    }
  | {
      kind: "triggeredAbility";
      id: StackObjectId;
      sourceInstanceId: InstanceId;
      abilityIndex: number;
      controller: PlayerId;
      chosenTargets: ChosenTarget[];
      /** Auslösendes Objekt (für EffectRecipient "eventSubject"). */
      eventSubject?: InstanceId | PlayerId;
    };

/**
 * Gefeuerter, aber noch nicht auf den Stack gelegter Trigger
 * (Pending-Queue, rules-engine.md Abschnitt 5, APNAP-Ordnung).
 */
export interface PendingTrigger {
  sourceInstanceId: InstanceId;
  abilityIndex: number;
  controller: PlayerId;
  condition: TriggerCondition;
  eventSubject?: InstanceId | PlayerId;
  /** PermanentState.timestamp der Quelle für deterministische Ordnung. */
  sourceTimestamp: number;
}

// ---------------------------------------------------------------------------
// Spielerentscheidungen mitten in der Regelabwicklung (Pending Decisions)
// ---------------------------------------------------------------------------

/**
 * Generischer Kanal für Entscheidungen, die die Engine mitten in der
 * Abwicklung von einem Spieler braucht (Architect-Entscheidung, siehe
 * rules-engine.md 9.7). Ist `GameState.pendingDecision` gesetzt, gilt:
 * - Es wird KEINE Priority vergeben und kein Step gewechselt, bis die
 *   Entscheidung aufgelöst ist.
 * - Legal sind für `decision.player` nur `resolveDecision` (und `concede`);
 *   für den anderen Spieler nur `concede`.
 * - `getLegalActions` muss die Entscheidung sichtbar machen (mindestens einen
 *   gültigen resolveDecision-Kandidaten liefern, bei chooseTriggerTargets
 *   alle legalen Einzelziele).
 *
 * Umsetzungspflicht: "chooseTriggerTargets" (seit v0.2, MTG-Konformität der
 * Trigger-Zielwahl) und "orderBlockers" (seit v0.2.3, Teil des
 * Kampf-Keyword-Pakets — ohne sie ist trample nicht sinnvoll spielbar).
 * Die übrigen Varianten sind bereits definiert, damit die Engine
 * scry / addMana("any") / discardCards-Zusatzkosten schrittweise von ihren
 * dokumentierten Auto-Defaults auf echte Spielerwahl umstellen kann,
 * ohne dass sich der Vertrag erneut ändert.
 */
export type PendingDecision =
  | {
      kind: "chooseTriggerTargets";
      player: PlayerId;
      /** Der Trigger aus pendingTriggers, der gerade gestackt werden soll. */
      sourceInstanceId: InstanceId;
      abilityIndex: number;
      eventSubject?: InstanceId | PlayerId;
    }
  | {
      kind: "chooseManaColor"; // addMana mit color: "any"
      player: PlayerId;
      amount: number;
    }
  | {
      kind: "chooseDiscard"; // AdditionalCost discardCards (Wahl statt "erste Karten")
      player: PlayerId;
      count: number;
    }
  | {
      kind: "orderScry"; // scry-Effekt: Reihenfolge/oben-oder-unten
      player: PlayerId;
      cardInstanceIds: InstanceId[];
    }
  | {
      /**
       * v0.2.3 (rules-engine.md 6d(1), Revision von Entscheidung 9.8):
       * Angreifer legt bei Mehrfachblock die Schadensreihenfolge fest.
       * Von der Engine gesetzt unmittelbar nach der declareBlockers-
       * Deklaration und VOR dem Priority-Fenster des Steps, sobald
       * mindestens ein Angreifer >= 2 Blocker hat — EINE Decision für alle
       * mehrfach geblockten Angreifer (Angreifer mit 0/1 Blockern fehlen).
       * Liegt außerhalb einer Priority-Vergabe: resumePriorityTo wird NICHT
       * gesetzt. getLegalActions liefert mindestens einen gültigen
       * Kandidaten (z.B. Deklarationsreihenfolge), enumeriert Permutationen
       * aber nicht.
       */
      kind: "orderBlockers";
      /** Der angreifende (= aktive) Spieler. */
      player: PlayerId;
      /**
       * Alle Angreifer mit >= 2 Blockern; blockers in der bisherigen
       * (Deklarations-)Reihenfolge als Vorschlagsbasis.
       */
      attackers: Array<{ attacker: InstanceId; blockers: InstanceId[] }>;
    };

/** Antwort des Spielers auf die jeweilige PendingDecision (gleicher kind). */
export type DecisionChoice =
  | { kind: "chooseTriggerTargets"; chosenTargets: ChosenTarget[] }
  | { kind: "chooseManaColor"; colors: Array<ManaColor | "colorless"> }
  | { kind: "chooseDiscard"; cardInstanceIds: InstanceId[] }
  | {
      kind: "orderScry";
      /** Neue Reihenfolge für oben (Index 0 = oberste) + nach unten gelegte Karten. */
      keepOnTop: InstanceId[];
      putOnBottom: InstanceId[];
    }
  | {
      kind: "orderBlockers";
      /**
       * Pro Angreifer aus der Decision die gewählte Schadensreihenfolge
       * (Index 0 = erhält zuerst Schaden). Validierung (rules-engine.md 9.9):
       * exakt die in der Decision gelisteten Angreifer, je eine Permutation
       * exakt der gelisteten Blocker — sonst wird die Aktion abgelehnt.
       * Ergebnis wird in CombatAssignment.blockedBy übernommen.
       */
      orders: Array<{ attacker: InstanceId; blockers: InstanceId[] }>;
    };

// ---------------------------------------------------------------------------
// Zugstruktur
// ---------------------------------------------------------------------------

/** Die 12 Steps des Zuges (rules-engine.md Abschnitt 2). */
export type TurnStep =
  | "untap"
  | "upkeep"
  | "draw"
  | "main1"
  | "beginCombat"
  | "declareAttackers"
  | "declareBlockers"
  | "combatDamage"
  | "endCombat"
  | "main2"
  | "endStep"
  | "cleanup";

// ---------------------------------------------------------------------------
// Spieler & Gesamtzustand
// ---------------------------------------------------------------------------

export type ManaPool = Record<ManaColor | "colorless", number>;

export interface PlayerState {
  id: PlayerId;
  life: number;
  /** Geordnete Zonen: Index 0 = oberste Karte der Library / älteste im Graveyard. */
  library: InstanceId[];
  hand: InstanceId[];
  battlefield: InstanceId[];
  graveyard: InstanceId[];
  exile: InstanceId[];
  manaPool: ManaPool;
  /** Bereits gespielte Terrains in diesem Zug (Limit 1). */
  terrainsPlayedThisTurn: number;
  /** Musste aus leerer Library ziehen -> verliert bei nächstem SBA-Check. */
  attemptedDrawFromEmptyLibrary: boolean;
  hasLost: boolean;
}

export interface GameState {
  /** Alle Karteninstanzen der Partie, Schlüssel = InstanceId. */
  cards: Record<InstanceId, CardInstance>;
  players: Record<PlayerId, PlayerState>;

  activePlayer: PlayerId;
  turnNumber: number;
  step: TurnStep;

  /** Wer aktuell Priority hat; undefined während Turn-Based Actions. */
  priorityPlayer?: PlayerId;
  /** Spieler, die seit der letzten Zustandsänderung gepasst haben (Regel 3.5/3.6). */
  consecutivePasses: PlayerId[];

  /** Der Stack; letztes Element = oberstes Objekt. */
  stack: StackObject[];
  /** Gefeuerte Trigger, die beim nächsten Priority-Zeitpunkt gestackt werden. */
  pendingTriggers: PendingTrigger[];
  /**
   * Ausstehende Spielerentscheidung; blockiert Priority-Vergabe und
   * Step-Wechsel, bis sie per resolveDecision aufgelöst ist (s. PendingDecision).
   */
  pendingDecision?: PendingDecision;
  /**
   * Priority-Wiederaufnahme nach Decision-Pause (v0.2.1, rules-engine.md 9.7):
   * Unterbricht eine PendingDecision eine anstehende Priority-Vergabe, merkt
   * die Engine hier den ursprünglich vorgesehenen Empfänger (z.B. den
   * nicht-aktiven Spieler, der nach seinem eigenen Cast erneut Priority
   * erhalten sollte). Das Feld wird beim Pausieren gesetzt und erst geleert,
   * wenn die Priority tatsächlich vergeben wurde — es überlebt damit auch
   * Ketten mehrerer Decisions (z.B. mehrere Trigger, die nacheinander Ziele
   * brauchen), ohne pro Decision umkopiert zu werden. Ist bei gesetzter
   * pendingDecision kein resumePriorityTo vorhanden (Decision außerhalb
   * einer Priority-Vergabe, z.B. künftige Kosten-/Resolution-Decisions),
   * gilt nach der Auflösung der normale Ablauf, als hätte es die Pause
   * nicht gegeben.
   */
  resumePriorityTo?: PlayerId;

  /** Seed + Zähler des deterministischen RNG (rules-engine.md 9.1). */
  rngState: { seed: number; counter: number };
  /** Nächster zu vergebender PermanentState.timestamp. */
  nextTimestamp: number;
  /** Laufende Nummer für InstanceIds/StackObjectIds. */
  nextObjectNumber: number;

  /** Gesetzt, sobald das Spiel entschieden ist. */
  winner?: PlayerId | "draw";
}

// ---------------------------------------------------------------------------
// Aktionen (Input an die Engine) & Events (Output der Engine)
// ---------------------------------------------------------------------------

/**
 * Alles, was ein Spieler tun kann, wenn er am Zug ist bzw. Priority hat.
 * Die Engine validiert Legalität und lehnt illegale Aktionen ab.
 */
export type PlayerAction =
  | { kind: "passPriority"; player: PlayerId }
  | {
      kind: "castSpell";
      player: PlayerId;
      cardInstanceId: InstanceId;
      chosenTargets: ChosenTarget[];
      chosenX?: number;
    }
  | { kind: "playTerrain"; player: PlayerId; cardInstanceId: InstanceId }
  | {
      kind: "activateAbility";
      player: PlayerId;
      sourceInstanceId: InstanceId;
      abilityIndex: number;
      chosenTargets: ChosenTarget[];
    }
  | {
      kind: "declareAttackers";
      player: PlayerId;
      attackers: InstanceId[];
    }
  | {
      kind: "declareBlockers";
      player: PlayerId;
      /**
       * blocker -> geblockter Angreifer. Die Reihenfolge der Paare ist seit
       * v0.2.3 NICHT mehr schadensrelevant: Bei Mehrfachblock ordnet der
       * Angreifer via PendingDecision "orderBlockers" (rules-engine.md 6d(1)).
       */
      blocks: Array<{ blocker: InstanceId; attacker: InstanceId }>;
    }
  | {
      kind: "discardToHandSize";
      player: PlayerId;
      cardInstanceIds: InstanceId[];
    }
  | {
      /** Antwort auf GameState.pendingDecision (choice.kind muss passen). */
      kind: "resolveDecision";
      player: PlayerId;
      choice: DecisionChoice;
    }
  | { kind: "concede"; player: PlayerId };

/**
 * Von der Engine emittierte Ereignisse — für Frontend (Animation, Log),
 * Tests und intern zur Trigger-Erkennung. Bewusst grobkörnig gehalten;
 * Engine-Engineer darf Varianten ergänzen, solange bestehende stabil bleiben.
 */
export type GameEvent =
  | { kind: "gameStarted"; startingPlayer: PlayerId }
  | { kind: "turnBegan"; player: PlayerId; turnNumber: number }
  | { kind: "stepBegan"; step: TurnStep }
  | { kind: "priorityGained"; player: PlayerId }
  | { kind: "cardDrawn"; player: PlayerId; cardInstanceId: InstanceId }
  | { kind: "spellCast"; stackObjectId: StackObjectId; cardInstanceId: InstanceId }
  | { kind: "abilityActivated"; stackObjectId: StackObjectId; sourceInstanceId: InstanceId }
  | { kind: "triggerFired"; sourceInstanceId: InstanceId; abilityIndex: number }
  | { kind: "decisionRequired"; player: PlayerId; decisionKind: PendingDecision["kind"] }
  | { kind: "decisionResolved"; player: PlayerId; decisionKind: PendingDecision["kind"] }
  | { kind: "stackObjectResolved"; stackObjectId: StackObjectId }
  | { kind: "stackObjectCountered"; stackObjectId: StackObjectId }
  | { kind: "stackObjectFizzled"; stackObjectId: StackObjectId }
  | {
      kind: "zoneChanged";
      cardInstanceId: InstanceId;
      from: ZoneName;
      to: ZoneName;
    }
  | { kind: "permanentTapped"; instanceId: InstanceId }
  | { kind: "permanentUntapped"; instanceId: InstanceId }
  | { kind: "damageDealt"; to: InstanceId | PlayerId; amount: number; source: InstanceId }
  | { kind: "lifeChanged"; player: PlayerId; delta: number; newTotal: number }
  | { kind: "countersChanged"; instanceId: InstanceId; counterType: string; delta: number }
  | { kind: "unitDied"; instanceId: InstanceId }
  | { kind: "attackersDeclared"; attackers: InstanceId[] }
  | { kind: "blockersDeclared"; blocks: Array<{ blocker: InstanceId; attacker: InstanceId }> }
  | { kind: "playerLost"; player: PlayerId; reason: "life" | "deck" | "concede" }
  | { kind: "gameEnded"; winner: PlayerId | "draw" };

// ---------------------------------------------------------------------------
// Engine-Schnittstelle (Vertrag Engine <-> Frontend, zu implementieren
// vom Engine-Engineer; Signaturen hier verbindlich)
//
// Konstruktion (Architect-Entscheidung, rules-engine.md 9.6): Der CardPool
// wird EINMAL an eine Factory gebunden — `createRulesEngine(pool)` liefert
// eine RulesEngine, deren Methoden den Pool per Closure kennen. GameState
// enthält bewusst keine Pool-Referenz (bleibt schlank serialisierbar), und
// applyAction/getLegalActions bekommen keinen Pool-Parameter. Es gibt damit
// genau EINE Pool-Quelle; createGame nimmt den Pool nicht erneut entgegen.
// ---------------------------------------------------------------------------

export interface ApplyActionResult {
  state: GameState;
  events: GameEvent[];
  /** Gesetzt statt state-Änderung, wenn die Aktion illegal war. */
  error?: string;
}

export interface CreateGameConfig {
  decks: Record<PlayerId, Record<string, number>>;
  seed: number;
  /**
   * Nur für Tests/Sonderfälle: erzwungener Startspieler. Fehlt das Feld,
   * bestimmt die Engine den Startspieler per Münzwurf über den seedbaren
   * RNG (erster RNG-Verbrauch der Partie, vor dem Mischen) — deterministisch
   * pro Seed. Siehe rules-engine.md Abschnitt 1a.
   */
  startingPlayer?: PlayerId;
}

export interface RulesEngine {
  /** Startet eine Partie aus zwei Decklisten + Seed (Pool kommt aus der Factory). */
  createGame(config: CreateGameConfig): { state: GameState; events: GameEvent[] };

  /** Kernfunktion: pure, deterministisch (rules-engine.md 9.1). */
  applyAction(state: GameState, action: PlayerAction): ApplyActionResult;

  /**
   * Für das Frontend: legale Aktions-KANDIDATEN für `player`.
   * Vertragspräzisierung (Architect): Diese Liste ist bewusst NICHT
   * erschöpfend. Garantiert enumeriert werden: passPriority, concede,
   * playTerrain, castSpell/activateAbility mit 0 oder 1 Zielslot (alle
   * legalen Einzelziele), resolveDecision-Kandidaten bei pendingDecision.
   * NICHT enumeriert werden kombinatorische Räume: mehrere Zielslots,
   * X-Werte (Kandidat ohne chosenX; Frontend fragt X ab), Attacker-/
   * Blocker-Teilmengen, Discard-Kombinationen. applyAction validiert
   * jede vollständige Aktion korrekt — das ist die Legalitäts-Wahrheit.
   */
  getLegalActions(state: GameState, player: PlayerId): PlayerAction[];
}

/**
 * Kanonische Konstruktion der Engine (implementiert in src/engine/):
 *   const engine = createRulesEngine(pool);
 */
export type CreateRulesEngine = (
  pool: Record<string, CardDefinition>
) => RulesEngine;
