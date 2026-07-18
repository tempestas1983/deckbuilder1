# KI-Gegner-Status

Status: **v2.1 — Legalitäts-Fixes fürs 300-Karten-Set + Farb-Balance-Analyse**
(ai-opponent-engineer, fable-5) — 2026-07-11 (Details: Abschnitt 10).
v2 — Schwierigkeitsstufen (ai-opponent-engineer, fable-5) — 2026-07-10.
(v1-Basis: engine-engineer — 2026-07-09; die v1-Abschnitte 1–8 unten gelten
für die mittlere Stufe, mit zwei in Abschnitt 10 dokumentierten
Legalitäts-Korrekturen.)
Grundlage: `docs/rules-engine.md` (v0.3.1 zum Zeitpunkt der v2/v2.1-Arbeit;
**documenter-Korrektur 2026-07-18:** rules-engine.md steht inzwischen bei
v0.3.3 — die zwei nachträglichen Änderungen 9.14/9.15 betreffen reine
Engine-interne Fizzle-/Todes-Semantik ohne Modell- oder KI-Auswirkung, kein
Nacharbeitsbedarf für dieses Dokument), öffentliche `RulesEngine`-Schnittstelle
(`src/engine/index.ts` / `src/model/game-state.ts`).
Code v1: `src/ai/simpleBot.ts` (unverändert = Stufe "medium").
Code v2: `src/ai/difficulty.ts` (öffentliche API), `src/ai/easyBot.ts`,
`src/ai/hardBot.ts`, `src/ai/boardEval.ts`, `src/ai/index.ts`.
Tests: `src/ai/__tests__/simpleBot.test.ts` (v1, unverändert) +
`src/ai/__tests__/difficulty.test.ts` (v2, Stärkevergleich/Verträge).
Details zu v2: Abschnitt 9 unten.

Dieses Dokument beschreibt den einfachen, regelbasierten KI-Gegner (v1) —
bewusst simpel gehalten, **kein Balancing-Anspruch**. Es ist das Fundament für
einen späteren zweiten Schritt: ein spezialisierter Agent (fable-5-Modell) soll
darauf einen echten Schwierigkeitsstufen-Ausbau aufsetzen. Dieses Dokument
grenzt daher bewusst auch ab, was v1 **nicht** leistet.

---

## 1. Architektur

`chooseAction(engine, pool, state, player): PlayerAction` in `src/ai/simpleBot.ts`
ist die einzige öffentliche Funktion des Moduls. Sie spielt **ausschließlich**
über die öffentliche `RulesEngine`-Schnittstelle:

- `engine.getLegalActions(state, player)` liefert die Kandidatenliste.
- Die zurückgegebene Aktion wird vom **Aufrufer** per `engine.applyAction(state, action)`
  ausgeführt (die Bot-Funktion selbst ruft `applyAction` nicht auf — sie ist eine
  reine Entscheidungsfunktion, wie es die Aufgabenstellung vorgab).

**Signatur-Abweichung vom Vorschlag der Aufgabenstellung:** `chooseAction` nimmt
zusätzlich einen `pool: CardPool`-Parameter entgegen (`chooseAction(engine, pool,
state, player)` statt `chooseAction(engine, state, player)`). Begründung: `GameState`
enthält nur `definitionId`s, keine Kartendaten (Kosten, Power/Toughness, Effekte) —
ohne den Pool könnte der Bot keine sinnvolle "beste Option"-Bewertung vornehmen.
Das ist exakt das Muster, das auch das UI verwendet: `src/ui/store.ts` hält den
`CardPool` (`starterSet`) getrennt von der `RulesEngine`-Instanz und reicht ihn an
alle UI-Funktionen durch, die Kartendaten brauchen. `src/ai/simpleBot.ts` ist damit
ein reiner Konsument, genau wie das UI — **keine** Änderung an `src/engine/*`
oder `src/model/*`, **keine** Imports aus Engine-Internals
(`computeEffectiveStats`, `isLegalAttacker`, `canPayCost`, `getDefinition`, …).
Alle Kartendaten- und Zustandslesungen laufen über die öffentlich typisierten
`CardPool`/`GameState`-Strukturen aus `src/model`.

**Nutzungsvertrag (wichtig für den Aufrufer):** `chooseAction` darf nur für den
Spieler aufgerufen werden, der gerade tatsächlich handeln muss — also
`state.priorityPlayer`, `state.pendingDecision?.player`, den aktiven Spieler bei
`declareAttackers`, den Verteidiger bei `declareBlockers`, oder den aktiven
Spieler bei überzähliger Hand im Cleanup (`discardToHandSize`, s.u.). Wird die
Funktion für den "falschen" Spieler aufgerufen (der laut Engine-Vertrag gerade
gar keine Wahlmöglichkeit außer `concede` hat), würde sie im Fallback-Pfad
`concede` zurückgeben — das ist beabsichtigt kein Sonderfall, weil die Engine in
dieser Situation ohnehin nur `concede` als legalen Kandidaten liefert. Die
Testsuite implementiert diesen Vertrag über eine eigene `actingPlayer(state)`-
Hilfsfunktion (siehe `simpleBot.test.ts`), die exakt dieselbe Fallunterscheidung
trifft, die auch `src/engine/turn.ts`/`legal-actions.ts` intern verwenden.

---

## 2. Heuristiken (v1, bewusst simpel, kein Lookahead)

Reihenfolge pro `chooseAction`-Aufruf:

1. **Pending Decision** des Bots auflösen (falls `state.pendingDecision.player === player`):
   - `mulligan`: Starthand behalten, außer sie hat 0–1 oder >5 Terrains → dann mulliganen.
   - `chooseMode`: ersten wählbaren Modus nehmen.
   - `orderBlockers`: die von der Engine vorgeschlagene (unveränderte)
     Deklarationsreihenfolge bestätigen — `getLegalActions` liefert dafür ohnehin
     nur genau einen Kandidaten.
   - `chooseTriggerTargets`: erstes legales Ziel, bevorzugt ein gegnerisches
     Permanent, falls die Fähigkeit einen "schädlichen" Effekt hat (`dealDamage`/
     `destroyPermanent`/`exilePermanent`).
