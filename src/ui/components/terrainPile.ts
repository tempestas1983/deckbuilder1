/**
 * Eingeklappter "Terrain-Stapel" für das Battlefield.
 *
 * Spielerbericht 2026-07-24 (erste echte Partie): "Terrain werden schnell zu
 * viele und nehmen viel Platz weg. Da Terrain nur zum Mana-Machen gebraucht
 * wird, könnte man einen 'gestapelten' Terrain-Blick einbauen, der sich beim
 * Anklicken zu den einzelnen Terrain-Karten aufklappt, die man dann tappen
 * kann. Das würde das Battlefield entrümpeln."
 *
 * Genau das ist diese Kachel: EIN Element anstelle von N Terrain-Kacheln,
 * solange man die einzelnen Karten nicht wirklich braucht. Sie ersetzt die
 * Terrain-Gruppe aber nur optisch - `render.ts#battlefieldZone` baut im
 * aufgeklappten Zustand wieder exakt dieselben `cardTile()`-Kacheln wie zuvor,
 * mit unveränderter Ziel-/Klick-/Tap-Logik. Hier steckt bewusst KEINE
 * Spiellogik: was ein Terrain darf, entscheidet weiterhin allein
 * getLegalActions/applyAction.
 *
 * Was der Stapel im zugeklappten Zustand zeigen MUSS, damit das Zuklappen
 * keine Information kostet:
 * - wie viele Terrains insgesamt (die Kartenrücken-Optik + die große Zahl),
 * - wie viele davon noch ungetappt sind (die einzige spielrelevante Zahl),
 * - welche FARBEN unter den ungetappten sind (sonst müsste man jedes Mal
 *   aufklappen, nur um zu sehen, ob die gebrauchte Farbe überhaupt noch da
 *   ist) - dieselben `mana-pip`-Symbole wie Kartenkosten und Manavorrat, s.
 *   cardInfo.ts#manaPoolPips.
 */

import type { CardDefinition, InstanceId, ManaColor } from "../../model";
import { COLOR_CLASS, COLOR_LABEL, manaColorsProduced } from "../cardInfo";
import { h, text } from "../h";

export interface TerrainPileEntry {
  instanceId: InstanceId;
  def: CardDefinition;
  tapped: boolean;
}

export interface TerrainPileOptions {
  /** Klick auf den Stapel - klappt ihn auf (store.ts#toggleTerrainPile). */
  onToggle: () => void;
  /**
   * true = dieser Stapel gehört dem lokalen Spieler. Nur dann lohnt der
   * Hinweis aufs Tappen; beim Gegner ist der Stapel reine Information.
   */
  own: boolean;
}

/** Anzahl je Farbe unter den ÜBERGEBENEN (i.d.R. ungetappten) Terrains. */
function colorCounts(entries: TerrainPileEntry[]): Array<{ colorClass: string; label: string; count: number }> {
  const counts = new Map<ManaColor | "colorless", number>();
  for (const entry of entries) {
    for (const color of manaColorsProduced(entry.def)) {
      counts.set(color, (counts.get(color) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries()).map(([color, count]) => ({
    colorClass: color === "colorless" ? "mana-colorless" : COLOR_CLASS[color],
    label: color === "colorless" ? "beliebig" : COLOR_LABEL[color],
    count,
  }));
}

export function terrainPile(entries: TerrainPileEntry[], opts: TerrainPileOptions): HTMLElement {
  const total = entries.length;
  const untapped = entries.filter((e) => !e.tapped);
  const pips = colorCounts(untapped);

  // Die Kartenrücken hinter der Zahl sind rein dekorativ (max. 3, damit die
  // Kachel bei 12 Terrains nicht breiter wird als bei 4) - die echte Anzahl
  // steht als Zahl daneben.
  const backs = Array.from({ length: Math.min(3, total) }, (_, i) =>
    h("span", { class: "terrain-pile-back", style: `--pile-index: ${i}` }),
  );

  const titleLines = [
    `${total} Terrain${total === 1 ? "" : "s"}, davon ${untapped.length} ungetappt.`,
    ...entries.map((e) => `${e.def.name}${e.tapped ? " (getappt)" : ""}`),
    opts.own ? "Anklicken zum Aufklappen - danach einzeln zum Mana-Erzeugen antippen." : "Anklicken zum Aufklappen.",
  ];

  return h(
    "button",
    {
      class: `terrain-pile${untapped.length === 0 ? " terrain-pile-exhausted" : ""}`,
      type: "button",
      title: titleLines.join("\n"),
      "data-terrain-count": String(total),
      "data-terrain-untapped": String(untapped.length),
      onclick: opts.onToggle,
    },
    [
      h("span", { class: "terrain-pile-stack" }, [
        ...backs,
        h("span", { class: "terrain-pile-count" }, [text(String(total))]),
      ]),
      h("span", { class: "terrain-pile-info" }, [
        h("span", { class: "terrain-pile-title" }, [text(total === 1 ? "Terrain" : "Terrains")]),
        h("span", { class: "terrain-pile-ready" }, [
          text(untapped.length > 0 ? `${untapped.length} bereit` : "alle getappt"),
        ]),
        pips.length > 0
          ? h(
              "span",
              { class: "terrain-pile-pips" },
              pips.map((p) =>
                h("span", { class: `mana-pip ${p.colorClass}`, title: `${p.count}× ${p.label}` }, [
                  text(String(p.count)),
                ]),
              ),
            )
          : undefined,
      ]),
      h("span", { class: "terrain-pile-hint" }, [text("aufklappen")]),
    ],
  );
}

/**
 * Gegenstück im aufgeklappten Zustand: kleine Leiste VOR den einzelnen
 * Terrain-Kacheln, die wieder einklappt. Bewusst eine eigene, schmale Kachel
 * statt eines Buttons irgendwo außerhalb der Reihe - sie steht damit genau
 * dort, wo vorher der Stapel war, und der Weg zurück ist derselbe Klickort
 * wie der Weg hin.
 */
export function terrainPileCollapseHandle(total: number, onToggle: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "terrain-pile terrain-pile-expanded",
      type: "button",
      title: `${total} Terrain${total === 1 ? "" : "s"} wieder zu einem Stapel zusammenklappen.`,
      onclick: onToggle,
    },
    [
      h("span", { class: "terrain-pile-collapse-icon" }, [text("«")]),
      h("span", { class: "terrain-pile-info" }, [
        h("span", { class: "terrain-pile-title" }, [text("Terrains")]),
        h("span", { class: "terrain-pile-hint" }, [text("einklappen")]),
      ]),
    ],
  );
}
