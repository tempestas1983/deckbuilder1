/**
 * Öffentliche Schnittstelle des KI-Moduls.
 *
 * - v1-Kompatibilität: `chooseAction` (die bisherige mittlere Heuristik)
 *   bleibt unverändert exportiert — bestehende Aufrufer (src/ui/store.ts)
 *   funktionieren ohne Änderung weiter.
 * - v2: `chooseActionForDifficulty` + `BotDifficulty` für die drei
 *   Schwierigkeitsstufen (siehe difficulty.ts / docs/ai-status.md).
 */

export { chooseAction } from "./simpleBot";
export {
  chooseActionForDifficulty,
  BOT_DIFFICULTIES,
  BOT_DIFFICULTY_LABELS,
  DEFAULT_BOT_DIFFICULTY,
  type BotDifficulty,
} from "./difficulty";
