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
  | { kind: "discarding"; player: PlayerId; required: number; selected: InstanceId[] };

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
