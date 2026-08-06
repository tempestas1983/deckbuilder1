// @vitest-environment jsdom
/**
 * Regressionstest für "Auto-Tap-Komfort" (Auftrag: automatisches Antippen
 * eigener Manaquellen beim Casten, docs/rules-engine.md:609 "kommt später").
 *
 * Reproduziertes Nutzerszenario: Spieler hat 2 Leerenspalten (Void) + 2
 * Flammenkuppen (Flame) UNGETAPPT und ZWEI Handkarten, die je {generic:1,
 * void:1} kosten. Tappt man beide Leerenspalten für die ERSTE Karte (1 Pip +
 * 1 generisch aus der zweiten Leerenspalte, wie ein Spieler es naiv manuell
 * tun könnte), bleiben nur die 2 Flammenkuppen übrig - die können die zweite
 * Karte NICHT bezahlen (kein void-Pip verfügbar), obwohl insgesamt genug
 * Gesamt-Mana für BEIDE Karten da war. Auto-Tap muss das vermeiden: für
 * generische Kosten werden bevorzugt NICHT benötigte Farben (hier: Flame vor
 * dem zweiten Void) verwendet (s. store.ts#AUTO_TAP_COLOR_ORDER/
 * selectAutoTapSources), sodass am Ende beide Karten castbar bleiben.
 *
 * Hinweis zum Ablauf: EIN Klick auf "Spielen" reicht bewusst je Karte aus,
 * ohne dass danach manuell durchgepasst werden muss - solange auf dem Stack
 * nur der eigene Zauber liegt und WEDER der eigene NOCH der (hier: hotseat-)
 * Gegenspieler eine andere echte Wahl haben (kein Ziel, keine weitere
 * castbare Karte während der Stack nicht leer ist - Sorcery-Speed), passt
 * store.ts#advanceAutomation beide Seiten automatisch, bis der Zauber
 * resolved ist (dasselbe Auto-Pass-Verhalten wie bei jeder anderen Aktion,
 * s. store.ts#hasRealPriorityChoice) - der Stack ist deshalb bereits wieder
 * leer, sobald `click()` zurückkehrt.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { starterSet } from "../../cards/starter-set";
import type { GameState, PlayerId } from "../../model";
import {
  buildDeckByClicking,
  buttonWithText,
  click,
  enterHotseatNewGame,
  keepAllMulligans,
  makeSeededRandom,
  queryAll,
  queryOne,
  registerCardName,
} from "./testHelpers";

const HUSK_CRAWLER = "core.husk-crawler"; // {generic:1}{void} Kreatur, kein Ziel nötig
const VOID_RIFT = "core.void-rift"; // Terrain, tap: 1 Leere-Mana
const FLAME_RIDGE = "core.flame-ridge"; // Terrain, tap: 1 Flamme-Mana
const FILLER_TERRAIN = "core.wild-glade"; // Terrain, tap: 1 Wildnis-Mana - reiner Deck-Füller, wird nie gespielt

registerCardName(HUSK_CRAWLER, starterSet[HUSK_CRAWLER]!.name);
registerCardName(VOID_RIFT, starterSet[VOID_RIFT]!.name);
registerCardName(FLAME_RIDGE, starterSet[FLAME_RIDGE]!.name);
registerCardName(FILLER_TERRAIN, starterSet[FILLER_TERRAIN]!.name);

function cardCountOnBattlefield(state: GameState, player: PlayerId, definitionId: string): number {
  return state.players[player].battlefield.filter((id) => state.cards[id]?.definitionId === definitionId).length;
}

function tappedCountOnBattlefield(state: GameState, player: PlayerId, definitionId: string): number {
  return state.players[player].battlefield.filter(
    (id) => state.cards[id]?.definitionId === definitionId && state.cards[id]!.permanentState!.tapped,
  ).length;
}

function handCountOf(state: GameState, player: PlayerId, definitionId: string): number {
  return state.players[player].hand.filter((id) => state.cards[id]?.definitionId === definitionId).length;
}

/** Klickt "Terrain legen" auf EINER konkreten Handkarte (per Anzeigename gescoped) - mehrere unterschiedliche Terrain-Handkarten können gleichzeitig eigene "Terrain legen"-Buttons zeigen. */
function playSpecificTerrain(root: ParentNode, name: string): boolean {
  const handCard = queryAll<HTMLElement>(root, ".hand-card").find(
    (el) => el.querySelector(".hand-card-name")?.textContent === name,
  );
  if (!handCard) return false;
  const btn = buttonWithText(handCard, ".btn.btn-play", "Terrain legen");
  if (!btn) return false;
  click(btn);
  return true;
}

