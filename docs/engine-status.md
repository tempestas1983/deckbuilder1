# Engine-Status

Status: v0.2.1 (engine-engineer) — 2026-07-08
Grundlage: `docs/rules-engine.md` (Regelwerk v0.2.1), `src/model/*` (Datenmodell v0.2.1, unverändert konsumiert).
Code: `src/engine/*`. Tests: `src/engine/__tests__/*.test.ts` (Vitest, 48 Tests, alle grün).

Dieses Dokument richtet sich an frontend-engineer (worauf aufbauen?), card-designer
(welche DSL-Primitive funktionieren zuverlässig?) und game-architect (offene
Klärungspunkte, siehe Abschnitt "Offene Fragen").

## v0.2.1-Fix: `resumePriorityTo` (Reaktion auf Architect-Entscheidung)

Der in v0.2 dokumentierte offene Punkt "Priority-Empfänger nach einer
PendingDecision-Pause geht verloren" ist behoben. Der Architect hat dafür
`GameState.resumePriorityTo?: PlayerId` eingeführt (rules-engine.md 9.7,
letzter Absatz). Umsetzung:

- `turn.ts#openPriorityWindow`: setzt `resumePriorityTo = recipient` statt
  `priorityPlayer` direkt zu vergeben, wenn eine PendingDecision pausiert;
  vergibt sonst normal und leert `resumePriorityTo`.
- `turn.ts#resumePriorityAfterDecision` (neu): wird nach `resolveDecision`
  statt des bisherigen `openPriorityWindow(..., activePlayer)`-Fallbacks
  aufgerufen - läuft die Vor-Priority-Schleife erneut (weitere Trigger dürfen
  wieder pausieren, `resumePriorityTo` bleibt dabei unverändert stehen -
  Decision-Ketten funktionieren also), vergibt bei Abschluss an
  `resumePriorityTo` und leert es danach.
- `actions.ts`: der einfache Pass-Weiterreich-Pfad (ein Spieler passt, Priority
  geht an den anderen) merkt sich den vorgesehenen Empfänger jetzt VOR dem
  SBA-/Trigger-Check, damit er bei einer Pause korrekt in `resumePriorityTo`
  landet, statt verloren zu gehen. `turn.ts#finishCleanup`s Extra-Fenster
  (Cleanup-Ausnahme) setzt `resumePriorityTo` ebenso konsistent auf
  `activePlayer` (dort ist das immer der vorgesehene Empfänger).
- Neuer Regressionstest (`pending-decision.test.ts`, Block
  "resumePriorityTo"): nicht-aktiver Spieler castet einen Instant, dessen
  eigener Cast einen mehrdeutigen Trigger auslöst (Testkarte `SPELL_WATCHER`
  in `fixtures.ts`) - nach `resolveDecision` bekommt GENAU dieser Spieler
  (nicht `activePlayer`) die Priority zurück. Testet nebenbei auch den
  "einfaches Pass-Weiterreichen"-Codepfad end-to-end.

Nebenbei behoben: `tsconfig.json` fehlte `"DOM"` in `lib` - das führte zu
Type-Errors in den (parallel entstandenen) `src/ui/*`-Dateien des
frontend-engineers (`document`/`HTMLElement`/`Node` unauffindbar). Ergänzt,
da das reine Build-Setup-Infrastruktur ist. Die übrigen, unabhängig davon
bestehenden Typfehler in `src/ui/*` (`cardInfo.ts`, `store.ts`,
`components/cardTile.ts` - jeweils echte Logik-/Typisierungsfragen, kein
Lib-Problem) wurden NICHT angefasst - das ist Sache des frontend-engineers.

## v0.2-Änderungen gegenüber v0.1 (Reaktion auf das v0.2-Update des Architects)

1. **Factory-Vertrag offiziell** (`CreateRulesEngine`-Typ): `createGame` nimmt
   keinen `pool` mehr über die Config entgegen (Breaking Change,
   `src/engine/create-game.ts` + `src/engine/engine.ts` angepasst).
2. **Startspieler per Münzwurf**: erster RNG-Verbrauch der Partie, vor dem
   Mischen; `CreateGameConfig.startingPlayer` überschreibt ihn (Tests).