2. **Terrain spielen**, falls ein `playTerrain`-Kandidat verfügbar ist (die
   1×/Zug-Grenze prüft die Engine bereits selbst — taucht das Terrain in
   `getLegalActions` auf, ist es sicher spielbar).
3. **Cast/Activate — beste leistbare Option:**
   - Units: Score = (Power+Toughness) / Manakosten.
   - Spells/aktivierte Fähigkeiten mit "schädlichem" Effekt (`dealDamage`/
     `destroyPermanent`/`exilePermanent`) auf ein gegnerisches Unit-Ziel: hohe
     Baseline + (Power+Toughness des Ziels) / Manakosten (Removal wird bevorzugt,
     stärker gegen große Ziele).
   - Sonst: günstigste verfügbare Option (Score ~ 1/Manakosten).
   - Mana-Fähigkeiten (Terrains) werden nur aktiviert, wenn gerade **nichts
     Besseres** verfügbar ist — und (wichtiger Fund beim Testen, s. Abschnitt 4)
     **nur in der eigenen Main-Phase**, nie vorsorglich in Upkeep/Draw/Combat/
     im gegnerischen Zug.
4. **Angreifer deklarieren:** mit allen ungetappten, nicht kranken Kreaturen
   angreifen, außer ein einzelner gegnerischer Blocker würde sie ohne
   Gegenwert töten — dabei wird (wichtiger Fund, s. Abschnitt 4) korrekt
   berücksichtigt, dass ein Blocker immer nur EINEN Angreifer blocken kann.
5. **Blocker deklarieren:** nur blocken, wenn der eingehende Schaden spürbar
   ist (Leben ≤ 10 ODER Angriff ≥ 30 % des aktuellen Lebens) UND ein Blocker
   verfügbar ist, der überlebt oder den Angreifer tötet/mit-tötet — kein
   reines Chump-Blocken bei komfortablem Lebensstand. `guardian`-Pflichten
   werden immer erfüllt (unabhängig vom Lebensstand, da sonst illegal).
6. **Sonst:** `passPriority`.

Zusätzlich (nicht Teil der 6 Kernheuristiken, aber für **vollständige** Partien
nötig, sonst würde die Partie im Cleanup steckenbleiben): Handkarten-Abwurf bei
Handkartenlimit-Überschreitung (`discardToHandSize`) — einfache Heuristik,
wirft die Karten mit dem niedrigsten geschätzten Wert zuerst ab (Terrains werden
tendenziell behalten).

Alle Stat-/Keyword-Schätzungen (`roughPower`/`roughToughness`/`hasBaseKeyword`)
nutzen **nur** Basiswerte + Marken (+1/+1/-1/-1) + "bis Zugende"-Modifikatoren
**desselben** Permanents direkt aus `GameState` — statische Fähigkeiten anderer
Permanents (Anthems, Debuffs) werden **nicht** berücksichtigt (siehe Abschnitt 6,
bekannte Schwäche 1).

---

## 3. Abweichungen von der reinen Kandidatenliste (bewusst, dokumentiert)

Die Aufgabenstellung fordert, dass `chooseAction` "IMMER eine legale Aktion aus
`getLegalActions(state, player)` zurückgibt (nie eine erfundene)". Für die
meisten Aktionsarten (Terrain, Cast, Activate, alle PendingDecisions) hält sich
`simpleBot.ts` strikt daran — es wird ausschließlich aus dem von `getLegalActions`
gelieferten Array ausgewählt. Für **zwei** Aktionsarten ist das beim Testen
nachweislich nicht praktikabel, und der `RulesEngine`-Vertrag selbst sieht das
explizit vor:

### 3.1 Kampf-Deklarationen (`declareAttackers`/`declareBlockers`)

`getLegalActions` enumeriert laut eigenem Vertragskommentar (`legal-actions.ts`)
bewusst **keine** kombinatorischen Angreifer-/Blocker-Teilmengen, sondern nur
"kein Angreifer" bzw. **einzelne** Ein-Kreatur-Kandidaten — mit dem expliziten
Hinweis: *"Frontend kann dennoch JEDE legale Kombination per `applyAction`
einreichen"*. Das reale UI (`src/ui/render.ts`) folgt genau diesem Muster: Es
sammelt mehrere Auswahlklicks in einem lokalen UI-Modus und dispatcht am Ende
**eine** `declareAttackers`/`declareBlockers`-Aktion mit der vollen Liste — nicht
über `getLegalActions`.

`simpleBot.ts` folgt demselben, vom Vertrag sanktionierten Muster:

- **Angreifer:** Die einzeln legalen Angreifer-IDs werden aus den
  Ein-Kreatur-Kandidaten von `getLegalActions` **extrahiert** (jede einzelne ID
  ist damit engine-validiert legal). Da `isLegalAttacker` ausschließlich
  pro-Einheit prüft (keine Kombinationsregeln, verifiziert in `combat.ts`), ist
  jede Kombination individuell legaler Angreifer ebenfalls legal. Die
  konstruierte Mehrfach-Angreifer-Aktion besteht **ausschließlich** aus
  IDs, die einzeln als legaler Kandidat bestätigt wurden.
