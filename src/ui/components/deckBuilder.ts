/**
 * Deckbau-Screen: läuft VOR dem eigentlichen Spiel (siehe types.ts#AppPhase),
 * ein Screen pro Spieler, sequenziell (player1 zuerst, dann player2).
 *
 * Zeigt den kompletten Kartenpool (`getPool()`) mit +/- Kopienwahl pro
 * Karte, laufender Gesamtzahl + Validierungsstatus (deckValidation.ts, reine
 * UI-Logik - die Engine validiert Decklisten nicht selbst) sowie einfachen
 * Filtern (Typ/Farbe/Namenssuche).
 *
 * Filter/Suche laufen bewusst NICHT über den globalen Store (kein
 * `notify()`/kompletter Rerender pro Tastendruck) - das würde bei jedem
 * Zeichen im Suchfeld den kompletten Screen (inkl. Eingabefeld) neu aufbauen
 * und damit den Eingabefokus verlieren. Stattdessen hält dieses Modul den
 * Filterzustand lokal (modul-scoped, überlebt also auch echte Rerenders, die
 * durch +/- Klicks ausgelöst werden) und blendet Zeilen direkt per
 * `style.display` ein/aus - keine Spiellogik, reine Darstellungsfilterung.
 */

import type { CardDefinition, CardPool, CardType, ManaColor, PlayerId } from "../../model";
import { COLOR_LABEL, dominantColorKey, formatManaCost, typeLabel } from "../cardInfo";
import { h, text } from "../h";
import { validateDecklist } from "../deckValidation";

const TYPE_OPTIONS: Array<{ value: CardType | "all"; label: string }> = [
  { value: "all", label: "Alle Typen" },
  { value: "unit", label: "Einheiten" },
  { value: "spell", label: "Zauber" },
  { value: "relic", label: "Relikte" },
  { value: "enchantment", label: "Verzauberungen" },
  { value: "terrain", label: "Terrains" },
];

const COLOR_OPTIONS: Array<{ value: ManaColor | "colorless" | "all"; label: string }> = [
  { value: "all", label: "Alle Farben" },
  { value: "flame", label: COLOR_LABEL.flame },
  { value: "tide", label: COLOR_LABEL.tide },
  { value: "wild", label: COLOR_LABEL.wild },
  { value: "light", label: COLOR_LABEL.light },
  { value: "void", label: COLOR_LABEL.void },
  { value: "colorless", label: "Farblos" },
];

// Modul-scoped Filterzustand - siehe Kommentar oben. Bewusst NICHT Teil von
// AppPhase/GameState: reine, flüchtige Darstellungsfilterung ohne jede
// Regelrelevanz.
let searchText = "";
let typeFilter: CardType | "all" = "all";
let colorFilter: ManaColor | "colorless" | "all" = "all";

function matchesFilter(def: CardDefinition): boolean {
  const search = searchText.trim().toLowerCase();
  if (search && !def.name.toLowerCase().includes(search)) return false;
  if (typeFilter !== "all" && def.type !== typeFilter) return false;
  if (colorFilter !== "all" && dominantColorKey(def) !== colorFilter) return false;
  return true;
}

function applyFilterVisibility(container: HTMLElement, pool: CardPool): void {
  const rows = container.querySelectorAll<HTMLElement>(".deck-pool-row");
  rows.forEach((row) => {
    const id = row.dataset.cardId;
    const def = id ? pool[id] : undefined;
    row.style.display = def && matchesFilter(def) ? "" : "none";
  });
}

export interface DeckBuilderOptions {
  pool: CardPool;
  player: PlayerId;
  decklist: Record<string, number>;
  /** true = player2-Screen: bietet die "Gleiches Deck übernehmen"-Abkürzung an. */
  offerCopyFromPlayer1: boolean;
  onChange: (next: Record<string, number>) => void;
  onRandomFill: () => void;
  onCopyFromPlayer1: () => void;
  onConfirm: () => void;
}

