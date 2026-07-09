/**
 * Einstiegspunkt des Frontends (Vite-Entry, siehe index.html).
 * Startet eine Demo-Partie (starterSet-Kartenpool, zwei identische
 * Demo-Decks, siehe deck.ts) und verdrahtet Store <-> Render-Loop.
 */

import "./style.css";
import { initGame, subscribe } from "./store";
import { render } from "./render";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Root-Element #app nicht gefunden - siehe index.html.");
}

subscribe(() => render(root));
initGame();
