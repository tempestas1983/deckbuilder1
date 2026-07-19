/**
 * Mute/Play-Umschalter für die app-weite Hintergrundmusik (s.
 * `../musicPlayer.ts` für das eigentliche `<audio>`-Element). Reine
 * Anzeige-/Klick-Komponente, exakt wie `keywordGlossaryButton` -
 * das tatsächliche Play/Pause übernimmt musicPlayer.ts über
 * store.ts#isMusicEnabled/toggleMusicEnabled (Observer-Muster,
 * s. dortiger Kommentar), nicht diese Komponente selbst.
 */

import { h, text } from "../h";

export function musicToggleButton(enabled: boolean, onClick: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "btn music-toggle-btn",
      title: enabled
        ? "Hintergrundmusik ausschalten"
        : "Hintergrundmusik einschalten",
      onclick: onClick,
      "data-testid": "music-toggle-btn",
    },
    [text(enabled ? "Musik: An" : "Musik: Aus")],
  );
}
