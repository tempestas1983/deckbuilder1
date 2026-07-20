# Laufender Zwischenstand

Datum: 2026-07-20
Zweck: Einziger Ort, an dem der Projektkontext ein `/clear` überlebt. Wird von
`documenter` bei jedem finalen Sweep aktualisiert. Details/Begründungen stehen
in `docs/rules-engine.md`, `docs/engine-status.md`, `docs/frontend-status.md`,
`docs/ai-status.md`, `docs/cards/starter-set.md`, `docs/README.md` — dieses
Dokument ist die Kurzfassung "wo stehen wir gerade".

## Meilenstein: Echtes Hauptmenü, Taverne-Atmosphäre/Sound/Musik-Playlist, Auto-Pass/Spotlight, Deck speichern/analysieren (reines Frontend, keine Engine-/Model-/Kartenpool-/KI-Änderung)

Die mit Abstand umfangreichste Frontend-Session bisher
(`docs/frontend-status.md` v0.1.16 → v0.1.20, drei committete Schritte
`afae4bc`/`9fdb742`/`c44f033` + ein zum Zeitpunkt dieses Sweeps NOCH NICHT
committeter vierter Schritt). Alles gegen den tatsächlichen Code
(`Read`/`Grep`, nicht nur Commit-Nachrichten) verifiziert.

