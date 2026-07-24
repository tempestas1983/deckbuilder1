// @vitest-environment jsdom
/**
 * UI-Tests für die Angreifer-Deklaration (Spielerbericht 2026-07-24:
 * "man kann eine Kreatur in der Angriffs-Vorbereitung nicht wieder abwählen,
 * falls man sie versehentlich angeklickt hat" + Wunsch nach einem deutlich
 * prominenteren Angriffs-Button).
 *
 * Bis hierhin gab es KEINEN einzigen UI-Test für den declareAttackers-Schritt
 * (nur der kreaturlose "Keine Angreifer"-Pfad kam über den Autopilot in
 * testHelpers.ts vor) - genau deshalb konnte die Regression unbemerkt bleiben.
 *
 * Aufbau wie priority-mana-tap.test.ts/x-cost-ability.test.ts: echtes
 * Durchklicken ab App-Start, Deck über `buildDeckByClicking`, kein
 * store.dispatch()-Bypass für die eigentlich geprüfte Interaktion.
 * Deckliste: 4x Aschenwelpe (core.cinder-pup, {flame} 1/1 ohne jede Fähigkeit -
 * bewusst vanilla, damit kein Trigger den Ablauf stört) + 36x Flammenkuppe.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import {
  autoAdvanceToReadyMain1,
  buildDeckByClicking,
  buttonWithText,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryAll,
  queryOne,
  registerCardName,
  tapUntappedPermanent,
} from "./testHelpers";
import type { GameState } from "../../model";

const CINDER_PUP = "core.cinder-pup"; // {flame}, 1/1, keine Fähigkeiten
const FLAME_RIDGE = "core.flame-ridge"; // Terrain, tap: 1 Flamme-Mana

registerCardName(CINDER_PUP, starterSet[CINDER_PUP]!.name);
registerCardName(FLAME_RIDGE, starterSet[FLAME_RIDGE]!.name);

const PUP_NAME = starterSet[CINDER_PUP]!.name;
const RIDGE_NAME = starterSet[FLAME_RIDGE]!.name;

/**
 * Bringt die Partie bis zum declareAttackers-Schritt von `attacker`, mit
 * mindestens einer angriffsbereiten (nicht beschwörungskranken) Aschenwelpe.
 * Nutzt ausschließlich echte Klicks; kennt dieselben Automatik-Fallbacks wie
 * testHelpers.ts#autoAdvanceToReadyMain1.
 */
function advanceToOwnDeclareAttackers(
  root: ParentNode,
  getState: () => GameState,
  attacker: "player1" | "player2",
  maxSteps = 400,
): void {
  for (let step = 0; step < maxSteps; step++) {
    const state = getState();
    if (state.winner !== undefined) throw new Error("Partie vorzeitig beendet.");

    // Ziel erreicht: eigener declareAttackers-Schritt mit echter Wahl
    // (das Panel erscheint nur dann, s. render.ts#hasRealDeclareAttackersChoice).
    if (
      state.step === "declareAttackers" &&
      state.activePlayer === attacker &&
      state.priorityPlayer === undefined &&
      !state.pendingDecision &&
      root.querySelector(".attackers-panel")
    ) {
      return;
    }

    const mulliganKeep = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
    if (mulliganKeep) {
      click(mulliganKeep);
      continue;
    }

    // Gegnerischen declareAttackers-Schritt (player2 im Hotseat) NICHT
    // durchwinken, sondern ohne Angriff beenden - dieser Test interessiert
    // sich nur für den eigenen.
    if (state.step === "declareAttackers" && state.activePlayer !== attacker) {
      const none = buttonWithText(root, ".btn.btn-cancel", "Keine Angreifer");
      if (none) {
        click(none);
        continue;
      }
    }

    // Eigenes Main1: Terrain legen, sonst Mana tappen + Welpe casten.
    if (state.step === "main1" && state.priorityPlayer === attacker && !state.pendingDecision) {
      const terrainBtn = buttonWithText(root, ".btn.btn-play", "Terrain legen");
      if (terrainBtn) {
        click(terrainBtn);
        continue;
      }
      const playBtn = queryAll<HTMLButtonElement>(root, ".hand-card .btn.btn-play").find(
        (b) => b.textContent === "Spielen" && !b.disabled,
      );
      if (playBtn) {
        click(playBtn);
        continue;
      }
      const untappedRidge = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile.targetable").find(
        (t) => t.querySelector(".card-tile-name")?.textContent === RIDGE_NAME,
      );
      if (untappedRidge) {
        tapUntappedPermanent(root, RIDGE_NAME);
        continue;
      }
    }

    if (root.querySelector(".discard-toggle")) {
      const required = state.players[state.activePlayer].hand.length - 7;
      const alreadySelected = queryAll(root, ".discard-toggle.selected").length;
      if (alreadySelected < required) {
        const toggle = queryAll<HTMLElement>(root, ".discard-toggle:not(.selected)").find(
          (el) => el.querySelector(".hand-card-name")?.textContent === RIDGE_NAME,
        );
        if (toggle) {
          click(toggle);
          continue;
        }
      }
      const confirm = buttonWithText(root, ".btn.btn-play", "Abwerfen bestätigen");
      if (confirm && !confirm.disabled) {
        click(confirm);
        continue;
      }
    }

    const passBtn = root.querySelector<HTMLButtonElement>(".btn-pass");
    if (passBtn) {
      click(passBtn);
      continue;
    }
    const spotlightSkip = root.querySelector<HTMLButtonElement>(".decision-spotlight-skip-btn");
    if (spotlightSkip) {
      click(spotlightSkip);
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
      `advanceToOwnDeclareAttackers: unbekannter Zustand (step=${state.step}, priority=${state.priorityPlayer}, pending=${state.pendingDecision?.kind})`,
    );
  }
  throw new Error("advanceToOwnDeclareAttackers: maxSteps erreicht.");
}

