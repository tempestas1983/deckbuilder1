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
import { h, text } from "../h";

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
 * Taverne-Hintergrundfoto auf Seitenebene (Auftrag "Hintergrund soll breiter
 * wirken als das Spielfeld"): anders als vor diesem Auftrag liegt das <img>
 * NICHT mehr als erstes Kind von `.board` (das hätte es auf dessen Breite
 * beschnitten, s. `.board`'s `overflow: hidden`), sondern als Singleton
 * direkt an `document.body` - exakt dasselbe Pattern wie musicPlayer.ts
 * (dortiger Dateikommentar) und aus demselben Grund: `render.ts#render()`
 * baut `#app` bei JEDER Zustandsänderung per innerHTML komplett neu auf; ein
 * Bild-Element innerhalb dieses Rebuild-Bereichs würde bei jedem Klick neu
 * erzeugt (erneutes Ausblenden bis zum nächsten "load"-Event). Als
 * body-Kind übersteht es jeden Rebuild unangetastet.
 *
 * `initBoardBackdrop()` wird darum bewusst NUR aus main.ts aufgerufen (s.
 * dortiger Kommentar), NICHT aus store.ts/render.ts - die UI-Tests
 * importieren gezielt nur store.ts/render.ts und laden main.ts nie, lösen
 * also nie einen echten Bild-Request aus.
 *
 * Positionierung (`.board-backdrop-img` in style.css): `position: fixed` +
 * `inset: 0` + `width: 100vw`/`height: 100vh` + `object-fit: cover` füllt
 * den kompletten Browser-Viewport (also sichtbar breiter als `#app`, das per
 * `max-width: 1400px` begrenzt ist) - `z-index: -1` hält es hinter JEDEM
 * normalen Seiteninhalt (insbesondere `#app`/`.board`), aber als Kind von
 * `body` automatisch VOR dessen eigenem Vignette-Hintergrund (reine
 * CSS-Verlaufsfarbe, s. `body` in style.css) - ein Element mit negativem
 * z-index malt zwar vor dem eigenen Elternhintergrund, aber erst NACH dem
 * Hintergrund des Stacking-Context-Wurzelelements, hier effektiv `body`.
 * `.board` selbst behält dabei seine eigene, unveränderte CSS-Atmosphäre
 * (Holzmaserung-Verlauf, Kerzenschein-Glow-Keyframes, s. style.css `.board`)
 * - die verdeckt dieses Foto in ihrem eigenen Bereich einfach weiterhin
 * (undurchsichtiger Hintergrund), genau wie vor diesem Auftrag.
 *
 * Lade-/Fallback-Verhalten unverändert gegenüber vorher: bis zum
 * "load"-Event unsichtbar (kein Blitzen eines kaputten Icons), bei "error"
 * (Datei existiert noch nicht - Normalfall bis der Nutzer sie ablegt) wird
 * das <img> ersatzlos aus dem DOM entfernt.
 */
let boardBackdropEl: HTMLImageElement | undefined;

export function initBoardBackdrop(): void {
  if (boardBackdropEl) return;
  const el = h("img", {
    class: "board-backdrop-img",
    src: boardArtUrl(),
    alt: "",
    loading: "eager",
    decoding: "async",
    onload: (ev: Event) => {
      (ev.currentTarget as HTMLElement).classList.add("board-backdrop-img-loaded");
    },
    onerror: (ev: Event) => {
      (ev.currentTarget as HTMLElement).remove();
      boardBackdropEl = undefined;
    },
  }) as HTMLImageElement;
  document.body.appendChild(el);
  boardBackdropEl = el;
}

/**
 * Großformatiges Charakterporträt des GERADE AKTIVEN Spielers, wenn dieser
 * bot-gesteuert ist, passend zur aktiven Schwierigkeitsstufe - gerendert in
 * der rechten Board-Spalte über dem Zug-Flow (s. render.ts#boardSection/
 * turnFlowColumn), NICHT mehr klein inline im Spieler-Panel-Header (das war
 * der Stand vor diesem Wunsch). Vor dem "Avatar folgt dem aktiven Spieler
 * statt fest den Gegner zu zeigen"-Auftrag wurde diese Funktion nur für den
 * bot-gesteuerten player2 aufgerufen (daher der historische Klassenname
 * `board-opponent-avatar-img` unten, bewusst NICHT umbenannt, um die
 * style.css-Selektoren-Kette nicht unnötig aufzublähen) - inzwischen wird
 * sie für JEDEN bot-gesteuerten Spieler aufgerufen, der gerade aktiver
 * Spieler ist (auch player1 in einem künftigen "player1 = KI"-Szenario, s.
 * docs/frontend-status.md Punkt 11 "Bot-vs-Bot-Zuschauermodus"). Fehlt die
 * Bilddatei (Normalfall, solange der Nutzer sie noch nicht abgelegt hat),
 * wird das <img> beim "error"-Event ersatzlos entfernt (kein Platzhalter,
 * keine Layout-Lücke; render.ts blendet in diesem Fall die Avatar-Box NICHT
 * extra aus - der CSS-Fallback der Box selbst reicht, s. style.css
 * `.board-active-avatar`).
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

/**
 * CSS-only-Platzhalter für den GERADE AKTIVEN Spieler, wenn dieser
 * menschlich gesteuert ist (Gegenstück zu `botAvatarImg` oben) - Auftrag
 * "Avatar soll auch für den Menschen etwas zeigen, statt immer nur das
 * statische KI-Porträt". Es gibt aktuell KEIN generiertes Bild-Asset für
 * menschliche Spieler (anders als die Bot-Porträts unter
 * `docs/scene-art/avatar-<difficulty>.png`) - dies ist bewusst nur ein
 * Platzhalter im gleichen Tavernen-Look (Initiale + Anzeigename), bis
 * irgendwann ein echtes Bild-Asset nachgereicht wird. Funktioniert
 * unverändert im reinen Hotseat (beide Spieler Mensch): der Platzhalter
 * wechselt einfach zwischen "Spieler 1"/"Spieler 2" (bzw. deren Anzeigename),
 * je nachdem wer laut `state.activePlayer` gerade dran ist.
 */
export function humanAvatarPlaceholder(displayName: string): HTMLElement {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  return h("div", { class: "board-active-avatar-human" }, [
    h("span", { class: "board-active-avatar-human-initial" }, [text(initial)]),
    h("span", { class: "board-active-avatar-human-name" }, [text(displayName)]),
  ]);
}
