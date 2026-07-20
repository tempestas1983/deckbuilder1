/**
 * Zentrale Render-Funktion: baut aus GameState + UiMode das komplette DOM
 * neu auf ("State rein, DOM raus"). Kein virtuelles DOM/Diffing - für die
 * Größe dieses Boards reicht ein kompletter Rebuild pro Änderung.
 *
 * Wichtig (Rollen-Vertrag): Diese Datei ruft ausschließlich
 * `dispatch`/`legalActions` (→ applyAction/getLegalActions der Engine) auf,
 * um zu entscheiden, was der Spieler gerade tun darf. Eigene Legalitäts-
 * prüfungen (Mana, Timing, Combat-Regeln, guardian-Pflicht, ...) finden hier
 * NICHT statt - im Zweifel wird eine Aktion einfach versucht und ein
 * `error` der Engine anzeigt.
 */

import type { ActivatedAbility, GameState, InstanceId, PlayerAction, PlayerId } from "../model";
import {
  backToMainMenu,
  chooseOpponentBot,
  chooseOpponentHotseat,
  closeKeywordGlossary,
  closeKeywordGlossaryPanel,
  closeMusicPanel,
  confirmDeck,
  copyDeckFromPlayer1,
  closeTutorialHelp,
  dismissTutorialBubble,
  dispatch,
  getAppPhase,
  getBotDifficulty,
  getDecklist,
  getLastError,
  getLog,
  getMusicCurrentTrack,
  getMusicRepeatMode,
  getMusicTracks,
  getOpenKeywordGlossary,
  getPool,
  getState,
  getTutorialActiveStep,
  getTutorialHighlight,
  getTutorialPassPriorityBlockReason,
  getUiMode,
  hasRealPriorityChoice,
  isBotControlled,
  isKeywordGlossaryPanelOpen,
  isMusicEnabled,
  isMusicPanelOpen,
  isSfxEnabled,
  isTutorialActive,
  isTutorialBubbleVisible,
  isTutorialHelpOpen,
  legalActions,
  openDeckBuilderStandalone,
  resetUiMode,
  selectMusicTrack,
  setBotControlled,
  setBotDifficulty,
  setDecklist,
  setMusicRepeatMode,
  setUiMode,
  skipTutorialStep,
  startNewGameFlow,
  startTutorial,
  toggleKeywordGlossaryPanel,
  toggleMusicEnabled,
  toggleMusicPanel,
  toggleSfxEnabled,
  toggleTutorialHelp,
} from "./store";
import { BOT_DIFFICULTY_LABELS, BOT_DISPLAY_NAMES, type BotDifficulty } from "../ai";
import { cardDef } from "./cardInfo";
import { tutorialHelpButton, tutorialHelpPanel, tutorialInstructionBanner, tutorialModalBubble } from "./components/tutorialOverlay";
import { keywordGlossaryButton, keywordGlossaryPanel, keywordPopoverBubble } from "./components/keywordGlossaryPanel";
import { decisionSpotlightBanner } from "./components/decisionSpotlight";
import { musicPanel, musicPanelButton } from "./components/musicPanel";
import { sfxToggleButton } from "./components/sfxToggle";
import { h, text } from "./h";
import { cardTile } from "./components/cardTile";
import { deckBuilderScreen } from "./components/deckBuilder";
import { mainMenuScreen } from "./components/mainMenu";
import { opponentSelectScreen } from "./components/opponentSelect";
import { buildDemoDeck } from "./deck";
import { handCard, handCardDiscardToggle, handCardHidden } from "./components/handCard";
import { playerPanel } from "./components/playerPanel";
import { botAvatarImg } from "./components/sceneArt";
import { stackPanel } from "./components/stackPanel";
import { logPanel } from "./components/logPanel";
import {
  attackersPanel,
  blockersPanel,
  chooseModeDecisionPanel,
  discardPanel,
  modeSelectPanel,
  mulliganPanel,
  orderBlockersPanel,
  targetingBanner,
  xInputPanel,
} from "./components/actionPanels";
import {
  activateAbilityCandidatesFor,
  buildCastAction,
  candidatesByTargetKey,
  sourceHasXCost,
  sourceName,
  sourceTargets,
  xTargetShapeAllowsPermanent,
  xTargetShapeAllowsPlayer,
  xTargetShapeAllowsStackObject,
} from "./actionUtil";
import { validateDecklist } from "./deckValidation";
import { targetKeyOf, type AppPhase, type UiMode } from "./types";

const PLAYER_IDS: PlayerId[] = ["player1", "player2"];

function otherOf(p: PlayerId): PlayerId {
  return p === "player1" ? "player2" : "player1";
}

/**
 * Anzeigename für user-facing Statustexte (Panel-Kopfzeile, Statusleiste,
 * Mulligan-/Sieger-Banner): der erfundene Tavernen-Name (s.
 * src/ai/difficulty.ts#BOT_DISPLAY_NAMES) statt der rohen `PlayerId`, aber
 * NUR wenn der Spieler tatsächlich bot-gesteuert ist - für den menschlichen
 * player1 und einen hotseat-menschlichen player2 bleibt es beim bisherigen
 * "player1"/"player2". Bewusst NICHT im Ereignis-Log verwendet (s.
 * store.ts#getLog/describeEvent) - das Log bleibt an der rohen `PlayerId`,
 * damit es beim Debuggen technisch eindeutig bleibt.
 */
function playerDisplayName(playerId: PlayerId): string {
  return isBotControlled(playerId) ? BOT_DISPLAY_NAMES[getBotDifficulty(playerId)] : playerId;
}

// ---------------------------------------------------------------------------
// Sichtbare Übergänge statt Hard-Cut (Auftrag "Bot-Züge sichtbar statt Snap"):
// `render()` baut das DOM weiterhin komplett neu auf (s. Dateikommentar oben,
// unverändert) - NEU ist nur, dass dieser Rebuild, wenn möglich, innerhalb
// von `document.startViewTransition()` läuft. Die View Transitions API
// snapshotet automatisch den alten/neuen DOM-Zustand und blendet dazwischen
// über, ganz ohne eigene Diffing-/Bewegungslogik - passt damit ungewöhnlich
// gut zum bestehenden "State rein, DOM raus"-Rebuild-Muster dieser Datei.
// Einzelne Karten-Kacheln tragen zusätzlich ein `view-transition-name`
// (s. cardTile.ts/handCard.ts, Schema `card-<instanceId>`) - dieselbe
// Karten-Instanz "morpht" dadurch automatisch zwischen Hand/Battlefield/
// Friedhof statt nur weg- und neu eingeblendet zu werden (Auftrag Punkt 2+4).
//
// Bewusst NUR für Rebuilds INNERHALB der laufenden Partie aktiv (beide,
// vorheriger UND neuer AppPhase-Wert, müssen "playing" sein) - der Deckbau-
// Screen (bis zu 300 Pool-Karten gleichzeitig, s. deckBuilder.ts) bekäme bei
// jedem +/--Klick eine potenziell teure Voll-Screenshot-Transition ohne
// erkennbaren Nutzen (dort ändert sich nur ein Zähler, keine Karte bewegt
// sich zwischen Zonen) - hier bewusst NICHT aktiviert. Der Phasenwechsel
// selbst (Deckbau -> Spielbrett) bleibt ebenfalls ein Hard-Cut (komplett
// andere Ansicht, kein Bedarf an einer Crossfade-Animation).
//
// Defensiv wie im gesamten Projekt üblich (s. cardArt.ts/sceneArt.ts-
// Kommentare zu fehlenden Bild-Dateien): fehlt die API (Browser ohne
// Unterstützung, z.B. aktuell Firefox/Safari) oder wünscht der Nutzer
// reduzierte Bewegung (`prefers-reduced-motion: reduce`), bleibt es beim
// bisherigen direkten Rebuild ohne Transition - keine Regression, keine
// Fehlerbehandlung nötig.
// ---------------------------------------------------------------------------

