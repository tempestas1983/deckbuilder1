# Engine-Status

Status: v0.2.4 (engine-engineer) — 2026-07-09
Grundlage: `docs/rules-engine.md` (Regelwerk v0.2.3, Kampf-Keyword-Paket §6d/9.9, Revision §9.8), `src/model/*` (Datenmodell unverändert konsumiert - `Keyword`/`PendingDecision`/`PermanentState` bereits vom Architect erweitert).
Code: `src/engine/*`. Tests: `src/engine/__tests__/*.test.ts` (Vitest, 83 Tests, alle grün).

Dieses Dokument richtet sich an frontend-engineer (worauf aufbauen?), card-designer
(welche DSL-Primitive funktionieren zuverlässig?) und game-architect (offene
Klärungspunkte, siehe Abschnitt "Offene Fragen").

## v0.2.4: `costChange`-Static-Modifier implementiert (Lückenschluss vor Phase-B-Kartenpool)

Reaktion auf die in `docs/cards/starter-set.md` ("Nicht verwendete DSL-Primitive")
dokumentierte Lücke: `StaticAbility`-Modifier `kind: "costChange"` (`abilities.ts`)
existierte bislang nur als Datentyp, ohne Engine-Interpretation - blockierte damit
den nächsten Kartenpool-Batch des card-designers. Jetzt implementiert:

1. **`stats.ts#computeSpellCostDelta`** (neu): summiert alle `costChange`-Modifier
   von Permanents auf dem Battlefield, die für einen bestimmten Caster gelten
   (`appliesTo: "ownSpells"` wenn Quellcontroller == Caster, `"opponentSpells"`
   wenn nicht). Analog zum bestehenden `staticSourcesAffecting`-Muster, aber als
   eigene Funktion, weil `costChange` kein Zielpermanent hat (siehe Punkt 3).
2. **`mana.ts`**: `totalGenericCost`/`canPayCost`/`payCost` haben ein neues,
   optionales viertes Argument `genericDelta` (Default 0, rückwärtskompatibel).
   Wirkt NUR auf den generischen Kostenanteil (inkl. X bei X-Spells), nie auf
   Farbanteile; Gesamtkosten werden bei 0 gekappt (kein negativer Preis, MTG-
   analoge Konvention).
3. **Verdrahtung an ALLEN Kostenprüfungsstellen für Spells** (nicht nur einer
   Stelle, wie in der Aufgabe gefordert): `actions.ts#validate` (`castSpell`),
   `actions.ts#perform` (`castSpell`, tatsächliche Bezahlung) und
   `legal-actions.ts#castSpellCandidates` (beide `canPayCost`-Aufrufe). Bewusst
   NICHT an `activateAbility`-Kostenprüfungen (weder `validate` noch `perform`
   noch `legal-actions.ts`) - der Modell-Kommentar an `costChange` sagt explizit
   "Kosten von Spells", aktivierte Fähigkeiten sind nicht gemeint.
   `legality.ts#canCastNow` selbst prüft nur Timing/Priority, keine Kosten -
   dort war keine Änderung nötig.
4. **Unklare Spezifikationsstelle (an card-designer/Auftraggeber zurückgemeldet,
   nicht eigenmächtig entschieden):** `StaticAbility.scope` (self/attachedTo/
   ownUnits/opponentUnits/allUnits) ist laut Modell-Kommentar "auf wen der
   Modifikator wirkt" und für JEDEN `modifier`-Kind Pflichtfeld - für
   `stats`/`grantKeyword` sinnvoll (filtert Zielpermanents), für `costChange`
   aber redundant/gegenstandslos: `modifier.appliesTo` legt bereits
   abschließend fest, wessen Spells betroffen sind, und ein Spell (kein
   Permanent) hat kein "self"/"ownUnits"-Ziel, auf das `scope` zusätzlich
   filtern könnte. Die Engine **ignoriert `scope` für `costChange`-Modifier
   bewusst** und wertet ausschließlich `appliesTo` aus (`computeSpellCostDelta`-
   Doku-Kommentar in `stats.ts`); Testkarten setzen `scope` auf einen beliebigen
   Platzhalter-Wert, weil das Feld laut Typ Pflicht ist. Sollte der
   Game-Architect `scope` für `costChange` künftig doch eine Bedeutung geben
   wollen (z.B. um costChange zusätzlich auf bestimmte Kartentypen zu
   beschränken), ist das ein additiver Nachtrag ohne Bruch der bestehenden
   Testkarten/-fälle.

