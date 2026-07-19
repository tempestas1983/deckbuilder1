/**
 * Globales Keyword-Nachschlagewerk (Auftrag Punkt 3): unabhängig vom
 * Tutorial-Modus, jederzeit über einen eigenen "Schlüsselwörter"-Button
 * erreichbar - in JEDER Partie (Hotseat, gegen die KI, Tutorial) UND im
 * Deckbau-Screen. Lehnt sich strukturell an `tutorialOverlay.ts` an
 * (Button + Backdrop-Panel), ist aber ein komplett eigener, vom Tutorial
 * unabhängiger Baustein - listet immer ALLE 9 Keywords aus
 * `src/ui/keywordGlossary.ts`, unabhängig vom aktuellen Spielzustand.
 *
 * Zusätzlich: `keywordPopoverBubble`, die kleine Klick-Sprechblase für EIN
 * einzelnes Keyword (ausgelöst durch Klick auf ein hervorgehobenes
 * Keyword-Wort im Kartentext, s. components/keywordText.ts) - visuell an
 * `tutorialTipBubble` angelehnt, aber als fixiertes Overlay (funktioniert
 * unabhängig davon, wo im Board/Deckbau-Pool das Keyword-Wort gerade sitzt,
 * ohne eine Positionsberechnung relativ zum angeklickten Wort zu brauchen -
 * die Kartenrahmen haben `overflow: hidden`, ein direkt am Wort verankertes
 * Popover würde dort abgeschnitten).
 */

import type { Keyword } from "../../model";
import { KEYWORD_GLOSSARY, KEYWORD_GLOSSARY_BY_KEYWORD } from "../keywordGlossary";
import { h, text } from "../h";

export function keywordGlossaryButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "btn tutorial-help-btn",
      title: "Erklärungen zu allen Schlüsselwörtern (Eile, Flieger, Todesberührung, ...)",
      onclick: onClick,
      "data-testid": "keyword-glossary-btn",
    },
    [text("? Schlüsselwörter")],
  );
}

export function keywordGlossaryPanel(onClose: () => void): HTMLElement {
  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "keyword-glossary-panel", onclick: onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Schlüsselwörter")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: onClose }, [text("Schließen")]),
          ]),
          h(
            "div",
            { class: "tutorial-help-list" },
            KEYWORD_GLOSSARY.map((entry) =>
              h("div", { class: "tutorial-help-entry" }, [
                h("div", { class: "tutorial-help-entry-title" }, [text(entry.title)]),
                h("div", { class: "tutorial-help-entry-body" }, [text(entry.explanation)]),
              ]),
            ),
          ),
        ],
      ),
    ],
  );
}

/** Kleine Klick-Sprechblase für EIN Keyword (s. components/keywordText.ts). */
export function keywordPopoverBubble(keyword: Keyword, onClose: () => void): HTMLElement {
  const entry = KEYWORD_GLOSSARY_BY_KEYWORD[keyword];
  return h(
    "div",
    { class: "keyword-popover-backdrop", "data-testid": "keyword-popover", onclick: onClose },
    [
      h(
        "div",
        {
          class: "keyword-popover-bubble",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-tip-title" }, [text(entry.title)]),
          h("div", { class: "tutorial-tip-body" }, [text(entry.explanation)]),
          h("button", { class: "btn btn-cancel btn-small keyword-popover-close-btn", onclick: onClose }, [text("Schließen")]),
        ],
      ),
    ],
  );
}
