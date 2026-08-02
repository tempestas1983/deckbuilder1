/**
 * Einstiegspunkt des Frontends (Vite-Entry, siehe index.html).
 * Verdrahtet Store <-> Render-Loop und zeigt initial das Hauptmenü (AppPhase
 * "mainMenu", s. store.ts/types.ts) - von dort führt "Neues Spiel" über die
 * Gegner-Auswahl in den Deckbau-Screen (AppPhase "deckbuild"); erst nachdem
 * beide Decklisten bestätigt sind (bzw. player2 als KI übersprungen wurde)
 * läuft `initGame` und das eigentliche Spielbrett erscheint. Vor dem "echtes
 * Hauptmenü"-Umbau startete die App direkt im Deckbau-Screen (v0.1.5 -
 * v0.1.x); noch davor (vor v0.1.5) lief hier automatisch eine Demo-Partie mit
 * zwei identischen Zufalls-Decks (`buildDemoDeck`, deck.ts) - das ist jetzt
 * der "Zufällig füllen"-Button im Deckbau-Screen.
 */

import "./style.css";
import { subscribe } from "./store";
import { render } from "./render";
import { initMusicPlayer } from "./musicPlayer";
import { initSfxPlayer } from "./sfxPlayer";
import { initBoardBackdrop } from "./components/sceneArt";
import { asset } from "./assetUrl";

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

// PWA-Offline-Caching (s. serviceWorkerPlugin()/buildServiceWorkerSource() in
// vite.config.ts für die Runtime-Caching-Strategie + Cache-Versionierung).
// Zwei Sicherungen, warum das hier unproblematisch ist:
// - `import.meta.env.PROD`: `sw.js` existiert nur als Build-Artefakt (s.
//   serviceWorkerPlugin#closeBundle) - im Vite-Dev-Server (`npm run dev`)
//   gibt es dafür keine Route, und ein Service Worker würde dort ohnehin
//   Vites eigenes HMR (Hot Module Replacement) stören, s. Kommentar an
//   serviceWorkerPlugin. Damit bleibt `npm run dev` unverändert netzwerkfrisch.
// - `'serviceWorker' in navigator`: jsdom (Vitest-Testumgebung, s.
//   src/ui/__tests__/) kennt `navigator.serviceWorker` nicht - ohne diese
//   Prüfung würde jeder Test, der main.ts importiert, mit einem TypeError
//   abbrechen. `import.meta.env.PROD` ist in Vitest ebenfalls false, diese
//   Prüfung greift also zusätzlich als zweite, unabhängige Absicherung.
// `asset("sw.js")` statt hartkodiert "/deckbuilder/sw.js" (s.
// assetUrl.ts-Dateikommentar) - dieselbe BASE_URL-Auflösung wie für alle
// anderen Asset-URLs (SFX/Musik/Artwork) der App.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  navigator.serviceWorker.register(asset("sw.js")).catch(() => {
    // Registrierung ist ein reines Offline-/Installierbarkeits-Extra - ein
    // Fehlschlag (z.B. Browser ohne SW-Unterstützung, HTTP statt HTTPS beim
    // Testen) darf die App nicht beeinträchtigen, daher bewusst stumm.
  });
}
