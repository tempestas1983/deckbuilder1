/**
 * Minimaler Test-Kartenpool für Engine-Unit-Tests. KEIN Ersatz für den
 * "core"-Pool des Card-Designers - nur intern für deterministische Engine-
 * Tests gedacht (rules-engine.md Primitive werden hier exemplarisch genutzt).
 */

import type { CardPool, PlayerId } from "../../model";

export const FLAME_TERRAIN = "test.flame-terrain";
export const TIDE_TERRAIN = "test.tide-terrain";
export const BEAR = "test.bear"; // 2/2 Vanilla für {2}
export const EMBER_WHELP = "test.ember-whelp"; // 1/1 fuer {flame:1}, ETB: 1 Schaden an Ziel
export const COUNTERSPELL = "test.counterspell"; // {1}{tide}, fast, kontert Ziel-Spell
export const BOLT = "test.bolt"; // {flame}, fast, 3 Schaden an Ziel
export const DEATH_TRIGGER_UNIT = "test.crow-herald"; // 1/1, wenn eine eigene Unit stirbt: Controller zieht 1
export const VIGILANT_BEAR = "test.vigilant-bear"; // 2/2, vigilant, für {2}
export const AIRBORNE_UNIT = "test.sky-scout"; // 1/1 airborne für {wild:1}
export const GUARDIAN_UNIT = "test.temple-guard"; // 1/4, guardian, für {1} (defensive Statline, siehe rules-engine.md 6)
export const AMBIGUOUS_ETB_UNIT = "test.growth-sprite"; // 1/1 für {1}, ETB: +1/+1-Marke auf eigene Unit deiner Wahl (mehrdeutig bei >1 eigener Unit)
export const ENEMY_UNIT_TARGET_UNIT = "test.marked-for-death"; // 1/1 für {1}, ETB: zerstöre gegnerische Unit deiner Wahl (fizzled ohne gegnerische Unit)
export const X_BOLT = "test.arcane-surge"; // {x}, fast, X Schaden an Ziel (X-Kosten-Testkarte)
export const SPELL_WATCHER = "test.spell-watcher"; // 1/1 für {1}, wenn Controller einen Zauber wirkt: +1/+1-Marke auf eigene Unit deiner Wahl (mehrdeutig bei >1 eigener Unit)

