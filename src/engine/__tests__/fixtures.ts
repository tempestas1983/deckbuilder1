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
export const LIFELINK_UNIT = "test.blood-drinker"; // 2/2, lifelink, für {1} (rules-engine.md 6c/9.8-Combat-Tests)
export const DAMAGE_TRIGGER_UNIT = "test.blood-hunter"; // 1/1 für {1}, wenn diese Unit dem Gegner Kampfschaden zufügt: Controller zieht 1 (rules-engine.md 6c-Regressionstest: darf bei Schaden <= 0 NICHT feuern)

// v0.2.3 Kampf-Keyword-Paket (rules-engine.md 6d/9.9):
export const TRAMPLE_UNIT = "test.rampaging-boar"; // 4/4, trample, für {2} (Basiswert, wird in Tests meist geboostet)
export const FIRST_STRIKE_UNIT = "test.duelist"; // 2/2, firstStrike, für {2}
export const DEATHTOUCH_UNIT = "test.viper"; // 1/1, deathtouch, für {1}
export const FIRST_STRIKE_DEATHTOUCH_UNIT = "test.assassin"; // 1/1, firstStrike + deathtouch, für {2} (Kombinatorik-Testkarte)
export const FIRST_STRIKE_TRAMPLE_UNIT = "test.lancer"; // 4/4, firstStrike + trample, für {3} (Kombinatorik-Testkarte)
export const TRAMPLE_DEATHTOUCH_UNIT = "test.plague-boar"; // 4/4, trample + deathtouch, für {3} (Kombinatorik-Testkarte)

// costChange-Testkarten (Static-Modifier, siehe stats.ts#computeSpellCostDelta):
export const COST_REDUCER_RELIC = "test.cheap-forge"; // {generic:2}, static: eigene Sprüche kosten {1} weniger (generisch)
export const COST_TAX_RELIC = "test.tariff-post"; // {generic:2}, static: gegnerische Sprüche kosten {1} mehr (generisch)
export const CHEAP_VANILLA_SPELL = "test.spark"; // {generic:2}, fast, spell ohne Effekt-Ziel (No-Op-Test für Kostenänderung)

// v0.3 onDamageReceived (rules-engine.md 5 + Entscheidung 9.10):
export const ENRAGE_UNIT = "test.enrage-boar"; // 2/6 für {generic:2}, wenn Schaden erhalten: 1 Schaden an die Schadensquelle (eventSubject)

// v0.3 X-Kosten auf aktivierten Fähigkeiten (rules-engine.md 4 + Entscheidung 9.12):
export const X_ABILITY_RELIC = "test.mana-siphon"; // {generic:1} Relic, {X}: X Schaden an Ziel (X-Kosten-Testfähigkeit)
export const ILLEGAL_MANA_X_RELIC = "test.broken-font"; // {generic:1} Relic, Mana-Fähigkeit MIT X-Kosten (laut 9.12 illegale Definition, für den Verbots-Test)

// v0.3 Modal-Effekte "wähle eines -" (rules-engine.md 4 + Entscheidung 9.13):
export const MODAL_CHARM_SPELL = "test.tactician-charm"; // {generic:1}, fast, 2 Modi: (a) zerstöre gegnerische Unit deiner Wahl (b) ziehe 1 Karte (kein Ziel)
export const MODAL_ABILITY_RELIC = "test.trickster-idol"; // {generic:1} Relic, aktivierte Fähigkeit {generic:1} mit 2 Modi: (a) 1 Schaden an Ziel (b) gewinne 1 Leben
export const MODAL_TRIGGER_UNIT = "test.omen-oracle"; // 1/1 für {generic:1}, ETB modal: (a) zerstöre gegnerische Unit deiner Wahl (b) ziehe 1 Karte (kein Ziel) - für chooseMode-Decision inkl. Auto-Pick-Fall

