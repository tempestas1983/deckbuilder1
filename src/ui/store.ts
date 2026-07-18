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
import { chooseActionForDifficulty, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from "../ai";
import type { CardPool, GameEvent, GameState, PlayerAction, PlayerId, RulesEngine } from "../model";
import type { AppPhase, UiMode } from "./types";
import { TUTORIAL_CORE_TIP_IDS, type TutorialTipId } from "./tutorialContent";
import { TUTORIAL_DECK_PLAYER1, TUTORIAL_DECK_PLAYER2, TUTORIAL_SEED } from "./tutorialDeck";

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

// ---------------------------------------------------------------------------
// Deck-Persistenz über Sessions hinweg (v0.1.8): localStorage-Fallback für
// die zuletzt bestätigte(n) Deckliste(n), damit ein Seiten-Reload (neues
// store.ts-Modul, decklists startet leer) nicht wieder von einem leeren Deck
// beginnt. Bewusst NUR ein Fallback für den Modul-Start (s. decklists-Init
// unten) - solange die In-Memory-Decklisten innerhalb einer Session bereits
// etwas enthalten (z.B. nach "Neues Spiel"), bleibt das unverändert die
// Quelle der Vorbefüllung (bisheriges v0.1.5-Verhalten).
// ---------------------------------------------------------------------------

const LAST_DECK_STORAGE_KEY: Record<PlayerId, string> = {
  player1: "deckbuilder1.lastDeck.player1",
  player2: "deckbuilder1.lastDeck.player2",
};

/**
 * Liest die zuletzt gespeicherte Deckliste eines Spielers aus localStorage.
 * Defensiv: localStorage kann in privaten Browser-Modi/mit deaktivierten
 * Cookies fehlen oder werfen (SecurityError) - ein Fehler hier darf die App
 * niemals zum Absturz bringen, sondern führt einfach zu "kein gespeichertes
 * Deck gefunden" (leeres Deck als Vorbefüllung, wie schon vor v0.1.8).
 */
function loadDeckFromLocalStorage(player: PlayerId): Record<string, number> | undefined {
  try {
    const raw = window.localStorage.getItem(LAST_DECK_STORAGE_KEY[player]);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    // Grobe Formprüfung (nur string->number-Einträge) statt vollem Schema-
    // Validator - reine UI-Bequemlichkeit, die Engine validiert Decklisten
    // ohnehin nicht selbst (s. deckValidation.ts-Kommentar an anderer Stelle).
    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    );
    return Object.fromEntries(entries);
  } catch {
    return undefined;
  }
}

/** Speichert die Deckliste eines Spielers in localStorage - defensiv, s. loadDeckFromLocalStorage. */
function saveDeckToLocalStorage(player: PlayerId, list: Record<string, number>): void {
  try {
    window.localStorage.setItem(LAST_DECK_STORAGE_KEY[player], JSON.stringify(list));
  } catch {
    // localStorage nicht verfügbar/voll/deaktiviert - einfach ignorieren
    // (Auftrag: "darf die App nicht zum Absturz bringen").
  }
}

/**
 * Zuletzt gesammelte Decklisten pro Spieler. Bleiben bewusst über
 * "Neues Spiel" (zurück zum Deckbau, s. backToDeckbuilder) hinweg erhalten,
 * damit der Deckbau-Screen beim erneuten Öffnen als Vorbefüllung dient
 * (bessere UX für wiederholte Testpartien) - kein Hard-Requirement, aber
 * explizit erwünscht laut Auftrag. **Seit v0.1.8**: Start-Wert lädt
 * zusätzlich aus localStorage (Fallback für den allerersten Deckbau-Screen
 * nach einem Seiten-Reload, s. Abschnitt oben) statt immer mit `{}` zu
 * beginnen.
 */
