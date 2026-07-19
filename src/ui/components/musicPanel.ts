/**
 * Musik-Panel: Button in der Statusleiste/im Deckbau-Header öffnet ein
 * Popover mit (1) An/Aus, (2) der automatisch ermittelten Titel-Liste zum
 * Anklicken (aktuell spielender Titel hervorgehoben) und (3) dem
 * Wiederholungsmodus (aktuellen Titel loopen vs. alle Titel der Reihe nach).
 * Strukturell an `keywordGlossaryPanel.ts` angelehnt (Button + Backdrop-Panel,
 * gleiche `.tutorial-help-*`-CSS-Klassen für Rahmen/Kopfzeile/Liste statt
 * eigener Panel-Optik) - ersetzt den bisherigen einfachen Mute-Button
 * (`musicToggle.ts`), der für Titelauswahl+Wiederholungsmodus nicht mehr
 * ausreicht.
 *
 * Reine Anzeige-/Klick-Komponente: das eigentliche Abspielen (inkl.
 * `<audio>`-Element, Titelwechsel, `ended`-Weiterschalten im Playlist-Modus)
 * übernimmt `../musicPlayer.ts` über den Store (Observer-Muster, s. dortiger
 * Kommentar) - hier wird nichts an Audio-APIs angefasst.
 */

import type { MusicRepeatMode } from "../store";
import { h, text } from "../h";

export function musicPanelButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "btn music-toggle-btn",
      title: "Musik: Titel, An/Aus, Wiederholung",
      onclick: onClick,
      "data-testid": "music-panel-btn",
    },
    [text("Musik")],
  );
}

export interface MusicPanelOptions {
  enabled: boolean;
  tracks: string[];
  currentTrack: string | undefined;
  repeatMode: MusicRepeatMode;
  onToggleEnabled: () => void;
  onSelectTrack: (track: string) => void;
  onSetRepeatMode: (mode: MusicRepeatMode) => void;
  onClose: () => void;
}

/**
 * Reine Anzeige-Kosmetik: Dateiendung weg, Unterstriche als Leerzeichen -
 * es gibt keine serverseitigen Metadaten (Titel/Interpret), nur Dateinamen
 * unter docs/music/ (z.B. "Three_Coins_on_the_Table.mp3" ->
 * "Three Coins on the Table").
 */
function trackLabel(fileName: string): string {
  return fileName.replace(/\.[^./]+$/, "").replace(/_/g, " ");
}

export function musicPanel(opts: MusicPanelOptions): HTMLElement {
  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "music-panel", onclick: opts.onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel music-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Musik")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: opts.onClose }, [text("Schließen")]),
          ]),
          h(
            "button",
            {
              class: "btn music-panel-enabled-btn",
              onclick: opts.onToggleEnabled,
              "data-testid": "music-panel-enabled-btn",
            },
            [text(opts.enabled ? "Musik: An" : "Musik: Aus")],
          ),
          h("div", { class: "music-panel-repeat-row" }, [
            h("span", { class: "music-panel-repeat-label" }, [text("Wiederholung:")]),
            h(
              "button",
              {
                class:
                  "btn btn-small music-panel-repeat-btn" +
                  (opts.repeatMode === "track" ? " music-panel-repeat-btn-active" : ""),
                title: "Aktuellen Titel in Dauerschleife wiederholen",
                onclick: () => opts.onSetRepeatMode("track"),
                "data-testid": "music-repeat-track-btn",
              },
              [text("Titel wiederholen")],
            ),
            h(
              "button",
              {
                class:
                  "btn btn-small music-panel-repeat-btn" +
                  (opts.repeatMode === "playlist" ? " music-panel-repeat-btn-active" : ""),
                title: "Alle Titel der Reihe nach abspielen, danach von vorne",
                onclick: () => opts.onSetRepeatMode("playlist"),
                "data-testid": "music-repeat-playlist-btn",
              },
              [text("Alle nacheinander")],
            ),
          ]),
          opts.tracks.length === 0
            ? h("div", { class: "music-panel-empty" }, [
                text("Keine Titel gefunden - lege MP3-/OGG-/WAV-/M4A-Dateien unter docs/music/ ab."),
              ])
            : h(
                "div",
                { class: "tutorial-help-list music-panel-track-list", "data-testid": "music-panel-track-list" },
                opts.tracks.map((track) =>
                  h(
                    "button",
                    {
                      class:
                        "btn btn-small music-panel-track" +
                        (track === opts.currentTrack ? " music-panel-track-current" : ""),
                      title: track,
                      onclick: () => opts.onSelectTrack(track),
                    },
                    [text(trackLabel(track))],
                  ),
                ),
              ),
        ],
      ),
    ],
  );
}