Neue Testdatei `cost-change.test.ts` (6 Tests): eigene Kostensenkung, Kontrolltest
ohne Senkung, gegnerische Kostenerhöhung (inkl. Nachweis, dass der Controller der
Tax-Quelle für die EIGENEN Spells NICHT selbst zahlt), additive Stapelung zweier
Kostensenker-Quellen mit Kappung bei 0 (kostenloser Cast), `getLegalActions`-
Sichtbarkeit des reduzierten Preises. Neue Testfixtures in `fixtures.ts`:
`COST_REDUCER_RELIC` ({generic:2}-Relic, eigene Sprüche -{1} generisch),
`COST_TAX_RELIC` ({generic:2}-Relic, gegnerische Sprüche +{1} generisch),
`CHEAP_VANILLA_SPELL` ({generic:2}-Fast-Spell ohne Ziele/Effekte, reiner
Kostenträger für diese Tests).

**Kein Datenmodell-Change** - `StaticAbility`/`StaticModifier` mit `costChange`
existierten bereits vollständig typisiert; dieser Schritt ist reine
Engine-Interpretation eines bestehenden Datentyps.

## v0.2.3: Kampf-Keyword-Paket (`trample`/`firstStrike`/`deathtouch` + `orderBlockers`)

Reaktion auf das v0.2.3-Update von `docs/rules-engine.md` (Abschnitt 6d,
Entscheidung 9.9, Revision von 9.8). Alle vier Teile umgesetzt:

1. **`orderBlockers`-PendingDecision** (Revision von 9.8, `combat.ts`,
   `actions.ts`, `legal-actions.ts`): `declareBlockers` prüft direkt danach
   (VOR dem Priority-Fenster des Steps), ob mindestens ein Angreifer >= 2
   Blocker hat (`combat.ts#buildOrderBlockersDecision`, eine Decision für
   alle betroffenen Angreifer gemeinsam). Ist das der Fall, pausiert die
   Engine mit `pendingDecision = { kind: "orderBlockers", ... }` statt
   Priority zu vergeben - der **angreifende** Spieler antwortet mit einer
   Permutation je Angreifer (`combat.ts#applyOrderBlockers` überschreibt
   `CombatAssignment.blockedBy`). Liegt außerhalb einer Priority-Vergabe
   (rules-engine.md 9.7): `resumePriorityTo` wird nicht angefasst; nach
   Auflösung öffnet die Engine das reguläre Priority-Fenster direkt
   (`openPriorityWindow(..., activePlayer)`), nicht der generische
   `resumePriorityAfterDecision`-Pfad (der wäre hier ein No-Op, da kein
   `resumePriorityTo` gesetzt ist). Validierung in
   `actions.ts#validateResolveDecision`: exakt die gelisteten Angreifer, je
   eine Permutation exakt der gelisteten Blocker. `getLegalActions` liefert
   genau einen Kandidaten (Deklarationsreihenfolge) statt zu enumerieren
   (Vertrag laut 9.9).
2. **`trample`** (`combat.ts#dealCombatDamageRound`): Blocker bekommen in
   `blockedBy`-Reihenfolge exakt ihre letale Menge, toter/entfernte Blocker
   werden übersprungen (0 zugewiesen); der Rest trifft den Verteidiger -
   auch wenn ALLE Blocker vorher sterben (6b(2) revidiert: voller
   Durchschlag statt "verpufft wirkungslos" wie ohne trample).
