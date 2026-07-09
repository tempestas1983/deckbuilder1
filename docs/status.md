# Laufender Zwischenstand

Datum: 2026-07-09
Zweck: Einziger Ort, an dem der Projektkontext ein `/clear` überlebt. Wird von
`documenter` bei jedem finalen Sweep aktualisiert. Details/Begründungen stehen
in `docs/rules-engine.md`, `docs/engine-status.md`, `docs/frontend-status.md`,
`docs/README.md` — dieses Dokument ist die Kurzfassung "wo stehen wir gerade".

## Meilenstein: Kartenpool auf 109 Karten erweitert (Phase B abgeschlossen)

- **Engine:** `docs/engine-status.md` v0.2.4. Reaktion auf eine vom
  card-designer dokumentierte Lücke: `StaticAbility`-Modifier
  `costChange` existierte nur als Datentyp, ohne Engine-Interpretation.
  Jetzt implementiert: `stats.ts#computeSpellCostDelta` (neu, summiert
  `costChange`-Modifier von Battlefield-Permanents nach `appliesTo:
  ownSpells`/`opponentSpells`), `mana.ts` (`totalGenericCost`/
  `canPayCost`/`payCost` mit neuem optionalen `genericDelta`-Argument,
  wirkt nur auf den generischen Kostenanteil, Kappung bei 0), verdrahtet an
  allen Spell-Kostenprüfungsstellen (`actions.ts#validate`/`perform` für
  `castSpell`, `legal-actions.ts#castSpellCandidates`) — bewusst NICHT an
  `activateAbility`. Neue Testdatei `cost-change.test.ts` (6 Tests):
  eigene Kostensenkung, gegnerische Kostenerhöhung (inkl. Nachweis, dass
  der Controller der Tax-Quelle selbst nicht mehr zahlt), additive
  Stapelung zweier Quellen mit Kappung bei 0, `getLegalActions`-
  Sichtbarkeit. Testzahl 77 → **83** — per Grep über alle `it(`/`test(`-
  Vorkommen in `src/engine/__tests__/*.test.ts` nachgezählt (nicht nur aus
  dem Agent-Bericht übernommen), stimmt. Offene, nicht blockierende
  Rückfrage an den game-architect: Soll `StaticAbility.scope` bei
  `costChange` künftig eine Bedeutung bekommen (aktuell ignoriert die
  Engine `scope` für diesen Modifier-Typ vollständig und wertet nur
  `modifier.appliesTo` aus)? Kein Datenmodell-Change — `costChange` war
  bereits vollständig typisiert.
- **Kartenpool:** `docs/cards/starter-set.md` v0.5. Der card-designer hat
  den Pool in drei Batches von 27 auf **109 Karten** (+3 Token-
  Definitionen) ausgebaut — per Grep gegen `src/cards/starter-set.ts`
  verifiziert (112 `id: "core.…"`-Einträge insgesamt, davon 3 mit
  `isToken:true` → 109 reguläre Karten, stimmt mit der Behauptung überein).
  Batch 1 (+29): Fokus Kampf-Keywords (`trample`/`firstStrike`/
  `deathtouch` erstmals mit echten Pool-Karten statt nur
  Engine-Test-Fixtures, plus Ausbau der sechs länger etablierten
  Keywords). Batch 2 (+25 + 3 Token-Defs): Fokus `createToken`,
  `grantKeyword`-als-Effekt, `tapPermanent`/`untapPermanent`-als-Effekt,
  `removeCounters`, `discardCards`-als-Effekt; Typ-Mix von unit-lastig
  (66 %) auf ausgewogener (52 % Units) korrigiert. Batch 3 (+28): Fokus
  `costChange`, `scry`, `StaticAbility scope: self`/`opponentUnits`/
  `allUnits`; schließt zusätzlich fast alle übrigen ungenutzten
  DSL-Primitive (`minus1minus1`-Marken, diverse `AdditionalCost`-Varianten,
  `modifyStats`, `loseLife`, `destroyPermanent`, drei bislang ungenutzte
  TriggerConditions). Dabei fand der card-designer eine echte Engine-Lücke:
  `TriggerCondition.onDamageReceived` wird nirgends gefeuert.