// Regressionstest-Karte für den getLegalActions-Bugfix (legal-actions.ts#additionalCostsPayable,
// docs/engine-status.md): drei aktivierte Fähigkeiten mit je einer der drei
// AdditionalCost-Varianten, die vor dem Fix NICHT auf Bezahlbarkeit geprüft
// wurden (removeCounters/payLife/discardCards - "tap" war immer schon geprüft).
export const UNAFFORDABLE_COSTS_RELIC = "test.overcosted-trinket";

// Regressionstest-Karte für den combat.ts-Engine-Bug (docs/engine-status.md,
// v0.3.3): 2/2-TOKEN ohne Keywords, damit ein Kampfteilnehmer in der
// firstStrike-Zwischenrunde per SBA 7 (zones.ts#removeTokenPermanently)
// ENDGÜLTIG aus state.cards gelöscht wird, statt (wie eine normale Karte)
// nur permanentState zu verlieren - genau das ist die Vorbedingung des Bugs.
export const TOKEN_BEAR = "test.bear-token"; // 2/2 Vanilla-TOKEN für {2}

// Regressionstest-Karte für den effects.ts-Engine-Bug (docs/engine-status.md,
// v0.3.4 / rules-engine.md Entscheidung 9.14): destroyPermanent/exilePermanent/
// returnToHand riefen `leaveBattlefield` bislang UNGEGUARDET auf, sobald der
// Empfänger (hier: "eventSubject") kein Battlefield-Permanent mehr war - bei
// einer bereits gelöschten Token-Instanz (SBA 7) ein Crash, bei einer Karte im
// Friedhof eine versehentliche Zonen-Manipulation. Diese Karte kombiniert alle
// drei betroffenen Effekte MIT einem harmlosen drawCards-Effekt im selben
// Trigger, um beides zu belegen: kein Crash/keine Zonenänderung UND die
// übrigen Effekte desselben Triggers wirken normal weiter.
export const DEATH_REMOVAL_UNIT = "test.grave-keeper"; // 1/1 für {1}, wenn eine eigene Unit stirbt: ziehe 1 Karte, versuche danach die gestorbene Unit (eventSubject) zu zerstören/exilieren/zurückzuholen (muss still ins Leere laufen)

