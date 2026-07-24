/**
 * Reine Anzeige-Hilfsfunktionen rund um CardDefinition/CardInstance.
 *
 * Wichtig fuer die Abgrenzung "keine Spiellogik im Frontend": Alles hier ist
 * entweder (a) reines Auslesen/Formatieren von Daten, die der CardPool bzw.
 * GameState ohnehin bereitstellen, oder (b) Aufruf der vom Engine-Engineer
 * exportierten, reinen Anzeige-Berechnung `computeEffectiveStats`/
 * `computeEffectiveKeywords` (src/engine/stats.ts, re-exportiert ueber
 * src/engine/index.ts). Diese Funktionen mutieren nichts und treffen keine
 * Legalitaets-/Regelentscheidung - sie berechnen nur die aktuell gueltigen
 * Anzeigewerte (Marken + statische Effekte ohne Layer-System, siehe
 * rules-engine.md 9.3). Eine eigene Neuberechnung im Frontend waere echte
 * Regellogik-Duplikation; der Re-Use dieser Engine-Funktion vermeidet das.
 */

import type { CardDefinition, CardPool, GameState, InstanceId, ManaColor, ManaCost } from "../model";
import { computeEffectiveKeywords, computeEffectiveStats } from "../engine";

export const COLOR_LABEL: Record<ManaColor, string> = {
  flame: "Flamme",
  tide: "Flut",
  wild: "Wildnis",
  light: "Licht",
  void: "Leere",
};

export const COLOR_CLASS: Record<ManaColor, string> = {
  flame: "mana-flame",
  tide: "mana-tide",
  wild: "mana-wild",
  light: "mana-light",
  void: "mana-void",
};

const COLORS: ManaColor[] = ["flame", "tide", "wild", "light", "void"];

export const KEYWORD_LABEL: Record<string, string> = {
  swift: "Eile",
  airborne: "Flieger",
  reach: "Reichweite",
  vigilant: "Wachsam",
  lifelink: "Lebensverbindung",
  guardian: "Wächter",
  trample: "Trampeln",
  firstStrike: "Erstschlag",
  deathtouch: "Todesberührung",
};

export function cardDef(pool: CardPool, state: GameState, instanceId: InstanceId): CardDefinition {
  const inst = state.cards[instanceId];
  if (!inst) throw new Error(`Unbekannte CardInstance: ${instanceId}`);
  const def = pool[inst.definitionId];
  if (!def) throw new Error(`Unbekannte CardDefinition: ${inst.definitionId}`);
  return def;
}

export function dominantColorClass(cost: ManaCost): string {
  for (const c of COLORS) {
    if ((cost[c] ?? 0) > 0) return COLOR_CLASS[c];
  }
  return "mana-colorless";
}

/**
 * Wie `dominantColorClass`, aber liefert den ManaColor-Schlüssel statt der
 * CSS-Klasse (für Deckbau-Filter, nicht fürs Kartenbild) - und akzeptiert
 * gleich die ganze CardDefinition, da Terrains (kein `cost`-Feld) hier
 * ebenfalls behandelt werden müssen (immer "colorless").
 */
export function dominantColorKey(def: CardDefinition): ManaColor | "colorless" {
  const cost = "cost" in def ? def.cost : undefined;
  if (!cost) return "colorless";
  for (const c of COLORS) {
    if ((cost[c] ?? 0) > 0) return c;
  }
  return "colorless";
}

export function formatManaCost(cost: ManaCost | undefined): string {
  if (!cost) return "—";
  const bits: string[] = [];
  if (cost.generic) bits.push(`${cost.generic} allg.`);
  if (cost.x) bits.push("X allg.");
  for (const c of COLORS) {
    const n = cost[c] ?? 0;
    if (n > 0) bits.push(`${n}× ${COLOR_LABEL[c]}`);
  }
  return bits.length ? bits.join(" + ") : "kostenlos";
}