3. **`deathtouch`**: Neues Flag `PermanentState.deathtouchDamage`, gesetzt
   bei jedem Schaden > 0 einer deathtouch-Quelle - sowohl im Kampf
   (`combat.ts`) als auch beim `dealDamage`-Effekt (`effects.ts#dealDamageToPermanent`,
   jetzt mit `pool`-Parameter für den Keyword-Lookup). SBA 4 (`sba.ts`)
   erweitert: Unit mit gesetztem Flag stirbt unabhängig von Toughness.
   Reset im Cleanup zusammen mit `damageMarked` (`turn.ts#finishCleanup`).
   Lethale Menge bei der Schadenszuteilung sinkt für deathtouch-Angreifer
   auf 1 pro Blocker. §6c bleibt unverändert: Schaden <= 0 setzt kein Flag.
4. **`firstStrike`** (`combat.ts#dealCombatDamage`/`dealCombatDamageRound`):
   Kein neuer Step, kein neues Priority-Fenster. Gibt es mindestens einen
   Kampfteilnehmer (Angreifer ODER Blocker) mit `firstStrike`, läuft die
   Turn-Based Action intern in zwei Runden: (a) nur firstStrike-Teilnehmer
   teilen aus, direkt angewendet; (b) EIN SBA-Durchlauf ohne Priority
   (`runStateBasedActionsLoop` direkt aufgerufen, KEIN `flushPendingTriggersToStack`
   - Trigger bleiben in der Pending-Queue, werden erst im echten
   Priority-Fenster des Steps gestackt); (c) alle übrigen Teilnehmer (ohne
   firstStrike, die Runde (a) überlebt haben) teilen aus - firstStrike-
   Teilnehmer teilen in Runde (c) NICHT nochmal aus. Angreifer- und
   Blocker-Richtung sind dabei unabhängig gefiltert (ein Angreifer ohne
   firstStrike kann in Runde (a) bereits Schaden von einem firstStrike-
   Blocker erhalten, teilt selbst aber erst in Runde (c) aus). Gibt es
   KEINEN firstStrike-Teilnehmer, entfällt Runde (a)/(b) ersatzlos - eine
   Runde wie vor v0.2.3 (Regressionstest in `combat-keywords.test.ts`
   bestätigt unveränderten Ablauf).

**Kombinatorik (6d(4))** vollständig nachgebaut in `combat-keywords.test.ts`:
firstStrike+deathtouch (tötet vor der Vergeltung), firstStrike+trample (ein
Durchschlag, kein zweiter in Runde 2), trample+deathtouch (letale Menge 1
pro Blocker), firstStrike-Blocker gegen trample-Angreifer ohne firstStrike
(stirbt der Angreifer im Zwischen-SBA-Durchlauf, kein Trample-Durchschlag).

**Bestehende Mehrfachblock-Tests umgestellt** (`combat-edge-cases.test.ts`):
Die beiden §9.8-Tests, die sich auf die jetzt revidierte
Verteidiger-Deklarationsreihenfolge als Schadensreihenfolge verließen, rufen
jetzt zusätzlich `resolveOrderBlockersAsDeclared` (neuer Test-Helper in
`test-helpers.ts`, löst die Decision mit der unveränderten
Deklarationsreihenfolge auf) auf, bevor das Priority-Fenster erreichbar ist.
Fachlich unverändert (gleiche Assertions), nur der Auslöser der Reihenfolge
ist jetzt eine explizite Spielerentscheidung statt eines impliziten
Nebeneffekts der Deklaration. **Nichts Unerwartetes** beim Umbau - der
generische Pending-Decision-Mechanismus (9.7) trug den neuen Decision-Typ
ohne Sonderfälle, einzige Falle war der `resumePriorityTo`-Pfad (siehe
Punkt 1 oben: `orderBlockers` liegt außerhalb einer Priority-Vergabe, der
generische `resumePriorityAfterDecision`-Aufruf wäre dort ein stiller No-Op
gewesen - deshalb ein expliziter Zweig in `actions.ts#perform` für
`resolveDecision`, der bei `orderBlockers` direkt `openPriorityWindow`
statt `resumePriorityAfterDecision` aufruft).