let decklists: Record<PlayerId, Record<string, number>> = {
  player1: loadDeckFromLocalStorage("player1") ?? {},
  player2: loadDeckFromLocalStorage("player2") ?? {},
};

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
  // v0.1.8: Deck-Persistenz über Sessions hinweg - beim Bestätigen im
  // Deckbau-Screen wird die Deckliste zusätzlich in localStorage gesichert
  // (s. Abschnitt oben), damit sie einen Seiten-Reload übersteht. player2
  // wird bewusst NUR gespeichert, wenn er kein bot-gesteuertes Deck ist (ein
  // zufälliges KI-Deck ist keine "vom Nutzer gebaute" Deckliste, die es sich
  // lohnt für die nächste Session vorzubefüllen, s. Auftrag "gerne auch
  // Spieler 2 falls kein Bot").
  if (player === "player1" || !isBotControlled(player)) {
    saveDeckToLocalStorage(player, decklists[player]);
  }
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
  // v0.1.11: Tutorial-Modus sauber verlassen (Auftrag Punkt 5, "verändert die
  // normale Partie nicht") - stellt player2s Bot-Einstellungen von VOR dem
  // Tutorial-Start wieder her (s. startTutorial unten), statt player2
  // dauerhaft auf bot-gesteuert/"medium" hängen zu lassen.
  if (tutorialActive) {
    tutorialActive = false;
    tutorialPendingTip = undefined;
    tutorialHelpOpen = false;
    if (preTutorialBotControlled !== undefined) setBotControlled("player2", preTutorialBotControlled);
    if (preTutorialBotDifficulty !== undefined) setBotDifficulty("player2", preTutorialBotDifficulty);
    preTutorialBotControlled = undefined;
    preTutorialBotDifficulty = undefined;
  }
  appPhase = { kind: "deckbuild", player: "player1" };
  stopBotLoop();
  notify();
}

// ---------------------------------------------------------------------------
// KI-Gegner (v0.1.7): welche Spieler werden von src/ai/simpleBot.ts#chooseAction
// gesteuert statt vom UI-Nutzer? Generisch als Set<PlayerId> (nicht fest auf
// player2), auch wenn der aktuelle Deckbau-Screen die Umschaltung nur für
// player2 anbietet (s. components/deckBuilder.ts) - ein künftiges "beide
// Spieler sind KI" (Bot-vs-Bot-Zuschauermodus) würde ohne weitere
// Store-Änderung funktionieren.
//
// Bewusst KEIN Teil des GameState (die Engine kennt keine "KI"-Spieler, s.
// docs/ai-status.md: chooseAction ist ein reiner externer Konsument) und
// bewusst KEIN eigener Typ in types.ts - analog zur v0.1.5-Entscheidung, den
// AppPhase-Zustand in store.ts "mitzuverwalten" statt einen zweiten
// Beobachter-Mechanismus einzuführen (s. docs/frontend-status.md).
//
// Persistenz-Entscheidung (Auftrag Punkt 5): bleibt über "Neues Spiel"
// (backToDeckbuilder) hinweg erhalten, exakt wie die gesammelten Decklisten
// (decklists oben) - wer einmal "Spieler 2 von KI steuern lassen" aktiviert
// hat, will das für die naechste Testpartie i.d.R. nicht jedes Mal neu
// anklicken. Nur ein frischer App-Start (Modul-Neuladen) setzt es zurück.
// ---------------------------------------------------------------------------

let botControlledPlayers: Set<PlayerId> = new Set();

export function isBotControlled(player: PlayerId): boolean {
  return botControlledPlayers.has(player);
}

export function setBotControlled(player: PlayerId, controlled: boolean): void {
  const next = new Set(botControlledPlayers);
  if (controlled) next.add(player);
  else next.delete(player);
  botControlledPlayers = next;
  notify();
}

// ---------------------------------------------------------------------------
// KI-Schwierigkeitsstufe (v0.1.9, docs/ai-status.md Abschnitt 9.8): pro
// Spieler unabhängig wählbar (aus src/ai/difficulty.ts#BOT_DIFFICULTIES),
// unabhängig davon, ob der Spieler gerade bot-gesteuert ist - der Wert wird
// nur GENUTZT, wenn isBotControlled(player) true ist (s. runBotStep unten),
// bleibt aber auch sonst gesetzt (z.B. schon gewählt, bevor der KI-Umschalter
// aktiviert wird). Persistenz-Entscheidung identisch zu botControlledPlayers
// oben: bleibt über "Neues Spiel" (backToDeckbuilder) hinweg erhalten, nur
// ein frischer App-Start (Modul-Neuladen) setzt auf DEFAULT_BOT_DIFFICULTY
// zurück.
// ---------------------------------------------------------------------------

