/**
 * Zentraler Frontend-"Store": hält die einzige Engine-Instanz + den
 * aktuellen GameState, kapselt dispatch(action) über applyAction und
 * benachrichtigt Subscriber (hier: die render()-Funktion) bei Änderungen.
 *
 * Bewusst kein Redux/Zustand/... - für dieses Board reicht ein simples
 * Observer-Muster; das eigentliche "Modell" bleibt ohnehin die Engine.
 */

import { createRulesEngine } from "../engine";
import { starterSet } from "../cards/starter-set";
import type { CardPool, GameEvent, GameState, PlayerAction, PlayerId, RulesEngine } from "../model";
import type { AppPhase, UiMode } from "./types";

const pool: CardPool = starterSet;
const engine: RulesEngine = createRulesEngine(pool);

let state: GameState;
let log: string[] = [];
let lastError: string | undefined;
let uiMode: UiMode = { kind: "idle" };

/**
 * App-Ebene-Zustand (siehe types.ts#AppPhase): startet immer im Deckbau für
 * player1, kein Teil des GameState, keine automatische Demo-Partie mehr
 * beim App-Start (das war v0.1-v0.1.4-Verhalten, s. docs/frontend-status.md
 * "Nächste Schritte" Punkt 6, jetzt durch den Deckbau-Screen ersetzt).
 */
let appPhase: AppPhase = { kind: "deckbuild", player: "player1" };

/**
 * Zuletzt gesammelte Decklisten pro Spieler. Bleiben bewusst über
 * "Neues Spiel" (zurück zum Deckbau, s. backToDeckbuilder) hinweg erhalten,
 * damit der Deckbau-Screen beim erneuten Öffnen als Vorbefüllung dient
 * (bessere UX für wiederholte Testpartien) - kein Hard-Requirement, aber
 * explizit erwünscht laut Auftrag.
 */
let decklists: Record<PlayerId, Record<string, number>> = { player1: {}, player2: {} };

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPool(): CardPool {
  return pool;
}

export function getState(): GameState {
  return state;
}

export function getLog(): string[] {
  return log;
}

export function getLastError(): string | undefined {
  return lastError;
}

export function getUiMode(): UiMode {
  return uiMode;
}

/** UI-Modus setzen (Targeting/X-Eingabe/Combat/Discard) - löst KEINE Engine-Aktion aus. */
export function setUiMode(mode: UiMode): void {
  uiMode = mode;
  lastError = undefined;
  notify();
}

export function resetUiMode(): void {
  setUiMode({ kind: "idle" });
}

// ---------------------------------------------------------------------------
// App-Ebene: Deckbau- vs. Spielphase (siehe types.ts#AppPhase)
// ---------------------------------------------------------------------------

export function getAppPhase(): AppPhase {
  return appPhase;
}

/** Aktuell gesammelte Deckliste eines Spielers (Vorbefüllung für den Deckbau-Screen). */
export function getDecklist(player: PlayerId): Record<string, number> {
  return decklists[player];
}

/** Ersetzt die Deckliste eines Spielers (z.B. nach +/- Klick oder "Zufällig füllen"). */
export function setDecklist(player: PlayerId, list: Record<string, number>): void {
  decklists = { ...decklists, [player]: list };
  notify();
}

/**
 * Sequenzieller Deckbau-Ablauf (Auftrag: "Spieler 1 baut zuerst, dann
 * Spieler 2, danach Spiel starten"): Nach player1 geht es weiter zu
 * player2; nach player2 wird direkt die Partie mit beiden gesammelten
 * Decklisten gestartet. Ruft KEINE Engine-Validierung auf - das Gate
 * (min. 40 Karten etc., siehe deckValidation.ts) ist reine UI-Logik, die der
 * Aufrufer (render.ts, "Weiter"/"Spiel starten"-Button) bereits vor dem
 * Enablen des Buttons geprüft hat.
 */
export function confirmDeck(player: PlayerId): void {
  if (player === "player1") {
    appPhase = { kind: "deckbuild", player: "player2" };
    notify();
    return;
  }
  appPhase = { kind: "playing" };
  initGame(decklists.player1, decklists.player2);
}

