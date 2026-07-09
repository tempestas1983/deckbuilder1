/**
 * Steuer-Panels für die verschiedenen Interaktionsmodi: Ziel-Banner
 * (Targeting/PendingDecision), X-Kosten-Eingabe, Combat-Deklaration
 * (Angreifer/Blocker), Cleanup-Abwurf. Reine Darstellung + Callbacks - die
 * eigentliche Aktion wird immer über store.dispatch (also applyAction)
 * ausgelöst.
 */

import { h, text } from "../h";

export function targetingBanner(title: string, onCancel?: () => void): HTMLElement {
  return h("div", { class: "action-banner" }, [
    h("span", {}, [text(title)]),
    onCancel ? h("button", { class: "btn btn-cancel", onclick: onCancel }, [text("Abbrechen")]) : undefined,
  ]);
}

export function xInputPanel(
  cardName: string,
  onConfirm: (x: number) => void,
  onCancel: () => void,
): HTMLElement {
  let current = 0;
  const input = h("input", {
    type: "number",
    min: "0",
    value: "0",
    class: "x-input",
    oninput: (ev: Event) => {
      const v = Number((ev.target as HTMLInputElement).value);
      current = Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
    },
  }) as HTMLInputElement;

  return h("div", { class: "action-banner x-input-panel" }, [
    h("span", {}, [text(`X für „${cardName}“ wählen:`)]),
    input,
    h("button", { class: "btn btn-play", onclick: () => onConfirm(current) }, [text("Weiter")]),
    h("button", { class: "btn btn-cancel", onclick: onCancel }, [text("Abbrechen")]),
  ]);
}

export function attackersPanel(
  selectedCount: number,
  onConfirm: () => void,
  onNone: () => void,
): HTMLElement {
  return h("div", { class: "action-banner" }, [
    h("span", {}, [text(`Angreifer wählen (${selectedCount} ausgewählt) - eigene Einheiten anklicken.`)]),
    h("button", { class: "btn btn-play", onclick: onConfirm }, [text("Angriff erklären")]),
    h("button", { class: "btn btn-cancel", onclick: onNone }, [text("Keine Angreifer")]),
  ]);
}

export function blockersPanel(
  pairs: Array<{ blocker: string; attacker: string }>,
  labelFor: (instanceId: string) => string,
  onRemove: (blocker: string) => void,
  onConfirm: () => void,
  onNone: () => void,
): HTMLElement {
  const pairList = pairs.map((p) =>
    h("div", { class: "block-pair" }, [
      text(`${labelFor(p.blocker)} blockt ${labelFor(p.attacker)}`),
      h("button", { class: "btn btn-cancel btn-small", onclick: () => onRemove(p.blocker) }, [text("×")]),
    ]),
  );
  return h("div", { class: "action-banner combat-panel" }, [
    h("span", {}, [text("Blocker zuordnen: erst eigene Einheit, dann Angreifer anklicken.")]),
    h("div", { class: "block-pair-list" }, pairList),
    h("button", { class: "btn btn-play", onclick: onConfirm }, [text("Blocks bestätigen")]),
    h("button", { class: "btn btn-cancel", onclick: onNone }, [text("Keine Blocker")]),
  ]);
}

export function discardPanel(required: number, selectedCount: number, onConfirm: () => void): HTMLElement {
  return h("div", { class: "action-banner" }, [
    h("span", {}, [
      text(`Handkartenlimit überschritten: ${selectedCount}/${required} zum Abwerfen ausgewählt (Handkarten anklicken).`),
    ]),
    h("button", { class: "btn btn-play", disabled: selectedCount !== required, onclick: onConfirm }, [text("Abwerfen bestätigen")]),
  ]);
}
