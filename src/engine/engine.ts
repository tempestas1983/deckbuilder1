/**
 * Öffentliche Engine-Fabrik. v0.2: Der Factory-Vertrag ist jetzt vom
 * Game-Architect offiziell abgesegnet (`CreateRulesEngine`-Typ,
 * rules-engine.md 9.6) - `createGame` nimmt bewusst KEINEN Pool mehr über
 * die Config entgegen, es gibt genau eine Pool-Quelle (diese Closure).
 */

import type { CardPool, CreateRulesEngine, PlayerId, RulesEngine } from "../model";
import { createGame as createGameImpl } from "./create-game";
import { applyAction as applyActionImpl } from "./actions";
import { getLegalActions as getLegalActionsImpl } from "./legal-actions";

export const createRulesEngine: CreateRulesEngine = (pool: CardPool): RulesEngine => {
  return {
    createGame(config) {
      return createGameImpl(pool, config);
    },
    applyAction(state, action) {
      return applyActionImpl(state, action, pool);
    },
    getLegalActions(state, player: PlayerId) {
      return getLegalActionsImpl(state, player, pool);
    },
  };
};
