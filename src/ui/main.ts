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

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root-Element #app nicht gefunden - siehe index.html.");
}

subscribe(() => render(root));
render(root);
