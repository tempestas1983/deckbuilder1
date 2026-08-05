/**
 * Hauptmenü / Titelbildschirm (echter App-Einstiegspunkt, s.
 * types.ts#AppPhase + store.ts#appPhase-Dateikommentar). Löst den
 * bisherigen Direkteinstieg in den player1-Deckbau-Screen ab (Auftrag: "die
 * App soll sich strukturell mehr wie ein richtiges Computerspiel anfühlen -
 * ein echtes Hauptmenü als Einstiegspunkt").
 *
 * Reine Optionen-Komponente (drei Callback-Props für die Hauptaktionen, s.
 * render.ts#renderRoot) - keine eigene Navigations-/Store-Logik hier, genau
 * wie deckBuilderScreen. Für die App-weiten Musik-/Soundeffekt-Umschalter
 * gilt dieselbe Ausnahme wie in deckBuilder.ts: die sind hier (wie überall
 * sonst "jederzeit erreichbar") direkt gegen den Store verdrahtet, statt
 * über weitere Callback-Props durchgereicht zu werden.
 *
 * Die bereits vorhandene Taverne-Hintergrundatmosphäre (s.
 * components/sceneArt.ts#initBoardBackdrop) läuft unabhängig von `#app` als
 * eigenes `<img>` auf Body-Ebene weiter (von main.ts einmalig initialisiert)
 * und ist auf diesem Screen automatisch sichtbar, ohne dass dieser Screen
 * selbst irgendetwas dafür tun müsste - `.main-menu-screen` bleibt daher
 * bewusst größtenteils durchscheinend (s. style.css) statt sie mit einer
 * weiteren deckenden Fläche zu verdecken.
 */

import { h, text } from "../h";
import {
  closeMusicPanel,
  closeRulesGuide,
  getMusicCurrentTrack,
  getMusicRepeatMode,
  getMusicTracks,
  getSavedGameSummary,
  hasSavedGame,
  isMusicEnabled,
  isMusicPanelOpen,
  isRulesGuideOpen,
  isSfxEnabled,
  selectMusicTrack,
  setMusicRepeatMode,
  toggleMusicEnabled,
  toggleMusicPanel,
  toggleRulesGuide,
  toggleSfxEnabled,
} from "../store";
import { musicPanel, musicPanelButton } from "./musicPanel";
import { rulesGuidePanel } from "./rulesGuidePanel";
import { sfxToggleButton } from "./sfxToggle";
import { opponentLabel } from "./statsScreen";

export interface MainMenuOptions {
  /** "Neues Spiel" - führt zur Gegner-Auswahl (opponentSelect), NICHT direkt in den Deckbau (s. store.ts#startNewGameFlow). */
  onNewGame: () => void;
  /** "Deck Builder" - eigenständiger Deckbau-Modus ohne anschließende Partie (s. store.ts#openDeckBuilderStandalone). */
  onDeckBuilder: () => void;
  /** "Tutorial" - startet direkt die geführte Beispielpartie (s. store.ts#startTutorial, unverändert gegenüber dem bisherigen Einstieg über den player1-Deckbau-Screen). */
  onTutorial: () => void;
  /** "Statistik" - zeigt den Spielverlauf-Screen (s. store.ts#openStats/types.ts#AppPhase "stats"). */
  onStats: () => void;
  /** "Weiter spielen" - setzt den automatisch gespeicherten Spielstand fort (s. store.ts#resumeSavedGame). Nur relevant, wenn `hasSavedGame()` true ist (s.u.). */
  onResumeGame: () => void;
}

/**
 * "Weiter spielen" - nur sichtbar, wenn ein Autosave vorliegt (s.
 * store.ts#hasSavedGame/getSavedGameSummary, "Spielspeicher in der Partie").
 * Zeigt zusätzlich zum Label eine kleine Vorschauzeile (Zug-Nummer +
 * Gegnertyp, gleiches Label wie im Statistik-Screen, s.
 * components/statsScreen.ts#opponentLabel) - analog zu den `main-menu-btn-
 * hint`-Untertiteln der übrigen Buttons, nur mit tatsächlichen Partiedaten
 * statt einer statischen Beschreibung.
 */
