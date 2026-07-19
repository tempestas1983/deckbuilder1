/**
 * App-weite Hintergrundmusik-Playlist: die Titel liegen unter `docs/music/`
 * (vom Nutzer lokal abgelegt, s. vite.config.ts#musicPlugin - liefert jede
 * Datei unter der festen URL `/music/<dateiname>` aus, exakt wie Karten-/
 * Szenen-Artwork). Anders als in der Ursprungsversion (genau EIN
 * hartkodierter Dateiname) wird die Titel-Liste jetzt per Auto-Discovery
 * ermittelt: `vite.config.ts#musicIndexPlugin` liefert unter
 * `/music/index.json` ein Live-Verzeichnis-Listing (Dev: bei jedem Request
 * neu, Build: ein Snapshot zum Build-Zeitpunkt), das hier beim Init EINMALIG
 * abgefragt und über `store.ts#setMusicTracks()` in den Store gespiegelt
 * wird - store.ts selbst macht bewusst keine Netzwerkaufrufe.
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
 * JEDER Store-Änderung Titel/Play-Pause/Loop-Zustand mit
 * `isMusicEnabled()`/`getMusicCurrentTrack()`/`getMusicRepeatMode()` -
 * reagiert also sowohl auf die eigenen Musik-Panel-Steuerelemente
 * (store.ts#toggleMusicEnabled/selectMusicTrack/setMusicRepeatMode) als auch
 * auf jede andere Zustandsänderung. Da `subscribe()` bei WIRKLICH jeder
 * Store-Änderung feuert (z.B. jedem Spielzug), reassigniert
 * `applyPlaybackState()` `el.src` NUR, wenn sich der effektive Titel
 * tatsächlich geändert hat (`currentAppliedTrack`-Merker unten) - andernfalls
 * würde jeder Klick im Spiel den gerade laufenden Titel von vorne beginnen
 * lassen.
 *
 * Playlist-Weiterschalten: im Playlist-Wiederholungsmodus (s.
 * store.ts#getMusicRepeatMode) hängt ein `ended`-Listener am `<audio>`-
 * Element, der beim Ende eines Titels `store.ts#advanceToNextMusicTrack()`
 * aufruft (Wrap-Around zum ersten Titel nach dem letzten). Im
 * Einzeltitel-Wiederholungsmodus übernimmt stattdessen das native
 * `loop`-Attribut - dabei feuert `ended` beim nativen Loopen ohnehin nie.
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
 * nie echte Audio-API-/`fetch()`-Aufrufe aus (jsdom kennt HTMLMediaElement#play
 * ohnehin nicht wirklich, s. Kommentar bei `attemptPlay` unten).
 */

import {
  advanceToNextMusicTrack,
  getMusicCurrentTrack,
  getMusicRepeatMode,
  isMusicEnabled,
  setMusicTracks,
  subscribe,
} from "./store";

let audioEl: HTMLAudioElement | undefined;

/** Zuletzt in `el.src` gesetzter Dateiname - verhindert einen Neustart des laufenden Titels bei JEDER (auch unrelated) Store-Änderung, s. Dateikommentar. */
let currentAppliedTrack: string | undefined;

function trackUrl(fileName: string): string {
  return `/music/${encodeURIComponent(fileName)}`;
}

function ensureAudioElement(): HTMLAudioElement {
  if (audioEl) return audioEl;
  const el = document.createElement("audio");
  el.preload = "auto";
  // Keine nativen Browser-Controls - Statusleiste/Deckbau-Header haben ein
  // eigenes Musik-Panel (s. components/musicPanel.ts).
  el.style.display = "none";
  el.addEventListener("ended", () => {
    // Feuert im Einzeltitel-Wiederholungsmodus (`el.loop === true`) nie, da
    // der Browser dort intern loopt, ohne 'ended' auszulösen - die
    // Repeat-Mode-Prüfung hier ist daher nur eine zusätzliche Absicherung.
    if (getMusicRepeatMode() === "playlist") {
      advanceToNextMusicTrack();
    }
  });
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
  const track = getMusicCurrentTrack();
  // Einzeltitel-Wiederholung übernimmt das native loop-Attribut; im
  // Playlist-Modus bleibt loop aus, damit 'ended' feuert (s.o.).
  el.loop = getMusicRepeatMode() === "track";

  if (!track) {
    // Kein Titel verfügbar (Ordner leer oder Liste noch nicht geladen) -
    // nichts abzuspielen, sauber anhalten statt mit einer veralteten/leeren
    // src weiterzumachen.
    if (currentAppliedTrack !== undefined) {
      el.pause();
      el.removeAttribute("src");
      currentAppliedTrack = undefined;
    }
    return;
  }

  if (track !== currentAppliedTrack) {
    currentAppliedTrack = track;
    el.src = trackUrl(track);
  }

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
 * Auto-Discovery: fragt `/music/index.json` ab (s. vite.config.ts#musicIndexPlugin)
 * und spiegelt das Ergebnis über `setMusicTracks()` in den Store - dessen
 * `notify()` löst dank der bereits aktiven `subscribe(applyPlaybackState)`
 * automatisch eine erneute Zustandsanwendung aus (kein manueller Folgeaufruf
 * hier nötig). Bewusst durchgehend defensiv: weder ein Netzwerkfehler noch
 * ein unerwartetes Antwortformat (leerer Ordner, kaputtes JSON, ...) dürfen
 * die App zum Absturz bringen - im schlimmsten Fall bleibt die Playlist
 * schlicht leer (s. store.ts#getMusicCurrentTrack, dort robust auf
 * `undefined` behandelt).
 */
async function loadTrackList(): Promise<void> {
  try {
    const res = await fetch("/music/index.json");
    if (!res.ok) return;
    const data: unknown = await res.json();
    const rawTracks =
      data && typeof data === "object" && Array.isArray((data as { tracks?: unknown }).tracks)
        ? (data as { tracks: unknown[] }).tracks
        : [];
    setMusicTracks(rawTracks.filter((t): t is string => typeof t === "string"));
  } catch {
    // Netzwerkfehler/kaputtes JSON o.ä. - Playlist bleibt leer (s.o.).
  }
}

/**
 * Einmalig aus main.ts aufzurufen: erzeugt das persistente <audio>-Element,
 * verdrahtet es mit dem Store (jede Änderung synchronisiert Titel/Play/
 * Pause/Loop), lädt die aktuelle Titel-Liste per Auto-Discovery und richtet
 * den "erste Interaktion startet die Musik"-Fallback ein.
 */
export function initMusicPlayer(): void {
  ensureAudioElement();
  subscribe(applyPlaybackState);
  startOnFirstInteraction();
  void loadTrackList();
  // Direkter Versuch beim Start (schlägt i.d.R. lautlos fehl, s.o.) - falls
  // die Seite ausnahmsweise bereits "user activation" hat, setzt die Musik
  // ohne weitere Interaktion sofort ein.
  applyPlaybackState();
}
