/**
 * Deck-Analyse-Bereich im Deckbau-Screen: Mana-Kurve, Farbverteilung und
 * Typverteilung der aktuell zusammengestellten Deckliste. Reine Ableitung
 * aus `pool` + `decklist` bei JEDEM Aufruf (kein eigener State, keine
 * Persistenz) - exakt dasselbe Prinzip wie `deckValidation.ts#validateDecklist`,
 * das der Deckbau-Screen ohnehin schon bei jedem Voll-Rerender neu aufruft
 * (s. `store.ts`-Dateikommentar: Klick auf +/- löst einen kompletten
 * Rerender aus, +/- Änderungen sind also automatisch "live").
 *
 * Reine CSS-Balken statt Chart-Bibliothek (s. docs/frontend-status.md,
 * bewusst keine zusätzlichen Frontend-Abhängigkeiten für dieses
 * Hobbyprojekt). Farbthemen/Klassen werden 1:1 von `cardInfo.ts`
 * (`dominantColorKey`/`COLOR_LABEL`) und den bereits vorhandenen `--mana-*`-
 * CSS-Variablen übernommen - keine eigene Farblogik, keine Regellogik-
 * Duplikation.
 */

import type { CardPool, CardType, ManaColor, ManaCost } from "../../model";
import { COLOR_CLASS, COLOR_LABEL, dominantColorKey } from "../cardInfo";
import { h, text } from "../h";

const MANA_CURVE_BUCKET_LABELS = ["0", "1", "2", "3", "4", "5", "6+"];

const TYPE_LABELS: Record<CardType, string> = {
  unit: "Einheiten",
  spell: "Zauber",
  relic: "Relikte",
  enchantment: "Verzauberungen",
  terrain: "Terrains",
};

// Feste Anzeige-Reihenfolge (nicht alphabetisch) - entspricht der Reihenfolge
// der TYPE_OPTIONS/COLOR_OPTIONS-Filter im Deckbau-Screen (deckBuilder.ts),
// damit beide Ansichten konsistent wirken.
const TYPE_ORDER: CardType[] = ["unit", "spell", "relic", "enchantment", "terrain"];
const COLOR_ORDER: ManaColor[] = ["flame", "tide", "wild", "light", "void"];

interface DeckAnalysisData {
  totalCards: number;
  /** Index 0..5 = exakter Manawert, Index 6 = "6 oder mehr". */
  manaCurve: number[];
  colorCounts: Record<ManaColor | "colorless", number>;
  typeCounts: Partial<Record<CardType, number>>;
  /** Anzahl Karten mit X-Kosten - s. `manaValue`-Kommentar, warum sie separat gezählt werden. */
  xCostCount: number;
}

/**
 * Gesamt-Manawert einer Karte: `generic` + Summe aller Farbwerte
 * (abilities.ts#ManaCost, Zeile 24-43). X-Kosten (`cost.x`) fließen bewusst
 * NICHT als numerischer Wert ein - X wird laut abilities.ts erst beim
 * Casten gewählt, ist beim Deckbau also unbekannt/unbegrenzt und würde die
 * Kurve sonst entweder künstlich auf 0 zwingen oder eine willkürliche
 * Annahme treffen. Stattdessen landet die Karte mit ihrem FIXEN Anteil
 * (generic + Farben, meist 0-2) im entsprechenden Bucket, UND wird
 * zusätzlich separat gezählt (`xCostCount`) - die Kurve zeigt so weiterhin
 * einen sinnvollen Wert, verliert die X-Karten aber nicht "unsichtbar",
 * sondern weist unterhalb der Kurve explizit auf sie hin.
 */
function manaValue(cost: ManaCost): number {
  const colorSum = (cost.flame ?? 0) + (cost.tide ?? 0) + (cost.wild ?? 0) + (cost.light ?? 0) + (cost.void ?? 0);
  return (cost.generic ?? 0) + colorSum;
}

function computeDeckAnalysis(pool: CardPool, decklist: Record<string, number>): DeckAnalysisData {
  const manaCurve = [0, 0, 0, 0, 0, 0, 0];
  const colorCounts: Record<ManaColor | "colorless", number> = {
    flame: 0,
    tide: 0,
    wild: 0,
    light: 0,
    void: 0,
    colorless: 0,
  };
  const typeCounts: Partial<Record<CardType, number>> = {};
  let totalCards = 0;
  let xCostCount = 0;

  for (const [cardId, count] of Object.entries(decklist)) {
    if (count <= 0) continue;
    const def = pool[cardId];
    if (!def) continue; // unbekannte/entfernte Karten-ID - defensiv überspringen, keine Regelvalidierung hier

    totalCards += count;
    typeCounts[def.type] = (typeCounts[def.type] ?? 0) + count;
    colorCounts[dominantColorKey(def)] += count;

    // Mana-Kurve: NUR Karten mit einem echten ManaCost-Feld (unit/spell/
    // relic/enchantment, s. cards.ts). Terrains haben strukturell KEIN
    // `cost`-Feld (sie kosten nichts, s. cards.ts#TerrainCard-Kommentar
    // "Terrains kosten nichts und gehen nicht über den Stack") - sie in
    // Bucket "0" einzusortieren würde die Kurve mit der reinen Terrain-Anzahl
    // verfälschen statt echte 0-Mana-Sprüche zu zeigen. Sie tauchen trotzdem
    // in der Typ- UND (als "Farblos") in der Farbverteilung oben auf.
    if (!("cost" in def) || !def.cost) continue;
    if (def.cost.x) xCostCount += count;
    const bucketIndex = Math.min(manaValue(def.cost), 6);
    manaCurve[bucketIndex] = (manaCurve[bucketIndex] ?? 0) + count;
  }

  return { totalCards, manaCurve, colorCounts, typeCounts, xCostCount };
}

