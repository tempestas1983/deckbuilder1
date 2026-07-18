/**
 * Anzeige-Bausteine für den Tutorial-Modus (v0.1.11, s. docs/frontend-status.md):
 * eine einzelne, wegklickbare Sprechblase (`tutorialTipBubble`, erscheint
 * einmalig pro Tipp-Art, s. store.ts#maybeQueueTutorialTips/dismissTutorialTip)
 * sowie ein jederzeit über das "?"-Symbol abrufbares Panel mit ALLEN
 * Tutorial-Texten (`tutorialHelpPanel`, unabhängig vom aktuellen Spielstand -
 * s. Auftrag Punkt 4: "nicht zwingend an den exakten Spielzustand gebunden").
 * Reine Darstellung, keine eigene Logik - welcher Tipp gerade ansteht/ob das
 * Panel offen ist, entscheidet ausschließlich store.ts.
 */

import { TUTORIAL_TIPS, type TutorialTip } from "../tutorialContent";
import { h, text } from "../h";

export function tutorialTipBubble(tip: TutorialTip, onDismiss: () => void): HTMLElement {
  return h("div", { class: "tutorial-tip-bubble", "data-testid": "tutorial-tip" }, [
    h("div", { class: "tutorial-tip-title" }, [text(tip.title)]),
    h("div", { class: "tutorial-tip-body" }, [text(tip.body)]),
    h(
      "button",
      { class: "btn btn-play tutorial-tip-dismiss-btn", onclick: onDismiss },
      [text("Verstanden")],
    ),
  ]);
}

export function tutorialHelpButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    { class: "btn tutorial-help-btn", title: "Tutorial-Erklärungen erneut ansehen", onclick: onClick },
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
            h("h3", { class: "tutorial-help-title" }, [text("Tutorial-Erklärungen")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: onClose }, [text("Schließen")]),
          ]),
          h(
            "div",
            { class: "tutorial-help-list" },
            TUTORIAL_TIPS.map((tip) =>
              h("div", { class: "tutorial-help-entry" }, [
                h("div", { class: "tutorial-help-entry-title" }, [text(tip.title)]),
                h("div", { class: "tutorial-help-entry-body" }, [text(tip.body)]),
              ]),
            ),
          ),
        ],
      ),
    ],
  );
}