/**
 * Rein darstellende Aufbereitung einer ManaCost als Liste von "Mana-Pips"
 * (ein kompaktes Kreissymbol pro Kostenanteil, wie in klassischen
 * Kartenspiel-Layouts üblich) für die neue Kartenrahmen-Optik (`card-frame-*`
 * in style.css, siehe handCard.ts/cardTile.ts/deckBuilder.ts). Bewusst EIN
 * Pip pro Kostenanteil (nicht ein Pip pro Mana-Punkt) - hält die kompakte
 * Kartengröße auch bei teureren Karten stabil; `formatManaCost` bleibt
 * daneben als vollständiger Text erhalten (z.B. als `title`-Tooltip).
 */
export interface ManaPip {
  key: string;
  label: string;
  colorClass: string;
}

/**
 * Dieselbe Pip-Aufbereitung für den aktuell VERFÜGBAREN Mana-Vorrat eines
 * Spielers (`PlayerState.manaPool`) statt für Kosten - Spielerwunsch
 * 2026-07-24: "Mana als Icons dargestellt wäre super". Der Vorrat stand
 * bisher als reiner Fließtext im Spieler-Panel ("Mana: 2× Flamme, 1× farblos"),
 * während Kartenkosten schon immer als farbige Pips erschienen - man musste
 * also zwischen zwei Darstellungen desselben Konzepts übersetzen, um zu sehen,
 * ob eine Karte bezahlbar ist. Gleiche Optik auf beiden Seiten macht den
 * Abgleich zu einem reinen Farbvergleich.
 *
 * Bewusst dieselbe Konvention wie `manaCostPips`: EIN Pip pro Farbe mit der
 * Anzahl als Beschriftung (nicht ein Pip pro Mana-Punkt) - hält das Panel auch
 * bei großen Vorräten schmal und ist direkt mit den Kosten-Pips vergleichbar.
 * Farbloses Mana kommt hier ANS ENDE (bei Kosten steht der generische Anteil
 * vorn): im Vorrat ist es der Rest, der nach den Farben übrig bleibt.
 */
export function manaPoolPips(pool: Record<string, number>): ManaPip[] {
  const pips: ManaPip[] = [];
  for (const c of COLORS) {
    const n = pool[c] ?? 0;
    if (n > 0) pips.push({ key: c, label: String(n), colorClass: COLOR_CLASS[c] });
  }
  const colorless = pool.colorless ?? 0;
  if (colorless > 0) pips.push({ key: "colorless", label: String(colorless), colorClass: "mana-colorless" });
  return pips;
}

/** Vollständiger Vorrats-Text (Tooltip/Screenreader-Fallback zu `manaPoolPips`). */
export function formatManaPool(pool: Record<string, number>): string {
  const bits: string[] = [];
  for (const c of COLORS) {
    const n = pool[c] ?? 0;
    if (n > 0) bits.push(`${n}× ${COLOR_LABEL[c]}`);
  }
  if ((pool.colorless ?? 0) > 0) bits.push(`${pool.colorless}× farblos`);
  return bits.length ? bits.join(", ") : "leer";
}

export function manaCostPips(cost: ManaCost | undefined): ManaPip[] {
  if (!cost) return [];
  const pips: ManaPip[] = [];
  if (cost.generic) pips.push({ key: "generic", label: String(cost.generic), colorClass: "mana-colorless" });
  if (cost.x) pips.push({ key: "x", label: "X", colorClass: "mana-colorless" });
  for (const c of COLORS) {
    const n = cost[c] ?? 0;
    if (n > 0) pips.push({ key: c, label: String(n), colorClass: COLOR_CLASS[c] });
  }
  return pips;
}

export function typeLabel(def: CardDefinition): string {
  switch (def.type) {
    case "unit":
      return "Einheit";
    case "spell":
      return def.speed === "fast" ? "Spontanzauber" : "Hexerei";
    case "relic":
      return "Relikt";
    case "enchantment":
      return def.enchantKind === "aura" ? "Aura" : "Verzauberung";
    case "terrain":
      return "Terrain";
    default:
      return "Karte";
  }
}

export function subtypeLine(def: CardDefinition): string {
  const st = def.subtypes && def.subtypes.length > 0 ? ` — ${def.subtypes.join(", ")}` : "";
  return `${typeLabel(def)}${st}`;
}

