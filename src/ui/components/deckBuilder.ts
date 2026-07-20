/**
 * Deckbau-Screen: in zwei Modi verwendet (s. types.ts#AppPhase, `mode` in
 * DeckBuilderOptions unten):
 * - "newGame": läuft VOR der eigentlichen Partie, ein Screen pro Spieler,
 *   sequenziell (player1 zuerst, dann player2 - außer player2 wurde in der
 *   Gegner-Auswahl schon als bot-gesteuert markiert, dann wird dieser Screen
 *   für player2 komplett übersprungen, s. render.ts#renderDeckBuilder).
 * - "standalone": eigenständiger "Deck Builder"-Menüpunkt im Hauptmenü, nur
 *   für player1, OHNE dass danach automatisch eine Partie beginnt.
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
import { COLOR_LABEL, dominantColorClass, dominantColorKey, effectiveRulesText, subtypeLine } from "../cardInfo";
import { h, text } from "../h";
import { cardFrameArt } from "./cardArt";
import { manaCostBadge } from "./manaCost";
import { ruleTextNodes } from "./keywordText";
import {
  closeKeywordGlossary,
  closeKeywordGlossaryPanel,
  closeLoadDeckPanel,
  closeMusicPanel,
  closeSaveDeckForm,
  deleteSavedDeck,
  getMusicCurrentTrack,
  getMusicRepeatMode,
  getMusicTracks,
  getOpenKeywordGlossary,
  isDeckAnalysisPanelOpen,
  isKeywordGlossaryPanelOpen,
  isLoadDeckPanelOpen,
  isMusicEnabled,
  isMusicPanelOpen,
  isSaveDeckFormOpen,
  isSfxEnabled,
  listSavedDecks,
  loadSavedDeck,
  saveDeckAs,
  selectMusicTrack,
  setMusicRepeatMode,
  toggleDeckAnalysisPanel,
  toggleKeywordGlossaryPanel,
  toggleLoadDeckPanel,
  toggleMusicEnabled,
  toggleMusicPanel,
  toggleSaveDeckForm,
  toggleSfxEnabled,
} from "../store";
import { deckAnalysisPanel } from "./deckAnalysis";
import { keywordGlossaryButton, keywordGlossaryPanel, keywordPopoverBubble } from "./keywordGlossaryPanel";
import { musicPanel, musicPanelButton } from "./musicPanel";
import { loadDeckButton, loadDeckPanel, resetSaveDeckDraft, saveDeckButton, saveDeckForm } from "./savedDecksPanel";
import { sfxToggleButton } from "./sfxToggle";
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
  /**
   * "echtes Hauptmenü"-Umbau: unterscheidet den normalen Partie-Einstieg
   * ("newGame", unverändertes Verhalten - "Weiter"/"Spiel starten"-Footer-
   * Button, s. `onConfirm`) vom eigenständigen "Deck Builder"-Menüpunkt
   * ("standalone", nur für player1 erreichbar, s. store.ts#openDeckBuilderStandalone):
   * dort ersetzt ein "Zurück zum Hauptmenü"-Button (`onBackToMainMenu`) den
   * Confirm-Button - es folgt KEINE Partie-Vorbereitung. Restlicher Screen
   * (Kartenpool, +/-, Speichern/Laden, Analyse, Filter) ist in beiden Modi
   * identisch, nichts davon wird dafür verdoppelt.
   */
  mode: "newGame" | "standalone";
  /** true = player2-Screen: bietet die "Gleiches Deck übernehmen"-Abkürzung an. */
  offerCopyFromPlayer1: boolean;
  onChange: (next: Record<string, number>) => void;
  onRandomFill: () => void;
  /** Nutzer-Feedback: ohne Reset-Möglichkeit war schwer erkennbar, welche Karten schon im Deck stecken - setzt die Deckliste komplett auf leer. */
  onClearDeck: () => void;
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
   * NUR relevant/genutzt, wenn `mode === "standalone"` (s.o.) - "Zurück zum
   * Hauptmenü"-Footer-Button statt des Confirm-Buttons. Das Tutorial ist seit
   * dem "echtes Hauptmenü"-Umbau ausschließlich über das Hauptmenü selbst
   * erreichbar (vormals ein zusätzlicher Button auf diesem Screen, s.
   * store.ts#startTutorial-Dateikommentar) - kein `onStartTutorial`-Feld
   * mehr hier, um diese Redundanz zu vermeiden.
   */
  onBackToMainMenu?: () => void;
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
  const headingText = opts.mode === "standalone" ? "Deck Builder" : `Deckbau: ${player}`;

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

  // Keyword-Glossar (Auftrag Punkt 3): auch schon während des Deckbaus
  // erreichbar, nicht erst in der laufenden Partie - der Kartenpool zeigt
  // hier dieselben Schlüsselwörter im Regeltext (s. poolRow oben).
  const openKeywordPopover = getOpenKeywordGlossary();

  return h("div", { class: "deckbuilder-screen" }, [
    openKeywordPopover ? keywordPopoverBubble(openKeywordPopover, () => closeKeywordGlossary()) : undefined,
    h("div", { class: "deckbuilder-header-row" }, [
      h("h2", { class: "deckbuilder-title" }, [text(headingText)]),
      h("div", { class: "deckbuilder-header-actions" }, [
        // App-weite Hintergrundmusik (s. musicPlayer.ts): auch im Deckbau
        // jederzeit erreichbar/sichtbar, genau wie im Hauptmenü (s.
        // components/mainMenu.ts) und in der laufenden Partie.
        musicPanelButton(() => toggleMusicPanel()),
        sfxToggleButton(isSfxEnabled(), () => toggleSfxEnabled()),
        keywordGlossaryButton(() => toggleKeywordGlossaryPanel()),
      ]),
    ]),
    aiToggle,
    h("div", { class: "deckbuilder-controls" }, [
      searchInput,
      typeSelect,
      colorSelect,
      h("button", { class: "btn deckbuilder-random-fill-btn", onclick: opts.onRandomFill }, [text("Zufällig füllen")]),
      h("button", { class: "btn btn-cancel deckbuilder-clear-btn", onclick: opts.onClearDeck }, [text("Deck leeren")]),
      opts.offerCopyFromPlayer1
        ? h(
            "button",
            { class: "btn deckbuilder-copy-p1-btn", onclick: opts.onCopyFromPlayer1 },
            [text("Gleiches Deck wie Spieler 1 übernehmen")],
          )
        : undefined,
      // Benannte Deck-Persistenz (Speichern/Laden über beliebig viele
      // Slots, s. store.ts#SavedDeck) - unabhängig von der bestehenden
      // "letzte Deckliste"-Vorbefüllung oben, ergänzt sie nur.
      saveDeckButton(() => toggleSaveDeckForm()),
      loadDeckButton(() => toggleLoadDeckPanel()),
    ]),
    h("div", { class: "deckbuilder-status-row" }, [
      h("div", { class: "deckbuilder-status" + (validation.valid ? " valid" : " invalid") }, [text(validation.statusText)]),
      deckAnalysisPanel({
        pool,
        decklist,
        open: isDeckAnalysisPanelOpen(),
        onToggleOpen: () => toggleDeckAnalysisPanel(),
      }),
    ]),
    poolContainer,
    h(
      "div",
      { class: "deckbuilder-footer" },
      [
        opts.mode === "standalone"
          ? h(
              "button",
              { class: "btn btn-cancel deckbuilder-back-to-menu-btn", onclick: opts.onBackToMainMenu },
              [text("Zurück zum Hauptmenü")],
            )
          : h(
              "button",
              {
                class: "btn btn-play deckbuilder-confirm-btn",
                disabled: !validation.valid,
                onclick: opts.onConfirm,
              },
              [text(confirmLabel)],
            ),
      ],
    ),
    isKeywordGlossaryPanelOpen() ? keywordGlossaryPanel(() => closeKeywordGlossaryPanel()) : undefined,
    isMusicPanelOpen()
      ? musicPanel({
          enabled: isMusicEnabled(),
          tracks: getMusicTracks(),
          currentTrack: getMusicCurrentTrack(),
          repeatMode: getMusicRepeatMode(),
          onToggleEnabled: () => toggleMusicEnabled(),
          onSelectTrack: (track) => selectMusicTrack(track),
          onSetRepeatMode: (mode) => setMusicRepeatMode(mode),
          onClose: () => closeMusicPanel(),
        })
      : undefined,
    isSaveDeckFormOpen()
      ? saveDeckForm({
          cardCount: validation.total,
          onSave: (name, description) => {
            if (!name.trim()) return; // Button ist in diesem Fall bereits deaktiviert - reines Sicherheitsnetz
            saveDeckAs(name, description, decklist);
            resetSaveDeckDraft();
            closeSaveDeckForm();
          },
          onClose: () => {
            resetSaveDeckDraft();
            closeSaveDeckForm();
          },
        })
      : undefined,
    isLoadDeckPanelOpen()
      ? loadDeckPanel({
          decks: listSavedDecks(),
          onLoad: (id) => {
            loadSavedDeck(player, id);
            closeLoadDeckPanel();
          },
          onDelete: (id) => {
            const deck = listSavedDecks().find((d) => d.id === id);
            const label = deck ? `"${deck.name}"` : "dieses Deck";
            // Irreversible Aktion -> einfache Bestätigung (kein eigenes
            // Modal-System nötig, s. Auftrag - identisches Muster wie
            // render.ts#onConcede für "Aufgeben").
            if (window.confirm(`${label} wirklich löschen? Das kann nicht rückgängig gemacht werden.`)) {
              deleteSavedDeck(id);
            }
          },
          onClose: () => closeLoadDeckPanel(),
        })
      : undefined,
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
  const rulesText = effectiveRulesText(def);
  if (rulesText) {
    frameChildren.push(h("div", { class: "card-frame-text-box" }, [h("div", { class: "card-frame-text" }, ruleTextNodes(rulesText))]));
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