export function buildTestPool(): CardPool {
  return {
    [FLAME_TERRAIN]: {
      id: FLAME_TERRAIN,
      name: "Testfeuerland",
      type: "terrain",
      set: "test",
      abilities: [
        {
          kind: "activated",
          isManaAbility: true,
          additionalCosts: [{ kind: "tap" }],
          effects: [{ kind: "addMana", color: "flame", amount: 1 }],
          text: "{T}: Erzeuge {flame}.",
        },
      ],
    },
    [TIDE_TERRAIN]: {
      id: TIDE_TERRAIN,
      name: "Testflutland",
      type: "terrain",
      set: "test",
      abilities: [
        {
          kind: "activated",
          isManaAbility: true,
          additionalCosts: [{ kind: "tap" }],
          effects: [{ kind: "addMana", color: "tide", amount: 1 }],
          text: "{T}: Erzeuge {tide}.",
        },
      ],
    },
    [BEAR]: {
      id: BEAR,
      name: "Testbär",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 2,
      toughness: 2,
    },
    [VIGILANT_BEAR]: {
      id: VIGILANT_BEAR,
      name: "Testwächterbär",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 2,
      toughness: 2,
      abilities: [{ kind: "keyword", keyword: "vigilant" }],
    },
    [AIRBORNE_UNIT]: {
      id: AIRBORNE_UNIT,
      name: "Testkundschafter",
      type: "unit",
      set: "test",
      cost: { wild: 1 },
      power: 1,
      toughness: 1,
      abilities: [{ kind: "keyword", keyword: "airborne" }],
    },
    [EMBER_WHELP]: {
      id: EMBER_WHELP,
      name: "Testglutwelpe",
      type: "unit",
      set: "test",
      cost: { flame: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onEnterBattlefield", what: "self" },
          // Bewusst auf "opponent" eingeschränkt (statt "any target" wie im
          // README-Beispiel): die v0.1-Engine wählt Trigger-Ziele automatisch
          // (erstes legales Ziel, siehe triggers.ts-TODO) statt den Spieler
          // wählen zu lassen. Mit "opponent" ist das Ziel eindeutig und der
          // Test bleibt deterministisch/sinnvoll, ohne die offene Frage
          // (Spielerwahl bei Trigger-Zielen) zu verdecken.
          targets: [{ kind: "unitOrPlayer", controller: "opponent" }],
          effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 1 }],
          text: "ETB: 1 Schaden an ein gegnerisches Ziel.",
        },
      ],
    },
    [DEATH_TRIGGER_UNIT]: {
      id: DEATH_TRIGGER_UNIT,
      name: "Testkrähenherold",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onUnitDied", controller: "own" },
          effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          text: "Wenn eine eigene Unit stirbt, ziehe 1 Karte.",
        },
      ],
    },
    [COUNTERSPELL]: {
      id: COUNTERSPELL,
      name: "Testgegenzauber",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { generic: 1, tide: 1 },
      targets: [{ kind: "stackObject", objectKind: "spell" }],
      effects: [{ kind: "counterStackObject", what: { target: 0 } }],
    },
    [BOLT]: {
      id: BOLT,
      name: "Testblitz",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { flame: 1 },
      targets: [{ kind: "unitOrPlayer" }],
      effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 3 }],
    },
    [GUARDIAN_UNIT]: {
      id: GUARDIAN_UNIT,
      name: "Testtempelwache",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 4,
      abilities: [{ kind: "keyword", keyword: "guardian" }],
    },
    [AMBIGUOUS_ETB_UNIT]: {
      id: AMBIGUOUS_ETB_UNIT,
      name: "Testwachssprössling",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onEnterBattlefield", what: "self" },
          // Absichtlich MEHRDEUTIG (mehrere eigene Units sind i.d.R. legal) -
          // Testkarte für den Pending-Decision-Kanal (rules-engine.md 9.7).
          targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
          effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
          text: "ETB: Lege eine +1/+1-Marke auf eine Unit deiner Wahl, die du kontrollierst.",
        },
      ],
    },
    [ENEMY_UNIT_TARGET_UNIT]: {
      id: ENEMY_UNIT_TARGET_UNIT,
      name: "Testtodesmarke",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onEnterBattlefield", what: "self" },
          // Kein Spieler-Fallback (anders als unitOrPlayer) - testet den
          // "kein legales Ziel -> Trigger verpufft"-Pfad (rules-engine.md 5).
          targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
          effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
          text: "ETB: Zerstöre eine gegnerische Unit deiner Wahl.",
        },
      ],
    },
    [X_BOLT]: {
      id: X_BOLT,
      name: "Testarkanschub",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { x: true },
      targets: [{ kind: "unitOrPlayer" }],
      effects: [{ kind: "dealDamage", to: { target: 0 }, amount: { kind: "x" } }],
    },
    [SPELL_WATCHER]: {
      id: SPELL_WATCHER,
      name: "Testzauberwächter",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          // Fürs "resumePriorityTo nach PendingDecision"-Testszenario
          // (rules-engine.md 9.7 letzter Absatz): reagiert auf den eigenen
          // Cast (auch fast/instant-speed), mehrdeutiges Ziel wie bei
          // AMBIGUOUS_ETB_UNIT.
          trigger: { kind: "onSpellCast", caster: "own" },
          targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "own" }],
          effects: [{ kind: "addCounters", what: { target: 0 }, counterType: "plus1plus1", count: 1 }],
          text: "Wenn du einen Zauber wirkst: Lege eine +1/+1-Marke auf eine Unit deiner Wahl, die du kontrollierst.",
        },
      ],
    },
  };
}

/** Baut eine Decklist mit `count` Kopien jeder übergebenen Definition-ID (min. genug für Tests, keine 40er-Pflicht). */
export function buildDecklist(entries: Array<[string, number]>): Record<string, number> {
  const deck: Record<string, number> = {};
  for (const [id, count] of entries) deck[id] = count;
  return deck;
}

/** Standard-Testdeck: reichlich Terrains + ein paar Units/Spells, damit Starthand+Ziehen nie die Library leeren. */
export function standardTestDecks(): Record<PlayerId, Record<string, number>> {
  const deck = buildDecklist([
    [FLAME_TERRAIN, 10],
    [TIDE_TERRAIN, 10],
    [BEAR, 4],
    [EMBER_WHELP, 4],
    [COUNTERSPELL, 4],
    [BOLT, 4],
    [DEATH_TRIGGER_UNIT, 4],
    [VIGILANT_BEAR, 2],
    [AIRBORNE_UNIT, 2],
  ]);
  return { player1: { ...deck }, player2: { ...deck } };
}
