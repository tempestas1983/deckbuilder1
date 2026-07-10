# Laufender Zwischenstand

Datum: 2026-07-10
Zweck: Einziger Ort, an dem der Projektkontext ein `/clear` überlebt. Wird von
`documenter` bei jedem finalen Sweep aktualisiert. Details/Begründungen stehen
in `docs/rules-engine.md`, `docs/engine-status.md`, `docs/frontend-status.md`,
`docs/ai-status.md`, `docs/README.md` — dieses Dokument ist die Kurzfassung
"wo stehen wir gerade".

## Meilenstein: Vier Regellücken geschlossen + einfacher KI-Gegner + UI-Komfortfeatures

- **Regelwerk:** `docs/rules-engine.md` v0.2.3 → **v0.3.1**. Vier zuvor
  bewusst vertagte Punkte aus Abschnitt 10 geschlossen (Entscheidungen
  9.10–9.13):
  1. **`onDamageReceived` verdrahtet** (9.10): feuert jetzt einmal pro
     Schadensereignis für Kampf- UND Effekt-Schaden > 0 an ein Permanent;
     Schaden ≤ 0 feuert nicht (§6c); letaler Schaden feuert trotzdem
     (Trigger überlebt den Tod der Quelle in der Pending-Queue);
     `eventSubject` = die Schadensquelle (nicht `self`, bewusste Abweichung
     von den übrigen Self-Combat-Triggern, ermöglicht Vergeltungsdesigns).
     Der bisherige „reserviert, nicht verwenden"-Status ist aufgehoben.
  2. **Mulligan-Regel** (9.11, neuer Abschnitt 1b): klassische
     Paris-Variante (neu mischen, eine Karte weniger ziehen), streng
     sequentiell (erst Startspieler komplett, dann der andere), über neue
     `PendingDecision`-Variante `mulligan`; `PlayerState.mulligans` neu,
     `CreateGameConfig.skipMulligans` für Tests (Default `false` — die
     Regel gilt im echten Spiel immer).
  3. **X-Kosten auf aktivierten Fähigkeiten** (9.12): `chosenX` jetzt auch
     an der `activateAbility`-Aktion und am Stack-Objekt, exakt das
     bisherige Spell-Muster; Verbot für Mana-Fähigkeiten.
  4. **Modal-Effekte „wähle eines —"** (9.13): neuer Typ `EffectMode` +
     `modes`-Feld auf `SpellCard`/`ActivatedAbility`/`TriggeredAbility`
     (ersetzt bei modalen Objekten die flachen `targets`/`effects`-Felder);
     Moduswahl vor X- und Zielwahl; bei Spells/aktivierten Fähigkeiten
     atomar als Teil der Aktion, bei Triggern über neue `PendingDecision`
     `chooseMode`.
  - **v0.3.1-Nachtrag:** Der engine-engineer fand bei der v0.3-Umsetzung
    einen Modellkonflikt in der Ketten-Decision `chooseMode` →
    `chooseTriggerTargets` (ein modaler Trigger, dessen gewählter Modus
    selbst mehrdeutige Ziele hat, hätte den bereits gewählten Modus über
    den zweiten `resolveDecision`-Roundtrip verloren). Gelöst über ein
    additives, optionales Feld `chosenMode?: number` an der
    `PendingDecision`-Variante `chooseTriggerTargets` (bewusst OHNE
    Gegenstück an `DecisionChoice`, die Engine liest den Modus aus
    `state.pendingDecision`). Der dokumentierte Interims-Auto-Pick der
    Engine ist damit abgelöst und entfernt.
  - Die großen, weiterhin bewusst vertagten Themen (>2 Spieler,
    Kontrollwechsel/Kopier-Effekte, Double-Strike-Analog,
    London-Mulligan-Upgrade, „wähle zwei" bei Modal-Effekten u. a.) bleiben
    unverändert in Abschnitt 10 dokumentiert, kein aktueller Kartenbedarf.

- **Engine:** `docs/engine-status.md` v0.2.4 → **v0.3.2**. Alle vier
  Regelwerks-Punkte umgesetzt: neuer zentraler Schadenshelfer
  `damage.ts#applyDamageToPermanent` (genutzt von `combat.ts` UND
  `effects.ts`, dedupliziert nebenbei die vorher doppelte
  deathtouch-Flag-Logik) + `triggers.ts#fireOnDamageReceivedTrigger` für
  `onDamageReceived`; neues Modul `mulligan.ts` für die Paris-Mulligan-Phase
  (alle 77 bestehenden `createGame(`-Aufrufe in den Testdateien auf
  `skipMulligans: true` umgestellt, da der neue Default `false` sonst jeden
  Bestandstest vor dem ersten Priority-Fenster hätte pausieren lassen);
  `chosenX` an `activateAbility`/Stack-Objekt (X-Kosten auf Fähigkeiten);
  neues Modul `modal.ts` für Modal-Effekte inkl. `chooseMode`-Decision.
  **v0.3.1:** Modellkonflikt-Fund (s. Regelwerk-Zeile oben) umgesetzt —
  `triggers.ts#stackModalTriggerWithMode` liefert jetzt zusätzlich
  `"awaitingDecision"`, der Interims-Auto-Pick ist entfernt.
  **v0.3.2 (echter Bugfix, gefunden beim Bot-Stresstest des neuen
  KI-Moduls, nicht nur ein Enumerations-Grenzfall):**
  `legal-actions.ts#activateAbilityCandidates` prüfte von den vier
  `AdditionalCost`-Varianten (`tap`/`payLife`/`discardCards`/
  `removeCounters`) nur `tap` auf tatsächliche Bezahlbarkeit —
  `getLegalActions` konnte dadurch einen `activateAbility`-Kandidaten
  liefern, den `applyAction` anschließend mit einem `error` ablehnte (ein
  Verstoß gegen den impliziten Vertrag „enumerierte Kandidaten sind
  ausführbar", potenziell auch im echten UI ein anklickbarer, aber
  fehlschlagender Button). Neue Hilfsfunktion `additionalCostsPayable`
  prüft jetzt alle vier Varianten identisch zu `actions.ts`; neue
  `legal-actions.test.ts` (3 Tests). Engine-Testzahl (nur
  `src/engine/__tests__/*`) 83 → **119** — per Grep über alle
  `it(`/`test(`-Vorkommen in `src/engine/__tests__/*.test.ts` nachgezählt
  (documenter, nicht nur aus Agent-Berichten übernommen, da dieser Sweep
  ohne Bash-Werkzeug lief und `npm test` nicht selbst ausgeführt werden
  konnte — Kreuzverifikation über alle drei Testverzeichnisse s. u.).

- **Kartenpool:** `docs/cards/starter-set.md` v0.5 → **v0.6** (109 → **113**
  Karten). Der card-designer hat vier neue Karten als Demo-/Abnahmekarten
  für die vier neuen Mechaniken ergänzt: `core.void-covenant` (modaler
  Spell, 3 Modi, einer mit Zielslot), `core.current-diplomat` (Unit mit
  modalem ETB-Trigger, testet `chooseMode` inkl. Auto-Pick-Fall),
  `core.thornrage-boar` (`onDamageReceived`-Vergeltungsdesign über
  `EffectRecipient "eventSubject"`, bewusst KEIN Token wie vom
  game-architect gefordert), `core.cinderwrack-engine` (Relic mit
  `{X}, Tappe: …`-Mana-Sink, keine Mana-Fähigkeit, geht über den Stack).
  Kein Modellkonflikt — alle benötigten Felder existierten bereits exakt
  wie in rules-engine.md v0.3 beschrieben. Kartenzahl per Grep gegen
  `src/cards/starter-set.ts` verifiziert (116 `id: "core.…"`-Einträge
  insgesamt, davon 3 tatsächliche `isToken:true`-Karten — ein vierter
  Grep-Treffer war nur ein Code-Kommentar, der den String „isToken:true"
  erwähnt, kein echtes Feld — macht 113 reguläre Karten, stimmt mit der
  Behauptung überein).

- **Frontend:** `docs/frontend-status.md` v0.1.4 → **v0.1.8**, in vier
  Schritten:
  - **v0.1.5:** dauerhafte UI-Regressionstests im Repo (`src/ui/__tests__/`,
    `jsdom` als neue Dev-Dependency, datei-lokal per
    `// @vitest-environment jsdom` statt global, damit die reinen
    Engine-Tests weiterhin unter `node` laufen) — löst die bisherige Praxis
    ab, Verifikations-Tests nach jeder Runde wieder zu löschen. Zusätzlich
    ein echter Deckbau-Screen vor Spielstart (`AppPhase`-Zustand,
    sequenziell Spieler 1 → Spieler 2, „Gleiches Deck übernehmen"-
    Abkürzung, `deckValidation.ts` nach dem `Decklist`-Kommentar: min. 40
    Karten, max. 4 Kopien pro Nicht-Terrain-Karte, „Zufällig füllen"-Button
    ruft weiterhin `buildDemoDeck`) — löst die automatische Demo-Partie ab.
  - **v0.1.6:** echte Mulligan-UI (`mulliganPanel`, löst den
    `skipMulligans: true`-Notbehelf in `store.ts` ab), Modus-Wahl-UI für
    modale Spells/aktivierte Fähigkeiten (atomar, `modeSelect`-`UiMode`)
    und getriggerte Fähigkeiten (`chooseMode`-`pendingDecision`-Zweig),
    X-Kosten-UI-Mechanismus von `castSpell` auf `activateAbility`
    verallgemeinert (neuer `CastSource`-Typ).
  - **v0.1.7:** „Spieler 2 = KI"-Anbindung an `src/ai/simpleBot.ts` —
    Umschalter im Deckbau-Screen von Spieler 2 („Spieler 2 von KI steuern
    lassen" + „Zufälliges KI-Deck + weiter"-Schnellstart), automatischer
    Zug-Loop in `store.ts` (`actingPlayer`/`triggerBotLoop`/`runBotStep`,
    mit `botMoveDelayMs` für sichtbare Zug-für-Zug-Animation und einem
    Endlosschleifen-Schutz), „KI"-Badge im Spieler-Panel.
  - **v0.1.8 (2026-07-10):** `concede`-Button pro Spieler
    (`window.confirm`-Bestätigung, ausgeblendet für bot-gesteuerte Spieler
    und nach Spielende — die Engine kannte `concede` bereits vollständig,
    reine UI-Verdrahtung) sowie `localStorage`-Persistenz der zuletzt
    bestätigten Decklisten (übersteht jetzt einen echten Seiten-Reload,
    nicht mehr nur „Neues Spiel" im selben Tab; defensiv per try/catch,
    ein Bot-Schnellstart-Deck für Spieler 2 wird bewusst NICHT gespeichert).
  - `npm test` lief laut allen Agent-Berichten durchgehend grün, zuletzt
    **141/141** (135 vor v0.1.7, +1 `vs-bot.test.ts`, +5 `concede.test.ts`/
    `deck-persistence.test.ts` in v0.1.8); `npm run build`/`npm run
    build:ui` laut Berichten durchgehend sauber.

- **Neu: KI-Gegner-Modul `src/ai/`** (`docs/ai-status.md`, neu in diesem
  Sweep-Zeitraum). `chooseAction(engine, pool, state, player): PlayerAction`
  in `src/ai/simpleBot.ts` ist ein einfacher, regelbasierter Bot **v1** ohne
  Schwierigkeitsstufen — bewusst als Fundament für einen späteren Ausbau
  gedacht (s. „Nächster geplanter Meilenstein" in `docs/README.md`). Spielt
  **ausschließlich** über die öffentliche `RulesEngine`-Schnittstelle
  (`getLegalActions`/`applyAction`), keine Engine-Interna. Heuristiken:
  einfache Score-Bewertungen ohne Lookahead (Power+Toughness/Manakosten für
  Units, Removal-Priorisierung nach Zielgröße, Terrains nur in der eigenen
  Main-Phase, Angriff/Block nach groben Lebensstand-/Überlebens-Heuristiken).
  Zwei nicht-offensichtliche Heuristik-Bugs wurden erst durch echte
  Bot-vs-Bot-Simulationen über den vollen Kartenpool gefunden und behoben
  (Kampf-Lähmung durch einen fehlerhaften Worst-Case-Blocker-Check gegen das
  gesamte gegnerische Board statt 1:1-Zuordnung; Mana-Verschwendung durch
  proaktives Terrain-Tappen außerhalb der eigenen Main-Phase). **Fand dabei
  außerdem den oben dokumentierten echten Engine-Bug** (v0.3.2) — genau das
  vorgesehene Muster: gemeldet statt eigenmächtig in die Engine
  einzugreifen. 11 dauerhafte Tests (`src/ai/__tests__/simpleBot.test.ts`:
  10 einzeln benannte Seeds als Schleife über `it()` + 1 Stichprobentest
  über 3 weitere Seeds = 13 vollständige Bot-vs-Bot-Partien über den echten
  113-Karten-Pool). Bekannte, bewusste v1-Schwächen (Ausgangspunkt für den
  künftigen Ausbau): kein Lookahead, ignoriert statische Fremd-Effekte
  anderer Permanents bei der Stat-/Keyword-Schätzung, kein
  Kombo-/Synergieverständnis, keine Instant-Speed-Taktik (hält nie
  proaktiv Mana offen), grobe Zieloptimierung bei Removal, grobe
  Discard-Heuristik — Details `docs/ai-status.md` Abschnitt 6.

- **Neuer fünfter Subagent: `ai-opponent-engineer`**
  (`.claude/agents/ai-opponent-engineer.md`, Modell `claude-fable-5`,
  Fallback `claude-opus-4-8`). Spezialisiert auf den Ausbau von `src/ai/*`
  zu echten, spürbar unterschiedlichen Schwierigkeitsstufen (Nutzer wünscht
  explizit drei Stufen) — Entscheidungslogik/Bewertungsfunktionen,
  Performance-Budget für teurere Heuristiken (Minimax/Suche), automatisierte
  Bot-vs-Bot-Sanity-Checks („höhere Stufe schlägt tendenziell niedrigere"),
  strikte Konsumenten-Grenze (nur `getLegalActions`/`applyAction`, keine
  Engine-/Model-Änderungen — echte Schnittstellenlücken werden an
  Koordinator/game-architect zurückgemeldet statt eigenmächtig in die Engine
  eingebaut), kein eigenes UI (Schwierigkeitsgrad-Regler in Absprache mit
  frontend-engineer). **Dieser Ausbau ist bewusst NICHT Teil dieses Sweeps
  — noch nicht gestartet, für eine künftige Session zurückgestellt** (s.
  „Nächster geplanter Meilenstein" in `docs/README.md`).

- **documenter (dieser Sweep, 2026-07-10):** Alle fünf Rollen-Dokumente
  (`docs/rules-engine.md`, `docs/engine-status.md`,
  `docs/cards/starter-set.md`, `docs/frontend-status.md`,
  `docs/ai-status.md`) vollständig gelesen und gegen den tatsächlichen Code
  verifiziert statt Agent-Berichte zu übernehmen: Kartenzahl 113 per Grep
  gegen `src/cards/starter-set.ts` bestätigt; Testzahl 141 per Grep über
  `it(`/`test(`-Vorkommen in allen drei Testverzeichnissen nachgezählt
  (119 Engine + 11 UI + 11 KI, letzteres inkl. einer seed-parametrisierten
  Schleife, die 10 einzelne Testfälle zur Laufzeit erzeugt — statische
  Quelltext-Zählung allein hätte hier nur 2 ergeben, per genauer
  Code-Lektüre aufgelöst). **Hinweis:** `npm test`/`npm run build` konnten
  in dieser Session nicht selbst ausgeführt werden (kein Bash-Werkzeug
  verfügbar) — die 141/grün-Behauptung stützt sich auf die
  Grep-Kreuzverifikation plus den übereinstimmenden, jeweils tagesaktuellen
  Verifikationsabschnitten von engine-engineer/frontend-engineer/
  ai-opponent-Vorarbeit selbst; keine Abweichung zwischen den Quellen
  gefunden. **Gefundene Inkonsistenzen, korrigiert:**
  `docs/engine-status.md` enthielt eine seit v0.3.1 nicht mehr
  nachgeführte „## Tests"-Aufzählung (Kopfzeile „118 Tests", fehlender
  Bullet für `legal-actions.test.ts` aus v0.3.2) — Kopfzeile richtiggestellt
  und fehlender Bullet ergänzt, ohne die übrige Liste (die bewusst nicht
  jede UI-/KI-Testdatei einzeln führt) neu zu schreiben.
  `docs/frontend-status.md` referenzierte in seiner Kopfzeile noch
  „`docs/engine-status.md` (v0.3.1, 118 Tests)" statt „v0.3.2, 135 Tests" —
  korrigiert. `docs/README.md` auf den vollständigen neuen Gesamtstand
  gehoben (Statustabelle, neue Zeile für den KI-Gegner, „Nächste Schritte"
  komplett neu gefasst mit dem KI-Ausbau als klar benanntem nächsten
  Meilenstein). Historische Verifikationsabschnitte in allen Dokumenten
  (die einen früheren Zeitpunkt beschreiben, z. B. die v0.1.1–v0.1.7-
  Abschnitte in `docs/frontend-status.md` oder die v0.2.x-Abschnitte in
  `docs/engine-status.md`) bewusst unverändert gelassen.

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
| Regelwerk | v0.3.1 (vier Abschnitt-10-Punkte geschlossen: `onDamageReceived`, Mulligan, X auf aktivierten Fähigkeiten, Modal-Effekte; v0.3.1 = Nachtrag zu 9.13) | — (Design-Dokument) |
| Datenmodell | v0.2.1 (v0.3-Erweiterungen: `EffectMode`/`modes`, `PendingDecision`/`DecisionChoice` +`mulligan`/`chooseMode`, `chosenX`/`chosenMode` an Aktionen/Stack-Objekten, `PlayerState.mulligans`, `CreateGameConfig.skipMulligans`; v0.3.1: additives `chosenMode?` an `chooseTriggerTargets`) | unverändert an sich, nur additive Erweiterungen |
| Engine | v0.3.2 (v0.3.2 = Bugfix `legal-actions.ts` Zusatzkosten-Prüfung, gefunden beim Bot-Stresstest) | 141/141 Vitest-Tests grün laut allen Agent-Berichten (119 Engine + 11 UI + 11 KI, per Grep gegengezählt — `npm test` in dieser Sweep-Session mangels Bash-Werkzeug nicht selbst ausgeführt), `npm run build` laut Berichten sauber |
| Starter-Kartenset | v0.6 (113 Karten + 3 Token-Definitionen) | per Grep gegen `src/cards/starter-set.ts` verifiziert (116 `id:"core.…"` − 3 Token = 113) |
| Frontend/UI | v0.1.8 | Deckbau-UI, dauerhafte UI-Tests (jsdom+Vitest), Mulligan-/Modal-/X-Kosten-UI, KI-Umschalter, `concede`-Button, `localStorage`-Deck-Persistenz — alle laut Agent-Berichten verifiziert |
| KI-Gegner | v1 (`src/ai/simpleBot.ts`, neu) | 11 dauerhafte Bot-vs-Bot-Tests (13 vollständige Partien über den echten 113-Karten-Pool); bewusst ohne Schwierigkeitsstufen — Fundament für den `ai-opponent-engineer`-Subagenten |

## Offene Punkte (nicht blockierend), siehe `docs/README.md` "Nächste Schritte" für Details

Die vier Abschnitt-10-Punkte aus dem vorigen Zwischenstand sind geschlossen
(s. Meilenstein oben). **Nächster geplanter Meilenstein:** KI-Gegner-Ausbau
zu drei Schwierigkeitsstufen durch den neuen `ai-opponent-engineer`-
Subagenten — bewusst noch nicht gestartet, für eine künftige Session
zurückgestellt. Verbleibend sonst:

- **card-designer:** weiterhin kein Hauptauftrag offen; optionale
  Kandidaten für einen möglichen weiteren Batch unverändert:
  `onAttackDeclared`/`onBlockDeclared`-Trigger (verdrahtet, aber ungenutzt),
  `modifyStats duration:"permanent"`, Karten mit >1 Zielslot.
- **engine-engineer:** offene Rückfrage an game-architect zur Bedeutung von
  `StaticAbility.scope` bei `costChange` (weiterhin unbeantwortet);
  StaticAbility-Test für `stats`/`grantKeyword` (fehlt weiterhin); Migration
  `chooseManaColor`/`chooseDiscard`/`orderScry` auf Pending-Decision-Kanal
  (sobald Kartenpool-Bedarf besteht).
- **frontend-engineer:** dauerhafter Klick-Test für den modalen Trigger-Fall
  (`core.current-diplomat`, Code-Pfad steht, Test fehlt noch); Mehrfach-
  Zielslot-UI (kein Pool-Bedarf bisher); `computeEffectiveStats`/
  `computeEffectiveKeywords` offiziell in den `RulesEngine`-Vertrag heben;
  Migration `chooseManaColor`/`chooseDiscard`/`orderScry` (s.o., zieht
  Frontend-Arbeit nach sich, sobald die Engine migriert); Bot-
  Schwierigkeitsstufe/-Timing nicht im UI einstellbar (wird erst mit dem
  KI-Ausbau relevant).
- **game-architect:** offene Rückfrage vom engine-engineer zu
  `StaticAbility.scope` bei `costChange`; die großen, bewusst vertagten
  Themen aus Abschnitt 10 (>2 Spieler, Kontrollwechsel/Kopier-Effekte/
  Keyword-Entzug, Double-Strike-Analog, Priority-Fenster zwischen den
  Schadensrunden, trample-Über-Zuteilung, Spielerwahl bei Trigger-
  Reihenfolge, „Spieler erleidet Schaden"-Trigger, London-Mulligan-Upgrade,
  „wähle zwei" bei Modal-Effekten, rekursive Cleanup-Sonderregel,
  `addMana("any")`/`discardCards`/`scry`-Migration, kombinatorische
  `getLegalActions`-Enumeration) — alle ausdrücklich nur bei konkretem
  Kartenbedarf anzugehen, kein aktiver Auftrag.
- **ai-opponent-engineer (künftige Session):** Ausbau von `src/ai/*` auf
  drei spürbar unterschiedliche Schwierigkeitsstufen, aufbauend auf den in
  `docs/ai-status.md` Abschnitt 6 dokumentierten v1-Schwächen (kein
  Lookahead, ignoriert statische Fremd-Effekte, kein Kombo-Verständnis,
  keine Instant-Speed-Taktik, grobe Ziel-/Discard-Heuristiken).
