# Deckbuilder — Projektübersicht

MTG-artiger Deckbuilder als Hobby-/Lernprojekt. Vier Agent-Rollen:
**game-architect** (Regelwerk + Datenmodell), **engine-engineer** (Spiellogik),
**card-designer** (Kartenpool + Balancing), **frontend-engineer** (UI).

## Aktueller Stand (2026-07-08, Regelwerk/Modell v0.2.1)

| Artefakt | Pfad | Status |
|---|---|---|
| Regelwerk (Phasen, Priority, Stack, SBAs, Trade-offs) | `docs/rules-engine.md` | **v0.2.1**, verbindlich — v0.2 beantwortet die offenen Fragen aus engine-status.md/starter-set.md; v0.2.1 ergänzt Priority-Wiederaufnahme nach Decision-Pause |
| Effekt-/Fähigkeiten-DSL | `src/model/abilities.ts` | Typen fertig (v0.2: guardian final, X-Kosten geklärt, targets-los bestätigt) |
| Kartendefinitionen (6 Kartentypen, Kosten, Decks) | `src/model/cards.ts` | Typen fertig (v0.2: Aura-attachedTo geklärt) |
| Spielzustand, Stack, Aktionen, Events, Engine-Interface | `src/model/game-state.ts` | Typen fertig (v0.2: PendingDecision/resolveDecision, CreateGameConfig ohne pool, Factory-Vertrag; v0.2.1: resumePriorityTo) |
| Zentrale Exports | `src/model/index.ts` | fertig |
| Engine-Implementierung (Kern: Phasen/Priority/Stack/SBA/Trigger/Decisions/Combat inkl. guardian, X) | `src/engine/*`, Status: `docs/engine-status.md` | v0.2 fertig (47 Tests grün); v0.2.1-Fix `resumePriorityTo` offen (siehe unten) |
| Kartenpool / Starter-Set (25 Karten, Validierungspaket) | `src/cards/starter-set.ts`, `docs/cards/starter-set.md` | v0.1 fertig; voller core-Pool offen |
| UI | — | offen (frontend-engineer) |
| Projekt-Setup (package.json, tsconfig, Testrunner) | `package.json`, `tsconfig.json` (Vitest) | fertig |

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

## Nächste Schritte (nach Architect-Entscheidungen v0.2)

Alle offenen Fragen aus `docs/engine-status.md` und `docs/cards/starter-set.md`
sind entschieden — Details in `docs/rules-engine.md` (v0.2-Changelog im Kopf,
Abschnitte 1a, 4, 5, 6, 9.6, 9.7, 10).

### engine-engineer
Die v0.2-Anpassungen (Factory, Münzwurf, Pending Decisions/`chooseTriggerTargets`,
guardian, X-Kosten) sind **umgesetzt** (47 Tests grün, siehe `docs/engine-status.md`).
Verbleibend:
1. **v0.2.1:** Priority-Wiederaufnahme nach Decision-Pause über das neue Feld
   `GameState.resumePriorityTo` (rules-engine.md 9.7, letzter Absatz) — ersetzt
   den Fallback „nach Decision immer activePlayer" in `turn.ts#openPriorityWindow`.
   Testfall: nicht-aktiver Spieler castet einen Instant mit mehrdeutigem Trigger;
   nach `resolveDecision` muss ER Priority erhalten, nicht der aktive Spieler.
2. StaticAbility-Test nachziehen, sobald der card-designer eine Testkarte liefert.
3. Danach nach Bedarf: Migration von `chooseManaColor`/`chooseDiscard`/`orderScry`
   auf den Decision-Kanal (rules-engine.md 9.7), gesteuert vom Kartenpool-Ausbau.

### card-designer
1. Blocker aufgehoben: `guardian` ist final (rules-engine.md 6, inkl.
   Balancing-Einordnung) und X-Kosten sind geklärt (rules-engine.md 4; nur auf
   Spells) — ein X-Spell und weitere guardian-Karten sind jetzt designbar.
   Bestätigt: Effekte ohne `targets`-Array regulär; eine Aura = ein
   Anlege-Objekt; „Relics möglichst farblos" als Design-Linie.
2. Vollen core-Pool ausbauen (40–60 Karten) in `src/cards/starter-set.ts` oder
   `src/cards/core.ts`; dabei bitte eine Karte mit `StaticAbility` früh liefern
   (Engine braucht sie als Testkarte) und die bisher ungenutzten Primitive abdecken.
   Vorsicht bei scry-/Farbwahl-/Discard-Kosten-Karten: Auto-Defaults gelten, bis
   die Engine sie auf den Decision-Kanal migriert (rules-engine.md 9.7).
3. Mechanik-Wünsche außerhalb der DSL weiterhin über game-architect.

### frontend-engineer
1. Engine-API ist nutzbar (Grenzen: `docs/engine-status.md`, Abschnitt „Für
   frontend-engineer"). Zusätzlich einplanen: `pendingDecision`-Anzeige
   (Dialog/Panel, solange gesetzt; Antwort via `resolveDecision`) — kommt mit
   der v0.2-Engine-Anpassung.
2. Pflicht-Anzeigen (rules-engine.md Abschnitt 3): wer hat Priority,
   Stack-Inhalt von unten nach oben, Pass-Button; Zonen Hand/Battlefield/Graveyard,
   Leben, Manapool, aktueller Step.
3. Keine Regellogik im Frontend — Legalität kommt aus `getLegalActions`
   (Achtung: bewusst nicht erschöpfend, siehe Interface-Kommentar; für
   Mehrfach-Ziele/X eigene Eingabe-UI bauen und `applyAction` validieren lassen).

### game-architect (Folgearbeit)
- Verbleibende offene Punkte: rules-engine.md Abschnitt 10 („Weiterhin offen").
- Nächste erwartbare Anfragen: Modal-Effekte, X auf aktivierten Fähigkeiten,
  Spielerwahl bei Trigger-Reihenfolge (alle als Kandidaten für den
  Pending-Decision-Kanal vorgemerkt).
