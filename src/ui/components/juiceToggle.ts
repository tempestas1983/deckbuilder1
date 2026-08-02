/**
 * An/Aus-Umschalter für die zusätzlichen, rein kosmetischen Kampf-/Zauber-
 * Animationen ("mehr Juice" - Treffer-Zucken, Impact-Puls, Sterbe-Ausblenden,
 * s. `store.ts#applyJuiceForEvent`-Dateikommentar). EIGENSTÄNDIGER Zustand
 * (`store.ts#isJuiceEnabled`/`toggleJuiceEnabled`), unabhängig von Musik-
 * UND SFX-Mute - wer z.B. die Soundeffekte behalten, aber die zusätzlichen
 * Zuck-/Puls-Animationen als zu unruhig empfindet (oder umgekehrt), kann
 * beides getrennt abschalten. 1:1 dasselbe Komponenten-Muster wie
 * `sfxToggle.ts#sfxToggleButton` (reine Anzeige-/Klick-Komponente, keine
 * eigene Zustandslogik).
 */

import { h, text } from "../h";

export function juiceToggleButton(enabled: boolean, onClick: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "btn juice-toggle-btn",
      title: enabled ? "Zusatz-Effekte ausschalten" : "Zusatz-Effekte einschalten",
      onclick: onClick,
      "data-testid": "juice-toggle-btn",
    },
    [text(enabled ? "Effekte: An" : "Effekte: Aus")],
  );
}