function resumeGameButton(onResumeGame: () => void): HTMLElement | undefined {
  if (!hasSavedGame()) return undefined;
  const summary = getSavedGameSummary();
  if (!summary) return undefined;
  return h(
    "button",
    { class: "btn btn-play main-menu-btn main-menu-resume-game-btn", onclick: onResumeGame },
    [
      h("span", { class: "main-menu-btn-label" }, [text("Weiter spielen")]),
      h("span", { class: "main-menu-btn-hint" }, [
        text(`Zug ${summary.turnNumber} - Gegner: ${opponentLabel(summary.opponent)}`),
      ]),
    ],
  );
}

export function mainMenuScreen(opts: MainMenuOptions): HTMLElement {
  return h("div", { class: "main-menu-screen" }, [
    h("div", { class: "main-menu-header-actions" }, [
      musicPanelButton(() => toggleMusicPanel()),
      sfxToggleButton(isSfxEnabled(), () => toggleSfxEnabled()),
    ]),
    h("div", { class: "main-menu-titlecard" }, [
      h("div", { class: "main-menu-title" }, [text("Zur Goldenen Taverne")]),
      h("div", { class: "main-menu-subtitle" }, [text("Ein Kartenspiel für Zecher, Zauberer und Zocker")]),
    ]),
    h("div", { class: "main-menu-buttons" }, [
      resumeGameButton(opts.onResumeGame),
      h(
        "button",
        { class: "btn btn-play main-menu-btn main-menu-new-game-btn", onclick: opts.onNewGame },
        [
          h("span", { class: "main-menu-btn-label" }, [text("Neues Spiel")]),
          h("span", { class: "main-menu-btn-hint" }, [text("Gegen die KI oder im Hotseat gegen einen zweiten Menschen")]),
        ],
      ),
      h(
        "button",
        { class: "btn main-menu-btn main-menu-deckbuilder-btn", onclick: opts.onDeckBuilder },
        [
          h("span", { class: "main-menu-btn-label" }, [text("Deck Builder")]),
          h("span", { class: "main-menu-btn-hint" }, [text("Decks in Ruhe zusammenstellen, speichern und analysieren")]),
        ],
      ),
      h(
        "button",
        { class: "btn main-menu-btn main-menu-tutorial-btn", onclick: opts.onTutorial },
        [
          h("span", { class: "main-menu-btn-label" }, [text("Tutorial")]),
          h("span", { class: "main-menu-btn-hint" }, [text("Geführte Beispielpartie mit Erklärungen zu allen Grundlagen")]),
        ],
      ),
      h(
        "button",
        {
          class: "btn main-menu-btn main-menu-rules-guide-btn",
          onclick: () => toggleRulesGuide(),
          "data-testid": "rules-guide-btn",
        },
        [
          h("span", { class: "main-menu-btn-label" }, [text("Anleitung")]),
          h("span", { class: "main-menu-btn-hint" }, [text("Kartentypen, Schlüsselwörter und Tipps zum Nachlesen - kein Zeitdruck, keine Partie")]),
        ],
      ),
      h(
        "button",
        { class: "btn main-menu-btn main-menu-stats-btn", onclick: opts.onStats },
        [
          h("span", { class: "main-menu-btn-label" }, [text("Statistik")]),
          h("span", { class: "main-menu-btn-hint" }, [text("Spielverlauf und Sieg-/Niederlage-Bilanz früherer Partien")]),
        ],
      ),
    ]),
    isMusicPanelOpen()
      ? musicPanel({
          enabled: isMusicEnabled(),
          tracks: getMusicTracks(),
          currentTrack: getMusicCurrentTrack(),
          repeatMode: getMusicRepeatMode(),
          onToggleEnabled: () => toggleMusicEnabled(),
          onSelectTrack: (track) => selectMusicTrack(track),
          onSetRepeatMode: (mode) => setMusicRepeatMode(mode),
          onClose: () => closeMusicPanel(),
        })
      : undefined,
    isRulesGuideOpen() ? rulesGuidePanel(() => closeRulesGuide()) : undefined,
  ]);
}
