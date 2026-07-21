# Frontend-Status

Status: v0.1.29 (frontend-engineer) — 2026-07-21
Grundlage: `docs/rules-engine.md` (v0.3.3, Entscheidungen 9.10-9.15 —
**documenter-Korrektur 2026-07-20:** hier stand zuvor veraltet „v0.3.1,
Entscheidungen 9.10-9.13 + Nachtrag"; die beiden zusätzlichen Entscheidungen
9.14/9.15 hatten keinen Frontend-Bezug, kein Nacharbeitsbedarf), `docs/engine-status.md`
(v0.3.5, 130 Engine-Tests, unverändert seit dem letzten Sweep — diese Session
war reine Frontend-Arbeit, keine Engine-/Model-Änderung), `src/model/*`
(Datenmodell, unverändert konsumiert), `src/engine/*` (`createRulesEngine`),
`src/cards/starter-set.ts` (300 Karten + 3 Token-Definitionen, s.
`docs/cards/starter-set.md` — der Rest dieses Dokuments spricht an mehreren
Stellen noch von „113 Karten"/„109 Karten", das sind bewusst unverändert
belassene Stände früherer Abschnitte, s. dortige Hinweise), `docs/ai-status.md`
(KI-Gegner v2.1, `src/ai/difficulty.ts`, öffentliche Funktion
`chooseActionForDifficulty(engine, pool, state, player, difficulty)` mit drei
Stufen `easy`/`medium`/`hard`; `chooseAction` (`src/ai/simpleBot.ts`, v1 =
Stufe "medium") bleibt weiterhin exportiert; **seit v0.1.17** liefert
`src/ai/difficulty.ts` zusätzlich `BOT_DISPLAY_NAMES` — erfundene
Tavernen-Namen der drei Bot-Stufen fürs UI, s. dortiger Abschnitt).

**v0.1.29 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Auftrag „bereits im Deck befindliche Karten sollen sich optisch vom
Rest separieren, statt dass man bei ~300 Pool-Karten jede Zeile auf die kleine
Kopienzahl-Anzeige absuchen muss". `deckBuilder.ts#buildRows` baut den Pool
jetzt in zwei `.deck-pool-section`-Abschnitte statt einer flachen Liste, beide
weiterhin Kinder desselben `.deckbuilder-pool`-Containers: „Im Deck (N
Karten)" (alle Karten mit >0 Kopien in der aktuellen Deckliste, N = Summe aller
Kopien, Abschnitt entfällt komplett bei leerem Deck) gefolgt von „Restlicher
Kartenpool" (Rest), innerhalb beider weiterhin alphabetisch sortiert. Zusätzlich
hebt eine neue Klasse `.deck-pool-row-owned` (Rahmen-Glow + dezenter
Hintergrund-Akzent) jede im Deck befindliche Karten-Kachel auch einzeln hervor,
nicht nur über die Abschnittszugehörigkeit. `applyFilterVisibility` läuft jetzt
pro Abschnitt (`container.querySelectorAll(".deck-pool-section")` statt global
über alle Zeilen) und blendet zusätzlich die Abschnittsüberschrift aus, sobald
der aktuelle Filter innerhalb dieses Abschnitts null Treffer liefert (z.B.
Suche nach einem Namen, der nur im jeweils anderen Abschnitt vorkommt) — Filter/
Suche funktionieren weiterhin unverändert über beide Abschnitte hinweg. Reine
Darstellungsänderung, keine Engine-/Modell-Änderung.

**v0.1.28 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Auftrag „man sollte auswählen können, welches Deck die KI spielt, oder
ob es zufällig gewählt wird" — anders als v0.1.27 (eigenes Deck des Menschen)
geht es hier um das Deck des BOT-GEGNERS (player2, wenn bot-gesteuert). Neues
Select `.deckbuilder-ai-deck-select` im `aiToggle`-Block des player2-Deckbau-
Screens (sichtbar/aktiv wie das bestehende Schwierigkeits-Select nur solange
die KI-Steuerung aktiv ist): „Zufällig" (Default, Sentinel-Wert `"random"`) +
die 7 `AI_DECKS`-Namen. Neuer In-Memory-Store-Zustand `store.ts#
getChosenAiDeckArchetype`/`setChosenAiDeckArchetype` (pro `PlayerId`,
`undefined` = Zufällig, KEINE localStorage-Persistenz — der Bot-Gegner wird
ohnehin pro Partie neu gewählt). Neue Funktion `aiDecks.ts#resolveAiDeck
(chosenIndex)`: `undefined` → unverändertes `pickRandomAiDeck()`-Verhalten
(inkl. Geheimhaltung), sonst exakt die Decklist des gewählten Eintrags. Löst
`pickRandomAiDeck()` an beiden bisherigen Aufrufstellen in `render.ts` ab
(automatischer player2-Auto-Fill nach player1s Confirm UND der „...+
weiter"-Quickstart-Button, dessen Label bei expliziter Auswahl jetzt den
Archetyp-Namen nennt statt „Zufälliges KI-Deck + weiter"). Geheimhaltung im
Zufalls-Fall bleibt unverändert — wählt der Mensch selbst einen Namen, kennt
er ihn ohnehin bereits.

**v0.1.27 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Auftrag „die sollten auch für den Menschen auswählbar sein" (Anlass:
Nachfrage, ob es die 7 kuratierten `AI_DECKS`-Archetypen auch für den
menschlichen Deckbau gibt). Neues `<select>` `.deckbuilder-archetype-select`
+ Button `.deckbuilder-archetype-load-btn` im Deckbau-Screen (beide Spieler,
`newGame`- UND `standalone`-Modus): listet alle 7 Archetyp-Namen aus
`aiDecks.ts#AI_DECKS` auf (Kurzbeschreibung als `title`-Tooltip auf Select
und Options) und übernimmt beim Klick die komplette Decklist des gewählten
Archetyps 1:1 als eigene Deckliste — zusätzlich zum bestehenden „Zufällig
füllen" (`buildDemoDeck`), nicht als Ersatz. `pickRandomAiDeck()`/dessen
bewusste Geheimhaltung des Archetyp-Namens für den Bot-Gegner bleibt
unverändert; `AI_DECKS` wird für diesen neuen, rein menschlichen Anwendungsfall
zusätzlich direkt importiert.

**v0.1.23 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Auftrag „mehr Nachvollziehbarkeit von KI-Spielzügen — auch visuell,
eine Karte wird gelegt, es wird getappt usw". `store.ts#describeEvent` nennt
jetzt Kartennamen/Controller statt nur der Event-Art (`spellCast`,
`abilityActivated`, `triggerFired`, `damageDealt`) und ergänzt eine neue
Log-Zeile für „Permanent von Hand ins Spiel gebracht" (`zoneChanged`
hand→battlefield, i.d.R. Terrains). Neu: transiente
`recentActionInstanceIds` (`getRecentActionInstanceIds()`), befüllt aus
`spellCast`/`abilityActivated`/`triggerFired`/`permanentTapped`/dem obigen
`zoneChanged`-Fall, blendet die betroffene(n) Karte(n) ~1,2s lang per neuer
`.action-glow`-Klasse (Battlefield-Kacheln UND Stack-Zeilen, eigene grüne
Animation, bewusst NICHT `.tutorial-glow` wiederverwendet) ein — einheitlich
für Bot- UND Menschzüge. `cardDrawn` bleibt bewusst informationsarm (keine
Kartennamen — verdeckte Gegner-Hand), `permanentTapped`/`countersChanged`
bleiben ohne eigene Log-Zeile (Spam-Vermeidung), nur visuell.

**v0.1.21 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Auftrag „KI zieht aus kuratierten Archetyp-Decks statt aus einer reinen
5-Farben-Zufallsmischung". Neue reine Datenquelle `src/ui/aiDecks.ts`: **7
handkuratierte Archetyp-Decklisten** (überwiegend Zwei-Farben-Kombinationen,
plus eine bewusste Mono-flame-Ausnahme), vom card-designer-Subagent aus dem
tatsächlichen 300-Karten-„core"-Pool zusammengestellt, je exakt 60 Karten mit
echten Schwerpunktkopien (bis zu 4 pro Nicht-Terrain-Karte) und einer echten
Mana-Kurve statt „1× von allem". `pickRandomAiDeck()` ersetzt an den beiden
Stellen, an denen `render.ts` bisher automatisch ein Deck für einen
bot-gesteuerten Gegner baute (Hauptmenü-„Neues Spiel"-Flow UND der ältere
„Zufälliges KI-Deck + weiter"-Kurzstart im Deckbau-Screen), den bisherigen
`buildDemoDeck`-Aufruf; `buildDemoDeck` selbst bleibt unverändert bestehen und
bedient weiterhin ausschließlich den „Zufällig füllen"-Button des
MENSCHLICHEN Deckbaus. Bewusste Design-Entscheidung: welcher Archetyp gerade
gespielt wird, wird dem menschlichen Spieler nirgends angezeigt (kein
Log-Eintrag, kein Banner) — Entdecken ist Teil des Spielerlebnisses.

**v0.1.20 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Auftrag „Deckbau soll sich mehr wie ein echtes Deckbau-Tool anfühlen":
drei Ergänzungen im Deckbau-Screen, alle rein additiv, keine Engine-/Model-
Änderung. (1) **Benannte Deck-Speicherfunktion** (`store.ts#SavedDeck`,
`saveDeckAs`/`loadSavedDeck`/`deleteSavedDeck`, `components/savedDecksPanel.ts`):
beliebig viele Decks unter einem selbstgewählten Namen + optionaler
Beschreibung in `localStorage` sichern und später wieder laden — ergänzt
(ersetzt nicht) die bestehende „zuletzt bestätigte Deckliste"-Persistenz aus
v0.1.8. (2) **Deck-Analyse-Panel** (`components/deckAnalysis.ts`): Mana-Kurve,
Farb- und Typverteilung der aktuell zusammengestellten Deckliste, reine
CSS-Balken ohne Chart-Bibliothek, live bei jedem +/--Klick neu berechnet. (3)
**„Deck leeren"-Button** im Deckbau-Screen. **Seit v0.1.21 bestätigt
committet** (Commit `9b81338`, s. Verifikation im v0.1.21-Abschnitt unten) —
beim v0.1.20-Sweep selbst stand dieser Schritt noch als uncommitted im
Arbeitsverzeichnis.

**v0.1.19 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Bugfix am in v0.1.18 eingeführten Auto-Pass/Spotlight: `hasRealPriorityChoice`
zählte das bloße Antippen eines Terrains fürs Mana (`isManaAbility: true`)
fälschlich als „echte Entscheidung", obwohl Terrains diese Fähigkeit praktisch
immer anbieten, unabhängig davon, ob sich das Mana gerade lohnt — Auto-Pass
griff dadurch nie, das Spotlight-Banner erschien ständig unnötig.
`store.ts#isRealPriorityCandidate` schließt reine Mana-Fähigkeiten jetzt
explizit aus.

**v0.1.18 auf einen Blick** (Details im gleichnamigen Abschnitt unten): drei
Komfort-/Klarheits-Ergänzungen, alle über bereits vorhandene
`getLegalActions`-Anfragen, keine eigene Regellogik. (1) **Auto-Pass**:
Priority wird automatisch weitergereicht, sobald `legalActions` keine echte
Wahl mehr anbietet (nur `passPriority`/`concede`); ebenso werden erzwungene
Kampf-Deklarationsschritte ohne einen einzigen echten Angreifer-/
Blocker-Kandidaten automatisch mit der leeren Deklaration aufgelöst — spart
Klicks, ohne echte Entscheidungen zu verschlucken (`store.ts#advanceAutomation`/
`autoResolvableActionFor`). (2) **Entscheidungs-Spotlight**
(`components/decisionSpotlight.ts`): ein auffälliges, nicht-blockierendes
Banner ersetzt/ergänzt den bisherigen unauffälligen „Priorität passen"-Button
GENAU DANN, wenn tatsächlich eine echte Wahl ansteht. (3)
**Auto-Discovery-Musik-Playlist** (`musicPlayer.ts`, `components/musicPanel.ts`,
`vite.config.ts#musicIndexPlugin`): löst eine vorherige, fest verdrahtete
Einzeldatei ab — Titel werden live aus `docs/music/` ermittelt (`/music/index.json`),
ein Panel erlaubt Titelauswahl + Wiederholungsmodus (Einzeltitel/Playlist).

**v0.1.17 auf einen Blick** (Details im gleichnamigen Abschnitt unten): die
mit Abstand umfangreichste Einzelsession seit dem Frontend-Start — der
Nutzer-Auftrag lautete sinngemäß „die App soll sich strukturell und optisch
mehr wie ein echtes Computerspiel anfühlen, nicht wie ein Regel-Debug-Tool".
**Größte strukturelle Änderung:** ein echtes **Hauptmenü** als neuer
App-Einstiegspunkt (`types.ts#AppPhase`: `mainMenu` → `opponentSelect` →
`deckbuild` → `playing`, löst den bisherigen Direkteinstieg in den
player1-Deckbau-Screen seit v0.1.5 ab) mit vier Optionen — „Neues Spiel"
(führt über eine neue Gegner-Auswahl `components/opponentSelect.ts`: KI mit
einer der drei benannten Bot-Personas ODER „2 Spieler"/Hotseat; bei
KI-Wahl wird player2s Deckbau-Screen komplett übersprungen), „Deck Builder"
(eigenständiger Deckbau-Modus `mode: "standalone"` ohne Partie-Start), „Tutorial"
(unverändert, nur jetzt vom Hauptmenü statt einem Button im
player1-Deckbau-Screen erreichbar), „Anleitung" (neues Nachschlage-Panel
`components/rulesGuidePanel.ts`: Kartentypen, eingebettetes Keyword-Glossar,
Spiel-/Deckbau-Tipps, rein statisch, keine Partie). **Weitere Ergänzungen
derselben Session:** Bot-Anzeigenamen („Ollo Wackelhand"/„Guntram
Eichenfaust"/„Silas Kaltblick" statt „player2", `src/ai/difficulty.ts#BOT_DISPLAY_NAMES`,
nur wenn der jeweilige Spieler bot-gesteuert ist); Taverne-Atmosphäre + Szenen-
Artwork-Integration (`components/sceneArt.ts`, `docs/scene-art-brief.md`) —
ein viewport-breiter Taverne-Hintergrund (`tavern-background.png`, fixiert auf
Body-Ebene, `z-index: -1`) sowie ein großformatiges Gegner-Porträt
(`avatar-<difficulty>.png`) in einer eigenen 220px-Spalte rechts neben dem
Spielfeld, beides mit CSS-Fallback (Holzmaserung/Kerzenschein-Glow des Boards
selbst) falls die jeweilige Bilddatei fehlt; sichtbare View-Transitions-
Animationen (`document.startViewTransition()`, Karten „morphen" per
`view-transition-name` zwischen Hand/Battlefield/Friedhof statt hart
wegzuspringen, Bot-Züge dadurch nachvollziehbar statt als Snap, Lebenspunkte-
Puls bei Änderung) mit Fallback auf den bisherigen Hard-Cut-Rebuild (fehlende
Browser-Unterstützung/`prefers-reduced-motion`); verdeckte Gegner-Hand
(`render.ts#hiddenHandZone`: nur Kartenrückseiten + Anzahl statt voller
Karteninformation, sobald `playerId !== "player1"`); zwölf Soundeffekte
(`sfxPlayer.ts`, `docs/sfx/`, event-basiert über `store.ts#playSfxForEvent`)
inkl. Mute-Umschalter; Tutorial-Fix (`getTutorialPassPriorityBlockReason`
sperrt „Priorität passen" jetzt während der `mainPhaseOnly`-Schritte
`playTerrain`/`castCreature`, solange eine passende Kandidatenaktion existiert
— verhindert versehentliches Überspringen dieser Schritte).

**v0.1.16 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Auftrag - das bisherige Tutorial (v0.1.11-v0.1.15) zeigte pro
Aktionstyp nur EINE passive, einmalige Info-Sprechblase, FALLS der Spieler
zufällig darüber stolperte. Neu: eine echte, 13-Schritte-Sequenz
(`src/ui/tutorialContent.ts#TUTORIAL_STEPS`), die jeden Kernmechanismus
konkret anweist UND das tatsächliche Ausführen abwartet, statt nur zu
erklären - "Instruktion → erwartete Aktion → Bestätigung/Ergebnis-Erklärung →
nächste Instruktion". Aktions-Schritte zeigen währenddessen ein
nicht-modales, das Spiel NICHT blockierendes Hinweis-Banner mit hervorgehobenem
Ziel-Element (Handkarte/eigenes Terrain/verstärkte Kreatur, `.tutorial-glow`)
und einem jederzeit verfügbaren "Schritt überspringen"-Link; erst nach
erkannter Aktion erscheint eine modale Bestätigungs-Sprechblase. Details,
Architektur (insbesondere die rückwirkende Fakten-Erkennung, die die Sequenz
robust gegenüber Mana-Kurve/Bot-Verhalten macht) und Verifikation im
gleichnamigen Abschnitt unten.

**v0.1.15 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Feedback - Karten zeigen Schlüsselwörter im Regeltext (z. B.
"Todesberührung." bei `core.abyssal-lurker`), aber es gab keine Möglichkeit
im UI, nachzuschlagen, was ein Schlüsselwort bedeutet. Neues Keyword-Glossar
(`src/ui/keywordGlossary.ts`, kurze spielerfreundliche Erklärungen für alle 9
`Keyword`-Werte aus `src/model/abilities.ts`, Regelgrundlage
`docs/rules-engine.md` 6d) mit zwei Zugriffswegen: (1) In-Context - erkannte
Keyword-Wörter in JEDER Regeltext-Box (`.card-frame-text` in Hand/
Battlefield/Graveyard/Stack/Deckbau-Pool) werden hervorgehoben
(gepunktete Unterstreichung), zeigen die Erklärung als natives
`title`-Hover-Tooltip UND öffnen per Klick eine kleine Sprechblase
(`components/keywordText.ts`, `components/keywordGlossaryPanel.ts#keyword
PopoverBubble`). (2) Global - ein immer sichtbarer "? Schlüsselwörter"-Button
(Status-Zeile der laufenden Partie UND Deckbau-Screen, bewusst UNABHÄNGIG
vom Tutorial-Modus, anders als der bestehende Tutorial-Hilfe-Button) öffnet
ein Panel mit allen 9 Keywords, jederzeit einsehbar. Neuer, bewusst
dokumentierter Architektur-Kompromiss: `keywordText.ts`/`deckBuilder.ts`
importieren die beiden Store-Funktionen für den Popover-Zustand direkt aus
`store.ts` statt sie als Props durch alle ~12 Aufrufstellen von
`cardTile`/`handCard`/`poolRow` durchzureichen (rein globaler, karten-
unabhängiger Anzeige-Zustand ohne Spiellogik-Bezug). Neuer Test
`src/ui/__tests__/keyword-glossary.test.ts` (2 Fälle, echte Klicks).
`npm test`/`npm run build` weiterhin sauber, keine Engine-/Model-/
Karten-Änderung.

**v0.1.14 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Feedback nach dem ersten Tutorial-Durchlauf: "ich kann irgendwie gar
nichts machen". Ursache (kein Bug im engeren Sinne): mit dem festen
`TUTORIAL_SEED` (`src/ui/tutorialDeck.ts`) entschied der normale
Münzwurf-Zufall, dass player2 (der Bot) den ersten kompletten Zug bekam,
während player1 (der Mensch) fast nur "Priorität passen" klicken konnte —
für jemanden, der zum ersten Mal überhaupt mit Prioritätsfenstern/
Zugreihenfolge konfrontiert wird, sah das wie ein kaputtes UI aus. Fix:
`store.ts#startTutorial` übergibt jetzt explizit `startingPlayer: "player1"`
an `initGame`/`engine.createGame` (`initGame` hat dafür einen neuen,
optionalen vierten Parameter bekommen) — die Engine unterstützt das bereits
nativ über `CreateGameConfig.startingPlayer` (`src/model/game-state.ts`),
keine Engine-Änderung nötig. Gilt bewusst NUR für den Tutorial-Pfad; normale
Partien (`initGame` ohne diesen Parameter, s. `confirmDeck`) bleiben beim
zufälligen Münzwurf. Zusätzlich als Sicherheitsnetz gegen genau dieses
Missverständnis: die allererste Tutorial-Sprechblase ("Mana, Phasen &
Priorität", `src/ui/tutorialContent.ts`) erklärt jetzt explizit, dass sich
beide Spieler mit ganzen Zügen abwechseln und man in den eigenen
Priority-Fenstern während des gegnerischen Zugs meist einfach passt, weil es
nichts zu tun gibt. Verifiziert: `npm test` (161/161 grün) und
`npm run build` sauber, sowie ein temporärer, danach wieder entfernter
Vitest-Check, dass `getState().activePlayer === "player1"` direkt nach
`startTutorial()` gilt (kein dauerhafter neuer Testfall nötig, da bereits
`src/ui/__tests__/tutorial.test.ts` den gesamten Tutorial-Flow end-to-end
abdeckt und dessen veraltete Kommentare zur Startspieler-Zufälligkeit
mitkorrigiert wurden).

**v0.1.13 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Nutzer-Feedback zu v0.1.12 — die frisch eingebundenen Artworks wirkten
"unsauber abgeschnitten" (z. B. ein Greifen-/Flügelmotiv zeigte nur die
Flügelspitzen, ein Strudelmotiv nur ein kleines Fragment). Ursache: der
Kunstbereich `.card-frame-art` war mit 30px (Battlefield/Graveyard/Stack-
Kacheln, `.card-tile`) bzw. 42px (Handkarten/Deckbau-Pool, `.hand-card`/
`.deck-pool-row`) bei Kartenbreiten von 118-158px ein so schmaler Streifen,
dass `object-fit: cover` bei den praktisch immer im ~4:3-Seitenverhältnis
(1200×896px, laut Stichprobe 38 von 39 vorhandenen Artworks exakt in diesem
Verhältnis) generierten Bildern das Hauptmotiv fast komplett wegschnitt.
Reine CSS-Änderung: `.card-frame-art` (Battlefield-Kacheln) jetzt 78px,
`.hand-card .card-frame-art` 104px, `.deck-pool-row .card-frame-art` 88px —
Werte grob am 4:3-Seitenverhältnis relativ zur Innenbreite der jeweiligen
Kartenrahmen orientiert, dann per echtem Browser-Screenshot (Chrome
headless über CDP, s. Verifikations-Abschnitt) nachjustiert/bestätigt.
`object-position` bleibt bei `center center` (Standard) — eine
Stichprobenprüfung der realen Artworks im Browser zeigte keinen
systematischen Bedarf für einen vertikalen Versatz. Die Gesamtkartenhöhe
wächst dadurch spürbar (bewusste Nutzer-Vorgabe); Hand-Zone/Battlefield-
Grid/Deckbau-Pool-Grid bleiben weiterhin scroll-/nutzbar (weniger Karten pro
Zeile ist ein akzeptierter Trade-off). Keine Engine-/Model-Änderung.

**v0.1.12 auf einen Blick** (Details im gleichnamigen Abschnitt unten): die
extern generierten Karten-Artworks (`docs/cards/artworks/`, s.
`docs/cards/card-art-brief.md`) sind jetzt ins UI eingebunden, OHNE ein neues
Datenfeld im Kartenmodell — der Bildpfad wird rein aus der Karten-`id`
abgeleitet (`id.replace(/\./g, "-") + ".png"`, neue Hilfsfunktion
`src/ui/components/cardArt.ts#artworkUrl`). Gemeinsamer Baustein
`cardFrameArt(def)` ersetzt das bisherige leere `.card-frame-art`-Div in
`handCard.ts`/`cardTile.ts`/`deckBuilder.ts` (alle drei Kartendarstellungen
Hand/Battlefield-Graveyard-Stack/Deckbau-Pool) durch ein `<img loading="lazy">`
darüber; lädt es erfolgreich, wird es sichtbar (CSS-Opacity-Übergang,
object-fit: cover) und überdeckt den Farbverlauf; schlägt das Laden fehl
(Normalfall für die meisten der 300 Karten aktuell), entfernt sich das `<img>`
selbst wieder aus dem DOM und der bisherige Farbverlauf-Platzhalter bleibt
unverändert sichtbar — kein kaputtes Bild-Icon, kein Layout-Sprung. Da
`docs/cards/artworks/` bewusst außerhalb von `public/` liegt (der Nutzer legt
dort weiterhin einfach neue Dateien ab, ohne sie zu verschieben), übernimmt
ein neues, selbst geschriebenes Vite-Plugin (`vite.config.ts`) die
Auslieferung: eine Dev-Server-Middleware liest Dateien live aus
`docs/cards/artworks/` (`npm run dev`), ein `closeBundle`-Kopierschritt
dupliziert sie beim Produktions-Build nach `<outDir>/cards/artworks/`
(`npm run build:ui`) — bewusst KEIN zusätzliches npm-Package
(`vite-plugin-static-copy`) eingeführt, da die reine Kopierlogik trivial
genug für ein paar Zeilen eigenen Code war. Eine Falle dabei: `closeBundle`
feuert nicht nur bei einem echten `vite build`, sondern auch innerhalb
Vitests eigener, interner Vite-Instanz (die dabei bewusst einen
nicht-existenten Platzhalterpfad als `build.outDir` durchreicht, um genau
solche unbedingt schreibenden Plugins zu erwischen) — das Plugin prüft
deshalb explizit `config.command === "build"`, bevor es irgendetwas ins
Dateisystem schreibt. `npm test`/`npm run build`/`npm run build:ui` weiterhin
sauber (161/161 Tests), keine Engine-/Model-Änderung (`src/cards/starter-set.ts`
bewusst NICHT angefasst).

**v0.1.11 auf einen Blick** (Details im gleichnamigen Abschnitt unten): zwei
Aufträge rund ums Einstiegserlebnis. **Teil 1** (kleiner Fix): die KI-
Umschaltung im Deckbau-Screen von Spieler 2 war als unauffälliges Text-
Checkbox-Label kaum zu finden — jetzt eine deutlich hervorgehobene, umrahmte
Box mit eigener Überschrift („Gegen den Computer spielen") + Hinweistext,
größerer Schrift; zusätzlich ist der „Spiel starten"/„Weiter"-Button jetzt per
`position: sticky` immer sichtbar, auch beim Scrollen durch den mittlerweile
300 Karten großen Kartenpool (reines CSS, keine Layout-Umstellung). **Teil 2**
(Hauptauftrag): ein geführtes Tutorial-Probespiel — ein „Tutorial starten"-
Button auf dem Startbildschirm (dem player1-Deckbau-Screen) überspringt den
kompletten normalen Deckbau und startet direkt eine Partie mit zwei fest
kuratierten 40-Karten-Decks (`src/ui/tutorialDeck.ts`, je 6 verschiedene
Karten: Terrain, Vanilla-Kreatur, Keyword-Kreatur, größerer Kreatur-Körper,
Zielsuch-Zauberspruch, Buff-Zauberspruch) und festem Seed (deterministisch/
reproduzierbar). Spieler 2 ist automatisch bot-gesteuert auf der ruhigen
„medium"-Stufe (bewusst NICHT „easy", das laut `docs/ai-status.md` absichtlich
fehlerhaft/zufällig spielt, und NICHT „hard"). An sechs Schlüsselmomenten
(erstes Priority-Fenster, erstes Terrain, erste Kreatur, erster
Zauberspruch, erster Angriff, erster Block) erscheint einmalig eine kurze,
wegklickbare Sprechblase (`src/ui/tutorialContent.ts` für die Texte,
`src/ui/components/tutorialOverlay.ts` für die Anzeige); danach ein
Abschluss-Hinweis. Ein „?"-Button im Spielbrett-Header (nur im Tutorial-
Modus sichtbar) öffnet jederzeit ein Panel mit ALLEN Tutorial-Texten. Der
Bot-Zug-Loop pausiert automatisch, solange eine Sprechblase aussteht.
„Zurück zum Hauptmenü" (ersetzt „Neues Spiel" nur im Tutorial-Modus) beendet
den Tutorial-Modus sauber (stellt Spieler 2s vorherige Bot-Einstellung
wieder her) und führt zum normalen Deckbau zurück — reiner zusätzlicher
UI-Zustand in `store.ts`, keine Engine-/Model-Änderung, die normale Partie
ist davon unberührt. `npm run build`/`npm test` weiterhin sauber (161 grün +
1 bewusst übersprungener Analyse-Test, s.u.), neuer Test
`src/ui/__tests__/tutorial.test.ts`.

**v0.1.10 auf einen Blick** (Details im gleichnamigen Abschnitt unten): rein
visuelle Überarbeitung — Karten sehen jetzt wie klassische Kartenspiel-Karten
aus statt wie Text-Kästchen: vollständiger, farbcodierter Kartenrahmen (statt
nur Top-Border), Kopfzeile mit Name + farbigen Mana-„Pips" als Kostenanzeige,
eine reine Farbverlaufsfläche als „Bildbereich" (bewusst OHNE Artwork/
Bild-Assets, s. Auftrag), Typzeile, Regeltext-Box (+ Status-Badges auf dem
Battlefield) und ein abgesetzter P/T-Kasten unten rechts bei Einheiten.
Gilt jetzt einheitlich für Handkarten (`handCard.ts`), Battlefield-/
Graveyard-/Stack-Kacheln (`cardTile.ts`) und den Kartenpool im Deckbau
(`deckBuilder.ts`, der dafür von einer Tabellenzeilen-Liste auf ein
Flex-Wrap-Kartenraster umgebaut wurde). Keine Spiellogik-/Engine-Änderung,
keine neuen Bild-Assets — reines CSS/HTML. `npm run build`/`npm test`
weiterhin sauber (151/151).

**v0.1.9 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
Anbindung der drei vom ai-opponent-engineer bereitgestellten
Bot-Schwierigkeitsstufen (`easy`/`medium`/`hard`, `src/ai/difficulty.ts`) —
ein Schwierigkeits-Dropdown im Deckbau-Screen von Spieler 2 (nur sichtbar,
wenn die KI-Steuerung für ihn aktiv ist), ein pro Spieler gespeicherter
`botDifficulty`-Zustand in `store.ts` (Persistenz analog zu
`isBotControlled`), Umstellung von `runBotStep` auf
`chooseActionForDifficulty`, sowie ein zweites Badge im Spieler-Panel, das
die aktive Stufe während der Partie anzeigt.

**v0.1.8 auf einen Blick** (Details im gleichnamigen Abschnitt unten): zwei
unabhängige Komfort-Features, kein Engine-/Model-Zutun nötig — ein
"Aufgeben"-Button pro Spieler (verdrahtet die schon länger existierende
`concede`-Aktion, mit `window.confirm`-Bestätigung, ausgeblendet für
bot-gesteuerte Spieler und nach Spielende) sowie eine `localStorage`-
Persistenz der zuletzt bestätigten Decklisten, die jetzt auch einen echten
Seiten-Reload übersteht (bisher nur In-Memory über den Session-Store).

**v0.1.7 auf einen Blick** (Details im gleichnamigen Abschnitt unten):
„Spieler 2 = KI"-Anbindung des in `src/ai/simpleBot.ts` bereitgestellten
regelbasierten Bots — Umschalter im Deckbau-Screen von Spieler 2, ein
automatischer Zug-Loop in `store.ts`, der für bot-gesteuerte Spieler
selbstständig `chooseAction`+`applyAction` aufruft (Priority, Mulligan,
Combat-Deklaration, Cleanup-Abwurf inklusive), sowie ein „KI"-Badge im
Spieler-Panel. Damit ist gegen den Bot spielbar, ohne dass das Frontend
irgendeine Spiellogik dupliziert.

**v0.1.6 auf einen Blick** (Details im gleichnamigen Abschnitt unten): drei
UI-Ergänzungen für die v0.3-Engine-Erweiterungen — echte Mulligan-UI (löst
die `skipMulligans: true`-Notlösung in `store.ts` ab), Modus-Wahl-UI für
modale Spells/Fähigkeiten/Trigger, und die Verallgemeinerung des
X-Kosten-UI-Mechanismus (bisher nur `castSpell`) auf `activateAbility`.

**v0.1.5 auf einen Blick** (Details in den gleichnamigen Abschnitten unten):
permanente Vitest+jsdom-UI-Tests (`src/ui/__tests__/`, `jsdom` jetzt
Dev-Dependency) + ein echter Deckbau-Screen VOR dem Spielstart (löst die
automatische Demo-Partie aus `buildDemoDeck` ab, die es seit v0.1 gab) — damit
sind „Nächste Schritte" Punkt 1 und Punkt 6 aus dem v0.1.4-Stand erledigt.

Dieses Dokument beschreibt das erste funktionsfähige Spielbrett-UI: was
gebaut wurde, wie man es startet, welche bewussten Vereinfachungen es gibt
und was die nächsten Schritte wären.

**v0.1.1-Fix:** Im Browser-Test wurde eine Lücke gefunden, die den Golden
Path blockierte — es gab keinen sichtbaren „Priorität passen"-Button, obwohl
`getLegalActions` `passPriority` immer liefert (`legal-actions.ts`). Ohne
diesen Button kam man aus jedem Priority-Fenster, in dem man nichts (weiteres)
spielen wollte/konnte (z. B. Upkeep), nicht mehr heraus. Behoben in
`src/ui/render.ts#statusBar`: ein Button „Priorität passen (‹Spieler›)" ist
jetzt immer sichtbar/aktiv, wenn `state.priorityPlayer` gesetzt und
`state.pendingDecision` nicht gesetzt ist, und dispatcht
`{ kind: "passPriority", player: state.priorityPlayer }`. Verifiziert über
einen echten Klick-Durchlauf (jsdom, `dispatchEvent("click")` auf die von
`render()` erzeugten Button-Elemente, nicht nur Store-Aufrufe): Upkeep →
(beide passen) → Draw → (beide passen) → Main1, dort zusätzlich erfolgreich
ein Terrain über den „Terrain legen"-Button gespielt (Battlefield-Länge
+1). Der Test war temporär (nicht Teil des Repos, siehe „Nächste Schritte"
Punkt 1 zu dauerhaften UI-Tests).

## Tech-Stack-Entscheidung: Vite + Vanilla TypeScript (kein React)

`docs/README.md` schlug „Vite + React" vor. Ich bin bewusst davon abgewichen
und habe **Vite + reines TypeScript** (kein Framework) gewählt:

- Das Board ist ein einziger, unidirektionaler Fluss „GameState (+ UI-Modus)
  rein → komplettes DOM raus" ohne verschachtelte Komponenten-Lebenszyklen,
  lokalen Komponentenzustand oder Reconciliation-Bedarf — genau der Fall, für
  den ein virtuelles DOM/Reconciler kaum Mehrwert bringt.
- Ein Hobby-/Lernprojekt profitiert mehr davon, mit möglichst wenig
  Fremd-Infrastruktur auszukommen (kein JSX-Toolchain-Setup, kein
  Reconciler-Verhalten zu verstehen); Vite selbst reicht als schneller
  Dev-Server/Bundler für TS vollkommen aus.
- Der einzige „Komfort", den React geboten hätte (deklaratives Markup), wird
  hier durch einen ~30-Zeilen-Hyperscript-Helper (`src/ui/h.ts`) abgedeckt.

Das Rendering ist bewusst simpel gehalten: `render(root)` in `src/ui/render.ts`
baut bei jeder Zustandsänderung das komplette Board-DOM neu auf (kein Diffing).
Für die Größe dieses Boards (wenige Dutzend Elemente) ist das performant genug;
sollte das UI deutlich wachsen, wäre der Wechsel zu React/Preact/lit-html an
dieser Stelle ein sauberer, isolierter Schritt (die Engine-Anbindung in
`src/ui/store.ts` bliebe unverändert).

## Setup / Start

```
npm install
npm run dev        # Vite-Dev-Server (Hot Reload), http://localhost:5173
npm run build:ui    # Produktions-Build nach dist-ui/
npm run preview     # Vorschau des Produktions-Builds
npm run build       # unverändert: tsc --noEmit (Engine + jetzt auch UI-Code)
npm test            # Vitest (149 Tests gesamt zum v0.1.9-Stand, s. jeweilige Abschnitte)
```

`tsconfig.json` wurde um `"DOM"`/`"DOM.Iterable"` in `lib` erweitert (damit
`tsc --noEmit` auch den UI-Code type-checkt); das ändert nichts an der
Engine-Kompilierung, fügt nur zusätzliche globale Typen hinzu.
`package.json` hat drei neue Skripte (`dev`, `build:ui`, `preview`), `vite`
als Dev-Dependency (seit v0.1) und **seit v0.1.5** zusätzlich `jsdom` als
Dev-Dependency (für die dauerhaften UI-Tests, s.u.); bestehende
Skripte/Dependencies sind ansonsten unverändert.

**Seit v0.1.5** (s. eigener Abschnitt unten, löst den v0.1-v0.1.4-Text in
diesem Absatz ab): Beim App-Start erschien zuerst ein **Deckbau-Screen**
(kein automatischer Partiestart mehr) — Spieler 1 baut sein Deck, dann
Spieler 2 (mit einer „Gleiches Deck wie Spieler 1 übernehmen"-Abkürzung),
danach „Spiel starten". `buildDemoDeck` (`src/ui/deck.ts`, unverändert seit
v0.1.4: alle 5 Terrains fest 4×, dazu eine zufällige Stichprobe von bis zu 40
verschiedenen Nicht-Terrain-Karten je 1×) existiert weiterhin, wird aber
nicht mehr automatisch für beide Spieler aufgerufen, sondern steht im
Deckbau-Screen als „Zufällig füllen"-Button zur Verfügung.

**Seit v0.1.17 überholt (s. eigener Abschnitt unten):** Der Deckbau-Screen ist
NICHT mehr der App-Einstiegspunkt — davor steht jetzt ein echtes
**Hauptmenü** (`types.ts#AppPhase`: `mainMenu` → `opponentSelect` →
`deckbuild` → `playing`). „Neues Spiel" führt über eine Gegner-Auswahl
(KI-Schwierigkeit ODER „2 Spieler"/Hotseat) zum bisherigen sequentiellen
Deckbau-Ablauf (Spieler 1, dann ggf. Spieler 2); „Deck Builder" öffnet
denselben Deckbau-Screen eigenständig, ohne dass danach eine Partie beginnt.
„Zurück zum Hauptmenü" (vormals „Neues Spiel" im laufenden Spiel) führt jetzt
zum Hauptmenü statt direkt in den Deckbau (`store.ts#backToMainMenu`, vormals
`backToDeckbuilder`) — die zuletzt benutzten Decklisten UND die zuletzt
gewählte Gegner-Einstellung bleiben dabei als Vorbefüllung erhalten.

Es gab bis v0.1.6 **keine Spielerauswahl über Deckbau hinaus** und bis v0.1.7
**keine KI** — beide Sätze sind überholt (s. „Bewusste Vereinfachungen"
unten): seit v0.1.7 gibt es einen KI-Gegner-Anschluss, seit v0.1.17 eine
echte Gegner-Auswahl VOR dem Deckbau. Für einen Hotseat-Menschen als Spieler 2
gilt weiterhin: beide Spielerbereiche sind sichtbar, aber nur der Spieler,
der laut `GameState` gerade an der Reihe ist (Priority, PendingDecision,
Combat-Deklaration, Cleanup-Abwurf), bekommt anklickbare Aktionen angezeigt —
**seit v0.1.17 zusätzlich**: die Hand eines Nicht-„player1"-Spielers wird nur
noch verdeckt dargestellt (Kartenrückseiten + Anzahl, s. eigener Abschnitt
unten), ein echter zweiter Hotseat-Mensch kann seine eigenen Handkarten daher
aktuell nicht mehr aktiv anklicken/spielen (bewusst hingenommene
Einschränkung, s. dortiger Code-Kommentar) — sein Zug läuft in dem Fall ohne
diese Interaktion weiter (kein Deadlock, da Priorität weiterhin normal
passierbar bleibt).

## Struktur (`src/ui/`)

| Datei | Zweck |
|---|---|
| `main.ts` | Einstiegspunkt, startet Store + Render-Loop (**seit v0.1.5**: kein automatischer `initGame`-Aufruf mehr, App startet im Deckbau-Screen; **seit v0.1.17 überholt**: App startet jetzt im Hauptmenü, s. „Setup/Start" oben — `main.ts` ruft zusätzlich einmalig `initBoardBackdrop()` (`sceneArt.ts`), `initMusicPlayer()` (`musicPlayer.ts`) und `initSfxPlayer()` (`sfxPlayer.ts`) auf, alle drei bewusst NUR hier, nicht aus store.ts/render.ts, damit die UI-Testsuite sie nie auslöst, s. dortige Dateikommentare) |
| `components/mainMenu.ts` | **Neu in v0.1.17**: Hauptmenü/Titelbildschirm (`mainMenuScreen`), vier Optionen („Neues Spiel"/„Deck Builder"/„Tutorial"/„Anleitung") + direkt gegen den Store verdrahtete Musik-/SFX-Umschalter (analog zu `deckBuilder.ts`) |
| `components/opponentSelect.ts` | **Neu in v0.1.17**: Gegner-Auswahl (`opponentSelectScreen`) zwischen „Neues Spiel" und dem eigentlichen Deckbau — eine der drei KI-Schwierigkeitsstufen (`BOT_DIFFICULTIES`) oder „2 Spieler" (Hotseat) |
| `components/rulesGuidePanel.ts` | **Neu in v0.1.17**: „Anleitung"-Panel (Kartentypen, eingebettetes Keyword-Glossar via `keywordGlossaryPanel.ts#keywordGlossaryList`, Spiel-/Deckbau-Tipps) — reines Popover-Overlay über dem Hauptmenü, kein eigener `AppPhase`-Screen |
| `components/decisionSpotlight.ts` | **Neu in v0.1.18**: `decisionSpotlightBanner` — auffälliges, nicht-blockierendes Banner für echte Priority-Entscheidungen (s. eigener Abschnitt unten) |
| `components/sceneArt.ts` | **Neu in v0.1.17**: `initBoardBackdrop()` (viewport-breites, body-eigenes `<img>` für den Taverne-Hintergrund), `botAvatarImg(difficulty)` (großformatiges Porträt) — gleiches Lade-/Fallback-Muster wie `cardArt.ts`, s. `docs/scene-art-brief.md`; **seit v0.1.22** zusätzlich `humanAvatarPlaceholder(displayName)` (CSS-only-Platzhalter für einen menschlich gesteuerten aktiven Spieler, kein Bild-Asset, s. eigener Abschnitt unten) — `botAvatarImg` wird jetzt für JEDEN bot-gesteuerten aktiven Spieler aufgerufen, nicht mehr nur für player2 |
| `components/turnFlowPanel.ts` | **Neu in v0.1.22** (s. eigener Abschnitt unten): `turnFlowPanel(props)` — vertikale 6-Phasen-Schritt-Kette (gruppiert aus den 12 rohen `TurnStep`-Werten) + Zugnummer/aktiver Spieler/Priority, ersetzt die bisherigen reinen Info-Texte der `.status-bar` |
| `musicPlayer.ts` | **Neu in v0.1.17** (fest verdrahtete Einzeldatei), **umgebaut in v0.1.18** (Auto-Discovery-Playlist über `/music/index.json`): eigenes Singleton-`<audio>`-Element auf Body-Ebene (überlebt jeden `render()`-Rebuild), abonniert sich per `store.ts#subscribe`, startet auf die erste Nutzerinteraktion (Browser-Autoplay-Policy) |
| `sfxPlayer.ts` | **Neu in v0.1.17**: kurze, überlappende Soundeffekte (`cloneNode()`-Duplizierung pro Abspielvorgang statt eines einzigen wiederverwendeten Elements), globaler UI-Klick-Listener für `.btn-play`/`.btn-pass` |
| `components/musicPanel.ts` | **Neu in v0.1.18** (löst einen einfacheren Mute-Button aus v0.1.17 ab): Titelauswahl + Wiederholungsmodus (Einzeltitel/Playlist), strukturell an `keywordGlossaryPanel.ts` angelehnt |
| `components/sfxToggle.ts` | **Neu in v0.1.17**: reiner Mute/Play-Umschalter für Soundeffekte, eigenständiger Zustand unabhängig vom Musik-Mute |
| `components/savedDecksPanel.ts` | **Neu in v0.1.20** (Commit `9b81338`, s. eigener Abschnitt unten): `saveDeckForm`/`loadDeckPanel` — benannte Deck-Speicherfunktion (Name + optionale Beschreibung, beliebig viele Slots) |
| `components/deckAnalysis.ts` | **Neu in v0.1.20** (Commit `9b81338`, s. eigener Abschnitt unten): `deckAnalysisPanel` — Mana-Kurve/Farb-/Typverteilung der aktuellen Deckliste, reine CSS-Balken |
| `aiDecks.ts` | **Neu in v0.1.21** (Commit `5654ec1`, s. eigener Abschnitt unten): `AI_DECKS` — 7 vom card-designer kuratierte Archetyp-Decklisten (je 60 Karten, echte Kopienzahlen/Kurve statt Zufall) + `pickRandomAiDeck()`, reine Daten/Auswahlfunktion ohne Engine-Bezug |
| `store.ts` | Einzige Engine-Instanz (`createRulesEngine(starterSet)`), hält `GameState` + UI-Modus, kapselt `dispatch`/`legalActions`, Event→Log-Übersetzung; **seit v0.1.5** zusätzlich die App-Ebene-Phase (`AppPhase`: Deckbau vs. Spiel, s.u.) + gesammelte Decklisten, `initGame(deckP1, deckP2, seed?)` nimmt jetzt zwei Decklisten entgegen statt intern immer `buildDemoDeck` zu rufen; **seit v0.1.7** zusätzlich die KI-Anbindung: `isBotControlled`/`setBotControlled` (`Set<PlayerId>`, s. eigener Abschnitt unten), ein automatischer Zug-Loop (`triggerBotLoop`/`scheduleBotStepIfNeeded`/`runBotStep`), der nach jeder menschlichen `dispatch()`-Aktion und nach `initGame()` prüft, ob der aktuelle Akteur (`actingPlayer`, spiegelt exakt `render.ts#autoEnterForcedModes`/`src/ai/__tests__/simpleBot.test.ts#actingPlayer`) bot-gesteuert ist, sowie `isBotThinking()`/`setBotMoveDelayMs()` für Sichtbarkeit/Timing/Tests; **seit v0.1.8** speichert `confirmDeck()` die bestätigte Deckliste zusätzlich per `localStorage.setItem` (defensiv try/catch, s. eigener Abschnitt unten) und der Start-Wert von `decklists` lädt per `localStorage.getItem` als Fallback, falls der In-Memory-Zustand (frisch nach einem Modul-/Seiten-Reload) leer ist — `concede` selbst brauchte KEINE Store-Änderung (die Aktion existierte schon, s. Abschnitt unten); **seit v0.1.9** zusätzlich `botDifficulty: Record<PlayerId, BotDifficulty>` + `getBotDifficulty`/`setBotDifficulty` (Persistenz analog zu `isBotControlled`), `runBotStep` ruft jetzt `chooseActionForDifficulty(engine, pool, state, actor, botDifficulty[actor])` (aus `../ai`) statt des bisherigen `chooseAction`; **seit v0.1.11** zusätzlich der komplette Tutorial-Zustand (s. eigener Abschnitt unten): `startTutorial()` (fixe Decks aus `tutorialDeck.ts` + fixer Seed, markiert Spieler 2 bot-gesteuert auf "medium", merkt sich dessen vorherige Bot-Einstellung), `isTutorialActive`/`getTutorialPendingTip`/`dismissTutorialTip`/`isTutorialHelpOpen`/`toggleTutorialHelp`/`closeTutorialHelp`, `maybeQueueTutorialTips` (nach jeder Zustandsänderung während einer Tutorial-Partie: erkennt Schlüsselmomente rein aus der bereits ausgeführten `PlayerAction`/dem Folge-`GameState`, keine neue Regellogik), `scheduleBotStepIfNeeded` pausiert zusätzlich, solange eine Tutorial-Sprechblase aussteht; `backToDeckbuilder()` beendet den Tutorial-Modus sauber (stellt Spieler 2s vorherige Bot-Einstellung wieder her); **seit v0.1.17** komplett umbenannt/erweitert zu `backToMainMenu()` (führt IMMER zum Hauptmenü, s. eigener Abschnitt unten) + neue Hauptmenü-Navigation `startNewGameFlow`/`openDeckBuilderStandalone`/`chooseOpponentBot`/`chooseOpponentHotseat`, zusätzlich `isMusicEnabled`/`toggleMusicEnabled`/`isSfxEnabled`/`toggleSfxEnabled` (Persistenz analog zu den Decklisten); **seit v0.1.18** zusätzlich `setMusicTracks`/`getMusicCurrentTrack`/`getMusicRepeatMode`/`selectMusicTrack`/`advanceToNextMusicTrack` (Playlist-Zustand, s. `musicPlayer.ts`) sowie der komplette Auto-Pass-Mechanismus (`advanceAutomation`/`autoResolvableActionFor`/`applyAutomaticAction`/`hasRealPriorityChoice`/`isRealPriorityCandidate`, s. eigener Abschnitt unten); **seit v0.1.19** `isRealPriorityCandidate` schließt reine Mana-Fähigkeiten aus (Bugfix, s. eigener Abschnitt unten); **seit v0.1.20** zusätzlich die benannte Deck-Persistenz (`SavedDeck`/`saveDeckAs`/`loadSavedDeck`/`deleteSavedDeck`/`listSavedDecks`) und der Deck-Analyse-Panel-Zustand (`isDeckAnalysisPanelOpen`/`toggleDeckAnalysisPanel`); **seit v0.1.21 unverändert** — `pickRandomAiDeck()` (`aiDecks.ts`) wird direkt von `render.ts` aufgerufen, kein eigener Store-Zustand nötig (s. eigener Abschnitt unten) |
| `types.ts` | `UiMode`-Union (rein UI-intern, kein Teil des `GameState`); **seit v0.1.5** zusätzlich `AppPhase` (Deckbau vs. Spiel, App-Ebene, ebenfalls kein Teil der Engine); **seit v0.1.6** neuer `CastSource`-Typ (spell/ability) + `UiMode`-Zweige `modeSelect`/verallgemeinerte `xInput`/`xTarget` (s. eigener Abschnitt unten); **seit v0.1.7 unverändert** — die KI-Zuordnung lebt bewusst nur in `store.ts` (s. dortige Begründung im Code-Kommentar, analog zur v0.1.5-`AppPhase`-Entscheidung); **seit v0.1.17** `AppPhase` komplett umgebaut auf vier Werte `mainMenu`/`opponentSelect`/`deckbuild`/`playing` (statt bisher nur Deckbau/Spiel), `deckbuild` trägt zusätzlich `mode: "newGame" | "standalone"` (s. eigener Abschnitt unten für den vollständigen Ablauf) |
| `deck.ts` | `buildDemoDeck`: baut eine zufällige Demo-Deckliste aus dem `CardPool` (reine Daten); **seit v0.1.5** nicht mehr automatischer Partiestart, sondern der „Zufällig füllen"-Button im Deckbau-Screen; **seit v0.1.7 bis v0.1.20** zusätzlich Basis für „Zufälliges KI-Deck + weiter" im Deckbau-Screen von Spieler 2; **seit v0.1.21 überholt**: für BEIDE bot-gesteuerten Anwendungsfälle (Hauptmenü-Schnellstart UND „Zufälliges KI-Deck + weiter") liefert jetzt `aiDecks.ts#pickRandomAiDeck()` die Decklist, `buildDemoDeck` bedient nur noch den „Zufällig füllen"-Button des menschlichen Deckbaus |
| `deckValidation.ts` | **Neu in v0.1.5**: reine UI-Validierung einer Deckliste (min. 40 Karten, max. 4 Kopien pro Nicht-Terrain-id, s. `src/model/cards.ts#Decklist`-Kommentar) — die Engine validiert das selbst nicht |
| `tutorialDeck.ts` | **Neu in v0.1.11**: zwei fest kuratierte 40-Karten-Decklisten (`TUTORIAL_DECK_PLAYER1`/`TUTORIAL_DECK_PLAYER2`, je 6 verschiedene Karten aus `starterSet`) + `TUTORIAL_SEED` (fester `createGame`-Seed) für den Tutorial-Modus — reine Daten, keine Deckbau-Logik |
| `tutorialContent.ts` | **Neu in v0.1.11**: reine Textdaten für den Tutorial-Modus — `TutorialTipId`-Union, `TUTORIAL_TIPS` (geordnete Liste aus Titel+Text je Kernkonzept + Abschluss-Hinweis), `TUTORIAL_CORE_TIP_IDS` (die sechs Kernkonzepte, deren vollständiges Erscheinen den Abschluss-Hinweis auslöst) |
| `cardInfo.ts` | Anzeige-Hilfsfunktionen (Kosten-Formatierung, Farb-Klassen, Keyword-Labels); nutzt `computeEffectiveStats`/`computeEffectiveKeywords` aus der Engine für P/T-Anzeige (siehe Abschnitt „Grenzfall" unten); **seit v0.1.5** zusätzlich `dominantColorKey` (Manafarbe als Schlüssel statt CSS-Klasse, für den Deckbau-Farbfilter) |
| `actionUtil.ts` | Kandidaten↔Ziel-Zuordnung (`targetKeyOf`) + „Form"-Prüfung für die X-Kosten-Eingabe-UI; **seit v0.1.6** zusätzlich die `CastSource`-Helfer (`sourceName`/`sourceModes`/`sourceHasXCost`/`sourceTargets`/`buildCastAction`/`activateAbilityCandidatesFor`), die castSpell und activateAbility für den gemeinsamen Modus-/X-/Ziel-Flow vereinheitlichen |
| `h.ts` | Winziger Hyperscript-Helfer (kein Framework) |
| `render.ts` | Zentrale Render-Funktion + Interaktionsverdrahtung (Klicks → `dispatch`/`setUiMode`); **seit v0.1.5** verzweigt `render()` zuerst nach `AppPhase` (Deckbau-Screen vs. `renderGameBoard`); **seit v0.1.6** neue `pendingDecision`-Zweige `mulligan`/`chooseMode`, neuer `modeSelect`-Zweig, verallgemeinerter `xInput`/`xTarget`-Zweig (spell + ability), neue Battlefield-Erkennung für modale/X-Kosten-Fähigkeiten; **seit v0.1.7** reicht `renderDeckBuilder` die neuen KI-Umschalter-Callbacks an `deckBuilderScreen` durch und `playerArea` reicht `isBotControlled(playerId)` an `playerPanel` durch (KI-Badge); **seit v0.1.8** reicht `playerArea` zusätzlich `onConcede` an `playerPanel` durch — `undefined`, solange `state.winner`/`hasLost`/`isBotControlled(playerId)` das verbieten (s. eigener Abschnitt unten), sonst ein Klick-Handler mit `window.confirm`-Bestätigung + `dispatch({ kind: "concede", player })`; **seit v0.1.9** reicht `renderDeckBuilder` zusätzlich `getBotDifficulty`/`setBotDifficulty` an `deckBuilderScreen` durch und `playerArea` reicht `botDifficultyLabel` (nur gesetzt, wenn `isBotControlled(playerId)`) an `playerPanel` durch; **seit v0.1.11** reicht `renderDeckBuilder` zusätzlich `onStartTutorial` (nur für player1 gesetzt) an `deckBuilderScreen` durch, `renderGameBoard` rendert bei aktivem Tutorial-Modus zusätzlich die aktuell anstehende Tutorial-Sprechblase (`tutorialTipBubble`, ganz oben) sowie bei Bedarf das Hilfe-Panel (`tutorialHelpPanel`), `statusBar` zeigt im Tutorial-Modus zusätzlich einen "?"-Hilfe-Button und beschriftet den bisherigen "Neues Spiel"-Button dort als "Zurück zum Hauptmenü"; **seit v0.1.17** `render()` verzweigt zusätzlich nach `mainMenu`/`opponentSelect`, `playerDisplayName()` liefert den erfundenen Bot-Namen statt der rohen `PlayerId`, `handZone` stellt jede Nicht-„player1"-Hand nur noch verdeckt dar (`hiddenHandZone`), `boardSection` rendert bei aktivem Bot-Gegner zusätzlich `opponentAvatarColumn`, `render()` selbst verpackt Rebuilds innerhalb einer laufenden Partie optional in `document.startViewTransition()` (`supportsViewTransitions`/`prefersReducedMotion`-Fallback), `computeLifePulse` trackt Lebenspunkt-Änderungen für den Puls-Effekt, neue Rollen-Erkennung `decidingPlayer`/`decisionSpotlightPlayer` (Auto-Pass-bewusst, s. eigener Abschnitt unten); **seit v0.1.18** `actionBanner` zeigt bei `decisionSpotlightPlayer(state, mode) !== undefined` das neue `decisionSpotlightBanner` statt/zusätzlich zum bisherigen kleinen „Priorität passen"-Button; **seit v0.1.21** beide Stellen, an denen automatisch ein Deck für einen bot-gesteuerten Spieler gebaut wird (`deckBuilderScreen`-`onConfirm`/`onAiQuickstart`), rufen `pickRandomAiDeck()` (`aiDecks.ts`) statt `buildDemoDeck` auf (s. eigener Abschnitt unten); **seit v0.1.22** `statusBar` zeigt die drei reinen Info-Texte ("Zug X · Step: Y"/"Aktiver Spieler: ..."/"Priority: ...") NICHT mehr, `boardSection` rendert die rechte Spalte jetzt IMMER (umbenannt von `opponentAvatarColumn` zu `turnFlowColumn`, s. eigener Abschnitt unten) mit dem Porträt/Platzhalter des `state.activePlayer` (statt fest player2) über dem neuen `turnFlowPanel` |
| `components/*` | Einzelne Darstellungsbausteine (Kartenkacheln, Handkarten, Spieler-Panel, Stack, Log, Aktions-Banner); **seit v0.1.5** zusätzlich `deckBuilder.ts` (Deckbau-Screen); **seit v0.1.6** neue Panels in `actionPanels.ts` (`mulliganPanel`, `modeSelectPanel`, `chooseModeDecisionPanel`), `handCard.ts` mit neuem `offerModeFlow`/`onStartModeFlow`, `playerPanel.ts` mit `data-player`-Attribut (Testbarkeit); **seit v0.1.7** `deckBuilder.ts` mit KI-Umschalter (nur player2-Screen) + „Zufälliges KI-Deck + weiter"-Button, `playerPanel.ts` mit optionalem „KI"-Badge (`botControlled`-Option); **seit v0.1.8** `playerPanel.ts` mit optionalem „Aufgeben"-Button (`onConcede`-Option, `data-testid="concede-<player>"` für Tests); **seit v0.1.9** `deckBuilder.ts` mit Schwierigkeits-Dropdown (`.deckbuilder-ai-difficulty-select`, nur bei aktiver KI-Steuerung), `playerPanel.ts` mit optionalem zweiten Bot-Badge (`botDifficultyLabel`-Option, `.badge-bot-difficulty`); **seit v0.1.10** neuer gemeinsamer Baustein `manaCost.ts` (`manaCostBadge`, baut die Mana-Pip-Kopfzeile aus `cardInfo.ts#manaCostPips`), `handCard.ts`/`cardTile.ts`/`deckBuilder.ts` (`poolRow`) komplett auf das neue `card-frame-*`-Kartenrahmen-Layout umgebaut (s. eigener Abschnitt unten); **seit v0.1.11** `deckBuilder.ts` mit auffälligerer KI-Umschalter-Box (Überschrift + Hinweistext) und neuer "Tutorial starten"-Box (nur player1-Screen), neuer Baustein `tutorialOverlay.ts` (`tutorialTipBubble`, `tutorialHelpButton`, `tutorialHelpPanel`) für den Tutorial-Modus (s. eigener Abschnitt unten); **seit v0.1.17** neue Bausteine `mainMenu.ts`/`opponentSelect.ts`/`rulesGuidePanel.ts`/`sceneArt.ts`/`sfxToggle.ts` (s. eigene Tabellenzeilen oben), `deckBuilder.ts` bietet im `mode: "standalone"` statt „Weiter"/„Spiel starten" einen „Zurück zum Hauptmenü"-Button; **seit v0.1.18** neuer Baustein `decisionSpotlight.ts`, `musicPanel.ts` löst den bisherigen einfachen Mute-Button ab; **seit v0.1.20** `deckBuilder.ts` zusätzlich mit „Deck leeren"-Button sowie den neu eingebundenen Bausteinen `savedDecksPanel.ts`/`deckAnalysis.ts` (s. eigene Tabellenzeilen oben) |
| `style.css` | Funktionales Layout, dunkles Theme, Farbcodierung nach Manafarbe; **seit v0.1.6** `.mode-select-list`/`.mode-select-btn`; **seit v0.1.7** `.deckbuilder-ai-toggle`/`.deckbuilder-ai-toggle-label`/`.deckbuilder-ai-quickstart-btn`/`.badge-bot`; **seit v0.1.8** `.btn-concede`; **seit v0.1.9** `.badge-bot-difficulty`/`.deckbuilder-ai-difficulty-label`/`.deckbuilder-ai-difficulty-select`; **seit v0.1.10** komplett neues, gemeinsames Kartenrahmen-Layout (`.card-frame-header`/`-name`/`-cost`/`-frame`/`-art`/`-type`/`-text-box`/`-text`/`-status`/`-pt`, `.mana-pip`, neue dunkle `--mana-*-dark`-Variablen) für `.hand-card`/`.card-tile`/`.deck-pool-row` (s. eigener Abschnitt unten); **seit v0.1.11** `.deckbuilder-footer` jetzt `position: sticky` (bleibt beim Pool-Scrollen sichtbar), größere/auffälligere `.deckbuilder-ai-toggle*`-Regeln (+ neue `-heading`/`-hint`-Klassen), neue `.deckbuilder-tutorial-box*` sowie `.tutorial-tip-bubble*`/`.tutorial-help-btn`/`.tutorial-help-backdrop`/`.tutorial-help-panel*` (s. eigener Abschnitt unten); **seit v0.1.17** großer Zuwachs: `.main-menu-*`/`.opponent-select-*`/`.rules-guide-*` (neue Screens), `.board-backdrop-img*` (viewport-breiter Taverne-Hintergrund), `.board-opponent-avatar*` (220px-Avatar-Spalte), `.board` selbst mit neuer Holzmaserungs-/Kerzenschein-Glow-Atmosphäre, `.hand-zone-hidden*` (verdeckte Gegner-Hand), `.player-area-deciding` (Rahmen-Hervorhebung), `player-panel`-Lebenspunkt-Puls-Keyframes, `.tutorial-glow` (Puls-Highlight); **seit v0.1.18** `.decision-spotlight-*`, `.music-panel-*` (löst `.music-toggle-btn`-Popover-losen Vorgänger ab); **seit v0.1.20** neue `.deckbuilder-save-deck-btn`/`.deckbuilder-load-deck-btn`/`.save-deck-*`/`.load-deck-*`/`.deckbuilder-analysis*`/`.deck-analysis-*`/`.deckbuilder-clear-btn`; **seit v0.1.22** `.board-opponent-avatar` aufgeteilt in `.board-turn-flow-column` (äußerer Wrapper, immer gerendert) + `.board-active-avatar` (Avatar-Box darin, umbenannt), neue `.board-active-avatar-human*` (Menschen-Platzhalter) und `.turn-flow-*` (Schritt-Kette/-Knoten/-Meta, s. eigener Abschnitt unten); die `max-width: 900px`-Media-Query blendet die rechte Spalte nicht mehr komplett aus, sondern stapelt sie unter `.board` |
| `__tests__/*` | **Neu in v0.1.5**: dauerhafte Vitest+jsdom-Tests (bleiben im Repo, s. eigener Abschnitt unten); **seit v0.1.6** zusätzlich `mulligan.test.ts`, `modal-effects.test.ts`, `x-cost-ability.test.ts` + gemeinsame Test-Infrastruktur `testHelpers.ts` (Klick-/Deck-/Autopilot-Helfer, kein Produktionscode); **seit v0.1.7** zusätzlich `vs-bot.test.ts` (komplette Partie gegen den Bot, s. eigener Abschnitt unten) + neuer `testHelpers.ts`-Helfer `setChecked` (Checkbox-Interaktion); **seit v0.1.8** zusätzlich `concede.test.ts` (Aufgeben-Button) und `deck-persistence.test.ts` (localStorage-Persistenz, s. eigener Abschnitt unten); **seit v0.1.9** zusätzlich `vs-bot-difficulty.test.ts` (Schwierigkeitsstufen-Dropdown + komplette Partie mit Stufe „hard", s. eigener Abschnitt unten) + neuer `testHelpers.ts`-Helfer `selectValue` (`<select>`-Interaktion); **seit v0.1.11** zusätzlich `tutorial.test.ts` (Tutorial-Start bis zur ersten wegklickbaren Sprechblase + Hilfe-Panel + Rückkehr zum Hauptmenü, s. eigener Abschnitt unten); **seit v0.1.17** die bisherige Golden-Path-Verifikation wurde als dauerhafte Datei `golden-path.test.ts` benannt und geht jetzt über das neue Hauptmenü statt direkt im Deckbau zu starten (`.main-menu-new-game-btn` → `.opponent-select-hotseat-btn`, s. eigener Abschnitt unten), neuer `main-menu.test.ts` (die drei neu hinzugekommenen Hauptmenü-Klickpfade: KI-Schnellstart über `opponentSelect`, eigenständiger „Deck Builder"-Modus, „Zurück zum Hauptmenü" aus einer laufenden Partie), neuer `rules-guide.test.ts`; `vs-bot.test.ts`/`vs-bot-difficulty.test.ts`/`tutorial.test.ts` decken weiterhin den bisherigen Ablauf NACH dem Hauptmenü ab, jetzt jeweils über „Neues Spiel" → „2 Spieler"/KI-Wahl erreicht |

## Was funktioniert

1. **Grundlayout** (Pflichtanzeigen laut rules-engine.md Abschnitt 3 /
   docs/README.md): Zwei Spielerbereiche (Hand/Battlefield/Graveyard je
   Spieler), gemeinsamer Stack-Bereich (unten→oben, oberstes Element optisch
   hervorgehoben), Zug-Flow in der rechten Board-Spalte (Zugnummer, die 12
   `TurnStep`-Werte gruppiert zu 6 Phasen-Knoten mit aktuellem/erledigtem/
   kommendem Zustand, aktiver Spieler, Priority-Inhaber oder „Engine
   verarbeitet Turn-Based Action" — **seit v0.1.22** hier statt als reiner
   Text in der `.status-bar`, s. eigener Abschnitt unten), Ereignis-Log
   (menschenlesbare `GameEvent`-Zusammenfassung).
2. **Kartendarstellung**: Kompaktkacheln (`cardTile`) für
   Battlefield/Graveyard/Stack mit Name, Kosten, effektiver P/T (inkl. Marken
   und statischer Effekte über die Engine-Funktion), Tapped-/Sick-/
   Attached-Status, Countern, Keywords. Ausführlichere Handkarten
   (`handCard`) mit Typ/Untertyp, Kosten, Regeltext, Basiswerten und
   Aktions-Buttons.
3. **Interaktion**:
   - Karte aus der Hand spielen (Terrain direkt; Spells/Units/Relics/
     Enchantments mit 0 oder 1 Zielslot direkt oder über eine
     Ziel-Auswahl-Ansicht, deren Kandidaten **ausschließlich** aus
     `getLegalActions` stammen).
   - Priority passen — eigener, immer sichtbarer „Priorität passen
     (‹Spieler›)"-Button in der Status-Zeile, solange `priorityPlayer`
     gesetzt und keine `pendingDecision` aussteht (v0.1.1-Fix, siehe oben).
     **Seit v0.1.18 ergänzt**: hat der Priority-Inhaber laut `legalActions`
     GAR KEINE echte Wahl (nur `passPriority`/`concede`, **seit v0.1.19**
     bewusst OHNE reine Mana-Fähigkeiten als „echte Wahl" mitzuzählen), wird
     automatisch gepasst, ganz ohne Klick (`store.ts#advanceAutomation`, s.
     eigener Abschnitt unten); steht dagegen eine echte Wahl an, ersetzt/
     ergänzt ein auffälliges Spotlight-Banner (`decisionSpotlightBanner`) den
     bisherigen unauffälligen Button.
   - Aktivierte Fähigkeiten auf Battlefield-Permanents (inkl. Mana-
     Fähigkeiten, die laut Regelwerk sofort ohne Stack resolven — das
     Frontend unterscheidet hier nicht extra, das erledigt die Engine).
   - Ziel-Auswahl: anklickbare Permanents/Spieler/Stack-Objekte werden über
     `getLegalActions`-Kandidaten ermittelt (`candidatesByTargetKey`); ein
     Klick löst exakt den passenden, von der Engine gelieferten
     `PlayerAction`-Kandidaten aus.
   - **X-Kosten-Karten** (z. B. `core.inferno-surge`): eigene Eingabe-UI
     (Zahlenfeld für X, danach Ziel auf dem Board antippen), wie von
     `docs/engine-status.md` für diesen Fall explizit vorgesehen
     (`getLegalActions` enumeriert X-Karten bewusst nicht). Die
     Ziel-„Anklickbarkeit" wird hier nur anhand des `TargetSpec.kind` der
     Karte selbst bestimmt (reine Datenauskunft, keine Legalitätsprüfung);
     `applyAction` validiert final und ein Fehlschlag zeigt schlicht den
     `error`-String der Engine.
   - **Combat**: Angreifer per Mehrfachauswahl + „Angriff erklären"/„Keine
     Angreifer"; Blocker per „Blocker anklicken → Angreifer anklicken" mit
     Paar-Liste, „Blocks bestätigen"/„Keine Blocker". Auch hier entscheidet
     ausschließlich `applyAction`, ob eine Kombination (inkl. `guardian`-
     Pflicht) legal ist.
   - **Cleanup-Abwurf**: Wird automatisch erkannt (`step === "cleanup"`,
     `priorityPlayer === undefined`, `hand.length > 7`, wie in
     `docs/engine-status.md` dokumentiert) und zeigt eine Auswahl-UI zum
     Abwerfen der überzähligen Karten.
   - **Aufgeben/`concede`** (**seit v0.1.8**, s. eigener Abschnitt unten): ein
     Button pro Spieler im Spieler-Panel, mit `window.confirm`-Bestätigung
     (irreversible Aktion), ausgeblendet für bot-gesteuerte Spieler und nach
     Spielende.
   - **Erzwungene Kampf-Deklarationsschritte ohne echte Kandidaten** (**seit
     v0.1.18**): hat der aktive Spieler keine einzige Einheit, die überhaupt
     als Angreifer/Blocker infrage kommt, wird die leere Deklaration
     automatisch angewendet statt einen Klick auf „Keine Angreifer"/„Keine
     Blocker" zu verlangen (gleicher Mechanismus wie beim Auto-Pass oben).
4. **PendingDecision-UI** (explizit für frontend-engineer vorgesehen,
   `docs/README.md`): Ist `state.pendingDecision` gesetzt, verzweigt
   `render.ts#actionBanner` je nach `kind`:
   - `chooseTriggerTargets`: Banner „Zielwahl erforderlich", legale
     Einzelziele werden über `getLegalActions`-Kandidaten
     (`kind: "resolveDecision"`) auf dem Board anklickbar gemacht — exakt
     der gleiche Mechanismus wie normales Ziel-Casting, da beide auf
     denselben `candidatesByTargetKey`-Helfer zurückgreifen.
   - `orderBlockers` (v0.1.3, s.u.): eigenes Panel mit hoch/runter-Sortierung
     statt Board-Klicks, da diese Decision strukturell keine
     „ein Klick = eine Aktion"-Kandidaten liefert (Permutationswahl statt
     Einzelziel).
5. **Stack/Priority-Nachvollziehbarkeit** (Kernanforderung an die Rolle):
   Stack-Panel zeigt jedes Objekt (Spell/aktivierte/getriggerte Fähigkeit)
   mit Controller, gewählten Zielen und X-Wert; Status-Zeile + Spieler-Panel-
   Badges zeigen jederzeit, wer Priority hat, wer am Zug ist und wer gerade
   eine Entscheidung treffen muss.

## Bewusste Vereinfachungen / Grenzfälle

- **Effektive P/T-Anzeige nutzt Engine-Code, nicht nur das offizielle
  `RulesEngine`-Interface.** `src/engine/stats.ts#computeEffectiveStats` /
  `computeEffectiveKeywords` sind laut `src/engine/index.ts`-Kommentar
  „nicht stabile API", aber die einzige Möglichkeit, Marken +
  Nicht-Layer-Statik (rules-engine.md 9.3) korrekt anzuzeigen, ohne diese
  Berechnung im Frontend zu duplizieren. Re-Use statt Neuimplementierung
  erschien mir der kleinere Verstoß gegen „keine Spiellogik im Frontend".
  Falls der Engine-Engineer/Game-Architect das anders sehen: Alternative
  wäre, `computeEffectiveStats`/`computeEffectiveKeywords` offiziell in den
  `RulesEngine`-Vertrag aufzunehmen (z. B. als vierte Methode), damit der
  Re-Use explizit abgesegnet ist.
- **X-Kosten-Ziel-Klickbarkeit** ist bewusst grob (nur `TargetSpec.kind`,
  keine Controller-/Typ-Filterung außer der im Spec selbst stehenden
  `cardTypes`): Ein Fehlklick zeigt den `error`-String der Engine statt
  clientseitig vorgefiltert zu werden — folgt explizit der Empfehlung in
  `docs/engine-status.md` („eigene Eingabe-UI bauen und `applyAction`
  validieren lassen").
- **Kein Netzwerk** — weiterhin reines lokales Board (Hotseat ODER gegen den
  Bot im selben Browser-Tab, s. u.). **Seit v0.1.5** gibt es einen echten
  Deckbau-Screen vor dem Spielstart (s. eigener Abschnitt unten) statt eines
  fest codierten Demo-Decks; der Deckbau selbst bleibt aber bewusst simpel
  (kein Sideboard — **seit v0.1.8 kein Datenverlust bei Reload mehr**, s.
  dortiger Abschnitt: die zuletzt bestätigte Deckliste pro Spieler übersteht
  jetzt auch einen echten Seiten-Reload; **seit v0.1.20 zusätzlich eine echte
  benannte Mehrfach-Deck-Verwaltung** (`SavedDeck`, beliebig viele Slots mit
  Name + Beschreibung) — der bisherige Klammerzusatz „keine Deck-Namen/-
  Verwaltung mehrerer Decks" ist damit überholt).
  **Seit v0.1.7 gibt es einen AI-Gegner-Anschluss** (s. eigener Abschnitt
  unten) — der bisherige Satz „kein AI-Gegner" ist damit überholt; weiterhin
  **kein Netzwerk-Multiplayer**. **Seit v0.1.17 gibt es zusätzlich eine echte
  Gegner-Auswahl VOR dem Deckbau** (Hauptmenü → „Neues Spiel" →
  KI-Schwierigkeit/„2 Spieler", s. eigener Abschnitt unten) — der weiter oben
  im Dokument noch vorhandene Satz „keine Spielerauswahl über Deckbau hinaus"
  ist damit überholt (s. Korrektur in „Setup/Start" oben). **Seit v0.1.21**
  zieht die KI außerdem eines von 7 kuratierten Archetyp-Decks (`aiDecks.ts`)
  statt einer reinen 5-Farben-Zufallsmischung (s. eigener Abschnitt unten) —
  bewusst nicht in der UI offengelegt, welcher Archetyp gerade gespielt wird.
- **Hotseat-Zweitspieler kann seine eigene Hand seit v0.1.17 nicht mehr aktiv
  anklicken** (bewusst hingenommene Einschränkung): die verdeckte
  Gegner-Hand-Darstellung (`hiddenHandZone`, s. eigener Abschnitt unten)
  betrifft strukturell JEDE Nicht-„player1"-Hand, unabhängig davon, ob dieser
  Spieler bot-gesteuert ist oder ein zweiter Mensch am selben Bildschirm (echtes
  Pass-and-Play mit Bildschirm-Umdrehen ist außerhalb des Auftrags) — dessen
  Zug läuft ohne diese Interaktion weiter, kein Deadlock (Priorität bleibt
  normal passierbar, Cleanup-Abwurf ist bewusst von der Verdeckung
  ausgenommen, s. Code-Kommentar an `render.ts#handZone`).
- **Opfer-/Zusatzkosten-Feedback**: `additionalCosts` (tap/sacrifice/
  payLife/discard/removeCounters) werden nicht separat abgefragt — die
  Engine wendet sie beim Ausführen an (bzw. wirft Karten automatisch nach
  Auto-Default ab, siehe `docs/rules-engine.md` 9.7); das Frontend zeigt nur
  das Ergebnis über den State/Log, keine eigene Bestätigungs-UI dafür.
- **`concede` ist seit v0.1.8 verdrahtet** (s. eigener Abschnitt unten) — der
  bisherige Satz hier („nicht verdrahtet, trivial ergänzbar") ist damit
  überholt.
- **Mehrfach-Zielslots / mehrere gleichzeitige Trigger-Wahlen**: Der
  Kartenpool enthält aktuell keine Karte mit >1 Zielslot, daher ungetestet;
  der X-Kosten-Mechanismus (`xTarget`-UI-Modus) ist so gebaut, dass er sich
  auf mehrere Slots erweitern ließe (pro Slot einmal durchlaufen), ist aber
  nicht implementiert.
- **Kein automatisches Scrollen/Responsive-Design/Mobile-Layout** — reines
  Desktop-Funktionslayout.

## Verifikation (was geprüft wurde)

- `npm run build` (tsc --noEmit über Engine + UI) — sauber.
- `npm test` — weiterhin 48/48 Engine-Tests grün, UI-Code hat keine
  eigenen automatisierten Tests (siehe „Nächste Schritte").
- `npm run build:ui` (Vite-Produktionsbuild) — erfolgreich.
- Manueller Store-Smoke-Test (temporär, nicht Teil des Repos) via Vitest:
  `initGame` + `dispatch` (`passPriority`, `playTerrain`) funktionieren wie
  erwartet.
- Manueller DOM-Smoke-Test (temporär, mit `jsdom`, nicht als Dependency
  übernommen): `render()` über ~60 Aktionszyklen (Priority passen/Terrain
  spielen, Angreifer/Blocker deklarieren, Cleanup-Abwurf, PendingDecision
  auflösen) hinweg ohne Exceptions, Board/Status-Bar bleiben im DOM vorhanden.
- Manueller Klick-Golden-Path-Test (v0.1.1-Fix, temporär, `jsdom`): echte
  `button.dispatchEvent(new Event("click"))`-Aufrufe auf die von `render()`
  gebauten Elemente (kein direkter Store-Aufruf) — Upkeep → Draw → Main1 nur
  über den „Priorität passen"-Button, danach „Terrain legen" per Klick
  (Battlefield wächst um 1). Bestätigt, dass die in `docs/README.md`
  geforderten Pflicht-Interaktionen tatsächlich end-to-end anklickbar sind,
  nicht nur über die Engine-API erreichbar.

## Combat-UI-Verifikation (v0.1.2, 2026-07-09, gegen rules-engine.md v0.2.2)

Aufgabe: die bestehende Combat-UI (Angreifer-/Blocker-Deklaration in
`actionPanels.ts`/`render.ts`, s.o. „Was funktioniert" Punkt 3) end-to-end
gegen vier Szenarien verifizieren, ohne neu zu bauen. Methode: echte
Klick-Simulation (`element.dispatchEvent(new Event("click"))`) auf das von
`render()` erzeugte DOM in `jsdom`, exakt wie beim v0.1.1-Klick-Golden-Path-
Test — Board-Vorbedingungen (Einheiten auf dem Battlefield) wurden dabei
direkt per Zonen-Helfer (`createCardInstance`/`moveCard`, wie es die
Engine-Tests auch tun) aufgebaut, um nicht jedes Mal mehrere echte Züge
spielen zu müssen; die eigentliche geprüfte Interaktion lief aber
ausschließlich über echte Klicks auf Store/Render, nicht über direkte
`applyAction`-Aufrufe. Temporär war dafür ein Debug-Setter in `store.ts`
nötig (State direkt injizieren) — nach der Verifikation wieder entfernt
(`git checkout`), kein Teil des Repos.

1. **Mehrfachblock** (ein Angreifer, zwei Blocker): Paar-Liste zeigt
   korrekt „Glutpfote blockt Hain-Ältester" / „Gezeitenkundschafter blockt
   Hain-Ältester"; „Blocks bestätigen" löst ohne Fehler aus; Schaden wird
   gemäß Verteidiger-Reihenfolge (rules-engine.md 9.8) zugeteilt (1/1- und
   1/2-Blocker sterben beide, Angreifer nimmt genau ihre Summe an Schaden),
   sichtbar sowohl im Event-Log als auch am Battlefield (tote Blocker
   verschwinden). Keine Lücke gefunden.
2. **`guardian`-Verstoß**: Verteidiger hat eine ungetappte
   `core.temple-sentinel` (guardian) UND einen legalen Block dafür, wählt
   aber bewusst „Keine Blocker". Die Engine lehnt ab
   (`guardian-Pflicht verletzt: Unit ... muss einen Angreifer blocken.`),
   `store.dispatch` setzt `lastError`, und `render.ts` zeigt es unverändert
   über das bestehende `error-banner` als „Nicht erlaubt: guardian-Pflicht
   verletzt …" an — kein stilles Scheitern, kein Absturz, Step bleibt in
   `declareBlockers` (Aktion wurde nicht angewandt). Gegenprobe mit
   legalem guardian-Block direkt danach erfolgreich (kein Fehler mehr).
   Keine Lücke gefunden.
3. **Instant-Response-Fenster nach Declare Blockers** (rules-engine.md 6a):
   Nach „Blocks bestätigen" liegt Priority korrekt beim aktiven
   (angreifenden) Spieler, `Priorität passen`-Button und Handkarten sind
   nutzbar. Terrain-Tile ist als aktivierbare Mana-Fähigkeit anklickbar,
   Mana landet im Pool; `core.fire-jolt` (fast) lässt sich darauf aus der
   Hand spielen, Zielauswahl (der gegnerische Blocker) ist korrekt
   anklickbar, Stack-Panel zeigt „Feuerstoß · player2 → Glutpfote" mit
   Controller und Ziel. Nach beidseitigem Passen resolvt der Spell, der
   Blocker stirbt (`geblockt bleibt geblockt`, rules-engine.md 6b, war hier
   nicht weiter relevant, da nur der Blocker gezielt entfernt wurde) — das
   Fenster ist über die UI voll nutz- und nachvollziehbar. Keine Lücke
   gefunden.
4. **Vigilant-Angreifer**: `starterSet` (der tatsächlich im Demo-Deck
   verwendete Kartenpool, `src/cards/starter-set.ts`) enthält aktuell
   **keine** Karte mit dem Keyword `vigilant` (nur die interne
   Engine-Test-Fixture `test.vigilant-bear` in
   `src/engine/__tests__/fixtures.ts`, die nicht Teil des Demo-Decks ist) —
   dieser Fall war laut Auftrag „falls im Demo-Deck vorhanden" optional und
   damit **nicht end-to-end mit einer echten Karte testbar**. Als
   Teilverifikation wurde bestätigt, dass der zugrundeliegende Render-Pfad
   bereits pro Angriffs-Deklaration korrekt zwischen „getappt"
   (`.card-tile-tapped-badge`, `ps.tapped`) und der generischen
   Keyword-Anzeige (`effectiveKeywords`, dieselbe Stelle, die auch
   `guardian` in Szenario 2 korrekt anzeigt) unterscheidet: Ein normaler
   Angreifer (ohne `vigilant`) wurde nach der Deklaration korrekt als
   getappt markiert. Da `vigilant` mechanisch nur bedeutet „bleibt
   ungetappt" und keine eigene Anzeige-Logik braucht (die UI liest immer
   `ps.tapped`, nie das Keyword selbst, um den Tapped-Status zu
   bestimmen), ist mit hoher Zuversicht davon auszugehen, dass eine künftige
   `vigilant`-Karte korrekt ungetappt dargestellt würde — bitte aber echt
   nachverifizieren, sobald der Card-Designer eine solche Karte ins
   `starterSet` aufnimmt.

**Ergebnis:** Keine UI-Lücke gefunden, keine Code-Änderung an der
Combat-UI selbst nötig (`actionPanels.ts`/`render.ts` unverändert). Einzige
Datei-Änderung durch diesen Schritt: dieser Dokument-Abschnitt.
`npm run build` (tsc --noEmit) läuft weiterhin sauber (auch mit den
parallel laufenden Engine-Änderungen in `combat.ts`, die zum Zeitpunkt
dieser Verifikation als Work-in-Progress im Arbeitsverzeichnis lagen, aber
nicht Gegenstand dieser Prüfung waren).

## `orderBlockers`-UI + Kampf-Keyword-Anzeige (v0.1.3, 2026-07-09, gegen rules-engine.md v0.2.3)

Reaktion auf das v0.2.3-Kampf-Keyword-Paket (`trample`/`firstStrike`/
`deathtouch` als reine Anzeige-Keywords + die neue `PendingDecision`-Variante
`orderBlockers`, docs/rules-engine.md 6d/9.9, docs/engine-status.md).

### Neue UI: `orderBlockers`

`orderBlockers` ist strukturell anders als die bisher einzige real
erreichbare Decision `chooseTriggerTargets`: Die Wahl ist eine Permutation
der Blocker pro mehrfach geblocktem Angreifer, nicht ein anklickbares
Einzelziel — `getLegalActions` liefert hier laut Vertrag nur EINEN
Kandidaten (die Deklarationsreihenfolge), keine Permutationen. Der
bestehende generische `pendingDecision`-Klick-auf-Board-Mechanismus
(`candidatesByTargetKey`) trägt das nicht; dafür gibt es jetzt einen
eigenen Pfad:

- **`src/ui/types.ts`**: neuer `UiMode`-Zweig `"orderingBlockers"` mit
  lokalem, sortierbarem Zustand (`attackers: Array<{ attacker, blockers }>`,
  eine Kopie der von der Engine vorgeschlagenen Reihenfolge — die
  Mutation passiert rein im UI-Zustand, erst der finale
  `resolveDecision`-Dispatch geht an die Engine).
- **`src/ui/render.ts#autoEnterForcedModes`**: Ist `state.pendingDecision.kind
  === "orderBlockers"`, wird automatisch in `orderingBlockers` gewechselt
  (Initialzustand = Deklarationsreihenfolge aus der Decision, tief kopiert).
  `chooseTriggerTargets` bleibt auf dem bisherigen `candidatesByTargetKey`-Weg
  (früher: pauschaler Return bei jeder `pendingDecision`; jetzt: Verzweigung
  nach `kind`).
- **`src/ui/components/actionPanels.ts#orderBlockersPanel`** (neu): pro
  Angreifer eine nummerierte Blocker-Liste (Position 1 = wird zuerst mit
  Schaden bedient) mit „▲"/„▼"-Buttons statt Drag&Drop (Buttons an den
  Rändern der jeweiligen Liste deaktiviert). Ein „Reihenfolge bestätigen"-
  Button löst `resolveDecision` mit `choice.orders = attackers` (aktueller
  UI-Zustand) aus — **ohne Umsortieren entspricht das exakt der von der
  Engine vorgeschlagenen Deklarationsreihenfolge**, ein Bestätigen-Klick
  genügt also für den Normalfall, wie vom Auftrag verlangt.
- **`src/ui/render.ts#actionBanner`**: neue Verzweigung vor dem generischen
  `chooseTriggerTargets`-Banner: Ist `pendingDecision.kind === "orderBlockers"`
  und `mode.kind === "orderingBlockers"`, wird `orderBlockersPanel` gerendert
  statt des generischen Banners.
- Reset: `orderingBlockers` wird wie `declaringAttackers`/`declaringBlockers`/
  `discarding` automatisch auf `idle` zurückgesetzt, sobald keine passende
  `pendingDecision` mehr vorliegt (z.B. nach erfolgreichem `resolveDecision`).

Der Rest des Boards (Battlefield-Kacheln etc.) bleibt für diesen Modus rein
darstellend/nicht-klickbar — die gesamte Interaktion läuft über das neue
Panel, kein Board-Klick-Pfad war für die Aufgabe nötig oder wurde ergänzt.

### Keyword-Anzeige `trample`/`firstStrike`/`deathtouch`

Wie erwartet reine Anzeige-Erweiterung über den bestehenden
Keyword-Badge-Pfad (`cardTile.ts` → `cardInfo.ts#effectiveKeywords` →
Engine-`computeEffectiveKeywords` → `KEYWORD_LABEL`-Lookup). Einzige nötige
Änderung: `KEYWORD_LABEL` in `src/ui/cardInfo.ts` um die drei neuen
Einträge ergänzt (`trample` → „Trampeln", `firstStrike` → „Erstschlag",
`deathtouch` → „Todesberührung") — ohne diesen Eintrag wären die Keywords
zwar schon sichtbar gewesen (der Fallback `KEYWORD_LABEL[k] ?? k` zeigt bei
fehlendem Label die rohe interne Keyword-ID), aber eben nicht mit
deutschsprachigem Anzeigenamen wie bei `guardian`/`lifelink`.

### Verifikation

**Wichtige Einschränkung vorab:** In dieser Session standen mir keine
Browser-/Computer-Use-Werkzeuge zur Verfügung (nur Datei-/Shell-Werkzeuge) —
die Verifikation lief daher wie schon in v0.1.1/v0.1.2 über echte
`element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
erzeugte DOM in `jsdom` (Vitest), nicht über eine tatsächliche
Browser-Bedienung. Zwei temporäre Testdateien (nicht Teil des Repos, nach
Verifikation gelöscht; dafür kurzzeitig ein temporärer Debug-Setter
`__debugSetState`/`__debugGetEngine` in `store.ts`, ebenfalls per
`git checkout` wieder entfernt — exakt das in v0.1.2 dokumentierte Muster):

1. **`orderBlockers`-Durchlauf (Default bestätigen):** Über direkte
   Zonen-Manipulation (`createCardInstance`/`moveCard`, wie Engine-Tests es
   tun) einen Angreifer (`core.grove-elder`) und zwei Blocker
   (`core.cinder-pup`, `core.tide-scout`) aufs Battlefield gebracht, dann
   ECHTE Aktionen dispatcht: `declareAttackers`, beide passen (Priority-
   Fenster des `declareAttackers`-Steps, rules-engine.md 6a), `declareBlockers`
   mit beiden Blockern auf denselben Angreifer. Ergebnis:
   `state.pendingDecision.kind === "orderBlockers"` korrekt gesetzt,
   `render()` zeigt `.order-blockers-panel` mit zwei nummerierten Einträgen
   in Deklarationsreihenfolge. Klick auf den echten (im DOM erzeugten)
   „Reihenfolge bestätigen"-Button — **ohne vorheriges Umsortieren** — löst
   `resolveDecision` erfolgreich aus (`pendingDecision` danach `undefined`,
   Priority geht korrekt an den aktiven Spieler weiter). Bestätigt: der
   geforderte Ein-Klick-Default funktioniert.
2. **`orderBlockers`-Durchlauf (Umsortieren):** Gleicher Aufbau, diesmal
   echter Klick auf den „▲"-Button des zweiten Blocker-Eintrags. Re-Render
   zeigt die vertauschte Reihenfolge im DOM (Namen per `cardDef`-Lookup
   verglichen, nicht nur Struktur). Klick auf „Reihenfolge bestätigen"
   danach: `CombatAssignment.blockedBy` des Angreifers im resultierenden
   State enthält exakt die vertauschte Reihenfolge — die UI-Sortierung kommt
   also tatsächlich in der Engine an, nicht nur im lokalen UI-Zustand.
3. **Keyword-Badges:** Da `starterSet` (das im Demo-Deck tatsächlich
   verwendete Kartenpool) **keine** Karte mit `trample`/`firstStrike`/
   `deathtouch` enthält, wurde stattdessen der Engine-Test-Pool
   (`src/engine/__tests__/fixtures.ts`, der bereits dedizierte Testkarten
   `TRAMPLE_UNIT`/`FIRST_STRIKE_UNIT`/`DEATHTOUCH_UNIT`/
   `FIRST_STRIKE_DEATHTOUCH_UNIT` mitbringt) direkt an `cardTile()`
   übergeben. Ergebnis: `.card-tile-keywords`-Text zeigt exakt „Trampeln"
   bzw. „Erstschlag" bzw. „Todesberührung"; die Kombinationskarte
   (firstStrike+deathtouch) zeigt beide Labels und **keine** rohe interne
   Keyword-ID im Text. Damit ist der Anzeige-Pfad bestätigt funktionsfähig —
   **aber mangels Testkarte im tatsächlichen `starterSet` nicht im echten
   Demo-Deck/Browser-Kontext verifizierbar.** Das ist laut Auftrag kein
   Blocker für diesen Schritt, sondern nur zur Kenntnis an card-designer:
   Sobald eine Karte mit einem der drei Keywords ins `starterSet`
   aufgenommen wird, bitte hier nachverifizieren (gleiches Muster wie beim
   offenen `vigilant`-Punkt aus v0.1.2).
4. `npm run build` (tsc --noEmit) sauber, `npm test` weiterhin 77/77
   Engine-Tests grün (unverändert, keine Engine-Datei angefasst), `npm run
   build:ui` (Vite-Produktionsbuild) erfolgreich.

**Ergebnis:** Neue Dateien/Änderungen durch diesen Schritt:
`src/ui/types.ts` (neuer `UiMode`-Zweig), `src/ui/components/actionPanels.ts`
(neues `orderBlockersPanel`), `src/ui/render.ts` (Verzweigung in
`autoEnterForcedModes`/`actionBanner`, Reset-Liste), `src/ui/cardInfo.ts`
(drei neue `KEYWORD_LABEL`-Einträge), `src/ui/style.css` (Layout fürs neue
Panel). `src/ui/store.ts` unverändert (nur temporär für die Verifikation
angefasst, wieder zurückgesetzt).

## Demo-Deckgröße gedeckelt (v0.1.4, 2026-07-09)

Auftrag: `src/cards/starter-set.ts` ist von 27 auf 109 Karten gewachsen (104
Nicht-Terrain + 5 Terrains). Die bisherige `buildDemoDeck`-Logik ("1× jede
Nicht-Terrain-Karte + 4× jedes Terrain") skalierte linear mit dem
Kartenpool und hätte bei 109 Karten ein ~124-Karten-Demo-Deck pro Spieler
ergeben (104 + 5×4) — für die Hotseat-Demo unhandlich (sehr lange Bibliothek,
zähe Partien, kaum überschaubare Hand-Zusammensetzung über die Zeit).

### Änderung

`src/ui/deck.ts#buildDemoDeck`:

- **Terrains**: unverändert fest 4× jedes der 5 Terrains (20 Karten) —
  garantiert weiterhin jede Manafarbe verfügbar, der Terrain-Teil des Pools
  ist klein genug, dass „alle" weiterhin sinnvoll bleibt.
- **Nicht-Terrain**: statt „alle" jetzt eine zufällige Stichprobe ohne
  Zurücklegen (Fisher-Yates-Teilshuffle über `Math.random()`) von bis zu
  `NON_TERRAIN_TARGET = 40` verschiedenen Karten (je 1×). Ist der Pool
  kleiner als das Ziel (z. B. ein künftig wieder kleinerer Test-Pool oder
  der historische 27-Karten-Stand), wird einfach der komplette
  Nicht-Terrain-Pool genommen — für den alten 27-Karten-Stand ergibt das
  exakt wieder 22 + 20 = 42 Karten, also bitgenau das bisherige Verhalten.
  Bei den aktuellen 109 Karten ergibt sich `min(104, 40) + 20 = 60` Karten
  pro Spieler.
- Bewusst **nicht geseedet/deterministisch**: Die Deck-Zusammenstellung
  läuft vor `engine.createGame` (das seinen eigenen, deterministischen
  Seed für Mischen/Ziehen bekommt, `store.ts#initGame`); eine bei jedem
  „Neues Spiel" leicht andere Kartenauswahl ist für die Demo eher
  wünschenswert (mehr Abwechslung) als ein Problem.
- Reine Deck-Daten-Logik, kein neues Deckbau-UI (weiterhin bewusst
  außerhalb des Scopes, s. „Was noch fehlt"/Nächste-Schritte-Punkt 6). Keine
  Änderungen an `src/engine/`, `src/cards/`, `src/model/`.

### Verifikation

**Wichtige Einschränkung wie in v0.1.3:** In dieser Session standen keine
Browser-/Computer-Use-Werkzeuge zur Verfügung — verifiziert wurde
ausschließlich über Vitest/jsdom, mit drei temporären Testdateien (nicht
Teil des Repos, nach Verifikation wieder gelöscht, gleiches Muster wie in
früheren Runden):

1. **Pool-Kennzahlen** (`starterSet` direkt inspiziert): 109 Nicht-Token-
   Karten, davon 5 Terrains / 104 Nicht-Terrain (Rarity-Verteilung common
   59 / uncommon 37 / rare 13 über den gesamten Nicht-Token-Pool — nur zur
   Einordnung, nicht Grundlage der gewählten Sampling-Strategie).
2. **`buildDemoDeck`-Eigenschaften** (20 Wiederholungen gegen den echten
   `starterSet`): Gesamtgröße stets zwischen 40 und 65 (tatsächlich exakt
   60), alle 5 Terrains stets mit genau 4 Kopien vorhanden, alle
   Nicht-Terrain-Einträge mit genau 1 Kopie, keine unbekannten IDs, keine
   Duplikate.
3. **`engine.createGame` mit dem gesampelten Deck**: läuft für beide
   Spieler ohne Engine-Fehler durch, `gameStarted`-Event wird ausgelöst,
   Bibliothek befüllt.
4. **Echter Boot-/Klick-Smoke-Test** (`store.initGame` + `render()` +
   echte `button.dispatchEvent(new Event("click"))`-Aufrufe auf den
   „Priorität passen"-Button, jsdom-Environment über
   `@vitest-environment jsdom`, kein manuelles globalThis-Patching): Demo-
   Partie mit dem echten 109-Karten-`starterSet` startet fehlerfrei
   (`console.error` wurde während des gesamten Laufs abgefangen und blieb
   leer), Bibliothek+Hand pro Spieler liegt im erwarteten 40–65-Fenster,
   `.status-bar` erscheint im DOM, mehrere echte Prioritäts-Klicks
   (Upkeep → Draw → Main1) laufen ohne `lastError` durch. Kein
   Browser-Test im eigentlichen Sinn, aber die gleiche End-to-End-Kette
   (Store → Render → echter DOM-Klick) wie in den v0.1.1/v0.1.2-Golden-
   Path-Verifikationen.
5. `npm run build` (`tsc --noEmit`) sauber. `npx vite build` (Produktions-
   Build) erfolgreich (98 kB JS / 6 kB CSS, unverändert klein). `npx
   vitest run` (voller Testlauf, inkl. paralleler Engine-Arbeit im
   Arbeitsverzeichnis) 83/83 grün — keine Regression durch diese Änderung
   (`deck.ts` wird von keinem bestehenden Engine-Test berührt).

**Ergebnis:** Einzige Code-Änderung ist `src/ui/deck.ts` (komplett
überarbeitete `buildDemoDeck`-Implementierung + Kommentar); keine weiteren
Dateien mussten angepasst werden (`store.ts`/`main.ts` rufen `buildDemoDeck`
weiterhin mit derselben Signatur `(pool: CardPool) => Record<string, number>`
auf). Neue Ziel-Deckgröße: **60 Karten pro Spieler** bei den aktuellen 109
Pool-Karten (40 verschiedene Nicht-Terrain-Karten × 1 + 5 Terrains × 4),
mit automatischem Rückfall auf den vollen Pool (und damit unverändertem
Verhalten), sobald der Nicht-Terrain-Pool kleiner als 40 Karten ist.

## Permanente UI-Regressionstests + Deckbau-UI (v0.1.5, 2026-07-09)

Zwei Aufträge, die direkt aus „Nächste Schritte" (v0.1.4-Stand) Punkt 1 und
Punkt 6 stammen.

### Auftrag 1: Permanente UI-Regressionstests

Bisher gab es laut diesem Dokument nur Wegwerf-jsdom-Tests, die nach jeder
Verifikationsrunde wieder gelöscht wurden (s. v0.1.1-v0.1.4-Abschnitte oben,
jeweils „temporär ... nach Verifikation gelöscht"). Das ändert sich jetzt:

- `jsdom` ist per `npm install -D jsdom` als Dev-Dependency ergänzt
  (`package.json`).
- **Gewählter Weg für jsdom-Environment**: Datei-lokal per
  `// @vitest-environment jsdom`-Kommentar (statt global in `vite.config.ts`).
  Begründung: `vite.config.ts` hatte bisher gar keinen `test`-Block; ein
  globales `environment: "jsdom"` würde unnötig auch die 83 Engine-Tests
  unter jsdom laufen lassen (die reine Objektberechnung sind, kein DOM
  brauchen und mit `node`-Environment schneller/einfacher bleiben). Der
  Datei-lokale Kommentar ist außerdem exakt das Muster, das in v0.1.4 schon
  für die (damals noch temporären) Boot-/Klick-Smoke-Tests benutzt wurde —
  konsistent mit dem bisherigen Vorgehen dieses Projekts.
- **Neu, dauerhaft im Repo**: `src/ui/__tests__/golden-path.test.ts`, zwei
  Tests:
  1. „Deckbau-Validierung: 'Weiter' ist erst nach einem gültigen Deck
     aktiv" — prüft, dass der Confirm-Button bei leerem Deck gesperrt ist
     und nach „Zufällig füllen" aktiv wird.
  2. „Kompletter Flow: Deckbau (beide Spieler) → Spielstart → Priorität
     passen → Terrain spielen" — bildet den vom Auftrag verlangten Golden
     Path nach: `render(root)` **ab echtem App-Start** (kein direkter
     `store.initGame()`-Aufruf mehr möglich/nötig, s. Auftrag 2 unten),
     danach ausschließlich echte `element.dispatchEvent(new
     Event("click"))`-Aufrufe auf das von `render()` erzeugte DOM: Deckbau
     Spieler 1 („Zufällig füllen" → „Weiter") → Deckbau Spieler 2
     („Gleiches Deck übernehmen" → „Spiel starten") → Upkeep → Draw → Main1
     ausschließlich über den „Priorität passen"-Button → ein Terrain aus der
     Hand spielen (Battlefield wächst um genau 1, per echtem
     `store.getState()`-Read verifiziert, nicht geraten). Ein
     `console.error`-Spy läuft über den kompletten Testkörper und wird am
     Ende auf „nie aufgerufen" geprüft (deckt sowohl uncaught Exceptions in
     Event-Handlern ab, die laut DOM-Spec über die globale
     Fehlerberichterstattung statt direkt an `dispatchEvent()` zurückgegeben
     werden, als auch tatsächliche `console.error`-Aufrufe im Code).
  - **Determinismus**: `Math.random()` wird per `vi.spyOn` auf einen festen
    seedbaren Ersatz-Generator umgebogen. Grund: `buildDemoDeck` (Fisher-
    Yates-Sampling) und der von `store.ts#initGame` per `Math.random()`
    gezogene Engine-Seed sind beide nicht-deterministisch; ohne festen Seed
    wäre der „Terrain aus der Hand spielen"-Schritt mit einer kleinen, aber
    nicht-null Wahrscheinlichkeit flaky (Starthand ohne Terrain bei einer
    Terrain-Dichte von 20/60 im Demo-Deck). Die Engine-eigene RNG
    (`src/engine/rng.ts`) ist davon unberührt, da sie einen eigenen
    geseedeten `mulberry32`-State im `GameState` führt, unabhängig von
    `Math.random()`.
  - **Test-Isolation**: `vi.resetModules()` + dynamischer `await
    import("../store")`/`import("../render")` pro Test, da `store.ts`
    modul-scoped Singleton-Zustand hält (Engine-Instanz, `GameState`,
    `AppPhase`, Decklisten) — ohne Reset würden sich die beiden Tests
    gegenseitig beeinflussen.
- `npm test` läuft weiterhin über `vitest run` (kein neues Skript nötig) und
  deckt jetzt Engine- UND UI-Tests in einem Lauf ab: **85/85 grün** (83
  Engine-Tests unverändert + 2 neue dauerhafte UI-Tests).
- Zusätzlich (nur zur Verifikation dieses Schritts selbst, wieder gelöscht,
  gleiches Muster wie in v0.1.1-v0.1.4): zwei temporäre Testdateien, die (a)
  einen kompletten Mehrzug-Durchlauf inkl. „Neues Spiel" → zurück zum
  Deckbau-Screen mit erhaltener Vorbefüllung, und (b) die Deckbau-Filter
  (Typ-Select, Namenssuche inkl. Fokuserhalt beim Tippen) sowie die +/-
  Zähler sauber durchgeklickt haben — beide grün, danach entfernt.

### Auftrag 2: Deckbau-UI

`src/ui/deck.ts#buildDemoDeck` baute bisher bei jedem App-Start automatisch
ein zufälliges ~60-Karten-Demo-Deck für beide Spieler — kein echter
Deckbau. Jetzt gibt es einen echten Deckbau-Screen VOR dem Spielstart:

- **Neuer App-Ebene-Zustand** `AppPhase` (`src/ui/types.ts`): `{ kind:
  "deckbuild"; player }` vs. `{ kind: "playing" }` — analog zu `UiMode`, aber
  eine Ebene höher (existiert schon, bevor überhaupt ein `GameState`
  existiert) und explizit **kein Teil der Engine/des GameState**. Verwaltet
  in `store.ts` über dieselbe `notify()`/`subscribe()`-Mechanik wie der Rest
  des Stores (`getAppPhase`, `setDecklist`, `confirmDeck`,
  `copyDeckFromPlayer1`, `backToDeckbuilder`).
- **Sequenzieller Flow**: App startet in `{ kind: "deckbuild", player:
  "player1" }`. `confirmDeck("player1")` schaltet auf `player: "player2"`
  um; `confirmDeck("player2")` schaltet auf `{ kind: "playing" }` und ruft
  intern `initGame(decklists.player1, decklists.player2)` auf.
  `copyDeckFromPlayer1()` ist die im Auftrag verlangte Abkürzung („Gleiches
  Deck wie Spieler 1 übernehmen") für Spieler 2.
- **`store.ts#initGame`** hat jetzt die Signatur
  `initGame(deckP1, deckP2, seed?)` statt intern immer `buildDemoDeck` für
  beide Spieler zu rufen — `buildDemoDeck` (`deck.ts`) bleibt unverändert
  bestehen (nicht gelöscht, wie im Auftrag gefordert) und wird jetzt vom
  Deckbau-Screen selbst als „Zufällig füllen"-Button aufgerufen.
- **Deckbau-Screen** (`src/ui/components/deckBuilder.ts#deckBuilderScreen`):
  zeigt alle 109 Karten aus `getPool()` (sortiert nach Name) mit +/-
  Kopienwahl pro Zeile, laufender Gesamtzahl/Validierungsstatus, einer
  Namenssuche und Typ-/Farb-Filtern.
  - **Validierung** (`src/ui/deckValidation.ts#validateDecklist`, neue reine
    UI-Logik-Datei — die Engine validiert Decklisten nicht selbst,
    `engine.createGame` nimmt schlicht `Record<string, number>` entgegen):
    setzt exakt den Kommentar bei `Decklist` (`src/model/cards.ts`) um —
    min. 40 Karten gesamt, max. 4 Kopien pro Nicht-Terrain-id (Terrains
    unbegrenzt). Der „Weiter"/„Spiel starten"-Button ist per `disabled`
    gesperrt, solange das nicht erfüllt ist; der Status wird als Klartext
    angezeigt (z. B. „38/40 Karten - noch 2 Karte(n) nötig" bzw. „N Karten -
    zu viele Kopien: ...").
  - **Filter/Suche laufen bewusst NICHT über den globalen Store**: Ein
    `notify()`/kompletter Rerender bei jedem Tastendruck im Suchfeld würde
    das komplette DOM (inkl. Eingabefeld) neu aufbauen und den
    Eingabefokus verlieren (bekannte Konsequenz des „kompletter Rebuild pro
    Zustandsänderung"-Rendermusters dieses Projekts). Stattdessen hält
    `deckBuilder.ts` den Filterzustand modul-scoped (`searchText`,
    `typeFilter`, `colorFilter`) und blendet Zeilen direkt per
    `row.style.display` ein/aus, sowohl beim initialen Aufbau als auch live
    beim Tippen/Auswählen — kein Store-Involvement, keine Spiellogik, reine
    Darstellungsfilterung. Ein `+`/`-`-Klick geht weiterhin über den Store
    (`onChange` → `setDecklist` → `notify` → Voll-Rerender), da die
    Gesamtzahl/Validierung an mehreren Stellen im DOM synchron bleiben muss;
    der Filterzustand überlebt das dank der Modul-Scope-Variablen trotzdem.
  - `dominantColorKey` (neu in `cardInfo.ts`) liefert den Manafarbe-Schlüssel
    einer `CardDefinition` (inkl. Terrains, die kein `cost`-Feld haben →
    immer „farblos") für den Farbfilter.
- **`main.ts`** ruft `initGame()` nicht mehr automatisch auf, sondern nur
  noch `subscribe(() => render(root))` + einmal `render(root)` (zeigt initial
  den Deckbau-Screen).
- **„Neues Spiel"** im laufenden Spiel (`render.ts#statusBar`) ruft jetzt
  `backToDeckbuilder()` statt `location.reload()` — führt zurück zum
  Deckbau-Screen (Spieler 1 zuerst); die zuletzt gesammelten Decklisten
  bleiben in `store.ts` erhalten und dienen beim erneuten Öffnen als
  Vorbefüllung (kein Hard-Requirement laut Auftrag, aber wie gewünscht für
  bessere Wiederhol-Test-UX umgesetzt).
- `style.css` um einen eigenen Abschnitt für den Deckbau-Screen ergänzt
  (`.deckbuilder-*`, `.deck-pool-*`), keine neue CSS-Systematik.

**Kein echter Modell-/Architektur-Konflikt aufgetreten.** Einzige
Design-Entscheidung, die über die im Auftrag vorgegebenen Leitplanken
hinausging: wo genau der `AppPhase`-Zustand lebt (eigene Datei vs. `store.ts`
mitverwaltet) — hier für „mitverwaltet in `store.ts`" entschieden, da
`store.ts` bereits die einzige Stelle mit `notify()`/`subscribe()` ist und
ein zweiter, unabhängiger Beobachter-Mechanismus nur für die App-Phase reine
zusätzliche Komplexität ohne Nutzen gewesen wäre.

### Verifikation (v0.1.5)

- `npm run build` (`tsc --noEmit` über Engine + UI) — sauber.
- `npm test` (`vitest run`) — **85/85 grün** (83 Engine-Tests unverändert +
  2 neue, dauerhafte UI-Tests aus Auftrag 1).
- `npm run build:ui` (Vite-Produktionsbuild) — erfolgreich (102 kB JS / 7,5 kB
  CSS, leicht gewachsen durch den neuen Deckbau-Screen, weiterhin klein).
- Manueller Durchlauf des kompletten neuen Flows: über den in Auftrag 1
  beschriebenen dauerhaften Test (`golden-path.test.ts`, echte Klicks) sowie
  zwei zusätzliche, temporäre Vertiefungstests (s.o.: Mehrzug-Durchlauf +
  „Neues Spiel" + erneuter Deckbau; Filter/Suche/+/--Zähler) — kein
  Browser-Test im eigentlichen Sinn (keine Browser-/Computer-Use-Werkzeuge in
  dieser Session verfügbar), aber dieselbe echte Store→Render→DOM-Klick-Kette
  wie in allen bisherigen Golden-Path-Verifikationen (v0.1.1-v0.1.4).

**Ergebnis:** Neue Dateien: `src/ui/components/deckBuilder.ts`,
`src/ui/deckValidation.ts`, `src/ui/__tests__/golden-path.test.ts`. Geänderte
Dateien: `src/ui/store.ts` (`AppPhase`-Verwaltung, `initGame`-Signatur),
`src/ui/types.ts` (`AppPhase`), `src/ui/render.ts` (Verzweigung
Deckbau/Spielbrett, „Neues Spiel"-Button), `src/ui/main.ts` (kein
automatischer `initGame`-Aufruf mehr), `src/ui/cardInfo.ts`
(`dominantColorKey`), `src/ui/deck.ts` (nur Kommentar aktualisiert, Logik
unverändert), `src/ui/style.css` (Deckbau-Layout), `package.json`/
`package-lock.json` (`jsdom`-Dev-Dependency).

## Mulligan-UI, Modal-Effekte, X-Kosten auf aktivierten Fähigkeiten (v0.1.6, 2026-07-09)

Reaktion auf drei v0.3-Engine-Erweiterungen (`docs/rules-engine.md` v0.3.1,
Entscheidungen 9.10-9.13; `docs/engine-status.md` v0.3.1, 118 Tests), die
bisher keine UI hatten. Drei Teilaufträge, alle umgesetzt:

### 1. Echte Mulligan-UI (Entscheidung 9.11)

`createGame` endet seit v0.3 standardmäßig (`skipMulligans: false`) mit einer
offenen `pendingDecision = { kind: "mulligan", player, timesMulliganed }` VOR
dem ersten Priority-Fenster (Paris-Variante, streng sequentiell: erst der
Startspieler komplett, dann der andere). `src/ui/store.ts#initGame` hatte das
bisher mit einem `skipMulligans: true`-Notfix umgangen (v0.3-Kommentar des
engine-engineers, „kein Ersatz für echte Mulligan-UI").

- **`render.ts#actionBanner`**: neuer, eigener Zweig für
  `pendingDecision.kind === "mulligan"` — analog zum bestehenden
  `orderBlockers`-Zweig (eigener Banner-Typ statt des generischen
  `chooseTriggerTargets`-Fallbacks, weil die Antwort kein anklickbares
  Board-Ziel ist, sondern eine reine Ja/Nein-Entscheidung).
- **Neue Komponente `mulliganPanel`** (`components/actionPanels.ts`): zeigt
  Spieler + aktuelle/neue Handgröße, zwei Buttons „Starthand behalten" /
  „Mulligan (neu mischen)" — dispatchen direkt `resolveDecision` mit
  `{ kind: "mulligan", takeMulligan: false/true }`. Kein eigener `UiMode`
  nötig (anders als `orderBlockers`), da die Decision keinen lokal
  sortierbaren Zwischenzustand braucht.
- **`store.ts#initGame`**: `skipMulligans: true` entfernt — die Engine läuft
  jetzt mit ihrem dokumentierten Default (`false`), die Mulligan-Phase ist
  seither ein regulärer Teil jeder Partie im UI.

### 2. Modal-Effekte „wähle eines —" (Entscheidung 9.13)

Zwei Fälle laut Regelwerk, beide umgesetzt:

- **Atomarer Fall (Spells/aktivierte Fähigkeiten):** `chosenMode` ist Teil
  der `castSpell`/`activateAbility`-Aktion (keine PendingDecision). Neuer
  `UiMode`-Zweig `modeSelect` (`types.ts`) + Komponente `modeSelectPanel`
  (`actionPanels.ts`, ein Button pro Modus mit `mode.text` als Label,
  Fallback „Modus N"). Reihenfolge Modus → X → Ziele (rules-engine.md 4):
  Nach der Moduswahl entscheidet `render.ts`, ob als nächstes X (falls die
  Karte/Fähigkeit X-Kosten hat), Zielwahl (falls der gewählte Modus
  `targets` hat) oder der direkte `dispatch` folgt. Für Handkarten neuer
  Button „Modus wählen" in `handCard.ts` (`offerModeFlow`/`onStartModeFlow`,
  hat Vorrang vor dem bestehenden „X wählen & spielen"-Button, da Modus vor
  X kommt); für Battlefield-Fähigkeiten ein neuer Zweig in
  `render.ts#battlefieldZone` — wichtig: `getLegalActions` liefert für
  modale Fähigkeiten laut Vertrag EINEN Kandidaten OHNE `chosenMode`, der
  bisherige „ein Zielslot → direkt dispatchen"-Automatismus hätte diesen
  Kandidaten fälschlich ohne Moduswahl abgeschickt (Engine hätte abgelehnt)
  — jetzt wird ein solcher Kandidat erkannt (`ability.modes` am
  referenzierten `abilityIndex`) und startet stattdessen `modeSelect`.
- **Trigger-Fall:** neuer `pendingDecision`-Zweig `chooseMode` in
  `render.ts#actionBanner` (analog zum bestehenden `chooseTriggerTargets`-
  Pfad) + neue Komponente `chooseModeDecisionPanel` — zeigt nur die laut
  `selectableModes` aktuell wählbaren Modi, dispatcht `resolveDecision` mit
  `{ kind: "chooseMode", modeIndex }`. Folgt danach `chooseTriggerTargets`
  (Ketten-Decision bei mehrdeutigen Zielen des gewählten Modus, v0.3.1-
  Nachtrag zu 9.13), greift dafür unverändert der bestehende generische
  `chooseTriggerTargets`-Pfad (Board-Klicks über `getLegalActions`-
  Kandidaten) — keine weitere Anpassung nötig, da `chosenMode` dort
  serverseitig in der Decision persistiert wird.

Getestet mit `core.void-covenant` (modaler `spell`, 3 Modi, einer mit
Zielslot `unitOrPlayer`) über einen echten Klick-Durchlauf (Deckbau → Modus
wählen → Ziel wählen → Stack zeigt `chosenMode`/`chosenTargets` → Resolution
fügt 2 Schaden zu), s. `src/ui/__tests__/modal-effects.test.ts`. Der
Trigger-Fall (`core.current-diplomat`, modaler ETB-Trigger) ist über den
Code-Pfad umgesetzt (analog zum bewährten `chooseTriggerTargets`-Muster,
gegen `docs/rules-engine.md`/`docs/engine-status.md` durchgeprüft), aber
mangels Zeitbudget in dieser Session **nicht** durch einen eigenen
dauerhaften Klick-Test abgedeckt — auf dem "Nächste Schritte"-Radar unten.

### 3. X-Kosten auf aktivierten Fähigkeiten (Entscheidung 9.12)

Der bisherige `xInput`/`xTarget`-UI-Mechanismus deckte laut
`docs/frontend-status.md` (v0.1.5) nur `castSpell` ab. Verallgemeinert:

- **`types.ts`**: neuer Typ `CastSource` (`{ kind: "spell"; cardInstanceId }
  | { kind: "ability"; sourceInstanceId; abilityIndex }`), `UiMode`-Zweige
  `xInput`/`xTarget` tragen jetzt `source: CastSource` statt eines festen
  `cardInstanceId` (plus optionales `chosenMode` für die Modal-Verzahnung
  aus Teil 2). `xTarget.chosenX` ist jetzt optional (reine Modal-Zielwahl
  ohne X nutzt denselben `UiMode`).
- **`actionUtil.ts`**: neue `CastSource`-Helfer (`sourceName`, `sourceModes`,
  `sourceHasXCost`, `sourceTargets`, `buildCastAction`,
  `activateAbilityCandidatesFor`) — lesen Kartendefinition/Fähigkeit rein
  aus (kein Regel-Code) und bauen die finale `castSpell`-/
  `activateAbility`-Aktion, statt dass `render.ts` das für beide Fälle
  separat verdrahten müsste.
- **`render.ts#battlefieldZone`**: neue Erkennung für X-Kosten-Fähigkeiten
  über die Kartendefinition selbst (`manaCost.x` am `ActivatedAbility`,
  `!isManaAbility`) — `getLegalActions` liefert dafür laut Vertrag GAR
  KEINEN Kandidaten (`activateAbilityCandidatesFor` würde sie also nie
  finden), exakt das gleiche bewusst grobe Muster wie die bestehende
  X-Kosten-Klickbarkeit für Handkarten-Spells (Fehlklick zeigt den
  `error`-String der Engine, keine clientseitige Legalitätsprüfung).

Getestet mit `core.cinderwrack-engine` (Relikt, `{X}, tap: X Schaden`) über
einen echten Klick-Durchlauf (Deckbau → Relikt casten → Fähigkeit antippen →
X eingeben → Ziel wählen → Stack zeigt `chosenX`/`chosenTargets`), s.
`src/ui/__tests__/x-cost-ability.test.ts`. X wurde dort bewusst auf `0`
gesetzt (das Casten des Relikts selbst verbraucht bereits alle vier
vorbereiteten Terrains) — der Test prüft damit den UI-Mechanismus
(Eingabe → Zielwahl → Stack-Objekt), nicht die Schadenshöhe.

### Kleine Nebenänderung: `data-player`-Attribut auf `playerPanel`

`components/playerPanel.ts` trägt jetzt `data-player="<playerId>"` (analog
zum bestehenden `data-card-id` in `deckBuilder.ts`) — rein für Testbarkeit
(Spieler-Panel im DOM gezielt anwählen), keine Verhaltensänderung.

### Neue Testinfrastruktur: `src/ui/__tests__/testHelpers.ts`

Gemeinsame Klick-/Deck-/Autopilot-Helfer für alle drei neuen Testdateien
(kein Produktionscode): `click`/`queryOne`/`queryAll`/`buttonWithText`/
`makeSeededRandom` (aus `golden-path.test.ts` extrahiert, dort jetzt auch
genutzt), `buildDeckByClicking` (Deck über echte +/- Klicks im Deckbau-
Screen statt `setDecklist`), `keepAllMulligans`, sowie
`autoAdvanceToReadyMain1` — ein generischer Klick-„Autopilot" für
kreaturlose Testvorbereitung (Priority passen, Terrain im eigenen Main1
spielen, „keine Angreifer"/„keine Blocker", Cleanup-Abwurf), der so lange
Züge simuliert, bis ein Spieler eine gewünschte Terrainzahl kontrolliert
UND die zu testende Karte in der Hand hat — nötig, weil Terrains nur 1×/Zug
spielbar sind und die Testkarten mehrere Mana brauchen (3 bzw. 4 Terrains,
also mehrere eigene Züge). Bewusst **kein** neuer Debug-Setter in
`store.ts` (Produktionscode) — anders als die temporären Verifikationen aus
v0.1.2/v0.1.3 laufen auch Deckbau und Mana-Vorbereitung über echte,
öffentliche Store-Funktionen/Klicks (`setDecklist`/`+`-Buttons,
Terrain-Tap-Fähigkeit), nicht über interne Engine-Zonen-Helfer.

**Wichtige Testfallen (für künftige Sessions/Testdateien in diesem
Repo dokumentiert):** `render()` baut das DOM bei jeder Store-Änderung
komplett neu auf (kein Diffing) — ein einmal gequerter Button-Knoten wird
nach dem ersten Klick „stale" (sein `onclick`-Closure kapselt den Zustand
VOR diesem Klick). Mehrere Klicks auf denselben, außerhalb einer Schleife
gecachten Button-Verweis kumulieren sich NICHT (z. B. mehrfaches Anklicken
eines „+"-Buttons oder eines Discard-Toggles) — jeder Klick muss den Button
frisch selektieren. Zwei Bugs dieser Art traten beim Schreiben von
`autoAdvanceToReadyMain1`/`buildDeckByClicking` auf und sind behoben.

### Modellkonflikt-Check

**Kein echter Modell-/Architektur-Konflikt gefunden.** Der einzige
Interpretationsspielraum (welche `UiMode`-Struktur für den kombinierten
Modus-/X-/Ziel-Flow) war eine reine UI-Design-Entscheidung (generischer
`CastSource`-Typ statt getrennter Modi pro Fall) und keine Rückfrage an
Game-Architect/Engine-Engineer wert.

### Verifikation (v0.1.6)

- `npm run build` (`tsc --noEmit` über Engine + UI) — sauber.
- `npm test` (`vitest run`) — **121/121 grün** (118 Bestandstests
  unverändert + 3 neue, dauerhafte UI-Tests: `mulligan.test.ts`,
  `modal-effects.test.ts`, `x-cost-ability.test.ts`).
- `npm run build:ui` (Vite-Produktionsbuild) — erfolgreich (113,6 kB JS /
  7,6 kB CSS, leicht gewachsen durch die neuen Panels).
- Kein Browser-/Computer-Use-Werkzeug in dieser Session verfügbar (wie
  bereits in v0.1.3-v0.1.5 dokumentiert) — Verifikation lief über echte
  `element.dispatchEvent(new Event("click"))`-Aufrufe auf das von `render()`
  erzeugte DOM in `jsdom` (Vitest), dieselbe Kette wie in allen bisherigen
  Golden-Path-Verifikationen.

**Ergebnis:** Neue Dateien: `src/ui/__tests__/testHelpers.ts`,
`src/ui/__tests__/mulligan.test.ts`, `src/ui/__tests__/modal-effects.test.ts`,
`src/ui/__tests__/x-cost-ability.test.ts`. Geänderte Dateien:
`src/ui/types.ts` (`CastSource`, `modeSelect`-Zweig, verallgemeinertes
`xInput`/`xTarget`), `src/ui/actionUtil.ts` (`CastSource`-Helfer),
`src/ui/render.ts` (neue `pendingDecision`-/`UiMode`-Zweige, neue
Battlefield-Erkennung), `src/ui/store.ts` (`skipMulligans` entfernt),
`src/ui/components/actionPanels.ts` (`mulliganPanel`, `modeSelectPanel`,
`chooseModeDecisionPanel`), `src/ui/components/handCard.ts`
(`offerModeFlow`/`onStartModeFlow`), `src/ui/components/playerPanel.ts`
(`data-player`), `src/ui/style.css` (`.mode-select-*`),
`src/ui/__tests__/golden-path.test.ts` (Mulligan-Entscheidung durchgeklickt
statt implizit übersprungen, nutzt jetzt `testHelpers.ts`).

## „Spieler 2 = KI"-Anbindung (v0.1.7, 2026-07-09)

Grundlage: `docs/ai-status.md` (KI-Gegner v1) — `src/ai/simpleBot.ts` stellt
`chooseAction(engine, pool, state, player): PlayerAction` bereit, eine reine
Entscheidungsfunktion, die **ausschließlich** über `getLegalActions`/
`applyAction` mit der Engine spricht (kein Zugriff auf Engine-Internals) und
**immer** eine legale Aktion liefert. Auftrag: diese Funktion an die UI
anbinden, damit man tatsächlich gegen den Bot spielen kann, ohne
Spiellogik im Frontend zu duplizieren.

### 1. Umschalter im Deckbau-Flow

`src/ui/components/deckBuilder.ts#deckBuilderScreen`: Nur auf dem
**player2-Screen** (analog zur bestehenden `offerCopyFromPlayer1`-Abkürzung)
erscheint jetzt ein Block `.deckbuilder-ai-toggle`:

- Eine Checkbox „Spieler 2 von KI steuern lassen" — setzt/löscht nur das Flag
  (`store.ts#setBotControlled`), **erzwingt nichts**: Spieler 2 kann danach
  trotzdem ganz normal weiter sein eigenes Deck bauen und über den regulären
  „Spiel starten"-Button fortfahren (das Flag entscheidet erst beim
  eigentlichen Spielverlauf, wer automatisch zieht).
- Ist die Checkbox aktiv, erscheint zusätzlich ein Button „Zufälliges
  KI-Deck + weiter" (`.deckbuilder-ai-quickstart-btn`) — die im Auftrag
  gewünschte Abkürzung: füllt die Deckliste zufällig (`buildDemoDeck`, wie
  „Zufällig füllen"), markiert Spieler 2 als bot-gesteuert und bestätigt
  **sofort** (`confirmDeck`), überspringt damit effektiv den gesamten
  manuellen Deckbau-Screen für Spieler 2 und startet direkt die Partie.

**Entscheidung (wie im Auftrag vorgeschlagen):** Der Bot spielt mit JEDEM
Deck, ein eigener „KI-Decktyp" ist nicht nötig — `buildDemoDeck` reicht als
Ausgangspunkt völlig aus, exakt der bereits bestehende „Zufällig
füllen"-Mechanismus (`deck.ts`, unverändert). Der reguläre Deckbau-Screen für
Spieler 2 bleibt vollständig erreichbar/nutzbar (kein Sonderpfad, der ihn
versteckt) — wer möchte, kann dem Bot auch ein manuell zusammengestelltes
Deck geben.

### 2. App-Zustand: `store.ts` statt `types.ts`

`botControlledPlayers: Set<PlayerId>` + `isBotControlled(player)`/
`setBotControlled(player, controlled)` leben **ausschließlich in `store.ts`**,
kein neuer Typ in `types.ts`. Begründung (analog zur v0.1.5-Entscheidung, wo
`AppPhase` ebenfalls „in store.ts mitverwaltet" statt in einem zweiten
Beobachter-Mechanismus lebt): `store.ts` ist bereits die einzige Stelle mit
`notify()`/`subscribe()`, ein Set-Zustand ohne eigene Renderlogik braucht
keinen eigenen Typ-Namen im `UiMode`-Modul. Bewusst als `Set<PlayerId>`
(generisch, nicht `player2: boolean`) — der Deckbau-Screen bietet die
Umschaltung zwar nur für Spieler 2 an (Auftrag: „Spieler 2 = KI"), aber
`store.ts` selbst kennt keine solche Einschränkung: ein künftiger
„Bot-vs-Bot-Zuschauermodus" (beide Spieler bot-gesteuert) würde ohne weitere
Store-Änderung funktionieren, der automatische Zug-Loop (s. u.) prüft pro
Einzelaktion neu, wer gerade dran ist.

### 3. Automatisches Spielen

Kern ist eine Erweiterung von `store.ts`, dokumentiert direkt im Code:

- **`actingPlayer(state)`** (neu, intern): bestimmt, welcher Spieler gerade
  tatsächlich handeln muss — Priority, eine an ihn gerichtete
  `PendingDecision`, oder eine fällige Combat-/Cleanup-Turn-Based-Action ohne
  Priority-Fenster. Das ist **exakt dieselbe Fallunterscheidung**, die
  `render.ts#autoEnterForcedModes` für die UI-Modus-Wahl trifft und die
  `src/ai/__tests__/simpleBot.test.ts#actingPlayer` für die
  Bot-vs-Bot-Simulation verwendet (siehe `docs/ai-status.md`,
  „Nutzungsvertrag") — bewusst dieselbe Logik dreimal unabhängig
  implementiert (Engine-Test, jetzt Store) statt geteilten Code zu
  extrahieren, weil sie in drei unterschiedlichen Kontexten (Testinfrastruktur
  für Bot-vs-Bot, UI-Modus-Wahl, Store-Automatisierung) lebt und jede Stelle
  weiterhin nur die öffentliche `RulesEngine`/`GameState`-Schnittstelle
  liest — keine Extraktion in einen gemeinsamen internen Helfer, um keine
  neue Kopplung zwischen `src/ai/__tests__` (Testcode) und `src/ui`
  einzuführen.
- **`triggerBotLoop()`** wird nach jeder erfolgreichen menschlichen Aktion
  (Ende von `dispatch()`) UND nach `initGame()` aufgerufen (falls der nach
  dem Münzwurf feststehende erste Akteur bereits bot-gesteuert ist, z. B.
  weil Spieler 2 zufällig Startspieler ist und zuerst über seinen eigenen
  Mulligan entscheiden muss).
- **`scheduleBotStepIfNeeded()`/`runBotStep()`**: Ist der aktuelle Akteur
  bot-gesteuert, wird EIN `chooseAction`+`applyAction`-Schritt über
  `setTimeout(..., botMoveDelayMs)` geplant, ausgeführt, per `notify()`
  sofort gerendert, und — falls danach WEITERHIN ein bot-gesteuerter Spieler
  dran ist — der nächste Schritt geplant. Das läuft, bis wieder ein Mensch an
  der Reihe ist oder das Spiel endet (`actingPlayer` liefert dann
  `undefined`, weil `state.winner !== undefined`).
- **Sichtbarkeit während des Bot-Zugs** (Auftrag Punkt 3, „man kann dem Bot
  beim Spielen zusehen"): `notify()` läuft nach JEDEM einzelnen Bot-Schritt,
  nicht erst am Ende einer automatischen Kette — kombiniert mit
  `botMoveDelayMs` (Default 250 ms, `setBotMoveDelayMs()` überschreibbar)
  ergibt das im Browser eine sichtbare Zug-für-Zug-Animation statt eines
  einzigen synchronen Sprungs ans Zugende. Ohne die Verzögerung würde ein
  kompletter Bot-Zug (oft mehrere Aktionen: Terrain, Zauber, Angriff, mehrere
  `passPriority`) innerhalb eines einzigen JS-Ticks laufen und im Browser nie
  zwischengerendert werden (der DOM-Rebuild selbst ist synchron, s.
  `render.ts`-Kommentar „kein Diffing").
- **Endlosschleifen-Schutz**: `botCycleGuard`/`MAX_BOT_ACTIONS_PER_CYCLE`
  (1000) — wird bei jedem `triggerBotLoop()`-Aufruf zurückgesetzt und pro
  automatischem Schritt hochgezählt; ist das Limit erreicht, bricht die
  Automatik mit einer `console.error`-Meldung ab statt endlos weiterzulaufen
  (analog zum 2000er-Sicherheitslimit der Bot-vs-Bot-Tests aus
  `docs/ai-status.md`, hier niedriger angesetzt, weil pro Zyklus nur EIN
  Spieler automatisch zieht). Zusätzliches Sicherheitsnetz: Liefert
  `applyAction` für eine Bot-Aktion einen `error` zurück (laut
  `docs/ai-status.md` „sollte nie passieren"), bricht `runBotStep` sofort ab
  (kein stiller Wiederholungsversuch derselben Aktion) und meldet den Fehler
  über `console.error` UND `lastError`.
- **`isBotThinking()`**: `true`, solange ein automatischer Schritt
  geplant/aussteht ist — für Tests gedacht (Polling per `vi.waitFor`, s. u.),
  um zu warten, bis eine automatische Bot-Kette abgeschlossen ist, bevor der
  nächste menschliche Klick simuliert wird.
- **`stopBotLoop()`** wird in `backToDeckbuilder()` (Neues Spiel) und am
  Anfang von `initGame()` aufgerufen — verhindert, dass ein noch geplanter
  Timer aus der VORHERIGEN Partie gegen den neuen, gerade gesetzten
  `GameState` feuert.

### 4. Visuelle Kennzeichnung

`components/playerPanel.ts#PlayerPanelOptions` hat eine neue optionale
`botControlled`-Eigenschaft; ist sie gesetzt, erscheint ein Badge „KI"
(`.badge-bot`, neue Farbe an `--mana-wild` angelehnt) direkt neben dem
Spielernamen — derselbe Badge-Mechanismus wie „am Zug"/„Priority"/„muss
entscheiden"/„verloren". `render.ts#playerArea` reicht dafür
`isBotControlled(playerId)` durch.

### 5. Persistenz über „Neues Spiel"

**Entscheidung:** Der `botControlledPlayers`-Zustand bleibt über
„Neues Spiel" (`backToDeckbuilder`) hinweg erhalten — exakt dasselbe Muster
wie die gesammelten Decklisten (`decklists`, s. v0.1.5-Abschnitt oben). Wer
einmal „Spieler 2 von KI steuern lassen" aktiviert hat, will das für die
nächste Testpartie i. d. R. nicht jedes Mal neu anklicken. Nur ein
kompletter Modul-Neuladen (App-Neustart) setzt es zurück (Startwert: leeres
`Set`, standardmäßig **niemand** bot-gesteuert — der reine
Zwei-Menschen-Flow ist damit unverändert der Default und durch diese
Änderung in keiner Weise beeinträchtigt).

### Modellkonflikt-Check

**Kein echter Modell-/Architektur-Konflikt gefunden.** `chooseAction` verhält
sich exakt wie in `docs/ai-status.md` beschrieben (reiner
`getLegalActions`/`applyAction`-Konsument, liefert immer eine legale Aktion)
— die Store-Integration musste an keiner Stelle von diesem Vertrag abweichen
oder ihn umgehen.

### Verifikation (v0.1.7)

- `npm run build` (`tsc --noEmit` über Engine + KI + UI) — sauber.
- `npm test` (`vitest run`) — **136/136 grün** (135 Bestandstests unverändert
  + 1 neuer, dauerhafter UI-Test `src/ui/__tests__/vs-bot.test.ts`).
- `npm run build:ui` (Vite-Produktionsbuild) — erfolgreich (122,7 kB JS /
  8,0 kB CSS, leicht gewachsen durch den neuen Umschalter/Badge).
- **`src/ui/__tests__/vs-bot.test.ts`** (neu, dauerhaft im Repo): kompletter
  End-to-End-Durchlauf ab echtem App-Start, ausschließlich über echte
  `element.dispatchEvent(new Event("click"/"change"))`-Aufrufe für Spieler 1
  (nie ein direkter `store.dispatch()`-Aufruf für die geprüfte Interaktion,
  gleiches Muster wie alle bisherigen Golden-Path-Tests) — Deckbau Spieler 1
  (normal) → Deckbau-Screen Spieler 2: KI-Checkbox aktivieren →
  „Zufälliges KI-Deck + weiter" (Deckbau-Screen für Spieler 2 wird komplett
  übersprungen) → Partie läuft: Spieler 1 klickt sich selbst durch (Mulligan
  behalten, Terrain legen falls möglich, nie angreifen/blocken — bewusst
  simpel, der Fokus des Tests ist die Bot-Anbindung, nicht Spieler-1-Taktik),
  während `store.ts` für Spieler 2 automatisch weiterspielt (inkl. dessen
  eigener Mulligan-/Combat-/Cleanup-Entscheidungen) bis Spielende oder einem
  großzügigen Iterations-Limit (600). Der Test wartet nach jedem eigenen
  Klick über `isBotThinking()` (Polling per `vi.waitFor`) darauf, dass eine
  angestoßene automatische Bot-Kette abgeschlossen ist, bevor er den nächsten
  Klick auslöst; `store.ts#setBotMoveDelayMs(0)` beschleunigt das für den
  Test (die Bot-Züge laufen trotzdem über echte `setTimeout()`-Ticks, kein
  Store-Bypass). Zusätzlich geprüft: das „KI"-Badge erscheint im
  Spieler-2-Panel und NICHT im Spieler-1-Panel, sowie durchgehend
  `console.error` niemals aufgerufen (deckt sowohl den in `runBotStep`
  dokumentierten „sollte nie passieren"-Fehlerzweig als auch uncaught
  Exceptions ab). Mit dem für alle Golden-Path-Tests verwendeten festen Seed
  (`20260709`) läuft die simulierte Partie tatsächlich bis zu einem echten
  Sieger durch (`player2`/Bot gewinnt nach 14 Zügen, 150
  Spieler-1-Interaktionsschritten, per manueller Zwischenprüfung beim Bauen
  bestätigt — deterministisch dank festem `Math.random()`-Seed, s.
  Test-Kommentar) — der Test akzeptiert aber laut Auftrag ausdrücklich auch
  „Iterations-Limit erreicht" als gültigen Ausgang, um nicht von der exakten
  Bot-Heuristik/Kartenverteilung abhängig zu sein.
- Kein Browser-/Computer-Use-Werkzeug in dieser Session verfügbar (wie
  bereits in v0.1.3–v0.1.6 dokumentiert) — Verifikation lief über echte
  DOM-Events in `jsdom` (Vitest), dieselbe Kette wie in allen bisherigen
  Golden-Path-Verifikationen.

**Ergebnis:** Neue Datei: `src/ui/__tests__/vs-bot.test.ts`. Geänderte
Dateien: `src/ui/store.ts` (KI-Zustand + automatischer Zug-Loop, s. o.),
`src/ui/components/deckBuilder.ts` (KI-Umschalter + Quickstart-Button,
`DeckBuilderOptions` erweitert), `src/ui/components/playerPanel.ts`
(`botControlled`-Option + „KI"-Badge), `src/ui/render.ts` (neue
`deckBuilderScreen`-/`playerPanel`-Callbacks), `src/ui/style.css`
(`.deckbuilder-ai-*`, `.badge-bot`), `src/ui/__tests__/testHelpers.ts`
(neuer `setChecked`-Helfer). `src/ui/types.ts` **unverändert** (s.
Entscheidung Punkt 2 oben). Keine Änderungen an `src/engine/*`,
`src/model/*`, `src/ai/*`, `src/cards/*`.

## `concede`-Button + localStorage-Deck-Persistenz (v0.1.8, 2026-07-10)

Zwei unabhängige Komfort-Features, beide ohne jedes Engine-/Model-Zutun
umsetzbar — die Engine kannte `concede` bereits vollständig
(`src/model/game-state.ts#PlayerAction`, `src/engine/actions.ts`,
`src/engine/legal-actions.ts`), es fehlte nur die UI-Verdrahtung; die
Deck-Persistenz ist reine Client-Bequemlichkeit (`localStorage`), die Engine
ist an Decklisten ohnehin nur über `Record<string, number>` (`createGame`)
interessiert.

### 1. `concede`-Button

- **`src/ui/components/playerPanel.ts`**: neue optionale
  `PlayerPanelOptions.onConcede`-Eigenschaft. Ist sie gesetzt, erscheint ein
  „Aufgeben"-Button (`.btn-concede`, `data-testid="concede-<player>"` für
  Tests) rechtsbündig in der Kopfzeile des jeweiligen Spieler-Panels, neben
  den bestehenden Badges. `playerPanel` selbst kennt keine Regel dafür, WANN
  der Button erscheinen darf — das entscheidet ausschließlich der Aufrufer
  (`render.ts`, s.u.); die Komponente rendert einfach „Button vorhanden, wenn
  Callback vorhanden". Der Klick-Handler ruft `event.stopPropagation()` auf,
  da das gesamte Spieler-Panel bereits ein eigenes `onClick` haben kann
  (Ziel-Auswahl, z. B. „Feuerstoß" auf den Gegner) — ein Klick auf „Aufgeben"
  darf das nicht mit auslösen.
- **`src/ui/render.ts#playerArea`**: baut den `onConcede`-Callback nur, wenn
  `canConcede` zutrifft — `state.winner === undefined && !hasLost(playerId) &&
  !isBotControlled(playerId)`. Damit ist der Button (a) nach Spielende für
  BEIDE Spieler weg (kein Sinn mehr, „aufzugeben"), (b) für einen Spieler weg,
  der schon verloren hat, und (c) für einen bot-gesteuerten Spieler NIE
  sichtbar — genau wie im Auftrag verlangt („der Bot gibt nicht auf"). Der
  Handler selbst zeigt zuerst `window.confirm(...)` und dispatcht nur bei
  Bestätigung `{ kind: "concede", player }` — eine einfache, dem Auftrag
  entsprechende Bestätigung ohne eigenes Modal-System (kein neuer UI-Zustand,
  kein zweiter Klick-Zustand im Store nötig).
- **`src/ui/style.css`**: eine neue Klasse `.btn-concede` (nur Layout —
  `margin-left: auto` innerhalb der Flex-Kopfzeile, etwas kompakter als der
  Standard-`.btn`), keine neue Farbe/Systematik (nutzt weiterhin
  `.btn.btn-cancel` für die rote Warnfarbe, analog zum bestehenden „Neues
  Spiel"-Button in der Statuszeile).

**Warum `window.confirm` statt eines zweiten Klicks/eigenen Panels:** Der
Auftrag erlaubte ausdrücklich beides („zweiter Klick 'wirklich aufgeben?'
oder ein `window.confirm`-Dialog — halte es simpel"). `window.confirm` kam
mit weniger neuem Code aus (kein zusätzlicher `UiMode`/Store-Zustand für
„Bestätigung ausstehend", kein Re-Render-Sonderfall) und ist für eine
seltene, bewusst störende Sicherheitsabfrage (blockierender Browser-Dialog)
eher passend als für einen Alltags-Flow — genau der in `docs/frontend-
status.md` „Nächste Schritte" Punkt 7 (jetzt weiter unten) skizzierte Zweck
von Bestätigungsdialogen für irreversible Aktionen.

### 2. Deck-Persistenz über `localStorage`

- **`src/ui/store.ts`**: zwei neue private Helfer,
  `loadDeckFromLocalStorage(player)`/`saveDeckToLocalStorage(player, list)`,
  unter den Schlüsseln `"deckbuilder1.lastDeck.player1"`/
  `"deckbuilder1.lastDeck.player2"`. Beide sind defensiv per `try/catch`
  gekapselt (Auftrag: „darf die App nicht zum Absturz bringen") — ein
  fehlschlagender Zugriff (privater Browser-Modus, deaktiviertes
  `localStorage`, volle Quota) führt beim Laden einfach zu `undefined`
  (→ leeres Deck als Vorbefüllung, wie schon vor v0.1.8) und beim Speichern
  zu einem stillschweigend übersprungenen Schreibversuch — kein geworfener
  Fehler verlässt jemals eine der beiden Funktionen.
  - Der Start-Wert von `decklists` (bisher immer `{ player1: {}, player2: {}
    }`) lädt jetzt zusätzlich per `loadDeckFromLocalStorage(...) ?? {}` pro
    Spieler — das ist der geforderte „Fallback, falls der In-Memory-Zustand
    leer ist": Innerhalb einer laufenden Session (z. B. nach „Neues Spiel")
    bleibt weiterhin ausschließlich der In-Memory-Zustand maßgeblich (der ist
    ja nie leer, sobald einmal etwas gebaut wurde); nur ein frisches
    Modul/ein echter Seiten-Reload liest überhaupt aus `localStorage`.
  - **`confirmDeck(player)`** speichert jetzt zusätzlich per
    `saveDeckToLocalStorage`, BEVOR es die `AppPhase` weiterschaltet bzw.
    `initGame` aufruft — für `player1` immer, für `player2` nur, wenn er zu
    diesem Zeitpunkt NICHT bot-gesteuert ist (`!isBotControlled(player)`).
    Letzteres setzt exakt den Auftragswunsch „gerne auch Spieler 2 falls kein
    Bot" um: Ein per „Zufälliges KI-Deck + weiter" erzeugtes Bot-Deck ist
    keine vom Nutzer bewusst gebaute Deckliste, die es sich lohnt für die
    nächste Session vorzubefüllen (und würde ohne diese Ausnahme jedes Mal
    das zuvor gespeicherte, echte Spieler-2-Deck überschreiben).
- **Kein Eingriff in `deckBuilder.ts`/`render.ts#renderDeckBuilder` nötig**:
  Die bestehende Vorbefüllungs-Logik (`getDecklist(player)` als
  `decklist`-Prop) griff schon vorher direkt auf `store.ts`s `decklists`
  zu — da jetzt bereits der Start-Wert von `decklists` (s.o.) aus
  `localStorage` kommt, „sieht" der Deckbau-Screen die Vorbefüllung
  automatisch, ohne selbst etwas von `localStorage` zu wissen. Das entspricht
  dem Rollen-Vertrag dieses Projekts (Komponenten kennen nur Props/Callbacks,
  keine Persistenz-Details).
- Bewusst **keine Migration/Versionierung** des gespeicherten JSON-Formats
  (`Record<string, number>`, identisch zur In-Memory-Form) — bei einem
  künftigen inkompatiblen Format-Wechsel würde `JSON.parse` weiterhin
  erfolgreich parsen, aber ggf. unbekannte Karten-IDs enthalten;
  `deckValidation.ts` prüft ohnehin nur Kopienzahlen, keine ID-Existenz, und
  der Deckbau-Screen zeigt nur Zeilen für tatsächlich im `CardPool`
  vorhandene IDs (`Object.values(pool)`) — unbekannte IDs in einer
  gespeicherten Deckliste wären daher harmlos (zählen einfach nicht mit,
  fallen aber nicht auf; kein Blocker für dieses simple Hobby-Projekt-Maß).

### Modellkonflikt-Check

**Kein Modell-/Architektur-Konflikt gefunden.** `concede` verhielt sich exakt
wie in `src/model/game-state.ts` dokumentiert (immer legal für den
betroffenen Spieler, führt sofort zu `playerLost`/`gameEnded`); die
`localStorage`-Persistenz berührt weder Engine noch Model in irgendeiner
Form.

### Verifikation (v0.1.8)

- `npm run build` (`tsc --noEmit` über Engine + KI + UI) — sauber.
- `npm test` (`vitest run`) — **141/141 grün** (136 Bestandstests unverändert
  + 5 neue, dauerhafte UI-Tests: 2× `concede.test.ts`, 3×
  `deck-persistence.test.ts`).
- `npm run build:ui` (Vite-Produktionsbuild) — erfolgreich (123,6 kB JS /
  8,1 kB CSS, minimal gewachsen).
- **`src/ui/__tests__/concede.test.ts`** (neu, dauerhaft): ab echtem
  App-Start (Deckbau beider Spieler per echten Klicks, Hotseat ohne KI,
  Mulligans behalten), dann zwei Fälle über echte
  `element.dispatchEvent(new Event("click"))`-Aufrufe: (a) Klick auf
  `[data-testid="concede-player1"]` + `window.confirm` (gemockt auf `true`)
  → `state.players.player1.hasLost === true`, `state.winner === "player2"`,
  `.game-over-banner` zeigt „Sieger: player2", das Log enthält die
  `playerLost`/`gameEnded`-Zusammenfassungen, und BEIDE Aufgeben-Buttons sind
  danach aus dem DOM verschwunden; (b) `window.confirm` gemockt auf `false`
  → State bleibt (Referenzgleichheit geprüft) exakt derselbe, kein
  `dispatch()` hat stattgefunden, der Button ist weiterhin da. Durchgehend
  `console.error`-Spy nie aufgerufen.
- **`src/ui/__tests__/deck-persistence.test.ts`** (neu, dauerhaft): drei
  Fälle. (1) Haupttest: Deckbau beider Spieler per echten Klicks (Spieler 1
  „Zufällig füllen" + bestätigen, Spieler 2 „Gleiches Deck übernehmen" +
  bestätigen) → beide `localStorage`-Keys enthalten das erwartete JSON →
  **simulierter Reload** über `vi.resetModules()` + frischer `await
  import("../store")`/`import("../render")` (store.ts hält seinen Zustand
  modul-scoped, ein frischer Modul-Import entspricht also „Store startet bei
  null" — `window.localStorage` selbst hängt an `window`, nicht am Modul, und
  überlebt den Reset unverändert, genau wie ein echter Tab-Reload im
  Browser) → `getDecklist(player1)`/`getDecklist(player2)` entsprechen exakt
  den vorher gespeicherten Decklisten, UND der frisch gerenderte
  Deckbau-Screen zeigt schon vor jedem Klick „Deck gültig" mit aktiviertem
  Bestätigen-Button (eine Stichproben-Kartenzeile im DOM zeigt die korrekte
  Kopienzahl). (2) Ein per KI-Quickstart erzeugtes Spieler-2-Deck wird NICHT
  gespeichert (`localStorage.getItem(...player2) === null`). (3) Ein
  `localStorage.setItem`-Aufruf, der eine `DOMException` wirft (simuliert
  privaten Browser-Modus/volle Quota), lässt den Deckbau-Flow unverändert
  weiterlaufen (`confirmDeck` wirft nicht, `AppPhase` schaltet trotzdem
  korrekt weiter) — deckt genau die im Auftrag verlangte Fehlerresistenz ab.
- Wie in v0.1.3–v0.1.7 dokumentiert kein Browser-/Computer-Use-Werkzeug in
  dieser Session verfügbar — Verifikation lief über echte DOM-Events in
  `jsdom` (Vitest), dieselbe Kette wie in allen bisherigen
  Golden-Path-Verifikationen. `jsdom` stellt `localStorage` bereits ohne
  Zusatz-Setup bereit (wie vom Auftrag vermutet) — kein neues Dev-Setup
  nötig.

**Ergebnis:** Neue Dateien: `src/ui/__tests__/concede.test.ts`,
`src/ui/__tests__/deck-persistence.test.ts`. Geänderte Dateien:
`src/ui/components/playerPanel.ts` (`onConcede`-Option + Button),
`src/ui/render.ts` (`playerArea`: `canConcede`-Berechnung + Callback),
`src/ui/style.css` (`.btn-concede`), `src/ui/store.ts`
(`loadDeckFromLocalStorage`/`saveDeckToLocalStorage`, `decklists`-Startwert,
`confirmDeck`-Speicherung). Keine Änderungen an `src/engine/*`,
`src/model/*`, `src/ai/*`, `src/cards/*`.

## Bot-Schwierigkeitsstufen-Anbindung (v0.1.9, 2026-07-10)

Auftrag: der ai-opponent-engineer (fable-5) hat drei echte Bot-Stärken
(`easy`/`medium`/`hard`) hinter `chooseActionForDifficulty(engine, pool,
state, player, difficulty)` fertiggestellt (`src/ai/difficulty.ts`,
re-exportiert über `src/ai/index.ts`, siehe `docs/ai-status.md` Abschnitt 9)
— dieser Schritt bindet das rein UI-seitig an (Punkt 10 der „Nächste
Schritte"-Liste, s.u.), ohne `src/ai/*` selbst anzufassen.

### 1. Store: `botDifficulty`-Zustand + Umstellung von `runBotStep`

`src/ui/store.ts`:

- Neuer Zustand `botDifficulty: Record<PlayerId, BotDifficulty>`, Default
  `DEFAULT_BOT_DIFFICULTY` ("medium") für beide Spieler — exakt analog zum
  bestehenden `botControlledPlayers`/`isBotControlled`/`setBotControlled`-
  Muster: `getBotDifficulty(player)`/`setBotDifficulty(player, difficulty)`
  als öffentliche Getter/Setter, **dieselbe Persistenz-Semantik** (bleibt
  über „Neues Spiel" (`backToDeckbuilder`) hinweg erhalten, nur ein frischer
  App-Start/Modul-Neuladen setzt zurück auf den Default — kein Sonderfall
  extra gebaut, ergibt sich automatisch daraus, dass `botDifficulty` wie
  `botControlledPlayers` ein modul-scoped `let` ist, das `backToDeckbuilder`
  nicht zurücksetzt).
- Der Wert ist bewusst **unabhängig** von `isBotControlled(player)` gesetzt/
  gespeichert (auch wenn ein Spieler gerade nicht bot-gesteuert ist, behält
  er "seine" zuletzt gewählte Stufe) — genutzt wird er aber ausschließlich,
  wenn der Spieler tatsächlich bot-gesteuert ist (s. `runBotStep`).
- `runBotStep`: `chooseAction(engine, pool, state, actor)` durch
  `chooseActionForDifficulty(engine, pool, state, actor, botDifficulty[actor])`
  ersetzt (Import jetzt aus `../ai` statt `../ai/simpleBot`). Der Rest von
  `runBotStep` (Fehlerbehandlung, `notify()`, Loop-Fortsetzung) ist
  unverändert — die Funktion bleibt laut Vertrag „liefert IMMER eine legale
  Aktion" für alle drei Stufen (docs/ai-status.md Abschnitt 9.1).

### 2. Deckbau-Screen: Schwierigkeits-Dropdown

`src/ui/components/deckBuilder.ts`:

- Neue `DeckBuilderOptions`-Felder `botDifficulty: BotDifficulty` +
  `onChangeBotDifficulty: (next: BotDifficulty) => void` (reine Props/
  Callback-Durchreichung, wie der Rest der Komponente — keine eigene Logik).
- Ein `<select>` (`.deckbuilder-ai-difficulty-select`) mit den drei Optionen
  aus `BOT_DIFFICULTIES` (Werte) / `BOT_DIFFICULTY_LABELS` (deutsche
  Anzeigenamen „Leicht"/„Mittel"/„Schwer") wird **nur gerendert, wenn
  `opts.botControlled` true ist** — neben dem bestehenden „Zufälliges
  KI-Deck + weiter"-Button innerhalb des schon vorhandenen
  `.deckbuilder-ai-toggle`-Containers (kein neuer Container, gleiche visuelle
  Gruppe wie der KI-Umschalter selbst). Ein echtes `change`-Event ruft
  `onChangeBotDifficulty` mit dem neuen Wert auf.
- `src/ui/render.ts#renderDeckBuilder` reicht `getBotDifficulty(player)`/
  `(next) => setBotDifficulty(player, next)` durch — identisches Muster zu
  `botControlled`/`onToggleBotControl` direkt darüber.

### 3. Optional: Anzeige der aktiven Stufe im Spielbrett-Header

Umgesetzt, da es sich organisch einfügte: `playerPanel.ts` bekommt eine neue
optionale `botDifficultyLabel`-Option, die — **nur wenn `botControlled` true
ist** — ein zweites, eigenes Badge (`.badge-bot-difficulty`, z.B. „Schwer")
neben dem bestehenden `.badge-bot`-„KI"-Badge zeigt. Bewusst ein **separates**
Badge statt den Text von `.badge-bot` selbst zu erweitern (z.B. zu
„KI (Schwer)") — der bestehende `vs-bot.test.ts`-Vertrag prüft
`.badge-bot`-Text exakt auf `"KI"`; ein zweites Badge hält diesen Test
unverändert stabil, ohne ihn anfassen zu müssen. `render.ts#playerArea` setzt
`botDifficultyLabel` nur, wenn `isBotControlled(playerId)` zutrifft
(`BOT_DIFFICULTY_LABELS[getBotDifficulty(playerId)]`), sonst `undefined` (kein
Badge).

### Modellkonflikt-Check

**Kein Modell-/Architektur-Konflikt gefunden.** `chooseActionForDifficulty`
hat exakt denselben Nutzungsvertrag wie das bisherige `chooseAction` (nur für
den tatsächlich handelnden Spieler aufrufen, liefert immer eine legale
Aktion) — `store.ts` musste dafür nichts an seiner bestehenden
`actingPlayer`/`triggerBotLoop`/`scheduleBotStepIfNeeded`-Logik ändern, nur
den einen Aufruf in `runBotStep` austauschen. Keine Änderungen an
`src/engine/*`, `src/model/*`, `src/ai/*`, `src/cards/*`.

### Verifikation (v0.1.9)

- `npm run build` (`tsc --noEmit` über Engine + KI + UI) — sauber.
- `npm test` (`vitest run`) — **149/149 grün** (148 Bestandstests unverändert
  + 1 neuer, dauerhafter UI-Test:
  `src/ui/__tests__/vs-bot-difficulty.test.ts`).
- `npm run build:ui` (Vite-Produktionsbuild) — erfolgreich (143,9 kB JS /
  8,4 kB CSS, minimal gewachsen gegenüber v0.1.8).
- **`src/ui/__tests__/vs-bot-difficulty.test.ts`** (neu, dauerhaft, gleiches
  Muster wie `vs-bot.test.ts`, aber mit einem anderen `Math.random`-Seed
  (20260710) für eine unabhängig reproduzierbare Partie): ab echtem
  App-Start, Deckbau Spieler 1 normal, Deckbau Spieler 2 → KI-Umschalter
  aktivieren → Schwierigkeits-Dropdown ist davor NICHT im DOM, danach schon
  → echter Klick/Change stellt „hard" ein (`getBotDifficulty("player2")`
  bestätigt das direkt am Store, nicht nur am DOM-Zustand) →
  „Zufälliges KI-Deck + weiter" → komplette Partie über echte Klicks
  (Spieler 1) + automatisches Bot-Spiel (Spieler 2, Stufe „hard") bis
  Spielende bzw. ein großzügiges 600-Iterationen-Limit, `console.error`-Spy
  bleibt während der gesamten Partie unaufgerufen (der eigentliche Beleg,
  dass `chooseActionForDifficulty` mit der im UI gewählten Stufe läuft, statt
  weiterhin unbemerkt die Default-Heuristik zu verwenden) — plus eine
  Prüfung, dass `getBotDifficulty("player2")` über die ganze Partie „hard"
  bleibt, und dass die Board-Header-Badges (`.badge-bot`/
  `.badge-bot-difficulty`) korrekt „KI"/„Schwer" für Spieler 2 und **kein**
  Differenz-Badge für Spieler 1 zeigen.
- `npx vite build` (Produktions-Build außerhalb von `npm run build:ui`
  ebenfalls geprüft) sowie ein kurzer Boot-Smoke-Test des Vite-Dev-Servers
  (`npx vite`, `curl` gegen `http://localhost:.../`, HTTP 200, Server danach
  wieder beendet) — bestätigt nur, dass der Dev-Server mit den Änderungen
  fehlerfrei startet und ausliefert, ist aber **keine** Bedienung der
  eigentlichen Dropdown-Interaktion im Browser.
  - **Einschränkung:** In dieser Session standen keine
    Browser-/Computer-Use-Werkzeuge zur Verfügung, um das Dropdown tatsächlich
    per echtem Mausklick in einem laufenden Browser zu bedienen (wie schon in
    mehreren früheren Runden, v0.1.3 ff., dokumentiert). Die eigentliche
    end-to-end-Verifikation der Klick-/Change-Interaktion lief daher
    ausschließlich über echte `element.dispatchEvent(new
    Event("click"/"change"))`-Aufrufe auf das von `render()` erzeugte DOM in
    `jsdom` (s.o.) — dieselbe Kette wie in allen bisherigen
    Golden-Path-Verifikationen dieses Projekts, aber kein tatsächlicher
    Browser-Test. Bitte bei Gelegenheit mit echten Browser-Werkzeugen
    nachverifizieren.

**Ergebnis:** Neue Datei: `src/ui/__tests__/vs-bot-difficulty.test.ts`.
Geänderte Dateien: `src/ui/store.ts` (`botDifficulty`-Zustand,
`getBotDifficulty`/`setBotDifficulty`, `runBotStep` nutzt
`chooseActionForDifficulty`), `src/ui/components/deckBuilder.ts`
(Schwierigkeits-Dropdown), `src/ui/render.ts` (`renderDeckBuilder`/
`playerArea` reichen die neuen Store-Funktionen/Optionen durch),
`src/ui/components/playerPanel.ts` (`botDifficultyLabel`-Option + neues
Badge), `src/ui/style.css` (`.badge-bot-difficulty`,
`.deckbuilder-ai-difficulty-label`/`-select`), `src/ui/__tests__/testHelpers.ts`
(neuer Helfer `selectValue`, analog zu `setChecked`). Keine Änderungen an
`src/engine/*`, `src/model/*`, `src/ai/*`, `src/cards/*`.

## Klassisches Kartenrahmen-Layout ohne Artwork (v0.1.10, 2026-07-10)

Auftrag: Karten wirkten bisher überall (Hand, Battlefield/Graveyard/Stack,
Kartenpool im Deckbau) nur wie schlichte Text-Kästchen (Name/Typ/Kosten, ein
farbiger Top-Border je Manafarbe). Ziel: ein klassisches, MTG-artiges
Kartenrahmen-Layout aus purem CSS/HTML — Kopfzeile (Name/Kosten), ein
„Bildbereich" als reine Farbfläche/Farbverlauf je Manafarbe (bewusst OHNE
Artwork/Bild-Assets, ausdrücklicher Nutzerwunsch), Typzeile, Regeltext-Box,
P/T-Kasten unten rechts bei Einheiten, vollständiger statt nur Top-Border-
Rahmen nach Manafarbe — überall dort, wo Karten dargestellt werden, bei
weiterhin kompakter Größe (voller Board-/Hand-/Pool-Umfang bleibt benutzbar)
und unveränderter Interaktionslogik (Klicks zum Spielen/Anvisieren/
Deckbau-Zähler).

### Umsetzung

- **`src/ui/cardInfo.ts`**: neue reine Anzeige-Funktion `manaCostPips(cost)`
  liefert eine Liste von „Pips" (ein Kreissymbol pro Kostenanteil — EIN Pip
  je Farbe mit Zahl statt einem Pip pro Mana-Punkt, damit teure Karten die
  Kartengröße nicht sprengen — plus ein Pip für generische Kosten und eins
  für X). `formatManaCost` bleibt unverändert bestehen und wird als
  vollständiger Text-`title`-Tooltip auf dem Kosten-Element weiterverwendet
  (Barrierefreiheit/Hover-Info), keine Duplikation der Formatierungslogik.
- **`src/ui/components/manaCost.ts`** (neu): `manaCostBadge(cost)` baut aus
  `manaCostPips` die eigentlichen DOM-Elemente (`.card-frame-cost` +
  `.mana-pip.mana-<farbe>`-Spans) — ein gemeinsamer Baustein, damit
  `handCard.ts`/`cardTile.ts`/`deckBuilder.ts` dieselbe DOM-Bau-Logik nicht
  dreifach duplizieren.
- **`src/ui/components/handCard.ts`**: baut jetzt `.card-frame-header` (Name
  + `manaCostBadge`) und `.card-frame-frame` (`.card-frame-art`,
  `.card-frame-type`, optional `.card-frame-text-box` mit Regeltext, optional
  `.card-frame-pt` bei Einheiten) statt der bisherigen Reihe einzelner
  `.hand-card-*`-Zeilen. Die Aktions-Buttons ("Spielen"/"Terrain legen"/...)
  bleiben unverändert außerhalb des Kartenrahmens, direkt darunter.
  `handCardDiscardToggle` (Cleanup-Abwurf) folgt demselben Muster (ohne
  Regeltext/P/T, da hier nur Name/Kosten + Auswahl-Hinweis nötig sind).
- **`src/ui/components/cardTile.ts`**: gleiches Muster für
  Battlefield/Graveyard/Stack — die bisherigen einzelnen Status-Zeilen
  (Counter, getappt, Beschwörungskrankheit, angelegt, Combat-Rolle, Keywords)
  werden jetzt als kleine Badges in einer neuen `.card-frame-status`-Zeile
  innerhalb der Regeltext-Box gesammelt, statt als separate Textzeilen unter
  der Karte. Tapped-Optik (`opacity`/`rotate` über `.card-tile.tapped`)
  unverändert.
- **`src/ui/components/deckBuilder.ts`**: `poolRow` baut jetzt statt einer
  reinen Tabellenzeile ebenfalls einen vollständigen Kartenrahmen (Name +
  Kosten-Pips, Farbfläche, Typzeile, Regeltext falls vorhanden, P/T bei
  Einheiten) — die +/- Zähler-Steuerung sitzt darunter an der Stelle der
  Aktions-Buttons einer Handkarte. `.deckbuilder-pool` wechselt entsprechend
  von einer vertikalen Zeilenliste (mit Zebra-Streifen) zu einem
  Flex-Wrap-Kartenraster (weiterhin `max-height` + `overflow-y: auto`, jetzt
  65vh statt 60vh, da die Karten mehr vertikalen Platz brauchen als reine
  Zeilen) — bleibt bei 113 Pool-Karten benutzbar/scrollbar.
- **`src/ui/style.css`**: komplett neuer, gemeinsamer Kartenrahmen-Block
  (`.hand-card, .card-tile, .deck-pool-row { ... }` teilen sich Rahmen/
  Kopfzeile/Bildfläche/Typzeile/Regeltext/P/T-Kasten-Regeln über die neuen
  `.card-frame-*`-Klassen), drei unterschiedliche, aber weiterhin kompakte
  Breiten (Handkarte 158px, Battlefield-Kachel 118px, Pool-Karte 132px —
  gegenüber vorher 150px/110px kaum größer). Rahmenfarbe pro Manafarbe jetzt
  als **vollständiger** 2px-Rahmen (`border-color`) statt nur 4px-Top-Border.
  Neue `--mana-*-dark`-CSS-Variablen (ein dunklerer Ton je Manafarbe) speisen
  den Verlaufshintergrund von `.card-frame-art` (`linear-gradient` von der
  Manafarbe zu ihrem dunklen Gegenstück) — das ist die geforderte
  „Bildfläche ohne Bild". `.card-frame-text` begrenzt Regeltext per
  `-webkit-line-clamp` auf 5 Zeilen (verhindert, dass einzelne sehr lange
  Kartentexte die Kompaktheit sprengen). `.card-frame-pt` ist absolut im
  jeweiligen `.card-frame-frame` positioniert (unten rechts, `pointer-events:
  none` — überlagert die Regeltext-Box wie bei klassischen Kartenspielen,
  blockiert aber keine Klicks). Reines dunkles Theme (`color-scheme: dark`,
  unverändert seit v0.1) — das Projekt hat weiterhin **kein** eigenes
  Hell-Theme/keinen Umschalter (`prefers-color-scheme`/`data-theme` kommt an
  keiner Stelle vor), daher wurden alle neuen Farbwerte ausschließlich gegen
  das bestehende dunkle Theme abgestimmt; ein künftiges Hell-Theme müsste die
  `--mana-*`/`--mana-*-dark`-Variablen und `--panel`/`--panel-2`-Kontraste
  gesondert prüfen.

### Bewusst unveränderte Klassen (Testkompatibilität)

Alle von den permanenten UI-Tests per `querySelector` gesuchten Klassen
blieben unverändert erhalten (nur die interne Struktur *innerhalb* der
Karten wurde neu gebaut): `.hand-card`, `.hand-card-name` (jetzt zusätzlich
`card-frame-name`), `.card-tile` (inkl. `.targetable`/`.selected`/
`.hinted`/`.tapped`), `.card-tile-name` (zusätzlich `card-frame-name`),
`.deck-pool-row` (inkl. `data-card-id`), `.deck-pool-row-count`,
`.deck-pool-plus-btn`/`.deck-pool-minus-btn`, `.discard-toggle`/`.selected`,
`.btn-pass`/`.btn.btn-play`/`.btn.btn-cancel`. Keine bestehende Testdatei
musste angepasst werden.

### Verifikation

- `npm run build` (`tsc --noEmit`) sauber.
- `npm test` (`vitest run`) weiterhin **151/151 grün**, inkl. aller
  DOM-basierten Golden-Path-/Combat-/Deckbau-/Bot-Tests, die reale
  `render()`-Ausgaben inspizieren — keine Regression durch die reine
  CSS/HTML-Umstrukturierung.
- `npm run build:ui` (Vite-Produktionsbuild) erfolgreich (10.34 kB CSS
  gzip 2.43 kB, 145.19 kB JS gzip 34.19 kB — CSS-Zuwachs durch das neue
  Kartenrahmen-Layout, JS nahezu unverändert, da nur Markup-Struktur, keine
  neue Logik).
- Boot-Smoke-Test: `npm run dev` gestartet, `GET /` liefert `200`, kein
  Absturz/keine Vite-Fehlermeldung im Log.
- **Einschränkung:** Kein echter Browser-/Screenshot-Test in dieser Session
  (nur Datei-/Shell-Werkzeuge verfügbar, wie schon in mehreren früheren
  Runden dokumentiert) — die visuelle Abnahme (Farbverläufe, Lesbarkeit,
  Kompaktheit bei vollem Board/vollem Pool) erfolgt laut Auftrag durch den
  Nutzer selbst per Live-Browser-Screenshot.

**Ergebnis:** Neue Dateien: `src/ui/components/manaCost.ts`. Geänderte
Dateien: `src/ui/cardInfo.ts` (`manaCostPips`), `src/ui/components/handCard.ts`,
`src/ui/components/cardTile.ts`, `src/ui/components/deckBuilder.ts`,
`src/ui/style.css`. Keine Änderungen an `src/engine/*`, `src/model/*`,
`src/ai/*`, `src/cards/*`, `src/ui/store.ts`, `src/ui/render.ts` (die
Render-Verdrahtung/Interaktionslogik war nicht Gegenstand dieses Auftrags und
blieb unangetastet).

## KI-Umschalter-Sichtbarkeit + geführtes Tutorial-Probespiel (v0.1.11, 2026-07-18)

Zwei Aufträge rund ums Einstiegserlebnis für neue Spieler.

### Teil 1: KI-Schalter sichtbarer machen

Auftrag: Der Nutzer fand die Checkbox „Spieler 2 von KI steuern lassen" auf
dem Deckbau-Screen von Spieler 2 nicht — sie war ein unauffälliges
Text-Checkbox-Label ganz oben, während „Spiel starten" erst nach der (mit dem
Kartenpool auf 300 Karten mitgewachsenen) scrollbaren Pool-Liste ganz unten
folgte.

- **`src/ui/components/deckBuilder.ts`**: Der bestehende `.deckbuilder-ai-toggle`-
  Container bekommt eine eigene Überschrift („Gegen den Computer spielen") und
  einen Hinweistext, bevor die Checkbox folgt (Struktur unverändert, nur zwei
  zusätzliche `div`s davor).
- **`src/ui/style.css`**: `.deckbuilder-ai-toggle` bekommt mehr Innenabstand
  und einen dickeren (2px statt 1px) Rahmen, die Checkbox-Beschriftung ist
  jetzt größer/fett (`font-size: 15px; font-weight: 600` statt 13px normal);
  neue `.deckbuilder-ai-toggle-heading`/`-hint`-Klassen für die beiden neuen
  Textzeilen.
- **`.deckbuilder-footer`** (der Container um den „Spiel starten"/„Weiter"-
  Button) ist jetzt `position: sticky; bottom: 0` (mit passendem Hintergrund/
  oberer Trennlinie) statt einfach nur „nach dem Pool-Container im DOM" — der
  Button bleibt damit beim Scrollen durch den 300-Karten-Pool immer sichtbar,
  ohne dass eine größere Layout-Umstellung nötig war (`.deckbuilder-pool`
  hatte ohnehin schon ein eigenes `overflow-y: auto` mit `max-height: 65vh`,
  s. v0.1.10-Abschnitt — der sticky-Zusatz greift zusätzlich für den Fall,
  dass der gesamte Deckbau-Screen auf kleineren Bildschirmen die Seite länger
  als den Viewport macht).
- Keine Verhaltensänderung, keine neuen Test-Selektoren nötig — bestehende
  Tests (`golden-path.test.ts`, `vs-bot.test.ts`, `vs-bot-difficulty.test.ts`),
  die `.deckbuilder-ai-checkbox`/`.deckbuilder-ai-toggle`/`.deckbuilder-ai-
  quickstart-btn`/`.deckbuilder-confirm-btn` per `querySelector` suchen,
  liefen unverändert grün durch.

### Teil 2 (Hauptauftrag): Geführtes Tutorial/Probespiel

Auftrag: ein Tutorial als tatsächlich spielbare, geführte Beispielpartie
(keine reine Text-Hilfeseite) — fester Startpfad mit kuratierten Decks, ruhig
spielende KI, einmalige Erklär-Sprechblasen an Schlüsselmomenten, jederzeit
über ein „?"-Symbol abrufbare Gesamtübersicht, keine Auswirkung auf normale
Partien.

**Neue Dateien:**

- **`src/ui/tutorialDeck.ts`**: `TUTORIAL_DECK_PLAYER1`/`TUTORIAL_DECK_PLAYER2`
  (je 40 Karten, 6 verschiedene IDs à 4 Kopien + 20 Terrain) und
  `TUTORIAL_SEED` (fester `createGame`-Seed). Bewusst einfarbig pro Spieler
  (Spieler 1 `flame`, Spieler 2 `tide` — unterschiedliche Farbe, damit die
  Partie nicht spiegelbildlich verläuft) und auf genau die im Auftrag
  genannten Konzepte zugeschnitten: `core.cinder-pup`/`core.tide-scout`
  (Vanilla-Kreatur ohne Fähigkeiten), `core.ember-whelp` (Keyword `airborne` +
  ETB-Trigger, exakt die `docs/README.md`-Beispielkarte)/`core.harbor-warden`
  (Keyword `guardian`), `core.wildfire-boar`/`core.tidal-serpent` (größerer
  Kreatur-Körper für Angriff/Block), `core.fire-jolt`/`core.tidal-rebuke`
  (Zielsuch-Zauberspruch — `core.tidal-rebuke` ist ebenfalls die
  `docs/README.md`-Beispielkarte), `core.blazing-frenzy`/`core.tidal-surge`
  (Buff-Zauberspruch).
- **`src/ui/tutorialContent.ts`**: `TutorialTipId`-Union (`priority`/`terrain`/
  `creature`/`spell`/`attack`/`block`/`ability`/`complete`), `TUTORIAL_TIPS`
  (Titel + Fließtext je Tipp, deutschsprachig) und `TUTORIAL_CORE_TIP_IDS`
  (die sechs im Auftrag genannten Kernkonzepte — `ability` ist bewusst NICHT
  Teil davon, s.u.). Reine Textdaten, keine Logik.
- **`src/ui/components/tutorialOverlay.ts`**: `tutorialTipBubble` (einzelne
  Sprechblase + „Verstanden"-Button), `tutorialHelpButton` („? Hilfe"-Button
  für den Spielbrett-Header) und `tutorialHelpPanel` (Overlay-Panel mit ALLEN
  `TUTORIAL_TIPS`, unabhängig vom aktuellen Spielstand, s. Auftrag Punkt 4).
- **`src/ui/__tests__/tutorial.test.ts`**: neuer permanenter End-to-End-Test
  (s. Verifikation unten).

**`src/ui/store.ts`** (einzige inhaltliche Änderung an bestehender Logik):

- `startTutorial()`: merkt sich Spieler 2s bisherige `isBotControlled`/
  `botDifficulty`-Einstellung, markiert Spieler 2 bot-gesteuert auf `"medium"`
  (bewusst NICHT `"easy"` — laut `docs/ai-status.md` spielt `easy`
  ABSICHTLICH fehlerhaft/zufällig, was für ein Lern-Tutorial eher verwirrender
  wäre als ein ruhiges, vorhersehbares Mittelmaß; explizit auch NICHT
  `"hard"`, wie vom Auftrag verlangt), setzt `appPhase` direkt auf
  `{ kind: "playing" }` (überspringt den kompletten restlichen Deckbau-Ablauf)
  und ruft `initGame(TUTORIAL_DECK_PLAYER1, TUTORIAL_DECK_PLAYER2,
  TUTORIAL_SEED)`.
- `isTutorialActive()`/`getTutorialPendingTip()`/`dismissTutorialTip()`/
  `isTutorialHelpOpen()`/`toggleTutorialHelp()`/`closeTutorialHelp()`: reiner
  zusätzlicher UI-Zustand (`tutorialActive`/`tutorialShownTips`/
  `tutorialPendingTip`/`tutorialHelpOpen`, alle modul-scoped wie
  `botControlledPlayers` — keine Persistenz-Pflicht laut Auftrag, hier bewusst
  NICHT in `localStorage` gespiegelt, da ein frischer Tutorial-Durchlauf nach
  jedem "Tutorial starten"-Klick ohnehin wieder bei null beginnen soll).
- `maybeQueueTutorialTips(action)`: nach JEDER Zustandsänderung während einer
  Tutorial-Partie aufgerufen (`dispatch`, `runBotStep`, `initGame`) — erkennt
  die sechs Schlüsselmomente rein aus der bereits von der Engine
  akzeptierten `PlayerAction`/dem resultierenden `GameState` (keine neue
  Regellogik, nur Wiedererkennung): `priority` (zustandsbasiert, unabhängig
  vom Aktionstyp — der erste Moment mit `priorityPlayer` gesetzt und ohne
  offene `pendingDecision`), `terrain` (`playTerrain`), `creature`/`spell`
  (`castSpell`, unterschieden über `pool[...].type`), `attack`
  (`declareAttackers` mit `attackers.length > 0`), `block`
  (`declareBlockers` mit `blocks.length > 0`), optional `ability`
  (`activateAbility` auf einer NICHT-Mana-Fähigkeit — im aktuellen
  Tutorial-Kartenset kommt das nicht vor, der Trigger bleibt aber generisch
  vorbereitet). Pro Tipp-Art wird nur EINMAL gequeued (`tutorialShownTips`);
  es steht immer höchstens ein Tipp gleichzeitig an. Sind alle sechs
  Kernkonzepte gezeigt worden ODER ist die Partie vorbei (`state.winner`
  gesetzt), wird einmalig der Abschluss-Hinweis (`complete`) gequeued.
- `scheduleBotStepIfNeeded()`: pausiert zusätzlich, solange
  `tutorialPendingTip !== undefined` — verhindert, dass sich das Board unter
  einer gerade gelesenen Sprechblase weiterbewegt (v.a. relevant, wenn der
  Bot am Zug ist); `dismissTutorialTip()` stößt den Bot-Loop danach über
  `triggerBotLoop()` wieder an.
- `backToDeckbuilder()`: beendet den Tutorial-Modus sauber, falls aktiv —
  stellt Spieler 2s vorherige `isBotControlled`/`botDifficulty`-Einstellung
  wieder her (Auftrag Punkt 5: „verändert die normale Partie nicht", auch
  nicht dauerhaft nach dem Verlassen) und setzt den restlichen
  Tutorial-Zustand zurück.

**`src/ui/components/deckBuilder.ts`**: neue optionale Option
`onStartTutorial` (nur von `render.ts` für player1 gesetzt, analog zum
`offerCopyFromPlayer1`-Muster für player2) — rendert bei Vorhandensein eine
auffällige Box („Neu hier?" + Hinweistext + „Tutorial starten"-Button) direkt
unter der Deckbau-Überschrift, noch vor der KI-Umschalter-Box.

**`src/ui/render.ts`**: `renderDeckBuilder` reicht `onStartTutorial: player ===
"player1" ? () => startTutorial() : undefined` durch; `renderGameBoard`
rendert bei aktivem Tutorial-Modus die aktuell anstehende Sprechblase ganz
oben (vor der Status-Zeile) sowie — falls geöffnet — das Hilfe-Panel ganz
unten (als Overlay mit Backdrop); `statusBar` zeigt im Tutorial-Modus
zusätzlich den „? Hilfe"-Button und beschriftet den bisherigen „Neues
Spiel"-Button dort als „Zurück zum Hauptmenü" (dispatcht weiterhin exakt
dieselbe `backToDeckbuilder()`-Funktion, nur die Beschriftung ist
kontextabhängig).

**`src/ui/style.css`**: neue Klassen für die Tutorial-Box im Deckbau
(`.deckbuilder-tutorial-box`/`-heading`/`-hint`/`-start-btn`) sowie für
Sprechblase/Hilfe-Panel (`.tutorial-tip-bubble`/`-title`/`-body`/
`-dismiss-btn`, `.tutorial-help-btn`, `.tutorial-help-backdrop` (fixiertes,
abgedunkeltes Overlay), `.tutorial-help-panel`/`-header`/`-title`/`-list`/
`-entry`/`-entry-title`/`-entry-body`).

### Warum `ability` nicht zu den Kernkonzepten zählt

Der Auftrag nennt „beim ersten Einsatz einer aktivierten Fähigkeit" explizit
als OPTIONAL („falls es sich anbietet"). Das aktuelle Tutorial-Kartenset
(s.o.) enthält absichtlich keine Karte mit einer eigenen, nicht-Mana-
aktivierten Fähigkeit (nur die Terrain-eigene Mana-Fähigkeit, die bewusst
NICHT den `ability`-Tipp auslöst, s. `maybeQueueTutorialTips`) — die sechs
Kernkonzepte des Auftrags (Priorität, Terrain, Kreatur, Zauberspruch,
Angriff, Block) decken bereits den vollständigen Kartensatz ab. Der
`ability`-Tipp bleibt trotzdem vollständig implementiert/im Hilfe-Panel
sichtbar (falls ein künftiges Tutorial-Deck eine solche Karte bekommt, greift
er ohne weitere Code-Änderung), zählt aber bewusst nicht zu
`TUTORIAL_CORE_TIP_IDS`, damit der Abschluss-Hinweis nicht auf ein Ereignis
wartet, das mit dem aktuellen Kartenset nie eintritt.

### Verifikation

- `npm run build` (`tsc --noEmit`) sauber.
- `npm test` (`vitest run`): weiterhin alle bisherigen 161 Tests grün (+1
  bewusst übersprungener Analyse-Test), plus der neue permanente
  `src/ui/__tests__/tutorial.test.ts` (echter App-Start → Klick auf „Tutorial
  starten" → Partie läuft mit den festen Decks/dem festen Seed → Spieler 2
  ist bot-gesteuert auf „medium" → Spieler 1s eigene Mulligan-Entscheidung
  über einen echten Klick behalten (Spieler 2s eigene läuft automatisch über
  den Bot-Loop) → die erste Sprechblase („Mana, Phasen & Priorität")
  erscheint spätestens beim ersten Priority-Fenster mit korrektem Titel/Text
  aus `tutorialContent.ts` und ist über den „Verstanden"-Button wegklickbar
  → das „?"-Hilfe-Panel zeigt alle `TUTORIAL_TIPS`-Titel in der richtigen
  Reihenfolge und lässt sich schließen → „Zurück zum Hauptmenü" führt zum
  Deckbau-Screen zurück, beendet `isTutorialActive()` und stellt Spieler 2s
  vorherige (hier: nicht bot-gesteuerte) Einstellung wieder her) — alles über
  echte `element.dispatchEvent(new Event("click"))`-Aufrufe, kein direkter
  `store.dispatch()`-Bypass für die geprüfte Interaktion, exakt das Muster
  aus `golden-path.test.ts`/`vs-bot.test.ts`. Da `startTutorial()` einen
  FESTEN Seed an `createGame` übergibt (kein `Math.random()`-Aufruf in diesem
  Pfad), ist der Test bereits ohne `Math.random()`-Mocking deterministisch —
  einziger Nicht-Determinismus-Kandidat wäre eine Timing-Flakiness durch den
  asynchronen Bot-Loop, der über `vi.waitFor(() => expect(isBotThinking())…)`
  abgewartet wird (identisches Muster wie `vs-bot.test.ts`).
- `npm run build:ui` (Vite-Produktionsbuild) erfolgreich.
- Boot-Smoke-Test: `npm run dev` gestartet (Port 5174, da 5173 in dieser
  Session bereits belegt war), `GET /` liefert `200`, liefert die erwartete
  `index.html`.
- **Einschränkung (wie in v0.1.10 dokumentiert):** In dieser Session standen
  mir keine Browser-/Screenshot-Werkzeuge zur Verfügung (nur Datei-/
  Shell-Werkzeuge) — die vom Auftrag zusätzlich gewünschte eigene
  Browser-Verifikation samt Screenshot (KI-Umschalter jetzt auffindbar,
  Tutorial bedienbar) konnte ich in dieser Session dadurch NICHT durchführen;
  verifiziert wurde stattdessen ausschließlich über den oben beschriebenen
  echten Klick-Test (`tutorial.test.ts`) plus manuelle Code-/CSS-Durchsicht.
  Bitte bei Gelegenheit per echtem Browser-Screenshot nachverifizieren
  (Dev-Server lief zum Zeitpunkt dieser Verifikation bereits unter
  `http://localhost:5174/`).

**Ergebnis:** Neue Dateien: `src/ui/tutorialDeck.ts`, `src/ui/tutorialContent.ts`,
`src/ui/components/tutorialOverlay.ts`, `src/ui/__tests__/tutorial.test.ts`.
Geänderte Dateien: `src/ui/store.ts`, `src/ui/render.ts`,
`src/ui/components/deckBuilder.ts`, `src/ui/style.css`. Keine Änderungen an
`src/engine/*`, `src/model/*`, `src/ai/*`, `src/cards/*` — der Tutorial-Modus
nutzt ausschließlich die bestehende `RulesEngine`-Schnittstelle
(`createGame`/`getLegalActions`/`applyAction`) und die bestehende
`chooseActionForDifficulty`-Bot-Anbindung.

## Artwork-Einbindung (v0.1.12, 2026-07-18)

Auftrag: die extern generierten Karten-Artworks, die der Nutzer nach und nach
in `docs/cards/artworks/` ablegt (aktuell 38 von 300 Dateien, laufend mehr,
s. `docs/cards/card-art-brief.md`), ins UI einbinden — für Karten ohne
Artwork soll GENAU der bisherige Farbverlauf-Platzhalter (v0.1.10) unverändert
sichtbar bleiben.

### Kein neues Datenfeld im Kartenmodell

`src/ui/components/cardArt.ts#artworkUrl(cardId)` leitet den erwarteten
Dateinamen rein aus der `id` ab (`id.replace(/\./g, "-") + ".png"`,
z. B. `core.abyssal-lurker` → `/cards/artworks/core-abyssal-lurker.png`).
`src/cards/starter-set.ts`/`src/model/cards.ts` sind dadurch bewusst
unverändert — 300 einzelne Artwork-Pfade dort zu pflegen wäre unnötig
gewesen, da der Pfad deterministisch berechenbar ist.

### Ausliefer-Mechanismus: eigenes Vite-Plugin statt `public/`-Verschiebung

`docs/cards/artworks/` liegt außerhalb von Vites Standard-`public/`-Ordner.
Statt die Dateien dorthin zu verschieben (was den bestehenden Ablage-Workflow
des Nutzers geändert hätte), liefert ein neues, selbst geschriebenes Plugin
in `vite.config.ts` (`cardArtworkPlugin`) sie unter `/cards/artworks/<datei>`
aus:

- **Dev** (`npm run dev`): eine `configureServer`-Middleware liest die Datei
  live direkt aus `docs/cards/artworks/` (mit einfacher Directory-Traversal-
  Absicherung über den Dateinamen) und setzt den passenden Content-Type;
  existiert die Datei nicht, wird einfach durchgereicht (`next()`) — kein
  Neustart nötig, sobald der Nutzer eine neue Datei ablegt.
- **Build** (`npm run build:ui`): ein `closeBundle`-Hook kopiert
  `docs/cards/artworks/*` nach `<outDir>/cards/artworks/` (`dist-ui/cards/
  artworks/`), da ein Produktions-Build keinen Node-Server mehr hat, der zur
  Laufzeit im Quellordner nachschauen könnte.

Bewusst **kein** zusätzliches npm-Package (`vite-plugin-static-copy`) —
die eigentliche Kopier-/Serve-Logik ist mit `node:fs`/`node:path` in ca. 40
Zeilen erledigt, ein zusätzlicher Dependency-Eintrag hätte hier keinen
Mehrwert gebracht.

**Gefundene Falle:** `closeBundle` feuert nicht nur bei einem echten
`vite build`, sondern auch innerhalb Vitests eigener, interner Vite-Instanz
beim Ausführen der UI-Tests (`npm test`) — dabei wird bewusst ein
nicht-existenter Platzhalterpfad (`dummy-non-existing-folder`) als
`config.build.outDir` durchgereicht, offenbar genau um Plugins zu erwischen,
die unbedingt (ungeprüft) ins Dateisystem schreiben. Erste Version des
Plugins erzeugte dadurch bei jedem `npm test` tatsächlich einen
`dummy-non-existing-folder/cards/artworks/`-Ordner im Projekt-Root (mit
einer Kopie aller vorhandenen Artworks) — gefunden über `git status`, nicht
über einen fehlschlagenden Test. Fix: das Plugin merkt sich in
`configResolved` zusätzlich `config.command === "build"` und überspringt den
Kopierschritt in `closeBundle`, wenn das nicht zutrifft. Nach dem Fix
erzeugen weder `npm test` noch `npm run build` einen solchen Ordner mehr,
`npm run build:ui` kopiert weiterhin korrekt.

### Fallback-Logik im Kartenrahmen

Neuer gemeinsamer Baustein `src/ui/components/cardArt.ts#cardFrameArt(def)`
ersetzt das bisherige leere `h("div", { class: "card-frame-art" })` in
`handCard.ts` (inkl. `handCardDiscardToggle`), `cardTile.ts` und
`deckBuilder.ts#poolRow` — alle drei Kartendarstellungen (Hand,
Battlefield/Graveyard/Stack, Deckbau-Pool) nutzen jetzt exakt dieselbe
Funktion, keine Dopplung der Lade-/Fallback-Logik. Aufbau: ein `<img
loading="lazy" decoding="async">` mit `src` = `artworkUrl(def.id)` liegt
(CSS `position: absolute; inset: 0; object-fit: cover`) über dem
unverändert bestehenden Farbverlauf-Hintergrund von `.card-frame-art`:

- **`onload`**: fügt die Klasse `.card-frame-art-img-loaded` hinzu, die die
  anfängliche `opacity: 0` per CSS-Transition auf `1` hochfährt — das Bild
  erscheint erst, wenn es tatsächlich fertig geladen ist (kein Aufblitzen
  eines halb geladenen/kaputten Bilds).
- **`onerror`** (Normalfall für die meisten der 300 Karten aktuell): entfernt
  das `<img>`-Element direkt wieder aus dem DOM. Der Farbverlauf-Hintergrund
  von `.card-frame-art` selbst wurde nie verändert — kein kaputtes
  Bild-Icon, kein Layout-Sprung, exakt der v0.1.10-Zustand bleibt sichtbar.

`loading="lazy"` ist bewusst gesetzt (Performance-Vorgabe): Der Deckbau-Pool
zeigt alle 300 Karten gleichzeitig, die meisten davon lösen aktuell einen
fehlschlagenden Request aus — der Browser fordert dank `loading="lazy"` nur
die tatsächlich in den sichtbaren Bereich gescrollten Bilder überhaupt an.

### Verifikation

**Einschränkung (wie in v0.1.10/v0.1.11 dokumentiert):** In dieser Session
standen mir keine Browser-/Screenshot-Werkzeuge zur Verfügung (nur Datei-/
Shell-Werkzeuge) — eine echte Browser-Verifikation samt Screenshot konnte
ich dadurch NICHT durchführen. Stattdessen verifiziert über eine Kombination
aus einem echten HTTP-Request an den laufenden Dev-Server und temporären
jsdom-Tests (nicht Teil des Repos, nach der Verifikation wieder gelöscht,
gleiches Muster wie in früheren Runden):

1. **Echter Dev-Server-Request** (`npm run dev`, danach `curl`): Ein Request
   auf `http://localhost:5173/cards/artworks/core-abyssal-lurker.png` liefert
   `200 image/png` mit den tatsächlichen, gültigen PNG-Bytes (per `file`
   verifiziert: „PNG image data, 1408 x 768, …") — die Middleware liefert
   also wirklich die echte Datei aus `docs/cards/artworks/`, nicht nur eine
   Attrappe. Ein Request auf eine nicht existierende Artwork-Datei liefert
   `text/html` (Vites eigener SPA-Fallback greift hier, kein hartes 404) —
   das reicht für den Zweck aber aus, da ein `<img>`-Tag beim Versuch, HTML
   als Bild zu dekodieren, ebenfalls zuverlässig ein `error`-Event auslöst.
2. **Isolierter `cardFrameArt`-Test** (temporär, jsdom): für
   `core.abyssal-lurker` (hat laut Nutzer bereits ein Artwork) erzeugt die
   Funktion ein `<img>` mit `src="/cards/artworks/core-abyssal-lurker.png"`;
   ein manuell dispatchtes `"load"`-Event fügt `.card-frame-art-img-loaded`
   hinzu. Für `core.silence-veil` (kein Artwork vorhanden) entfernt ein
   manuell dispatchtes `"error"`-Event das `<img>` wieder — die
   `.card-frame-art`-Div selbst bleibt danach exakt wie vorher
   (`className === "card-frame-art"`, keine Kinder), also bitgenau der
   bisherige Farbverlauf-Platzhalter.
3. **Integrationstest über die echte Render-Pipeline** (temporär, jsdom):
   `render(root)` auf den echten Deckbau-Screen angewendet (kein direkter
   Store-/Komponentenaufruf) — die Pool-Zeilen für `core.abyssal-lurker` UND
   `core.ash-duelist` (beide laut Nutzer bereits mit Artwork) enthalten
   jeweils ein `<img>` mit dem korrekt abgeleiteten `src` und
   `loading="lazy"`; die Zeile für `core.silence-veil` (ohne Artwork) hat
   weiterhin eine unveränderte, klassenlose `.card-frame-art`-Div.
4. `npm run build` (`tsc --noEmit`), `npm test` (161/161 grün, 1 bewusst
   übersprungener Analyse-Test unverändert) und `npm run build:ui` laufen
   sauber; `dist-ui/cards/artworks/` enthält nach dem Build alle 38 aktuell
   vorhandenen Artwork-Dateien (per `ls | wc -l` gegen den Quellordner
   gegengeprüft).

Bitte bei Gelegenheit per echtem Browser-Screenshot nachverifizieren (Karten
mit Artwork zeigen das Bild, Karten ohne Artwork weiterhin den
Farbverlauf) — funktional sollte das nach den obigen Tests bereits
zuverlässig funktionieren, ein echter visueller Blick steht aber noch aus.

**Ergebnis:** Neue Datei `src/ui/components/cardArt.ts`. Geänderte Dateien:
`vite.config.ts` (neues Plugin), `src/ui/style.css` (`.card-frame-art-img`/
`-loaded`), `src/ui/components/handCard.ts`/`cardTile.ts`/`deckBuilder.ts`
(nutzen jetzt `cardFrameArt`/`cardArt.ts` statt der leeren Div). Keine
Änderungen an `src/engine/*`, `src/model/*`, `src/cards/*`, `src/ai/*`.

## Kunstbereich-Höhe korrigiert (v0.1.13, 2026-07-18)

Direktes Nutzer-Feedback zum v0.1.12-Stand (per Screenshot vom Deckbau-Pool):
die eingebundenen Artworks wirkten "unsauber abgeschnitten" — ein Karten-
Motiv mit einem Greifen/geflügelten Wesen zeigte nur die Flügelspitzen, ein
Strudel-Motiv nur ein kleines Fragment.

### Ursache

`.card-frame-art` (der Bildbereich im Kartenrahmen) war bewusst schmal
dimensioniert gewesen, solange er nur ein reiner Farbverlauf war (v0.1.10):
**30px** Höhe für Battlefield-/Graveyard-/Stack-Kacheln (`.card-tile`,
118px breit) bzw. **42px** für Handkarten/Deckbau-Pool (`.hand-card`
158px / `.deck-pool-row` 132px breit). Die extern generierten Artworks sind
laut Stilleitfaden (`docs/cards/card-art-brief.md`, "Seitenverhältnis")
querformatig (~4:3/3:2) angelegt — per Stichprobe aller 39 zum Zeitpunkt
dieser Änderung vorhandenen Dateien via PNG-`IHDR`-Header (`node`, keine
Bildbibliothek nötig) bestätigt: 38 von 39 Dateien exakt 1200×896px
(Seitenverhältnis 1.339, praktisch 4:3), eine Ausreißer-Datei 1408×768px
(1.833). Bei einer nur 30-42px hohen Zielfläche und `object-fit: cover`
(unverändert seit v0.1.12) wird ein Bild mit diesem Seitenverhältnis massiv
vertikal beschnitten — bei Kartenbreiten von 118-158px blieb dadurch nur ein
sehr schmaler horizontaler Ausschnitt sichtbar, meist nicht das Hauptmotiv.

### Änderung

Reine CSS-Werteänderung in `src/ui/style.css`, keine Struktur-/Markup-
Änderung (`cardArt.ts`/`handCard.ts`/`cardTile.ts`/`deckBuilder.ts`
unverändert):

- `.card-frame-art` (Basis, greift für `.card-tile` auf Battlefield/
  Graveyard/Stack): `30px` → `78px`.
- `.hand-card .card-frame-art`: `42px` → `104px`.
- `.deck-pool-row .card-frame-art`: `42px` → `88px` (bisher mit
  `.hand-card` zusammen in einem Selektor geführt; jetzt aufgeteilt, da
  `.hand-card` und `.deck-pool-row` unterschiedlich breit sind — 158px vs.
  132px — und ein gemeinsamer Höhenwert das 4:3-Verhältnis für die
  schmalere `.deck-pool-row` unnötig verzerrt hätte).

Die drei Werte orientieren sich grob am 4:3-Seitenverhältnis relativ zur
tatsächlichen Innenbreite des jeweiligen Kartenrahmens (Kartenbreite abzüglich
Border/Padding von `.hand-card`/`.card-tile`/`.deck-pool-row` UND des
inneren `.card-frame-frame`-Rahmens) und wurden danach per echtem
Browser-Screenshot nachjustiert/bestätigt (s. Verifikation unten) statt rein
rechnerisch übernommen zu werden. `object-position` wurde bewusst NICHT
geändert (bleibt Standard `center center`): eine Sichtprüfung von ca. 20
realen Artworks im Deckbau-Pool-Screenshot zeigte keinen systematischen
Bedarf für einen vertikalen Versatz (z. B. `center 40%`) — die Motive sind
in der Bildgenerierung offenbar bereits überwiegend zentriert/mittig
komponiert, ein zusätzlicher Versatz hätte hier eher geschadet als geholfen.

Die Gesamtkartenhöhe wächst dadurch an allen drei Einsatzorten spürbar —
das ist die explizite Nutzer-Vorgabe ("wir müssen die Höhe für die Bilder
etwas erhöhen") und ein bewusst akzeptierter Trade-off (weniger Karten pro
Zeile im Deckbau-Pool-Grid/Battlefield-Grid, mehr Scrollen). Kein Fixed-
Height-Overflow/Layout-Bruch an den drei betroffenen Stellen (Hand-Zone,
Battlefield-Grid, Deckbau-Pool-Grid mit 300 Karten) — alle drei nutzen
bereits `flex-wrap`/`overflow-y: auto`-Container, die mit variabler
Kartenhöhe umgehen können, s. Verifikation.

### Verifikation

Im Unterschied zu v0.1.10-v0.1.12 standen in dieser Session tatsächlich
Browser-Werkzeuge zur Verfügung (Chrome, headless, über das Chrome
DevTools-Protokoll direkt per WebSocket angesteuert — kein dediziertes
Browser-MCP-Tool im Funktionsumfang dieser Session, daher ein kleines,
temporäres Steuerskript mit `node` statt eines fertigen Tools; Skript nicht
Teil des Repos):

1. **`npm test`**: weiterhin 161/161 grün (1 bewusst übersprungener
   Analyse-Test unverändert), **`npm run build`** (`tsc --noEmit`) und
   **`npm run build:ui`** (Vite-Produktionsbuild) sauber — erwartbar, da
   reine CSS-Wertänderung ohne TS-/Markup-Berührung.
2. **Echter Screenshot des Deckbau-Pools** (`npm run dev`, Chrome headless
   gegen `http://localhost:5173/`, direkt der App-Startbildschirm
   `Deckbau: player1`): zeigt u. a. `core.abyssal-lurker` (Krake-Motiv,
   vollständig sichtbar inkl. Tentakeln), `core.abyssal-undertow`
   (Strudel-Motiv — genau die vom Nutzer bemängelte Karte, jetzt komplett
   im Frame statt nur als Fragment), `core.aegis-ward`/`core.aegis-oath`
   (goldene Ring-/Schild-Motive), `core.ash-duelist`, `core.bastion-
   forgeworks`, `core.brandwatch-mercenary` u. a. — durchgängig das jeweilige
   Hauptmotiv gut erkennbar, kein horizontaler Fragment-Ausschnitt mehr.
   Karten ohne Artwork zeigen weiterhin unverändert den Farbverlauf-
   Platzhalter (kein Regressions-Risiko für die 261 Karten ohne Datei zum
   Zeitpunkt dieser Änderung).
3. **Echter Screenshot der Hand-Zone im laufenden Spiel** (per CDP-Skript
   durch Deckbau geklickt — inkl. gezielt 4× `core.ash-duelist`
   hinzugefügt, um eine Artwork-Karte im Spiel zu garantieren — dann
   Mulligan behalten + mehrere Priority-/Terrain-Zyklen): `core.ash-duelist`
   ("Aschenduellant") zeigt in der Hand bei 104px Höhe die volle
   Kriegerfigur mit brennender Klinge, gut erkennbar, keine Kopf-/
   Fuß-Abschneidung. Layout der Hand-Zone (mehrere Karten nebeneinander,
   `flex-wrap`) bleibt intakt.
4. **Battlefield-Kachel (`.card-tile`, 78px)**: mangels im Spielverlauf
   gezogener/bezahlbarer Artwork-Einheit innerhalb des Testzeitraums nicht
   mit einer ECHTEN Artwork-Karte auf dem Battlefield verifiziert (reiner
   Zeit-/Bot-Zug-Aufwand des Verifikationsskripts, keine Code-Unsicherheit)
   — Terrains auf dem Battlefield (dieselbe `.card-tile`-Kachel, aktuell
   ohne eigenes Artwork) zeigen bei 78px Höhe unverändert sauber den
   Farbverlauf, kein Layout-Bruch, Status-Badges (`getappt` etc.) bleiben
   korrekt unterhalb im Textbereich. Da `.card-tile` exakt denselben
   `cardFrameArt`-Baustein/dieselbe CSS-Mechanik wie `.hand-card`/
   `.deck-pool-row` verwendet (nur der Höhenwert unterscheidet sich) und
   Punkt 2/3 oben beide mit echten Bildern bereits sauberes Rendering
   bestätigen, ist hier mit hoher Zuversicht von korrektem Verhalten
   auszugehen — **bitte bei Gelegenheit mit einer tatsächlich auf dem
   Battlefield liegenden Artwork-Einheit nachverifizieren.**

**Ergebnis:** Einzige geänderte Datei `src/ui/style.css` (drei Höhenwerte
für `.card-frame-art`-Selektoren). Keine Änderungen an
`src/ui/components/cardArt.ts`, `handCard.ts`, `cardTile.ts`,
`deckBuilder.ts`, `src/engine/*`, `src/model/*`, `src/cards/*`, `src/ai/*`.

## Tutorial: player1 beginnt immer (v0.1.14, 2026-07-18)

Nutzer-Feedback nach dem ersten Ausprobieren des geführten Tutorials: "ich
kann irgendwie gar nichts machen".

### Ursache

Kein Bug im engeren Sinne. Mit dem festen `TUTORIAL_SEED`
(`src/ui/tutorialDeck.ts`) entschied `engine.createGame`s normaler (aber
deterministischer, s. Seed) Münzwurf, dass player2 (der bot-gesteuerte
Gegner, s. `startTutorial`) den ersten kompletten Zug bekam — laut
Ereignis-Log "Startspieler: player2". Player1 (der Mensch) hatte in diesem
ersten Zug fast nichts zu tun außer wiederholt "Priorität passen" zu
klicken, während der Bot Terrain spielt/Kreaturen ausspielt. Für jemanden,
der zum allerersten Mal überhaupt mit Prioritätsfenstern/Zugstruktur
konfrontiert wird, sieht ein Bildschirm, auf dem scheinbar nichts anklickbar
ist außer einem "Passen"-Button, wie ein kaputtes UI aus — obwohl technisch
alles korrekt lief (man ist einfach nicht am Zug).

### Änderung

Die Engine unterstützt genau diesen Fall bereits nativ:
`CreateGameConfig.startingPlayer?: PlayerId` (`src/model/game-state.ts`)
überschreibt den Münzwurf explizit (`config.startingPlayer ?? PLAYER_IDS[...]`,
`src/engine/create-game.ts`). Keine Engine-Änderung nötig, nur zwei
Frontend-Anpassungen:

- `store.ts#initGame` bekam einen neuen, optionalen vierten Parameter
  `startingPlayer?: PlayerId`, der 1:1 an `engine.createGame` durchgereicht
  wird (`undefined` per Default → Engine entscheidet weiterhin per
  Münzwurf, unverändertes Verhalten für normale Partien).
- `store.ts#startTutorial` ruft `initGame(...)` jetzt mit dem festen
  fünften/letzten Wert `"player1"` auf. Dieser Pfad ist strikt vom normalen
  Spielstart (`confirmDeck`, ruft `initGame` weiterhin OHNE diesen
  Parameter auf) getrennt — reguläre Partien bleiben bewusst beim
  zufälligen Münzwurf, das ist ausdrücklich NUR eine Tutorial-Sondermaßnahme.

Zusätzlich als Sicherheitsnetz gegen genau dieses Missverständnis (auch für
später, falls ein Nutzer trotzdem mal in einer echten Partie zufällig nicht
beginnt): die allererste Tutorial-Sprechblase ("Mana, Phasen & Priorität",
`src/ui/tutorialContent.ts`, Tipp-ID `priority`) hat jetzt einen zusätzlichen
Satz, der explizit macht, dass sich beide Spieler mit ganzen Zügen abwechseln
und man in eigenen Priority-Fenstern während des gegnerischen Zugs meist
einfach passt, weil es nichts zu tun gibt.

`src/ui/__tests__/tutorial.test.ts` hatte keine Assertion, die von einem
zufälligen Startspieler abhing (nur veraltete Kommentare) — diese wurden
mitkorrigiert, kein Testverhalten geändert.

### Verifikation

1. **`npm test`**: weiterhin 161/161 grün (1 bewusst übersprungener
   Analyse-Test unverändert), **`npm run build`** (`tsc --noEmit`) sauber.
2. Kein Browser-/Computer-Use-Werkzeug in dieser Session verfügbar, daher
   stattdessen ein temporärer (nach Verifikation wieder entfernter)
   Vitest-Fall: `startTutorial()` aufgerufen, danach
   `getState().activePlayer === "player1"` bestätigt — grün. Ein laufender
   Dev-Server (`http://localhost:5173/`) wurde per `curl` als erreichbar
   bestätigt (HTTP 200), ein echter Klick-Durchlauf im Browser („Tutorial
   starten" → Ereignis-Log zeigt „Startspieler: player1" → direkt
   Handlungsmöglichkeit in main1) steht noch aus und sollte bei Gelegenheit
   mit Browser-Werkzeugen nachgeholt werden.

**Ergebnis:** Geänderte Dateien `src/ui/store.ts` (`initGame`-Signatur +
`startTutorial`), `src/ui/tutorialContent.ts` (Tipp-Text `priority`),
`src/ui/tutorialDeck.ts` (Kommentar-Ergänzung), `src/ui/__tests__/tutorial.test.ts`
(Kommentar-Korrektur). Keine Änderungen an `src/engine/*`, `src/model/*`,
`src/cards/*`, `src/ai/*`.

## Keyword-Glossar (v0.1.15, 2026-07-18)

Nutzer-Feedback (echtes Verständnisproblem, nicht tutorial-spezifisch):
Karten zeigen Schlüsselwörter im Regeltext (z. B. "Todesberührung." bei
`core.abyssal-lurker`), aber es gab **keine** Möglichkeit im UI,
herauszufinden, was ein Schlüsselwort bedeutet/bewirkt. Betrifft alle 9
Keywords aus dem `Keyword`-Typ (`src/model/abilities.ts`): `swift`,
`airborne`, `reach`, `vigilant`, `lifelink`, `guardian`, `trample`,
`firstStrike`, `deathtouch`.

### Datenquelle: `src/ui/keywordGlossary.ts` (neu)

Pro Keyword: ein `title` (Anzeigename fürs globale Nachschlagewerk), eine
Liste `displayTerms` (die deutschen Wortformen, wie sie TATSÄCHLICH in
`CardDefinition.rulesText`-Strings vorkommen — per Grep in
`src/cards/starter-set.ts` ermittelt, nicht geraten) sowie eine kurze,
spielerfreundliche `explanation` (1-3 Sätze, keine Regeltext-Kopie).
Verbindliche Regelsemantik: `docs/rules-engine.md` Abschnitt 6d
(Kampf-Keyword-Paket) + die Keyword-Kommentare in `src/model/abilities.ts`.

Wichtiger Grep-Befund, der die im Auftrag vorausgesagte Diskrepanz bestätigt:
`airborne` erscheint als "Flieger" (auf Einheiten-Karten) UND als
"Flugfähigkeit" (von Zaubersprüchen/Fähigkeiten verliehen, z. B.
"...erhält bis zum Ende des Zuges Flugfähigkeit."). Zusätzlich (nicht im
Auftrag erwähnt, aber beim Grep aufgefallen): `firstStrike`/`trample`
erscheinen im Kartentext **ausschließlich** als "Erststurm"/
"Trampelschaden" — NIE als "Erstschlag"/"Trampeln". Die bestehende
`KEYWORD_LABEL`-Badge-Kurzform in `src/ui/cardInfo.ts` (verwendet für die
`.card-tile-keywords`-Statuszeile auf dem Battlefield, seit v0.1.3) nennt sie
aber genau so ("Erstschlag"/"Trampeln") — zwei unabhängig entstandene, leicht
unterschiedliche deutsche Kurzformen für dasselbe Keyword an zwei
verschiedenen UI-Stellen. Bewusst NICHT angeglichen in diesem Schritt (außerhalb
des Auftragsumfangs, `KEYWORD_LABEL` unverändert gelassen) — Hinweis an
card-designer/documenter, falls das künftig vereinheitlicht werden soll.

`tokenizeRulesText(rulesText)` zerlegt einen Kartentext in Text-/
Keyword-Segmente (reines String-Parsing über eine kombinierte Regex aus
allen `displayTerms`, `\b`-Wortgrenzen, längste Begriffe zuerst) — kein
Spielzustand, keine Regelentscheidung.

### In-Context-Hervorhebung + Tooltip/Popover

Neuer gemeinsamer Baustein `src/ui/components/keywordText.ts#ruleTextNodes`,
der an der EINEN gemeinsamen Stelle verwendet wird, an der bisher immer
`text(def.rulesText)` stand (`handCard.ts#cardFrameBody`,
`cardTile.ts`, `deckBuilder.ts#poolRow` — exakt die drei vom Auftrag
genannten Orte: Hand, Battlefield/Graveyard/Stack, Deckbau-Pool). Jedes
erkannte Keyword-Wort wird als `<span class="keyword-highlight">` gerendert:

- natives `title`-Attribut mit der Erklärung (Hover-Tooltip, "einfachste
  robuste Lösung" laut Auftrag),
- `onclick` (mit `stopPropagation`, damit ein Klick auf das Wort nicht
  zusätzlich die umgebende Karten-Kachel als Ziel anklickt/Combat-Auswahl
  auslöst) öffnet zusätzlich eine kleine Klick-Sprechblase
  (`components/keywordGlossaryPanel.ts#keywordPopoverBubble`, visuell an
  `tutorialTipBubble` angelehnt: gleicher Titel-/Body-Aufbau, eigener
  "Schließen"-Button). Bewusst als FIXIERTES Backdrop-Overlay statt direkt
  am angeklickten Wort verankert — `.card-frame-frame` hat `overflow:
  hidden` (Artwork-Rahmen, seit v0.1.12/13), ein dort verankertes Popover
  würde abgeschnitten; ein fixiertes Overlay funktioniert unabhängig davon,
  wo im Board/Deckbau-Pool-Grid das Wort gerade sitzt, ohne
  Positionsberechnung relativ zum angeklickten Element zu brauchen.

CSS: `.keyword-highlight` (gepunktete Unterstreichung, `--accent`-Farbe,
`cursor: help`), `.keyword-highlight-active` (dezente Hervorhebung, solange
die Sprechblase für genau dieses Keyword offen ist), `.keyword-popover-
backdrop`/`-bubble`/`-close-btn` (neue Regeln in `style.css`, am bestehenden
`.tutorial-help-backdrop`/`.tutorial-tip-bubble`-Muster orientiert).

### Globales Nachschlagewerk (Auftrag Punkt 3)

Neuer, komplett eigenständiger Baustein `src/ui/components/
keywordGlossaryPanel.ts` (`keywordGlossaryButton`, `keywordGlossaryPanel`) -
strukturell an `tutorialOverlay.ts#tutorialHelpButton`/`tutorialHelpPanel`
angelehnt, aber bewusst NICHT dasselbe Panel erweitert (kein zweiter Reiter):
Das bestehende Tutorial-Hilfe-Panel ist an `isTutorialActive()` geknüpft und
existiert für Nicht-Tutorial-Partien schlicht nicht — der Auftrag verlangt
aber ausdrücklich Verfügbarkeit "auch außerhalb des Tutorial-Modus (...) nicht
nur im Tutorial". Ein komplett separater Button/State war damit der klarere
Weg als eine Bedingung mehr im bestehenden Tutorial-Code zu verschachteln.

Neuer, vom Tutorial-Zustand unabhängiger Store-Zustand (`store.ts`, gleiches
Muster wie `tutorialHelpOpen`, aber eigene Variablen):
`getOpenKeywordGlossary`/`toggleKeywordGlossary`/`closeKeywordGlossary`
(welche EINZELNE Klick-Sprechblase gerade offen ist) sowie
`isKeywordGlossaryPanelOpen`/`toggleKeywordGlossaryPanel`/
`closeKeywordGlossaryPanel` (das komplette Panel). Beide werden in
`backToDeckbuilder()` zusätzlich sauber zurückgesetzt.

Der "? Schlüsselwörter"-Button erscheint jetzt an ZWEI Stellen, beide OHNE
`isTutorialActive()`-Bedingung:

- `render.ts#statusBar` (Status-Zeile der laufenden Partie — Hotseat, gegen
  die KI, UND im Tutorial gleichermaßen).
- `components/deckBuilder.ts#deckBuilderScreen` (neue `.deckbuilder-
  header-row` neben der Überschrift) — der Kartenpool im Deckbau zeigt
  dieselben Schlüsselwörter im Regeltext wie später die Partie, die
  Verwirrung ist also nicht auf die laufende Partie beschränkt.

Das Panel (`keywordGlossaryPanel`) listet alle 9 `KEYWORD_GLOSSARY`-Einträge
vollständig auf, unabhängig vom aktuellen Spielzustand — verwendet dieselben
`.tutorial-help-*`-CSS-Klassen wie das bestehende Tutorial-Panel (rein
optische Wiederverwendung, kein gemeinsamer Programmzustand).

### Architektur-Kompromiss (bewusst dokumentiert)

`components/keywordText.ts` sowie `components/deckBuilder.ts` importieren
die Keyword-Popover-Funktionen direkt aus `store.ts`, statt sie — wie sonst
in diesem Projekt üblich (`onConcede`, `onToggleBotControl`, ...) — als Props
durch `render.ts` bis zu `cardTile`/`handCard`/`poolRow` durchzureichen. Das
hätte ~12 bestehende Aufrufstellen von `cardTile()` in `render.ts` sowie die
`CardTileOptions`/`HandCardOptions`-Signaturen anfassen müssen, nur um einen
Zustand durchzuschleifen, der - anders als z. B. `onConcede` - für JEDE Karte
an JEDER Stelle im UI identisch ist und keinerlei Spiellogik/Legalitätsbezug
hat (reines Anzeige-Overlay, vergleichbar mit `cardInfo.ts`, das ebenfalls
direkt Engine-Funktionen importiert statt sie durchzureichen). Falls
engine-architect/documenter das anders sehen: Alternative wäre, diese beiden
Store-Funktionen doch als Props durchzureichen — reine Fleißarbeit ohne
Verhaltensänderung.

### Verifikation

1. **`npm run build`** (`tsc --noEmit`) sauber.
2. **`npm test`**: alle bisherigen 161 Tests weiterhin grün, plus neuer
   Testfall `src/ui/__tests__/keyword-glossary.test.ts` (2 Fälle, echte
   `element.dispatchEvent(new Event("click"))`-Klicks auf das von `render()`
   erzeugte DOM, kein direkter Store-Aufruf für das geprüfte Verhalten
   selbst — exakt das Muster aus `golden-path.test.ts`):
   - Deckbau-Pool: `core.abyssal-lurker` zeigt `.keyword-highlight` mit Text
     "Todesberührung", `title`-Attribut enthält die Erklärung, der Rest des
     Regeltexts bleibt unverändert ("Todesberührung."); Klick öffnet
     `.keyword-popover-bubble` mit Titel+Erklärung, "Schließen" schließt sie
     wieder.
   - "? Schlüsselwörter"-Button ist bereits im Deckbau-Screen vorhanden und
     öffnet ein Panel mit allen 9 Keyword-Titeln (`.tutorial-help-entry`-
     Anzahl = 9); nach komplettem Deckbau+Spielstart (OHNE Tutorial zu
     starten) ist derselbe Button in der Status-Zeile der laufenden Partie
     weiterhin vorhanden und zeigt dasselbe Panel — bestätigt den
     Kernpunkt des Auftrags ("auch außerhalb des Tutorial-Modus").
   Gesamt: 163/163 Tests grün (1 weiterhin bewusst übersprungener
   Analyse-Test unverändert).
3. **Laufender Dev-Server** (`npm run dev`, `http://localhost:5173/`) wurde
   per `curl` als erreichbar bestätigt (HTTP 200); alle neuen/geänderten
   Module (`store.ts`, `render.ts`, `keywordText.ts`,
   `keywordGlossaryPanel.ts`, `deckBuilder.ts`, `cardTile.ts`, `handCard.ts`)
   wurden zusätzlich einzeln per `curl` gegen den Vite-Dev-Server abgefragt
   (HTTP 200 statt eines Transform-Error-Overlays) - bestätigt syntaktisch
   fehlerfreies Ausliefern. **Keine Browser-/Computer-Use-Werkzeuge in dieser
   Session verfügbar** (wie bereits in mehreren früheren Abschnitten
   dokumentiert, z. B. v0.1.3/v0.1.14) — ein tatsächlicher visueller
   Screenshot-Vergleich (Hervorhebung sichtbar unterstrichen, Popover korrekt
   positioniert/lesbar, Panel-Layout) steht noch aus und sollte bei
   Gelegenheit mit Browser-Werkzeugen nachgeholt werden. Die jsdom-Klick-Tests
   oben verifizieren aber bereits das tatsächliche Verhalten (DOM-Struktur,
   Attribute, Klick-Ergebnis) end-to-end über echte Klicks auf das von
   `render()` erzeugte DOM, nicht nur über Store-Aufrufe.

**Ergebnis:** Neue Dateien `src/ui/keywordGlossary.ts`,
`src/ui/components/keywordText.ts`, `src/ui/components/keywordGlossaryPanel.ts`,
`src/ui/__tests__/keyword-glossary.test.ts`. Geänderte Dateien
`src/ui/store.ts` (neuer Keyword-Glossar-Zustand), `src/ui/render.ts`
(Popover-Bubble + globales Panel im Spielbrett, neuer Button in `statusBar`),
`src/ui/components/handCard.ts`/`cardTile.ts`/`deckBuilder.ts`
(rulesText-Rendering nutzt jetzt `ruleTextNodes` statt `text(...)`,
`deckBuilder.ts` zusätzlich neue Kopfzeile + Panel/Popover-Rendering),
`src/ui/style.css` (`.keyword-highlight*`, `.keyword-popover-*`,
`.deckbuilder-header-row`). Keine Änderungen an `src/engine/*`,
`src/model/*`, `src/cards/*`, `src/ai/*`.

## Geführte Tutorial-Schritt-Sequenz (v0.1.16, 2026-07-19)

### Auftrag

Das bisherige Tutorial (v0.1.11-v0.1.15) zeigte pro Aktionstyp nur EINE
passive, einmalige Info-Sprechblase, falls der Spieler zufällig darüber
stolperte ("wenn du zufällig eine Kreatur castest, erklären wir dir
Beschwörungskrankheit") — kein wirklich GEFÜHRTES Tutorial. Auftrag: eine
echte Schritt-Sequenz, bei der jeder wichtige Aktionstyp einmal konkret
angewiesen UND tatsächlich ausgeführt wird, nach dem Muster "Instruktion →
konkrete erwartete Aktion → kurze Bestätigung/Ergebnis-Erklärung → nächste
Instruktion".

### Die 13 Schritte (`src/ui/tutorialContent.ts#TUTORIAL_STEPS`)

1. `mulliganIntro` (Info) — Starthand/Mulligan kurz erklärt, erscheint sofort
   bei Partiestart.
2. `priorityIntro` (Info) — Mana/Phasen/Priorität (Inhalt wie zuvor „priority"),
   erscheint beim ersten echten Priority-Fenster nach den Mulligans.
3. `playTerrain` (Aktion) — Terrain aus der Hand spielen (hervorgehoben:
   Flammenkuppe).
4. `tapForMana` (Aktion) — das gespielte Terrain antippen, Mana im Pool
   beobachten.
5. `castCreature` (Aktion) — eine Kreatur beschwören (hervorgehoben: Glutpfote/
   Glutwelpe/Wildfeuerkeiler), Beschwörungskrankheit erklärt.
6. `chooseTriggerTarget` (Aktion) — Ziel für eine ausgelöste Fähigkeit wählen
   (Glutwelpes ETB-Schaden).
7. `castDamageSpell` (Aktion) — Schadenszauber wirken (hervorgehoben:
   Feuerstoß).
8. `castBuffSpell` (Aktion) — Verstärkungszauber auf eigene Kreatur
   (hervorgehoben: Lodernder Rausch) — Bestätigung hebt die verstärkte Kreatur
   hervor ("schaut auf die Zahlen unten rechts").
9. `declareAttack` (Aktion) — Angreifer erklären.
10. `combatDamage` (Info) — automatische Kampfschaden-Abrechnung beobachten.
11. `declareBlock` (Aktion) — blocken, sobald der Gegner angreift.
12. `winCondition` (Info) — 0 Leben = verloren.
13. `complete` (Info) — Abschluss-Hinweis (erwähnt jetzt zusätzlich, dass der
    volle Kartenpool weitere Mechaniken hat, die dieses bewusst einfache
    Demo-Deck nicht abdeckt: X-Kosten, modale Sprüche, Mehrfachziele, ...).

Reihenfolge ist die PÄDAGOGISCHE Präsentationsreihenfolge, nicht zwangsläufig
die chronologische — mit dem festen `TUTORIAL_SEED` ist `core.fire-jolt`
bereits Zug 1 bezahlbar, während `core.cinder-pup` (die einzige Vanilla-Kreatur
des Decks) laut Simulation erst im 4. eigenen Zug gezogen wird; die erste
tatsächlich beschworene Kreatur ist mit diesem Seed praktisch immer
`core.ember-whelp` (2 Mana, ab Zug 2 bezahlbar) — `castCreature` ist deshalb
bewusst GENERISCH auf "irgendeine Kreatur" formuliert, nicht auf Glutpfote
festgenagelt (s.u., "Warum keine feste Zug-Zuordnung").

### Architektur: Instruktion → Aktion → Bestätigung

Jeder `TutorialStep` (`instruction`/`confirmation`: Titel+Text, `detect`:
Erkennungsfunktion, `infoOnly?`: reiner Info-Schritt ohne eigene Aktion) läuft
in `store.ts` durch einen kleinen Zustandsautomaten:

- **Aktions-Schritt, Instruktion ausstehend**: nicht-modales
  `.tutorial-instruction-banner` (`components/tutorialOverlay.ts`) — blockiert
  NICHTS (Spielbrett bleibt normal bedienbar, automatischer Bot-Zug-Loop läuft
  normal weiter), trägt aber immer einen "Schritt überspringen"-Link
  (Sicherheitsnetz, Auftrag: kein kompletter Lockout). Das erwartete Element
  (Handkarte per Definition-ID, `TUTORIAL_STEP_HAND_CARD_IDS`, oder das eigene
  Terrain, `ownUntappedTerrain`) wird per `.tutorial-glow`-Klasse (Puls-Glow-
  Animation, `style.css`) hervorgehoben — eigene, auffälligere Optik als das
  bestehende `.hinted` (das schon "laut getLegalActions aktivierbar" bedeutet).
- **Aktion erkannt → Bestätigung**: modale `.tutorial-tip-bubble` (wie zuvor,
  jetzt mit "Weiter" statt "Verstanden") — pausiert den automatischen
  Bot-Zug-Loop, bis der Nutzer sie schließt (`dismissTutorialBubble`), dann
  rückt die Sequenz einen Schritt weiter.
- **Info-Schritt**: dieselbe modale Bubble, sobald `detect(state)` erstmals
  zutrifft (z.B. `combatDamage`: `state.step === "combatDamage"`) — kein
  Aktions-/Instruktions-Zwischenschritt nötig.

**Wichtige Entwurfsentscheidung — warum die nicht-modale Instruktions-Phase
den Bot-Loop NICHT pausiert**: `declareBlock` kann laut Auftrag mehrere Züge
dauern (abhängig vom Bot-Verhalten). Würde die Instruktions-Phase den
Bot-Loop pausieren, könnte der Bot-Gegner nie angreifen (Deadlock: der Mensch
wartet auf den Bot, der Bot ist aber pausiert). Also pausiert NUR die modale
Bestätigungs-/Info-Bubble (`isTutorialModalBubbleShowing`) — kurz, vom Nutzer
selbst weggeklickt.

### Warum keine feste Zug-Zuordnung / rückwirkende Fakten-Erkennung

Mit dem festen `TUTORIAL_SEED` + der Mana-Kurve dieses Decks lässt sich NICHT
zuverlässig vorhersagen, in welcher REALEN Reihenfolge die pädagogischen
Schritte eintreten (Beispiel: `core.fire-jolt`, ein Zauberspruch, ist bereits
Zug 1 bezahlbar, bevor überhaupt eine Kreatur im Spiel ist; ob/wann der
Bot-Gegner angreift und der Mensch dadurch VOR seinem eigenen ersten Angriff
schon einmal blocken kann, hängt vom Bot-Verhalten ab). Lösung:
`recomputeTutorialProgress` (store.ts) ruft `detect` nach JEDER Aktion für
ALLE 13 Schritte auf (nicht nur den gerade aktiven) und merkt Treffer dauerhaft
in `tutorialFactsSeen`. Erreicht die Sequenz später einen Schritt, dessen Fakt
schon vorliegt (weil er "zufällig früh" eintrat), zeigt sie SOFORT dessen
Bestätigung statt erneut zu warten. Verifiziert über eine ausführliche,
lokale Mehrzug-Simulation (13/13 Schritte durchlaufen, Sieg in Zug 11, s.
Verifikation unten) — kein Dauertestfall (zu lang/nicht deterministisch genug
für CI), aber bestätigt das Entwurfsprinzip.

### Verifikation

1. **`npm run build`** (`tsc --noEmit`) und **`npm run build:ui`** (`vite
   build`) sauber.
2. **`npm test`**: 163/163 Tests grün (1 weiterhin bewusst übersprungener
   Analyse-Test unverändert) — `src/ui/__tests__/tutorial.test.ts` komplett
   neu geschrieben für die Schritt-Sequenz (echte Klicks, kein
   Store-Bypass): Start → `mulliganIntro`-Bubble → Mulligan behalten →
   `priorityIntro`-Bubble → `playTerrain`-Banner (Handkarte hervorgehoben) →
   Terrain spielen → Bestätigung → `tapForMana`-Banner (Terrain-Kachel
   hervorgehoben) → Terrain antippen → Bestätigung → `castCreature`-Banner
   erscheint tatsächlich als NÄCHSTER Schritt → "Schritt überspringen" rückt
   die Sequenz weiter (Sicherheitsnetz-Test) → Hilfe-Panel listet alle 13
   Schritte → "Zurück zum Hauptmenü".
3. **Manuelle Mehrzug-Verifikation** (temporäres, lokales Test-Skript, danach
   wieder entfernt — kein Dauertestfall, s.o.): ein Skript hat über echte
   `element.dispatchEvent`-Klicks eine komplette Partie exakt nach den
   Tutorial-eigenen Instruktionen gespielt (Terrain spielen → antippen →
   castbare Karte spielen → Ziel wählen → angreifen falls möglich → blocken
   falls möglich, sonst passen). Ergebnis: alle 13 Schritte wurden in der
   erwarteten Reihenfolge durchlaufen (`castCreature` traf auf
   `core.ember-whelp` in Zug 3, NICHT auf `core.cinder-pup`, exakt wie oben
   dokumentiert), `declareBlock` wurde beim Erreichen bereits rückwirkend als
   erledigt erkannt (der Bot-Gegner hatte schon vorher angegriffen und wurde
   geblockt), die Partie endete regulär mit Sieg für player1 in Zug 11 —
   keine Abstürze, keine Endlosschleifen.
4. **Keine Browser-/Computer-Use-Werkzeuge in dieser Session verfügbar** (wie
   in mehreren früheren Abschnitten dokumentiert) — kein visueller
   Screenshot-Vergleich der `.tutorial-glow`-Puls-Animation. Die jsdom-Klick-
   Tests + das manuelle Mehrzug-Skript verifizieren aber bereits das
   tatsächliche Verhalten (DOM-Struktur/Klassen, Klick-Ergebnisse,
   Sequenz-Fortschritt) end-to-end über echte Klicks auf das von `render()`
   erzeugte DOM.

**Ergebnis:** `src/ui/tutorialContent.ts` komplett neu (13-Schritte-Sequenz
mit `instruction`/`confirmation`/`detect` statt der alten 8 lose
`TUTORIAL_TIPS`). `src/ui/store.ts`: neuer Sequenz-Zustand
(`tutorialStepIndex`/`tutorialPhase`/`tutorialFactsSeen`/
`tutorialSequenceFinished`/`tutorialLastBuffTarget`), neue Funktionen
`getTutorialActiveStep`/`getTutorialPhase`/`isTutorialBubbleVisible`/
`dismissTutorialBubble`/`skipTutorialStep`/`getTutorialHighlight`, ersetzt
`getTutorialPendingTip`/`dismissTutorialTip`/`maybeQueueTutorialTips`.
`src/ui/components/tutorialOverlay.ts`: neue `tutorialInstructionBanner`
(nicht-modal) + `tutorialModalBubble` (ersetzt `tutorialTipBubble`),
`tutorialHelpPanel` listet jetzt `TUTORIAL_STEPS`. `src/ui/components/
cardTile.ts`/`handCard.ts`: neue `tutorialHighlighted`-Option
(`.tutorial-glow`-Klasse). `src/ui/render.ts`: Verdrahtung + Highlight-
Berechnung in `handZone`/`battlefieldZone`. `src/ui/style.css`: neue Klassen
`.tutorial-instruction-banner*`, `.tutorial-skip-btn`, `.tutorial-glow` (Puls-
Animation), `.tutorial-help-entry-confirmation`. `src/ui/__tests__/
tutorial.test.ts` komplett neu geschrieben. Keine Änderungen an `src/engine/*`,
`src/model/*`, `src/cards/*`, `src/ai/*`, `src/ui/tutorialDeck.ts` (Auftrag:
"unverändert lassen außer bei echtem Bedarf" — kein Bedarf erkannt, das
bestehende Deck deckt bereits alle sechs Kartentypen sinnvoll ab).

## Echtes Hauptmenü, Taverne-Atmosphäre, Animationen, verdeckte Gegner-Hand, Sound (v0.1.17, 2026-07-19/20)

Mit Abstand die umfangreichste Einzelsession seit dem Frontend-Start
(größtenteils in einem einzigen Commit `afae4bc "Add tavern atmosphere,
animations, opponent-facing UI fixes, and sound"`). Auftrag sinngemäß: „die
App soll sich strukturell und optisch mehr wie ein echtes Computerspiel
anfühlen, nicht wie ein Regel-Debug-Tool."

### Teil 1: Echtes Hauptmenü statt Direkteinstieg

Löst den seit v0.1.5 bestehenden Direkteinstieg in den player1-Deckbau-Screen
ab. `types.ts#AppPhase` komplett umgebaut auf vier Werte: `mainMenu` (neuer
Startzustand, `components/mainMenu.ts#mainMenuScreen`, vier Buttons „Neues
Spiel"/„Deck Builder"/„Tutorial"/„Anleitung") → `opponentSelect`
(`components/opponentSelect.ts#opponentSelectScreen`, KI-Schwierigkeit ODER
„2 Spieler"/Hotseat) → `deckbuild` (jetzt mit `mode: "newGame" | "standalone"`)
→ `playing`. Neue Store-Funktionen: `startNewGameFlow` („Neues Spiel" →
`opponentSelect`), `chooseOpponentBot(difficulty)`/`chooseOpponentHotseat`
(markieren player2 sofort als bot-gesteuert bzw. lassen ihn menschlich, führen
zu player1s Deckbau), `openDeckBuilderStandalone` (`mode: "standalone"`,
derselbe Deckbau-Screen, aber OHNE anschließende Partie-Vorbereitung — bietet
statt „Weiter"/„Spiel starten" einen „Zurück zum Hauptmenü"-Button,
`.deckbuilder-back-to-menu-btn`), `backToMainMenu` (löst `backToDeckbuilder`
ab, führt aus einer laufenden Partie IMMER zum Hauptmenü, nie mehr direkt in
den Deckbau — zusätzlich schließt es alle offenen Popover-Panels, stoppt den
Bot-Loop und setzt den Tutorial-Zustand sauber zurück, falls aktiv). Wählt der
Nutzer in `opponentSelect` eine KI-Schwierigkeit, wird player2 SOFORT (vor
player1s eigenem Deckbau, nicht erst danach wie beim bisherigen „Zufälliges
KI-Deck + weiter"-Kurzstart) als bot-gesteuert markiert — der komplette
player2-Deckbau-Screen entfällt dadurch, die Partie startet direkt, sobald
player1 bestätigt (automatisches Zufallsdeck für player2). Decklisten UND die
zuletzt gewählte Gegner-Einstellung bleiben über `backToMainMenu` hinweg
erhalten (gleiches Persistenz-Prinzip wie seit v0.1.7/v0.1.8).

Neuer vierter Hauptmenü-Punkt „Anleitung" (`components/rulesGuidePanel.ts`):
ein reines Lese-Panel (Popover-Overlay über dem Hauptmenü, kein eigener
`AppPhase`-Wert, analog zu `musicPanel.ts`) mit vier Abschnitten —
Kartentypen (Text wörtlich aus `docs/rules-engine.md` Abschnitt 1 übernommen),
Schlüsselwörter (bindet `keywordGlossaryPanel.ts#keywordGlossaryList`
eingebettet ein, keine Duplikation), Tipps & Tricks Spiel, Tipps & Tricks
Deckbau — bewusst OHNE Zeitdruck/Partie, anders als das Tutorial.

### Teil 2: Taverne-Atmosphäre + Szenen-Artwork-Integration

`docs/scene-art-brief.md` (bereits vorher als Auftragsgrundlage angelegt) ist
jetzt vollständig umgesetzt (`components/sceneArt.ts`, gleiches
Lade-/Fallback-Muster wie `cardArt.ts`, ausgeliefert über ein auf
`staticArtPlugin` verallgemeinertes `vite.config.ts` — dieselbe
Middleware+Build-Kopierschritt-Logik, die vorher nur `cardArtworkPlugin`
kannte, bedient jetzt zusätzlich `sceneArtPlugin`/`musicPlugin`/`sfxPlugin`):
- **Board-Hintergrund** (`tavern-background.png`): `initBoardBackdrop()`
  hängt ein `<img>` als Singleton an `document.body` (überlebt jeden
  `render()`-Rebuild, exakt wie `musicPlayer.ts`s `<audio>`-Element) —
  `position: fixed; inset: 0; width: 100vw; height: 100vh` macht es
  **viewport-breit**, nicht nur so breit wie `#app`/`.board`
  (`max-width: 1400px`), `z-index: -1` hält es hinter jedem normalen
  Seiteninhalt. Fehlt die Datei (Normalfall bis der Nutzer sie ablegt), bleibt
  die zuvor gebaute reine CSS-Atmosphäre (Holzmaserungs-Verlauf,
  Kerzenschein-Glow-Keyframes auf `.board` selbst) unverändert sichtbar — das
  Foto ist ein zusätzlicher, optionaler Layer, keine Ablösung.
- **Gegner-Avatare** (`avatar-<difficulty>.png`): ein großformatiges
  Charakterporträt in einer eigenen **220px-Spalte rechts neben dem
  Spielfeld** (`render.ts#opponentAvatarColumn`, `.board-opponent-avatar`),
  NICHT mehr klein inline im Spieler-Panel-Header. Nur sichtbar, wenn player2
  tatsächlich bot-gesteuert ist; ohne aktiven Bot bleibt `.board` einfach
  vollbreit (kein Layout-Loch). Fehlt die Bilddatei, entfernt sich nur das
  `<img>`, die Spalte selbst bleibt mit CSS-Fallback-Rahmen stehen. Unter
  einer Media-Query-Breakschwelle (Auftrag „auch im normalen Browserfenster
  nutzbar, nicht nur Vollbild") wird die Spalte per CSS komplett ausgeblendet
  statt das Spielfeld zu quetschen.

Zusätzlich: **Bot-Anzeigenamen** (`src/ai/difficulty.ts#BOT_DISPLAY_NAMES`:
`easy` → „Ollo Wackelhand", `medium` → „Guntram Eichenfaust", `hard` → „Silas
Kaltblick", passend zum Ton der jeweiligen Avatar-Beschreibung im Brief) —
`render.ts#playerDisplayName` zeigt diesen Namen statt der rohen `PlayerId`
in Statuszeile/Spieler-Panel/Mulligan-/Sieger-Bannern, aber NUR wenn der
jeweilige Spieler tatsächlich bot-gesteuert ist; das Ereignis-Log bleibt
bewusst bei der rohen `PlayerId` (technische Eindeutigkeit fürs Debuggen).
`docs/scene-art-brief.md` selbst war layoutseitig bereits vom Auftraggeber
aktualisiert worden (Folgeschritt-Absatz beschreibt schon die große
Porträt-Spalte statt eines kleinen Inline-Bilds) — der documenter hat bei
diesem Sweep nur den oberen „Status"-Absatz nachgezogen, der noch fälschlich
„UI-Anbindung ... bewusst noch NICHT beauftragt" behauptete.

### Teil 3: Sichtbare Übergänge statt Hard-Cut

`render()` baut das DOM weiterhin bei jeder Zustandsänderung komplett neu auf
(kein Diffing, s. „Tech-Stack-Entscheidung" oben, unverändert) — neu ist, dass
dieser Rebuild, wenn möglich, innerhalb von `document.startViewTransition()`
läuft (`render.ts#supportsViewTransitions`/`prefersReducedMotion`, defensiver
Fallback auf den bisherigen Hard-Cut bei fehlender Browser-Unterstützung, z. B.
aktuell Firefox/Safari, oder aktivem `prefers-reduced-motion: reduce`).
Einzelne Karten-Kacheln tragen zusätzlich ein `view-transition-name: card-<instanceId>`
(`cardTile.ts`/`handCard.ts`) — dieselbe Karten-Instanz „morpht" dadurch
automatisch zwischen Hand/Battlefield/Friedhof, statt nur weg- und wieder
neu eingeblendet zu werden; Bot-Züge sind dadurch als nachvollziehbare
Bewegung sichtbar statt als Snap. Bewusst NUR für Rebuilds INNERHALB einer
laufenden Partie aktiv (`render.ts#render`: sowohl der vorherige als auch der
neue `AppPhase`-Wert müssen `"playing"` sein) — der Deckbau-Screen (bis zu 300
Pool-Karten gleichzeitig) bekäme sonst bei jedem +/--Klick eine teure
Voll-Screenshot-Transition ohne erkennbaren Nutzen. `botMoveDelayMs`
(`store.ts`) wurde dabei auf 320ms angehoben (vorher niedriger) — bewusst
etwas über der View-Transition-Standarddauer (~250-260ms), damit ein Bot-
Schritt nicht mitten in der vorherigen Animation startet (der Browser bricht
eine laufende View Transition beim nächsten `startViewTransition()`-Aufruf
sofort ab). Zusätzlich: Lebenspunkte-„Puls" (`render.ts#computeLifePulse`,
reiner Anzeige-Zustand außerhalb des `GameState`) — eine kurze CSS-Animation
(`up`/`down`) auf `playerPanel`, unabhängig von der View-Transitions-
Unterstützung des Browsers, da ein reiner Zahlen-Crossfade laut Auftrag nicht
das gewünschte „spürbare Reagieren" liefert.

### Teil 4: Verdeckte Gegner-Hand

`render.ts#handZone`: JEDE Nicht-„player1"-Hand (aktuell nur player2, aber
generisch offengehalten) zeigt jetzt NIE volle Karteninformationen beim
bloßen Betrachten — nur Kartenrückseiten + Gesamtzahl
(`hiddenHandZone`/`handCardHidden`, `.hand-zone-hidden`), unabhängig davon, ob
dieser Spieler bot-gesteuert ist oder (im Hotseat-Fall) ein zweiter Mensch am
selben Bildschirm. Bewusst KEIN echtes Pass-and-Play-System (Bildschirm
umdrehen o. ä.) — außerhalb des Auftrags; ein echter zweiter Hotseat-Mensch
kann seine Hand dadurch aktuell nicht mehr aktiv anklicken/spielen (s. neue
Notiz in „Bewusste Vereinfachungen" oben). Der Cleanup-Abwurf ist bewusst VON
dieser Verdeckung ausgenommen (in `handZone` vor der Verdeckungsregel
geprüft) — sonst gäbe es für einen Hotseat-player2 keinen Weg mehr,
`hand.length > 7` aufzulösen (echter Deadlock statt nur eingeschränkter
Bedienbarkeit).

### Teil 5: Zwölf Soundeffekte

`sfxPlayer.ts` (neues Singleton-Modul, gleiches Body-Level-Prinzip wie
`sceneArt.ts`/`musicPlayer.ts`, aber pro Sound-Datei ein Vorlagen-Element, das
bei jedem `playSfx()`-Aufruf per `cloneNode()` dupliziert wird, statt ein
einziges wiederverwendetes `<audio>`-Element — mehrere Kampf-Treffer kurz
hintereinander müssen sich hörbar überlappen können). Zwölf Dateien
(`docs/sfx/`, NICHT gitignored, nur ~330 KB, `docs/sfx/SOURCES.md` mit
Quell-/Lizenznachweis, alle CC0 von freesound.org): `card-play`/`card-draw`/
`spell-cast`/`attack-swing`/`combat-hit`/`creature-death`/`life-loss`/
`life-gain`/`victory`/`defeat`/`ui-click`/`deck-shuffle`. Event-basiertes
Abspielen über `store.ts#playSfxForEvent` (übersetzt `GameEvent`s exakt
parallel zu `describeEvent`/dem Log), zusätzlich ein globaler Klick-Listener
für primäre Aktions-Buttons (`.btn-play`/`.btn-pass` → `ui-click`, bewusst
NICHT die Deckbau-Pool-+/--Buttons, würden bei ~300 Karten nur nerven).
Eigener Mute-Zustand (`store.ts#isSfxEnabled`/`toggleSfxEnabled`,
`components/sfxToggle.ts`), unabhängig vom Musik-Mute. Hintergrundmusik selbst
existierte in dieser Session zunächst nur als eine fest verdrahtete
Einzeldatei (abgelöst in v0.1.18 durch die Auto-Discovery-Playlist, s. dort).

### Teil 6: Tutorial-Fix — Hauptphase-Sperre für „Priorität passen"

Bugfix, kein neues Feature: `store.ts#getTutorialPassPriorityBlockReason`
sperrt den „Priorität passen"-Button jetzt zusätzlich während der beiden
`mainPhaseOnly`-markierten Tutorial-Schritte (`playTerrain`/`castCreature`,
`tutorialContent.ts`), SOLANGE der Spieler tatsächlich eine passende
Kandidatenaktion zur Verfügung hat (`hasPendingCandidate`, reine
`legalActions`-Auskunft) — vorher konnte man den Terrain-Legen-Schritt
versehentlich durch Priorität passen überspringen, statt der vom Tutorial
erwarteten Aktion zu folgen.

**Ergebnis:** Neue Dateien: `components/mainMenu.ts`, `components/opponentSelect.ts`,
`components/rulesGuidePanel.ts`, `components/sceneArt.ts`, `components/sfxToggle.ts`,
`sfxPlayer.ts`, `musicPlayer.ts` (Erststand, in v0.1.18 zur Playlist
ausgebaut). Geänderte Dateien: `types.ts` (`AppPhase`), `store.ts`
(Hauptmenü-Navigation, Musik-/SFX-Zustand, `playSfxForEvent`), `render.ts`
(neue Screens, `playerDisplayName`, `hiddenHandZone`, View-Transitions,
`computeLifePulse`, Avatar-Spalte), `vite.config.ts` (`staticArtPlugin`-
Verallgemeinerung + drei neue Plugin-Instanzen), `style.css` (großer Zuwachs,
s. Struktur-Tabelle oben), `.gitignore` (`docs/scene-art/`, `docs/music/`
neu, `docs/sfx/` bewusst NICHT gitignored). Neuer Test `golden-path.test.ts`
(umbenannt/angepasst). Keine Änderung an `src/engine/*`, `src/model/*`,
`src/cards/*`, `src/ai/*` (bis auf die rein kosmetische Ergänzung
`BOT_DISPLAY_NAMES` in `src/ai/difficulty.ts`, keine Verhaltensänderung der
KI selbst). **Verifikation dieses Sweeps:** gegen den tatsächlichen
Code/Tests gelesen (nicht nur aus Commit-Nachrichten übernommen) — Datei-
Existenz/Inhalt aller oben genannten neuen Module, `vite.config.ts`-Plugins,
`.gitignore`-Einträge sowie die Testdateien `golden-path.test.ts`/
`main-menu.test.ts` per `Read`/`Grep` geprüft. **`npm test`/`npm run build`
konnten in dieser documenter-Session nicht selbst ausgeführt werden** (kein
Shell-Werkzeug verfügbar) — s. „Verifikation" im v0.1.20-Abschnitt unten für
den aktuellen Gesamt-Teststand.

## Auto-Pass, Entscheidungs-Spotlight, Musik-Auto-Discovery-Playlist (v0.1.18, 2026-07-20)

Commit `9fdb742 "Add auto-discovering music playlist, auto-pass, and decision
spotlight"`. Drei voneinander unabhängige Ergänzungen, alle ohne
Engine-/Model-Änderung.

### Teil 1+2: Auto-Pass

Ziel: kein unnötiger Klick, wo `getLegalActions` ohnehin keine echte Wahl
anbietet. `store.ts#advanceAutomation` ist der gemeinsame „Nachbrenner" für
ZWEI Automatik-Mechanismen — den bereits bestehenden Bot-Zug-Loop (seit
v0.1.7, jetzt mit sichtbarer Verzögerung über `botMoveDelayMs`) UND (neu)
menschliche/Hotseat-Spieler ohne echte Wahl: `autoResolvableActionFor(player)`
liefert genau dann eine Aktion, wenn (a) bei Priority
`hasRealPriorityChoice(player)` `false` ist (s.u.) → automatisches
`passPriority`, oder (b) beim erzwungenen Kampf-Deklarationsschritt
(`declareAttackers`/`declareBlockers`, kein Priority-Fenster)
`getLegalActions` GENAU EINEN Kandidaten liefert — die leere Deklaration →
automatisch `{ attackers: [] }`/`{ blocks: [] }`. Liefert die Engine dagegen
GAR KEINEN Kandidaten (guardian-Mehrfachblock-Sonderfall, kombinatorisch nicht
enumeriert), wird bewusst NICHT automatisch entschieden — eine echte, nur
nicht enumerierbare Entscheidung. `hasRealPriorityChoice`/
`isRealPriorityCandidate` schließen `passPriority`/`concede` von „echter Wahl"
aus (Erststand dieser Version zählte reine Mana-Fähigkeiten noch fälschlich
mit, s. v0.1.19-Bugfix unten). Eigene Sicherheitszähler
(`MAX_AUTO_HUMAN_ACTIONS_PER_CYCLE = 1000`, analog zum bestehenden
Bot-Aktionslimit) verhindern eine denkbare Endlosschleife, falls die
Engine-Anfragen je in einen Zustand gerieten, der nie beim Menschen landet.
Der bestehende Tutorial-Block (`getTutorialPassPriorityBlockReason`, s.
v0.1.17 Teil 6) bleibt unangetastet wirksam, da er in genau dem Fall bereits
`hasRealPriorityChoice → true` erzeugt (keine doppelte Sperrlogik nötig).

### Teil 3: Entscheidungs-Spotlight

Reaktion auf Nutzer-Feedback anhand eines Screenshots: der bisherige kleine
„Priorität passen"-Button war zu unauffällig für einen ECHTEN
Entscheidungsmoment. `components/decisionSpotlight.ts#decisionSpotlightBanner`
— ein auffälliges, aber bewusst NICHT-blockierendes Banner (kein Backdrop,
kein Modal, verdeckt/sperrt das Board nicht), erscheint über
`render.ts#decisionSpotlightPlayer(state, mode)` GENAU DANN, wenn ein
NICHT-bot-gesteuerter Spieler bei Priority eine echte Wahl hat (Auto-Pass
greift bewusst nicht) UND gerade kein anderer Interaktions-Flow
(Targeting/X-Eingabe/Modus-Wahl/Kampf-Deklaration/Abwurf) bereits läuft. Der
„Überspringen"-Button im Banner dispatcht exakt dieselbe `passPriority`-Aktion
wie der bestehende Statuszeilen-Button — kein zweiter Mechanismus, nur eine
auffälligere zusätzliche Einladung.

### Teil 4: Musik-Auto-Discovery-Playlist

Löst die in v0.1.17 eingeführte fest verdrahtete Einzeldatei ab. Titel liegen
weiterhin unter `docs/music/` (gitignored, lokal beim Nutzer), aber
`vite.config.ts#musicIndexPlugin` liefert jetzt ein Live-Verzeichnis-Listing
unter `/music/index.json` (Dev: bei jedem Request neu; Build: ein Snapshot
zum Build-Zeitpunkt) — `musicPlayer.ts` fragt das einmalig beim Init ab und
spiegelt es über `store.ts#setMusicTracks` in den Store. Neues
`components/musicPanel.ts` (löst einen einfacheren Mute-Button ab): (1)
An/Aus, (2) klickbare Titel-Liste (aktueller Titel hervorgehoben), (3)
Wiederholungsmodus — `store.ts#MusicRepeatMode` `"track"` (aktuellen Titel in
Dauerschleife, natives `loop`-Attribut) vs. `"playlist"` (alle Titel der
Reihe nach, `ended`-Listener + `advanceToNextMusicTrack()` mit Wrap-Around
zum ersten Titel). `applyPlaybackState()` reassigniert `el.src` nur bei einer
TATSÄCHLICHEN Titeländerung (nicht bei jeder Store-Änderung, sonst würde jeder
Spielzug den laufenden Titel neu starten).

**Ergebnis:** Neue Dateien: `components/decisionSpotlight.ts`,
`components/musicPanel.ts` (löst einen vorherigen einfacheren Musik-Toggle
ab). Geänderte Dateien: `store.ts` (Auto-Pass-Kern, Musik-Playlist-Zustand),
`render.ts` (`decidingPlayer`/`decisionSpotlightPlayer`,
`hasRealDeclareAttackersChoice`/`hasRealDeclareBlockersChoice`,
`.player-area-deciding`-Rahmen), `musicPlayer.ts` (Auto-Discovery statt
Einzeldatei), `vite.config.ts` (`musicIndexPlugin`), `style.css`
(`.decision-spotlight-*`, `.music-panel-*`). Keine Änderung an
`src/engine/*`/`src/model/*`/`src/cards/*`/`src/ai/*`. **Verifikation:**
Code/Kommentare in `store.ts`/`render.ts` gegen die oben beschriebenen
Mechanismen gelesen (Funktionssignaturen, Guard-Zähler, Kommentare
bestätigen die Beschreibung); `npm test`/`npm run build` in dieser
documenter-Session nicht selbst ausführbar (kein Shell-Werkzeug) — s.
v0.1.20-Verifikation unten für den aktuellen Gesamt-Teststand.

## Bugfix: Mana-Fähigkeiten fälschlich als „echte Entscheidung" gezählt (v0.1.19, 2026-07-20)

Commit `c44f033 "Fix mana-ability false-positive in auto-pass/spotlight
detection"`. `store.ts#isRealPriorityCandidate` (s. v0.1.18) zählte einen
`activateAbility`-Kandidaten auf einer Ability mit `isManaAbility: true`
(i. d. R. das kostenlose Antippen eines Terrains fürs Mana) bislang wie jeden
anderen Kandidaten als „echte Wahl". Terrains bieten diese Fähigkeit aber
praktisch IMMER an, solange sie ungetappt sind — unabhängig davon, ob der
Spieler gerade überhaupt etwas hat, wofür sich das Mana lohnen würde. Zwei
sichtbare Symptome: Auto-Pass griff dadurch so gut wie nie (der Spieler hatte
ja fast immer ein antippbares Terrain), und das Spotlight-Banner erschien
praktisch ständig, auch wenn faktisch nichts zu tun war. Fix: `isRealPriorityCandidate`
prüft bei `activateAbility`-Kandidaten jetzt zusätzlich `ability.isManaAbility`
und schließt reine Mana-Fähigkeiten von der „echte Wahl"-Zählung aus. Das
reine Antippen fürs Mana bleibt weiterhin normal manuell klickbar (z. B. um
Mana für später im selben Schritt vorzuhalten) — es zählt nur nicht MEHR
ALLEIN als „hier gibt's was zu entscheiden"; hat der Spieler zusätzlich etwas
anderes Sinnvolles (bezahlbarer Zauber, Nicht-Mana-Fähigkeit, ausspielbares
Terrain), zählt das weiterhin ganz normal als echte Wahl. **Ergebnis:**
Ein-Funktions-Bugfix in `store.ts`, keine neuen Dateien, keine
Engine-/Model-Änderung.

## Deck speichern/laden (benannte Slots) + Deck-Analyse-Panel + „Deck leeren" (v0.1.20, 2026-07-20, Commit `9b81338`)

Drei additive Ergänzungen im Deckbau-Screen, Auftrag sinngemäß „Deckbau soll
sich mehr wie ein echtes Deckbau-Tool anfühlen". **Zum Zeitpunkt des
ursprünglichen v0.1.20-Sweeps noch nicht committet** — beim darauffolgenden
v0.1.21-Sweep bestätigt: `git log`/`git status` zeigen den Schritt jetzt als
Commit `9b81338 "Add main menu, guide screen, deck save/analysis, and
clear-deck button"` (Arbeitsverzeichnis clean).

### Teil 1: Benannte Deck-Speicherfunktion

`store.ts#SavedDeck` (`id`/`name`/`description?`/`decklist`/`savedAt`-ISO-
Zeitstempel) — ein neues, von der bisherigen „zuletzt bestätigte
Deckliste"-Persistenz (v0.1.8, weiterhin unverändert vorhanden) UNABHÄNGIGES
zweites Persistenzmodell in `localStorage`
(`deckbuilder1.savedDecks`, defensiv try/catch wie überall im Projekt).
`saveDeckAs(name, description, decklist)`: leerer/nur-Whitespace-Name wird
abgelehnt (`undefined`); existiert bereits ein Deck mit demselben
(getrimmten, groß-/kleinschreibungs-unabhängigen) Namen, wird DESSEN Eintrag
überschrieben (gleiche `id`, neuer Zeitstempel) statt einen zweiten
gleichnamigen Eintrag anzulegen — kein Bestätigungsdialog nötig, der
Rückgabewert `overwritten` erlaubt dem UI einen passenden Hinweistext.
`loadSavedDeck(player, id)`/`deleteSavedDeck(id)` komplettieren die
CRUD-Operationen. UI: `components/savedDecksPanel.ts` — `saveDeckForm`
(Name-Pflichtfeld + optionales Beschreibungsfeld, KEIN natives
`window.prompt()`, Formular-Entwurf in modul-scoped Variablen wie
`deckBuilder.ts#searchText`, damit Tastatureingaben nicht bei jedem Zeichen
einen vollen Rerender/Fokusverlust auslösen) und `loadDeckPanel` (Liste aller
gespeicherten Decks, neueste zuerst, mit Kartenanzahl/Speicherdatum sowie
Laden-/Löschen-Button je Eintrag) — strukturell an `musicPanel.ts`/
`keywordGlossaryPanel.ts` angelehnt (Backdrop-Panel, Klick auf Backdrop
schließt, Klick ins Panel propagiert nicht weiter). Verfügbar sowohl im
normalen Deckbau-Ablauf als auch im eigenständigen „Deck Builder"-Modus
(`mode: "standalone"`, seit v0.1.17) — für Letzteren war das laut
`docs/README.md`-Blurb der eigentliche Hauptzweck.

### Teil 2: Deck-Analyse-Panel

`components/deckAnalysis.ts#deckAnalysisPanel` — ein einklappbarer Bereich
im Deckbau-Screen (`store.ts#isDeckAnalysisPanelOpen`/`toggleDeckAnalysisPanel`,
standardmäßig aufgeklappt, bewusst OHNE `localStorage`-Persistenz, reine
Layout-Bequemlichkeit) mit drei Unteransichten, alle live bei jedem
Voll-Rerender (also bei jedem +/--Klick) aus `pool` + `decklist` neu
abgeleitet, kein eigener State:
- **Mana-Kurve**: Buckets 0-6+ nach Gesamt-Manawert (`generic` + Summe aller
  Farbwerte). Terrains (kein `cost`-Feld) fließen bewusst NICHT in die Kurve
  ein (würden sie mit reiner Terrain-Anzahl verfälschen), tauchen aber in
  Typ-/Farbverteilung auf. Karten mit X-Kosten landen mit ihrem FIXEN Anteil
  im Bucket UND werden zusätzlich separat gezählt/ausgewiesen (`xCostCount`,
  X selbst ist erst beim Casten bekannt).
- **Farbverteilung**: nutzt `cardInfo.ts#dominantColorKey`/`COLOR_LABEL`
  (keine eigene Farblogik) + „Farblos" für Terrains/farblose Karten.
- **Typverteilung**: alle fünf `CardType`-Werte in fester Anzeige-Reihenfolge
  (konsistent mit den Filter-Optionen im Deckbau-Screen selbst).

Reine CSS-Balken statt Chart-Bibliothek (bewusst keine zusätzliche
Frontend-Abhängigkeit für dieses Hobbyprojekt).

### Teil 3: „Deck leeren"

Ein zusätzlicher Button im Deckbau-Screen (`.deckbuilder-clear-btn`, neben
„Zufällig füllen") — setzt die aktuelle Deckliste auf `{}` zurück, reine
UI-Bequemlichkeit ohne eigene Store-Funktion (nutzt vermutlich das bestehende
`setDecklist(player, {})`, s. `deckBuilder.ts`).

**Ergebnis (seit dem v0.1.21-Sweep bestätigt als Commit `9b81338`):** Neue Dateien:
`components/savedDecksPanel.ts`, `components/deckAnalysis.ts`. Geänderte
Dateien: `components/deckBuilder.ts` (Einbindung aller drei Bausteine),
`store.ts` (`SavedDeck`-Persistenz, Panel-Zustände), `style.css`
(`.deckbuilder-save-deck-btn`/`.deckbuilder-load-deck-btn`/`.save-deck-*`/
`.load-deck-*`/`.deckbuilder-analysis*`/`.deck-analysis-*`/
`.deckbuilder-clear-btn`). Keine Änderung an `src/engine/*`/`src/model/*`/
`src/cards/*`/`src/ai/*`. Die neue Store-Funktionalität wird bereits vom
neuen `main-menu.test.ts` (v0.1.17-Testdatei) mitverifiziert (dessen zweiter
Testfall speichert ein Deck über `saveDeckForm` und prüft
`listSavedDecks()`), ein GEZIELTER Test für Laden/Löschen/Überschreiben sowie
für die Deck-Analyse-Anzeige selbst fehlt noch (s. „Nächste Schritte" unten).

**Verifikation dieses Sweeps:** Alle Behauptungen oben direkt gegen den
Code gelesen (`Read`/`Grep`, nicht aus einer Fertigstellungs-Nachricht
übernommen) — `store.ts#SavedDeck`/`saveDeckAs`/`loadSavedDeck`/
`deleteSavedDeck`/`listSavedDecks`/`toggleSaveDeckForm`/`toggleLoadDeckPanel`/
`isDeckAnalysisPanelOpen`/`toggleDeckAnalysisPanel` sowie
`components/savedDecksPanel.ts`/`components/deckAnalysis.ts` vollständig
gelesen; `deckBuilder.ts`-Verdrahtung („Deck leeren"-Button) per Grep
bestätigt. **`npm test`/`npm run build` konnten in dieser documenter-Session
NICHT selbst ausgeführt werden** (kein Shell-Werkzeug verfügbar) — Testzahl
per Grep über `it(`/`test(`-Vorkommen plausibilisiert: Engine unverändert bei
**130** (s. `docs/engine-status.md`), UI-Testdateien (`src/ui/__tests__/*.test.ts`)
liefern **19** einzeln benannte Fälle über 12 Dateien (`golden-path.test.ts` 2,
`main-menu.test.ts` 3, `rules-guide.test.ts` 1, `deck-persistence.test.ts` 3,
`concede.test.ts` 2, `keyword-glossary.test.ts` 2, `tutorial.test.ts` 1,
`mulligan.test.ts` 1, `modal-effects.test.ts` 1, `x-cost-ability.test.ts` 1,
`vs-bot.test.ts` 1, `vs-bot-difficulty.test.ts` 1) — ein tatsächlicher
`npm test`-Lauf zur Bestätigung steht noch aus, ebenso eine echte
Browser-/Screenshot-Verifikation der visuellen Änderungen (Taverne-
Hintergrund, Avatar-Spalte, View-Transitions-Animationen, Spotlight-Banner) —
in dieser Session waren keine Browser-/Computer-Use-Werkzeuge verfügbar.

## Kuratierte KI-Archetyp-Decks statt Zufalls-Fill (v0.1.21, 2026-07-20, Commit `5654ec1`)

Auftrag: der Bot-Gegner sollte kein reines 5-Farben-Zufallsdeck mehr spielen,
sondern eines von mehreren thematisch konsistenten, per Hand kuratierten
Archetyp-Decks — überwiegend Zweifarben-Kombinationen, eine bewusste
Einfarb-Ausnahme.

### Neue Datei: `src/ui/aiDecks.ts`

Reine Datendatei, keine Engine-/Store-Logik. Sieben Konstanten
(`AI_DECK_FLAME_WILD_AGGRO`, `AI_DECK_TIDE_LIGHT_CONTROL`,
`AI_DECK_FLAME_VOID_SACRIFICE`, `AI_DECK_WILD_LIGHT_MIDRANGE`,
`AI_DECK_VOID_WILD_ATTRITION`, `AI_DECK_TIDE_VOID_CONTROL`,
`AI_DECK_MONO_FLAME_AGGRO`), jeweils `Record<Karten-ID, Kopienzahl>` im
gleichen Format wie das bestehende `tutorialDeck.ts` (Kartenpool-IDs, keine
Engine-Objekte). Sechs der zehn möglichen Zweifarben-Paare wurden bewusst
ausgewählt (die mit der klarsten mechanischen Synergie im tatsächlichen
Pool: flame-wild, tide-light, flame-void, wild-light, void-wild, tide-void
— flame-tide/flame-light/wild-tide/light-void wurden geprüft, aber
ausgelassen), dazu eine Mono-flame-Ausnahme („Reiner Zorn"). Alle Decks
folgen dem Kurvenprinzip echter Deckbau-Praxis (3-4 Kopien der
Schlüsselkarten statt „1× von allem" wie im minimalistischen Tutorial-Deck),
Terrainanteil pro Deck 18-22 Karten (kein 4×-Copy-Limit, da
`deckValidation.ts#MAX_COPIES_NON_TERRAIN` für Terrains ohnehin nicht gilt).
`AI_DECKS` bündelt alle sieben Einträge mit Anzeigename + Kurzbeschreibung;
`pickRandomAiDeck()` gibt **bewusst nur die reine Decklist zurück, nicht den
Namen/die Beschreibung** — die Auswahl-Funktion macht es damit für Aufrufer
strukturell unmöglich, den Archetyp-Namen versehentlich irgendwo anzuzeigen
(bewusste Design-Entscheidung: der Bot-Archetyp soll ausschließlich durchs
tatsächliche Spielen entdeckt werden, kein Log-Eintrag/Banner dazu).

### Verdrahtung in `render.ts`

Beide Stellen, an denen bisher automatisch ein Deck für einen
bot-gesteuerten Gegner gebaut wurde, rufen jetzt `pickRandomAiDeck()` statt
`buildDemoDeck(pool)` auf:
- `deckBuilderScreen`-`onConfirm` (Hauptmenü-„Neues Spiel"-Flow: sobald
  Spieler 1 bestätigt und Spieler 2 bot-gesteuert ist, wird dessen
  Deckbau-Screen komplett übersprungen).
- `deckBuilderScreen`-`onAiQuickstart` (der ältere „Zufälliges KI-Deck +
  weiter"-Kurzstart aus v0.1.7, weiterhin im normalen Deckbau-Screen von
  Spieler 2 erreichbar).

`buildDemoDeck` (`deck.ts`) selbst ist **unverändert** und bedient weiterhin
ausschließlich den „Zufällig füllen"-Button des MENSCHLICHEN Deckbaus (anderer
Anwendungsfall, andere Zielgruppe: der Mensch profitiert von echtem Zufall
über den ganzen Pool, der Bot von einem thematisch stimmigen, spielbaren
Deck). Keine Änderung an `types.ts`/`store.ts` nötig — `pickRandomAiDeck()`
wird direkt und zustandslos aus `render.ts` aufgerufen.

### Verifikation dieses Sweeps (gegen den tatsächlichen Code, nicht nur die
Fertigstellungs-Nachricht übernommen)

- **Kartenzahl je Deck:** alle sieben `Record`-Objekte in `aiDecks.ts`
  vollständig gelesen und die Kopienzahlen von Hand aufsummiert — alle
  sieben Decks landen exakt bei **60 Karten** (z. B. Flame-Wild-Aggro:
  20 Flame-Einheiten + 11 Wild-Einheiten + 9 Zauber + 20 Terrains = 60;
  Mono-Flame: 29 Einheiten + 12 Zauber + 19 Terrains = 60; alle anderen
  fünf Decks ebenso nachgerechnet, keine Abweichung gefunden).
- **Max-Kopien-Regel:** höchste Nicht-Terrain-Kopienzahl über alle sieben
  Decks ist 4 (`core.cinderborn-raider`/`core.wildfire-boar`/`core.fire-jolt`/
  `core.tidal-rebuke`/mehrere Mono-Flame-Karten) — konsistent mit
  `deckValidation.ts#MAX_COPIES_NON_TERRAIN`, keine Karte überschreitet das
  Limit.
- **Karten-IDs real:** per `Grep` gegen `src/cards/starter-set.ts`
  stichprobenartig 17 der selteneren/ungewöhnlicheren IDs aus allen sieben
  Decks geprüft (u. a. `core.hollowmaw-devourer`, `core.void-marshal`,
  `core.gravebound-warden`, `core.grimspawn-channeler`,
  `core.tideshard-rogue`, `core.silence-ban`, `core.rootbane-wither`,
  `core.tidal-insight`) — alle vorhanden, keine Tippfehler/erfundenen IDs
  gefunden.
- **`render.ts`-Verdrahtung:** per `Grep` bestätigt, dass `pickRandomAiDeck`
  importiert und an exakt den beiden oben genannten Stellen anstelle von
  `buildDemoDeck` aufgerufen wird, inklusive der dortigen Code-Kommentare,
  die die Design-Entscheidung „Archetyp-Name bleibt verborgen" korrekt
  wiedergeben.
- **Nicht selbst nachvollzogen:** ein echter `npm test`/`npm run
  build`-Lauf sowie das im Auftrag erwähnte 14-Züge-Browser-Testspiel
  standen dieser documenter-Session nicht zur Verfügung (kein Shell-/
  Computer-Use-Werkzeug) — die Verifikation oben stützt sich ausschließlich
  auf direkte Code-Lektüre (`Read`/`Grep`) plus manuelles Nachrechnen der
  Kartenzahlen, nicht auf einen ausgeführten Test oder Screenshot. Keine
  Abweichung zur Auftragsbeschreibung gefunden.

**Ergebnis:** Neue Datei `src/ui/aiDecks.ts` (reine Daten, 7 Decklisten +
`pickRandomAiDeck()`). Geänderte Datei: `src/ui/render.ts` (zwei Aufrufstellen
umgestellt). Keine Änderung an `src/engine/*`/`src/model/*`/`src/cards/*`/
`src/ai/*`/`store.ts`/`types.ts`. Kein neuer Karteninhalt — die Decks sind
reine Zusammenstellungen aus bereits existierenden, in
`docs/cards/starter-set.md` dokumentierten Karten, daher keine Änderung an
diesem Dokument nötig.

## Zug-Flow-Spalte statt Status-Text + Aktiver-Spieler-Avatar (v0.1.22, 2026-07-20)

Auftrag: die Zug-/Step-Info aus der `.status-bar` sollte stattdessen rechts
neben dem Spielfeld erscheinen — unter dem Avatar — als klar lesbarer Flow
(welche Phasen gibt es, wo stehen wir, was kommt als nächstes), statt als
reiner Fließtext. Zusätzlich sollte der Avatar in dieser Spalte, wenn der
jeweilige Spieler dran ist, den handelnden Spieler zeigen (Mensch vs. KI)
statt immer nur das statische KI-Porträt.

### Neue Datei: `components/turnFlowPanel.ts`

Reine Präsentationskomponente (`turnFlowPanel(props)`), bekommt bereits
fertig formatierte Strings statt selbst `PlayerId`s aufzulösen — kein
Import-Zyklus mit `render.ts` nötig. Fasst die 12 rohen `TurnStep`-Werte
(game-state.ts) zu 6 Phasen zusammen (Vorbereitung, Ziehen, Hauptphase 1,
Kampf, Hauptphase 2, Ende) und rendert sie als vertikale Schritt-Kette
(`<ol class="turn-flow-track">`, CSS-Stepper-Muster mit Punkt + Verbindungs-
linie je Knoten): abgeschlossene Phasen gedimmt/grünlich, die aktuelle
hervorgehoben (inkl. Detail-Tag mit dem exakten Rohschritt, z.B. "main1"
innerhalb der "Hauptphase 1"-Phase, bzw. "Angreifer erklären" innerhalb von
"Kampf"), kommende neutral/blass. Darunter eine "Als nächstes: ..."-Zeile
sowie Zugnummer/aktiver Spieler/Priority (identischer Text wie zuvor in
`statusBar`, nur hierher verschoben).

### Test-Haken statt Layout-Kopplung

Fünf `data-testid`s (`turn-flow-panel`, `turn-flow-turn-number`,
`turn-flow-current-step`, `turn-flow-next-step`, `turn-flow-active-player`,
`turn-flow-priority`) — Tests pollen darüber, nicht über die CSS-Klassen der
Flow-Knoten. `golden-path.test.ts` wurde entsprechend umgestellt (vorher
`queryOne(root, ".status-bar").textContent.includes("Step: main1")`, jetzt
`queryOne(root, '[data-testid="turn-flow-current-step"]').textContent.includes("main1")`).
`tutorial.test.ts`/`vs-bot.test.ts`/`keyword-glossary.test.ts` prüfen nur
noch, dass `.status-bar` weiterhin existiert (sie enthält weiterhin die
Aktions-/Utility-Buttons) — kein weiterer Anpassungsbedarf, da sie nie den
Step-Text daraus gelesen haben. `mulligan.test.ts`/`x-cost-ability.test.ts`/
`modal-effects.test.ts`/`deck-persistence.test.ts` geprüft: keine Abhängigkeit
von `.status-bar`-Textinhalt oder der rechten Avatar-Spalte gefunden, keine
Änderung nötig.

### Aktiver-Spieler-Avatar (`render.ts#turnFlowColumn`, vormals `opponentAvatarColumn`)

Die rechte Board-Spalte wird jetzt IMMER gerendert (vorher nur, wenn player2
bot-gesteuert war) — sie trägt seit diesem Auftrag funktionale Info, nicht
mehr nur Deko. Das Porträt darin folgt `state.activePlayer` ("wer ist dran"),
bewusst NICHT `state.priorityPlayer`: ist der aktive Spieler bot-gesteuert,
unverändert `sceneArt.ts#botAvatarImg(difficulty)`; ist er menschlich, der
neue `sceneArt.ts#humanAvatarPlaceholder(displayName)` — ein reiner
CSS-Platzhalter (Initiale + Anzeigename im Taverne-Look), da es aktuell
**kein generiertes Bild-Asset für menschliche Spieler gibt** (bewusst als
Platzhalter markiert, s. Dateikommentar in `sceneArt.ts`, für ein künftiges
Bild-Asset vorgesehen). Im reinen Hotseat wechselt der Platzhalter
entsprechend zwischen "player1"/"player2".

### CSS-Umbau (`style.css`)

`.board-opponent-avatar` (bisher zugleich äußerer Flex-Item UND Avatar-Box)
aufgeteilt in `.board-turn-flow-column` (äußerer 220px-Wrapper, `display:
flex; flex-direction: column`, enthält Avatar-Box + `.turn-flow-panel`
übereinander) und `.board-active-avatar` (nur noch die quadratische
Avatar-Box selbst). Die `max-width: 900px`-Media-Query blendet die Spalte
NICHT mehr komplett aus (das war vertretbar, solange sie rein dekorativ war
— jetzt würde das die Zug-Info verstecken), sondern stapelt `.board-row` auf
Spalten-Layout und ordnet Avatar (klein, 96px) + Flow-Panel innerhalb der
Spalte nebeneinander an, statt übereinander.

### Verifikation

`npm test`: 167/167 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test, s. bestehender `color-balance.analysis.test.ts`-Skip). `npm run
build` (`tsc --noEmit`) sowie zusätzlich `npm run build:ui` (`vite build`,
nicht im `build`-Skript enthalten, aber zur Sicherheit separat ausgeführt)
beide fehlerfrei. Echte Browser-/Screenshot-Verifikation der neuen Flow-Kette
und des Menschen-Platzhalters steht aus — in dieser Session stand kein
Browser-/Computer-Use-Werkzeug zur Verfügung (nur Code-Lektüre + jsdom-Tests,
gleiche Einschränkung wie in mehreren vorherigen Sessions, s. Punkt 15/16
unten).

**Ergebnis:** Neue Datei `src/ui/components/turnFlowPanel.ts`. Geänderte
Dateien: `src/ui/render.ts` (Buttons/Info-Trennung in `statusBar`,
`opponentAvatarColumn` → `turnFlowColumn`, immer gerendert),
`src/ui/components/sceneArt.ts` (neu: `humanAvatarPlaceholder`),
`src/ui/style.css` (Avatar-Spalte aufgeteilt, neue `.turn-flow-*`-Regeln,
Media-Query stapelt statt auszublenden), `src/ui/__tests__/golden-path.test.ts`
(Step-Polling auf neuen `data-testid` umgestellt). Keine Änderung an
`src/engine/*`/`src/model/*`/`src/ai/*` — reines Frontend, keine neue
Spiellogik.

## Bot-Zug-Nachvollziehbarkeit: angereichertes Event-Log + visuelles Action-Glow (v0.1.23, 2026-07-21)

Nutzer-Auftrag (wörtlich): "ich denke, wir brauchen noch ein wenig mehr
'nachvollziehbarkeit' im rahmen der KI spielzüge. so dass der spieler klarer
geführt sieht: was tut der gegner jetzt (auch visuell, eine karte wird
gelegt, es wird getappt usw)". Reines Frontend, keine Engine-/Model-Änderung —
alle benötigten `GameEvent`-Felder (`cardInstanceId`, `sourceInstanceId`,
`instanceId`, `to`, ...) existierten bereits, wurden von `describeEvent` nur
nicht genutzt.

### Log-Text angereichert (`store.ts#describeEvent`)

- `spellCast`: nennt jetzt den Kartennamen + (falls auflösbar) den
  Controller, z.B. `player2 castet Feuerstoß (Stack)` statt vorher nur
  `Karte gecastet (Stack)`.
- `abilityActivated`: nennt die Quellkarte + Controller, z.B.
  `player2 aktiviert eine Fähigkeit von Aschfall-Idol`.
- `triggerFired`: nennt die Quellkarte, z.B.
  `Ausgelöste Fähigkeit von Aschanspruch-Schrein`.
- `damageDealt`: nennt jetzt das Ziel (Kreaturname via `cardDef` oder
  `PlayerId`), z.B. `2 Schaden an Sonnenschwester` statt nur `2 Schaden an
  card17`.
- `zoneChanged`: NEU, aber bewusst nur für den Sonderfall Hand→Battlefield
  (Terrains — Zauber/Kreaturen laufen über den Stack, `from: "stack"`, nicht
  `"hand"`), z.B. `player2 spielt Flammenkuppe`. Alle anderen Zonenwechsel
  bleiben unbehandelt (`undefined`), sonst Duplikate mit
  `stackObjectResolved`/`unitDied`.
- Bewusst UNVERÄNDERT: `cardDrawn` nennt weiterhin NICHT die gezogene Karte
  (Informationsleck über die verdeckte Gegner-Hand wäre kein Feature).
  `permanentTapped`/`permanentUntapped`/`countersChanged` bekommen weiterhin
  KEINE eigene Log-Zeile (Spam-Vermeidung bei jedem einzelnen Mana-Tap) —
  stattdessen rein visuell über das Glow-Highlight (s.u.) sichtbar.
- Neue kleine Hilfsfunktionen `cardNameFor`/`controllerOf`/
  `describeDamageTarget` (defensiv: `cardNameFor` fängt eine evtl.
  `cardDef`-Exception ab und liefert `"eine Karte"`, falls eine InstanceId
  zwischenzeitlich endgültig verschwunden ist, z.B. ein per
  `removeTokenPermanently` gelöschter Token).

### Neuer transienter UI-Zustand: `recentActionInstanceIds`

`store.ts` hält jetzt eine Menge von InstanceIds, die "gerade eben" von
einem Event betroffen waren (`spellCast`→`cardInstanceId`,
`abilityActivated`/`triggerFired`→`sourceInstanceId`,
`permanentTapped`→`instanceId`, `zoneChanged` Hand→Battlefield→
`cardInstanceId` — bewusst diese enge Auswahl, nicht z.B. `damageDealt`,
um das Board nicht bei jedem Event aufblitzen zu lassen), exponiert über
`getRecentActionInstanceIds()`. Läuft für BEIDE Spieler gleich (kein
bot-spezifischer Mechanismus). `markRecentAction` leert die Menge
automatisch nach `RECENT_ACTION_GLOW_MS` (1200ms) via `setTimeout` +
`notify()`, statt bis zum nächsten Event stehen zu bleiben.
`resetRecentActionGlow()` wird von `initGame()` aufgerufen — InstanceIds
starten pro Partie neu bei `"card1"` (`engine/ids.ts#nextInstanceId`), eine
stehengebliebene alte Glow-Anzeige der VORHERIGEN Partie könnte sonst in der
neuen zufällig eine unbeteiligte Karte treffen.

### Refactoring: `processEvents` statt vierfach dupliziertem Event-Loop

Die vier fast identischen `for (const e of events) { describeEvent + Log-Push
+ playSfxForEvent }`-Schleifen an den vier Aufrufstellen (`initGame`,
`dispatch`, `runBotStep`, `applyAutomaticAction`) wurden zu einer
gemeinsamen `processEvents(events, opts)` zusammengefasst, die zusätzlich
`collectGlowInstanceIds` aufruft und am Ende `markRecentAction` — vermeidet,
dass ein künftiges Verhalten nur an drei von vier Stellen ergänzt wird.

### Visuelle Hervorhebung (`render.ts`, `components/stackPanel.ts`, `style.css`)

Neue Klasse `.action-glow` (eigene grüne `--good`-Optik + einmalige
`action-glow-fade`-Animation, KEIN `infinite`-Puls) — bewusst NICHT
`.tutorial-glow` wiederverwendet (semantisch anderer Bedeutung: "das hier als
Nächstes tun" vs. "das ist GERADE passiert", könnten theoretisch gleichzeitig
an derselben Karte aktiv sein). Zwei Anwendungsstellen:

- `render.ts#battlefieldZone`: NACHTRÄGLICH per `classList.add` auf die
  bereits gebauten `tiles`-Elemente angewandt (Index-Abgleich mit
  `battlefield`-Array), statt als weitere `cardTile()`-Option an jeder der
  ~8 Rückgabestellen der Funktion — vermeidet, dass eine davon künftig
  vergessen wird.
- `components/stackPanel.ts`: neue Option `highlightedInstanceIds` — hebt
  die Stack-Zeile eines gerade gecasteten Zaubers/aktivierten Fähigkeit/
  Triggers hervor, während die Karte selbst noch auf dem Stack liegt (zu
  diesem Zeitpunkt noch nicht auf dem Battlefield, `.action-glow` auf einer
  `cardTile` würde also noch nicht greifen).

Handzone bewusst NICHT angefasst — sobald ein Event mit InstanceId-Bezug
feuert, hat die betroffene Karte die Hand i.d.R. bereits verlassen (Stack
oder Battlefield).

### Verifikation

`npm test`: 167/167 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test). `npm run build` (`tsc --noEmit`) sowie zusätzlich `npm run
build:ui` (`vite build`) beide fehlerfrei. Kein bestehender Test hing an den
alten Log-Texten (per Grep geprüft: keine Treffer für "Karte gecastet"/
"Fähigkeit aktiviert"/"Getriggerte Fähigkeit ausgelöst" außerhalb der
geänderten Zeile selbst). Echte Browser-/Screenshot-Verifikation der
Glow-Animation steht aus — kein Browser-/Computer-Use-Werkzeug in dieser
Session verfügbar (nur Code-Lektüre + `tsc`/`vitest`/`vite build`, gleiche
Einschränkung wie in mehreren vorherigen Sessions).

**Ergebnis:** Geänderte Dateien: `src/ui/store.ts` (angereicherte
`describeEvent`-Fälle, neue `cardNameFor`/`controllerOf`/
`describeDamageTarget`/`collectGlowInstanceIds`/`processEvents`/
`markRecentAction`/`resetRecentActionGlow`/`getRecentActionInstanceIds`,
vier Aufrufstellen auf `processEvents` umgestellt), `src/ui/render.ts`
(`battlefieldZone` wendet `.action-glow` nachträglich an, `stackPanelOptions`
reicht `highlightedInstanceIds` durch, neuer Import
`getRecentActionInstanceIds`), `src/ui/components/stackPanel.ts` (neue
Option `highlightedInstanceIds`, `.action-glow`-Klasse auf `stack-row`),
`src/ui/style.css` (neue `.action-glow`/`@keyframes action-glow-fade`-Regeln).
Keine Änderung an `src/engine/*`/`src/model/*`/`src/ai/*` — reines Frontend,
keine neue Spiellogik, kein Kartenbalancing.

## Battlefields grenzen direkt aneinander, KI-Hand wandert nach unten (v0.1.24, 2026-07-21)

Nutzer-Auftrag (wörtlich): "das 'battlefield' von spieler 1 und spieler 2
sollte quasi aneinander stoßen, denn dort ist ja das, was passiert. die
'hand' der ki spieler muss ich gar nicht sehen ... die kann nach ganz unten
geschoben werden." Reines Layout, keine Engine-/Model-Änderung.

### `render.ts#playerArea`: gespiegelte Kindreihenfolge je Spieler

Bisher identische Kindreihenfolge für beide Spieler (Panel → Hand →
Battlefield → Graveyard), dadurch lagen player1s Graveyard UND player2s
Panel+Hand zwischen den beiden Battlefields. Jetzt (PLAYER_IDS-Reihenfolge,
`boardSection`, rechte Turn-Flow-Spalte bewusst unangetastet):

- **player1** (oben): Panel → Hand → **Battlefield** (Battlefield jetzt
  ganz unten in der Box, direkt an der Nahtstelle zu player2).
- **player2** (unten): **Battlefield** → Panel → Hand (Battlefield ganz
  oben, direkt an der Nahtstelle; player2s Hand — zeigt wegen
  `handCard.ts#handCardHidden` ohnehin nur verdeckte Kartenrücken, s.
  dortiger Kommentar — landet dadurch ganz am unteren Seitenende, der am
  wenigsten prominenten Position).

Ergebnis-Reihenfolge von oben nach unten: player1-Panel → player1-Hand →
player1-Battlefield → player2-Battlefield → player2-Panel → player2-Hand —
exakt die geforderte Anordnung.

**Graveyard-Platzierung (eigene Design-Entscheidung, im Auftrag bewusst
offengelassen):** an den jeweiligen äußeren Rand gebunden statt zwischen
Panel und Hand — player1s Graveyard ganz oben vor seinem Panel, player2s
Graveyard ganz unten nach seiner Hand. Damit kann kein Graveyard je
zwischen die beiden Battlefields geraten, unabhängig von künftigen
Änderungen an den übrigen Zonen. Zusätzlich bewusst kompakter/dezenter
gestaltet (kleinere `min-height`/Padding der Zonenfläche, reduzierte
Label-Deckkraft, s. `.player-zone-block-graveyard` in `style.css`) — der
Graveyard ist relevant, aber nicht "das, was gerade passiert" (im
Gegensatz zum Battlefield). Die Karten selbst (`cardTile`) bleiben
unverändert groß, nur die umgebende Fläche schrumpft.

Jede Zone steckt jetzt in einem eigenen `.player-zone-block`-Wrapper
(Label + Zonenfläche zusammen), damit die drei Blöcke (Hand/Battlefield/
Graveyard) unabhängig voneinander pro Spieler neu angeordnet werden
können, ohne `handZone`/`battlefieldZone`/`graveyardZone` selbst
anzufassen (deren Funktionslogik ist unverändert, nur wo/wie sie
zusammengesetzt werden, hat sich geändert).

### `style.css`: sichtbare Nahtstelle statt reiner Umsortierung

- `.board`-Gap (Abstand zwischen den beiden `.player-area`-Boxen — `.board`
  hat immer genau zwei Kinder) von 14px auf 5px reduziert, da an dieser
  einen Stelle jetzt exakt die beiden Battlefields aufeinandertreffen.
- Neue Modifier-Klassen `.player-area-touch-bottom` (player1) /
  `.player-area-touch-top` (player2): verkleinern gezielt NUR das
  Innenpolster und die Eckenrundung an der gemeinsamen Kante (10px → 4px
  Padding, 10px → 3px Radius an den beiden inneren Ecken), damit die
  beiden Spielfelder optisch spürbar "aneinander stoßen", ohne die beiden
  `.player-area`-Boxen zu einer einzigen Box verschmelzen zu müssen (wäre
  eine deutlich größere Restrukturierung mit Risiko für
  `.player-area-deciding`, laut Auftrag nicht verlangt). `.player-area
  -deciding` (Entscheidungs-Rahmen, `outline`+`box-shadow`, keine
  `border-radius`/`padding`-Eigenschaften) bleibt davon unberührt und
  umrandet weiterhin die komplette Box des jeweils entscheidenden
  Spielers, unabhängig von der neuen internen Reihenfolge — verifiziert
  per Code-Lektüre (Selektor-Reihenfolge in `style.css`: die neuen
  Touch-Klassen stehen VOR `.player-area-deciding`, Kaskade greift wie
  erwartet).

### Verifikation

`npm test`: 167/167 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test) — identisch zur Baseline, kein Test hing an der bisherigen
DOM-Reihenfolge innerhalb `.player-area` (vorab per Grep geprüft). `npm run
build` (`tsc --noEmit`) sowie zusätzlich `npm run build:ui` (`vite build`)
beide fehlerfrei. Echte Browser-/Screenshot-Verifikation des neuen Layouts
steht aus — kein Browser-/Computer-Use-Werkzeug in dieser Session
verfügbar, kein laufender Dev-/Preview-Server gefunden (nur Code-Lektüre +
`tsc`/`vitest`/`vite build`, gleiche Einschränkung wie in mehreren
vorherigen Sessions, s. Punkt 15 unten).

**Ergebnis:** Geänderte Dateien: `src/ui/render.ts` (`playerArea`:
gespiegelte Kindreihenfolge je `playerId`, neue lokale `panelNode`/
`handNode`/`battlefieldNode`/`graveyardNode`-Wrapper, neue
`player-area-touch-*`-Modifier-Klasse), `src/ui/style.css` (`.board`-Gap
reduziert, neue `.player-zone-block`/`.player-area-touch-bottom`/
`.player-area-touch-top`/`.player-zone-block-graveyard`-Regeln). Keine
Änderung an `handZone`/`battlefieldZone`/`graveyardZone` selbst, an
`boardSection`/`PLAYER_IDS`, an der rechten Turn-Flow-Spalte oder an
`src/engine/*`/`src/model/*`/`src/ai/*` — reines Layout, keine neue
Spiellogik, kein Kartenbalancing.

## Ereignis-Log aus der UI entfernt + Bot-Zuggeschwindigkeit einstellbar (v0.1.25, 2026-07-21)

Zwei unabhängige, kleine Aufträge in einem Rutsch (beide berühren
`render.ts`/`store.ts`), reines Frontend, keine Engine-/Model-Änderung.

### Teil A: Ereignis-Log-Panel entfernt

Nutzer-Feedback: „das ereignislog kann eigentlich raus". `logPanel(getLog())`
in `render.ts` sowie `src/ui/components/logPanel.ts` gelöscht (einziger
Aufrufort/einzige Komponente), zugehörige tote CSS-Regeln
(`.log-panel`/`.log-panel-title`/`.log-list`/`.log-entry`) aus `style.css`
entfernt (`.log-panel-title` war Teil eines kombinierten Selektors mit
`.stack-panel-title` — nur der `.log-panel-title`-Teil raus, `.stack-panel-
title` bleibt). **Bewusst unangetastet:** `store.ts#getLog()`/`log`-Array/
`describeEvent()` — das ist reine Datenerfassung, kein totes Backend, wird
weiterhin von `src/ui/__tests__/concede.test.ts` (`store.getLog()`) genutzt,
um Engine-Events zu verifizieren.

### Teil B: Bot-Zuggeschwindigkeit einstellbar

Nutzer-Feedback: „die spielzüge des computers sind zu schnell ... ein mensch
hat kaum chancen, das zu sehen und nachzuvollziehen". Neues, in
`localStorage` persistiertes Preset `BotSpeedPreset` (`"fast" | "normal" |
"slow"`, Key `deckbuilder1.botSpeed`, Default `"normal"` — bewusst NEUER,
langsamerer Standard) mit drei ms-Werten (`BOT_SPEED_DELAYS_MS`): **schnell
350ms** (nah am bisherigen Fixwert 320ms), **normal 900ms** (neuer Standard),
**langsam 1800ms**. `setBotSpeedPreset()` ruft intern ausschließlich den
bestehenden `setBotMoveDelayMs()` auf und persistiert das Preset —
`botMoveDelayMs` bleibt die einzige „scharfe" interne Variable, der
bestehende Test-Override-Pfad (`setBotMoveDelayMs(0)` direkt nach dem
Store-Import in `tutorial.test.ts`/`vs-bot.test.ts`/
`vs-bot-difficulty.test.ts`) ist unverändert und gewinnt weiterhin, weil er
NACH dem Modul-Init-Aufruf (`setBotMoveDelayMs(BOT_SPEED_DELAYS_MS[preset])`
beim Laden von `store.ts`, für Punkt 4 „persistierter Wert wird beim
App-Start angewendet") läuft.

Neue Komponente `src/ui/components/botSpeedPanel.ts` (`botSpeedPanelButton`/
`botSpeedPanel`) strukturell 1:1 an `musicPanel.ts` angelehnt (gleiche
`.tutorial-help-*`-Rahmen-Klassen, eigener Backdrop, `stopPropagation` auf dem
Panel-Inhalt) mit drei Preset-Buttons, aktive Auswahl visuell hervorgehoben
(`.bot-speed-panel-btn-active`, gleiches Muster wie `.music-panel-repeat-btn-
active`). Neuer „Bot-Tempo"-Button in `render.ts#statusBar` (analog
`musicPanelButton`) — **immer sichtbar, auch während einer laufenden
Partie** (keine Tutorial-Einschränkung), da der Nutzer das Problem beim
Zusehen im laufenden Spiel hat. Panel-Sichtbarkeit (`isBotSpeedPanelOpen`)
+ Rendering im Root-Kinderarray analog zum Musik-Panel verdrahtet.

### Verifikation

`npm test`: 167/167 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test) — identisch zur Baseline, insbesondere `tutorial.test.ts`/
`vs-bot.test.ts`/`vs-bot-difficulty.test.ts` (alle nutzen
`setBotMoveDelayMs(0)`) unverändert grün. `npm run build` (`tsc --noEmit`)
fehlerfrei. Kein Browser-/Computer-Use-Werkzeug in dieser Session verfügbar
(nur Code-Lektüre + `tsc`/`vitest`) — ein Dev-Server lief zwar auf Port 5173,
aber ohne Browser-Werkzeug keine echte Screenshot-Verifikation der neuen
Buttons/Panels möglich.

**Ergebnis:** Geändert: `src/ui/render.ts` (Import-/Aufruf-Entfernung
`logPanel`/`getLog`, neue Imports/Verdrahtung `botSpeedPanel`/
`botSpeedPanelButton`/`BOT_SPEED_LABELS`, neuer Button in `statusBar`, neues
Panel im Root-Kinderarray), `src/ui/store.ts` (neuer Abschnitt
`BotSpeedPreset`/`BOT_SPEED_DELAYS_MS`/`BOT_SPEED_LABELS`/
`getBotSpeedPreset`/`setBotSpeedPreset`/`isBotSpeedPanelOpen`/
`toggleBotSpeedPanel`/`closeBotSpeedPanel`, Modul-Init ruft
`setBotMoveDelayMs()` mit dem persistierten Preset), `src/ui/style.css`
(Log-Panel-Regeln entfernt, neue `.bot-speed-toggle-btn`/`.bot-speed-panel-
row`/`.bot-speed-panel-btn-active`-Regeln). Gelöscht:
`src/ui/components/logPanel.ts`. Neu: `src/ui/components/botSpeedPanel.ts`.
Keine Änderung an `src/engine/*`/`src/model/*`/`src/ai/*`, kein
Kartenbalancing.

## Stack-Anzeige zwischen die Battlefields verschoben (v0.1.26, 2026-07-21)

Nutzer-Nachfrage nach der Bedeutung von „Stack ist leer" (Antwort: der Stack
ist die gemeinsame Warteschlange für Zaubersprüche/Fähigkeiten, die noch
auflösen müssen — geteilter Spielzustand, gehört keinem der beiden Spieler
allein), daraufhin die Folgefrage „sollte das dann nicht zwischen die
battlefields statt nach unten?". Reines Layout, keine Engine-/Model-Änderung,
keine Änderung an `stackPanel.ts`/`stackPanelOptions`-Logik selbst.

### `render.ts`: `stackPanel(...)` von `renderGameBoard` nach `boardSection` verschoben

Seit v0.1.24 grenzen player1s und player2s Battlefield direkt an der
Nahtstelle zwischen den beiden `.player-area`-Boxen aneinander (dort liegt
mit 5px auch die kleinste Lücke im gesamten Board). `stackPanel(...)` wurde
bisher ganz am Ende des root `children`-Arrays gerendert (unter dem
kompletten `boardSection`-Block inkl. Turn-Flow-Spalte), jetzt sitzt der
Aufruf stattdessen als DRITTES Element von `.board` in `boardSection`, genau
zwischen den beiden `playerArea(...)`-Aufrufen (bewusstes Hardcoding auf
`"player1"`/`"player2"` statt `PLAYER_IDS.map`, analog zu anderer bestehender
2-Spieler-Logik im Projekt — `PLAYER_IDS` hat immer genau 2 Einträge). Die
alte Aufrufstelle in `renderGameBoard` wurde entfernt, damit der Stack nicht
doppelt erscheint; der `stackPanel`-Import bleibt unverändert bestehen.
`stackPanelOptions(state, mode)` (Konter-Ziele/`targetableKeys`/
`onTargetClick`) ist unverändert eine eigenständige Funktion ohne Zugriff auf
`boardSection`-lokale Variablen und wird 1:1 weiterverwendet — keine
Funktionsänderung, nur eine andere Aufrufstelle.

### `style.css`: Nahtstellen-Optik statt eigenständiger Sektion

- `.board`-Kommentar korrigiert: hatte „immer genau zwei Kinder" behauptet,
  gilt seit diesem Auftrag nicht mehr — `.board` hat jetzt drei Kinder (zwei
  `.player-area`-Boxen + `stackPanel(...)` als mittleres Element).
- `.stack-panel`-Innenpolster von `10px` (alle Seiten) auf `6px 10px`
  reduziert (vertikal knapper), da die Box an der engen, nur 5px breiten
  Nahtstelle sonst wuchtiger wirkt als die knapp gepolsterten
  `.player-area-touch-*`-Kanten direkt darüber/darunter (s. v0.1.24).
  `.stack-empty` (Leerzustand „Stack ist leer.") auf denselben Wert `6px
  10px` angeglichen (vorher `6px` einheitlich, unabhängig vom
  `.stack-panel`-Padding, da `.stack-empty` in der Kaskade nach
  `.stack-panel` steht und dessen Padding vollständig überschreibt statt zu
  ergänzen — beide Zustände wirken jetzt einheitlich kompakt). Horizontale
  Randgestaltung/Border/Radius/Gradient/Box-Shadow von `.stack-panel`
  unverändert; `.board`s eigener 5px-Gap trennt die Box weiterhin sauber von
  beiden Battlefields, kein `align-items`-Override nötig (Default `stretch`
  gibt der Stack-Box automatisch dieselbe Breite wie die beiden
  `.player-area`-Boxen).

### Verifikation

`npm test`: 168/168 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test) — identisch zur Baseline, kein Test hing an der bisherigen
Position von `stackPanel` im Root-Kinderarray (vorab per Grep geprüft, keine
Tests referenzieren `.stack-panel`/`boardSection` direkt). `npm run build`
(`tsc --noEmit`) fehlerfrei. Ein Dev-Server lief auf Port 5173, in dieser
Session standen jedoch keine Browser-/Computer-Use-Werkzeuge zur Verfügung
(nur Read/Grep/Glob/Write/Edit/Bash) — keine echte Screenshot-Verifikation
möglich, nur Code-Lektüre + `tsc`/`vitest` (gleiche Einschränkung wie in
mehreren vorherigen Sessions, s. Punkt 15 unten sowie v0.1.24/v0.1.25 oben).

**Ergebnis:** Geändert: `src/ui/render.ts` (`stackPanel(...)`-Aufruf von
`renderGameBoard` nach `boardSection` verschoben, dort als drittes `.board`-
Kind zwischen den beiden `playerArea(...)`-Aufrufen), `src/ui/style.css`
(`.board`-Kommentar korrigiert, `.stack-panel`/`.stack-empty`-Innenpolster
angepasst). Keine Änderung an `src/ui/components/stackPanel.ts`
(`stackPanel`/`StackPanelOptions`), an `stackPanelOptions` selbst, an
`playerArea`/Battlefield-Reihenfolge oder an
`src/engine/*`/`src/model/*`/`src/ai/*` — reines Layout, keine neue
Spiellogik, kein Kartenbalancing.

## Archetyp-Deck-Auswahl für den menschlichen Spieler (v0.1.27, 2026-07-21)

Nutzer fragte, ob es die 7 kuratierten Archetyp-Decks für die KI gibt (Antwort:
ja, `src/ui/aiDecks.ts#AI_DECKS`, seit v0.1.21). Daraufhin: „die sollten auch
für den Menschen auswählbar sein" — bisher konnte der Mensch beim eigenen
Deckbau nur „Zufällig füllen" (`buildDemoDeck`, reine 5-Farben-Zufallsmischung)
nutzen, nicht eines der thematisch stimmigen 7 Archetyp-Decks direkt laden.

### `components/deckBuilder.ts`: neues Select + Lade-Button

`AI_DECKS` (Name + Beschreibung + Decklist pro Eintrag, bereits vollständig
öffentlich exportiert, keine neue Datenstruktur nötig) wird zusätzlich direkt
importiert. Neues modul-scoped `selectedArchetypeIndex` (analog zu
`searchText`/`typeFilter`/`colorFilter` — reiner UI-Auswahlzustand, überlebt
Rerenders durch +/- Klicks, wird aber nicht selbst in die Deckliste
übernommen). Im `deckbuilder-controls`-Zeile, direkt neben „Zufällig füllen":
ein `<select class="deckbuilder-archetype-select">` mit den 7 Archetyp-Namen
als Optionen (Kurzbeschreibung als `title`-Tooltip auf Select UND jeder
einzelnen Option) plus ein Button `.deckbuilder-archetype-load-btn`
(„Archetyp-Deck laden"), der beim Klick `opts.onLoadArchetypeDeck(AI_DECKS[i]
.decklist)` aufruft. Dropdown+Button statt eigenem Panel gewählt, weil
`typeSelect`/`colorSelect` in derselben Controls-Zeile bereits genau dieses
Muster (Select + sofort wirksame Auswahl) etablieren — keine neue
UI-Sprache nötig. Neues `DeckBuilderOptions.onLoadArchetypeDeck: (decklist)
=> void`, analog zum bestehenden `onRandomFill`-Verdrahtungsstil.

### `render.ts`: Verdrahtung

`onLoadArchetypeDeck: (archetypeDecklist) => setDecklist(player, archetypeDecklist)`
— exakt derselbe `setDecklist`-Aufruf wie bei `onRandomFill`, nur mit der
gewählten Archetyp-Decklist statt `buildDemoDeck(pool)`. Gilt unverändert für
beide Spieler (player1 UND player2, Hotseat) sowie beide `mode`-Werte
(`newGame`/`standalone`) — keine Bot-spezifische Einschränkung, da die
Bot-Geheimhaltung ausschließlich `pickRandomAiDeck()` betrifft (unverändert,
weiterhin ohne Namen/Beschreibung im Rückgabewert — s. v0.1.21-Abschnitt und
Dateikommentar in `aiDecks.ts`).

### `style.css`

`.deckbuilder-archetype-select` teilt sich die bestehende Basis-Optik mit
`.deckbuilder-type-filter`/`.deckbuilder-color-filter` (Padding, Radius,
Rahmen, Farben aus CSS-Variablen), zusätzlich `max-width: 220px` gegen zu
lange Archetyp-Namen im Layout.

### Verifikation

Neuer dauerhafter Test `src/ui/__tests__/archetype-deck-select.test.ts` (3
Tests): (1) Dropdown listet alle 7 `AI_DECKS`-Namen in der richtigen
Reihenfolge, (2) „Archetyp-Deck laden" übernimmt exakt die Decklist des
ausgewählten Archetyps (`store.getDecklist("player1")` deep-equal zu
`AI_DECKS[i].decklist`) und das übernommene Deck ist sofort gültig
(„Deck gültig", Confirm-Button aktiv), (3) „Zufällig füllen" bleibt als
eigenständige, unveränderte Alternative funktionsfähig. `npm test`: 171/171
Tests grün (1 weiterhin bewusst übersprungener Analyse-Test) — Baseline
168/168 plus die 3 neuen Tests, keine Regression. `npm run build`
(`tsc --noEmit`) fehlerfrei. Kein Browser-/Computer-Use-Werkzeug in dieser
Session verfügbar — nur Code-Lektüre + `tsc`/`vitest`, keine echte
Screenshot-Verifikation des neuen Dropdowns/Buttons möglich.

**Ergebnis:** Geändert: `src/ui/components/deckBuilder.ts` (Import
`AI_DECKS`, neues modul-scoped `selectedArchetypeIndex`, neues
`archetypeSelect` + Lade-Button in der Controls-Zeile, neues
`DeckBuilderOptions.onLoadArchetypeDeck`), `src/ui/render.ts` (neue
`onLoadArchetypeDeck`-Verdrahtung), `src/ui/style.css`
(`.deckbuilder-archetype-select`-Regel). Neu: `src/ui/__tests__/archetype-
deck-select.test.ts`. Keine Änderung an `src/ui/aiDecks.ts` (Inhalte der 7
Decklisten unverändert, nur zusätzlicher Import), an `pickRandomAiDeck()`/
dessen Bot-Geheimhaltungsverhalten oder an `src/engine/*`/`src/model/*`/
`src/ai/*` — reine Frontend-Ergänzung, kein Kartenbalancing.

## Bot-Deck-Archetyp-Auswahl (v0.1.28, 2026-07-21)

Direkter Folgeauftrag zu v0.1.27: „und man sollte auswählen können, welches
Deck die KI spielt, oder ob es zufällig gewählt wird" — bezieht sich NICHT
auf das eigene Deck des Menschen (bereits mit v0.1.27 erledigt), sondern auf
das Deck des bot-gesteuerten Gegners (player2, wenn `isBotControlled` true
ist). Bisher zog `render.ts` an beiden Aufrufstellen immer über
`pickRandomAiDeck()` zufällig einen der 7 Archetypen.

### `store.ts`: neuer In-Memory-Auswahlzustand

`chosenAiDeckArchetype: Record<PlayerId, number | undefined>` (Default:
`undefined` für beide Spieler) + `getChosenAiDeckArchetype`/
`setChosenAiDeckArchetype`, direkt neben `botDifficulty` platziert, analoges
Muster (generisch pro `PlayerId`, auch wenn nur player2 im UI eine Auswahl
anbietet). Bewusst OHNE localStorage-Persistenz (anders als
`botControlledPlayers`/`botDifficulty`, die über „Zurück zum Hauptmenü"
hinweg erhalten bleiben) — der Auftrag verlangt das ausdrücklich nicht
(„MUSS NICHT über Sessions hinweg persistiert werden"). Bleibt aber innerhalb
derselben Sitzung ein reiner Modul-Zustand: ein einmal gewählter Archetyp
übersteht ein „Zurück zum Hauptmenü" + eine neue Partie (per echtem
Klick-Test in `ai-deck-choice.test.ts` belegt, s.u.), erst ein kompletter
App-Neustart (Modul-Neuladen) setzt ihn zurück auf „Zufällig".

### `aiDecks.ts`: `resolveAiDeck(chosenIndex)`

Neue Funktion, `pickRandomAiDeck()` selbst bleibt unverändert (wird von
`resolveAiDeck` intern weiterhin für den Zufalls-Fall aufgerufen, außerdem
laut Dateikommentar potenziell noch anderweitig genutzt). `chosenIndex ===
undefined` → identisches Verhalten wie bisher (`pickRandomAiDeck()`, inkl.
Geheimhaltung des Namens). Ein gültiger Index gibt exakt
`AI_DECKS[chosenIndex].decklist` zurück; ein defensiv abgefangener
ungültiger Index fällt auf den Zufalls-Fall zurück statt zu crashen (sollte
über das UI-Dropdown nie vorkommen).

### `render.ts`: beide Aufrufstellen umgestellt

`onConfirm` (player1 bestätigt, player2 bereits vorab als Bot markiert über
`store.ts#chooseOpponentBot` → player2-Screen wird komplett übersprungen) und
`onAiQuickstart` (Button direkt auf dem player2-Screen) rufen jetzt beide
`resolveAiDeck(getChosenAiDeckArchetype(player))` statt `pickRandomAiDeck()`
auf. Neue `DeckBuilderOptions`-Felder `chosenAiDeckArchetype`/
`onChangeAiDeckArchetype` reichen nur `getChosenAiDeckArchetype`/
`setChosenAiDeckArchetype` durch (kein eigener Logikanteil in `render.ts`).
Der Quickstart-Button-Text wechselt bei expliziter Auswahl von „Zufälliges
KI-Deck + weiter" zu `"<Archetyp-Name>" laden + weiter`.

### `components/deckBuilder.ts`: neues Select im `aiToggle`-Block

Neues `<select class="deckbuilder-ai-deck-select">` (Label „KI-Deck: ",
analog zum bestehenden Schwierigkeits-Select-Label direkt darüber), nur
gerendert, solange `opts.botControlled` true ist — identisches Sichtbarkeits-
Muster wie `difficultySelect`. Optionen: eine `"Zufällig"`-Option mit dem
Sentinel-Wert `RANDOM_AI_DECK_VALUE = "random"` (selektiert, solange
`chosenAiDeckArchetype === undefined`) gefolgt von den 7 Archetyp-Optionen.
Diese 7 Optionen werden über eine neue geteilte Hilfsfunktion
`archetypeOptionNodes(selectedIndex)` gebaut — dieselbe Funktion erzeugt jetzt
auch die Optionsliste des bereits bestehenden `archetypeSelect` (menschliches
eigenes Deck, v0.1.27), um Namen/Beschreibungen/Tooltip-Verhalten nicht
zweimal zu pflegen (per Auftrag ausdrücklich als Option vorgeschlagen). Der
`onchange`-Handler übersetzt den Sentinel-Wert zurück auf `undefined`, bevor
er `opts.onChangeAiDeckArchetype` aufruft.

### `style.css`

`.deckbuilder-ai-deck-label`/`.deckbuilder-ai-deck-select` teilen sich die
Basis-Optik (Flex-Layout, Padding, Rahmen, Farben) mit den bestehenden
`.deckbuilder-ai-difficulty-label`/`-select`-Regeln (eine gemeinsame
Selektor-Liste statt Duplizierung), zusätzlich eigenes `max-width: 220px`
(Archetyp-Namen sind länger als die drei Schwierigkeitsstufen-Labels).

### Verifikation

Neuer dauerhafter Test `src/ui/__tests__/ai-deck-choice.test.ts` (4 Tests):
(1) Select zeigt „Zufällig" + alle 7 Namen, aber nur solange die KI-Steuerung
aktiv ist, Default ist „Zufällig"; (2) explizite Auswahl + Quickstart lädt
exakt die Decklist dieses Archetyps für player2 (`store.getDecklist
("player2")` deep-equal `AI_DECKS[i].decklist`), Button-Label nennt den
Namen; (3) Zurückstellen auf „Zufällig" entfernt eine vorherige Auswahl
wieder (kein versehentlicher Fallback auf Index 0); (4) eine einmal
getroffene Auswahl übersteht „Zurück zum Hauptmenü" + eine komplett neue
Partie über die Gegner-Auswahl (`chooseOpponentBot`, player2-Screen dabei
übersprungen) — der automatische Auto-Fill-Pfad zieht denselben Archetyp,
nicht erneut zufällig. `npm test`: 175/175 Tests grün (1 weiterhin bewusst
übersprungener Analyse-Test) — Baseline 171/171 plus die 4 neuen Tests, keine
Regression (inkl. `vs-bot.test.ts`/`vs-bot-difficulty.test.ts`/
`archetype-deck-select.test.ts`, die alle unverändert grün bleiben, da der
Default-Zufalls-Fall unangetastet blieb). `npm run build` (`tsc --noEmit`)
fehlerfrei.

**Ergebnis:** Geändert: `src/ui/store.ts` (neuer `chosenAiDeckArchetype`-
Zustand + Getter/Setter), `src/ui/aiDecks.ts` (neue `resolveAiDeck`-Funktion,
`pickRandomAiDeck` unverändert), `src/ui/render.ts` (Import `resolveAiDeck`
statt `pickRandomAiDeck`, beide Aufrufstellen umgestellt, zwei neue
`DeckBuilderOptions`-Felder verdrahtet), `src/ui/components/deckBuilder.ts`
(neue `archetypeOptionNodes`-Hilfsfunktion, geteilt mit dem bestehenden
`archetypeSelect`, neues `botDeckSelect` im `aiToggle`-Block, angepasstes
Quickstart-Button-Label, zwei neue `DeckBuilderOptions`-Felder), `src/ui/
style.css` (`.deckbuilder-ai-deck-label`/`-select`-Regeln). Neu: `src/ui/
__tests__/ai-deck-choice.test.ts`. Keine Änderung an den 7 Decklisten selbst,
an `src/engine/*`/`src/model/*`/`src/ai/*` oder an der Geheimhaltungslogik im
Zufalls-Fall — reine Frontend-Ergänzung, kein Kartenbalancing. Kein Browser-/
Computer-Use-Werkzeug in dieser Session verfügbar — nur Code-Lektüre +
`tsc`/`vitest`, keine echte Screenshot-Verifikation des neuen Dropdowns.

## Kartenpool: „Im Deck" optisch vom Rest getrennt (v0.1.29, 2026-07-21)

Nutzer-Auftrag: „was irgendwie noch gut wäre, wäre wenn bereits im deck
befindliche karten von rest der karten separiert würden optisch. so muss man
aktuell alle karten durchschauen und auf die sehr kleinen zahlen schauen, ob
dort mehr als 10 steht". Reines Frontend, keine Engine-/Modell-Änderung.

### `deckBuilder.ts`

- `buildRows(pool, decklist, onChange)`: teilt den (weiterhin alphabetisch
  sortierten) Kartenpool jetzt in zwei Gruppen — `owned` (Karten mit
  `decklist[id] > 0`) und `rest` (alle übrigen) — und baut daraus zwei
  `.deck-pool-section`-Wrapper-`<div>`s, beide direkt als Kinder des
  zurückgegebenen Arrays (also weiterhin Kinder desselben
  `.deckbuilder-pool`-Containers, kein zweiter getrennter Container). Jeder
  Abschnitt trägt eine `<h3 class="deck-pool-section-heading">`: „Im Deck
  (N Karten)" (N = Summe aller Kopien, nicht nur unterschiedliche Karten) bzw.
  „Restlicher Kartenpool". Der „Im Deck"-Abschnitt entfällt komplett (keine
  leere Überschrift), solange die Deckliste leer ist.
- `poolRow`: neue zusätzliche CSS-Klasse `deck-pool-row-owned` auf der
  Kartenkachel selbst, sobald `count > 0` — hebt die Karte auch am einzelnen
  Tile hervor, nicht nur über ihre Position im „Im Deck"-Abschnitt.
  Kernlayout (Kartenrahmen, +/-, Regeltext-Fallback) unverändert.
- `applyFilterVisibility(container, pool)`: lief bisher global über
  `container.querySelectorAll(".deck-pool-row")`. Läuft jetzt pro Abschnitt
  (`container.querySelectorAll(".deck-pool-section")`, dann je Abschnitt die
  enthaltenen `.deck-pool-row`-Elemente) und blendet zusätzlich die
  `.deck-pool-section-heading` dieses Abschnitts aus, sobald der aktuelle
  Such-/Typ-/Farbfilter darin auf null sichtbare Zeilen kommt (z.B. Suche nach
  einem Namen, der nur im jeweils anderen Abschnitt vorkommt) — vermeidet eine
  Überschrift ohne sichtbare Karten darunter. Filter/Suche selbst (Logik in
  `matchesFilter`) unverändert, funktioniert weiterhin unverändert über beide
  Abschnitte hinweg, da jede `.deck-pool-row` weiterhin ihr `data-card-id`
  trägt.

### `style.css`

- `.deckbuilder-pool`: von `display: flex; flex-wrap: wrap` auf
  `display: flex; flex-direction: column` umgestellt — die beiden Abschnitte
  stehen jetzt vollbreit untereinander; das bekannte Karten-Wrap-Raster lebt
  jetzt eine Ebene tiefer.
- Neu: `.deck-pool-section` (`display: flex; flex-wrap: wrap` — das
  eigentliche Karten-Raster pro Abschnitt, optisch identisch zum bisherigen
  Pool-Layout), `.deck-pool-section-heading` (dezente Trennlinie + Großschrift,
  `flex-basis: 100%` erzwingt den Zeilenumbruch vor den Karten),
  `.deck-pool-section-owned .deck-pool-section-heading` (Akzentfarbe statt
  gedämpftem Grau für die „Im Deck"-Überschrift).
- Neu: `.deck-pool-row.deck-pool-row-owned` — dezenter grüner
  Hintergrund-Tint + `box-shadow: 0 0 0 2px var(--accent) inset` als
  Rahmen-Akzent, damit die Zugehörigkeit auch am einzelnen Tile sofort
  erkennbar ist.

### Verifikation

`npm test`: 175/175 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test), keine Regression — insbesondere `deck-persistence.test.ts`
(prüft `.deck-pool-row-count` per `data-card-id`-Selektor, funktioniert
unverändert trotz der neuen Verschachtelung) und alle Deckbau-Golden-Path-/
Archetyp-/Bot-Deck-Tests bleiben unverändert grün. `npm run build`
(`tsc --noEmit`) fehlerfrei. Kein Browser-/Computer-Use-Werkzeug in dieser
Session verfügbar — nur Code-Lektüre + `tsc`/`vitest`, keine echte
Screenshot-Verifikation der neuen Abschnittstrennung/Hervorhebung.

**Ergebnis:** Geändert: `src/ui/components/deckBuilder.ts`
(`buildRows`/`poolRow`/`applyFilterVisibility`), `src/ui/style.css`
(`.deckbuilder-pool`, neu: `.deck-pool-section`/`-heading`/`-owned`,
`.deck-pool-row-owned`). Keine Engine-/Modell-Änderung, kein Kartenbalancing,
keine neuen Abhängigkeiten.

## Bugfix: wiederkehrendes Bild-Blinken bei Karten-/Avatar-Artwork (v0.1.30, 2026-07-21)

Nutzer-Report nach dem View-Transition-Wrapper-Fix (Commit `50e8c5b`, behob
das Vollbild-Übergangs-Flackern beim Rendern): „aber es blinkt noch immer".
Reines Frontend, keine Engine-/Modell-Änderung.

### Ursache

`render.ts#render()` baut `#app` bei JEDER Zustandsänderung per `innerHTML`
komplett neu auf (kein DOM-Diffing) — bestätigt per `MutationObserver`, feuert
während eines automatischen Bot-Zugs etwa alle ~900ms (passend zum
eingestellten Bot-Tempo). `cardFrameArt()` (`cardArt.ts`) und `botAvatarImg()`
(`sceneArt.ts`) folgten beide demselben Muster: das `<img>` startet per CSS
unsichtbar (`opacity: 0`), erst das `onload`-Event schaltet die `-loaded`-
Klasse (und damit `opacity: 1`) frei — gedacht für den sanften Fade-in beim
ERSTEN echten Ladevorgang. Weil das Bild-Element aber bei JEDEM Rebuild neu
erzeugt wird, startet es jedes Mal wieder bei `opacity: 0` und muss erneut auf
das (zwar aus dem Browser-Cache sofort verfügbare, aber technisch weiterhin
asynchrone) `onload`-Event warten — sichtbar als wiederkehrendes
Unsichtbar-dann-Einblenden, bei jedem Kartenbild UND dem Avatar-Bild,
verstärkt durch die hohe Render-Frequenz während Bot-Zügen.

### Fix

`cardFrameArt` (`cardArt.ts`) und `botAvatarImg` (`sceneArt.ts`): direkt nach
dem Erzeugen des `<img>`-Elements wird jetzt synchron geprüft, ob der Browser
das Bild bereits auflösen konnte (`img.complete && img.naturalWidth > 0`) —
falls ja, wird die `-loaded`-Klasse sofort gesetzt statt auf das `onload`-
Event zu warten. Der bestehende `onload`-Handler bleibt unverändert als
Fallback für den echten ersten Ladevorgang der Session bestehen (dort greift
weiterhin der sanfte Fade-in); `onerror`-Verhalten (Bild-Element bei
fehlender Datei entfernen) unverändert. `render.ts` selbst wurde NICHT
angefasst (separates Problem vom vorherigen View-Transition-Fix).

### Verifikation

`npm test`: 175/175 Tests grün (1 weiterhin bewusst übersprungener
Analyse-Test), keine Regression — `img.complete`/`naturalWidth` verhalten
sich in jsdom defensiv genug (typischerweise `false`/`0` ohne echten
Netzwerk-Request), sodass in Tests unverändert der bestehende `onload`-Pfad
greift, kein Crash. `npm run build` (`tsc --noEmit`) fehlerfrei. Kein
Browser-/Computer-Use-Werkzeug in dieser Session verfügbar, um das Blinken
selbst live nachzustellen — Fix beruht auf der vom Orchestrator bereits per
Live-Browser-Test (`MutationObserver` + Netzwerk-Log) verifizierten Diagnose.

**Ergebnis:** Geändert: `src/ui/components/cardArt.ts` (`cardFrameArt`),
`src/ui/components/sceneArt.ts` (`botAvatarImg`). Keine Engine-/Modell-
Änderung, kein Kartenbalancing, keine neuen Abhängigkeiten.

## Nächste Schritte (Vorschläge)

1. ~~**UI-Automatisierung**~~ **erledigt in v0.1.5** (s. eigener Abschnitt
   oben) — `src/ui/__tests__/` mit `jsdom` als Dev-Dependency, dauerhaft im
   Repo.
2. ~~**`concede`-Button** ergänzen~~ **erledigt in v0.1.8** (s. eigener
   Abschnitt oben) — Button pro Spieler im Spieler-Panel,
   `window.confirm`-Bestätigung, ausgeblendet für bot-gesteuerte Spieler/nach
   Spielende.
3. **Dauerhafter Klick-Test für den modalen Trigger-Fall**
   (`core.current-diplomat`, `chooseMode`-PendingDecision inkl. Auto-Pick
   und der Ketten-Decision zu `chooseTriggerTargets`) — v0.1.6 deckt den
   Code-Pfad ab, aber (noch) keinen eigenen Test (s. v0.1.6-Abschnitt oben).
   **Karten mit >1 Zielslot**: weiterhin ungetestet/nicht implementiert
   (Grundgerüst im `UiMode`-Typ vorbereitet, aber nur für einen Slot).
4. **`computeEffectiveStats`/`computeEffectiveKeywords`** offiziell in den
   `RulesEngine`-Vertrag heben (oder alternative, offizielle
   "Anzeige-Projektion" definieren) — siehe Grenzfall oben.
5. **Migration von `chooseManaColor`/`chooseDiscard`/`orderScry`** auf den
   Pending-Decision-Kanal (`docs/rules-engine.md` 9.7): Sobald die Engine das
   umsetzt, braucht das Frontend dafür jeweils eine kleine Auswahl-UI
   (Farbwahl-Buttons, Karten-Mehrfachauswahl, Scry-Sortierung) — der
   generische `pendingDecision`-Rendering-Pfad (Banner + Klick-Ziele) deckt
   nur `chooseTriggerTargets` ab, die anderen drei brauchen eigene
   Eingabe-Widgets, da ihre `DecisionChoice`-Form keine `ChosenTarget`-Liste
   ist.
6. ~~**Deckbau-UI**~~ **erledigt in v0.1.5** (s. eigener Abschnitt oben),
   ~~**Deck-Speichern über eine Session hinaus**~~ **erledigt in v0.1.8** (s.
   eigener Abschnitt oben, `localStorage`-Persistenz der zuletzt bestätigten
   Deckliste), ~~**Mehrfach-Deck-Verwaltung/-Namen**~~ **erledigt in v0.1.20**
   (s. eigener Abschnitt oben, `SavedDeck`, benannte Slots + Deck-Analyse-
   Panel + „Deck leeren") — weiterhin bewusst simpel gehalten (kein
   Sideboard).
7. **Bessere Zugänglichkeit/Ergonomie**: aktuell keine Tastatursteuerung,
   ~~keine Bestätigungsdialoge für irreversible Aktionen~~ **seit v0.1.8
   gibt es einen `window.confirm`-Dialog für `concede`** (s. eigener
   Abschnitt oben) — andere irreversible Aktionen (z. B. Opfern als
   Zusatzkosten) haben weiterhin keine eigene Bestätigungs-UI (s. „Bewusste
   Vereinfachungen" oben, „Opfer-/Zusatzkosten-Feedback"); kein „Undo"
   (entspricht dem Engine-Modell, das keine Rücknahme kennt).
8. **Deckbau-Screen für sehr kleine Bildschirme/viele Karten**: aktuell nur
   ein scrollbarer `max-height`-Container ohne Virtualisierung — bei einem
   künftig deutlich größeren Kartenpool (weit über 109) könnte das UI träge
   werden (kein Problem beim aktuellen Umfang, gemessen über den
   Produktionsbuild). **Teilweise adressiert in v0.1.11**: der „Spiel
   starten"/„Weiter"-Button ist jetzt `position: sticky` und bleibt beim
   Scrollen durch den (mittlerweile 300 Karten großen) Pool sichtbar (s.
   eigener Abschnitt oben) — reines CSS, keine Virtualisierung; bei einem
   nochmals deutlich größeren Pool bliebe die grundsätzliche Trägheits-Sorge
   bestehen.
9. ~~**KI-Gegner-Anbindung ("Spieler 2 = KI")**~~ **erledigt in v0.1.7** (s.
   eigener Abschnitt oben) — Umschalter im Deckbau-Screen, automatischer
   Zug-Loop in `store.ts`, „KI"-Badge im Spieler-Panel.
10. ~~**Bot-Schwierigkeitsstufe nicht einstellbar im UI**~~ **erledigt in
    v0.1.9** (s. eigener Abschnitt oben) — Dropdown im Deckbau-Screen von
    Spieler 2, `store.ts#botDifficulty` + `chooseActionForDifficulty`.
    `botMoveDelayMs` (store.ts, Default 250 ms) ist weiterhin **nicht** über
    die UI einstellbar (nur über `setBotMoveDelayMs()` aus Code/Tests) — für
    ein Hobby-/Lernprojekt aktuell bewusst nicht als Nutzer-Einstellung
    ausgebaut.
11. **Bot-vs-Bot-Zuschauermodus**: `store.ts#botControlledPlayers` ist
    bewusst als `Set<PlayerId>` gebaut und würde „beide Spieler sind KI"
    unterstützen (s. v0.1.7-Abschnitt oben, Punkt 2) — der Deckbau-Screen
    bietet den Umschalter aber aktuell nur für Spieler 2 an (Auftrag: „Spieler
    2 = KI"); ein Umschalter auch für Spieler 1 wäre eine kleine, isolierte
    Ergänzung in `deckBuilder.ts`/`render.ts`.
12. ~~**Geführtes Tutorial-Probespiel**~~ **erledigt in v0.1.11** (s. eigener
    Abschnitt oben) — fester Startpfad mit kuratierten Decks/Seed, ruhig
    spielende KI, einmalige Erklär-Sprechblasen, jederzeit abrufbares
    Hilfe-Panel. **Echte Browser-/Screenshot-Verifikation steht noch aus**
    (in dieser Session keine entsprechenden Werkzeuge verfügbar, s. dortiger
    Verifikations-Abschnitt) — bitte nachholen. Mögliche spätere
    Erweiterungen (nicht angefragt, nur zur Kenntnis): `localStorage`-
    Persistenz der bereits gesehenen Tipps (analog zum Deck-Persistenz-Muster
    aus v0.1.8, aktuell bewusst rein In-Memory, s. Begründung im
    v0.1.11-Abschnitt), ein zweites, andersfarbiges Tutorial-Deck-Paar für
    Abwechslung, sowie eine echte Anbindung an den `ability`-Tipp, sobald das
    Tutorial-Kartenset (oder ein künftiges) eine Karte mit einer eigenen
    nicht-Mana-aktivierten Fähigkeit enthält.
13. ~~**Echtes Hauptmenü statt Direkteinstieg**~~ **erledigt in v0.1.17** (s.
    eigener Abschnitt oben) — der ehemalige Punkt „keine Spielerauswahl über
    Deckbau hinaus" (Bewusste Vereinfachungen) ist damit überholt.
14. ~~**v0.1.20 committen**~~ **erledigt** — beim v0.1.21-Sweep per `git
    log`/`git status` bestätigt: Commit `9b81338`, Arbeitsverzeichnis clean.
    Weiterhin offen: ein gezielter Test für Laden/Löschen/Überschreiben eines
    gespeicherten Decks sowie für die Deck-Analyse-Anzeige selbst fehlt noch
    (nur indirekt über `main-menu.test.ts` mitverifiziert, s. eigener
    Abschnitt oben).
15. **Echte Browser-/Screenshot-Verifikation der v0.1.17-Optik steht aus**:
    Taverne-Hintergrund/Avatar-Spalte (sobald der Nutzer `docs/scene-art/`
    befüllt hat, s. `docs/scene-art-brief.md`), View-Transitions-Animationen
    (Karten-Morph, Lebenspunkte-Puls), Spotlight-Banner — in den v0.1.17-
    v0.1.20-Sessions waren keine Browser-/Computer-Use-Werkzeuge verfügbar,
    nur Code-/Kommentar-Lektüre und jsdom-Klick-Tests.
16. **`npm test`/`npm run build` seit v0.1.17 nicht durch den documenter
    selbst ausgeführt** (kein Shell-Werkzeug in dieser Session verfügbar,
    Testzahlen in den v0.1.17-v0.1.20-Abschnitten oben sind Grep-basiert
    plausibilisiert, nicht durch einen echten Testlauf bestätigt) — sollte
    bei nächster Gelegenheit (z. B. vom frontend-engineer selbst oder einem
    documenter-Sweep mit Shell-Zugriff) nachgeholt werden.
17. **Bot-vs-Bot-Zuschauermodus weiterhin offen** (s. Punkt 11) — mit dem
    neuen `opponentSelect`-Screen (v0.1.17) wäre ein dritter Menüpunkt
    „Zuschauen" naheliegend, aber nicht beauftragt.
18. **Kein dauerhafter Test für die neuen kuratierten KI-Decks** (v0.1.21,
    `aiDecks.ts`): `pickRandomAiDeck()` wird von keinem Test direkt
    verifiziert (weder Kartenzahl noch Deckvalidität noch die tatsächliche
    Zufallsauswahl über alle sieben Einträge) — bisher nur per manueller
    Code-Lektüre/Nachrechnen durch den documenter geprüft (s. eigener
    Abschnitt oben), kein automatisierter Regressionsschutz. Ein kleiner
    Vitest-Fall (`AI_DECKS.every(d => validateDecklist(pool, d.decklist).valid)`)
    wäre eine naheliegende, günstige Ergänzung.
19. **Echtes Browser-Testspiel gegen die neuen KI-Decks steht für den
    documenter noch aus** — der Auftrag erwähnt ein bereits durchgeführtes
    14-Züge-Testspiel (Gegner spielte konsequent nur einen Terrain-Typ, kein
    Archetyp-Name sichtbar); diese Session hatte kein Browser-/
    Computer-Use-Werkzeug zur Verfügung, um das selbst nachzuvollziehen.
