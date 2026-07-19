/**
 * Anzeige-Bausteine für den geführten Tutorial-Modus (v0.1.16, s.
 * docs/frontend-status.md + `../tutorialContent.ts`). Drei Elemente:
 *
 * - `tutorialInstructionBanner`: nicht-modales Hinweis-Banner, solange die
 *   erwartete Aktion eines Schritts noch aussteht (Instruktions-Phase eines
 *   Aktions-Schritts) - blockiert bewusst NICHTS (Spielbrett bleibt normal
 *   bedienbar, Bot-Zug-Loop läuft normal weiter, s. store.ts), trägt aber
 *   IMMER einen "Schritt überspringen"-Link als Sicherheitsnetz.
 * - `tutorialModalBubble`: modale Sprechblase für die Bestätigung eines
 *   Aktions-Schritts (Aktion wurde erkannt) ODER für einen bereits erreichten
 *   Info-Schritt (z.B. Prioritätskonzept, Kampfschaden-Beobachtung) - genau
 *   EIN "Weiter"-Button rückt die Sequenz weiter.
 * - `tutorialHelpButton`/`tutorialHelpPanel`: jederzeit abrufbares Nachschlage-
 *   werk ALLER Schritte (Instruktion + Bestätigung), unabhängig vom aktuellen
 *   Spielstand/Sequenz-Fortschritt.
 *
 * Reine Darstellung, keine eigene Logik - welcher Schritt/welche Phase gerade
 * ansteht, entscheidet ausschließlich store.ts.
 */

import { TUTORIAL_STEPS, type TutorialStep } from "../tutorialContent";
import { h, text } from "../h";

export function tutorialInstructionBanner(step: TutorialStep, onSkip: () => void): HTMLElement {
  return h("div", { class: "tutorial-instruction-banner", "data-testid": "tutorial-instruction" }, [
    h("div", { class: "tutorial-instruction-title" }, [text(step.instruction.title)]),
    h("div", { class: "tutorial-instruction-body" }, [text(step.instruction.body)]),
    h(
      "button",
      { class: "btn btn-cancel btn-small tutorial-skip-btn", onclick: onSkip },
      [text("Schritt überspringen")],
    ),
  ]);
}

export function tutorialModalBubble(step: TutorialStep, onDismiss: () => void): HTMLElement {
  const shown = step.infoOnly ? step.instruction : step.confirmation;
  return h("div", { class: "tutorial-tip-bubble", "data-testid": "tutorial-tip" }, [
    h("div", { class: "tutorial-tip-title" }, [text(shown.title)]),
    h("div", { class: "tutorial-tip-body" }, [text(shown.body)]),
    h(
      "button",
      { class: "btn btn-play tutorial-tip-dismiss-btn", onclick: onDismiss },
      [text("Weiter")],
    ),
  ]);
}

export function tutorialHelpButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    { class: "btn tutorial-help-btn", title: "Tutorial-Schritte erneut ansehen", onclick: onClick },
    [text("? Hilfe")],
  );
}

export function tutorialHelpPanel(onClose: () => void): HTMLElement {
  return h(
    "div",
    {
      class: "tutorial-help-backdrop",
      onclick: onClose,
    },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Tutorial-Schritte")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: onClose }, [text("Schließen")]),
          ]),
          h(
            "div",
            { class: "tutorial-help-list" },
            TUTORIAL_STEPS.map((step) =>
              h("div", { class: "tutorial-help-entry" }, [
                h("div", { class: "tutorial-help-entry-title" }, [text(step.instruction.title)]),
                h("div", { class: "tutorial-help-entry-body" }, [text(step.instruction.body)]),
                !step.infoOnly
                  ? h("div", { class: "tutorial-help-entry-body tutorial-help-entry-confirmation" }, [
                      text(step.confirmation.body),
                    ])
                  : undefined,
              ]),
            ),
          ),
        ],
      ),
    ],
  );
}
