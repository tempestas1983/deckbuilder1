/**
 * Nicht-Karten-Artwork (Board-Hintergrund + KI-Gegner-Avatare), s.
 * `docs/scene-art-brief.md`. Gleiches Muster wie `cardArt.ts`: der Nutzer
 * legt die extern generierten Bilder unter `docs/scene-art/` ab (fester
 * Dateiname je Asset, kein neues Datenmodell-Feld nötig); bis dahin bzw.
 * falls eine Datei fehlt, bleibt die zuvor gebaute reine CSS-Atmosphäre
 * (Holzmaserung/Vignette/Kerzenschein, s. style.css `.board`) unverändert
 * sichtbar - das <img> ist bis zum "load"-Event unsichtbar und wird bei
 * "error" komplett aus dem DOM entfernt statt als kaputtes Icon angezeigt
 * zu werden.
 *
 * Ausliefer-Mechanismus: `vite.config.ts` (`sceneArtPlugin`, gleiche
 * Dev-Middleware + Build-Kopierschritt-Logik wie beim Karten-Artwork)
 * liefert `docs/scene-art/<datei>` unter genau dieser URL aus - der
 * Ablageort/Workflow für den Nutzer ändert sich dadurch NICHT.
 */

import type { BotDifficulty } from "../../ai";
import { h } from "../h";

const SCENE_ART_URL_PREFIX = "/scene-art/";

/** URL des Spielbrett-Hintergrundbilds (dev + Produktions-Build, s. vite.config.ts). */
export function boardArtUrl(): string {
  return `${SCENE_ART_URL_PREFIX}tavern-background.png`;
}

/** URL des Gegner-Avatars zur jeweiligen Bot-Schwierigkeitsstufe. */
export function botAvatarUrl(difficulty: BotDifficulty): string {
  return `${SCENE_ART_URL_PREFIX}avatar-${difficulty}.png`;
}

/**
 * Bild-Layer für den Spielbrett-Hintergrund (`.board`, s. style.css) - liegt
 * als erstes Kind über dem Holzmaserung-Verlauf/Rauschen, aber unter dem
 * animierten Kerzenschein-Glow (`.board::after`) und den Spielerbereichen,
 * s. Stacking-Kommentar in style.css. Wird beim boardSection-Aufbau in
 * render.ts VOR den beiden playerArea-Elementen eingefügt.
 */
export function boardArtLayer(): HTMLElement {
  return h("img", {
    class: "board-art-img",
    src: boardArtUrl(),
    alt: "",
    loading: "eager",
    decoding: "async",
    onload: (ev: Event) => {
      (ev.currentTarget as HTMLElement).classList.add("board-art-img-loaded");
    },
    onerror: (ev: Event) => {
      // Datei existiert (noch) nicht - Normalfall bis der Nutzer sie ablegt:
      // Bild-Element entfernen, damit die bisherige CSS-Atmosphäre von
      // .board (Holzmaserung, Rauschen, Kerzenschein-Glow) unverändert
      // sichtbar bleibt.
      (ev.currentTarget as HTMLElement).remove();
    },
  });
}

/**
 * Großformatiges Charakterporträt des bot-gesteuerten Gegners, passend zur
 * aktiven Schwierigkeitsstufe - gerendert in einer eigenen Spalte rechts
 * neben dem eigentlichen Spielfeld (s. render.ts#boardSection/
 * opponentAvatarColumn), NICHT mehr klein inline im Spieler-Panel-Header
 * (das war der Stand vor diesem Wunsch). Nur aufrufen, wenn der jeweilige
 * Spieler tatsächlich bot-gesteuert ist - fehlt die Bilddatei (Normalfall,
 * solange der Nutzer sie noch nicht abgelegt hat), wird das <img> beim
 * "error"-Event ersatzlos entfernt (kein Platzhalter, keine Layout-Lücke;
 * render.ts blendet in diesem Fall die ganze Spalte NICHT extra aus - der
 * CSS-Fallback der Spalte selbst reicht, s. style.css
 * `.board-opponent-avatar`).
 */
export function botAvatarImg(difficulty: BotDifficulty): HTMLElement {
  return h("img", {
    class: "board-opponent-avatar-img",
    src: botAvatarUrl(difficulty),
    alt: "",
    loading: "eager",
    decoding: "async",
    onload: (ev: Event) => {
      (ev.currentTarget as HTMLElement).classList.add("board-opponent-avatar-img-loaded");
    },
    onerror: (ev: Event) => {
      (ev.currentTarget as HTMLElement).remove();
    },
  });
}