let botDifficulty: Record<PlayerId, BotDifficulty> = {
  player1: DEFAULT_BOT_DIFFICULTY,
  player2: DEFAULT_BOT_DIFFICULTY,
};

export function getBotDifficulty(player: PlayerId): BotDifficulty {
  return botDifficulty[player];
}

export function setBotDifficulty(player: PlayerId, difficulty: BotDifficulty): void {
  botDifficulty = { ...botDifficulty, [player]: difficulty };
  notify();
}

// ---------------------------------------------------------------------------
// Tutorial-Modus (v0.1.11): alternativer Startpfad mit festen, kuratierten
// Decklisten (tutorialDeck.ts) + festem Seed statt des normalen Deckbau-
// Screens, Spieler 2 automatisch bot-gesteuert auf einer ruhigen Stufe
// ("medium" — die unveränderte v1-Heuristik, s. docs/ai-status.md; bewusst
// NICHT "easy", das laut ai-status.md ABSICHTLICH fehlerhaft/zufällig spielt
// und damit für ein Lern-Tutorial eher verwirrender wäre als ein ruhiges,
// vorhersehbares Mittelmaß; explizit NICHT "hard", s. Auftrag), plus
// Overlay-Erklärungen zu den Kernkonzepten (tutorialContent.ts). Verändert die
// normale Partie in keiner Weise — reiner zusätzlicher UI-Zustand + ein
// alternativer initGame()-Aufruf mit anderen Anfangsbedingungen, exakt wie
// jeder andere Partiestart auch.
// ---------------------------------------------------------------------------

const TUTORIAL_BOT_DIFFICULTY: BotDifficulty = "medium";

let tutorialActive = false;
let tutorialShownTips: Set<TutorialTipId> = new Set();
let tutorialPendingTip: TutorialTipId | undefined;
let tutorialHelpOpen = false;

// Vorherige Bot-Einstellungen von player2, um sie beim Verlassen des Tutorials
// wiederherzustellen (s. backToDeckbuilder unten) - das Tutorial soll die
// normale Partie/den normalen Deckbau NICHT dauerhaft verändern (Auftrag
// Punkt 5), auch nicht "Spieler 2 war vorher NICHT bot-gesteuert".
let preTutorialBotControlled: boolean | undefined;
let preTutorialBotDifficulty: BotDifficulty | undefined;

export function isTutorialActive(): boolean {
  return tutorialActive;
}

/** Aktuell anzuzeigender Tutorial-Tipp (einzelne Sprechblase) - `undefined`, solange keiner aussteht. */
export function getTutorialPendingTip(): TutorialTipId | undefined {
  return tutorialPendingTip;
}

/** Schließt die aktuell angezeigte Sprechblase und merkt sie als "gesehen" - erscheint für diese Tip-Art nicht erneut automatisch. */
export function dismissTutorialTip(): void {
  if (tutorialPendingTip === undefined) return;
  tutorialShownTips = new Set(tutorialShownTips).add(tutorialPendingTip);
  tutorialPendingTip = undefined;
  notify();
  // Der Bot-Zug-Loop wird pausiert, solange eine Sprechblase aussteht (s.
  // scheduleBotStepIfNeeded unten) - nach dem Wegklicken ggf. weiterspielen.
  triggerBotLoop();
}

export function isTutorialHelpOpen(): boolean {
  return tutorialHelpOpen;
}

export function toggleTutorialHelp(): void {
  tutorialHelpOpen = !tutorialHelpOpen;
  notify();
}

export function closeTutorialHelp(): void {
  tutorialHelpOpen = false;
  notify();
}

function queueTutorialTip(id: TutorialTipId): void {
  if (!tutorialActive) return;
  if (tutorialShownTips.has(id)) return;
  if (tutorialPendingTip !== undefined) return; // eine Sprechblase nach der anderen
  tutorialPendingTip = id;
}

