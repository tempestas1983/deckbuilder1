/**
 * Stack-Anzeige (Pflicht-Anzeige laut rules-engine.md Abschnitt 3): von unten
 * (zuerst gelegt) nach oben (löst als nächstes auf). Zeigt Art, Quelle,
 * Controller und - falls vorhanden - gewählte Ziele/X.
 */

import type { CardPool, ChosenTarget, GameState, StackObject } from "../../model";
import { cardDef } from "../cardInfo";
import { h, text } from "../h";
import { targetKeyOf } from "../types";

function describeTarget(state: GameState, pool: CardPool, target: ChosenTarget): string {
  switch (target.kind) {
    case "permanent": {
      const inst = state.cards[target.instanceId];
      if (!inst) return "(verschwundenes Ziel)";
      return cardDef(pool, state, target.instanceId).name;
    }
    case "player":
      return target.playerId;
    case "stackObject":
      return `Stack-Objekt ${target.stackObjectId}`;
  }
}

export interface StackPanelOptions {
  /** targetKey -> Klick-Handler, für Konter-Ziele auf dem Stack. */
  targetableKeys?: Set<string>;
  onTargetClick?: (stackObjectId: string) => void;
}

export function stackPanel(state: GameState, pool: CardPool, opts: StackPanelOptions = {}): HTMLElement {
  if (state.stack.length === 0) {
    return h("div", { class: "stack-panel stack-empty" }, [text("Stack ist leer.")]);
  }
  const rows = [...state.stack].reverse().map((obj, idxFromTop) => stackRow(state, pool, obj, idxFromTop, opts));
  return h("div", { class: "stack-panel" }, [
    h("div", { class: "stack-panel-title" }, [text(`Stack (${state.stack.length}, oben = löst zuerst auf)`)]),
    h("div", { class: "stack-list" }, rows),
  ]);
}

function stackRow(
  state: GameState,
  pool: CardPool,
  obj: StackObject,
  idxFromTop: number,
  opts: StackPanelOptions,
): HTMLElement {
  let label: string;
  if (obj.kind === "spell") {
    label = cardDef(pool, state, obj.cardInstanceId).name;
  } else {
    const def = cardDef(pool, state, obj.sourceInstanceId);
    label = `${def.name} (${obj.kind === "activatedAbility" ? "Fähigkeit" : "Trigger"})`;
  }
  const targetKey = targetKeyOf({ kind: "stackObject", stackObjectId: obj.id });
  const targetable = opts.targetableKeys?.has(targetKey) ?? false;

  const details: (Node | string | false)[] = [
    h("span", { class: "stack-row-controller" }, [text(obj.controller)]),
  ];
  if (obj.chosenTargets.length > 0) {
    details.push(text(` → ${obj.chosenTargets.map((t) => describeTarget(state, pool, t)).join(", ")}`));
  }
  if (obj.kind === "spell" && obj.chosenX !== undefined) {
    details.push(text(` (X=${obj.chosenX})`));
  }

  return h(
    "div",
    {
      class: `stack-row${idxFromTop === 0 ? " stack-row-top" : ""}${targetable ? " targetable" : ""}`,
      onclick: targetable ? () => opts.onTargetClick?.(obj.id) : undefined,
    },
    [h("div", { class: "stack-row-name" }, [text(label)]), h("div", { class: "stack-row-details" }, details)],
  );
}
