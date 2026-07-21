/**
 * Gemeinsamer Baustein für den ".card-frame-art"-Bildbereich (bisher reiner
 * Farbverlauf per Manafarben-Klasse, s. style.css `.mana-*.card-frame-art`).
 *
 * Der Nutzer legt extern generierte Artworks nach und nach in
 * `docs/cards/artworks/` ab (Dateiname 1:1 aus der Karten-`id` ableitbar,
 * s. `docs/cards/card-art-brief.md`) - für die meisten der 300 Karten
 * existiert (noch) keine Datei. Diese Funktion versucht das passende Bild zu
 * laden und zeigt es bei Erfolg über dem Farbverlauf an (object-fit: cover,
 * füllt den vorhandenen Bereich); schlägt das Laden fehl (Normalfall, Datei
 * existiert noch nicht), bleibt GENAU der bisherige Farbverlauf-Platzhalter
 * unverändert sichtbar - kein kaputtes Bild-Icon, kein Layout-Sprung: das
 * <img> ist per CSS bis zum "load"-Event unsichtbar (opacity 0,
 * `.card-frame-art-img-loaded` schaltet es sichtbar) und wird bei "error"
 * komplett aus dem DOM entfernt statt als kaputtes Icon angezeigt zu werden.
 *
 * `loading="lazy"` ist bewusst gesetzt, weil der Deckbau-Pool alle 300 Karten
 * gleichzeitig zeigt und die meisten davon (noch) fehlschlagende Requests
 * auslösen würden - der Browser fordert die meisten Bilder dadurch gar nicht
 * erst an, solange sie nicht in den sichtbaren Bereich gescrollt sind.
 *
 * Ausliefer-Mechanismus: `vite.config.ts` (Dev-Middleware + Build-
 * Kopierschritt liefern `docs/cards/artworks/<datei>` unter genau dieser
 * URL aus, s. dortiger Kommentar) - der Ablageort/Workflow für den Nutzer
 * ändert sich dadurch NICHT.
 */

import type { CardDefinition } from "../../model";
import { h } from "../h";

/** Leitet den erwarteten Artwork-Dateinamen aus der Karten-`id` ab (s. docs/cards/card-art-brief.md). */
export function artworkFileName(cardId: string): string {
  return `${cardId.replace(/\./g, "-")}.png`;
}

const ARTWORK_URL_PREFIX = "/cards/artworks/";

/** URL, unter der das Artwork ausgeliefert wird (dev + Produktions-Build, s. vite.config.ts). */
export function artworkUrl(cardId: string): string {
  return `${ARTWORK_URL_PREFIX}${artworkFileName(cardId)}`;
}

export function cardFrameArt(def: CardDefinition): HTMLElement {
  const img = h("img", {
    class: "card-frame-art-img",
    src: artworkUrl(def.id),
    alt: "",
    loading: "lazy",
    decoding: "async",
    onload: (ev: Event) => {
      (ev.currentTarget as HTMLElement).classList.add("card-frame-art-img-loaded");
    },
    onerror: (ev: Event) => {
      // Datei existiert (noch) nicht - Normalfall für die meisten Karten:
      // Bild-Element entfernen, damit der bisherige Farbverlauf-
      // Hintergrund von .card-frame-art unverändert sichtbar bleibt.
      (ev.currentTarget as HTMLElement).remove();
    },
  }) as HTMLImageElement;
  // render.ts baut #app bei JEDER Zustandsänderung per innerHTML komplett neu
  // auf (s. dortiger Dateikommentar) - dieses <img> wird also bei laufender
  // Partie im Sekundentakt neu erzeugt. War das Bild bereits (z.B. aus dem
  // Browser-Cache) geladen, liefert der Browser hier bereits synchron
  // `complete === true`/`naturalWidth > 0` - dann sofort sichtbar schalten
  // statt erneut auf das (in diesem Fall nichts mehr bewirkende) "load"-
  // Event zu warten, sonst ergäbe jeder Rebuild einen kurzen
  // Unsichtbar-dann-Einblenden-Sprung (sichtbares Blinken). Der obige
  // "load"-Handler bleibt unverändert als Fallback für den echten ersten
  // Ladevorgang der Session bestehen (dort soll der sanfte Fade-in
  // weiterhin passieren).
  if (img.complete && img.naturalWidth > 0) {
    img.classList.add("card-frame-art-img-loaded");
  }
  return h("div", { class: "card-frame-art" }, [img]);
}
