/**
 * Zwei Popover-Panels rund um benannte, dauerhaft gespeicherte Decks (s.
 * store.ts#SavedDeck fürs Persistenzmodell) - strukturell an
 * `musicPanel.ts`/`keywordGlossaryPanel.ts` angelehnt (Button öffnet ein
 * Backdrop-Panel, Klick auf den Backdrop schließt es, Klick INS Panel
 * propagiert nicht weiter):
 * - `saveDeckForm`: Name- (Pflicht) + Beschreibungsfeld (optional),
 *   "Speichern"/"Abbrechen" - KEIN natives `window.prompt()`.
 * - `loadDeckPanel`: Liste aller gespeicherten Decks (Name, Beschreibung,
 *   Kartenanzahl, Speicherdatum) mit je einem Laden-/Löschen-Button pro
 *   Eintrag.
 */

import type { SavedDeck } from "../store";
import { h, text } from "../h";

export function saveDeckButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    { class: "btn deckbuilder-save-deck-btn", onclick: onClick, "data-testid": "save-deck-btn" },
    [text("Deck speichern")],
  );
}

export function loadDeckButton(onClick: () => void): HTMLElement {
  return h(
    "button",
    { class: "btn deckbuilder-load-deck-btn", onclick: onClick, "data-testid": "load-deck-btn" },
    [text("Deck laden")],
  );
}

// Modul-scoped Entwurfszustand für Name/Beschreibung - exakt dasselbe Muster
// wie deckBuilder.ts#searchText: Tastatureingaben aktualisieren NUR diese
// Variablen (kein notify()/kompletter Rerender pro Zeichen, sonst verliert
// das Eingabefeld sofort den Fokus). Ein voller Rerender, der WÄHREND das
// Formular offen ist ausgelöst wird (z.B. durch +/- Klicks im Kartenpool
// dahinter), baut das Formular mit dem zuletzt getippten Entwurf neu auf -
// kein Datenverlust.
let nameDraft = "";
let descriptionDraft = "";

/** Setzt den Entwurf zurück - wird beim Schließen/erfolgreichen Speichern aufgerufen (s. deckBuilder.ts-Verdrahtung), damit das Formular beim nächsten Öffnen wieder leer startet statt den letzten Entwurf/das zuletzt gespeicherte Deck erneut anzuzeigen. */
export function resetSaveDeckDraft(): void {
  nameDraft = "";
  descriptionDraft = "";
}

export interface SaveDeckFormOptions {
  cardCount: number;
  onSave: (name: string, description: string) => void;
  onClose: () => void;
}

export function saveDeckForm(opts: SaveDeckFormOptions): HTMLElement {
  // `confirmBtn` wird unten deklariert, aber schon im `oninput`-Handler von
  // `nameInput` REFERENZIERT (nicht aufgerufen) - zulässig, weil der Handler
  // erst bei einer echten Tastatureingabe (also NACH der vollständigen
  // Konstruktion dieser Funktion) ausgeführt wird. So bleibt der
  // "Speichern"-Button reaktiv deaktiviert, solange der Name leer ist, OHNE
  // dafür bei jedem Tastendruck einen kompletten Store-Rerender auszulösen
  // (gleiches Direktzugriffs-Prinzip wie deckBuilder.ts#applyFilterVisibility).
  let confirmBtn: HTMLButtonElement | undefined;

  const nameInput = h("input", {
    type: "text",
    class: "save-deck-name-input",
    placeholder: "z.B. Feuer-Aggro",
    value: nameDraft,
    "data-testid": "save-deck-name-input",
    oninput: (ev: Event) => {
      nameDraft = (ev.target as HTMLInputElement).value;
      if (confirmBtn) confirmBtn.disabled = nameDraft.trim().length === 0;
    },
  });

  const descriptionInput = h(
    "textarea",
    {
      class: "save-deck-description-input",
      placeholder: "Kurze Notiz zur Strategie… (optional)",
      "data-testid": "save-deck-description-input",
      oninput: (ev: Event) => {
        descriptionDraft = (ev.target as HTMLTextAreaElement).value;
      },
    },
    [text(descriptionDraft)],
  );

  confirmBtn = h(
    "button",
    {
      class: "btn btn-play save-deck-confirm-btn",
      "data-testid": "save-deck-confirm-btn",
      disabled: nameDraft.trim().length === 0,
      onclick: () => opts.onSave(nameDraft, descriptionDraft),
    },
    [text("Speichern")],
  ) as HTMLButtonElement;

  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "save-deck-form", onclick: opts.onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel save-deck-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Deck speichern")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: opts.onClose }, [text("Abbrechen")]),
          ]),
          h("div", { class: "save-deck-hint" }, [text(`${opts.cardCount} Karten im aktuellen Deck.`)]),
          h("label", { class: "save-deck-field-label" }, [text("Name"), nameInput]),
          h("label", { class: "save-deck-field-label" }, [text("Beschreibung (optional)"), descriptionInput]),
          h("div", { class: "save-deck-actions" }, [
            h("button", { class: "btn btn-cancel", onclick: opts.onClose }, [text("Abbrechen")]),
            confirmBtn,
          ]),
        ],
      ),
    ],
  );
}