- **Blocker:** Hier reicht die Extraktion **nicht** aus. Fund beim Bauen:
  Ist mindestens eine `guardian`-Pflicht aktiv, enumeriert `getLegalActions`
  laut eigenem Code-Kommentar entweder nur Kandidaten für die EINE pflichtige
  guardian-Einheit (bei genau einer Pflicht) oder **gar keine**
  `declareBlockers`-Kandidaten mehr (bei ≥ 2 gleichzeitigen Pflichten — dann
  bliebe im Kandidaten-Array nur `concede` übrig!). Für den Blocker-Fall
  konstruiert `simpleBot.ts` die Aktion daher direkt aus `GameState` (eigene,
  vereinfachte `canBlockPair`-Prüfung: Tap-Status, Kampfrolle, Airborne/Reach
  nur über Basis-Keywords). **Restrisiko (v1):** Statisch von ANDEREN
  Permanents gewährte Keywords (Anthems) fließen dort nicht ein — bei Karten,
  die `guardian`/`airborne`/`reach` per Static-Ability an fremde Einheiten
  vergeben, könnte der Bot dadurch theoretisch eine vom echten Regelwerk
  abweichende (im schlimmsten Fall abgelehnte) Blockentscheidung treffen. Für
  den damaligen `core`-Kartenpool (109 Karten, keine solche Static-Ability)
  trat das nicht auf; alle 50 stichprobenartig simulierten Partien liefen
  fehlerfrei durch. **UPDATE v2.1: Das Restrisiko ist mit dem 300-Karten-Set
  real geworden (guardian-Aura) und wurde behoben — die Blocklegalität nutzt
  jetzt in allen Stufen effektive Keywords, siehe Abschnitt 10.1.**

### 3.2 Cleanup-Abwurf (`discardToHandSize`)

`getLegalActions` enumeriert `discardToHandSize` laut eigenem Kommentar
bewusst gar nicht (kombinatorisch, spielerabhängige Wahl) — das UI erkennt die
Pflicht stattdessen direkt an `state.step === "cleanup" && priorityPlayer ===
undefined && pendingDecision === undefined && hand.length > 7`. `simpleBot.ts`
folgt exakt diesem dokumentierten Muster und konstruiert die Aktion selbst.

---

## 4. Gefundene Engine-Abweichung — **behoben** (v0.3.2)

Beim Bot-vs-Bot-Testen wurde ein Fall gefunden, in dem `applyAction` einen von
`getLegalActions` gelieferten Kandidaten als **illegal** ablehnte — das war
kein Bug im Bot (der ausschließlich aus der Kandidatenliste wählte), sondern
eine Lücke in `legal-actions.ts#activateAbilityCandidates`:

> `activateAbilityCandidates` prüfte von den vier `AdditionalCost`-Varianten
> (`tap`, `payLife`, `discardCards`, `removeCounters`) nur **`tap`** auf
> tatsächliche Bezahlbarkeit. `applyAction` (`actions.ts`, Validierung ab
> Zeile ~161) prüft dagegen alle vier. Beobachtet: eine aktivierte Fähigkeit
> mit `removeCounters`-Zusatzkosten wurde von `getLegalActions` als Kandidat
> geliefert, obwohl die Quelle nicht genug Marken des geforderten Typs hatte —
> `applyAction` lehnte mit `"Nicht genug Marken."` ab.

Dieser Fund wurde zunächst nur dokumentiert (dieses Modul durfte die Engine
laut ursprünglichem Auftrag nicht ändern) und über einen defensiven
Konsumenten-seitigen Workaround in `simpleBot.ts` abgefangen. Der Koordinator
hat den Fund als echten Correctness-Bug im Bestandscode eingestuft (nicht als
Design-Grenzfall) und die Behebung direkt im Engine-Code beauftragt:

- **Fix (`src/engine/legal-actions.ts`):** neue Hilfsfunktion
  `additionalCostsPayable` prüft jetzt alle vier `AdditionalCost`-Varianten
  identisch zu `actions.ts#validateAction`. `getLegalActions` liefert damit
  keinen `activateAbility`-Kandidaten mehr, den `applyAction` anschließend
  ablehnen würde. Details/Begründung: `docs/engine-status.md`, Abschnitt
  "v0.3.2: Bugfix — `getLegalActions` prüfte bei `activateAbility` nicht alle
  Zusatzkosten".
- **Regressionstest:** `src/engine/__tests__/legal-actions.test.ts` (3 Tests,
  neue Testkarte `UNAFFORDABLE_COSTS_RELIC` in `fixtures.ts`) — deckt alle drei
  vorher ungeprüften Kostenarten ab.
- **Bot-seitiger Workaround entfernt:** `simpleBot.ts#canAffordAdditionalCosts`
  war ausschließlich für diesen Bug da und wurde nach dem Engine-Fix wieder
  entfernt (dieselbe Bot-vs-Bot-Stichprobe über 50 Seeds lief davor und danach
  mit identischem Ergebnis durch — der Workaround war reine Redundanz zur jetzt
  korrekten Engine-Enumeration, ihn zu behalten hätte nur das Risiko künftigen
  Auseinanderlaufens von Bot- und Engine-Logik bedeutet).

Dieser Bug betraf nicht nur den Bot, sondern potenziell auch das echte UI
(`src/ui/render.ts` zeigt Fähigkeiten-Buttons ggf. basierend auf
`getLegalActions` an) — mit dem Fix ist auch dieses Risiko behoben.

---

## 5. Beim Testen gefundene und behobene Heuristik-Fehler

Zwei nicht offensichtliche Verhaltensfehler wurden erst durch echte Bot-vs-Bot-
Simulationen über den vollen Kartenpool sichtbar (Unit-Tests mit wenigen Karten
hätten sie nicht gezeigt) und sind beide im Code kommentiert:

1. **Kampf-Lähmung durch Worst-Case-Blocker-Check:** Eine erste, naive
   Angriffs-Heuristik prüfte pro Angreifer "gibt es IRGENDEINEN gegnerischen
   Blocker, der mich umsonst tötet?" gegen das **gesamte** gegnerische Board.
   Bei wachsenden Boards (typisch nach ~10 Zügen) verbot damit derselbe große
   Blocker gedanklich JEDEN kleineren Angreifer gleichzeitig — beide Bots
   griffen dauerhaft nie mehr an, Boards wuchsen bis zur Handkartenobergrenze,
   und Partien endeten erst nach 100+ Zügen übers Deck-Auszehren (ein Seed riss
   sogar das 2000-Aktionen-Sicherheitslimit). Fix: Der Blocker-Check reserviert
   jetzt einen als "tödlich" erkannten Blocker für die Bewertung des jeweils
   nächstgrößten Angreifers (einfache 1:1-Zuordnung, größte Angreifer zuerst),
   statt denselben Blocker gegen jeden Angreifer unabhängig erneut zu zählen.
