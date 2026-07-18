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
import { BOT_DIFFICULTIES, BOT_DIFFICULTY_LABELS, type BotDifficulty } from "../../ai";
import { COLOR_LABEL, dominantColorClass, dominantColorKey, subtypeLine } from "../cardInfo";
import { h, text } from "../h";
import { cardFrameArt } from "./cardArt";
import { manaCostBadge } from "./manaCost";
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
  /**
   * v0.1.7 ("Spieler 2 = KI"): nur für player2 relevant (s. `offerCopyFromPlayer1`-
   * Muster) - ob dieser Spieler aktuell als bot-gesteuert markiert ist
   * (store.ts#isBotControlled) sowie die zugehörigen Callbacks. player1 kann
   * nicht als KI markiert werden (der Umschalter erscheint nur für player2,
   * s. deckBuilderScreen unten) - reine UI-Entscheidung, store.ts unterstützt
   * grundsätzlich jeden PlayerId.
   */
  botControlled: boolean;
  onToggleBotControl: () => void;
  /** "Zufälliges KI-Deck + weiter": füllt zufällig, markiert bot-gesteuert und bestätigt sofort (überspringt den manuellen Deckbau-Screen für diesen Spieler). */
  onAiQuickstart: () => void;
  /**
   * v0.1.9 (Bot-Schwierigkeitsstufen, docs/ai-status.md Abschnitt 9.8): aktuell
   * gewählte Stufe (store.ts#getBotDifficulty) sowie Setter - nur relevant/
   * angezeigt, wenn `botControlled` true ist (s. `aiToggle` unten), bleibt aber
   * unabhängig davon im Store gespeichert.
   */
  botDifficulty: BotDifficulty;
  onChangeBotDifficulty: (next: BotDifficulty) => void;
  /**
   * v0.1.11 (geführtes Tutorial-Probespiel): nur auf dem player1-Screen
   * gesetzt (dem faktischen App-Startbildschirm, s. render.ts#renderDeckBuilder)
   * - ein Klick überspringt den kompletten restlichen Deckbau (auch den
   * player2-Screen) und startet sofort eine feste Tutorial-Partie
   * (store.ts#startTutorial).
   */
  onStartTutorial?: () => void;
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

  // v0.1.7: Der KI-Umschalter erscheint bewusst nur auf dem player2-Screen
  // (analog zu offerCopyFromPlayer1) - der Auftrag verlangt "Spieler 2 = KI",
  // nicht Spieler 1. store.ts#isBotControlled/setBotControlled unterstützen
  // grundsätzlich jeden PlayerId (Set<PlayerId>), diese Einschränkung ist rein
  // hier in der UI.
  // v0.1.9: Schwierigkeitsstufen-Auswahl (BOT_DIFFICULTIES/BOT_DIFFICULTY_LABELS
  // aus src/ai, s. docs/ai-status.md Abschnitt 9.8) - nur sichtbar/aktiv,
  // solange die KI-Steuerung für diesen Spieler aktiv ist.
  const difficultySelect = opts.botControlled
    ? h(
        "label",
        { class: "deckbuilder-ai-difficulty-label" },
        [
          text("Schwierigkeit: "),
          h(
            "select",
            {
              class: "deckbuilder-ai-difficulty-select",
              onchange: (ev: Event) => {
                opts.onChangeBotDifficulty((ev.target as HTMLSelectElement).value as BotDifficulty);
              },
            },
            BOT_DIFFICULTIES.map((d) =>
              h("option", { value: d, selected: opts.botDifficulty === d }, [text(BOT_DIFFICULTY_LABELS[d])]),
            ),
          ),
        ],
      )
    : undefined;

  // v0.1.11: deutlich prominentere Darstellung (eigene Überschrift +
  // Hinweistext, größere Schrift) statt eines unauffälligen Text-Checkbox-
  // Labels ganz oben - Nutzer-Feedback: der Umschalter war bisher schwer zu
  // finden, während "Spiel starten" erst nach dem gesamten (mittlerweile
  // 300 Karten großen) Kartenpool folgte (s. docs/frontend-status.md).
  const aiToggle =
    player === "player2"
      ? h("div", { class: "deckbuilder-ai-toggle" }, [
          h("div", { class: "deckbuilder-ai-toggle-heading" }, [text("Gegen den Computer spielen")]),
          h("div", { class: "deckbuilder-ai-toggle-hint" }, [
            text("Lässt Spieler 2 automatisch von einer KI steuern - kein zweiter Mensch nötig."),
          ]),
          h("label", { class: "deckbuilder-ai-toggle-label" }, [
            h("input", {
              type: "checkbox",
              class: "deckbuilder-ai-checkbox",
              checked: opts.botControlled,
              onchange: opts.onToggleBotControl,
            }),
            text(" Spieler 2 von KI steuern lassen"),
          ]),
          difficultySelect,
          opts.botControlled
            ? h(
                "button",
                { class: "btn deckbuilder-ai-quickstart-btn", onclick: opts.onAiQuickstart },
                [text("Zufälliges KI-Deck + weiter")],
              )
            : undefined,
        ])
      : undefined;

  // v0.1.11: "Tutorial starten" - nur auf dem player1-Screen (s.
  // DeckBuilderOptions.onStartTutorial-Kommentar). Eigene, auffällige Box
  // direkt unter der Überschrift, damit sie sofort ins Auge fällt, statt erst
  // nach dem Deckbau entdeckt zu werden.
  const tutorialBox = opts.onStartTutorial
    ? h("div", { class: "deckbuilder-tutorial-box" }, [
        h("div", { class: "deckbuilder-tutorial-heading" }, [text("Neu hier?")]),
        h("div", { class: "deckbuilder-tutorial-hint" }, [
          text(
            "Das Tutorial startet direkt eine kurze, geführte Beispielpartie mit " +
              "fertigen Decks gegen eine ruhig spielende KI - mit Erklär-Hinweisen " +
              "zu allen wichtigen Spielkonzepten.",
          ),
        ]),
        h(
          "button",
          { class: "btn btn-play deckbuilder-tutorial-start-btn", onclick: opts.onStartTutorial },
          [text("Tutorial starten")],
        ),
      ])
    : undefined;

  return h("div", { class: "deckbuilder-screen" }, [
    h("h2", { class: "deckbuilder-title" }, [text(`Deckbau: ${player}`)]),
    tutorialBox,
    aiToggle,
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

  // Klassisches Kartenrahmen-Layout (s. handCard.ts/cardTile.ts) statt
  // reiner Tabellenzeile - die +/- Zählersteuerung tritt an die Stelle der
  // Aktions-Buttons einer Handkarte.
  const frameChildren: (Node | string | false | undefined)[] = [
    cardFrameArt(def),
    h("div", { class: "card-frame-type" }, [text(subtypeLine(def))]),
  ];
  if (def.rulesText) {
    frameChildren.push(h("div", { class: "card-frame-text-box" }, [h("div", { class: "card-frame-text" }, [text(def.rulesText)])]));
  }
  if (def.type === "unit") {
    frameChildren.push(h("div", { class: "card-frame-pt" }, [text(`${def.power}/${def.toughness}`)]));
  }

  return h(
    "div",
    {
      class: ["deck-pool-row", dominantColorClass(cost ?? {})].join(" "),
      "data-card-id": def.id,
    },
    [
      h("div", { class: "card-frame-header" }, [
        h("div", { class: "card-frame-name deck-pool-row-name" }, [text(def.name)]),
        cost ? manaCostBadge(cost) : undefined,
      ]),
      h("div", { class: "card-frame-frame" }, frameChildren),
      h("div", { class: "deck-pool-row-controls" }, [
        h("button", { class: "btn btn-small deck-pool-minus-btn", disabled: count <= 0, onclick: decrement }, [text("−")]),
        h("span", { class: "deck-pool-row-count" }, [text(String(count))]),
        h("button", { class: "btn btn-small deck-pool-plus-btn", onclick: increment }, [text("+")]),
      ]),
    ],
  );
}
