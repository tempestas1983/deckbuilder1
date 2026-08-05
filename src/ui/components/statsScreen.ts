/**
 * "Statistik" - fünfter Hauptmenü-Button neben "Neues Spiel"/"Deck Builder"/
 * "Tutorial"/"Anleitung" (s. components/mainMenu.ts, store.ts#openStats,
 * types.ts#AppPhase "stats"). Reiner Anzeige-Screen für den dauerhaft in
 * localStorage aufgezeichneten Spielverlauf (jede abgeschlossene
 * Nicht-Tutorial-Partie, s. store.ts#recordGameHistoryForEvent/
 * listGameHistory) - anders als das Tutorial (geführte Beispielpartie) oder
 * die Anleitung (statischer Lesestoff) zeigt dieser Screen echte, vom Nutzer
 * selbst gespielte Ergebnisse.
 *
 * Eigener `AppPhase`-Screen (kein Panel-Overlay wie rulesGuidePanel.ts) -
 * konsistent mit dem eigenständigen Deckbau-Modus (deckBuilder.ts,
 * `mode: "standalone"`): eigene "Zurück zum Hauptmenü"-Fußzeile statt eines
 * schließbaren Backdrops, da hier potenziell viel Inhalt (bis zu 100
 * Einträge, s. store.ts#GAME_HISTORY_MAX_ENTRIES) auf eigenem Raum Platz
 * braucht.
 *
 * Zwei Abschnitte:
 * - Aggregierte Zahlen: Gesamt-Bilanz + eine Zeile pro Gegnertyp (KI "Leicht"/
 *   "Mittel"/"Schwer" bzw. "Mensch (Hotseat)"), NUR für tatsächlich
 *   vorgekommene Gegnertypen (keine leeren "0 Partien"-Zeilen für nie
 *   gespielte Schwierigkeitsstufen).
 * - Chronologischer Spielverlauf, neueste zuerst (kommt bereits sortiert von
 *   store.ts#listGameHistory rein, hier keine eigene Sortierlogik).
 *
 * Reine Ableitung aus den übergebenen Props bei jedem Aufruf (kein eigener
 * State) - exakt dasselbe Prinzip wie components/deckAnalysis.ts.
 */

import { BOT_DIFFICULTIES, BOT_DIFFICULTY_LABELS } from "../../ai";
import { h, text } from "../h";
import type { GameHistoryEntry, GameHistoryOpponent, GameHistoryResult } from "../store";


export interface StatsScreenOptions {
  /** Bereits sortiert (neueste zuerst), s. store.ts#listGameHistory. */
  history: GameHistoryEntry[];
  onBackToMainMenu: () => void;
}

const RESULT_LABELS: Record<GameHistoryResult, string> = {
  win: "Sieg",
  loss: "Niederlage",
  draw: "Unentschieden",
};

/** Auch von components/mainMenu.ts genutzt (Autosave-Vorschau, "Weiter spielen"-Button). */
export function opponentLabel(opponent: GameHistoryOpponent): string {
  return opponent.kind === "human" ? "Mensch (Hotseat)" : `KI - ${BOT_DIFFICULTY_LABELS[opponent.difficulty]}`;
}

/** Stabiler Gruppierungsschlüssel je Gegnertyp (Schwierigkeitsstufe getrennt gezählt, s. Auftrag "ggf. pro Schwierigkeitsstufe"). */
function opponentKey(opponent: GameHistoryOpponent): string {
  return opponent.kind === "human" ? "human" : `bot-${opponent.difficulty}`;
}

/** Feste Anzeige-Reihenfolge für die Gegnertyp-Zeilen: aufsteigende KI-Schwierigkeit, Hotseat zuletzt - unabhängig davon, in welcher Reihenfolge die Partien tatsächlich gespielt wurden. */
const OPPONENT_KEY_ORDER: string[] = [...BOT_DIFFICULTIES.map((d) => `bot-${d}`), "human"];

interface AggregateBucket {
  label: string;
  wins: number;
  losses: number;
  draws: number;
}

function emptyBucket(label: string): AggregateBucket {
  return { label, wins: 0, losses: 0, draws: 0 };
}

function addResult(bucket: AggregateBucket, result: GameHistoryResult): void {
  if (result === "win") bucket.wins++;
  else if (result === "loss") bucket.losses++;
  else bucket.draws++;
}

function buildAggregates(history: GameHistoryEntry[]): { total: AggregateBucket; byOpponent: AggregateBucket[] } {
  const total = emptyBucket("Gesamt");
  const byOpponentMap = new Map<string, AggregateBucket>();
  for (const entry of history) {
    addResult(total, entry.result);
    const key = opponentKey(entry.opponent);
    let bucket = byOpponentMap.get(key);
    if (!bucket) {
      bucket = emptyBucket(opponentLabel(entry.opponent));
      byOpponentMap.set(key, bucket);
    }
    addResult(bucket, entry.result);
  }
  const byOpponent = OPPONENT_KEY_ORDER.map((key) => byOpponentMap.get(key)).filter(
    (b): b is AggregateBucket => b !== undefined,
  );
  return { total, byOpponent };
}

function aggregateRow(bucket: AggregateBucket): HTMLElement {
  const totalGames = bucket.wins + bucket.losses + bucket.draws;
  const parts = [`${bucket.wins} Siege`, `${bucket.losses} Niederlagen`];
  if (bucket.draws > 0) parts.push(`${bucket.draws} Unentschieden`);
  return h("div", { class: "stats-aggregate-row", "data-testid": "stats-aggregate-row" }, [
    h("div", { class: "stats-aggregate-label" }, [text(bucket.label)]),
    h("div", { class: "stats-aggregate-numbers" }, [
      text(`${parts.join(", ")} (${totalGames} ${totalGames === 1 ? "Partie" : "Partien"})`),
    ]),
  ]);
}

function historyRow(entry: GameHistoryEntry): HTMLElement {
  const timestamp = new Date(entry.playedAt);
  const dateText = Number.isNaN(timestamp.getTime())
    ? entry.playedAt
    : timestamp.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  return h(
    "div",
    { class: `stats-history-row stats-history-row-${entry.result}`, "data-testid": "stats-history-row" },
    [
      h("div", { class: "stats-history-date" }, [text(dateText)]),
      h("div", { class: "stats-history-result" }, [text(RESULT_LABELS[entry.result])]),
      h("div", { class: "stats-history-opponent" }, [text(opponentLabel(entry.opponent))]),
    ],
  );
}

export function statsScreen(opts: StatsScreenOptions): HTMLElement {
  const { total, byOpponent } = buildAggregates(opts.history);
  return h("div", { class: "stats-screen" }, [
    h("div", { class: "stats-header-row" }, [
      h("h2", { class: "stats-title" }, [text("Statistik")]),
    ]),
    h("div", { class: "stats-summary", "data-testid": "stats-summary" }, [aggregateRow(total), ...byOpponent.map(aggregateRow)]),
    h("div", { class: "stats-history-section" }, [
      h("h3", { class: "stats-history-title" }, [text("Spielverlauf")]),
      opts.history.length === 0
        ? h("div", { class: "stats-history-empty" }, [text("Noch keine abgeschlossenen Partien.")])
        : h(
            "div",
            { class: "stats-history-list", "data-testid": "stats-history-list" },
            opts.history.map((entry) => historyRow(entry)),
          ),
    ]),
    h("div", { class: "stats-footer" }, [
      h("button", { class: "btn btn-cancel stats-back-to-menu-btn", onclick: opts.onBackToMainMenu }, [
        text("Zurück zum Hauptmenü"),
      ]),
    ]),
  ]);
}
