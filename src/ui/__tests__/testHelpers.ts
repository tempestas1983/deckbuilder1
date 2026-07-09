/**
 * Gemeinsame Klick-/Deck-/Autopilot-Helfer für die dauerhaften UI-Tests
 * (`golden-path.test.ts` und die neuen v0.1.6-Testdateien). Reine
 * Testinfrastruktur - kein Teil der Anwendung, importiert nur öffentliche
 * store-/render-Funktionen bzw. liest `GameState` rein lesend.
 *
 * Alle Interaktionen, die das eigentlich zu prüfende Verhalten sind, laufen
 * immer über echte `element.dispatchEvent(new Event("click"))`-Aufrufe auf
 * das von `render()` erzeugte DOM (nie über direkte store.dispatch()-Aufrufe)
 * - exakt das in docs/frontend-status.md dokumentierte Muster. Deck-Aufbau
 * (`buildDeckByClicking`) und der Mehrzug-"Autopilot"
 * (`autoAdvanceToReadyMain1`) sind reine Testvorbereitung (viele Klicks auf
 * bereits an anderer Stelle getestete Standard-Interaktionen wie
 * "Priorität passen"/"Keine Angreifer"/+-Buttons im Deckbau) - vergleichbar
 * mit dem in v0.1.2 dokumentierten Vorgehen ("Board-Vorbedingungen ...
 * aufgebaut, um nicht jedes Mal mehrere echte Züge spielen zu müssen"), hier
 * aber bewusst weiterhin über echte Klicks statt Engine-interne Zonen-Helfer,
 * weil KEIN Debug-Setter in store.ts (Produktionscode) ergänzt werden soll.
 */

import type { GameState, PlayerId } from "../../model";

export function click(el: Element | null | undefined): void {
  if (!el) throw new Error("click(): Element nicht gefunden.");
  el.dispatchEvent(new Event("click", { bubbles: true }));
}

/**
 * Setzt den `checked`-Zustand einer Checkbox EXPLIZIT (statt sich auf jsdoms
 * eingebautes "Klick-Aktivierungsverhalten" für <input type="checkbox"> zu
 * verlassen, das nicht in jeder jsdom-Version/Konfiguration identisch mit
 * echten Browsern feuert) und stößt danach ein echtes "change"-Event an -
 * genau das Event, an das die Checkbox-Handler in diesem Projekt gebunden
 * sind (`onchange`, s. components/deckBuilder.ts#aiToggle).
 */
export function setChecked(el: HTMLInputElement | null | undefined, checked: boolean): void {
  if (!el) throw new Error("setChecked(): Element nicht gefunden.");
  el.checked = checked;
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function queryOne<T extends Element = Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`Element nicht gefunden: ${selector}`);
  return el;
}

export function queryAll<T extends Element = Element>(root: ParentNode, selector: string): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

export function buttonWithText(root: ParentNode, selector: string, label: string): HTMLButtonElement | undefined {
  return queryAll<HTMLButtonElement>(root, selector).find((b) => b.textContent === label);
}

/** Deterministischer Ersatz für Math.random() (mulberry32) - gleiches Muster wie golden-path.test.ts. */
export function makeSeededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Baut ein valides Deck aus genau den übergebenen Karten-IDs+Anzahlen über
 * ECHTE Klicks auf die +/- Buttons des Deckbau-Screens (deckBuilder.ts,
 * `[data-card-id] .deck-pool-plus-btn`) - kein direkter setDecklist-Aufruf.
 * Deckvalidierung (deckValidation.ts: min. 40 Karten, max. 4 Kopien pro
 * Nicht-Terrain-id) bleibt Sache des Aufrufers.
 */
export function buildDeckByClicking(root: ParentNode, entries: Record<string, number>): void {
  for (const [cardId, count] of Object.entries(entries)) {
    // WICHTIG: render() baut das komplette DOM bei jeder Store-Änderung neu
    // auf (kein Diffing, s. render.ts-Kommentar) - ein einmal gequerter
    // Button-Knoten ist nach dem ersten Klick "stale" (sein onclick-Closure
    // kapselt die Deckliste VOR diesem Klick). Deshalb pro Klick frisch
    // selektieren, sonst würde jeder Klick denselben (veralteten) +1-Schritt
    // wiederholen statt sich zu kumulieren.
    for (let i = 0; i < count; i++) {
      const plusBtn = queryOne<HTMLButtonElement>(root, `[data-card-id="${cardId}"] .deck-pool-plus-btn`);
      click(plusBtn);
    }
  }
}

/**
 * Klickt "Starthand behalten" für jede anstehende Mulligan-PendingDecision
 * (rules-engine.md 1b: streng sequentiell, erst Startspieler, dann der
 * andere), bis keine mehr aussteht. Für Tests, denen es nur um das
 * NACHGELAGERTE Verhalten geht (nicht die Mulligan-Entscheidung selbst).
 */
export function keepAllMulligans(root: ParentNode, guard = 10): void {
  for (let i = 0; i < guard; i++) {
    const keepBtn = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
    if (!keepBtn) return;
    click(keepBtn);
  }
  throw new Error("keepAllMulligans: Guard erreicht - Mulligan-Decision wird nicht los.");
}

function cardCountOnBattlefield(state: GameState, player: PlayerId, definitionId: string): number {
  return state.players[player].battlefield.filter((id) => state.cards[id]?.definitionId === definitionId).length;
}

export interface AutoAdvanceOptions {
  root: ParentNode;
  getState: () => GameState;
  /** Terrain-Karten-ID, die im eigenen Main1 automatisch gespielt wird, solange verfügbar. */
  terrainId: string;
  /** Wie viele Kopien des Terrains targetPlayer kontrollieren soll, bevor angehalten wird. */
  targetTerrainCount: number;
  /** Definition-ID, die weder abgeworfen noch für Terrain-Klicks angefasst wird - die eigentlich zu testende Karte. */
  protectedCardId: string;
  targetPlayer: PlayerId;
  maxSteps?: number;
}

