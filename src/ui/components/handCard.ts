/**
 * Ausführliche Kartendarstellung für die Hand: klassisches Kartenspiel-Layout
 * (Kopfzeile Name/Kosten, Bildfläche als reine Farbfläche je Manafarbe -
 * bewusst OHNE Artwork/Bild-Assets, s. Auftrag -, Typzeile, Regeltext-Box,
 * P/T-Kasten bei Einheiten), plus Aktions-Buttons ("Spielen"/"Terrain
 * legen"), abgeleitet aus getLegalActions-Kandidaten (keine eigene
 * Legalitätsprüfung).
 */

import type { CardDefinition, InstanceId, PlayerAction } from "../../model";
import { dominantColorClass, effectiveRulesText, rulesTextDensityClass, subtypeLine } from "../cardInfo";
import { h, text } from "../h";
import { cardFrameArt } from "./cardArt";
import { manaCostBadge } from "./manaCost";
import { ruleTextNodes } from "./keywordText";

export interface HandCardOptions {
  castCandidates: PlayerAction[];
  playTerrainCandidate?: PlayerAction;
  /** true = Karte hat X-Kosten und Spieler hat gerade Priority -> eigene Eingabe-UI anbieten. */
  offerXFlow: boolean;
  /**
   * v0.3 (Modal-Spells, rules-engine.md 4 + 9.13): true = Karte deklariert
   * `modes` -> Modus-Wahl VOR X/Zielen anbieten statt der normalen
   * Cast-Buttons (getLegalActions liefert für modale Karten nur einen
   * Kandidaten ohne chosenMode/chosenTargets, den ein direkter "Spielen"-Klick
   * nicht gültig ausfüllen könnte).
   */
  offerModeFlow: boolean;
  onCastDirect: (action: PlayerAction) => void;
  onStartTargeting: (candidates: PlayerAction[], title: string) => void;
  onStartXFlow: (cardInstanceId: InstanceId) => void;
  onStartModeFlow: (cardInstanceId: InstanceId) => void;
  onPlayTerrain: (action: PlayerAction) => void;
  /** v0.1.16: vom geführten Tutorial als "das hier als Nächstes spielen" markiert, s. cardTile.ts#tutorialHighlighted. */
  tutorialHighlighted?: boolean;
}

/** Baut den gemeinsamen "Kartenrahmen" (Kopfzeile, Bildfläche, Typzeile, Regeltext, ggf. P/T-Kasten). */
function cardFrameBody(def: CardDefinition): HTMLElement {
  const frameChildren: (Node | string | false | undefined)[] = [
    cardFrameArt(def),
    h("div", { class: "card-frame-type" }, [text(subtypeLine(def))]),
  ];
  const rulesText = effectiveRulesText(def);
  if (rulesText) {
    frameChildren.push(h("div", { class: "card-frame-text-box" }, [h("div", { class: rulesTextDensityClass(rulesText) }, ruleTextNodes(rulesText))]));
  }
  if (def.type === "unit") {
    frameChildren.push(h("div", { class: "card-frame-pt hand-card-pt" }, [text(`${def.power}/${def.toughness}`)]));
  }
  return h("div", { class: "card-frame-frame" }, frameChildren);
}

export function handCard(
  cardInstanceId: InstanceId,
  def: CardDefinition,
  opts: HandCardOptions,
): HTMLElement {
  const cost = "cost" in def ? def.cost : undefined;
  const classes = ["hand-card", dominantColorClass(cost ?? {})];
  if (opts.tutorialHighlighted) classes.push("tutorial-glow");

  const children: (Node | string | false | undefined)[] = [
    h("div", { class: "card-frame-header" }, [
      h("div", { class: "card-frame-name hand-card-name" }, [text(def.name)]),
      cost ? manaCostBadge(cost) : undefined,
    ]),
    cardFrameBody(def),
  ];

  const actions: HTMLElement[] = [];
  if (opts.playTerrainCandidate) {
    const candidate = opts.playTerrainCandidate;
    actions.push(
      h("button", { class: "btn btn-play", onclick: () => opts.onPlayTerrain(candidate) }, [text("Terrain legen")]),
    );
  }
  if (opts.offerModeFlow) {
    actions.push(
      h("button", { class: "btn btn-play", onclick: () => opts.onStartModeFlow(cardInstanceId) }, [text("Modus wählen")]),
    );
  } else if (opts.offerXFlow) {
    actions.push(
      h("button", { class: "btn btn-play", onclick: () => opts.onStartXFlow(cardInstanceId) }, [text("X wählen & spielen")]),
    );
  } else if (opts.castCandidates.length === 1 && opts.castCandidates[0]!.kind === "castSpell" && opts.castCandidates[0]!.chosenTargets.length === 0) {
    const candidate = opts.castCandidates[0]!;
    actions.push(h("button", { class: "btn btn-play", onclick: () => opts.onCastDirect(candidate) }, [text("Spielen")]));
  } else if (opts.castCandidates.length > 0) {
    actions.push(
      h(
        "button",
        {
          class: "btn btn-play",
          onclick: () => opts.onStartTargeting(opts.castCandidates, `Ziel für „${def.name}“ wählen`),
        },
        [text("Spielen (Ziel wählen)")],
      ),
    );
  }

  if (actions.length > 0) {
    children.push(h("div", { class: "hand-card-actions" }, actions));
  }

  return h(
    "div",
    {
      class: classes.join(" "),
      // Sichtbare Übergänge (s. render.ts-Kommentarblock zu View
      // Transitions / cardTile.ts): GLEICHES Namensschema wie cardTile.ts -
      // dieselbe Karten-Instanz "morpht" dadurch automatisch von der Hand
      // aufs Battlefield beim Ausspielen (Auftrag Punkt 2), auch wenn Hand-
      // und Board-Darstellung strukturell unterschiedliches Markup haben.
      style: `view-transition-name: card-${cardInstanceId}`,
    },
    children,
  );
}

