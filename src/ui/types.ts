/**
 * UI-interner Zustand (nicht Teil des GameState!). Steuert reine
 * Darstellungs-/Interaktionsmodi wie "gerade Ziel auswählen" - die
 * eigentliche Legalitätsprüfung passiert immer über getLegalActions/
 * applyAction, nie hier.
 */

import type { ChosenTarget, EffectMode, InstanceId, PlayerAction, PlayerId, TargetSpec } from "../model";

/**
 * Herkunft eines Casts/einer Aktivierung, die eine eigene Eingabe-UI braucht
 * (X-Kosten und/oder Modal, s.u.) - vereinheitlicht castSpell (Karte in der
 * Hand) und activateAbility (Fähigkeit auf einem Battlefield-Permanent), da
 * beide seit v0.3 exakt denselben Ablauf haben (Modus -> X -> Ziele,
 * rules-engine.md 4/9.12/9.13). Vorher gab es diese Eingabe-UI nur für
 * castSpell (xInput/xTarget mit `cardInstanceId`); die Verallgemeinerung ist
 * Teil des v0.1.6-Auftrags ("X-Kosten auf aktivierten Fähigkeiten").
 */
export type CastSource =
  | { kind: "spell"; cardInstanceId: InstanceId }
  | { kind: "ability"; sourceInstanceId: InstanceId; abilityIndex: number };

export type UiMode =
  | { kind: "idle" }
  /** Nutzer soll ein Ziel aus vorab von der Engine gelieferten Kandidaten wählen. */
  | { kind: "targeting"; title: string; candidates: PlayerAction[] }
  /**
   * v0.3 (rules-engine.md 4 + 9.12): X-Kosten-Eingabe für castSpell UND
   * (neu) activateAbility - `source` unterscheidet die beiden. `chosenMode`
   * ist gesetzt, wenn diesem Schritt bereits eine Modus-Wahl voranging
   * (Reihenfolge Modus -> X -> Ziele, 9.13).
   */
  | { kind: "xInput"; source: CastSource; player: PlayerId; chosenMode?: number }
  /**
   * Zielwahl-Eingabe-UI (siehe docs/engine-status.md "NICHT enumeriert...
   * X-Kosten"), da getLegalActions X-Karten/-Fähigkeiten UND modale
   * Karten/Fähigkeiten bewusst nicht mit fertigen Zielkandidaten anbietet.
   * `spec` kommt direkt von der CardDefinition/Ability (reine Daten, keine
   * Regel-Logik) und bestimmt nur, welche Board-Elemente klickbar sind; die
   * eigentliche Legalität prüft applyAction beim Dispatch. `chosenX` fehlt,
   * wenn dieser Zielwahl-Schritt aus einem reinen Modal-Flow OHNE X-Kosten
   * kommt (v0.3.1: der Name "xTarget" ist historisch, deckt seit dem
   * Modal-Auftrag auch die reine Modus-Zielwahl ohne X ab).
   */
  | { kind: "xTarget"; source: CastSource; player: PlayerId; chosenX?: number; chosenMode?: number; spec: TargetSpec }
  /**
   * v0.3 (Modal-Effekte, rules-engine.md 4 + 9.13): Modus wird bei Spells/
   * aktivierten Fähigkeiten als Teil der Aktion gewählt (atomar, keine
   * PendingDecision - im Gegensatz zu Triggern, die "chooseMode" bekommen,
   * s. PendingDecision in game-state.ts) - VOR X und Zielen. Nach der Wahl
   * entscheidet render.ts, ob als nächstes X (falls Kosten X hat), Zielwahl
   * (falls der gewählte Modus targets hat) oder direkt der Dispatch folgt.
   */
  | { kind: "modeSelect"; source: CastSource; player: PlayerId; modes: EffectMode[] }
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

/**
 * App-Ebene-Zustand, AUSSERHALB des GameState: steuert, ob gerade der
 * Deckbau-Screen (pro Spieler, sequenziell) oder das eigentliche Spielbrett
 * angezeigt wird. Kein Teil der Engine/des GameState - reiner UI-Ablauf, wie
 * `UiMode` oben, nur eine Ebene höher (vor dem ersten `initGame`-Aufruf gibt
 * es noch gar keinen `GameState`).
 */
export type AppPhase =
  | { kind: "deckbuild"; player: PlayerId }
  | { kind: "playing" };

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
