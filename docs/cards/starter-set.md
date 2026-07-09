# Starter-Set „core" (Validierungspaket + Phase-B-Erweiterung)

Status: v0.6 (Card-Designer, Modell-Update-Batch für rules-engine.md v0.3) — 2026-07-09
Datei: `src/cards/starter-set.ts` (Typ `CardPool` aus `src/model/cards.ts`)

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

Stand nach dem v0.6-Modell-Update-Batch — 113 reguläre Karten + 3
Token-Hilfsdefinitionen (nicht in der Tabelle, siehe v0.4-Update oben). Die
vereinbarte Zielgröße (≥ 100 Karten) war bereits mit Batch 3 (v0.5) erreicht;
dieser Batch ist keine Größen-, sondern eine Modell-Abdeckungs-Erweiterung
(rules-engine.md v0.3, Entscheidungen 9.10–9.13).

| Typ | Anzahl (Batch 1) | Anzahl (nach Batch 2) | Anzahl (nach Batch 3, final) | Anzahl (nach v0.6) | Karten |
|---|---|---|---|---|---|
| terrain | 5 | 5 | 5 | 5 | je 1 Basis-Terrain pro Farbe (unverändert seit v0.2) |
| unit | 37 | 42 | 51 | 53 | v0.6: +2 — `modes` auf `TriggeredAbility` (tide, `core.current-diplomat`), `onDamageReceived` (wild, `core.thornrage-boar`) |
| spell | 8 | 18 | 25 | 26 | v0.6: +1 — `modes` auf `SpellCard` (void, `core.void-covenant`) |
| relic | 7 | 7 | 13 | 14 | v0.6: +1 — X-Kosten auf `ActivatedAbility` (farblos, `core.cinderwrack-engine`) |
| enchantment | 9 | 9 | 15 | 15 | unverändert in v0.6 |

Gesamt: 5 + 53 + 26 + 14 + 15 = 113.

Mana-Kurve der Units (gesamt, inkl. Batch 1–3): weiterhin klar nach unten
verschoben, Batch 3 hält sich an dieselbe Kurve (Schwerpunkt 2–3 Mana bei
den neuen Units, keine Karte über 3 Mana). `core.void-assassin` (Batch 1,
Kombinationskarte, 5 Mana) bleibt der teuerste Unit-Neuzugang im gesamten
Set; teuerste Batch-3-Karten insgesamt sind `core.forgeheart-crucible`
(Relic, `costChange`), `core.blightmire-shroud` (Enchantment,
`scope:opponentUnits`) und `core.ashfall-plague` (Enchantment,
`scope:allUnits`), alle drei zu je 4 Mana — siehe Balancing-Notizen für die
Preisbegründung dieser deckweiten Effekte.

## Farbidentität (für spätere Erweiterung des vollen Sets)

- **flame:** Aggression, Direktschaden (fix und X-basiert), Eile (`swift`),
  Flieger (`airborne`); seit Batch 1 auch `firstStrike`/`trample` als
  aggressive Kampf-Keywords
- **tide:** Tempo, Karten­vorteil, Bounce, defensive Statlines; seit Batch 1
  auch `vigilant` (Tempo-Keyword par excellence), `guardian`, `reach` und
  `deathtouch` (defensive/toxische Blocker)
- **wild:** große Körper, Zähigkeit, `reach`, Marken/Wachstum, Mana-Sinks;
  seit Batch 1 auch `vigilant`, `guardian`, `deathtouch`, `trample` und
  erstmals `lifelink` (große, heilende Bestien)
