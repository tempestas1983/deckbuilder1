/**
 * Spieler-Kopfzeile: Leben, Manapool, Zonen-Größen (Library/Graveyard/Exile),
 * sowie Status-Badges (aktiver Spieler, Priority, ausstehende Entscheidung).
 * Optional als Ziel klickbar (z.B. "Feuerstoß" auf den Gegner).
 */

import type { GameState, PlayerId } from "../../model";
import { COLOR_LABEL } from "../cardInfo";
import { h, text } from "../h";

export interface PlayerPanelOptions {
  targetable?: boolean;
  onClick?: () => void;
  /** v0.1.7 ("Spieler 2 = KI"): zeigt ein "KI"-Badge, s. store.ts#isBotControlled. */
  botControlled?: boolean;
  /**
   * v0.1.9 (Bot-Schwierigkeitsstufen): Anzeigename der aktiven Stufe
   * ("Leicht"/"Mittel"/"Schwer", s. src/ai#BOT_DIFFICULTY_LABELS), angehängt
   * an das "KI"-Badge, z.B. "KI (Schwer)". Nur sinnvoll, wenn `botControlled`
   * true ist - render.ts setzt es nur dann.
   */
  botDifficultyLabel?: string;
  /**
   * Anzeigename in der Kopfzeile: bei bot-gesteuerten Spielern der erfundene
   * Tavernen-Name passend zur Schwierigkeitsstufe (s. src/ai/difficulty.ts
   * #BOT_DISPLAY_NAMES / render.ts#playerDisplayName), sonst die rohe
   * `PlayerId` ("player1"/"player2"). Optional mit Fallback auf `playerId`,
   * damit playerPanel auch ohne render.ts-Anbindung (z.B. künftige Tests)
   * sinnvoll funktioniert - die `PlayerId` selbst (data-player-Attribut
   * unten) bleibt davon komplett unberührt.
   */
  displayName?: string;
  /**
   * v0.1.8 (concede-Button): Callback für "Aufgeben". Nur gesetzt, wenn der
   * Button für diesen Spieler überhaupt angezeigt werden soll (render.ts
   * entscheidet das - z.B. nicht für bot-gesteuerte Spieler, nicht nach
   * Spielende) - playerPanel selbst kennt keine solche Regel, rendert nur
   * "Button vorhanden, wenn Callback vorhanden".
   */
  onConcede?: () => void;
  /**
   * Auftrag Punkt 3 ("Angriff/Schaden ... Lebenspunkte, die spürbar
   * reagieren statt zu springen"): `"up"`/`"down"`, wenn sich `p.life`
   * gegenüber dem zuletzt gerenderten Wert geändert hat (s.
   * render.ts#computeLifePulse - reine Anzeige-Ableitung, kein Teil des
   * GameState), sonst `undefined`. Löst eine kurze CSS-Puls-/Flash-Animation
   * aus (style.css `.life-pulse-up`/`.life-pulse-down`) - bewusst per
   * eigenständigem `animation`-Keyframe statt auf die View-Transitions-API
   * angewiesen zu sein (s. render.ts-Kommentarblock), damit das "Ticken"
   * auch in Browsern ohne deren Unterstützung sichtbar bleibt.
   */
  lifePulse?: "up" | "down";
}

export function playerPanel(state: GameState, playerId: PlayerId, opts: PlayerPanelOptions = {}): HTMLElement {
  const p = state.players[playerId];
  const badges: HTMLElement[] = [];
  if (opts.botControlled) badges.push(h("span", { class: "badge badge-bot" }, [text("KI")]));
  // v0.1.9: eigenes, separates Badge statt den Text von .badge-bot zu
  // erweitern - hält den bestehenden vs-bot.test.ts-Vertrag
  // (`.badge-bot`-Text === "KI") unverändert stabil.
  if (opts.botControlled && opts.botDifficultyLabel) {
    badges.push(h("span", { class: "badge badge-bot-difficulty" }, [text(opts.botDifficultyLabel)]));
  }
  if (state.activePlayer === playerId) badges.push(h("span", { class: "badge badge-active" }, [text("am Zug")]));
  if (state.priorityPlayer === playerId) badges.push(h("span", { class: "badge badge-priority" }, [text("Priority")]));
  if (state.pendingDecision?.player === playerId) {
    badges.push(h("span", { class: "badge badge-decision" }, [text("muss entscheiden")]));
  }
  if (p.hasLost) badges.push(h("span", { class: "badge badge-lost" }, [text("verloren")]));

  const manaBits = (["flame", "tide", "wild", "light", "void"] as const)
    .map((c) => (p.manaPool[c] > 0 ? `${p.manaPool[c]}× ${COLOR_LABEL[c]}` : undefined))
    .filter((x): x is string => !!x);
  if (p.manaPool.colorless > 0) manaBits.push(`${p.manaPool.colorless}× farblos`);

  const classes = ["player-panel"];
  if (opts.targetable) classes.push("targetable");

  return h(
    "div",
    {
      class: classes.join(" "),
      "data-player": playerId,
      onclick: opts.onClick as ((ev: Event) => void) | undefined,
    },
    [
      h("div", { class: "player-panel-head" }, [
        h("span", { class: "player-panel-name" }, [text(opts.displayName ?? playerId)]),
        ...badges,
        opts.onConcede
          ? h(
              "button",
              {
                class: "btn btn-cancel btn-small btn-concede",
                "data-testid": `concede-${playerId}`,
                onclick: ((ev: Event) => {
                  // player-panel selbst kann klickbares Ziel sein (opts.onClick,
                  // z.B. "Feuerstoß" auf den Gegner) - der Aufgeben-Klick darf das
                  // nicht mit auslösen.
                  ev.stopPropagation();
                  opts.onConcede!();
                }) as (ev: Event) => void,
              },
              [text("Aufgeben")],
            )
          : undefined,
      ]),
      h("div", { class: `player-panel-life${opts.lifePulse ? ` life-pulse-${opts.lifePulse}` : ""}` }, [
        text(`❤ ${p.life}`),
      ]),
      h("div", { class: "player-panel-mana" }, [text(manaBits.length ? `Mana: ${manaBits.join(", ")}` : "Mana: leer")]),
      h("div", { class: "player-panel-zones" }, [
        text(`Hand ${p.hand.length} · Bibliothek ${p.library.length} · Friedhof ${p.graveyard.length} · Exil ${p.exile.length}`),
      ]),
    ],
  );
}