function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && typeof document.startViewTransition === "function";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

let hasRenderedOnce = false;
let previousAppPhaseKind: AppPhase["kind"] | undefined;

/**
 * Lebenspunkte-"Ticken" (Auftrag Punkt 3): reiner Anzeige-Zustand außerhalb
 * des GameState (wie tutorialLastBuffTarget etc. in store.ts) - merkt sich
 * den zuletzt GERENDERTEN Lebenswert je Spieler, damit `playerArea` bei einer
 * Änderung eine kurze Puls-/Flash-Klasse an `playerPanel` durchreichen kann
 * (s. playerPanel.ts#lifePulse, style.css). Bewusst UNABHÄNGIG von der View-
 * Transitions-Unterstützung des Browsers (reines CSS-`animation`, läuft
 * überall) - ein reiner Zahlen-Crossfade allein liefert laut Auftrag nicht
 * das gewünschte "spürbare Reagieren". Wird bei jedem Verlassen der
 * Spielphase geleert, damit die erste Anzeige einer NEUEN Partie nicht
 * gegen die Lebenswerte der vorherigen Partie "pulst".
 */
let lifePulseTracking: Partial<Record<PlayerId, number>> = {};

function computeLifePulse(playerId: PlayerId, life: number): "up" | "down" | undefined {
  const previous = lifePulseTracking[playerId];
  lifePulseTracking[playerId] = life;
  if (previous === undefined || previous === life) return undefined;
  return life > previous ? "up" : "down";
}

/**
 * true, wenn der aktive Spieler beim Eintritt in `declareAttackers`
 * tatsächlich mindestens EINE Einheit hat, die als Angreifer infrage kommt -
 * reine Wiedererkennung über `legalActions` (engine/legal-actions.ts
 * #combatCandidates liefert IMMER den leeren Kandidaten `{ attackers: [] }`
 * zusätzlich zu einem Kandidaten PRO legalem Einzelangreifer), keine eigene
 * Legalitätsprüfung. Exakt dieselbe Erkennung wie
 * store.ts#autoResolvableActionFor - siehe dortiger Kommentar für die
 * Begründung, warum "genau 1 Kandidat mit leerer Liste" gleichbedeutend mit
 * "keine echte Wahl" ist.
 */
function hasRealDeclareAttackersChoice(state: GameState): boolean {
  const candidates = legalActions(state.activePlayer).filter(
    (a): a is Extract<PlayerAction, { kind: "declareAttackers" }> => a.kind === "declareAttackers",
  );
  return !(candidates.length === 1 && candidates[0]!.attackers.length === 0);
}

/**
 * Analog zu `hasRealDeclareAttackersChoice` oben, für `declareBlockers`.
 * Bewusst NICHT einfach "gibt es mindestens einen Kandidaten mit
 * blocks.length > 0" - bei einer gleichzeitigen Mehrfach-guardian-Pflicht
 * (rules-engine.md 6, s. legal-actions.ts-Dateikommentar) liefert die Engine
 * ABSICHTLICH GAR KEINEN Kandidaten (kombinatorisch nicht enumeriert), obwohl
 * eine ECHTE Entscheidung ansteht - "kein Kandidat" ist dort also gerade NICHT
 * gleichbedeutend mit "keine Wahl". Nur der Fall "genau 1 Kandidat, und der
 * ist die leere Deklaration" bedeutet zweifelsfrei "keine eigene Einheit kann
 * überhaupt blocken".
 */
function hasRealDeclareBlockersChoice(state: GameState): boolean {
  const defender = otherOf(state.activePlayer);
  const candidates = legalActions(defender).filter(
    (a): a is Extract<PlayerAction, { kind: "declareBlockers" }> => a.kind === "declareBlockers",
  );
  return !(candidates.length === 1 && candidates[0]!.blocks.length === 0);
}

/**
 * Auftrag Teil 3a: wer hat GERADE tatsächlich das "Zepter" (eine echte
 * Entscheidung zu treffen), nicht nur technisch Priority/den Zug? Grundlage
 * für die Rahmen-Hervorhebung um `.player-area` (s. playerArea unten) -
 * bewusst zurückhaltend: eine rein technische Priority-Übergabe (die dank
 * Auftrag Teil 1 ohnehin meist automatisch und unsichtbar durchläuft, s.
 * store.ts#advanceAutomation) zählt NICHT, nur ein Moment, in dem der
 * jeweilige Spieler wirklich etwas zu entscheiden hat (echte Priority-Wahl,
 * eine an ihn gerichtete PendingDecision, ein Kampf-Deklarationsschritt mit
 * echten Kandidaten, oder ein erzwungener Cleanup-Abwurf). `undefined`, wenn
 * gerade niemand in diesem Sinn "am Drücker" ist.
 */
function decidingPlayer(state: GameState): PlayerId | undefined {
  if (state.winner !== undefined) return undefined;
  if (state.pendingDecision) return state.pendingDecision.player;
  if (state.priorityPlayer !== undefined) {
    return hasRealPriorityChoice(state.priorityPlayer) ? state.priorityPlayer : undefined;
  }
  if (state.step === "declareAttackers") {
    return hasRealDeclareAttackersChoice(state) ? state.activePlayer : undefined;
  }
  if (state.step === "declareBlockers") {
    return hasRealDeclareBlockersChoice(state) ? otherOf(state.activePlayer) : undefined;
  }
  if (state.step === "cleanup" && state.players[state.activePlayer].hand.length > 7) {
    return state.activePlayer;
  }
  return undefined;
}

/**
 * Auftrag Teil 3b: `undefined`, außer GENAU DANN, wenn ein NICHT-bot-
 * gesteuerter Spieler bei Priority eine echte Wahl hat (Auto-Pass aus Teil 1
 * greift bewusst nicht) UND gerade kein anderer Interaktions-Flow (Targeting/
 * X-Eingabe/Modus-Wahl/Kampf-Deklaration/Abwurf, `mode.kind !== "idle"`)
 * bereits läuft - das auffällige Banner soll einen NEUEN Entscheidungsmoment
 * ankündigen, nicht einen bereits begonnenen Klickpfad überlagern.
 */
function decisionSpotlightPlayer(state: GameState, mode: UiMode): PlayerId | undefined {
  const player = state.priorityPlayer;
  if (player === undefined || state.pendingDecision || mode.kind !== "idle") return undefined;
  if (isBotControlled(player)) return undefined;
  return hasRealPriorityChoice(player) ? player : undefined;
}

/**
 * Erzwungene Entscheidungspunkte, bei denen die Engine bewusst KEINE Priority
 * vergibt und auf eine bestimmte PlayerAction wartet (rules-engine.md 2/6),
 * werden hier anhand der dafür dokumentierten State-Signale erkannt (siehe
 * docs/engine-status.md, Abschnitt "Für frontend-engineer") und automatisch
 * in den passenden UiMode überführt.
 */