/**
 * Generischer Klick-"Autopilot" für kreaturlose Testvorbereitung: passt
 * Priority, spielt automatisch `terrainId` im eigenen Main1 (solange in der
 * Hand vorhanden), erklärt "keine Angreifer"/"keine Blocker" (keine
 * Kreaturen im Spiel), behält jede Starthand, wirft im Cleanup automatisch
 * NICHT-geschützte Karten ab (bevorzugt Terrain-Überschuss). Hält an, sobald
 * `targetPlayer` in Main1 Priority hat, `targetTerrainCount` Kopien von
 * `terrainId` kontrolliert UND `protectedCardId` in der Hand hat - danach
 * übernimmt der eigentliche Testfall (Mana erzeugen, Karte spielen, ...).
 */
export function autoAdvanceToReadyMain1(opts: AutoAdvanceOptions): void {
  const { root, getState, terrainId, targetTerrainCount, protectedCardId, targetPlayer } = opts;
  const maxSteps = opts.maxSteps ?? 600;

  for (let step = 0; step < maxSteps; step++) {
    const state = getState();
    if (state.winner !== undefined) {
      throw new Error("autoAdvanceToReadyMain1: Spiel ist vorzeitig beendet.");
    }

    const isReady =
      state.step === "main1" &&
      state.priorityPlayer === targetPlayer &&
      !state.pendingDecision &&
      cardCountOnBattlefield(state, targetPlayer, terrainId) >= targetTerrainCount &&
      state.players[targetPlayer].hand.some((id) => state.cards[id]?.definitionId === protectedCardId);
    if (isReady) return;

    const mulliganKeep = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
    if (mulliganKeep) {
      click(mulliganKeep);
      continue;
    }

    if (
      state.step === "main1" &&
      state.priorityPlayer === targetPlayer &&
      !state.pendingDecision
    ) {
      const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
      if (terrainBtn) {
        click(terrainBtn);
        continue;
      }
    }

    if (root.querySelector(".discard-toggle")) {
      // Discard-Panel (Cleanup, rules-engine.md 2): render() baut das DOM
      // pro Klick komplett neu auf (kein Diffing) - deshalb PRO
      // Schleifendurchlauf nur EINEN Klick auslösen und danach `continue`
      // (frischer State/DOM in der nächsten Iteration), statt mehrere
      // Klicks auf womöglich bereits veralteten Knoten zu häufen (gleiche
      // Falle wie bei buildDeckByClicking, s.o.). Bevorzugt NICHT-geschützte
      // Karten (Terrain-Überschuss) abwerfen.
      const required = state.players[state.activePlayer].hand.length - 7;
      const alreadySelected = queryAll(root, ".discard-toggle.selected").length;
      if (alreadySelected < required) {
        const protectedName = protectedCardNameCache(state, protectedCardId);
        const unselectedToggles = queryAll<HTMLElement>(root, ".discard-toggle:not(.selected)");
        const nextToggle =
          unselectedToggles.find((el) => el.querySelector(".hand-card-name")?.textContent !== protectedName) ??
          unselectedToggles[0];
        if (nextToggle) {
          click(nextToggle);
          continue;
        }
      }
      const discardConfirm = buttonWithText(root, ".btn.btn-play", "Abwerfen bestätigen");
      if (discardConfirm && !discardConfirm.disabled) {
        click(discardConfirm);
        continue;
      }
    }

    const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
    if (passBtn) {
      click(passBtn);
      continue;
    }

    const noAttackers = buttonWithText(root, ".btn.btn-cancel", "Keine Angreifer");
    if (noAttackers) {
      click(noAttackers);
      continue;
    }

    const noBlockers = buttonWithText(root, ".btn.btn-cancel", "Keine Blocker");
    if (noBlockers) {
      click(noBlockers);
      continue;
    }

    throw new Error(
      `autoAdvanceToReadyMain1: unbekannter Zustand (step=${state.step}, priorityPlayer=${state.priorityPlayer}, pendingDecision=${state.pendingDecision?.kind})`,
    );
  }
  throw new Error("autoAdvanceToReadyMain1: maxSteps erreicht - Zielzustand nicht erreicht.");
}

// Kleiner Name-Cache: CardInstance kennt nur die definitionId, nicht den
// Anzeigenamen - die Discard-Auswahl in autoAdvanceToReadyMain1 muss aber
// per Text im DOM (.hand-card-name) unterscheiden, welche Karte geschützt
// ist. Testdateien registrieren den Namen einmal beim Import (aus dem echten
// CardPool, `starterSet[id].name` - keine Verdopplung von Kartendaten).
const nameCache = new Map<string, string>();

/** Registriert den Anzeigenamen einer Karten-ID (von Testdateien beim Import aus starterSet gesetzt). */
export function registerCardName(definitionId: string, name: string): void {
  nameCache.set(definitionId, name);
}

function protectedCardNameCache(_state: GameState, definitionId: string): string {
  return nameCache.get(definitionId) ?? definitionId;
}

/** Findet die erste antippbare (untappte) Battlefield-Kachel mit gegebenem Anzeigenamen und klickt sie (z.B. Terrain-Mana-Fähigkeit). */
export function tapUntappedPermanent(root: ParentNode, name: string): void {
  const tiles = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile.targetable");
  const tile = tiles.find((t) => t.querySelector(".card-tile-name")?.textContent === name);
  if (!tile) throw new Error(`tapUntappedPermanent: kein antippbares Permanent "${name}" gefunden.`);
  click(tile);
}