/** Deckbau-Abkürzung: player2 übernimmt exakt die Deckliste von player1. */
export function copyDeckFromPlayer1(): void {
  setDecklist("player2", { ...decklists.player1 });
}

/**
 * "Neues Spiel" im laufenden Spiel: zurück zum Deckbau-Screen (player1
 * zuerst) statt wie in v0.1-v0.1.4 einfach die Seite neu zu laden - die
 * zuletzt benutzten Decklisten bleiben als Vorbefüllung erhalten (s.o.).
 */
export function backToDeckbuilder(): void {
  appPhase = { kind: "deckbuild", player: "player1" };
  notify();
}

function describeEvent(e: GameEvent): string | undefined {
  switch (e.kind) {
    case "gameStarted":
      return `Partie gestartet - Startspieler: ${e.startingPlayer}`;
    case "turnBegan":
      return `— Zug ${e.turnNumber}: ${e.player} am Zug —`;
    case "stepBegan":
      return `Step: ${e.step}`;
    case "priorityGained":
      return `${e.player} erhält Priority`;
    case "cardDrawn":
      return `${e.player} zieht eine Karte`;
    case "spellCast":
      return `Karte gecastet (Stack)`;
    case "abilityActivated":
      return `Fähigkeit aktiviert`;
    case "triggerFired":
      return `Getriggerte Fähigkeit ausgelöst`;
    case "decisionRequired":
      return `Entscheidung nötig (${e.decisionKind}) - ${e.player} muss wählen`;
    case "decisionResolved":
      return `Entscheidung aufgelöst (${e.decisionKind})`;
    case "stackObjectResolved":
      return `Stack-Objekt löst auf`;
    case "stackObjectCountered":
      return `Stack-Objekt wurde gecountert`;
    case "stackObjectFizzled":
      return `Stack-Objekt verpufft (kein legales Ziel mehr)`;
    case "damageDealt":
      return `${e.amount} Schaden an ${e.to}`;
    case "lifeChanged":
      return `${e.player}: Leben ${e.delta >= 0 ? "+" : ""}${e.delta} → ${e.newTotal}`;
    case "unitDied":
      return `Eine Unit ist gestorben`;
    case "attackersDeclared":
      return `Angreifer erklärt (${e.attackers.length})`;
    case "blockersDeclared":
      return `Blocker erklärt (${e.blocks.length})`;
    case "playerLost":
      return `${e.player} verliert das Spiel (${e.reason})`;
    case "gameEnded":
      return `Spiel beendet - Sieger: ${e.winner}`;
    default:
      return undefined;
  }
}

/**
 * Startet die eigentliche Partie aus zwei fertigen Decklisten (aus dem
 * Deckbau-Screen, s. `confirmDeck` oben). Ersetzt die frühere Signatur ohne
 * Parameter, die intern immer `buildDemoDeck` für beide Spieler aufrief
 * (v0.1-v0.1.4) - `buildDemoDeck` (deck.ts) existiert weiterhin, wird jetzt
 * aber vom Deckbau-Screen selbst aufgerufen ("Zufällig füllen"-Button),
 * nicht mehr automatisch hier.
 */
export function initGame(
  deckP1: Record<string, number>,
  deckP2: Record<string, number>,
  seed: number = Math.floor(Math.random() * 1_000_000),
): void {
  const { state: s, events } = engine.createGame({
    decks: { player1: deckP1, player2: deckP2 },
    seed,
  });
  state = s;
  log = [`Seed: ${seed}`];
  lastError = undefined;
  uiMode = { kind: "idle" };
  for (const e of events) {
    const t = describeEvent(e);
    if (t) log.push(t);
  }
  notify();
}

/** Legale Aktions-Kandidaten für player im aktuellen State (delegiert an die Engine). */
export function legalActions(player: import("../model").PlayerId): PlayerAction[] {
  return engine.getLegalActions(state, player);
}

export function dispatch(action: PlayerAction): void {
  const result = engine.applyAction(state, action);
  if (result.error) {
    lastError = result.error;
    notify();
    return;
  }
  lastError = undefined;
  state = result.state;
  uiMode = { kind: "idle" };
  for (const e of result.events) {
    const t = describeEvent(e);
    if (t) log.push(t);
  }
  if (log.length > 300) log = log.slice(-300);
  notify();
}