function autoEnterForcedModes(state: GameState): void {
  if (state.winner !== undefined) return;
  const mode = getUiMode();
  if (state.pendingDecision) {
    // "orderBlockers" ist strukturell anders als "chooseTriggerTargets": keine
    // klickbaren Board-Kandidaten (getLegalActions liefert hier laut Vertrag
    // nur EINEN Kandidaten, keine Permutationen), daher ein eigener UiMode mit
    // lokal sortierbarem Zustand statt des generischen candidatesByTargetKey-
    // Wegs (der bleibt für chooseTriggerTargets zuständig, siehe unten).
    if (state.pendingDecision.kind === "orderBlockers" && mode.kind !== "orderingBlockers") {
      setUiMode({
        kind: "orderingBlockers",
        player: state.pendingDecision.player,
        attackers: state.pendingDecision.attackers.map((a) => ({ attacker: a.attacker, blockers: [...a.blockers] })),
      });
    }
    return; // chooseTriggerTargets: eigener Weg über candidatesByTargetKey, siehe unten
  }

  if (state.step === "declareAttackers" && state.priorityPlayer === undefined) {
    if (mode.kind !== "declaringAttackers") {
      // Auftrag Teil 2: hat der aktive Spieler KEINE einzige Einheit, die
      // überhaupt als Angreifer infrage kommt, zeigt store.ts#advanceAutomation
      // automatisch `{ attackers: [] }` an, statt einen Klick auf "Keine
      // Angreifer" zu verlangen - das Panel hier deshalb erst gar nicht
      // aufbauen (verhindert außerdem ein sichtbares Aufblitzen des Panels
      // kurz bevor store.ts es im selben synchronen Zug wieder verlässt, s.
      // dortiger Kommentar). Reine Wiedererkennung über legalActions (exakt
      // dieselbe Erkennung wie store.ts#autoResolvableActionFor), keine
      // eigene Legalitätslogik.
      if (hasRealDeclareAttackersChoice(state)) {
        setUiMode({ kind: "declaringAttackers", player: state.activePlayer, selected: [] });
      }
    }
    return;
  }
  if (state.step === "declareBlockers" && state.priorityPlayer === undefined) {
    if (mode.kind !== "declaringBlockers") {
      // s. Kommentar bei declareAttackers oben - analog für "Keine Blocker".
      if (hasRealDeclareBlockersChoice(state)) {
        setUiMode({ kind: "declaringBlockers", player: otherOf(state.activePlayer), pairs: [] });
      }
    }
    return;
  }
  if (
    state.step === "cleanup" &&
    state.priorityPlayer === undefined &&
    state.players[state.activePlayer].hand.length > 7
  ) {
    if (mode.kind !== "discarding") {
      const required = state.players[state.activePlayer].hand.length - 7;
      setUiMode({ kind: "discarding", player: state.activePlayer, required, selected: [] });
    }
    return;
  }
  if (
    mode.kind === "declaringAttackers" ||
    mode.kind === "declaringBlockers" ||
    mode.kind === "discarding" ||
    mode.kind === "orderingBlockers"
  ) {
    setUiMode({ kind: "idle" });
  }
}

/**
 * App-Einstiegspunkt fürs Rendering: verzweigt zwischen dem Deckbau-Screen
 * (AppPhase "deckbuild", vor dem ersten `initGame`) und dem eigentlichen
 * Spielbrett (AppPhase "playing"). Siehe types.ts#AppPhase - reiner
 * App-Ebene-UI-Zustand, kein Teil des GameState.
 *
 * Entscheidet zusätzlich, OB dieser Rebuild in eine View Transition
 * eingepackt wird (s. Kommentarblock oben) - der eigentliche Rebuild selbst
 * (`paint()`/`renderRoot`) ist unverändert derselbe komplette DOM-Neuaufbau
 * wie zuvor.
 */
export function render(root: HTMLElement): void {
  const phase = getAppPhase();
  const wasPlayingBefore = previousAppPhaseKind === "playing";
  const animate =
    hasRenderedOnce && wasPlayingBefore && phase.kind === "playing" && supportsViewTransitions() && !prefersReducedMotion();
  hasRenderedOnce = true;
  previousAppPhaseKind = phase.kind;
  if (phase.kind !== "playing") {
    // Partie verlassen/noch nicht gestartet - nächste Partie soll ohne
    // "Pulsen" gegen die Lebenswerte der vorherigen Partie starten (s.o.).
    lifePulseTracking = {};
  }

  const paint = () => renderRoot(root);
  if (!animate) {
    paint();
    return;
  }
  const transition = document.startViewTransition(paint);
  // Defensiv (s.o.): das DOM ist durch `paint()` bereits synchron
  // aktualisiert, sobald die Browser-Engine den Callback aufruft - eine
  // abgelehnte ready/finished-Promise (z.B. der seltene Grenzfall
  // "doppelter view-transition-name") darf dennoch nie als unhandled
  // rejection auffallen; es entfällt in dem Fall nur die Animation selbst.
  transition.ready.catch(() => undefined);
  transition.finished.catch(() => undefined);
}

function renderRoot(root: HTMLElement): void {
  const phase = getAppPhase();
  root.innerHTML = "";
  if (phase.kind === "mainMenu") {
    root.append(
      mainMenuScreen({
        onNewGame: () => startNewGameFlow(),
        onDeckBuilder: () => openDeckBuilderStandalone(),
        onTutorial: () => startTutorial(),
      }),
    );
    return;
  }
  if (phase.kind === "opponentSelect") {
    root.append(
      opponentSelectScreen({
        onChooseBot: (difficulty) => chooseOpponentBot(difficulty),
        onChooseHotseat: () => chooseOpponentHotseat(),
        onBack: () => backToMainMenu(),
      }),
    );
    return;
  }
  if (phase.kind === "deckbuild") {
    root.append(renderDeckBuilder(phase.player, phase.mode));
    return;
  }
  renderGameBoard(root);
}

function renderDeckBuilder(player: PlayerId, mode: "newGame" | "standalone"): HTMLElement {
  const pool = getPool();
  const decklist = getDecklist(player);

  return deckBuilderScreen({
    pool,
    player,
    decklist,
    mode,
    offerCopyFromPlayer1: mode === "newGame" && player === "player2",
    onChange: (next) => setDecklist(player, next),
    onRandomFill: () => setDecklist(player, buildDemoDeck(pool)),
    onClearDeck: () => setDecklist(player, {}),
    onCopyFromPlayer1: () => copyDeckFromPlayer1(),
    onConfirm: () => {
      // Defensive Doppelprüfung - der Button ist im Deckbau-Screen bereits
      // per `disabled` gesperrt, solange die Deckliste ungültig ist
      // (deckValidation.ts); hier zusätzlich geprüft, falls render() jemals
      // ohne diese Sperre aufgerufen wird (z.B. künftige Tastatursteuerung).
      if (!validateDecklist(pool, decklist).valid) return;
      confirmDeck(player);
      // "echtes Hauptmenü"-Umbau: wurde der Gegner in der Gegner-Auswahl
      // bereits als KI festgelegt (s. store.ts#chooseOpponentBot), wird der
      // player2-Deckbau-Screen komplett übersprungen - exakt dasselbe
      // "zufällig füllen + markieren + sofort bestätigen"-Vorgehen wie beim
      // bisherigen "Zufälliges KI-Deck + weiter"-Kurzstart (s.
      // onAiQuickstart unten), nur direkt im Anschluss an player1s eigene
      // Bestätigung statt über einen eigenen Button auf dem player2-Screen.
      if (player === "player1" && isBotControlled("player2")) {
        const randomDeck = buildDemoDeck(pool);
        setDecklist("player2", randomDeck);
        confirmDeck("player2");
      }
    },
    // v0.1.7 ("Spieler 2 = KI"): Umschalter setzt nur das Flag
    // (store.ts#setBotControlled) - der Nutzer kann trotzdem ganz normal
    // weiter sein eigenes Deck bauen und über "Spiel starten" fortfahren
    // (das Flag entscheidet nur, wer die Züge später automatisch spielt, s.
    // store.ts#dispatch/initGame). "Zufälliges KI-Deck + weiter" bleibt als
    // Abkürzung DIREKT auf dem player2-Screen erhalten (erreichbar über
    // "Neues Spiel" -> "2 Spieler", falls dort doch noch spontan gegen die KI
    // gespielt werden soll) - der reguläre Weg, gegen die KI zu spielen, ist
    // seit dem "echtes Hauptmenü"-Umbau aber die Gegner-Auswahl VOR dem
    // Deckbau (s. store.ts#chooseOpponentBot/components/opponentSelect.ts).
    botControlled: isBotControlled(player),
    onToggleBotControl: () => setBotControlled(player, !isBotControlled(player)),
    // v0.1.9: Schwierigkeitsstufen-Auswahl (docs/ai-status.md Abschnitt 9.8) -
    // reicht nur getBotDifficulty/setBotDifficulty durch, keine eigene Logik.
    botDifficulty: getBotDifficulty(player),
    onChangeBotDifficulty: (next) => setBotDifficulty(player, next),
    onAiQuickstart: () => {
      const randomDeck = buildDemoDeck(pool);
      setBotControlled(player, true);
      setDecklist(player, randomDeck);
      if (validateDecklist(pool, randomDeck).valid) {
        confirmDeck(player);
      }
    },
    // NUR im eigenständigen "Deck Builder"-Menüpunkt gesetzt (s.
    // components/deckBuilder.ts#DeckBuilderOptions.mode) - "Weiter"/"Spiel
    // starten" gibt es dort nicht, stattdessen führt dieser Callback direkt
    // zurück ins Hauptmenü.
    onBackToMainMenu: mode === "standalone" ? () => backToMainMenu() : undefined,
  });
}