/**
 * Bespoke-Autopilot (bewusst NICHT testHelpers.ts#autoAdvanceToReadyMain1 -
 * das unterstützt nur EINE Terrain-Sorte pro Lauf, hier werden aber ZWEI
 * verschiedene gebraucht): legt abwechselnd Leerenspalten/Flammenkuppen,
 * sobald verfügbar, bis je 2 auf dem Battlefield liegen UND mindestens 2
 * Hüllenkriecher in der Hand sind - hält sonst wie autoAdvanceToReadyMain1
 * Mulligan/Combat/Cleanup/Priority am Laufen.
 */
function advanceUntilManaBaseReady(root: ParentNode, getState: () => GameState, humanPlayer: PlayerId): void {
  const maxSteps = 1500;
  for (let step = 0; step < maxSteps; step++) {
    const state = getState();
    if (state.winner !== undefined) throw new Error("advanceUntilManaBaseReady: Spiel ist vorzeitig beendet.");

    const voidCount = cardCountOnBattlefield(state, humanPlayer, VOID_RIFT);
    const flameCount = cardCountOnBattlefield(state, humanPlayer, FLAME_RIDGE);
    const huskInHand = handCountOf(state, humanPlayer, HUSK_CRAWLER);
    const needsVoid = voidCount < 2;
    const needsFlame = flameCount < 2;
    const needsHusk = huskInHand < 2;

    const ready =
      state.step === "main1" &&
      state.priorityPlayer === humanPlayer &&
      !state.pendingDecision &&
      !needsVoid &&
      !needsFlame &&
      !needsHusk;
    if (ready) return;

    const mulliganKeep = buttonWithText(root, ".btn.btn-play", "Starthand behalten");
    if (mulliganKeep) {
      click(mulliganKeep);
      continue;
    }

    if (state.step === "main1" && state.priorityPlayer === humanPlayer && !state.pendingDecision) {
      if (needsVoid && playSpecificTerrain(root, starterSet[VOID_RIFT]!.name)) continue;
      if (needsFlame && playSpecificTerrain(root, starterSet[FLAME_RIDGE]!.name)) continue;
    }

    if (root.querySelector(".discard-toggle")) {
      const required = state.players[state.activePlayer].hand.length - 7;
      const alreadySelected = queryAll(root, ".discard-toggle.selected").length;
      if (alreadySelected < required) {
        // Ausschließlich für humanPlayer relevant (nur seine Hand ist im
        // Cleanup interaktiv, s. autoAdvanceToReadyMain1) - schützt genau die
        // gerade noch benötigten Karten vor dem Abwurf, bevorzugt den reinen
        // Deck-Füller (core.wild-glade, 24 Kopien im Deck) zum Abwerfen.
        const protectedNames = new Set<string>();
        if (needsVoid) protectedNames.add(starterSet[VOID_RIFT]!.name);
        if (needsFlame) protectedNames.add(starterSet[FLAME_RIDGE]!.name);
        if (needsHusk) protectedNames.add(starterSet[HUSK_CRAWLER]!.name);
        const unselectedToggles = queryAll<HTMLElement>(root, ".discard-toggle:not(.selected)");
        const fillerToggle = unselectedToggles.find(
          (el) => el.querySelector(".hand-card-name")?.textContent === starterSet[FILLER_TERRAIN]!.name,
        );
        const unprotectedToggle = unselectedToggles.find(
          (el) => !protectedNames.has(el.querySelector(".hand-card-name")?.textContent ?? ""),
        );
        const nextToggle = fillerToggle ?? unprotectedToggle ?? unselectedToggles[0];
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

    const spotlightSkipBtn = root.querySelector<HTMLButtonElement>(".decision-spotlight-skip-btn");
    if (spotlightSkipBtn) {
      click(spotlightSkipBtn);
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
      `advanceUntilManaBaseReady: unbekannter Zustand (step=${state.step}, priorityPlayer=${state.priorityPlayer}, pendingDecision=${state.pendingDecision?.kind})`,
    );
  }
  throw new Error("advanceUntilManaBaseReady: maxSteps erreicht - Zielzustand nicht erreicht.");
}

/** Klickt den "Spielen"-Button EINER konkreten Hüllenkriecher-Handkarte (nach Namen gescoped, s.o. - mehrere Kopien sehen identisch aus). */
function clickCastHuskCrawler(root: ParentNode): void {
  const huskName = starterSet[HUSK_CRAWLER]!.name;
  const handCard = queryAll<HTMLElement>(root, ".hand-card").find(
    (el) => el.querySelector(".hand-card-name")?.textContent === huskName,
  );
  if (!handCard) throw new Error("clickCastHuskCrawler: keine Hüllenkriecher-Handkarte gefunden.");
  const btn = buttonWithText(handCard, ".btn.btn-play", "Spielen");
  if (!btn) throw new Error("clickCastHuskCrawler: kein 'Spielen'-Button auf der Hüllenkriecher-Handkarte gefunden.");
  click(btn);
}

describe("Auto-Tap-Komfort (store.ts#dispatch/autoTapActionsForCast/selectAutoTapSources)", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = "";
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("2 Void + 2 Flame ungetappt, 2x {generic:1,void:1}-Handkarte -> ein Klick pro Karte tappt automatisch die richtige Mischung, beide Karten bleiben castbar", async () => {
    vi.spyOn(Math, "random").mockImplementation(makeSeededRandom(2026));

    const { render } = await import("../render");
    const { getState, subscribe } = await import("../store");
    const root = document.createElement("div");
    document.body.append(root);

    subscribe(() => render(root));
    render(root);
    enterHotseatNewGame(root);

    // 40 Karten: 4x Hüllenkriecher (Cap für Nicht-Terrain) + 6x Leerenspalte +
    // 6x Flammenkuppe + 24x Wildlichtung (reiner Füller, s. Dateikommentar).
    buildDeckByClicking(root, {
      [HUSK_CRAWLER]: 4,
      [VOID_RIFT]: 6,
      [FLAME_RIDGE]: 6,
      [FILLER_TERRAIN]: 24,
    });
    click(queryOne(root, ".deckbuilder-confirm-btn"));
    click(queryOne(root, ".deckbuilder-copy-p1-btn"));
    click(queryOne(root, ".deckbuilder-confirm-btn"));

    keepAllMulligans(root);

    const humanPlayer: PlayerId = "player1";
    advanceUntilManaBaseReady(root, getState, humanPlayer);

    let state = getState();
    expect(state.step).toBe("main1");
    expect(state.priorityPlayer).toBe(humanPlayer);
    expect(cardCountOnBattlefield(state, humanPlayer, VOID_RIFT)).toBe(2);
    expect(cardCountOnBattlefield(state, humanPlayer, FLAME_RIDGE)).toBe(2);
    expect(handCountOf(state, humanPlayer, HUSK_CRAWLER)).toBeGreaterThanOrEqual(2);
    expect(Object.values(state.players[humanPlayer].manaPool).every((n) => n === 0)).toBe(true);
    // Noch NICHTS manuell angetappt - genau die reproduzierte Ausgangslage.
    expect(tappedCountOnBattlefield(state, humanPlayer, VOID_RIFT)).toBe(0);
    expect(tappedCountOnBattlefield(state, humanPlayer, FLAME_RIDGE)).toBe(0);

    // ERSTE Karte casten: EIN Klick auf "Spielen" (kein vorheriges manuelles
    // Tappen) - Auto-Tap muss automatisch 1 Void + 1 Flame antippen, NICHT
    // beide Void-Quellen (das wäre der reproduzierte Fehler). Der Stack
    // resolved dabei im selben synchronen Klick automatisch weiter (s.
    // Dateikommentar oben) - kein manuelles Durchpassen nötig.
    clickCastHuskCrawler(root);
    state = getState();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(state.stack.length).toBe(0);
    expect(cardCountOnBattlefield(state, humanPlayer, HUSK_CRAWLER)).toBe(1);
    expect(Object.values(state.players[humanPlayer].manaPool).every((n) => n === 0)).toBe(true);

    // Der Kern des Regressionstests: GENAU 1 Void (der Pip) + 1 Flame (das
    // Generische) wurden getappt - NICHT beide Void-Quellen.
    expect(tappedCountOnBattlefield(state, humanPlayer, VOID_RIFT)).toBe(1);
    expect(tappedCountOnBattlefield(state, humanPlayer, FLAME_RIDGE)).toBe(1);

    // ZWEITE Karte casten: müssen jetzt noch die verbliebene Leerenspalte +
    // Flammenkuppe zur Verfügung stehen (genau das, was der reproduzierte
    // Bug verhindert hätte).
    clickCastHuskCrawler(root);
    state = getState();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(state.stack.length).toBe(0);
    expect(cardCountOnBattlefield(state, humanPlayer, HUSK_CRAWLER)).toBe(2);
    expect(tappedCountOnBattlefield(state, humanPlayer, VOID_RIFT)).toBe(2);
    expect(tappedCountOnBattlefield(state, humanPlayer, FLAME_RIDGE)).toBe(2);

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  }, 30000);
});
