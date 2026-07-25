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

import type { ActivatedAbility, CardType, GameState, InstanceId, PlayerAction, PlayerId } from "../model";
import {
  BOT_SPEED_LABELS,
  backToMainMenu,
  chooseOpponentBot,
  chooseOpponentHotseat,
  closeBotSpeedPanel,
  closeKeywordGlossary,
  closeKeywordGlossaryPanel,
  closeMusicPanel,
  confirmDeck,
  copyDeckFromPlayer1,
  closeTutorialHelp,
  dismissTutorialBubble,
  dismissCombatSummary,
  dispatch,
  getAppPhase,
  getBotDifficulty,
  getBotSpeedPreset,
  getChosenAiDeckArchetype,
  getDecklist,
  getLastCombatSummary,
  getLastError,
  getMusicCurrentTrack,
  getMusicRepeatMode,
  getMusicTracks,
  getOpenKeywordGlossary,
  getPool,
  getRecentActionInstanceIds,
  getState,
  getTutorialActiveStep,
  getTutorialHighlight,
  getTutorialPassPriorityBlockReason,
  getUiMode,
  hasRealPriorityChoice,
  isBotControlled,
  isBotSpeedPanelOpen,
  isKeywordGlossaryPanelOpen,
  isMusicEnabled,
  isMusicPanelOpen,
  isSfxEnabled,
  isTerrainPileExpanded,
  isTutorialActive,
  isTutorialBubbleVisible,
  isTutorialHelpOpen,
  legalActions,
  openDeckBuilderStandalone,
  resetUiMode,
  selectMusicTrack,
  setBotControlled,
  setBotDifficulty,
  setBotSpeedPreset,
  setChosenAiDeckArchetype,
  setDecklist,
  setMusicRepeatMode,
  setUiMode,
  skipTutorialStep,
  startNewGameFlow,
  startTutorial,
  toggleBotSpeedPanel,
  toggleKeywordGlossaryPanel,
  toggleMusicEnabled,
  toggleMusicPanel,
  toggleSfxEnabled,
  toggleTerrainPile,
  toggleTutorialHelp,
} from "./store";
import { BOT_DIFFICULTY_LABELS, BOT_DISPLAY_NAMES } from "../ai";
import { cardDef } from "./cardInfo";
import { tutorialHelpButton, tutorialHelpPanel, tutorialInstructionBanner, tutorialModalBubble } from "./components/tutorialOverlay";
import { keywordGlossaryButton, keywordGlossaryPanel, keywordPopoverBubble } from "./components/keywordGlossaryPanel";
import { decisionSpotlightBanner } from "./components/decisionSpotlight";
import { musicPanel, musicPanelButton } from "./components/musicPanel";
import { botSpeedPanel, botSpeedPanelButton } from "./components/botSpeedPanel";
import { sfxToggleButton } from "./components/sfxToggle";
import { h, text } from "./h";
import { cardTile } from "./components/cardTile";
import { blockLegalityFromActions, combatOverlay } from "./components/combatOverlay";
import { combatSummaryPanel } from "./components/combatSummaryPanel";
import { terrainPile, terrainPileCollapseHandle, type TerrainPileEntry } from "./components/terrainPile";
import { deckBuilderScreen } from "./components/deckBuilder";
import { mainMenuScreen } from "./components/mainMenu";
import { opponentSelectScreen } from "./components/opponentSelect";
import { buildDemoDeck } from "./deck";
import { resolveAiDeck } from "./aiDecks";
import { handCard, handCardDiscardToggle, handCardHidden } from "./components/handCard";
import { playerPanel } from "./components/playerPanel";
import { botAvatarImg, humanAvatarPlaceholder } from "./components/sceneArt";
import { turnFlowPanel } from "./components/turnFlowPanel";
import { stackPanel } from "./components/stackPanel";
import {
  attackersPanel,
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
// Sichtbare Übergänge statt Hard-Cut: `render()` baut das DOM weiterhin
// komplett neu auf (s. Dateikommentar oben, unverändert). Frühere Version
// packte diesen Rebuild zusätzlich in `document.startViewTransition()`, um
// Bot-Züge statt eines harten Schnitts sichtbar zu machen - das wurde per
// Nutzer-Feedback wieder entfernt (s. `render()`-Kommentar unten: flackerte
// bei jedem Zwischenschritt, nicht nur bei echten Kartenbewegungen). Einzelne
// Karten-Kacheln tragen weiterhin ein `view-transition-name` (s. cardTile.ts/
// handCard.ts, Schema `card-<instanceId>`) - das ist ohne eine laufende View
// Transition ein wirkungsloses, aber harmloses Attribut.
// ---------------------------------------------------------------------------

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
/**
 * Darf für diesen Spieler überhaupt ein erzwungener Eingabe-Modus geöffnet
 * werden? Nur, wenn er NICHT bot-gesteuert ist.
 *
 * Nutzer-Feedback 2026-07-24/25 ("macht keinen Sinn, dass der Mensch für den
 * Bot passen darf") - dieselbe Regel gilt für die erzwungenen Combat-/Cleanup-
 * Schritte: die Engine vergibt dort keine Priority, sondern wartet auf eine
 * bestimmte Aktion, und `autoEnterForcedModes` hat dafür bisher IMMER die
 * passende Eingabe-UI aufgebaut - auch dann, wenn der Spieler, der handeln
 * muss, ein Bot ist. Der Mensch bekam damit:
 *
 * - die Angreifer-Deklaration des Bots inklusive "Keine Angreifer" (ein Klick
 *   darauf nimmt dem Bot seinen kompletten Angriff),
 * - die Blocker-Zuordnung des Bots (er hätte dessen Verteidigung bestimmt),
 * - den Cleanup-Abwurf des Bots - und weil der Abwurf-Modus die Handzone
 *   bewusst von der Verdeckungs-Regel ausnimmt (s. handZone), lag dabei die
 *   ganze Bot-Hand offen.
 *
 * Der Bot erledigt all das selbst (s. store.ts#actingPlayer/runBotStep); ein
 * menschlicher Ersatz war nie nötig.
 */
function forcedModeBelongsToHuman(player: PlayerId): boolean {
  return !isBotControlled(player);
}

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
      // ... und NIE für einen bot-gesteuerten Spieler (s.
      // forcedModeBelongsToHuman): sonst erklärt der Mensch den Angriff des
      // Bots - inklusive "Keine Angreifer", was dem Bot seinen Angriff
      // komplett nimmt.
      if (forcedModeBelongsToHuman(state.activePlayer) && hasRealDeclareAttackersChoice(state)) {
        setUiMode({ kind: "declaringAttackers", player: state.activePlayer, selected: [] });
      }
    }
    return;
  }
  if (state.step === "declareBlockers" && state.priorityPlayer === undefined) {
    if (mode.kind !== "declaringBlockers") {
      // s. Kommentar bei declareAttackers oben - analog für "Keine Blocker".
      const defender = otherOf(state.activePlayer);
      if (forcedModeBelongsToHuman(defender) && hasRealDeclareBlockersChoice(state)) {
        setUiMode({ kind: "declaringBlockers", player: defender, pairs: [] });
      }
    }
    return;
  }
  if (
    state.step === "cleanup" &&
    state.priorityPlayer === undefined &&
    // Auch hier nie für einen Bot (s. forcedModeBelongsToHuman): der
    // Abwurf-Modus nimmt die Handzone bewusst von der Verdeckungs-Regel aus
    // (s. handZone), damit man SEINE EIGENEN Karten auswählen kann - für einen
    // bot-gesteuerten Spieler würde damit dessen komplette Hand aufgedeckt.
    forcedModeBelongsToHuman(state.activePlayer) &&
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
  if (phase.kind !== "playing") {
    // Partie verlassen/noch nicht gestartet - nächste Partie soll ohne
    // "Pulsen" gegen die Lebenswerte der vorherigen Partie starten (s.o.).
    lifePulseTracking = {};
  }
  // Nutzer-Feedback: das Einpacken JEDES Rebuilds in `document.startViewTransition()`
  // (s. Kommentarblock oben) blendete bei JEDEM Render - auch reinen Zwischen-
  // schritten wie einem Priority-Wechsel ohne sichtbare Aktion - die komplette
  // Seite kurz über (jedes Element ohne eigenes `view-transition-name`, z.B.
  // der Avatar, fällt in die Standard-Root-Transition). Bei den vielen Renders
  // innerhalb eines automatischen Bot-Zugs wirkte das wie Flackern/Stroboskop
  // statt der beabsichtigten sanften Karten-Übergänge - daher komplett
  // deaktiviert, kein Hard-Cut-vs-Transition-Unterschied mehr.
  renderRoot(root);
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
        // Deck-Wahl für den KI-Gegner: dieselbe Store-Einstellung, die auch der
        // (im regulären Ablauf übersprungene) player2-Deckbau-Screen setzt -
        // ausgewertet beim Partiestart über `resolveAiDeck`, s. onConfirm unten.
        chosenAiDeckArchetype: getChosenAiDeckArchetype("player2"),
        onChangeAiDeckArchetype: (next) => setChosenAiDeckArchetype("player2", next),
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
    // Zusätzliche, klar benannte Alternative zu "Zufällig füllen": lädt eines
    // der 7 kuratierten AI_DECKS-Decks (Name + Beschreibung sichtbar im
    // Deckbau-Screen, s. components/deckBuilder.ts#archetypeSelect) direkt
    // als eigene Deckliste - anders als `pickRandomAiDeck()` weiter unten
    // (nur für die Bot-Befüllung, Name bleibt dort bewusst verborgen).
    onLoadArchetypeDeck: (archetypeDecklist) => setDecklist(player, archetypeDecklist),
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
      // "kuratiertes Archetyp-Deck ziehen + markieren + sofort bestätigen"-
      // Vorgehen wie beim bisherigen "Zufälliges KI-Deck + weiter"-Kurzstart
      // (s. onAiQuickstart unten), nur direkt im Anschluss an player1s eigene
      // Bestätigung statt über einen eigenen Button auf dem player2-Screen.
      // Seit dem Wechsel auf `pickRandomAiDeck` (s. aiDecks.ts) zieht die KI
      // ein thematisch stimmiges, 1-3-farbiges Deck statt der alten
      // 5-Farben-Zufallsmischung aus `buildDemoDeck` - welcher Archetyp es
      // ist, wird dem menschlichen Spieler bewusst nirgends angezeigt, ES SEI
      // DENN er hat selbst gezielt einen Namen ausgewählt (s.
      // `resolveAiDeck`/store.ts#getChosenAiDeckArchetype, Auftrag "welches
      // Deck spielt die KI", 2026-07-21).
      if (player === "player1" && isBotControlled("player2")) {
        const aiDeck = resolveAiDeck(getChosenAiDeckArchetype("player2"));
        setDecklist("player2", aiDeck);
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
    // Auftrag "welches Deck spielt die KI" (2026-07-21): welchen AI_DECKS-
    // Archetyp der Bot-Gegner ziehen soll (`undefined` = "Zufällig", s.
    // store.ts#getChosenAiDeckArchetype) - reicht nur durch, keine eigene
    // Logik (s. aiDecks.ts#resolveAiDeck für die eigentliche Auflösung).
    chosenAiDeckArchetype: getChosenAiDeckArchetype(player),
    onChangeAiDeckArchetype: (next) => setChosenAiDeckArchetype(player, next),
    onAiQuickstart: () => {
      // s. Kommentar bei onConfirm oben: zieht seit `pickRandomAiDeck` (statt
      // `buildDemoDeck`) ein kuratiertes, thematisches Archetyp-Deck aus
      // aiDecks.ts statt einer reinen 5-Farben-Zufallsmischung. Der
      // Archetyp-Name bleibt bewusst verborgen - ES SEI DENN der Mensch hat
      // selbst gezielt einen Namen ausgewählt (s. `resolveAiDeck` oben).
      const aiDeck = resolveAiDeck(getChosenAiDeckArchetype(player));
      setBotControlled(player, true);
      setDecklist(player, aiDeck);
      if (validateDecklist(pool, aiDeck).valid) {
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
    // Kurzer Kampfbericht (Nutzer-Feedback 2026-07-25) - nicht-modal, bleibt
    // bis zum Wegklicken bzw. bis zum nächsten Kampf stehen, s.
    // components/combatSummaryPanel.ts.
    (() => {
      const summary = getLastCombatSummary();
      if (!summary) return undefined;
      return combatSummaryPanel(summary, {
        nameOf: (player) => playerDisplayName(player),
        onDismiss: () => dismissCombatSummary(),
      });
    })(),
    state.winner !== undefined ? gameOverBanner(state) : undefined,
    // Auftrag "Stack soll zwischen die Battlefields statt nach unten": der
    // `stackPanel(...)`-Aufruf sitzt jetzt INNERHALB von `boardSection` (als
    // drittes `.board`-Kind zwischen den beiden `playerArea`-Boxen) statt
    // hier gesondert unter dem gesamten Board zu stehen - hier NICHT mehr
    // aufrufen, sonst erscheint der Stack doppelt.
    boardSection(state, pool, mode),
    // Blocker-Zuordnung als eigene, fokussierte Ansicht über dem Board
    // (Spielerbericht 2026-07-24, s. combatFocusOverlay unten) - NACH
    // boardSection, damit sie darüber liegt.
    combatFocusOverlay(state, pool, mode),
    tutorialActive && isTutorialHelpOpen() ? tutorialHelpPanel(() => closeTutorialHelp()) : undefined,
    // Auftrag Punkt 3: das globale Keyword-Nachschlagewerk ist in JEDER
    // Partie erreichbar (nicht nur im Tutorial-Modus, anders als
    // tutorialHelpPanel oben) - eigener Zustand in store.ts.
    isKeywordGlossaryPanelOpen() ? keywordGlossaryPanel(() => closeKeywordGlossaryPanel()) : undefined,
    // App-weite Hintergrundmusik (s. musicPlayer.ts): Titelauswahl +
    // Wiederholungsmodus, analog zum Keyword-Nachschlagewerk oben jederzeit
    // erreichbar, unabhängig vom Tutorial-Modus.
    isMusicPanelOpen() ? musicPanel(musicPanelOptions()) : undefined,
    // Bot-Zuggeschwindigkeit (Nutzer-Feedback: "spielzüge des computers sind
    // zu schnell ... ein mensch hat kaum chancen, das zu sehen") - analog zum
    // Musik-Panel oben jederzeit erreichbar (auch während einer laufenden
    // Partie), unabhängig vom Tutorial-Modus, s. store.ts#setBotSpeedPreset.
    isBotSpeedPanelOpen()
      ? botSpeedPanel({
          current: getBotSpeedPreset(),
          labels: BOT_SPEED_LABELS,
          onSelect: (preset) => setBotSpeedPreset(preset),
          onClose: () => closeBotSpeedPanel(),
        })
      : undefined,
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
  // Sichtbar/aktiv, wenn priorityPlayer gesetzt ist und keine PendingDecision
  // aussteht (Combat-/Cleanup-Zwangsschritte haben ohnehin priorityPlayer ===
  // undefined, siehe turn.ts) - aber NIE, wenn die Priorität gerade bei einem
  // bot-gesteuerten Spieler liegt.
  //
  // Nutzer-Feedback 2026-07-24 ("macht keinen Sinn, dass der Mensch für den Bot
  // passen darf"): der Button hieß dann "Priorität passen (Ollo Wackelhand)"
  // und passte tatsächlich FÜR den Bot. Wer ihn im Bot-Zug wiederholt drückte,
  // nahm dem Bot seinen kompletten Zug weg (er kam nie dazu, ein Terrain zu
  // legen oder etwas zu casten) - von außen sah das wie ein kaputter Bot aus,
  // der einfach nichts tut. Der Bot passt selbst, wenn er nichts tun will
  // (s. store.ts#runBotStep); ein menschlicher Ersatz dafür ist nie nötig.
  //
  // Gleiche Bedingung wie beim Entscheidungs-Spotlight (s.
  // decisionSpotlightPlayer oben), das bot-gesteuerte Spieler schon immer
  // ausgenommen hat - die Statusleiste war die letzte Stelle, an der die
  // Priorität eines Bots noch bedienbar war.
  const canPass =
    state.priorityPlayer !== undefined && !state.pendingDecision && !isBotControlled(state.priorityPlayer);
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

  // Die früheren reinen Info-Texte ("Zug X · Step: Y", "Aktiver Spieler:
  // ...", "Priority: ...") sind NICHT mehr Teil dieser Leiste (Auftrag "Zug-/
  // Step-Info soll rechts neben dem Spielfeld als klar lesbarer Flow
  // erscheinen") - sie stecken jetzt in `turnFlowColumn()`/`turnFlowPanel.ts`,
  // gerendert unter dem Avatar in der rechten Board-Spalte (s.
  // boardSection unten). `.status-bar` bleibt als reine Aktions-/
  // Utility-Leiste bestehen (Priorität passen, Tutorial-Hilfe,
  // Keyword-Glossar, Musik, SFX, Zurück zum Hauptmenü).
  return h("div", { class: "status-bar" }, [
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
    // Bot-Zuggeschwindigkeit (s. store.ts#setBotSpeedPreset-Dateikommentar):
    // MUSS während einer laufenden Partie erreichbar sein, nicht nur im
    // Deckbau-Screen - analog zum Musik-Button jederzeit sichtbar.
    botSpeedPanelButton(() => toggleBotSpeedPanel()),
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
    // Der "Angreifen"-Button selbst sitzt in der rechten Board-Spalte
    // (s. attackCallToAction) - hier bleibt nur Erklärung + "Keine Angreifer".
    return [
      attackersPanel(mode.selected.length, () =>
        dispatch({ kind: "declareAttackers", player: mode.player, attackers: [] }),
      ),
    ];
  }
  // mode.kind === "declaringBlockers" hat hier bewusst kein Banner mehr: die
  // Blocker-Zuordnung ist seit dem Spielerbericht 2026-07-24 eine eigene,
  // fokussierte Ansicht über dem Board (s. combatFocusOverlay), die
  // Erklärung, Zuordnung und Bestätigen an einem Ort zusammenführt.
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
    highlightedInstanceIds: getRecentActionInstanceIds(),
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
    //
    // Auftrag "Stack soll zwischen die Battlefields statt nach unten": der
    // Stack ist gemeinsamer Spielzustand (Warteschlange für Zaubersprüche/
    // Fähigkeiten, die noch auflösen müssen - gehört keinem der beiden
    // Spieler allein), darum sitzt `stackPanel(...)` hier bewusst als
    // DRITTES Kind zwischen den beiden `playerArea`-Aufrufen: player1s
    // Battlefield endet am Ende seiner Box, player2s Battlefield beginnt am
    // Anfang seiner Box (s. Kommentar in style.css bei `.board`) - genau an
    // dieser Nahtstelle (schon vorher die geringste Lücke im Board) landet
    // jetzt der Stack, statt wie zuvor gesondert unter dem gesamten
    // `board-row`-Block zu stehen.
    [
      playerArea(state, pool, "player1", mode, targetMap),
      stackPanel(state, pool, stackPanelOptions(state, mode)),
      playerArea(state, pool, "player2", mode, targetMap),
    ],
  );

  // Rechte Board-Spalte: TRÄGT jetzt den Zug-Flow (Auftrag "Zug-/Step-Info
  // rechts neben dem Spielfeld, unter dem Avatar") - anders als die frühere
  // rein dekorative `opponentAvatarColumn` (nur sichtbar, wenn player2
  // bot-gesteuert war) wird sie darum jetzt IMMER gerendert, auch im reinen
  // Hotseat (beide Spieler Mensch). `.board-row` degradiert entsprechend nie
  // mehr zu einer einspaltigen Ansicht (s. auch die angepasste Media Query
  // in style.css für schmale Fenster - die Spalte wird dort nicht mehr
  // komplett ausgeblendet, weil sie jetzt funktional statt rein kosmetisch
  // ist, sondern unter das Spielfeld gestapelt).
  const turnFlow = turnFlowColumn(state, mode);

  return h("div", { class: "board-row" }, [board, turnFlow]);
}

/**
 * Rechte Board-Spalte: großformatiges Charakterporträt des GERADE AKTIVEN
 * Spielers (Auftrag "Avatar soll den handelnden Spieler zeigen, Mensch vs.
 * KI, statt immer nur das statische KI-Porträt") direkt über dem Zug-Flow
 * (s. turnFlowPanel.ts). `state.activePlayer` ("wer ist dran") entscheidet
 * das Bild, bewusst NICHT `state.priorityPlayer` ("wer muss gerade
 * reagieren") - beide können während eines Zuges auseinanderfallen (z.B.
 * Instant-Antworten des nicht-aktiven Spielers), aber "wer handelt gerade"
 * im Sinne dieses Auftrags ist der aktive Spieler des laufenden Zuges.
 *
 * - aktiver Spieler bot-gesteuert -> bestehendes großformatiges Porträt
 *   (sceneArt.ts#botAvatarImg), Bild-Lade-/Fallback-Verhalten unverändert
 *   (fehlt die Datei, entfernt sich nur das <img>, die Box bleibt mit
 *   CSS-Fallback-Rahmen stehen, kein Layoutbruch, s. `.board-active-avatar`
 *   in style.css).
 * - aktiver Spieler menschlich -> CSS-only-Platzhalter (s.
 *   sceneArt.ts#humanAvatarPlaceholder-Dateikommentar: es gibt aktuell kein
 *   Bild-Asset für menschliche Spieler, bewusst nur ein Platzhalter für
 *   später). Im reinen Hotseat wechselt dieser Platzhalter entsprechend
 *   zwischen "player1"/"player2" (bzw. deren Anzeigename).
 */
function turnFlowColumn(state: GameState, mode: UiMode): HTMLElement {
  const activePlayer = state.activePlayer;
  const avatarNode = isBotControlled(activePlayer)
    ? botAvatarImg(getBotDifficulty(activePlayer))
    : humanAvatarPlaceholder(playerDisplayName(activePlayer));
  const priorityPlayer = state.priorityPlayer;
  return h("div", { class: "board-turn-flow-column" }, [
    h("div", { class: "board-active-avatar" }, [avatarNode]),
    turnFlowPanel({
      turnNumber: state.turnNumber,
      step: state.step,
      activePlayerLabel: playerDisplayName(activePlayer),
      // Identische Formatierung/Logik wie zuvor in statusBar() (nur
      // dorthin verschoben, s. dortiger Kommentar).
      priorityLabel: priorityPlayer
        ? `Priority: ${playerDisplayName(priorityPlayer)}`
        : "Priority: (Engine verarbeitet Turn-Based Action)",
    }),
    attackCallToAction(mode),
  ]);
}

/**
 * Großer, roter "ANGREIFEN"-Button unter der Phasenanzeige in der rechten
 * Board-Spalte - nur während der eigenen Angreifer-Deklaration sichtbar.
 *
 * Spielerbericht 2026-07-24: "kann man den Angriff etwas 'aufregender'
 * machen? Statt diesem winzigen Button oben ein großer roter ANGRIFF-Button
 * rechts unter der Phasenanzeige". Der Moment, in dem man seine Armee losschickt,
 * ist der dramatischste des Zuges und verdient mehr Gewicht als eine Zeile im
 * Instruktions-Banner.
 *
 * Ohne ausgewählte Einheit ist der Button GESPERRT statt versteckt: die
 * Deklaration ist ein Pflicht-Schritt, der Spieler soll sehen, worauf er
 * zusteuert. Den Kampf ganz auslassen geht bewusst weiterhin nur über das
 * klar benannte "Keine Angreifer" im Banner - ein leerer Angriff soll kein
 * versehentlicher Klick auf den auffälligsten Button des Bildschirms sein.
 */
function attackCallToAction(mode: UiMode): HTMLElement | undefined {
  if (mode.kind !== "declaringAttackers") return undefined;
  const count = mode.selected.length;
  return h("div", { class: "attack-cta" }, [
    h(
      "button",
      {
        class: "btn attack-confirm-btn",
        disabled: count === 0,
        title:
          count === 0
            ? "Zuerst mindestens eine eigene Einheit anklicken."
            : `${count} Einheit(en) in den Kampf schicken.`,
        onclick: () => {
          if (count === 0) return;
          dispatch({ kind: "declareAttackers", player: mode.player, attackers: mode.selected });
        },
      },
      [
        h("span", { class: "attack-confirm-label" }, [text("ANGREIFEN")]),
        h("span", { class: "attack-confirm-count" }, [
          text(count === 0 ? "keine Einheit gewählt" : `${count} ${count === 1 ? "Einheit" : "Einheiten"}`),
        ]),
      ],
    ),
  ]);
}

/**
 * Fokussierte Blocker-Zuordnung über dem Board (Spielerbericht 2026-07-24:
 * "die Blocker zu bestimmen ist richtig schwer ... die angreifende Schar in
 * einem hervorgehobenen Fenster, der Rest leicht ausgeblendet, und die
 * Verteidiger wirklich in Position ziehen"), s. components/combatOverlay.ts.
 *
 * Diese Funktion sammelt nur zusammen, was die Ansicht braucht - alle
 * Legalitätsangaben kommen fertig aus getLegalActions, nichts davon wird hier
 * abgeleitet:
 *
 * - `legalAttackersByBlocker`: aus den `declareBlockers`-Einzelpaar-Kandidaten.
 *   Die Engine enumeriert diese Paare NUR, solange höchstens eine
 *   guardian-Blockpflicht besteht (legal-actions.ts#combatCandidates) - für
 *   einen Verteidiger, der dort auftaucht, ist die Liste seiner erlaubten
 *   Angreifer aber vollständig, und nur dann sperrt die Ansicht überhaupt
 *   etwas.
 * - `noBlocksOffered`: die Engine bietet `blocks: []` exakt dann an, wenn KEINE
 *   guardian-Pflicht besteht - dasselbe Signal sagt der Ansicht also
 *   gleichzeitig, ob "Keine Blocker" ein legaler Ausweg ist und ob die
 *   Paar-Enumeration oben als vollständig gelten darf.
 */
function combatFocusOverlay(
  state: GameState,
  pool: ReturnType<typeof getPool>,
  mode: UiMode,
): HTMLElement | undefined {
  if (mode.kind !== "declaringBlockers") return undefined;

  const attackers = state.players[state.activePlayer].battlefield.filter(
    (id) => state.cards[id]?.permanentState?.combat?.role === "attacker",
  );
  const defenders = state.players[mode.player].battlefield.filter(
    (id) => cardDef(pool, state, id).type === "unit",
  );

  const legality = blockLegalityFromActions(legalActions(mode.player));

  return combatOverlay(state, pool, {
    attackers,
    defenders,
    pairs: mode.pairs,
    selectedBlocker: mode.selectedBlocker,
    legalAttackersByBlocker: legality.legalAttackersByBlocker,
    noBlocksOffered: legality.noBlocksOffered,
    onSelectBlocker: (blocker) => setUiMode({ ...mode, selectedBlocker: blocker }),
    onAssign: (blocker, attacker) =>
      setUiMode({
        ...mode,
        // Ein Verteidiger blockt genau einen Angreifer - eine erneute Zuordnung
        // verschiebt ihn, statt ein zweites Paar anzulegen (wie bisher).
        pairs: [...mode.pairs.filter((p) => p.blocker !== blocker), { blocker, attacker }],
        selectedBlocker: undefined,
      }),
    onRemove: (blocker) => setUiMode({ ...mode, pairs: mode.pairs.filter((p) => p.blocker !== blocker) }),
    onConfirm: () => dispatch({ kind: "declareBlockers", player: mode.player, blocks: mode.pairs }),
    onNone: () => dispatch({ kind: "declareBlockers", player: mode.player, blocks: [] }),
  });
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

  // Auftrag "Battlefields sollen aneinander stoßen" (Nutzer-Feedback): die
  // beiden `.player-area`-Boxen liegen als direkte `.board`-Geschwister
  // übereinander (s. boardSection - player1 oben, player2 unten,
  // PLAYER_IDS-Reihenfolge bewusst unangetastet). Damit an genau dieser
  // Nahtstelle nichts Unwichtiges mehr zwischen den beiden Battlefields
  // liegt, wird NUR die interne Kindreihenfolge je Spieler gespiegelt:
  // - player1 (oben): Panel -> Hand -> Battlefield (Battlefield sitzt damit
  //   ganz unten in player1s Box, direkt vor der Nahtstelle zu player2).
  // - player2 (unten): Battlefield -> Panel -> Hand (Battlefield sitzt damit
  //   ganz oben in player2s Box, direkt hinter der Nahtstelle). Die Hand
  //   von player2 (zeigt wegen handCard.ts#handCardHidden ohnehin nur
  //   verdeckte Kartenrücken, s. Auftrag) wandert dadurch ganz ans untere
  //   Ende der Seite - die am wenigsten prominente Position, wie gefordert.
  // Der Graveyard beider Spieler bleibt bewusst an den jeweiligen äußeren
  // Rand gebunden (player1 ganz oben vor dem Panel, player2 ganz unten nach
  // der Hand), damit er nie zwischen den beiden Battlefields landen kann.
  const panelNode = playerPanel(state, playerId, {
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
      // s. boardSection#turnFlowColumn.
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
  });

  const handNode = h("div", { class: "player-zone-block" }, [h("div", { class: "zone-label" }, [text("Hand")]), handZone(state, pool, playerId, mode)]);
  const battlefieldNode = h("div", { class: "player-zone-block" }, [
    h("div", { class: "zone-label" }, [text("Battlefield")]),
    battlefieldZone(state, pool, playerId, mode, targetMap),
  ]);
  const graveyardNode = h("div", { class: "player-zone-block player-zone-block-graveyard" }, [
    h("div", { class: "zone-label" }, [text("Graveyard")]),
    graveyardZone(state, pool, playerId),
  ]);

  const children =
    playerId === "player1"
      ? [graveyardNode, panelNode, handNode, battlefieldNode]
      : [battlefieldNode, panelNode, handNode, graveyardNode];

  // "player-area-touch-bottom"/"-top": player1s Box endet jetzt mit ihrem
  // Battlefield, player2s Box beginnt mit ihrem Battlefield (s.o.) - diese
  // Zusatzklassen verkleinern gezielt NUR das Innenpolster + die
  // Eckenrundung an genau dieser gemeinsamen Nahtstelle (style.css), damit
  // die beiden Battlefields optisch "aneinander stoßen" statt durch das
  // normale Panel-Innenpolster getrennt zu wirken - ohne die beiden Boxen zu
  // einer einzigen verschmelzen zu müssen (`.player-area-deciding` bleibt
  // dadurch unverändert funktionsfähig, s. Auftrag).
  const touchClass = playerId === "player1" ? " player-area-touch-bottom" : " player-area-touch-top";
  const areaClass = (isDeciding ? "player-area player-area-deciding" : "player-area") + touchClass;

  return h("div", { class: areaClass }, children);
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

/**
 * Nutzer-Auftrag ("battlefield sollte sortiert sein ... terrain nebeneinander
 * und nach art sortiert"): feste Gruppierungsreihenfolge für die
 * Battlefield-Anzeige. Innerhalb einer Gruppe bleibt die ursprüngliche
 * Reihenfolge des `battlefield`-Arrays (Einfüge-/Spielreihenfolge) erhalten
 * - `Array.prototype.sort` ist seit ES2019 spezifiziert stabil, ein simples
 * Sortieren nach Rang allein reicht daher für eine stabile Gruppierung, ohne
 * zusätzliches Sekundärkriterium. "spell" liegt nie auf dem Battlefield,
 * ist hier nur der Vollständigkeit halber (erschöpfende CardType-Union)
 * mitgeführt. Auren tauchen hier nie auf - sie werden separat behandelt,
 * s. battlefieldZone unten.
 */
const BATTLEFIELD_TYPE_ORDER: Record<CardType, number> = {
  terrain: 0,
  unit: 1,
  relic: 2,
  enchantment: 3,
  spell: 4,
};

/**
 * Ab wie vielen Terrains wird die Terrain-Gruppe zum eingeklappten Stapel
 * (Spielerbericht 2026-07-24: "Terrain werden schnell zu viele und nehmen viel
 * Platz weg", s. components/terrainPile.ts)?
 *
 * Bewusst NICHT ab dem ersten Terrain: das Einklappen kostet einen zusätzlichen
 * Klick, bevor man tappen kann. Bis einschließlich drei Terrains ist die Reihe
 * ungefähr so breit wie die Stapel-Kachel plus die Einheiten daneben - da
 * gewinnt man nichts und zahlt den Klick umsonst. Ab dem vierten Terrain
 * (typischerweise Zug 4-5, ab dann wächst die Reihe jede Runde weiter) beginnt
 * die Reihe, die Einheiten zu verdrängen - genau der Punkt aus dem Bericht.
 */
const TERRAIN_PILE_MIN = 4;

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

  // Baut die eigentliche Kachel für EINE Battlefield-Instanz (Terrain,
  // Einheit, Relikt, freistehende Verzauberung, oder auch eine Aura - Auren
  // durchlaufen exakt dieselbe Ziel-/Klick-Interaktionslogik wie jedes andere
  // Permanent, s. Auftrag "Ziel-/Klick-Interaktions-Logik ... muss ...
  // weiterhin korrekt funktionieren"; nur ihre Platzierung im DOM
  // unterscheidet sich, s. u.
  const buildTile = (id: InstanceId): HTMLElement => {
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

    // Hinweis: Die Blocker-Zuordnung hat hier bewusst KEINEN Zweig mehr.
    // Sie läuft seit dem Spielerbericht 2026-07-24 vollständig über die
    // fokussierte Kampf-Ansicht (s. combatFocusOverlay/components/
    // combatOverlay.ts), die das Board währenddessen überlagert - ein
    // zusätzlicher Klickpfad auf den verdeckten Battlefield-Kacheln wäre
    // unerreichbar und würde nur den Eindruck erwecken, es gäbe ihn noch.

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
  };

  // Zuordnung InstanceId -> tatsächlich gerendertes Kachel-Element, für den
  // Action-Glow-Abgleich unten (ID- statt indexbasiert, s. Kommentar dort)
  // UND für die Aura-Mini-Kacheln (s. u.), die NICHT an derselben Position
  // wie ihre eigene battlefield-Array-Position landen.
  const tileById = new Map<InstanceId, HTMLElement>();

  const rawIds = state.players[playerId].battlefield;

  // Auren, die tatsächlich an einem Ziel angelegt sind, erscheinen NICHT als
  // eigene Kachel in der Typ-Gruppen-Reihenfolge (Nutzer-Auftrag "eine
  // Verzauberung AUF einer Kreatur muss leicht darüber liegen") - stattdessen
  // unten als überlappende Mini-Kachel direkt bei ihrem `attachedTo`-Ziel.
  // Eine Aura ohne (noch) gesetztes attachedTo (z.B. sehr kurzzeitig während
  // der Resolution) fällt zurück in die normale Gruppierung, damit sie nicht
  // spurlos verschwindet.
  const auraIds = new Set<InstanceId>();
  for (const id of rawIds) {
    const def = cardDef(pool, state, id);
    if (def.type === "enchantment" && def.enchantKind === "aura" && state.cards[id]?.permanentState?.attachedTo) {
      auraIds.add(id);
    }
  }

  // Nutzer-Auftrag ("terrain nebeneinander und nach art sortiert"): stabile
  // Gruppierung nach BATTLEFIELD_TYPE_ORDER, s. dort.
  const sortedIds = rawIds
    .filter((id) => !auraIds.has(id))
    .sort((a, b) => BATTLEFIELD_TYPE_ORDER[cardDef(pool, state, a).type] - BATTLEFIELD_TYPE_ORDER[cardDef(pool, state, b).type]);

  const buildSlot = (id: InstanceId): HTMLElement => {
    const tile = buildTile(id);
    tileById.set(id, tile);

    const attachedAuraIds = (state.cards[id]?.permanentState?.attachments ?? []).filter((auraId) => auraIds.has(auraId));
    if (attachedAuraIds.length === 0) return tile;

    // Mini-Kachel(n) für angelegte Auren: volle cardTile()-Optik/-Interaktion
    // wiederverwendet (buildTile durchläuft dieselbe Ziel-/Klick-Logik wie
    // jedes andere Permanent), nur per CSS verkleinert + absolut über der
    // Zielkachel positioniert (s. style.css .battlefield-aura-badge).
    const badges = attachedAuraIds.map((auraId, i) => {
      const auraTile = buildTile(auraId);
      tileById.set(auraId, auraTile);
      return h("div", { class: "battlefield-aura-badge", style: `left: ${6 + i * 22}px` }, [auraTile]);
    });
    return h("div", { class: "battlefield-slot battlefield-slot-has-aura" }, [tile, ...badges]);
  };

  // ---------------------------------------------------------------------
  // Terrain-Stapel (Spielerbericht 2026-07-24, s. TERRAIN_PILE_MIN und
  // components/terrainPile.ts): die Terrain-Gruppe liegt dank
  // BATTLEFIELD_TYPE_ORDER ohnehin schon zusammenhängend am Anfang der Reihe
  // und ist damit ohne Umsortieren als Block einklappbar.
  // ---------------------------------------------------------------------

  // Ein Terrain, an dem eine Aura hängt, bleibt IMMER einzeln sichtbar: seine
  // Aura-Mini-Kachel ist absolut über genau dieser Kachel positioniert (s.
  // buildSlot) und würde beim Einklappen ersatzlos verschwinden. Außerdem ist
  // ein verzaubertes Terrain gerade das eine, das man nicht wegräumen will.
  const pileableTerrainIds = sortedIds.filter(
    (id) =>
      cardDef(pool, state, id).type === "terrain" &&
      (state.cards[id]?.permanentState?.attachments ?? []).filter((auraId) => auraIds.has(auraId)).length === 0,
  );

  // Situatives Zwangs-Aufklappen: ein eingeklapptes Terrain ist nicht
  // anklickbar. Solange ein Terrain gerade WIRKLICH einzeln angeklickt werden
  // MUSS, darf der Stapel deshalb nicht zu sein - sonst wäre eine
  // PendingDecision-Zielwahl auf ein Terrain unerreichbar (echte Sackgasse,
  // das Spiel käme nicht weiter) bzw. der Tutorial-Schritt "eigenes Terrain
  // antippen" nicht ausführbar.
  //
  // Die normale Mana-Fähigkeit zählt hier bewusst NICHT als "muss": sie ist nie
  // erzwungen, und genau für sie ist das Aufklappen per Klick gedacht - würde
  // sie den Stapel automatisch öffnen, wäre er in jeder eigenen Hauptphase
  // offen und das Entrümpeln fände nie statt.
  const terrainNeedsDirectAccess = (id: InstanceId): boolean => {
    if (targetMap.has(targetKeyOf({ kind: "permanent", instanceId: id }))) return true;
    if (mode.kind === "xTarget" && xTargetShapeAllowsPermanent(mode.spec, cardDef(pool, state, id))) return true;
    if (tutorialHighlight?.permanentInstanceId === id) return true;
    if (tutorialHighlight?.ownUntappedTerrain && !state.cards[id]?.permanentState?.tapped) return true;
    return false;
  };

  const pileIds = new Set(pileableTerrainIds);
  const collapsed =
    pileableTerrainIds.length >= TERRAIN_PILE_MIN &&
    !isTerrainPileExpanded(playerId) &&
    !pileableTerrainIds.some(terrainNeedsDirectAccess);

  // Die Stapel-/Einklapp-Kachel steht an der Stelle der ERSTEN Terrain-Kachel,
  // damit die Terrain-Gruppe optisch dort bleibt, wo sie vorher war.
  const showPileHandle = pileableTerrainIds.length >= TERRAIN_PILE_MIN;
  let pileNode: HTMLElement | undefined;
  let pileHandlePlaced = false;

  const slots: HTMLElement[] = [];
  for (const id of sortedIds) {
    const inPile = pileIds.has(id);
    if (inPile && showPileHandle && !pileHandlePlaced) {
      pileHandlePlaced = true;
      if (collapsed) {
        const entries: TerrainPileEntry[] = pileableTerrainIds.map((terrainId) => ({
          instanceId: terrainId,
          def: cardDef(pool, state, terrainId),
          tapped: !!state.cards[terrainId]?.permanentState?.tapped,
        }));
        pileNode = terrainPile(entries, { onToggle: () => toggleTerrainPile(playerId), own: playerId === "player1" });
        slots.push(pileNode);
      } else {
        slots.push(terrainPileCollapseHandle(pileableTerrainIds.length, () => toggleTerrainPile(playerId)));
      }
    }
    if (inPile && collapsed) continue;
    slots.push(buildSlot(id));
  }

  // Nutzer-Auftrag ("Nachvollziehbarkeit von KI-Spielzügen ... visuell, eine
  // Karte wird gelegt, es wird getappt"): die zuletzt betroffene(n) Karte(n)
  // (s. store.ts#getRecentActionInstanceIds) kurz optisch hervorheben -
  // bewusst NACHTRÄGLICH per classList statt als weiterer cardTile()-Option
  // an jeder der ~8 Rückgabestellen in buildTile (jede davon müsste sonst
  // einzeln gepflegt werden und könnte künftig leicht vergessen werden).
  // ID-basiert über `tileById` statt indexbasiert (seit der Typ-Gruppierung/
  // Aura-Auslagerung entspricht die Anzeige-Reihenfolge NICHT mehr 1:1 der
  // rohen `battlefield`-Array-Reihenfolge - ein Index-Abgleich würde damit
  // die falsche Kachel treffen).
  const recentActionIds = getRecentActionInstanceIds();
  if (recentActionIds.size > 0) {
    for (const id of recentActionIds) {
      // Eingeklapptes Terrain hat gar keine eigene Kachel - der Hinweis "hier
      // ist gerade etwas passiert" (z.B. der Bot tappt ein Terrain für Mana)
      // wandert dann auf die Stapel-Kachel, statt ersatzlos zu verschwinden.
      // Genau bei bot-gesteuerten Zügen ist dieser Glow die einzige Anzeige
      // dafür, dass überhaupt etwas passiert ist (s. Auftrag
      // "Nachvollziehbarkeit von KI-Spielzügen").
      const tile = tileById.get(id) ?? (pileNode && pileIds.has(id) ? pileNode : undefined);
      tile?.classList.add("action-glow");
    }
  }

  return h("div", { class: "battlefield-zone" }, slots);
}

function graveyardZone(state: GameState, pool: ReturnType<typeof getPool>, playerId: PlayerId): HTMLElement {
  const cards = state.players[playerId].graveyard.map((id) => cardTile(state, pool, id));
  return h("div", { class: "graveyard-zone" }, cards.length ? cards : [h("div", { class: "empty-hint" }, [text("(leer)")])]);
}