- **v0.1.17 — größte strukturelle Änderung: echtes Hauptmenü statt
  Direkteinstieg.** `types.ts#AppPhase` komplett umgebaut: `mainMenu`
  (neuer App-Start, `components/mainMenu.ts`, vier Optionen) →
  `opponentSelect` (`components/opponentSelect.ts`: KI-Schwierigkeit ODER
  „2 Spieler"/Hotseat) → `deckbuild` (jetzt mit `mode: "newGame" | "standalone"`)
  → `playing`. Bei KI-Wahl wird player2s Deckbau-Screen komplett übersprungen
  (automatisches Zufallsdeck, sofortiger Partiestart). „Deck Builder" ist ein
  neuer eigenständiger Deckbau-Modus ohne Partie-Start. „Anleitung" ist ein
  neues, rein statisches Nachschlage-Panel (`components/rulesGuidePanel.ts`:
  Kartentypen, eingebettetes Keyword-Glossar, Spiel-/Deckbau-Tipps).
  `store.ts#backToMainMenu` (vormals `backToDeckbuilder`) führt aus einer
  laufenden Partie jetzt IMMER zum Hauptmenü.
- **v0.1.17 — Taverne-Atmosphäre + Szenen-Artwork.** Ein viewport-breiter
  Board-Hintergrund (`tavern-background.png`, Body-Ebene, `z-index: -1`)
  sowie ein großformatiges Gegner-Porträt in einer eigenen 220px-Spalte
  rechts neben dem Spielfeld (`avatar-<difficulty>.png`), beides mit
  CSS-Fallback. `docs/scene-art-brief.md` war layoutseitig schon vorher
  aktualisiert (Porträt-Spalte statt Inline-Bild) — der documenter hat bei
  diesem Sweep nur den oberen „Status"-Absatz korrigiert, der noch fälschlich
  „UI-Anbindung nicht beauftragt" behauptete; per Glob bestätigt: alle vier
  Bilddateien liegen bereits unter `docs/scene-art/` (gitignored).
  Bot-Anzeigenamen (`src/ai/difficulty.ts#BOT_DISPLAY_NAMES`: „Ollo
  Wackelhand"/„Guntram Eichenfaust"/„Silas Kaltblick" statt „player2", nur bei
  bot-gesteuerten Spielern, `PlayerId` selbst unverändert).
- **v0.1.17 — Animationen + verdeckte Gegner-Hand.**
  `document.startViewTransition()` (Fallback bei fehlender Browser-
  Unterstützung/`prefers-reduced-motion`) lässt Karten per
  `view-transition-name` zwischen Hand/Battlefield/Friedhof „morphen" statt
  hart zu snappen — Bot-Züge dadurch nachvollziehbar statt Snap, plus ein
  Lebenspunkte-„Puls" bei Änderung. Jede Nicht-„player1"-Hand zeigt jetzt nur
  noch Kartenrückseiten + Anzahl (`hiddenHandZone`) — bewusst hingenommene
  Einschränkung: ein echter zweiter Hotseat-Mensch kann seine Hand dadurch
  nicht mehr aktiv anklicken (kein Deadlock, Cleanup-Abwurf bewusst
  ausgenommen).
- **v0.1.17/v0.1.18 — Sound + Musik.** Zwölf Soundeffekte (`docs/sfx/`,
  CC0-Quellen in `docs/sfx/SOURCES.md`, event-basiert über
  `store.ts#playSfxForEvent`). Hintergrundmusik startete als feste
  Einzeldatei (v0.1.17), wurde in v0.1.18 auf Auto-Discovery umgestellt
  (`docs/music/` → `/music/index.json`, `components/musicPanel.ts`:
  Titelauswahl + Wiederholungsmodus Einzeltitel/Playlist) — beide über ein
  auf mehrere Asset-Ordner verallgemeinertes `vite.config.ts#staticArtPlugin`
  ausgeliefert. Per Glob bestätigt: 6 Musiktitel liegen bereits unter
  `docs/music/` (gitignored).
- **v0.1.18/v0.1.19 — Auto-Pass + Entscheidungs-Spotlight.**
  `store.ts#advanceAutomation`/`autoResolvableActionFor`: Priorität wird
  automatisch weitergereicht bzw. „keine Angreifer"/„keine Blocker"
  automatisch erklärt, sobald `getLegalActions` keine echte Wahl mehr bietet;
  steht eine echte Wahl an, macht ein auffälliges
  `decisionSpotlightBanner` statt des bisherigen unauffälligen Buttons
  darauf aufmerksam. **v0.1.19-Bugfix:** reine Mana-Fähigkeiten (Terrain fürs
  Mana antippen, `isManaAbility: true`) zählten fälschlich als „echte Wahl"
  und verhinderten Auto-Pass praktisch komplett/lösten das Spotlight-Banner
  ständig unnötig aus — `isRealPriorityCandidate` schließt sie jetzt explizit
  aus.
- **v0.1.17 — Tutorial-Bugfix.** `getTutorialPassPriorityBlockReason` sperrt
  „Priorität passen" jetzt zusätzlich während der `mainPhaseOnly`-Schritte
  (`playTerrain`/`castCreature`), solange eine passende Kandidatenaktion
  existiert — verhindert versehentliches Überspringen dieser Tutorial-Schritte.
- **v0.1.20 (zum Zeitpunkt dieses Sweeps NOCH NICHT committet, laut
  `git status`: `components/deckAnalysis.ts`/`components/savedDecksPanel.ts`
  neu, `components/deckBuilder.ts`/`store.ts`/`style.css` geändert) — Deck
  speichern/laden + Deck-Analyse + „Deck leeren".** `store.ts#SavedDeck`:
  benannte Deck-Speicherfunktion (Name + optionale Beschreibung, beliebig
  viele Slots, `localStorage`, unabhängig von der bestehenden „zuletzt
  bestätigte Deckliste"-Persistenz aus v0.1.8), `components/savedDecksPanel.ts`
  (Speichern-Formular + Laden-Panel mit Löschen). `components/deckAnalysis.ts`:
  Mana-Kurve/Farb-/Typverteilung der aktuellen Deckliste, reine CSS-Balken,
  live bei jedem +/--Klick neu berechnet. Zusätzlich ein „Deck leeren"-Button.
- **Testzahlen:** Engine unverändert bei **130** (keine Engine-Änderung).
  UI-Testdateien liefern laut Grep-Auszählung **19** einzeln benannte Fälle
  über 12 Dateien — neu seit v0.1.16: `golden-path.test.ts` (Umbenennung/
  Anpassung der bisherigen Golden-Path-Verifikation auf den Weg über das neue
  Hauptmenü), `main-menu.test.ts` (die drei neuen Hauptmenü-Klickpfade,
  inkl. Speichern eines Decks im „Deck Builder"-Modus — verifiziert damit
  bereits einen Teil von v0.1.20 mit), `rules-guide.test.ts`.
  **Wichtiger Hinweis:** `npm test`/`npm run build` konnten in dieser
  documenter-Session mangels Shell-Werkzeug NICHT selbst ausgeführt werden
  (anders als in einigen früheren Sweeps) — alle Zahlen/Verhaltens-
  behauptungen stammen aus direkter Code-/Kommentar-Lektüre der
  tatsächlichen `src/ui/*`-Dateien (u. a. `store.ts`, `render.ts`,
  `vite.config.ts`, alle neuen `components/*.ts`), NICHT aus Fertigstellungs-
  Nachrichten übernommen, aber auch nicht durch einen echten Testlauf/
  Browser-Screenshot bestätigt. Ebenso offen: echte Browser-Verifikation der
  Optik (Taverne-Hintergrund, Avatar-Spalte, Animationen, Spotlight-Banner).
- **documenter (dieser Sweep, 2026-07-20):** `docs/frontend-status.md` von
  v0.1.16 auf v0.1.20 gehoben — vier neue „auf einen Blick"-Kurzfassungen +
  vier neue Detail-Abschnitte (v0.1.17-v0.1.20) ergänzt, „Setup/Start" (App
  startet jetzt im Hauptmenü, nicht mehr direkt im Deckbau — die alte
  Formulierung war überholt), „Struktur"-Tabelle (neue Dateien/Zeilen +
  Annotationen an bestehenden Zeilen), „Was funktioniert" (Auto-Pass/
  Spotlight/automatische Kampf-Deklaration ergänzt) und „Bewusste
  Vereinfachungen" (Mehrfach-Deck-Verwaltung/Gegner-Auswahl/Hotseat-Hand-
  Einschränkung korrigiert) sowie „Nächste Schritte" (neue Punkte 13-17)
  aktualisiert. `docs/scene-art-brief.md`: veralteten Status-Absatz korrigiert
  (behauptete noch „UI-Anbindung nicht beauftragt", obwohl der Folgeschritt-
  Absatz direkt darunter bereits „inzwischen umgesetzt" sagte — jetzt
  konsistent, inkl. Bestätigung per Glob, dass alle vier Bilddateien bereits
  vorliegen). `docs/README.md`: Kopfzeile/Statustabelle auf v0.1.20 gehoben,
  neuer „Seit dem letzten Sweep"-Absatz, „Weitere offene Punkte" für
  frontend-engineer aktualisiert (Punkt 8 „fehlende Übergangsanimationen" als
  erledigt markiert, zwei neue Punkte: v0.1.20 uncommitted, Test-/Browser-
  Verifikation seit v0.1.17 ausstehend). **Keine Code-Datei angefasst** —
  dieser Sweep war reine Dokumentationsarbeit. `docs/rules-engine.md`,
  `docs/engine-status.md`, `docs/ai-status.md`, `docs/cards/starter-set.md`
  waren nicht Gegenstand dieses Sweeps (keine Engine-/Model-/Kartenpool-/
  KI-Änderung in der zugrundeliegenden Session) — nur eine kleine, seit
  längerem veraltete Versionsreferenz in `docs/frontend-status.md`s
  Kopfzeile (verwies noch auf `rules-engine.md` v0.3.1 statt v0.3.3) wurde
  nebenbei korrigiert.

## Meilenstein: Artwork-Vorhaben abgeschlossen + Tutorial-Neubau + Keyword-Glossar (reines Frontend, keine Engine-/Model-/Kartenpool-Änderung)

