/**
 * Kartendefinitions-Lookup.
 *
 * WICHTIG (Abweichungs-/Klärungsbedarf an game-architect, siehe
 * docs/engine-status.md Abschnitt "Offene Fragen ans Game-Architect-Team"):
 * Das `RulesEngine`-Interface in `src/model/game-state.ts` übergibt den
 * CardPool nur an `createGame`, nicht an `applyAction`/`getLegalActions`.
 * GameState selbst enthält keine Pool-Referenz (CardInstance trägt nur
 * `definitionId`). Die Engine braucht aber bei praktisch jedem Schritt
 * Zugriff auf CardDefinition (Kosten, P/T, Fähigkeiten).
 *
 * Gewählte Lösung (v0.1, pragmatisch, zur Diskussion gestellt):
 * `createRulesEngine(pool)` ist eine Factory, die ein Objekt zurückgibt,
 * das exakt dem `RulesEngine`-Interface entspricht (gleiche Methodensignaturen),
 * aber den Pool per Closure kennt. Das vermeidet fragile Lösungen wie eine
 * WeakMap von State-Referenz -> Pool (bricht, sobald GameState über eine
 * Serialisierungsgrenze wandert, z.B. Worker/Netzwerk/LocalStorage).
 * Alternative, die der Architect stattdessen erwägen könnte: Pool-Parameter
 * explizit zu `applyAction`/`getLegalActions` hinzufügen, oder einen
 * `poolId` in GameState aufnehmen und über eine Registry auflösen.
 */

import type { CardDefinition, CardPool, InstanceId, GameState } from "../model";

export function getDefinition(pool: CardPool, definitionId: string): CardDefinition {
  const def = pool[definitionId];
  if (!def) {
    throw new Error(`Unbekannte CardDefinition-ID im Pool: ${definitionId}`);
  }
  return def;
}

export function getDefinitionForInstance(
  pool: CardPool,
  state: GameState,
  instanceId: InstanceId,
): CardDefinition {
  const inst = state.cards[instanceId];
  if (!inst) {
    throw new Error(`Unbekannte CardInstance-ID: ${instanceId}`);
  }
  return getDefinition(pool, inst.definitionId);
}
