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

import type { ActivatedAbility, GameState, PlayerAction, PlayerId } from "../model";
import {
  backToDeckbuilder,
  confirmDeck,
  copyDeckFromPlayer1,
  dispatch,
  getAppPhase,
  getBotDifficulty,
  getDecklist,
  getLastError,
  getLog,
  getPool,
  getState,
  getUiMode,
  isBotControlled,
  legalActions,
  resetUiMode,
  setBotControlled,
  setBotDifficulty,
  setDecklist,
  setUiMode,
} from "./store";
import { BOT_DIFFICULTY_LABELS } from "../ai";
import { cardDef } from "./cardInfo";
import { h, text } from "./h";
import { cardTile } from "./components/cardTile";
import { deckBuilderScreen } from "./components/deckBuilder";
import { buildDemoDeck } from "./deck";
import { handCard, handCardDiscardToggle } from "./components/handCard";
import { playerPanel } from "./components/playerPanel";
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
import { targetKeyOf, type UiMode } from "./types";

const PLAYER_IDS: PlayerId[] = ["player1", "player2"];

function otherOf(p: PlayerId): PlayerId {
  return p === "player1" ? "player2" : "player1";
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
      setUiMode({ kind: "declaringAttackers", player: state.activePlayer, selected: [] });
    }
    return;
  }
  if (state.step === "declareBlockers" && state.priorityPlayer === undefined) {
    if (mode.kind !== "declaringBlockers") {
      setUiMode({ kind: "declaringBlockers", player: otherOf(state.activePlayer), pairs: [] });
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
 */
export function render(root: HTMLElement): void {
  const phase = getAppPhase();
  root.innerHTML = "";
  if (phase.kind === "deckbuild") {
    root.append(renderDeckBuilder(phase.player));
    return;
  }
  renderGameBoard(root);
}

function renderDeckBuilder(player: PlayerId): HTMLElement {
  const pool = getPool();
  const decklist = getDecklist(player);

  return deckBuilderScreen({
    pool,
    player,
    decklist,
    offerCopyFromPlayer1: player === "player2",
    onChange: (next) => setDecklist(player, next),
    onRandomFill: () => setDecklist(player, buildDemoDeck(pool)),
    onCopyFromPlayer1: () => copyDeckFromPlayer1(),
    onConfirm: () => {
      // Defensive Doppelprüfung - der Button ist im Deckbau-Screen bereits
      // per `disabled` gesperrt, solange die Deckliste ungültig ist
      // (deckValidation.ts); hier zusätzlich geprüft, falls render() jemals
      // ohne diese Sperre aufgerufen wird (z.B. künftige Tastatursteuerung).
      if (!validateDecklist(pool, decklist).valid) return;
      confirmDeck(player);
    },
    // v0.1.7 ("Spieler 2 = KI"): Umschalter setzt nur das Flag
    // (store.ts#setBotControlled) - der Nutzer kann trotzdem ganz normal
    // weiter sein eigenes Deck bauen und über "Spiel starten" fortfahren
    // (das Flag entscheidet nur, wer die Züge später automatisch spielt, s.
    // store.ts#dispatch/initGame). "Zufälliges KI-Deck + weiter" ist die im
    // Auftrag gewünschte Abkürzung: füllt zufällig (buildDemoDeck, wie
    // "Zufällig füllen"), markiert bot-gesteuert und bestätigt SOFORT -
    // überspringt damit effektiv den manuellen Deckbau-Screen für player2.
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
  });
}

function renderGameBoard(root: HTMLElement): void {
  const state = getState();
  autoEnterForcedModes(state);
  const pool = getPool();
  const mode = getUiMode();
  const err = getLastError();

  const children: (HTMLElement | undefined)[] = [
    statusBar(state),
    err ? h("div", { class: "error-banner" }, [text(`Nicht erlaubt: ${err}`)]) : undefined,
    ...actionBanner(state, mode),
    state.winner !== undefined ? gameOverBanner(state) : undefined,
    boardSection(state, pool, mode),
    stackPanel(state, pool, stackPanelOptions(state, mode)),
    logPanel(getLog()),
  ];

  root.append(...children.filter((c): c is HTMLElement => !!c));
}

// ---------------------------------------------------------------------------
// Status- / Banner-Zeilen
// ---------------------------------------------------------------------------

function statusBar(state: GameState): HTMLElement {
  // "Priorität passen" ist der normale Weg, einen Priority-Moment zu
  // verlassen, ohne etwas (weiteres) zu tun - ohne diesen Button gibt es
  // sonst kein UI-Element dafür (getLegalActions liefert passPriority zwar
  // immer, siehe legal-actions.ts, aber das muss auch anklickbar sein).
  // Immer sichtbar/aktiv, wenn priorityPlayer gesetzt ist und keine
  // PendingDecision aussteht (Combat-/Cleanup-Zwangsschritte haben ohnehin
  // priorityPlayer === undefined, siehe turn.ts).
  const canPass = state.priorityPlayer !== undefined && !state.pendingDecision;
  const priorityPlayer = state.priorityPlayer;

  return h("div", { class: "status-bar" }, [
    h("span", {}, [text(`Zug ${state.turnNumber} · Step: ${state.step}`)]),
    h("span", {}, [text(`Aktiver Spieler: ${state.activePlayer}`)]),
    h(
      "span",
      {},
      [text(priorityPlayer ? `Priority: ${priorityPlayer}` : "Priority: (Engine verarbeitet Turn-Based Action)")],
    ),
    canPass && priorityPlayer
      ? h(
          "button",
          {
            class: "btn btn-pass",
            onclick: () => dispatch({ kind: "passPriority", player: priorityPlayer }),
          },
          [text(`Priorität passen (${priorityPlayer})`)],
        )
      : undefined,
    h("button", { class: "btn btn-cancel", onclick: () => backToDeckbuilder() }, [text("Neues Spiel")]),
  ]);
}

function gameOverBanner(state: GameState): HTMLElement {
  return h("div", { class: "game-over-banner" }, [text(`Spiel beendet - Sieger: ${state.winner}`)]);
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
          decision.player,
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

  return h(
    "div",
    { class: "board" },
    PLAYER_IDS.map((playerId) => playerArea(state, pool, playerId, mode, targetMap)),
  );
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

  return h("div", { class: "player-area" }, [
    playerPanel(state, playerId, {
      botControlled: isBotControlled(playerId),
      // v0.1.9: Anzeige der aktiven Bot-Schwierigkeitsstufe im Spielbrett-
      // Header (docs/ai-status.md Abschnitt 9.8, Punkt 3, optional) - nur
      // relevant, wenn der Spieler tatsächlich bot-gesteuert ist (playerPanel
      // zeigt das "KI"-Badge ohnehin nur dann an, s. dortiger Code).
      botDifficultyLabel: isBotControlled(playerId) ? BOT_DIFFICULTY_LABELS[getBotDifficulty(playerId)] : undefined,
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

  if (mode.kind === "discarding" && mode.player === playerId) {
    const tiles = hand.map((id) => {
      const def = cardDef(pool, state, id);
      const selected = mode.selected.includes(id);
      return handCardDiscardToggle(def, selected, () => {
        const next = selected ? mode.selected.filter((x) => x !== id) : [...mode.selected, id];
        setUiMode({ ...mode, selected: next });
      });
    });
    return h("div", { class: "hand-zone" }, tiles);
  }

  const isActingPlayer = state.priorityPlayer === playerId && !state.pendingDecision;
  const candidates = isActingPlayer ? legalActions(playerId) : [];
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
    });
  });
  return h("div", { class: "hand-zone" }, tiles);
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

  const tiles = state.players[playerId].battlefield.map((id) => {
    const key = targetKeyOf({ kind: "permanent", instanceId: id });
    const targetCandidate = targetMap.get(key);
    if (targetCandidate) {
      return cardTile(state, pool, id, { targetable: true, onClick: () => dispatch(targetCandidate) });
    }

    const def = cardDef(pool, state, id);

    if (mode.kind === "xTarget" && xTargetShapeAllowsPermanent(mode.spec, def)) {
      return cardTile(state, pool, id, {
        targetable: true,
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
          onClick: () => setUiMode({ ...mode, selectedBlocker: selected ? undefined : id }),
        });
      }
      const isEnemyAttacker =
        playerId === state.activePlayer && state.cards[id]?.permanentState?.combat?.role === "attacker";
      if (isEnemyAttacker && mode.selectedBlocker) {
        return cardTile(state, pool, id, {
          targetable: true,
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
        return cardTile(state, pool, id, { targetable: true, hinted: true, onClick: () => dispatch(zeroSlot) });
      }
      return cardTile(state, pool, id, {
        targetable: true,
        hinted: true,
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
          onClick: () =>
            setUiMode({
              kind: "xInput",
              player: playerId,
              source: { kind: "ability", sourceInstanceId: id, abilityIndex: xAbilityIndex },
            }),
        });
      }
    }

    return cardTile(state, pool, id);
  });

  return h("div", { class: "battlefield-zone" }, tiles);
}

function graveyardZone(state: GameState, pool: ReturnType<typeof getPool>, playerId: PlayerId): HTMLElement {
  const cards = state.players[playerId].graveyard.map((id) => cardTile(state, pool, id));
  return h("div", { class: "graveyard-zone" }, cards.length ? cards : [h("div", { class: "empty-hint" }, [text("(leer)")])]);
}
