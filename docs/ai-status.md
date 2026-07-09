# KI-Gegner-Status (SimpleBot v1)

Status: v1 (engine-engineer) — 2026-07-09
Grundlage: `docs/rules-engine.md` (v0.3.1), öffentliche `RulesEngine`-Schnittstelle
(`src/engine/index.ts` / `src/model/game-state.ts`).
Code: `src/ai/simpleBot.ts`. Tests: `src/ai/__tests__/simpleBot.test.ts` (Vitest,
11 Tests: 13 vollständige Bot-vs-Bot-Partien über den echten `core`-Kartenpool,
109 Karten, alle grün).

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
  nur über Basis-Keywords). **Restrisiko:** Statisch von ANDEREN Permanents
  gewährte Keywords (Anthems) fließen dort nicht ein — bei Karten, die
  `guardian`/`airborne`/`reach` per Static-Ability an fremde Einheiten
  vergeben, könnte der Bot dadurch theoretisch eine vom echten Regelwerk
  abweichende (im schlimmsten Fall abgelehnte) Blockentscheidung treffen. Für
  den aktuellen `core`-Kartenpool (109 Karten, keine solche Static-Ability
  beobachtet) tritt das nicht auf; alle 50 stichprobenartig simulierten
  Partien liefen fehlerfrei durch.

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
6. **Zieltarget-Optimierung ist grob.** Removal-Bewertung schaut nur auf
   Power+Toughness des Ziels, nicht auf dessen tatsächliche Bedrohlichkeit
   (Keywords, Board-Position, Fähigkeiten).
7. **Guardian/Airborne/Reach-Erkennung bei Blockern nutzt nur Basis-Keywords**
   (siehe Abschnitt 3.1) — keine statischen Fremd-Grants.
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