Neue Testdatei `combat-keywords.test.ts` (16 Tests): trample (Einzelblock,
6b(2)-Sonderfall "alle Blocker tot", Mehrfachblock exakt letal, Angreifer-
Reihenfolge entscheidet bei knapper Power über Blocker-Überleben),
deathtouch (letal unabhängig von Toughness, §6c-Regression bei Power <= 0,
Mehrfachblock-Reihenfolge entscheidet bei Power < Blockerzahl über WER
stirbt), firstStrike (tötet vor Vergeltung, Regressionstest ohne
firstStrike-Teilnehmer, firstStrike-Blocker tötet Angreifer vorher),
Kombinatorik (4 Tests, s.o.), `getLegalActions`/Validierung bei
`orderBlockers` (genau ein Kandidat, Verteidiger darf nicht antworten,
falsche Permutation wird abgelehnt). Neue Testfixtures in `fixtures.ts`:
`TRAMPLE_UNIT` (4/4 trample), `FIRST_STRIKE_UNIT` (2/2 firstStrike),
`DEATHTOUCH_UNIT` (1/1 deathtouch), `FIRST_STRIKE_DEATHTOUCH_UNIT`,
`FIRST_STRIKE_TRAMPLE_UNIT`, `TRAMPLE_DEATHTOUCH_UNIT` (Kombinatorik-Karten).

**Datenmodell-Änderungen**: keine über die vom Architect bereits
vorgenommenen hinaus (`Keyword` +3, `PendingDecision`/`DecisionChoice` +
`orderBlockers`, `PermanentState.deathtouchDamage`) - die Engine konsumiert
sie unverändert wie spezifiziert.

## v0.2.2-Härtung: Kampf-Edge-Cases + drei Bugfixes in `combat.ts#dealCombatDamage`

Reaktion auf das v0.2.2-Update von `docs/rules-engine.md` (Priority-Fenster
aller Combat-Steps bestätigt/präzisiert §6a, Zonenwechsel zwischen Declare
Blockers und Combat Damage §6b, 0/negative Power/Toughness §6c, Mehrfachblock-
Schadensreihenfolge als Verteidiger-Entscheidung bestätigt 9.8). Beim Review
gegen §6c wurden zwei Bugs gefunden; ein dritter kam beim Schreiben der
§6b-Regressionstests selbst zutage (Kombination §6b + §9.8). Alle drei sind
behoben:

1. **lifelink-Vorzeichenfehler**: `addPermanentDamage`/`addPlayerDamage`
   akkumulierten `lifelinkGains` VOR der `amount <= 0`-Prüfung (die erst beim
   Anwenden der Schadens-/Player-Damage-Listen griff). Eine lifelink-Unit mit
   effektiver Power ≤ 0 (z.B. nach einem Debuff im Declare-Blockers-Fenster)
   konnte so einen negativen "Lebensgewinn" auslösen - der lifelink-Zähler
   selbst wird jetzt nur noch für `amount > 0` akkumuliert.
2. **`onDealtCombatDamageToPlayer` feuerte bedingungslos** im Unblocked-Pfad,
   auch bei `power <= 0`. Feuert jetzt nur noch bei tatsächlichem Schaden > 0
   (§6c: "Schaden ≤ 0 ist kein Schadensereignis").
3. **Mehrfachblock-Restschaden bei totem (array-)letzten Blocker**: Die
   `isLast`-Bestimmung im `blockedBy.forEach` beruhte auf dem rohen
   Array-Index (`index === blockedBy.length - 1`), nicht darauf, wer davon
   tatsächlich noch lebt. Stirbt der nominal letzte Blocker vor Combat
   Damage (§6b), verpuffte der über die letalen Bedürfnisse hinausgehende
   Restschaden wirkungslos, statt beim tatsächlich letzten ÜBERLEBENDEN
   Blocker anzukommen (§9.8: "letzter Blocker erhält den gesamten Rest").
   Fix: `isLast` wird jetzt gegen den letzten Eintrag der lebenden Blocker
   (`aliveBlockerIds`, vorab per `permanentState`-Check gefiltert) geprüft,
   nicht mehr gegen den rohen Array-Index.