Deutlich kleinere Session als der vorige Sweep (2026-07-18) — ausschließlich
Frontend-Arbeit (`docs/frontend-status.md` v0.1.10 → v0.1.16), Regelwerk/
Engine/Kartenpool/KI unverändert. Drei voneinander unabhängige Stränge, alle
gegen den Code verifiziert statt Agent-Berichte blind zu übernehmen:

- **Artwork-Einbindung ins UI abgeschlossen** (v0.1.12/v0.1.13). Der Bildpfad
  wird rein aus der Karten-`id` abgeleitet (`id.replace(/\./g, "-") + ".png"`,
  kein neues Datenfeld im Kartenmodell) — ein selbst geschriebenes Vite-Plugin
  (`vite.config.ts#cardArtworkPlugin`) liefert die Bilder im Dev-Server per
  Middleware aus `docs/cards/artworks/` aus und kopiert sie beim
  Produktions-Build (`closeBundle`, nur bei echtem `command === "build"`,
  um Vitests interne Vite-Instanz nicht versehentlich mitschreiben zu
  lassen) nach `<outDir>/cards/artworks/`. Schlägt das Laden fehl (Datei
  fehlt), bleibt der bisherige Farbverlaufs-Platzhalter unverändert
  sichtbar (`<img>` wird per `onerror` aus dem DOM entfernt). v0.1.13 hat den
  `.card-frame-art`-Kunstbereich danach spürbar vergrößert (78/104/88px statt
  30/42px), da die Artworks im vorherigen schmalen Streifen stark
  beschnitten wirkten (Nutzer-Feedback zu v0.1.12). **Per Code/Dateisystem
  verifiziert:** `src/ui/components/cardArt.ts`/`vite.config.ts` entsprechen
  exakt der obigen Beschreibung; `docs/cards/artworks/` enthält per Glob
  nachgezählt **exakt 300 `.png`-Dateien** — der Nutzer hat seit dem letzten
  Sweep (damals 20 Dateien) alle 300 Artworks fertig generiert. Der Ordner
  ist bewusst NICHT im Git-Repo (`.gitignore`: `docs/cards/artworks/`,
  Kommentar dort nennt „~500 MB, lokal beim Nutzer vorhanden statt
  versioniert"). **Die beim letzten Sweep gefundene Dateinamens-Inkonsistenz
  ist aufgelöst:** `core.bastion-forgeworks` hieß damals fälschlich
  `core-bastion-forgework.png` (fehlendes „s") — die Datei liegt jetzt
  korrekt als `core-bastion-forgeworks.png` vor, deckungsgleich mit
  `docs/cards/card-art-brief.md`.
- **Tutorial-Modus, zwei weitere Iterationen** (v0.1.14, v0.1.16 — v0.1.11
  bereits im letzten Sweep dokumentiert). **v0.1.14:** Nutzer-Feedback nach
  dem ersten Durchlauf („ich kann irgendwie gar nichts machen") — mit dem
  festen `TUTORIAL_SEED` entschied der normale Münzwurf, dass der Bot
  (Spieler 2) den ersten kompletten Zug bekam, während der Mensch nur
  „Priorität passen" klicken konnte. Fix: `store.ts#startTutorial` übergibt
  jetzt explizit `startingPlayer: "player1"` an `initGame` (die Engine
  unterstützt `CreateGameConfig.startingPlayer` bereits nativ, keine
  Engine-Änderung nötig), gilt bewusst NUR für den Tutorial-Pfad. **v0.1.16:**
  kompletter Umbau von acht losen, passiv-einmaligen Info-Sprechblasen zu
  einer echten **13-Schritte-Sequenz** (`tutorialContent.ts#TUTORIAL_STEPS`):
  Instruktion → nicht-modales Hinweis-Banner mit hervorgehobenem Ziel-Element
  (`.tutorial-glow`) + „Schritt überspringen"-Sicherheitsnetz → erkannte
  Aktion → modale Bestätigungs-Sprechblase → nächster Schritt. Deckt
  Terrain/Mana/Kreatur-Beschwörung/Zielwahl/Schadenszauber/Buff-Zauber/
  Angriff/Kampfschaden/Block/Sieg-Bedingung ab. Bemerkenswerte
  Architektur-Entscheidung: `recomputeTutorialProgress` prüft nach JEDER
  Aktion alle 13 Schritte (nicht nur den aktiven) und merkt Treffer
  dauerhaft (`tutorialFactsSeen`) — macht die Sequenz robust gegenüber der
  nicht vorhersagbaren realen Reihenfolge (abhängig von Mana-Kurve/
  Bot-Verhalten), verifiziert über eine lokale Mehrzug-Simulation (13/13
  Schritte, Sieg in Zug 11, kein Absturz).
- **Neu: Keyword-Glossar** (v0.1.15, vorher nicht in `docs/README.md`/
  `docs/status.md` erfasst). Nutzer-Feedback: Karten zeigen Schlüsselwörter
  im Regeltext (z. B. „Todesberührung." bei `core.abyssal-lurker`), aber es
  gab keine Möglichkeit im UI nachzuschlagen, was ein Schlüsselwort bedeutet.
  Neues `src/ui/keywordGlossary.ts` mit spielerfreundlichen Erklärungen für
  alle 9 `Keyword`-Werte (**per Code verifiziert:** `KEYWORD_GLOSSARY` listet
  exakt `swift`/`airborne`/`reach`/`vigilant`/`lifelink`/`guardian`/
  `trample`/`firstStrike`/`deathtouch`). Zwei Zugriffswege: (1) In-Context —
  jedes erkannte Keyword-Wort in JEDER Regeltext-Box (Hand/Battlefield/
  Graveyard/Stack/Deckbau-Pool) wird hervorgehoben, zeigt die Erklärung per
  `title`-Hover UND öffnet per Klick eine kleine Sprechblase; (2) global —
  ein immer sichtbarer „? Schlüsselwörter"-Button (Status-Zeile der Partie
  UND Deckbau-Screen), bewusst UNABHÄNGIG vom Tutorial-Modus, öffnet ein
  Panel mit allen 9 Keywords. Dabei ein Grep-Befund dokumentiert (nicht
  behoben, außerhalb des Auftragsumfangs): die bestehende
  `KEYWORD_LABEL`-Badge-Kurzform (`cardInfo.ts`, seit v0.1.3) nennt
  `firstStrike`/`trample` als „Erstschlag"/„Trampeln", während sie im
  tatsächlichen Kartentext NUR als „Erststurm"/„Trampelschaden" vorkommen —
  zwei unabhängig entstandene deutsche Kurzformen für dasselbe Keyword an
  zwei UI-Stellen, ein Vereinheitlichungskandidat für später.
- **Testzahl 160+1 → 163+1**: Die drei Schritte oben brachten zusammen 3 neue
  UI-Tests (v0.1.15 `keyword-glossary.test.ts` +2, v0.1.16
  `tutorial.test.ts` komplett neu geschrieben für die Sequenz bei
  gleichbleibender Testfallzahl) — **per Grep gegen `src/ui/__tests__/*` und
  `src/engine/__tests__/*` nachgezählt:** Engine-Testzahl unverändert bei
  **130** (kein Engine-Code angefasst), Gesamtzahl jetzt **163 Tests grün +
  1 bewusst per `describe.skip` übersprungener Analyse-Test**, exakt
  konsistent mit der in `docs/frontend-status.md` v0.1.15/v0.1.16
  behaupteten Zahl. `npm run build`/`npm run build:ui` laut allen
  Verifikationsabschnitten in `docs/frontend-status.md` durchgehend sauber.
  **Hinweis:** `npm test`/`npm run build` konnten in dieser documenter-Session
  mangels Ausführungswerkzeug nicht selbst nachvollzogen werden (wie schon
  bei den Sweeps vom 2026-07-10/2026-07-18) — die Zahl stützt sich auf die
  Grep-Kreuzverifikation der Testdateien sowie die in `docs/frontend-status.md`
  je Versionsabschnitt dokumentierten Vitest-Läufe.
- **Neuer Backlog-Punkt (Nutzer-Notiz, ausdrücklich nur zur Kenntnisnahme,
  kein aktiver Auftrag):** Es fehlen Übergangsanimationen, besonders wenn die
  KI spielt — das Spielbrett aktualisiert sich aktuell abrupt/„flackert" bei
  jeder KI-Aktion statt eine nachvollziehbare Übergangsanimation zu zeigen
  (Ursache: das bewusst diffing-freie Voll-Neuaufbau-Rendering, s.
  `docs/frontend-status.md` „Tech-Stack-Entscheidung"). In
  `docs/README.md` „Weitere offene Punkte" unter frontend-engineer als neuer
  Punkt 8 aufgenommen.
- **documenter (dieser Sweep, 2026-07-19):** `docs/frontend-status.md` gegen
  den Code gelesen — v0.1.11 bis v0.1.16 waren bereits lückenlos und
  konsistent dokumentiert (inkl. v0.1.15 Keyword-Glossar, das laut Auftrag
  noch nicht in `docs/README.md`/`docs/status.md` stand), keine
  Korrektur am Dokument selbst nötig. `docs/README.md` (Statustabelle +
  „Nächste Schritte" + „Weitere offene Punkte") auf den neuen Gesamtstand
  gehoben. Konsistenzprüfung über `docs/ai-status.md`, `docs/engine-status.md`,
  `docs/rules-engine.md`, `docs/cards/starter-set.md`,
  `docs/cards/card-art-brief.md`: Test-Gesamtzahl 163 und Kartenpool-Größe
  300 tauchten vorher nur in `docs/frontend-status.md` in der neuen Höhe auf
  — `docs/engine-status.md`s „Aktueller Gesamtstand"-Notiz (documenter-Sweep
  2026-07-18) trug noch 160+1 statt 163+1, korrigiert (neue
  documenter-Zeile ergänzt, alte Notiz bewusst unverändert als historischen
  Stand belassen). `docs/ai-status.md`s eigene 160-Test-Referenz (Abschnitt
  10.4) ist eine historische Verifikation zum v2.1-Zeitpunkt (2026-07-11,
  vor allen hier beschriebenen Frontend-Schritten) und bleibt unverändert.
  `docs/cards/card-art-brief.md` und `docs/frontend-status.md` beschreiben
  Ablageort/Workflow der Artworks bereits konsistent (kein Anpassungsbedarf).
  **Keine Code-Datei angefasst** — dieser Sweep war reine Dokumentationsarbeit.

## Meilenstein: KI-Schwierigkeitsstufen + drei Engine-Bugfixes + Kartenrahmen-UI + 300-Karten-Ausbau + Artwork-Vorhaben

Umfangreichste Session seit dem letzten Sweep (2026-07-10). Fünf große,
weitgehend unabhängige Entwicklungsstränge, plus ein neues, nicht in die
5-Agent-Pipeline eingebettetes Nutzer-Vorhaben.

- **KI-Gegner: v1 → v2 → v2.1** (`docs/ai-status.md`). Der
  `ai-opponent-engineer`-Subagent (fable-5) hat den bisherigen
  Einzel-Bot (`simpleBot.ts`, v1) wie im letzten Sweep angekündigt zu drei
  echten Schwierigkeitsstufen ausgebaut: **easy** (`easyBot.ts`, deterministisch
  aus dem GameState abgeleiteter Zufall, absichtlich schwach, aber immer
  regelkonform), **medium** (unverändert `simpleBot.ts`, die bisherige
  v1-Heuristik), **hard** (`hardBot.ts`/`boardEval.ts`: budgetiertes
  1-Ply-Lookahead über echte `applyAction`-Simulation, effektive Stats/
  Keywords inkl. statischer Fremd-Effekte, echte Kampf-Mathematik/
  -Simulation mit zwei Gegner-Modellen, Performance-Budget max. 400
  simulierte Aktionen/Entscheidung). Deterministischer Stärkevergleich über
  feste Seeds bestätigt strikte Stärkeordnung (medium schlägt easy, hard
  schlägt medium/easy, je >= 60 % der entschiedenen Partien). **v2.1**
  (Reaktion auf eine Farb-Balance-Prüfung des fertigen 300-Karten-Sets, s.
  unten): zwei vom größeren Kartenpool aufgedeckte Legalitätsfehler behoben
  (easy/medium prüften Blocklegalität nur über Basis-Keywords, nicht über
  statisch gewährte wie eine neue guardian-Aura; alle Stufen reichten rohe
  modale Kandidaten unvollständig ein, jetzt konsumentenseitige
  Modus×Ziel-Vervollständigung in `boardEval.ts#expandModalCandidate`), plus
  ein neues, bewusst per `describe.skip` aus der Standard-CI ausgeschlossenes
  Analyse-Tool (`src/ai/__tests__/color-balance.analysis.test.ts`, manuell
  mit `BALANCE_ANALYSIS=1` ausführbar). **Ein echter Engine-Bug wurde dabei
  gefunden und gemeldet, nicht selbst behoben** (firstStrike-Token-Crash,
  s. Engine-Absatz unten) — exakt das vorgesehene Muster.

- **Engine: drei weitere Bugfixes, v0.3.2 → v0.3.5** (`docs/engine-status.md`,
  parallel dazu `docs/rules-engine.md` v0.3.1 → v0.3.3 mit den zugehörigen
  Entscheidungen 9.14/9.15). Alle drei wurden von ANDEREN Rollen beim
  Testen/Kartenbau gefunden, nicht vom engine-engineer selbst:
  1. **v0.3.3** — `combat.ts#dealCombatDamage` crashte, wenn ein
     TOKEN-Kampfteilnehmer in der firstStrike-Zwischenrunde starb (Fund:
     ai-opponent-engineer beim Stärkevergleichs-Testen, 2 von 250
     Bot-Partien betroffen). Fix: `hasKeyword` behandelt nicht mehr
     existierende Instanzen als "kein Keyword", plus ein zweiter,
     defensiver Existenz-Guard in der Blocker-Rückschlag-Schleife.
  2. **v0.3.4** (Entscheidung 9.14) — `destroyPermanent`/`returnToHand`/
     `exilePermanent` fehlte der Battlefield-Existenz-Guard, den die
     übrigen sieben permanent-bezogenen Effekte schon hatten (latent
     gefunden vom game-architect beim Ausarbeiten von 9.14, noch bevor eine
     Pool-Karte den Pfad auslöste) — hätte bei gelöschten Token-Instanzen
     gecrasht oder bei Graveyard-Karten ungewollt Zonen manipuliert
     (`exilePermanent` hätte aus dem Friedhof verbannt, `returnToHand` wäre
     ein unbeabsichtigtes "Raise Dead" gewesen).
  3. **v0.3.5** (Entscheidung 9.15) — `onDeath{self}`/`onUnitDied` feuerten
     nur auf dem SBA-Todespfad (Kampf-/letaler Schaden, nur Units), nicht
     bei `destroyPermanent` oder `sacrificeSelf`-Zusatzkosten, und nie für
     Nicht-Unit-Permanents (Fund: card-designer, `core.husk-crawler` zog
     keine Karte nach einem `core.doomreap-edict`-Destroy-Kill). Neue,
     verbindliche Regel: „Stirbt" = Zonenwechsel Battlefield → Graveyard,
     ursachenunabhängig; `onDeath{self}` jetzt typ-agnostisch (auch
     Relic/Enchantment/Terrain); `onUnitDied`/`unitDied` bleiben unit-only;
     `exilePermanent`/`returnToHand` sind bewusst KEIN Tod. Zentraler
     Tod-Hook jetzt in `zones.ts#leaveBattlefield` statt verstreuter
     Einzelaufrufe.
  Engine-Testzahl (nur `src/engine/__tests__/*`) 119 → **130** (v0.3.3 +2,
  v0.3.4 +2, v0.3.5 +7, per Grep gegengezählt). Gesamt-Testzahl über
  Engine+UI+KI: **160 Tests grün + 1 bewusst per `describe.skip`
  übersprungener Analyse-Test** (das neue Farb-Balance-Tool, s.o.).

- **Frontend: v0.1.8 → v0.1.9 → v0.1.10** (`docs/frontend-status.md`).
  **v0.1.9:** Anbindung der drei neuen Bot-Schwierigkeitsstufen — Dropdown
  im Deckbau-Screen von Spieler 2 (nur sichtbar bei aktiver KI-Steuerung),
  `botDifficulty`-Zustand pro Spieler in `store.ts` (Persistenz analog
  `isBotControlled`), `runBotStep` nutzt jetzt `chooseActionForDifficulty`,
  Stufen-Badge im Spieler-Panel während der Partie. **v0.1.10:** rein
  visuelle Überarbeitung — klassisches Kartenrahmen-Layout (farbcodierter
  Rahmen, Kopfzeile mit Name + Mana-Pips, Farbverlaufsfläche als bewusster
  Platzhalter OHNE Artwork, Typzeile, Regeltext-Box, P/T-Kasten) einheitlich
  für Handkarten, Battlefield-/Graveyard-/Stack-Kacheln und den
  Deckbau-Kartenpool (der dafür von einer Tabellenzeilen-Liste auf ein
  Flex-Wrap-Kartenraster umgebaut wurde). Keine Spiellogik-/Engine-Änderung.
  `npm test`/`npm run build` zum v0.1.10-Stand 151/151 bzw. sauber (danach
  kamen nur noch Engine-/KI-seitige Tests ohne weitere UI-Änderung hinzu).

- **Kartenpool: 113 → 300 Karten in 9 Batches, danach drei
  Balance-Korrekturrunden** (`docs/cards/starter-set.md`, v0.6 → v0.15,
  jetzt ein sehr langes Dokument — inkrementell lesen/grep statt in einem
  Rutsch). Batches 4–9 (v0.7–v0.12) haben den Pool systematisch über alle
  fünf Farben, alle sechs Kartentypen und alle neun Keywords ausgebaut
  (finale Verteilung: terrain 5, unit 110, spell 72, relic 56, enchantment
  57; Farben 49/49/49/49/48 über flame/tide/wild/light/void — fast perfekt
  gleichmäßig; Rarity 129/129/42 common/uncommon/rare). Danach hat der
  Auftraggeber selbst drei empirische Bot-Simulationsläufe (medium vs.
  medium, Mono-Farb-Decks) durchgeführt, auf die der card-designer jeweils
  reagiert hat:
  - **Runde 1 (v0.13):** `wild` gewann 73–75 % — gezielte Statlinien-Kürzung
    auf der 3-Mana-Stufe (10 von 14 Karten −1 Toughness) + ein Top-End-Ausreißer.
  - **Runde 2 (v0.14):** `wild` weiterhin 71,4 % (Runde 1 hatte einen
    versteckten Static-Bonus nicht mitgekürzt) — 7 Karten spürbar stärker
    korrigiert, u.a. Kostenerhöhung bei `core.grove-elder` (unbegrenzter
    Marken-Mana-Sink) und der effizientesten `addCounters`-Spell-Karte.
  - **Runde 3 (v0.15, 2026-07-18):** `wild` auf 64,7 % gesunken, aber Runde
    2s reine Kostenerhöhung hatte das strukturelle Problem (unbegrenzt oft
    aktivierbar) nicht behoben — `core.grove-elder`/`core.growth-totem`
    erhalten jetzt echte `{ kind: "tap" }`-Zusatzkosten (harte 1×/Zug-Grenze;
    eine Cross-Check aller 49 aktivierten Fähigkeiten im Set bestätigt,
    dass dies die einzigen zwei unbegrenzten Mana-Sinks waren). Zusätzlich
    wurde `void`s seit zwei Messungen stabiler 23:7-Vorsprung gegenüber
    `tide`/`light` geprüft: strukturell erklärbar (mehr Tod-Trigger-Kreaturen
    + bedingungslose Entfernungszauber als jede andere Farbe), aber KEINE
    einzelne `void`-Karte ist im 1:1-Preisvergleich fehlbepreist — bewusst
    NICHT korrigiert, ausführlich begründet im Dokument. Card-Designer
    bewertet weiteres Nachschärfen an `wild` als praktisch wirkungslos.

- **Neu, außerhalb der 5-Agent-Pipeline: Karten-Artwork-Vorhaben**
  (`docs/cards/card-art-brief.md`, neuer Ordner `docs/cards/artworks/`).
  Ein Stilleitfaden (gemalter Fantasy-Sammelkartenspiel-Look, Farbthemen je
  Mana-Farbe, 4:3/3:2-Seitenverhältnis) plus eine 300-Zeilen-Tabelle
  (Dateiname 1:1 aus der Karten-`id`, kurze deutsche Bildbeschreibung) als
  Auftragsgrundlage für externe Bildgenerierung (Gemini/ChatGPT o.ä. — nicht
  Teil dieser Werkzeugkette). Der Nutzer legt die fertigen Bilder manuell in
  `docs/cards/artworks/` ab — **aktiv, noch nicht abgeschlossen**, aktuell
  **20 Dateien** vorhanden (zum Zeitpunkt des vorigen Zwischenberichts an
  den documenter waren es 9 — der Bestand wächst laufend weiter). Noch
  keine Anbindung ans UI (der Kartenrahmen aus v0.1.10 zeigt weiterhin nur
  die Farbverlaufsfläche). **Gefundene Inkonsistenz (dokumentiert, nicht
  behoben — Bild-Datei liegt außerhalb der Doku-Schreibrechte des
  documenters):** Für `core.bastion-forgeworks` nennt die Brief-Tabelle den
  Dateinamen `core-bastion-forgeworks.png`, die tatsächlich abgelegte Datei
  heißt aber `core-bastion-forgework.png` (fehlendes „s" am Ende) — sollte
  vom Nutzer selbst umbenannt werden, falls ein künftiges Anbindungs-Skript
  exakten Dateinamensabgleich braucht.

- **documenter (dieser Sweep, 2026-07-18):** Alle fünf Modul-Dokumente
  (`docs/rules-engine.md`, `docs/engine-status.md`, `docs/cards/starter-set.md`,
  `docs/frontend-status.md`, `docs/ai-status.md`) gelesen und Kernbehauptungen
  gegen den Code verifiziert statt Agent-Berichte blind zu übernehmen:
  Kartenzahl 300 + 3 Token per Grep gegen `src/cards/starter-set.ts`
  bestätigt (303 `id: "core.…"`-Treffer, davon 3 echte `isToken:true`-Felder
  — ein vierter Grep-Treffer ist nur ein Code-Kommentar); Engine-Testzahl
  130 per Grep gegen `src/engine/__tests__/*.test.ts` nachgezählt und exakt
  gegen die arithmetische Summe der einzelnen Versions-Abschnitte
  (119+2+2+7) verifiziert; Test-Gesamtzahl 160+1 übersprungen über alle drei
  Modul-Dokumente konsistent gefunden; Artwork-Ordner tatsächlich ausgezählt
  (20 Dateien, nicht die im Auftrag genannten 9 — der Bestand ist seither
  gewachsen, im Text oben korrekt als „aktuell 20" statt der veralteten
  Zahl dokumentiert). **`npm test`/`npm run build` konnten in dieser Session
  nicht selbst ausgeführt werden (kein Ausführungswerkzeug verfügbar,
  wie schon beim Sweep vom 2026-07-10)** — die 160/160-Behauptung stützt
  sich auf die Grep-Kreuzverifikation, die untereinander konsistenten
  Verifikationsabschnitte von engine-engineer/ai-opponent-engineer sowie die
  vom Auftraggeber selbst mitgeteilte, bereits verifizierte Zahl; keine
  Abweichung zwischen den Quellen gefunden. **Gefundene Inkonsistenzen,
  korrigiert:**
  - `docs/ai-status.md` referenzierte in der Kopfzeile noch
    „`docs/rules-engine.md` (v0.3.1)" statt v0.3.3 — korrigiert (mit
    Anmerkung, dass die beiden zusätzlichen Entscheidungen 9.14/9.15 keine
    KI-relevanten Auswirkungen haben, kein Nacharbeitsbedarf für den
    ai-opponent-engineer).
  - `docs/engine-status.md`s eigene „Offene Fragen"-Liste führte
    „Echte Mulligan-UI fehlt noch" weiterhin als offenen Punkt, obwohl
    `docs/frontend-status.md` v0.1.6 (bereits vor dem letzten Sweep) einen
    echten Mulligan-Dialog geliefert hatte — als erledigt markiert.
  - `docs/engine-status.md`s „## Tests"-Abschnitt und Kopfzeile trugen noch
    die Zwischenstände aus dem letzten Sweep (119 Engine-/141
    Gesamt-Tests) — auf den aktuellen Stand (130 Engine-/160 Gesamt-Tests)
    gehoben, inkl. Ergänzung der drei neuen Bugfix-Testgruppen in den
    jeweiligen Datei-Bullets (`combat-keywords.test.ts`,
    `triggers-and-misc.test.ts`).
  - `docs/frontend-status.md` Punkt 8 der „Nächste Schritte" (Sorge um
    Deckbau-Screen-Performance „bei einem künftig deutlich größeren
    Kartenpool, weit über 109") ist mit dem jetzigen 300-Karten-Pool
    tatsächlich eingetreten, aber laut Dokument nicht neu gemessen worden —
    **nicht selbst korrigiert** (echte Performance-Messung ist Sache des
    frontend-engineer), stattdessen in `docs/README.md` „Weitere offene
    Punkte" als offener Punkt an frontend-engineer zurückgemeldet.
  - `docs/rules-engine.md` selbst war bereits vollständig aktuell (v0.3.3,
    Entscheidungen 9.14/9.15 inkl. Abschnitt 10 bereinigt) — keine Änderung
    nötig, game-architect hatte das Dokument bereits selbst gepflegt.
  `docs/README.md` (Statustabelle + „Nächste Schritte") komplett auf den
  neuen Gesamtstand gehoben, inkl. einer neuen Tabellenzeile für das
  Artwork-Vorhaben und aktualisierten „Weitere offene Punkte" je Rolle
  (abgeleitet aus den jeweils eigenen, aktuellen Ausblick-Abschnitten der
  Modul-Dokumente, nicht geraten).

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
| Regelwerk | v0.3.3 (9.14: einheitlicher stiller Nicht-Permanent-Fizzle für `eventSubject`; 9.15: zonenbasierte Todesdefinition, `onDeath{self}` typ-agnostisch) | — (Design-Dokument), inhaltlich bereits vollständig konsistent mit dem Code vorgefunden |
| Datenmodell | v0.2.1 mit v0.3-Erweiterungen (unverändert seit v0.3.1 — 9.14/9.15 brauchten keinen Modell-Umbau, nur Kommentar-Präzisierungen) | unverändert an sich |
| Engine | v0.3.5 (v0.3.3 firstStrike-Token-Crash-Fix, v0.3.4 Battlefield-Guard für `destroyPermanent`/`returnToHand`/`exilePermanent`, v0.3.5 zentraler Tod-Hook in `zones.ts#leaveBattlefield`) | **130 Engine-Tests** (unverändert seit v0.3.5, keine Engine-Änderung in dieser Session), Zahl per Grep gegengezählt (`npm test`/`npm run build` in dieser Sweep-Session mangels Ausführungswerkzeug nicht selbst ausgeführt) |
| Starter-Kartenset | v0.15 (300 Karten + 3 Token-Definitionen, 9 Batches + 3 Balance-Korrekturrunden) | per Grep gegen `src/cards/starter-set.ts` verifiziert (303 `id:"core.…"` − 3 echte Token = 300; ein 4. Grep-Treffer ist nur ein Kommentar) |
| Frontend/UI | **v0.1.20** (v0.1.17 echtes Hauptmenü + Taverne-Atmosphäre/Szenen-Artwork + View-Transitions-Animationen + verdeckte Gegner-Hand + Sound, v0.1.18 Auto-Discovery-Musik-Playlist + Auto-Pass + Entscheidungs-Spotlight, v0.1.19 Mana-Fähigkeit-Bugfix, v0.1.20 Deck speichern/laden + Deck-Analyse-Panel + „Deck leeren" — **v0.1.20 selbst laut `git status` noch NICHT committet**) | UI-Testdateien liefern laut Grep-Auszählung 19 einzeln benannte Fälle über 12 Dateien (neu: `golden-path.test.ts`/`main-menu.test.ts`/`rules-guide.test.ts`) — **kein echter `npm test`-Lauf in dieser Session möglich** (kein Shell-Werkzeug), Zahlen sind Code-/Grep-basiert plausibilisiert, nicht durch Testlauf bestätigt |
| KI-Gegner | v2.1 (easy/medium/hard, `src/ai/difficulty.ts` + `easyBot.ts`/`hardBot.ts`/`boardEval.ts`; v2.1 = zwei Legalitätsfixes fürs 300-Karten-Set + Farb-Balance-Analyse-Tool) | deterministischer Stärkevergleich bestätigt strikte Stufenordnung (>= 60 % der entschiedenen Partien je Stufe höher); fand und meldete den in der Engine-Zeile gelisteten firstStrike-Crash |
| Karten-Artwork (Nutzer-Vorhaben, außerhalb der Pipeline) | `docs/cards/card-art-brief.md`, `docs/cards/artworks/` | **abgeschlossen** — alle 300 Artworks fertig, per Glob nachgezählt, vollständig ins UI integriert (s. Frontend-Zeile), bewusst nicht im Git-Repo (`.gitignore`); der zuvor gefundene Dateinamens-Mismatch bei `core.bastion-forgeworks` ist behoben |

## Offene Punkte (nicht blockierend), siehe `docs/README.md` "Nächste Schritte" für Details

Der im vorigen Zwischenstand als „nächster geplanter Meilenstein"
angekündigte KI-Ausbau zu drei Schwierigkeitsstufen ist abgeschlossen (s.
Meilenstein oben). Verbleibend:

- **card-designer:** weiterhin kein Hauptauftrag offen — das vereinbarte
  ~300-Karten-Ziel ist erreicht und dreifach nachbalanciert. Optionale,
  ausdrücklich nicht beauftragte Kandidaten für ein künftiges
  Erweiterungsset (nur nach Rücksprache): Subtyp-Synergien, Karten mit >1
  Zielslot, `void`s strukturelle Stärke im Auge behalten.
- **engine-engineer:** offene Rückfrage an game-architect zur Bedeutung von
  `StaticAbility.scope` bei `costChange` (weiterhin unbeantwortet);
  StaticAbility-Test für `stats`/`grantKeyword` (fehlt weiterhin); Migration
  `chooseManaColor`/`chooseDiscard`/`orderScry` auf Pending-Decision-Kanal
  (sobald Kartenpool-Bedarf besteht).
- **frontend-engineer:** dauerhafter Klick-Test für den modalen Trigger-Fall
  (`core.current-diplomat`, Code-Pfad steht, Test fehlt noch); Mehrfach-
  Zielslot-UI (kein Pool-Bedarf bisher); `computeEffectiveStats`/
  `computeEffectiveKeywords` offiziell in den `RulesEngine`-Vertrag heben;
  Migration `chooseManaColor`/`chooseDiscard`/`orderScry` (s.o.); Bot-vs-Bot-
  Zuschauermodus (Umschalter bisher nur für Spieler 2); Deckbau-Screen-
  Performance mit dem jetzt tatsächlich sehr großen 300-Karten-Pool ist
  weiterhin ungeprüft. ~~Fehlende Übergangsanimationen~~ **erledigt in
  v0.1.17** (View-Transitions-Animationen). **Neu (2026-07-20):** ein
  gezielter Test für Laden/Löschen/Überschreiben eines gespeicherten Decks
  sowie für die Deck-Analyse-Anzeige selbst fehlt noch (v0.1.20 ist bisher
  nur indirekt über `main-menu.test.ts` mitverifiziert); **v0.1.20 committen**
  (stand laut `git status` bei diesem Sweep noch aus); echte Browser-/
  Screenshot-Verifikation der v0.1.17-Optik (Taverne-Hintergrund,
  Avatar-Spalte, Animationen, Spotlight-Banner) steht aus; ein echter
  `npm test`/`npm run build`-Lauf seit v0.1.17 steht ebenfalls aus (dem
  documenter stand in dieser Session kein Shell-Werkzeug zur Verfügung).
- **game-architect:** offene Rückfrage vom engine-engineer zu
  `StaticAbility.scope` bei `costChange`; die großen, bewusst vertagten
  Themen aus Abschnitt 10 (>2 Spieler, Kontrollwechsel/Kopier-Effekte/
  Keyword-Entzug, Double-Strike-Analog, Priority-Fenster zwischen den
  Schadensrunden, trample-Über-Zuteilung, Spielerwahl bei Trigger-
  Reihenfolge, „Spieler erleidet Schaden"-Trigger, London-Mulligan-Upgrade,
  „wähle zwei" bei Modal-Effekten, rekursive Cleanup-Sonderregel,
  `addMana("any")`/`discardCards`/`scry`-Migration, kombinatorische
  `getLegalActions`-Enumeration, **neu seit 9.14/9.15:** „ein beliebiges
  Permanent stirbt"-Beobachter-Trigger, Graveyard-Zonen-Primitiv für
  „Removal-bei-Tod") — alle ausdrücklich nur bei konkretem Kartenbedarf
  anzugehen, kein aktiver Auftrag.
- **ai-opponent-engineer:** X-Kosten/Mehrfach-Zielslot-Karten werden von
  keiner Stufe gecastet; kein echtes Multi-Ply-Minimax/MCTS; kein
  Instant-Speed-Spiel in irgendeiner Stufe; Balance-Empfehlungen aus der
  Farb-Analyse liegen jetzt größtenteils beim card-designer erledigt (drei
  Runden, s. Meilenstein oben) — das Analyse-Tool kann bei Bedarf jederzeit
  erneut laufen.
- **documenter:** Der beim Sweep vom 2026-07-18 gemeldete Dateinamens-Mismatch
  im Artwork-Ordner (`core-bastion-forgework.png` statt
  `core-bastion-forgeworks.png`) ist inzwischen vom Nutzer behoben (per Glob
  verifiziert, s. Meilenstein oben) — kein offener Punkt mehr. **Neu
  (2026-07-20):** dieser Sweep hatte kein Shell-Werkzeug zur Verfügung —
  `npm test`/`npm run build` konnten nicht selbst ausgeführt werden (anders
  als bei manchen früheren Sweeps); alle Behauptungen in
  `docs/frontend-status.md`/`docs/README.md`/diesem Dokument stammen aus
  direkter `Read`/`Grep`-Lektüre der `src/ui/*`-Dateien. Bei einem künftigen
  Sweep mit Shell-Zugriff sollte `npm test`/`npm run build` nachgeholt und
  gegen die hier dokumentierten Zahlen (130 Engine, 19 UI-Testfälle)
  gegengeprüft werden.
