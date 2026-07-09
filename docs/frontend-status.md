# Frontend-Status

Status: v0.1.6 (frontend-engineer) — 2026-07-09
Grundlage: `docs/rules-engine.md` (v0.3.1, Entscheidungen 9.10-9.13 + Nachtrag),
`docs/engine-status.md` (v0.3.1, 118 Engine-/UI-Tests zum Zeitpunkt der
Übernahme — der v0.1.1-v0.1.5-Text unten beschreibt bewusst unverändert den
Stand zum jeweiligen Zeitpunkt, s. dortige Abschnitte), `src/model/*`
(Datenmodell, unverändert konsumiert), `src/engine/*` (`createRulesEngine`),
`src/cards/starter-set.ts` (113 Karten, u.a. die drei neuen v0.3-Testkarten
`core.void-covenant`, `core.current-diplomat`, `core.cinderwrack-engine`).

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
npm test            # Vitest (83 Engine-Tests + jetzt 2 dauerhafte UI-Tests, s. v0.1.5-Abschnitt)
```

`tsconfig.json` wurde um `"DOM"`/`"DOM.Iterable"` in `lib` erweitert (damit
`tsc --noEmit` auch den UI-Code type-checkt); das ändert nichts an der
Engine-Kompilierung, fügt nur zusätzliche globale Typen hinzu.
`package.json` hat drei neue Skripte (`dev`, `build:ui`, `preview`), `vite`
als Dev-Dependency (seit v0.1) und **seit v0.1.5** zusätzlich `jsdom` als
Dev-Dependency (für die dauerhaften UI-Tests, s.u.); bestehende
Skripte/Dependencies sind ansonsten unverändert.

**Seit v0.1.5** (s. eigener Abschnitt unten, löst den v0.1-v0.1.4-Text in
diesem Absatz ab): Beim App-Start erscheint zuerst ein **Deckbau-Screen**
(kein automatischer Partiestart mehr) — Spieler 1 baut sein Deck, dann
Spieler 2 (mit einer „Gleiches Deck wie Spieler 1 übernehmen"-Abkürzung),
danach „Spiel starten". `buildDemoDeck` (`src/ui/deck.ts`, unverändert seit
v0.1.4: alle 5 Terrains fest 4×, dazu eine zufällige Stichprobe von bis zu 40
verschiedenen Nicht-Terrain-Karten je 1×) existiert weiterhin, wird aber
nicht mehr automatisch für beide Spieler aufgerufen, sondern steht im
Deckbau-Screen als „Zufällig füllen"-Button zur Verfügung. Über den Button
„Neues Spiel" im laufenden Spiel geht es zurück zum Deckbau-Screen (nicht
mehr `location.reload()`) — die zuletzt benutzten Decklisten bleiben dabei
als Vorbefüllung erhalten.

Es gibt aktuell **keine Spielerauswahl über Deckbau hinaus** und **keine
KI** — das Board ist als Hotseat gedacht: beide Spielerbereiche sind immer
sichtbar, aber nur der Spieler, der laut `GameState` gerade an der Reihe ist
(Priority, PendingDecision, Combat-Deklaration, Cleanup-Abwurf), bekommt
anklickbare Aktionen angezeigt.

## Struktur (`src/ui/`)

| Datei | Zweck |
|---|---|
| `main.ts` | Einstiegspunkt, startet Store + Render-Loop (**seit v0.1.5**: kein automatischer `initGame`-Aufruf mehr, App startet im Deckbau-Screen) |
| `store.ts` | Einzige Engine-Instanz (`createRulesEngine(starterSet)`), hält `GameState` + UI-Modus, kapselt `dispatch`/`legalActions`, Event→Log-Übersetzung; **seit v0.1.5** zusätzlich die App-Ebene-Phase (`AppPhase`: Deckbau vs. Spiel, s.u.) + gesammelte Decklisten, `initGame(deckP1, deckP2, seed?)` nimmt jetzt zwei Decklisten entgegen statt intern immer `buildDemoDeck` zu rufen |
| `types.ts` | `UiMode`-Union (rein UI-intern, kein Teil des `GameState`); **seit v0.1.5** zusätzlich `AppPhase` (Deckbau vs. Spiel, App-Ebene, ebenfalls kein Teil der Engine); **seit v0.1.6** neuer `CastSource`-Typ (spell/ability) + `UiMode`-Zweige `modeSelect`/verallgemeinerte `xInput`/`xTarget` (s. eigener Abschnitt unten) |
| `deck.ts` | `buildDemoDeck`: baut eine zufällige Demo-Deckliste aus dem `CardPool` (reine Daten); **seit v0.1.5** nicht mehr automatischer Partiestart, sondern der „Zufällig füllen"-Button im Deckbau-Screen |
| `deckValidation.ts` | **Neu in v0.1.5**: reine UI-Validierung einer Deckliste (min. 40 Karten, max. 4 Kopien pro Nicht-Terrain-id, s. `src/model/cards.ts#Decklist`-Kommentar) — die Engine validiert das selbst nicht |
| `cardInfo.ts` | Anzeige-Hilfsfunktionen (Kosten-Formatierung, Farb-Klassen, Keyword-Labels); nutzt `computeEffectiveStats`/`computeEffectiveKeywords` aus der Engine für P/T-Anzeige (siehe Abschnitt „Grenzfall" unten); **seit v0.1.5** zusätzlich `dominantColorKey` (Manafarbe als Schlüssel statt CSS-Klasse, für den Deckbau-Farbfilter) |
| `actionUtil.ts` | Kandidaten↔Ziel-Zuordnung (`targetKeyOf`) + „Form"-Prüfung für die X-Kosten-Eingabe-UI; **seit v0.1.6** zusätzlich die `CastSource`-Helfer (`sourceName`/`sourceModes`/`sourceHasXCost`/`sourceTargets`/`buildCastAction`/`activateAbilityCandidatesFor`), die castSpell und activateAbility für den gemeinsamen Modus-/X-/Ziel-Flow vereinheitlichen |
| `h.ts` | Winziger Hyperscript-Helfer (kein Framework) |
| `render.ts` | Zentrale Render-Funktion + Interaktionsverdrahtung (Klicks → `dispatch`/`setUiMode`); **seit v0.1.5** verzweigt `render()` zuerst nach `AppPhase` (Deckbau-Screen vs. `renderGameBoard`); **seit v0.1.6** neue `pendingDecision`-Zweige `mulligan`/`chooseMode`, neuer `modeSelect`-Zweig, verallgemeinerter `xInput`/`xTarget`-Zweig (spell + ability), neue Battlefield-Erkennung für modale/X-Kosten-Fähigkeiten |
| `components/*` | Einzelne Darstellungsbausteine (Kartenkacheln, Handkarten, Spieler-Panel, Stack, Log, Aktions-Banner); **seit v0.1.5** zusätzlich `deckBuilder.ts` (Deckbau-Screen); **seit v0.1.6** neue Panels in `actionPanels.ts` (`mulliganPanel`, `modeSelectPanel`, `chooseModeDecisionPanel`), `handCard.ts` mit neuem `offerModeFlow`/`onStartModeFlow`, `playerPanel.ts` mit `data-player`-Attribut (Testbarkeit) |
| `style.css` | Funktionales Layout, dunkles Theme, Farbcodierung nach Manafarbe; **seit v0.1.6** `.mode-select-list`/`.mode-select-btn` |
| `__tests__/*` | **Neu in v0.1.5**: dauerhafte Vitest+jsdom-Tests (bleiben im Repo, s. eigener Abschnitt unten); **seit v0.1.6** zusätzlich `mulligan.test.ts`, `modal-effects.test.ts`, `x-cost-ability.test.ts` + gemeinsame Test-Infrastruktur `testHelpers.ts` (Klick-/Deck-/Autopilot-Helfer, kein Produktionscode) |

## Was funktioniert

1. **Grundlayout** (Pflichtanzeigen laut rules-engine.md Abschnitt 3 /
   docs/README.md): Zwei Spielerbereiche (Hand/Battlefield/Graveyard je
   Spieler), gemeinsamer Stack-Bereich (unten→oben, oberstes Element optisch
   hervorgehoben), Status-Zeile (Zugnummer, Step, aktiver Spieler,
   Priority-Inhaber oder „Engine verarbeitet Turn-Based Action"),
   Ereignis-Log (menschenlesbare `GameEvent`-Zusammenfassung).
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
   - `Aufgeben`/`concede` ist nicht als dedizierter Button verdrahtet (siehe
     „Was noch fehlt" unten).
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
- **Kein AI-Gegner, kein Netzwerk** — reines Hotseat-Board. **Seit v0.1.5**
  gibt es einen echten Deckbau-Screen vor dem Spielstart (s. eigener
  Abschnitt unten) statt eines fest codierten Demo-Decks; der Deckbau selbst
  bleibt aber bewusst simpel (kein Sideboard, kein Deck-Speichern/-Laden über
  eine Partie hinaus außer der reinen In-Memory-Vorbefüllung nach „Neues
  Spiel", keine Deck-Namen/-Verwaltung mehrerer Decks).
- **Opfer-/Zusatzkosten-Feedback**: `additionalCosts` (tap/sacrifice/
  payLife/discard/removeCounters) werden nicht separat abgefragt — die
  Engine wendet sie beim Ausführen an (bzw. wirft Karten automatisch nach
  Auto-Default ab, siehe `docs/rules-engine.md` 9.7); das Frontend zeigt nur
  das Ergebnis über den State/Log, keine eigene Bestätigungs-UI dafür.
- **`concede` ist nicht verdrahtet**: Die Aktion existiert und wäre trivial
  ergänzbar (ein Button pro Spieler, immer sichtbar), wurde aber für v0.1
  ausgelassen, um den Interaktionsumfang überschaubar zu halten.
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

## Nächste Schritte (Vorschläge)

1. ~~**UI-Automatisierung**~~ **erledigt in v0.1.5** (s. eigener Abschnitt
   oben) — `src/ui/__tests__/` mit `jsdom` als Dev-Dependency, dauerhaft im
   Repo.
2. **`concede`-Button** ergänzen (trivial, aber für Testpartien nützlich).
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
6. ~~**Deckbau-UI**~~ **erledigt in v0.1.5** (s. eigener Abschnitt oben) —
   bewusst simpel gehalten (kein Sideboard, kein Deck-Speichern über eine
   Session hinaus, keine Mehrfach-Deck-Verwaltung); wäre bei Bedarf
   erweiterbar.
7. **Bessere Zugänglichkeit/Ergonomie**: aktuell keine Tastatursteuerung,
   keine Bestätigungsdialoge für irreversible Aktionen (z. B. Opfern),
   kein „Undo" (entspricht dem Engine-Modell, das keine Rücknahme kennt).
8. **Deckbau-Screen für sehr kleine Bildschirme/viele Karten**: aktuell nur
   ein scrollbarer `max-height`-Container ohne Virtualisierung — bei einem
   künftig deutlich größeren Kartenpool (weit über 109) könnte das UI träge
   werden (kein Problem beim aktuellen Umfang, gemessen über den
   Produktionsbuild).