Alle drei Fixes sind durch Regressionstests abgesichert, die VOR dem
jeweiligen Fix nachweislich fehlschlagen (manuell gegen die alte Logik
verifiziert, siehe `combat-edge-cases.test.ts`).

Neue Testdatei `combat-edge-cases.test.ts` (13 Tests, ergänzt die bestehenden
`combat.test.ts`/`guardian.test.ts`-Grundfälle):

- **§9.8 Mehrfachblock**: 3 Blocker mit gestaffelter Toughness (letal 2/3,
  letzter bekommt den GESAMTEN Rest statt nur letal 1) - Reihenfolge = Reihenfolge
  der `blocks`-Paare in der `declareBlockers`-Aktion (Verteidiger-Wahl,
  dokumentierte Vereinfachung laut 9.8, bewusst NICHT geändert).
- **vigilant**: Angreifer bleibt nach `declareAttackers` ungetappt.
- **lifelink**: geblockt, ungeblockt, plus die o.g. Regression bei Power < 0.
- **§6b Zonenwechsel**: Blocker stirbt im Declare-Blockers-Fenster (Instant-
  Response simuliert per direktem `leaveBattlefield`-Aufruf, kein Cast-Umweg
  nötig) → Angreifer bleibt geblockt, schlägt NICHT durch, kein Trample-
  Analog, keine Exception. Angreifer stirbt im selben Fenster → Blocker
  verrechnet nichts (weder Schaden erhalten noch ausgeteilt). Zusätzlich:
  Mehrfachblock, bei dem der (array-)letzte Blocker im Fenster stirbt - der
  tatsächlich letzte überlebende Blocker bekommt den vollen Restschaden
  (Regressionstest für Bugfix 3).
- **§6c 0-Power**: Angreifer/Blocker mit Power 0 (per Debuff via
  `temporaryModifiers`) → kein Schaden, kein `damageDealt`/`lifeChanged`-
  Event, kein `triggerFired` (Regressionstest für Bug 2), keine Exception;
  Kontrolltest zeigt, dass derselbe Trigger bei Power > 0 normal feuert.
- **getLegalActions**: Sanity-Check bei Declare Attackers/Blockers ohne
  guardian (bestehende guardian-Filterung bleibt unberührt, siehe weiterhin
  `guardian.test.ts`).

Neue Testfixtures in `fixtures.ts`: `LIFELINK_UNIT` (2/2 lifelink),
`DAMAGE_TRIGGER_UNIT` (1/1, Trigger `onDealtCombatDamageToPlayer` → Karte
ziehen, für den Bug-2-Regressionstest).

**Kein Datenmodell-Change** über die drei Bugfixes hinaus - die
§9.8-Verteidiger-Reihenfolge selbst (WER die Reihenfolge bestimmt) ist wie
vom Architect entschieden nur getestet, nicht verändert; Bugfix 3 korrigiert
lediglich, wie die Engine mit einem toten Blocker INNERHALB dieser
Reihenfolge umgeht. Die vier einzelnen §6b-Punkte (Kampfzuordnung
verschwindet mit `permanentState`, "geblockt bleibt geblockt",
Blocker-ohne-Angreifer, Tappen/Enttappen ändert nichts) waren für sich
genommen bereits vor diesem Schritt korrekt - erst ihre Kombination mit der
§9.8-Restschadenlogik (toter Blocker mitten in der Zuweisungsreihenfolge)
enthielt den o.g. Bug.

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
  `x-cost.test.ts`). Kein Auto-Tap. Seit v0.2.4: `costChange`-Static-Modifier
  fließt in alle Kostenprüfungen für Spells ein (`cost-change.test.ts`), siehe
  Abschnitt oben.
