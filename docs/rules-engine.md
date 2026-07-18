# Regelwerk-Design: Rules Engine

Status: v0.3.3 (Game-Architect) — 2026-07-10
Verbindlich für: engine-engineer (Implementierung), card-designer (Fähigkeitsdesign), frontend-engineer (Visualisierung von Stack/Priority)

v0.3.3-Änderung (Verhaltens-Widerspruch, Fund des card-designers in
Kartenpool-Batch 6, `docs/cards/starter-set.md` „Offene Fragen" Punkt 8):
`onDeath { what: "self" }` feuerte de facto nur auf dem SBA-3/4-Pfad
(Toughness/letaler Schaden, nur Units) — eine per `destroyPermanent`
zerstörte Unit löste ihren eigenen Tod-Trigger still NICHT aus, für
Nicht-Unit-Permanents feuerte `onDeath` nie; dieselbe Lücke galt für fremde
`onUnitDied`-Trigger und das `unitDied`-Event (alle drei hängen an
`fireDeathTriggers`, dessen einziger Aufrufer die SBA-Schleife war; auch der
`sacrificeSelf`-Kosten-Pfad war betroffen). **Entscheidung 9.15: Bug —
zonenbasierte Todesdefinition.** „Stirbt" = Zonenwechsel Battlefield →
Graveyard, ursachenunabhängig (SBA 3/4, `destroyPermanent`,
`sacrificeSelf`-Zusatzkosten, Aura-SBA 5); `onDeath` dabei typ-agnostisch
(auch Relic/Enchantment/Terrain/Token), `onUnitDied`/`unitDied` folgen
derselben Todesdefinition, bleiben aber unit-only. `exilePermanent`/
`returnToHand` sind bewusst KEIN Tod — Exil als „saubere Antwort" auf
Tod-Trigger ist damit dokumentiertes Design statt Zufallsverhalten. Kein
Datenmodell-Umbau (nur Kommentare an `onDeath`/`onUnitDied` in
`src/model/abilities.ts`). **Engine-Auftrag (9.15):** zentraler Tod-Hook in
`zones.ts#leaveBattlefield` (Ziel Graveyard), SBA-Schleife gibt ihren
Direkt-Aufruf ab, `fireDeathTriggers` gatet `onUnitDied` auf Unit-Tote.

v0.3.2-Änderung (Modell-Lücke, Fund des card-designers in Kartenpool-Batch 4):
`EffectRecipient "eventSubject"` bei Triggern, deren Subjekt beim Resolven kein
Permanent mehr ist (v.a. `onUnitDied`/`onDeath` — die SBA hat das Objekt vor dem
Stacken des Triggers ins Graveyard verschoben). **Entscheidung 9.14: zulässig,
mit einheitlichem stillen Fizzle** — neue allgemeine Auflösungsregel
„Nicht-Permanent-Fizzle" (Abschnitt 4/Resolution): Permanent-bezogene Effekte
überspringen Empfänger, die kein Permanent (mehr) sind, still; gilt für
gewählte Ziele, `self` UND `eventSubject` gleichermaßen. `eventSubject`-
Semantik pro Trigger in Abschnitt 5 präzisiert. Kein Datenmodell-Umbau (nur
Kommentare an `EffectRecipient`/`onUnitDied` in `src/model/abilities.ts`).
**Engine-Auftrag:** `destroyPermanent`/`exilePermanent`/`returnToHand` in
`effects.ts` verletzen die Regel heute (Crash bei gelöschter Token-Instanz,
ungewollte Zonen-Manipulation bei Karten im Graveyard) und brauchen denselben
Battlefield-Guard wie die übrigen Permanent-Effekte — Details in 9.14.
Konsequenz für card-designer: Kombination bei `onUnitDied`/`onDeath` ist
zulässig, aber garantiert wirkungslos → nicht bauen; der
„Removal-bei-Tod"-Archetyp braucht ein künftiges Graveyard-Primitiv
(Abschnitt 10).

v0.3.1-Änderung (Modellkonflikt-Fund des engine-engineers bei der
v0.3-Umsetzung, 9.13 Punkt 2): Die Entscheidungskette `chooseMode` →
`chooseTriggerTargets` bei modalen Triggern hatte im Modell keinen Ort, den
bereits gewählten Modus über den zweiten `resolveDecision`-Roundtrip zu
persistieren. Gelöst additiv: neues Feld `chosenMode?: number` an der
`PendingDecision`-Variante `chooseTriggerTargets` (`src/model/game-state.ts`)
— bewusst OHNE Gegenstück an der `DecisionChoice` (die Engine liest den Modus
aus `state.pendingDecision`). Details/Begründung im Nachtrag zu Entscheidung
9.13. Der dokumentierte Interims-Fallback der Engine
(`triggers.ts#stackModalTriggerWithMode`, Auto-Pick des ersten legalen Ziels
statt echter Zielwahl-Decision) ist damit abgelöst und zu entfernen.

v0.3-Änderungen (vier bewusst vertagte Punkte aus Abschnitt 10 geschlossen):
1. **`onDamageReceived` verdrahtet** (Abschnitt 5, Entscheidung 9.10): feuert
   jetzt für Kampf- UND Effekt-Schaden an Permanents, einmal pro
   Schadensereignis; Schaden ≤ 0 feuert nicht (6c); letaler Schaden feuert
   (Trigger überlebt den Tod der Quelle in der Pending-Queue);
   `eventSubject` = Schadensquelle. Der „reserviert, nicht verwenden"-Status
   aus v0.2.3 ist aufgehoben — card-designer darf den Trigger benutzen.
2. **Mulligan-Regel** (neuer Abschnitt 1b, Entscheidung 9.11): klassische
   Paris-Variante (neu mischen, eine Karte weniger ziehen), sequentiell
   Startspieler zuerst, über die neue `PendingDecision`-Variante `mulligan`.
   `CreateGameConfig.skipMulligans` für Tests; `PlayerState.mulligans` neu.
3. **X-Kosten auf aktivierten Fähigkeiten** (Abschnitt 4, Entscheidung 9.12):
   `chosenX` jetzt auch an der `activateAbility`-Aktion und am
   `activatedAbility`-Stack-Objekt; Verbot für Mana-Fähigkeiten.
4. **Modal-Effekte „wähle eines —"** (Abschnitt 4, Entscheidung 9.13): neues
   `EffectMode`-Modell (`modes` auf `SpellCard`/`ActivatedAbility`/
   `TriggeredAbility`), Moduswahl vor X- und Zielwahl; `chosenMode` an
   `castSpell`/`activateAbility` und allen Stack-Objekt-Varianten; neue
   `PendingDecision`-Variante `chooseMode` (nur für Trigger).
Datenmodell-Änderungen: `src/model/abilities.ts` (`EffectMode`, `modes`,
`ManaCost.x`-/`TriggerCondition`-Kommentare), `src/model/cards.ts`
(`SpellCard.modes`), `src/model/game-state.ts` (`PendingDecision`/
`DecisionChoice` + `mulligan`/`chooseMode`, `chosenX`/`chosenMode` an
Aktionen/Stack-Objekten, `PlayerState.mulligans`, Event `mulliganTaken`,
`CreateGameConfig.skipMulligans`). Abschnitt 10 bereinigt. Die größeren
Architektur-Themen (>2 Spieler, Kontrollwechsel, Double Strike, …) bleiben
bewusst zurückgestellt.

v0.2.3-Änderungen (Kampf-Ausbau: Keyword-Paket für die Kartenpool-Erweiterung):
Drei neue Keywords `trample`, `firstStrike`, `deathtouch` (Semantik in neuem
Abschnitt 6d, Kombinatorik verbindlich durchdekliniert). **Entscheidung 9.8
wird bewusst REVIDIERT:** Die Mehrfachblock-Schadensreihenfolge wählt jetzt
der **Angreifer** (Option B aus 9.8) über die neue PendingDecision-Variante
`orderBlockers` — die v0.2.2-Vereinfachung „Verteidiger-Reihenfolge" ist damit
kein spezifiziertes Verhalten mehr; Tests, die sich darauf stützen, müssen
angepasst werden. First Strike als interne zweite Schadensrunde innerhalb der
Combat-Damage-Turn-Based-Action (KEIN neuer Step, kein neues Priority-Fenster;
Zwischen-SBA-Durchlauf, 6d). SBA 4 um deathtouch erweitert (Abschnitt 7).
6b(2) für trample angepasst. Trade-offs in neuer Entscheidung 9.9.
Datenmodell-Änderungen: `Keyword` +3 Einträge (`src/model/abilities.ts`);
`PendingDecision`/`DecisionChoice` um `orderBlockers` erweitert,
`PermanentState.deathtouchDamage`, präzisierter Kommentar an
`CombatAssignment.blockedBy` (`src/model/game-state.ts`).

v0.2.2-Änderungen (Kampf-Härtung, Klärungsfragen vor dem Combat-End-to-End-Test):
Abschnitt 6 ausgebaut — Priority-Fenster aller fünf Combat-Steps bestätigt (6a),
explizite Regeln für Zonenwechsel zwischen Blocker-Deklaration und Kampfschaden
(„geblockt bleibt geblockt", 6b), 0/negative Power/Toughness im Kampf (Schaden
≤ 0 ist kein Schaden; SBAs genügen, 6c). Neue Design-Entscheidung 9.8:
Mehrfachblock-Schadensreihenfolge bleibt Verteidiger-Reihenfolge (dokumentierte
Vereinfachung); Angreifer-gewählte Reihenfolge und Trample-Analog als
gemeinsames Paket nach Abschnitt 10 vertagt. Keine Datenmodell-Änderung.

v0.2.1-Änderung: Priority-Wiederaufnahme nach Decision-Pause über neues Feld
`GameState.resumePriorityTo` (9.7, letzter Absatz) — ersetzt den
Engine-Fallback „nach Decision immer activePlayer".

v0.2-Änderungen (Antworten auf offene Fragen aus `docs/engine-status.md` und
`docs/cards/starter-set.md`): Spielstart/Startspieler (1a), X-Kosten-Ablauf (4),
Trigger-Zielwahl über Pending Decisions (5, 9.7), finale `guardian`-Regel (6),
Engine-Factory als offizieller Vertrag (9.6), präzisierter
`getLegalActions`-Vertrag (9.6), aktualisierte offene Punkte (10).
Datenmodell-Änderungen: `PendingDecision`/`resolveDecision`, `CreateGameConfig`
ohne `pool`, `CreateRulesEngine`-Factory-Typ in `src/model/game-state.ts`.

Dieses Dokument beschreibt das Regelwerk unseres MTG-artigen Kartenspiels. Es orientiert sich an
den bewährten Mustern von Magic: the Gathering (Stack, Priority, State-Based Actions), ist aber
bewusst vereinfacht, wo MTG-Komplexität für ein Hobby-Projekt keinen Mehrwert bringt. Jede
bewusste Vereinfachung ist im Abschnitt „Design-Entscheidungen" begründet.

Das zugehörige maschinenlesbare Datenmodell liegt in `src/model/` (TypeScript, reine Typen ohne
Logik). Bei Widersprüchen zwischen diesem Dokument und den Typen gilt: Typen sind die Wahrheit
für Strukturen, dieses Dokument für Abläufe/Semantik — Widersprüche bitte an den Game-Architect
melden statt still zu entscheiden.

---

## 1. Grundbegriffe

- **Spieler:** Genau 2 Spieler (v0.1). Startleben: 20. Starthandgröße: 7, Maximalhand 7 (Abwurf im Cleanup).
- **Aktiver Spieler:** Der Spieler, dessen Zug gerade läuft. Der andere ist der **nicht-aktive Spieler**.
- **Zonen:** `library` (Deck, verdeckt, geordnet), `hand`, `battlefield`, `graveyard` (offen, geordnet), `stack`, `exile`.
  Battlefield ist geteilt sichtbar; jede Karte dort hat einen Controller.
- **Permanent:** Eine Karte auf dem Battlefield (Unit, Relic, Enchantment, Terrain). Spells (fast/slow) werden nie zu Permanents — sie resolven vom Stack und gehen in den Graveyard.
- **Ressource (Mana):** Fünf Farben — `flame`, `tide`, `wild`, `light`, `void` — plus farblos/generisch.
  Terrains produzieren Mana über aktivierte Fähigkeiten (Tap-Symbol). Der Manapool leert sich am Ende jedes Steps und jeder Phase (keine Mana-Burn-Regel).

### Kartentypen (Kurzüberblick, Details in `src/model/cards.ts`)

| Typ | MTG-Vorbild | Verhalten |
|---|---|---|
| `unit` | Creature | Permanent, kann angreifen/blocken, hat Power/Toughness |
| `spell` mit `speed: "slow"` | Sorcery | Nur in eigener Main Phase bei leerem Stack spielbar |
| `spell` mit `speed: "fast"` | Instant | Immer spielbar, wenn man Priority hat |
| `relic` | Artifact | Permanent, meist mit aktivierten/statischen Fähigkeiten |
| `enchantment` (global oder `aura`) | Enchantment/Aura | Permanent; Auren werden an ein Ziel angelegt |
| `terrain` | Land | Kein Zauber (geht nicht über den Stack), 1× pro Zug spielbar, produziert Mana |

### 1a. Spielstart (v0.2 ergänzt)

1. **Startspieler:** Münzwurf über den seedbaren RNG — der **erste** RNG-Verbrauch
   der Partie, noch vor dem Mischen (damit bleibt alles pro Seed deterministisch).
   Für Tests/Sonderfälle darf `CreateGameConfig.startingPlayer` den Münzwurf
   überschreiben.
2. Beide Librarys werden gemischt (RNG), beide Spieler ziehen 7 Karten.
3. **Mulligan-Phase** (v0.3, Abschnitt 1b) — danach beginnt der erste Zug.
4. Der Startspieler überspringt seinen ersten Draw Step (Abschnitt 2).

### 1b. Mulligan (v0.3, Entscheidung 9.11)

Klassische **Paris-Variante**: Wer seine Starthand nicht behalten will, mischt
sie zurück in die Library und zieht eine neue Hand mit **einer Karte weniger**
(7 → 6 → 5 → … → 0). Ablauf:

1. Nach dem Ziehen der Starthände (1a Schritt 2), **vor** dem ersten Untap
   Step, setzt die Engine `pendingDecision = { kind: "mulligan",
   player: <Startspieler>, timesMulliganed: 0 }` — createGame endet also mit
   dieser Decision statt am Upkeep-Priority-Fenster (Ausnahme:
   `CreateGameConfig.skipMulligans`, s.u.).
2. Der Spieler antwortet per `resolveDecision` mit
   `{ kind: "mulligan", takeMulligan: boolean }`:
   - **behalten** (`false`): Seine Mulligan-Phase ist beendet.
   - **mulliganen** (`true`): Hand vollständig in die Library, mischen
     (RNG-Verbrauch, deterministisch pro Seed und Aktionsfolge), dann
     `7 − timesMulliganed − 1` Karten ziehen; `PlayerState.mulligans` wird
     hochgezählt, Event `mulliganTaken` emittiert. Danach erhält **derselbe**
     Spieler die nächste `mulligan`-Decision (`timesMulliganed + 1`) — außer
     die neue Handgröße ist 0, dann behält er automatisch (keine Decision).
3. **Reihenfolge streng sequentiell:** Erst entscheidet der Startspieler
   vollständig (bis er behält bzw. 0 Karten hat), dann der andere Spieler
   nach demselben Schema. Erst wenn beide fertig sind, beginnt Zug 1 mit dem
   Untap Step. Bewusste Abweichung vom MTG-Vorbild (dort entscheiden die
   Spieler rundenweise): Der zweite Spieler sieht die finale Handgröße des
   Startspielers vor seiner ersten Entscheidung — Trade-off in 9.11.
4. **Einordnung in den Decision-Mechanismus (9.7):** Die Decision liegt
   außerhalb jeder Priority-Vergabe → `resumePriorityTo` wird nicht gesetzt;
   solange sie aussteht, gibt es keine Priority und keinen Step (das Spiel
   hat noch gar nicht „gesteppt"). `getLegalActions` liefert **beide**
   Kandidaten (behalten/mulliganen). Legal ist wie immer nur
   `resolveDecision` des betroffenen Spielers (plus `concede`).
5. **Keine Folgewirkung:** Das Handkartenmaximum bleibt 7; der
   Draw-Step-Skip des Startspielers (1a) gilt unverändert;
   `PlayerState.mulligans` ist nach Spielstart rein informativ (UI/Log).
6. **Tests/Komfort:** `CreateGameConfig.skipMulligans: true` überspringt die
   Phase komplett (beide behalten; Verhalten wie bis v0.2.4). Bestehende
   Engine-/UI-Tests, die direkt am Upkeep-Fenster aufsetzen, setzen dieses
   Flag — Default ist `false` (Mulligan ist Regelbestandteil, kein Opt-in).

---

## 2. Phasenmodell

Ein Zug besteht aus 5 Phasen mit insgesamt 12 Steps (vgl. `TurnStep` in `src/model/game-state.ts`):

```
Beginning Phase
  1. Untap Step        — kein Priority-Fenster
  2. Upkeep Step       — Priority-Fenster (Upkeep-Trigger feuern hier)
  3. Draw Step         — aktiver Spieler zieht 1 Karte, dann Priority-Fenster
Main Phase 1 (Precombat Main)
  4. Main Step         — Priority-Fenster; Slow Spells, Terrains, Permanents spielbar
Combat Phase
  5. Begin Combat      — Priority-Fenster
  6. Declare Attackers — aktiver Spieler deklariert Angreifer (tappt sie), dann Priority-Fenster
  7. Declare Blockers  — verteidigender Spieler deklariert Blocker, dann Priority-Fenster
  8. Combat Damage     — Schaden wird zugewiesen und verrechnet, dann Priority-Fenster
  9. End Combat        — Priority-Fenster
Main Phase 2 (Postcombat Main)
  10. Main Step        — wie Main 1
Ending Phase
  11. End Step         — Priority-Fenster (End-Step-Trigger feuern hier)
  12. Cleanup Step     — kein Priority-Fenster (Ausnahme s.u.)
```

Regeln pro Step:

- **Untap:** Aktiver Spieler enttappt alle eigenen Permanents. Summoning Sickness eigener Units endet („war seit Zugbeginn unter deiner Kontrolle"). Kein Spieler erhält Priority; hier kann nichts gespielt werden. Untap-Trigger (falls Karten sie definieren) warten bis zum Upkeep.
- **Upkeep:** „Zu Beginn deines Versorgungssegments"-Trigger werden auf den Stack gelegt, dann erhält der aktive Spieler Priority.
- **Draw:** Ziehen ist eine Turn-Based Action (kein Stack-Objekt). Der Spieler, der im ersten Zug des Spiels beginnt, überspringt seinen ersten Draw Step.
- **Main 1 / Main 2:** Nur hier (eigener Zug, leerer Stack) dürfen gespielt werden: `terrain` (max. 1/Zug, geht NICHT über den Stack), `spell(slow)`, `unit`, `relic`, `enchantment`. `spell(fast)` und aktivierte Fähigkeiten sind jederzeit mit Priority erlaubt.
- **Combat:** Details in Abschnitt 6. Wird kein Angreifer deklariert, werden Declare Blockers und Combat Damage übersprungen.
- **End Step:** „Zu Beginn des Endsegments"-Trigger feuern, dann Priority.
- **Cleanup:** (1) Aktiver Spieler wirft auf Handkartenmaximum (7) ab. (2) Aller markierter Schaden wird entfernt, „bis Zugende"-Effekte enden. Normalerweise erhält niemand Priority. Ausnahme (wie MTG): Feuert durch Cleanup-Aktionen ein Trigger oder greift eine State-Based Action, gibt es doch ein Priority-Fenster und danach einen weiteren Cleanup Step. **v0.2-Präzisierung (abgesegnete Vereinfachung):** Die Engine muss nur EIN solches Extra-Fenster pro Cleanup unterstützen und darf danach direkt in den nächsten Zug übergehen — nur der Schadens-/„bis Zugende"-Reset muss nach dem Extra-Fenster garantiert erneut gelaufen sein. Die vollständig rekursive Cleanup-Wiederholung (inkl. erneutem Handkarten-Check) bleibt offener Punkt (Abschnitt 10) und wird erst nötig, wenn Karten im Cleanup Handkarten erzeugen können.

Phasen-/Step-Übergang: Ein Step endet, wenn alle Spieler nacheinander bei leerem Stack passen (siehe Priority). Steps ohne Priority-Fenster (Untap, Cleanup) werden von der Engine automatisch abgewickelt.

---

## 3. Priority-System

Priority bestimmt, wer gerade handeln darf (Spell casten, Fähigkeit aktivieren, oder passen).

Regeln:

1. **Wer bekommt Priority zuerst:** Zu Beginn jedes Steps mit Priority-Fenster erhält der aktive Spieler Priority — nachdem Turn-Based Actions (z.B. Ziehen im Draw Step) ausgeführt und fällige Trigger auf den Stack gelegt wurden.
2. **Nach jeder Aktion:** Wer einen Spell castet oder eine Fähigkeit aktiviert, behält Priority nicht automatisch — nach dem Legen auf den Stack erhält derselbe Spieler erneut Priority (er kann also nachlegen; MTG-konform).
3. **Vor jeder Priority-Vergabe** prüft die Engine in einer Schleife: (a) State-Based Actions ausführen bis keine mehr greift, (b) wartende Trigger auf den Stack legen (siehe Abschnitt 5). Erst wenn beides leer ist, wird Priority vergeben.
4. **Passen:** Ein Spieler mit Priority kann passen. Priority geht dann an den nächsten Spieler in Zugreihenfolge.
5. **Alle passen nacheinander:**
   - Stack **nicht leer** → das oberste Stack-Objekt resolvt. Danach erhält der aktive Spieler wieder Priority (zurück zu Regel 3).
   - Stack **leer** → der aktuelle Step/die Phase endet, Manapools leeren sich, das Spiel geht zum nächsten Step.
6. Ein „Pass" wird ungültig, sobald danach irgendetwas passiert (Resolution, neue Aktion) — die Pass-Zählung beginnt dann von vorn.

Konsequenz für die Engine: Der komplette Spielfluss lässt sich als Schleife modellieren:
`SBA-Check → Trigger einreihen → Priority vergeben → Aktion oder Pass → ggf. Resolution/Stepwechsel → von vorn`.

Konsequenz fürs Frontend: Es muss jederzeit sichtbar sein, **wer Priority hat** und **was auf dem Stack liegt** — inkl. „passieren"-Aktion (empfohlen: Auto-Pass-Komfortoptionen erst später).

---

## 4. Stack-Verarbeitung

Der Stack ist eine LIFO-Zone. Objekte auf dem Stack:

- **Spells** (`unit`, `relic`, `enchantment`, `spell` — alles außer `terrain`): Beim Casten wandert die Karte von der Hand auf den Stack.
- **Aktivierte Fähigkeiten:** Existieren nur als Stack-Objekt (die Quelle bleibt, wo sie ist). Ausnahme: **Mana-Fähigkeiten** (Fähigkeiten, die nur Mana produzieren, kein Ziel haben und kein Trigger sind) gehen NICHT über den Stack, sondern resolven sofort — sonst wäre Mana-Bezahlung unspielbar.
- **Getriggerte Fähigkeiten:** Werden von der Engine erzeugt und auf den Stack gelegt (Abschnitt 5).

### Casten eines Spells (Ablauf)

1. Karte ankündigen, auf den Stack legen.
2. **Modus wählen** (nur bei modalen Karten, v0.3 — Details im Unterabschnitt „Modal-Effekte" unten): Der castende Spieler wählt genau einen wählbaren Modus (`chosenMode` als Index in `modes[]`, Teil der `castSpell`-Aktion). MTG-analog kommt die Moduswahl **vor** X- und Zielwahl.
3. **X wählen** (nur bei `ManaCost.x`, v0.2 geklärt): Der castende Spieler wählt X ≥ 0. X ist Teil der `castSpell`-Aktion (`chosenX`), wird am Stack-Objekt gespeichert und von `Amount { kind: "x" }` bei Resolution gelesen. Wird der Spell gecountert, ist X irrelevant (kein „Rückerstatten"). **v0.3 (Entscheidung 9.12):** X-Kosten sind jetzt auch auf **aktivierten Fähigkeiten** erlaubt — siehe Unterabschnitt unten; die frühere „nur Spells"-Einschränkung ist aufgehoben. `getLegalActions` enumeriert X-Werte nicht — es liefert einen Kandidaten ohne `chosenX`, das Frontend fragt X ab, `applyAction` validiert Bezahlbarkeit.
4. **Ziele wählen** (falls die Karte/Fähigkeit — bei modalen Objekten: der **gewählte Modus** — Targets verlangt). Ziele müssen jetzt legal sein. Karten/Fähigkeiten ganz **ohne** `targets`-Array sind ein regulärer Fall (nur fixe `EffectRecipient`-Werte); für sie entfallen Zielwahl, Ziel-Validierung und Fizzle-Prüfung.
5. Kosten bestimmen und **bezahlen** (Mana inkl. X, ggf. Zusatzkosten wie Tappen/Opfern). Kann nicht bezahlt werden, wird der Cast rückabgewickelt (v0.1: Engine validiert Bezahlbarkeit vor Schritt 1, um Rollback-Komplexität zu vermeiden).
6. Der Spell ist gecastet → Cast-Trigger („wenn ein Spieler einen Zauber wirkt") feuern, der castende Spieler erhält erneut Priority.

### Aktivierte Fähigkeiten mit X-Kosten (v0.3, Entscheidung 9.12)

Die Aktivierung läuft analog zum Cast-Ablauf oben: ankündigen → Modus wählen
(falls modal) → **X wählen** (falls `manaCost.x`) → Ziele wählen → Kosten
bezahlen (Mana inkl. X plus `additionalCosts`). Verbindlich:

- `chosenX` ist Teil der `activateAbility`-Aktion und wird am Stack-Objekt
  `activatedAbility` gespeichert; `Amount { kind: "x" }` liest es bei
  Resolution — exakt wie bei Spells. Fehlt `chosenX` bei einer Fähigkeit mit
  X-Kosten (oder ist es < 0 / nicht bezahlbar), lehnt `applyAction` ab.
- `getLegalActions` liefert wie bei Spells einen Kandidaten **ohne**
  `chosenX` (keine Enumeration; Frontend fragt X ab).
- **Mana-Fähigkeiten dürfen keine X-Kosten haben** (`isManaAbility` ∧
  `manaCost.x` ist eine illegale Definition, die Engine lehnt sie ab): Sie
  resolven ohne Stack und hätten keinen `chosenX`-Kontext — und „{X}:
  erzeuge X Mana" wäre ohnehin sinnlos.
- Der `costChange`-Static-Modifier wirkt weiterhin **nur auf Spells**
  (Engine-Status v0.2.4), nicht auf Aktivierungskosten — daran ändert v0.3
  nichts.

### Modal-Effekte: „Wähle eines —" (v0.3, Entscheidung 9.13)

Modale Spells und Fähigkeiten deklarieren statt der flachen
`targets`/`effects`-Felder eine Liste `modes: EffectMode[]`
(`src/model/abilities.ts`; auf `SpellCard`, `ActivatedAbility` und
`TriggeredAbility` verfügbar). Jeder `EffectMode` bringt eigenen Anzeigetext,
**eigene Zielslots** und eigene `Effect[]` mit. Verbindliche Regeln:

- **Struktur:** `modes` braucht mindestens 2 Einträge; ist es gesetzt, muss
  das Top-Level-`effects` das leere Array sein und `targets` fehlen (Engine
  validiert und lehnt Verstöße ab — bewusst kein Typ-Union-Umbau, um Churn
  im Kartenpool zu vermeiden, siehe 9.13). `isManaAbility` und `modes`
  schließen sich aus.
- **Anzahl:** Es wird genau **ein** Modus gewählt (v0.3-Minimalversion;
  „wähle zwei"/konfigurierbare Anzahl: Abschnitt 10).
- **Zeitpunkt der Wahl:** Beim Auf-den-Stack-Legen, **vor** X- und Zielwahl
  (MTG-analog zu CR 601.2b). Der Modus wird bei Resolution **nicht** neu
  gewählt oder erneut auf „Wählbarkeit" geprüft — nur die normale
  Fizzle-Regel für die Ziele des gewählten Modus gilt.
- **Wählbarkeit:** Ein Modus ist wählbar, wenn jeder seiner Zielslots
  mindestens ein legales Ziel hat (Modi ohne `targets` sind immer wählbar).
  Ist **kein** Modus wählbar, ist der Spell nicht castbar / die Fähigkeit
  nicht aktivierbar / der Trigger wird gar nicht erst gestackt (analog
  „kein legales Ziel beim Ansagen", Abschnitt 5).
- **Mechanik der Wahl — zwei Wege, analog zur Zielwahl:**
  - **Spells / aktivierte Fähigkeiten:** `chosenMode` ist Teil der Aktion
    (`castSpell`/`activateAbility`) — die Aktion ist atomar, keine
    PendingDecision. Fehlender/ungültiger/nicht wählbarer Modus → Ablehnung.
  - **Getriggerte Fähigkeiten:** Beim Stacken setzt die Engine
    `pendingDecision = { kind: "chooseMode", ... }` für den Controller
    (Antwort: `{ kind: "chooseMode", modeIndex }`, muss in
    `selectableModes` liegen). Genau ein wählbarer Modus → Komfort-Auto-Pick
    ohne Nachfrage (gleiche Abkürzung wie bei der Trigger-Zielwahl,
    Abschnitt 5). Braucht der gewählte Modus danach eine mehrdeutige
    Zielwahl, folgt `chooseTriggerTargets` als Ketten-Decision — der
    9.7-Mechanismus (inkl. `resumePriorityTo`) trägt solche Ketten bereits.
    **v0.3.1:** Die Moduswahl wird dabei am Folge-Decision-Objekt selbst
    persistiert (`chooseTriggerTargets.chosenMode`); die Zielwahl-Antwort
    bezieht sich auf die targets dieses Modus, und der Wert wandert beim
    Stacken als `StackObject.chosenMode` weiter (Nachtrag zu 9.13).
- **Stack/Resolution:** `chosenMode` wird an allen drei
  `StackObject`-Varianten gespeichert; `chosenTargets` indizieren die
  `targets` des gewählten Modus. Bei Resolution werden ausschließlich
  `modes[chosenMode].effects` ausgeführt. X (`Amount { kind: "x" }`) ist mit
  Modal frei kombinierbar.
- **`getLegalActions`:** liefert für modale Spells/Fähigkeiten einen
  Kandidaten ohne `chosenMode`/`chosenTargets` (Frontend fragt Modus und
  Ziele ab — Modus-x-Ziel-Kombinationen werden nicht enumeriert); bei der
  `chooseMode`-Decision einen `resolveDecision`-Kandidaten **pro** Eintrag
  in `selectableModes`.

### Resolution

- Es resolvt immer nur das **oberste** Objekt, und nur wenn alle Spieler nacheinander gepasst haben. Zwischen zwei Resolutions gibt es also immer ein volles Priority-Fenster (Antworten möglich).
- **Target-Recheck bei Resolution:** Sind bei Resolution ALLE Ziele eines Objekts illegal geworden, wird das Objekt entfernt ohne Wirkung („fizzles"; Spells gehen dabei in den Graveyard). Sind nur manche Ziele illegal, resolvt der Rest.
- **Nicht-Permanent-Fizzle bei der Effekt-Ausführung (v0.3.2, Entscheidung 9.14):** Löst ein permanent-bezogener Effekt (`dealDamage` auf ein Permanent, `destroyPermanent`, `exilePermanent`, `returnToHand`, `tapPermanent`, `untapPermanent`, `modifyStats`, `grantKeyword`, `addCounters`, `removeCounters`) seinen Empfänger auf und dieser ist **kein Permanent auf dem Battlefield (mehr)** — egal ob gewähltes Ziel, `self` oder `eventSubject` —, wird der Effekt für genau diesen Empfänger **still übersprungen**: kein Fehler, kein Event, und insbesondere keine Ersatzwirkung in der Zone, in der die Karte jetzt liegt (`exilePermanent` verbannt NIE aus dem Graveyard, `returnToHand` holt NIE aus dem Graveyard zurück). Übrige Empfänger/Effekte desselben Objekts resolven normal. Das verallgemeinert den Teil-Fizzle gewählter Ziele (Punkt oben) auf die fixen `EffectRecipient`-Werte; praktisch relevant vor allem für `eventSubject` (Abschnitt 5). Maßgebliches Kriterium für die Engine: `CardInstance.permanentState` existiert (⟺ auf dem Battlefield); eine bereits vollständig gelöschte Instanz (Token, SBA 7) zählt selbstverständlich ebenfalls als Nicht-Permanent und darf keinen Crash verursachen.
- Nach Resolution: Spell-Karten vom Typ `spell` → Graveyard. `unit`/`relic`/`enchantment` → Battlefield (als Permanent, ETB-Trigger feuern). Fähigkeiten-Objekte verschwinden einfach.
- **Countern:** Ein Effekt `counterSpell` entfernt ein Stack-Objekt wirkungslos (Spell → Graveyard).

### Beispiel (kanonischer Ablauf)

1. Spieler A castet in Main 1 eine Unit → Stack: [Unit]. A hat Priority, passt.
2. Spieler B antwortet mit `spell(fast)` „Gegenzauber" mit Ziel Unit → Stack: [Unit, Gegenzauber]. B passt, A passt.
3. Gegenzauber resolvt (LIFO: oben zuerst) → Unit wird gecountert, geht in As Graveyard.
4. Stack leer, A passt, B passt → Main 1 geht weiter (bzw. endet, wenn beide erneut passen).

---

## 5. Getriggerte Fähigkeiten

- Trigger-Bedingungen (siehe `TriggerCondition` in `src/model/abilities.ts`): u.a. ETB („kommt ins Spiel"), Tod, Zugbeginn/Upkeep, End Step, Angriffs-/Block-Deklaration, Schaden verursacht, Spell gecastet.
- **`onDamageReceived` („Schaden erlitten") — v0.3 verdrahtet (Entscheidung 9.10; der „reserviert, nicht verwenden"-Status aus v0.2.3 ist aufgehoben):**
  - **Wann:** Feuert, wenn das Permanent mit dieser Fähigkeit Schaden > 0 erhält — **Kampf- UND Effekt-Schaden**, einheitlich. Es feuert einmal **pro Schadensereignis** (Granularität = ein `damageDealt`-Event an das Permanent): Bei Mehrfachblock also einmal pro Schadensquelle, bei firstStrike einmal pro Schadensrunde (6d(4)).
  - **Schaden ≤ 0 feuert nicht** (konsistent mit 6c — „deals 0 damage" ist kein Schadensereignis).
  - **Letaler Schaden feuert:** Der Trigger wird beim Schadensereignis in die Pending-Queue gelegt; stirbt das Permanent anschließend in der SBA-Prüfung, bleibt der Trigger dort und wird normal gestackt und resolvt (MTG-analog „stirbt mit Trigger auf dem Stack"). Dokumentierte Vereinfachung: Ist die Quelle ein **Token**, dessen Instanz SBA 7 vor dem Stacken vollständig löscht, verpufft der Trigger (kein Definitions-Lookup mehr möglich).
  - **`eventSubject` ist die Schadensquelle** (die InstanceId des schadenverursachenden Permanents/Spells) — ermöglicht „Vergeltungs"-Designs über `EffectRecipient "eventSubject"`. Bewusste Abweichung von den übrigen Self-Combat-Triggern (dort `eventSubject` = die Quelle selbst); `fireSelfCombatTrigger` braucht dafür einen Parameter oder eine eigene Feuer-Funktion.
  - **Scope:** `what: "self"` betrifft ausschließlich Permanents. „Ein Spieler erleidet Schaden" ist ein separater, bewusst **nicht** modellierter Trigger (Abschnitt 10).
  - **Verdrahtung (Empfehlung an engine-engineer):** bevorzugt EIN zentraler Helfer „Schaden an Permanent anwenden" (markiert `damageMarked`, setzt ggf. `deathtouchDamage`, emittiert `damageDealt`, feuert `onDamageReceived`), genutzt sowohl von der Apply-Schleife in `combat.ts#dealCombatDamageRound` als auch von `effects.ts#dealDamageToPermanent` — das dedupliziert nebenbei die heute doppelt vorhandene deathtouch-Flag-Logik. Zwei getrennte Feuerstellen sind zulässig, wenn der Helfer nicht sinnvoll extrahierbar ist; die Semantik oben ist in beiden Fällen identisch einzuhalten.
- **`eventSubject` referenziert Objekte auch nach deren Tod (v0.3.2, Entscheidung 9.14):**
  `eventSubject` ist eine reine InstanceId-Referenz auf die auslösende Karteninstanz, **wo immer
  sie beim Resolven liegt** — bei `onUnitDied` und `onDeath` also regulär die Karte im Graveyard
  (bzw. eine ins Leere zeigende Referenz, falls SBA 7 eine Token-Instanz gelöscht hat). Die
  Kombination mit permanent-bezogenen Effekten ist **zulässig** und löst über die
  Nicht-Permanent-Fizzle-Regel (Abschnitt 4) auf: kein Permanent mehr → Effekt für diesen
  Empfänger still übersprungen. Konsequenzen:
  - **`onUnitDied`/`onDeath`:** Das Subjekt ist beim Resolven **nie** mehr ein Permanent —
    permanent-bezogene Effekte auf `eventSubject` sind hier also garantiert wirkungslos.
    Card-Designer: **nicht bauen** (empfohlen zusätzlich als Pool-Lint); es ist eine erlaubte,
    aber sinnfreie Kombination, kein Fehlerfall.
  - **`onDamageReceived`:** `eventSubject` = Schadensquelle (9.10), die beim Resolven noch leben
    KANN — das Vergeltungs-Muster bleibt der tragende Anwendungsfall. Ist die Quelle inzwischen
    gestorben, fizzelt die Vergeltung still (gleiche Regel, erwartetes Verhalten).
  - Der eigentlich gewünschte **„Removal-bei-Tod"-Archetyp** („stirbt eine Unit, verbanne sie")
    ist in Wahrheit ein *Graveyard*-Effekt und braucht ein eigenes, ehrlich benanntes Primitiv
    (z.B. `exileFromGraveyard`) statt einer zonenabhängigen Umdeutung von `exilePermanent` —
    bewusst vertagt (Abschnitt 10, Begründung in 9.14).
- **Todesdefinition für `onDeath`/`onUnitDied` (v0.3.3, Entscheidung 9.15):** „Stirbt" heißt: das Permanent verlässt das Battlefield **in Richtung Graveyard** — ursachenunabhängig. Todesursachen sind damit gleichwertig: SBA 3/4 (Toughness ≤ 0 / letaler Schaden), `destroyPermanent`, die `sacrificeSelf`-Zusatzkosten und SBA 5 (Aura verliert ihr Ziel). Bei Tokens zählt der Abgang Richtung Graveyard, auch wenn SBA 7 die Instanz stattdessen löscht. **Kein Tod** sind dagegen `exilePermanent` und `returnToHand` (kein Graveyard — Exil umgeht Tod-Trigger absichtlich, das ist dokumentiertes Design und Bepreisungs-Argument für Exil-Removal), ebenso wenig Countern (Stack → Graveyard) oder Discard (Hand → Graveyard), weil dort kein Permanent das Battlefield verlässt. `onDeath { what: "self" }` ist dabei **typ-agnostisch** (feuert auch für sterbende Relics/Enchantments/Terrains — „parting shot"-Designs); `onUnitDied` und das Event `unitDied` bleiben auf sterbende **Units** beschränkt (der Name ist der Vertrag). Bis v0.3.2 feuerte all das de facto nur auf dem SBA-Pfad — das war ein Bug (9.15), kein Design.
- **Feuern ≠ Resolven:** Tritt das Ereignis ein, wird der Trigger nur **vorgemerkt** (Pending-Trigger-Queue). Er wird erst auf den Stack gelegt, **wenn das nächste Mal ein Spieler Priority erhalten würde** (siehe Priority-Regel 3).
- **Reihenfolge (APNAP):** Warten mehrere Trigger, legt zuerst der aktive Spieler seine Trigger in selbstgewählter Reihenfolge auf den Stack, dann der nicht-aktive Spieler. Dessen Trigger resolven dadurch zuerst (LIFO). v0.1-Vereinfachung: Hat ein Spieler mehrere gleichzeitige Trigger, ordnet die Engine sie deterministisch (Timestamp der Quelle) statt den Spieler wählen zu lassen — Spielerwahl ist ein späteres Feature.
- Trigger mit Targets wählen ihre Ziele beim **Auf-den-Stack-Legen**, nicht beim Feuern.
- **Zielwahl durch den Spieler (v0.2 geklärt):** Braucht ein Trigger beim Stacken Ziele und gibt es mehr als eine legale Wahl, setzt die Engine `GameState.pendingDecision = { kind: "chooseTriggerTargets", ... }` und pausiert (keine Priority-Vergabe, kein Stepwechsel), bis der Controller mit der Aktion `resolveDecision` geantwortet hat — Mechanik siehe Abschnitt 9.7. Gibt es genau eine legale Belegung, darf die Engine sie ohne Nachfrage wählen (Komfort-Abkürzung, gleiches Ergebnis). Gibt es keine legale Belegung, wird der Trigger gar nicht erst auf den Stack gelegt (MTG-analog zu „kein legales Ziel beim Ansagen"). Der bisherige v0.1-Auto-Pick („erstes legales Ziel") ist damit **abgelöst** und soll aus der Engine entfernt werden, sobald `resolveDecision` implementiert ist.
- Auf Trigger kann geantwortet werden wie auf Spells (sie liegen normal auf dem Stack).

---

## 6. Kampf

- **Declare Attackers:** Aktiver Spieler wählt beliebig viele eigene ungetappte Units ohne Summoning Sickness (Ausnahme: Keyword `swift`/Eile). Angreifer werden getappt (Ausnahme: Keyword `vigilant`). Angriffsziel ist in v0.1 immer der gegnerische Spieler. Angriffs-Trigger feuern.
- **Declare Blockers:** Verteidiger ordnet ungetappte eigene Units als Blocker je einem Angreifer zu (mehrere Blocker pro Angreifer erlaubt; ein Blocker blockt genau einen Angreifer). Blocker werden nicht getappt. Evasion: `airborne` (Flying-Analog) kann nur von `airborne` oder `reach`-Units geblockt werden.
- **`guardian` (v0.2, finale Regel):** Jede **ungetappte** guardian-Unit, die der **verteidigende** Spieler zum Zeitpunkt der Blocker-Deklaration kontrolliert, **muss** einem Angreifer als Blocker zugeordnet werden, sofern für sie mindestens ein legaler Block existiert (Evasion beachten). Präzisierungen zu den offenen Fragen:
  - Die Pflicht gilt **pro guardian-Unit** (nicht „insgesamt mindestens ein Blocker"). Welchen Angreifer die jeweilige guardian-Unit blockt, wählt der Verteidiger frei.
  - Maßgeblich ist ein **Snapshot bei der Deklaration**: Wurde die guardian-Unit vorher getappt (z.B. durch einen Instant im Declare-Attackers-Fenster), besteht für sie keine Pflicht. Wird sie **nach** der Deklaration getappt, bleibt der deklarierte Block bestehen (Tappen entfernt Blocks nicht — MTG-konform).
  - Nur der Verteidiger ist betroffen; guardian auf angreifenden oder angreiferseitigen Units hat keine Wirkung. Da nur der Verteidiger blockt, ist „mehrere Guardians verschiedener Spieler" kein möglicher Konfliktfall.
  - Enforcement: reine Validierung der `declareBlockers`-Aktion (illegale Deklarationen ohne Pflicht-Blocks werden abgelehnt); `getLegalActions` muss die Pflicht nicht enumerieren.
  - Design-Einordnung für den Card-Designer: guardian ist damit thematisch ein Vorteil („stellt sich schützend in den Weg"), mechanisch eine milde Selbstbindung — auf defensiven Statlines (wie `core.temple-sentinel` 2/5) praktisch kein Nachteil, auf aggressiven Statlines ein echter Preis. Bitte so bepreisen.
- **Combat Damage (v0.2.3 überarbeitet, Details in 6d):** Bis zu **zwei Schadensrunden** — eine frühe Runde nur für Kampfteilnehmer mit `firstStrike`, dann die reguläre Runde für alle übrigen; innerhalb einer Runde alle Schäden gleichzeitig. Geblockte Angreifer bedienen ihre Blocker in der vom **Angreifer** gewählten Reihenfolge (`orderBlockers`-Decision bei Mehrfachblock, revidierte Entscheidung 9.8) mit jeweils der letalen Menge (bei `deathtouch`: 1); ohne `trample` erhält der letzte Blocker den gesamten Rest (kein Durchschlagen), mit `trample` trifft der Überschuss den verteidigenden Spieler. Ungeblockte Angreifer treffen den Spieler. Schaden wird als **markierter Schaden** auf Units notiert (verschwindet im Cleanup, ebenso das deathtouch-Flag) bzw. als Lebensverlust beim Spieler. Tod durch letalen Schaden regelt weiterhin ausschließlich die SBA-Prüfung (bei firstStrike inkl. Zwischen-SBA-Durchlauf zwischen den Runden, 6d), nicht der Combat-Code.

### 6a. Priority-Fenster im Kampf (v0.2.2 bestätigt)

Alle fünf Combat-Steps haben ein Priority-Fenster; es gilt die normale Schleife aus Abschnitt 3 **ohne Kampf-Sonderfall** (SBA-Check → Pending-Trigger stacken → Priority vergeben). Präzisierung, wann die Fenster öffnen:

- **Begin Combat / End Combat:** Fenster öffnet zu Step-Beginn (End Combat: nachdem alle Kampfzuordnungen entfernt wurden).
- **Declare Attackers / Declare Blockers:** Die Deklaration ist eine Turn-Based Action, die Spieler-Input braucht — während die Engine auf die `declareAttackers`-/`declareBlockers`-Aktion wartet, hat **niemand** Priority (`priorityPlayer` ist unbesetzt). Das Priority-Fenster öffnet unmittelbar **nach** der Deklaration (Angriffs-/Block-Trigger feuern zuerst, dann erhält der aktive Spieler Priority). **v0.2.3:** Wurde mindestens ein Angreifer mehrfach geblockt, schiebt sich zwischen Block-Deklaration und Priority-Fenster die `orderBlockers`-Decision des Angreifers (6d).
- **Combat Damage:** Die Schadensverrechnung ist die Turn-Based Action am **Beginn** des Steps; das Priority-Fenster öffnet erst danach (dort werden dann via SBA die Toten abgeräumt und Todes-Trigger gestackt). **v0.2.3:** Die Turn-Based Action umfasst ggf. zwei interne Schadensrunden (6d) — es bleibt EINE Turn-Based Action, das Fenster öffnet erst nach beiden Runden.

Konsequenz: Das **letzte Antwortfenster vor dem Schaden ist das Fenster des Declare-Blockers-Steps**. Kill-, Pump- oder Debuff-Instants auf bereits deklarierte Angreifer/Blocker werden genau dort gecastet — die Folgen regelt 6b/6c.

Sonderfall ohne Angreifer (bereits Abschnitt 2): Wird kein Angreifer deklariert, springt der Zug von Declare Attackers direkt zu End Combat (Declare Blockers und Combat Damage entfallen samt ihrer Fenster; das Fenster nach der leeren Deklaration und das End-Combat-Fenster existieren weiterhin).

### 6b. Zonenwechsel zwischen Deklaration und Kampfschaden (v0.2.2, explizit)

Verlässt ein Kampfteilnehmer nach der Deklaration das Battlefield (Kill-Spell, Bounce, Opfern, …), gilt:

1. **Seine eigene Kampfzuordnung verschwindet mit ihm** — `PermanentState` (inkl. `combat`) wird beim Verlassen des Battlefields verworfen (Abschnitt 8 / `CardInstance.permanentState`). Kommt die Karte später zurück, ist sie ein neues, am Kampf unbeteiligtes Objekt.
2. **„Geblockt bleibt geblockt":** Ein Angreifer, der geblockt wurde, bleibt geblockt, auch wenn alle seine Blocker vor dem Combat-Damage-Step sterben. Ohne `trample` fügt er dann **niemandem** Kampfschaden zu und erhält keinen — insbesondere schlägt er **nicht** beim verteidigenden Spieler durch. **Mit `trample` (v0.2.3, 6d):** Sind sämtliche Blocker vor der jeweiligen Schadensrunde entfernt, teilt er stattdessen seinen **gesamten** Schaden dem verteidigenden Spieler zu (MTG-konform). Überleben andere Blocker desselben Angreifers, verteilt er seinen Schaden regulär auf diese (tote Blocker werden bei der Zuteilung übersprungen, verbrauchen also keinen Schaden — ihre letale Menge ist 0, bei trample fließt entsprechend mehr zum Spieler durch).
3. **Blocker ohne Angreifer:** Ein Blocker, dessen Angreifer das Battlefield verlassen hat, fügt niemandem Kampfschaden zu und erhält keinen Kampfschaden.
4. **Tappen/Enttappen nach der Deklaration ändert Kampfzuordnungen nicht** (MTG-konform; für `guardian` oben bereits festgehalten, gilt aber allgemein). Ein nach der Deklaration getappter Angreifer/Blocker teilt seinen Schaden normal aus und ein enttappter Angreifer bleibt Angreifer.

Das entspricht dem MTG-Vorbild (Blocked-Status bleibt bestehen; entfernte Kampfteilnehmer verrechnen keinen Kampfschaden) und ist in `combat.ts#dealCombatDamage` bereits so implementiert (defensive Prüfungen auf fehlenden `permanentState`) — der Combat-End-to-End-Test soll genau diese vier Punkte abdecken.

### 6c. 0/negative Power oder Toughness im Kampf (v0.2.2 bestätigt)

- **Schadensbeträge ≤ 0 sind kein Schaden.** Eine Unit mit effektiver Power ≤ 0 (z.B. nach Debuff im Declare-Blockers-Fenster) markiert keinen Schaden, verursacht keinen Lebensverlust, löst keinen lifelink-Lebensgewinn aus, feuert keine „Schaden verursacht/erlitten"-Trigger und erzeugt kein `damageDealt`-Event. (Analog MTG: „deals 0 damage" ist kein Schadensereignis.)
- **Toughness ≤ 0 oder letaler Schaden:** regeln ausschließlich die bestehenden SBAs 3/4 (Abschnitt 7), die vor jeder Priority-Vergabe laufen — also z.B. unmittelbar nach dem Resolven des Debuff-Spells, noch im Declare-Blockers-Fenster. Die so gestorbene Unit wird dann nach 6b behandelt. **Es gibt keine Kampf-Sonderregel**; der Combat-Code selbst tötet nie.

### 6d. Kampfschaden im Detail: Reihenfolge, trample, firstStrike, deathtouch (v0.2.3)

Drei neue Keywords (Typ `Keyword` in `src/model/abilities.ts`; die internen IDs bleiben bewusst
nah am MTG-Vorbild, damit die Mechanik unverwechselbar ist — Anzeigenamen/Flavor darf der
Card-Designer frei wählen):

- **`trample`** (Trample-Analog, nur im Angriff wirksam): Überschussschaden über die letale
  Menge aller zugeordneten Blocker hinaus trifft den verteidigenden Spieler statt zu verpuffen.
- **`firstStrike`** (First-Strike-Analog): teilt Kampfschaden in einer zusätzlichen frühen
  Schadensrunde aus — und in der regulären Runde **nicht** mehr (kein Double-Strike-Analog,
  Abschnitt 10).
- **`deathtouch`** (Deathtouch-Analog): Jeder Schaden > 0 dieser Quelle gilt als letal —
  sowohl für SBA 4 (Abschnitt 7, neues Flag `PermanentState.deathtouchDamage`) als auch für
  die Berechnung der „letalen Menge" bei der Schadenszuteilung. Gilt für **jeden** Schaden der
  Quelle (auch Effekt-Schaden via `dealDamage` von einer deathtouch-Unit als Quelle), nicht nur
  Kampfschaden — MTG-konform und einfacher als eine Kampf-Sonderregel.

**(1) Schadensreihenfolge bei Mehrfachblock — der Angreifer wählt (Revision von 9.8):**
Unmittelbar nach der `declareBlockers`-Deklaration, **vor** dem Priority-Fenster des Steps:
Hat mindestens ein Angreifer ≥ 2 Blocker, setzt die Engine
`pendingDecision = { kind: "orderBlockers", ... }` — **eine** Decision für alle mehrfach
geblockten Angreifer gemeinsam (Angreifer mit 0/1 Blockern sind nicht enthalten). Der
**angreifende** Spieler legt pro gelistetem Angreifer eine Permutation seiner Blocker fest;
das Ergebnis wird in `CombatAssignment.blockedBy` gespeichert (das Feld bleibt unverändert,
nur die Quelle der Ordnung wechselt vom Verteidiger zum Angreifer). Die Decision liegt
**außerhalb** einer Priority-Vergabe → `resumePriorityTo` wird nicht gesetzt (9.7); nach
`resolveDecision` läuft die normale Vor-Priority-Schleife (SBAs, Block-Trigger stacken, ggf.
weitere Decisions), dann erhält der aktive Spieler Priority. Die Reihenfolge wird **einmal**
festgelegt und gilt unverändert für beide Schadensrunden; sie wird nicht neu gewählt, wenn
Blocker vorher sterben (tote Blocker werden bei der Zuteilung übersprungen, 6b).

**(2) Schadensrunden (firstStrike):** Die Turn-Based Action des Combat-Damage-Steps besteht
intern aus bis zu zwei Runden. Das Phasenmodell (Abschnitt 2) ändert sich **nicht** — kein
neuer Step, kein zusätzliches Priority-Fenster (Trade-off in 9.9):

1. **Frühe Runde** — nur, falls mindestens ein Kampfteilnehmer `firstStrike` hat (sonst
   entfällt sie ersatzlos und alles verhält sich wie bisher): Alle Kampfteilnehmer **mit**
   firstStrike teilen ihren Kampfschaden gleichzeitig aus (Zuteilung nach (3)).
2. **Zwischen-SBA-Durchlauf:** Die Engine führt die SBA-Schleife (Abschnitt 7) aus, **ohne**
   Priority zu vergeben; dabei gefeuerte Trigger bleiben in der Pending-Queue und werden erst
   im Priority-Fenster des Steps gestackt. So sterben Units mit letalem Schaden aus der frühen
   Runde, **bevor** sie zurückschlagen — und der Grundsatz „der Combat-Code selbst tötet nie"
   (6c) bleibt gewahrt.
3. **Reguläre Runde:** Alle verbliebenen Kampfteilnehmer **ohne** firstStrike teilen
   gleichzeitig aus; firstStrike-Units teilen hier nichts mehr aus. Für in der frühen Runde
   gestorbene/entfernte Teilnehmer gilt 6b.

Danach öffnet wie bisher das Priority-Fenster des Steps (6a) — erst dort werden Tote der
regulären Runde abgeräumt und alle im Step gefeuerten Trigger gestackt.

**(3) Zuteilungsalgorithmus eines geblockten Angreifers (pro Runde, deterministisch):**

- **Letale Menge pro Blocker** = `1`, falls der Angreifer `deathtouch` hat; sonst
  Toughness des Blockers − markierter Schaden − bereits in dieser Zuteilung zugewiesener
  Schaden (mindestens 0). Tote/entfernte Blocker haben letale Menge 0 und werden übersprungen.
- Der Angreifer bedient seine Blocker in `blockedBy`-Reihenfolge mit jeweils **genau** der
  letalen Menge (bzw. dem Rest seiner Power, falls weniger übrig).
- **Ohne `trample`:** Der letzte lebende Blocker erhält zusätzlich den gesamten Rest; nichts
  trifft den Spieler.
- **Mit `trample`:** Nachdem alle Blocker ihre letale Menge erhalten haben, geht der Rest an
  den verteidigenden Spieler. Vereinfachung (9.9): Die Zuteilung ist automatisch — der
  Angreifer kann **nicht** freiwillig mehr als letal an einen Blocker geben. Sonderfall: Sind
  sämtliche Blocker entfernt, geht die gesamte Power an den Spieler (6b(2)).
- **Blocker** teilen ihre Power unverändert vollständig dem geblockten Angreifer zu (kein
  Aufteilen); `trample` auf Blockern hat keine Wirkung.

**(4) Kombinatorik (verbindlich durchdekliniert):**

- **firstStrike + deathtouch:** Der Träger tötet bereits in der frühen Runde (jeder Schaden
  ≥ 1 ist letal, Tod im Zwischen-SBA-Durchlauf); das Opfer schlägt in der regulären Runde
  **nicht** mehr zurück.
- **firstStrike + trample:** Der Überschuss schlägt bereits in der frühen Runde beim Spieler
  durch. Sterben alle Blocker an der frühen Runde, teilt der Angreifer in der regulären Runde
  **nichts** mehr aus (firstStrike-Regel) — es gibt keinen „zweiten Durchschlag".
- **trample + deathtouch:** Letale Menge = 1 pro Blocker, fast die gesamte Power schlägt
  durch. Bewusst sehr stark — Card-Designer: diese Kombination teuer bepreisen oder meiden.
- **deathtouch + Reihenfolgewahl:** Da 1 pro Blocker letal ist, tötet ein deathtouch-Angreifer
  mit Power ≥ Blockerzahl **alle** Blocker; die orderBlockers-Wahl entscheidet nur noch bei
  Power < Blockerzahl, **wer** stirbt.
- **firstStrike-Blocker gegen (trample-)Angreifer ohne firstStrike:** Der Blocker schlägt
  zuerst; stirbt der Angreifer im Zwischen-SBA-Durchlauf, teilt er keinerlei Schaden aus —
  auch keinen trample-Durchschlag.
- **firstStrike + lifelink / Schadens-Trigger:** Jede Runde ist ein normales Schadensereignis
  — lifelink-Lebensgewinn, `onDealtCombatDamageToPlayer`- und `onDamageReceived`-Trigger
  (v0.3 verdrahtet, Abschnitt 5) sowie `damageDealt`-Events entstehen pro Runde; Trigger
  werden erst im Priority-Fenster des Steps gestackt (auch die aus der frühen Runde —
  eine in der frühen Runde letal getroffene Unit stirbt also im Zwischen-SBA-Durchlauf,
  ihr `onDamageReceived`-Trigger resolvt trotzdem).
- **6c bleibt unverändert:** Schaden ≤ 0 ist kein Schaden — eine deathtouch-Quelle mit
  effektiver Power ≤ 0 setzt also auch **kein** deathtouch-Flag.
- **firstStrike/deathtouch/trample + guardian/vigilant/airborne/reach:** keine Interaktion
  (Deklarations- und Blockregeln bleiben unberührt; die neuen Keywords wirken erst bei der
  Schadensverrechnung).

---

## 7. State-Based Actions (SBAs)

**Wann geprüft:** Immer unmittelbar bevor ein Spieler Priority erhält (und in der Cleanup-Sonderregel). In einer Schleife, bis keine SBA mehr zutrifft; erst danach werden Pending-Trigger auf den Stack gelegt. SBAs gehen selbst nie über den Stack und können nicht „beantwortet" werden — aber sie lösen ggf. Trigger aus (z.B. Todes-Trigger).

**Liste (v0.1):**

1. Ein Spieler mit ≤ 0 Leben verliert das Spiel.
2. Ein Spieler, der aus leerer Library ziehen musste, verliert das Spiel (geprüft als SBA, markiert beim Ziehversuch).
3. Eine Unit mit Toughness ≤ 0 wird in den Graveyard gelegt (das ist kein „Schaden", regeneriert nicht).
4. Eine Unit mit markiertem Schaden ≥ Toughness stirbt (letaler Schaden). **v0.2.3 (deathtouch):** Ebenso stirbt eine Unit, die seit dem letzten Cleanup Schaden > 0 von einer Quelle mit `deathtouch` erhalten hat — Zustandsflag `PermanentState.deathtouchDamage`, gesetzt beim Schadensereignis, zurückgesetzt im Cleanup zusammen mit dem markierten Schaden.
5. Eine Aura, deren angelegtes Objekt fehlt oder illegal geworden ist, geht in den Graveyard.
6. `+1/+1`- und `-1/-1`-Marken auf demselben Permanent annihilieren sich paarweise.
7. Ein Token, das das Battlefield verlässt, hört auf zu existieren (wird endgültig entfernt statt Zonenwechsel).

Warum SBAs statt Ad-hoc-Checks: Ein zentraler, immer gleicher Prüfzeitpunkt verhindert die klassischen Bugs („Kreatur mit 0 Toughness überlebt, weil der Effekt-Code den Tod vergessen hat"). Effekt-Code verändert nur Zustand; Sterben durch Schaden/Toughness und Verlieren entscheidet ausschließlich die SBA-Schleife.

**v0.3.3-Präzisierung (Entscheidung 9.15):** Tod-**Trigger** (`onDeath`/`onUnitDied`) und das `unitDied`-Event hängen NICHT am SBA-Pfad, sondern am Zonenwechsel Battlefield → Graveyard selbst — SBA 3/4 ist nur eine der Todesursachen (neben `destroyPermanent`, `sacrificeSelf`-Kosten und SBA 5). Todesdefinition in Abschnitt 5.

---

## 8. Zustände von Permanents

Siehe `PermanentState` in `src/model/game-state.ts`:

- **tapped:** Getappte Permanents können nicht angreifen und keine Fähigkeiten mit Tap-Kosten aktivieren.
- **Summoning Sickness:** Units können im Zug ihres Ankommens weder angreifen noch Tap-Kosten-Fähigkeiten aktivieren (Ausnahme: `swift`). Gilt nicht für Nicht-Units.
- **markierter Schaden:** Sammelt sich bis Cleanup, siehe SBAs 4. Dazu gehört seit v0.2.3 das Flag `deathtouchDamage` (Schaden von einer deathtouch-Quelle erhalten) — gleiche Lebensdauer wie markierter Schaden, Wirkung siehe SBA 4.
- **Counters/Marken:** Generisches `counters: Record<string, number>`; standardisiert sind `plus1plus1`, `minus1minus1`, `charge`. Card-Designer dürfen neue Marken-Namen einführen, müssen deren Semantik aber über Fähigkeiten definieren (Marken selbst tun nichts).
- **Attachments:** Auren (und später Equipment-artige Relics) referenzieren ihr Ziel über `attachedTo`; das Ziel führt eine `attachments`-Liste. Konsistenz sichert SBA 5.

---

## 9. Design-Entscheidungen (Trade-offs)

### 9.1 Event-Sourcing vs. State-Mutation

**Optionen:**
- (A) Reine State-Mutation: Engine mutiert ein Zustandsobjekt in-place. Einfach, aber schwer testbar, kein Replay, Frontend-Sync fummelig.
- (B) Volles Event-Sourcing: Der Event-Log ist die Wahrheit, Zustand wird projiziert. Maximal mächtig (Replay, Undo, Netzwerk), aber für ein Hobby-Projekt viel Infrastruktur, und Regeln wie SBAs sind zustandsbasiert, nicht eventbasiert — man projiziert ständig.
- (C) **Hybrid (Empfehlung):** Zustand ist die Wahrheit, aber die Engine ist eine reine Funktion `applyAction(state, action) → { state', events[] }` mit immutablem `GameState`. Die emittierten `GameEvent`s sind ein *Abfallprodukt* für Frontend-Animationen, Log-Anzeige und Trigger-Erkennung — nicht die Quelle der Wahrheit.

**Begründung:** (C) gibt uns Determinismus und Testbarkeit (Snapshot rein, Snapshot raus), das Frontend bekommt einen Event-Strom für Animationen, und wir vermeiden die Projektion-Komplexität von (B). Zufall (Mischen, Münzwurf) läuft über einen seedbaren RNG im `GameState`, damit Tests und Replays deterministisch bleiben.

### 9.2 Wie kommen Trigger auf den Stack?

**Optionen:**
- (A) Sofort-Resolution beim Ereignis (kein Stack): Einfachster Code, aber keine Antwortmöglichkeit, Reihenfolgen-Bugs bei Mehrfach-Triggern, weicht stark vom MTG-Modell ab.
- (B) **MTG-Modell (Empfehlung):** Ereignis → Trigger in Pending-Queue → beim nächsten Priority-Zeitpunkt in APNAP-Reihenfolge auf den Stack → normale LIFO-Resolution mit Antwortfenster.

**Begründung:** (B) ist der Kern dessen, was das Spiel interessant macht (Responses auf Trigger), und die Pending-Queue ist implementatorisch billig. Einzige v0.1-Vereinfachung: deterministische statt spielergewählter Ordnung bei mehreren eigenen gleichzeitigen Triggern (s. Abschnitt 5).

### 9.3 Statische Effekte: kein Layer-System

MTGs 7-Schichten-System ist für unseren Umfang Overkill. **Entscheidung v0.1:** Statische Effekte werden bei jeder Abfrage in fester Reihenfolge berechnet: Basiswerte → Marken (`plus1plus1`/`minus1minus1`) → statische Modifikatoren in Timestamp-Reihenfolge der Quelle. Keyword-Gewährung ist additiv; Keyword-Entzug („verliert airborne") verschieben wir, bis eine Karte ihn braucht. Card-Designer: Fähigkeiten, die dieses Modell sprengen (Kontrollwechsel, Typänderung, „wird zu einer Kopie von"), bitte erst mit dem Game-Architect abstimmen.

### 9.4 Effekt-Repräsentation: Daten-DSL statt Code pro Karte

**Optionen:** (A) Jede Karte bringt eine eigene Effekt-Funktion mit (mächtig, aber Karten sind dann Code — Card-Designer bräuchte Engine-Wissen, keine Serialisierung). (B) **Daten-DSL (Empfehlung):** Effekte sind ein geschlossener Satz von Primitiven als Discriminated Unions (`DealDamage`, `DrawCards`, `ModifyStats`, …), die die Engine interpretiert.

**Begründung:** (B) hält Karten als reine JSON-serialisierbare Daten (Deck-Import/-Export gratis), Card-Designer arbeitet ohne Engine-Code, und die Engine testet jedes Primitiv genau einmal. Preis: Neue Mechaniken erfordern eine DSL-Erweiterung durch den Game-Architect — das ist gewollt (ein Abstimmungspunkt statt Wildwuchs).

### 9.5 Mana-Bezahlung

v0.1: Spieler aktiviert Mana-Fähigkeiten explizit (kein Auto-Tap), Mana landet im Pool, Casten konsumiert aus dem Pool. Auto-Tap-Komfort ist ein reines Frontend-Feature auf Basis eines Engine-Hilfs-API („welche Tap-Kombination bezahlt Kosten X?") und kommt später.

### 9.6 Engine-Konstruktion: CardPool per Factory (v0.2, Frage von engine-engineer)

**Optionen:** (A) Pool-Parameter an `applyAction`/`getLegalActions` (explizit, aber jede Aufrufstelle schleppt den Pool mit; Gefahr, versehentlich einen anderen Pool zu übergeben als bei `createGame`). (B) `poolId` im `GameState` + globale Registry (serialisierbar, aber versteckter globaler Zustand — genau die Art impliziter Kopplung, die wir vermeiden wollen). (C) **Factory (Entscheidung, wie von engine-engineer umgesetzt):** `createRulesEngine(pool) → RulesEngine`, Pool per Closure gebunden.

**Begründung:** (C) hält den `GameState` schlank und serialisierbar, es gibt genau eine Pool-Quelle, und die drei Interface-Methoden bleiben pure Funktionen bezüglich `state`. Die Factory ist damit **abgesegnet und offizieller Vertrag** — festgehalten als `CreateRulesEngine`-Typ in `src/model/game-state.ts`. Konsequenz: `createGame` nimmt den Pool **nicht mehr** entgegen (`CreateGameConfig` ohne `pool`) — engine-engineer bitte die Signatur entsprechend anpassen (kleine Änderung, verhindert dauerhaft die „zwei Pools"-Fehlerklasse). Wichtig für Replays/Persistenz: Ein gespeicherter `GameState` ist nur zusammen mit demselben Pool gültig; das Frontend/der Persistenz-Code ist dafür verantwortlich, Engine-Instanz und States nicht zu mischen.

### 9.7 Spielerentscheidungen mitten in der Abwicklung: Pending Decisions (v0.2)

**Problem:** Mehrere Stellen brauchen eine Spielerwahl, während die Engine gerade etwas abwickelt — Trigger-Zielwahl beim Stacken, Farbwahl bei `addMana("any")`, Kartenwahl bei `discardCards`-Zusatzkosten, Reihenfolge bei `scry`. Das `PlayerAction`-Modell hatte dafür keinen Kanal.

**Optionen:** (A) Je ein eigener Aktionstyp pro Fall (viele Spezialfälle in der Priority-Logik, jede neue Entscheidung ändert den Vertrag erneut). (B) Engine-Callbacks („frag den Spieler synchron") — bricht das pure `applyAction`-Modell und ist im Frontend/Netz nicht abbildbar. (C) **Generischer Pending-Decision-Kanal (Entscheidung):** `GameState.pendingDecision` beschreibt die ausstehende Wahl; solange gesetzt, gibt es keine Priority-Vergabe und keinen Stepwechsel, und legal ist nur `resolveDecision` des betroffenen Spielers (plus `concede`). Typen: `PendingDecision`, `DecisionChoice`, Aktion `resolveDecision`, Events `decisionRequired`/`decisionResolved` in `src/model/game-state.ts`.

**Begründung:** (C) ist EIN Mechanismus für alle heutigen und künftigen Mid-Action-Entscheidungen (auch Modal-Effekte später), bleibt pure/serialisierbar und ist im Frontend trivial darstellbar („Dialog, solange pendingDecision gesetzt ist"). **v0.2-Umsetzungspflicht ist nur `chooseTriggerTargets`** (ersetzt den nicht-MTG-konformen Auto-Pick, siehe Abschnitt 5). Für die übrigen drei Fälle bleiben die dokumentierten Auto-Defaults übergangsweise erlaubt: `addMana("any")` → `colorless`; `discardCards`-Zusatzkosten → erste Handkarten; `scry` → No-Op. Sie sollen schrittweise auf den Decision-Kanal migriert werden (Reihenfolge nach Bedarf des Kartenpools); Karten, deren Spielwert an der echten Wahl hängt (z.B. ein scry-lastiges Design), bitte erst nach Migration ins Set nehmen.

**Priority-Wiederaufnahme nach einer Decision-Pause (v0.2.1, Frage von engine-engineer):**
Unterbricht eine PendingDecision eine anstehende Priority-Vergabe, darf der ursprünglich vorgesehene Empfänger nicht verloren gehen. Der Randfall: Der nicht-aktive Spieler castet einen Instant, der einen mehrdeutigen Trigger auslöst — nach Priority-Regel 2 (Abschnitt 3) müsste **er** nach dem Stacken des Triggers erneut Priority erhalten, nicht der aktive Spieler.

*Optionen:* (A) Vereinfachung „nach Decision immer activePlayer" dauerhaft absegnen — verletzt im Randfall Priority-Regel 2 und würde mit wachsendem Kartenpool (mehr Trigger auf Instants) häufiger falsch. (B) Feld an jeder `PendingDecision`-Variante — muss bei Decision-Ketten (mehrere Trigger nacheinander) von Decision zu Decision umkopiert werden. (C) **Feld am `GameState` (Entscheidung):** `GameState.resumePriorityTo?: PlayerId`.

*Regel:* Die Engine setzt `resumePriorityTo` auf den vorgesehenen Empfänger, sobald eine Priority-Vergabe durch eine Decision pausiert. Nach `resolveDecision` läuft die normale Vor-Priority-Schleife weiter (SBAs, weitere Trigger — die erneut pausieren dürfen; das Feld bleibt dabei unverändert stehen). Erst wenn die Priority tatsächlich vergeben wird, geht sie an `resumePriorityTo`, und das Feld wird geleert. Decisions außerhalb einer Priority-Vergabe (künftige Kosten-/Resolution-Entscheidungen wie `chooseDiscard`/`orderScry`) setzen das Feld nicht — dort geht der Ablauf nach der Auflösung normal weiter, als hätte es die Pause nicht gegeben. Der bisherige Fallback „immer activePlayer" ist damit abgelöst.

### 9.8 Mehrfachblock: Wer bestimmt die Schadensreihenfolge? (v0.2.2)

**Problem:** Blocken mehrere Blocker denselben Angreifer, teilt der Angreifer seine Power der Reihe nach auf (mind. letal pro Blocker, Abschnitt 6). Im MTG-Vorbild legt der **Angreifer** beim Declare-Blockers-Step die Damage Assignment Order fest. Unsere Implementierung (`combat.ts#declareBlockers`/`dealCombatDamage`) nutzt stattdessen die Reihenfolge der `blocks`-Paare in der `declareBlockers`-Aktion — faktisch wählt also der **Verteidiger**. Der Kommentar an `CombatAssignment.blockedBy` („Deklarationsreihenfolge") ist damit technisch korrekt, ließ aber offen, wessen Wahl das ist.

**Optionen:**
- (A) **Verteidiger-Reihenfolge als dokumentierte Vereinfachung (Entscheidung für v0.2.2):** kein zusätzlicher Interaktionsschritt, keine neue Decision-Variante, Engine/UI bleiben wie sie sind. Preis: eine milde Regelverzerrung zugunsten des Verteidigers — er kann seinen zähesten Blocker „nach vorn" stellen und so die übrigen schützen (eine zweite Verteidiger-Wahl zusätzlich zur Blockwahl selbst).
- (B) Angreifer wählt die Reihenfolge, abgebildet über den Pending-Decision-Kanal (9.7): neue `PendingDecision`-Variante `orderBlockers` (Angreifer ordnet unmittelbar nach der Block-Deklaration, **vor** dem Priority-Fenster des Declare-Blockers-Steps; Ergebnis landet weiterhin in `CombatAssignment.blockedBy` — das Feld bleibt richtig, nur die Quelle der Ordnung wechselt). MTG-konform, kostet aber eine neue Decision-Variante in Modell, Engine und UI plus einen zusätzlichen Interaktions-Roundtrip in jedem Mehrfachblock.

**Entscheidung v0.2.2: (A) jetzt, (B) vertagt nach Abschnitt 10 — als Paket mit dem Trample-Analog.** Begründung damals: Ohne Trample-/Deathtouch-Analog entscheidet die Reihenfolge ausschließlich, **welche** Blocker sterben, wenn die Angreifer-Power nicht für alle reicht — ein seltener Fall mit begrenzter Wirkung. Strategisch tragend wird die Reihenfolge erst mit `trample` oder einem Deathtouch-Analog.

> **REVIDIERT in v0.2.3 (bewusste Kehrtwende, nicht stillschweigend):** Mit der Einführung von `trample` und `deathtouch` (6d, 9.9) ist genau die Bedingung eingetreten, unter der (A) unhaltbar wird — trample ohne angreifergewählte Reihenfolge hat kaum Substanz. Es gilt jetzt **Option (B)**: Der Angreifer wählt die Reihenfolge über die PendingDecision-Variante `orderBlockers` (Ablauf in 6d(1), Datenmodell in `src/model/game-state.ts`). Die v0.2.2-Zusicherung „Tests dürfen sich auf die Verteidiger-Reihenfolge als spezifiziertes Verhalten verlassen" ist damit **aufgehoben**; bestehende Engine-/Frontend-Tests, die Mehrfachblock über die Deklarationsreihenfolge prüfen, müssen auf die Decision umgestellt werden. Für Einfach-Blocks (0/1 Blocker) ändert sich nichts — dort gibt es keine Decision.

### 9.9 Kampf-Keyword-Paket v0.2.3: trample, firstStrike, deathtouch + orderBlockers

**Anlass:** Die Kartenpool-Erweiterung (27 → 100+) braucht mehr Kampf-Designraum; 9.8/Abschnitt 10 hatten Trample-Analog und Angreifer-Reihenfolge bereits als gemeinsames Paket vorgemerkt.

**Scope-Entscheidung — alle vier Punkte jetzt, statt Teilvertagung:** Erwogen wurde, `firstStrike` und/oder `deathtouch` weiter zu vertagen und nur trample + orderBlockers zu liefern. Dagegen sprach: (a) die vier Mechaniken hängen kombinatorisch zusammen — die „letale Menge" der Zuteilung ist mit und ohne deathtouch verschieden, eine spätere deathtouch-Einführung hätte den frisch geschriebenen Zuteilungscode gleich wieder angefasst; (b) die Kombinatorik ist mit den drei Vereinfachungen unten beherrschbar und in 6d(4) vollständig durchdekliniert; (c) der Card-Designer braucht die Keyword-Liste **vor** der Pool-Erweiterung, jede Vertagung blockiert dort Designraum. Bewusst **nicht** eingeführt: Double Strike (Abschnitt 10) — es verdoppelt die Rundenlogik-Sonderfälle für genau eine weitere Karte-Mechanik.

**Einzelentscheidungen und Trade-offs:**

1. **Reihenfolge:** Option (B) aus 9.8 (Angreifer wählt, Pending-Decision-Kanal) — Revision von 9.8, dort dokumentiert. Kein neuer Mechanismus: `orderBlockers` ist eine reguläre `PendingDecision`-Variante analog `chooseTriggerTargets`.
2. **firstStrike-Abbildung:** (A) echter zusätzlicher Combat-Damage-Step im Phasenmodell mit eigenem Priority-Fenster (MTG-treu, CR-510-artig) vs. (B) **interne zweite Schadensrunde in derselben Turn-Based Action** mit Zwischen-SBA-Durchlauf ohne Priority. **Entscheidung: (B).** Preis: keine Instant-Antwort *zwischen* den Runden (in MTG gelegentlich relevant: Pump/Removal nach First-Strike-Schaden, vor regulärem Schaden). Gewinn: `TurnStep`-Typ, Frontend-Phasenanzeige und Priority-Logik bleiben unverändert; für ein Hobby-Projekt das deutlich bessere Verhältnis. (A) ist später additiv nachrüstbar (eigener Step nur bei Bedarf, Abschnitt 10).
3. **trample-Zuteilung:** (A) Spielerwahl der exakten Verteilung (MTG erlaubt, mehr als letal zuzuweisen; bräuchte eine weitere Decision-Variante und UI) vs. (B) **deterministisch: exakt letale Menge pro Blocker, Rest zum Spieler**. **Entscheidung: (B).** Preis: kein absichtliches Über-Zuweisen — das wird erst mit Mechaniken wie Regeneration/Unzerstörbarkeit/Schadensumleitung relevant, die es bei uns nicht gibt. Bei Bedarf später als Decision nachrüstbar (Abschnitt 10).
4. **deathtouch-Abbildung:** Neues Zustandsflag `PermanentState.deathtouchDamage` statt Ableitung aus dem Event-Log — der Zustand ist die Wahrheit (9.1), SBAs sind zustandsbasiert. Reset im Cleanup zusammen mit `damageMarked`. Geltungsbereich: **jeder** Schaden der Quelle, nicht nur Kampfschaden (MTG-konform und im Engine-Code einfacher als eine Kampf-Sonderregel, weil das Flag zentral im Schadens-Code gesetzt wird).
5. **Eine `orderBlockers`-Decision für alle mehrfach geblockten Angreifer** (statt einer Decision pro Angreifer): weniger Interaktions-Roundtrips, ein Dialog im Frontend. Validierung der Antwort: exakt die gelisteten Angreifer, je eine Permutation exakt der gelisteten Blocker — sonst Ablehnung.

**Vertragshinweise:** `getLegalActions` liefert bei `orderBlockers` mindestens **einen** gültigen `resolveDecision`-Kandidaten (z.B. die Deklarationsreihenfolge) und enumeriert Permutationen **nicht** (gleiche Linie wie der Enumerations-Vertrag am `RulesEngine`-Interface). Card-Designer: `trample + deathtouch` nur bewusst und teuer (6d(4)); Karten, deren Wert an der Antwort *zwischen* den Schadensrunden hinge, bitte nicht entwerfen (Fenster existiert nicht, Punkt 2).

### 9.10 `onDamageReceived`: eine Feuerstelle, Ereignis-Granularität, eventSubject = Quelle (v0.3)

**Anlass:** Die Typ-Variante existierte seit v0.1, wurde aber nie gefeuert (Fund des Card-Designers, Abschnitt 10 alt). Jetzt verdrahtet; Semantik verbindlich in Abschnitt 5.

**Einzelentscheidungen:**

1. **Feuerstelle:** (A) je ein Aufruf in `combat.ts` und `effects.ts` vs. (B) **ein zentraler „Schaden an Permanent anwenden"-Helfer**, den beide Pfade nutzen. **Empfehlung (B)** — die Apply-Schleife in `dealCombatDamageRound` und `effects.ts#dealDamageToPermanent` tun heute schon fast dasselbe (damageMarked, deathtouch-Flag, `damageDealt`-Event); ein Helfer macht künftige Schadensregeln (weitere Trigger, Prevention-Effekte) einmalig statt doppelt. (A) bleibt als Fallback erlaubt, die Semantik ist identisch.
2. **Granularität:** einmal **pro Schadensereignis** (pro `damageDealt`-Event), nicht einmal pro Runde/Batch. MTG-analog (jede Schadensinstanz triggert separat) und implementatorisch die natürliche Stelle, wenn am Ereignis gefeuert wird. Konsequenz: 3 Blocker = bis zu 3 Trigger auf denselben Angreifer.
3. **`eventSubject` = Schadensquelle statt = self:** Das getroffene Permanent ist als Trigger-Quelle ohnehin bekannt (`sourceInstanceId`); der einzige informative Wert im `eventSubject`-Slot ist die **Quelle des Schadens** — damit werden „schlägt zurück auf das, was mich verletzt hat"-Designs (Enrage-Vergeltung) ohne DSL-Erweiterung möglich. Preis: kleine Inkonsistenz zu den übrigen Self-Combat-Triggern, im `TriggerCondition`-Kommentar dokumentiert.
4. **Letaler Schaden / tote Token-Quellen:** Trigger überlebt den Tod der Quelle in der Pending-Queue (MTG-analog). Für Token, deren Instanz SBA 7 komplett löscht, verpufft er beim Stacken — dokumentierte Vereinfachung statt eines `sourceDefinitionId`-Snapshots am `PendingTrigger` (das Muster von `fireDeathTriggers` ließe sich bei Bedarf später nachrüsten, Abschnitt 10 braucht dafür keinen Eintrag: erst relevant, wenn ein Token-Design mit Enrage-Trigger existiert — card-designer bitte bis dahin meiden).
5. **Kein Spieler-Pendant:** „Spieler erleidet Schaden" bleibt unmodelliert (Abschnitt 10) — anderes Subjekt, anderes Filterbedürfnis (eigener/gegnerischer Spieler), kein aktueller Kartenbedarf.

### 9.11 Mulligan: Paris-Variante, streng sequentiell (v0.3)

**Optionen:**
- (A) **Paris-Mulligan (klassisch, Entscheidung):** neu mischen, eine Karte weniger ziehen. Braucht genau EINE neue Decision-Variante mit Ja/Nein-Antwort; keine Karten-Auswahl-UI.
- (B) London-Mulligan (modern): immer 7 ziehen, danach N Karten nach Wahl unter die Library. Spielerisch großzügiger und heute Standard — kostet aber eine zweite Entscheidung (welche N Karten? in welcher Reihenfolge nach unten?) samt Auswahl-UI im Frontend, ähnlich `orderScry` (das selbst noch Auto-Default ist, 9.7).
- (C) Ein kostenloser Voll-Mulligan: am einfachsten, aber degeneriert (immer neuziehen bei mittelmäßiger Hand ist strikt richtig — keine echte Entscheidung).

**Begründung für (A):** Für dieses Projektstadium das beste Verhältnis aus Regel-Echtheit und Aufwand — die Ja/Nein-Decision ist im bestehenden 9.7-Kanal trivial (getLegalActions kann sogar vollständig enumerieren), und die Kartenzahl-Strafe erzeugt die echte Abwägung, die (C) fehlt. (B) ist später **additiv** nachrüstbar (gleiche `mulligan`-Decision, plus eine Folge-Decision fürs Bottoming — Abschnitt 10), ohne dass sich für Karten oder Engine-Verträge etwas Rückwirkendes ändert.

**Sequenzialität:** Der Startspieler entscheidet vollständig zu Ende, dann der Gegner (statt MTG-Rundenmodell, bei dem beide pro Runde ansagen und gleichzeitig neu ziehen). Preis: Der zweite Spieler kennt die finale Handgröße des Startspielers vor seiner ersten Entscheidung — ein milder Informationsvorteil für den ohnehin benachteiligten Nachziehenden, den wir bewusst in Kauf nehmen. Gewinn: Es ist zu jedem Zeitpunkt genau eine Decision aktiv (kein Runden-Tracking über beide Spieler), exakt das bestehende 9.7-Modell.

**Weitere Festlegungen:** Decision liegt außerhalb einer Priority-Vergabe (`resumePriorityTo` unberührt). Jeder Mulligan verbraucht RNG (Mischen) — Determinismus pro Seed + Aktionsfolge bleibt gewahrt (9.1). `CreateGameConfig.skipMulligans` hält die 83 Bestandstests und Test-Fixtures billig lauffähig; Default ist bewusst `false`, damit die Regel im echten Spiel nicht vergessen wird.

### 9.12 X-Kosten auf aktivierten Fähigkeiten (v0.3)

**Anlass:** Mana-Sinks („{X}, tap: …") sind ein Standard-Designraum, den der Kartenpool bisher nicht nutzen konnte; die v0.2-Einschränkung „X nur auf Spells" war eine reine Aufwandsvertagung, keine inhaltliche.

**Entscheidung:** `chosenX?: number` an der `activateAbility`-Aktion und am `activatedAbility`-Stack-Objekt — exakt das Spell-Muster (Wahl bei Ankündigung, Speicherung am Stack-Objekt, `Amount { kind: "x" }` liest bei Resolution, keine Enumeration in `getLegalActions`). Kein neuer Mechanismus, keine Alternative ernsthaft erwogen — die einzige echte Festlegung ist das **Verbot für Mana-Fähigkeiten** (`isManaAbility` ∧ `x` illegal): Sie resolven ohne Stack, hätten also keinen Speicherort für `chosenX`, und ein X-kostender Mana-Effekt ist designseitig sinnfrei. Die Engine validiert das Verbot bei Aktivierung (empfohlen zusätzlich als Pool-Lint).

### 9.13 Modal-Effekte: Modi als Datenliste, Wahl beim Stacken, eine Decision nur für Trigger (v0.3)

**Optionen für die Datenform:**
- (A) Neues Effekt-Primitiv `{ kind: "chooseMode", modes: Effect[][] }` **innerhalb** der Effektliste: maximal flexibel (Modi mitten in einer Sequenz), aber die Wahl fiele erst bei **Resolution** — die Engine müsste mitten in der Effektausführung pausieren und wiederaufnehmen können (neuer Zustand „halb resolvtes Stack-Objekt"), und Gegner könnten nicht auf die Moduswahl reagieren. Bricht das bisherige Invariant „alle Entscheidungen eines Stack-Objekts fallen vor der Resolution".
- (B) **Modi auf Objektebene, Wahl beim Auf-den-Stack-Legen (Entscheidung):** `modes: EffectMode[]` ersetzt `targets`/`effects`; gewählt wird beim Casten/Aktivieren/Stacken, MTG-analog (CR 601.2b). Resolution bleibt pausenfrei; Antworten auf die Moduswahl sind möglich (sie ist öffentlich am Stack-Objekt sichtbar).

**Begründung für (B):** MTG-Konformität und keinerlei neue Resolution-Maschinerie. (A) wäre nur für „wähle während der Abwicklung"-Designs nötig, die MTG selbst fast nie nutzt.

**Weitere Festlegungen und Trade-offs:**

1. **Kein Typ-Union-Umbau:** `modes` ist ein optionales Zusatzfeld; bei gesetztem `modes` muss `effects: []` und `targets` fehlen (Laufzeit-Validierung). Ein sauberer Discriminated-Union-Split („NonModalSpell | ModalSpell") wäre typsicherer, hätte aber alle 109 Bestandskarten und den Engine-Code angefasst — bewusst dagegen entschieden; die Validierung fängt Fehlkonfiguration ab.
2. **Wahl-Mechanik zweigleisig, exakt wie die Zielwahl heute:** Spieler-initiierte Objekte (Spells, aktivierte Fähigkeiten) tragen `chosenMode` in der **Aktion** (atomar, keine Decision — dieselbe Linie wie `chosenTargets`/`chosenX`); Engine-initiierte Objekte (Trigger) bekommen die neue PendingDecision `chooseMode` beim Stacken (dieselbe Linie wie `chooseTriggerTargets`, inkl. Auto-Pick bei genau einer wählbaren Option und Verpuffen bei null). Decision-Ketten Modus→Ziele trägt der 9.7-Mechanismus unverändert.
3. **Ziele pro Modus statt global:** Jeder Modus hat eigene Zielslots; Wählbarkeit eines Modus setzt legale Ziele für **seine** Slots voraus (MTG-analog). Fizzle-Prüfung bei Resolution gegen die Ziele des gewählten Modus.
4. **Genau ein Modus (Minimalversion):** „Wähle zwei" / „wähle bis zu N" braucht Mengen-Validierung, Effekt-Reihenfolge-Fragen und UI-Mehraufwand für null aktuelle Karten — vertagt (Abschnitt 10). Das Datenmodell muss dafür später nur um ein `chooseCount`-Feld ergänzt werden (additiv).
5. **`selectableModes` in der Decision:** redundant zur Neuberechnung durch das Frontend, aber billig und macht die Decision selbsterklärend (gleiches Muster wie `orderBlockers.attackers` als Vorschlagsbasis).

**Hinweis an card-designer:** Es besteht kein Pool-Zwang — Modal ist ab jetzt verfügbar, nicht verpflichtend. Für die Engine-Abnahme werden 1–2 Beispielkarten gebraucht (empfohlen: ein „Charm"-artiger `spell(fast)` mit 2–3 Modi, davon mindestens einer mit Zielslot und einer ohne, sowie ein modaler Trigger zum Testen der `chooseMode`-Decision inkl. Auto-Pick-Fall).

> **NACHTRAG v0.3.1 (Modellkonflikt-Fund des engine-engineers, bestätigt und
> gelöst):** Punkt 2 beschrieb die Kette `chooseMode` → `chooseTriggerTargets`,
> aber die `chooseTriggerTargets`-Variante hatte kein Feld, um den bereits
> gewählten Modus über den zweiten `resolveDecision`-Roundtrip zu tragen — der
> gewählte Modus wäre zwischen den beiden Decisions verloren gegangen.
> *Erwogene Lösungen:* (a) **`chosenMode?: number` an der
> `chooseTriggerTargets`-PendingDecision (Entscheidung, Vorschlag des
> engine-engineers):** Die Decision ist bereits genau der Ort, der einen
> halb gestackten Trigger über einen Roundtrip trägt
> (`sourceInstanceId`/`abilityIndex`/`eventSubject` liegen dort) — der Modus
> gehört in dieselbe Reihe; der Zustand ist die Wahrheit (9.1) und
> `state.pendingDecision` überlebt den Roundtrip. (b) `chosenMode` am
> `PendingTrigger` und den Trigger bis zur Zielwahl in der Queue lassen —
> bricht den etablierten Fluss „Trigger wird beim Stacken entnommen" und
> fasst mehr Engine-Code an. (c) Modus- und Zielwahl in EINER kombinierten
> Decision — bläht `getLegalActions`-Enumeration und UI auf (Modus-x-Ziel-
> Kreuzprodukt) und bricht das etablierte Ketten-Muster aus 9.7.
> *Präzisierung zu (a):* Das Feld kommt bewusst NUR an die PendingDecision,
> **nicht** an die `DecisionChoice` — die Engine liest den Modus beim
> Auflösen aus `state.pendingDecision`; eine Kopie in der Antwort wäre
> redundant und bräuchte nur eine sinnlose „muss übereinstimmen"-Validierung.
> Beim Stacken wird der Wert als `StackObject.chosenMode` übernommen.
> *Konsequenz für die Engine:* Der dokumentierte Interims-Fallback
> `triggers.ts#stackModalTriggerWithMode` (Auto-Pick des ersten legalen Ziels
> bei modalen Triggern mit mehrdeutiger Zielwahl) ist abgelöst und durch die
> echte `chooseTriggerTargets`-Decision mit gesetztem `chosenMode` zu
> ersetzen (inkl. Test: modaler Trigger, Moduswahl, danach mehrdeutige
> Zielwahl, beide Decisions nacheinander).

### 9.14 `eventSubject` auf Nicht-Permanents: einheitlicher stiller Fizzle statt Verbot (v0.3.2)

**Anlass:** Fund des card-designers (Kartenpool-Batch 4, `docs/cards/starter-set.md`): Bei `onUnitDied` hat das gestorbene Objekt beim Resolven des Triggers das Battlefield längst verlassen (SBA vor dem Stacken). Ob `EffectRecipient "eventSubject"` dort als Empfänger permanent-bezogener Effekte (`exilePermanent`/`destroyPermanent`/`tapPermanent`/`addCounters` …) zulässig ist und wie die Engine das auflöst, war unspezifiziert; zwei Testkarten (`core.sanctified-remains`, `core.witherplague-shrine`) wurden bewusst ohne die Kombination gebaut.

**Code-Befund vor der Entscheidung:** Der stille Fizzle existiert bereits **de facto, aber nur teilweise**. Sieben der zehn permanent-bezogenen Effekte prüfen `permanentState` und tun bei einem Nicht-Permanent still nichts (`tapPermanent`, `untapPermanent`, `modifyStats`, `grantKeyword`, `addCounters`, `removeCounters` in `effects.ts`; `dealDamage` via `damage.ts#applyDamageToPermanent` — dieser Guard trägt heute schon die freigegebene `onDamageReceived`-Vergeltung, wenn die Schadensquelle beim Resolven tot ist). Die drei Zonenwechsel-Effekte `destroyPermanent`/`exilePermanent`/`returnToHand` rufen dagegen `leaveBattlefield` **ungeguardet** auf: Bei einer gelöschten Token-Instanz (SBA 7) wirft das eine Exception (Crash), bei einer Karte im Graveyard würde `moveCard` sie tatsächlich bewegen — `exilePermanent` würde aus dem Graveyard verbannen, `returnToHand` wäre ein versehentliches „Raise Dead". Latent (keine Pool-Karte trifft die Pfade heute), aber mit `onUnitDied` + `eventSubject` sofort live.

**Optionen:**
- (A) **Verbot:** `eventSubject` bei `onUnitDied` für permanent-bezogene Effekte per Modellkommentar/Validierung ausschließen. Einfach, aber: dieselbe Situation (Subjekt beim Resolven kein Permanent mehr) tritt auch bei `onDeath` (self) und bei `onDamageReceived` (tote Schadensquelle) auf — dort ist sie freigegeben und funktioniert nur wegen des `permanentState`-Guards. Ein Verbot nur für `onUnitDied` behandelt einen Spezialfall einer allgemeinen Frage und lässt die Engine-Lücke (Crash/Zonen-Manipulation) ungelöst.
- (B) **Referenz auf den aktuellen Aufenthaltsort MIT Zonen-Wirkung:** `exilePermanent`/`returnToHand` wirken dann auch aus dem Graveyard — würde den „Removal-bei-Tod"-Archetyp sofort ermöglichen. Dagegen: die Effektnamen würden lügen (`exilePermanent` wäre kein Permanent-Effekt mehr), die Semantik würde zonenabhängig, `destroyPermanent` auf eine Graveyard-Karte bliebe undefiniert, und der Pfad wäre ausschließlich über `eventSubject` erreichbar (gewählte Ziele werden beim Resolven ohnehin auf Legalität gefiltert) — eine versteckte Sonderregel genau der Art, die 9.4 mit dem geschlossenen Primitiv-Satz vermeiden will.
- (C) **Zulässig mit einheitlichem stillen Fizzle (Entscheidung):** Neue allgemeine Regel „Nicht-Permanent-Fizzle" (Abschnitt 4): Jeder permanent-bezogene Effekt überspringt Empfänger, die kein Permanent auf dem Battlefield (mehr) sind, still — einheitlich für gewählte Ziele, `self` und `eventSubject`, einheitlich für alle zehn Effekte. Der Archetyp aus (B) kommt später als **eigenes, ehrlich benanntes Graveyard-Primitiv** (Abschnitt 10) — exakt der 9.4-Weg „neue Mechanik = bewusste DSL-Erweiterung".

**Begründung für (C):** Es kodifiziert das mehrheitlich schon existierende Engine-Verhalten, ist konsistent mit dem Teil-Fizzle gewählter Ziele (Abschnitt 4) und mit dem MTG-Vorbild („Ziel/Objekt existiert nicht mehr beim Resolven → keine Wirkung"), schließt die gefundene Crash-/Manipulations-Lücke mit einer einzigen Regel statt Trigger-spezifischer Sonderfälle und hält den Effekt-Primitiv-Satz ehrlich. Preis: Bei `onUnitDied`/`onDeath` ist die Kombination zwar zulässig, aber garantiert wirkungslos — das ist als Designer-Guidance dokumentiert (Abschnitt 5, `src/model/abilities.ts`) und billiger als eine Verbots-Validierung, die die identische Semantikfrage bei `onDamageReceived` doch wieder beantworten müsste.

**Auftrag an engine-engineer:** `destroyPermanent`/`returnToHand`/`exilePermanent` in `effects.ts` erhalten denselben Battlefield-Guard wie die übrigen Permanent-Effekte (`state.cards[id]?.permanentState` existiert, sonst still überspringen) — `leaveBattlefield` selbst bleibt strikt (wirft weiterhin bei unbekannter Instanz; der Guard gehört an die Aufrufstellen im Effekt-Interpreter, nicht in die Zonen-Mechanik). Empfohlener Test: `onUnitDied`-Trigger-Fixture mit `exilePermanent(eventSubject)` → kein Crash, keine Zonenänderung, übrige Effekte desselben Triggers wirken normal; plus je ein Fall für Graveyard-Karte und gelöschte Token-Instanz.

### 9.15 Tod-Trigger: zonenbasierte Todesdefinition statt SBA-exklusivem Pfad (v0.3.3)

**Anlass:** Fund des card-designers (Kartenpool-Batch 6, `docs/cards/starter-set.md` „Offene Fragen" Punkt 8): `fireDeathTriggers` (`src/engine/triggers.ts`) hat genau EINEN Aufrufer — die SBA-3/4-Sterbeschleife in `sba.ts`, die zuvor auf `def.type === "unit"` filtert. Konsequenzen des Ist-Zustands: (1) Eine Unit mit `onDeath{self}` (`core.husk-crawler`, `core.gravebound-warden`, `core.plaguebound-wretch`), die per `destroyPermanent` (`core.doomreap-edict`) stirbt, löste ihren eigenen Trigger still NICHT aus — Kampf-/Brand-Tod (SBA-Pfad) dagegen schon. (2) Fremde `onUnitDied`-Trigger (`core.sanctified-remains` u.a.) und das `unitDied`-Event hatten exakt dieselbe Lücke. (3) Für Nicht-Unit-Permanents feuerte `onDeath` nie, unabhängig von der Todesart. (4) Auch der `sacrificeSelf`-Kosten-Pfad (`actions.ts`) und der Aura-SBA-5-Pfad riefen `fireDeathTriggers` nicht auf. Nirgends war das als Design dokumentiert — anders als z.B. die 9.10-/9.14-Einschränkungen.

**Frage 1 — Bug oder Design? Optionen:**
- (A) Als Design festschreiben („nur SBA-Tod triggert"): billigste Option, aber sie widerspricht der gedruckten Karten-Semantik („Wenn diese Kreatur stirbt, …" trägt keine Ursachen-Einschränkung), dem MTG-Vorbild („dies" = battlefield → graveyard, egal ob Schaden, Destroy oder Sacrifice) und macht destroy-Removal unbeabsichtigt zur harten Antwort gegen einen ganzen Archetyp. Kein Gewinn außer Nicht-Arbeit.
- (B) **Bug, Fix mit zonenbasierter Todesdefinition (Entscheidung):** JEDER Zonenwechsel Battlefield → Graveyard ist ein Tod, unabhängig von der Ursache (SBA 3/4, `destroyPermanent`, `sacrificeSelf`-Zusatzkosten, SBA 5). Bewusst KEIN Tod: `exilePermanent`/`returnToHand` (kein Graveyard) — MTG-analog bleibt Exil die „saubere" Antwort, die Tod-Trigger umgeht; ab jetzt dokumentiertes Design (und Bepreisungs-Argument destroy vs. exile) statt Zufallsverhalten. Ebenfalls kein Tod: Countern (Stack → Graveyard) und Discard (Hand → Graveyard), da kein Battlefield-Abgang.

**Frage 2 — Scope: unit-only oder typ-agnostisch? Optionen:**
- (A) `onDeath` bleibt unit-only: bräuchte eine Validierung, die es heute nicht gibt (das Modell erlaubt `onDeath` auf jedem Permanent-Typ), und verbaut die vom card-designer gewünschten „parting shot"-Designs (Enchantment/Relic „wenn dieses Permanent zerstört wird, …").
- (B) Neues Trigger-Kind `onDestroyed` für Nicht-Units: zwei Namen für dieselbe Semantik, Modell-Aufblähung gegen 9.4 (geschlossener Primitiv-Satz).
- (C) **Typ-agnostisch (Entscheidung):** `onDeath{self}` feuert für JEDES Permanent, das battlefield → graveyard geht. Kein neues Modellfeld, deckt „parting shot" ab. Bewusste MTG-Abweichung: MTG reserviert „dies" für Kreaturen (CR 700.4); wir verallgemeinern, weil unser Modell ohnehin nur EIN Todes-Trigger-Kind hat und Alternativen nur Sonderfälle schaffen. `onUnitDied` und das Event `unitDied` bleiben dagegen unit-only — der Name ist der Vertrag; ein typ-agnostischer Beobachter-Trigger („ein beliebiges Permanent stirbt") wäre bei Kartenbedarf eine additive Erweiterung (Abschnitt 10).

**Auftrag an engine-engineer (zentraler Hook statt Aufrufstellen-Fixes):** Analog zur SBA-Begründung in Abschnitt 7 („ein zentraler Prüfzeitpunkt statt Ad-hoc-Checks") gehört der Tod-Hook an die eine Stelle, durch die jeder Battlefield-Abgang läuft — nicht als je ein `fireDeathTriggers`-Aufruf in `effects.ts`/`actions.ts`/`sba.ts` (das reproduziert genau die Vergessens-Bug-Klasse, die hier vorlag):
1. `zones.ts#leaveBattlefield`: Ist `toZone === "graveyard"`, werden NACH dem Zonenwechsel (bzw. der Token-Löschung, SBA 7) (a) bei `def.type === "unit"` das Event `unitDied` emittiert und (b) `fireDeathTriggers` aufgerufen. `definitionId`/`controller` VOR dem Move snapshotten (die Token-Instanz existiert danach nicht mehr; die Signatur von `fireDeathTriggers` nimmt beides bereits entgegen). Kein Import-Zyklus: `triggers.ts` importiert `zones.ts` nicht.
2. `sba.ts`: eigener `unitDied`-Push und `fireDeathTriggers`-Aufruf entfallen (sonst Doppel-Feuer); die Sterbeschleife bleibt sonst unverändert. `actions.ts#sacrificeSelf`, der `destroyPermanent`-Case in `effects.ts` und der Aura-SBA-5-Pfad erben den Hook ohne eigene Änderung.
3. `triggers.ts#fireDeathTriggers`: `onUnitDied` nur noch queuen, wenn die GESTORBENE Karte eine Unit ist (bisher implizit durch den einzigen Aufrufer garantiert, künftig nicht mehr); `onDeath{self}` typ-agnostisch queuen (bereits so implementiert). `eventSubject` bleibt die gestorbene Instanz — die 9.14-Fizzle-Regel gilt unverändert, ebenso die Pending-Queue-Mechanik (Trigger werden nur gequeued, Flush erst beim nächsten Priority-Fenster — keine Rekursions-/Reihenfolgeänderung, auch nicht innerhalb der SBA-Schleife).
4. Bekannte dokumentierte Vereinfachung gilt weiter: Ein Token mit eigenem `onDeath{self}` verpufft beim Stacken (SBA 7 löscht die Instanz vor dem Flush, kein Definitions-Lookup mehr — analog 9.10 Punkt 4). Fremde `onUnitDied`-Trigger auf Token-Tode feuern normal.
5. Empfohlene Tests: `destroyPermanent`-Kill feuert eigenes `onDeath` + fremdes `onUnitDied` + `unitDied`-Event; Exil-/Bounce-Kill feuert NICHTS davon; `sacrificeSelf`-Kosten feuern; zerstörtes Enchantment/Relic feuert `onDeath`, aber weder `onUnitDied` noch `unitDied`; SBA-Tod verhält sich unverändert (insbesondere keine Doppel-Trigger); Aura, deren Träger stirbt, feuert ihr eigenes `onDeath` (SBA-5-Abgang Richtung Graveyard).

**Hinweis für card-designer:** `exilePermanent`-Karten (`core.banishment-rite`) sind ab jetzt EXPLIZIT die Premium-Antwort gegen Tod-Trigger — beim Bepreisen von destroy- vs. exile-Removal berücksichtigen. `onDeath`+destroy-Payoffs (inkl. „parting shot"-Nicht-Units) bitte erst bauen, wenn `docs/engine-status.md` die Umsetzung meldet.

---

## 10. Offene Punkte (v0.3 aktualisiert)

**In v0.3 entschieden (aus dieser Liste gestrichen):**
- ~~`onDamageReceived` verdrahten~~ → Semantik final in Abschnitt 5 (feuert pro Schadensereignis > 0, Kampf- und Effekt-Schaden, `eventSubject` = Schadensquelle, letaler Schaden feuert), Entscheidung 9.10. Card-Designer darf den Trigger jetzt verwenden (Token-Quellen meiden, 9.10 Punkt 4).
- ~~Mulligan-Regel~~ → Paris-Variante, Abschnitt 1b; `PendingDecision`-Variante `mulligan`, `PlayerState.mulligans`, `CreateGameConfig.skipMulligans`, Event `mulliganTaken`; Entscheidung 9.11.
- ~~X-Kosten auf aktivierten Fähigkeiten~~ → Abschnitt 4 (Unterabschnitt „Aktivierte Fähigkeiten mit X-Kosten"), `chosenX` an `activateAbility`-Aktion und Stack-Objekt; Verbot für Mana-Fähigkeiten; Entscheidung 9.12.
- ~~Modal-Effekte („wähle eines —")~~ → Abschnitt 4 (Unterabschnitt „Modal-Effekte"), `EffectMode`/`modes` im Datenmodell, `chosenMode` an Aktionen/Stack-Objekten, `PendingDecision`-Variante `chooseMode` für Trigger; Entscheidung 9.13.

**In v0.2.3 entschieden (aus dieser Liste gestrichen):**
- ~~Trample-Analog~~ → Keyword `trample`, Regeln in 6b(2)/6d, Entscheidung 9.9.
- ~~Angreifergewählte Schadensreihenfolge bei Mehrfachblock~~ → `PendingDecision`-Variante `orderBlockers`, Ablauf 6d(1); Entscheidung 9.8 explizit revidiert (Option B umgesetzt).
- ~~First-Strike-/Deathtouch-Analoga~~ → Keywords `firstStrike`/`deathtouch`, Regeln in 6d, SBA 4 erweitert (Abschnitt 7), Entscheidung 9.9.

**In v0.2 entschieden (aus dieser Liste gestrichen):**
- ~~X-Kosten~~ → Abschnitt 4 (Ablauf) und `ManaCost.x`-Kommentar; v0.2-Einschränkung „nur auf Spells" (in v0.3 aufgehoben, siehe 9.12).
- ~~guardian-Regel~~ → Abschnitt 6, final.
- ~~Startspieler-Bestimmung~~ → Abschnitt 1a.
- ~~Effekte ohne targets-Array~~ → regulärer Fall, bestätigt (Abschnitt 4, `TargetSpec`-Kommentar).
- ~~Aura-Anlege-Bezug~~ → genau ein `attachedTo`-Objekt pro Aura, alle Fähigkeiten beziehen sich darauf (`EnchantmentCard.auraTarget`-Kommentar).
- Konvention „Relics möglichst farblos": **bestätigt** als Design-Linie (Relics = farbübergreifend nutzbare Werkzeuge, MTG-Artefakt-Vorbild). Farbige Relics sind als bewusste, begründete Ausnahme erlaubt (z.B. stark farbidentitätsgebundene Effekte), sollten aber selten bleiben.

**Weiterhin offen (bewusst verschoben):**
- Mehr als 2 Spieler
- Kontrollwechsel, Kopier-Effekte, Keyword-Entzug
- Double-Strike-Analog (teilt in **beiden** Schadensrunden aus; bewusst nicht in v0.2.3, siehe 9.9)
- Priority-Fenster zwischen den beiden Schadensrunden (9.9 Punkt 2, Option A — additiv nachrüstbar als eigener Step, falls Antwortspielraum nach First-Strike-Schaden je gebraucht wird)
- trample-Über-Zuteilung (Spielerwahl „mehr als letal an einen Blocker", 9.9 Punkt 3 — erst mit Regenerations-/Unzerstörbarkeits-artigen Mechaniken relevant)
- Spielerwahl bei der Reihenfolge mehrerer eigener gleichzeitiger Trigger (deterministische Timestamp-Ordnung bleibt v0.2-Verhalten; Kandidat für den Pending-Decision-Kanal aus 9.7)
- „Spieler erleidet Schaden"-Trigger (das Spieler-Pendant zu `onDamageReceived`, 9.10 Punkt 5 — anderes Subjekt/Filterbedürfnis, erst bei Kartenbedarf)
- „Ein beliebiges Permanent stirbt"-Beobachter-Trigger (typ-agnostisches Pendant zu `onUnitDied`, 9.15 Frage 2 Option (C) — additiv, erst bei Kartenbedarf; `onDeath{self}` selbst ist seit v0.3.3 bereits typ-agnostisch)
- Graveyard-Zonen-Primitiv für den „Removal-bei-Tod"-Archetyp (z.B. `exileFromGraveyard` mit Empfänger `eventSubject` bei `onUnitDied` — 9.14 Option (B) als eigenes, ehrlich benanntes Primitiv statt Umdeutung von `exilePermanent`; erst bei Kartenbedarf, card-designer meldet sich zur Batch-Planung)
- London-Mulligan als Upgrade der Paris-Variante (9.11 Option B — additiv: gleiche `mulligan`-Decision plus Bottoming-Folge-Decision, sinnvoll frühestens zusammen mit der `orderScry`-Migration)
- „Wähle zwei"/konfigurierbare Modusanzahl bei Modal-Effekten (9.13 Punkt 4 — additives `chooseCount`-Feld, erst bei Kartenbedarf)
- Vollständig rekursive Cleanup-Sonderregel (Abschnitt 2; aktuell: ein Extra-Fenster genügt)
- Migration von `addMana("any")` / `discardCards`-Zusatzkosten / `scry` auf den Pending-Decision-Kanal (9.7)
- Kombinatorische Enumeration in `getLegalActions` (bewusstes Nicht-Ziel, siehe Vertragskommentar am `RulesEngine`-Interface — `applyAction` bleibt die Legalitäts-Wahrheit)
