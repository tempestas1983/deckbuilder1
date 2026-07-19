/**
 * Hervorhebung erkannter Keyword-Wörter innerhalb der Regeltext-Box
 * (`.card-frame-text`, gemeinsame Stelle für Hand/Battlefield/Graveyard/
 * Stack/Deckbau-Pool - s. handCard.ts/cardTile.ts/deckBuilder.ts).
 *
 * Jedes erkannte Wort (z.B. "Todesberührung" in `core.abyssal-lurker`) wird
 * als eigener `<span>` gerendert: ein natives `title`-Attribut liefert die
 * Erklärung als Hover-Tooltip, ein Klick öffnet zusätzlich eine kleine,
 * eigenständige Klick-Sprechblase (s. render.ts#keywordPopoverBubble) - für
 * Touch-Geräte bzw. falls Hover nicht entdeckt wird (Auftrag Punkt 2).
 *
 * Bewusste Layering-Entscheidung: Diese Funktion importiert `store.ts`
 * DIREKT (statt die beiden Store-Funktionen als Props durch render.ts ->
 * cardTile/handCard/deckBuilder durchzureichen, wie es sonst für
 * Interaktionen/Callbacks in diesem Projekt üblich ist). Anders als z.B.
 * `onConcede`/`dispatch` ist "welches Keyword-Popup ist gerade offen" ein
 * rein globaler, karten- und spielzustandsunabhängiger Anzeige-Zustand,
 * identisch für JEDE Karte an JEDER Stelle im UI - das Durchreichen als Prop
 * durch alle ~12 bestehenden Aufrufstellen von cardTile/handCard/poolRow
 * hätte nur Boilerplate ohne Mehrwert erzeugt. Vergleichbar mit
 * `cardInfo.ts`, das ebenfalls direkt Engine-Funktionen importiert statt sie
 * durchzureichen.
 */

import { tokenizeRulesText } from "../keywordGlossary";
import { getOpenKeywordGlossary, toggleKeywordGlossary } from "../store";
import { h, text } from "../h";

/** Baut den Inhalt der Regeltext-Box mit hervorgehobenen, anklickbaren Keyword-Wörtern. */
export function ruleTextNodes(rulesText: string): (Node | string)[] {
  const tokens = tokenizeRulesText(rulesText);
  const openKeyword = getOpenKeywordGlossary();
  const nodes: (Node | string)[] = [];
  for (const token of tokens) {
    if (!token.entry) {
      nodes.push(text(token.text));
      continue;
    }
    const entry = token.entry;
    const isOpen = openKeyword === entry.keyword;
    nodes.push(
      h(
        "span",
        {
          class: "keyword-highlight" + (isOpen ? " keyword-highlight-active" : ""),
          title: entry.explanation,
          "data-testid": `keyword-highlight-${entry.keyword}`,
          onclick: ((ev: Event) => {
            // Karten-Kacheln/-Zeilen haben teils einen eigenen onClick (Ziel-
            // auswahl, Combat-Deklaration, Deckbau +/-) - ein Klick auf das
            // Keyword-Wort soll NUR das Glossar öffnen, nicht zusätzlich die
            // Karte selbst anklicken.
            ev.stopPropagation();
            toggleKeywordGlossary(entry.keyword);
          }) as (ev: Event) => void,
        },
        [text(token.text)],
      ),
    );
  }
  return nodes;
}
