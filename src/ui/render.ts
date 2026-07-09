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

import type { GameState, PlayerAction, PlayerId } from "../model";
import {
  dispatch,
  getLastError,
  getLog,
  getPool,
  getState,
  getUiMode,
  legalActions,
  resetUiMode,
  setUiMode,
} from "./store";
import { cardDef } from "./cardInfo";
import { h, text } from "./h";
import { cardTile } from "./components/cardTile";
import { handCard, handCardDiscardToggle } from "./components/handCard";
import { playerPanel } from "./components/playerPanel";
import { stackPanel } from "./components/stackPanel";
import { logPanel } from "./components/logPanel";
import {
  attackersPanel,
  blockersPanel,
  discardPanel,
  targetingBanner,
  xInputPanel,
} from "./components/actionPanels";
import {
  candidatesByTargetKey,
  xTargetShapeAllowsPermanent,
  xTargetShapeAllowsPlayer,
  xTargetShapeAllowsStackObject,
} from "./actionUtil";
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
  if (state.pendingDecision) return; // eigener Weg über candidatesByTargetKey, siehe unten

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
  if (mode.kind === "declaringAttackers" || mode.kind === "declaringBlockers" || mode.kind === "discarding") {
    setUiMode({ kind: "idle" });
  }
}

export function render(root: HTMLElement): void {
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

  root.innerHTML = "";
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
    h("button", { class: "btn btn-cancel", onclick: () => location.reload() }, [text("Neues Spiel")]),
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
    return [
      targetingBanner(
        `Zielwahl erforderlich (${state.pendingDecision.player}, ${state.pendingDecision.kind}) - Ziel auf dem Spielbrett antippen.`,
      ),
    ];
  }
  if (mode.kind === "targeting") {
    return [targetingBanner(mode.title, () => resetUiMode())];
  }
  if (mode.kind === "xInput") {
    const def = cardDef(getPool(), state, mode.cardInstanceId);
    return [
      xInputPanel(
        def.name,
        (x) => {
          const targets = def.type === "spell" ? def.targets : undefined;
          if (targets && targets.length > 0) {
            setUiMode({ kind: "xTarget", cardInstanceId: mode.cardInstanceId, player: mode.player, chosenX: x, spec: targets[0]! });
          } else {
            dispatch({ kind: "castSpell", player: mode.player, cardInstanceId: mode.cardInstanceId, chosenTargets: [], chosenX: x });
          }
        },
        () => resetUiMode(),
      ),
    ];
  }
  if (mode.kind === "xTarget") {
    return [targetingBanner(`Ziel für X=${mode.chosenX} wählen (Spielbrett antippen).`, () => resetUiMode())];
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
        dispatch({
          kind: "castSpell",
          player: mode.player,
          cardInstanceId: mode.cardInstanceId,
          chosenTargets: [{ kind: "stackObject", stackObjectId }],
          chosenX: mode.chosenX,
        });
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

  return h("div", { class: "player-area" }, [
    playerPanel(state, playerId, {
      targetable: !!playerCandidate || xTargetsPlayer,
      onClick: playerCandidate
        ? () => dispatch(playerCandidate)
        : xTargetsPlayer && modeForXTarget
          ? () =>
              dispatch({
                kind: "castSpell",
                player: modeForXTarget.player,
                cardInstanceId: modeForXTarget.cardInstanceId,
                chosenTargets: [{ kind: "player", playerId }],
                chosenX: modeForXTarget.chosenX,
              })
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
    return handCard(id, def, {
      castCandidates,
      playTerrainCandidate,
      offerXFlow: isActingPlayer && hasX,
      onCastDirect: (action) => dispatch(action),
      onStartTargeting: (cands, title) => setUiMode({ kind: "targeting", title, candidates: cands }),
      onStartXFlow: (cardInstanceId) => setUiMode({ kind: "xInput", cardInstanceId, player: playerId }),
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
          dispatch({
            kind: "castSpell",
            player: mode.player,
            cardInstanceId: mode.cardInstanceId,
            chosenTargets: [{ kind: "permanent", instanceId: id }],
            chosenX: mode.chosenX,
          }),
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
    const abilityCandidates = candidates.filter((a) => a.kind === "activateAbility" && a.sourceInstanceId === id);
    if (abilityCandidates.length > 0) {
      const zeroSlot = abilityCandidates.find((a) => a.kind === "activateAbility" && a.chosenTargets.length === 0);
      if (zeroSlot && abilityCandidates.length === 1) {
        return cardTile(state, pool, id, { targetable: true, hinted: true, onClick: () => dispatch(zeroSlot) });
      }
      return cardTile(state, pool, id, {
        targetable: true,
        hinted: true,
        onClick: () => setUiMode({ kind: "targeting", title: `Ziel für Fähigkeit von „${def.name}“ wählen`, candidates: abilityCandidates }),
      });
    }

    return cardTile(state, pool, id);
  });

  return h("div", { class: "battlefield-zone" }, tiles);
}

function graveyardZone(state: GameState, pool: ReturnType<typeof getPool>, playerId: PlayerId): HTMLElement {
  const cards = state.players[playerId].graveyard.map((id) => cardTile(state, pool, id));
  return h("div", { class: "graveyard-zone" }, cards.length ? cards : [h("div", { class: "empty-hint" }, [text("(leer)")])]);
}