/**
 * Prüft nach JEDER Zustandsänderung während einer Tutorial-Partie (menschliche
 * Aktion, automatischer Bot-Zug, `initGame`), ob einer der in
 * tutorialContent.ts beschriebenen Schlüsselmomente gerade eingetreten ist,
 * und queued ggf. den passenden (noch nicht gezeigten) Tipp. Reine
 * UI-Ableitung aus dem bereits vorhandenen `GameState`/der ausgeführten
 * `PlayerAction` - keine eigene Regellogik, nur Wiedererkennung bereits von
 * der Engine getroffener Entscheidungen (exakt wie `actingPlayer` oben).
 *
 * Bewusst NICHT auf "nur wenn player1 handelt" beschränkt: Reihenfolge
 * Startspieler/Mulligan ist zufällig (seedabhängig), ein zuverlässiges
 * "beim ERSTEN X" muss also unabhängig davon greifen, ob Mensch oder Bot X
 * zuerst tut.
 */
function maybeQueueTutorialTips(action: PlayerAction | undefined): void {
  if (!tutorialActive) return;

  // "priority": generisch/zustandsbasiert (kein Aktionstyp) - der erste echte
  // Priority-Moment der Partie (nach der Mulligan-Phase).
  if (state.priorityPlayer !== undefined && !state.pendingDecision) {
    queueTutorialTip("priority");
  }

  if (action) {
    switch (action.kind) {
      case "playTerrain":
        queueTutorialTip("terrain");
        break;
      case "castSpell": {
        const def = pool[state.cards[action.cardInstanceId]?.definitionId ?? ""];
        if (def?.type === "unit") queueTutorialTip("creature");
        else if (def?.type === "spell") queueTutorialTip("spell");
        break;
      }
      case "declareAttackers":
        if (action.attackers.length > 0) queueTutorialTip("attack");
        break;
      case "declareBlockers":
        if (action.blocks.length > 0) queueTutorialTip("block");
        break;
      case "activateAbility": {
        const def = pool[state.cards[action.sourceInstanceId]?.definitionId ?? ""];
        const ability = def && "abilities" in def ? def.abilities?.[action.abilityIndex] : undefined;
        if (ability?.kind === "activated" && !ability.isManaAbility) queueTutorialTip("ability");
        break;
      }
      default:
        break;
    }
  }

  // Abschluss-Hinweis: entweder alle Kernkonzepte gesehen, oder das Spiel ist
  // vorbei (je nachdem, was zuerst eintritt) - s. tutorialContent.ts.
  const allCoreShown = TUTORIAL_CORE_TIP_IDS.every((id) => tutorialShownTips.has(id));
  if ((allCoreShown || state.winner !== undefined) && !tutorialShownTips.has("complete")) {
    queueTutorialTip("complete");
  }
}

/**
 * Startet die Tutorial-Partie (Auftrag Punkt 1+2): überspringt den normalen
 * Deckbau-Screen komplett, nutzt die festen Decklisten/den festen Seed aus
 * tutorialDeck.ts, markiert Spieler 2 als bot-gesteuert (ruhige Stufe, s.o.)
 * und setzt den Tutorial-UI-Zustand zurück (frischer Durchlauf zeigt alle
 * Sprechblasen erneut, auch bei wiederholtem Start).
 */
export function startTutorial(): void {
  stopBotLoop();
  preTutorialBotControlled = isBotControlled("player2");
  preTutorialBotDifficulty = getBotDifficulty("player2");
  tutorialActive = true;
  tutorialShownTips = new Set();
  tutorialPendingTip = undefined;
  tutorialHelpOpen = false;
  setBotControlled("player2", true);
  setBotDifficulty("player2", TUTORIAL_BOT_DIFFICULTY);
  appPhase = { kind: "playing" };
  initGame(TUTORIAL_DECK_PLAYER1, TUTORIAL_DECK_PLAYER2, TUTORIAL_SEED);
}

/**
 * Bestimmt, welcher Spieler gerade tatsächlich handeln muss (Priority, eine
 * an ihn gerichtete PendingDecision, oder eine fällige Combat-/Cleanup-
 * Turn-Based-Action ohne Priority-Fenster) - exakt dieselbe Fallunter-
 * scheidung, die render.ts#autoEnterForcedModes für die UI-Modus-Wahl trifft
 * und die src/ai/__tests__/simpleBot.test.ts#actingPlayer für die
 * Bot-vs-Bot-Simulation verwendet (siehe docs/ai-status.md, "Nutzungsvertrag").
 * `undefined`, wenn niemand handeln muss (z.B. Spielende).
 */
