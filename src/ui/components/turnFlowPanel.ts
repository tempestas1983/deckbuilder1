/**
 * Zug-/Step-Flow (Auftrag "Zug-/Step-Info soll rechts neben dem Spielfeld als
 * klar lesbarer Flow erscheinen, nicht mehr als Fließtext"): ersetzt die
 * bisherigen drei reinen Info-Spans der `.status-bar` ("Zug X · Step: Y",
 * "Aktiver Spieler: ...", "Priority: ...", s. render.ts#statusBar vor diesem
 * Auftrag) durch eine vertikale Schritt-Kette in der rechten Board-Spalte
 * (s. render.ts#boardSection/turnFlowColumn), gerendert direkt unter dem
 * Avatar des gerade aktiven Spielers.
 *
 * Reine Präsentationskomponente: bekommt bereits fertig formatierte Strings
 * (`activePlayerLabel`/`priorityLabel`) statt selbst `PlayerId`s aufzulösen -
 * so bleibt die Bot-Name-/Anzeigename-Logik (render.ts#playerDisplayName)
 * an genau einer Stelle, kein Import-Zyklus mit render.ts nötig.
 *
 * Die rohen 12 `TurnStep`-Werte (game-state.ts) sind für eine schmale
 * Seitenspalte zu feingranular - `PHASE_GROUPS` fasst sie zu sechs
 * sinnvollen Phasen zusammen (s. Auftrag), der exakte aktuelle Rohschritt
 * bleibt trotzdem als kleines Detail-Tag unter dem aktuellen Knoten sichtbar
 * (z.B. bei "Kampf" zusätzlich "Angreifer erklären").
 */

import type { TurnStep } from "../../model";
import { h, text } from "../h";

interface PhaseGroup {
  id: string;
  label: string;
  steps: TurnStep[];
}

/** Reihenfolge exakt wie game-state.ts#TurnStep/rules-engine.md Abschnitt 2. */
const ORDERED_STEPS: TurnStep[] = [
  "untap",
  "upkeep",
  "draw",
  "main1",
  "beginCombat",
  "declareAttackers",
  "declareBlockers",
  "combatDamage",
  "endCombat",
  "main2",
  "endStep",
  "cleanup",
];

/** Zusammenfassung der 12 Rohschritte zu 6 les- und darstellbaren Phasen. */
const PHASE_GROUPS: PhaseGroup[] = [
  { id: "prep", label: "Vorbereitung", steps: ["untap", "upkeep"] },
  { id: "draw", label: "Ziehen", steps: ["draw"] },
  { id: "main1", label: "Hauptphase 1", steps: ["main1"] },
  {
    id: "combat",
    label: "Kampf",
    steps: ["beginCombat", "declareAttackers", "declareBlockers", "combatDamage", "endCombat"],
  },
  { id: "main2", label: "Hauptphase 2", steps: ["main2"] },
  { id: "end", label: "Ende", steps: ["endStep", "cleanup"] },
];

/** Deutsche Kurzbezeichnung je Rohschritt - für das Detail-Tag am aktuellen Knoten und die "Als nächstes"-Zeile. */
const STEP_LABELS: Record<TurnStep, string> = {
  untap: "Enttappen",
  upkeep: "Versorgung",
  draw: "Ziehen",
  main1: "Hauptphase 1",
  beginCombat: "Kampfbeginn",
  declareAttackers: "Angreifer erklären",
  declareBlockers: "Blocker erklären",
  combatDamage: "Kampfschaden",
  endCombat: "Kampfende",
  main2: "Hauptphase 2",
  endStep: "Endphase",
  cleanup: "Aufräumen",
};

export interface TurnFlowPanelProps {
  turnNumber: number;
  step: TurnStep;
  /** Bereits fertig formatiert, s. render.ts#playerDisplayName (Tavernen-Name für Bots, sonst die rohe PlayerId). */
  activePlayerLabel: string;
  /** Bereits fertig formatiert - entweder "Priorität: <Name>" oder der Turn-Based-Action-Hinweis, identische Logik wie zuvor in render.ts#statusBar. */
  priorityLabel: string;
}

/**
 * Vertikale Schritt-Kette + darunter Zugnummer/aktiver Spieler/Priority,
 * optisch als EIN zusammenhängender Flow statt loser Textzeilen.
 *
 * Stabile Testhaken (Auftrag Punkt 5, "robuste Selektoren, ohne von
 * Layout-Details zu Flow-Knoten abzuhängen"): `data-testid="turn-flow-panel"`
 * am Wurzelelement sowie je ein eigener `data-testid` für Zugnummer,
 * aktuellen Rohschritt, aktiven Spieler und Priority - Tests (z.B.
 * golden-path.test.ts) pollen darüber, nicht über CSS-Klassen der
 * Flow-Knoten selbst.
 */
export function turnFlowPanel(props: TurnFlowPanelProps): HTMLElement {
  const { turnNumber, step, activePlayerLabel, priorityLabel } = props;
  const currentGroupIndex = PHASE_GROUPS.findIndex((g) => g.steps.includes(step));
  const currentStepIndex = ORDERED_STEPS.indexOf(step);
  const nextStep =
    currentStepIndex >= 0 && currentStepIndex < ORDERED_STEPS.length - 1
      ? ORDERED_STEPS[currentStepIndex + 1]
      : undefined;
  // cleanup ist der letzte Rohschritt dieses Zuges - was danach kommt
  // (enttappen im nächsten Zug) kann ein GANZ ANDERER Spieler sein (aktiver
  // Spieler wechselt), darum hier bewusst kein konkreter Schrittname mehr,
  // um keine falsche "gleicher Spieler macht weiter"-Erwartung zu wecken.
  const nextLabel = nextStep ? STEP_LABELS[nextStep] : "Neuer Zug beginnt";

  const nodes = PHASE_GROUPS.map((group, i) => {
    const status: "done" | "current" | "upcoming" =
      i < currentGroupIndex ? "done" : i === currentGroupIndex ? "current" : "upcoming";
    const children = [h("span", { class: "turn-flow-node-label" }, [text(group.label)])];
    if (status === "current") {
      // Detail-Tag mit dem exakten Rohschritt (z.B. innerhalb der
      // "Kampf"-Gruppe "Angreifer erklären") - trägt zugleich den stabilen
      // Test-Haken für den aktuellen `TurnStep`-Rohwert.
      children.push(
        h("span", { class: "turn-flow-node-step", "data-testid": "turn-flow-current-step" }, [text(step)]),
      );
    }
    return h("li", { class: `turn-flow-node turn-flow-node-${status}` }, children);
  });

  return h("div", { class: "turn-flow-panel", "data-testid": "turn-flow-panel" }, [
    h("div", { class: "turn-flow-turn-badge", "data-testid": "turn-flow-turn-number" }, [text(`Zug ${turnNumber}`)]),
    h("ol", { class: "turn-flow-track" }, nodes),
    h("div", { class: "turn-flow-next", "data-testid": "turn-flow-next-step" }, [text(`Als nächstes: ${nextLabel}`)]),
    h("div", { class: "turn-flow-meta" }, [
      h("div", { class: "turn-flow-meta-row", "data-testid": "turn-flow-active-player" }, [
        text(`Am Zug: ${activePlayerLabel}`),
      ]),
      h("div", { class: "turn-flow-meta-row", "data-testid": "turn-flow-priority" }, [text(priorityLabel)]),
    ]),
  ]);
}