- **State-Based Actions**: alle 7 SBAs, einzeln getestet.
- **Trigger**: Pending-Queue, APNAP-Reihenfolge, alle `TriggerCondition`-
  Varianten feuern korrekt; Zielwahl siehe Pending Decisions oben.
- **Combat**: Angreifer/Blocker deklarieren, gleichzeitiger Schaden,
  Mehrfachblocker-Zuweisung (Reihenfolge wird seit v0.2.3 vom **Angreifer**
  über `orderBlockers` gewählt, letzter Blocker bekommt ohne trample den
  gesamten Rest, §6d(1)/9.8), airborne/reach-Evasion, vigilant, lifelink
  (inkl. Power-≤-0-Randfall), 0/negative Power/Toughness (§6c: kein Schaden,
  kein Event, kein Trigger), Zonenwechsel zwischen Declare Blockers und
  Combat Damage (§6b: "geblockt bleibt geblockt", kein Trample-Durchschlag
  ohne `trample`-Keyword, Blocker-ohne-Angreifer verrechnet nichts).
  **`guardian`-Blockpflicht final durchgesetzt** (`guardian.test.ts`: Pflicht
  bei legalem Block, Snapshot bei Tappen vor Deklaration, keine Pflicht ohne
  legalen Block/bei Angreifer-Guardian, `getLegalActions`-Filterung).
  Härtungstests in `combat-edge-cases.test.ts` (v0.2.2, mit v0.2.3 auf
  `orderBlockers` umgestellt, siehe Abschnitt oben). **v0.2.3 Kampf-Keyword-
  Paket**: `trample` (Überschuss trifft den Verteidiger, inkl. revidiertem
  6b(2) "alle Blocker tot -> volle Power durch"), `firstStrike` (zweite
  interne Schadensrunde mit Zwischen-SBA, kein neuer Step/Fenster),
  `deathtouch` (Flag `PermanentState.deathtouchDamage`, SBA 4 erweitert, gilt
  auch für `dealDamage`-Effekte), `orderBlockers`-PendingDecision
  (Revision von 9.8) + volle Kombinatorik aus 6d(4) - siehe
  `combat-keywords.test.ts`.
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
7. **Statische Fähigkeiten (`StaticAbility`)**: `stats`/`grantKeyword`-Modifier
   implementiert, weiterhin ohne eigenen Unit-Test mangels Testkarte.
   `costChange`-Modifier ist seit v0.2.4 implementiert UND getestet (siehe
   Abschnitt oben, `cost-change.test.ts`) - aus dieser Lücke entfernt.
8. ~~Priority-Empfänger nach einer Pending-Decision-Pause~~ - **behoben in
   v0.2.1** über `GameState.resumePriorityTo`, siehe Abschnitt oben.
9. **Double Strike** (rules-engine.md 9.9/10, bewusst NICHT in v0.2.3):
   würde in BEIDEN Schadensrunden austeilen - verdoppelt die
   Rundenlogik-Sonderfälle für genau eine weitere Mechanik, laut Architect
   erst bei Bedarf.
10. **Priority-Fenster zwischen den beiden Schadensrunden** (9.9 Punkt 2,
    Option A dort): aktuell KEIN Antwortfenster zwischen firstStrike- und
    regulärer Runde (bewusster Trade-off, additiv nachrüstbar als eigener
    Step).
11. **trample-Über-Zuteilung** (9.9 Punkt 3): Zuteilung ist deterministisch
    (exakt letale Menge pro Blocker) - keine Spielerwahl, mehr als letal an
    einen Blocker zu geben (erst mit Regenerations-/Unzerstörbarkeits-
    artigen Mechaniken relevant).

## Offene Fragen an game-architect

