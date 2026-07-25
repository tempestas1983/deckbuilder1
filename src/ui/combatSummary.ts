/**
 * Mitschrift eines Kampfes aus den GameEvents der Engine (Nutzer-Feedback
 * 2026-07-25: "wir brauchen nach jedem Kampf eine kurze Übersicht, was
 * passiert ist").
 *
 * Ein Kampf lief bisher spurlos vorbei: Angreifer werden erklärt, Blocker
 * zugeordnet, Schaden wird automatisch verrechnet, Einheiten sterben - und
 * danach steht nur noch das Ergebnis auf dem Brett. Wer welchen Blocker
 * erwischt hat, wer daran gestorben ist und wie viel Schaden überhaupt
 * durchkam, war nirgends nachlesbar (das Log aus store.ts#describeEvent wird
 * im Spielbrett gar nicht angezeigt und wäre dafür auch zu kleinteilig).
 *
 * KEINE Regellogik: hier wird nichts über Kampfregeln entschieden oder
 * nachgerechnet, sondern nur mitgeschrieben, was die Engine ohnehin gemeldet
 * hat (attackersDeclared/blockersDeclared/damageDealt/unitDied/stepBegan).
 *
 * Bewusst als eigenständiges Modul mit injizierten Nachschlage-Funktionen
 * statt direkt in store.ts: so lässt sich die Mitschrift gegen einen ECHTEN
 * Event-Strom einer echten Engine-Partie testen (s.
 * __tests__/combat-summary.test.ts), ohne dafür einen Test-Setter in den
 * Produktionscode von store.ts einzubauen.
 */

import type { GameEvent, InstanceId, PlayerId } from "../model";

export interface CombatSummaryAttacker {
  name: string;
  /** Namen der Blocker, die diesem Angreifer zugeordnet wurden (leer = kam durch). */
  blockers: string[];
  /** Schaden, den DIESER Angreifer dem verteidigenden Spieler zugefügt hat. */
  damageToDefendingPlayer: number;
}

export interface CombatSummary {
  turnNumber: number;
  attackingPlayer: PlayerId;
  defendingPlayer: PlayerId;
  attackers: CombatSummaryAttacker[];
  /** In diesem Kampf gestorbene Einheiten, mit ihrem Beherrscher. */
  casualties: Array<{ name: string; controller: PlayerId | undefined }>;
  /** Gesamter Schaden am verteidigenden Spieler (inkl. trample-Durchschlag). */
  damageToDefendingPlayer: number;
}

/**
 * Nachschlage-Funktionen in den aktuellen Spielzustand. Namen werden SOFORT
 * beim Event aufgelöst, nicht erst beim Rendern: eine gestorbene Einheit liegt
 * später im Friedhof, und der Bericht soll auch dann noch ihren Namen nennen
 * können.
 */
export interface CombatSummaryContext {
  nameOf: (instanceId: InstanceId) => string;
  controllerOf: (instanceId: InstanceId) => PlayerId | undefined;
  activePlayer: () => PlayerId;
  turnNumber: () => number;
}

/** Steps, während derer ein Kampf noch läuft - s. `record` unten. */
const COMBAT_STEPS: ReadonlySet<string> = new Set([
  "beginCombat",
  "declareAttackers",
  "declareBlockers",
  "combatDamage",
  "endCombat",
]);

export interface CombatSummaryTracker {
  /** Ein einzelnes GameEvent mitschreiben (für JEDES Event aufrufen). */
  record: (e: GameEvent) => void;
  /** Bericht des zuletzt ABGESCHLOSSENEN Kampfes, falls einer vorliegt. */
  completed: () => CombatSummary | undefined;
  /** Bericht wegklicken. Gibt zurück, ob überhaupt einer da war. */
  clearCompleted: () => boolean;
  /** Alles verwerfen (neue Partie). */
  reset: () => void;
}

export function createCombatSummaryTracker(ctx: CombatSummaryContext): CombatSummaryTracker {
  let inProgress: CombatSummary | undefined;
  let completed: CombatSummary | undefined;
  /**
   * Die InstanceIds der Angreifer stehen NICHT im Bericht (der trägt nur
   * Namen, s.o.) - für die Zuordnung der Folge-Events (welcher Block gehört zu
   * welchem Angreifer, wessen Schaden war das) werden sie hier parallel
   * gehalten, positionsgleich zu `inProgress.attackers`.
   */
  let attackerIds: InstanceId[] = [];

  const finalize = (): void => {
    if (!inProgress) return;
    completed = inProgress;
    inProgress = undefined;
    attackerIds = [];
  };

  return {
    record(e: GameEvent): void {
      if (e.kind === "attackersDeclared") {
        // Ein Kampf ohne Angreifer ist kein Bericht wert - dann ist nichts
        // passiert, worüber man etwas nachlesen wollte.
        if (e.attackers.length === 0) return;
        const attackingPlayer = ctx.activePlayer();
        inProgress = {
          turnNumber: ctx.turnNumber(),
          attackingPlayer,
          defendingPlayer: attackingPlayer === "player1" ? "player2" : "player1",
          attackers: e.attackers.map((id) => ({
            name: ctx.nameOf(id),
            blockers: [],
            damageToDefendingPlayer: 0,
          })),
          casualties: [],
          damageToDefendingPlayer: 0,
        };
        attackerIds = [...e.attackers];
        // Der vorherige Bericht ist mit dem neuen Kampf überholt.
        completed = undefined;
        return;
      }
      if (!inProgress) return;

      switch (e.kind) {
        case "blockersDeclared":
          for (const { blocker, attacker } of e.blocks) {
            const index = attackerIds.indexOf(attacker);
            inProgress.attackers[index]?.blockers.push(ctx.nameOf(blocker));
          }
          return;
        case "damageDealt": {
          // Nur Schaden AM verteidigenden Spieler zählt für "wie viel kam
          // durch" - Schaden an Einheiten zeigt sich ohnehin an den Verlusten.
          if (e.to !== inProgress.defendingPlayer) return;
          inProgress.damageToDefendingPlayer += e.amount;
          const index = attackerIds.indexOf(e.source);
          const attacker = inProgress.attackers[index];
          if (attacker) attacker.damageToDefendingPlayer += e.amount;
          return;
        }
        case "unitDied":
          inProgress.casualties.push({
            name: ctx.nameOf(e.instanceId),
            controller: ctx.controllerOf(e.instanceId),
          });
          return;
        case "stepBegan":
          // Kampf vorbei, sobald ein Step außerhalb der Kampf-Steps beginnt.
          if (!COMBAT_STEPS.has(e.step)) finalize();
          return;
        case "gameEnded":
          // Endet die Partie mitten im Kampf, kommt kein weiterer Step mehr -
          // der Bericht ginge sonst ausgerechnet in der entscheidenden Runde
          // verloren.
          finalize();
          return;
        default:
          return;
      }
    },
    completed: () => completed,
    clearCompleted(): boolean {
      if (completed === undefined) return false;
      completed = undefined;
      return true;
    },
    reset(): void {
      inProgress = undefined;
      completed = undefined;
      attackerIds = [];
    },
  };
}
