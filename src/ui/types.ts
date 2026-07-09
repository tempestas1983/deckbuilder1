/**
 * UI-interner Zustand (nicht Teil des GameState!). Steuert reine
 * Darstellungs-/Interaktionsmodi wie "gerade Ziel auswählen" - die
 * eigentliche Legalitätsprüfung passiert immer über getLegalActions/
 * applyAction, nie hier.
 */

import type { ChosenTarget, InstanceId, PlayerAction, PlayerId, TargetSpec } from "../model";

export type UiMode =
  | { kind: "idle" }
  /** Nutzer soll ein Ziel aus vorab von der Engine gelieferten Kandidaten wählen. */
  | { kind: "targeting"; title: string; candidates: PlayerAction[] }
  /** X-Kosten-Karte: X wird abgefragt, bevor (ggf.) ein Ziel gewählt wird. */
  | { kind: "xInput"; cardInstanceId: InstanceId; player: PlayerId }
  /**
   * X-Kosten-Karte mit Zielslot: eigene Eingabe-UI (siehe docs/engine-status.md
   * "NICHT enumeriert... X-Kosten"), da getLegalActions X-Karten bewusst
   * nicht anbietet. `spec` kommt direkt von der CardDefinition (reine Daten,
   * keine Regel-Logik) und bestimmt nur, welche Board-Elemente klickbar sind;
   * die eigentliche Legalität prüft applyAction beim Dispatch.
   */
  | { kind: "xTarget"; cardInstanceId: InstanceId; player: PlayerId; chosenX: number; spec: TargetSpec }
  | { kind: "declaringAttackers"; player: PlayerId; selected: InstanceId[] }
  | {
      kind: "declaringBlockers";
      player: PlayerId;
      pairs: Array<{ blocker: InstanceId; attacker: InstanceId }>;
      selectedBlocker?: InstanceId;
    }
  | { kind: "discarding"; player: PlayerId; required: number; selected: InstanceId[] }
  /**
   * pendingDecision.kind === "orderBlockers" (rules-engine.md 6d(1)):
   * strukturell ANDERS als "targeting" - getLegalActions liefert hier nur
   * EINEN Kandidaten (die Deklarationsreihenfolge) statt klickbarer
   * Einzelziele, weil die Wahl eine Permutation ist. Dieser UiMode hält
   * daher einen eigenen, lokal sortierbaren Zustand (Kopie der von der
   * Engine vorgeschlagenen Reihenfolge je Angreifer), der per
   * hoch/runter-Buttons verändert und dann über eine einzige
   * resolveDecision-Aktion (choice.orders) bestätigt wird. Ohne Umsortieren
   * entspricht ein sofortiger Klick auf "bestätigen" exakt dem von
   * getLegalActions gelieferten Default-Kandidaten.
   */
  | {
      kind: "orderingBlockers";
      player: PlayerId;
      attackers: Array<{ attacker: InstanceId; blockers: InstanceId[] }>;
    };

export function targetKeyOf(target: ChosenTarget): string {
  switch (target.kind) {
    case "permanent":
      return `permanent:${target.instanceId}`;
    case "player":
      return `player:${target.playerId}`;
    case "stackObject":
      return `stack:${target.stackObjectId}`;
  }
}
