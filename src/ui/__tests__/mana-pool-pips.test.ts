// @vitest-environment jsdom
/**
 * Mana-Vorrat als farbige Pips statt Fließtext (Spielerwunsch 2026-07-24:
 * "Mana als Icons dargestellt wäre super").
 *
 * Vorher stand der Vorrat als Text im Spieler-Panel ("Mana: 2× Flamme,
 * 1× farblos"), während Kartenkosten schon immer Pips waren - für "kann ich
 * das bezahlen?" musste man zwischen zwei Darstellungen desselben Konzepts
 * übersetzen. Diese Tests sichern die Pip-Ableitung (Reihenfolge, Farbklassen,
 * Anzahl als Beschriftung) und dass der volle Text als `title` erhalten bleibt.
 */

import { describe, expect, it } from "vitest";
import { formatManaPool, manaPoolPips } from "../cardInfo";
import { playerPanel } from "../components/playerPanel";
import type { GameState } from "../../model";

describe("Mana-Vorrat als Pips", () => {
  it("liefert einen Pip je Farbe mit der Anzahl als Beschriftung, farblos zuletzt", () => {
    const pips = manaPoolPips({ flame: 2, tide: 0, wild: 3, light: 0, void: 1, colorless: 4 });
    expect(pips).toEqual([
      { key: "flame", label: "2", colorClass: "mana-flame" },
      { key: "wild", label: "3", colorClass: "mana-wild" },
      { key: "void", label: "1", colorClass: "mana-void" },
      { key: "colorless", label: "4", colorClass: "mana-colorless" },
    ]);
  });

  it("leerer Vorrat ergibt keine Pips", () => {
    expect(manaPoolPips({ flame: 0, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 })).toEqual([]);
    expect(formatManaPool({ flame: 0, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 })).toBe("leer");
  });

  it("formatManaPool bleibt als vollständiger Text erhalten (Tooltip-Fallback)", () => {
    expect(formatManaPool({ flame: 2, tide: 0, wild: 0, light: 0, void: 0, colorless: 1 })).toBe(
      "2× Flamme, 1× farblos",
    );
  });

  /**
   * Minimaler GameState-Ausschnitt - `playerPanel` liest nur die hier
   * gesetzten Felder (Leben, Mana-Pool, Zonengrößen, aktiver/Priority-Spieler).
   */
  function stateWithPool(pool: Record<string, number>): GameState {
    const player = {
      life: 20,
      manaPool: pool,
      hand: [],
      library: [],
      graveyard: [],
      exile: [],
      battlefield: [],
      hasLost: false,
    };
    return {
      activePlayer: "player1",
      priorityPlayer: "player1",
      players: { player1: player, player2: { ...player } },
    } as unknown as GameState;
  }

  it("Spieler-Panel rendert die Pips und behält den vollen Text als title", () => {
    const panel = playerPanel(stateWithPool({ flame: 2, tide: 0, wild: 0, light: 0, void: 0, colorless: 1 }), "player1");
    const mana = panel.querySelector(".player-panel-mana")!;

    expect(mana.getAttribute("title")).toBe("Mana: 2× Flamme, 1× farblos");
    const pips = Array.from(mana.querySelectorAll(".mana-pip")).map((p) => [p.className, p.textContent]);
    expect(pips).toEqual([
      ["mana-pip mana-flame", "2"],
      ["mana-pip mana-colorless", "1"],
    ]);
    expect(mana.querySelector(".player-panel-mana-empty")).toBeFalsy();
  });

  it("Spieler-Panel zeigt bei leerem Vorrat 'leer' statt einer leeren Pip-Reihe", () => {
    const panel = playerPanel(stateWithPool({ flame: 0, tide: 0, wild: 0, light: 0, void: 0, colorless: 0 }), "player1");
    const mana = panel.querySelector(".player-panel-mana")!;

    expect(mana.querySelectorAll(".mana-pip")).toHaveLength(0);
    expect(mana.querySelector(".player-panel-mana-empty")?.textContent).toBe("leer");
  });
});
