/**
 * Ausführliche Kartendarstellung für die Hand: klassisches Kartenspiel-Layout
 * (Kopfzeile Name/Kosten, Bildfläche als reine Farbfläche je Manafarbe -
 * bewusst OHNE Artwork/Bild-Assets, s. Auftrag -, Typzeile, Regeltext-Box,
 * P/T-Kasten bei Einheiten), plus Aktions-Buttons ("Spielen"/"Terrain
 * legen"), abgeleitet aus getLegalActions-Kandidaten (keine eigene
 * Legalitätsprüfung).
 */

import type { CardDefinition, InstanceId, PlayerAction } from "../../model";
import { dominantColorClass, subtypeLine } from "../cardInfo";
import { h, text } from "../h";
import { cardFrameArt } from "./cardArt";
import { manaCostBadge } from "./manaCost";

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
}

/** Baut den gemeinsamen "Kartenrahmen" (Kopfzeile, Bildfläche, Typzeile, Regeltext, ggf. P/T-Kasten). */
function cardFrameBody(def: CardDefinition): HTMLElement {
  const frameChildren: (Node | string | false | undefined)[] = [
    cardFrameArt(def),
    h("div", { class: "card-frame-type" }, [text(subtypeLine(def))]),
  ];
  if (def.rulesText) {
    frameChildren.push(h("div", { class: "card-frame-text-box" }, [h("div", { class: "card-frame-text" }, [text(def.rulesText)])]));
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

  return h("div", { class: classes.join(" ") }, children);
}

/** Vereinfachte Handkarten-Kachel für den Cleanup-Abwurf: nur Name/Kosten + Auswahl-Toggle. */
export function handCardDiscardToggle(
  def: CardDefinition,
  selected: boolean,
  onToggle: () => void,
): HTMLElement {
  const cost = "cost" in def ? def.cost : undefined;
  const classes = ["hand-card", "discard-toggle", dominantColorClass(cost ?? {})];
  if (selected) classes.push("selected");
  return h("div", { class: classes.join(" "), onclick: onToggle }, [
    h("div", { class: "card-frame-header" }, [
      h("div", { class: "card-frame-name hand-card-name" }, [text(def.name)]),
      cost ? manaCostBadge(cost) : undefined,
    ]),
    h("div", { class: "card-frame-frame" }, [
      cardFrameArt(def),
      h("div", { class: "card-frame-type" }, [text(subtypeLine(def))]),
    ]),
    h("div", { class: "discard-toggle-hint" }, [text(selected ? "wird abgeworfen" : "anklicken zum Abwerfen")]),
  ]);
}
