# Starter-Set „core" (Validierungspaket)

Status: v0.2 (Card-Designer, aktualisiert nach Game-Architect-Feedback zu v0.2 des Datenmodells) — 2026-07-08
Datei: `src/cards/starter-set.ts` (Typ `CardPool` aus `src/model/cards.ts`)

Zweck: kein vollständiges Set, sondern ein bewusst kleines (27 Karten),
breit über alle 6 Kartentypen und alle 5 Manafarben gestreutes Paket, um
das Datenmodell (`src/model/abilities.ts`, `cards.ts`) an echten Karten
zu prüfen und dem Engine-Engineer erste testbare Objekte zu geben. Der
volle „core"-Pool (40–60 Karten, siehe `docs/README.md`) ist ein
Folgeschritt, sobald hier keine Modelllücken mehr auffallen.

**v0.2-Update:** Der Game-Architect hat alle in v0.1 dieses Dokuments
gestellten offenen Fragen beantwortet und das Datenmodell entsprechend auf
v0.2 gehoben (Changelog: Kopf von `docs/rules-engine.md`). Der Abschnitt
„Offene Fragen" unten ist entsprechend aktualisiert (als geklärt markiert,
nichts mehr offen). Zwei kleine Karten kamen dazu: `core.inferno-surge`
(erste X-Kosten-Karte im Set) und `core.iron-standard` (Testkarte für eine
reine `static`-Fähigkeit auf einem Nicht-Enchantment-Permanent, auf Bitte
des Game-Architect). Dadurch wuchs das Set von 25 auf 27 Karten.

Die beiden Beispielkarten aus `docs/README.md` (Glutwelpe `core.ember-whelp`,
Gezeitenschelte `core.tidal-rebuke`) wurden unverändert übernommen, damit
Doku-Beispiel und tatsächlicher Kartenpool nicht auseinanderlaufen.

## Übersicht

| Typ | Anzahl | Karten |
|---|---|---|
| terrain | 5 | je 1 Basis-Terrain pro Farbe |
| unit | 13 | 2–3 pro Farbe, Vanilla/Keyword/Triggered/Activated gemischt |
| spell | 5 | 2× fast (Burn, Bounce), 1× fast (Counter), 1× fast (X-Burn), 1× slow (Exile-Removal) |
| relic | 2 | 1× Kartenzieh-Engine (activated), 1× reine `static`-Ability (Anthem) |
| enchantment | 2 | 1× aura, 1× global |

Mana-Kurve der Units: 1–2 Mana (5×), 3 Mana (4×), 4 Mana (2×), 5 Mana (2×) —
bewusst niedrig gehalten, damit frühe Engine-Tests (Casten, Combat, ETB-Trigger)
schnell viele Spielzüge durchspielen können.

## Farbidentität (für spätere Erweiterung des vollen Sets)