function actingPlayer(s: GameState): PlayerId | undefined {
  if (s.winner !== undefined) return undefined;
  if (s.pendingDecision) return s.pendingDecision.player;
  if (s.priorityPlayer) return s.priorityPlayer;
  if (s.step === "declareAttackers") return s.activePlayer;
  if (s.step === "declareBlockers") return otherPlayerId(s.activePlayer);
  if (s.step === "cleanup" && s.players[s.activePlayer].hand.length > 7) return s.activePlayer;
  return undefined;
}

function otherPlayerId(p: PlayerId): PlayerId {
  return p === "player1" ? "player2" : "player1";
}

/**
 * Verzögerung zwischen zwei automatischen KI-Zügen (Millisekunden). Bewusst
 * > 0 im normalen Betrieb, damit man dem Bot beim Spielen "zusehen" kann
 * (jeder Schritt löst einen eigenen notify()/render()-Aufruf aus, s.u.) -
 * ohne Verzögerung würde ein kompletter Bot-Zug (mehrere Aktionen) innerhalb
 * eines einzigen JS-Ticks laufen und im Browser nie sichtbar zwischengerendert
 * werden. `setBotMoveDelayMs` ist für Tests gedacht (dort auf 0 gesetzt, s.
 * src/ui/__tests__), damit Testläufe nicht auf echte Wartezeiten angewiesen
 * sind.
 */
let botMoveDelayMs = 250;

export function setBotMoveDelayMs(ms: number): void {
  botMoveDelayMs = Math.max(0, ms);
}

let botTimer: ReturnType<typeof setTimeout> | undefined;

/** true, solange ein automatischer KI-Zug geplant/aussteht ist - für Tests, um auf "Bot ist fertig" zu warten. */
export function isBotThinking(): boolean {
  return botTimer !== undefined;
}

function stopBotLoop(): void {
  if (botTimer !== undefined) {
    clearTimeout(botTimer);
    botTimer = undefined;
  }
}

/**
 * Sicherheitslimit pro "Zyklus" (ab einer menschlichen dispatch()-Aktion bzw.
 * ab initGame() gezählt, s. triggerBotLoop) - analog zum 2000er-Aktionslimit
 * der Bot-vs-Bot-Tests (src/ai/__tests__/simpleBot.test.ts), hier niedriger
 * angesetzt, weil pro Zyklus nur EIN Spieler automatisch zieht (der andere
 * ist ja der Mensch, der gerade erst gehandelt hat). Verhindert eine
 * Endlosschleife, falls chooseAction/getLegalActions/applyAction jemals in
 * einen Zustand geraten sollten, der nie wieder beim Menschen landet.
 */
const MAX_BOT_ACTIONS_PER_CYCLE = 1000;
let botCycleGuard = 0;

/** Wird nach jeder erfolgreichen menschlichen Aktion (dispatch) und nach initGame() aufgerufen. */
function triggerBotLoop(): void {
  botCycleGuard = 0;
  scheduleBotStepIfNeeded();
}

function scheduleBotStepIfNeeded(): void {
  if (botTimer !== undefined) return; // schon ein Schritt geplant
  // v0.1.11: Solange eine Tutorial-Sprechblase aussteht, pausiert der
  // automatische Bot-Zug-Loop (s. dismissTutorialTip oben, das ihn nach dem
  // Wegklicken wieder anstößt) - sonst würde sich das Board unter der
  // gerade gelesenen Erklärung weiterbewegen.
  if (tutorialActive && tutorialPendingTip !== undefined) return;
  const actor = actingPlayer(state);
  if (!actor || !isBotControlled(actor)) return;
  if (botCycleGuard >= MAX_BOT_ACTIONS_PER_CYCLE) {
    // eslint-disable-next-line no-console
    console.error(
      `KI-Sicherheitslimit erreicht (${MAX_BOT_ACTIONS_PER_CYCLE} automatische Aktionen ohne menschliche ` +
        "Zwischenaktion) - automatisches Spielen angehalten. Das ist ein Hinweis auf einen Bug, kein normaler Spielverlauf.",
    );
    return;
  }
  botTimer = setTimeout(runBotStep, botMoveDelayMs);
}

