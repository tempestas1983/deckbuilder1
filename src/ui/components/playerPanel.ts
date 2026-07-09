/**
 * Spieler-Kopfzeile: Leben, Manapool, Zonen-Größen (Library/Graveyard/Exile),
 * sowie Status-Badges (aktiver Spieler, Priority, ausstehende Entscheidung).
 * Optional als Ziel klickbar (z.B. "Feuerstoß" auf den Gegner).
 */

import type { GameState, PlayerId } from "../../model";
import { COLOR_LABEL } from "../cardInfo";
import { h, text } from "../h";

export interface PlayerPanelOptions {
  targetable?: boolean;
  onClick?: () => void;
}

export function playerPanel(state: GameState, playerId: PlayerId, opts: PlayerPanelOptions = {}): HTMLElement {
  const p = state.players[playerId];
  const badges: HTMLElement[] = [];
  if (state.activePlayer === playerId) badges.push(h("span", { class: "badge badge-active" }, [text("am Zug")]));
  if (state.priorityPlayer === playerId) badges.push(h("span", { class: "badge badge-priority" }, [text("Priority")]));
  if (state.pendingDecision?.player === playerId) {
    badges.push(h("span", { class: "badge badge-decision" }, [text("muss entscheiden")]));
  }
  if (p.hasLost) badges.push(h("span", { class: "badge badge-lost" }, [text("verloren")]));

  const manaBits = (["flame", "tide", "wild", "light", "void"] as const)
    .map((c) => (p.manaPool[c] > 0 ? `${p.manaPool[c]}× ${COLOR_LABEL[c]}` : undefined))
    .filter((x): x is string => !!x);
  if (p.manaPool.colorless > 0) manaBits.push(`${p.manaPool.colorless}× farblos`);

  const classes = ["player-panel"];
  if (opts.targetable) classes.push("targetable");

  return h(
    "div",
    { class: classes.join(" "), onclick: opts.onClick as ((ev: Event) => void) | undefined },
    [
      h("div", { class: "player-panel-head" }, [
        h("span", { class: "player-panel-name" }, [text(playerId)]),
        ...badges,
      ]),
      h("div", { class: "player-panel-life" }, [text(`❤ ${p.life}`)]),
      h("div", { class: "player-panel-mana" }, [text(manaBits.length ? `Mana: ${manaBits.join(", ")}` : "Mana: leer")]),
      h("div", { class: "player-panel-zones" }, [
        text(`Hand ${p.hand.length} · Bibliothek ${p.library.length} · Friedhof ${p.graveyard.length} · Exil ${p.exile.length}`),
      ]),
    ],
  );
}