export interface DeckAnalysisOptions {
  pool: CardPool;
  decklist: Record<string, number>;
  open: boolean;
  onToggleOpen: () => void;
}

export function deckAnalysisPanel(opts: DeckAnalysisOptions): HTMLElement {
  const data = computeDeckAnalysis(opts.pool, opts.decklist);

  return h("div", { class: "deckbuilder-analysis" }, [
    h(
      "button",
      {
        class: "btn btn-small deckbuilder-analysis-toggle",
        onclick: opts.onToggleOpen,
        "data-testid": "deck-analysis-toggle",
      },
      [text(opts.open ? "Deck-Analyse ausblenden ▲" : "Deck-Analyse anzeigen ▼")],
    ),
    opts.open
      ? h("div", { class: "deckbuilder-analysis-body", "data-testid": "deck-analysis-body" }, [
          manaCurveSection(data),
          colorSection(data),
          typeSection(data),
        ])
      : undefined,
  ]);
}

function barPercent(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((count / max) * 100);
}

function manaCurveSection(data: DeckAnalysisData): HTMLElement {
  const maxCount = Math.max(1, ...data.manaCurve);
  return h("div", { class: "deck-analysis-section" }, [
    h("div", { class: "deck-analysis-section-title" }, [text("Mana-Kurve")]),
    h(
      "div",
      { class: "deck-analysis-curve", "data-testid": "deck-analysis-curve" },
      data.manaCurve.map((count, i) =>
        h("div", { class: "deck-analysis-curve-col" }, [
          h("div", { class: "deck-analysis-curve-count" }, [text(String(count))]),
          h("div", { class: "deck-analysis-curve-bar-track" }, [
            h("div", {
              class: "deck-analysis-curve-bar",
              style: `height: ${barPercent(count, maxCount)}%`,
            }),
          ]),
          h("div", { class: "deck-analysis-curve-bucket-label" }, [text(MANA_CURVE_BUCKET_LABELS[i]!)]),
        ]),
      ),
    ),
    data.xCostCount > 0
      ? h("div", { class: "deck-analysis-x-note", "data-testid": "deck-analysis-x-note" }, [
          text(
            `+${data.xCostCount} Karte(n) mit X-Kosten - oben nur mit ihrem Fixanteil einsortiert (X selbst ist erst beim Casten bekannt).`,
          ),
        ])
      : undefined,
  ]);
}

function colorSection(data: DeckAnalysisData): HTMLElement {
  const rows: Array<{ key: ManaColor | "colorless"; label: string; colorClass: string }> = [
    ...COLOR_ORDER.map((c) => ({ key: c as ManaColor | "colorless", label: COLOR_LABEL[c], colorClass: COLOR_CLASS[c] })),
    { key: "colorless", label: "Farblos", colorClass: "mana-colorless" },
  ];
  const maxCount = Math.max(1, ...rows.map((r) => data.colorCounts[r.key]));
  return h("div", { class: "deck-analysis-section" }, [
    h("div", { class: "deck-analysis-section-title" }, [text("Farbverteilung")]),
    h(
      "div",
      { class: "deck-analysis-bar-list", "data-testid": "deck-analysis-colors" },
      rows.map((r) => {
        const count = data.colorCounts[r.key];
        return h("div", { class: "deck-analysis-bar-row" }, [
          h("span", { class: "deck-analysis-bar-label" }, [text(r.label)]),
          h("div", { class: "deck-analysis-bar-track" }, [
            h("div", {
              class: `deck-analysis-bar-fill ${r.colorClass}`,
              style: `width: ${barPercent(count, maxCount)}%`,
            }),
          ]),
          h("span", { class: "deck-analysis-bar-count" }, [text(String(count))]),
        ]);
      }),
    ),
  ]);
}

function typeSection(data: DeckAnalysisData): HTMLElement {
  const maxCount = Math.max(1, ...TYPE_ORDER.map((t) => data.typeCounts[t] ?? 0));
  return h("div", { class: "deck-analysis-section" }, [
    h("div", { class: "deck-analysis-section-title" }, [text("Typverteilung")]),
    h(
      "div",
      { class: "deck-analysis-bar-list", "data-testid": "deck-analysis-types" },
      TYPE_ORDER.map((t) => {
        const count = data.typeCounts[t] ?? 0;
        return h("div", { class: "deck-analysis-bar-row" }, [
          h("span", { class: "deck-analysis-bar-label" }, [text(TYPE_LABELS[t])]),
          h("div", { class: "deck-analysis-bar-track" }, [
            h("div", {
              class: "deck-analysis-bar-fill deck-analysis-bar-fill-neutral",
              style: `width: ${barPercent(count, maxCount)}%`,
            }),
          ]),
          h("span", { class: "deck-analysis-bar-count" }, [text(String(count))]),
        ]);
      }),
    ),
  ]);
}
