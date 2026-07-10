/**
 * Kompakte Kartendarstellung für Battlefield/Graveyard/Stack: klassisches
 * Kartenrahmen-Layout (Kopfzeile Name/Kosten, Bildfläche als reine Farbfläche
 * je Manafarbe, Typzeile, Regeltext + Status-Badges, P/T-Kasten bei Einheiten
 * inkl. Marken/statischer Effekte), Tapped-Status, Counter, Keywords.
 */

import type { CardPool, GameState, InstanceId } from "../../model";
import {
  cardDef,
  counterSummary,
  dominantColorClass,
  effectiveKeywords,
  effectivePT,
  subtypeLine,
} from "../cardInfo";
import { h, text } from "../h";
import { manaCostBadge } from "./manaCost";

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
  const cost = "cost" in def ? def.cost : undefined;
  const classes = ["card-tile", dominantColorClass(cost ?? {})];
  if (ps?.tapped) classes.push("tapped");
  if (opts.targetable) classes.push("targetable");
  if (opts.selected) classes.push("selected");
  if (opts.hinted) classes.push("hinted");

  const statusBadges: (Node | string | false | undefined)[] = [];
  if (ps) {
    const counters = counterSummary(ps.counters);
    if (counters) statusBadges.push(h("span", { class: "card-tile-counters" }, [text(counters)]));
    if (ps.tapped) statusBadges.push(h("span", { class: "card-tile-tapped-badge" }, [text("getappt")]));
    if (ps.summoningSick) statusBadges.push(h("span", { class: "card-tile-sick-badge" }, [text("Beschwörungskrankheit")]));
    if (ps.attachedTo) statusBadges.push(h("span", { class: "card-tile-attached" }, [text("angelegt")]));
    if (ps.combat?.role === "attacker") statusBadges.push(h("span", { class: "card-tile-combat" }, [text("greift an")]));
    if (ps.combat?.role === "blocker") statusBadges.push(h("span", { class: "card-tile-combat" }, [text("blockt")]));
  }
  const kws = effectiveKeywords(state, pool, instanceId);
  if (kws.length > 0) {
    statusBadges.push(h("span", { class: "card-tile-keywords" }, [text(kws.join(", "))]));
  }

  const frameChildren: (Node | string | false | undefined)[] = [
    h("div", { class: "card-frame-art" }),
    h("div", { class: "card-frame-type" }, [text(subtypeLine(def))]),
  ];
  if (def.rulesText || statusBadges.length > 0) {
    frameChildren.push(
      h("div", { class: "card-frame-text-box" }, [
        def.rulesText ? h("div", { class: "card-frame-text" }, [text(def.rulesText)]) : undefined,
        statusBadges.length > 0 ? h("div", { class: "card-frame-status" }, statusBadges) : undefined,
      ]),
    );
  }
  if (def.type === "unit") {
    // Effektive Werte (Marken/statische Effekte) nur auf dem Battlefield sinnvoll
    // (computeEffectiveStats braucht PermanentState) - im Graveyard/Exil zeigen
    // wir die Basiswerte der Karte.
    const { power, toughness } = ps ? effectivePT(state, pool, instanceId) : { power: def.power, toughness: def.toughness };
    frameChildren.push(h("div", { class: "card-frame-pt card-tile-pt" }, [text(`${power}/${toughness}`)]));
  }

  return h(
    "div",
    {
      class: classes.join(" "),
      title: def.rulesText ?? def.name,
      onclick: opts.onClick as ((ev: Event) => void) | undefined,
    },
    [
      h("div", { class: "card-frame-header" }, [
        h("div", { class: "card-frame-name card-tile-name" }, [text(def.name)]),
        cost ? manaCostBadge(cost) : undefined,
      ]),
      h("div", { class: "card-frame-frame" }, frameChildren),
    ],
  );
}