3. **Trigger-Zielwahl über Pending Decisions**: `chooseTriggerTargets` ist
   implementiert (`triggers.ts`, `actions.ts`, `legal-actions.ts`) - der alte
   v0.1-Auto-Pick ("erstes legales Ziel bei JEDER Mehrdeutigkeit") ist
   entfernt. Genau eine legale Belegung -> weiterhin Komfort-Auto-Pick (per
   Regelwerk erlaubt); mehrere -> `GameState.pendingDecision` + `resolveDecision`.
4. **`guardian`-Blockpflicht final durchgesetzt** (`combat.ts#guardianUnitsRequiringBlock`,
   Validierung in `actions.ts#declareBlockers`).
5. **X-Kosten-Cast-Flow bestätigt/verifiziert** (war in v0.1 bereits als Feld
   vorhanden, jetzt mit dedizierten Tests: `x-cost.test.ts`).
6. `chooseManaColor`/`chooseDiscard`/`orderScry` bleiben bei den dokumentierten
   Auto-Defaults (`colorless`/erste Handkarten/No-Op) - wie vom Architect für
   diesen Schritt explizit erlaubt, NICHT auf den Decision-Kanal migriert.

## Setup

- `package.json` / `tsconfig.json` (strict), Testrunner: Vitest.
- `npm install`, dann `npm test` (Vitest) bzw. `npm run build` (`tsc --noEmit`).

## Öffentliche API

```ts
import { createRulesEngine } from "./src/engine";
const engine = createRulesEngine(pool); // pool: CardPool, EINMALIG gebunden
const { state, events } = engine.createGame({ decks, seed, startingPlayer? });
const result = engine.applyAction(state, action); // { state, events, error? }
const legal = engine.getLegalActions(state, player);
```

`GameState` bleibt aus Aufrufersicht immutabel (`applyAction` gibt bei Erfolg
immer ein neues Objekt zurück, bei Validierungsfehlern exakt das übergebene
Original-Objekt samt `error`-String). Intern klont die Engine den State per
`structuredClone` und mutiert die Kopie - Implementierungsdetail, kein Bruch
des Hybrid-Modells aus rules-engine.md 9.1.

## Was funktioniert (mit Tests abgedeckt)

- **createGame**: Münzwurf (oder `startingPlayer`-Override) als ersten
  RNG-Verbrauch, danach Mischen (seedbar, deterministisch), Starthand 7,
  automatisches Durchlaufen von Steps ohne Priority-Fenster (Untap), Stop
  beim ersten Priority-Fenster (Upkeep).
- **Phasen-/Step-Automatik** (`turn.ts`): alle 12 Steps, korrekte
  Priority-Fenster-Zuordnung. Untap und Cleanup (Normalfall) laufen
  automatisch durch. Draw Step wird im allerersten Zug übersprungen.
  Manapool leert sich bei jedem Step-Wechsel.
- **Priority-System**: SBA-Check + Trigger-Stacking laufen vor JEDER
  Priority-Vergabe (auch beim einfachen Weiterreichen nach einem einzelnen
  Pass). Nach einer Aktion behält derselbe Spieler die Priority; nach einer
  Resolution/Stepwechsel bekommt sie der aktive Spieler.
- **Stack-Resolution**: Spells (inkl. X-Kosten), aktivierte und getriggerte
  Fähigkeiten. LIFO, Target-Recheck inkl. Teil-/Voll-Fizzle. Counterspell-
  Beispiel aus rules-engine.md 4 als Test nachgebaut.
- **Pending Decisions** (`triggers.ts`, `actions.ts#resolveDecision`,
  `legal-actions.ts`): `chooseTriggerTargets` vollständig implementiert -
  genau eine legale Zielbelegung wird automatisch gewählt, mehrere pausieren
  die Engine (`pendingDecision` gesetzt, keine Priority/kein Stepwechsel) bis
  `resolveDecision`, keine legale Belegung lässt den Trigger verpuffen.
  Getestet in `pending-decision.test.ts` (Pause, getLegalActions-Kandidaten,
  Ablehnung durch falschen Spieler, Resolution, Fizzle-Fall).
- **Effekt-Interpreter**: alle `Effect`-Varianten implementiert (Ausnahmen:
  `scry` No-Op, `addMana("any")` -> `colorless`, siehe Lücken unten).
- **Mana**: Bezahlbarkeits-Check/Abbuchung inkl. X-Kosten (`mana.ts`,
  `x-cost.test.ts`). Kein Auto-Tap.
