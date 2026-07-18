# Starter-Set „core" (Validierungspaket + Phase-B-Erweiterung + 300-Karten-Ausbau)

Status: v0.15 (Card-Designer, Balance-Korrekturrunde 3: strukturelle
Vertiefung der `wild`-Korrektur aus Runde 2 UND erste dedizierte Prüfung
von `void`s Vorsprung gegenüber `tide`/`light` — 2 Karten geändert, `void`
bewusst unangetastet gelassen, siehe Begründung im Abschnitt „Balance-
Korrektur Runde 3" unten) — 2026-07-18
Datei: `src/cards/starter-set.ts` (Typ `CardPool` aus `src/model/cards.ts`)

**v0.15-Update (Balance-Korrektur Runde 3, Teil A `wild` + Teil B
`void`-Prüfung, keine neuen Karten):** Reaktion auf eine dritte,
vom Auftraggeber durchgeführte Bot-Simulation (medium vs. medium, 15 Seeds
× 2 Rollen, 120 Partien/Farbe) nach Runde 2: `wild` sank weiter auf **64,7 %**
(vorher 71,4 %, davor 73–75 %) — spürbarer Fortschritt, aber noch nicht am
Ziel. **Teil A** identifiziert, dass Runde 2s Korrektur an `core.grove-elder`
(Kostenerhöhung `{1}{Wild}`→`{2}{Wild}`) das strukturelle Problem (unbegrenzt
oft pro Zug aktivierbarer Marken-Mana-Sink) nicht behoben hatte — nur
teurer gemacht, nicht begrenzt. Dieser Pass ergänzt echte Zusatzkosten
(`{ kind: "tap" }`) auf `core.grove-elder` UND dessen farblosem Pendant
`core.growth-totem` (harte 1×/Zug-Grenze plus, bei grove-elder, eine echte
Angriff-oder-Aktivierung-Entscheidung, da die Fähigkeit jetzt an eine
Kreatur statt an ein Relic gebunden ist). Eine vollständige Prüfung aller 49
aktivierten Fähigkeiten im gesamten 300-Karten-Pool bestätigt: dies waren
die einzigen zwei Fähigkeiten mit Mana-Kosten, aber OHNE jede
Aktivierungs-Begrenzung (kein Tap/`sacrificeSelf`/`payLife`/`discardCards`)
— kein weiterer bisher übersehener unbegrenzter Sink gefunden. Wichtiger
methodischer Nebenbefund: `core.growth-totem` ist ein farbloses Relic und
wird vom Bot-Analyse-Tool bewusst aus allen Mono-Farb-Testdecks
ausgeschlossen — die Korrektur daran wirkt sich NICHT auf die gemessene
`wild`-Siegquote aus, wird aber aus Konsistenzgründen trotzdem vorgenommen
(siehe Karten-Kommentar). **Teil B** prüft `void`s seit zwei Messungen
identischen 23:7-Vorsprung gegenüber `tide` UND `light` auf Kartenebene:
gefunden wird eine echte, messbare strukturelle Dichte-Asymmetrie (`void`
hat 3 Tod-Trigger-Kreaturen + 1 Tod-Trigger-Enchantment gegenüber je 1
Tod-Trigger-Kreatur bei jeder anderen Farbe; 2 bedingungslose
Entfernungszauber gegenüber 1 bei `light` und 0 bei `tide`/`wild`/`flame`)
— plausibel genau der Faktor, der in den von den Bots unterschätzten
langen/attritionsreichen Partien gegen `tide`/`light` überproportional
Wert liefert. Da aber KEINE einzelne `void`-Karte im direkten
1:1-Preisvergleich mit ihren Pendants als fehlbepreist auffällt (anders als
`core.grove-elder`/`core.thornrage-boar` in Runde 2), wird bewusst KEINE
`void`-Karte verändert — ausführliche Begründung siehe Abschnitt „Balance-
Korrektur Runde 3" unten. Runde 1 (v0.13) und Runde 2 (v0.14) bleiben als
eigene Abschnitte erhalten (nicht überschrieben).

**v0.14-Update (Balance-Korrektur Runde 2, ausschließlich `wild`
betreffend, keine neuen Karten):** Der Auftraggeber hat nach v0.13 die
Bot-Simulation erneut laufen lassen: `wild` gewann weiterhin **71,4 %**
seiner Partien (medium vs. medium, 15 Seeds × 2 Rollen) — praktisch
unverändert gegenüber den 73–75 % vor Runde 1, mit extrem einseitigen
Einzel-Matchups (wild vs. light 25:5, wild vs. tide 24:6, wild vs. void
20:9). Runde 1 hatte nur die GEDRUCKTEN Statfelder auf der 3-Mana-Stufe
um je −1 Toughness gekürzt, aber selbst dort explizit dokumentiert, dass
3 der 14 Karten einen versteckten permanenten `StaticAbility scope:"self"`-
Statbonus tragen, der die reine Feldanalyse untererfasst — dieser Bonus
wurde in Runde 1 nicht mitgekürzt, wodurch die tatsächliche (effektive)
Stärke kaum sank. Runde 2 korrigiert deshalb gezielt 7 Karten (6 Units +
1 Spell) mit spürbar größeren Einzelschritten (u. a. `-1` zusätzlich auf
bereits einmal gekürzte Statfelder, Kürzung eines bisher unangetasteten
Static-Bonus, Abschwächung von zwei bisher rein statlinienseitig
betrachteten Fähigkeiten selbst — Vergeltungsschaden und ein
unbegrenzter Marken-Mana-Sink — sowie eine Kostenerhöhung bei der
effizientesten `addCounters`-Spell-Karte). Details, Vorher-/Nachher-Werte
und eine ehrliche Einordnung, warum Runde 1 nicht ausreichte, siehe
Abschnitt „Balance-Korrektur Runde 2 (wild, nach erfolgloser Runde 1)"
ganz unten. Runde 1 (v0.13) bleibt als eigener Abschnitt „Balance-Korrektur
nach empirischer Prüfung" darüber erhalten (nicht überschrieben, damit die
Historie nachvollziehbar bleibt).

**v0.13-Update (Balance-Pass, ausschließlich `wild` betreffend, keine neuen
Karten):** Reaktion auf den vom `ai-opponent-engineer` durchgeführten
empirischen Bot-vs-Bot-Befund (Abschnitt „Empirische Balance-Prüfung
(Bot-Simulation)" unten): `wild` gewann 73–75 % seiner Partien über beide
getesteten Bot-Spielstärken hinweg, mit dem stärksten Einzelbefund bei der
3-Mana-Unit-Stufe (Ø 5,0 Gesamt-Stats bei n=14 gegenüber 4,1–4,4 bei den
übrigen Farben). Dieser Pass reduziert gezielt und moderat die Statlines der
Ausreißer nach oben auf dieser Stufe (10 von 14 Karten je −1 Toughness,
neuer Schnitt Ø 4,29) sowie den klarsten Einzel-Ausreißer im 4–5-Mana-
Top-End (`core.overgrowth-colossus`, −1 Toughness). Keine Karte wurde
entfernt, kein `addCounters`-Wachstumseffekt angetastet, keine andere Farbe
verändert. Details, Vorher-/Nachher-Werte und Begründung je Karte siehe
Abschnitt „Balance-Korrektur nach empirischer Prüfung" ganz unten. **Nach
erneuter Bot-Simulation (siehe v0.14-Update oben) hat sich gezeigt, dass
dieser Pass nicht ausreichend war** — Runde 2 baut direkt darauf auf.

**v0.12-Update (Batch 9 von 9, Abschlussbatch — Ziel von ca. 300 Karten
erreicht):** Dieser Batch fügt **35 neue Karten** hinzu (265 → 300) und
schließt damit das über mehrere Batches laufende Vorhaben ab, den
Kartenpool von 113 auf 300 Karten zu erweitern. Vor dem Kartenbau wurde
der Ist-Zustand exakt gegen den Code nachgezählt (nicht aus der Doku
übernommen, per Grep gegen `type:"..."`/`cost:{...}`/`rarity:"..."`-
Vorkommen): unit 97, spell 64, relic 49, enchantment 50, terrain 5 (265
gesamt); Farben je 43–44 von 216 farbigen Karten (terrain+unit+spell+
enchantment, ~20 % je Farbe); Rarity 112 common/116 uncommon/37 rare
(14,0 %) — alle Zahlen stimmten exakt mit dem vom Auftrag vorgegebenen
Tally überein. **Typ-Ziele** wurden wie im eigenen Fahrplan aus Batch 8
vorgeschlagen proportional zur bestehenden Verteilung hochskaliert (unit
+13, spell +8, relic +7, enchantment +7, terrain +0). **Farb-Ziele**
wurden bewusst so verteilt, dass das Set als letzter Batch möglichst rund
abschließt: flame/tide/wild/light je +6, void +4 (unter den 28 farbigen
Nicht-Relic-Karten dieses Batches) — Endergebnis: vier Farben bei exakt
49 und eine (void, die in Batch 8 einen bewussten Einzelvorsprung erhalten
hatte) bei 48 von 244 farbigen Karten, das rundeste Ergebnis aller neun
Batches. **Rarity** bleibt exakt auf dem Batch-8-Niveau (14,0 %, 5 von 35
Karten `rare`), wie vom Auftrag gefordert („bei diesem Niveau bleiben,
nicht weiter steigen lassen"). **Designraum:** `trample` bei `tide` wurde
nachgetragen (`core.tidesurge-crasher`) — die seit Batch 7 als letzte
verbleibende, nicht dokumentiert ausgeschlossene Keyword-Farb-Lücke im
gesamten Set vorgemerkte Lücke ist damit geschlossen; `trample` deckt
jetzt als fünftes Keyword nach `airborne`/`vigilant`/`firstStrike`/`swift`
alle 5 Farben ab (siehe Keywords-Abschnitt). Der übrige Batch ist bewusst
fast vollständig liberale Wiederverwendung bewährter Bausteine (Auren,
Anthems, `StaticAbility scope:self`+Keyword-Preispunkt-Familien,
`sacrificeSelf`/`payLife`-Relic-Muster, `onAttackDeclared`/
`onBlockDeclared`/`onDamageReceived`-Trigger in neuen Farben/Preispunkten,
Burn-/Lifegain-Kurven-Erweiterungen) — passend zur expliziten Vorgabe,
den Abschlussbatch ohne neue Experimente rund abzuschließen. Einzige
neuen Kombinationen bestehender Primitive (keine neuen Primitive):
`drawCards` mit X-Kosten (`core.endless-archive`, erster X-Kartenzug-
Mana-Sink, nach den bereits bestehenden X-Sinks für Schaden/Lebensgewinn/
-verlust/Marken), `grantKeyword`(`firstStrike`)/`scope:ownUnits` auf einem
Relic (`core.vanguard-standard`, bisher nur `reach`/`swift` auf Relics)
und `grantKeyword`(`lifelink`)/`scope:ownUnits` als board-weiter Anthem
(`core.dawnhaven-covenant`, bisher nur `reach`/`vigilant`/`firstStrike`),
sowie eine zweite bedingungslose `exilePermanent`-Removal-Karte mit
breiterem Zielsatz (`core.hollowbanish-verdict`, Unit/Relic/Enchantment
statt nur Unit wie `core.banishment-rite`). Keine neuen Modell-Primitive
erfunden, keine neue Modellfrage aufgeworfen. Details siehe „Batch 9 —
Zielplanung" und „Batch 9 (v0.12) — Balancing-Notizen" unten sowie den
abschließenden Abschnitt „Set-Abschluss (300 Karten erreicht)" ganz unten
in diesem Dokument.

**v0.11-Update (Batch 8 von mehreren, Ziel: ca. 300 Karten gesamt):** Dieser
Batch fügt **30 neue Karten** hinzu (235 → 265). Hauptfokus laut Auftrag war
die in Batch 7 als „höchste Priorität" markierte, seither bestätigt fertige
Neuerung aus `docs/rules-engine.md` v0.3.3 (Entscheidung 9.15) und
`docs/engine-status.md` v0.3.5: `onDeath{self}` feuert jetzt
ursachenunabhängig (SBA-Tod, `destroyPermanent`-Removal, `sacrificeSelf`-
Kosten) und typ-agnostisch (auch Relic/Enchantment/Terrain). Dieser Batch
nutzt das erstmals aktiv aus: **fünf neue „Parting Shot"-Units** (je eine
pro Farbe: `core.cinderwake-marauder`/flame/Schaden, `core.tideborn-
remnant`/tide/Kartenziehen, `core.mosswake-drifter`/wild/`createToken` —
erste Kombination von `createToken` mit `onDeath` im Pool —, `core.sunfall-
martyr`/light/Lebensgewinn, `core.gravebound-oracle`/void), davon
`core.gravebound-oracle` bewusst als „Removal-Magnet"-Design (zäher 2/4-
Körper statt fragiler Aggro-Statline, damit der Kartenzug-Payoff
typischerweise durch destroy-Removal statt durch Kampftod ausgelöst wird)
sowie **zwei neue Nicht-Unit-`onDeath{self}`-Beispiele** (bisher komplett
unbenutzt): `core.duskbound-cairn` (Relic, kombiniert eine
`sacrificeSelf`-Aktivierung MIT einem `onDeath`-Trigger auf demselben
Objekt — zeigt direkt, dass eigenes Opfern jetzt selbst als Tod zählt) und
`core.gravebound-shrine` (Enchantment, laufender Anthem + Schadens-Payoff
bei Zerstörung, erstmals ein echter Zusammenhang mit dem bereits
bestehenden `core.gravetide-obelisk`, das gezielt gegnerische Relics/
Enchantments/Terrains zerstören kann). Alle sieben neuen `onDeath`-Karten
sind mit besonders sorgfältiger Balancing-Begründung dokumentiert (siehe
„Batch 8 (v0.11) — Balancing-Notizen" unten), da dies eine mechanisch
spürbare Verhaltensänderung ist: Entfernung ist jetzt kein „sauberer" Weg
mehr, Tod-Trigger zu umgehen — mit den zwei dokumentierten, bewusst
unveränderten Ausnahmen `exilePermanent`/`returnToHand` (kein Tod laut
9.15), die `core.banishment-rite` als einzige echte „Trigger-Umgehung" im
Set bestätigen. **Zweiter Schwerpunkt:** die letzten beiden fehlenden
Keywords im „`grantKeyword` als Effekt"-Baukasten (`vigilant` via `core.
vigilwave-charm`/tide, `guardian` via `core.wildwatch-oath`/wild) wurden
geschlossen — damit sind jetzt **alle 9 Keywords** mindestens einmal als
zeitlich befristeter Spell-/Fähigkeits-Effekt vertreten, nicht mehr nur als
`KeywordAbility`/`StaticAbility`-Modifier (siehe Keywords-Abschnitt). Typ-/
Farbverteilung wurde erneut exakt gegen den Code nachgezählt und liberal
proportional weitergebaut (unit +11, spell +7, relic +6, enchantment +6,
terrain +0; Farben flame +5, tide +5, wild +4, light +4, void +6). Rarity
bleibt bewusst auf dem in Batch 7 erreichten, niedrigeren Niveau (3 von 30
Karten `rare`, 10,0 % — Gesamtpool-Anteil sinkt leicht weiter von 14,5 % auf
14,0 %, wie vom Auftrag gefordert „bei diesem Niveau bleiben, nicht wieder
hochtreiben"). Details/Zielplanung siehe „Batch 8 — Zielplanung" unten,
Balancing-Begründungen siehe „Batch 8 (v0.11) — Balancing-Notizen". Keine
neuen Modell-Primitive erfunden, keine neue Modellfrage aufgeworfen — die
`onDeath`-Kombinationen wurden vor dem Bau gegen `src/engine/triggers.ts`
(`fireDeathTriggers`) gegengelesen und entsprechen exakt der in
`docs/engine-status.md` v0.3.5 dokumentierten Semantik.

**v0.10-Update (Batch 7 von mehreren, Ziel: ca. 300 Karten gesamt):** Dieser
Batch fügt **30 neue Karten** hinzu (205 → 235). Laut Auftrag ist keine
aggressive Typ-Gegensteuerung mehr nötig — der Batch baut stattdessen
**ungefähr proportional zur Verteilung vor dem Batch** (unit 36,6 % / spell
24,4 % / relic 18,0 % / enchantment 18,5 % vor diesem Batch): unit +11,
spell +7, relic +6, enchantment +6, terrain +0 (Details/exakte Vorher-
Nachher-Zählung siehe „Batch 7 — Zielplanung" unten). Die Farbverteilung war
bereits sehr eng (19,6–20,2 %) und wurde mit einem nahezu perfekt
gleichmäßigen Split (flame +5, tide +5, wild +5, light +5, void +4 unter den
24 farbigen Nicht-Relic-Karten dieses Batches) nachjustiert — nach Batch 7
liegen alle fünf Farben innerhalb von ±0,5 Prozentpunkten des Idealwerts,
das engste Ergebnis aller sieben Batches bisher. Wie im Fahrplan aus Batch 6
festgehalten, gibt es **keine offene Primitiv-/Kombinations-Lücke** mehr im
Modell — dieser Batch besteht deshalb fast vollständig aus liberaler
Wiederverwendung bewährter Bausteine (Nutzer-Vorgabe bleibt gültig). Einziger
selbst gewählter Design-Schwerpunkt: drei echte, bisher nicht als
Farbidentität dokumentierte Keyword-Farb-Lücken wurden geschlossen
(`reach`/void, `lifelink`/tide, `deathtouch`/light — analog zur `swift`-
Lückenschließung aus Batch 6) sowie eine vierte, zufällig bei der Prüfung
entdeckte Lücke (`airborne`/wild, macht `airborne` zum vierten Keyword mit
vollständiger 5-Farben-Abdeckung nach `vigilant`/`firstStrike`/`swift`).
Zusätzlich wurde die in Batch 6 als „leicht gestiegen" markierte
Rarity-Verschiebung (14,0 % → 13,7 % → 15,6 % rare über Batch 4–6) bewusst
gegengesteuert: dieser Batch hält sich mit nur 2 von 30 Karten als `rare`
(6,7 %) deutlich unter dem Gesamtpool-Schnitt, wodurch der Gesamt-rare-Anteil
erstmals seit Batch 4 wieder SINKT (15,6 % → 14,5 %). Details/Balancing-
Begründungen siehe Abschnitt „Batch 7 — Zielplanung" und „Batch 7 (v0.10) —
Balancing-Notizen" unten. Alle Zahlen wurden vor UND nach dem Kartenbau exakt
gegen den echten Code in `src/cards/starter-set.ts` nachgezählt (per Grep,
nicht aus der Tabelle fortgeschrieben). Keine neuen Modell-Primitive
erfunden, keine neue Modellfrage aufgeworfen — Batch 7 selbst enthält keine
neuen `onDeath`-Karten. **Wichtiger Nachtrag bei der abschließenden
Doku-Prüfung:** Punkt 8 aus „Offene Fragen" (`onDeath` als de-facto-
Unit-only-Trigger, in Batch 6 gemeldet) ist inzwischen vollständig
geklärt UND behoben — der Game-Architect hat ihn als Bug bestätigt
(rules-engine.md v0.3.3, Entscheidung 9.15, „zonenbasierte
Todesdefinition"), und der Engine-Engineer hat den Fix bereits umgesetzt
und getestet (`docs/engine-status.md` v0.3.5, inkl. Pool-Regressionstest).
`onDeath{self}` feuert jetzt typ-agnostisch bei jedem Battlefield→
Graveyard-Zonenwechsel (SBA-Tod, `destroyPermanent`, `sacrificeSelf`),
auch auf Nicht-Unit-Permanents. Batch 7 selbst nutzt das noch nicht (die
Entdeckung erfolgte erst nach Fertigstellung des Batches), ist damit aber
der naheliegende Schwerpunkt für Batch 8 (siehe „Offene Fragen" Punkt 8
und Fahrplan-Vorschlag unten für Details).

**v0.9-Update (Batch 6 von mehreren, Ziel: ca. 300 Karten gesamt):** Dieser
Batch fügt **30 neue Karten** hinzu (175 → 205). Nach dem in Batch 5
aktualisierten Fahrplan wird ab diesem Batch nicht mehr aggressiv
typ-gegengesteuert (unit 38,9 % / spell 24,0 % / relic 17,1 % /
enchantment 17,1 % vor diesem Batch galten bereits als ausgewogen genug):
unit +7, spell +8, relic +7, enchantment +8, terrain +0 (Details/exakte
Vorher-Nachher-Zählung siehe „Batch 6 — Zielplanung" unten). Die
Farbverteilung war bereits sehr eng (19,3–20,7 %) und wurde nur mit einem
ungefähr gleichmäßigen Split (flame +4, tide +5, wild +4, light +5,
void +5 unter den 23 farbigen Nicht-Relic-Karten dieses Batches)
nachjustiert. Designraum laut eigenem Fahrplan-Vorschlag aus Batch 5:
**`swift` bei tide (`core.tidewhip-skirmisher`) und wild
(`core.thornrush-sprinter`) nachgetragen** — damit deckt `swift` jetzt
ebenfalls alle 5 Farben ab, wie zuvor bereits `firstStrike`/`vigilant`/
`guardian` (mit der einen dokumentierten Ausnahme flame/guardian) — sowie
**`objectKind: "any"` auf `stackObject`-Zielen** (`core.silence-veil`,
der erste Konter im Set, der sowohl Zaubersprüche als auch Fähigkeiten
trifft). Damit ist der Abschnitt „Nicht verwendete DSL-Primitive" jetzt bis
auf die eine, vom Game-Architect bereits final beantwortete Modellfrage
(`eventSubject` bei `onUnitDied` — **Antwort: bewusst nicht bauen**, siehe
„Offene Fragen" unten) vollständig leer. Weiterhin gilt die Nutzer-Vorgabe:
Karten müssen NICHT mechanisch einzigartig sein — der Großteil dieses
Batches sind erneut Zweit-/Drittkopien bewährter Bausteine in neuen
Farben/Preispunkten (u. a. eine vierte Farbe für das `createToken`-ETB-
Body-Muster, ein zweites Zwei-Zielslot-Spell-Paar, eine dritte Static+
Activated-Konsolidierungskarte, ein zweites `costChange`-Farbtrio und eine
sechste Keyword-Aura). Subtyp-Synergien (Punkt 5 aus dem Batch-5-Fahrplan)
wurden bewusst NICHT angegangen (neue Regelsemantik, braucht vorherige
Rücksprache mit dem Game-Architect, nicht Teil dieses Auftrags). Alle
Zahlen wurden vor UND nach dem Kartenbau exakt gegen den echten Code in
`src/cards/starter-set.ts` nachgezählt. Keine neuen Modell-Primitive
erfunden. **Eine echte Modell-Beobachtung ist bei der Prüfung
aufgefallen** (kein Blocker, da bewusst gemieden): `onDeath`/`what:"self"`
feuert laut Engine-Code (`sba.ts`, `effects.ts`) ausschließlich für Units,
die über die Toughness-/Schadens-SBA sterben — NICHT für andere
Permanent-Typen (die SBA-Schleife filtert explizit `def.type !== "unit"`)
und NICHT für per `destroyPermanent`-Effekt zerstörte Permanents jeglichen
Typs (dieser Effekt ruft `fireDeathTriggers` gar nicht auf). Details siehe
„Offene Fragen" Punkt 8 unten — betrifft NICHT die in diesem Batch gebauten
Karten (keine neue `onDeath`-Nutzung), ist aber für künftige
`onDeath`-Designs relevant. Details/Balancing-Begründungen siehe Abschnitt
„Batch 6 — Zielplanung" und „Batch 6 (v0.9) — Balancing-Notizen" unten.

**v0.8-Update (Batch 5 von mehreren, Ziel: ca. 300 Karten gesamt):** Dieser
Batch fügt **32 neue Karten** hinzu (143 → 175). Schwerpunkt laut eigenem
Fahrplan-Vorschlag aus Batch 4: relic (14,0 % → 17,1 %) und enchantment
(14,0 % → 17,1 %) weiter stärken, unit-Anteil tendenziell weiter senken
(44,1 % → 38,9 %); die Farbverteilung war bereits nah an 20 %/Farbe und
wurde nur mit einem ungefähr gleichmäßigen Split (flame +5, tide +5,
wild +4, light +4, void +4 unter den 22 farbigen Nicht-Relic-Karten dieses
Batches) leicht nachjustiert. Explizite Nutzer-Vorgabe für diesen Batch:
Karten müssen NICHT mechanisch einzigartig sein — Wiederverwendung bewährter
Effekt-Bausteine mit anderer Farbe/anderem Preis/anderer Statline (wie die
etablierten Symmetriepaare aus Batch 1–4) ist ausdrücklich erwünscht, nicht
nur Notlösung. Entsprechend besteht der Großteil dieses Batches aus
Zweit-/Drittkopien bereits bewährter Bausteine in neuen Farben/Preispunkten;
sieben der zehn neuen Enchantments sind **Auren** (gezielte Behebung der in
Batch 4 dokumentierten Aura-Dünnheit — vor allem `void`, das vorher gar
keine Aura im Pool hatte), außerdem zwei weitere `scope:opponentUnits`- und
`scope:allUnits`-Paare (farblos/farbig). Details siehe Abschnitt „Batch 5 —
Zielplanung" und „Batch 5 (v0.8) — Balancing-Notizen" unten. Alle Zahlen
wurden vor UND nach dem Kartenbau exakt gegen den echten Code in
`src/cards/starter-set.ts` nachgezählt (nicht aus der Tabelle fortgeschrieben).
Keine neuen Modell-Primitive erfunden; einige bisher ungenutzte
*Kombinationen* bestehender Primitive wurden geschlossen (siehe „Nicht
verwendete DSL-Primitive" unten). Die offene Modellfrage aus Batch 4
(`eventSubject` bei `onUnitDied` + permanent-bezogene Effekte) ist weiterhin
unbeantwortet — Batch 5 hat diese Kombination entsprechend erneut bewusst
gemieden.

**v0.7-Update (Batch 4 von mehreren, Ziel: ca. 300 Karten gesamt):** Der
Kartenpool wird über mehrere weitere Batches von 113 auf ca. 300 Karten
erweitert (Auftrag: Gesamt-Set ausgewogen halten — Typ-Mix, Farb-Mix,
Mana-Kurve, keine dominanten Karten/Kombos). Dieser Batch fügt **30 neue
Karten** hinzu (113 → 143). Details zur expliziten Zielplanung (Typ- UND
Farb-Ziele, analog zur „Typ-Mix-Korrektur" aus Batch 2) siehe Abschnitt
„Batch 4 — Zielplanung" unten; Balancing-Begründungen für ungewöhnliche/
starke Karten siehe Abschnitt „Batch 4 (v0.7) — Balancing-Notizen".

Schwerpunkt laut Auftrag: die zwei zuletzt verbliebenen, bewusst
ausgelassenen DSL-Primitive aus dem „Nicht verwendete DSL-Primitive"-
Abschnitt (`onAttackDeclared`/`onBlockDeclared`-Trigger, `modifyStats`/
`grantKeyword` mit `duration: "permanent"`) sind jetzt im Pool vertreten;
der Großteil des Batches (siehe unten) besteht aus neuen Kombinationen
bereits bewährter Bausteine. Keine neuen Modell-Primitive erfunden, kein
Modellkonflikt aufgefallen.

**v0.6-Update (Modell-Update-Batch, Reaktion auf rules-engine.md v0.3):** Der
Game-Architect hat vier zuvor offene Punkte ins Regelmodell aufgenommen
(Entscheidungen 9.10–9.13). Dieser Batch fügt **4 neue Karten** hinzu
(109 → 113), je eine Demo pro betroffener Mechanik (Mulligan braucht keine
Kartenänderung, ist reine Spielablauf-Mechanik):

1. **Modal-Effekte („wähle eines —", `modes`, Entscheidung 9.13):** zwei
   Karten, wie vom Architekten für die Engine-Abnahme empfohlen (§4-
   Unterabschnitt „Modal-Effekte", letzter Absatz) — `core.void-covenant`
   (Spell mit 3 Modi, davon einer mit Zielslot) und `core.current-diplomat`
   (Unit mit modaler ETB-TriggeredAbility, testet die neue PendingDecision
   `chooseMode` inkl. Auto-Pick-Fall).
2. **`onDamageReceived` (Entscheidung 9.10, jetzt verdrahtet):**
   `core.thornrage-boar` — Vergeltungsdesign über `EffectRecipient
   "eventSubject"` (= Schadensquelle). Bewusst als reguläre Pool-Karte
   (KEIN Token), wie vom Architekten in 9.10 Punkt 4 gefordert.
3. **X-Kosten auf aktivierten Fähigkeiten (Entscheidung 9.12):**
   `core.cinderwrack-engine` — Relic mit `{X}, Tappe: …`-Mana-Sink, keine
   Mana-Fähigkeit (hat Ziele, geht über den Stack).

Details/Balancing-Begründung siehe Abschnitt „v0.6-Batch — Balancing-Notizen"
unten. Kein Modellkonflikt aufgefallen: alle drei benötigten Felder
(`modes` auf `SpellCard`/`TriggeredAbility`, `EffectRecipient "eventSubject"`,
`ManaCost.x` auf `ActivatedAbility`) existierten in `src/model/abilities.ts`
und `src/model/cards.ts` exakt wie in rules-engine.md v0.3 beschrieben.

Zweck (v0.1/v0.2): ursprünglich ein bewusst kleines Validierungspaket, um
das Datenmodell (`src/model/abilities.ts`, `cards.ts`) an echten Karten zu
prüfen und dem Engine-Engineer erste testbare Objekte zu geben.

**v0.3-Update (Phase B, Batch 1 von mehreren):** Das Projekt erweitert den
Kartenpool jetzt in Batches auf mindestens 100 Karten (`docs/README.md`).
Dieser Batch fügt **29 neue Karten** hinzu (27 → 56) mit klarem Fokus:

1. Die sechs länger etablierten Keywords (`airborne`, `reach`, `vigilant`,
   `guardian`, `lifelink`, `swift`), die zuvor nur je 0–1 Testkarten hatten,
   sind jetzt über mehrere Farben und Preispunkte ausgebaut (Details siehe
   Balancing-Notizen unten und Farbidentität).
2. Die drei neuen Kampf-Keywords aus Regelwerk v0.2.3 (`trample`,
   `firstStrike`, `deathtouch`, Abschnitt 6d) sind jetzt mit je 4 echten
   Pool-Karten über 3–4 Farben vertreten — vorher existierten sie nur als
   synthetische Testkarten in `src/engine/__tests__/fixtures.ts`.
3. Eine bewusste Kombinationskarte (`core.void-assassin`,
   `firstStrike`+`deathtouch`) testet die vom Game-Architect als „mechanisch
   sehr stark" markierte Kombinatorik aus 6d(4) im echten Pool — hoch
   bepreist und als `rare` eingestuft, siehe Balancing-Notiz.

**v0.4-Update (Phase B, Batch 2 von mehreren):** Dieser Batch fügt **25 neue
reguläre Karten** hinzu (56 → 81) plus **3 Token-Hilfsdefinitionen**
(`core.sprout-token`, `core.spirit-token`, `core.skeleton-token` —
`isToken:true`, zählen nicht zum Deckbau-Pool, siehe `src/ui/deck.ts`).
Damit hat der Pool jetzt 84 Einträge insgesamt, davon 81 „echte" Karten.
Zwei Schwerpunkte, beide aus dem Auftrag für Batch 2:

1. **Fünf bisher ungenutzte Effekt-Primitive** aus `src/model/abilities.ts`
   sind jetzt im echten Pool vertreten: `createToken` (4 Karten),
   `grantKeyword` als **Effekt** (temporärer Buff bis Zugende, 4 Karten —
   nicht zu verwechseln mit der weiterhin genutzten statischen
   `KeywordAbility`), `tapPermanent`/`untapPermanent` als **Effekt** (4
   Karten), `removeCounters` (2 Karten), `discardCards` als **Effekt** (2
   Karten, nicht als Zusatzkosten). Details siehe Balancing-Notizen
   „Batch 2" unten.
2. **Typ-Mischung korrigiert:** Batch 1 war unit-lastig (37 von 56 Karten,
   ca. 66 %). Batch 2 gewichtet bewusst um: von den 25 neuen Karten sind nur
   5 Units, dafür 10 Spells, 4 Relics und 6 Enchantments. Neuer Gesamtstand
   siehe Übersichtstabelle.

**v0.5-Update (Phase B, Batch 3 von 3 — letzter Batch):** Dieser Batch fügt
**28 neue Karten** hinzu (81 → 109) und erreicht damit die vereinbarte
Zielgröße von mindestens 100 Karten. Schwerpunkt waren die drei zuletzt
verbleibenden, bisher ungenutzten Primitive:

1. **`costChange`** (Static-Modifier auf `StaticAbility`, seit Batch 3 von
   der Engine implementiert/getestet, siehe `cost-change.test.ts`): drei
   neue Karten — ein farbloses/farbiges Paar für eigene Kostensenkung
   (`core.forgeheart-crucible`, `core.cinderforge-charm`) plus eine Karte
   für gegnerische Kostenerhöhung (`core.tariff-spire`), siehe
   Balancing-Notizen. `scope` ist bei diesem Modifier wirkungslos (nur
   `modifier.appliesTo` zählt) und wurde überall auf `{kind:"self"}`
   gesetzt, wie vom Engine-Engineer empfohlen.
2. **`scry`**: zwei Karten (`core.tidereader-oracle`, `core.moonlit-augury`),
   beide bewusst so bepreist, dass der reale Kartenwert vollständig aus dem
   jeweils anderen Effekt-Anteil stammt — scry bleibt laut Regelwerk §9.7
   ein No-Op in der Engine.
3. **`StaticAbility` mit `scope: self`/`opponentUnits`/`allUnits`**: je zwei
   Karten pro Scope (siehe Balancing-Notizen, insbesondere die sorgfältig
   gegeneinander abgewogenen `allUnits`-Paare).

Zusätzlich hat dieser Batch bei der Modellprüfung mehrere **weitere,
bisher komplett ungenutzte Primitive** identifiziert und geschlossen (nicht
Teil des expliziten Auftrags, aber im Sinne von „Nicht verwendete
Primitive sollte am Ende leer oder fast leer sein"): die Effekte
`modifyStats`, `loseLife` und `destroyPermanent`, die `AdditionalCost`-
Varianten `payLife`, `discardCards` und `removeCounters` auf aktivierten
Fähigkeiten, der `StaticAbility`-Modifier `grantKeyword`, der Counter-Typ
`minus1minus1`, sowie die TriggerConditions `onUpkeep`, `onSpellCast` und
`onDealtCombatDamageToPlayer`. Details siehe Balancing-Notizen „Batch 3"
unten. **Eine wichtige Rückmeldung ans Datenmodell/die Engine ist dabei
aufgefallen:** die TriggerCondition `onDamageReceived` wird vom
Engine-Code aktuell nirgends gefeuert (anders als die übrigen fünf
`onAttackDeclared`/`onBlockDeclared`/`onDealtCombatDamageToPlayer`/
`onUpkeep`/`onSpellCast`, die alle vollständig verdrahtet sind) — siehe
Abschnitt „Offene Fragen" unten, Punkt 6.

Die beiden Beispielkarten aus `docs/README.md` (Glutwelpe `core.ember-whelp`,
Gezeitenschelte `core.tidal-rebuke`) wurden unverändert übernommen, damit
Doku-Beispiel und tatsächlicher Kartenpool nicht auseinanderlaufen. Die
v0.2-Karten `core.inferno-surge` (X-Kosten) und `core.iron-standard`
(reine `static`-Ability auf einem Relic) sind ebenfalls unverändert.

## Übersicht

Stand nach Batch 9 (v0.12, Abschlussbatch) — **300 reguläre Karten** + 3
Token-Hilfsdefinitionen (nicht in der Tabelle, siehe v0.4-Update oben) —
das vereinbarte Zielvolumen ist erreicht. Alle Zahlen wurden vor UND nach
Batch 9 gegen den echten Code in `src/cards/starter-set.ts` nachgezählt
(nicht blind aus der bisherigen Tabelle übernommen) und stimmen exakt.
Ein zusammenfassender Rückblick über alle neun Batches findet sich im
Abschnitt „Set-Abschluss (300 Karten erreicht)" ganz unten in diesem
Dokument.

| Typ | Anzahl (Batch 1) | Anzahl (nach Batch 2) | Anzahl (nach Batch 3) | Anzahl (nach v0.6) | Anzahl (nach Batch 4 / v0.7) | Anzahl (nach Batch 5 / v0.8) | Anzahl (nach Batch 6 / v0.9) | Anzahl (nach Batch 7 / v0.10) | Anzahl (nach Batch 8 / v0.11) | Anzahl (nach Batch 9 / v0.12) | Karten |
|---|---|---|---|---|---|---|---|---|---|---|---|
| terrain | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 5 | je 1 Basis-Terrain pro Farbe (unverändert seit v0.2; bleibt bewusst fix) |
| unit | 37 | 42 | 51 | 53 | 63 | 68 | 75 | 86 | 97 | 110 | Batch 9: +13 — `trample`/tide schließt die letzte Keyword-Farb-Lücke (`core.tidesurge-crasher`), Rest liberale Wiederverwendung (Keyword+Static-Kombos, ETB-Muster, Trigger-Zweitkopien) |
| spell | 8 | 18 | 25 | 26 | 35 | 42 | 50 | 57 | 64 | 72 | Batch 9: +8 — Burn-/Lifegain-Kurven-Erweiterungen, zweite bedingungslose `exilePermanent`-Removal mit breiterem Zielsatz (`core.hollowbanish-verdict`) |
| relic | 7 | 7 | 13 | 14 | 20 | 30 | 37 | 43 | 49 | 56 | Batch 9: +7 — erster X-Kosten-`drawCards`-Sink (`core.endless-archive`), erste `firstStrike`-`ownUnits`-Anthem-Relic (`core.vanguard-standard`), Rest liberale Wiederverwendung |
| enchantment | 9 | 9 | 15 | 15 | 20 | 30 | 38 | 44 | 50 | 57 | Batch 9: +7 — erste `lifelink`-`ownUnits`-Anthem (`core.dawnhaven-covenant`), Rest liberale Wiederverwendung (Auren, Curse-Auren, Upkeep/Endstep-Trigger) |

Gesamt: 5 + 110 + 72 + 56 + 57 = 300.

Mana-Kurve der Units (gesamt, inkl. aller 9 Batches): weiterhin klar nach
unten verschoben, Batch 9 hält sich an dieselbe Kurve (1–3 Mana Schwerpunkt
bei den neuen Units, mit `core.hollowmaw-devourer`/void als einziger
Ausnahme bei 5 Mana). `core.void-assassin` (Batch 1, Kombinationskarte,
5 Mana) und `core.hollowmaw-devourer` (Batch 9, `trample`+`lifelink`-
Finisher, 5 Mana) sind zusammen die teuersten Unit-Neuzugänge im gesamten
Set. Teuerste Batch-9-Karten insgesamt sind `core.hollowmaw-devourer`
(Unit, void, 5 Mana), `core.hollowbanish-verdict` (Spell, void, 5 Mana,
breite Exile-Removal) und `core.dawnhaven-covenant` (Enchantment, light,
4 Mana, `lifelink`-Anthem) — auf ähnlichem Preisniveau wie die teuersten
Karten der Vorgänger-Batches (`core.tidebound-elegy`/`core.dawnward-
standard`/`core.emberguard-brand`/`core.tidalguard-standard`/`core.
rootwake-shrine`, je 4 Mana), keine Preis-Eskalation zum Abschluss.
Details/Balancing-Begründungen siehe „Batch 9 (v0.12) —
Balancing-Notizen".

## Batch 4 — Zielplanung (Typ- UND Farb-Ziele vor dem Kartenbau)

Vor dem Kartenbau wurde der Ist-Zustand exakt gegen `src/cards/starter-set.ts`
nachgezählt (nicht aus der bisherigen Tabelle übernommen):

**Typverteilung vor Batch 4 (113 Karten):** terrain 5 (4,4 %), unit 53
(46,9 %), spell 26 (23,0 %), relic 14 (12,4 %), enchantment 15 (13,3 %).

**Farbverteilung vor Batch 4 (99 farbige Karten aus terrain/unit/spell/
enchantment; die 14 Relics sind gemäß Design-Linie „Relics möglichst
farblos" bewusst außen vor):** flame 18 (18,2 %), tide 17 (17,2 %), wild 22
(22,2 %), light 20 (20,2 %), void 22 (22,2 %). Tide und flame waren damit
die am stärksten unterrepräsentierten Farben, wild und void am stärksten
überrepräsentiert.

**Explizite Ziele für Batch 4 (30 neue Karten):**

- **Typ-Ziele:** terrain +0 (bleibt dauerhaft bei 5 — je 1 Basis-Terrain pro
  Farbe, keine weiteren geplant), unit +10, spell +9, relic +6, enchantment
  +5. Begründung: unit lag mit 46,9 % bereits deutlich über den übrigen
  Typen; ein Batch mit unterdurchschnittlichem Unit-Anteil (33 % der
  Batch-4-Karten statt der bisherigen ~47 %) bewegt die Gesamtverteilung
  Richtung Balance, ohne so radikal umzuschichten wie die Typ-Mix-Korrektur
  in Batch 2. Enchantments (bisher der seltenste Nicht-Terrain-Typ) erhalten
  bewusst genau 5 neue Karten — ein Vertreter pro Farbe.
- **Farb-Ziele (für die 24 farbigen Batch-4-Karten aus unit/spell/
  enchantment; die 6 neuen Relics bleiben farblos):** flame +6, tide +6,
  wild +4, light +5, void +3 — die beiden unterrepräsentierten Farben
  (flame, tide) erhalten je 6 neue Karten, die beiden überrepräsentierten
  Farben (wild, void) bewusst am wenigsten (4 bzw. 3).

**Ergebnis nach Batch 4 (143 Karten gesamt, siehe Übersichtstabelle):**
Typverteilung terrain 3,5 %, unit 44,1 %, spell 24,5 %, relic 14,0 %,
enchantment 14,0 % — spürbar ausgewogener als vorher. Farbverteilung
(123 farbige Karten): flame 24 (19,5 %), tide 23 (18,7 %), wild 26 (21,1 %),
light 25 (20,3 %), void 25 (20,3 %) — alle fünf Farben liegen jetzt
innerhalb von ±1,6 Prozentpunkten des rechnerischen Idealwerts (20 %),
gegenüber einer Spanne von 18,2–22,2 % vor Batch 4.

## Batch 5 — Zielplanung (Typ- UND Farb-Ziele vor dem Kartenbau)

Vor dem Kartenbau wurde der Ist-Zustand exakt gegen `src/cards/starter-set.ts`
nachgezählt (nicht aus der bisherigen Tabelle übernommen):

**Typverteilung vor Batch 5 (143 Karten):** terrain 5 (3,5 %), unit 63
(44,1 %), spell 35 (24,5 %), relic 20 (14,0 %), enchantment 20 (14,0 %).

**Farbverteilung vor Batch 5 (123 farbige Karten aus terrain/unit/spell/
enchantment; die 20 Relics sind gemäß Design-Linie „Relics möglichst
farblos" bewusst außen vor):** flame 24 (19,5 %), tide 23 (18,7 %), wild 26
(21,1 %), light 25 (20,3 %), void 25 (20,3 %) — alle fünf Farben bereits
innerhalb von ±1,6 Prozentpunkten des Idealwerts (20 %), also keine gezielte
Korrektur mehr nötig (Auftrag: nur noch ungefähr gleichmäßiger Split).

**Explizite Ziele für Batch 5 (32 neue Karten):**

- **Typ-Ziele:** terrain +0 (bleibt dauerhaft bei 5), unit +5, spell +7,
  relic +10, enchantment +10. Begründung (Auftrag): relic und enchantment
  (je nur 14,0 % vor diesem Batch) weiter stärken, unit-Anteil (44,1 %)
  tendenziell weiter senken. Relic und enchantment erhalten mit +10 jeweils
  den größten Einzelzuwachs des Batches, unit mit +5 den kleinsten.
- **Farb-Ziele (für die 22 farbigen Batch-5-Karten aus unit/spell/
  enchantment; die 10 neuen Relics bleiben farblos):** flame +5, tide +5,
  wild +4, light +4, void +4 — ungefähr gleichmäßiger Split ohne gezielte
  Korrektur (Auftrag), da die Farbverteilung vor diesem Batch bereits nah an
  20 %/Farbe lag.
- **Designraum (Auftrag):** mehr Aura-Vielfalt (7 der 10 neuen
  Enchantments sind Auren, siehe Balancing-Notizen), zweite/dritte Kopien
  etablierter Keyword-Preispunkte in noch dünnen Farben (z. B. erste
  `firstStrike`-Karte in wild), mehr `scope:opponentUnits`/`allUnits`-Paare
  (zwei neue Paare: `core.shackleweight-idol`/`core.abyssal-undertow` für
  opponentUnits, `core.ironhide-banner`/`core.titanroot-canopy` für
  allUnits). Explizite Nutzer-Vorgabe: Karten müssen NICHT mechanisch
  einzigartig sein — Wiederverwendung bewährter Bausteine ist ausdrücklich
  erwünscht (senkt das Balance-Risiko, da bekannte Preispunkte
  wiederverwendet werden statt neue zu erfinden).

**Ergebnis nach Batch 5 (175 Karten gesamt, siehe Übersichtstabelle):**
Typverteilung terrain 2,9 %, unit 38,9 %, spell 24,0 %, relic 17,1 %,
enchantment 17,1 % — unit-Anteil sinkt weiter, relic/enchantment steigen
deutlich, spell bleibt nahezu unverändert. Farbverteilung (145 farbige
Karten aus terrain/unit/spell/enchantment): flame 29 (20,0 %), tide 28
(19,3 %), wild 30 (20,7 %), light 29 (20,0 %), void 29 (20,0 %) — alle fünf
Farben liegen jetzt innerhalb von ±0,7 Prozentpunkten des Idealwerts,
nochmals enger als nach Batch 4 (±1,6 Punkte).

## Batch 6 — Zielplanung (Typ- UND Farb-Ziele vor dem Kartenbau)

Vor dem Kartenbau wurde der Ist-Zustand exakt gegen `src/cards/starter-set.ts`
nachgezählt (nicht aus der bisherigen Tabelle übernommen):

**Typverteilung vor Batch 6 (175 Karten):** terrain 5 (2,9 %), unit 68
(38,9 %), spell 42 (24,0 %), relic 30 (17,1 %), enchantment 30 (17,1 %).

**Farbverteilung vor Batch 6 (145 farbige Karten aus terrain/unit/spell/
enchantment; die 30 Relics sind gemäß Design-Linie „Relics möglichst
farblos" bewusst außen vor):** flame 29 (20,0 %), tide 28 (19,3 %), wild 30
(20,7 %), light 29 (20,0 %), void 29 (20,0 %) — alle fünf Farben bereits
innerhalb von ±0,7 Prozentpunkten des Idealwerts, also weiterhin keine
gezielte Korrektur nötig (Auftrag: nur noch ungefähr gleichmäßiger Split).

**Explizite Ziele für Batch 6 (30 neue Karten):**

- **Typ-Ziele:** terrain +0 (bleibt dauerhaft bei 5), unit +7, spell +8,
  relic +7, enchantment +8. Begründung (Auftrag, siehe Fahrplan-Vorschlag
  aus Batch 5): unit bleibt zwar weiterhin der größte Einzeltyp, aber die
  Differenz zu spell/relic/enchantment ist inzwischen moderat — keine
  aggressive Gegensteuerung mehr nötig wie in Batch 2/4/5, stattdessen ein
  ausgeglicheneres Verhältnis (unit +6–8, spell +7–9, relic +6–8,
  enchantment +6–8 laut Empfehlung).
- **Farb-Ziele (für die 23 farbigen Batch-6-Karten aus unit/spell/
  enchantment; die 7 neuen Relics bleiben farblos):** flame +4, tide +5,
  wild +4, light +5, void +5 — ungefähr gleichmäßiger Split ohne gezielte
  Korrektur (Auftrag), passend zur bereits engen Verteilung vor diesem
  Batch (leicht mehr für tide/light/void, da flame/wild vor dem Batch
  minimal vorne bzw. minimal hinten lagen — die Differenzen sind aber so
  klein, dass jede Verteilung nahe ±1 Karte pro Farbe vertretbar gewesen
  wäre).
- **Designraum (Auftrag):** `swift` in tide/wild nachtragen (letzte nicht
  als Farbidentität dokumentierte Keyword-Lücke, siehe Keywords-Abschnitt)
  — zwei neue Karten, `core.tidewhip-skirmisher`/`core.thornrush-
  sprinter`, beide 1:1-Übernahmen bestehender Preispunkte aus anderen
  Farben. `objectKind: "any"` auf `stackObject`-Zielen (letzte unbenutzte
  `TargetSpec`-Variante) — `core.silence-veil`, ein breiterer Konter für
  Zaubersprüche UND Fähigkeiten zugleich. Subtyp-Synergien (Punkt 5 aus dem
  Batch-5-Fahrplan) bewusst NICHT angegangen (neue Regelsemantik, braucht
  vorherige Rücksprache mit dem Game-Architect). Weiterhin **liberale
  Wiederverwendung bewährter Bausteine** (Nutzer-Vorgabe bleibt gültig).

**Ergebnis nach Batch 6 (205 Karten gesamt, siehe Übersichtstabelle):**
Typverteilung terrain 2,4 %, unit 36,6 %, spell 24,4 %, relic 18,0 %,
enchantment 18,5 % — unit-Anteil sinkt weiter moderat, relic/enchantment
nähern sich weiter an unit an, spell bleibt nahezu konstant.
Farbverteilung (168 farbige Karten aus terrain/unit/spell/enchantment):
flame 33 (19,6 %), tide 33 (19,6 %), wild 34 (20,2 %), light 34 (20,2 %),
void 34 (20,2 %) — alle fünf Farben liegen weiterhin innerhalb von ±0,6
Prozentpunkten des Idealwerts, auf demselben engen Niveau wie nach Batch 5
(±0,7 Punkte).

## Batch 7 — Zielplanung (Typ- UND Farb-Ziele vor dem Kartenbau)

Vor dem Kartenbau wurde der Ist-Zustand exakt gegen `src/cards/starter-set.ts`
nachgezählt (nicht aus der bisherigen Tabelle übernommen, per Grep gegen
`type: "..."`/`cost: {...}`/`rarity: "..."`-Vorkommen).

**Typverteilung vor Batch 7 (205 Karten):** terrain 5 (2,4 %), unit 75
(36,6 %), spell 50 (24,4 %), relic 37 (18,0 %), enchantment 38 (18,5 %).

**Farbverteilung vor Batch 7 (168 farbige Karten aus terrain/unit/spell/
enchantment; die 37 Relics sind gemäß Design-Linie „Relics möglichst
farblos" bewusst außen vor):** flame 33 (19,6 %), tide 33 (19,6 %), wild 34
(20,2 %), light 34 (20,2 %), void 34 (20,2 %) — alle fünf Farben bereits
innerhalb von ±0,6 Prozentpunkten des Idealwerts, also weiterhin keine
gezielte Korrektur mehr nötig (Auftrag: normal weiterbauen, ca. proportional
zur aktuellen Verteilung).

**Explizite Ziele für Batch 7 (30 neue Karten):**

- **Typ-Ziele:** terrain +0 (bleibt dauerhaft bei 5), unit +11, spell +7,
  relic +6, enchantment +6. Begründung (Auftrag: keine aggressive Korrektur
  mehr nötig, „normal weiterbauen, ca. proportional zur aktuellen
  Verteilung"): die vier Ziel-Anteile (36,6/24,4/18,0/18,5 %) wurden auf die
  Batchgröße 30 herunterskaliert (36,6 %·30≈11, 24,4 %·30≈7, 18,0 %·30≈5,4→6,
  18,5 %·30≈5,6→6) — das Ergebnis hält die Gesamtverteilung nach dem Batch
  praktisch exakt auf demselben Stand wie davor, statt sie weiter in eine
  bestimmte Richtung zu verschieben.
- **Farb-Ziele (für die 24 farbigen Batch-7-Karten aus unit/spell/
  enchantment; die 6 neuen Relics bleiben farblos):** flame +5, tide +5,
  wild +5, light +5, void +4 — nahezu perfekt gleichmäßiger Split (Auftrag:
  weiterhin eng verteilt halten, exakt nachzählen statt Doku blind
  übernehmen), passend zur bereits sehr engen Verteilung vor diesem Batch.
- **Designraum (Auftrag/eigener Vorschlag):** drei echte Keyword-Farb-Lücken
  identifiziert und geschlossen, die — anders als die dokumentierten
  Ausnahmen bei `flame` (kein `guardian`/`reach`/`lifelink`/`deathtouch`,
  passend zu flames rein aggressiver Identität) — an keiner Stelle als
  bewusste Farbidentitäts-Entscheidung dokumentiert waren: `reach` (fehlte
  bisher bei `void`), `lifelink` (fehlte bisher bei `tide`), `deathtouch`
  (fehlte bisher bei `light`). Bei der Prüfung zusätzlich eine vierte,
  bisher unbemerkte Lücke gefunden: `airborne` fehlte bisher komplett bei
  `wild` (keine der fünf Farb-Ausnahmen erwähnt `airborne` überhaupt) — mit
  der Ergänzung deckt `airborne` jetzt als viertes Keyword nach `vigilant`/
  `firstStrike`/`swift` alle 5 Farben ab. Rarity-Balance im Blick behalten
  (Fahrplan-Vorschlag aus Batch 6, Punkt 6): dieser Batch bleibt bewusst bei
  common/uncommon, wo es sich anbietet (nur 2 von 30 Karten `rare`, siehe
  Balancing-Notizen). Subtyp-Synergien (Punkt 5 aus dem Batch-5-Fahrplan)
  weiterhin bewusst NICHT angegangen (neue Regelsemantik, braucht
  Rücksprache mit dem Game-Architect). Weiterhin **liberale Wiederverwendung
  bewährter Bausteine** (Nutzer-Vorgabe bleibt gültig) — laut Batch-6-Bericht
  gibt es keine offene Primitiv-/Kombinations-Lücke mehr im Modell, daher
  besteht dieser Batch fast vollständig aus Zweit-/Dritt-/Viertkopien
  bewährter Muster in neuen Farben/Preispunkten.

**Ergebnis nach Batch 7 (235 Karten gesamt, siehe Übersichtstabelle):**
Typverteilung terrain 2,1 %, unit 36,6 %, spell 24,3 %, relic 18,3 %,
enchantment 18,7 % — praktisch identisch zur Verteilung vor dem Batch, wie
geplant. Farbverteilung (192 farbige Karten aus terrain/unit/spell/
enchantment): flame 38 (19,8 %), tide 38 (19,8 %), wild 39 (20,3 %), light
39 (20,3 %), void 38 (19,8 %) — alle fünf Farben liegen jetzt innerhalb von
±0,5 Prozentpunkten des Idealwerts, das engste Ergebnis aller sieben Batches
bisher (Batch 6: ±0,6 Punkte). Rarity-Verteilung: 96 common/105 uncommon/34
rare (40,9 %/44,7 %/14,5 %) — der rare-Anteil sinkt erstmals seit Batch 4
wieder (Batch 6: 15,6 % → Batch 7: 14,5 %), siehe Balancing-Notizen.

## Batch 8 — Zielplanung (Typ- UND Farb-Ziele vor dem Kartenbau)

Vor dem Kartenbau wurde der Ist-Zustand exakt gegen `src/cards/starter-set.ts`
nachgezählt (nicht aus der bisherigen Tabelle übernommen, per Grep gegen
`type: "..."`/`cost: {...}`/`rarity: "..."`-Vorkommen — inkl. eines
Abgleichs gegen `src/engine/triggers.ts#fireDeathTriggers`, um die neue
`onDeath`-Semantik aus `docs/engine-status.md` v0.3.5 vor dem Kartenbau zu
verifizieren).

