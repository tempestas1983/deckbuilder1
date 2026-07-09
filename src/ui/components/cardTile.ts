/**
 * Kompakte Kartendarstellung für Battlefield/Graveyard/Stack: Name, Kosten,
 * P/T (falls Unit, inkl. Marken/statischer Effekte), Tapped-Status, Counter,
 * Keywords.
 */

import type { CardPool, GameState, InstanceId } from "../../model";
import {
  cardDef,
  counterSummary,
  dominantColorClass,
  effectiveKeywords,
  effectivePT,
  formatManaCost,
} from "../cardInfo";
import { h, text } from "../h";

export interface CardTileOptions {
  /** true = Element bekommt eine "wählbar"-Optik + onClick. */
  targetable?: boolean;
  onClick?: () => void;
  /** true = zusätzlich als "ausgewählt" markieren (z.B. Combat-Auswahl). */
  selected?: boolean;
  /** true = zusätzlich hervorheben (z.B. laut getLegalActions aktuell legal). */
  hinted?: boolean;
}

export function cardTile(
  state: GameState,
  pool: CardPool,
  instanceId: InstanceId,
  opts: CardTileOptions = {},
): HTMLElement {
  const inst = state.cards[instanceId];
  if (!inst) throw new Error(`Unbekannte CardInstance: ${instanceId}`);
  const def = cardDef(pool, state, instanceId);
  const ps = inst.permanentState;
  const classes = ["card-tile", dominantColorClass("cost" in def ? def.cost : {})];
  if (ps?.tapped) classes.push("tapped");
  if (opts.targetable) classes.push("targetable");
  if (opts.selected) classes.push("selected");
  if (opts.hinted) classes.push("hinted");

  const lines: (Node | string | false | undefined)[] = [
    h("div", { class: "card-tile-name" }, [text(def.name)]),
  ];

  if (def.type === "unit") {
    // Effektive Werte (Marken/statische Effekte) nur auf dem Battlefield sinnvoll
    // (computeEffectiveStats braucht PermanentState) - im Graveyard/Exil zeigen
    // wir die Basiswerte der Karte.
    const { power, toughness } = ps ? effectivePT(state, pool, instanceId) : { power: def.power, toughness: def.toughness };
    lines.push(h("div", { class: "card-tile-pt" }, [text(`${power}/${toughness}`)]));
  }
  if ("cost" in def) {
    lines.push(h("div", { class: "card-tile-cost" }, [text(formatManaCost(def.cost))]));
  }
  const kws = effectiveKeywords(state, pool, instanceId);
  if (kws.length > 0) {
    lines.push(h("div", { class: "card-tile-keywords" }, [text(kws.join(", "))]));
  }
  if (ps) {
    const counters = counterSummary(ps.counters);
    if (counters) lines.push(h("div", { class: "card-tile-counters" }, [text(counters)]));
    if (ps.tapped) lines.push(h("div", { class: "card-tile-tapped-badge" }, [text("getappt")]));
    if (ps.summoningSick) lines.push(h("div", { class: "card-tile-sick-badge" }, [text("Beschwörungskrankheit")]));
    if (ps.attachedTo) lines.push(h("div", { class: "card-tile-attached" }, [text("angelegt")]));
    if (ps.combat?.role === "attacker") lines.push(h("div", { class: "card-tile-combat" }, [text("greift an")]));
    if (ps.combat?.role === "blocker") lines.push(h("div", { class: "card-tile-combat" }, [text("blockt")]));
  }
  if (def.rulesText) {
    lines.push(h("div", { class: "card-tile-text" }, [text(def.rulesText)]));
  }

  return h(
    "div",
    {
      class: classes.join(" "),
      title: def.rulesText ?? def.name,
      onclick: opts.onClick as ((ev: Event) => void) | undefined,
    },
    lines,
  );
}