function renderGameBoard(root: HTMLElement): void {
  const state = getState();
  autoEnterForcedModes(state);
  const pool = getPool();
  const mode = getUiMode();
  const err = getLastError();
  const tutorialActive = isTutorialActive();
  const tutorialStep = tutorialActive ? getTutorialActiveStep() : undefined;
  const tutorialModalVisible = tutorialActive && isTutorialBubbleVisible();
  const openKeywordPopover = getOpenKeywordGlossary();

  const children: (HTMLElement | undefined)[] = [
    // v0.1.16: geführte Schritt-Sequenz statt loser Einzel-Tipps (s.
    // tutorialContent.ts/store.ts) - modale Bestätigungs-/Info-Sprechblase
    // ODER (solange die erwartete Aktion eines Aktions-Schritts noch
    // aussteht) ein nicht-modales Instruktions-Banner mit
    // "Schritt überspringen"-Sicherheitsnetz.
    tutorialStep && tutorialModalVisible ? tutorialModalBubble(tutorialStep, () => dismissTutorialBubble()) : undefined,
    tutorialStep && !tutorialModalVisible && !tutorialStep.infoOnly
      ? tutorialInstructionBanner(tutorialStep, () => skipTutorialStep())
      : undefined,
    // Keyword-Glossar-Klick-Sprechblase (Auftrag Punkt 2): unabhängig vom
    // Tutorial-Modus, ausgelöst durch Klick auf ein hervorgehobenes
    // Keyword-Wort im Kartentext (s. components/keywordText.ts).
    openKeywordPopover ? keywordPopoverBubble(openKeywordPopover, () => closeKeywordGlossary()) : undefined,
    statusBar(state, mode),
    err ? h("div", { class: "error-banner" }, [text(`Nicht erlaubt: ${err}`)]) : undefined,
    // Auftrag Teil 3b: auffällige, NICHT-blockierende Hervorhebung eines
    // echten Entscheidungsmoments (Auto-Pass aus Teil 1 greift bewusst
    // nicht) - Handkarten/Fähigkeiten bleiben normal klickbar, der
    // "Überspringen"-Button dispatcht dieselbe passPriority-Aktion wie der
    // Button in der Statusleiste (inkl. desselben Tutorial-Sperrgrunds).
    (() => {
      const spotlightPlayer = decisionSpotlightPlayer(state, mode);
      if (!spotlightPlayer) return undefined;
      const blockReason = getTutorialPassPriorityBlockReason(spotlightPlayer);
      return decisionSpotlightBanner(playerDisplayName(spotlightPlayer), blockReason, () =>
        dispatch({ kind: "passPriority", player: spotlightPlayer }),
      );
    })(),
    ...actionBanner(state, mode),
    state.winner !== undefined ? gameOverBanner(state) : undefined,
    boardSection(state, pool, mode),
    stackPanel(state, pool, stackPanelOptions(state, mode)),
    logPanel(getLog()),
    tutorialActive && isTutorialHelpOpen() ? tutorialHelpPanel(() => closeTutorialHelp()) : undefined,
    // Auftrag Punkt 3: das globale Keyword-Nachschlagewerk ist in JEDER
    // Partie erreichbar (nicht nur im Tutorial-Modus, anders als
    // tutorialHelpPanel oben) - eigener Zustand in store.ts.
    isKeywordGlossaryPanelOpen() ? keywordGlossaryPanel(() => closeKeywordGlossaryPanel()) : undefined,
    // App-weite Hintergrundmusik (s. musicPlayer.ts): Titelauswahl +
    // Wiederholungsmodus, analog zum Keyword-Nachschlagewerk oben jederzeit
    // erreichbar, unabhängig vom Tutorial-Modus.
    isMusicPanelOpen() ? musicPanel(musicPanelOptions()) : undefined,
  ];

  root.append(...children.filter((c): c is HTMLElement => !!c));
}

// ---------------------------------------------------------------------------
// Status- / Banner-Zeilen
// ---------------------------------------------------------------------------

/** Options-Objekt für `musicPanel()` - bündelt Store-Reads + Store-Aktionen, damit sowohl render.ts als auch components/deckBuilder.ts das Panel identisch verdrahten. */
function musicPanelOptions() {
  return {
    enabled: isMusicEnabled(),
    tracks: getMusicTracks(),
    currentTrack: getMusicCurrentTrack(),
    repeatMode: getMusicRepeatMode(),
    onToggleEnabled: () => toggleMusicEnabled(),
    onSelectTrack: (track: string) => selectMusicTrack(track),
    onSetRepeatMode: (mode: ReturnType<typeof getMusicRepeatMode>) => setMusicRepeatMode(mode),
    onClose: () => closeMusicPanel(),
  };
}

