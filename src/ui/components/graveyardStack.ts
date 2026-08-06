/**
 * Eingeklappte Friedhof-Darstellung + zugehöriges Popover (Spielerbericht:
 * "Friedhof zeigt jede Karte einzeln in voller Größe, verschwendet viel
 * Platz für eine Zone, die selten im Detail inspiziert wird").
 *
 * Struktureller Zwilling zweier bestehender Muster, bewusst wiederverwendet
 * statt neu erfunden (s. Auftrag):
 * - Stapel-Optik mit Zahl-Badge: wie components/handCard.ts#hiddenHandStack
 *   (`.hand-card-hidden-stack-multi`/`.hand-card-hidden-stack-count`, s.
 *   style.css) - ANDERS als dort zeigt die Kachel hier aber das ECHTE
 *   Kartenbild der obersten/zuletzt hinzugekommenen Karte statt eines
 *   Kartenrückens: der Friedhof ist - anders als die verdeckte Hand -
 *   öffentliche Information (jeder Spieler darf jederzeit hineinsehen).
 * - Klick-zu-Popover: wie components/keywordGlossaryPanel.ts#keywordGlossaryPanel
 *   (Backdrop mit `onclick = onClose`, inneres Panel stoppt die Klick-
 *   Propagation, damit ein Klick INS Panel es nicht versehentlich schließt).
 */

import type { CardPool, GameState, InstanceId } from "../../model";
import { h, text } from "../h";
import { cardTile } from "./cardTile";

/**
 * Eingeklappte Stapel-Kachel für einen NICHT-leeren Friedhof - zeigt die
 * oberste (zuletzt hinzugekommene) Karte als volle `cardTile()` plus ein
 * Zahl-Badge, sobald mehr als eine Karte im Friedhof liegt. Klick öffnet das
 * volle Popover (`graveyardPopoverPanel` unten) - der leere Fall (0 Karten)
 * wird bewusst NICHT hier behandelt, s. render.ts#graveyardZone.
 */
export function graveyardStackTile(
  state: GameState,
  pool: CardPool,
  topInstanceId: InstanceId,
  count: number,
  onClick: () => void,
): HTMLElement {
  const tile = cardTile(state, pool, topInstanceId);
  const classes = ["graveyard-stack"];
  if (count > 1) classes.push("hand-card-hidden-stack-multi");
  return h(
    "div",
    { class: classes.join(" "), "data-testid": "graveyard-stack-tile", onclick: onClick },
    [tile, count > 1 ? h("div", { class: "hand-card-hidden-stack-count" }, [text(String(count))]) : undefined],
  );
}

/**
 * Vollständige Friedhof-Liste als Popover (Backdrop + Panel, s.
 * Dateikommentar) - `cardInstanceIds` in der Reihenfolge "zuletzt
 * hinzugekommen zuerst" (spiegelt die eingeklappte Kachel, die ebenfalls die
 * oberste/neueste Karte vorn zeigt), volle `cardTile()`-Größe in einem
 * scrollbaren Grid (kein Ziel-/Klick-Verhalten auf den einzelnen Karten -
 * der Friedhof hat aktuell keine Einzelkarten-Interaktion).
 */
export function graveyardPopoverPanel(
  state: GameState,
  pool: CardPool,
  cardInstanceIds: readonly InstanceId[],
  title: string,
  onClose: () => void,
): HTMLElement {
  const orderedIds = [...cardInstanceIds].reverse();
  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "graveyard-popover", onclick: onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel graveyard-popover-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text(title)]),
            h("button", { class: "btn btn-cancel btn-small", onclick: onClose }, [text("Schließen")]),
          ]),
          h(
            "div",
            { class: "graveyard-popover-grid" },
            orderedIds.map((id) => cardTile(state, pool, id)),
          ),
        ],
      ),
    ],
  );
}