/**
 * Anzeige-Regeltext einer Karte, mit Fallback: `rulesText` ist auf
 * CardDefinitionBase ein rein redundantes Anzeigefeld (s. cards.ts) und wird
 * vom Card-Designer nicht bei jeder Karte gepflegt - fehlt es, leiten wir es
 * stattdessen aus den `text`-Feldern der einzelnen `abilities` her (triggered/
 * activated/static), damit auch Karten ohne gepflegtes `rulesText` ihre echte
 * Fähigkeit anzeigen (Nutzer-Feedback: z.B. "core.ashclaim-shrine" hatte gar
 * keinen sichtbaren Regeltext, obwohl die Fähigkeit einen `text` trägt).
 * `kind: "keyword"`-Einträge werden bewusst übersprungen - die erscheinen
 * bereits separat als Keyword-Badge (s. `effectiveKeywords`), ein Duplikat
 * hier wäre redundant. Spells ohne eigenes `abilities`-Array (nur `effects`/
 * `modes`) haben ohne gepflegtes `rulesText` weiterhin keinen Fallback - das
 * ist ein Karteninhalts-Lücke, kein Anzeigeproblem.
 */
export function effectiveRulesText(def: CardDefinition): string | undefined {
  if (def.rulesText) return def.rulesText;
  if (!("abilities" in def) || !def.abilities) return undefined;
  const texts = def.abilities
    .filter((a) => a.kind !== "keyword")
    .map((a) => a.text)
    .filter((t): t is string => !!t);
  return texts.length > 0 ? texts.join(" ") : undefined;
}

/**
 * CSS-Klasse für die Regeltext-Box, abhängig von der Textlänge - "je länger
 * der Text, desto kompakter der Satz", damit er in den Kartenrahmen passt.
 *
 * Hintergrund (Spielerbericht 2026-07-24: "manche Karten haben einen zu langen
 * Text für ihr Kartenfenster und enden unfertig"): `.card-frame-text` hatte
 * einen harten `-webkit-line-clamp: 5` bei fester Schriftgröße. Der längste
 * Regeltext im Set hat 158 Zeichen, was bei ~18 Zeichen pro Zeile auf einer
 * 118px-Kachel ~9 Zeilen ergibt - die Karte schnitt mitten im Satz ab.
 *
 * Bewusst eine reine LÄNGEN-Heuristik statt echter Textmessung: Die Kacheln
 * werden bei jedem Store-Update neu gebaut (s. render.ts), eine Messung pro
 * Karte würde dabei jedes Mal ein Layout erzwingen. Die drei Stufen sind an
 * den tatsächlichen Längen im Set kalibriert (153 Regeltexte: 140 unter 80
 * Zeichen, 10 zwischen 80 und 120, 3 darüber).
 *
 * Genutzt an allen drei Stellen, die `.card-frame-text` rendern (cardTile.ts,
 * handCard.ts, deckBuilder.ts) - die Kartenbreiten unterscheiden sich zwar,
 * die Staffelung greift aber überall in dieselbe Richtung.
 */
export function rulesTextDensityClass(rulesText: string): string {
  if (rulesText.length > 120) return "card-frame-text card-frame-text-xlong";
  if (rulesText.length > 80) return "card-frame-text card-frame-text-long";
  return "card-frame-text";
}

export function effectivePT(state: GameState, pool: CardPool, instanceId: InstanceId): { power: number; toughness: number } {
  return computeEffectiveStats(state, pool, instanceId);
}

export function effectiveKeywords(state: GameState, pool: CardPool, instanceId: InstanceId): string[] {
  return Array.from(computeEffectiveKeywords(state, pool, instanceId)).map((k) => KEYWORD_LABEL[k] ?? k);
}

export function counterSummary(counters: Record<string, number>): string {
  const entries = Object.entries(counters).filter(([, n]) => n !== 0);
  if (entries.length === 0) return "";
  return entries.map(([type, n]) => `${type}: ${n > 0 ? "+" : ""}${n}`).join(", ");
}