function statusBar(state: GameState, mode: UiMode): HTMLElement {
  // "Priorität passen" ist der normale Weg, einen Priority-Moment zu
  // verlassen, ohne etwas (weiteres) zu tun - ohne diesen Button gibt es
  // sonst kein UI-Element dafür (getLegalActions liefert passPriority zwar
  // immer, siehe legal-actions.ts, aber das muss auch anklickbar sein).
  // Immer sichtbar/aktiv, wenn priorityPlayer gesetzt ist und keine
  // PendingDecision aussteht (Combat-/Cleanup-Zwangsschritte haben ohnehin
  // priorityPlayer === undefined, siehe turn.ts).
  const canPass = state.priorityPlayer !== undefined && !state.pendingDecision;
  const priorityPlayer = state.priorityPlayer;
  // Nutzer-Feedback: "Priorität passen" hier und der "Überspringen"-Button
  // im auffälligen Spotlight-Banner (s. Aufruf von decisionSpotlightPlayer
  // weiter unten im Wurzel-Render) lösen exakt dieselbe passPriority-Aktion
  // aus - zwei sichtbare Buttons für denselben Klick sind verwirrend. Sobald
  // das Spotlight-Banner für DIESEN priorityPlayer sowieso schon angezeigt
  // wird, bleibt dieser kleine Button hier versteckt (der große im Banner
  // reicht dann als einziger Auslöser).
  const spotlightAlreadyShown = !!priorityPlayer && decisionSpotlightPlayer(state, mode) === priorityPlayer;
  // Bug/Auftrag "Tutorial-Terrain-Sackgasse" (s. store.ts#getTutorialPassPriorityBlockReason
  // + tutorialContent.ts#TutorialStep["mainPhaseOnly"]): solange ein Tutorial-
  // Schritt aktiv ist, der NUR in der eigenen Hauptphase legal ist (playTerrain/
  // castCreature), UND player1 gerade tatsächlich eine passende Kandidatenaktion
  // hat, wird der Button gesperrt statt die Hauptphase unbemerkt zu verlassen.
  const passBlockReason = priorityPlayer ? getTutorialPassPriorityBlockReason(priorityPlayer) : undefined;

  return h("div", { class: "status-bar" }, [
    h("span", {}, [text(`Zug ${state.turnNumber} · Step: ${state.step}`)]),
    h("span", {}, [text(`Aktiver Spieler: ${playerDisplayName(state.activePlayer)}`)]),
    h(
      "span",
      {},
      [
        text(
          priorityPlayer
            ? `Priority: ${playerDisplayName(priorityPlayer)}`
            : "Priority: (Engine verarbeitet Turn-Based Action)",
        ),
      ],
    ),
    canPass && priorityPlayer && !spotlightAlreadyShown
      ? h(
          "button",
          {
            class: "btn btn-pass",
            disabled: !!passBlockReason,
            title: passBlockReason,
            onclick: () => {
              if (passBlockReason) return;
              dispatch({ kind: "passPriority", player: priorityPlayer });
            },
          },
          [text(`Priorität passen (${playerDisplayName(priorityPlayer)})`)],
        )
      : undefined,
    // v0.1.11: im Tutorial-Modus jederzeit alle bereits erklärten (und noch
    // ausstehenden) Tipps erneut abrufbar (Auftrag Punkt 4) - unabhängig vom
    // aktuellen Spielstand, s. components/tutorialOverlay.ts#tutorialHelpPanel.
    isTutorialActive() ? tutorialHelpButton(() => toggleTutorialHelp()) : undefined,
    // Keyword-Glossar (Auftrag Punkt 3): IMMER sichtbar, unabhängig vom
    // Tutorial-Modus - anders als der Button darüber gilt hier bewusst KEINE
    // isTutorialActive()-Einschränkung (Nutzer-Feedback trat in einer
    // normalen/Tutorial-Partie auf, nicht spezifisch im geführten Tutorial).
    keywordGlossaryButton(() => toggleKeywordGlossaryPanel()),
    // App-weite Hintergrundmusik (s. musicPlayer.ts): öffnet das Musik-Panel
    // (An/Aus, Titelauswahl, Wiederholungsmodus) - analog zum
    // Schlüsselwörter-Button jederzeit sichtbar/erreichbar, unabhängig vom
    // Tutorial-Modus.
    musicPanelButton(() => toggleMusicPanel()),
    // Soundeffekte (s. sfxPlayer.ts): eigenständiger Mute-Zustand neben dem
    // Musik-Toggle, s. store.ts#isSfxEnabled-Dateikommentar.
    sfxToggleButton(isSfxEnabled(), () => toggleSfxEnabled()),
    h(
      "button",
      { class: "btn btn-cancel", onclick: () => backToMainMenu() },
      [text("Zurück zum Hauptmenü")],
    ),
  ]);
}

function gameOverBanner(state: GameState): HTMLElement {
  const winnerLabel =
    state.winner === "player1" || state.winner === "player2" ? playerDisplayName(state.winner) : state.winner;
  return h("div", { class: "game-over-banner" }, [text(`Spiel beendet - Sieger: ${winnerLabel}`)]);
}

/** Zentrale Ziel-/Eingabe-Kandidaten für die aktuelle PendingDecision (falls vorhanden). */
function pendingDecisionCandidates(state: GameState): PlayerAction[] {
  if (!state.pendingDecision) return [];
  return legalActions(state.pendingDecision.player).filter((a) => a.kind === "resolveDecision");
}

function actionBanner(state: GameState, mode: UiMode): HTMLElement[] {
  if (state.pendingDecision) {
    if (state.pendingDecision.kind === "mulligan") {
      const decision = state.pendingDecision;
      return [
        mulliganPanel(
          playerDisplayName(decision.player),
          decision.timesMulliganed,
          () =>
            dispatch({
              kind: "resolveDecision",
              player: decision.player,
              choice: { kind: "mulligan", takeMulligan: false },
            }),
          () =>
            dispatch({
              kind: "resolveDecision",
              player: decision.player,
              choice: { kind: "mulligan", takeMulligan: true },
            }),
        ),
      ];
    }
    if (state.pendingDecision.kind === "chooseMode") {
      const decision = state.pendingDecision;
      const def = cardDef(getPool(), state, decision.sourceInstanceId);
      const ability = "abilities" in def ? def.abilities?.[decision.abilityIndex] : undefined;
      const modes = ability?.kind === "triggered" ? ability.modes ?? [] : [];
      return [
        chooseModeDecisionPanel(def.name, modes, decision.selectableModes, (modeIndex) =>
          dispatch({ kind: "resolveDecision", player: decision.player, choice: { kind: "chooseMode", modeIndex } }),
        ),
      ];
    }
    if (state.pendingDecision.kind === "orderBlockers" && mode.kind === "orderingBlockers") {
      return [
        orderBlockersPanel(
          mode.attackers,
          (id) => cardDef(getPool(), state, id).name,
          (attackerIndex, blockerIndex, direction) => {
            const nextAttackers = mode.attackers.map((a, i) => {
              if (i !== attackerIndex) return a;
              const blockers = [...a.blockers];
              const swapWith = direction === "up" ? blockerIndex - 1 : blockerIndex + 1;
              if (swapWith < 0 || swapWith >= blockers.length) return a;
              [blockers[blockerIndex], blockers[swapWith]] = [blockers[swapWith]!, blockers[blockerIndex]!];
              return { ...a, blockers };
            });
            setUiMode({ ...mode, attackers: nextAttackers });
          },
          () =>
            dispatch({
              kind: "resolveDecision",
              player: mode.player,
              choice: { kind: "orderBlockers", orders: mode.attackers },
            }),
        ),
      ];
    }
    return [
      targetingBanner(
        `Zielwahl erforderlich (${state.pendingDecision.player}, ${state.pendingDecision.kind}) - Ziel auf dem Spielbrett antippen.`,
      ),
    ];
  }
  if (mode.kind === "targeting") {
    return [targetingBanner(mode.title, () => resetUiMode())];
  }
  if (mode.kind === "modeSelect") {
    return [
      modeSelectPanel(
        sourceName(getPool(), state, mode.source),
        mode.modes,
        (modeIndex) => {
          const chosenModeTargets = mode.modes[modeIndex]?.targets;
          if (sourceHasXCost(getPool(), state, mode.source)) {
            setUiMode({ kind: "xInput", player: mode.player, source: mode.source, chosenMode: modeIndex });
          } else if (chosenModeTargets && chosenModeTargets.length > 0) {
            setUiMode({
              kind: "xTarget",
              player: mode.player,
              source: mode.source,
              chosenMode: modeIndex,
              spec: chosenModeTargets[0]!,
            });
          } else {
            dispatch(buildCastAction(mode.source, mode.player, [], undefined, modeIndex));
          }
        },
        () => resetUiMode(),
      ),
    ];
  }
  if (mode.kind === "xInput") {
    return [
      xInputPanel(
        sourceName(getPool(), state, mode.source),
        (x) => {
          const targets = sourceTargets(getPool(), state, mode.source, mode.chosenMode);
          if (targets && targets.length > 0) {
            setUiMode({
              kind: "xTarget",
              player: mode.player,
              source: mode.source,
              chosenX: x,
              chosenMode: mode.chosenMode,
              spec: targets[0]!,
            });
          } else {
            dispatch(buildCastAction(mode.source, mode.player, [], x, mode.chosenMode));
          }
        },
        () => resetUiMode(),
      ),
    ];
  }
  if (mode.kind === "xTarget") {
    const label = mode.chosenX !== undefined ? `Ziel für X=${mode.chosenX} wählen` : "Ziel wählen";
    return [targetingBanner(`${label} (Spielbrett antippen).`, () => resetUiMode())];
  }
  if (mode.kind === "declaringAttackers") {
    return [
      attackersPanel(
        mode.selected.length,
        () => dispatch({ kind: "declareAttackers", player: mode.player, attackers: mode.selected }),
        () => dispatch({ kind: "declareAttackers", player: mode.player, attackers: [] }),
      ),
    ];
  }
  if (mode.kind === "declaringBlockers") {
    return [
      blockersPanel(
        mode.pairs,
        (id) => cardDef(getPool(), state, id).name,
        (blocker) => setUiMode({ ...mode, pairs: mode.pairs.filter((p) => p.blocker !== blocker) }),
        () => dispatch({ kind: "declareBlockers", player: mode.player, blocks: mode.pairs }),
        () => dispatch({ kind: "declareBlockers", player: mode.player, blocks: [] }),
      ),
    ];
  }
  if (mode.kind === "discarding") {
    return [
      discardPanel(mode.required, mode.selected.length, () =>
        dispatch({ kind: "discardToHandSize", player: mode.player, cardInstanceIds: mode.selected }),
      ),
    ];
  }
  return [];
}