/**
 * Führt EINEN automatischen KI-Zug aus (`chooseActionForDifficulty` +
 * `applyAction`, siehe src/ai/difficulty.ts - **seit v0.1.9** stufenabhängig
 * über `botDifficulty[actor]` statt immer der v1-Heuristik `chooseAction`,
 * s. Abschnitt oben) und plant danach - falls weiterhin ein bot-gesteuerter
 * Spieler am Zug ist - den nächsten Schritt. `notify()` läuft nach JEDEM
 * einzelnen Schritt (nicht erst am Ende), damit render() den Spielstand nach
 * jedem Bot-Zug aktualisiert (Auftrag Punkt 3: "man kann dem Bot beim Spielen
 * zusehen").
 */
function runBotStep(): void {
  botTimer = undefined;
  const actor = actingPlayer(state);
  if (!actor || !isBotControlled(actor)) return;
  botCycleGuard++;

  const action = chooseActionForDifficulty(engine, pool, state, actor, botDifficulty[actor]);
  const result = engine.applyAction(state, action);
  if (result.error) {
    // Laut docs/ai-status.md sollte chooseAction NIE eine illegale Aktion
    // liefern - dieser Zweig ist ein reines Sicherheitsnetz (kein stiller
    // Endlosversuch derselben Aktion, kein Absturz), kein erwarteter Pfad.
    lastError = result.error;
    // eslint-disable-next-line no-console
    console.error(`KI-Aktion wurde von der Engine abgelehnt (sollte laut Bot-Vertrag nicht vorkommen): ${result.error}`);
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
  maybeQueueTutorialTips(action);
  notify();
  scheduleBotStepIfNeeded();
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
  // Eine evtl. noch geplante KI-Aktion der VORHERIGEN Partie darf nicht mehr
  // gegen den neuen State feuern (s. runBotStep, das direkt auf dem
  // modul-scoped `state` arbeitet) - erst stoppen, dann den neuen State
  // setzen, danach ggf. frisch planen (unten).
  stopBotLoop();
  const { state: s, events } = engine.createGame({
    decks: { player1: deckP1, player2: deckP2 },
    seed,
    // v0.1.6: skipMulligans wird NICHT mehr gesetzt (Engine-Default `false`,
    // rules-engine.md 1b) - das UI hat jetzt einen echten Mulligan-Dialog
    // (render.ts#actionBanner, pendingDecision.kind === "mulligan"), die
    // vorherige mechanische Not-Anpassung (immer skipMulligans: true) ist
    // damit hinfällig.
  });
  state = s;
  log = [`Seed: ${seed}`];
  lastError = undefined;
  uiMode = { kind: "idle" };
  for (const e of events) {
    const t = describeEvent(e);
    if (t) log.push(t);
  }
  maybeQueueTutorialTips(undefined);
  notify();
  // v0.1.7: Ist der (nach dem Münzwurf feststehende) erste Akteur bereits
  // bot-gesteuert - z.B. player2 ist KI und beginnt mit der ersten Mulligan-
  // Entscheidung oder direkt mit Priority -, spielt der Bot ab hier
  // automatisch weiter, bis wieder ein Mensch an der Reihe ist.
  triggerBotLoop();
}

/** Legale Aktions-Kandidaten für player im aktuellen State (delegiert an die Engine). */
export function legalActions(player: import("../model").PlayerId): PlayerAction[] {
  return engine.getLegalActions(state, player);
}

/**
 * Wendet eine MENSCHLICHE Aktion an (über die UI ausgelöst). Für automatische
 * KI-Züge wird bewusst NICHT diese Funktion verwendet, sondern die
 * strukturell identische, aber eigene `runBotStep` (oben) - dispatch() bleibt
 * damit "menschlicher Nutzer hat geklickt"-spezifisch (z.B. setzt es uiMode
 * zurück, was für automatische Bot-Züge irrelevant, aber auch unschädlich
 * wäre; der Haupt-Unterschied ist `triggerBotLoop()` am Ende, s.u.).
 */
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
  maybeQueueTutorialTips(action);
  notify();
  // v0.1.7: Nach jeder menschlichen Aktion prüfen, ob jetzt ein bot-
  // gesteuerter Spieler handeln muss - falls ja, automatisch weiterspielen
  // (siehe triggerBotLoop/runBotStep oben), bis wieder ein Mensch dran ist
  // oder das Spiel endet.
  triggerBotLoop();
}
