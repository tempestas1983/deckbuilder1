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
import type { CardPool, GameEvent, GameState, PlayerAction, RulesEngine } from "../model";
import { buildDemoDeck } from "./deck";
import type { UiMode } from "./types";

const pool: CardPool = starterSet;
const engine: RulesEngine = createRulesEngine(pool);

let state: GameState;
let log: string[] = [];
let lastError: string | undefined;
let uiMode: UiMode = { kind: "idle" };

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

export function initGame(seed: number = Math.floor(Math.random() * 1_000_000)): void {
  const deck = buildDemoDeck(pool);
  const { state: s, events } = engine.createGame({
    decks: { player1: deck, player2: deck },
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