- **Regelwerk (Nachtrag, kein Versionssprung):** Auf Nachfrage hat der
  game-architect entschieden, `onDamageReceived` **nicht** zu
  implementieren, sondern bewusst als „reserviert, noch nicht verdrahtet"
  zu dokumentieren. `docs/rules-engine.md` bleibt bei Kopfzeile v0.2.3 (die
  Änderungen sind als Klärung innerhalb des bestehenden Standes markiert,
  „Stand v0.2.3" im Fließtext), enthält aber neue Inhalte: §5 (neuer
  Hinweis-Bullet, referenziert `triggers.ts#fireSelfCombatTrigger` und
  fehlende Aufrufstellen), §6d(4) (Fußnote zur firstStrike-Kombinatorik),
  §10 (neuer offener Punkt „`onDamageReceived` verdrahten" mit
  Implementierungsnotizen: Anknüpfpunkte `combat.ts#dealCombatDamageRound`
  und `effects.ts#dealDamageToPermanent`, Semantik-Vorgaben). Keine Karte
  im aktuellen Pool nutzt den Trigger. Per Grep verifiziert: `triggers.ts`
  enthält `onDamageReceived` nur in der Typ-Signatur, nirgends als
  tatsächlich übergebener String-Literal-Aufruf in `combat.ts`/`effects.ts`.
- **Frontend:** `docs/frontend-status.md` v0.1.4. `src/ui/deck.ts#buildDemoDeck`
  angepasst, damit das Demo-Deck bei 109 Pool-Karten nicht auf ~124
  Karten/Spieler anwächst (linear mit „alle Nicht-Terrain-Karten 1×" +
  Terrains 4×). Jetzt: Terrains weiterhin fest 4× (20 Karten), Nicht-Terrain
  eine zufällige Stichprobe ohne Zurücklegen von bis zu 40 verschiedenen
  Karten (Fisher-Yates-Teilshuffle) statt aller — Fallback auf den vollen
  Nicht-Terrain-Pool, falls dieser kleiner als 40 ist (reproduziert exakt
  das alte 27-Karten-Verhalten für kleinere Pools). Ergebnis bei 109
  Pool-Karten: `min(104,40) + 5*4 = 60` Karten/Spieler. Bewusst nicht
  geseedet (Deck-Sampling läuft vor `engine.createGame`, das seinen
  eigenen deterministischen Seed bekommt). Per Code-Lesen verifiziert
  (`NON_TERRAIN_TARGET = 40` in `deck.ts`).