2. **Mana-Verschwendung außerhalb der Main-Phase:** Die "sonst: Mana-Fähigkeit
   aktivieren"-Rückfallebene von Heuristik 3 griff ursprünglich in **jedem**
   Priority-Fenster, auch in Upkeep/Draw/Combat-Steps und im gegnerischen Zug.
   Da Sorcery-Speed-Karten (Units, Terrains, `spell(slow)`) nur in der eigenen
   Main-Phase castbar sind (rules-engine.md Abschnitt 2) und sich der Manapool
   am Ende JEDES Steps leert, tappte der Bot seine Terrains faktisch schon im
   Upkeep leer, bevor Main 1 überhaupt begann — in Main 1 stand dann nur noch
   das eine, zuvor noch ungetappte Terrain zur Verfügung. Ergebnis: Der Bot
   castete über viele Züge hinweg fast nichts außer Terrains. Fix: Das
   proaktive Vorab-Tappen von Mana-Fähigkeiten ist jetzt auf die eigene
   Main-Phase (`main1`/`main2`) beschränkt.

Diese beiden Funde sind der Hauptgrund, warum das Vorgehen (echte Bot-vs-Bot-
Simulation über den vollen Pool statt nur Unit-Tests einzelner Heuristiken) für
dieses Projekt wichtig war — beide Effekte waren in kleinen, isolierten Tests
nicht sichtbar gewesen.

---

## 6. Bekannte Schwächen (v1, bewusst nicht behoben)

Diese Punkte sind bewusste v1-Vereinfachungen, kein Anspruch auf Vollständigkeit
oder Spielstärke — Ausgangspunkt für den geplanten Schwierigkeitsstufen-Ausbau:

1. **Kein Lookahead / keine Board-State-Tiefenanalyse.** Alle Entscheidungen
   sind Ein-Schritt-Heuristiken ohne Simulation künftiger Züge.
2. **Statische Fähigkeiten anderer Permanents werden bei der Stat-/Keyword-
   Schätzung ignoriert** (Anthems, Debuffs, fremd gewährte Keywords) — nur
   Basiswerte + eigene Marken/temporäre Modifikatoren fließen ein (siehe
   Abschnitt 3.1 fürs damit verbundene Restrisiko bei Blockern).
3. **Kein Kombo-/Synergieverständnis.** Karten werden isoliert bewertet, nie im
   Zusammenspiel (z.B. Aura + Zielkreatur, Buff-vor-Angriff-Sequencing).
4. **Keine Instant-Speed-Taktik.** Der Bot hält nie proaktiv Mana offen, um im
   gegnerischen Zug zu reagieren (Removal/Tricks) — Mana wird ausschließlich in
   der eigenen Main-Phase aufgebaut (siehe Fund 2 oben; das verhindert zwar die
   Verschwendung, heißt aber auch: kein "Mana halten für Instant-Antworten").
5. **Modale Karten werden nicht spezifisch bewertet** — bei `castSpell`/
   `activateAbility`-Kandidaten für modale Objekte liefert `getLegalActions`
   ohnehin nur einen Kandidaten ohne `chosenMode`/`chosenTargets` (Modus-x-Ziel
   wird von der Engine nicht enumeriert); der Bot bewertet solche Karten daher
   nur über die "günstigste Option"-Baseline, nicht über den tatsächlichen
   Effekt des (von der Engine ohnehin nicht vorab bekannten) gewählten Modus.
   **UPDATE v2.1: Der rohe Kandidat war darüber hinaus gar nicht direkt
   `applyAction`-fähig ("Modus fehlt") — alle Stufen vervollständigen modale
   Kandidaten jetzt selbst (Abschnitt 10.2); medium bewertet dabei die
   Effekte des jeweils gewählten Modus (Removal-Heuristik), bleibt sonst
   aber bei der v1-Baseline.**
6. **Zieltarget-Optimierung ist grob.** Removal-Bewertung schaut nur auf
   Power+Toughness des Ziels, nicht auf dessen tatsächliche Bedrohlichkeit
   (Keywords, Board-Position, Fähigkeiten).
7. **Guardian/Airborne/Reach-Erkennung bei Blockern nutzt nur Basis-Keywords**
   (siehe Abschnitt 3.1) — keine statischen Fremd-Grants. **UPDATE v2.1:
   behoben (Legalitätsfehler, nicht nur Schwäche) — siehe Abschnitt 10.1.**
8. **Discard-Heuristik ist eine grobe Wertschätzung** (Power+Toughness für
   Units, Pauschalwerte für andere Typen), keine kontextsensitive Bewertung.

---

## 7. Ausblick: Schwierigkeitsstufen-Ausbau

Dieses Modul ist bewusst als **Fundament** konzipiert: `chooseAction` kapselt
die komplette Entscheidungslogik hinter einer einzigen, engine-konformen
Funktionssignatur. Ein künftiger, spezialisierter Agent (fable-5-Modell) kann
darauf aufbauen, ohne diese Nahtstelle zu verändern — z.B. durch:

- Zusätzliche Schwierigkeitsstufen als alternative `chooseAction`-Varianten
  (z.B. `chooseActionEasy`/`chooseActionHard`) oder einen Konfigurationsparameter,
  der die Heuristik-Gewichte/-Tiefe steuert.
- Echtes Lookahead (Minimax/MCTS über `applyAction`-Simulation — die pure,
  deterministische `applyAction`-Signatur eignet sich dafür bereits gut, siehe
  rules-engine.md 9.1).
- Einbeziehung statischer Fremd-Effekte über eine (dann ggf. vom
  game-architect freizugebende) öffentliche Stats-Berechnungsfunktion in der
  `RulesEngine`-Schnittstelle (aktuell nicht Teil des öffentlichen Vertrags,
  siehe Abschnitt 4 / offene Punkte).
- Deck-/Matchup-spezifisches Tuning der Scoring-Gewichte.

## 8. Verifikation

