/**
 * Auftrag Teil 3b (Nutzer-Feedback anhand eines Screenshots, s. render.ts-
 * Aufrufstelle): macht einen ECHTEN Entscheidungsmoment für einen
 * menschlichen Spieler auffällig sichtbar - deutlich prominenter als der
 * bisherige, unauffällige "Priorität passen"-Button in der Statusleiste.
 *
 * Zeigt store.ts (über render.ts#decisionSpotlightPlayer) an, dass GENAU
 * JETZT eine echte Wahl ansteht (Auto-Pass aus Teil 1 greift bewusst NICHT,
 * weil `legalActions` mehr als nur `passPriority`/`concede` anbietet) - reine
 * Anzeige, KEINE eigene Legalitätsprüfung.
 *
 * WICHTIG (Auftrag): darf die eigentliche Aktion nicht verhindern - deshalb
 * bewusst ein nicht-blockierendes Banner (kein Backdrop, kein Modal) statt
 * eines "Willst du blocken?"-Popups, das das Board verdeckt/unklickbar macht.
 * Handkarten/Fähigkeiten bleiben normal klickbar; der "Überspringen"-Button
 * hier dispatcht exakt dieselbe `passPriority`-Aktion wie der bestehende
 * Button in der Statusleiste (s. render.ts#statusBar) - kein zweiter
 * Mechanismus, nur eine auffälligere zusätzliche Einladung, sie zu nutzen.
 *
 * Nutzer-Feedback 2026-08-02 ("muss bei JEDEM Priority-Fenster einzeln
 * passen, nur weil eine Handkarte theoretisch castbar bleibt, die gerade gar
 * nicht gespielt werden soll"): zweiter, zusätzlicher Button "Weiter bis was
 * passiert" (s. store.ts#passUntilSomethingHappens) - überspringt bewusst
 * MEHRERE eigene Priority-Fenster hintereinander, bis entweder die eigene
 * nächste Hauptphase erreicht ist oder sich etwas Neues ergibt (Reaktion des
 * Gegners, eine echte Entscheidung), statt jedes einzelne Fenster manuell
 * wegklicken zu müssen. Ein EINMALIGER, bewusst ausgelöster Vorgang - kein
 * Dauer-Modus, kein Ersatz für den bestehenden "Überspringen"-Button.
 */

import { h, text } from "../h";

export function decisionSpotlightBanner(
  playerLabel: string,
  disabledReason: string | undefined,
  onSkip: () => void,
  onSkipUntilSomethingHappens: () => void,
): HTMLElement {
  return h("div", { class: "decision-spotlight-banner", "data-testid": "decision-spotlight" }, [
    h("div", { class: "decision-spotlight-icon" }, [text("★")]),
    h("div", { class: "decision-spotlight-text" }, [
      h("div", { class: "decision-spotlight-title" }, [text(`${playerLabel} ist am Zug zu entscheiden`)]),
      h("div", { class: "decision-spotlight-body" }, [
        text("Spielt eine Karte/Fähigkeit aus - oder überspringt diesen Moment, wenn ihr nichts tun möchtet."),
      ]),
    ]),
    h("div", { class: "decision-spotlight-actions" }, [
      h(
        "button",
        {
          class: "btn btn-play decision-spotlight-skip-btn",
          disabled: !!disabledReason,
          title: disabledReason,
          onclick: () => {
            if (disabledReason) return;
            onSkip();
          },
        },
        [text("Überspringen")],
      ),
      h(
        "button",
        {
          class: "btn btn-cancel decision-spotlight-skip-until-btn",
          disabled: !!disabledReason,
          title:
            disabledReason ??
            "Passt mehrfach hintereinander, bis eure nächste eigene Hauptphase erreicht ist oder etwas Neues passiert (z.B. eine Reaktion des Gegners).",
          onclick: () => {
            if (disabledReason) return;
            onSkipUntilSomethingHappens();
          },
        },
        [text("Weiter bis was passiert")],
      ),
    ]),
  ]);
}