function stackPanelOptions(state: GameState, mode: UiMode) {
  const candidates = state.pendingDecision ? pendingDecisionCandidates(state) : mode.kind === "targeting" ? mode.candidates : [];
  const map = candidatesByTargetKey(candidates);
  const targetableKeys = new Set(map.keys());

  // X-Kosten-Karten mit Ziel auf dem Stack (z.B. ein zukünftiger X-Konter):
  // getLegalActions enumeriert diese bewusst nicht (siehe actionUtil.ts), also
  // werden hier - nur anhand des TargetSpec.kind der Karte - alle aktuellen
  // Stack-Objekte als klickbar markiert; applyAction validiert final.
  if (mode.kind === "xTarget" && xTargetShapeAllowsStackObject(mode.spec)) {
    for (const obj of state.stack) targetableKeys.add(targetKeyOf({ kind: "stackObject", stackObjectId: obj.id }));
  }

  return {
    targetableKeys,
    onTargetClick: (stackObjectId: string) => {
      const candidate = map.get(targetKeyOf({ kind: "stackObject", stackObjectId }));
      if (candidate) {
        dispatch(candidate);
        return;
      }
      if (mode.kind === "xTarget" && xTargetShapeAllowsStackObject(mode.spec)) {
        dispatch(
          buildCastAction(
            mode.source,
            mode.player,
            [{ kind: "stackObject", stackObjectId }],
            mode.chosenX,
            mode.chosenMode,
          ),
        );
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Board (zwei Spielerbereiche)
// ---------------------------------------------------------------------------

function boardSection(state: GameState, pool: ReturnType<typeof getPool>, mode: UiMode): HTMLElement {
  const targetCandidates = state.pendingDecision ? pendingDecisionCandidates(state) : mode.kind === "targeting" ? mode.candidates : [];
  const targetMap = candidatesByTargetKey(targetCandidates);

  const board = h(
    "div",
    { class: "board" },
    // Szenen-Artwork (docs/scene-art-brief.md): das Taverne-Hintergrundfoto
    // selbst ist KEIN Kind von `.board` mehr (Auftrag "Hintergrund soll
    // breiter wirken als das Spielfeld") - es hängt als Singleton direkt an
    // `document.body`, s. sceneArt.ts#initBoardBackdrop (von main.ts einmalig
    // aufgerufen). `.board` behält nur seine eigene reine CSS-Atmosphäre
    // (Holzmaserung-Verlauf/Rauschen `.board::before`, Kerzenschein-Glow
    // `.board::after`).
    PLAYER_IDS.map((playerId) => playerArea(state, pool, playerId, mode, targetMap)),
  );

  // Großer Gegner-Avatar rechts neben dem Spielfeld (statt des früheren
  // kleinen Inline-Porträts im Panel-Header, s. sceneArt.ts#botAvatarImg):
  // "der Gegner" ist UI-seitig immer player2 - nur dessen Deckbau-Screen
  // bietet den KI-Umschalter überhaupt an (components/deckBuilder.ts,
  // "aiToggle nur für player2"), player1 ist nie bot-gesteuert. Ohne
  // aktiven Bot (Hotseat-Mensch als player2) bleibt die Spalte einfach weg -
  // .board-row degradiert dann per CSS (flex) zu einer einspaltigen
  // Vollbreiten-Ansicht, keine Lücke.
  const opponentAvatar = isBotControlled("player2") ? opponentAvatarColumn(getBotDifficulty("player2")) : undefined;

  return h("div", { class: "board-row" }, [board, opponentAvatar]);
}

/**
 * Rechte Board-Spalte mit dem großformatigen Charakterporträt des
 * bot-gesteuerten Gegners (Auftrag "Avatar größer + an den rechten Rand
 * des Spielfelds"). Bild-Lade-/Fallback-Verhalten kommt unverändert aus
 * sceneArt.ts#botAvatarImg (nur Größe/Position per CSS geändert, s.
 * `.board-opponent-avatar-img` in style.css) - fehlt die Bilddatei, entfernt
 * sich nur das <img>, die Spalte selbst bleibt (mit CSS-Fallback-Rahmen)
 * stehen, kein Layoutbruch.
 */
function opponentAvatarColumn(difficulty: BotDifficulty): HTMLElement {
  return h("div", { class: "board-opponent-avatar" }, [botAvatarImg(difficulty)]);
}

function playerArea(
  state: GameState,
  pool: ReturnType<typeof getPool>,
  playerId: PlayerId,
  mode: UiMode,
  targetMap: Map<string, PlayerAction>,
): HTMLElement {
  const playerTargetKey = targetKeyOf({ kind: "player", playerId });
  const playerCandidate = targetMap.get(playerTargetKey);
  const xTargetsPlayer = mode.kind === "xTarget" && xTargetShapeAllowsPlayer(mode.spec);
  const modeForXTarget = mode.kind === "xTarget" ? mode : undefined;
  // v0.1.8 (concede-Button): nicht anzeigen, wenn das Spiel schon vorbei ist,
  // der Spieler schon verloren hat, oder er bot-gesteuert ist (der Bot gibt
  // nicht auf, s. Auftrag) - "concede" selbst ist eine reguläre, von der
  // Engine schon lange unterstützte PlayerAction (game-state.ts), hier nur
  // ans UI verdrahtet.
  const canConcede = state.winner === undefined && !state.players[playerId].hasLost && !isBotControlled(playerId);
  // Auftrag Punkt 3 ("Angriff/Schaden ... Lebenspunkte, die spürbar
  // reagieren statt zu springen"): reine Anzeige-Ableitung, s.
  // computeLifePulse oben - MUSS pro Render genau einmal pro Spieler
  // aufgerufen werden (aktualisiert den Tracking-Zustand als Nebeneffekt).
  const lifePulse = computeLifePulse(playerId, state.players[playerId].life);
  // Auftrag Teil 3a: der Hand+Battlefield-Bereich des Spielers, der GERADE
  // tatsächlich eine echte Entscheidung treffen muss/kann, sticht optisch
  // hervor (s. decidingPlayer oben) - bewusst NUR bei einer echten
  // Entscheidung, nicht bei jedem technischen Prioritätswechsel (Auto-Pass
  // aus Teil 1 wechselt priorityPlayer u.U. sehr schnell hin und her, ohne
  // dass hier je ein Rahmen aufblitzen würde).
  const isDeciding = decidingPlayer(state) === playerId;

  return h("div", { class: isDeciding ? "player-area player-area-deciding" : "player-area" }, [
    playerPanel(state, playerId, {
      lifePulse,
      botControlled: isBotControlled(playerId),
      // v0.1.9: Anzeige der aktiven Bot-Schwierigkeitsstufe im Spielbrett-
      // Header (docs/ai-status.md Abschnitt 9.8, Punkt 3, optional) - nur
      // relevant, wenn der Spieler tatsächlich bot-gesteuert ist (playerPanel
      // zeigt das "KI"-Badge ohnehin nur dann an, s. dortiger Code).
      botDifficultyLabel: isBotControlled(playerId) ? BOT_DIFFICULTY_LABELS[getBotDifficulty(playerId)] : undefined,
      // Erfundener Tavernen-Name statt der rohen PlayerId, nur bei
      // bot-gesteuerten Spielern (s. playerDisplayName oben). Das
      // großformatige Porträt selbst hängt nicht mehr am Panel-Header,
      // s. boardSection#opponentAvatarColumn.
      displayName: playerDisplayName(playerId),
      targetable: !!playerCandidate || xTargetsPlayer,
      onClick: playerCandidate
        ? () => dispatch(playerCandidate)
        : xTargetsPlayer && modeForXTarget
          ? () =>
              dispatch(
                buildCastAction(
                  modeForXTarget.source,
                  modeForXTarget.player,
                  [{ kind: "player", playerId }],
                  modeForXTarget.chosenX,
                  modeForXTarget.chosenMode,
                ),
              )
          : undefined,
      onConcede: canConcede
        ? () => {
            // Irreversible Aktion -> einfache Bestätigung (kein eigenes
            // Modal-System nötig, s. Auftrag).
            if (window.confirm(`${playerId} wirklich aufgeben? Das Spiel gilt danach sofort als verloren.`)) {
              dispatch({ kind: "concede", player: playerId });
            }
          }
        : undefined,
    }),
    h("div", { class: "zone-label" }, [text("Hand")]),
    handZone(state, pool, playerId, mode),
    h("div", { class: "zone-label" }, [text("Battlefield")]),
    battlefieldZone(state, pool, playerId, mode, targetMap),
    h("div", { class: "zone-label" }, [text("Graveyard")]),
    graveyardZone(state, pool, playerId),
  ]);
}

function handZone(state: GameState, pool: ReturnType<typeof getPool>, playerId: PlayerId, mode: UiMode): HTMLElement {
  const hand = state.players[playerId].hand;

  // Cleanup-Abwurf (rules-engine.md 2, discardToHandSize): eine erzwungene,
  // nicht überspringbare Entscheidung OHNE automatischen Lösungsweg außer der
  // Auswahl selbst (kein "Priorität passen" möglich, s. statusBar - während
  // dieser Entscheidung ist priorityPlayer immer undefined). Bewusst VOR der
  // Verdeckungs-Regel unten geprüft und von ihr ausgenommen: das ist keine
  // passive Drittsicht auf fremde Karten, sondern DER Moment, in dem
  // `playerId` selbst (ob player1 oder nicht) am Zug ist, seine eigenen
  // Karten auszuwählen - ohne diese Ausnahme gäbe es für einen nicht bot-
  // gesteuerten player2 (Hotseat) gar keinen Weg mehr, hand.length > 7
  // aufzulösen (echter Deadlock statt nur eingeschränkter Bedienbarkeit, s.
  // Verdeckungs-Kommentar unten für den bewusst hingenommenen Grenzfall
  // "spielt aus der Hand").
  if (mode.kind === "discarding" && mode.player === playerId) {
    const tiles = hand.map((id) => {
      const def = cardDef(pool, state, id);
      const selected = mode.selected.includes(id);
      return handCardDiscardToggle(id, def, selected, () => {
        const next = selected ? mode.selected.filter((x) => x !== id) : [...mode.selected, id];
        setUiMode({ ...mode, selected: next });
      });
    });
    return h("div", { class: "hand-zone" }, tiles);
  }

  // Verdeckte Information (Auftrag "Gegner-Hand ist komplett sichtbar"):
  // dieselbe Konvention wie beim Tutorial-Highlight unten - player1 ist IMMER
  // die lokale/menschliche Sicht (s. store.ts#startTutorial). JEDE andere
  // Hand (aktuell nur player2, generisch für künftige Erweiterungen offen
  // gehalten statt hart auf "player2" verdrahtet) zeigt deshalb NIE volle
  // Kartendetails (Name/Kosten/Regeltext) beim bloßen Betrachten/Ausspielen -
  // unabhängig davon, ob dieser Spieler gerade bot-gesteuert ist oder (im
  // lokalen Hotseat-Fall) ein zweiter Mensch am selben Bildschirm. Bewusst
  // KEIN echtes Pass-and-Play-Verdeckungssystem (Bildschirm umdrehen,
  // Sichtbarkeit abhängig von "wer ist gerade dran" o.ä.) - außerhalb des
  // Auftrags; ein echter zweiter Mensch kann in diesem Modus dadurch aktuell
  // keine Karte aus seiner Hand aktiv aussuchen/spielen (bewusst hingenommene
  // Einschränkung laut Auftrag - anders als beim Abwurf oben gibt es hierfür
  // keinen erzwungenen Deadlock, der Zug läuft einfach ohne diese Aktion weiter).
  if (playerId !== "player1") {
    return hiddenHandZone(hand);
  }

  const isActingPlayer = state.priorityPlayer === playerId && !state.pendingDecision;
  const candidates = isActingPlayer ? legalActions(playerId) : [];
  // v0.1.16: geführtes Tutorial richtet sich immer an player1 (den
  // menschlichen Spieler, s. store.ts#startTutorial) - Handkarten-Highlight
  // deshalb nur in dessen Handzone anwenden.
  const tutorialHandHighlightIds =
    playerId === "player1" && isTutorialActive() ? getTutorialHighlight()?.handCardDefinitionIds : undefined;
  const tiles = hand.map((id) => {
    const def = cardDef(pool, state, id);
    const castCandidates = candidates.filter((a) => a.kind === "castSpell" && a.cardInstanceId === id);
    const playTerrainCandidate = candidates.find((a) => a.kind === "playTerrain" && a.cardInstanceId === id);
    const hasX = "cost" in def && !!def.cost.x;
    // v0.3 (Modal-Spells, 9.13): nur SpellCard trägt Top-Level "modes" -
    // Modus kommt vor X (Reihenfolge Modus -> X -> Ziele), daher schließen
    // sich offerModeFlow/offerXFlow als TOP-LEVEL-Button gegenseitig aus; der
    // modeSelect-Flow fragt X selbst noch ab, falls die Karte zusätzlich
    // X-Kosten hat (kein aktueller Kartenpool-Fall, aber allgemein getragen).
    const modes = def.type === "spell" ? def.modes : undefined;
    const hasModes = !!modes && modes.length > 0;
    return handCard(id, def, {
      castCandidates,
      playTerrainCandidate,
      offerXFlow: isActingPlayer && hasX && !hasModes,
      offerModeFlow: isActingPlayer && hasModes,
      onCastDirect: (action) => dispatch(action),
      onStartTargeting: (cands, title) => setUiMode({ kind: "targeting", title, candidates: cands }),
      onStartXFlow: (cardInstanceId) =>
        setUiMode({ kind: "xInput", player: playerId, source: { kind: "spell", cardInstanceId } }),
      onStartModeFlow: (cardInstanceId) =>
        setUiMode({ kind: "modeSelect", player: playerId, source: { kind: "spell", cardInstanceId }, modes: modes! }),
      onPlayTerrain: (action) => dispatch(action),
      tutorialHighlighted: tutorialHandHighlightIds?.includes(def.id),
    });
  });
  return h("div", { class: "hand-zone" }, tiles);
}

/**
 * Verdeckte Darstellung einer fremden Hand (s. handZone oben, Auftrag
 * "Gegner-Hand ist komplett sichtbar"): nur Kartenrückseiten + Gesamtzahl,
 * keine Namen/Kosten/Regeltexte, nichts davon anklickbar.
 */
function hiddenHandZone(hand: readonly InstanceId[]): HTMLElement {
  const tiles = hand.map((id) => handCardHidden(id));
  return h("div", { class: "hand-zone hand-zone-hidden" }, [
    ...tiles,
    h("div", { class: "hand-zone-hidden-count" }, [text(`${hand.length} ${hand.length === 1 ? "Karte" : "Karten"}`)]),
  ]);
}

function battlefieldZone(
  state: GameState,
  pool: ReturnType<typeof getPool>,
  playerId: PlayerId,
  mode: UiMode,
  targetMap: Map<string, PlayerAction>,
): HTMLElement {
  const isActingPlayer = state.priorityPlayer === playerId && !state.pendingDecision;
  const candidates = isActingPlayer ? legalActions(playerId) : [];
  // v0.1.16: geführtes Tutorial richtet sich immer an player1 (s. handZone
  // oben) - Battlefield-Highlight (eigenes Terrain beim `tapForMana`-Schritt,
  // konkrete Permanent-Instanz während der `castBuffSpell`-Bestätigung) daher
  // nur für dessen Bereich berechnen.
  const tutorialHighlight = playerId === "player1" && isTutorialActive() ? getTutorialHighlight() : undefined;

  const tiles = state.players[playerId].battlefield.map((id) => {
    const def = cardDef(pool, state, id);
    const tutorialHighlighted =
      !!tutorialHighlight &&
      ((!!tutorialHighlight.ownUntappedTerrain && def.type === "terrain" && !state.cards[id]?.permanentState?.tapped) ||
        tutorialHighlight.permanentInstanceId === id);

    const key = targetKeyOf({ kind: "permanent", instanceId: id });
    const targetCandidate = targetMap.get(key);
    if (targetCandidate) {
      return cardTile(state, pool, id, { targetable: true, onClick: () => dispatch(targetCandidate), tutorialHighlighted });
    }

    if (mode.kind === "xTarget" && xTargetShapeAllowsPermanent(mode.spec, def)) {
      return cardTile(state, pool, id, {
        targetable: true,
        tutorialHighlighted,
        onClick: () =>
          dispatch(
            buildCastAction(
              mode.source,
              mode.player,
              [{ kind: "permanent", instanceId: id }],
              mode.chosenX,
              mode.chosenMode,
            ),
          ),
      });
    }

    if (mode.kind === "declaringAttackers" && mode.player === playerId && def.type === "unit") {
      const selected = mode.selected.includes(id);
      return cardTile(state, pool, id, {
        targetable: true,
        selected,
        tutorialHighlighted,
        onClick: () => {
          const next = selected ? mode.selected.filter((x) => x !== id) : [...mode.selected, id];
          setUiMode({ ...mode, selected: next });
        },
      });
    }

    if (mode.kind === "declaringBlockers") {
      const isOwnUnblockedUnit =
        mode.player === playerId && def.type === "unit" && !mode.pairs.some((p) => p.blocker === id);
      if (isOwnUnblockedUnit) {
        const selected = mode.selectedBlocker === id;
        return cardTile(state, pool, id, {
          targetable: true,
          selected,
          tutorialHighlighted,
          onClick: () => setUiMode({ ...mode, selectedBlocker: selected ? undefined : id }),
        });
      }
      const isEnemyAttacker =
        playerId === state.activePlayer && state.cards[id]?.permanentState?.combat?.role === "attacker";
      if (isEnemyAttacker && mode.selectedBlocker) {
        return cardTile(state, pool, id, {
          targetable: true,
          tutorialHighlighted,
          onClick: () =>
            setUiMode({
              ...mode,
              pairs: [...mode.pairs.filter((p) => p.blocker !== mode.selectedBlocker), { blocker: mode.selectedBlocker!, attacker: id }],
              selectedBlocker: undefined,
            }),
        });
      }
    }

    // Aktivierte Fähigkeiten (0 oder 1 Zielslot), nur für den aktuell agierenden Spieler.
    // ("abilities" in def schließt SpellCard aus - Spells liegen nie auf dem
    // Battlefield, tragen aber keine "abilities"; reine Typ-Absicherung.)
    const defAbilities = "abilities" in def ? def.abilities : undefined;
    const abilityCandidates = activateAbilityCandidatesFor(candidates, id);
    if (abilityCandidates.length > 0) {
      // Modale Fähigkeit (v0.3, 9.13): getLegalActions liefert hier einen
      // Kandidaten OHNE chosenMode (siehe docs/engine-status.md) - ein Klick
      // darf NICHT direkt dispatchen (die Engine lehnt ohne chosenMode ab),
      // sondern startet erst die Modus-Wahl (Reihenfolge Modus -> X -> Ziele).
      const modalCandidate = abilityCandidates.find((a) => {
        const ability = defAbilities?.[a.abilityIndex];
        return ability?.kind === "activated" && (ability.modes?.length ?? 0) > 0;
      });
      if (modalCandidate) {
        const ability = defAbilities![modalCandidate.abilityIndex] as ActivatedAbility;
        return cardTile(state, pool, id, {
          targetable: true,
          hinted: true,
          tutorialHighlighted,
          onClick: () =>
            setUiMode({
              kind: "modeSelect",
              player: playerId,
              source: { kind: "ability", sourceInstanceId: id, abilityIndex: modalCandidate.abilityIndex },
              modes: ability.modes!,
            }),
        });
      }

      const zeroSlot = abilityCandidates.find((a) => a.chosenTargets.length === 0);
      if (zeroSlot && abilityCandidates.length === 1) {
        return cardTile(state, pool, id, { targetable: true, hinted: true, tutorialHighlighted, onClick: () => dispatch(zeroSlot) });
      }
      return cardTile(state, pool, id, {
        targetable: true,
        hinted: true,
        tutorialHighlighted,
        onClick: () => setUiMode({ kind: "targeting", title: `Ziel für Fähigkeit von „${def.name}“ wählen`, candidates: abilityCandidates }),
      });
    }

    // X-Kosten-Fähigkeiten (v0.3, 9.12): getLegalActions liefert dafür laut
    // Vertrag GAR KEINEN Kandidaten (activateAbilityCandidates überspringt sie
    // explizit, siehe docs/engine-status.md) - exakt das gleiche Muster wie
    // X-Kosten-Spells in der Hand, hier über die Kartendefinition selbst
    // erkannt statt über Kandidaten (bewusst grob wie die X-Ziel-Klickbarkeit,
    // siehe docs/frontend-status.md "Grenzfälle" - applyAction validiert final).
    {
      const xAbilityIndex = (defAbilities ?? []).findIndex(
        (a) => a.kind === "activated" && !!a.manaCost?.x && !a.isManaAbility,
      );
      if (xAbilityIndex >= 0) {
        return cardTile(state, pool, id, {
          targetable: true,
          hinted: true,
          tutorialHighlighted,
          onClick: () =>
            setUiMode({
              kind: "xInput",
              player: playerId,
              source: { kind: "ability", sourceInstanceId: id, abilityIndex: xAbilityIndex },
            }),
        });
      }
    }

    return cardTile(state, pool, id, { tutorialHighlighted });
  });

  return h("div", { class: "battlefield-zone" }, tiles);
}

function graveyardZone(state: GameState, pool: ReturnType<typeof getPool>, playerId: PlayerId): HTMLElement {
  const cards = state.players[playerId].graveyard.map((id) => cardTile(state, pool, id));
  return h("div", { class: "graveyard-zone" }, cards.length ? cards : [h("div", { class: "empty-hint" }, [text("(leer)")])]);
}
