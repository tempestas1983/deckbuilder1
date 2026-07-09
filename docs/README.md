# Deckbuilder — Projektübersicht

MTG-artiger Deckbuilder als Hobby-/Lernprojekt. Vier Agent-Rollen:
**game-architect** (Regelwerk + Datenmodell), **engine-engineer** (Spiellogik),
**card-designer** (Kartenpool + Balancing), **frontend-engineer** (UI).

## Aktueller Stand (2026-07-09, Regelwerk/Modell v0.2.1)

| Artefakt | Pfad | Status |
|---|---|---|
| Regelwerk (Phasen, Priority, Stack, SBAs, Trade-offs) | `docs/rules-engine.md` | **v0.2.1**, verbindlich — v0.2 beantwortet die offenen Fragen aus engine-status.md/starter-set.md; v0.2.1 ergänzt Priority-Wiederaufnahme nach Decision-Pause |
| Effekt-/Fähigkeiten-DSL | `src/model/abilities.ts` | Typen fertig (v0.2: guardian final, X-Kosten geklärt, targets-los bestätigt) |
| Kartendefinitionen (6 Kartentypen, Kosten, Decks) | `src/model/cards.ts` | Typen fertig (v0.2: Aura-attachedTo geklärt) |
| Spielzustand, Stack, Aktionen, Events, Engine-Interface | `src/model/game-state.ts` | Typen fertig (v0.2: PendingDecision/resolveDecision, CreateGameConfig ohne pool, Factory-Vertrag; v0.2.1: resumePriorityTo) |
| Zentrale Exports | `src/model/index.ts` | fertig |
| Engine-Implementierung (Kern: Phasen/Priority/Stack/SBA/Trigger/Decisions/Combat inkl. guardian, X) | `src/engine/*`, Status: `docs/engine-status.md` | **v0.2.1 fertig** (48 Tests grün) — `resumePriorityTo` umgesetzt und regressionsgetestet |
| Kartenpool / Starter-Set (27 Karten, Validierungspaket) | `src/cards/starter-set.ts`, `docs/cards/starter-set.md` | v0.2 fertig (inkl. X-Kosten-Karte, static-Testkarte); voller core-Pool (40–60 Karten) offen |
| UI (Spielbrett, Vite + TypeScript) | `src/ui/*`, Status: `docs/frontend-status.md` | **v0.1.1 fertig** — Golden Path im Browser verifiziert (Untap/Upkeep/Draw → Main → Terrain/Karte spielen), inkl. Pass-Priority-Fix |
| Projekt-Setup (package.json, tsconfig, Vitest, Vite) | `package.json`, `tsconfig.json`, `vite.config.ts` | fertig |
| Git-Repo | https://github.com/tempestas1983/deckbuilder1 | Initial-Commit auf `main` gepusht |

Tech-Stack-Annahme: TypeScript überall; Engine als reines, UI-freies Paket
(pure Funktionen, seedbarer RNG), damit das spätere TS/JS-Frontend (Framework-Wahl
frei, Vorschlag: Vite + React) sie direkt importieren kann. Karten sind
JSON-serialisierbare Daten (keine Karten-spezifischen Codefunktionen).

## Kernentscheidungen (Details in rules-engine.md, Abschnitt 9)

1. **Hybrid statt Event-Sourcing:** `applyAction(state, action) → { state', events[] }`;
   GameState ist die Wahrheit, GameEvents dienen Frontend/Log/Triggern.
2. **Trigger nach MTG-Muster:** Pending-Queue → APNAP auf den Stack → LIFO mit Antwortfenster.
3. **Kein Layer-System:** feste Berechnungsreihenfolge für statische Effekte (Basis → Marken → Timestamp).
4. **Effekte als Daten-DSL:** geschlossener Primitiv-Satz, Erweiterung nur über game-architect.
5. **Engine-Konstruktion per Factory (v0.2):** `createRulesEngine(pool)` bindet den CardPool
   einmalig; `GameState` bleibt poolfrei serialisierbar.