- **light:** Lebensgewinn, `lifelink`, Verteidigung, `guardian`, Exile-Removal
  (kein „billiges" destroy — teurer, dafür ohne Nachteile für den Gegner);
  seit Batch 1 auch `airborne`, `reach`, `firstStrike`, `swift` und
  `trample` (Light deckt inzwischen die meisten Keywords ab, bewusst als
  „Generalisten"-Farbe mit hohem Preis statt Nischen-Exklusivität)
- **void:** Opfern für Wert, Tod-Trigger, Lebensdrain, Konter; seit Batch 1
  Schwerpunktfarbe für `deathtouch` (Gift-Thematik), plus `trample`,
  `airborne`, `lifelink`, `swift` und die einzige `firstStrike`+`deathtouch`-
  Kombinationskarte im Set (`core.void-assassin`); seit Batch 3 auch
  `guardian` (untote Wächter-Flavor) und `minus1minus1`-Marken (Fäulnis)

Batch 3 hat außerdem gezielt die letzten Lücken der etablierten Keyword-
Verteilung geschlossen: `vigilant` deckt jetzt alle 5 Farben ab (zuletzt
fehlend: light, `core.sunlit-vigil`), `guardian` alle Farben außer flame
(zuletzt fehlend: void, `core.gravebound-warden` — flame bleibt bewusst
ohne guardian, passend zu seiner rein aggressiven Identität), und tide
erhält mit `core.tideshard-rogue` seine erste `airborne`-Karte.

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
(wild, 3 Mana, 2/4) / core.harbor-warden (tide, 2 Mana, 1/5).**
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
(wild, 5 Mana, 5/5) / core.sunforged-colossus (light, 5 Mana, 4/5) / core.hollow-ravager
(void, 4 Mana, 4/3).**
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
Fähigkeit). Der Wert dieser drei Karten liegt daher primär in der
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
`core.thornback-warden` (2/4 `reach`, derselbe Preis 3 Mana): `reach` ist
rein defensiv und nur gegen Flieger relevant, die Vergeltung hier trifft
dagegen JEDE Schadensquelle inklusive Brand-Spells und ist damit ein
deutlich breiterer Deterrent — der Abzug auf 2/3 gleicht das aus.

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

## Keywords: Abdeckung im Pool (Stand Batch 3 / v0.5, final)

Alle 9 Einträge des `Keyword`-Typs (`src/model/abilities.ts`) sind im
echten Kartenpool vertreten. Batch 3 hat gezielt die letzten Farb-Lücken
bei `vigilant`, `guardian` und `airborne` geschlossen (siehe Farbidentität-
Abschnitt oben). Gesamtüberblick (final):

| Keyword | Karten gesamt | Farben |
|---|---|---|
| `swift` | 5 (4 permanent + `core.emberborn-sprinter` als StaticAbility-`grantKeyword` scope:self, funktional identisch) | flame (×3), light, void |
| `airborne` | 4 | flame, light, void, tide (neu, Batch 3) |
| `reach` | 3 | wild, tide, light |
| `vigilant` | 5 — deckt jetzt ALLE 5 Farben ab (Batch 3: `core.sunlit-vigil`, light) | tide, wild, flame, void, light |
| `guardian` | 4 — deckt jetzt alle Farben außer flame ab (Batch 3: `core.gravebound-warden`, void) | light, wild, tide, void |
| `lifelink` | 4 | light (×2), wild, void |
| `trample` (Keyword) | 4 | flame, wild, light, void |
| `firstStrike` (Keyword) | 4 | flame, tide, light, void |
| `deathtouch` (Keyword) | 4 | tide, wild, void (×2) |

`guardian` fehlt bewusst weiterhin bei `flame` (passend zu flames rein
aggressiver Identität ohne defensive Keywords, siehe Farbidentität-
Abschnitt) — das ist die einzige verbleibende, bewusste Farb-Lücke unter
den neun Keywords. Zusätzlich verleihen inzwischen fünf Spells
`airborne`/`trample`/`deathtouch`/`swift`/`firstStrike` **temporär als
Effekt** (`grantKeyword`, s.u., Batch 3 ergänzt `firstStrike` als fünften
Trick) statt als dauerhafte `KeywordAbility` — diese zählen bewusst nicht
in obiger Tabelle, da sie kein permanentes Keyword auf einer Karte sind.
Details/Statlines siehe Balancing-Notizen oben und Farbidentität.

## Nicht verwendete DSL-Primitive (Stand v0.6, aktualisiert)

Batch 3 war der letzte geplante Batch der Kartenpool-Erweiterung. Vor der
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
- **TriggerConditions `onAttackDeclared`/`onBlockDeclared`** — vollständig
  in der Engine verdrahtet (`combat.ts`, `fireSelfCombatTrigger`), aber
  bewusst nicht in Batch 3 verwendet, um den Batch nicht weiter
  aufzublähen (Batch 3 hat bereits mit `onDealtCombatDamageToPlayer` einen
  strukturell sehr ähnlichen Combat-Trigger demonstriert). Guter
  Startpunkt für einen etwaigen vierten Batch oder ein zukünftiges
  Erweiterungsset — z. B. ein Angriffs-Trigger-Aggro-Payoff (flame) oder
  ein Block-Trigger-Defensiv-Payoff (light/wild).
- ~~**`EffectRecipient` `eventSubject`**~~ — **geschlossen in v0.6:**
  `core.thornrage-boar`s Vergeltungsdesign (`onDamageReceived`, s.o.) nutzt
  `eventSubject` jetzt als ersten Anwendungsfall im Pool (dort =
  Schadensquelle). Der zuvor skizzierte `onUnitDied`-Anwendungsfall
  („wenn eine gegnerische Kreatur stirbt, verbanne sie", `eventSubject` =
  das gestorbene Objekt) bleibt weiterhin unbenutzt und ein guter Kandidat
  für ein künftiges Erweiterungsset.
- **`modifyStats` mit `duration: "permanent"`** — die Batch-3-Karten
  (`core.blazing-frenzy`, `core.aegis-ward`) nutzen beide nur
  `duration: "endOfTurn"`; die `"permanent"`-Variante (impliziter
  Unterschied zu `addCounters`: kein Counter-Objekt, daher nicht durch
  `removeCounters` entfernbar, aber auch nicht auf mehrere Marken
  skalierbar) ist im Pool noch nicht demonstriert. Kein Blocker, geringe
  Priorität.

Verbleibend nur noch zwei bewusste Auslassungen ohne Funktionsrisiko
(`onAttackDeclared`/`onBlockDeclared`, `modifyStats permanent`) — alle
übrigen zuvor offenen Punkte dieses Abschnitts (`onDamageReceived`,
`eventSubject`, X-Kosten auf aktivierten Fähigkeiten, Modal-Effekte) sind
mit dem v0.6-Batch geschlossen.