/** Die Battlefield-Kachel der Aschenwelpe des angreifenden Spielers. */
function pupTile(root: ParentNode): HTMLElement {
  const tile = queryAll<HTMLElement>(root, ".battlefield-zone .card-tile").find(
    (t) => t.querySelector(".card-tile-name")?.textContent === PUP_NAME,
  );
  if (!tile) throw new Error(`Keine Battlefield-Kachel "${PUP_NAME}" gefunden.`);
  return tile;
}

describe("Angreifer-Deklaration (Spielerbericht 2026-07-24)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  async function setupToDeclareAttackers() {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(20260724));
    const { render } = await import("../render");
    const { getState, subscribe, getUiMode } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    buildDeckByClicking(root, { [CINDER_PUP]: 4, [FLAME_RIDGE]: 36 });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);
    autoAdvanceToReadyMain1({
      root,
      getState,
      terrainId: FLAME_RIDGE,
      targetTerrainCount: 1,
      protectedCardId: CINDER_PUP,
      targetPlayer: "player1",
    });
    advanceToOwnDeclareAttackers(root, getState, "player1");

    return { root, getState, getUiMode };
  }

  /**
   * Bewusst EIN Testfall für beide Aspekte: das Hochspielen bis zum eigenen
   * declareAttackers-Schritt ist der teure Teil (echtes Durchklicken über
   * mehrere Züge), und beide Prüfungen betreffen exakt dieselbe Situation.
   */
  it("Auswahl lässt sich wieder abwählen, und der große Angriffs-Button spiegelt die Auswahl", async () => {
    const { root, getUiMode } = await setupToDeclareAttackers();

    const selectedIds = () => {
      const mode = getUiMode();
      return mode.kind === "declaringAttackers" ? mode.selected : [];
    };
    const attackBtn = () => queryOne<HTMLButtonElement>(root, ".attack-confirm-btn");

    // Ausgangslage: nichts gewählt, Angriffs-Button gesperrt (der bewusste
    // Weg, den Kampf auszulassen, bleibt "Keine Angreifer").
    expect(selectedIds()).toHaveLength(0);
    expect(pupTile(root).classList.contains("selected")).toBe(false);
    expect(attackBtn().disabled).toBe(true);

    // Klick -> ausgewählt, Button aktiv und nennt die Anzahl.
    click(pupTile(root));
    expect(selectedIds()).toHaveLength(1);
    expect(pupTile(root).classList.contains("selected")).toBe(true);
    expect(attackBtn().disabled).toBe(false);
    expect(attackBtn().textContent).toContain("1");

    // Erneuter Klick -> wieder abgewählt (der eigentliche Spielerbericht:
    // "man kann sich nicht umentscheiden, wenn man sich verklickt hat").
    click(pupTile(root));
    expect(selectedIds()).toHaveLength(0);
    expect(pupTile(root).classList.contains("selected")).toBe(false);
    expect(attackBtn().disabled).toBe(true);

    // Und der Angriff lässt sich danach ganz normal erklären.
    click(pupTile(root));
    click(attackBtn());
    expect(getUiMode().kind).not.toBe("declaringAttackers");

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