- **State-Based Actions**: alle 7 SBAs, einzeln getestet.
- **Trigger**: Pending-Queue, APNAP-Reihenfolge, alle `TriggerCondition`-
  Varianten feuern korrekt; Zielwahl siehe Pending Decisions oben.
- **Combat**: Angreifer/Blocker deklarieren, gleichzeitiger Schaden,
  Mehrfachblocker-Zuweisung, airborne/reach-Evasion, vigilant, lifelink,
  **`guardian`-Blockpflicht final durchgesetzt** (`guardian.test.ts`: Pflicht
  bei legalem Block, Snapshot bei Tappen vor Deklaration, keine Pflicht ohne
  legalen Block/bei Angreifer-Guardian, `getLegalActions`-Filterung).
- **Statische Werte**: Power/Toughness/Keyword-Berechnung ohne Layer-System
  (weiterhin ohne eigene Testkarte, siehe Lücken).
- **Aktionen**: `passPriority`, `castSpell` (inkl. X), `playTerrain`,
  `activateAbility`, `declareAttackers`, `declareBlockers` (inkl. guardian),
  `discardToHandSize`, `resolveDecision` (chooseTriggerTargets), `concede`.
- **getLegalActions**: passPriority, Karten/Fähigkeiten mit 0/1 Zielslot,
  einfache Combat-Kandidaten (guardian-gefiltert), resolveDecision-
  Kandidaten bei pendingDecision, concede immer. Vertrag laut
  RulesEngine-Interface-Kommentar bewusst nicht erschöpfend.

## Bewusste v0.2-Lücken / TODOs im Code (Suche nach "TODO" in src/engine/)

1. **Mehr als ein Zielslot** wird nirgends kombinatorisch enumeriert (weder
   `castSpell`/`activateAbility` noch `resolveDecision` für
   `chooseTriggerTargets`). `applyAction` validiert aber jede vollständige
   Kombination korrekt.
2. **X-Kosten** werden in `getLegalActions` nicht enumeriert (laut
   rules-engine.md 4 bewusst so vorgesehen).
3. **`scry`-Effekt ist ein No-Op**, **`addMana("any")`** wird als `colorless`
   gutgeschrieben, **`discardCards`-Zusatzkosten** wirft automatisch die
   ERSTEN Handkarten ab - alle drei sind laut Architect (rules-engine.md 9.7)
   für diesen Schritt explizit als Auto-Default erlaubt und NICHT auf den
   Pending-Decision-Kanal migriert. `PendingDecision`-Varianten
   `chooseManaColor`/`chooseDiscard`/`orderScry` existieren im Modell, werden
   aber von der Engine noch nie gesetzt; `resolveDecision`/`getLegalActions`
   haben dafür bereits (unerreichbare) Weichen für die künftige Migration.
4. **Cleanup-Sonderregel**: nur EIN Extra-Priority-Fenster pro Cleanup
   unterstützt (jetzt explizit als v0.2-Vereinfachung abgesegnet, siehe
   rules-engine.md 2) - kein vollständiges Re-Loop mit erneutem
   Handkarten-Check. Der Extra-Fenster-Pfad berücksichtigt jetzt auch
   `pendingDecision` (pausiert korrekt statt fälschlich Priority zu vergeben).
5. **Mana-Fähigkeiten mit X-Kosten** weiterhin nicht unterstützt
   (`activateAbility` hat kein `chosenX`-Feld - bestätigter offener Punkt,
   rules-engine.md 10).
6. **SBA 5 (Auren)**: prüft nur "Ziel existiert noch auf dem Battlefield",
   kein erneuter Filter-Abgleich (in v0.2 ohnehin nicht nötig, kein
   Typwechsel möglich).
7. **Statische Fähigkeiten (`StaticAbility`)**: implementiert, weiterhin ohne
   eigenen Unit-Test mangels Testkarte.
8. ~~Priority-Empfänger nach einer Pending-Decision-Pause~~ - **behoben in
   v0.2.1** über `GameState.resumePriorityTo`, siehe Abschnitt oben.

## Offene Fragen an game-architect

1. **Migration der übrigen drei Decision-Typen**: `chooseManaColor`/
   `chooseDiscard`/`orderScry` bleiben laut Vorgabe vorerst Auto-Default.
   Reihenfolge/Priorisierung für die Migration liegt beim Architect
   (abhängig vom Kartenpool-Bedarf, siehe rules-engine.md 10).
