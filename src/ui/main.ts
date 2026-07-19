/**
 * Einstiegspunkt des Frontends (Vite-Entry, siehe index.html).
 * Verdrahtet Store <-> Render-Loop und zeigt initial den Deckbau-Screen
 * (AppPhase "deckbuild", s. store.ts/types.ts) - erst nach "Spiel starten"
 * (beide Decklisten bestätigt) läuft `initGame` und das eigentliche
 * Spielbrett erscheint. Vor v0.1.5 startete hier automatisch eine
 * Demo-Partie mit zwei identischen Zufalls-Decks (`buildDemoDeck`,
 * deck.ts) - das ist jetzt der "Zufällig füllen"-Button im Deckbau-Screen.
 */

import "./style.css";
import { subscribe } from "./store";
import { render } from "./render";
import { initMusicPlayer } from "./musicPlayer";
import { initSfxPlayer } from "./sfxPlayer";
import { initBoardBackdrop } from "./components/sceneArt";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root-Element #app nicht gefunden - siehe index.html.");
}

subscribe(() => render(root));
render(root);

// App-weite Hintergrundmusik (s. musicPlayer.ts-Dateikommentar): eigenes
// Singleton-<audio>-Element AUSSERHALB von #app, überlebt damit jeden
// render()-Rebuild unangetastet. Bewusst NUR hier aufgerufen (App-
// Einstiegspunkt), nicht in store.ts/render.ts selbst.
initMusicPlayer();

// Kurze Soundeffekte (s. sfxPlayer.ts-Dateikommentar): analog NUR hier
// initialisiert (Testsicherheit) - store.ts/render.ts rufen zwar
// `playSfx()`/`playSfxForEvent()` auf, erzeugen aber selbst keine
// `<audio>`-Elemente.
initSfxPlayer();

// Taverne-Hintergrundfoto (s. sceneArt.ts#initBoardBackdrop-Dateikommentar):
// eigenes Singleton-<img>-Element AUSSERHALB von #app (viewport-breit statt
// auf die Breite von `.board` beschränkt), überlebt damit jeden
// render()-Rebuild unangetastet. Bewusst NUR hier aufgerufen, analog zu
// initMusicPlayer/initSfxPlayer oben.
initBoardBackdrop();
