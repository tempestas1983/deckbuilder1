/**
 * App-weite Hintergrundmusik (Titel: "Three Coins on the Table", vom Nutzer
 * lokal unter docs/music/ abgelegt, s. vite.config.ts#musicPlugin - liefert
 * die Datei unter der festen URL `/music/<dateiname>.mp3` aus, exakt wie
 * Karten-/Szenen-Artwork).
 *
 * WICHTIG (Grund für ein eigenes Singleton-Modul statt eines <audio>-Elements
 * innerhalb von render.ts): render() baut bei JEDER Zustandsänderung das
 * komplette DOM innerhalb von #app per innerHTML-Rebuild neu auf (kein
 * Diffing, s. render.ts-Dateikommentar). Ein <audio>-Element, das Teil dieses
 * Rebuilds wäre, würde bei jedem Klick im Spiel neu erzeugt - der Track würde
 * ständig von vorne beginnen ("rissiger" Sound). Dieses Modul erzeugt das
 * <audio>-Element daher GENAU EINMAL und hängt es direkt an document.body
 * (also AUSSERHALB des von render() verwalteten #app-Containers) - es
 * überlebt damit jeden Rebuild unangetastet.
 *
 * Verdrahtung mit dem Store: `initMusicPlayer()` abonniert sich per
 * store.ts#subscribe() (exakt wie main.ts#render) und synchronisiert bei
 * JEDER Store-Änderung Play/Pause-Zustand mit `isMusicEnabled()` - reagiert
 * also sowohl auf den eigenen Mute-Button (store.ts#toggleMusicEnabled) als
 * auch auf jede andere Zustandsänderung (dort idempotent: play()/pause() auf
 * einem bereits spielenden/pausierten Element ist ein No-Op).
 *
 * Browser-Autoplay-Policy: moderne Browser blocken Wiedergabe mit Ton ohne
 * vorherige Nutzerinteraktion - ein `play()`-Aufruf vor der ersten
 * Interaktion schlägt lautlos fehl (rejected Promise, hier bewusst
 * ignoriert). Statt eines aufdringlichen Start-Buttons hängt sich dieses
 * Modul einmalig an das ERSTE Klick-/Tastatur-Ereignis irgendwo in der App
 * (unabhängig davon, was der Klick sonst auslöst) und versucht dann erneut zu
 * starten - für den Nutzer unsichtbar, die Musik setzt einfach beim ersten
 * Interagieren ein (sofern nicht zwischenzeitlich stummgeschaltet).
 *
 * `initMusicPlayer()` wird bewusst NUR aus main.ts aufgerufen (App-
 * Einstiegspunkt), NICHT aus store.ts/render.ts selbst - die UI-Tests
 * (src/ui/__tests__/*.test.ts) importieren gezielt nur store.ts/render.ts und
 * bauen ihr eigenes Root-Element auf, ohne main.ts zu laden; sie lösen daher
 * nie echte Audio-API-Aufrufe aus (jsdom kennt HTMLMediaElement#play ohnehin
 * nicht wirklich, s. Kommentar bei `attemptPlay` unten).
 */

import { isMusicEnabled, subscribe } from "./store";

const MUSIC_SRC = "/music/Three_Coins_on_the_Table.mp3";

let audioEl: HTMLAudioElement | undefined;

function ensureAudioElement(): HTMLAudioElement {
  if (audioEl) return audioEl;
  const el = document.createElement("audio");
  el.src = MUSIC_SRC;
  el.loop = true;
  el.preload = "auto";
  // Keine nativen Browser-Controls - die Statusleiste/der Deckbau-Header
  // haben einen eigenen Mute/Play-Button (s. components/musicToggle.ts).
  el.style.display = "none";
  document.body.appendChild(el);
  audioEl = el;
  return el;
}

/**
 * `HTMLMediaElement#play()` liefert im Browser ein Promise, das bei einer
 * durch die Autoplay-Policy blockierten Wiedergabe rejected wird - hier
 * bewusst lautlos ignoriert (s. Dateikommentar: kein Fehlerzustand, nur "noch
 * keine Nutzerinteraktion"). Defensiv gegen Umgebungen, in denen `play()`
 * synchron `undefined` statt eines Promise liefert (z.B. jsdom in Tests,
 * s.o. - `initMusicPlayer` wird dort ohnehin nie aufgerufen, dieser Schutz
 * ist nur eine zusätzliche Absicherung).
 */
function attemptPlay(el: HTMLAudioElement): void {
  try {
    const result = el.play() as unknown;
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch(() => {
        // Autoplay verhindert (kein Nutzer-Interaktions-Kontext) - erwartet,
        // s. startOnFirstInteraction unten.
      });
    }
  } catch {
    // s.o. - darf die App nie zum Absturz bringen.
  }
}

function applyPlaybackState(): void {
  const el = ensureAudioElement();
  if (isMusicEnabled()) {
    attemptPlay(el);
  } else {
    el.pause();
  }
}

let firstInteractionHandlersAttached = false;

/** Einmaliger globaler Listener auf die erste Nutzerinteraktion irgendwo in der App (s. Dateikommentar). */
function startOnFirstInteraction(): void {
  if (firstInteractionHandlersAttached) return;
  firstInteractionHandlersAttached = true;
  const handler = () => {
    window.removeEventListener("pointerdown", handler);
    window.removeEventListener("keydown", handler);
    applyPlaybackState();
  };
  window.addEventListener("pointerdown", handler, { once: true });
  window.addEventListener("keydown", handler, { once: true });
}

/**
 * Einmalig aus main.ts aufzurufen: erzeugt das persistente <audio>-Element,
 * verdrahtet es mit dem Store (jede Änderung synchronisiert Play/Pause) und
 * richtet den "erste Interaktion startet die Musik"-Fallback ein.
 */
export function initMusicPlayer(): void {
  ensureAudioElement();
  subscribe(applyPlaybackState);
  startOnFirstInteraction();
  // Direkter Versuch beim Start (schlägt i.d.R. lautlos fehl, s.o.) - falls
  // die Seite ausnahmsweise bereits "user activation" hat, setzt die Musik
  // ohne weitere Interaktion sofort ein.
  applyPlaybackState();
}