- `npm run build` (tsc --noEmit): sauber.
- `npm test`: 135 Tests grün (121 ursprünglicher Bestand + 11 neue Bot-Tests in
  `src/ai/__tests__/simpleBot.test.ts`, davon 10 einzeln benannte Seeds + 1
  Stichprobentest über 3 weitere Seeds — macht 13 vollständige Partien — + 3
  neue Regressionstests in `src/engine/__tests__/legal-actions.test.ts` für den
  in Abschnitt 4 beschriebenen, mittlerweile behobenen Engine-Bug).
- Zusätzliche, nicht dauerhaft eingecheckte Stichprobe beim Bauen: 50 Seeds am
  Stück simuliert (siehe Testverlauf oben), alle ohne `error` und innerhalb von
  11–21 Zügen (288–562 Aktionen) regulär beendet — deutlich unter dem
  2000-Aktionen-Sicherheitslimit. Nach dem Engine-Fix und dem Entfernen des
  Bot-seitigen Workarounds erneut mit identischem Ergebnis (gleiche
  Aktionszahlen/Sieger pro Seed) durchlaufen.

---

# v2: Schwierigkeitsstufen (leicht/mittel/schwer)

Status: v2 (ai-opponent-engineer, fable-5) — 2026-07-10

## 9.1 Öffentliche API

`src/ai/difficulty.ts` (re-exportiert über `src/ai/index.ts`):

- `type BotDifficulty = "easy" | "medium" | "hard"`
- `chooseActionForDifficulty(engine, pool, state, player, difficulty): PlayerAction`
  — Signatur/Nutzungsvertrag identisch zu v1-`chooseAction` (Abschnitt 1), plus
  Stufenparameter. Liefert IMMER eine legale Aktion.
- `BOT_DIFFICULTIES` (aufsteigende Stärke), `BOT_DIFFICULTY_LABELS`
  (deutsche Anzeigenamen "Leicht"/"Mittel"/"Schwer"), `DEFAULT_BOT_DIFFICULTY`
  (= "medium").

`chooseAction` (v1) bleibt unverändert exportiert — `src/ui/store.ts`
funktioniert ohne Änderung weiter (Anbindung der Stufen: Abschnitt 9.6).
Alle drei Stufen sind reine Konsumenten der öffentlichen
`RulesEngine`-Schnittstelle (`getLegalActions`/`applyAction`) — keine
Engine-/Model-Internals; die Kampf-/Discard-Konstruktionsmuster und deren
Restrisiken aus Abschnitt 3 gelten für alle Stufen unverändert.

## 9.2 Stufe "easy" (`src/ai/easyBot.ts`) — absichtliche Fehler, regelkonform

Kernidee: schwach durch ZUFALL und Naivität, nie durch illegale Aktionen.
Der Zufall ist **deterministisch aus dem GameState abgeleitet** (mulberry32
über `rngState.seed/counter`, `nextObjectNumber`, `turnNumber`): dieselbe
Stellung ergibt immer dieselbe Aktion — reproduzierbare Tests, keine Flakiness
(per Test verifiziert, s. 9.5).

- Mulligan: behält jede Starthand. PendingDecisions: zufälliger Kandidat
  (trifft damit auch eigene Permanents mit schädlichen Triggern).
- Castet nur mit 60 % Wahrscheinlichkeit pro Fenster, dann einen ZUFÄLLIGEN
  Kandidaten; ignoriert aktivierte Nicht-Mana-Fähigkeiten komplett (bewusst —
  verhindert nebenbei den "Armee leer tappen"-Degenerationsfall aus Abschnitt 5
  Fund 1, ohne die v1-Bremse zu brauchen).
- Angriff: zufällige Teilmenge (50 % pro Unit), keine Blocker-Mathematik.
- Blocken: selten (25 % pro Unit) und wahllos (auch sinnlose Chumps);
  guardian-Pflichten werden immer erfüllt (sonst illegal). Discard: zufällig.
- Beibehaltenes Nicht-Fehler-Verhalten (bewusst): Terrains werden immer
  gespielt und Mana nur in der eigenen Main-Phase getappt — ohne beides
  degenerieren Partien zu Deck-Auszehr-Marathons (Abschnitt 5), was weder
  testbar noch für menschliche Gegner unterhaltsam wäre.

## 9.3 Stufe "medium" — die v1-Heuristik

Delegiert an `simpleBot.ts#chooseAction` (Abschnitte 1–8). Seit v2.1 mit
zwei LEGALITÄTS-Korrekturen (Blocklegalität über effektive Keywords,
Vervollständigung modaler Kandidaten — Abschnitt 10); die HEURISTIK-Qualität
(rough*-Schätzer ohne fremde Statics, kein Lookahead) ist unverändert v1.

## 9.4 Stufe "hard" (`src/ai/hardBot.ts` + `src/ai/boardEval.ts`)

Baut auf der v1-Heuristik-STRUKTUR auf (gleiche Prioritätenreihenfolge,
gleiche Vertrags-Muster), ersetzt aber die Entscheidungsqualität:

1. **Budgetiertes 1-Ply-Lookahead über echte `applyAction`-Simulation**
   (rules-engine.md 9.1: pure/deterministisch — genau die in Abschnitt 7 v1
   skizzierte Ausbaurichtung): Jeder Cast-/Activate-Kandidat und jede eigene
   Trigger-Ziel-/Modus-Wahl wird bis zur "Ruhe" simuliert (Stack leer, keine
   PendingDecision; beide Seiten passen — Annahme: kein Instant-Speed-
   Gegenspiel, was für alle aktuellen Bots zutrifft) und der Ergebnis-Zustand
   mit `evaluateState` bewertet. Gewählt wird nur, was die Stellung um
   mindestens `MIN_EVAL_GAIN` verbessert — Removal auf eigene Permanents,
   nutzlose Aktivierungen etc. fallen dadurch automatisch weg. Das schließt
   die v1-Schwächen 5 (modale Karten) und 6 (grobe Zielwahl).