/**
 * Verdeckter Handstapel (Kartenrückseite) für JEDE Hand außer der von
 * player1 (dem lokalen menschlichen Spieler, s. render.ts#hiddenHandZone) -
 * zeigt bewusst WEDER Name noch Kosten noch Regeltext (verdeckte Information
 * ist Kern eines Kartenspiels wie diesem), NICHT klickbar/interaktiv (anders
 * als `handCardDiscardToggle` unten, das nur strukturell als Vorbild für eine
 * vereinfachte Kachel diente).
 *
 * Nutzer-Feedback 2026-08-02 ("verdeckte Hand nimmt zu viel Platz ein, trägt
 * aber keinerlei Information"): früher EINE `.hand-card-hidden`-Kachel PRO
 * Handkarte (identisch breit wie eine echte Handkarte) - bei einer vollen
 * Bot-Hand entsprechend viele nebeneinanderliegende, optisch nichtssagende
 * Rückseiten. Jetzt genau EINE Kachel für die ganze Hand, die bei mehr als
 * einer Karte per CSS-Pseudo-Elementen (s. style.css
 * `.hand-card-hidden-stack-multi`) leicht versetzte weitere Rückseiten
 * "darunter hervorschauen" lässt (Stapel-Optik ohne zusätzliches Markup pro
 * Karte) - die tatsächliche Anzahl bleibt über das Zahl-Badge
 * (`.hand-card-hidden-stack-count`) ablesbar. Bei 0 Karten wird bewusst gar
 * kein Kartenrücken gezeigt (nichts zu stapeln) - reiner Zähler-Hinweis, s.
 * render.ts#hiddenHandZone.
 *
 * Bewusst OHNE `view-transition-name` (anders als die frühere Pro-Karte-
 * Variante): die App aktiviert `document.startViewTransition()` seit dem
 * Nutzer-Feedback in render.ts (s. dortiger Kommentarblock) grundsätzlich
 * nicht mehr, ein Name auf einem Element, das nicht mehr 1:1 einer Instanz
 * entspricht (mehrere Instanzen teilen sich jetzt dieselbe Stapel-Kachel),
 * wäre ohnehin nicht mehr eindeutig zuordenbar.
 */
export function hiddenHandStack(hand: readonly InstanceId[]): HTMLElement {
  const count = hand.length;
  if (count === 0) {
    return h("div", { class: "hand-zone-hidden-empty" }, [text("0 Karten")]);
  }
  const classes = ["hand-card", "hand-card-hidden-stack"];
  if (count > 1) classes.push("hand-card-hidden-stack-multi");
  return h("div", { class: classes.join(" ") }, [
    h("div", { class: "hand-card-hidden-back" }, []),
    h("div", { class: "hand-card-hidden-stack-count" }, [text(String(count))]),
  ]);
}

/** Vereinfachte Handkarten-Kachel für den Cleanup-Abwurf: nur Name/Kosten + Auswahl-Toggle. */
export function handCardDiscardToggle(
  cardInstanceId: InstanceId,
  def: CardDefinition,
  selected: boolean,
  onToggle: () => void,
): HTMLElement {
  const cost = "cost" in def ? def.cost : undefined;
  const classes = ["hand-card", "discard-toggle", dominantColorClass(cost ?? {})];
  if (selected) classes.push("selected");
  return h(
    "div",
    { class: classes.join(" "), style: `view-transition-name: card-${cardInstanceId}`, onclick: onToggle },
    [
      h("div", { class: "card-frame-header" }, [
        h("div", { class: "card-frame-name hand-card-name" }, [text(def.name)]),
        cost ? manaCostBadge(cost) : undefined,
      ]),
      h("div", { class: "card-frame-frame" }, [
        cardFrameArt(def),
        h("div", { class: "card-frame-type" }, [text(subtypeLine(def))]),
      ]),
      h("div", { class: "discard-toggle-hint" }, [text(selected ? "wird abgeworfen" : "anklicken zum Abwerfen")]),
    ],
  );
}