1. **Migration der übrigen drei Decision-Typen**: `chooseManaColor`/
   `chooseDiscard`/`orderScry` bleiben laut Vorgabe vorerst Auto-Default.
   Reihenfolge/Priorisierung für die Migration liegt beim Architect
   (abhängig vom Kartenpool-Bedarf, siehe rules-engine.md 10).
2. **Mehr als 2 Spieler / Mulligan / Kontrollwechsel / Kopier-Effekte /
   Keyword-Entzug / Modal-Effekte / Double Strike / Priority-Fenster
   zwischen den Schadensrunden / trample-Über-Zuteilung**: weiterhin wie in
   rules-engine.md 10 gelistet, keine Engine-Arbeit in diesem Schritt.
3. **`StaticAbility.scope` bei `modifier.kind === "costChange"` (v0.2.4,
   neu):** `scope` ist laut Typ für jede `StaticAbility` Pflichtfeld, hat für
   `costChange` aber keinen erkennbaren Gegenstand - `appliesTo` legt bereits
   vollständig fest, wessen Spells betroffen sind, und ein gecasteter Spell
   ist kein Zielpermanent, auf das `scope` (self/attachedTo/ownUnits/
   opponentUnits/allUnits) zusätzlich filtern könnte. Die Engine ignoriert
   `scope` für `costChange` aktuell vollständig (siehe Abschnitt oben,
   `stats.ts#computeSpellCostDelta`). Bitte bestätigen, ob das so gewollt ist,
   oder ob `scope` hier eine andere/zusätzliche Bedeutung bekommen soll (z.B.
   Einschränkung auf bestimmte Permanent-/Kartentypen als Zusatzfilter) -
   nicht blockierend für den aktuellen Kartenpool-Batch, aber relevant, falls
   künftige Karten `scope` bei `costChange` auf etwas anderes als einen
   Platzhalter setzen wollen.

(Frühere Fragen zu Factory-Vertrag, Trigger-Zielwahl, Startspieler-Bestimmung,
`guardian`, Priority-Empfänger nach Pending-Decision-Pause und dem
Kampf-Keyword-Paket [trample/firstStrike/deathtouch/orderBlockers] sind mit
v0.2/v0.2.1/v0.2.3 beantwortet/umgesetzt und daher aus dieser Liste entfernt.)

## Für frontend-engineer: worauf lässt sich aufbauen?

- `createRulesEngine(pool)` + `createGame({ decks, seed, startingPlayer? })` /
  `applyAction` / `getLegalActions` sind stabil nutzbar für: Zonen anzeigen,
  Stack anzeigen, Priority-Anzeige, Land/Terrain spielen, Kreaturen/Sprüche
  mit 0 oder 1 Zielslot casten (auch mit X-Kosten - Frontend fragt X selbst
  ab und übergibt `chosenX`), Mana-Fähigkeiten aktivieren, Kampf inkl.
  guardian-Pflicht (bei Verstoß liefert `applyAction` einen `error`-String
  mit "guardian" darin), Handkarten-Abwurf im Cleanup, Aufgeben.
- **PendingDecision-UI.** Ist `state.pendingDecision` gesetzt, MUSS das
  Frontend einen Auswahl-Dialog für `state.pendingDecision.player` zeigen und
  `resolveDecision` mit der Wahl schicken - alle anderen Aktionen sind in
  diesem Zustand illegal (auch für den anderen Spieler, außer `concede`).
  Real erreichbar sind `kind: "chooseTriggerTargets"` (`getLegalActions`
  liefert bei 1 Zielslot alle legalen Einzelziele als fertige
  `resolveDecision`-Kandidaten) und seit v0.2.3 `kind: "orderBlockers"`
  (feuert unmittelbar nach `declareBlockers`, falls mindestens ein Angreifer
  >= 2 Blocker hat; NUR der angreifende Spieler antwortet, mit je einer
  Permutation der Blocker pro gelistetem Angreifer; `getLegalActions` liefert
  hier genau einen Kandidaten - die Deklarationsreihenfolge -, keine
  vollständige Permutations-Enumeration, das Frontend braucht also eine
  eigene Drag&Drop-/Sortier-UI für echte Spielerwahl).