**Typverteilung vor Batch 8 (235 Karten):** terrain 5 (2,1 %), unit 86
(36,6 %), spell 57 (24,3 %), relic 43 (18,3 %), enchantment 44 (18,7 %).

**Farbverteilung vor Batch 8 (192 farbige Karten aus terrain/unit/spell/
enchantment; die 43 Relics sind gemäß Design-Linie „Relics möglichst
farblos" bewusst außen vor):** flame 38 (19,8 %), tide 38 (19,8 %), wild 39
(20,3 %), light 39 (20,3 %), void 38 (19,8 %) — alle fünf Farben bereits
innerhalb von ±0,5 Prozentpunkten des Idealwerts, also weiterhin keine
gezielte Korrektur mehr nötig (Auftrag: normal weiterbauen, ca. proportional
zur aktuellen Verteilung).

**Explizite Ziele für Batch 8 (30 neue Karten):**

- **Typ-Ziele:** terrain +0 (bleibt dauerhaft bei 5), unit +11, spell +7,
  relic +6, enchantment +6 — identische Verteilung wie Batch 7 (Auftrag:
  weiterhin proportional/ausgewogen weiterbauen, exakt nachzählen statt
  Doku übernehmen). Ergebnis nach dem Batch hält die Gesamtverteilung
  praktisch exakt auf demselben Stand (siehe unten).
- **Farb-Ziele (für die 24 farbigen Batch-8-Karten aus unit/spell/
  enchantment; die 6 neuen Relics bleiben farblos):** flame +5, tide +5,
  wild +4, light +4, void +6 — void erhält bewusst den größten Einzelanteil,
  da der Hauptfokus dieses Batches (onDeath-„Parting Shot"-Designs) sich
  thematisch besonders mit voids „Opfern für Wert, Tod-Trigger"-Identität
  deckt (das nicht-Unit-Enchantment-Beispiel `core.gravebound-shrine` und
  die zäheste „Removal-Magnet"-Unit `core.gravebound-oracle` sitzen beide
  in void); die übrigen vier Farben erhalten einen ungefähr gleichmäßigen
  Rest.
- **Designraum (Auftrag, Hauptfokus):** die vom Card-Designer in Batch 7 als
  „höchste Priorität" markierte, jetzt vom Game-Architect/Engine-Engineer
  bestätigt fertige `onDeath`-Freischaltung (rules-engine.md 9.15,
  engine-status.md v0.3.5) wird aktiv genutzt: fünf neue „Parting Shot"-
  Units (je eine pro Farbe) UND zwei neue Nicht-Unit-`onDeath{self}`-
  Beispiele (Relic + Enchantment, bisher komplett unbenutzt). Details siehe
  Balancing-Notizen „Batch 8". **Zweiter Schwerpunkt:** die letzten beiden
  fehlenden Keywords im `grantKeyword`-als-Effekt-Baukasten (`vigilant`,
  `guardian`) werden geschlossen — danach sind alle 9 Keywords mindestens
  einmal als temporärer Spell-/Fähigkeits-Effekt vertreten. Rarity-Balance
  im Blick behalten (Fahrplan-Vorschlag aus Batch 7): dieser Batch bleibt
  bei 3 von 30 Karten `rare` (10,0 %), unter dem Gesamtpool-Schnitt, damit
  der Gesamtanteil nicht wieder steigt. Subtyp-Synergien weiterhin bewusst
  NICHT angegangen. Weiterhin **liberale Wiederverwendung bewährter
  Bausteine** (Nutzer-Vorgabe bleibt gültig) für die übrigen, nicht auf
  `onDeath`/Keyword-Lücken fokussierten Karten dieses Batches.

**Ergebnis nach Batch 8 (265 Karten gesamt, siehe Übersichtstabelle):**
Typverteilung terrain 1,9 %, unit 36,6 %, spell 24,2 %, relic 18,5 %,
enchantment 18,9 % — praktisch identisch zur Verteilung vor dem Batch, wie
geplant. Farbverteilung (216 farbige Karten aus terrain/unit/spell/
enchantment): flame 43 (19,9 %), tide 43 (19,9 %), wild 43 (19,9 %), light
43 (19,9 %), void 44 (20,4 %) — alle fünf Farben liegen weiterhin innerhalb
von ±0,5 Prozentpunkten des Idealwerts, auf demselben engen Niveau wie nach
Batch 7. Rarity-Verteilung: 112 common/116 uncommon/37 rare (42,3 %/43,8 %/
14,0 %) — der rare-Anteil sinkt minimal weiter (Batch 7: 14,5 % → Batch 8:
14,0 %), bleibt aber praktisch auf demselben, bewusst niedrig gehaltenen
Niveau (Auftrag: „bei diesem Niveau bleiben, nicht wieder hochtreiben" —
erfüllt, siehe Balancing-Notizen).

## Batch 9 — Zielplanung (Typ- UND Farb-Ziele vor dem Kartenbau, Abschlussbatch)

Vor dem Kartenbau wurde der Ist-Zustand exakt gegen `src/cards/starter-set.ts`
nachgezählt (nicht aus der bisherigen Tabelle übernommen, per Grep gegen
`type: "..."`/`cost: {...}`/`rarity: "..."`-Vorkommen — inkl. eines
zusätzlichen Abgleichs über die farbspezifischen `cost`-Objekte auf
Zeilenebene, um Aktivierungskosten von Zielkosten sauber zu trennen).

**Typverteilung vor Batch 9 (265 Karten):** terrain 5 (1,9 %), unit 97
(36,6 %), spell 64 (24,2 %), relic 49 (18,5 %), enchantment 50 (18,9 %).

**Farbverteilung vor Batch 9 (216 farbige Karten aus terrain/unit/spell/
enchantment; die 49 Relics sind gemäß Design-Linie „Relics möglichst
farblos" bewusst außen vor):** flame 43 (19,9 %), tide 43 (19,9 %), wild 43
(19,9 %), light 43 (19,9 %), void 44 (20,4 %) — alle fünf Farben bereits
innerhalb von ±0,5 Prozentpunkten des Idealwerts, also weiterhin keine
gezielte Korrektur mehr nötig (Auftrag: normal proportional weiterbauen,
aber als Abschlussbatch die Endverteilung möglichst rund abschließen).

**Explizite Ziele für Batch 9 (35 neue Karten, exakt auf 300 Karten
gesamt):**

- **Typ-Ziele:** terrain +0 (bleibt dauerhaft bei 5), unit +13, spell +8,
  relic +7, enchantment +7 — die vier Ziel-Anteile (36,6/24,2/18,5/18,9 %)
  wurden auf die Batchgröße 35 herunterskaliert (36,6 %·35≈12,8→13,
  24,2 %·35≈8,5→8, 18,5 %·35≈6,5→7, 18,9 %·35≈6,6→7), identisch zum eigenen
  Fahrplan-Vorschlag aus Batch 8. Ergebnis nach dem Batch: terrain 5/unit
  110/spell 72/relic 56/enchantment 57 = 300, Typverteilung praktisch
  unverändert gegenüber dem Stand vor dem Batch.
- **Farb-Ziele (für die 28 farbigen Batch-9-Karten aus unit/spell/
  enchantment; die 7 neuen Relics bleiben farblos):** flame +6, tide +6,
  wild +6, light +6, void +4 — die vier Farben, die vor diesem Batch bei
  43 lagen, erhalten je 6 neue Karten (→ 49), void (bereits bei 44) erhält
  bewusst nur 4 (→ 48), damit das Set als letzter Batch mit der
  rundestmöglichen Endverteilung abschließt (vier Farben exakt gleich,
  eine Farbe genau 1 darunter, statt eine einzelne Farbe weiter
  vorauslaufen zu lassen).
- **Designraum (Auftrag/eigener Vorschlag aus dem Batch-8-Fahrplan):**
  `trample`/tide nachgetragen (`core.tidesurge-crasher`) — die letzte
  verbleibende, nicht dokumentiert ausgeschlossene Keyword-Farb-Lücke im
  gesamten Set (siehe Keywords-/Farbidentität-Abschnitt). Rarity-Balance
  im Blick behalten (Fahrplan-Vorschlag aus Batch 8): dieser Batch bleibt
  bei 5 von 35 Karten `rare` (14,3 % im Batch selbst, 14,0 % im
  Gesamtpool — exakt auf dem Batch-8-Niveau, keine weitere Steigerung).
  Subtyp-Synergien weiterhin bewusst NICHT angegangen (siehe „Set-
  Abschluss"-Abschnitt für die Einordnung als mögliche künftige
  Erweiterung). Weiterhin **liberale Wiederverwendung bewährter
  Bausteine** (Nutzer-Vorgabe, für den Abschlussbatch ausdrücklich
  nochmals bekräftigt) — praktisch der gesamte übrige Batch besteht aus
  Zweit-/Dritt-/Viertkopien etablierter Muster in neuen Farben/
  Preispunkten/Kartentypen, bewusst ohne neue Experimente.

**Ergebnis nach Batch 9 (300 Karten gesamt, siehe Übersichtstabelle):**
Typverteilung terrain 1,7 %, unit 36,7 %, spell 24,0 %, relic 18,7 %,
enchantment 19,0 % — praktisch identisch zur Verteilung vor dem Batch, wie
geplant. Farbverteilung (244 farbige Karten aus terrain/unit/spell/
enchantment): flame 49 (20,1 %), tide 49 (20,1 %), wild 49 (20,1 %), light
49 (20,1 %), void 48 (19,7 %) — vier der fünf Farben liegen exakt beim
rechnerischen Idealwert (20 %), die fünfte (void) nur 0,3 Punkte darunter;
das rundeste/engste Ergebnis aller neun Batches (Batch 7/8: ±0,5 Punkte).
Rarity-Verteilung: 129 common/129 uncommon/42 rare (43,0 %/43,0 %/14,0 %)
— der rare-Anteil bleibt exakt auf dem Batch-8-Niveau (14,0 %), wie vom
Auftrag gefordert; common und uncommon sind nach diesem Batch zufällig
exakt gleich groß (je 129 Karten). Details/Balancing-Begründungen siehe
„Batch 9 (v0.12) — Balancing-Notizen".

## Farbidentität (für spätere Erweiterung des vollen Sets)

- **flame:** Aggression, Direktschaden (fix und X-basiert), Eile (`swift`),
  Flieger (`airborne`); seit Batch 1 auch `firstStrike`/`trample` als
  aggressive Kampf-Keywords; seit Batch 7 zweite `trample`-Karte
  (`core.cinderclad-raider`) und zweite `airborne`-Karte
  (`core.cinderdrift-wing`)
- **tide:** Tempo, Karten­vorteil, Bounce, defensive Statlines; seit Batch 1
  auch `vigilant` (Tempo-Keyword par excellence), `guardian`, `reach` und
  `deathtouch` (defensive/toxische Blocker); seit Batch 6 auch `swift`
  (`core.tidewhip-skirmisher`); seit Batch 7 auch `lifelink`
  (`core.tidewell-cleric`, schließt die letzte bei tide fehlende, nicht als
  Farbidentität dokumentierte Keyword-Lücke); seit Batch 9 auch `trample`
  (`core.tidesurge-crasher`, schließt die letzte im gesamten Set
  verbliebene, nicht dokumentierte Keyword-Farb-Lücke — `trample` deckt
  damit als fünftes Keyword nach `airborne`/`vigilant`/`firstStrike`/
  `swift` alle 5 Farben ab)
- **wild:** große Körper, Zähigkeit, `reach`, Marken/Wachstum, Mana-Sinks;
  seit Batch 1 auch `vigilant`, `guardian`, `deathtouch`, `trample` und
  erstmals `lifelink` (große, heilende Bestien); seit Batch 6 auch `swift`
  (`core.thornrush-sprinter`); seit Batch 7 auch `airborne`
  (`core.sporewing-strider`, schließt eine bei der Batch-7-Prüfung entdeckte
  Lücke — `airborne` deckt damit als viertes Keyword nach `vigilant`/
  `firstStrike`/`swift` alle 5 Farben ab) und eine zweite, billigere
  `guardian`-Karte (`core.rootbound-sentinel`)
- **light:** Lebensgewinn, `lifelink`, Verteidigung, `guardian`, Exile-Removal
  (kein „billiges" destroy — teurer, dafür ohne Nachteile für den Gegner);
  seit Batch 1 auch `airborne`, `reach`, `firstStrike`, `swift` und
  `trample` (Light deckt inzwischen die meisten Keywords ab, bewusst als
  „Generalisten"-Farbe mit hohem Preis statt Nischen-Exklusivität); seit
  Batch 7 auch `deathtouch` (`core.banelight-templar`, schließt die letzte
  bei light fehlende, nicht als Farbidentität dokumentierte Keyword-Lücke)
  und eine zweite, billigere `guardian`-Karte (`core.wardlight-acolyte`)
- **void:** Opfern für Wert, Tod-Trigger, Lebensdrain, Konter; seit Batch 1
  Schwerpunktfarbe für `deathtouch` (Gift-Thematik), plus `trample`,
  `airborne`, `lifelink`, `swift` und die einzige `firstStrike`+`deathtouch`-
  Kombinationskarte im Set (`core.void-assassin`); seit Batch 3 auch
  `guardian` (untote Wächter-Flavor) und `minus1minus1`-Marken (Fäulnis);
  seit Batch 7 auch `reach` (`core.hollowreach-stalker`, schließt die letzte
  bei void fehlende, nicht als Farbidentität dokumentierte Keyword-Lücke)

Batch 3 hat außerdem gezielt die letzten Lücken der etablierten Keyword-
Verteilung geschlossen: `vigilant` deckt jetzt alle 5 Farben ab (zuletzt
fehlend: light, `core.sunlit-vigil`), `guardian` alle Farben außer flame
(zuletzt fehlend: void, `core.gravebound-warden` — flame bleibt bewusst
ohne guardian, passend zu seiner rein aggressiven Identität), und tide
erhält mit `core.tideshard-rogue` seine erste `airborne`-Karte. Batch 6
schließt mit `swift` in tide/wild (`core.tidewhip-skirmisher`/`core.
thornrush-sprinter`) die letzte verbliebene, nicht als Farbidentität
dokumentierte `swift`-Lücke. Batch 7 schließt drei weitere, ebenfalls nicht
dokumentierte Keyword-Farb-Lücken (`reach`/void, `lifelink`/tide,
`deathtouch`/light) sowie eine vierte, erst bei der Batch-7-Prüfung
entdeckte Lücke (`airborne`/wild) — `guardian`/flame bleibt weiterhin die
einzige bewusste, dauerhafte Ausnahme (siehe Keywords-Abschnitt).
`trample`/tide ist nach Batch 7 die letzte verbleibende, NICHT dokumentiert
ausgeschlossene Keyword-Farb-Lücke im gesamten Set (Kandidat für Batch 8,
siehe Fahrplan-Vorschlag).

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
Kein Statline-Change nötig. War in v0.2 bewusst konservativ die einzige
guardian-Karte im Set (erster Praxistest der finalen Regel) — seit Batch 1
(v0.3) kommen zwei weitere guardian-Karten in anderen Farben dazu, siehe
Notiz „guardian-Trio" weiter unten.

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

### Batch 1 (v0.3, Phase B) — Balancing-Notizen

**guardian-Trio: core.temple-sentinel (light, 4 Mana, 2/5) / core.bramblehide-sentinel
(wild, 3 Mana, 2/4 — HINWEIS: nach dem Balance-Pass „Balance-Korrektur nach
empirischer Prüfung" unten korrigiert auf 2/3) / core.harbor-warden (tide,
2 Mana, 1/5).**
`core.temple-sentinel` ist nicht mehr die einzige guardian-Karte im Set.
Alle drei folgen derselben Skalenlogik: Toughness bleibt hoch (4–5), Power
bleibt niedrig (1–2) — pro Kostenpunkt weniger Mana, desto niedriger auch
die Power, nie umgekehrt. Grund: Guardian zwingt zum Blocken, sofern legal
(Abschnitt 6) — eine hohe Power auf einer billigen Guardian-Karte würde die
erzwungene Blockpflicht in einen unverhältnismäßig günstigen Vorteil
verwandeln (der Verteidiger bekäme quasi-kostenlos einen großen Trade). Mit
power-armen Statlines bleibt Guardian das, was der Game-Architect
beschrieben hat: „auf defensiven Statlines praktisch kein Nachteil" — nie
ein versteckter Vorteil.

**deathtouch-Preispunkte: core.thicket-fang (wild, 1 Mana, 1/1) vs.
core.grave-viper (void, 2 Mana, 2/1) vs. core.abyssal-lurker (tide, 2 Mana, 1/2).**
Drei unterschiedliche Ausprägungen desselben Keywords: reiner
1-Mana-Abschreckungskörper (wild, minimal möglich), aggressive
2-Power-Variante (void, passt zur Void-Identität „Value durch Risiko"), und
eine zähere 2-Toughness-Variante (tide, passt zur „defensive Statlines"-
Identität). Da deathtouch die „letale Menge" unabhängig von der Power auf 1
senkt (rules-engine.md 6d(3)), ist die Power einer deathtouch-Kreatur fast
nebensächlich für ihren Kampfwert — die drei Karten differenzieren sich
bewusst über Toughness/Mana statt über Power, um Powercreep bei diesem
Keyword von vornherein zu vermeiden.

**firstStrike-Symmetriepaar: core.ash-duelist (flame) / core.dawnblade-adept (light),
beide 2 Mana, 2/2.**
Bewusst identische Statline in zwei Farben, um firstStrike einen
farbunabhängigen Referenzpreis zu geben (analog zum Vanilla-Referenzwert
von core.cinder-pup/core.tide-scout/core.grove-calf für reine Körper).
`core.riftfin-duelist` (tide, 2 Mana, 1/3) zeigt die defensive Variante
desselben Preispunkts — gleiche Manakosten, aber Power-für-Toughness
getauscht, passend zu tides defensiver Identität.

**trample-Quartett: core.wildfire-boar (flame, 3 Mana, 3/3) / core.overgrowth-colossus
(wild, 5 Mana, 5/5 — HINWEIS: nach dem Balance-Pass „Balance-Korrektur nach
empirischer Prüfung" unten korrigiert auf 5/4) / core.sunforged-colossus (light,
5 Mana, 4/5) / core.hollow-ravager (void, 4 Mana, 4/3).**
Alle vier bleiben bei annähernd Vanilla-Statlines für ihre Kosten (kein
zusätzlicher Malus, kein Bonus) — trample allein ist im Vergleich zu den
neuen firstStrike-/deathtouch-Karten das am wenigsten swingy Keyword ohne
Block (nur im Angriff relevant, und nur, wenn der Verteidiger überhaupt
blockt), daher rechtfertigt es keinen nennenswerten Stat-Abzug auf einer
Einzelkarte. Die einzige Ausnahme ist die Kombination mit deathtouch
(siehe `core.void-assassin` unten) — dort schlägt praktisch die gesamte
Power durch, was die Karte extra teuer macht.

**core.void-assassin (void, 5 Mana `{generic:3,void:2}`, 1/1, `firstStrike`+`deathtouch`, rare).**
Einzige Kombinationskarte des Batches und bewusst die einzige im ganzen
Set, die zwei der drei „gefährlichen" Kombinationen aus
rules-engine.md 6d(4) vereint. Mit firstStrike+deathtouch tötet die
Assassine praktisch jeden Blocker/Angreifer bereits in der frühen
Schadensrunde, bevor dieser zurückschlagen kann (6d(4): „Der Träger tötet
bereits in der frühen Runde … das Opfer schlägt in der regulären Runde
nicht mehr zurück") — das ist unabhängig von der eigenen Power, solange sie
> 0 ist. Um diese Stärke nicht zusätzlich mit einem großen Körper zu
multiplizieren, bleibt die Statline auf dem absoluten Minimum (1/1): Die
Karte bringt keinerlei Stat-Mehrwert über die Kombo hinaus und stirbt an
jedem Schaden, jeder Verzauberung mit negativem Stat-Modifier oder jedem
regulären Removal, *bevor* sie überhaupt kämpft. Als Ausgleich für diese
Fragilität kostet sie 5 Mana (teuerster reiner Combat-Keyword-Träger im
Set) und ist `rare` — vergleichbar mit `core.banishment-rite` als Premium-
Interaktionskarte statt Stats-Payoff. **Ausdrücklich nicht verwendet:**
`trample`+`deathtouch` (die laut Game-Architect stärkste der drei
Kombinationen, „fast die gesamte Power schlägt durch") wurde in diesem
Batch komplett gemieden, um keine zweite Hochrisiko-Kombinationskarte auf
einmal ins Set zu bringen; falls in einem späteren Batch gewünscht, sollte
sie noch teurer/seltener als `core.void-assassin` bepreist werden.

**core.wardstone-idol (Relic, 2 generisches Mana, `static` ownUnits +0/+1)
vs. core.iron-standard (Relic, 3 generisches Mana, +1/+0).**
Bewusstes Gegenstück-Paar: reine Toughness- statt reiner Power-Anthem,
einen Mana-Punkt billiger. Toughness-Boni sind in diesem Regelwerk
tendenziell defensiv wertvoller (überleben Removal-Damage, verbessern
Blocks, sind aber offensiv wirkungslos) — der Preisunterschied bildet
diesen Trade-off ab, ohne dass eines der beiden Relics das andere strikt
dominiert.

**core.mantle-of-thorns (Aura, wild, `{generic:1,wild:1}`, +2/+1) vs.
core.blessing-of-steadfastness (Aura, light, `{generic:1,light:1}`, +1/+2).**
Gleicher Stat-Gesamtwert (3), gleiche Kosten, entgegengesetzte Verteilung —
Power-lastig in wild (aggressive Identität), Toughness-lastig in light
(defensive Identität). Klarer Vergleichsfall für zukünftige Auren: bei
identischem Gesamtwert und identischen Kosten sollte die Verteilung
konsequent der Farbidentität folgen statt zufällig zu variieren.

**core.healing-light (Spell, light, `{generic:1,light:1}`, fast, 4 Leben,
kein `targets`-Array).**
Erster Spell im Set, der komplett ohne Zielwahl auskommt (nur der fixe
Empfänger `"controller"`) — das Muster war seit v0.2 als regulärer Fall
bestätigt (`TargetSpec`-Kommentar), wurde bisher aber nur auf Fähigkeiten
von Permanents genutzt (`core.soul-drainer`, ETB-Trigger), nicht auf einem
eigenständigen Spell. Keine Modelllücke, nur die erste tatsächliche
Nutzung dieses schon lange bestätigten Falls für `SpellCard`.

**core.soul-siphon (Spell, void, `{generic:1,void:1}`, fast, 2 Schaden an
Ziel + 2 Leben für den Controller).**
Instant-Speed-Bruder von `core.soul-drainer`s Opfer-Fähigkeit (identische
Werte 2/2), mischt aber gezielten Effekt (`{ target: 0 }`) und fixen
Empfänger (`"controller"`) in derselben Effektliste — ebenfalls kein neues
Primitiv, nur eine bisher ungenutzte Kombination zweier längst bestätigter
Muster. Balancing: kostet echtes Mana statt eines Opfers, kann dafür flexibel
eine Unit statt zwingend den Spieler treffen — fairer Alternativweg zum
selben Value, kein strikt besseres Werkzeug als soul-drainer (unterschiedliche
Ressourcen: Mana vs. Karte-im-Spiel).

### Batch 2 (v0.4, Phase B) — Balancing-Notizen

**createToken-Symmetriepaar: core.seedling-swarm (wild, 2 Mana, 2× 1/1
Sprössling) / core.grave-legion (void, 2 Mana, 2× 1/1 Gebeinknecht).**
Analog zum firstStrike-Symmetriepaar aus Batch 1 (`core.ash-duelist`/
`core.dawnblade-adept`): identischer Preispunkt und identische Statline in
zwei Farben, um `createToken` einen farbunabhängigen Referenzpreis zu
geben — 2 Mana für zwei 1/1-Körper (Gesamtstatline 2/2 über zwei Objekte),
`slow`, da reiner Board-Aufbau ohne Interaktionswert. Alle folgenden
Token-Karten im Set sollten sich an diesem Referenzwert messen.

**grantKeyword-als-Effekt-Quartett: core.reckless-charge (flame, 1 Mana,
swift) / core.wings-of-dawn (light, 2 Mana, airborne) / core.bramble-surge
(wild, 1 Mana, trample) / core.venom-brand (void, 2 Mana, deathtouch).**
Vier Combat-Tricks, die ausschließlich ein Keyword bis Zugende verleihen
(kein Stat-Bonus) — bewusst nach Keyword-Stärke gestaffelt: `swift`/
`trample` (nur situativ relevant, siehe trample-Quartett-Notiz aus Batch 1)
kosten 1 Mana, `airborne` (garantierte Evasion) und `deathtouch`
(garantierter Trade unabhängig von Stats, stärkster der vier) kosten 2
Mana. `core.venom-brand` ist zusätzlich `uncommon` statt `common`, da ein
temporärer deathtouch-Trick kombinatorisch dieselbe Gefährlichkeit wie
`core.void-assassin` (6d(4)) auslösen kann, nur zeitlich begrenzt statt
dauerhaft.

**tapPermanent/untapPermanent als Effekt: core.riptide-snare (tide-Spell,
gegnerische Unit tappen) / core.second-wind (light-Spell, eigene Unit
enttappen) / core.chain-manacles (farbloses Relic, wiederholbares Tappen)
/ core.tidebind-courser (tide-Unit, ETB tappt eine gegnerische Unit).**
Vier Varianten desselben Primitivs über drei Kartentypen (Spell, Relic,
Unit-ETB) hinweg, um zu zeigen, dass `tapPermanent`/`untapPermanent` als
Effekt unabhängig vom Trägertyp funktioniert. Preislogik: ein einmaliges
Tappen kostet 2 Mana als Spell (`core.riptide-snare`) oder ist Teil eines
unterdurchschnittlichen ETB-Körpers (`core.tidebind-courser`, 2/2 für 3
Mana, analog zu `core.ember-whelp`s „Body + Einmal-Value"-Muster);
wiederholtes Tappen über ein Relic (`core.chain-manacles`) kostet dafür pro
Aktivierung eigenes Mana + Tap der Quelle, damit es kein strikt besseres
Dauerwerkzeug als der einmalige Spell wird. `core.second-wind` (Enttappen)
ist bewusst am billigsten (1 Mana), da Enttappen nur situativ nützlich ist
(Blocker retten, Tap-Fähigkeit doppelt nutzen) und kein Removal-Ersatz.

**removeCounters: core.wither-touch (tide-Spell, entfernt bis zu 2
+1/+1-Marken) / core.corrosive-clamp (farbloses Relic, wiederholbar).**
Erste direkte Antwort im Pool auf +1/+1-Marken-Strategien
(`core.grove-elder`, neu auch `core.moss-elder` und `core.growth-totem`).
Bewusst in `tide` statt `void` eingeordnet (Erosions-Flavor statt
Todes-Flavor) und als `uncommon` bepreist, da situativ stark (gegen
counter-lastige Decks) aber tot in der Hand gegen alle anderen. Das
farblose Relic-Gegenstück folgt der etablierten „farblos aber teurer/ohne
Sofort-Wirkung"-Logik (Aktivierungskosten {2}+Tap statt einmalig 2 Mana).

**discardCards als Effekt: core.mind-rot (void-Spell, einmalig, `random`)
/ core.grasping-shadows (void-Enchantment, wiederkehrend, `random`).**
Beide nutzen `random: true`, weil die Engine keinen Entscheidungskanal für
den abwerfenden Spieler kennt (`effects.ts`: ohne `random` wird
deterministisch `hand[0]` abgeworfen, was keine echte Wahl wäre) — als
Karte reformuliert also konsequent „wirft eine **zufällig bestimmte**
Karte ab" statt „wirft eine Karte deiner Wahl ab". `core.grasping-shadows`
(wiederkehrend, 5 Mana, `rare`) ist die teuerste und laut Einschätzung
stärkste Karte des Batches — unbeantwortbare, sich selbst wiederholende
Ressourcenerosion ohne laufende Zusatzkosten nach dem Cast, vergleichbar in
der Kategorie „Rare-Enchantment-Engine" mit `core.wildgrowth-field` und
`core.verdant-return`.

**Curse-Auren (neues Muster): core.rootrot-curse (wild, -1/-2) /
core.riptide-shackles (tide, -2/-1).**
Erste Auren im Set, die sich auf eine **gegnerische** statt eigene Unit
legen (`auraTarget` mit `controller: "opponent"` — bereits vom Datenmodell
gedeckt, keine neue Modellanforderung). Gleicher Gesamtwert (-3) wie das
bestehende Buff-Aura-Trio (`core.blessing-of-steadfastness` +1/+2,
`core.mantle-of-thorns` +2/+1, `core.brand-of-fury` +3/+0), hier als
Debuff mit entgegengesetzter Verteilung (Toughness- vs. Power-fokussiert),
identischer Preis (2 Mana). Pseudo-Removal gegen kleine Kreaturen, aber
klar billiger und schwächer als das bedingungslose `core.banishment-rite`
(4 Mana, echtes Exile) — verdrängt es nicht, sondern deckt eine andere
Nische (schwächt statt entfernt, trifft auch große Kreaturen situativ).

**Relic-Quartett (farblos, „schwächer/teurer als farbiges Äquivalent"):
core.chain-manacles, core.corrosive-clamp, core.growth-totem,
core.warforged-standard.**
Alle vier folgen der seit Batch 1 etablierten Design-Linie „Relics
möglichst farblos" und der in den v0.2/v0.3-Notizen begründeten Trade-off-
Logik (`core.iron-standard` vs. `core.wildgrowth-field`): `core.growth-totem`
ist die farblose, teurere Version von `core.grove-elder`s Marken-Fähigkeit
(kein eigener Körper); `core.warforged-standard` ist die farblose, teurere
Version von `core.wildgrowth-field`s +1/+1-Anthem (4 statt 3 Mana, kein
Farbzwang). `core.chain-manacles`/`core.corrosive-clamp` haben keine
farbigen Pendants auf Permanents (nur die einmaligen Spells
`core.riptide-snare`/`core.wither-touch`), tragen den Trade-off stattdessen
über wiederkehrende Aktivierungskosten statt über einen höheren Cast-Preis.

**Typ-Mix-Korrektur — Ergebnis.** Batch 1: 37/56 Units (66 %). Nach Batch 2:
42/81 Units (52 %), 18/81 Spells (22 %), 7/81 Relics (9 %), 9/81
Enchantments (11 %), 5/81 Terrains (6 %). Deutlich ausgewogener; sollte ein
Batch 3 nochmals stark unit-lastig werden, träte die Schieflage wieder auf
— Empfehlung: auch künftige Batches mit explizitem Typ-Ziel planen statt
Units als Standardfall zu behandeln.

### Batch 3 (v0.5, Phase B, letzter Batch) — Balancing-Notizen

**`costChange`-Trio: core.forgeheart-crucible (Relic, farblos, {4},
ownSpells -1) / core.cinderforge-charm (Enchantment, flame, {2}{Flamme},
ownSpells -1) / core.tariff-spire (Enchantment, tide, {2}{Flut},
opponentSpells +1).** Die beiden ownSpells-Karten folgen der etablierten
„farblos&teurer vs. farbig&billiger"-Logik (analog `core.iron-standard` vs.
`core.wildgrowth-field`). Wichtig für die Bepreisung: `computeSpellCostDelta`
wirkt auf ALLES, was der Controller über `castSpell` spielt — nicht nur auf
Karten vom Typ `spell`, sondern auch auf Units/Relics/Enchantments. Eine
Kostensenkung um {1} generisch ist dadurch ein sehr breiter, deckweiter
Beschleuniger (vergleichbar mit einem Manastein, aber ohne eigene
Tap-Fähigkeit und rückwirkend auf die ganze Hand), daher rare und mit 3–4
Mana bepreist statt in der 1–2-Mana-Range üblicher „billiger" Utility-
Karten. `core.tariff-spire` (Kostenerhöhung für den Gegner) ist symmetrisch
dazu ein reines Prison-Werkzeug ohne Boardimpact — eingestuft wie
`core.grasping-shadows` (teure, langfristig wirkende rare-Engine).

**`scope:self`-Trio: core.emberborn-sprinter (flame, `grantKeyword`-
Modifier statt fester KeywordAbility) / core.stoneguard-paragon (wild,
`stats`-Modifier isoliert) / core.sunward-vanguard (light, `stats`-Modifier
kombiniert mit einer echten KeywordAbility).** Alle drei sind bewusst
mechanisch/balancetechnisch ununterscheidbar von einer Karte, die den
Bonus direkt in die gedruckten Werte einrechnen würde (z. B. wäre
`core.stoneguard-paragon` mit einer StaticAbility scope:self +1/+1 auf
gedruckten 2/3-Basiswerten exakt gleichwertig zu einer gedruckten 3/4 ohne
Fähigkeit — HINWEIS: die Basiswerte wurden im Balance-Pass „Balance-
Korrektur nach empirischer Prüfung" unten auf 2/2 korrigiert, effektiv also
3/3 statt 3/4). Der Wert dieser drei Karten liegt daher primär in der
Modell-Abdeckung (der Game-Architect hatte `scope:self` bisher nur bei
Auren `attachedTo` und Anthems `ownUnits` im Pool bestätigt, nie isoliert
auf einer eigenen Einheit) — für zukünftige Batches ist `scope:self` erst
dann eine ECHTE Design-Achse (statt Druckkosmetik), sobald der
Effekt-Katalog konditionale/dynamische Modifier erlaubt (z. B. „Power
gleich Anzahl Marken auf dieser Karte") — aktuell unterstützt `StaticAbility.
modifier.stats` nur feste Zahlen, keine `Amount`-Ausdrücke.

**`scope:opponentUnits`-Paar: core.dominion-collar (Relic, farblos, {3},
-0/-1) / core.blightmire-shroud (Enchantment, void, {2}{Leere}{Leere},
-1/-1).** Klassisches farblos/farbig-Paar. Wichtig für die Bepreisung:
Anders als eine Curse-Aura (`core.rootrot-curse`/`core.riptide-shackles`,
die genau EINE gegnerische Einheit trifft und mit deren Tod/Bounce
verschwindet) wirkt `scope:opponentUnits` **kontinuierlich auf alle
gegnerischen Einheiten, einschließlich zukünftig gespielter** — der Effekt
„verbraucht" sich nicht. Das macht ihn strukturell mit einem dauerhaften,
nicht mehr entfernbaren Mini-Wrath vergleichbar und rechtfertigt die im
Vergleich zu einer einzelnen Curse-Aura klar höheren Kosten (3–4 Mana statt
2) trotz „nur" -1 Toughness/Power pro Einheit.

**`scope:allUnits`-Paar (mit besonders sorgfältiger Begründung, wie vom
Game-Architect verlangt): core.warhorn-standard (Relic, farblos, {2},
+1/+0 allUnits) / core.ashfall-plague (Enchantment, flame, {2}{Flamme}
{Flamme}, -1/-1 allUnits).** Dies ist die einzige Scope-Kategorie, die
explizit BEIDE Spieler gleichermaßen trifft, und damit die
balancetechnisch heikelste:
- `core.warhorn-standard` (+1/+0 für alle) ist bewusst **billiger** als das
  strukturell ähnliche `core.iron-standard` (ownUnits, +1/+0, {3}), weil
  der Effekt dem Gegner denselben Vorteil verschafft. Er ist nur dann
  netto positiv für den Controller, wenn dieser mehr oder wichtigere
  Einheiten auf dem Feld hat als der Gegner — ein „Wide-Board"-Payoff, kein
  bedingungsloser Anthem. Bei 2 Mana ist das Risiko (den Gegner
  mitzubuffen, falls das Board umschlägt) durch die niedrigen Kosten
  gedeckt.
- `core.ashfall-plague` (-1/-1 für alle) ist **stärker als ein einmaliger
  Board-Wipe**, weil sie kontinuierlich wirkt: nicht nur bereits im Spiel
  befindliche 1-Toughness-Einheiten sterben beim Einsatz (SBA), sondern
  JEDE künftig gespielte 1-Toughness-Einheit beider Spieler kommt bereits
  tot zur Welt bzw. muss die Verzauberung erst überleben. Bewusst in
  `flame` statt einer Kontroll-/defensiven Farbe verortet („verbrannte
  Erde" — passend zu flames rücksichtsloser, auch die eigenen kleinen
  Kreaturen treffenden Identität) und mit {2}{Flamme}{Flamme} (4 Mana)
  klar teurer als `core.blightmire-shroud` (asymmetrisch, nur Gegner,
  gleiche Kosten) bepreist — obwohl asymmetrische Effekte für den
  Controller strukturell wertvoller sind als symmetrische, gleicht der
  „trifft auch mich"-Nachteil von `core.ashfall-plague` das ungefähr aus,
  weshalb beide trotz unterschiedlicher Symmetrie auf demselben Preispunkt
  (4 Mana, rare) landen. Sollte sich in Playtests zeigen, dass die
  Symmetrie zu wenig Downside erzeugt (z. B. weil aggressive Decks mit
  hoher Toughness pro Einheit den Nachteil kaum spüren), ist eine Erhöhung
  auf {3}{Flamme}{Flamme} (5 Mana) die empfohlene erste Korrektur.

**`scry`-Paar: core.tidereader-oracle (tide, Unit, ETB) / core.moonlit-
augury (wild, Spell).** Beide folgen strikt der Vorgabe „kein Kernwert an
scry hängen": `core.tidereader-oracle` ist mit 2/2 für 2 Mana eine reine
Vanilla-Statline (kein Bonus für den ETB-Trigger, der aktuell nichts tut);
`core.moonlit-augury` gewinnt nur 2 Leben für 2 Mana (deutlich schwächer als
`core.healing-light`s 4 Leben für denselben Preis). Sollte scry in einer
späteren Engine-Version implementiert werden, sind beide Karten dann leicht
unterbepreist für ihren neuen Effektumfang — das ist beabsichtigt (Puffer
für zukünftigen Mehrwert statt eine Neubepreisung im Nachhinein nötig zu
machen).

**`minus1minus1`-Paar: core.rot-touched-stalker (void, Unit, ETB -1/-1 auf
Gegner-Einheit) / core.rootbane-wither (wild, Spell, -2/-2 auf beliebige
Einheit).** Erste tatsächliche Nutzung des Counter-Typs im Pool (Engine
berechnet ihn seit Batch 2 mit, siehe `stats.ts`). Wichtiger
Rules-Unterschied zu den bestehenden Curse-Auren: `minus1minus1`-Marken
hängen an keinem zerstörbaren Anlege-Objekt (kein Bounce-die-Aura-Trick),
sind aber auch NICHT durch `core.wither-touch`/`core.corrosive-clamp`
entfernbar (die entfernen ausschließlich `counterType: "plus1plus1"`) —
strukturell also dauerhafter als eine Curse-Aura, aber (noch) ohne
gezielte Antwort im Pool. `core.rootbane-wither` (-2/-2 für 2 Mana) ist
dadurch effektiv permanentes Pseudo-Removal gegen alles mit ≤ 2 Toughness,
vergleichbar mit `core.doomreap-edict`s Trefferbereich, aber ohne
Farbwechsel zu void — bewusst eine Preisstufe (uncommon statt common)
über den reinen Buff-Spells derselben Kostenklasse eingeordnet.

**`modifyStats`-Paar: core.blazing-frenzy (flame, +2/+0 endOfTurn) /
core.aegis-ward (light, +0/+3 endOfTurn).** Erste Nutzung des Effekts im
Pool überhaupt — bisher wurden alle temporären Buffs entweder über
`grantKeyword` (Keyword-Tricks) oder `addCounters` (permanent) dargestellt,
ein reiner Zahlen-Trick fehlte. Folgen demselben Offense/Defense-Verteil­
ungsmuster wie die bestehenden Buff-Auren (`core.mantle-of-thorns` vs.
`core.blessing-of-steadfastness`), hier als Instant-Trick statt Dauer-Aura:
`core.aegis-ward`s Gesamtwert (3) liegt bewusst über `core.blazing-frenzy`s
(2), da ein reiner Verteidigungs-Trick (rettet vor Removal/Combat-Trades,
aber gewinnt selten selbst einen Kampf) im Zweifel weniger tempokritisch
ist als ein Offense-Trick und daher etwas mehr Rohwert verträgt, ohne
das Kräfteverhältnis zu kippen.

**`loseLife`: core.hexbind-lash (void, {Leere}, 2 Lebenspunkte Verlust,
reiner Spieler-Effekt).** Erste Nutzung im Pool. Der entscheidende
Rules-Unterschied zu `core.fire-jolt` (2 Schaden an EIN BELIEBIGES Ziel,
gleicher Preis): `loseLife` ist kein „Schaden" im Sinne des Regelwerks —
löst weder eine deathtouch-Markierung noch lifelink beim Verursacher aus
und kann durch keine schadensbezogene Interaktion (Prevention-Effekte,
falls das Set solche später bekommt) abgefangen werden. Dafür ist das Ziel
fest auf den Gegner-Spieler beschränkt (keine Units treffbar). Beide
Eigenschaften heben sich gegenseitig ungefähr auf, daher identischer Preis.

**`destroyPermanent`: core.doomreap-edict (void, Spell, {2}{Leere}, slow) /
core.gravetide-obelisk (Relic, farblos, wiederholbar, zielt auf
Relic/Enchantment/Terrain).** `core.doomreap-edict` ist die erste
„echte" Destroy-Karte im Set (bisher war `core.banishment-rite` mit
`exilePermanent` die einzige harte Entfernung) — bewusst BILLIGER (3 statt
4 Mana) bepreist, weil destroy anders als exile Tod-Trigger des Ziels
zulässt (z. B. lässt `core.husk-crawler` beim destroy eine Karte für den
GEGNER ziehen) und mit potenziellen Rückhol-/Recursion-Effekten
interagierbar bleibt — der Preisunterschied zu exile ist damit inhaltlich
begründet, nicht nur Zahlenkosmetik. `core.gravetide-obelisk` schließt
zusätzlich eine echte Pool-Lücke: vorher gab es KEINE Möglichkeit,
gegnerische Relics/Enchantments/Terrains zu entfernen (alle bisherigen
Entfernungskarten zielen ausschließlich auf Units).

**AdditionalCost-Trio: core.soulforged-censer (Relic, farblos, `payLife`
2 + Tap: ziehe 1 Karte) / core.wraithbound-ledger (Relic, farblos, {1} +
`discardCards` 1: ziehe 2 Karten) / core.thornwarden-ascetic (wild, Unit,
ETB-Marker + `removeCounters` 1 als Aktivierungskosten: 2 Schaden).** Alle
drei AdditionalCost-Varianten waren zuvor nur als Effekt genutzt (z. B.
`discardCards` bei `core.mind-rot`), nie als Bezahlung für eine aktivierte
Fähigkeit — obwohl die Engine sie bereits vollständig validiert und
ausführt (`actions.ts`). `discardCards` als Kosten wirft dabei
deterministisch die oberste Handkarte ab (kein Auswahlkanal für den
zahlenden Spieler, analog zur `random`-Einschränkung bei `discardCards`
als Effekt) — Kartentext entsprechend präzise formuliert („die oberste
Karte", nicht „eine Karte deiner Wahl").

**Trigger-Ausbau: core.tideshard-rogue (`onDealtCombatDamageToPlayer`) /
core.dawnrise-sanctuary (`onUpkeep`) / core.warding-thorns (`onSpellCast`).**
Alle drei TriggerConditions waren zuvor nirgends im Pool vertreten, obwohl
vollständig in der Engine verdrahtet (`combat.ts`/`turn.ts`/`triggers.ts`
wurden vor der Kartenerstellung geprüft). Wichtiger Hinweis bei
`onSpellCast`: ohne `spellSpeed`-Einschränkung feuert die Bedingung bei
JEDER nicht-Terrain-Karte, die der betroffene Spieler castet — nicht nur
bei Karten vom Typ `spell` — analog zur breiten Wirkung von `costChange`.
`core.warding-thorns` ist deshalb trotz moderater Kosten (3 Mana) als rare
statt uncommon eingestuft.

**Bewusst NICHT verwendet in Batch 3: `onDamageReceived` (TriggerCondition).**
Beim systematischen Abgleich aller `TriggerCondition`-Varianten gegen den
Engine-Code wurde in Batch 3 festgestellt, dass `onDamageReceived` — anders
als die fünf oben genannten und bereits genutzten Trigger — an keiner Stelle
im Engine-Code gefeuert wurde. `core.thornwarden-ascetic` wurde deshalb
bewusst so gebaut, dass sie ausschließlich auf bereits bestätigt
funktionierenden Bausteinen (ETB + `removeCounters`-Aktivierungskosten)
beruht. Siehe Rückmeldung an Game-Architect/Engine-Engineer in „Offene
Fragen" Punkt 6. **Update v0.6:** Der Game-Architect hat den Trigger mit
rules-engine.md v0.3 (Entscheidung 9.10) verdrahtet und freigegeben —
`core.thornrage-boar` ist die erste Testkarte dafür, siehe Balancing-Notiz
im Abschnitt „v0.6-Batch" unten.

### v0.6-Batch (Modell-Update, rules-engine.md v0.3) — Balancing-Notizen

**Modal-Effekte: `core.void-covenant` (void, Spell, 3 Modi) /
`core.current-diplomat` (tide, Unit, modale ETB-TriggeredAbility).**
Erste Nutzung von `modes` im Pool (Entscheidung 9.13). `core.void-covenant`
demonstriert die spieler-initiierte Variante (`chosenMode` als Teil der
`castSpell`-Aktion, keine Decision): 3 Modi, davon Modus 1 mit eigenem
Zielslot (`{ kind: "unitOrPlayer" }`) und Modi 2/3 ganz ohne Ziele — deckt
damit beide in 9.13 verlangten Fälle auf einer Karte ab. Preisgebend war der
teuerste Einzelmodus (Modus 2 entspricht inhaltlich `core.mind-rot`, dort 2
Mana als `slow`-Spell) plus ein kleiner Flexibilitätsaufschlag, da bei
Modal-Karten nie mehr als ein Modus gleichzeitig zum Zug kommt (kein
additiver Wert). `core.current-diplomat` demonstriert die
Engine-initiierte Variante (neue `PendingDecision` „chooseMode" beim
Stacken einer `TriggeredAbility`): Modus 1 (Karte ziehen) hat keine Ziele
und ist immer wählbar, Modus 2 (gegnerische Kreatur tappen) braucht ein
gegnerisches Ziel — kontrolliert einen Angreifer/Verteidiger ohne Kreaturen,
ist nur Modus 1 wählbar und wird laut 9.13 ohne Nachfrage automatisch
gewählt (Auto-Pick-Fall). Beide Karten tragen einen unterdurchschnittlichen
Körper/Preis-Malus gegenüber dem jeweils stärkeren Einzelmodus als
Fixkarte, um die Wahlfreiheit selbst nicht zusätzlich zu vergüten (siehe
Kartenkommentare in `starter-set.ts` für die konkreten Vergleichskarten).

**`onDamageReceived`: `core.thornrage-boar` (wild, 2/3 für 3 Mana,
Vergeltung 2 Schaden an die Schadensquelle).** Erste Nutzung des seit v0.3
verdrahteten Triggers (Entscheidung 9.10). Nutzt `EffectRecipient
"eventSubject"` — bei diesem Trigger laut Modell die Schadensquelle, NICHT
die eigene Instanz (Abweichung von den übrigen Self-Combat-Triggern, siehe
Kommentar an `TriggerCondition` in `abilities.ts`) — für ein klassisches
Vergeltungsdesign: jede Schadensinstanz gegen den Keiler (Kampf- oder
Effekt-Schaden, jede Instanz einzeln getriggert) schlägt mit 2 Schaden
zurück. Ausdrücklich **kein Token-Design** (Architekt-Vorgabe 9.10 Punkt 4:
Token-Quellen mit diesem Trigger würden beim eigenen Tod vor dem Stacken
durch SBA 7 gelöscht und der Trigger verpuffte wirkungslos) — eine reguläre,
dauerhaft im Pool referenzierbare Kartendefinition. Statline bewusst unter
`core.thornback-warden` (ursprünglich 2/4 `reach`, derselbe Preis 3 Mana):
`reach` ist rein defensiv und nur gegen Flieger relevant, die Vergeltung
hier trifft dagegen JEDE Schadensquelle inklusive Brand-Spells und ist damit
ein deutlich breiterer Deterrent — der Abzug auf 2/3 gleicht das aus.
HINWEIS: `core.thornback-warden` wurde im Balance-Pass „Balance-Korrektur
nach empirischer Prüfung" (unten) ebenfalls auf 2/3 korrigiert — beide
Karten liegen seither auf derselben Statline, siehe dort.

**X-Kosten auf aktivierten Fähigkeiten: `core.cinderwrack-engine`
(farbloses Relic, {4} Cast, `{X}, Tappe: X Schaden an ein Ziel`).** Erste
Nutzung von `chosenX` an einer `activateAbility` (Entscheidung 9.12, vorher
nur auf Spells wie `core.inferno-surge` erlaubt). Bewusst als wiederholbarer
Mana-Sink (durch die Tap-Kosten auf 1×/Zug begrenzt) statt Einmaleffekt
konzipiert — das macht die Karte über ein langes Spiel potenziell zu einem
eigenständigen Win-Condition-Motor, daher deutlich teurer im Cast als
`core.inferno-surge` ({4} generisch statt {Flamme}) und als `rare`
eingestuft, analog zu anderen deckweit/langfristig wirkenden
Rare-Engines (`core.forgeheart-crucible`, `core.grasping-shadows`). Farblos
gemäß der Design-Linie „Relics möglichst farblos". Kein Konflikt mit dem
Mana-Fähigkeit-Verbot aus 9.12: Die Fähigkeit hat Ziele und geht über den
Stack, ist also keine Mana-Fähigkeit.

**Modellabgleich, kein Konflikt gefunden.** Vor dem Kartenbau wurden
`src/model/abilities.ts`/`cards.ts`/`game-state.ts` gegen rules-engine.md
v0.3 geprüft: `EffectMode`/`modes` auf `SpellCard` und `TriggeredAbility`,
`EffectRecipient "eventSubject"` und `ManaCost.x` auf `ActivatedAbility`
existierten exakt wie im Regeltext beschrieben — keine Rückmeldung an den
Game-Architect nötig.

### Batch 4 (v0.7, erster Batch Richtung 300 Karten) — Balancing-Notizen

**`onAttackDeclared`/`onBlockDeclared`-Paar: `core.raidhorn-berserker`
(flame, 2 Mana, 2/2, 1 Schaden an den Gegner bei jeder Angriffsdeklaration)
/ `core.wardflame-sentinel` (light, 3 Mana, 1/4, 2 Leben bei jeder
Block-Deklaration).** Erste Nutzung beider TriggerConditions im Pool
(Engine verdrahtet seit `combat.ts`, siehe `fireSelfCombatTrigger` —
bereits in Batch 3 als Kandidat für einen künftigen Batch vorgeschlagen).
Wichtiger Unterschied zu `onDealtCombatDamageToPlayer`
(`core.tideshard-rogue`): `onAttackDeclared` feuert bereits beim
Deklarieren, unabhängig davon, ob der Angriff geblockt wird oder
durchkommt — daher garantierter, aber kleinerer Wert (1 Schaden statt
Kartenziehen) und ein unterdurchschnittlicher Körper (2/2 für 3 Mana,
schwächer als `core.storm-strider`s 3/2 `swift` zum gleichen Preis).
`onBlockDeclared` ist das erste Blocker-seitige Gegenstück im Pool
überhaupt — auf einem hohen Toughness-Körper (1/4) passend zu lights
defensiver Identität, da die Karte aktiv als Blocker eingesetzt werden
muss, um Wert zu erzeugen (kein Angriffs-Payoff).

**`modifyStats`/`grantKeyword` mit `duration: "permanent"`:
`core.moltenscale-graft` (flame, 2 Mana, +2/+0 permanent) / `core.aegis-
oath` (light, 3 Mana, +0/+3 permanent) / `core.rootbound-mark` (wild, 3
Mana, permanentes Trample) / `core.foundry-anvil` (Relic, {2}+Tap:
+1/+0 permanent).** Erste Nutzung der `"permanent"`-Variante beider
Effekt-Primitive (bisher nur `"endOfTurn"`: `core.blazing-frenzy`/
`core.aegis-ward`/die fünf `grantKeyword`-Tricks aus Batch 2/3). Neu
etablierte, einfache Preisregel für zukünftige Batches: **die permanente
Variante kostet gegenüber der `endOfTurn`-Variante bei sonst identischem
Effekt +1 Mana** (`core.blazing-frenzy` 1 Mana → `core.moltenscale-graft`
2 Mana; `core.aegis-ward` 2 Mana → `core.aegis-oath` 3 Mana;
`core.bramble-surge` 1 Mana → `core.rootbound-mark` 3 Mana — Trample ist
als stärkstes/am längsten wirksames der `grantKeyword`-Tricks mit +2 statt
+1 bepreist, da ein permanenter Trample-Grant über viele Kämpfe hinweg
wirkt, ein einmaliger Stat-Trick dagegen nur einen Kampf betrifft).
`core.foundry-anvil` ist das `modifyStats`-permanent-Gegenstück zu
`core.growth-totem` (+1/+1-Marker-Sink): schwächer pro Aktivierung
(+1/+0 statt +1/+1) UND zusätzlich Tap-gebunden (max. 1×/Zug, `growth-
totem` hat keine Tap-Kosten), dafür NICHT durch `removeCounters`
entfernbar, da kein Marker-Objekt entsteht — echter Trade-off, kein
strikt besseres/schlechteres Werkzeug.

**Zwei-Zielslot-Paar: `core.twin-cinder` (flame, 2 Mana, 2× 1 Schaden auf
bis zu zwei Ziele) / `core.riptide-purge` (tide, 4 Mana, 2× Bounce auf bis
zu zwei gegnerische Kreaturen).** Erste Nutzung von zwei unabhängigen
`targets`-Slots auf einem Spell im Pool (das Datenmodell unterstützt
beliebig viele Slots seit v0.1, bisher nutzte jede Karte höchstens einen).
Beide Karten skalieren den jeweiligen Referenzeffekt linear auf Kosten der
Effizienz: `core.twin-cinder` verdoppelt `core.fire-jolt`s Preis (1 → 2
Mana) für denselben Gesamtschaden (2), gewinnt aber die Flexibilität,
zwei kleine Ziele zu treffen statt eines; `core.riptide-purge` verdoppelt
`core.tidal-rebuke`s Preis (2 → 4 Mana) für einen zweiten Bounce, ist dafür
— anders als `tidal-rebuke` — auf gegnerische Kreaturen beschränkt (kein
„any target"). Dieses Skalierungsmuster (doppelter Effekt, doppelter
Preis, Zielbeschränkung als zusätzlicher Malus bei Bounce) ist ein
brauchbarer Referenzpunkt für künftige Mehrfach-Ziel-Karten.

**`costChange` auf einer Unit: `core.tithehall-warden` (light, 3 Mana, 1/2,
eigene Zaubersprüche −{1} generisch).** Erste Nutzung dieses Modifiers auf
einer Kreatur statt Relic/Enchantment (`core.forgeheart-crucible`,
`core.cinderforge-charm`). Gleicher Preis wie das farbige Enchantment-
Pendant (`core.cinderforge-charm`, 3 Mana), aber auf einem sehr
zerbrechlichen Körper (1/2) statt einer Enchantment — die Karte stirbt an
jedem Removal oder Combat-Trade, während eine Enchantment nur durch
dedizierte Permanent-Entfernung (`core.gravetide-obelisk`-artig)
angreifbar ist. Als `rare` eingestuft wie beide bestehenden
`costChange`-Träger, da der Effekt selbst (deckweite Kostensenkung) trotz
der Fragilität weiterhin sehr stark ist, sobald die Karte auch nur eine
Runde überlebt.

**Kombination Static+Activated auf einem Relic: `core.wardsteel-bastion`
(farblos, 4 Mana, `ownUnits` +0/+1 statt eines statischen Effekts UND
{1}+Tap: gegnerische Kreatur tappen).** Vereint mechanisch
`core.wardstone-idol` (2 Mana, +0/+1) und `core.chain-manacles` (2 Mana,
{1}+Tap: Tap-Effekt) auf einer Karte — bisher hatte jedes Relic entweder
eine `StaticAbility` ODER eine `ActivatedAbility`, nie beides. Preis ist
nicht rein additiv (2+2=4 wäre der Summenpreis der Einzelkarten), sondern
zusätzlich als `rare` statt `uncommon` eingestuft, um die
Konsolidierungs-Prämie abzubilden (ein Kartenslot und ein Permanent
erledigen die Arbeit von zweien).

**`modes` auf einer `ActivatedAbility`: `core.myriad-cog` (farblos, 4 Mana,
{2}+Tap: wähle eins — Karte ziehen / 2 Schaden / 3 Leben).** Erste Nutzung
von `modes` außerhalb von `SpellCard`/`TriggeredAbility` (`core.void-
covenant`, `core.current-diplomat`) — das Modell erlaubt `modes` explizit
auch auf `ActivatedAbility` (siehe Kommentar in `abilities.ts`), war aber
bisher nicht demonstriert. Da die Wahlfreiheit hier WIEDERHOLBAR ist
(anders als ein einmaliger modaler Spell), ist die Karte wie
`core.cinderwrack-engine` (ebenfalls ein wiederholbarer Mana-Sink) hoch im
Cast bepreist und `rare` — ein Spieler bekommt jede Runde erneut den
jeweils besten der drei Effekte, was über ein langes Spiel kumulativ sehr
stark ist.

**Fünf Enchantments, ein Vertreter pro Farbe (Zielplanung, siehe oben):
`core.ashborn-brand` (flame, `onUpkeep`+Schaden) / `core.tidebound-archive`
(tide, `onSpellCast`+`scry`) / `core.wildseed-grove` (wild, `onEndStep`+
`addCounters`) / `core.sanctified-remains` (light, `onUnitDied`+`gainLife`)
/ `core.witherplague-shrine` (void, `onUnitDied`+`loseLife`).** Alle fünf
kombinieren einen bereits im Pool etablierten Trigger mit einem für diesen
Trigger neuen Effekt-Partner (bisher: `onUpkeep`→`gainLife`,
`onSpellCast`→`dealDamage`, `onEndStep`→`discardCards`,
`onUnitDied`→`createToken`). `core.witherplague-shrine` verdient besondere
Erwähnung: sie bestraft den Gegner für JEDEN Verlust einer eigenen
Kreatur (Kampf, eigenes Opfer, gegnerisches Removal) über `loseLife`, ohne
`eventSubject` zu benötigen — das Ziel des Effekts (`opponent`) ist
relativ zum Controller der Fähigkeit, nicht an das gestorbene Objekt
gebunden, was die unter „Nicht verwendete DSL-Primitive" dokumentierte
offene `eventSubject`-Frage bei `onUnitDied` umgeht. Eingestuft wie
`core.warding-thorns` (gleicher Preispunkt, gleiche Breite/Häufigkeit des
Auslösens, gleiche Rarity).

**Rarity-Verteilung des Batches (30 Karten): 9 common, 15 uncommon, 6
rare.** Bewusst etwas uncommon-lastiger als der Gesamtpool (davor: 59
common/40 uncommon/14 rare unter 113 Karten, also ca. 52 %/35 %/12 %),
da der Auftrag „neue Kombinationen bestehender Bausteine" fast per
Definition Karten erzeugt, die über der reinen Vanilla-plus-Keyword-Stufe
liegen. Nach Batch 4 liegt der Gesamtpool bei 68 common/55 uncommon/20 rare
(143 Karten, ca. 47,6 %/38,5 %/14,0 %) — die Verschiebung ist moderat und
kein Balancing-Risiko, da keine der neuen `rare`-Karten eine bestehende
Referenzkarte strikt dominiert (jede hat eine dokumentierte Vergleichskarte
mit klarem Trade-off, siehe oben).

### Batch 5 (v0.8) — Balancing-Notizen

**Zweitkopien bereits bewährter Trigger-Kombinationen: `core.cinderlash-
brute` (flame, `onDamageReceived`) / `core.tideshell-warden` (tide,
`onBlockDeclared`) / `core.hollowmarch-reaver` (void, `onAttackDeclared`).**
Alle drei sind explizit erwünschte Zweitkopien bereits etablierter Batch-4-
Muster (`core.thornrage-boar`, `core.wardflame-sentinel`,
`core.raidhorn-berserker`), jeweils leicht abgeschwächt/anders bepreist:
`core.cinderlash-brute` tauscht Statline und Vergeltungsstärke gegenüber
`core.thornrage-boar` (3/2 + 1 Schaden statt 2/3 + 2 Schaden, gleicher
Preis); `core.tideshell-warden` skaliert `core.wardflame-sentinel`s Muster
nach unten (2 statt 3 Mana, 1/3 statt 1/4, 1 statt 2 Leben pro Block);
`core.hollowmarch-reaver` überträgt `core.raidhorn-berserker`s Muster nach
void, aber über `loseLife` statt `dealDamage` (kein Schaden im Regelsinn —
löst weder deathtouch noch lifelink beim Verursacher aus, siehe
`core.hexbind-lash`), bei identischem Preis/Statline/Swing-Wert (1 Punkt).

**Erste `firstStrike`-Karte in wild: `core.thornviper-skirmisher`.**
Vor diesem Batch deckte `firstStrike` vier der fünf Farben ab (flame, tide,
light, void) — anders als bei `guardian`/`reach`/`lifelink`/`deathtouch` in
flame ist diese Lücke in wild an keiner Stelle als bewusste
Farbidentitäts-Entscheidung dokumentiert, daher unproblematisch zu
schließen. Identische Statline wie `core.riftfin-duelist` (tide, 1/3, 2
Mana) — bewusste 1:1-Übernahme des etablierten defensiven
`firstStrike`-Preispunkts in eine neue Farbe, wie von der Nutzer-Vorgabe
für diesen Batch ausdrücklich gewünscht.

**Dritte `StaticAbility scope:self` + KeywordAbility-Kombination:
`core.dawnfeather-scout` (light, airborne + statisches +0/+1).** Reiht sich
neben `core.sunward-vanguard` (light, lifelink+Stats) und
`core.thornhide-brawler` (wild, trample+Stats) ein; mechanisch/
balancetechnisch weiterhin reine Druckkosmetik (siehe Batch-3-Notiz zu
`scope:self`), hier zur Modell-Abdeckung mit einem dritten Keyword
demonstriert.

**Sechster `grantKeyword`-Effekt-Trick: `core.blessed-vigor` (light,
lifelink, 2 Mana).** Komplettiert das Set der Einmal-Tricks um das letzte
noch fehlende der neun Keywords (nach swift/airborne/trample/deathtouch/
firstStrike/reach). Gleicher Preispunkt wie `core.wings-of-dawn`/
`core.venom-brand` (2 Mana), da ein garantierter Lifelink-Schwung vor dem
Kampf ähnlich situativ stark ist wie Evasion oder ein garantierter Trade.

**Vierter `modifyStats`-endOfTurn-Trick: `core.wildheart-surge` (wild,
+2/+1, 2 Mana).** Schließt wild als letzte fehlende Farbe dieses seit Batch
3 etablierten Musters (flame +2/+0, light +0/+3, tide +1/+2) — Gesamtwert 3
wie die tide-Variante, aggressiverer Split passend zu wilds Statlinien-
Identität.

**Brand-Kurve geschlossen: `core.scorch-bolt` (flame, 3 Mana, 4 Schaden).**
Füllt die Lücke zwischen `core.flame-lance` (2 Mana, 3 Schaden) und
`core.cataclysm-brand` (4 Mana, 5 Schaden) exakt auf der linearen
„+1 Schaden pro +1 Mana"-Kurve, die die Burn-Karten des Sets bereits
verfolgen (`core.fire-jolt` 1/2 eingeschlossen).

**Erste Nutzung von `TargetSpec { kind: "stackObject", objectKind:
"ability" }`: `core.silence-ward` (void, 1 Mana).** Bisher nutzte nur
`core.silence-ban` (2 Mana) `objectKind: "spell"` — das Modell erlaubt
`"ability"` und `"any"` explizit, war aber nie demonstriert. Kontert
ausschließlich aktivierte/getriggerte Fähigkeiten auf dem Stack, keine
Zaubersprüche — der engere Anwendungsbereich rechtfertigt den niedrigeren
Preis gegenüber `core.silence-ban`.

**Aura-Vielfalt-Schwerpunkt: fünf neue Auren mit `StaticAbility`-Modifier
`grantKeyword` und `scope:"attachedTo"` (bisher war `grantKeyword` nur mit
`scope:"self"` demonstriert, `core.emberborn-sprinter`): `core.emberclad-
brand` (flame, firstStrike), `core.tidewarden-sigil` (tide, vigilant),
`core.thornclad-ward` (wild, trample), `core.sanctum-ward` (light,
guardian), `core.soulbound-embrace` (void, lifelink).** Preislich an den
bestehenden Stat-Buff-Auren orientiert (`core.blessing-of-steadfastness`
u. a., 2 Mana für einen Gesamtwert von 3 „permanent, solange die Aura
hält"): ein permanent verliehenes, relevantes Keyword ist ungefähr
gleichwertig zu diesem Referenzwert, daher identischer Preis (2 Mana),
identische Rarity-Einordnung (uncommon, eine Stufe über den reinen
common-Stat-Auren, da ein Keyword tendenziell swingier ist als reine
Stat-Punkte). Wichtig für die Preislogik: Diese permanente-aber-fragile
Variante liegt bewusst zwischen dem `endOfTurn`-Effekt-Trick (1 Kampf,
günstiger) und dem unentfernbaren `duration:"permanent"`-Spell-Effekt
(dauerhaft, +1–2 Mana teurer, siehe Batch-4-Preisregel) — eine Aura bleibt
wirksam, bis sie entfernt wird (aktuell nur über `core.gravetide-
obelisk`-artige Enchantment-Entfernung möglich, sonst kaum beantwortbar),
ist aber im Gegensatz zum Spell-Effekt an ein eigenes, angreifbares
Permanent-Objekt gebunden. `core.soulbound-embrace` schließt zusammen mit
`core.hollowcurse-brand` (siehe unten) außerdem voids vollständigen
Aura-Fehlbestand (void hatte vor diesem Batch KEINE einzige Aura im Pool,
nur globale Enchantments).

**Curse-Aura-Quartett vervollständigt: `core.ashbound-curse` (flame,
-0/-3) / `core.hollowcurse-brand` (void, -3/-0).** Ergänzen das bestehende
Curse-Aura-Paar (`core.rootrot-curse`, wild, -1/-2; `core.riptide-shackles`,
tide, -2/-1) um die beiden fehlenden Extrempunkte derselben
Gesamtwert-(-3)/Preis-(2 Mana)-Klasse. `light` bleibt bewusst ohne
Curse-Aura, passend zu seiner Identität ohne „Fluch"-Thematik (Light nutzt
stattdessen teureres, aber sauberes Exile-Removal, `core.banishment-rite`).

**Zwei neue scope:opponentUnits/allUnits-Paare (farblos/farbig):
`core.shackleweight-idol` (Relic, -1/-0, 3 Mana) / `core.abyssal-undertow`
(Enchantment, tide, -2/-0, 4 Mana) für opponentUnits; `core.ironhide-
banner` (Relic, +0/+1, 2 Mana) / `core.titanroot-canopy` (Enchantment,
wild, +1/+1, 2 Mana) für allUnits.** Erstere folgen der etablierten
„farblos&schwächer vs. farbig&stärker"-Logik 1:1 (Vergleich `core.dominion-
collar`/`core.blightmire-shroud`). Bei Letzterem war eine Preiskorrektur
nötig: Eine reine Anwendung der ownUnits→allUnits-„-1 Mana"-Logik
(`core.iron-standard` 3 → `core.warhorn-standard` 2) auf `core.wildgrowth-
field`s ownUnits-+1/+1-Preis (3 Mana, rare) ergibt für die symmetrische
`allUnits`-Variante 2 Mana — WICHTIG: Anders als bei Debuffs (wo
symmetrische und asymmetrische Effekte laut der `core.ashfall-plague`-Notiz
gleich teuer sind, weil sich Stärke-Bonus und „trifft auch mich"-Malus
ungefähr aufheben) gilt diese Gleichheit bei reinen Buffs NICHT: Ein
symmetrischer Buff ist strukturell strikt schwächer als derselbe Buff nur
für die eigene Seite (kein kompensierender „Wipe-Bonus" wie bei Debuffs),
muss also günstiger UND niedriger eingestuft sein als sein einseitiges
Äquivalent, sonst wäre er ein dominierter Fall. `core.titanroot-canopy`
landet daher bei 2 Mana/uncommon statt bei `core.wildgrowth-field`s 3
Mana/rare — eine wichtige Klarstellung für zukünftige Batches, falls
weitere symmetrische Buff-Varianten gebaut werden.

**Erste `grantKeyword`-Anthem mit `scope:"ownUnits"`: `core.skywatch-
lattice` (Relic, farblos, 3 Mana, reach für alle eigenen Kreaturen).**
Bisher war `grantKeyword` nur mit `scope:"self"` (isoliert auf einer
Kreatur) demonstriert — diese Kombination mit `scope:"ownUnits"` verleiht
das Keyword ALLEN eigenen Kreaturen gleichzeitig und ist damit potenziell
deutlich stärker als ein einzelner Keyword-Grant. Bewusst mit `reach`
(schwächstes/am wenigsten swingy Keyword des Sets) als erste Testkarte
dieser neuen Kombination erprobt, um das Risiko einer Überbewertung gering
zu halten — stärkere Keywords (z. B. `deathtouch`/`firstStrike` als
ownUnits-Anthem) sollten in künftigen Batches erst nach Praxiserfahrung mit
diesem ersten, konservativen Fall gebaut werden.

**Zweiter X-Kosten-Mana-Sink: `core.wellhoard-forge` (Relic, farblos, 4
Mana Cast, `{X}, Tappe: X +1/+1-Marker`).** Direktes Gegenstück zu
`core.cinderwrack-engine` (X Schaden) — da +1/+1-Marker dauerhaft sind
(anders als Einmalschaden), aber jederzeit durch `removeCounters`-Antworten
(`core.wither-touch`, `core.corrosive-clamp`, neu auch `core.wardglow-
censer` s.u.) neutralisierbar bleiben, wird derselbe Cast-Preis/dieselbe
Rarity wie beim Schadens-Pendant als angemessen eingeschätzt.

**Erste direkte Antwort auf `minus1minus1`-Marken: `core.wardglow-censer`
(Relic, farblos, 2 Mana, `{2}, Tappe: entferne bis zu zwei -1/-1-Marken`).**
Schließt eine seit Batch 3 dokumentierte echte Pool-Lücke (`core.wither-
touch`/`core.corrosive-clamp` entfernen ausschließlich `plus1plus1`-Marken,
für `minus1minus1` gab es bisher KEINE Antwort im Pool). Direktes
Gegenstück zu `core.corrosive-clamp` (identischer Preis/identische
Aktivierungskosten), nur für den anderen Counter-Typ.

**Zwei weitere Static+Activated-Konsolidierungs-Relics: `core.ironforge-
loom` (+1/+0 ownUnits + {1}+Tap: Karte ziehen) — zweite Karte dieses Musters
nach `core.wardsteel-bastion` (Batch 4).** Gleicher Preis/gleiche Rarity (4
Mana, rare) wie `core.wardsteel-bastion`, da dieselbe
Konsolidierungs-Prämien-Logik gilt (ein Kartenslot/Permanent erledigt die
Arbeit von zweien).

**Rarity-Verteilung des Batches (32 Karten): 10 common, 18 uncommon, 4
rare.** Erneut etwas uncommon-lastiger als der Gesamtpool (davor: 68
common/55 uncommon/20 rare unter 143 Karten, ca. 47,6 %/38,5 %/14,0 %) —
gleiche Begründung wie in Batch 4: neue Kombinationen bestehender
Bausteine liegen fast per Definition über der reinen Vanilla-Stufe. Nach
Batch 5 liegt der Gesamtpool bei 78 common/73 uncommon/24 rare (175 Karten,
ca. 44,6 %/41,7 %/13,7 %) — die Verschiebung bleibt moderat, keine der
neuen `rare`-Karten dominiert eine bestehende Referenzkarte strikt (jede
hat eine dokumentierte Vergleichskarte mit klarem Trade-off, siehe oben).

### Batch 6 (v0.9) — Balancing-Notizen

**`swift` in tide/wild: `core.tidewhip-skirmisher` (tide, 1 Mana, 1/1) /
`core.thornrush-sprinter` (wild, 2 Mana, 2/1).** Letzte im Fahrplan
benannte, nicht als Farbidentität dokumentierte Keyword-Farb-Lücke (siehe
Keywords-Abschnitt). Beide sind bewusste 1:1-Übernahmen bestehender
Preispunkte in neue Farben (`core.emberpaw-cub`/flame bzw. `core.zealous-
vanguard`/light) — dieselbe Logik wie die firstStrike-Farb-Lücke in Batch 5
(`core.thornviper-skirmisher`).

**Vierte Farbe für das `createToken`-ETB-Body-Muster: `core.tidespawn-
caller` (tide, 3 Mana, 1/3 + Lichtgeist-Token) / `core.grimspawn-
channeler` (void, 3 Mana, 2/1 + Gebeinknecht-Token).** Nach `core.
cinderwing-fledgling` (flame) und `core.aureate-caller` (light) jetzt die
dritte und vierte Farbe dieses seit Batch 2/4 etablierten Musters (Body
unter Vanilla-Rate + zusätzlicher 1/1-Token). `core.tidespawn-caller`
verteilt denselben Statgesamtwert (4) defensiver (1/3 statt 2/2), passend
zu tides Identität; `core.grimspawn-channeler` übernimmt `core.cinderwing-
fledglings` aggressive 2/1-Verteilung unverändert, nur der erzeugte
Token-Typ ändert sich (Gebeinknecht statt Lichtgeist, passend zu voids
Untoten-Thematik). Wild bleibt als einzige Farbe ohne eigenen Vertreter
dieses Musters (hat stattdessen `createToken` bereits als Spell,
`core.seedling-swarm`) — Kandidat für einen künftigen Batch, falls
gewünscht.

**Dritte Kopien von `onDamageReceived`/`onBlockDeclared`: `core.lucent-
retaliator` (light, 3 Mana, 1/4, Vergeltung 1 Schaden) / `core.thornbound-
guard` (wild, 3 Mana, 1/4, `onBlockDeclared` → `addCounters` statt
`gainLife`).** `core.lucent-retaliator` ist die dritte Vergeltungskarte
nach `core.thornrage-boar` (wild) und `core.cinderlash-brute` (flame) —
gleicher Preis, schwächste Statline/Vergeltung der drei Karten, passend zu
lights bereits sehr dichter Keyword-Abdeckung. `core.thornbound-guard`
kombiniert `onBlockDeclared` erstmals mit `addCounters` statt `gainLife`
(bisher core.wardflame-sentinel/core.tideshell-warden) — eine dauerhaft
wachsende Blockerin statt Lebensgewinn, passend zu wilds Wachstumsthema;
da der Marker dauerhaft ist (nicht nur `endOfTurn`), auf demselben
Preispunkt wie `core.wardflame-sentinel` (3 Mana, 1/4) eingestuft statt
billiger. HINWEIS: `core.thornbound-guard` wurde im Balance-Pass „Balance-
Korrektur nach empirischer Prüfung" unten auf 1/3 korrigiert und weicht
seither bewusst von `core.wardflame-sentinel` ab (siehe dort).

**Zweites Zwei-Zielslot-Paar: `core.doubletide-snare` (tide, 3 Mana,
2× `tapPermanent` auf gegnerische Kreaturen) / `core.twinroot-blessing`
(wild, 2 Mana, 2× `addCounters` +1/+1 auf eigene Kreaturen).** Nach
`core.twin-cinder`/`core.riptide-purge` (Batch 4) die zweite Anwendung des
„zwei unabhängige Zielslots"-Musters auf neue Effekte. Wichtige
Preis-Nuance gegenüber der bisherigen „doppelter Effekt, doppelter Preis"-
Regel: `core.doubletide-snare` verdoppelt `core.riptide-snares`
Tap-Effekt NICHT auf den vollen doppelten Preis (4 statt 3 Mana), da ein
Tap nur eine Runde wirkt (schwächer als ein Bounce, der den Gegner zum
erneuten Casten zwingt) — die Effizienzverschlechterung fällt bei einem
ohnehin schwächeren Effekt geringer aus. `core.twinroot-blessing` folgt
dagegen exakt der etablierten Regel (2 Mana für 2 Marker, wie `core.twin-
cinder` 2 Mana für 2 Schaden).

**`duration:"permanent"`-Zweitkopien: `core.emberstride-brand` (flame,
swift permanent, 2 Mana) / `core.tidalbound-growth` (tide, +1/+2
permanent, 3 Mana) / `core.aureate-wings` (light, airborne permanent,
3 Mana).** Alle drei folgen der seit Batch 4 etablierten „+1 Mana
gegenüber der `endOfTurn`-Variante"-Regel — mit einer Ausnahme:
`core.aureate-wings` (airborne) bekommt wie `core.rootbound-mark`
(trample) einen Aufschlag von +2 statt +1 Mana (`core.wings-of-dawn`,
2 Mana → 3 Mana hier wäre nach der Standardregel schon +1, was zufällig
mit dem Trample-Aufschlag zusammenfällt): dauerhafte Evasion ist
strukturell stärker als ein dauerhafter Stat-/Trample-Bonus, da sie nicht
durch bloße Blocker-Zahl neutralisiert werden kann — dieselbe Einstufung
wie bei `core.rootbound-mark` in Batch 4.

**Letzte unbenutzte `TargetSpec`-Variante: `core.silence-veil` (void,
3 Mana, `stackObject` `objectKind:"any"`).** Konteret sowohl
Zaubersprüche (`core.silence-ban`, 2 Mana) als auch aktivierte/getriggerte
Fähigkeiten (`core.silence-ward`, 1 Mana) — der breiteste und daher
teuerste und einzige `rare` Konter im Set. Schließt den Abschnitt „Nicht
verwendete DSL-Primitive" bis auf die eine, bereits beantwortete
Modellfrage (`eventSubject`/`onUnitDied`, siehe „Offene Fragen").

**Zweites `costChange`-Farbtrio: `core.leaden-toll` (Relic, farblos, {4},
opponentSpells +1) / `core.tidecraft-charm` (Enchantment, tide, {2}{Flut},
ownSpells -1) / `core.voidtoll-shrine` (Enchantment, void, {2}{Leere},
opponentSpells +1).** Erweitert das bestehende `costChange`-Trio aus
Batch 3 (`core.forgeheart-crucible`/`core.cinderforge-charm`/`core.
tariff-spire`) um drei weitere Farb-/Typ-Kombinationen desselben Preis-
und Rarity-Musters (farblos/farbig, jeweils {3}–{4} Mana, durchgehend
`rare`, da der Effekt deckweit auf ALLES wirkt, was der betroffene
Spieler über `castSpell` spielt — nicht nur Karten vom Typ `spell`, siehe
Balancing-Notiz Batch 3).

**Dritte Static+Activated-Konsolidierungskarte: `core.bastion-forgeworks`
(Relic, farblos, {4}, +0/+1 ownUnits + {1}+Tap: Tap-Effekt).** Identisch
im Aufbau zu `core.wardsteel-bastion` (Batch 4) und `core.ironforge-loom`
(Batch 5) — dieselbe Konsolidierungs-Prämien-Logik (4 Mana, rare), dritte
Karte dieses inzwischen etablierten Musters.

**Farbige `grantKeyword`-`ownUnits`-Anthem-Paare: `core.wildroot-banner`
(Enchantment, wild, {1}{Wild}, vigilant) / `core.sunwatch-canopy`
(Enchantment, light, {1}{Licht}, reach).** Erste farbige Gegenstücke zu
`core.skywatch-lattice` (Relic, farblos, {3}, reach ownUnits, Batch 5) —
dieselbe „farbig&billiger vs. farblos&teurer"-Logik wie bei den
Stats-Anthems. `core.sunwatch-canopy` verleiht identisch `reach` (direktes
farbiges Pendant), `core.wildroot-banner` testet stattdessen ein zweites
Keyword (`vigilant`) für diese Kombination — weiterhin bewusst ein
vergleichsweise „ungefährliches" Keyword (kein sofortiger Board-Wipe-
Charakter), analog zur in Batch 5 begründeten Vorsicht bei dieser noch
jungen Anthem-Kombination.

**Sechste Keyword-Aura: `core.witherfang-veil` (void, {1}{Leere},
deathtouch).** Nach den fünf Batch-5-Auren (firstStrike/vigilant/trample/
guardian/lifelink) die erste mit `deathtouch` — passend zu voids
Signatur-Keyword. Gleicher Preis/gleiche Rarity (2 Mana, uncommon) wie die
übrigen fünf.

**Zweites `onUnitDied`-Punisher-Enchantment: `core.ashclaim-shrine`
(flame, 3 Mana, `dealDamage` statt `loseLife`).** Gegenstück zu `core.
witherplague-shrine` (void, Batch 4) auf derselben Preis-/Rarity-Stufe (3
Mana, rare) — bestätigt denselben Referenzwert für „bestraft den Gegner
für jeden eigenen Einheitentod" unabhängig vom konkreten Straf-Effekt
(Schaden vs. Lebensverlust sind laut den Balancing-Notizen zu `core.
hexbind-lash` ungefähr gleichwertig).

**Neues `onUpkeep`/`onEndStep`-Effekt-Paar: `core.dawnwell-archive`
(light, `onUpkeep` + `drawCards`, 5 Mana, rare) / `core.hollowdusk-shrine`
(void, `onEndStep` + `loseLife`, 3 Mana, rare).** `core.dawnwell-archive`
ist die teuerste Karte des Batches und die erste im Set mit
unbedingtem, wiederkehrendem Kartenvorteil ohne laufende Zusatzkosten —
bewusst auf demselben Preisniveau wie `core.grasping-shadows`/`core.
tidereave-current` eingestuft, da ein garantierter Karten-pro-Zug-Vorteil
über ein langes Spiel strukturell mindestens ebenso stark ist wie die
beiden etablierten Top-Rares. `core.hollowdusk-shrine` ist dagegen
moderat eingestuft (3 Mana, wie `core.ashborn-brand`), da `loseLife`
anders als unbedingtes Kartenziehen die Ressourcenbasis des Gegners nicht
verändert, nur seine Uhr verkürzt (siehe Balancing-Notiz zu `core.
hexbind-lash`).

**Wichtige Modell-Beobachtung (kein Blocker, bewusst gemieden): `onDeath`
ist de facto ein Unit-only-Trigger.** Bei der Prüfung, ob ein
„parting shot"-Enchantment (feuert, wenn dieses Enchantment selbst
zerstört wird, über `onDeath`/`what:"self"`) baubar wäre, ergab der
Abgleich gegen den Engine-Code: `src/engine/sba.ts` filtert die
SBA-3/4-Sterbeschleife explizit auf `def.type !== "unit"` (`continue`),
und `src/engine/effects.ts`s `destroyPermanent`-Case ruft `fireDeathTriggers`
überhaupt nicht auf (nur `leaveBattlefield`). `onDeath`/`what:"self"`
feuert damit ausschließlich für Units, die über die Toughness-/Schadens-SBA
sterben — NIE für andere Permanent-Typen und NIE für per `destroyPermanent`
zerstörte Permanents jeglichen Typs (auch nicht für Units, die z. B. durch
`core.doomreap-edict` zerstört werden). Der geplante Kandidat wurde
deshalb NICHT gebaut und durch `core.hollowdusk-shrine` (`onEndStep` +
`loseLife`, siehe oben) ersetzt. Betrifft keine bestehende Karte im Pool
unmittelbar (die drei aktuellen `onDeath`-Nutzer `core.husk-crawler`/
`core.plaguebound-wretch` sind Aggro-Karten mit niedriger Toughness, die in
der Praxis überwiegend über Kampf-/Brand-Schaden sterben), aber relevant
für künftige `onDeath`-Designs — siehe „Offene Fragen" Punkt 8.

**Rarity-Verteilung des Batches (30 Karten): 6 common, 16 uncommon, 8
rare.** Nochmals etwas rare-lastiger als Batch 5 (10/18/4), da mehrere neue
Karten direkte Zweit-/Drittkopien bereits etablierter `rare`-Muster sind
(zweites/drittes `costChange`-Farbtrio, dritte Static+Activated-
Konsolidierung, neues Top-Tier-Kartenvorteils-Enchantment) — jede einzelne
Rarity-Einstufung mirrort dabei eine bereits bestehende, exakt
begründete Referenzkarte (siehe oben), keine neue Powerlevel-Kategorie
wurde eingeführt. Nach Batch 6 liegt der Gesamtpool bei 84 common/89
uncommon/32 rare (205 Karten, ca. 41,0 %/43,4 %/15,6 %) — die Verschiebung
bleibt im selben moderaten Rahmen wie in Batch 4/5.

### Batch 7 (v0.10) — Balancing-Notizen

**Drei echte Keyword-Farb-Lücken geschlossen: `core.hollowreach-stalker`
(void, `reach`) / `core.tidewell-cleric` (tide, `lifelink`) /
`core.banelight-templar` (light, `deathtouch`).** Alle drei sind bewusste
1:1-Preisübernahmen bereits etablierter Referenzpunkte in eine neue Farbe
(analog zur `swift`-Lückenschließung aus Batch 6): `core.hollowreach-
stalker` übernimmt `core.sunhaven-guards` Preispunkt (light, 1/4, 2 Mana)
unverändert; `core.tidewell-cleric` übernimmt denselben Body wie
`core.abyssal-lurker` (tide, 1/2 → hier 1/3, siehe unten) auf lifelink statt
deathtouch umgemünzt, orientiert an `core.sun-acolytes` 2-Mana-Preispunkt,
aber defensiver verteilt (1/3 statt 2/2), passend zu tides Statlinien-
Identität; `core.banelight-templar` übernimmt `core.abyssal-lurkers`
Preispunkt (tide, 1/2, 2 Mana) unverändert in eine neue Farbe. Keine dieser
drei Lücken war an irgendeiner Stelle als bewusste Farbidentitäts-
Entscheidung dokumentiert (anders als die vier bei `flame` ausgeschlossenen
Keywords `guardian`/`reach`/`lifelink`/`deathtouch`), daher unproblematisch
zu schließen.

**Vierte, bei der Prüfung entdeckte Lücke: `core.sporewing-strider` (wild,
`airborne`).** Beim systematischen Abgleich der Keyword-Abdeckungstabelle
fiel auf, dass `airborne` bisher komplett bei `wild` fehlte — anders als bei
den drei oben genannten Lücken war dies nicht Teil des ursprünglichen
Plans, sondern eine zusätzliche Beobachtung während des Kartenbaus. Da
keine der dokumentierten Farbidentitäts-Ausnahmen `airborne` erwähnt (nur
`guardian`/`reach`/`lifelink`/`deathtouch` sind bei `flame` bewusst
ausgeschlossen), wurde die Lücke ebenfalls geschlossen. Statverteilung
ursprünglich etwas zäher als `core.aerie-benediction` (light, 2/2 airborne,
3 Mana) — 2/3 airborne für denselben Preis, passend zu wilds höherer
Toughness-Identität. `airborne` deckt damit als **viertes Keyword** (nach
`vigilant`/`firstStrike`/`swift`) alle 5 Farben ohne Ausnahme ab. HINWEIS:
`core.sporewing-strider` wurde im Balance-Pass „Balance-Korrektur nach
empirischer Prüfung" unten auf 2/2 korrigiert (jetzt identisch mit
`core.aerie-benediction`).

**Zwei zweite, billigere `guardian`-Karten: `core.rootbound-sentinel`
(wild, 2 Mana, 1/4) / `core.wardlight-acolyte` (light, 2 Mana, 1/4).**
Beide folgen der seit Batch 1 etablierten guardian-Skalenlogik (niedrige
Power, hohe Toughness, siehe Balancing-Notiz „guardian-Trio") und dem
bereits vorhandenen billigen Preispunkt von `core.harbor-warden` (tide, 2
Mana, 1/5) bzw. `core.gravebound-warden` (void, 2 Mana, 1/4) — beide Farben
hatten bisher nur eine teurere guardian-Karte (`core.bramblehide-sentinel`,
3 Mana; `core.temple-sentinel`, 4 Mana). `guardian` deckt jetzt 4 der 5
Farben mit je zwei Preispunkten ab (nur `flame` bleibt bewusst ohne
guardian).

**Vierte Nutzung von `onDamageReceived` im Pool: `core.hollowveil-reaver`
(void, 3 Mana, 2/2, 1 Schaden Vergeltung).** Vierte Farbe für dieses
Vergeltungsmuster (nach `core.thornrage-boar`/wild, `core.cinderlash-
brute`/flame, `core.lucent-retaliator`/light) — identischer Preis/
identische Vergeltungsstärke wie `core.cinderlash-brute`, nur die Statline
leicht defensiver (2/2 statt 3/2), passend zu voids ausgeglichenerer
Identität gegenüber flames reiner Aggression.

**Dritte/vierte Farbe für das `createToken`-Symmetrie-Spell-Paar:
`core.emberwake-rally` (flame) / `core.aurora-swarm` (light).** Beide
erschaffen zwei 1/1 Lichtgeist-Token (`core.spirit-token`) — eine bereits
etablierte Wiederverwendung, da `core.cinderwing-fledgling` (flame) den
Lichtgeist-Token schon als ETB-Body nutzt und `core.spirit-token` mit dem
Namen „Lichtgeist" ohnehin lights Namensgebung trägt. Identischer
Preispunkt/identische Statline wie `core.seedling-swarm`/`core.grave-legion`
(2 Mana, zwei 1/1-Token, `slow`).

**Erste Nutzung von `grantKeyword` mit `duration:"permanent"` für
`lifelink`: `core.tidebound-vow` (tide, 3 Mana).** Nach der seit Batch 4
etablierten „+1 Mana gegenüber der `endOfTurn`-Variante"-Regel
(`core.blessed-vigor`, 2 Mana → hier 3 Mana). Zweite Nutzung des Musters für
`trample`: `core.cinderroot-brand` (flame, 3 Mana) — folgt der für `trample`
etablierten „+2 Mana"-Ausnahme (`core.ember-briar`, 1 Mana →
`core.rootbound-mark`, wild, 3 Mana → hier ebenfalls 3 Mana in flame).

**Dritte Nutzung von zwei unabhängigen Zielslots auf einem Spell:
`core.direbrood-curse` (void, 2 Mana, je eine -1/-1-Marke auf bis zu zwei
Ziele).** Nach `core.twin-cinder`/`core.riptide-purge` (Batch 4) und
`core.doubletide-snare`/`core.twinroot-blessing` (Batch 6) das void-
Gegenstück zu `core.twinroot-blessing` (wild, +1/+1-Marken) — identischer
Preis/identischer Gesamtwert (2 Marken), nur der Marken-Typ ist
entgegengesetzt.

**Erste Einzelziel-Nutzung von `addCounters` (`plus1plus1`) auf einem Spell:
`core.wildroot-graft` (wild, 2 Mana, 2 Marken auf EIN Ziel).** Bisher wurde
`addCounters` als Spell-Effekt entweder auf zwei Ziele verteilt
(`core.twinroot-blessing`) oder nur als ETB-/Aktivierungs-Effekt genutzt —
hier die direkte Alternative zu `core.twinroot-blessing`: derselbe
Gesamtwert/Preis, aber beide Marken auf einer Kreatur statt verteilt (mehr
Fokus, weniger Breite).

**Erste Spell-Nutzung von `removeCounters` für `minus1minus1`:
`core.tidewash-cleanse` (tide, 2 Mana).** Bisher gab es nur eine Relic-
Antwort auf `minus1minus1`-Marken (`core.wardglow-censer`) — direktes
Gegenstück zu `core.wither-touch` (tide, entfernt `plus1plus1`), hier für
den anderen Counter-Typ. Bewusst `common` statt `uncommon` (anders als
`core.wither-touch`, das damals die einzige Antwort im Pool war): da
`core.wardglow-censer` bereits eine wiederholbare Lösung bietet, ist diese
Karte nicht mehr die alleinige Antwort, was eine niedrigere Rarity
rechtfertigt.

**Neue Trigger/Effekt-Kombination `onUnitDied`(own)+`drawCards`:
`core.tidebound-elegy` (tide, 4 Mana, rare).** Drittes `onUnitDied`(own)-
Enchantment im Pool (nach `core.sanctified-remains`/light/`gainLife` und
`core.verdant-return`/wild/`createToken`) — Kartenvorteil statt Lebensgewinn
oder Ersatzkörper. Preislich/rarity-mäßig an `core.verdant-return`
angelehnt (4 Mana, rare): ein Body-Ersatz und eine zusätzliche Karte sind
strukturell vergleichbar wertvoll, daher identische Einstufung. Zusammen
mit dem symmetrischen Debuff `core.entropic-hollow` (siehe unten) sind dies
die einzigen zwei `rare`-Karten dieses Batches (siehe Rarity-Notiz unten).

**Erster `firstStrike`-`ownUnits`-Anthem: `core.dawnward-standard` (light,
4 Mana, rare).** Bisher nutzte die `grantKeyword`-`ownUnits`-Anthem-
Kombination nur `reach` (`core.skywatch-lattice`, `core.sunwatch-canopy`,
`core.thornreach-standard`, alle 2–3 Mana, uncommon) und `vigilant`
(`core.wildroot-banner`, 2 Mana, uncommon) — beide eher defensive/
situative Keywords. Ein board-weiter `firstStrike`-Grant verschiebt die
Kampfmathematik dagegen direkt und mit hohem Hebel (jede eigene Kreatur
gewinnt praktisch jeden ungeblockten Trade gegen eine gleich große
Kreatur), daher bewusst teurer (4 statt 2–3 Mana) und `rare` statt
`uncommon` eingestuft — die erste Karte dieser Kombination, die über die
bisherige „reine Druckkosmetik"-Einordnung hinausgeht (siehe Warnung in der
Batch-5-Notiz zu `core.skywatch-lattice`: „stärkere Keywords sollten erst
nach Praxiserfahrung mit dem ersten, konservativen Fall gebaut werden" —
`firstStrike` ist hier genau dieser nächste, bewusst teurere Schritt).

**Trigger-Swap `onEndStep` statt `onUpkeep`: `core.duskglow-ward` (light,
2 Mana, uncommon).** Identischer Effekt/Preis/Rarity wie `core.dawnrise-
sanctuary` (onUpkeep+gainLife 1, 2 Mana, uncommon), nur anderes Timing —
analog zum bereits etablierten Swap `core.ashborn-brand`/`core.hollowdusk-
shrine` (onUpkeep vs. onEndStep + dealDamage/loseLife, Batch 4/6).

**Dritter scope:allUnits-Vertreter: `core.entropic-hollow` (void, 2 Mana,
uncommon, -1/-0 allUnits).** Erste Nutzung dieses Scopes in void, reiner
Power-Debuff statt der bisherigen kombinierten -1/-1-Variante
(`core.ashfall-plague`) oder der Buff-Varianten (`core.warhorn-standard`,
`core.titanroot-canopy`). Da nur EIN Stat betroffen ist (analog zu
`core.gloomweight-idol`s Relic-Pendant, siehe unten), moderat bepreist (2
Mana, uncommon) statt auf dem `core.ashfall-plague`-Niveau (4 Mana, rare).

**Relic-Reuse-Sextett (alle farblos gemäß Design-Linie „Relics möglichst
farblos"): `core.gloomweight-idol` (drittes scope:opponentUnits, -0/-2,
4 Mana) / `core.allfield-standard` (drittes scope:allUnits, +1/+1, farbloses
Gegenstück zu `core.titanroot-canopy`) / `core.vitalward-sigil` (dritte
payLife-Relic, addCounters statt drawCards/dealDamage) / `core.hollowed-
satchel` (dritte discardCards-Relic, gainLife statt drawCards/dealDamage) /
`core.cinderfall-idol` (dritte sacrificeSelf-Relic, dealDamage statt
gainLife/drawCards) / `core.skyforge-standard` (zweiter farbloser
ownUnits-Keyword-Anthem, swift statt reach, nach `core.skywatch-lattice`).**
Alle sechs sind reine Preispunkt-/Effekt-Varianten bereits etablierter
Relic-Muster (siehe jeweilige Vorbilder in den Batch-3/4/5-Notizen) — bis
auf `core.gloomweight-idol` (uncommon, da nur ein Einzelstat betroffen,
siehe oben) alle konsistent mit ihren jeweiligen Vorbildern bepreist/
eingestuft. Bewusst keine vierte Static+Activated-Konsolidierungskarte
gebaut (dieses Muster ist strukturell immer `rare`, siehe Batch-4-Notiz) —
passend zur Rarity-Vorgabe dieses Batches (siehe unten).

**Rarity-Verteilung des Batches (30 Karten): 12 common, 16 uncommon, 2
rare.** Bewusst deutlich weniger rare-lastig als die drei vorangegangenen
Batches (Batch 4: 9/15/6, Batch 5: 10/18/4, Batch 6: 6/16/8), passend zum
eigenen Fahrplan-Vorschlag aus Batch 6 („Rarity-Balance im Auge behalten,
rare-Anteil ist über die letzten Batches leicht gestiegen"). Die beiden
einzigen `rare`-Karten (`core.tidebound-elegy`, `core.dawnward-standard`)
sind jeweils die ersten Karten einer neuen Effekt-/Kombinationsvariante mit
klar überdurchschnittlichem Powerlevel (siehe jeweilige Notizen oben) — alle
übrigen 28 Karten sind Zweit-/Dritt-/Viertkopien bereits etablierter, gut
verstandener Preispunkte und bleiben entsprechend bei common/uncommon. Nach
Batch 7 liegt der Gesamtpool bei 96 common/105 uncommon/34 rare (235
Karten, ca. 40,9 %/44,7 %/14,5 %) — der rare-Anteil sinkt damit erstmals
seit Batch 4 wieder (15,6 % → 14,5 %), die Aufwärtsverschiebung aus Batch
4–6 ist entsprechend gestoppt.

### Batch 8 (v0.11) — Balancing-Notizen

**Hauptfokus: `onDeath`+destroy/sacrifice-Freiheit (rules-engine.md 9.15,
engine-status.md v0.3.5) — vorab gegen den Engine-Code verifiziert.** Vor
dem Kartenbau wurde `src/engine/triggers.ts#fireDeathTriggers` gegengelesen
(nicht nur die Doku): der einzige Aufrufer ist seit dem 9.15-Fix
`zones.ts#leaveBattlefield`, das bei JEDEM Battlefield→Graveyard-
Zonenwechsel feuert (SBA-Tod, `destroyPermanent`-Effekt, `sacrificeSelf`-
Zusatzkosten), UND die `onDeath{self}`-Schleife hat KEINE `def.type`-Prüfung
(im Gegensatz zur separat gegateten `onUnitDied`-Beobachter-Schleife, die
weiterhin unit-only bleibt). Alle sieben neuen `onDeath`-Karten dieses
Batches nutzen exakt diese bestätigte Semantik.

**Fünf „Parting Shot"-Units, eine pro Farbe (Analogie zu `core.husk-
crawler`/void und `core.plaguebound-wretch`/void aus Batch 1/4): `core.
cinderwake-marauder` (flame, 2 Mana, 3/1, 1 Schaden an den Gegner) / `core.
tideborn-remnant` (tide, 2 Mana, 1/3, Kartenziehen) / `core.mosswake-
drifter` (wild, 2 Mana, 2/1, `createToken`) / `core.sunfall-martyr` (light,
2 Mana, 2/1, 3 Leben) / `core.gravebound-oracle` (void, 3 Mana, 2/4, zwei
Karten).** Die ersten vier folgen exakt dem etablierten Muster (2 Mana,
zerbrechlicher Körper, ein Payoff bei Tod egal welcher Ursache) — neu ist
lediglich, dass ihr Payoff jetzt GARANTIERT auch bei Entfernung durch
`core.doomreap-edict` (`destroyPermanent`) feuert, nicht nur bei Kampf-/
SBA-Tod (vor dem 9.15-Fix hätte destroy-Removal den Trigger stillschweigend
umgangen). `core.mosswake-drifter` ist zusätzlich die erste Kombination von
`createToken` mit `onDeath` im gesamten Pool (bisher wurde `createToken`
ausschließlich als ETB-Effekt genutzt, z. B. `core.cinderwing-fledgling`).
Payoff-Kalibrierung: Schaden(1)/Karte(1)/Token(1×1/1)/Leben(3) wurden bewusst
so gestaffelt, dass keiner der vier Effekttypen einen anderen strikt
dominiert — Kartenziehen und Token-Erschaffung gelten als die wertvollsten
Einzelressourcen (daher Menge 1), 1 Schaden ist die schwächste unbedingte
Variante (kein Ziel nötig, anders als `core.plaguebound-wretchs` Marke auf
ein gegnerisches Ziel), Lebensgewinn braucht einen höheren Betrag (3), um
auf dieselbe Wertstufe zu kommen. `core.gravebound-oracle` ist bewusst
KEINE fünfte Kopie desselben fragilen 2-Mana-Musters, sondern ein neuer
Archetyp: eine zähe 2/4-Statline, die im regulären Kampf kaum stirbt und
den Gegner faktisch zu einem gezielten Entfernungszauber zwingt — genau der
Fall, den die 9.15-Fix-Beschreibung als Motivation nennt („Entfernung ist
jetzt kein sauberer Weg mehr, Tod-Trigger zu umgehen"). Vor dem Fix hätte
`core.doomreap-edict` diese Karte tatsächlich „sauber" entfernt, ohne den
Kartenzug auszulösen; `core.banishment-rite` (`exilePermanent`) bleibt
weiterhin die einzige Ausnahme, die den Trigger auch nach 9.15 umgeht (kein
Tod laut Definition) — das rechtfertigt umgekehrt auch `core.banishment-
rites` Position als teuerste/seltenste Removal-Karte im Set (4 Mana, rare,
„Premium-Antwort GEGEN Tod-Trigger"). Höherer Payoff (2 Karten statt 1) und
höhere Kosten/Rarity (3 Mana, rare statt 2 Mana, common) gegenüber den vier
fragilen Varianten, da die Statline selbst schon einen echten
Widerstandswert trägt, statt den Payoff nur gegen sofortigen Kampftod
abzusichern.

**Zwei Nicht-Unit-`onDeath{self}`-Beispiele, bisher komplett unbenutzt:
`core.duskbound-cairn` (Relic) und `core.gravebound-shrine` (Enchantment).**
Beide belegen, dass die 9.15-Freischaltung nicht auf Units beschränkt ist.
`core.duskbound-cairn` kombiniert eine `sacrificeSelf`-Activated-Ability MIT
einem `onDeath{self}`-Trigger auf demselben Permanent — der direkteste
mögliche Beleg dafür, dass eigenes Opfern jetzt selbst als Tod zählt: opfert
der Controller das Relikt, feuern BEIDE Effekte (netto „Ziehe zwei Karten",
identischer Gesamtwert wie das bestehende `core.wisproot-cache`, ebenfalls
1-Karten-Investition + Opfer für 2 Kartenzüge); zerstört dagegen der GEGNER
das Relikt (z. B. über das bereits im Pool vorhandene `core.gravetide-
obelisk`, das gezielt Relics/Enchantments/Terrains angreifen kann), feuert
NUR der `onDeath`-Trigger (1 Karte) — der Controller hat die Aktivierung nie
gewählt. Dieser Resilienz-Fall gegen gegnerische Entfernung existierte vor
dem 9.15-Fix nicht (destroy löste `onDeath` damals gar nicht aus) und
rechtfertigt den höheren Preis gegenüber `core.wisproot-cache` (2 statt 1
Mana) trotz identischem Bestfall-Wert. `core.gravebound-shrine` verbindet
einen kleinen laufenden `ownUnits`-Anthem (+0/+1, vergleichbar mit `core.
wardstone-idols` Relic-Pendant) mit einem Schadens-Payoff (2 an den
Gegner), falls das Enchantment selbst stirbt — der erste Fall im Set, in
dem `core.gravetide-obelisks` bisher folgenloser Zerstörungs-Vektor gegen
gegnerische Relics/Enchantments/Terrains tatsächlich eine Konsequenz nach
sich zieht. Bewusst moderat bepreist (3 Mana, uncommon): der laufende
Anthem allein wäre einen Tick billiger, der Aufpreis ist die Entfernungs-
„Versicherung". Beide Karten wurden mit besonders sorgfältiger Balancing-
Begründung dokumentiert, wie vom Auftrag gefordert, da eine echte
mechanische Verhaltensänderung vorliegt (analog zur Dokumentationstiefe bei
zuvor neu freigeschalteten Primitiven wie `onDamageReceived` in v0.6).

**Zweiter Schwerpunkt: letzte beiden Keywords im „`grantKeyword` als
Effekt"-Baukasten geschlossen — `core.vigilwave-charm` (tide, `vigilant`,
1 Mana) und `core.wildwatch-oath` (wild, `guardian`, 1 Mana).** Vor diesem
Batch waren `vigilant` und `guardian` die einzigen beiden Keywords, die
NIE als temporärer Spell-/Fähigkeits-Effekt (`grantKeyword` mit `duration`)
verliehen wurden — nur als feste `KeywordAbility` oder als `StaticAbility`-
Modifier mit `scope:"attachedTo"`/`"ownUnits"` (dauerhaft an ein Anlege-/
Anthem-Objekt gebunden). Beide neuen Karten sind bewusst am billigsten
Preispunkt (1 Mana, `endOfTurn`) angesiedelt, analog zu den bereits
etablierten reinen Trick-Preispunkten (`core.second-wind`/`core.tidal-
renewal`/`core.skyward-ward`/`core.ember-briar`) — `vigilant` (verhindert
das eigene Tappen beim Angriff) und `guardian` (erzwingt den Block der
Zielkreatur, ein Vorteil nur, wenn der Controller ohnehin eine gute
Blockerin wählt) sind beide eher situative, nicht kampfmathematik-
verändernde Effekte, passend zur „schwächste Trick-Preisstufe"-Kategorie.
Mit diesen beiden Karten sind jetzt **alle 9 Keywords** mindestens einmal
als temporärer Effekt-Trick vertreten (siehe Keywords-Abschnitt).

**Weitere neue Duration-/Preispunkt-Kombinationen: `core.emberguard-brand`
(flame, `firstStrike` permanent, 4 Mana) und `core.hollowreach-oath` (void,
`reach` permanent, 2 Mana).** Erste permanente Nutzung von `firstStrike`
als Effekt (bisher nur `endOfTurn`: `core.embermarch-brand`) — nach der
etablierten „+2 Mana für permanentes Kampf-Keyword"-Regel (analog zu
`trample` permanent), da `firstStrike` wie `trample` die Kampfmathematik
direkt und mit hohem Hebel verschiebt. Erste permanente Nutzung von `reach`
(bisher nur `endOfTurn`: `core.skyward-ward`) — hier nur „+1 Mana", da
`reach` (schützt nur gegen Flieger) weniger drastisch wirkt als `trample`/
`firstStrike`/`airborne`.

**Achte Familie „`StaticAbility scope:self` + Modifier `stats` kombiniert
mit einer KeywordAbility": vier neue Mitglieder in vier Farben (`core.
cinderwatch-raider`/flame+vigilant, `core.tidewing-warden`/tide+airborne,
`core.sunblade-vanguard`/light+firstStrike, `core.hollowdepth-warden`/
void+reach).** Reine Modell-Abdeckungstests (mechanisch identisch zu einer
direkt höher gedruckten Statline, siehe Balancing-Notiz zu `core.
stoneguard-paragon` aus Batch 3) — bringen jeweils eine bisher fehlende
Keyword/Static-Kombination in eine neue Farbe, ohne den Powerlevel zu
verändern.

**Relic-Reuse-Fünferpaket (alle farblos gemäß Design-Linie „Relics möglichst
farblos"): `core.hollowed-locket` (erste Relic-Nutzung von `discardCards`
als direktem Effekt statt AdditionalCost/Spell) / `core.skyclad-anvil`
(zweite `grantKeyword`-permanent-Relic-Fähigkeit, `airborne` statt `swift`)
/ `core.direful-clasp` (vierte `payLife`-AdditionalCost-Relic, erste
Kombination mit `modifyStats`) / `core.witherglass-idol` (`removeCounters`
für `plus1plus1` als wiederholbare Relic-Fähigkeit, bisher nur
`minus1minus1`) / `core.rootbound-effigy` (vierte `sacrificeSelf`-Relic,
erste Kombination mit `addCounters` statt Drain-/Wert-Effekt).** Alle fünf
sind reine Preispunkt-/Effekt-Varianten bereits etablierter Relic-Muster,
konsistent mit ihren jeweiligen Vorbildern bepreist/eingestuft.

**Enchantment-Reuse-Trio: `core.cinderwrath-mantle` (flame, Aura, +3/+1,
erste „reine Stats"-Aura mit Gesamtwert 4 statt 3) / `core.hollowvein-
mantle` (void, Aura, +2/+2, erste POSITIVE Stats-Aura in void — bisher nur
Curse-Auren/Keyword-Auren) / `core.tidalguard-standard` (tide, zweite
`firstStrike`-`ownUnits`-Anthem-Kombination nach `core.dawnward-standard`/
light, identischer Preis/identische Rarity: 4 Mana, rare) / `core.
dawncast-shrine` (light, `onSpellCast`(own)+`gainLife`, neue Effekt-Paarung
für diesen Trigger nach Schaden/scry) / `core.rootwake-shrine` (wild,
Trigger-Swap `onEndStep`→`onUpkeep` für die `addCounters`-Engine, nach
`core.wildseed-grove`).** Alle fünf folgen etablierten Preisregeln ihrer
jeweiligen Vorbilder.

**Rarity-Verteilung des Batches (30 Karten): 16 common, 11 uncommon, 3
rare.** Bewusst auf dem in Batch 7 erreichten, niedrigeren Niveau gehalten
(Auftrag: „bei diesem Niveau bleiben, nicht wieder hochtreiben") statt es
weiter zu senken oder wieder steigen zu lassen. Die drei `rare`-Karten
(`core.gravebound-oracle`, `core.tidalguard-standard`, `core.rootwake-
shrine`) sind jeweils entweder ein neuer Archetyp mit überdurchschnittlichem
Powerlevel (`core.gravebound-oracle`, siehe oben) oder zweite Kopien
bereits als `rare` eingestufter Top-Tier-Muster (`core.dawnward-standard`-
Analogon bzw. `core.wildseed-grove`-Analogon) — konsistent mit der in Batch
7 vorgeschlagenen Faustregel „max. 3–4 von 30 Karten rare, nur für Karten
mit tatsächlich neuem Powerlevel oder Zweitkopien bereits etablierter
Top-Tier-Muster". Nach Batch 8 liegt der Gesamtpool bei 112 common/116
uncommon/37 rare (265 Karten, ca. 42,3 %/43,8 %/14,0 %) — der rare-Anteil
sinkt minimal weiter (14,5 % → 14,0 %), bleibt aber praktisch stabil auf
dem in Batch 7 erreichten Niveau.

### Batch 9 (v0.12, Abschlussbatch) — Balancing-Notizen

**`core.tidesurge-crasher` (tide, 2 Mana, 2/3, `trample`) — schließt die
letzte Keyword-Farb-Lücke im gesamten Set.** Reine Vanilla+Keyword-
Statline, bewusst defensiver als die übrigen Vertreter des
trample-Quartetts aus Batch 1 (`core.wildfire-boar` 3/3 für 3 Mana,
`core.overgrowth-colossus` ursprünglich 5/5 für 5, nach dem Balance-Pass
„Balance-Korrektur nach empirischer Prüfung" unten korrigiert auf 5/4,
`core.sunforged-colossus` 4/5 für 5, `core.hollow-ravager` 4/3 für 4) — mehr
Toughness bei weniger Power für
denselben Kostenrahmen, passend zu tides defensiver Identität statt einer
reinen Farb-Umfärbung einer aggressiveren Statline. Damit deckt `trample`
jetzt als fünftes Keyword nach `airborne`/`vigilant`/`firstStrike`/`swift`
alle 5 Farben ab; die einzige verbleibende Farb-Ausnahme unter allen neun
Keywords ist die dokumentierte flame-Ausnahme (`guardian`/`reach`/
`lifelink`/`deathtouch`).

**`core.hollowmaw-devourer` (void, 5 Mana `{generic:3,void:2}`, 4/4,
`trample`+`lifelink`, rare) — bewusst KEINE Kombination aus der
„gefährlichen Trio"-Liste (rules-engine.md 6d(4)).** Anders als `core.
void-assassin` (`firstStrike`+`deathtouch`, die einzige Kombinationskarte
aus dieser Liste im Set) verschiebt `trample`+`lifelink` keine
Kampfmathematik zugunsten eines garantierten Erst-Trades, sondern
erzeugt einen reinen Lebens-/Druck-Swing: durchdringender Schaden UND
Lebensgewinn in einem Kampf, ohne dass die Kreatur dafür stirbt oder den
Gegner überhaupt zwingt zu blockieren. Als teuerster reiner
Statline-Finisher im Set (5 Mana, 4/4) bewusst `rare`, aber ohne die
extreme Fragilität von `core.void-assassin` (1/1) — ein bewusst anderer
Rare-Archetyp („großer, robuster Value-Körper" statt „Ein-Schlag-
Assassine"), damit das Set nicht mit einer zweiten Instanz derselben
Hochrisiko-Kombinationslogik endet.

**Fünfte Farbe für das `createToken`-ETB-Body-Muster: `core.gravecall-
summoner` (void, 3 Mana, 2/1, erschafft einen 1/1 Gebeinknecht) —
schließt diese seit Batch 2 laufende Familie (`core.cinderwing-fledgling`/
flame, `core.aureate-caller`/light, `core.tidespawn-caller`/tide, `core.
thornseed-caller`/wild, alle diesen Batch) über alle 5 Farben ab.**
Statverteilung/Preis identisch zu den vier Vorbildern, nur die
Token-Wahl (Skelett statt Sprössling/Lichtgeist) folgt voids
„Untoter"-Flavor.

**`onAttackDeclared`/`onBlockDeclared`/`onDamageReceived` in neuen
Farben/mit neuen Effekt-Paarungen (kein neues Primitiv, aber bisher
ungenutzte Kombinationen): `core.brandwatch-mercenary` (flame,
`onBlockDeclared`+`dealDamage` an den Gegner statt `gainLife`/
`addCounters` wie die drei bestehenden Vertreter) / `core.dawnrise-
champion` (light, `onAttackDeclared`+`gainLife` statt `dealDamage` wie
`core.raidhorn-berserker`) / `core.tidewrath-guardian` (tide, dritte
`onDamageReceived`-Vergeltungskarte nach `core.thornrage-boar`/wild,
`core.cinderlash-brute`/flame, hier mit der zähesten Statline (1/4) und
schwächsten Vergeltung (1 Schaden) der drei, passend zu tides defensiver
Identität).** Alle drei folgen exakt den etablierten Preis-/Statline-
Skalierungsregeln ihrer jeweiligen Musterfamilien.

**Burn-/Lifegain-Kurven-Erweiterungen: `core.pyreblast-cannon` (flame,
4 Mana, 5 Schaden — schließt die Brand-Kurve nach `core.fire-jolt`/
`core.flame-lance`/`core.scorch-bolt` um eine weitere, konsequent
abnehmende Effizienzstufe nach oben ab) / `core.dawnglow-mercy` (light,
3 Mana, 6 Leben — Größen-Zweitkopie von `core.healing-light` auf
identischer Mana-Effizienz-Rate, 2 Leben pro Mana).** Reine
Kurven-Fortsetzungen ohne neue Effekt-Kombination, bewusst am Ende des
Vorhabens genutzt, um dünn besetzte höhere Preispunkte dieser beiden
etablierten Kurven zu füllen, statt neue Kurven zu eröffnen.

**Drei neue Kombinationen bestehender Primitive: `core.endless-archive`
(Relic, farblos, {4}, `{X}, Tappe: Ziehe X Karten`, rare) / `core.
vanguard-standard` (Relic, farblos, {4}, `grantKeyword`(`firstStrike`)/
`scope:ownUnits`, rare) / `core.dawnhaven-covenant` (Enchantment, light,
{4}, `grantKeyword`(`lifelink`)/`scope:ownUnits`, rare).** `core.endless-
archive` ist der fünfte X-Kosten-Mana-Sink im Pool (nach Schaden/
Lebensgewinn/Lebensverlust/Marken) und nutzt `Amount {kind:"x"}` erstmals
für `drawCards.count` — vom Datenmodell bereits unterstützt (`count:
Amount`), daher keine neue Modellfrage, aber die stärkste Skalierung der
fünf X-Sinks (Kartenvorteil skaliert am direktesten mit Ressourcen),
daher wie die übrigen X-Sinks teuer/rare. `core.vanguard-standard` ist
die erste `firstStrike`-Anthem-Kombination auf einem RELIC (bisher nur
auf farbigen Enchantments: `core.dawnward-standard`/`core.tidalguard-
standard`) — gleiche Preis-/Rarity-Logik (4 Mana, rare), da der Effekt
identisch stark ist und Farblosigkeit hier keinen Preisnachlass
rechtfertigt (anders als bei reinen Stat-Anthems, wo „farblos aber
schwächer" gilt — ein Keyword-Grant lässt sich nicht anteilig
abschwächen). `core.dawnhaven-covenant` ist die erste `lifelink`-Anthem-
Kombination überhaupt (bisher nur `reach`/`vigilant`/`firstStrike` in
dieser Familie) — eingestuft auf demselben Preis-/Rarity-Niveau wie die
`firstStrike`-Anthems, da ein kompletter Lebens-Swing über das gesamte
Board mindestens so gefährlich ist wie eine reine
Kampfmathematik-Verschiebung.

**`core.hollowbanish-verdict` (Spell, void, 5 Mana `{generic:3,void:2}`,
`slow`, rare) — zweite bedingungslose Removal-Karte mit breiterem
Zielsatz.** Bisher war `core.banishment-rite` (4 Mana, `slow`, nur Units)
die einzige bedingungslose Exile-Removal im Set. `core.hollowbanish-
verdict` erweitert den Zielsatz auf `["unit", "relic", "enchantment"]` —
bewusst teurer (5 statt 4 Mana), damit sie `core.banishment-rite` nicht
dominiert: gegen eine reine Unit-Bedrohung bleibt `core.banishment-rite`
die günstigere Wahl, `core.hollowbanish-verdict` kostet den Aufpreis nur
für die zusätzliche Reichweite gegen Relics/Enchantments (bisher nur über
`destroyPermanent`-Karten wie `core.gravetide-obelisk`/`core.doomreap-
edict` erreichbar, dort aber mit Tod-Trigger-Interaktion — Exile bleibt
die „saubere" Premium-Antwort, siehe `core.banishment-rite`-Notiz).

**Rarity-Konsistenz-Korrektur bei der Schlussprüfung:** Zwei Karten
wurden vor Abschluss des Batches an bestehende Preis-/Rarity-Präzedenzien
angeglichen, die bei der ersten Entwurfsfassung übersehen wurden: `core.
mossheart-grove` (wild, `onUpkeep`+`gainLife 1`) ist eine reine
Farb-Zweitkopie von `core.dawnrise-sanctuary` (light, identischer Effekt/
Preis) und wurde entsprechend von `common` auf `uncommon` angehoben;
`core.hollowbind-curse` (void, Curse-Aura, -1/-2) reiht sich in die
bestehende Curse-Aura-Familie (`core.rootrot-curse`/`core.riptide-
shackles`/`core.ashbound-curse`, alle `uncommon` bei Gesamtwert -3) ein
und wurde ebenfalls von `common` auf `uncommon` angehoben. Beide
Korrekturen zeigen, warum die abschließende Gegenprüfung gegen exakte
Preis-/Rarity-Präzedenzien (nicht nur gegen die grobe Kategorie) gerade im
letzten Batch wichtig ist, um keine stillen Inkonsistenzen zum
Set-Abschluss stehen zu lassen.

**Rarity-Verteilung des Batches (35 Karten): 15 common, 15 uncommon, 5
rare.** Exakt auf dem in Batch 8 erreichten Niveau gehalten (Auftrag:
„beim aktuellen Niveau bleiben, nicht weiter steigen lassen"). Die fünf
`rare`-Karten (`core.hollowmaw-devourer`, `core.hollowbanish-verdict`,
`core.endless-archive`, `core.vanguard-standard`, `core.dawnhaven-
covenant`) sind ausnahmslos entweder neue, aber bewusst entschärfte
Finisher-Archetypen oder Zweitkopien/Erweiterungen bereits als `rare`
eingestufter Top-Tier-Muster (X-Kosten-Sinks, starke `ownUnits`-Keyword-
Anthems) — konsistent mit der seit Batch 7 etablierten Faustregel. Nach
Batch 9 liegt der Gesamtpool bei 129 common/129 uncommon/42 rare (300
Karten, 43,0 %/43,0 %/14,0 %) — der rare-Anteil bleibt exakt auf dem
Batch-8-Niveau (14,0 %), wie vom Auftrag gefordert.

## Offene Fragen ans Datenmodell — Status v0.2: alle geklärt

Alle fünf in v0.1 dieses Dokuments gestellten Fragen wurden vom Game-Architect
beantwortet. Kurzstatus (Details siehe `docs/rules-engine.md` v0.2):

1. **`guardian`-Regel final** (Abschnitt 6): Pflicht pro ungetappter
   guardian-Unit des Verteidigers, sofern legaler Block existiert;
   Angreifer-Wahl frei beim Verteidiger; Snapshot bei Deklaration (vorher
   getappt = keine Pflicht, nachträgliches Tappen entfernt den Block nicht);
   nur beim Verteidiger relevant, daher kein Mehrfach-Guardian-Konfliktfall;
   Enforcement rein über Validierung von `declareBlockers`.
   `core.temple-sentinel` war v0.2 die einzige Testkarte; seit Batch 1 (v0.3)
   kommen `core.bramblehide-sentinel` und `core.harbor-warden` als weitere
   guardian-Karten in anderen Farben/Preispunkten dazu (siehe Balancing-Notiz
   „guardian-Trio" oben) — kein Blocker mehr.

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

6. **NEU (Batch 3) — Rückmeldung, kein Blocker für diesen Batch:
   `onDamageReceived` (TriggerCondition, `src/model/abilities.ts`) wird vom
   Engine-Code aktuell an keiner Stelle gefeuert.** Beim systematischen
   Abgleich aller `TriggerCondition`-Varianten gegen `combat.ts`/
   `triggers.ts` vor der Kartenerstellung fiel auf: `fireSelfCombatTrigger`
   wird für `"onAttackDeclared"` (in `declareAttackers`), `"onBlockDeclared"`
   (in `declareBlockers`) und `"onDealtCombatDamageToPlayer"` (dreimal in
   `dealCombatDamageRound`) aufgerufen — für `"onDamageReceived"` gibt es
   dagegen KEINEN Aufruf im gesamten `src/engine`-Verzeichnis, weder in
   `combat.ts` (Kampfschaden) noch in `effects.ts` (`dealDamageToPermanent`,
   nicht-Kampf-Schaden). Anders als `scry` ist dieser No-Op-Zustand nirgends
   als bewusste v0.1-Einschränkung dokumentiert (kein TODO-Kommentar wie bei
   `effects.ts`'s `scry`-Case) — es sieht nach einer unvollständigen
   Implementierung statt einer bewussten Entscheidung aus. Auswirkung auf
   diesen Batch: keine, da `core.thornwarden-ascetic` bewusst ohne diesen
   Trigger gebaut wurde (siehe Balancing-Notiz oben). **Frage an
   Game-Architect/Engine-Engineer:** Soll `onDamageReceived` in einer
   künftigen Engine-Version verdrahtet werden (voraussichtlicher Anknüpf­
   punkt: `dealCombatDamageRound`, analog `onDealtCombatDamageToPlayer`, plus
   `dealDamageToPermanent` in `effects.ts` für nicht-Kampf-Schaden), oder war
   die Auslassung beabsichtigt (z. B. wegen Rekursions-/Reihenfolgeproblemen
   bei mehrfachem Schaden pro Kampfrunde) und sollte dann aus dem Modell
   entfernt oder als „reserviert, noch nicht implementiert" dokumentiert
   werden?

   **Beantwortet (documenter-Sweep nach Batch 3):** Der game-architect hat
   entschieden, `onDamageReceived` **nicht** zu implementieren, sondern
   bewusst als „reserviert, noch nicht verdrahtet" zu vertagen —
   `docs/rules-engine.md` §5 (neuer Hinweis-Bullet mit Codestellen-Verweis),
   §6d(4) (Fußnote zur firstStrike-Kombinatorik) und §10 (neuer offener
   Punkt mit Implementierungsnotizen für eine spätere Umsetzung bei Bedarf)
   entsprechend ergänzt. Für den aktuellen Pool ohne Auswirkung, da keine
   Karte diesen Trigger nutzt (`core.thornwarden-ascetic` bewusst ohne ihn
   gebaut, s.o.).

   **Weiterer Stand (v0.6):** Mit rules-engine.md v0.3 (Entscheidung 9.10)
   hat der Game-Architect `onDamageReceived` nun doch final verdrahtet und
   für den Card-Designer freigegeben (semantisch final in §5: feuert pro
   Schadensereignis > 0, `eventSubject` = Schadensquelle, Token-Quellen
   bewusst meiden). `core.thornrage-boar` ist die erste Testkarte, siehe
   „v0.6-Batch"-Balancing-Notizen oben. Punkt vollständig geschlossen.

7. **NEU (Batch 4) — Rückmeldung, kein Blocker für diesen Batch:
   `eventSubject` bei `onUnitDied` in Kombination mit permanent-bezogenen
   Effekten (`exilePermanent`/`destroyPermanent`/`tapPermanent`/
   `addCounters`/`modifyStats`/...) ist semantisch unklar.** Bei
   `onDamageReceived` ist `eventSubject` die Schadensquelle, die zum
   Trigger-Zeitpunkt in aller Regel noch auf dem Battlefield steht (siehe
   Kommentar in `abilities.ts`: „Letaler Schaden feuert: die Quelle stirbt
   erst danach in der SBA-Prüfung, der Trigger bleibt in der Pending-Queue").
   Bei `onUnitDied` ist das anders: der Trigger feuert, WEIL das Objekt
   bereits gestorben ist — zum Zeitpunkt der Resolution hat es das
   Battlefield also schon verlassen (liegt im Graveyard). Ein
   permanent-bezogener Effekt wie `exilePermanent { target: eventSubject }`
   (der ursprünglich in Batch 3 skizzierte Anwendungsfall „wenn eine
   gegnerische Kreatur stirbt, verbanne sie") hätte damit kein gültiges
   Permanent mehr als Ziel. Batch 4 hat diesen Fall bewusst gemieden
   (`core.sanctified-remains`/`core.witherplague-shrine` nutzen nur die
   relativen Empfänger `controller`/`opponent`, keinen Bezug auf das
   gestorbene Objekt). **Frage an Game-Architect:** Ist `eventSubject` bei
   `onUnitDied` für permanent-bezogene Effekte überhaupt vorgesehen — und
   falls ja, wie soll die Engine das auflösen (z. B. Referenz auf die Karte
   im Graveyard mit eingeschränktem Effekt-Set, oder stiller Fizzle analog
   zur normalen Zielwahl-Fizzle-Regel)? Falls nein, wäre eine explizite
   Dokumentation dieser Einschränkung im `eventSubject`-Kommentar von
   `abilities.ts` hilfreich (analog zur bestehenden Doku-Praxis bei
   `onDamageReceived`/`scry`), damit zukünftige Batches diesen Fall nicht
   erneut prüfen müssen.

   **Beantwortet (nach Batch 5, rules-engine.md v0.3.2, Entscheidung
   9.14): zulässig, aber garantiert wirkungslos — nicht bauen.** Der
   Game-Architect hat die Frage final entschieden: `eventSubject` bei
   `onUnitDied` (und ebenso bei `onDeath`) referenziert weiterhin die
   auslösende Karteninstanz, auch nachdem sie das Battlefield verlassen
   hat (regulär: die Karte liegt beim Resolven bereits im Graveyard; bei
   Token-Quellen kann die Instanz durch SBA 7 bereits gelöscht sein). Die
   Kombination mit permanent-bezogenen Effekten
   (`exilePermanent`/`destroyPermanent`/`tapPermanent`/`untapPermanent`/
   `modifyStats`/`grantKeyword`/`addCounters`/`removeCounters`) ist
   formal zulässig, löst aber über die neue „Nicht-Permanent-Fizzle"-Regel
   IMMER als stiller No-Op auf, da das Subjekt beim Resolven nie mehr ein
   Permanent ist. **Konsequenz für den Card-Designer: dieser
   „Removal-bei-Tod"-Archetyp wird bewusst NICHT gebaut** — er wäre eine
   Karte, die nie den beworbenen Effekt hat. Ein echtes „Removal-bei-Tod"-
   Design bräuchte ein künftiges Graveyard-Primitiv (z. B.
   `exileFromGraveyard`), das der Game-Architect als offenen Punkt in §10
   vorgemerkt hat, aber nicht Teil dieses Kartenpool-Vorhabens ist. Punkt
   vollständig geschlossen — Batch 6 hat entsprechend keine neue
   `onUnitDied`+`eventSubject`-Kombination gebaut (die beiden
   `onUnitDied`-Karten ohne `eventSubject`, `core.sanctified-remains`/
   `core.witherplague-shrine`, plus die neue `core.ashclaim-shrine`, siehe
   Balancing-Notizen „Batch 6", bleiben der einzige Präzedenzfall für
   diesen Trigger — alle drei nutzen ausschließlich die relativen
   Empfänger `controller`/`opponent`).

8. **NEU (Batch 6) — Rückmeldung, kein Blocker: `onDeath`/`what:"self"`
   ist im Engine-Code de facto ein Unit-only-Trigger, nirgends im Modell so
   dokumentiert.** Beim Versuch, ein „parting shot"-Enchantment zu bauen
   (feuert, wenn dieses Enchantment selbst per SBA/Zerstörung stirbt), fiel
   beim Abgleich gegen `src/engine/sba.ts`/`effects.ts` auf: Die
   SBA-3/4-Sterbeschleife in `sba.ts` iteriert nur Permanents mit
   `def.type === "unit"` (`if (def.type !== "unit") continue;`) — nur für
   diese wird `fireDeathTriggers` aufgerufen. Zusätzlich ruft der
   `destroyPermanent`-Effekt-Case in `effects.ts` `fireDeathTriggers`
   überhaupt nicht auf (nur `leaveBattlefield`) — `onDeath` feuert also
   selbst für eine UNIT nicht, wenn sie per `destroyPermanent`
   (`core.doomreap-edict`/`core.gravetide-obelisk`) statt über die
   Toughness-/Schadens-SBA stirbt. Für den aktuellen Pool ohne
   Auswirkung (die drei bestehenden `onDeath`-Nutzer sind aggressive,
   niedrige-Toughness-Units, die überwiegend über Kampf-/Brand-Schaden
   sterben; Batch 6 hat den geplanten Enchantment-Kandidaten bewusst durch
   `core.hollowdusk-shrine`, `onEndStep`+`loseLife`, ersetzt, siehe
   Balancing-Notizen „Batch 6"). **Frage an Game-Architect/Engine-
   Engineer:** Ist diese Einschränkung (Unit-only, kein Fire bei
   `destroyPermanent`) beabsichtigt (dann bitte im `onDeath`-Kommentar in
   `abilities.ts` explizit dokumentieren, analog zur bestehenden Praxis bei
   `onDamageReceived`/`scry`/`eventSubject`), oder soll `destroyPermanent`
   künftig ebenfalls `fireDeathTriggers` auslösen (dann wären
   `core.husk-crawler`/`core.plaguebound-wretch` beim Tod durch
   `core.doomreap-edict` heute unbeabsichtigt stumm)?

   **Beantwortet (Game-Architect, rules-engine.md v0.3.3, Entscheidung
   9.15): Bug — wird behoben, zonenbasierte Todesdefinition.** „Stirbt"
   heißt künftig: das Permanent verlässt das Battlefield Richtung
   Graveyard, ursachenunabhängig (SBA 3/4, `destroyPermanent`,
   `sacrificeSelf`-Zusatzkosten, Aura-SBA 5) und für `onDeath{self}`
   typ-agnostisch — das ursprünglich geplante „parting shot"-Enchantment
   ist damit baubar. `onUnitDied` und das `unitDied`-Event (dieselbe Lücke,
   in der Entscheidung mitbehoben) erben dieselbe Todesdefinition, bleiben
   aber unit-only. `exilePermanent`/`returnToHand` sind bewusst KEIN Tod:
   Exil (`core.banishment-rite`) ist damit die dokumentierte Premium-
   Antwort gegen Tod-Trigger — beim Bepreisen von destroy- vs. exile-
   Removal berücksichtigen. Token mit eigenem `onDeath` verpuffen
   weiterhin beim Stacken (SBA-7-Vereinfachung, analog 9.10 Punkt 4).
   Die Umsetzung (zentraler Hook in `zones.ts#leaveBattlefield`,
   Engine-Auftrag in rules-engine.md 9.15) liegt beim engine-engineer —
   `onDeath`+destroy-Payoffs bitte erst bauen, wenn
   `docs/engine-status.md` den Fix meldet.

   **Fix umgesetzt und getestet (engine-status.md v0.3.5, während/nach dem
   Bau von Batch 7 entdeckt):** Der engine-engineer hat den zentralen
   Tod-Hook in `zones.ts#leaveBattlefield` implementiert (inkl. eigenem
   Pool-Regressionstest mit `core.husk-crawler`+`core.doomreap-edict`) —
   `onDeath{self}` feuert jetzt nachweislich typ-agnostisch bei JEDEM
   Battlefield→Graveyard-Zonenwechsel (SBA 3/4, SBA 5/Aura-ohne-Ziel,
   `destroyPermanent`, `sacrificeSelf`-Zusatzkosten), auch auf Nicht-Unit-
   Permanents (Relic/Enchantment/Terrain). `onUnitDied`/`unitDied` bleiben
   unit-only, feuern aber jetzt ebenfalls bei ALLEN vier Tod-Pfaden statt
   nur bei SBA-Tod. Punkt 8 ist damit vollständig geschlossen. Batch 7
   selbst nutzt dieses neue Verhalten noch NICHT (die Entdeckung erfolgte
   erst bei der abschließenden Doku-Prüfung, nachdem alle 30 Batch-7-Karten
   bereits fertig geplant/gebaut waren) — echte „parting shot"-Designs
   (`onDeath{self}` auf Enchantment/Relic/Terrain, oder `onDeath`+
   `destroyPermanent`-Synergien auf Units) sind damit die erste tatsächlich
   neue, jetzt bestätigt funktionierende Designfläche seit Batch 6 und ein
   naheliegender Schwerpunkt für Batch 8 (siehe Fahrplan-Vorschlag unten).

   **Umgesetzt in Batch 8:** vor dem Kartenbau wurde
   `src/engine/triggers.ts#fireDeathTriggers` gegen den in engine-status.md
   v0.3.5 beschriebenen Stand gegengelesen und exakt bestätigt (einziger
   Aufrufer `zones.ts#leaveBattlefield`, `onDeath{self}`-Schleife ohne
   `def.type`-Prüfung). Batch 8 hat daraufhin fünf farbverteilte „Parting
   Shot"-Units, ein Relic-Beispiel (`core.duskbound-cairn`, kombiniert
   `sacrificeSelf` MIT `onDeath{self}`) und ein Enchantment-Beispiel
   (`core.gravebound-shrine`, Anthem + Schadens-Payoff) gebaut — Details
   siehe Balancing-Notizen „Batch 8". Punkt 8 ist damit nicht nur
   modell-/engine-seitig, sondern auch im Kartenpool selbst vollständig
   abgeschlossen.

## Keywords: Abdeckung im Pool (Stand Batch 9 / v0.12 — Abschlussbatch)

Alle 9 Einträge des `Keyword`-Typs (`src/model/abilities.ts`) sind im
echten Kartenpool vertreten. Batch 9 hat mit `trample`/tide
(`core.tidesurge-crasher`) die letzte verbleibende, nicht dokumentiert
ausgeschlossene Keyword-Farb-Lücke im gesamten Set geschlossen (siehe
Balancing-Notizen „Batch 9"); daneben mehrere weitere Preispunkte in der
`StaticAbility scope:self`+Keyword-Familie in neuen Farben (nicht separat
gezählt). Gesamtüberblick:

| Keyword | Karten gesamt | Farben |
|---|---|---|
| `swift` | 7 (6 permanent + `core.emberborn-sprinter` als StaticAbility-`grantKeyword` scope:self, funktional identisch) — deckt ALLE 5 Farben ab | flame (×3), light, void, tide, wild |
| `airborne` | 6 — deckt weiterhin ALLE 5 Farben ab | flame (×3), light, void, tide, wild |
| `reach` | 5 — deckt weiterhin 4 der 5 Farben ab | wild (×2), tide, light, void |
| `vigilant` | 7 — deckt weiterhin ALLE 5 Farben ab | tide (×3), wild, flame, void, light |
| `guardian` | 6 — deckt weiterhin 4 der 5 Farben ab, mit je 2 Preispunkten in light/wild | light (×2), wild (×2), tide, void |
| `lifelink` | 6 — deckt weiterhin 4 der 5 Farben ab | light (×2), wild, void (×2), tide |
| `trample` (Keyword) | 8 — deckt jetzt ebenfalls ALLE 5 Farben ab | flame (×2), wild (×2), void (×2), light, tide |
| `firstStrike` (Keyword) | 8 — deckt weiterhin ALLE 5 Farben ab | flame (×2), tide (×2), wild, light (×2), void |
| `deathtouch` (Keyword) | 5 — deckt weiterhin 4 der 5 Farben ab | tide, wild, void (×2), light |

`guardian`/`reach`/`lifelink`/`deathtouch` fehlen weiterhin bewusst bei
`flame` (passend zu flames rein aggressiver Identität ohne defensive
Keywords, siehe Farbidentität-Abschnitt) — das bleibt die EINZIGE
dokumentierte, dauerhafte Farb-Ausnahme unter allen neun Keywords im
gesamten fertigen Set. `airborne`/`vigilant`/`firstStrike`/`swift`/
`trample` decken jetzt uneingeschränkt alle 5 Farben ab (fünf von neun
Keywords vollständig, nach Batch 9 eines mehr als zuvor). Damit ist der
Abschnitt „Keyword-Farb-Lücken" endgültig geschlossen: alle verbleibenden
Lücken (`reach`/`guardian`/`lifelink`/`deathtouch` jeweils bei genau einer
Farbe fehlend) sind ausschließlich die eine dokumentierte
Farbidentitäts-Ausnahme (flame) — keine einzige davon ist mehr ein
unbeabsichtigtes Versehen.

Zusätzlich verleihen inzwischen **neun** Spells `airborne`/`trample`/
`deathtouch`/`swift`/`firstStrike`/`reach`/`lifelink`/`vigilant`/`guardian`
**temporär als Effekt** (`grantKeyword`, `duration:"endOfTurn"` oder
`"permanent"`) statt als dauerhafte `KeywordAbility` — mit Batch 8s `core.
vigilwave-charm` (`vigilant`) und `core.wildwatch-oath` (`guardian`) sind
jetzt **ALLE neun Keywords ohne Ausnahme** mindestens einmal als
temporärer Effekt-Trick vertreten (zuvor waren `vigilant`/`guardian` die
einzigen beiden, die sich „für Combat-Tricks weniger eignen" — diese
Einschränkung galt nur für Combat-Tricks im engeren Sinne, nicht generell;
siehe Balancing-Notizen „Batch 8" für die konkreten Anwendungsfälle). Diese
zählen bewusst nicht in obiger Tabelle, da sie kein permanentes Keyword auf
einer Karte sind. Acht `grantKeyword`-Effekte nutzen inzwischen
`duration: "permanent"` statt `"endOfTurn"` (`core.rootbound-mark`/
trample, Batch 4; `core.emberstride-brand`/swift und `core.aureate-wings`/
airborne als Spells sowie `core.hearthforge-anvil` als erste
`ActivatedAbility` mit permanentem `grantKeyword`, Batch 6; Batch 7 ergänzt
`core.cinderroot-brand`/trample, zweite Farbe für diese Duration-Variante,
und `core.tidebound-vow`/lifelink; Batch 8 ergänzt `core.emberguard-brand`/
firstStrike — erste permanente Nutzung dieses Keywords als Effekt — und
`core.hollowreach-oath`/reach, siehe Balancing-Notizen „Batch 8"). Weiterhin
OHNE `duration:"permanent"`-Variante: `deathtouch`, `vigilant`, `guardian`
(alle drei aus demselben Grund wie oben — situativ/kombinatorisch stark
genug, dass ein dauerhafter Grant potenziell zu mächtig wäre, daher bisher
bewusst nur `endOfTurn`).

**`grantKeyword` als Aura-/Anthem-Modifier statt Effekt-Trick (seit Batch
5, erweitert in Batch 6/7).** Sieben Auren verleihen ihr Keyword dauerhaft,
solange sie angelegt bleiben (`core.emberclad-brand` firstStrike, `core.
tidewarden-sigil` vigilant, `core.thornclad-ward` trample, `core.sanctum-
ward` guardian, `core.soulbound-embrace` lifelink, `core.witherfang-veil`
deathtouch, Batch 7 ergänzt `core.cinderbound-mark` swift — siehe
Balancing-Notizen), und Relics/Enchantments verleihen ihr Keyword
allen eigenen Kreaturen gleichzeitig (`core.skywatch-lattice`, Relic,
farblos, reach; `core.sunwatch-canopy`, light, reach, und `core.wildroot-
banner`, wild, vigilant, Batch 6; Batch 7 ergänzt `core.thornreach-standard`,
wild, reach, `core.dawnward-standard`, light, firstStrike — erste Nutzung
dieser Kombination mit einem starken Kampf-Keyword statt reach/vigilant,
daher bewusst teurer/rare, siehe Balancing-Notizen —, sowie `core.skyforge-
standard`, Relic, farblos, swift; Batch 8 ergänzt `core.tidalguard-standard`,
tide, firstStrike — zweite Nutzung dieser starken Kombination, identischer
Preis/identische Rarity wie `core.dawnward-standard`. Batch 9 ergänzt
`core.vanguard-standard`, Relic, farblos, firstStrike — erste Nutzung
dieser starken Keyword-Kombination auf einem Relic statt nur auf farbigen
Enchantments, gleiche Preis-/Rarity-Logik (4 Mana, rare) — sowie `core.
dawnhaven-covenant`, light, lifelink — die erste board-weite `lifelink`-
Anthem-Kombination überhaupt, ebenfalls 4 Mana/rare, da ein kompletter
Lebens-Swing über das ganze Board potenziell noch swingier ist als ein
reiner Kampf-Keyword-Anthem). Auch diese zählen bewusst NICHT in
obiger Tabelle (kein fest gedrucktes Keyword auf EINER Karte, sondern ein
dynamischer, an ein Anlege-/Anthem-Objekt gebundener Effekt). Details/
Statlines siehe Balancing-Notizen oben und Farbidentität.

## Nicht verwendete DSL-Primitive (Stand Batch 9 / v0.12 — Abschnitt final leer)

Batch 3 war der letzte Batch der ursprünglichen ≥100-Karten-Phase; Batch 4
ist der erste von mehreren weiteren Batches Richtung ca. 300 Karten. Vor der
Kartenerstellung wurde der komplette Primitiv-Katalog aus
`src/model/abilities.ts` systematisch gegen den bisherigen Pool UND gegen
die tatsächliche Engine-Implementierung abgeglichen (nicht nur gegen den
expliziten Batch-3-Auftrag) — mit dem Ziel, diese Liste möglichst leer zu
hinterlassen. Ergebnis: **alle** der folgenden, zuvor unbenutzten Primitive
sind jetzt im Pool vertreten:

`scry`, `StaticAbility`-Modifier `grantKeyword`, `StaticAbility`-Modifier
`costChange`, `StaticAbility` mit `scope: self`/`opponentUnits`/`allUnits`,
`minus1minus1`-Marken, sowie (zusätzlich zum expliziten Auftrag entdeckt
und geschlossen) die Effekte `modifyStats`, `loseLife`, `destroyPermanent`,
die `AdditionalCost`-Varianten `payLife`, `discardCards` und
`removeCounters` auf aktivierten Fähigkeiten, und die TriggerConditions
`onUpkeep`, `onSpellCast` und `onDealtCombatDamageToPlayer`. Details und
Kartenverweise siehe Balancing-Notizen „Batch 3" oben.

Verbleibend unbenutzt (nach sorgfältiger Prüfung, mit Begründung, warum
ein weiterer Batch dafür sinnvoller ist als ein erzwungener Einbau in
diesem):

- ~~**TriggerCondition `onDamageReceived`**~~ — **geschlossen in v0.6:** mit
  rules-engine.md v0.3 (Entscheidung 9.10) vom Game-Architect verdrahtet und
  freigegeben; `core.thornrage-boar` nutzt ihn jetzt (Vergeltungsdesign über
  `EffectRecipient "eventSubject"`), siehe „v0.6-Batch"-Balancing-Notizen
  oben.
- ~~**X-Kosten auf aktivierten Fähigkeiten**~~ — **geschlossen in v0.6:** mit
  rules-engine.md v0.3 (Entscheidung 9.12) freigegeben (`chosenX` jetzt auch
  auf `ActivatedAbility`, verboten nur für Mana-Fähigkeiten);
  `core.cinderwrack-engine` ist die erste Testkarte, siehe
  „v0.6-Batch"-Balancing-Notizen oben.
- ~~**Modal-Effekte („wähle eines —")**~~ — **geschlossen in v0.6:** mit
  rules-engine.md v0.3 (Entscheidung 9.13) eingeführt (`modes` auf
  `SpellCard`/`ActivatedAbility`/`TriggeredAbility`); `core.void-covenant`
  und `core.current-diplomat` sind die ersten Testkarten, siehe
  „v0.6-Batch"-Balancing-Notizen oben.
- ~~**TriggerConditions `onAttackDeclared`/`onBlockDeclared`**~~ —
  **geschlossen in Batch 4:** `core.raidhorn-berserker` (flame, Angriffs-
  Trigger, 1 Schaden an den Gegner) und `core.wardflame-sentinel` (light,
  Block-Trigger, 2 Leben) sind die ersten Testkarten — genau die in Batch 3
  vorgeschlagenen Payoff-Richtungen (Aggro-Payoff flame / Defensiv-Payoff
  light), siehe Balancing-Notizen „Batch 4" oben.
- ~~**`EffectRecipient` `eventSubject`** (Zweitanwendung `onUnitDied`)~~ —
  **beantwortet (rules-engine.md v0.3.2, Entscheidung 9.14): zulässig,
  aber garantiert wirkungslos — bewusst NICHT bauen.** Der in Batch 3
  skizzierte Anwendungsfall („wenn eine gegnerische Kreatur stirbt,
  verbanne sie", `eventSubject` = das gestorbene Objekt) resolviert laut
  der neuen „Nicht-Permanent-Fizzle"-Regel bei permanent-bezogenen
  Effekten IMMER als stiller No-Op, da das Subjekt beim Resolven eines
  `onUnitDied`-Triggers das Battlefield bereits verlassen hat (liegt im
  Graveyard, bzw. bei Token-Quellen ggf. gelöscht). Der „Removal-bei-Tod"-
  Archetyp bräuchte ein künftiges Graveyard-Primitiv (`exileFromGraveyard`
  o. ä., vom Game-Architect in §10 vorgemerkt) — kein Teil dieses
  Kartenpool-Vorhabens. Punkt vollständig geschlossen, siehe „Offene
  Fragen" Punkt 7 für den vollständigen Verlauf. Batch 4–6 haben
  entsprechend ausschließlich die relativen Empfänger `controller`/
  `opponent` für `onUnitDied`-Karten genutzt (`core.sanctified-remains`,
  `core.witherplague-shrine`, `core.ashclaim-shrine`).
- ~~**`modifyStats`/`grantKeyword` mit `duration: "permanent"`**~~ —
  **geschlossen in Batch 4:** `core.moltenscale-graft` (flame, +2/+0
  permanent), `core.aegis-oath` (light, +0/+3 permanent) und
  `core.foundry-anvil` (Relic, Aktivierungs-Sink) nutzen `modifyStats`
  permanent; `core.rootbound-mark` (wild, permanentes Trample) nutzt
  zusätzlich `grantKeyword` mit `duration: "permanent"` — ein bei der
  Batch-3-Prüfung nicht separat aufgeführter, aber ebenfalls bis Batch 4
  unbenutzter Fall (dieselbe Variante wie bei `modifyStats`, nur beim
  anderen Effekt-Primitiv). Neue Preisregel etabliert: „+1 Mana gegenüber
  der `endOfTurn`-Variante bei identischem Effekt", siehe Balancing-Notizen.

**Bei der Batch-4-Prüfung zusätzlich identifiziert und geschlossen (nicht
Teil des expliziten Auftrags, aber bisher unbenutzte Kombinationen im
Modell):** `modes` auf einer `ActivatedAbility` (bisher nur auf `SpellCard`/
`TriggeredAbility` demonstriert; `core.myriad-cog` ist die erste Testkarte),
`grantKeyword` als Effekt mit `keyword: "reach"` (bisher nur swift/airborne/
trample/deathtouch/firstStrike als Tricks; `core.skyward-ward`), `StaticAbility`
UND `ActivatedAbility` kombiniert auf einem einzigen Permanent (bisher immer
getrennt; `core.wardsteel-bastion`), sowie zwei unabhängige Zielslots auf
einem Spell (`core.twin-cinder`, `core.riptide-purge`).

**Bei der Batch-5-Prüfung zusätzlich identifiziert und geschlossen (nicht
Teil des expliziten Auftrags, aber bisher unbenutzte Kombinationen im
Modell):** `StaticAbility`-Modifier `grantKeyword` mit `scope:"attachedTo"`
(bisher nur `scope:"self"`; fünf neue Auren, siehe Balancing-Notizen) UND
mit `scope:"ownUnits"` (bisher ebenfalls nur `scope:"self"`;
`core.skywatch-lattice`), `grantKeyword` als Effekt mit `keyword: "lifelink"`
(bisher sechs andere Keywords als Tricks; `core.blessed-vigor` — damit sind
jetzt alle neun Keywords mindestens einmal als Effekt-Trick vertreten,
siehe Keywords-Abschnitt), sowie `TargetSpec { kind: "stackObject",
objectKind: "ability" }` (bisher nur `"spell"`; `core.silence-ward`).
**Bei der Batch-6-Prüfung geschlossen:** `TargetSpec { kind: "stackObject",
objectKind: "any" }` (bisher nur `"spell"`/`"ability"`; `core.silence-veil`
kontert jetzt beides zugleich) — die zuvor letzte unbenutzte
`TargetSpec`-Variante.

Nach Batch 6 enthielt dieser Abschnitt keine unbenutzten Primitive/
Kombinationen mehr. Batch 7 hat ebenfalls keine neuen Primitive/
Kombinationen eingeführt (ausschließlich Wiederverwendung, siehe
Balancing-Notizen „Batch 7"), aber bei der abschließenden Doku-Prüfung
wurde eine **neu freigeschaltete** Kombination entdeckt (kein bisher
unbenutztes Primitiv, sondern ein durch einen Engine-Bugfix erst jetzt
tatsächlich funktionierendes Verhalten, siehe „Offene Fragen" Punkt 8):
`onDeath{self}` auf Nicht-Unit-Permanents (Relic/Enchantment/Terrain) sowie
`onDeath`/`onUnitDied` in Kombination mit `destroyPermanent`/
`sacrificeSelf`-Toden — laut `docs/engine-status.md` v0.3.5 implementiert
und mit eigenem Pool-Regressionstest verifiziert. Batch 7 selbst nutzt dies
noch nicht (Entdeckung erst nach Fertigstellung des Batches).

**Batch 8 hat diese Kombination als Hauptfokus aktiv genutzt und damit
geschlossen:** `core.duskbound-cairn` (Relic) und `core.gravebound-shrine`
(Enchantment) sind die ersten beiden Nicht-Unit-`onDeath{self}`-Karten im
Pool; `core.gravebound-oracle` (void) ist die erste Unit, die gezielt als
„Removal-Magnet" konzipiert ist, um den Wert der neuen, ursachenunabhängigen
Todesdefinition praktisch zu demonstrieren. Details siehe Balancing-Notizen
„Batch 8". Damit enthält dieser Abschnitt nach Batch 8 wieder keine
unbenutzten Primitive/Kombinationen mehr. Aus „Offene Fragen" verbleibt
weiterhin nur die bereits final beantwortete (aber bewusst nicht baubare)
`eventSubject`/`onUnitDied`-Kombination (Punkt 7).

**Batch 9 (Abschlussbatch) hat keine bisher unbenutzten Primitive mehr
vorgefunden** (der Katalog war bereits seit Batch 8 praktisch leer), aber
bei der Vorab-Prüfung drei weitere, bisher unbenutzte KOMBINATIONEN
bestehender Primitive identifiziert und geschlossen: `drawCards` mit
X-Kosten (`count: {kind:"x"}`, bisher nur bei `dealDamage`/`gainLife`/
`loseLife`/`addCounters` genutzt; `core.endless-archive` ist die erste
Testkarte), `StaticAbility`-Modifier `grantKeyword` mit `keyword:
"firstStrike"` auf einem farblosen Relic (bisher nur `reach`/`swift` auf
Relics; `core.vanguard-standard`) und `StaticAbility`-Modifier
`grantKeyword` mit `keyword: "lifelink"` und `scope: "ownUnits"` (bisher
nur `reach`/`vigilant`/`firstStrike` in dieser Scope-Kombination; `core.
dawnhaven-covenant`). Außerdem eine breitere `TargetSpec`-Nutzung bei
`exilePermanent` (`cardTypes: ["unit","relic","enchantment"]` statt nur
`["unit"]`; `core.hollowbanish-verdict` — keine neue `TargetSpec`-Variante,
aber die erste Kombination von `exilePermanent` mit einem Nicht-Unit-
Zielsatz). Details siehe Balancing-Notizen „Batch 9". Damit enthält dieser
Abschnitt am Ende des gesamten neunbatchigen Vorhabens keine unbenutzten
Primitive/Kombinationen mehr; aus „Offene Fragen" verbleibt weiterhin nur
die bereits final beantwortete (aber bewusst nicht baubare)
`eventSubject`/`onUnitDied`-Kombination (Punkt 7) — ein echtes künftiges
Graveyard-Primitiv (`exileFromGraveyard` o. ä.) bleibt der einzige aus
diesem Vorhaben bekannte, konkrete Vorschlag für ein mögliches
Erweiterungsset (siehe „Set-Abschluss"-Abschnitt ganz unten).

## Fahrplan-Vorschlag für die restlichen Batches (Richtung ca. 300 Karten, historisch — abgeschlossen)

**Hinweis (nach Batch 9):** Dieser Abschnitt dokumentiert den Fahrplan, wie
er nach Batch 8 vorgeschlagen wurde, und diente als Grundlage für die
Zielplanung von Batch 9 (siehe „Batch 9 — Zielplanung" oben). Das darin
beschriebene Ziel von 300 Karten ist mit Batch 9 erreicht — der Abschnitt
bleibt unverändert als historischer Beleg stehen. Ein zusammenfassender
Rückblick über das gesamte Vorhaben sowie mögliche Richtungen für ein
künftiges Erweiterungsset finden sich im Abschnitt „Set-Abschluss (300
Karten erreicht)" ganz unten in diesem Dokument.

**Stand nach Batch 8:** 265 Karten (davon 49 farblose Relics), noch **35
Karten** fehlen bis zum vereinbarten Zielumfang von ca. 300. Bei einer
Batchgröße von ca. 28–32 Karten (Durchschnitt der bisherigen acht Batches:
29/25/28/30/32/30/30/30 ≈ 29,3) reicht rechnerisch **ein einziger,
minimal größerer Abschlussbatch von 35 Karten**, um exakt auf 300 zu
landen — das liegt nur leicht über dem bisherigen Batch-Größenkorridor
(28–32) und wäre der einfachste, sauberste Abschluss. Alternativ: zwei
kleinere Batches (z. B. 18 + 17 oder 20 + 15), falls ein zusätzlicher
Verifikationsschritt zwischen zwei kleineren Lieferungen bevorzugt wird.
**Empfehlung des Card-Designers: 1 Batch genügt**, sofern kein weiterer
Modell-/Engine-Vorlauf ansteht, der eine Zwischen-Verifikation nahelegt.

**Typverteilung bleibt ausgewogen:** terrain 1,9 %, unit 36,6 %, spell
24,2 %, relic 18,5 %, enchantment 18,9 %. Praktisch unverändert gegenüber
dem Stand vor Batch 8 — die „ca. proportional zur aktuellen Verteilung"-
Logik aus Batch 7/8 hat die Balance exakt gehalten. Empfehlung für den
Abschlussbatch (35 Karten): unit +13, spell +8, relic +7, enchantment +7,
terrain +0 (proportional zur aktuellen Verteilung hochskaliert) — damit
landet der Pool bei ca. terrain 5/unit 110/spell 72/relic 56/enchantment 57
= 300.

**Farbverteilung bleibt sehr eng** (flame 19,9 %, tide 19,9 %, wild
19,9 %, light 19,9 %, void 20,4 % unter den 216 farbigen Nicht-Relic-
Karten) — auf demselben engen Niveau wie nach Batch 7 (±0,5 Punkte).
Künftige Batches sollten weiterhin exakt nachzählen (Code, nicht Doku),
aber keine gezielte Korrektur mehr einplanen, solange sich diese Balance
nicht durch einen stark einfarbigen Batch verschiebt.

**Design-Vorschläge für Batch 9 (Abschlussbatch):**

1. Letzte verbleibende, nicht dokumentiert ausgeschlossene Keyword-Farb-
   Lücke: **`trample`/tide** (siehe Farbidentität-/Keywords-Abschnitt) —
   wurde in Batch 8 bewusst zurückgestellt (Hauptfokus lag auf `onDeath`),
   naheliegender kleiner Baustein für den Abschlussbatch, analog zu den in
   Batch 6/7 geschlossenen Lücken.
2. **`onDeath`-Designraum weiter ausbauen (kein neues Primitiv, aber
   inhaltlich noch nicht ausgeschöpft):** Batch 8 hat pro Farbe genau EINE
   fragile „Parting Shot"-Unit sowie je ein Nicht-Unit-Beispiel für Relic
   und Enchantment gebaut — ein Terrain-`onDeath{self}` (z. B. „wenn dieses
   Terrain zerstört wird, …") fehlt noch komplett, ist aber angesichts der
   dauerhaft fixen Terrain-Anzahl (5, siehe Übersichtstabelle) vermutlich
   kein Kandidat für eine NEUE Terrain-Karte, sondern höchstens ein
   Nachtrag auf einem der fünf bestehenden Terrains (Rücksprache mit
   Game-Architect empfohlen, falls gewünscht — Terrains gelten laut
   Design-Linie als „bewusst fix"). Weitere `onDeath`-Payoff-Varianten
   (z. B. `tapPermanent`/`addCounters` auf ein gegnerisches Ziel, analog zu
   `core.plaguebound-wretch`, aber in neuen Farben) sind unproblematische
   Zweitkopien.
3. Weiterhin **liberale Wiederverwendung bewährter Bausteine** (Nutzer-
   Vorgabe bleibt für künftige Batches gültig, sofern nicht widerrufen) —
   Symmetriepaare, weitere Keyword-Preispunkte in dünnen Farben/neuen
   Kartentypen und weitere Scope-/Farb-Paare senken das Balance-Risiko
   gegenüber dem Erfinden neuer Kombinationen. Da dies voraussichtlich der
   letzte oder vorletzte Batch ist, bietet sich hier auch ein abschließender
   Blick auf eventuell dünn besetzte Preispunkte/Farb-Typ-Kombinationen an.
4. Mit wachsendem Pool lohnt sich weiterhin ein erster Blick auf
   **Subtyp-Synergien** (z. B. „Untoter"/„Wächter"/„Krieger" als
   wiederkehrende Subtypen) als zusätzliche Designachse — bisher sind
   Subtypen laut `cards.ts` reiner Flavor/Deckbau-Filter ohne Regelwirkung;
   sollte das gewünscht sein, ist vorab Rücksprache mit dem Game-Architect
   nötig (neue Regelsemantik, kein reines Karten-Design). Weiterhin nicht
   Teil eines der bisherigen acht Batch-Aufträge — falls dies der letzte
   Batch vor 300 wird, bleibt diese Designachse dem vollen Set (jenseits
   von 300 Karten) vorbehalten.
5. **Rarity-Balance-Niveau halten:** Batch 7 hat den rare-Anteil auf
   14,5 % gesenkt, Batch 8 hält ihn mit 3 von 30 Karten `rare` praktisch
   stabil (14,0 %). Empfehlung: der Abschlussbatch sollte bei einem
   ähnlichen Anteil bleiben (Faustregel weiterhin: max. ca. 3–5 von 35
   Karten `rare` bei der größeren Abschlussbatch-Größe, nur für Karten mit
   tatsächlich neuem Powerlevel oder Zweitkopien bereits etablierter
   Top-Tier-Muster) — nicht wieder in Richtung des Batch-6-Niveaus
   (15,6 %) zurückrutschen.

**Umsetzung:** Batch 9 hat genau diesen Fahrplan umgesetzt — 35 Karten,
Typ-Ziele proportional hochskaliert, `trample`/tide geschlossen, 5 von 35
Karten `rare` (14,0 % Gesamtpool, exakt gehalten). Details siehe „Batch 9
— Zielplanung" und „Batch 9 (v0.12) — Balancing-Notizen" oben.

## Set-Abschluss (300 Karten erreicht)

Mit Batch 9 (v0.12) hat der Kartenpool sein vereinbartes Zielvolumen von
ca. 300 Karten exakt erreicht: **300 reguläre Karten** (terrain 5, unit
110, spell 72, relic 56, enchantment 57) **+ 3 Token-Hilfsdefinitionen**
(`core.sprout-token`, `core.spirit-token`, `core.skeleton-token`, vom
Deckbau ausgeschlossen, siehe v0.4-Update). Alle Zahlen in diesem
Abschnitt wurden abschließend exakt gegen `src/cards/starter-set.ts`
nachgezählt (per Grep gegen `type:"..."`/`cost:{...}`/`rarity:"..."`-
Vorkommen sowie eine zeilenweise Auswertung der farbspezifischen
`cost`-Objekte, um Aktivierungskosten sauber von Kartenkosten zu
trennen) — nicht aus einer der Zwischenstände der Tabelle oben
fortgeschrieben.

### Finale Typverteilung (300 Karten)

| Typ | Anzahl | Anteil |
|---|---|---|
| terrain | 5 | 1,7 % |
| unit | 110 | 36,7 % |
| spell | 72 | 24,0 % |
| relic | 56 | 18,7 % |
| enchantment | 57 | 19,0 % |

### Finale Farbverteilung (244 farbige Karten aus terrain/unit/spell/enchantment; die 56 Relics sind gemäß Design-Linie „Relics möglichst farblos" bewusst außen vor)

| Farbe | Anzahl | Anteil |
|---|---|---|
| flame | 49 | 20,1 % |
| tide | 49 | 20,1 % |
| wild | 49 | 20,1 % |
| light | 49 | 20,1 % |
| void | 48 | 19,7 % |

Vier der fünf Farben liegen exakt beim rechnerischen Idealwert (20 %), die
fünfte (void) nur 0,3 Prozentpunkte darunter — das rundeste Ergebnis aller
neun Batches (zum Vergleich: nach Batch 4 lag die Spanne noch bei
18,2–22,2 %).

### Finale Rarity-Verteilung (300 Karten)

| Rarity | Anzahl | Anteil |
|---|---|---|
| common | 129 | 43,0 % |
| uncommon | 129 | 43,0 % |
| rare | 42 | 14,0 % |

Der rare-Anteil ist über die Batches 7–9 stabil bei 14,0–14,5 % gehalten
worden (nach einem leichten Anstieg über Batch 4–6 auf 15,6 %) und schließt
das Set damit bewusst NICHT mit einer Rare-lastigen Verteilung ab.

### Design-Philosophie über das gesamte Set hinweg (Rückblick)

- **Liberale Wiederverwendung bewährter Bausteine statt mechanischer
  Einzigartigkeit.** Ab Batch 5 explizit als Nutzer-Vorgabe bestätigt,
  aber schon vorher gelebt: dieselbe Effekt-/Keyword-Kombination taucht
  bewusst mehrfach in unterschiedlichen Farben, Preispunkten und
  Kartentypen auf (z. B. die `StaticAbility scope:self`+Keyword-Familie
  mit am Ende 14 Mitgliedern über alle 5 Farben, oder die
  `grantKeyword`-`ownUnits`-Anthem-Familie auf Relics UND Enchantments).
  Das senkt das Balance-Risiko messbar gegenüber dem Erfinden neuer
  Kombinationen und macht Preispunkte über Farben hinweg direkt
  vergleichbar (siehe „Referenzwert"-Vergleiche in den Balancing-Notizen
  jedes Batches).
- **Farbidentität als durchgehende Leitplanke.** Jede Farbe hat ein
  festes Set an Kern-Keywords/-Mechaniken (flame: Aggression/
  Direktschaden/Eile, ohne `guardian`/`reach`/`lifelink`/`deathtouch` —
  die einzige dauerhafte, dokumentierte Keyword-Farb-Ausnahme im ganzen
  Set; tide: Tempo/Kartenvorteil/Bounce; wild: große Körper/Marken/
  Wachstum; light: Lebensgewinn/Verteidigung/Generalist; void: Opfern für
  Wert/Tod-Trigger/Drain). Jede „Keyword-Farb-Lücke", die NICHT als
  bewusste Identitäts-Entscheidung dokumentiert war, wurde über die
  Batches konsequent identifiziert und geschlossen (`swift`→tide/wild in
  Batch 6, `reach`/`lifelink`/`deathtouch`/`airborne` in Batch 7,
  `trample`→tide als letzte verbleibende Lücke in Batch 9) — am Ende
  dieses Vorhabens ist die einzige verbleibende Lücke in der gesamten
  9×5-Keyword-Farb-Matrix die eine dokumentierte flame-Ausnahme.
- **Balancing-Referenzpunkte statt Einzelfall-Bepreisung.** Für praktisch
  jede Mechanik wurde früh ein farbunabhängiger Referenzpreis etabliert
  (Vanilla-Statlines in Batch 1, `firstStrike`-Symmetriepaar
  `core.ash-duelist`/`core.dawnblade-adept`, `createToken`-
  Symmetriepaar `core.seedling-swarm`/`core.grave-legion`, Burn-Kurve
  `core.fire-jolt`→`core.flame-lance`→`core.scorch-bolt`→`core.
  pyreblast-cannon`, `payLife`/`sacrificeSelf`-Relic-Familien) und jede
  spätere Karte wurde explizit GEGEN diesen Referenzpunkt bepreist statt
  isoliert neu bewertet. Das hat u. a. verhindert, dass Rarity/Preis über
  die neun Batches schleichend auseinanderdriften (die einzige größere
  Schwankung war der rare-Anteil zwischen Batch 4–6, der danach bewusst
  gegengesteuert wurde).
- **Kombinatorische Vorsicht bei „gefährlichen" Keyword-Kombinationen.**
  Die vom Game-Architect als mechanisch besonders stark markierten
  Kombinationen (rules-engine.md 6d(4)) wurden im gesamten Set nur EINMAL
  bewusst gebaut (`core.void-assassin`, `firstStrike`+`deathtouch`, 5
  Mana, rare, absichtlich fragile 1/1-Statline) — `trample`+`deathtouch`
  wurde im gesamten Vorhaben nie gebaut, und der zweite potenziell
  swingy-starke Finisher des Sets (`core.hollowmaw-devourer`,
  `trample`+`lifelink`, Batch 9) wurde bewusst AUSSERHALB dieser Liste
  gewählt, um das Set nicht mit einer zweiten Hochrisiko-Kombination
  abzuschließen.
- **Exakte Code-Gegenprobe statt Doku-Fortschreibung.** Jeder Batch hat
  Typ-/Farb-/Rarity-Zahlen vor UND nach dem Kartenbau direkt gegen
  `src/cards/starter-set.ts` nachgezählt (nie blind aus der bisherigen
  Tabelle übernommen) — das hat mehrfach kleinere Zählfehler früh
  aufgedeckt (z. B. die Rarity-Korrektur bei `core.mossheart-grove`/
  `core.hollowbind-curse` in Batch 9, siehe Balancing-Notizen).

### Mögliche Richtungen für ein künftiges Erweiterungsset

**Ausdrücklich optional — NICHT Teil dieses Auftrags (300-Karten-Ausbau
abgeschlossen) und ohne vorherige Rücksprache mit Game-Architect/
Orchestrierung nicht zu beginnen:**

1. **Subtyp-Synergien** (z. B. „Untoter"/„Wächter"/„Krieger"/
   „Elementarwesen" als wiederkehrende, mechanisch relevante Subtypen
   statt reinem Flavor/Deckbau-Filter). Seit Batch 5 wiederholt als
   Designraum-Idee vorgemerkt, aber bei jedem Batch bewusst NICHT
   angegangen (neue Regelsemantik, braucht vorherige Rücksprache mit dem
   Game-Architect). Der naheliegendste Kandidat für ein Erweiterungsset,
   da der Pool inzwischen genug Subtyp-Wiederholungen für sinnvolle
   Synergien hätte (`Untoter`, `Wächter`, `Krieger`, `Elementarwesen`,
   `Wassergeist`, `Bestie`, `Druide` u. a. kommen jeweils zweistellig oft
   vor).
2. **Neue Effekt-Primitive für Graveyard-Interaktion**, insbesondere
   `exileFromGraveyard` o. ä. — vom Game-Architect in `docs/rules-
   engine.md` §10 als offener Punkt vorgemerkt (Entscheidung 9.14/
   „Offene Fragen" Punkt 7), um den bewusst nicht gebauten „Removal-bei-
   Tod"-Archetyp (`eventSubject` bei `onUnitDied`/`onDeath` in Kombination
   mit permanent-bezogenen Effekten, aktuell garantiert wirkungslos) real
   umsetzbar zu machen.
3. **Mehr als 2 Spieler**, falls die Engine das je unterstützen sollte —
   aktuell nirgends im Regelwerk/Datenmodell vorgesehen (`EffectRecipient`
   kennt nur `controller`/`opponent`, keine Mehrspieler-Targeting-Syntax);
   würde vermutlich neue `EffectRecipient`-Varianten und eine grundlegend
   andere Prioritäts-/Kampf-Reihenfolge erfordern, weit über eine reine
   Karten-Erweiterung hinaus.
4. **Weitere neue Schlüsselwörter/Mechaniken jenseits der bestehenden 9
   Keywords** — bewusst nicht Teil dieses Vorhabens, das sich strikt auf
   den bestehenden Primitiv-Katalog beschränkt hat. Ein Erweiterungsset
   könnte hier ansetzen, sollte aber wie immer zuerst mit dem
   Game-Architect abgestimmt werden (neue Datenmodell-Erweiterung, nicht
   reines Karten-Design).
5. **Zweite/dritte Preispunkt-Ebenen für bereits dichte
   Farb-Typ-Kombinationen weiter ausbauen** (z. B. weitere Rare-Tier-
   Top-End-Karten) — im Prinzip jederzeit ohne Modelländerung möglich,
   aber kein Automatismus: sollte nur bei explizitem Bedarf (z. B. neue
   Power-Level-Ziele) verfolgt werden, nicht nur um die Kartenzahl weiter
   zu erhöhen.

---

## Empirische Balance-Prüfung (Bot-Simulation)

Status: durchgeführt am 2026-07-11 (ai-opponent-engineer, fable-5) — ergänzt
die schriftlichen Balancing-Notizen der neun Batches um eine EMPIRISCHE
Gegenprobe über echte Bot-vs-Bot-Partien auf dem fertigen 300-Karten-Set.

### Wichtige Einschränkung (zuerst, weil sie die Interpretation bestimmt)

Das ist ein **grobes Signal, kein Beweis** für oder gegen Balance:

- **Kein echter Deckbau.** Pro Farbe wurde ein simples Mono-Farb-Deck
  gespielt: 1 Kopie JEDER Nicht-Terrain-Karte der Farbe + 32 Basis-Terrains
  (79–80 Karten, regelkonform: >= 40 Karten, <= 4 Kopien pro Nicht-Terrain).
  Echte Spieler würden gezielter bauen (Kurve, Synergien, 4-of-Power-Karten,
  farblose Relics, Zweifarb-Kombinationen) — eine Farbe kann hier also auch
  deshalb schlecht abschneiden, weil ihr Spielplan Mono-Singleton-Deckbau
  schlecht verträgt, nicht (nur) wegen der Kartenqualität.
- **Bot-Spielstil verzerrt.** Bots spielen kein Instant-Speed-Spiel, halten
  nie Mana offen und nutzen Tempo-Effekte (Bounce, Tappen) sowie
  Lebensgewinn nicht strategisch (docs/ai-status.md, bekannte Schwächen).
  Farben, deren Identität genau davon lebt (tide: Tempo/Timing, light:
  Lebensgewinn/Defensive), werden systematisch UNTERSCHÄTZT; Farben, deren
  Plan "effiziente Bodies ausspielen und angreifen" ist (wild), werden
  tendenziell ÜBERSCHÄTZT — das ist exakt der Spielplan, den jeder Bot
  fehlerfrei umsetzt.
- Ausgeschlossen wurden farblose Relics (hätten das Farb-Signal nur
  symmetrisch verdünnt) und die eine X-Kosten-Karte (Bots casten X-Karten
  nie, da `getLegalActions` sie nicht enumeriert — sie wäre eine tote Karte
  ausschließlich im flame-Deck gewesen).

### Aufbau

- Werkzeug: `src/ai/__tests__/color-balance.analysis.test.ts` — ein
  **Analyse-Tool, KEIN Correctness-Test**; in `npm test`/CI wird es
  übersprungen und läuft nur mit `BALANCE_ANALYSIS=1` (Details/Parameter im
  Datei-Kommentar). Simulations-Infrastruktur identisch zu
  `difficulty.test.ts` (playMatch über die öffentliche RulesEngine).
- Alle 10 Farbpaarungen, N Seeds x beide Rollenzuordnungen pro Paarung
  (neutralisiert den Startspieler-Vorteil), **derselbe Bot auf beiden
  Seiten** — nur die Karten unterscheiden die Seiten, nicht die KI-Stärke.
- Hauptlauf: medium-Bot, 40 Seeds -> 80 Partien/Paarung, 320 Partien/Farbe
  (800 gesamt). Robustheits-Check: hard-Bot (anderer Spielstil: Lookahead,
  echte Kampf-Mathematik, effektive Stats), 15 Seeds -> 120 Partien/Farbe.

### Ergebnis (aggregierte Siegquote pro Farbe über alle Paarungen)

| Farbe | medium, 320 Partien | hard, 120 Partien | Signal |
|---|---|---|---|
| wild  | **74,6 %** | **72,3 %** | deutlich ZU STARK (> 60 %-Schwelle, in beiden Läufen) |
| void  | 53,0 % | 55,5 % | unauffällig |
| flame | 49,4 % | 53,3 % | unauffällig |
| light | 43,8 % | 35,0 % | schwach (unter der 40 %-Schwelle nur im hard-Lauf; medium-Läufe schwankten 32–44 %) |
| tide  | **29,4 %** | **34,2 %** | deutlich ZU SCHWACH (< 40 %-Schwelle, in beiden Läufen) |

Einzel-Paarungen des medium-Hauptlaufs (Siege aus Sicht der ersten Farbe,
80 Partien je Zeile): flame–tide 47:33, flame–wild 30:50, flame–light
42:38, flame–void 39:41, tide–wild 10:70, tide–light 30:50, tide–void
21:59, wild–light 62:18, wild–void 56:23 (+1 Unentschieden), light–void
34:46. Wild gewinnt also JEDE seiner vier Paarungen klar (62–78 %) —
es ist kein einzelnes Ausreißer-Matchup.

### Was den Unterschied treibt (Karten-/Mechanik-Ebene)

- **wild: statistisch bester Body-Kern, besonders bei 3 Mana.** Wilds
  3-Mana-Units (n=14, mehr als jede andere Farbe auf dieser Stufe) haben im
  Schnitt **5,0** Gesamt-Stats (P+T) gegenüber 4,1–4,4 bei allen anderen
  Farben; dazu das größte 4–5-Mana-Top-End (Ø 8,0 bzw. 9,0 Stats) und die
  meisten Units überhaupt (25 von 48 Karten). Zusätzlich hat wild 15
  `addCounters`-Effekte (+1/+1-Wachstum) — PERMANENTER Board-Wert, den auch
  ein simpler Bot voll verwertet. Wilds Partien sind entsprechend die
  kürzesten (Ø ~15–16 Züge): es gewinnt übers reine Aus-Statten des Boards.
- **tide: Identität, die Bots (und Mono-Singleton) nicht tragen.** Tide hat
  die niedrigste Ø-Power (1,29) und seine Stärken (7x `tapPermanent`, 5x
  `returnToHand`, 7x `drawCards`) sind Tempo-/Timing-Effekte, die die Bots
  wertlos bis kontraproduktiv einsetzen. Tides Partien sind die längsten
  (Ø 21–26 Züge) — es kann Spiele nicht schließen. Der wahre Wert von tide
  unter menschlichem Spiel liegt sehr wahrscheinlich ÜBER den gemessenen
  29–34 %.
- **light: ähnlich, milder.** 13 `gainLife`-Effekte stabilisieren, gewinnen
  aber kein Spiel; als echtes Removal existiert nur 1 `exilePermanent`.
  Gegen die Drain-/Removal-Farbe void verliert light seine langen Spiele
  (34:46 bzw. 9:21).
- **flame/void: unauffällig.** Direktschaden (flame, 16x `dealDamage`) und
  Drain/Removal (void) sind Effekte, die auch Bots sinnvoll einsetzen —
  beide landen nahe 50 %.

### Einordnung & Empfehlung (nur Empfehlung — Karten unverändert)

- **wild > 70 % in BEIDEN Bot-Spielstilen ist das belastbarste Signal** der
  Messung: Der Vorsprung liegt in bot-neutral messbarer Statlinien-Effizienz
  (nicht in einer Mechanik, die nur Bots bevorzugen). Empfehlung an den
  card-designer für einen künftigen Balance-Pass: die 3-Mana-Unit-Stufe von
  wild gezielt prüfen (Ø 5,0 Stats bei n=14 gegenüber 4,1–4,4 der anderen
  Farben) — schon 1–2 der effizientesten 3-Drops um je einen Statpunkt zu
  reduzieren oder im Preis anzuheben, dürfte das Feld deutlich schließen.
- **tide/light NICHT vorschnell buffen:** Deren schwache Zahlen sind
  mindestens teilweise ein Artefakt des Bot-Spielstils (siehe
  Einschränkungen). Erst nach einem wild-Rebalancing neu messen; falls tide
  dann immer noch klar unter 40 % liegt, wäre ein Blick auf tides
  Win-Condition-Dichte (niedrigste Ø-Power des Sets) der nächste Kandidat.
- Die Typ-/Farb-/Rarity-GLEICHVERTEILUNG des Sets (siehe Set-Abschluss oben)
  bleibt davon unberührt korrekt — die Messung zeigt, dass gleiche
  VERTEILUNG nicht automatisch gleiche SPIELSTÄRKE bedeutet.

### Nebenbefund: zwei Bot-Legalitätsfehler gefunden und behoben

Die ersten Analyse-Läufe deckten zwei Fehler in den BOTS (nicht in Engine
oder Karten) auf, die erst durch das 300-Karten-Set erreichbar wurden;
beide wurden im Zuge dieser Analyse in `src/ai/*` behoben (Details:
docs/ai-status.md, Abschnitt 10): statisch gewährte Keywords (z. B.
guardian-Auren) wurden bei der Blockpflicht-Erkennung von easy/medium
ignoriert, und modale Karten (`core.void-covenant`, die beiden modalen
Relics) wurden von medium/easy als rohe, von der Engine abgelehnte
Kandidaten eingereicht (hard hat sie still verworfen). Ohne diese Fixes
wären u. a. void-Partien mitten im Spiel steckengeblieben.

## Balance-Korrektur nach empirischer Prüfung (v0.13, Card-Designer)

Status: durchgeführt am 2026-07-11, direkte Reaktion auf den Abschnitt
„Empirische Balance-Prüfung (Bot-Simulation)" oben. Auftrag: gezielter
Balance-Pass, **ausschließlich `wild` betreffend**, keine neuen Karten,
keine Änderungen an anderen Farben, keine pauschale Abschwächung der
`addCounters`-Wachstumsmechanik.

### Vorgehen

Vor jeder Änderung wurden alle `wild`-Units mit Gesamtkosten 3 Mana exakt
gegen den Code nachgezählt (nicht aus der Doku übernommen): **14 Karten**,
identisch zur im Bot-Simulations-Befund genannten Stichprobe (n=14). Die
Summe ihrer gedruckten `power`+`toughness`-Felder ergab **70**, also exakt
Ø 5,0 — passt exakt zum gemeldeten Befund und bestätigt, dass die
Diagnose auf denselben 14 Karten beruht, die hier bearbeitet wurden.

**Referenzwert:** 4,1–4,4 Ø Gesamt-Stats bei den übrigen vier Farben auf
derselben Kostenstufe (laut Bot-Simulations-Befund). Ziel dieses Passes:
wilds Schnitt auf ca. 4,2–4,4 senken, ohne auf das Niveau der schwächsten
Farbe zu drücken.

**Auswahlkriterium:** Karten mit Gesamt-Stats ≥ 5 wurden als Ausreißer nach
oben behandelt und geprüft. Eine Ausnahme: `core.thornrage-boar` (Gesamt-
Stats 5) wurde NICHT verändert, weil seine Statline bereits in einer
früheren Batch-Notiz explizit als bewusster Abzug gegenüber einer
Referenzkarte dokumentiert war (Ausgleich für eine ungewöhnlich starke
Vergeltungs-Fähigkeit) — genau der in der Aufgabenstellung genannte Fall
„Karte mit bereits dokumentierter Balancing-Begründung, Statline schon
absichtlich niedrig". Zwei weitere Karten mit Gesamt-Stats 4
(`core.bramblewild-shaman`, `core.thornseed-caller`) und die niedrigste
Karte der Stufe (`core.thornwild-forager`, Gesamt-Stats 3) wurden ebenfalls
NICHT verändert — sie lagen bereits auf oder unter dem Zielkorridor.

**Zusätzlicher, bei der Prüfung entdeckter Faktor (siehe Punkt 4 des
Auftrags):** Drei der 14 Karten (`core.stoneguard-paragon`,
`core.thornhide-brawler`, `core.thornreach-strider`) tragen zusätzlich zu
ihren gedruckten Werten eine `StaticAbility scope:"self"` mit einem
dauerhaften `stats`-Modifier („angeborene Stärke"). Der reine Rohwert-
Vergleich (gedruckte `power`+`toughness`-Felder, wie er dem gemeldeten
Ø 5,0 zugrunde liegt) zählt bei diesen drei Karten NUR die gedruckten
Basiswerte, nicht den Static-Bonus — ihre tatsächliche Battlefield-Statline
liegt also höher, als der Rohwert-Schnitt zeigt (z. B. `core.thornhide-
brawler`: Rohwert 2/2=4, tatsächlich aber 3/4=7 durch den Bonus). Das
bedeutet, der gemeldete Ø 5,0 unterschätzt eher als überschätzt wilds
echten Statistik-Vorsprung. Deshalb wurde `core.thornhide-brawler` trotz
eines Rohwerts unterhalb der 5-Punkte-Schwelle ebenfalls korrigiert (siehe
Tabelle). Dies ist kein neuer, unabhängiger Balance-Faktor (keine neue
Mechanik wird bestraft), sondern eine Präzisierung derselben Diagnose
(Statlinien-Effizienz) für die drei Karten, bei denen die Statline nicht
vollständig in den gedruckten Feldern sichtbar ist.

### Geänderte Karten: 3-Mana-Stufe (10 von 14 Karten)

Alle Änderungen sind −1 auf ein gedrucktes Statfeld (Toughness, bei zwei
Karten mit `StaticAbility scope:self` wirkt sich das über den unveränderten
Modifier auch auf die tatsächliche Battlefield-Statline aus).

| Karte | Vorher | Nachher | Begründung |
|---|---|---|---|
| `core.thornback-warden` | 2/4, `reach` | 2/3, `reach` | Reiner Keyword-Körper ohne weitere Fähigkeit, Gesamt-Stats 6 — einer der höchsten der Stufe für ein rein defensives Evasion-Keyword. |
| `core.bramblehide-sentinel` | 2/4, `guardian` | 2/3, `guardian` | Gesamt-Stats 6; die dokumentierte „mittlerer Preispunkt zwischen core.harbor-warden/core.temple-sentinel"-Einordnung bleibt in der Power-Progression erhalten, guardian ist laut Regelwerk auf defensiven Linien ohnehin kaum ein Nachteil. |
| `core.thistlehide-healer` | 3/3, `lifelink` | 3/2, `lifelink` | Gesamt-Stats 6, einzige 3-Mana-lifelink-Karte im Set; bleibt nach der Korrektur weiterhin über den 2-Mana-Referenzen `core.sun-acolyte` (2/2) und `core.tidewell-cleric` (1/3). |
| `core.moss-elder` | 2/3 (ETB `addCounters` self) | 2/2 (ETB `addCounters` self) | Effektiv 3/4 → 3/3 nach dem ETB-Marker; Gesamt-Stats vorher 5 (Karte + Marker faktisch 7). |
| `core.stoneguard-paragon` | 2/3 + Static `+1/+1` self (effektiv 3/4) | 2/2 + Static `+1/+1` self (effektiv 3/3) | Gedruckt 5, aber wie oben beschrieben effektiv 7 — einer der am stärksten unterschätzten Rohwerte der Stufe. |
| `core.thornhide-brawler` | 2/2 + Static `+1/+2` self, `trample` (effektiv 3/4) | 2/1 + Static `+1/+2` self, `trample` (effektiv 3/3) | Gedruckter Rohwert nur 4 (daher zunächst nicht im Fokus), aber effektiv 7 — die höchste tatsächliche Battlefield-Statline der gesamten Stufe neben `core.ironhide-bison`. Jetzt exakt auf Augenhöhe mit `core.wildfire-boar` (flame, 3/3 `trample`, gleicher Preis). |
| `core.thornbound-guard` | 1/4 (wächst via `onBlockDeclared`) | 1/3 (wächst via `onBlockDeclared`) | Gesamt-Stats 5; war zuvor bewusst identisch zu `core.wardflame-sentinel` (light) eingestuft — weicht jetzt ab, vertretbar, weil der Marker hier PERMANENT ist (Board-Wert-Aufbau), `wardflame-sentinel`s `gainLife` dagegen nicht. |
| `core.sporewing-strider` | 2/3, `airborne` | 2/2, `airborne` | Gesamt-Stats 5, war ausdrücklich als „zäher als core.aerie-benediction" dokumentiert (light, 2/2 `airborne`, gleicher Preis) — nach der Korrektur jetzt identische Statline statt Mehrwert. |
| `core.ironhide-bison` | 3/4, vanilla | 3/3, vanilla | Gesamt-Stats 7 — höchster Rohwert der gesamten Stufe UND ohne jede Fähigkeit, damit der klarste Einzel-Ausreißer des Sets auf dieser Kostenstufe. |
| `core.thornreach-strider` | 2/3 + Static `+1/+0` self, `reach` (effektiv 3/3) | 2/2 + Static `+1/+0` self, `reach` (effektiv 3/2) | Gedruckt 5, wie oben beschrieben mit verstecktem Static-Bonus. |

**Unverändert (Ausreißer-Kandidat, aber dokumentierte Ausnahme):**
`core.thornrage-boar` (2/3, Vergeltungs-Trigger) — Statline war bereits in
Batch 3 explizit als Abzug gegenüber `core.thornback-warden` begründet.

**Unverändert (bereits im/unter dem Zielkorridor):**
`core.bramblewild-shaman` (2/2, modale ETB-Wahl), `core.thornseed-caller`
(2/2, ETB-Token), `core.thornwild-forager` (1/2, modale ETB-Wahl).

**Ergebnis 3-Mana-Stufe:** Summe der gedruckten Gesamt-Stats sinkt von
**70 auf 60** über dieselben 14 Karten — **Ø 5,0 → Ø 4,29**, jetzt innerhalb
des angepeilten Korridors (4,2–4,4) und nah am Mittelwert der übrigen vier
Farben (4,1–4,4), ohne auf das niedrigste Niveau überzukorrigieren.

### Geänderte Karte: 4–5-Mana-Top-End (1 Karte)

Cross-Farb-Vergleich der 4–5-Mana-`wild`-Units gegen die einzigen direkt
vergleichbaren Einzel-Keyword-Körper anderer Farben auf derselben
Kostenstufe (`flame` hat keine Units über 3 Mana):

| Kostenstufe | Karte | Gesamt-Stats |
|---|---|---|
| 4 Mana | `core.stonebark-elder` (wild, `vigilant`) | 8 |
| 4 Mana | `core.temple-sentinel` (light, `guardian`) | 7 |
| 4 Mana | `core.hollow-ravager` (void, `trample`) | 7 |
| 5 Mana | `core.overgrowth-colossus` (wild, `trample`) | **10** |
| 5 Mana | `core.grove-elder` (wild, Aktivierte Fähigkeit) | 8 |
| 5 Mana | `core.sunforged-colossus` (light, `trample`) | 9 |
| 5 Mana | `core.hollowmaw-devourer` (void, `trample`+`lifelink`) | 8 |

`core.overgrowth-colossus` sticht mit Gesamt-Stats 10 klar heraus — höher
als jede andere 4–5-Mana-Karte im gesamten Set, obwohl `core.sunforged-
colossus` (light) exakt dasselbe einzelne Keyword (`trample`) für denselben
Preis trägt. `core.stonebark-elder` und `core.grove-elder` liegen zwar auch
leicht über den Referenzwerten, aber innerhalb einer Spanne, die durch die
kleine Stichprobe (n=1 bzw. n=2 je Farbe) nicht als „klarer Ausreißer"
gewertet wird (Auftrag: Fokus bleibt die 3-Mana-Stufe, Top-End nur bei
klarem Befund anpassen) — beide bleiben daher unverändert.

| Karte | Vorher | Nachher | Begründung |
|---|---|---|---|
| `core.overgrowth-colossus` | 5/5, `trample` (5 Mana) | 5/4, `trample` (5 Mana) | Höchste Gesamt-Stats-Zahl im gesamten 4–5-Mana-Top-End des Sets, bei identischem Einzelkeyword zu `core.sunforged-colossus`, das einen Punkt niedriger liegt. Nach der Korrektur besteht Parität statt Vorsprung. |

### Nicht verändert (explizit, laut Auftrag)

- Keine der 15 `addCounters`-Wachstumseffekte in `wild` wurde entfernt oder
  abgeschwächt — die Diagnose zeigt Statlinien-Effizienz, nicht die
  Marken-Mechanik selbst, als Hauptursache.
- Keine Karte einer anderen Farbe wurde verändert (tide/light bleiben wie
  in der Bot-Simulations-Analyse dokumentiert unangetastet, da deren
  schwache Werte laut Befund mindestens teilweise ein Bot-Artefakt sein
  könnten und eine gesonderte Prüfung brauchen).
- Keine Karte wurde entfernt oder umbenannt; alle Änderungen sind reine
  Statfeld-Anpassungen (kein neues Modell-Primitiv, keine neue Fähigkeit).

### Gesamtergebnis

**11 Karten geändert** (10 auf der 3-Mana-Stufe + 1 im 4–5-Mana-Top-End).
3-Mana-Stufe: Ø Gesamt-Stats **5,0 → 4,29** (Summe 70 → 60 über 14 Karten).
Nächster Schritt (liegt beim Auftraggeber/`ai-opponent-engineer`): erneuter
Bot-Simulations-Lauf, um zu prüfen, ob wilds Siegquote sich Richtung 50 %
bewegt.

**Nachtrag (siehe Abschnitt „Balance-Korrektur Runde 2" unten): der erneute
Bot-Simulations-Lauf zeigte, dass dieser Pass NICHT ausgereicht hat — wilds
Siegquote blieb bei 71,4 %, praktisch unverändert gegenüber den 73–75 %
vor diesem Pass.** Die Kurzfassung der Diagnose: dieser Pass hat
ausschließlich die GEDRUCKTEN Statfelder korrigiert; bei den 3 Karten mit
verstecktem `StaticAbility scope:"self"`-Statbonus (siehe oben) sank dadurch
zwar auch die tatsächliche (effektive) Statlinie um jeweils 1 Punkt, aber
nicht stärker als bei den übrigen, bonuslosen Karten — die eigentliche
Ursache (dass mehrere Karten einen nicht durch Marken-Antworten entfernbaren
Dauerbonus tragen) blieb unangetastet. Details siehe unten.

## Balance-Korrektur Runde 2 (wild, nach erfolgloser Runde 1)

Status: durchgeführt am 2026-07-11, direkte Reaktion auf einen zweiten,
vom Auftraggeber selbst durchgeführten Bot-Simulations-Lauf NACH der Runde-
1-Korrektur oben. Auftrag: eine gründlichere zweite Korrekturrunde,
ausschließlich `wild` betreffend, diesmal mit ausdrücklicher Erlaubnis für
stärkere Einzelkorrekturen UND für Eingriffe in die `addCounters`-Mechanik
selbst, falls die Analyse das nahelegt (die Runde-1-Einschränkung
„keine addCounters-Änderungen" gilt für diese Runde nicht mehr).

### Warum Runde 1 nicht ausgereicht hat (ehrliche Einordnung)

**Befund nach Runde 1 (Auftraggeber-Messung, medium vs. medium, 15 Seeds ×
2 Rollen, 120 Partien/Farbe):** `wild` gewann weiterhin **71,4 %** seiner
Partien — der Rückgang gegenüber den 73–75 % vor Runde 1 liegt innerhalb
der Stichproben-Schwankung und ist statistisch praktisch bedeutungslos.
Einzel-Matchups blieben extrem lopsided: wild schlägt light 25:5, wild
schlägt tide 24:6, wild schlägt void 20:9.

**Ursache (im Rückblick):** Runde 1 hat pro betroffener Karte durchgängig
genau **−1 auf ein gedrucktes Statfeld** angewendet — sowohl bei Karten
ohne versteckten Bonus als auch bei den 3 Karten MIT einem permanenten
`StaticAbility scope:"self"`-Statbonus (`core.stoneguard-paragon`,
`core.thornhide-brawler`, `core.thornreach-strider`). Dadurch sank zwar
auch bei diesen 3 Karten die tatsächliche (effektive) Statlinie um jeweils
1 Punkt — aber nur um denselben einen Punkt wie bei allen anderen Karten,
nicht stärker. Eine Nachrechnung der ECHTEN effektiven Statlinien (gedruckt
+ permanenter Static-Bonus + ETB-Marker, nicht nur die gedruckten Felder)
für alle 14 Karten der 3-Mana-Stufe zeigt das Ausmaß:

| Zeitpunkt | Ø gedruckte Gesamt-Stats (Rohwert) | Ø EFFEKTIVE Gesamt-Stats (inkl. Static-Bonus/ETB-Marker) |
|---|---|---|
| Vor Runde 1 | 5,00 | **5,57** |
| Nach Runde 1 | 4,29 | **5,00** |
| Referenzband andere Farben (3 Mana, dieselbe Methodik) | — | **~4,0–4,7** (tide 4,13, light 4,25 [n=4], void 4,00 [n=4, ohne Token], flame 4,67) |

Der gemeldete Rohwert-Rückgang (5,00 → 4,29) sah nach einer soliden
Korrektur aus, aber die für Bot-Partien tatsächlich relevante Zahl (was
wirklich auf dem Feld steht) sank nur von 5,57 auf 5,00 — weiterhin ca.
0,3–1,0 Punkte über dem Referenzband der übrigen Farben. Das erklärt, warum
sich die Siegquote praktisch nicht bewegt hat: der reale Statlinien-
Vorsprung wurde nur zu gut einem Drittel abgebaut.

**Zusätzlicher Faktor, der in Runde 1 komplett ausgeklammert war (Punkt 2
des aktuellen Auftrags):** zwei Fähigkeiten in wild sind nicht nur wegen
ihrer Statlinie, sondern strukturell (auf Fähigkeitsebene) stärker als ihre
Geschwisterkarten in anderen Farben, unabhängig vom Stat-Vergleich:

- `core.thornrage-boar` (Vergeltung: Schaden an die Schadensquelle bei
  jedem erhaltenen Schaden) teilt **2** Schaden aus — die drei später
  gebauten Zweitkopien desselben Musters (`core.cinderlash-brute`/flame,
  `core.lucent-retaliator`/light, `core.hollowveil-reaver`/void) teilen
  bei vergleichbarer/identischer Statline alle nur **1** Schaden aus. Runde
  1 hatte die Karte bewusst unangetastet gelassen, weil ihre Statline
  „bereits als Ausgleich dokumentiert" war — aber der Ausgleich bezog sich
  auf `core.thornback-warden`, nicht auf die drei Vergleichskarten, die es
  zum Zeitpunkt der ursprünglichen Dokumentation noch gar nicht gab. Im
  Cross-Farb-Vergleich ist wild hier schlicht die stärkste Version
  desselben Effekts zum gleichen Preis.
- `core.grove-elder` (3/5 für 5 Mana, `{1}{Wild}`: permanenter +1/+1-Marker
  auf eine eigene Kreatur, beliebig oft wiederholbar) ist ein
  unbegrenzter Marken-Mana-Sink ohne vergleichbares Gegenstück in einer
  anderen Farbe auf gleicher Rarity — in langen/kontrollierten Partien
  (genau dem Szenario, in dem wild gegen die eher defensiven Farben tide
  und light mit 24:6 bzw. 25:5 dominiert) liefert diese eine Karte pro
  Partie potenziell beliebig viel zusätzlichen Statwert, was in keiner
  Rohwert- oder Effektiv-Stats-Tabelle auftaucht.

Zusammengefasst: Runde 1 hat eine reale, aber zu kleine Korrektur an der
richtigen Stelle (3-Mana-Statlinien) vorgenommen und einen zweiten,
strukturellen Faktor (Fähigkeitsstärke statt Statlinie) komplett
übersehen, weil der Auftrag sich explizit auf „Statlines der Ausreißer"
beschränkt hatte.

### Vorgehen Runde 2

Cross-Farb-Vergleich der EFFEKTIVEN Statlinien (gedruckt + permanenter
Static-Bonus/ETB-Marker, Token separat ausgewiesen) für alle 25 `wild`-Units
über alle Kostenstufen (1–5 Mana), nicht nur 3 Mana:

- **1–2 Mana:** keine vergleichbaren versteckten Boni gefunden; Statlinien
  liegen im selben Band wie andere Farben auf denselben Preispunkten
  (z. B. `core.thornviper-skirmisher` 1/3 `firstStrike` für 2 Mana =
  identisch zu `core.riftfin-duelist`/tide). Keine Änderung in diesem Band.
- **3 Mana:** wie oben, der Hauptbefund — 5 Karten mit permanentem
  Selbst-Bonus (3× `StaticAbility scope:self`, 1× ETB-Marker plus
  `core.thornbound-guard`s `onBlockDeclared`-Wachstum) treiben die
  effektive Statlinie über das Referenzband, obwohl 3 davon in Runde 1
  bereits angefasst wurden.
- **4–5 Mana:** `core.overgrowth-colossus` liegt nach Runde 1 in Parität
  mit `core.sunforged-colossus` (beide Gesamt-Stats 9) — kein weiterer
  Handlungsbedarf. `core.stonebark-elder` (4/4 `vigilant`, 4 Mana, Gesamt-
  Stats 8) hat kein direktes 4-Mana-Gegenstück in anderen Farben auf
  derselben Kostenstufe und bleibt aus Mangel an belastbarem Vergleich
  unangetastet (Auftrag: chirurgisch, nicht pauschal). `core.grove-elder`
  (5 Mana) wird dagegen korrigiert — nicht wegen seiner Statlinie (3/5 war
  bereits unterdurchschnittlich für 5 Mana, siehe Balancing-Notiz oben im
  Dokument), sondern wegen seiner Fähigkeit (siehe oben).

**Auswahl der Ausreißer für Runde 2 (7 Karten: 6 Units + 1 Spell,
„chirurgisch" statt pauschal):**

### Geänderte Karten Runde 2

| Karte | Vorher (nach Runde 1) | Nachher (Runde 2) | Begründung |
|---|---|---|---|
| `core.stoneguard-paragon` | 2/2 + Static `+1/+1` self (effektiv 3/3 = 6) | 1/2 + Static `+1/+1` self (effektiv 2/3 = 5) | Der Static-Bonus ist KEIN Marker und daher von keiner bestehenden Counter-Antwort (`core.wither-touch`, `core.tidewash-cleanse`, `core.corrosive-clamp`) entfernbar — strukturell widerstandsfähiger als das mechanisch fast identische ETB-Marker-Muster (`core.moss-elder`), das Runde 1 identisch behandelt hatte. Zusätzlicher Abzug diesmal auf den GRUNDDRUCK (Power) statt erneut auf Toughness, um nicht bei jeder Karte immer nur denselben Statwert zu kürzen. |
| `core.thornhide-brawler` | 2/1 + Static `+1/+2` self, `trample` (effektiv 3/3 = 6) | 2/1 + Static `+1/+1` self, `trample` (effektiv 3/2 = 5) | Gleicher Nicht-Entfernbarkeits-Befund wie oben. Diesmal wird der VERSTECKTE BONUS SELBST gekürzt (+1/+2 → +1/+1) statt der gedruckte Grunddruck (der ist mit 2/1 bereits sehr dünn) — trifft die eigentliche Ursache direkter. |
| `core.moss-elder` | 2/2 + ETB `+1/+1` self (effektiv 3/3 = 6) | 1/2 + ETB `+1/+1` self (effektiv 2/3 = 5) | Parallel zu `core.stoneguard-paragon` behandelt (nahezu identisches Bauprinzip: Grundkörper + permanenter Selbst-Buff), damit nach Runde 2 nicht einer der beiden Baupläne zum neuen relativen Ausreißer gegenüber dem anderen wird. |
| `core.thornbound-guard` | 1/3, `onBlockDeclared` → permanenter `+1/+1`-Marker | 1/2, `onBlockDeclared` → permanenter `+1/+1`-Marker (Fähigkeit unverändert) | Zusätzlicher Abzug über die Runde-1-Korrektur hinaus (1/4 → 1/3 → 1/2): der Marker ist PERMANENT und stapelt sich über beliebig viele Blocks — strukturell mehr wert als der einmalige `gainLife`-Wert der Vergleichskarten (`core.wardflame-sentinel`/light, `core.tideshell-warden`/tide) oder `dealDamage` (`core.brandwatch-mercenary`/flame) bei jedem Block. Ein zäherer Ausgangskörper würde diesen Compounding-Vorteil nur verlängern. |
| `core.thornrage-boar` | 2/3, Vergeltung 2 Schaden | 2/3, Vergeltung **1** Schaden (Statline unverändert) | Fähigkeitsebene statt Statline: bringt die Vergeltungsstärke exakt auf das Niveau der drei Zweitkopien (`core.cinderlash-brute`/flame, `core.lucent-retaliator`/light, `core.hollowveil-reaver`/void), die alle nur 1 Schaden austeilen. Runde 1 hatte die Karte explizit verschont, weil nur die Statlinie geprüft wurde — die Fähigkeit selbst war der eigentliche Vorsprung. |
| `core.grove-elder` | 3/5, `{1}{Wild}`: permanenter `+1/+1`-Marker (beliebig oft) | 3/4, `{2}{Wild}`: permanenter `+1/+1`-Marker (beliebig oft) | Statlinie zusätzlich um 1 Toughness gekürzt UND die Aktivierungskosten um 1 generisches Mana erhöht — der unbegrenzt wiederholbare Marken-Mana-Sink ohne Gegenstück in anderen Farben ist der plausibelste Treiber für wilds extreme Siegquote in langen Partien gegen die defensiveren Farben (tide 24:6, light 25:5). Die farblose Vergleichskarte `core.growth-totem` (Relic, `{2}`: `+1/+1`-Marker) wurde parallel von `{2}` auf `{3}` angehoben, damit der dokumentierte „farblos, aber teurer"-Trade-off gegenüber `core.grove-elder` erhalten bleibt. |
| `core.wildroot-graft` (Spell) | Kosten `{1}{Wild}` (2 Mana), 2 Marken auf EIN Ziel (effektiv permanent +2/+2) | Kosten `{2}{Wild}` (3 Mana), Effekt unverändert | Cross-Farb-Vergleich der „permanent"-Effekt-Familie zeigt eine etablierte Preisregel: „+1 Mana pro zusätzlicher Effekt-Stufe" (`core.rootbound-mark`: `trample` permanent = 3 Mana vs. `core.bramble-surge`: `trample` `endOfTurn` = 1 Mana; `core.aegis-oath`: `+0/+3` permanent = 3 Mana vs. `core.aegis-ward`: `+0/+3` `endOfTurn` = 2 Mana). Ein permanentes `+2/+2` auf ein einzelnes Ziel (stärkster Einzelziel-Permanent-Buff im gesamten Set) kostete bisher dieselben 2 Mana wie `core.twinroot-blessing`s schwächere, aufgeteilte Variante (je 1 Marke auf zwei Ziele) — im Vergleich zur etablierten Preisregel klar unterbepreist. Einzige Spell-Korrektur dieser Runde (Runde 1 hatte ausschließlich Units angefasst). |

### Nicht verändert (explizit geprüft)

- `core.ironhide-bison` (3/3 vanilla, 3 Mana, Gesamt-Stats 6): bereits in
  Runde 1 von 3/4 auf 3/3 gekürzt und liegt jetzt exakt auf dem Niveau von
  `core.wildfire-boar` (flame, 3/3 `trample`, gleicher Preis) — da
  `wildfire-boar` zusätzlich ein Keyword trägt, ist `ironhide-bison` bei
  identischer Statzahl de facto die SCHWÄCHERE Karte der beiden. Kein
  weiterer Ausreißer.
- `core.overgrowth-colossus`, `core.stonebark-elder`: siehe „Vorgehen
  Runde 2" oben — bereits in Parität bzw. ohne belastbaren Cross-Farb-
  Vergleich, daher unangetastet.
- `core.thornreach-strider` (2/2 + Static `+1/+0` `reach`, effektiv 3/2 = 5
  für 3 Mana): trägt zwar denselben nicht-entfernbaren Static-Bonus-Typ wie
  die drei oben korrigierten Karten, liegt aber bereits nach Runde 1 exakt
  im Referenzband (5 von 4,0–4,7) statt darüber — kein zusätzlicher Abzug,
  um nicht unter den Zielkorridor zu drücken.
- Die übrigen 14 `addCounters`-Wachstumseffekte in wild (von 15 insgesamt;
  `core.grove-elder` ist die einzige in dieser Runde geänderte) wurden
  NICHT abgeschwächt — die Diagnose zeigt, dass ausgerechnet der EINE
  unbegrenzt wiederholbare Mana-Sink (`core.grove-elder`) der strukturelle
  Ausreißer ist, nicht die feste Anzahl an ETB-/Trigger-Markern der übrigen
  Karten (je 1–2 Marken, einmalig, wie in jeder anderen Farbe mit
  vergleichbaren Mustern auch).
- Keine andere Farbe wurde verändert (Auftrag: `void`s Anstieg auf 58,8 %
  im Blick behalten, aber laut Auftrag noch nicht behandeln — braucht eine
  erneute Messung nach diesem Pass, um zu prüfen, ob es sich um eine reine
  Rang-Verschiebung durchs Round-Robin-Format handelt oder um einen
  eigenständigen Befund).

### Gesamtergebnis Runde 2

**7 Karten geändert** (6 Units + 1 Spell), zusätzlich 1 Konsistenz-Anpassung
an einer farblosen Vergleichskarte (`core.growth-totem`, kein `wild`-Objekt,
daher nicht Teil der 7 gezählten Balance-Änderungen).

3-Mana-Stufe, EFFEKTIVE Gesamt-Stats (gedruckt + Static-Bonus/ETB-Marker,
n=14, dieselbe Methodik wie im „Warum Runde 1 nicht ausgereicht hat"-
Abschnitt oben):

| Zeitpunkt | Ø effektive Gesamt-Stats |
|---|---|
| Vor Runde 1 | 5,57 |
| Nach Runde 1 | 5,00 |
| **Nach Runde 2** | **4,57** |
| Referenzband andere Farben | ~4,0–4,7 |

Der effektive Abstand zum Referenzband ist damit von ursprünglich ca. 1,3
Punkten (5,57 vs. Bandmitte ≈ 4,26) über 0,74 Punkte nach Runde 1 auf noch
ca. 0,3 Punkte nach Runde 2 gesunken — eine Reduktion des Statlinien-
Vorsprungs um ca. 75–80 % gegenüber dem ursprünglichen, unkorrigierten
Ausgangswert, gegenüber nur ca. 25 % nach Runde 1 allein. Hinzu kommen die
beiden fähigkeitsseitigen Korrekturen (`core.thornrage-boar`-Vergeltung
halbiert, `core.grove-elder`-Mana-Sink um 50 % verteuert), die in keiner
Stats-Tabelle sichtbar sind, aber gezielt den in den Einzel-Matchups
sichtbaren Langpartie-Vorsprung gegen tide/light adressieren, sowie die
`core.wildroot-graft`-Kostenkorrektur (adressiert die Spell-Ebene der
`addCounters`-Ökonomie, die Runde 1 komplett ausgeklammert hatte).

**Eigene Einschätzung (Card-Designer):** Diese Runde sollte spürbar mehr
bewirken als Runde 1, da sie (a) den in Runde 1 nachweislich unwirksamen
Mechanismus (nur gedruckte Felder kürzen) durch gezielte Kürzung der
tatsächlich unentfernbaren Boni ersetzt, (b) zwei rein fähigkeitsseitige
Vorsprünge behebt, die Runde 1 komplett übersehen hatte, und (c) mit der
`wildroot-graft`-Korrektur erstmals auch die Spell-Seite der `addCounters`-
Ökonomie anfasst. Die verbleibende Rohwert-Lücke von ca. 0,3 Punkten zum
Referenzband ist klein genug, dass ich NICHT erwarte, dass sie allein für
eine weiterhin 70-%+-Siegquote verantwortlich wäre. Ich schätze realistisch,
dass wilds Siegquote nach diesem Pass in den Bereich 55–62 % sinken sollte
— eine Punktlandung bei 50 % erwarte ich NICHT mit Sicherheit, da die
Diagnose (Statlinien-Effizienz + zwei Fähigkeits-Ausreißer) zwar die
plausibelsten, aber nicht zwangsläufig einzigen Treiber sind; sollte die
Siegquote nach diesem Pass immer noch deutlich über 60 % liegen, wäre das
ein starkes Signal, dass ein bisher nicht identifizierter Faktor (z. B.
Synergie zwischen mehreren wild-Karten im Deckbau, nicht nur Einzelkarten-
Power-Level) die eigentliche Ursache ist und eine dritte, deck-/synergie-
fokussierte statt karten-fokussierte Untersuchung nötig würde. Nächster
Schritt (liegt beim Auftraggeber/`ai-opponent-engineer`): erneuter
Bot-Simulations-Lauf.

## Balance-Korrektur Runde 3 (wild vertiefen + void-Prüfung)

Status: durchgeführt am 2026-07-18, Reaktion auf eine dritte, vom
Auftraggeber durchgeführte Bot-Simulation (medium vs. medium, 15 Seeds ×
2 Rollen, 120 Partien/Farbe) nach Runde 2. Auftrag zweigeteilt: **Teil A**
— `wild` weiter abschwächen, mit explizitem Fokus auf die Frage, ob die
Runde-2-Korrektur an `core.grove-elder`/`core.growth-totem` ausgereicht hat
oder eine strukturellere Änderung braucht. **Teil B** (NEU, nicht Teil
früherer Aufträge) — prüfen, ob `void`s unverändert bei 23:7 liegender
Vorsprung gegenüber `tide` UND `light` eine echte, kartenbasierte Ursache
hat oder überwiegend ein Bot-Artefakt ist.

### Ergebnis nach Runde 2 (Ausgangslage dieser Runde)

| Farbe | Siegquote |
|---|---|
| wild | 64,7 % (vorher 71,4 %, davor 73–75 %) |
| void | 62,2 % (vorher 58,8 %) |
| flame | 53,3 % |
| tide | 35,8 % |
| light | 34,2 % |

Wichtige Zusatzbeobachtung des Auftraggebers: die Einzel-Matchups
`void` vs. `tide` (23:7) und `void` vs. `light` (23:7) sind in BEIDEN
Messungen (vor und nach der Runde-2-Korrektur) exakt identisch. `void`s
gestiegene AGGREGIERTE Quote (58,8 % → 62,2 %) erklärt sich vollständig
durch einen Rang-Verschiebungseffekt (`void` gewinnt jetzt öfter gegen das
schwächer gewordene `wild`, 13:16 statt 9:20) — `void`s Vorsprung
gegenüber `tide`/`light` selbst ist nachweislich unabhängig von der
`wild`-Korrektur und bereits die ganze Zeit über strukturell stabil.

### Teil A: wild — Vertiefung der Grove-Elder/Growth-Totem-Korrektur

**Diagnose:** Runde 2 hatte `core.grove-elder`s Aktivierungskosten von
`{1}{Wild}` auf `{2}{Wild}` angehoben (Toughness zusätzlich 5→4) und
`core.growth-totem` (das farblose, direkte Vergleichs-Relic) parallel von
`{2}` auf `{3}` — beides reine KOSTENERHÖHUNGEN, keine Begrenzung der
Aktivierungshäufigkeit. Der eigentliche, in Runde 2 selbst schon benannte
Befund war aber: „ein unbegrenzt wiederholbarer Marken-Mana-Sink … liefert
in langen/kontrollierten Partien potenziell beliebig viel zusätzlichen
Statwert". Eine reine Kostenerhöhung ändert daran nichts Grundsätzliches —
in genau den langen Partien gegen die defensiveren Farben (`tide`, `light`),
in denen überschüssiges Mana am ehesten anfällt, lässt sich die Fähigkeit
weiterhin beliebig oft pro Zug aktivieren, nur mit einem höheren
Mana-Verbrauch pro Aktivierung. Das erklärt plausibel, warum `wild`s
Siegquote nach Runde 2 zwar spürbar sank (71,4 % → 64,7 %), aber nicht in
den erwarteten Bereich von 55–62 % fiel.

**Cross-Check gegen das restliche Regelset:** Im gesamten 300-Karten-Pool
gibt es genau **49 aktivierte Fähigkeiten**. Jede einzelne wurde geprüft
(nach Zusatzkosten-Typ: `tap`, `sacrificeSelf`, `payLife`, `discardCards`,
`removeCounters`, oder gar keine). Ergebnis: **jede einzige** der übrigen
47 aktivierten Fähigkeiten im Pool trägt mindestens eine dieser
Begrenzungen — meistens `{ kind: "tap" }` (das im Pool etablierte Muster
für „maximal 1×/Zug", z. B. `core.rootgrowth-idol`, `core.foundry-anvil`,
`core.myriad-cog`, alle Terrains als Mana-Fähigkeiten). Nur
`core.grove-elder` und `core.growth-totem` hatten NUR eine Mana-Kosten-
Komponente und sonst keine Begrenzung — sie waren buchstäblich die
einzigen beiden echten „so oft wie das Mana reicht"-Sinks im gesamten Set.
Kein weiterer, bisher übersehener unbegrenzter Sink wurde gefunden.

**Korrektur:** Beiden Karten wurde `additionalCosts: [{ kind: "tap" }]`
hinzugefügt (Aktivierungskosten unverändert bei `{2}{Wild}` bzw. `{3}`).

| Karte | Vorher (nach Runde 2) | Nachher (Runde 3) |
|---|---|---|
| `core.grove-elder` | `{2}{Wild}`: beliebig oft/Zug | `{2}{Wild}`, Tappe den Hain-Ältesten: **max. 1×/Zug** |
| `core.growth-totem` | `{3}`: beliebig oft/Zug | `{3}`, Tappe das Wachstumstotem: **max. 1×/Zug** |

Bei `core.grove-elder` hat die Tap-Kosten-Ergänzung einen zweiten,
eigenständigen Effekt, der über die reine „1×/Zug"-Begrenzung hinausgeht:
da die Fähigkeit an eine Kreatur (nicht an ein Relic) gebunden ist, kann
der Hain-Ältester in einem Zug jetzt entweder angreifen ODER die Fähigkeit
aktivieren, nicht beides (Angriff erfordert eine ungetappte Kreatur; die
Fähigkeit tappt sie). Das ist eine echte, zusätzliche Entscheidung, die es
vorher nicht gab — eine 3/4-Kreatur, die gleichzeitig unbegrenzt oft Marken
verteilen UND ganz normal angreifen konnte, wird jetzt zu einem echten
Trade-off zwischen Wachstum und Druck. Kein neues Modell-Primitiv:
`additionalCosts: [{ kind: "tap" }]` existiert bereits (12 Vorkommen im
Pool vor dieser Runde, ausnahmslos auf Relics/Terrains) und die
Engine-Logik in `src/engine/actions.ts` (Zeile ~161–168) behandelt den
Fall „Tap-Kosten-Fähigkeit auf einer Unit mit Summoning Sickness" bereits
explizit korrekt (der entsprechende Kommentar im Code deutete diesen Fall
sogar schon als vorgesehen, aber bisher ungenutzt an) — reine
Wiederverwendung eines bestehenden, bereits getesteten Primitivs in einer
neuen, aber vom Modell vollständig getragenen Kombination.

**Wichtiger methodischer Befund (beeinflusst die Interpretation der
NÄCHSTEN Messung):** `core.growth-totem` ist ein **farbloses Relic**. Das
Bot-Analyse-Werkzeug (`src/ai/__tests__/color-balance.analysis.test.ts`,
Funktion `buildMonoColorDeck`) baut die Testdecks explizit nur aus Karten,
deren Manakosten einen Farb-Pip der jeweiligen Farbe enthalten, UND
schließt farblose Relics bewusst aus allen Decks aus (siehe Kommentar im
Analyse-Tool sowie Abschnitt „Empirische Balance-Prüfung (Bot-Simulation)"
oben: „Ausgeschlossen wurden farblose Relics"). Das bedeutet: die
Korrektur an `core.growth-totem` WIRKT SICH NICHT auf die als Kennzahl
verwendete `wild`-Siegquote aus — nur `core.grove-elder` selbst (das einen
`wild`-Pip trägt und daher im Testdeck enthalten ist) tut das. Die
Growth-Totem-Korrektur wird trotzdem vorgenommen, weil (a) der Auftrag
beide Karten explizit gemeinsam nennt, (b) außerhalb des Analyse-Tools
(echter Deckbau, andere Farben, die das Relic splashen) genau dasselbe
unbegrenzte Sink-Problem bestünde, und (c) es andernfalls inkonsistent
wäre, ausgerechnet die einzige verbleibende unbegrenzte Fähigkeit im
gesamten Pool unangetastet zu lassen, nur weil sie farblos ist. Für die
Erwartungshaltung an die nächste Messung heißt das aber: der gesamte
erwartete Rückgang von `wild`s Siegquote in dieser Runde kommt
ausschließlich von der `grove-elder`-Korrektur selbst.

**Nicht verändert:** Keine weitere `wild`-Karte, keine andere Farbe. Die
in Runde 2 bereits behandelten Fähigkeitsebenen-Korrekturen
(`core.thornrage-boar`-Vergeltung, `core.wildroot-graft`-Kosten) bleiben
unverändert, da keine neue Information gegen sie vorliegt.

**Eigene Einschätzung:** Da `grove-elder` in den gemessenen Partien exakt
EINE Karte im 79–80-Karten-Testdeck ist, sollte der Effekt dieser
Korrektur kleiner ausfallen als der von Runde 2 (die 7 Karten betraf) —
aber gezielter auf genau das Szenario wirken, das laut Doku bisher am
hartnäckigsten blieb (`wild`s Dominanz in langen Partien). Ich erwarte
einen moderaten weiteren Rückgang (grobe Schätzung: 2–8 Prozentpunkte),
keinen Sprung auf 50 %. Sollte `wild` nach dieser Runde immer noch klar
über 60 % liegen, wäre das ein Hinweis, dass die in Runde 2 selbst schon
angedeutete Möglichkeit zutrifft — ein Deckbau-/Synergie-Effekt über
mehrere Karten hinweg statt eine Einzelkarten-Ursache — und eine andere
Untersuchungsmethode (nicht mehr Einzelkarten-Cross-Vergleich) nötig würde.

### Teil B: void — Prüfung auf strukturelle Überlegenheit gegenüber tide/light

**Ausgangslage/Einschränkung (wichtig, siehe ursprünglicher
Analyseauftrag):** Kein Bot nutzt Tempo/Bounce (`tide`) oder reinen
Lebensgewinn/Verteidigung (`light`) strategisch gut. Es ist von vornherein
plausibel, dass ein Teil von `void`s Vorsprung ein Bot-Artefakt ist — die
Frage dieser Prüfung ist, ob DARÜBER HINAUS eine echte, karten- oder
mechanikbasierte Ursache nachweisbar ist, die auch unabhängig vom
Spielstil Bestand hätte.

**Vorgehen:** Cross-Vergleich der Kernmechaniken auf Effektebene (nicht nur
Statlinie), analog zur Runde-2-Methodik bei `wild`: Für jede der drei in
`void` dominanten Effektfamilien (Tod-Trigger, bedingungslose Entfernung,
Lebensdrain/Opfern) wurde geprüft, ob es (a) einen direkten
Preis-/Effekt-Vergleich mit einer Karte gleicher Farbe/gleichen Preises in
`tide` oder `light` gibt, bei dem `void` unangemessen stärker abschneidet,
und (b) ob die jeweilige Mechanik strukturell "bot-neutral" Wert liefert
(funktioniert unabhängig von Spielstärke/Timing) oder "bot-blind" ist
(braucht gute Entscheidungen, die Bots nachweislich nicht treffen).

**Befund 1 — Tod-Trigger-Dichte (echt, aber nicht auf eine Einzelkarte
zurückführbar):** `void` hat **3 Kreaturen** mit `onDeath`-Wert-Trigger
(`core.husk-crawler`, 2 Mana, zieht 1 Karte; `core.plaguebound-wretch`,
2 Mana, legt einen `-1/-1`-Marker auf eine gegnerische Kreatur;
`core.gravebound-oracle`, 3 Mana, rare, zieht 2 Karten) PLUS **1
Enchantment** mit `onDeath`-Payoff (`core.gravebound-shrine`). Jede andere
Farbe hat genau **1** solche Kreatur (die in Batch 8 bewusst symmetrisch
eingeführten „Parting Shot"-Units: `core.cinderwake-marauder`/flame,
`core.tideborn-remnant`/tide, `core.mosswake-drifter`/wild,
`core.sunfall-martyr`/light) und keine Enchantment-Entsprechung. Die
Ursache ist historisch nachvollziehbar: `husk-crawler`/`plaguebound-wretch`
entstanden VOR Batch 8 als voids eigenständiges Kern-Thema
(„Opfer/Verlust-für-Wert/Tod-Trigger", so auch der Abschnittstitel im
Code), Batch 8 gab dann JEDER Farbe zusätzlich EINE „Parting Shot"-Kopie
zur Symmetrie — für `void` kam das als DRITTE Karte des Musters obendrauf
(`gravebound-oracle`), ohne dass jemals rückwirkend geprüft wurde, ob die
kumulierte Dichte über alle Batches hinweg noch mit den anderen vier
Farben vergleichbar ist. Das ist ein einleuchtender Kandidat dafür, warum
`void` ausgerechnet in LANGEN Partien (dem dokumentierten Spielmuster
gegen `tide`/`light`, Ø 21–26 Züge) systematisch mehr Wert aus gewöhnlichem
Kampf-Attrition zieht als jede andere Farbe: Kreaturensterben passiert in
jeder Partie automatisch, ohne dass der Spieler dafür klug timen oder
gezielt spielen müsste — anders als `tide`s Bounce (braucht gutes Timing,
eine dokumentierte Bot-Schwäche) ist das kein "bot-blindes", sondern ein
"bot-neutrales" Wertversprechen: es liefert Wert unabhängig von der
Spielstärke, einfach weil in jedem Bot-vs-Bot-Spiel viel gekämpft und
getauscht wird.

**Befund 2 — Entfernungs-Dichte (echt, ebenfalls nicht auf eine
Einzelkarte zurückführbar):** `void` hat **2 bedingungslose
Entfernungszauber** gegen gegnerische Units (`core.doomreap-edict`, 3 Mana,
`destroyPermanent`; `core.hollowbanish-verdict`, 5 Mana, `exilePermanent`,
breiterer Zielsatz). `light` hat **1** (`core.banishment-rite`, 4 Mana,
`exilePermanent`). `tide`, `wild` und `flame` haben **0** bedingungslose
Entfernungszauber (ihre nächsten Äquivalente — `tide`s Bounce/Tap,
`wild`s `-1/-1`-Marken, `flame`s Verbrennungsschaden — sind alle entweder
temporär, nur gegen kleine Ziele wirksam oder erfordern Timing). Direkte
Kreaturenentfernung ist der Definition nach "bot-neutraler" Wert (ein Bot
setzt Entfernung praktisch immer korrekt gegen die größte Bedrohung ein) —
genau wie bei Befund 1 ist das eine Mechanik, die kein Spielgeschick
braucht, um zu funktionieren.

**Warum trotzdem KEINE Karte in dieser Runde verändert wird:** Beide
Befunde sind auf EFFEKTFAMILIEN-Ebene real und plausibel — aber anders als
bei `core.grove-elder` (eindeutig unbegrenzter Sink ohne Gegenstück) oder
`core.thornrage-boar` (2 Schaden gegenüber identisch bepreisten Klon-Karten
mit 1 Schaden) in Runde 2 findet sich hier **keine einzelne Karte**, die im
direkten 1:1-Vergleich mit ihrem nächsten Pendant als fehlbepreist
auffällt:

- `core.husk-crawler` (2 Mana, 3/1, zieht 1 Karte im Tod) ist im Effekt
  IDENTISCH zu `core.tideborn-remnant` (2 Mana, 1/3, zieht 1 Karte im Tod)
  — nur die Statline unterscheidet sich (aggressiv vs. defensiv), exakt
  wie bei jedem anderen Symmetriepaar im Set. Kein Vorsprung hier.
- `core.gravebound-oracle` (3 Mana, rare, 2/4, zieht 2 Karten im Tod) hat
  keine 1:1-Entsprechung in einer anderen Farbe (die anderen vier
  „Parting Shot"-Karten liegen alle bei 2 Mana/common/uncommon) — sie
  wurde seinerzeit explizit GEGEN `void`s eigene Vorläuferkarten bepreist
  (teurer/seltener für einen stärkeren Payoff), nie gegen die Batch-8-
  Geschwister der anderen Farben. Das ist eher eine fehlende
  Vergleichsprüfung als ein Preisfehler — der Preis selbst (3 Mana, rare,
  zäher Körper, stärkerer Payoff) ist in sich stimmig.
- `core.doomreap-edict` (3 Mana, `destroyPermanent`) ist bewusst und
  nachvollziehbar GÜNSTIGER als `core.banishment-rite` (4 Mana,
  `exilePermanent`) bepreist, weil `destroy` anders als `exile`
  Tod-Trigger des Ziels zulässt und mit Reanimations-/Recursion-Effekten
  interagierbar bleibt — ein inhaltlich begründeter Preisunterschied, kein
  Fehler.

Mit anderen Worten: **jede einzelne `void`-Karte ist für sich genommen
angemessen bepreist.** Was auffällt, ist ausschließlich die AGGREGIERTE
ANZAHL dieser bot-neutralen Effekte in `void` gegenüber der jeweils
EINEN Entsprechung in jeder anderen Farbe — ein über neun Batches
kumulierter Dichte-Unterschied, der nie in Summe geprüft wurde (jeder
Batch prüfte nur gegen die zeitgleich gebauten Vergleichskarten, nie
gegen den fertigen Gesamtpool aller Farben). Das ist ein Befund über die
KARTENPOOL-ZUSAMMENSETZUNG, kein Befund über eine falsch bepreiste Karte.
Alle bisherigen Balance-Korrekturen in diesem Dokument (Runde 1, Runde 2,
Teil A dieser Runde) haben ausschließlich einzelne, im direkten Vergleich
nachweislich fehlbepreiste Karten korrigiert — nie eine „es gibt zu viele
Karten dieses an sich fairen Musters in einer Farbe"-Korrektur, und dafür
gibt es in diesem Projekt auch keine Präzedenz (Karten wurden bisher nie
entfernt oder pauschal wegen Redundanz abgeschwächt). Eine der drei
`onDeath`-Karten oder einen der zwei Entfernungszauber jetzt zu schwächen,
nur weil es "zu viele davon in einer Farbe" gibt, wäre keine chirurgische
Korrektur wie in Runde 1/2, sondern eine Entscheidung über die
Zusammensetzung des Kartenpools als Ganzes — das würde ich nicht
eigenmächtig vornehmen, ohne vorher Rücksprache zu halten, ob z. B.
stattdessen `tide`/`light` in einer künftigen Erweiterung eigene
zusätzliche „bot-neutrale" Payoff-Karten erhalten sollen (der naheliegend
symmetrischere Weg, die Dichte anzugleichen, ohne etablierte, einzeln
faire `void`-Karten zu entwerten).

**Fazit (Card-Designer):** `void`s Vorsprung gegenüber `tide`/`light` ist
**nicht überwiegend ein reines Bot-Artefakt** — anders als bei `tide`s
Bounce-/Timing-Werkzeugen (nachweislich bot-blind) liefern `void`s
Kernmechaniken (Tod-Trigger, bedingungslose Entfernung) Wert unabhängig
von Spielstärke, und `void` hat davon strukturell mehr als jede andere
Farbe (Tod-Trigger: 3–4 Karten vs. 1; Entfernung: 2 Karten vs. 0–1). Das
erklärt plausibel, warum ausgerechnet gegen die für lange, kampfreiche
Partien bekannten Farben `tide`/`light` ein stabiler 23:7-Vorsprung
besteht. **Aber:** keine einzelne `void`-Karte sticht im direkten
Preisvergleich als fehlbepreist heraus — der Effekt ist eine über neun
Batches gewachsene, nie gegengeprüfte Dichte-Asymmetrie, keine
Einzelkarten-Fehlbepreisung. Ich lasse `void` deshalb in dieser Runde
bewusst unangetastet und dokumentiere den Befund stattdessen als
Empfehlung für die weitere Set-Planung: entweder `tide`/`light` in einer
künftigen Erweiterung um je 1–2 eigene bot-neutrale Payoff-Karten
(zusätzliche Tod-Trigger-Kreaturen bzw. ein zusätzlicher bedingungsloser
Entfernungszauber) ergänzen, oder — falls die nächste Messung nach Teil A
zeigt, dass `void`s Vorsprung gegen `tide`/`light` trotz sinkender
`wild`-Dominanz weiterhin bei ca. 23:7 verharrt — in einer eigens dafür
beauftragten Runde gezielt EINE der drei `void`-Tod-Trigger-Karten
zurücknehmen (voraussichtlich `core.plaguebound-wretch`, da sie als
einzige der drei kein direktes Pendant in einer anderen Farbe hat und
daher am leichtesten isoliert zu behandeln wäre, ohne ein etabliertes
Symmetriepaar wie `husk-crawler`/`tideborn-remnant` zu zerstören).

### Gesamtergebnis Runde 3

**2 Karten geändert** (`core.grove-elder`, `core.growth-totem` — beide
`wild`/Teil A, jeweils Zusatzkosten `{ kind: "tap" }` ergänzt, keine
Kostenänderung). **0 Karten in `void` geändert** (Teil B, bewusste
Entscheidung, siehe Fazit oben — kein Widerspruch zum Auftrag, der diesen
Ausgang explizit als vollwertiges Ergebnis vorsieht). Keine andere Farbe
betroffen. Nächster Schritt (liegt beim Auftraggeber/`ai-opponent-
engineer`): erneute Bot-Simulation, mit besonderem Augenmerk auf (a) ob
`wild`s Siegquote weiter Richtung 50–60 % sinkt und (b) ob `void`s
23:7-Vorsprung gegenüber `tide`/`light` sich verändert, obwohl `void`
diese Runde nicht direkt angefasst wurde (falls er sich dennoch verändert,
wäre das ein weiteres Indiz für den in Teil B beschriebenen
Rang-Verschiebungseffekt statt einer eigenständigen `void`-Ursache).
