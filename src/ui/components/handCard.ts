/**
 * Ausführliche Kartendarstellung für die Hand: Name, Typ/Untertyp, Kosten,
 * Regeltext, P/T (Basiswert - noch kein Battlefield-Kontext), plus
 * Aktions-Buttons ("Spielen"/"Terrain legen"), abgeleitet aus
 * getLegalActions-Kandidaten (keine eigene Legalitätsprüfung).
 */

import type { CardDefinition, InstanceId, PlayerAction } from "../../model";
import { dominantColorClass, formatManaCost, subtypeLine } from "../cardInfo";
import { h, text } from "../h";

export interface HandCardOptions {
  castCandidates: PlayerAction[];
  playTerrainCandidate?: PlayerAction;
  /** true = Karte hat X-Kosten und Spieler hat gerade Priority -> eigene Eingabe-UI anbieten. */
  offerXFlow: boolean;
  onCastDirect: (action: PlayerAction) => void;
  onStartTargeting: (candidates: PlayerAction[], title: string) => void;
  onStartXFlow: (cardInstanceId: InstanceId) => void;
  onPlayTerrain: (action: PlayerAction) => void;
}

export function handCard(
  cardInstanceId: InstanceId,
  def: CardDefinition,
  opts: HandCardOptions,
): HTMLElement {
  const cost = "cost" in def ? def.cost : undefined;
  const classes = ["hand-card", dominantColorClass(cost ?? {})];

  const children: (Node | string | false | undefined)[] = [
    h("div", { class: "hand-card-name" }, [text(def.name)]),
    h("div", { class: "hand-card-type" }, [text(subtypeLine(def))]),
  ];
  if (cost) {
    children.push(h("div", { class: "hand-card-cost" }, [text(formatManaCost(cost))]));
  }
  if (def.type === "unit") {
    children.push(h("div", { class: "hand-card-pt" }, [text(`${def.power}/${def.toughness}`)]));
  }
  if (def.rulesText) {
    children.push(h("div", { class: "hand-card-text" }, [text(def.rulesText)]));
  }

  const actions: HTMLElement[] = [];
  if (opts.playTerrainCandidate) {
    const candidate = opts.playTerrainCandidate;
    actions.push(
      h("button", { class: "btn btn-play", onclick: () => opts.onPlayTerrain(candidate) }, [text("Terrain legen")]),
    );
  }
  if (opts.offerXFlow) {
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
    h("div", { class: "hand-card-name" }, [text(def.name)]),
    h("div", { class: "hand-card-type" }, [text(subtypeLine(def))]),
    cost ? h("div", { class: "hand-card-cost" }, [text(formatManaCost(cost))]) : undefined,
    h("div", { class: "discard-toggle-hint" }, [text(selected ? "wird abgeworfen" : "anklicken zum Abwerfen")]),
  ]);
}