- **flame:** Aggression, Direktschaden (fix und X-basiert), Eile (`swift`), Flieger (`airborne`)
- **tide:** Tempo, Karten­vorteil, Bounce, defensive Statlines
- **wild:** große Körper, Zähigkeit, `reach`, Marken/Wachstum, Mana-Sinks
- **light:** Lebensgewinn, `lifelink`, Verteidigung, `guardian`, Exile-Removal
  (kein „billiges" destroy — teurer, dafür ohne Nachteile für den Gegner)
- **void:** Opfern für Wert, Tod-Trigger, Lebensdrain, Konter

## Balancing-Notizen (ungewöhnliche/starke Karten)

**core.cinder-pup / core.tide-scout / core.grove-calf (Vanilla-1-2-Drops).**
Bewusst ohne jede Fähigkeit (kein `abilities`-Feld), um zu testen, dass
Karten ganz ohne Effekte/Trigger sauber durch den Kartenpool-Typ laufen.
Statlines folgen der Farbidentität: flame knapp aggressiv (1/1 für 1
reines Farb-Mana), tide/wild defensiver (mehr Toughness, dafür 2 Mana).

**core.ember-whelp (2/1 Flieger + ETB 1 Schaden für 2 Mana).**
Referenzkarte aus der Doku, unverändert übernommen. Vergleichsmaßstab
für alle 2-Mana-Kreaturen mit Ability im Set: leicht unterdurchschnittliche
Körperstatline (2/1) kompensiert durch Evasion + einmaligen Damage-Ping.

**core.grove-elder (3/5 für 5 Mana + wiederholbare Marken-Fähigkeit).**
Körper allein ist unterdurchschnittlich für 5 Mana (Vergleich: reine
Vanilla-Projektion aus core.grove-calf 2/3-für-2 wäre eher 4-5/5-6 für 5
Mana). Die Differenz wird über eine wiederholbare {1}{Wild}-Pump-Fähigkeit
ausgeglichen — ein Value-Karte fürs späte Spiel/Kontrollierte Partien,
kein Tempo-Hebel. Impact: niedrig in schnellen Partien, hoch in langen.

**core.soul-drainer (3/3 für 4 Mana + Opfer-Ability: 2 Schaden + 2 Leben).**
Körper (3/3 für 4) ist unter Vanilla-Rate; die Flexibilität „Reichweite/
Lifegain, wenn der Körper seinen Zweck erfüllt hat" gleicht das aus.
Vergleichbar mit core.ember-whelp im Prinzip (Body + Einmal-Value), nur
mit Spielerentscheidung *wann* die Value ausgelöst wird statt ETB-Zwang.

**core.husk-crawler (3/1 für 2 Mana + Karte beim Tod).**
Aggressive Statline für 2 Mana (3 Power ist über Vanilla-Rate), aber
Toughness 1 macht die Karte extrem tradeanfällig — der Tod-Trigger
„Karte ziehen" federt genau dieses Risiko ab, statt zusätzlichen reinen
Wert zu liefern. Eingeordnet als aggressiver Void-Slot, kein reiner
Value-Trigger wie core.current-seer (ETB) oder core.dawn-medic (ETB).

**core.temple-sentinel (2/5 für 4 Mana, Keyword `guardian`) — Regel jetzt final, Balancing geprüft.**
Die guardian-Regel ist seit v0.2 final spezifiziert (`docs/rules-engine.md`
Abschnitt 6): Pflicht gilt pro ungetappter guardian-Unit des Verteidigers,
sofern ein legaler Block existiert; welchen Angreifer sie blockt, wählt der
Verteidiger frei; maßgeblich ist ein Snapshot bei der Deklaration. Der
Game-Architect ordnet guardian explizit als „auf defensiven Statlines
praktisch kein Nachteil, auf aggressiven Statlines ein echter Preis" ein.
Mit 2/5 für 4 Mana ist `core.temple-sentinel` klar auf der defensiven Seite
dieser Skala — die Karte bleibt bei der finalen Regel balancetechnisch
stimmig: Sie zwingt den Verteidiger zu nichts, was er mit dieser Statline
nicht ohnehin freiwillig täte (blocken statt durchlassen), verhindert aber
gezielt-selektives „Wächter stehen lassen, kleinere Angreifer durchlassen".
Kein Statline-Change nötig. Bleibt weiterhin die einzige guardian-Karte im
Set (bewusst konservativ als erster Praxistest der finalen Regel).

**core.banishment-rite (Exile-Removal für 4 Mana, `slow`).**
Einziges bedingungsloses Hard-Removal im Set. 4 Mana + Sorcery-Speed als
Preis dafür, dass es (anders als ein hypothetisches „destroy") keine
Interaktion mit Death-Triggern/Regeneration zulässt. Falls dem vollen Set
später ein billigeres `destroyPermanent`-Removal hinzugefügt wird, sollte
es entweder teurer als 4 Mana sein oder eine Einschränkung (z. B. nur
gegen Units mit Power ≤ X) tragen, damit Exile nicht strikt dominiert wird.

**core.silence-ban (Konter für 2 Mana).**
Bildet exakt das kanonische Gegenzauber-Beispiel aus
`docs/rules-engine.md` Abschnitt 4 ab (`counterStackObject` auf
`{ kind: "stackObject", objectKind: "spell" }`). Zweck: der Engine-Engineer
kann den dort beschriebenen Beispielablauf 1:1 mit dieser Karte nachbauen.

**core.inferno-surge (neu, X-Kosten-Testkarte: `{flame:1, x:true}`, X Schaden an ein Ziel).**
Erste Karte im Set, die von der v0.2-Klärung der X-Kosten Gebrauch macht
(Ablauf: ankündigen → X wählen → Ziele wählen → bezahlen; `chosenX` am
Stack-Objekt, `Amount {kind:"x"}` bei Resolution). Bewusst schlechtere
Mana-Effizienz pro Schadenspunkt als core.fire-jolt (2 Schaden fix für 1
Mana): Bei X=1 kostet Feuersturz 2 Mana für 1 Schaden, erst ab X=2 (3 Mana
für 2 Schaden) nähert sie sich fire-jolts Rate an. Der Preis für die
Skalierbarkeit ins späte Spiel ist eine schlechtere Ineffizienz bei
kleinem X — Standardmuster für X-Burn, damit sie frühe Spiele nicht
dominiert.

**core.iron-standard (neu, Relic, 3 generisches Mana, reine `static`-Fähigkeit +1/+0 an eigene Units).**
Auf Bitte des Game-Architect als Testkarte für eine `StaticAbility` auf
einem Permanent außerhalb von Enchantments ergänzt (bisher gab es `static`
nur auf den beiden Enchantments mit `scope: attachedTo`/`ownUnits`).
Balancing-Vergleich zu `core.wildgrowth-field` (Enchantment, 3 Mana,
`ownUnits` +1/+1): Iron Standard ist bewusst schwächer (+1/+0 statt +1/+1)
und farblos, Wildgrowth Field stärker, aber an `wild` gebunden — klassischer
Trade-off „farbloses, aber schwächeres Werkzeug" vs. „farbiger, aber
stärkerer Effekt", passend zur bestätigten Design-Linie „Relics möglichst
farblos".

## Offene Fragen ans Datenmodell — Status v0.2: alle geklärt

Alle fünf in v0.1 dieses Dokuments gestellten Fragen wurden vom Game-Architect
beantwortet. Kurzstatus (Details siehe `docs/rules-engine.md` v0.2):

1. **`guardian`-Regel final** (Abschnitt 6): Pflicht pro ungetappter
   guardian-Unit des Verteidigers, sofern legaler Block existiert;
   Angreifer-Wahl frei beim Verteidiger; Snapshot bei Deklaration (vorher
   getappt = keine Pflicht, nachträgliches Tappen entfernt den Block nicht);
   nur beim Verteidiger relevant, daher kein Mehrfach-Guardian-Konfliktfall;
   Enforcement rein über Validierung von `declareBlockers`.
   `core.temple-sentinel` bleibt die einzige Testkarte, Balancing-Prüfung
   gegen die finale Regel siehe Notiz oben — kein Blocker mehr.

2. **X-Kosten geklärt** (Abschnitt 4): Reihenfolge Ankündigen → X wählen
   (≥ 0) → Ziele wählen → bezahlen; `chosenX` am Stack-Objekt; v0.2 nur auf
   Spells (nicht auf aktivierten Fähigkeiten). Umgesetzt in
   `core.inferno-surge` (siehe Balancing-Notiz oben).

3. **Effekte ganz ohne `targets`-Array bestätigt** als regulärer,
   dauerhaft unterstützter Fall (`TargetSpec`-Kommentar in `abilities.ts`
   v0.2). Keine Änderung an bestehenden Karten nötig — `core.soul-drainer`
   und die ETB-Trigger mit `who: "controller"` (z. B. `core.current-seer`,
   `core.dawn-medic`) waren bereits korrekt so modelliert.

4. **Aura/`attachedTo` geklärt**: genau ein Anlege-Objekt pro Aura, alle
   `attachedTo`-Scopes einer Aura beziehen sich darauf. `core.blessing-of-
   steadfastness` (ein `auraTarget`, eine Fähigkeit mit `scope:
   {kind:"attachedTo"}`) entspricht dem bereits — keine Änderung nötig.

5. **„Relics möglichst farblos" bestätigt** als Design-Linie. Der neue
   Relic-Testfall `core.iron-standard` folgt dieser Linie (`{generic:3}`,
   keine Farbe), ebenso wie `core.clockwork-brooch`.

## Nicht verwendete DSL-Primitive (bewusst, für spätere Sets reserviert)

`scry`, `createToken`, `tapPermanent`/`untapPermanent` als Effekt (nur
`tap` als Additional-Cost genutzt), `removeCounters`, `discardCards`,
`grantKeyword` als Effekt (nur als statische Keyword-Vergabe über
`KeywordAbility`), Static-Modifier `costChange`, `StaticAbility` mit
`scope: {kind:"self"}`/`{kind:"opponentUnits"}`/`{kind:"allUnits"}`,
X-Kosten auf aktivierten Fähigkeiten (laut v0.2 ohnehin nicht erlaubt).
Keine Modelllücke — schlicht außerhalb des Umfangs dieses kleinen
Validierungspakets; sollten im vollen 40–60-Karten-Set abgedeckt werden,
damit die Engine auch dafür Tests bekommt.