- NICHT verlassen auf `getLegalActions` für: Karten/Fähigkeiten/Decisions mit
  mehr als einem Zielslot, X-Kosten-Enumeration, Cleanup-Abwurf-Kombinationen,
  kombinatorische Attacker-/Blocker-Teilmengen - hierfür eigene Eingabe-UI
  bauen und direkt `applyAction` aufrufen (Legalität wird dort geprüft).

## Tests

`src/engine/__tests__/*.test.ts` (Vitest, `npm test`, 83 Tests):

- `create-game.test.ts` - Determinismus, Starthand, Draw-Step-Skip,
  Münzwurf/`startingPlayer`-Override.
- `mana.test.ts` - Mana-Bezahlung isoliert.
- `casting.test.ts` - Casten/Resolven, Summoning Sickness, Mana-Fehlschlag.
- `priority-stack.test.ts` - Counterspell-Beispiel aus rules-engine.md 4.
- `sba.test.ts` - alle 7 SBAs (Auswahl), Spielende.
- `combat.test.ts` - ungeblockt/geblockt/airborne-Evasion.
- `guardian.test.ts` - Blockpflicht, Snapshot, Evasion-Ausnahme,
  Angreiferseite wirkungslos, `getLegalActions`-Filterung.
- `combat-edge-cases.test.ts` (v0.2.2, Mehrfachblock-Tests in v0.2.3 auf
  `orderBlockers` umgestellt) - Mehrfachblock-Restschaden (Reihenfolge jetzt
  über `orderBlockers` vom Angreifer bestätigt statt implizit aus der
  Deklaration), vigilant bleibt ungetappt, lifelink geblockt/ungeblockt inkl.
  Power-≤-0-Regression, §6b Zonenwechsel (Blocker/Angreifer stirbt im
  Declare-Blockers-Fenster, inkl. Mehrfachblock-Regression: toter
  (array-)letzter Blocker → Restschaden landet beim tatsächlich letzten
  überlebenden Blocker), §6c 0-Power (kein Schaden/Event/Trigger, inkl.
  Regression für den `onDealtCombatDamageToPlayer`-Bug), `getLegalActions`-
  Sanity-Check bei Declare Attackers/Blockers.
- `combat-keywords.test.ts` (v0.2.3) - Kampf-Keyword-Paket: `trample`
  (Einzel-/Mehrfachblock, 6b(2)-Sonderfall "alle Blocker tot", Angreifer-
  Reihenfolge entscheidet über Blocker-Überleben bei knapper Power),
  `deathtouch` (letal unabhängig von Toughness, §6c-Regression, Reihenfolge
  entscheidet bei Power < Blockerzahl über WER stirbt), `firstStrike` (tötet
  vor Vergeltung, Regressionstest ohne firstStrike-Teilnehmer,
  firstStrike-Blocker tötet Angreifer vorher), Kombinatorik nach 6d(4)
  (firstStrike+deathtouch, firstStrike+trample, trample+deathtouch,
  firstStrike-Blocker vs. trample-Angreifer ohne firstStrike),
  `getLegalActions`/Validierung bei `orderBlockers`.
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
- `cost-change.test.ts` (v0.2.4) - `costChange`-Static-Modifier: eigene
  Kostensenkung, Kontrolltest ohne Senkung, gegnerische Kostenerhöhung (inkl.
  Nachweis "Controller zahlt für eigene Spells nicht selbst mehr"), additive
  Stapelung mehrerer Quellen mit Kappung bei 0, `getLegalActions`-Sichtbarkeit.

`src/engine/__tests__/fixtures.ts` und `test-helpers.ts` sind NUR für Tests
gedacht (Mini-Kartenpool, Direkt-Manipulationshilfen wie `putOnBattlefield`) -
kein Ersatz für den "core"-Kartenpool des card-designers.
