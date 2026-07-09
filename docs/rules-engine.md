# Regelwerk-Design: Rules Engine

Status: v0.2.3 (Game-Architect) — 2026-07-09
Verbindlich für: engine-engineer (Implementierung), card-designer (Fähigkeitsdesign), frontend-engineer (Visualisierung von Stack/Priority)

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

- Trigger-Bedingungen (siehe `TriggerCondition` in `src/model/abilities.ts`): u.a. ETB („kommt ins Spiel"), Tod, Zugbeginn/Upkeep, End Step, Angriffs-/Block-Deklaration, Schaden verursacht, Spell gecastet.
- **`onDamageReceived` („Schaden erlitten") ist RESERVIERT, aber noch nicht verdrahtet (Stand v0.2.3):** Die Variante existiert im Datenmodell (`TriggerCondition`) und in der Signatur von `fireSelfCombatTrigger` (`src/engine/triggers.ts`), wird aber von keiner Stelle der Engine gefeuert — weder in `combat.ts` (Kampfschaden) noch in `effects.ts#dealDamageToPermanent` (Nicht-Kampf-Schaden). Eine Karte, die diesen Trigger nutzt, wäre ein stilles No-Op. **Card-Designer: bis zur Verdrahtung nicht verwenden** (Ersatzmuster: ETB-Marker, siehe `core.thornwarden-ascetic`). Der Typ-Eintrag bleibt bewusst bestehen (reservierter Name, vermeidet spätere Churn in Typ-Union und Signaturen). Offener Punkt mit Implementierungs-Notizen: Abschnitt 10.
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
  — lifelink-Lebensgewinn, `onDealtCombatDamageToPlayer`-Trigger und `damageDealt`-Events
  entstehen pro Runde; Trigger werden erst im Priority-Fenster gestackt. (`onDamageReceived`
  ist aktuell nur reserviert und feuert nirgends — siehe Abschnitt 5/10; sobald verdrahtet,
  gilt dieselbe Pro-Runde-Regel.)
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

Warum SBAs statt Ad-hoc-Checks: Ein zentraler, immer gleicher Prüfzeitpunkt verhindert die klassischen Bugs („Kreatur mit 0 Toughness überlebt, weil der Effekt-Code den Tod vergessen hat"). Effekt-Code verändert nur Zustand; Sterben/Verlieren entscheidet ausschließlich die SBA-Schleife.

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

---

## 10. Offene Punkte (v0.2.3 aktualisiert)

**In v0.2.3 entschieden (aus dieser Liste gestrichen):**
- ~~Trample-Analog~~ → Keyword `trample`, Regeln in 6b(2)/6d, Entscheidung 9.9.
- ~~Angreifergewählte Schadensreihenfolge bei Mehrfachblock~~ → `PendingDecision`-Variante `orderBlockers`, Ablauf 6d(1); Entscheidung 9.8 explizit revidiert (Option B umgesetzt).
- ~~First-Strike-/Deathtouch-Analoga~~ → Keywords `firstStrike`/`deathtouch`, Regeln in 6d, SBA 4 erweitert (Abschnitt 7), Entscheidung 9.9.

**In v0.2 entschieden (aus dieser Liste gestrichen):**
- ~~X-Kosten~~ → Abschnitt 4 (Ablauf) und `ManaCost.x`-Kommentar; v0.2-Einschränkung: nur auf Spells.
- ~~guardian-Regel~~ → Abschnitt 6, final.
- ~~Startspieler-Bestimmung~~ → Abschnitt 1a.
- ~~Effekte ohne targets-Array~~ → regulärer Fall, bestätigt (Abschnitt 4, `TargetSpec`-Kommentar).
- ~~Aura-Anlege-Bezug~~ → genau ein `attachedTo`-Objekt pro Aura, alle Fähigkeiten beziehen sich darauf (`EnchantmentCard.auraTarget`-Kommentar).
- Konvention „Relics möglichst farblos": **bestätigt** als Design-Linie (Relics = farbübergreifend nutzbare Werkzeuge, MTG-Artefakt-Vorbild). Farbige Relics sind als bewusste, begründete Ausnahme erlaubt (z.B. stark farbidentitätsgebundene Effekte), sollten aber selten bleiben.

**Weiterhin offen (bewusst verschoben):**
- **`onDamageReceived` verdrahten** (Fund des Card-Designers beim Phase-B-Audit, bestätigt): Die `TriggerCondition`-Variante ist im Modell deklariert, wird aber nirgends gefeuert — anders als die 9.7-Auto-Defaults ist das keine dokumentierte Vereinfachung gewesen, sondern eine Lücke; jetzt explizit als „reserviert" markiert (Abschnitt 5) und hierher vertagt. Bei Implementierung zu klären/beachten:
  - Anknüpfpunkte: `dealCombatDamageRound` in `combat.ts` (analog zu den `onDealtCombatDamageToPlayer`-Aufrufen, pro Schadensrunde) **und** `effects.ts#dealDamageToPermanent`, damit Kampf- und Nicht-Kampf-Schaden konsistent triggern. Bevorzugt: einheitlich am zentralen Schadensereignis feuern statt an zwei Stellen, falls die Codestruktur das hergibt.
  - Semantik festlegen: Schaden ≤ 0 feuert nicht (konsistent mit 6c); Trigger feuert auch bei letalem Schaden (Quelle stirbt danach in der SBA-Prüfung, Trigger bleibt in der Pending-Queue — MTG-analog); `what: "self"` betrifft nur Permanents, Spielerschaden ist ein separater, noch nicht modellierter Trigger.
  - Erst umsetzen, wenn eine konkrete Karte ihn braucht (Enrage-artiges Design-Muster) — dann Übergabe an den Engine-Engineer inkl. Tests für firstStrike-Doppelrunde und deathtouch-Interaktion.
- Mulligan-Regel (weiterhin: keine)
- Mehr als 2 Spieler
- Kontrollwechsel, Kopier-Effekte, Keyword-Entzug
- Double-Strike-Analog (teilt in **beiden** Schadensrunden aus; bewusst nicht in v0.2.3, siehe 9.9)
- Priority-Fenster zwischen den beiden Schadensrunden (9.9 Punkt 2, Option A — additiv nachrüstbar als eigener Step, falls Antwortspielraum nach First-Strike-Schaden je gebraucht wird)
- trample-Über-Zuteilung (Spielerwahl „mehr als letal an einen Blocker", 9.9 Punkt 3 — erst mit Regenerations-/Unzerstörbarkeits-artigen Mechaniken relevant)
- Spielerwahl bei der Reihenfolge mehrerer eigener gleichzeitiger Trigger (deterministische Timestamp-Ordnung bleibt v0.2-Verhalten; Kandidat für den Pending-Decision-Kanal aus 9.7)
- Modal-Effekte („wähle eines —"; ebenfalls Kandidat für 9.7)
- X-Kosten auf aktivierten Fähigkeiten (Mana-Sinks mit X); erfordert `chosenX` an `activateAbility`
- Vollständig rekursive Cleanup-Sonderregel (Abschnitt 2; aktuell: ein Extra-Fenster genügt)
- Migration von `addMana("any")` / `discardCards`-Zusatzkosten / `scry` auf den Pending-Decision-Kanal (9.7)
- Kombinatorische Enumeration in `getLegalActions` (bewusstes Nicht-Ziel, siehe Vertragskommentar am `RulesEngine`-Interface — `applyAction` bleibt die Legalitäts-Wahrheit)