6. **Pending Decisions (v0.2):** ein generischer Kanal (`pendingDecision` + `resolveDecision`)
   für alle Spielerentscheidungen mitten in der Abwicklung (Trigger-Ziele, später scry/Farbwahl/Modal).

## Beispielkarte (zur Orientierung für den Card-Designer)

```ts
import type { UnitCard, SpellCard } from "../src/model";

const emberWhelp: UnitCard = {
  id: "core.ember-whelp",
  name: "Glutwelpe",
  type: "unit",
  subtypes: ["Drache"],
  cost: { generic: 1, flame: 1 },
  power: 2,
  toughness: 1,
  abilities: [
    { kind: "keyword", keyword: "airborne" },
    {
      kind: "triggered",
      trigger: { kind: "onEnterBattlefield", what: "self" },
      targets: [{ kind: "unitOrPlayer" }],
      effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 1 }],
      text: "Wenn der Glutwelpe ins Spiel kommt, füge einem Ziel 1 Schaden zu.",
    },
  ],
  rarity: "common",
  set: "core",
};

const tidalRebuke: SpellCard = {
  id: "core.tidal-rebuke",
  name: "Gezeitenschelte",
  type: "spell",
  speed: "fast",
  cost: { generic: 1, tide: 1 },
  targets: [{ kind: "permanent", cardTypes: ["unit"] }],
  effects: [{ kind: "returnToHand", what: { target: 0 } }],
  rulesText: "Bringe eine Unit deiner Wahl auf die Hand ihres Besitzers zurück.",
  rarity: "common",
  set: "core",
};
```

## Nächste Schritte

Engine (v0.2.1), Starter-Kartenset (v0.2, 27 Karten) und erstes Spielbrett-UI
(v0.1.1) sind alle fertig und end-to-end verifiziert (Engine: 48 Vitest-Tests;
UI: manueller Klick-Durchlauf durch Untap/Upkeep/Draw/Main + Terrain spielen im
Browser). Details je Bereich in `docs/engine-status.md`,
`docs/cards/starter-set.md`, `docs/frontend-status.md`.

Offene Punkte für die nächste Iteration (keiner davon blockiert das Spielen):

### engine-engineer
1. StaticAbility-Test ergänzen (`core.iron-standard` existiert jetzt im
   Starter-Set als Testkarte, siehe `docs/engine-status.md` Lücke 7).
2. Migration von `chooseManaColor`/`chooseDiscard`/`orderScry` auf den
   Pending-Decision-Kanal (rules-engine.md 9.7), sobald Kartenpool das braucht.
3. Mana-Fähigkeiten mit X-Kosten (rules-engine.md 10, bestätigter offener Punkt).

### card-designer
1. Vollen core-Pool ausbauen (40–60 Karten) in `src/cards/starter-set.ts` oder
   `src/cards/core.ts`; die bisher ungenutzten Primitive (`scry`,
   `createToken`, `grantKeyword`, `costChange`) abdecken.
2. Karten mit >1 Zielslot sind bisher ungetestet (weder Engine noch UI) —
   beim Design berücksichtigen, dass das noch Ausbauarbeit auf beiden Seiten
   nach sich zieht.

### frontend-engineer
1. UI-Tests dauerhaft ins Repo (Vitest+jsdom) statt nur manueller Verifikation.
2. `concede`-Button ergänzen.
3. `computeEffectiveStats`/`computeEffectiveKeywords` offiziell in den
   `RulesEngine`-Vertrag heben (aktuell bewusster Re-Use einer als „nicht
   stabil" markierten Engine-API, siehe `docs/frontend-status.md` Grenzfall).
4. Mehrfach-Zielslot-Unterstützung in der `xTarget`-UI, sobald Karten das brauchen.

### game-architect (Folgearbeit)
- Verbleibende offene Punkte: rules-engine.md Abschnitt 10 („Weiterhin offen").
- Nächste erwartbare Anfragen: Modal-Effekte, X auf aktivierten Fähigkeiten,
  Spielerwahl bei Trigger-Reihenfolge, `computeEffectiveStats`-Vertragsfrage
  vom frontend-engineer (siehe oben).
