# Frontend-Status

Status: v0.1.4 (frontend-engineer) — 2026-07-09
Grundlage: `docs/rules-engine.md` (v0.2.3), `docs/engine-status.md` (v0.2.4 zum
Zeitpunkt dieses Sweeps — der v0.1.1-v0.1.3-Text unten beschreibt bewusst
unverändert den Stand zum jeweiligen Zeitpunkt, s. dortige Abschnitte),
`src/model/*` (Datenmodell, unverändert konsumiert), `src/engine/*`
(`createRulesEngine`, 83 Tests grün nach dem v0.2.4-`costChange`-Lückenschluss;
Stand zum Zeitpunkt der v0.1.1-v0.1.3-Abschnitte war 77 Tests nach dem
v0.2.3-Kampf-Keyword-Paket `trample`/`firstStrike`/`deathtouch` +
`orderBlockers`), `src/cards/starter-set.ts` (**für v0.1.4 relevant:
inzwischen auf 109 Karten gewachsen — 104 Nicht-Terrain + 5 Terrains, inkl.
echter Karten mit allen neun Keywords —, s. neuer Abschnitt unten; zum
Zeitpunkt der v0.1.1-v0.1.3-Abschnitte hatte der Pool noch 27 Karten ohne
`trample`/`firstStrike`/`deathtouch`/`vigilant`, s. dortige Verifikationstexte).

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
npm test            # unverändert: Vitest (83 Engine-Tests, Stand v0.2.4, UI ungetestet, s.u.)
```

`tsconfig.json` wurde um `"DOM"`/`"DOM.Iterable"` in `lib` erweitert (damit
`tsc --noEmit` auch den UI-Code type-checkt); das ändert nichts an der
Engine-Kompilierung, fügt nur zusätzliche globale Typen hinzu.
`package.json` hat drei neue Skripte (`dev`, `build:ui`, `preview`) und
`vite` als neue Dev-Dependency; bestehende Skripte/Dependencies sind
unverändert.

Beim Start wird automatisch eine Demo-Partie erzeugt: beide Spieler erhalten
ein identisches Demo-Deck, das aus dem `starterSet` gezogen wird
(`src/ui/deck.ts#buildDemoDeck`). **Seit v0.1.4** (s. eigener Abschnitt
unten): alle 5 Terrains weiterhin fest 4×, dazu eine zufällige Stichprobe
von bis zu 40 verschiedenen Nicht-Terrain-Karten (je 1×) statt „alle
Nicht-Terrain-Karten 1×" — bei den inzwischen 109 Pool-Karten ergibt „alle"
ein unhandliches ~124-Karten-Deck, die Stichprobe deckelt auf ~60 Karten.
Das ist **kein Deckbuilder** — nur Dateninitialisierung für die
Prototyp-Partie; ein echtes Deckbau-UI ist nicht Teil dieses Schritts.
Über den Button „Neues Spiel" (lädt die Seite neu) startet eine neue Partie
mit neuem Zufalls-Seed.

Es gibt aktuell **keine Deck-/Spielerauswahl** und **keine KI** — das Board
ist als Hotseat gedacht: beide Spielerbereiche sind immer sichtbar, aber nur
der Spieler, der laut `GameState` gerade an der Reihe ist (Priority,
PendingDecision, Combat-Deklaration, Cleanup-Abwurf), bekommt anklickbare
Aktionen angezeigt.

## Struktur (`src/ui/`)

| Datei | Zweck |
|---|---|
| `main.ts` | Einstiegspunkt, startet Store + Render-Loop |
| `store.ts` | Einzige Engine-Instanz (`createRulesEngine(starterSet)`), hält `GameState` + UI-Modus, kapselt `dispatch`/`legalActions`, Event→Log-Übersetzung |
| `types.ts` | `UiMode`-Union (rein UI-intern, kein Teil des `GameState`) |
| `deck.ts` | Demo-Deckliste aus dem `CardPool` (reine Daten, kein Deckbau-UI) |
| `cardInfo.ts` | Anzeige-Hilfsfunktionen (Kosten-Formatierung, Farb-Klassen, Keyword-Labels); nutzt `computeEffectiveStats`/`computeEffectiveKeywords` aus der Engine für P/T-Anzeige (siehe Abschnitt „Grenzfall" unten) |
| `actionUtil.ts` | Kandidaten↔Ziel-Zuordnung (`targetKeyOf`) + „Form"-Prüfung für die X-Kosten-Eingabe-UI |
| `h.ts` | Winziger Hyperscript-Helfer (kein Framework) |
| `render.ts` | Zentrale Render-Funktion + Interaktionsverdrahtung (Klicks → `dispatch`/`setUiMode`) |
| `components/*` | Einzelne Darstellungsbausteine (Kartenkacheln, Handkarten, Spieler-Panel, Stack, Log, Aktions-Banner) |
| `style.css` | Funktionales Layout, dunkles Theme, Farbcodierung nach Manafarbe |

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
- **Kein AI-Gegner, kein Netzwerk, kein Deckbuilder-UI** — reines
  Hotseat-Board für eine lokale Demo-Partie mit fest codiertem Demo-Deck.
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

## Nächste Schritte (Vorschläge)

1. **UI-Automatisierung**: Ein paar echte Vitest+jsdom-Tests für
   `store.ts`/`render.ts` dauerhaft ins Repo aufnehmen (inkl. `jsdom` als
   Dev-Dependency), damit UI-Regressionen auffallen — aktuell nur manuell
   verifiziert.
2. **`concede`-Button** ergänzen (trivial, aber für Testpartien nützlich).
3. **Karten mit >1 Zielslot / X auf aktivierten Fähigkeiten**: Sobald der
   Card-Designer/Game-Architect solche Karten/Fähigkeiten einführt, braucht
   die `xTarget`-UI eine Mehrfach-Slot-Erweiterung (Grundgerüst ist im
   `UiMode`-Typ vorbereitet, aber nur für einen Slot implementiert).
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
6. **Deckbau-UI** (Decklist-Auswahl statt fest codiertem Demo-Deck) — klar
   außerhalb dieses Schritts, aber die nötige Feuerprobe.
7. **Bessere Zugänglichkeit/Ergonomie**: aktuell keine Tastatursteuerung,
   keine Bestätigungsdialoge für irreversible Aktionen (z. B. Opfern),
   kein „Undo" (entspricht dem Engine-Modell, das keine Rücknahme kennt).