export interface LoadDeckPanelOptions {
  decks: SavedDeck[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function loadDeckPanel(opts: LoadDeckPanelOptions): HTMLElement {
  return h(
    "div",
    { class: "tutorial-help-backdrop", "data-testid": "load-deck-panel", onclick: opts.onClose },
    [
      h(
        "div",
        {
          class: "tutorial-help-panel load-deck-panel",
          onclick: ((ev: Event) => ev.stopPropagation()) as (ev: Event) => void,
        },
        [
          h("div", { class: "tutorial-help-header" }, [
            h("h3", { class: "tutorial-help-title" }, [text("Deck laden")]),
            h("button", { class: "btn btn-cancel btn-small", onclick: opts.onClose }, [text("Schließen")]),
          ]),
          opts.decks.length === 0
            ? h("div", { class: "load-deck-empty" }, [
                text('Noch keine gespeicherten Decks - benutzt zuerst "Deck speichern".'),
              ])
            : h(
                "div",
                { class: "tutorial-help-list load-deck-list", "data-testid": "load-deck-list" },
                opts.decks.map((deck) => loadDeckEntry(deck, opts.onLoad, opts.onDelete)),
              ),
        ],
      ),
    ],
  );
}

function loadDeckEntry(deck: SavedDeck, onLoad: (id: string) => void, onDelete: (id: string) => void): HTMLElement {
  const cardCount = Object.values(deck.decklist).reduce((sum, n) => sum + n, 0);
  return h(
    "div",
    { class: "tutorial-help-entry load-deck-entry", "data-deck-id": deck.id, "data-testid": "load-deck-entry" },
    [
      h("div", { class: "tutorial-help-entry-title load-deck-entry-name" }, [text(deck.name)]),
      deck.description
        ? h("div", { class: "tutorial-help-entry-body load-deck-entry-description" }, [text(deck.description)])
        : undefined,
      h("div", { class: "load-deck-entry-meta" }, [
        text(`${cardCount} Karten - gespeichert am ${formatSavedAt(deck.savedAt)}`),
      ]),
      h("div", { class: "load-deck-entry-actions" }, [
        h(
          "button",
          { class: "btn btn-small load-deck-load-btn", onclick: () => onLoad(deck.id) },
          [text("Laden")],
        ),
        h(
          "button",
          { class: "btn btn-small btn-cancel load-deck-delete-btn", onclick: () => onDelete(deck.id) },
          [text("Löschen")],
        ),
      ]),
    ],
  );
}

/** Reine Anzeige-Formatierung des ISO-Zeitstempels - fällt auf den Rohwert zurück, falls er (theoretisch, bei manuell manipuliertem localStorage) kein gültiges Datum ergibt. */
function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}
