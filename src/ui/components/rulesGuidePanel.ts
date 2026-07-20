/**
 * "Anleitung" - vierter Hauptmenü-Button neben "Neues Spiel"/"Deck Builder"/
 * "Tutorial" (s. components/mainMenu.ts): ein Ort zum entspannten Nachlesen
 * von Kartentypen, Schlüsselwörtern und ein paar Spiel-/Deckbau-Tipps, OHNE
 * mitten in einer Partie zu stecken - anders als das Tutorial (geführte
 * Beispielpartie) rein statischer Lesestoff.
 *
 * Bewusst KEIN eigener `AppPhase`-Screen, sondern ein Panel-Overlay über dem
 * Hauptmenü, exakt nach demselben etablierten Muster wie musicPanel.ts/
 * keywordGlossaryPanel.ts/savedDecksPanel.ts (Backdrop + `.tutorial-help-*`-
 * Grundgerüst, Klick auf den Backdrop schließt, Klick INS Panel propagiert
 * nicht weiter) - einfacher, konsistent mit dem Rest des Projekts, leichter
 * rückbaubar als ein weiterer `AppPhase.kind`. Store-Zustand analog zu
 * `isKeywordGlossaryPanelOpen`/`toggleKeywordGlossaryPanel`, s.
 * store.ts#isRulesGuideOpen/toggleRulesGuide/closeRulesGuide.
 *
 * Inhalt (vier Abschnitte, wortwörtlich aus docs/rules-engine.md Abschnitt 1
 * "Grundbegriffe"/Kartentypen-Tabelle übernommen, keine neue Regellogik hier
 * - reine Anzeige):
 * - Kartentypen (Einheiten/Zauber/Relikte/Verzauberungen/Terrains)
 * - Schlüsselwörter: bindet `keywordGlossaryList` aus keywordGlossaryPanel.ts
 *   eingebettet ein (s. dortiger Dateikommentar) statt den Inhalt zu
 *   duplizieren oder ein zweites, verschachteltes Backdrop-Panel zu öffnen.
 * - Tipps & Tricks - Spiel
 * - Tipps & Tricks - Deckbau
 *
 * Eigene `.rules-guide-panel`-Zusatzklasse (breiter/höher als das normale
 * `.tutorial-help-panel`, s. style.css) - deutlich mehr Inhalt als die
 * übrigen Popover dieses Musters, braucht mehr Platz und eine eigene
 * Scrollfläche über alle vier Abschnitte hinweg statt nur pro Abschnitt.
 */

import { h, text } from "../h";
import { keywordGlossaryList } from "./keywordGlossaryPanel";

interface RulesGuideEntry {
  title: string;
  body: string;
}

const CARD_TYPE_ENTRIES: RulesGuideEntry[] = [
  {
    title: "Einheiten",
    body: "Deine Kreaturen auf dem Feld. Haben Stärke/Widerstandskraft, können angreifen und blocken, bleiben auf dem Feld bis sie sterben.",
  },
  {
    title: "Zauber",
    body: "Einmalige Effekte, wandern danach in den Friedhof. Zwei Geschwindigkeiten: Spontanzauber (jederzeit spielbar, auch im gegnerischen Zug - für schnelle Reaktionen) und Hexerei (nur im eigenen Hauptzug bei leerem Stack - der klassische \"große Zug\").",
  },
  {
    title: "Relikte",
    body: "Bleiben dauerhaft auf dem Feld, meist mit aktivierbaren oder passiven Fähigkeiten.",
  },
  {
    title: "Verzauberungen",
    body: "Dauerhafte Effekte auf dem Feld; manche (\"Auren\") werden gezielt an eine bestimmte Karte angelegt und wirken nur auf sie.",
  },
  {
    title: "Terrains",
    body: "Deine Manaquelle. Pro Zug darfst du genau eins spielen; getappt liefern sie Mana der jeweiligen Farbe. Gehen NICHT über den Stack (nicht konterbar, keine Reaktion möglich).",
  },
];

const GAMEPLAY_TIPS: string[] = [
  "Passe Priorität nicht gedankenlos durch: Spontanzauber lohnen sich oft erst als Reaktion auf den Gegner (z. B. Entfernung erst spielen, wenn er tatsächlich angreift).",
  "Achte auf die Mana-Farben deiner Terrains - ein Deck mit zu vielen Farben läuft leicht ins Leere, wenn die passenden Terrains fehlen.",
  "Wächter-Einheiten MÜSSEN blocken, wenn ein Block möglich ist - plane Angriffe entsprechend.",
  "Trampelschaden lohnt sich besonders gegen kleine Blocker: überschüssiger Schaden geht am Blocker vorbei direkt durch.",
];

const DECKBUILDING_TIPS: string[] = [
  "Nutze die Mana-Kurve im Deck-Analyse-Panel: zu viele teure Karten machen den Start langsam, zu wenige lassen dir spät die Optionen ausgehen.",
  "Bleib bei 2, höchstens 3 Farben - mehr Farben machen die Terrain-Basis unzuverlässig.",
  "Genug Terrains einplanen - Faustregel vieler Sammelkartenspiele: etwa 40% des Decks.",
  "Nutze die benannte Deck-Speicherfunktion, um mehrere Deck-Varianten zu vergleichen, statt immer dieselbe Liste zu überschreiben.",
];

function entryList(entries: RulesGuideEntry[]): HTMLElement {
  return h(
    "div",
    { class: "tutorial-help-list" },
    entries.map((entry) =>
      h("div", { class: "tutorial-help-entry" }, [
        h("div", { class: "tutorial-help-entry-title" }, [text(entry.title)]),
        h("div", { class: "tutorial-help-entry-body" }, [text(entry.body)]),
      ]),
    ),
  );
}

function tipList(tips: string[]): HTMLElement {
  return h(
    "ul",
    { class: "rules-guide-tip-list" },
    tips.map((tip) => h("li", { class: "rules-guide-tip" }, [text(tip)])),
  );
}

function section(heading: string, content: HTMLElement): HTMLElement {
  return h("div", { class: "rules-guide-section" }, [
    h("h4", { class: "rules-guide-section-title" }, [text(heading)]),
    content,
  ]);
}

export function rulesGuidePanel(onClose: () => void): HTMLElement {
  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "rules-guide-panel", onclick: onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel rules-guide-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Anleitung")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: onClose }, [text("Schließen")]),
          ]),
          h("div", { class: "rules-guide-body", "data-testid": "rules-guide-body" }, [
            section("Kartentypen", entryList(CARD_TYPE_ENTRIES)),
            section("Schlüsselwörter", keywordGlossaryList()),
            section("Tipps & Tricks - Spiel", tipList(GAMEPLAY_TIPS)),
            section("Tipps & Tricks - Deckbau", tipList(DECKBUILDING_TIPS)),
          ]),
        ],
      ),
    ],
  );
}
