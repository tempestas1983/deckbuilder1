/**
 * Öffentliche Schwierigkeitsstufen-API des KI-Gegners (v2, siehe
 * docs/ai-status.md Abschnitt "v2: Schwierigkeitsstufen").
 *
 * Drei echte, spürbar unterschiedliche Spielstärken:
 * - "easy":   absichtliche Fehler + Zufall (src/ai/easyBot.ts) — deterministisch
 *             pro Stellung (PRNG aus dem GameState abgeleitet).
 * - "medium": die unveränderte v1-Heuristik (src/ai/simpleBot.ts#chooseAction).
 * - "hard":   budgetiertes 1-Ply-Lookahead über applyAction-Simulation +
 *             effektive Stats/Keywords inkl. statischer Fremd-Effekte +
 *             echte Kampf-Mathematik (src/ai/hardBot.ts).
 *
 * Alle drei Stufen sind reine Konsumenten der öffentlichen RulesEngine-
 * Schnittstelle und liefern IMMER eine legale Aktion (Nutzungsvertrag
 * identisch zu v1, docs/ai-status.md Abschnitt 1).
 */

import type { CardPool, GameState, PlayerAction, PlayerId, RulesEngine } from "../model";
import { chooseAction as chooseActionMedium } from "./simpleBot";
import { chooseActionEasy } from "./easyBot";
import { chooseActionHard } from "./hardBot";

export type BotDifficulty = "easy" | "medium" | "hard";

/** Alle Stufen in aufsteigender Spielstärke (u.a. für UI-Dropdowns/Tests). */
export const BOT_DIFFICULTIES: readonly BotDifficulty[] = ["easy", "medium", "hard"] as const;

/** Anzeigenamen für das Frontend (deutschsprachige UI). */
export const BOT_DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
};

/** Empfohlener Default für neue Partien. */
export const DEFAULT_BOT_DIFFICULTY: BotDifficulty = "medium";

/**
 * Wählt eine legale Aktion für `player` in der gewünschten Schwierigkeitsstufe.
 * Signatur/Nutzungsvertrag identisch zu simpleBot.ts#chooseAction (plus
 * `difficulty`): nur für den tatsächlich handelnden Spieler aufrufen, der
 * Aufrufer führt die Aktion per engine.applyAction aus.
 */
export function chooseActionForDifficulty(
  engine: RulesEngine,
  pool: CardPool,
  state: GameState,
  player: PlayerId,
  difficulty: BotDifficulty,
): PlayerAction {
  switch (difficulty) {
    case "easy":
      return chooseActionEasy(engine, pool, state, player);
    case "medium":
      return chooseActionMedium(engine, pool, state, player);
    case "hard":
      return chooseActionHard(engine, pool, state, player);
  }
}
