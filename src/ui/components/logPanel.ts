/** Ereignis-Log: menschenlesbare Zusammenfassung der von der Engine emittierten GameEvents. */

import { h, text } from "../h";

export function logPanel(entries: string[]): HTMLElement {
  const items = entries
    .slice()
    .reverse()
    .map((entry) => h("div", { class: "log-entry" }, [text(entry)]));
  return h("div", { class: "log-panel" }, [
    h("div", { class: "log-panel-title" }, [text("Ereignis-Log")]),
    h("div", { class: "log-list" }, items),
  ]);
}