2. **Effektive Stats/Keywords inkl. statischer Fremd-Effekte**
   (`boardEval.ts#effectiveStats`/`hasEffectiveKeyword`): Anthems, Auren,
   Debuffs und statisch gewährte Keywords ALLER Battlefield-Permanents fließen
   ein — rein konsumentenseitig aus `CardPool`+`GameState` berechnet (additive
   Statics, kein Layer-System nötig). Schließt v1-Schwächen 2 und 7 für diese
   Stufe.
3. **Board-Bewertung** (`boardEval.ts#evaluateState`): Lebensdifferenz,
   Unit-Werte (effektive Stats + Keyword-Boni, Gewichte als benannte
   Konstanten `EVAL_WEIGHTS`), sonstige Permanents, Kartenvorteil (Handgröße),
   Deck-Tod-Strafe. Symmetrisch und bewusst klein gehalten (Erklärbarkeit).
4. **Echte Kampf-Mathematik** (`boardEval.ts#fightOutcome` mit
   firstStrike/deathtouch/markiertem Schaden) plus **Kampf-Simulation**:
   - Angriff: Alpha-Strike-Erkennung (konservative Mindest-Durchbruch-
     Rechnung -> letaler Gesamtangriff), sonst Bewertung mehrerer Angreifer-
     Teilmengen durch komplette Kampf-Simulation mit ZWEI Gegner-Modellen
     ("blockt gut" = eigene Block-Heuristik aus Gegnersicht / "blockt nur
     Pflichten") und Mittelwert-Score. Der Mittelwert ist bewusst KEIN
     Best-Response: ein reines "Gegner blockt perfekt"-Modell entwertet
     Angriffe systematisch und führt in dieselbe Kampf-Lähmung wie v1-Fund 1.
   - Verteidigung: mehrere Block-Zuordnungs-Kandidaten (Heuristik mit
     Free-Kill-/Tausch-/Überlebens-Blocks, Nur-Pflichten, Aggressiv,
     Gang-Block auf den größten Angreifer) werden komplett durchsimuliert
     (Schadensrunden, Trigger, SBAs) und der beste gewählt; trample-bewusste
     Überlebens-Chumps bei drohendem Tod.
   - Race-Bewusstsein: droht dem eigenen Leben ein letaler Gegenschlag,
     bleiben die zähesten Nicht-vigilant-Units als Blocker zu Hause.
5. **Performance-Budget** (UI darf nicht einfrieren): max. 400 simulierte
   `applyAction`-Aufrufe pro Entscheidung, max. 12 simulierte Kandidaten
   (statisch vorsortiert), max. 40–60 Rollout-Schritte; bei erschöpftem
   Budget statischer Fallback (nie eine illegale Aktion). Gemessen
   (difficulty.test.ts, Performance-Test): längste Einzelentscheidung über
   komplette hard-vs-hard-Partien < 15 ms (Assertion: < 1000 ms als
   großzügige CI-Schranke).
6. Beibehalten aus v1 (bewusst, nach A/B-Messung): die "kein Vorab-Tappen
   potenzieller Angreifer"-Bremse (jetzt mit effektiven Keywords) und das
   INKREMENTELLE Mana-Tappen nur in der eigenen Main-Phase. Eine getestete
   "erst alle Manaquellen tappen, dann entscheiden"-Regel (Kurven-Optimierung)
   verschlechterte den Stärkevergleich messbar (29:20 statt 32:17 über 49
   Partien) und wurde wieder entfernt (Begründung im Code kommentiert).

## 9.5 Verifikation (v2)

- `npm run build` (tsc --noEmit): sauber.
- `npm test`: 148 Tests grün (141 Bestand inkl. v1-Bot-Tests + 7 neue in
  `src/ai/__tests__/difficulty.test.ts`).
- **Stärkevergleich** (deterministisch: feste Seeds, beide Rollenzuordnungen
  pro Seed gegen den Startspieler-/Münzwurf-Vorteil; Engine UND alle Bots
  deterministisch -> reproduzierbar, keine Flakiness). Assertions: höhere
  Stufe gewinnt strikt mehr Partien UND >= 60 % der entschiedenen. Gemessen:
  - medium vs easy: **20:4** (24 Partien)
  - hard vs medium: **24:14** (38 Partien)
  - hard vs easy: **22:2** (24 Partien)
  - Größere, nicht eingecheckte Stichprobe beim Bauen (25 Seeds = bis zu 50
    Partien pro Paarung): medium 44:5 easy, hard 32:17 medium, hard 47:3 easy.
- Vertragstests: easy-vs-easy- und hard-vs-hard-Partien enden regulär ohne
  eine einzige von der Engine abgelehnte Aktion; easy-Determinismus
  (Doppelaufruf pro Stellung über eine ganze Partie liefert identische
  Aktionen); hard-Performance (s.o.).

## 9.6 Gefundener Engine-Bug v2 — GEMELDET, nicht selbst gefixt

Beim Stärkevergleich-Testen über 25 Seeds crasht die Engine (Exception, kein
`error`-Return) in 2 von 250 Partien:

> `Error: Unbekannte CardInstance-ID: card134` —
> `getDefinitionForInstance` (card-defs.ts:40) via
> `computeEffectiveKeywords` (stats.ts:194) via `hasKeyword` (combat.ts:168)
> via `dealCombatDamage` (combat.ts:330) via `beginStep` (turn.ts:246).

**Mechanismus (aus dem Code abgeleitet):** Stirbt ein TOKEN-Kampfteilnehmer
in der firstStrike-Schadensrunde, löscht der Zwischen-SBA-Durchlauf seine
Instanz ENDGÜLTIG aus `state.cards` (SBA 7, zones.ts:103 `delete
state.cards[instanceId]`). Die reguläre Schadensrunde filtert Teilnehmer
anschließend mit `(id) => !hasKeyword(state, pool, id, "firstStrike")`
(combat.ts:330) — `hasKeyword` läuft dabei VOR den Existenz-Guards von
`dealCombatDamageRound` und wirft für die gelöschte Token-ID.
`dealCombatDamageRound` selbst behandelt tote Teilnehmer defensiv
(`state.cards[id]?.permanentState`-Checks) — nur der `participates`-Filter
tut das nicht.

Wichtig: Der Bug ist NICHT hard-spezifisch — er trifft auch **medium vs easy**
(Seed 13; hard-Paarungen: Seed 21). Die v1-Testseeds haben die Konstellation
(Token blockt/kämpft in einem firstStrike-Kampf und stirbt in der frühen
Runde) schlicht nie erreicht. Kein Bot kann ihn vermeiden: der Crash passiert
in der Turn-Based Action NACH einem völlig legalen `passPriority`.

Konsumentenseitige Behandlung bis zum Engine-Fix (analog zum v1-Muster in
Abschnitt 4 — melden statt Engine anfassen):

- `hardBot.ts#safeApplyForSim`: alle SIMULATIONS-`applyAction`-Aufrufe sind
  try/catch-geschützt (eine hypothetische Linie darf den Bot nie crashen; der
  Kandidat gilt dann als unbewertbar). Echte Aktionen laufen bewusst NICHT
  über den Wrapper.
- Die Seed-Listen in `difficulty.test.ts` sparen die zwei bekannten
  Crash-Seeds aus (dokumentiert im Testfile). Nach dem Engine-Fix können die
  Aussparungen entfernt werden.

Empfohlener Fix (Engine-Zuständigkeit): im `participates`-Filter bzw. in
`hasKeyword` nicht mehr existierende/battlefield-lose Instanzen als
`false`/nicht teilnehmend behandeln — plus Regressionstest "Token stirbt in
firstStrike-Runde eines Mehrkampfs".

## 9.7 Bekannte Schwächen (v2) / nächste Schritte

1. **Kein echtes Multi-Ply-Minimax/MCTS** — das Lookahead ist 1-Ply mit
   Kampf-Sonderbehandlung. Die Infrastruktur (Budget, safeApply, evaluateState)
   ist dafür vorbereitet.
2. **Kein Instant-Speed-Spiel** (v1-Schwäche 4 besteht in allen Stufen fort):
   Mana wird nie im gegnerischen Zug offen gehalten. Da kein Bot Instant-Speed
   spielt, ist die "beide passen"-Simulationsannahme von hard aktuell exakt.
3. **X-Kosten und Mehrfach-Zielslots** werden von `getLegalActions` nicht
   enumeriert und von KEINER Stufe genutzt — hard könnte solche Aktionen
   (vertragskonform, wie Kampf-Deklarationen) selbst konstruieren; bewusst
   vertagt.
4. **Gegner-Modell des Angriffs-Lookaheads** ist ein fixer 50/50-Mittelwert
   aus "blockt gut"/"blockt kaum" — kein adaptives Modell der tatsächlichen
   Gegnerstufe.
5. **Kein Deck-/Matchup-Tuning** der `EVAL_WEIGHTS` (bewusst global und
   erklärbar gehalten).
6. Die Blockwahl-Kandidaten enthalten genau EINEN Gang-Block-Vorschlag
   (2 Blocker auf den größten ungeblockten Angreifer) — keine vollständige
   Zuordnungssuche.

## 9.8 Benötigte UI-Anbindung (Übergabe an frontend-engineer)

Der Bot-Teil ist fertig und abwärtskompatibel; für die Stufenwahl im UI fehlt
nur (alles `src/ui/*`, bewusst NICHT von diesem Modul angefasst):

1. `store.ts`: Zustand `botDifficulty: Record<PlayerId, BotDifficulty>`
   (Default `DEFAULT_BOT_DIFFICULTY`), Getter/Setter analog
   `isBotControlled`/`setBotControlled` (inkl. derselben Persistenz über
   "Neues Spiel" hinweg); in `runBotStep` den Aufruf
   `chooseAction(engine, pool, state, actor)` durch
   `chooseActionForDifficulty(engine, pool, state, actor, botDifficulty[actor])`
   ersetzen (Import aus `../ai` bzw. `../ai/difficulty`).
2. Deckbau-Screen (`components/deckBuilder.ts`): neben der bestehenden
   "Spieler 2 von KI steuern lassen"-Umschaltung ein Dropdown/Segmented-Control
   mit den drei Stufen — Optionen aus `BOT_DIFFICULTIES`, Anzeigenamen aus
   `BOT_DIFFICULTY_LABELS`, nur aktiv wenn KI-Steuerung an.
3. Optional: Anzeige der aktiven Stufe im Spielbrett-Header.

---

# v2.1: Legalitäts-Fixes fürs 300-Karten-Set + Farb-Balance-Analyse

Status: v2.1 (ai-opponent-engineer, fable-5) — 2026-07-11

Auslöser: empirische Farb-Balance-Prüfung des fertigen 300-Karten-Sets über
Bot-vs-Bot-Simulationen (Auftrag nach Set-Abschluss; Ergebnis und
Interpretation: `docs/cards/starter-set.md`, Abschnitt "Empirische
Balance-Prüfung (Bot-Simulation)"). Die ersten Läufe deckten zwei
Legalitätsfehler in den BOTS auf (nicht in Engine oder Karten — beide sind
Konsumenten-Pflichten laut dokumentiertem `getLegalActions`-Vertrag, die mit
dem v1-Pool von 109 Karten schlicht nie erreichbar waren). Beide wurden in
`src/ai/*` behoben; Engine/Model/Karten blieben unangetastet.

## 10.1 Fix: Blocklegalität mit effektiven Keywords (easy + medium)

Das 300-Karten-Set enthält erstmals eine Aura, die `guardian` STATISCH an
die verzauberte Unit vergibt (`grantKeyword`-Static, scope `attachedTo`).
Die Blocker-Konstruktion von easy/medium prüfte guardian-Pflichten und
airborne/reach-Blockbarkeit aber nur über Basis-Keywords (das in Abschnitt
3.1 dokumentierte v1-Restrisiko) — beobachteter Fehler in der Simulation:
medium reichte bei aktiver (statisch gewährter) guardian-Pflicht eine leere
Blockdeklaration ein, die die Engine ablehnte ("guardian-Pflicht verletzt").
Im echten UI-Spiel gegen den Bot wäre die Partie an dieser Stelle
steckengeblieben.

Fix: easy (`easyBot.ts`) und medium (`simpleBot.ts`) nutzen für die
LEGALITÄTS-relevanten Teile der Blockwahl jetzt die effektiven Keywords aus
`boardEval.ts` (`hasEffectiveKeyword`/`canBlockPairEffective` — inkl.
statischer Fremd-Grants; hard nutzte sie bereits). Die lokalen
Nur-Basis-Keyword-Prüfungen (`canBlockPair`/`canBlockPairBase`) wurden
entfernt. Wichtig für die Stufen-Identität: Die BEWERTUNGS-Heuristiken
(rough*-Schätzer, isFavorableBlock, Angriffslogik) sind unverändert —
medium bleibt bewusst "v1-grob", es reicht nur keine illegalen Aktionen
mehr ein.

## 10.2 Fix: Modale Kandidaten werden konsumentenseitig vervollständigt

`getLegalActions` liefert modale Spells/Fähigkeiten laut Vertrag
(legal-actions.ts, Datei-Kommentar) als GENAU EINEN rohen Kandidaten OHNE
`chosenMode`/`chosenTargets`; `applyAction` lehnt den rohen Kandidaten ab
("Modus fehlt") — das UI fragt Modus + Ziele interaktiv nach, die Bots
taten das nicht:

- medium/easy reichten den rohen Kandidaten unverändert ein -> von der
  Engine abgelehnt (beobachtet mit `core.void-covenant`, dem einzigen
  modalen Spell des Sets).
- hard simulierte den rohen Kandidaten, die Simulation schlug immer fehl ->
  modale Karten wurden STILL nie gespielt (kein Crash, aber die
  9.4-Behauptung "schließt v1-Schwäche 5" galt nur für Modus-Wahlen, die
  als PendingDecision kamen, nicht für modale Casts).

Fix: neue gemeinsame Hilfsfunktion `boardEval.ts#expandModalCandidate` —
erzeugt aus dem rohen Kandidaten alle konkreten Vervollständigungen
(Modus x Ziel) und validiert JEDE per `applyAction`-Dry-Run (pure Funktion
der öffentlichen Schnittstelle; keine Duplikation der Engine-Zielfilter —
das grobe Ziel-Universum liefert nur die Kategorie Permanent/Spieler/
Stack-Objekt, die Feinlegalität entscheidet die Engine selbst). Nutzung:

- medium: bewertet jede Vervollständigung mit der normalen v1-Scoring-Logik
  (Removal-Heuristik sieht jetzt die Effekte des jeweiligen Modus).
- easy: wählt eine ZUFÄLLIGE legale Vervollständigung (deterministischer
  Zustands-Zufall wie alle easy-Entscheidungen).
- hard: jede Vervollständigung durchläuft das normale 1-Ply-Lookahead.

Bewusste Grenze (unverändert, wie X-Kosten — 9.7 Punkt 3): Modi mit >= 2
Zielslots werden übersprungen; im aktuellen Set existieren keine.

## 10.3 Analyse-Tool Farb-Balance

`src/ai/__tests__/color-balance.analysis.test.ts` — dauerhaft eingecheckt,
aber **Analyse-Tool, KEIN Correctness-Test**: in `npm test`/CI via
`describe.skip` übersprungen (Laufzeit ~1 min pro Lauf), Ausführung nur
explizit mit `BALANCE_ANALYSIS=1` (optional `BALANCE_ANALYSIS_BOT`,
`BALANCE_ANALYSIS_SEEDS`, siehe Datei-Kommentar). Methodik: 5 Mono-Farb-
Decks (1x jede Karte der Farbe + 32 Terrains), alle 10 Paarungen, beide
Rollenzuordnungen pro Seed, identische Bot-Stufe auf beiden Seiten.
Ergebnis (Kurzform; Interpretation + Einschränkungen im starter-set.md-
Abschnitt): wild ~73-75 % Siegquote (klar zu stark, konsistent unter
medium- UND hard-Spielstil), tide ~29-34 % (klar zu schwach, vermutlich
teils Bot-Artefakt), light ~35-44 %, flame/void ~49-56 % (unauffällig).
Kartenänderungen sind ausdrücklich NICHT Teil dieses Auftrags — nur als
Empfehlung an den card-designer dokumentiert.

## 10.4 Verifikation (v2.1)

- `npm run build` (tsc --noEmit): sauber.
- `npm test`: 160 Tests grün, 1 übersprungen (das Analyse-Tool) — alle
  bestehenden v1-/v2-Bot-Tests und Engine-/UI-Tests unverändert grün; die
  deterministischen Stärkevergleiche halten weiterhin beide Assertions
  (strikt mehr Siege UND >= 60 %): medium:easy 19:5, hard:medium 25:15,
  hard:easy 21:3 (leicht verschobene Tallies gegenüber v2 sind erwartet —
  easy/medium blocken jetzt in statik-Keyword-Stellungen korrekt).
- Balance-Analyse-Läufe: 800 Partien medium vs medium (40 Seeds) + 300
  Partien hard vs hard (15 Seeds) + 300 Partien medium (15 Seeds,
  Erst-Lauf) — nach den Fixes ausnahmslos ohne eine einzige von der Engine
  abgelehnte Aktion und ohne Engine-Crash regulär beendet (der in 9.6
  gemeldete firstStrike-Token-Crash ist laut difficulty.test.ts-Kommentar
  seit Engine v0.3.3 behoben und trat in keinem Lauf mehr auf).

## 10.5 Offene Punkte nach v2.1

- 9.7 Punkt 3 (X-Kosten, Mehrfach-Zielslots) besteht fort — X-Karten werden
  weiterhin von keiner Stufe gecastet (fürs Balance-Ergebnis dokumentiert:
  die eine X-Karte des Sets wurde aus den Analyse-Decks ausgeschlossen).
- Die Balance-Empfehlungen (wild-3-Drops) liegen beim card-designer; nach
  einem etwaigen Rebalancing kann das Analyse-Tool unverändert erneut
  laufen (deterministische Seeds -> direkt vergleichbare Zahlen).