// Regressionstest-Karten für die zonenbasierte Todesdefinition (docs/engine-status.md,
// v0.3.5 / rules-engine.md Entscheidung 9.15): "Stirbt" = Battlefield -> Graveyard,
// ursachenunabhängig (SBA 3/4, destroyPermanent, sacrificeSelf-Kosten), onDeath{self}
// dabei typ-agnostisch; exilePermanent/returnToHand sind bewusst KEIN Tod.
export const SELF_DEATH_UNIT = "test.wisp-harvester"; // 2/1 UNIT für {1}, onDeath self: ziehe 1 Karte; PLUS aktivierte Fähigkeit mit sacrificeSelf-Zusatzkosten (gewinne 1 Leben), um denselben Tod-Pfad testen zu können
export const SELF_DEATH_RELIC = "test.parting-ward"; // Relic (NICHT-Unit) für {1}, onDeath self: ziehe 1 Karte (Regressionstest: onDeath ist typ-agnostisch) - PLUS aktivierte Fähigkeit mit sacrificeSelf-Zusatzkosten
export const DESTROY_ANY_SPELL = "test.reap-edict"; // {generic:1}, fast, zerstöre ein beliebiges gegnerisches Permanent (Unit ODER Nicht-Unit) deiner Wahl
export const EXILE_ANY_SPELL = "test.banish-rite"; // {generic:1}, fast, verbanne ein beliebiges Permanent deiner Wahl (Regressionstest: KEIN Tod, onDeath darf NICHT feuern)
export const RETURN_ANY_SPELL = "test.recall-rite"; // {generic:1}, fast, hole ein beliebiges Permanent deiner Wahl auf die Hand zurück (Regressionstest: KEIN Tod, onDeath darf NICHT feuern)

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
    [LIFELINK_UNIT]: {
      id: LIFELINK_UNIT,
      name: "Testblutsauger",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 2,
      toughness: 2,
      abilities: [{ kind: "keyword", keyword: "lifelink" }],
    },
    [DAMAGE_TRIGGER_UNIT]: {
      id: DAMAGE_TRIGGER_UNIT,
      name: "Testblutjäger",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onDealtCombatDamageToPlayer", what: "self" },
          effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          text: "Wenn diese Unit dem Gegner Kampfschaden zufügt, ziehe 1 Karte.",
        },
      ],
    },
    [TRAMPLE_UNIT]: {
      id: TRAMPLE_UNIT,
      name: "Testwildschwein",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 4,
      toughness: 4,
      abilities: [{ kind: "keyword", keyword: "trample" }],
    },
    [FIRST_STRIKE_UNIT]: {
      id: FIRST_STRIKE_UNIT,
      name: "Testduellant",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 2,
      toughness: 2,
      abilities: [{ kind: "keyword", keyword: "firstStrike" }],
    },
    [DEATHTOUCH_UNIT]: {
      id: DEATHTOUCH_UNIT,
      name: "Testviper",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [{ kind: "keyword", keyword: "deathtouch" }],
    },
    [FIRST_STRIKE_DEATHTOUCH_UNIT]: {
      id: FIRST_STRIKE_DEATHTOUCH_UNIT,
      name: "Testassassine",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 1,
      toughness: 1,
      abilities: [
        { kind: "keyword", keyword: "firstStrike" },
        { kind: "keyword", keyword: "deathtouch" },
      ],
    },
    [FIRST_STRIKE_TRAMPLE_UNIT]: {
      id: FIRST_STRIKE_TRAMPLE_UNIT,
      name: "Testlanzenreiter",
      type: "unit",
      set: "test",
      cost: { generic: 3 },
      power: 4,
      toughness: 4,
      abilities: [
        { kind: "keyword", keyword: "firstStrike" },
        { kind: "keyword", keyword: "trample" },
      ],
    },
    [TRAMPLE_DEATHTOUCH_UNIT]: {
      id: TRAMPLE_DEATHTOUCH_UNIT,
      name: "Testseuchenschwein",
      type: "unit",
      set: "test",
      cost: { generic: 3 },
      power: 4,
      toughness: 4,
      abilities: [
        { kind: "keyword", keyword: "trample" },
        { kind: "keyword", keyword: "deathtouch" },
      ],
    },
    [COST_REDUCER_RELIC]: {
      id: COST_REDUCER_RELIC,
      name: "Testbilligschmiede",
      type: "relic",
      set: "test",
      cost: { generic: 2 },
      abilities: [
        {
          kind: "static",
          scope: { kind: "ownUnits" }, // ohne Wirkung für costChange, siehe stats.ts#computeSpellCostDelta
          modifier: { kind: "costChange", appliesTo: "ownSpells", genericDelta: -1 },
          text: "Deine Zaubersprüche kosten {1} weniger (generisch).",
        },
      ],
    },
    [COST_TAX_RELIC]: {
      id: COST_TAX_RELIC,
      name: "Testzollposten",
      type: "relic",
      set: "test",
      cost: { generic: 2 },
      abilities: [
        {
          kind: "static",
          scope: { kind: "allUnits" }, // ohne Wirkung für costChange, siehe stats.ts#computeSpellCostDelta
          modifier: { kind: "costChange", appliesTo: "opponentSpells", genericDelta: 1 },
          text: "Zaubersprüche des Gegners kosten {1} mehr (generisch).",
        },
      ],
    },
    [CHEAP_VANILLA_SPELL]: {
      id: CHEAP_VANILLA_SPELL,
      name: "Testfunke",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { generic: 2 },
      effects: [],
    },
    [ENRAGE_UNIT]: {
      id: ENRAGE_UNIT,
      name: "Testwuteber",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 2,
      toughness: 6,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onDamageReceived", what: "self" },
          effects: [{ kind: "dealDamage", to: "eventSubject", amount: 1 }],
          text: "Wenn diese Unit Schaden erhält, füge der Schadensquelle 1 Schaden zu.",
        },
      ],
    },
    [X_ABILITY_RELIC]: {
      id: X_ABILITY_RELIC,
      name: "Testmanaschöpfer",
      type: "relic",
      set: "test",
      cost: { generic: 1 },
      abilities: [
        {
          kind: "activated",
          manaCost: { x: true },
          targets: [{ kind: "unitOrPlayer" }],
          effects: [{ kind: "dealDamage", to: { target: 0 }, amount: { kind: "x" } }],
          text: "{X}: X Schaden an Zieleinheit oder -spieler.",
        },
      ],
    },
    [ILLEGAL_MANA_X_RELIC]: {
      id: ILLEGAL_MANA_X_RELIC,
      name: "Testfehlbrunnen",
      type: "relic",
      set: "test",
      cost: { generic: 1 },
      // v0.3 (9.12): laut Regelwerk illegale Definition (Mana-Fähigkeit MIT
      // X-Kosten) - existiert NUR für den Ablehnungs-Test in ability-x-cost.
      abilities: [
        {
          kind: "activated",
          isManaAbility: true,
          manaCost: { x: true },
          additionalCosts: [{ kind: "tap" }],
          effects: [{ kind: "addMana", color: "flame", amount: { kind: "x" } }],
          text: "{X}, {T}: Erzeuge X {flame} (illegal laut 9.12).",
        },
      ],
    },
    [MODAL_CHARM_SPELL]: {
      id: MODAL_CHARM_SPELL,
      name: "Testtaktikcharme",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { generic: 1 },
      effects: [],
      modes: [
        {
          text: "Zerstöre eine gegnerische Unit deiner Wahl.",
          targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
          effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
        },
        {
          text: "Ziehe 1 Karte.",
          effects: [{ kind: "drawCards", who: "controller", count: 1 }],
        },
      ],
    },
    [MODAL_ABILITY_RELIC]: {
      id: MODAL_ABILITY_RELIC,
      name: "Testgauklerfigur",
      type: "relic",
      set: "test",
      cost: { generic: 1 },
      abilities: [
        {
          kind: "activated",
          manaCost: { generic: 1 },
          effects: [],
          modes: [
            {
              text: "1 Schaden an Zieleinheit oder -spieler.",
              targets: [{ kind: "unitOrPlayer" }],
              effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 1 }],
            },
            {
              text: "Gewinne 1 Leben.",
              effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
            },
          ],
          text: "{1}: Wähle eines - 1 Schaden an Zieleinheit/-spieler; oder gewinne 1 Leben.",
        },
      ],
    },
    [MODAL_TRIGGER_UNIT]: {
      id: MODAL_TRIGGER_UNIT,
      name: "Testomenorakel",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onEnterBattlefield", what: "self" },
          effects: [],
          modes: [
            {
              text: "Zerstöre eine gegnerische Unit deiner Wahl.",
              targets: [{ kind: "permanent", cardTypes: ["unit"], controller: "opponent" }],
              effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
            },
            {
              text: "Ziehe 1 Karte.",
              effects: [{ kind: "drawCards", who: "controller", count: 1 }],
            },
          ],
          text: "ETB - Wähle eines: zerstöre eine gegnerische Unit deiner Wahl; oder ziehe 1 Karte.",
        },
      ],
    },
    [UNAFFORDABLE_COSTS_RELIC]: {
      id: UNAFFORDABLE_COSTS_RELIC,
      name: "Testüberteuertes Trinket",
      type: "relic",
      set: "test",
      cost: { generic: 1 },
      abilities: [
        {
          kind: "activated",
          additionalCosts: [{ kind: "removeCounters", counterType: "charge", count: 1 }],
          effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
          text: "Entferne eine Ladungsmarke: gewinne 1 Leben. (Regressionstest removeCounters, abilityIndex 0)",
        },
        {
          kind: "activated",
          additionalCosts: [{ kind: "payLife", amount: 25 }],
          effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
          text: "Bezahle 25 Leben: gewinne 1 Leben. (Regressionstest payLife, absichtlich nie bezahlbar bei Startleben 20, abilityIndex 1)",
        },
        {
          kind: "activated",
          additionalCosts: [{ kind: "discardCards", count: 10 }],
          effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
          text: "Wirf 10 Karten ab: gewinne 1 Leben. (Regressionstest discardCards, abilityIndex 2)",
        },
      ],
    },
    [TOKEN_BEAR]: {
      id: TOKEN_BEAR,
      name: "Testbärentoken",
      type: "unit",
      set: "test",
      cost: { generic: 2 },
      power: 2,
      toughness: 2,
      isToken: true,
    },
    [DEATH_REMOVAL_UNIT]: {
      id: DEATH_REMOVAL_UNIT,
      name: "Testgruftwächter",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 1,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onUnitDied", controller: "own" },
          effects: [
            { kind: "drawCards", who: "controller", count: 1 },
            { kind: "destroyPermanent", what: "eventSubject" },
            { kind: "exilePermanent", what: "eventSubject" },
            { kind: "returnToHand", what: "eventSubject" },
          ],
          text:
            "Wenn eine eigene Unit stirbt: ziehe 1 Karte. (Regressionstest 9.14: " +
            "destroyPermanent/exilePermanent/returnToHand auf eventSubject laufen " +
            "bei einem bereits toten Objekt still ins Leere.)",
        },
      ],
    },
    [SELF_DEATH_UNIT]: {
      id: SELF_DEATH_UNIT,
      name: "Testwispernte",
      type: "unit",
      set: "test",
      cost: { generic: 1 },
      power: 2,
      toughness: 1,
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onDeath", what: "self" },
          effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          text: "Wenn diese Unit stirbt, ziehe 1 Karte.",
        },
        {
          kind: "activated",
          additionalCosts: [{ kind: "sacrificeSelf" }],
          effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
          text:
            "Opfere diese Unit: gewinne 1 Leben. (Regressionstest 9.15: onDeath muss " +
            "auch beim sacrificeSelf-Todespfad feuern, abilityIndex 1.)",
        },
      ],
    },
    [SELF_DEATH_RELIC]: {
      id: SELF_DEATH_RELIC,
      name: "Testabschiedswarte",
      type: "relic",
      set: "test",
      cost: { generic: 1 },
      abilities: [
        {
          kind: "triggered",
          trigger: { kind: "onDeath", what: "self" },
          effects: [{ kind: "drawCards", who: "controller", count: 1 }],
          text:
            "Wenn dieses Relic stirbt, ziehe 1 Karte. (Regressionstest 9.15: onDeath " +
            "ist typ-agnostisch, feuert also auch für Nicht-Units.)",
        },
        {
          kind: "activated",
          additionalCosts: [{ kind: "sacrificeSelf" }],
          effects: [{ kind: "gainLife", who: "controller", amount: 1 }],
          text: "Opfere dieses Relic: gewinne 1 Leben. (sacrificeSelf-Todespfad, Nicht-Unit.)",
        },
      ],
    },
    [DESTROY_ANY_SPELL]: {
      id: DESTROY_ANY_SPELL,
      name: "Testerntenritual",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { generic: 1 },
      // Bewusst OHNE cardTypes-Filter (= alle Permanent-Typen legal) - deckt
      // sowohl Unit- als auch Nicht-Unit-Ziele für den 9.15-Regressionstest ab.
      targets: [{ kind: "permanent", controller: "opponent" }],
      effects: [{ kind: "destroyPermanent", what: { target: 0 } }],
    },
    [EXILE_ANY_SPELL]: {
      id: EXILE_ANY_SPELL,
      name: "Testbannritual",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { generic: 1 },
      targets: [{ kind: "permanent", controller: "opponent" }],
      effects: [{ kind: "exilePermanent", what: { target: 0 } }],
    },
    [RETURN_ANY_SPELL]: {
      id: RETURN_ANY_SPELL,
      name: "Testrückrufritual",
      type: "spell",
      speed: "fast",
      set: "test",
      cost: { generic: 1 },
      targets: [{ kind: "permanent", controller: "opponent" }],
      effects: [{ kind: "returnToHand", what: { target: 0 } }],
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
