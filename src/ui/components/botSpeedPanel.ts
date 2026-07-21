/**
 * Bot-Geschwindigkeits-Panel: Button in der Statusleiste öffnet ein Popover
 * mit drei Presets ("Schnell"/"Normal"/"Langsam"), die steuern, wie lange
 * zwischen zwei automatischen KI-Einzelschritten gewartet wird (s.
 * store.ts#setBotSpeedPreset/BOT_SPEED_DELAYS_MS für die konkreten
 * Millisekunden-Werte und die Nebenbedingung zur View-Transition-Dauer).
 *
 * Nutzer-Feedback: "die spielzüge des computers sind zu schnell ... ein
 * mensch hat kaum chancen, das zu sehen und nachzuvollziehen" - MUSS während
 * einer laufenden Partie erreichbar sein, nicht nur im Deckbau-Screen, s.
 * render.ts#statusBar. Strukturell an `musicPanel.ts` angelehnt (Button +
 * Backdrop-Panel, gleiche `.tutorial-help-*`-CSS-Klassen für Rahmen/
 * Kopfzeile/Liste statt eigener Panel-Optik).
 */

import type { BotSpeedPreset } from "../store";
import { h, text } from "../h";

export function botSpeedPanelButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    {
      class: "btn bot-speed-toggle-btn",
      title: "Bot-Zuggeschwindigkeit einstellen",
      onclick: onClick,
      "data-testid": "bot-speed-panel-btn",
    },
    [text("Bot-Tempo")],
  );
}

export interface BotSpeedPanelOptions {
  current: BotSpeedPreset;
  labels: Record<BotSpeedPreset, string>;
  onSelect: (preset: BotSpeedPreset) => void;
  onClose: () => void;
}

const PRESET_ORDER: BotSpeedPreset[] = ["fast", "normal", "slow"];

export function botSpeedPanel(opts: BotSpeedPanelOptions): HTMLElement {
  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "bot-speed-panel", onclick: opts.onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel bot-speed-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Bot-Tempo")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: opts.onClose }, [text("Schließen")]),
          ]),
          h(
            "div",
            { class: "bot-speed-panel-row" },
            PRESET_ORDER.map((preset) =>
              h(
                "button",
                {
                  class:
                    "btn btn-small bot-speed-panel-btn" +
                    (preset === opts.current ? " bot-speed-panel-btn-active" : ""),
                  onclick: () => opts.onSelect(preset),
                  "data-testid": `bot-speed-${preset}-btn`,
                },
                [text(opts.labels[preset])],
              ),
            ),
          ),
        ],
      ),
    ],
  );
}
