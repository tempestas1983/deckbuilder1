/**
 * Gemeinsamer Baustein für die Manakosten-Anzeige im neuen Kartenrahmen-Layout
 * (rechts in der Kopfzeile jeder Karte, s. style.css `.card-frame-*`) -
 * baut aus `cardInfo.ts#manaCostPips` (reine Daten) die eigentlichen
 * DOM-„Pips" (kleine farbige Kreise). Wird von handCard.ts, cardTile.ts und
 * deckBuilder.ts genutzt, damit die drei Kartendarstellungen nicht dieselbe
 * DOM-Bau-Logik dreifach duplizieren.
 */

import type { ManaCost } from "../../model";
import { formatManaCost, manaCostPips } from "../cardInfo";
import { h, text } from "../h";

export function manaCostBadge(cost: ManaCost | undefined): HTMLElement {
  const pips = manaCostPips(cost);
  return h(
    "div",
    { class: "card-frame-cost", title: formatManaCost(cost) },
    pips.map((pip) => h("span", { class: `mana-pip ${pip.colorClass}` }, [text(pip.label)])),
  );
}
