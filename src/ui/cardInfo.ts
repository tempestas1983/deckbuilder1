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
