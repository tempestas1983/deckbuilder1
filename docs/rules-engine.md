# Regelwerk-Design: Rules Engine

Status: v0.2.1 (Game-Architect) — 2026-07-08
Verbindlich für: engine-engineer (Implementierung), card-designer (Fähigkeitsdesign), frontend-engineer (Visualisierung von Stack/Priority)

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
3. Der Startspieler überspringt seinen ersten Draw Step (Abschnitt 2).
4. Kein Mulligan in v0.1/v0.2 (Abschnitt 10).

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
2. **X wählen** (nur bei `ManaCost.x`, v0.2 geklärt): Der castende Spieler wählt X ≥ 0. X ist Teil der `castSpell`-Aktion (`chosenX`), wird am Stack-Objekt gespeichert und von `Amount { kind: "x" }` bei Resolution gelesen. Wird der Spell gecountert, ist X irrelevant (kein „Rückerstatten"). X-Kosten sind in v0.2 **nur auf Spells** erlaubt, nicht auf aktivierten Fähigkeiten. `getLegalActions` enumeriert X-Werte nicht — es liefert einen Kandidaten ohne `chosenX`, das Frontend fragt X ab, `applyAction` validiert Bezahlbarkeit.
3. **Ziele wählen** (falls die Karte/Fähigkeit Targets verlangt). Ziele müssen jetzt legal sein. Karten/Fähigkeiten ganz **ohne** `targets`-Array sind ein regulärer Fall (nur fixe `EffectRecipient`-Werte); für sie entfallen Zielwahl, Ziel-Validierung und Fizzle-Prüfung.
4. Kosten bestimmen und **bezahlen** (Mana inkl. X, ggf. Zusatzkosten wie Tappen/Opfern). Kann nicht bezahlt werden, wird der Cast rückabgewickelt (v0.1: Engine validiert Bezahlbarkeit vor Schritt 1, um Rollback-Komplexität zu vermeiden).
5. Der Spell ist gecastet → Cast-Trigger („wenn ein Spieler einen Zauber wirkt") feuern, der castende Spieler erhält erneut Priority.

### Resolution

- Es resolvt immer nur das **oberste** Objekt, und nur wenn alle Spieler nacheinander gepasst haben. Zwischen zwei Resolutions gibt es also immer ein volles Priority-Fenster (Antworten möglich).
- **Target-Recheck bei Resolution:** Sind bei Resolution ALLE Ziele eines Objekts illegal geworden, wird das Objekt entfernt ohne Wirkung („fizzles"; Spells gehen dabei in den Graveyard). Sind nur manche Ziele illegal, resolvt der Rest.
- Nach Resolution: Spell-Karten vom Typ `spell` → Graveyard. `unit`/`relic`/`enchantment` → Battlefield (als Permanent, ETB-Trigger feuern). Fähigkeiten-Objekte verschwinden einfach.
- **Countern:** Ein Effekt `counterSpell` entfernt ein Stack-Objekt wirkungslos (Spell → Graveyard).

### Beispiel (kanonischer Ablauf)

1. Spieler A castet in Main 1 eine Unit → Stack: [Unit]. A hat Priority, passt.
2. Spieler B antwortet mit `spell(fast)` „Gegenzauber" mit Ziel Unit → Stack: [Unit, Gegenzauber]. B passt, A passt.
3. Gegenzauber resolvt (LIFO: oben zuerst) → Unit wird gecountert, geht in As Graveyard.
4. Stack leer, A passt, B passt → Main 1 geht weiter (bzw. endet, wenn beide erneut passen).

---

## 5. Getriggerte Fähigkeiten

- Trigger-Bedingungen (siehe `TriggerCondition` in `src/model/abilities.ts`): u.a. ETB („kommt ins Spiel"), Tod, Zugbeginn/Upkeep, End Step, Angriffs-/Block-Deklaration, Schaden erlitten/verursacht, Spell gecastet.
- **Feuern ≠ Resolven:** Tritt das Ereignis ein, wird der Trigger nur **vorgemerkt** (Pending-Trigger-Queue). Er wird erst auf den Stack gelegt, **wenn das nächste Mal ein Spieler Priority erhalten würde** (siehe Priority-Regel 3).
- **Reihenfolge (APNAP):** Warten mehrere Trigger, legt zuerst der aktive Spieler seine Trigger in selbstgewählter Reihenfolge auf den Stack, dann der nicht-aktive Spieler. Dessen Trigger resolven dadurch zuerst (LIFO). v0.1-Vereinfachung: Hat ein Spieler mehrere gleichzeitige Trigger, ordnet die Engine sie deterministisch (Timestamp der Quelle) statt den Spieler wählen zu lassen — Spielerwahl ist ein späteres Feature.
- Trigger mit Targets wählen ihre Ziele beim **Auf-den-Stack-Legen**, nicht beim Feuern.
- **Zielwahl durch den Spieler (v0.2 geklärt):** Braucht ein Trigger beim Stacken Ziele und gibt es mehr als eine legale Wahl, setzt die Engine `GameState.pendingDecision = { kind: "chooseTriggerTargets", ... }` und pausiert (keine Priority-Vergabe, kein Stepwechsel), bis der Controller mit der Aktion `resolveDecision` geantwortet hat — Mechanik siehe Abschnitt 9.7. Gibt es genau eine legale Belegung, darf die Engine sie ohne Nachfrage wählen (Komfort-Abkürzung, gleiches Ergebnis). Gibt es keine legale Belegung, wird der Trigger gar nicht erst auf den Stack gelegt (MTG-analog zu „kein legales Ziel beim Ansagen"). Der bisherige v0.1-Auto-Pick („erstes legales Ziel") ist damit **abgelöst** und soll aus der Engine entfernt werden, sobald `resolveDecision` implementiert ist.
- Auf Trigger kann geantwortet werden wie auf Spells (sie liegen normal auf dem Stack).

---

## 6. Kampf (Kurzregeln)

- **Declare Attackers:** Aktiver Spieler wählt beliebig viele eigene ungetappte Units ohne Summoning Sickness (Ausnahme: Keyword `swift`/Eile). Angreifer werden getappt (Ausnahme: Keyword `vigilant`). Angriffsziel ist in v0.1 immer der gegnerische Spieler. Angriffs-Trigger feuern.
- **Declare Blockers:** Verteidiger ordnet ungetappte eigene Units als Blocker je einem Angreifer zu (mehrere Blocker pro Angreifer erlaubt; ein Blocker blockt genau einen Angreifer). Blocker werden nicht getappt. Evasion: `airborne` (Flying-Analog) kann nur von `airborne` oder `reach`-Units geblockt werden.
- **`guardian` (v0.2, finale Regel):** Jede **ungetappte** guardian-Unit, die der **verteidigende** Spieler zum Zeitpunkt der Blocker-Deklaration kontrolliert, **muss** einem Angreifer als Blocker zugeordnet werden, sofern für sie mindestens ein legaler Block existiert (Evasion beachten). Präzisierungen zu den offenen Fragen:
  - Die Pflicht gilt **pro guardian-Unit** (nicht „insgesamt mindestens ein Blocker"). Welchen Angreifer die jeweilige guardian-Unit blockt, wählt der Verteidiger frei.
  - Maßgeblich ist ein **Snapshot bei der Deklaration**: Wurde die guardian-Unit vorher getappt (z.B. durch einen Instant im Declare-Attackers-Fenster), besteht für sie keine Pflicht. Wird sie **nach** der Deklaration getappt, bleibt der deklarierte Block bestehen (Tappen entfernt Blocks nicht — MTG-konform).
  - Nur der Verteidiger ist betroffen; guardian auf angreifenden oder angreiferseitigen Units hat keine Wirkung. Da nur der Verteidiger blockt, ist „mehrere Guardians verschiedener Spieler" kein möglicher Konfliktfall.
  - Enforcement: reine Validierung der `declareBlockers`-Aktion (illegale Deklarationen ohne Pflicht-Blocks werden abgelehnt); `getLegalActions` muss die Pflicht nicht enumerieren.
  - Design-Einordnung für den Card-Designer: guardian ist damit thematisch ein Vorteil („stellt sich schützend in den Weg"), mechanisch eine milde Selbstbindung — auf defensiven Statlines (wie `core.temple-sentinel` 2/5) praktisch kein Nachteil, auf aggressiven Statlines ein echter Preis. Bitte so bepreisen.
- **Combat Damage:** Alle Kampfschäden gleichzeitig (v0.1: kein First-Strike-Analog). Geblockte Angreifer teilen ihre Power in Deklarationsreihenfolge auf die Blocker auf (mind. letale Menge — Toughness minus markierter Schaden — bevor der nächste Blocker Schaden erhält); ungeblockte Angreifer treffen den Spieler. Schaden wird als **markierter Schaden** auf Units notiert (verschwindet im Cleanup) bzw. als Lebensverlust beim Spieler. Tod durch letalen Schaden regelt die SBA-Prüfung, nicht der Combat-Code.

---

## 7. State-Based Actions (SBAs)

**Wann geprüft:** Immer unmittelbar bevor ein Spieler Priority erhält (und in der Cleanup-Sonderregel). In einer Schleife, bis keine SBA mehr zutrifft; erst danach werden Pending-Trigger auf den Stack gelegt. SBAs gehen selbst nie über den Stack und können nicht „beantwortet" werden — aber sie lösen ggf. Trigger aus (z.B. Todes-Trigger).

**Liste (v0.1):**

1. Ein Spieler mit ≤ 0 Leben verliert das Spiel.
2. Ein Spieler, der aus leerer Library ziehen musste, verliert das Spiel (geprüft als SBA, markiert beim Ziehversuch).
3. Eine Unit mit Toughness ≤ 0 wird in den Graveyard gelegt (das ist kein „Schaden", regeneriert nicht).
4. Eine Unit mit markiertem Schaden ≥ Toughness stirbt (letaler Schaden).
5. Eine Aura, deren angelegtes Objekt fehlt oder illegal geworden ist, geht in den Graveyard.
6. `+1/+1`- und `-1/-1`-Marken auf demselben Permanent annihilieren sich paarweise.
7. Ein Token, das das Battlefield verlässt, hört auf zu existieren (wird endgültig entfernt statt Zonenwechsel).

Warum SBAs statt Ad-hoc-Checks: Ein zentraler, immer gleicher Prüfzeitpunkt verhindert die klassischen Bugs („Kreatur mit 0 Toughness überlebt, weil der Effekt-Code den Tod vergessen hat"). Effekt-Code verändert nur Zustand; Sterben/Verlieren entscheidet ausschließlich die SBA-Schleife.

---

## 8. Zustände von Permanents

Siehe `PermanentState` in `src/model/game-state.ts`:

- **tapped:** Getappte Permanents können nicht angreifen und keine Fähigkeiten mit Tap-Kosten aktivieren.
- **Summoning Sickness:** Units können im Zug ihres Ankommens weder angreifen noch Tap-Kosten-Fähigkeiten aktivieren (Ausnahme: `swift`). Gilt nicht für Nicht-Units.
- **markierter Schaden:** Sammelt sich bis Cleanup, siehe SBAs 4.
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

---

## 10. Offene Punkte (v0.2 aktualisiert)

**In v0.2 entschieden (aus dieser Liste gestrichen):**
- ~~X-Kosten~~ → Abschnitt 4 (Ablauf) und `ManaCost.x`-Kommentar; v0.2-Einschränkung: nur auf Spells.
- ~~guardian-Regel~~ → Abschnitt 6, final.
- ~~Startspieler-Bestimmung~~ → Abschnitt 1a.
- ~~Effekte ohne targets-Array~~ → regulärer Fall, bestätigt (Abschnitt 4, `TargetSpec`-Kommentar).
- ~~Aura-Anlege-Bezug~~ → genau ein `attachedTo`-Objekt pro Aura, alle Fähigkeiten beziehen sich darauf (`EnchantmentCard.auraTarget`-Kommentar).
- Konvention „Relics möglichst farblos": **bestätigt** als Design-Linie (Relics = farbübergreifend nutzbare Werkzeuge, MTG-Artefakt-Vorbild). Farbige Relics sind als bewusste, begründete Ausnahme erlaubt (z.B. stark farbidentitätsgebundene Effekte), sollten aber selten bleiben.

**Weiterhin offen (bewusst verschoben):**
- Mulligan-Regel (weiterhin: keine)
- Mehr als 2 Spieler
- First-Strike-/Deathtouch-Analoga, Kontrollwechsel, Kopier-Effekte, Keyword-Entzug
- Spielerwahl bei der Reihenfolge mehrerer eigener gleichzeitiger Trigger (deterministische Timestamp-Ordnung bleibt v0.2-Verhalten; Kandidat für den Pending-Decision-Kanal aus 9.7)
- Modal-Effekte („wähle eines —"; ebenfalls Kandidat für 9.7)
- X-Kosten auf aktivierten Fähigkeiten (Mana-Sinks mit X); erfordert `chosenX` an `activateAbility`
- Vollständig rekursive Cleanup-Sonderregel (Abschnitt 2; aktuell: ein Extra-Fenster genügt)
- Migration von `addMana("any")` / `discardCards`-Zusatzkosten / `scry` auf den Pending-Decision-Kanal (9.7)
- Kombinatorische Enumeration in `getLegalActions` (bewusstes Nicht-Ziel, siehe Vertragskommentar am `RulesEngine`-Interface — `applyAction` bleibt die Legalitäts-Wahrheit)