- **documenter (dieser Sweep):** Nach jedem Batch/Schritt `npm test` und
  `npm run build` selbst laufen lassen statt nur Agent-Berichte zu
  übernehmen — durchgehend grün, aktuell 83/83 Tests (per Grep
  gegengezählt). Zusätzlich echten Browser-Test der finalen Demo-Partie
  durchgeführt: Bibliothek 53 + Hand 7 = 60 Karten pro Spieler (exakt die
  neue Zielgröße), keine Konsolenfehler, breite Kartenvielfalt sichtbar.
  `docs/README.md` (Statustabelle + „Nächste Schritte") auf den
  Gesamtstand Regelwerk v0.2.3 / Engine v0.2.4 (83 Tests) / Kartenpool 109
  Karten / Frontend v0.1.4 gehoben, „Nächste Schritte" komplett neu
  gefasst (Phase A + B abgeschlossen, verbleibende Punkte direkt aus
  `rules-engine.md` §10 sowie den offenen Fragen von engine-engineer/
  frontend-engineer übernommen, nicht geraten). **Gefundene
  Inkonsistenzen, korrigiert:** `docs/frontend-status.md` referenzierte in
  Kopfzeile und Setup-Skript-Kommentar noch die alte Testzahl 77 statt 83
  sowie `docs/engine-status.md (v0.2.3)` statt `(v0.2.4)` — korrigiert,
  historische Verifikationsabschnitte (v0.1.1–v0.1.3, die einen früheren
  Zeitpunkt beschreiben) bewusst unverändert gelassen. `docs/cards/
  starter-set.md` enthielt eine mittlerweile beantwortete offene Frage an
  den game-architect (`onDamageReceived`) ohne Auflösungsvermerk —
  Beantwortung ergänzt, ohne den historischen Fragetext zu entfernen.
  `docs/engine-status.md` selbst war bereits vollständig konsistent mit
  dem Code (keine Änderung nötig). Kartenzahl-Konsistenz (109) über
  `docs/README.md`, `docs/engine-status.md`, `docs/frontend-status.md`,
  `docs/cards/starter-set.md` geprüft — überall konsistent, keine
  abweichenden Zwischenstände (56/81) mehr gefunden.

## Meilenstein: Kampf-Mechaniken ausgebaut (Phase A abgeschlossen)

- **Regelwerk:** `docs/rules-engine.md` v0.2.3. Neuer Abschnitt §6d mit
  voller Kombinatorik-Tabelle (§6d(4)); §7 (SBA 4 um deathtouch erweitert),
  §9.8 **bewusst revidiert** (Mehrfachblock-Reihenfolge wählt jetzt der
  **Angreifer** über die neue PendingDecision `orderBlockers`, statt wie in
  v0.2.2 der Verteidiger — Kehrtwende, dokumentiert als solche), neue
  Entscheidung §9.9 (Trade-offs des Keyword-Pakets, u.a. Double Strike
  bewusst NICHT eingeführt), §10 aktualisiert. Vier neue Kampf-Keywords/
  -Mechaniken: `trample`, `firstStrike`, `deathtouch`, `orderBlockers`.
  Datenmodell-Erweiterung: `Keyword` +3 (`src/model/abilities.ts`),
  `PendingDecision`/`DecisionChoice` um `orderBlockers`,
  `PermanentState.deathtouchDamage` (`src/model/game-state.ts`) — beide
  Erweiterungen per Grep gegen den Code verifiziert.
- **Engine:** `docs/engine-status.md` v0.2.3. Alle vier Mechaniken in
  `src/engine/combat.ts` (+ `sba.ts`, `effects.ts`, `turn.ts`, `actions.ts`,
  `legal-actions.ts`) implementiert, inkl. der neuen
  `orderBlockers`-Decision-Verarbeitung (`buildOrderBlockersDecision`/
  `applyOrderBlockers` in `combat.ts`, per Grep verifiziert). Bestehende
  Mehrfachblock-Tests in `combat-edge-cases.test.ts` auf den neuen Flow
  umgestellt, neue Datei `combat-keywords.test.ts` (16 Tests, inkl. aller
  Kombinatorik-Fälle aus §6d(4)). Testzahl 61 → **77** — per Grep über alle
  `it(`/`test(`-Vorkommen in `src/engine/__tests__/*.test.ts` nachgezählt
  (nicht nur aus dem Agent-Bericht übernommen), stimmt mit der behaupteten
  Zahl überein. `npm run build` laut Bericht sauber.
- **Frontend:** `docs/frontend-status.md` v0.1.3. Neue dedizierte UI für
  `orderBlockers` (`src/ui/types.ts` neuer `UiMode`-Zweig
  `"orderingBlockers"`, `src/ui/components/actionPanels.ts#orderBlockersPanel`
  mit ▲/▼-Sortierung, `src/ui/render.ts` Verzweigung in
  `autoEnterForcedModes`/`actionBanner`) sowie drei neue Keyword-Labels in
  `src/ui/cardInfo.ts` (`trample`→„Trampeln", `firstStrike`→„Erstschlag",
  `deathtouch`→„Todesberührung") — alle per Grep gegen den Code verifiziert.
  Der frontend-engineer selbst hatte laut eigenem Bericht in dieser Session
  **keine** Browser-Tools zur Verfügung und verifizierte nur per
  jsdom-Klick-Simulation.
- **documenter — echte Browser-Verifikation (zusätzlich zu den
  Agent-Berichten):** Per `preview_eval` einen dynamischen Import von
  `/src/ui/store.ts` im laufenden Vite-Dev-Server geladen, zwei Blocker-Units
  und einen Angreifer direkt in den echten `GameState` injiziert, einen
  Mehrfachblock über `dispatch()` ausgelöst, die neue `orderBlockers`-UI im
  echten DOM gesehen („Schadensreihenfolge festlegen (Angreifer)...",
  nummerierte Liste mit ▲/▼-Buttons), per echtem Klick auf „▼" die
  Reihenfolge vertauscht (Waldkalb/Dornwächter), per Klick auf „Reihenfolge
  bestätigen" abgeschlossen — die vertauschte Reihenfolge kam exakt so in
  `CombatAssignment.blockedBy` an, der anschließende Kampfschaden folgte
  nachweislich dieser Reihenfolge (zuerst gelisteter Blocker bekam vollen
  verfügbaren Schaden, zweiter ging leer aus, Angreifer starb an der
  kombinierten Gegenwehr). Damit ist die Mechanik UI-zu-Engine end-to-end im
  echten Browser bestätigt, nicht nur in jsdom.
- **documenter (dieser Sweep):** `docs/README.md` (Statustabelle + „Nächste
  Schritte") auf v0.2.3/v0.2.3/v0.1.3 gehoben inkl. der eigenen
  Browser-Verifikation; `docs/engine-status.md` und `docs/frontend-status.md`
  gegengelesen und inhaltlich konsistent mit dem Code befunden (Testzahl 77
  per Grep verifiziert, `Keyword`/`PendingDecision`/`PermanentState`-
  Erweiterungen im Modell verifiziert, `orderBlockers`-Implementierung in
  `combat.ts` verifiziert, `orderBlockers`-UI-Dateien im Frontend verifiziert,
  Abwesenheit der vier neuen Keywords im echten `starterSet` verifiziert).
  **Keine Inkonsistenzen gefunden** — beide Statusdokumente stimmten bereits
  mit dem Code überein. „Nächste Schritte" in `docs/README.md` auf Phase B
  (Kartenpool-Ausbau 27 → 100+ Karten) umgestellt.

## Meilenstein: Combat-Härtungsphase abgeschlossen

- **Regelwerk:** `docs/rules-engine.md` v0.2.2. Kampf für den End-to-End-Test
  präzisiert: §6a (Priority-Fenster aller 5 Combat-Steps), §6b (Zonenwechsel
  zwischen Declare Blockers/Combat Damage — "geblockt bleibt geblockt"), §6c
  (0/negative Power/Toughness sind kein Schadensereignis), §9.8
  (Mehrfachblock-Schadensreihenfolge = Verteidiger-Wahl, dokumentierte
  Vereinfachung). Kein Datenmodell-Change. Trample-Analog und
  angreifergewählte Blocker-Reihenfolge (9.8 Option B) bewusst als
  gemeinsames Paket nach Abschnitt 10 vertagt.
- **Engine:** `docs/engine-status.md` v0.2.2. Drei Bugfixes in
  `src/engine/combat.ts#dealCombatDamage`:
  1. lifelink-Vorzeichenfehler bei Power ≤ 0 (Lebensgewinn wurde vor der
     `amount <= 0`-Prüfung akkumuliert),
  2. `onDealtCombatDamageToPlayer` feuerte fälschlich auch bei 0-Schaden,
  3. `isLast` bei Mehrfachblock wurde per rohem Array-Index statt Liveness
     bestimmt — Restschaden verpuffte, wenn der (array-)letzte Blocker im
     §6b-Fenster starb, statt beim tatsächlich letzten überlebenden Blocker
     anzukommen.
  Neue Testdatei `combat-edge-cases.test.ts` (13 Tests). Gesamt-Testzahl
  48 → **61**, alle grün (per `npm test` verifiziert, Testcode gegen
  `combat.ts` gegengelesen — Fixes stimmen mit den Testbehauptungen überein).
- **Frontend:** `docs/frontend-status.md` v0.1.2. Combat-UI (Mehrfachblock,
  guardian-Verstoß-Fehleranzeige, Instant-Response-Fenster nach Declare
  Blockers) per echter Klick-Simulation auf dem `render()`-DOM verifiziert —
  keine Lücke gefunden, keine Änderung an `src/ui/`. `vigilant` konnte mangels
  Testkarte im Demo-Deck (`src/cards/starter-set.ts` enthält keine
  `vigilant`-Karte, verifiziert) nur über den mit `guardian` geteilten
  Tapped-Rendering-Pfad teilverifiziert werden, nicht end-to-end mit einer
  echten Karte.
- **documenter (dieser Sweep):** `docs/README.md` (Statustabelle +
  "Nächste Schritte") auf den neuen Gesamtstand gehoben; `docs/engine-status.md`
  und `docs/frontend-status.md` gegengelesen — inhaltlich konsistent mit dem
  Code (Testzahl 61 per Grep verifiziert, `combat.ts` gegen die drei
  behaupteten Bugfixes gelesen, `vigilant`-Abwesenheit im Starter-Set
  verifiziert). Einzige gefundene Inkonsistenz: `docs/frontend-status.md`
  referenzierte in Kopfzeile/Setup-Abschnitt noch die alte Testzahl 48 statt
  61 — korrigiert (zwei Stellen). Der historische Verifikations-Absatz zur
  v0.1.1-Prüfung ("48/48 Engine-Tests grün") wurde bewusst NICHT geändert, da
  er einen Zeitpunkt vor der Kampf-Härtung beschreibt.

## Aktueller Gesamtstand (Kurzreferenz)

| Bereich | Version | Tests/Verifikation |
|---|---|---|
| Regelwerk | v0.2.3 (+ Nachtrag zu `onDamageReceived`, kein Versionssprung) | — (Design-Dokument) |
| Datenmodell | v0.2.1 (v0.2.3-Erweiterungen: `Keyword` +3, `orderBlockers`, `deathtouchDamage`) | unverändert seit v0.2.3, auch `costChange` (v0.2.4) brauchte keinen Modell-Change |
| Engine | v0.2.4 | 83/83 Vitest-Tests grün (per Grep nachgezählt), `npm run build` sauber; `costChange`-Static-Modifier neu implementiert |
| Starter-Kartenset | v0.5 (109 Karten + 3 Token-Definitionen) | Smoke-Test grün; Zielgröße (≥100 Karten) erreicht — **Phase B abgeschlossen** |
| Frontend/UI | v0.1.4 | Golden Path + Combat-UI + `orderBlockers`-UI weiterhin verifiziert; neu: Demo-Deck-Sampling auf 60 Karten/Spieler gedeckelt (echter Browser-Test durch documenter), keine dauerhaften UI-Tests im Repo |

## Offene Punkte (nicht blockierend), siehe `docs/README.md` "Nächste Schritte" für Details

Phase A und Phase B sind beide abgeschlossen. Verbleibend:

- **card-designer:** kein Hauptauftrag mehr offen; optionale Kandidaten für
  einen möglichen weiteren Batch: `onAttackDeclared`/`onBlockDeclared`-
  Trigger (verdrahtet, aber ungenutzt), `EffectRecipient eventSubject`,
  `modifyStats duration:"permanent"`, Karten mit >1 Zielslot.
- **engine-engineer:** `onDamageReceived` verdrahten, falls eine künftige
  Karte es braucht (Implementierungsnotizen in rules-engine.md 10 bereits
  hinterlegt); offene Rückfrage an game-architect zur Bedeutung von
  `StaticAbility.scope` bei `costChange`; StaticAbility-Test für
  `stats`/`grantKeyword` (fehlt weiterhin); Migration
  `chooseManaColor`/`chooseDiscard`/`orderScry` auf Pending-Decision-Kanal;
  X-Kosten auf aktivierten Fähigkeiten.
- **frontend-engineer:** dauerhafte UI-Tests (Vitest+jsdom); `concede`-Button;
  `computeEffectiveStats`/`computeEffectiveKeywords` offiziell in den
  `RulesEngine`-Vertrag heben; Mehrfach-Zielslot-UI; `vigilant`/`trample`/
  `firstStrike`/`deathtouch` jetzt mit echten Pool-Karten (statt nur
  Engine-Test-Fixtures) im Browser nachverifizieren; Deckbau-UI als
  nächste naheliegende Ausbaustufe.
- **game-architect:** offene Rückfrage vom engine-engineer zur Bedeutung von
  `StaticAbility.scope` bei `costChange` (`onDamageReceived` ist bereits
  beantwortet, s.o.); übrige Abschnitt-10-Punkte
  (Mulligan, >2 Spieler, Kontrollwechsel/Kopier-Effekte/Keyword-Entzug,
  Double-Strike-Analog, Priority-Fenster zwischen den Schadensrunden,
  trample-Über-Zuteilung, Spielerwahl bei Trigger-Reihenfolge,
  Modal-Effekte, X auf aktivierten Fähigkeiten, rekursive
  Cleanup-Sonderregel, Migration der drei Decision-Auto-Defaults,
  `computeEffectiveStats`-Vertragsfrage) — alle bewusst vertagt, keiner
  blockierend.
