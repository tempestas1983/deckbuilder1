/**
 * Kurzer Kampfbericht nach jedem Kampf (Nutzer-Feedback 2026-07-25: "wir
 * brauchen nach jedem Kampf eine kurze Übersicht, was passiert ist").
 *
 * Ein Kampf lief bisher spurlos vorbei - Schaden wird automatisch verrechnet,
 * Einheiten sterben, und danach steht nur noch das Ergebnis auf dem Brett.
 * Besonders bei einem Bot-Angriff war hinterher nicht mehr nachvollziehbar,
 * welcher Blocker welchen Angreifer erwischt hat und woran eine Einheit
 * gestorben ist.
 *
 * Bewusst NICHT modal: der Bericht erzählt, was schon passiert ist, und darf
 * den nächsten Zug nicht ausbremsen. Er bleibt stehen, bis er weggeklickt wird
 * oder der nächste Kampf beginnt (s. store.ts#recordCombatEvent) - Lesen ohne
 * Zeitdruck, aber ohne Pflichtklick pro Kampf.
 *
 * Reine Darstellung: alle Angaben kommen fertig aus der `CombatSummary`, die
 * store.ts aus den GameEvents der Engine mitschreibt. Hier wird nichts über
 * Kampfregeln entschieden oder nachgerechnet.
 */

import type { PlayerId } from "../../model";
import type { CombatSummary } from "../store";
import { h, text } from "../h";

export interface CombatSummaryPanelOptions {
  /** Anzeigename je Spieler (Tavernen-Name bei Bots, s. render.ts#playerDisplayName). */
  nameOf: (player: PlayerId) => string;
  onDismiss: () => void;
}

export function combatSummaryPanel(summary: CombatSummary, opts: CombatSummaryPanelOptions): HTMLElement {
  const attackerRows = summary.attackers.map((a) => {
    const blocked = a.blockers.length > 0;
    // Drei mögliche Ausgänge pro Angreifer, in der Reihenfolge, in der man sie
    // beim Nachlesen wissen will: geblockt (von wem?) - durchgekommen (wie viel?) -
    // geblockt UND trotzdem durchgeschlagen (trample).
    const outcome = blocked
      ? `geblockt von ${a.blockers.join(", ")}${
          a.damageToDefendingPlayer > 0 ? ` · ${a.damageToDefendingPlayer} Schaden durchgeschlagen` : ""
        }`
      : a.damageToDefendingPlayer > 0
        ? `unblockiert · ${a.damageToDefendingPlayer} Schaden`
        : "unblockiert · kein Schaden";

    return h("li", { class: `combat-summary-attacker${blocked ? " combat-summary-attacker-blocked" : ""}` }, [
      h("span", { class: "combat-summary-attacker-name" }, [text(a.name)]),
      h("span", { class: "combat-summary-attacker-outcome" }, [text(outcome)]),
    ]);
  });

  const casualtyNodes =
    summary.casualties.length > 0
      ? h("div", { class: "combat-summary-casualties" }, [
          h("span", { class: "combat-summary-label" }, [text("Verluste")]),
          h(
            "span",
            { class: "combat-summary-casualty-list" },
            summary.casualties.map((c) =>
              h("span", { class: "combat-summary-casualty" }, [
                text(c.controller ? `${c.name} (${opts.nameOf(c.controller)})` : c.name),
              ]),
            ),
          ),
        ])
      : h("div", { class: "combat-summary-casualties combat-summary-casualties-none" }, [
          text("Keine Einheit ist gefallen."),
        ]);

  return h("div", { class: "combat-summary-panel" }, [
    h("div", { class: "combat-summary-head" }, [
      h("span", { class: "combat-summary-title" }, [
        text(`Kampf in Zug ${summary.turnNumber}: ${opts.nameOf(summary.attackingPlayer)} greift an`),
      ]),
      h(
        "button",
        {
          class: "btn btn-cancel btn-small combat-summary-dismiss-btn",
          type: "button",
          title: "Bericht schließen",
          onclick: opts.onDismiss,
        },
        [text("×")],
      ),
    ]),
    h("div", { class: "combat-summary-headline" }, [
      text(
        summary.damageToDefendingPlayer > 0
          ? `${opts.nameOf(summary.defendingPlayer)} nimmt ${summary.damageToDefendingPlayer} Schaden.`
          : `${opts.nameOf(summary.defendingPlayer)} nimmt keinen Schaden.`,
      ),
    ]),
    h("ul", { class: "combat-summary-attackers" }, attackerRows),
    casualtyNodes,
  ]);
}