export function deckBuilderScreen(opts: DeckBuilderOptions): HTMLElement {
  const { pool, player, decklist } = opts;
  const validation = validateDecklist(pool, decklist);

  const poolContainer = h("div", { class: "deckbuilder-pool" }, buildRows(pool, decklist, opts.onChange));

  const searchInput = h("input", {
    type: "text",
    class: "deckbuilder-search-input",
    placeholder: "Kartenname suchen…",
    value: searchText,
    oninput: (ev: Event) => {
      searchText = (ev.target as HTMLInputElement).value;
      applyFilterVisibility(poolContainer, pool);
    },
  });

  const typeSelect = h(
    "select",
    {
      class: "deckbuilder-type-filter",
      onchange: (ev: Event) => {
        typeFilter = (ev.target as HTMLSelectElement).value as CardType | "all";
        applyFilterVisibility(poolContainer, pool);
      },
    },
    TYPE_OPTIONS.map((o) => h("option", { value: o.value, selected: typeFilter === o.value }, [text(o.label)])),
  );

  const colorSelect = h(
    "select",
    {
      class: "deckbuilder-color-filter",
      onchange: (ev: Event) => {
        colorFilter = (ev.target as HTMLSelectElement).value as ManaColor | "colorless" | "all";
        applyFilterVisibility(poolContainer, pool);
      },
    },
    COLOR_OPTIONS.map((o) => h("option", { value: o.value, selected: colorFilter === o.value }, [text(o.label)])),
  );

  // Initiale Sichtbarkeit direkt nach dem Bauen anwenden - deckt sowohl den
  // allerersten Aufbau als auch jeden späteren, durch +/- Klicks ausgelösten
  // Voll-Rerender ab (searchText/typeFilter/colorFilter überleben als
  // Modul-Variablen, siehe oben).
  applyFilterVisibility(poolContainer, pool);

  const confirmLabel = player === "player2" ? "Spiel starten" : "Weiter (Spieler 2 baut Deck)";

  return h("div", { class: "deckbuilder-screen" }, [
    h("h2", { class: "deckbuilder-title" }, [text(`Deckbau: ${player}`)]),
    h("div", { class: "deckbuilder-controls" }, [
      searchInput,
      typeSelect,
      colorSelect,
      h("button", { class: "btn deckbuilder-random-fill-btn", onclick: opts.onRandomFill }, [text("Zufällig füllen")]),
      opts.offerCopyFromPlayer1
        ? h(
            "button",
            { class: "btn deckbuilder-copy-p1-btn", onclick: opts.onCopyFromPlayer1 },
            [text("Gleiches Deck wie Spieler 1 übernehmen")],
          )
        : undefined,
    ]),
    h("div", { class: "deckbuilder-status" + (validation.valid ? " valid" : " invalid") }, [text(validation.statusText)]),
    poolContainer,
    h("div", { class: "deckbuilder-footer" }, [
      h(
        "button",
        {
          class: "btn btn-play deckbuilder-confirm-btn",
          disabled: !validation.valid,
          onclick: opts.onConfirm,
        },
        [text(confirmLabel)],
      ),
    ]),
  ]);
}

function buildRows(
  pool: CardPool,
  decklist: Record<string, number>,
  onChange: (next: Record<string, number>) => void,
): HTMLElement[] {
  const defs = Object.values(pool)
    .filter((def) => !def.isToken)
    .sort((a, b) => a.name.localeCompare(b.name));

  return defs.map((def) => poolRow(def, decklist, onChange));
}

function poolRow(
  def: CardDefinition,
  decklist: Record<string, number>,
  onChange: (next: Record<string, number>) => void,
): HTMLElement {
  const count = decklist[def.id] ?? 0;
  const cost = "cost" in def ? def.cost : undefined;

  const decrement = () => {
    const next = { ...decklist };
    const n = (next[def.id] ?? 0) - 1;
    if (n <= 0) delete next[def.id];
    else next[def.id] = n;
    onChange(next);
  };
  const increment = () => {
    const next = { ...decklist };
    next[def.id] = (next[def.id] ?? 0) + 1;
    onChange(next);
  };

  return h(
    "div",
    {
      class: "deck-pool-row",
      "data-card-id": def.id,
    },
    [
      h("span", { class: "deck-pool-row-name" }, [text(def.name)]),
      h("span", { class: "deck-pool-row-type" }, [text(typeLabel(def))]),
      h("span", { class: "deck-pool-row-cost" }, [text(cost ? formatManaCost(cost) : "—")]),
      h("div", { class: "deck-pool-row-controls" }, [
        h("button", { class: "btn btn-small deck-pool-minus-btn", disabled: count <= 0, onclick: decrement }, [text("−")]),
        h("span", { class: "deck-pool-row-count" }, [text(String(count))]),
        h("button", { class: "btn btn-small deck-pool-plus-btn", onclick: increment }, [text("+")]),
      ]),
    ],
  );
}