2. **Mehr als 2 Spieler / Mulligan / First-Strike/Deathtouch/Kontrollwechsel/
   Kopier-Effekte / Keyword-Entzug / Modal-Effekte**: weiterhin wie in
   rules-engine.md 10 gelistet, keine Engine-Arbeit in diesem Schritt.

(Frühere Fragen zu Factory-Vertrag, Trigger-Zielwahl, Startspieler-Bestimmung,
`guardian` und Priority-Empfänger nach Pending-Decision-Pause sind mit
v0.2/v0.2.1 beantwortet/umgesetzt und daher aus dieser Liste entfernt.)

## Für frontend-engineer: worauf lässt sich aufbauen?

- `createRulesEngine(pool)` + `createGame({ decks, seed, startingPlayer? })` /
  `applyAction` / `getLegalActions` sind stabil nutzbar für: Zonen anzeigen,
  Stack anzeigen, Priority-Anzeige, Land/Terrain spielen, Kreaturen/Sprüche
  mit 0 oder 1 Zielslot casten (auch mit X-Kosten - Frontend fragt X selbst
  ab und übergibt `chosenX`), Mana-Fähigkeiten aktivieren, Kampf inkl.
  guardian-Pflicht (bei Verstoß liefert `applyAction` einen `error`-String
  mit "guardian" darin), Handkarten-Abwurf im Cleanup, Aufgeben.
- **Neu: PendingDecision-UI.** Ist `state.pendingDecision` gesetzt, MUSS das
  Frontend einen Auswahl-Dialog für `state.pendingDecision.player` zeigen
  (aktuell nur `kind: "chooseTriggerTargets"` real erreichbar) und
  `resolveDecision` mit der Wahl schicken - alle anderen Aktionen sind in
  diesem Zustand illegal (auch für den anderen Spieler, außer `concede`).
  `getLegalActions` liefert bei 1 Zielslot alle legalen Einzelziele als
  fertige `resolveDecision`-Kandidaten.
- NICHT verlassen auf `getLegalActions` für: Karten/Fähigkeiten/Decisions mit
  mehr als einem Zielslot, X-Kosten-Enumeration, Cleanup-Abwurf-Kombinationen,
  kombinatorische Attacker-/Blocker-Teilmengen - hierfür eigene Eingabe-UI
  bauen und direkt `applyAction` aufrufen (Legalität wird dort geprüft).

## Tests

`src/engine/__tests__/*.test.ts` (Vitest, `npm test`, 48 Tests):

- `create-game.test.ts` - Determinismus, Starthand, Draw-Step-Skip,
  Münzwurf/`startingPlayer`-Override.
- `mana.test.ts` - Mana-Bezahlung isoliert.
- `casting.test.ts` - Casten/Resolven, Summoning Sickness, Mana-Fehlschlag.
- `priority-stack.test.ts` - Counterspell-Beispiel aus rules-engine.md 4.
- `sba.test.ts` - alle 7 SBAs (Auswahl), Spielende.
- `combat.test.ts` - ungeblockt/geblockt/airborne-Evasion.
- `guardian.test.ts` - Blockpflicht, Snapshot, Evasion-Ausnahme,
  Angreiferseite wirkungslos, `getLegalActions`-Filterung.
- `pending-decision.test.ts` - Pause bei Mehrdeutigkeit, Kandidaten,
  Fremdauflösung abgelehnt, Resolution, Fizzle ohne legales Ziel,
  `resumePriorityTo` (nicht-aktiver Spieler bekommt nach `resolveDecision`
  korrekt wieder Priority statt `activePlayer`).
- `x-cost.test.ts` - X-Kosten casten/bezahlen, X=0, fehlendes/zu teures X,
  Nicht-Enumeration in `getLegalActions`.
- `turn-structure.test.ts` - voller Zug-Durchlauf, Manapool-Leerung.
- `triggers-and-misc.test.ts` - Death-Trigger, Terrain-Limit,
  getLegalActions-Grundfall, Cleanup-Abwurf, Concede.
- `starter-set-smoke.test.ts` - echter Kartenpool des card-designers
  (`src/cards/starter-set.ts`) läuft ohne Fehler durch createGame + ein paar
  Priority-Runden.

`src/engine/__tests__/fixtures.ts` und `test-helpers.ts` sind NUR für Tests
gedacht (Mini-Kartenpool, Direkt-Manipulationshilfen wie `putOnBattlefield`) -
kein Ersatz für den "core"-Kartenpool des card-designers.
