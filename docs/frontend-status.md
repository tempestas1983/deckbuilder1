# Frontend-Status

Status: v0.1.1 (frontend-engineer) — 2026-07-08
Grundlage: `docs/rules-engine.md` (v0.2), `docs/engine-status.md` (v0.2),
`src/model/*` (Datenmodell, unverändert konsumiert), `src/engine/*`
(`createRulesEngine`, 48 Tests grün), `src/cards/starter-set.ts` (27 Karten).

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
npm test            # unverändert: Vitest (48 Engine-Tests, UI ungetestet, s.u.)
```

`tsconfig.json` wurde um `"DOM"`/`"DOM.Iterable"` in `lib` erweitert (damit
`tsc --noEmit` auch den UI-Code type-checkt); das ändert nichts an der
Engine-Kompilierung, fügt nur zusätzliche globale Typen hinzu.
`package.json` hat drei neue Skripte (`dev`, `build:ui`, `preview`) und
`vite` als neue Dev-Dependency; bestehende Skripte/Dependencies sind
unverändert.

Beim Start wird automatisch eine Demo-Partie erzeugt: beide Spieler erhalten
ein identisches Demo-Deck aus dem kompletten `starterSet`
(`src/ui/deck.ts#buildDemoDeck`: alle Nicht-Terrain-Karten 1×, alle 5
Terrains 4× → 42 Karten, erfüllt das 40-Karten-Minimum aus dem Datenmodell-
Kommentar). Das ist **kein Deckbuilder** — nur Dateninitialisierung für die
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
   `docs/README.md`): Ist `state.pendingDecision` gesetzt (aktuell nur
   `chooseTriggerTargets` real erreichbar), zeigt ein Banner „Zielwahl
   erforderlich" und die legalen Einzelziele werden über
   `getLegalActions`-Kandidaten (`kind: "resolveDecision"`) auf dem Board
   anklickbar gemacht — exakt der gleiche Mechanismus wie normales
   Ziel-Casting, da beide auf denselben `candidatesByTargetKey`-Helfer
   zurückgreifen.
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
