/**
 * Mute/Play-Umschalter für kurze Soundeffekte (Karte spielen, Angriff,
 * Treffer, ...) - s. `../sfxPlayer.ts` für das eigentliche Abspielen.
 * Exakt analog zu `musicToggle.ts`, aber ein EIGENSTÄNDIGER Zustand
 * (`store.ts#isSfxEnabled/toggleSfxEnabled`), unabhängig vom Musik-Mute -
 * reine Anzeige-/Klick-Komponente, die tatsächliche Wiedergabe-Entscheidung
 * trifft `sfxPlayer.ts#playSfx` bei jedem Event (Observer-/Check-Muster).
 */

import { h, text } from "../h";

export function sfxToggleButton(enabled: boolean, onClick: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "btn sfx-toggle-btn",
      title: enabled ? "Soundeffekte ausschalten" : "Soundeffekte einschalten",
      onclick: onClick,
      "data-testid": "sfx-toggle-btn",
    },
    [text(enabled ? "Soundeffekte: An" : "Soundeffekte: Aus")],
  );
}
