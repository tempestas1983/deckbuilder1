# Deckbuilder — Projektübersicht

MTG-artiger Deckbuilder als Hobby-/Lernprojekt. Fünf Agent-Rollen:
**game-architect** (Regelwerk + Datenmodell), **engine-engineer** (Spiellogik),
**card-designer** (Kartenpool + Balancing), **frontend-engineer** (UI),
**ai-opponent-engineer** (KI-Gegner, `src/ai/*`, s. „Nächste Schritte" für den
aktuellen Stand). Ein `documenter`-Subagent hält diese Übersicht sowie
`docs/status.md`/`docs/rules-engine.md` aktuell.

## Aktueller Stand (2026-07-20, Regelwerk v0.3.3 / Modell v0.2.1 mit v0.3-Erweiterungen / Engine v0.3.5 / Kartenpool 300 Karten + 3 Token-Definitionen / Frontend v0.1.21 / KI-Gegner v2.1)

| Artefakt | Pfad | Status |
|---|---|---|
| Regelwerk (Phasen, Priority, Stack, SBAs, Trade-offs) | `docs/rules-engine.md` | **v0.3.3**, verbindlich — Kampf-Ausbau für die Kartenpool-Erweiterung: neuer §6d mit den Keywords `trample`/`firstStrike`/`deathtouch` inkl. voller Kombinatorik-Tabelle (§6d(4)), §7 (SBA 4 um deathtouch erweitert), §9.8 **bewusst revidiert** (Mehrfachblock-Reihenfolge wird jetzt vom **Angreifer** über die neue PendingDecision `orderBlockers` gewählt, statt wie in v0.2.2 vom Verteidiger), neue Entscheidung §9.9 (Trade-offs des Keyword-Pakets). **v0.3-Update (vier vertagte Abschnitt-10-Punkte geschlossen, Entscheidungen 9.10–9.13):** `onDamageReceived` verdrahtet, Mulligan-Regel (Paris-Variante, §1b), X-Kosten auf aktivierten Fähigkeiten, Modal-Effekte „wähle eines —" (`EffectMode`/`modes`). **v0.3.1-Nachtrag:** Modellkonflikt in der Ketten-Decision `chooseMode` → `chooseTriggerTargets` behoben (additives `chosenMode?: number`). **v0.3.2 (Entscheidung 9.14, Fund des card-designers):** einheitlicher stiller „Nicht-Permanent-Fizzle" für `EffectRecipient "eventSubject"`, falls das Subjekt beim Resolven kein Battlefield-Permanent mehr ist (gilt für gewählte Ziele, `self` und `eventSubject` gleichermaßen). **v0.3.3 (Entscheidung 9.15, Fund des card-designers in Kartenpool-Batch 6):** zonenbasierte Todesdefinition — „stirbt" = Zonenwechsel Battlefield → Graveyard, ursachenunabhängig (SBA, `destroyPermanent`, `sacrificeSelf`-Kosten); `onDeath{self}` jetzt typ-agnostisch (auch Nicht-Units), `onUnitDied`/`unitDied` bleiben unit-only; `exilePermanent`/`returnToHand` sind bewusst KEIN Tod. §10 weiterhin bereinigt gehalten — die großen, bewusst vertagten Themen (>2 Spieler, Kontrollwechsel/Kopier-Effekte, Double-Strike-Analog, London-Mulligan-Upgrade, „wähle zwei" bei Modal-Effekten, Graveyard-Zonen-Primitiv für „Removal-bei-Tod" u. a.) bleiben dort dokumentiert, nur bei konkretem Kartenbedarf anzugehen |
| Effekt-/Fähigkeiten-DSL | `src/model/abilities.ts` | Typen fertig (v0.2: guardian final, X-Kosten geklärt, targets-los bestätigt; v0.2.3: `Keyword`-Typ um `trample`/`firstStrike`/`deathtouch` erweitert; v0.3: neuer Typ `EffectMode` + `modes`-Feld für Modal-Effekte; v0.3.2/v0.3.3: nur Kommentar-Präzisierungen zu `EffectRecipient`/`onDeath`/`onUnitDied`, kein Typ-Umbau) |
| Kartendefinitionen (6 Kartentypen, Kosten, Decks) | `src/model/cards.ts` | Typen fertig (v0.2: Aura-attachedTo geklärt; v0.3: `SpellCard.modes` für Modal-Effekte) |
| Spielzustand, Stack, Aktionen, Events, Engine-Interface | `src/model/game-state.ts` | Typen fertig (v0.2: PendingDecision/resolveDecision, CreateGameConfig ohne pool, Factory-Vertrag; v0.2.1: resumePriorityTo; v0.2.3: `PendingDecision`/`DecisionChoice` um `orderBlockers` erweitert, `PermanentState.deathtouchDamage`; v0.3: `PendingDecision`/`DecisionChoice` +`mulligan`/`chooseMode`, `chosenX`/`chosenMode` an Aktionen/Stack-Objekten, `PlayerState.mulligans`, `CreateGameConfig.skipMulligans`, Event `mulliganTaken`; v0.3.1: additives `chosenMode?: number` an `chooseTriggerTargets`) — unverändert seit v0.3.1, die v0.3.2/v0.3.3-Regelwerksänderungen brauchten keinen Modell-Umbau |
| Zentrale Exports | `src/model/index.ts` | fertig |
| Engine-Implementierung (Kern: Phasen/Priority/Stack/SBA/Trigger/Decisions/Combat inkl. guardian, X, Kampf-Keyword-Paket, costChange, Mulligan, Modal-Effekte) | `src/engine/*`, Status: `docs/engine-status.md` | **v0.3.5 fertig** — auf v0.3.2 (s. vorige Sweep-Fassung) folgten drei weitere, jeweils von anderen Rollen beim Testen/Kartenbau gefundene und vom engine-engineer behobene Bugfixes: **v0.3.3** `combat.ts` crashte, wenn ein TOKEN-Kampfteilnehmer in der firstStrike-Zwischenrunde starb (Fund: ai-opponent-engineer beim Stärkevergleichs-Testen); **v0.3.4** `destroyPermanent`/`returnToHand`/`exilePermanent` fehlte der Battlefield-Existenz-Guard, den die übrigen sieben permanent-bezogenen Effekte schon hatten (Fund: game-architect, latent, Entscheidung 9.14); **v0.3.5** `onDeath`/`onUnitDied` feuerten nur auf dem SBA-Todespfad, nicht bei `destroyPermanent`/`sacrificeSelf` — jetzt zentraler Tod-Hook in `zones.ts#leaveBattlefield` (Fund: card-designer in Kartenpool-Batch 6, Entscheidung 9.15). Engine-Testzahl (nur `src/engine/__tests__/*`) 119 → **130** (per Grep nachgezählt: v0.3.3 +2, v0.3.4 +2, v0.3.5 +7). Offene Rückfrage an den game-architect (unverändert): ob `StaticAbility.scope` bei `costChange` künftig eine Bedeutung bekommen soll — nicht blockierend |
| Kartenpool / Starter-Set (300 Karten + 3 Token-Definitionen) | `src/cards/starter-set.ts`, `docs/cards/starter-set.md` | **v0.15 fertig** — Kartenzahl per Grep gegen den Code verifiziert (303 `id: "core.…"`-Einträge insgesamt, davon 3 mit `isToken:true`, macht 300 reguläre Karten). Der Pool wurde in 9 Batches von 113 auf **300 Karten** ausgebaut (terrain 5, unit 110, spell 72, relic 56, enchantment 57; Farbverteilung 49/49/49/49/48 über flame/tide/wild/light/void, nahezu perfekt gleichmäßig). Danach drei empirische Bot-Simulations-Balancerunden (v0.13/v0.14/v0.15): `wild` war klar zu stark (73–75 % Siegquote in Mono-Farb-Simulationen), über drei Runden mit gezielten Statlinien-/Kosten-/Zusatzkosten-Korrekturen auf **64,7 %** gesenkt (reale, aber laut card-designer nicht perfekte Verbesserung — Runde 3 hat den strukturellen Grund identifiziert und behoben, weiteres Nachschärfen brächte laut Analyse keinen Zusatznutzen mehr); `void`s Vorsprung (~62 % gegenüber `tide`/`light`) wurde geprüft, aber bewusst NICHT korrigiert, da keine einzelne Karte im Preisvergleich fehlbepreist ist (nur eine kumulative strukturelle Dichte an Tod-Triggern/Entfernungszaubern) |
| UI (Spielbrett, Vite + TypeScript) | `src/ui/*`, Status: `docs/frontend-status.md` | **v0.1.21 fertig** — auf v0.1.16 (13-Schritte-Tutorial-Sequenz, s. vorige Sweep-Fassung) folgten fünf weitere Schritte: **v0.1.17** die mit Abstand umfangreichste Einzelsession bisher — echtes **Hauptmenü** als neuer App-Einstiegspunkt (`AppPhase`: `mainMenu` → `opponentSelect` → `deckbuild` → `playing`, löst den bisherigen Direkteinstieg in den Deckbau ab) mit vier Optionen inkl. neuer Gegner-Auswahl (KI-Schwierigkeit mit benannten Bot-Personas „Ollo Wackelhand"/„Guntram Eichenfaust"/„Silas Kaltblick" ODER 2-Spieler-Hotseat) und neuem „Anleitung"-Nachschlage-Panel; dazu Taverne-Atmosphäre + Szenen-Artwork (viewport-breiter Board-Hintergrund, großformatige Gegner-Avatare in einer eigenen Spalte), sichtbare View-Transitions-Animationen (Karten morphen zwischen Zonen, Bot-Züge sichtbar statt Snap, Lebenspunkte-Puls), eine verdeckt dargestellte Gegner-Hand (nur Kartenrückseiten + Anzahl), zwölf Soundeffekte, sowie ein Tutorial-Bugfix (Hauptphase-Sperre gegen versehentliches Überspringen des Terrain-Schritts). **v0.1.18** Auto-Pass (automatisches Passen/„keine Angreifer"/„keine Blocker", wenn `getLegalActions` keine echte Wahl mehr bietet), ein auffälliges Entscheidungs-Spotlight-Banner für echte Entscheidungen, sowie eine von einer festen Datei auf Auto-Discovery umgestellte Musik-Playlist (`docs/music/` → `/music/index.json`, Titelauswahl + Wiederholungsmodus). **v0.1.19** Bugfix: reine Mana-Fähigkeiten (Terrain fürs Mana antippen) zählten fälschlich als „echte Entscheidung" und verhinderten Auto-Pass/lösten das Spotlight-Banner ständig unnötig aus. **v0.1.20** (Commit `9b81338`, beim vorigen Sweep noch uncommitted, jetzt bestätigt) benannte Deck-Speicherfunktion (mehrere Slots mit Name + Beschreibung), ein Deck-Analyse-Panel (Mana-Kurve, Farb-/Typverteilung) sowie ein „Deck leeren"-Button im Deckbau-Screen. **v0.1.21** (Commit `5654ec1`) neue Datei `aiDecks.ts`: 7 vom card-designer kuratierte Archetyp-Decklisten (je 60 Karten, echte Kopienzahlen/Kurve statt der bisherigen reinen 5-Farben-Zufallsmischung) — der Bot-Gegner zieht jetzt bei beiden automatischen Deckbau-Stellen (`render.ts`) über `pickRandomAiDeck()` eines dieser sieben Decks, `buildDemoDeck` bleibt unverändert für den „Zufällig füllen"-Button des menschlichen Deckbaus; der gewählte Archetyp wird dem Spieler bewusst nirgends angezeigt. Keiner dieser fünf Schritte hat Engine/Model/Kartenpool angefasst (v0.1.17 ergänzte nur die rein kosmetischen `BOT_DISPLAY_NAMES` in `src/ai/difficulty.ts`). Engine-Testzahl unverändert bei **130**; UI-Testdateien liefern laut Grep-Auszählung **19** einzeln benannte Fälle über 12 Dateien (neu seit v0.1.16: `golden-path.test.ts`, `main-menu.test.ts`, `rules-guide.test.ts`) — ein echter `npm test`/`npm run build`-Lauf konnte auch in dieser documenter-Session mangels Shell-Werkzeug NICHT durchgeführt werden, s. `docs/frontend-status.md` für Details |
| KI-Gegner (drei Schwierigkeitsstufen, spielt ausschließlich über die öffentliche `RulesEngine`-Schnittstelle) | `src/ai/*`, Status: `docs/ai-status.md` | **v2.1 fertig** — der in v1 (`simpleBot.ts`) als Fundament angelegte Bot wurde vom neuen `ai-opponent-engineer`-Subagenten zu drei echten Stufen ausgebaut: **easy** (`easyBot.ts`, absichtlich fehlerhaft/zufällig, aber immer regelkonform), **medium** (unverändert `simpleBot.ts`, die bisherige v1-Heuristik), **hard** (`hardBot.ts`/`boardEval.ts`, budgetiertes 1-Ply-Lookahead über echte `applyAction`-Simulation, effektive Stats/Keywords inkl. fremder Statics, echte Kampf-Mathematik/-Simulation). Deterministischer Stärkevergleich bestätigt strikte Stärkeordnung (medium schlägt easy, hard schlägt medium/easy, je >= 60 % der entschiedenen Partien). **v2.1:** zwei vom 300-Karten-Set aufgedeckte Legalitätsfehler behoben (Blocklegalität mit effektiven Keywords bei statisch gewährtem guardian; modale Kandidaten werden jetzt konsumentenseitig zu Modus×Ziel vervollständigt statt roh und ungültig eingereicht zu werden), plus ein neues, bewusst aus der CI ausgeschlossenes Analyse-Tool für Farb-Balance-Messungen (`color-balance.analysis.test.ts`, `describe.skip`, manuell mit `BALANCE_ANALYSIS=1` ausführbar) — dessen Befund hat die Balance-Korrekturrunden am Kartenpool ausgelöst (s. Zeile oben). Ein Engine-Bug (firstStrike-Token-Crash) wurde dabei gefunden und gemeldet, nicht selbst behoben — s. Engine-Zeile (v0.3.3) |
| Karten-Artwork (Nutzer-Vorhaben, kein Teil der 5-Agent-Pipeline) | `docs/cards/card-art-brief.md`, `docs/cards/artworks/` | **Bildgenerierung abgeschlossen, ins UI integriert** — alle 300 Artworks sind mittlerweile vom Nutzer fertig generiert und liegen lokal in `docs/cards/artworks/` (per Glob nachgezählt: exakt 300 `.png`-Dateien, deckungsgleich mit der Brief-Tabelle). Bewusst NICHT im Git-Repo (`.gitignore`: `docs/cards/artworks/`, Begründung im Kommentar dort: „~500 MB, lokal beim Nutzer vorhanden statt versioniert"). Seit `docs/frontend-status.md` v0.1.12/v0.1.13 vollständig ins UI eingebunden (s. Frontend-Zeile oben). **Zuvor gefundene Inkonsistenz jetzt aufgelöst:** die Datei zu `core.bastion-forgeworks` hieß beim letzten Sweep noch fälschlich `core-bastion-forgework.png` (fehlendes „s") — der Nutzer hat sie inzwischen korrekt zu `core-bastion-forgeworks.png` umbenannt (per Glob verifiziert, deckt sich jetzt 1:1 mit der Brief-Tabelle) |
| Projekt-Setup (package.json, tsconfig, Vitest, Vite) | `package.json`, `tsconfig.json`, `vite.config.ts` | fertig |
| Git-Repo | https://github.com/tempestas1983/deckbuilder1 | Initial-Commit auf `main` gepusht |

Tech-Stack-Annahme: TypeScript überall; Engine als reines, UI-freies Paket
(pure Funktionen, seedbarer RNG), damit das spätere TS/JS-Frontend (Framework-Wahl
frei, Vorschlag: Vite + React) sie direkt importieren kann. Karten sind
JSON-serialisierbare Daten (keine Karten-spezifischen Codefunktionen).

## Kernentscheidungen (Details in rules-engine.md, Abschnitt 9)

1. **Hybrid statt Event-Sourcing:** `applyAction(state, action) → { state', events[] }`;
   GameState ist die Wahrheit, GameEvents dienen Frontend/Log/Triggern.
2. **Trigger nach MTG-Muster:** Pending-Queue → APNAP auf den Stack → LIFO mit Antwortfenster.
3. **Kein Layer-System:** feste Berechnungsreihenfolge für statische Effekte (Basis → Marken → Timestamp).
4. **Effekte als Daten-DSL:** geschlossener Primitiv-Satz, Erweiterung nur über game-architect.
5. **Engine-Konstruktion per Factory (v0.2):** `createRulesEngine(pool)` bindet den CardPool
   einmalig; `GameState` bleibt poolfrei serialisierbar.
6. **Pending Decisions (v0.2):** ein generischer Kanal (`pendingDecision` + `resolveDecision`)
   für alle Spielerentscheidungen mitten in der Abwicklung — inzwischen (v0.2.3/v0.3) real genutzt für
   Trigger-Zielwahl, `orderBlockers`, `mulligan` und `chooseMode`; `chooseManaColor`/`chooseDiscard`/
   `orderScry` bleiben weiterhin Auto-Default, Migration bei Kartenpool-Bedarf (siehe „Nächste Schritte").

## Beispielkarte (zur Orientierung für den Card-Designer)

```ts
import type { UnitCard, SpellCard } from "../src/model";

const emberWhelp: UnitCard = {
  id: "core.ember-whelp",
  name: "Glutwelpe",
  type: "unit",
  subtypes: ["Drache"],
  cost: { generic: 1, flame: 1 },
  power: 2,
  toughness: 1,
  abilities: [
    { kind: "keyword", keyword: "airborne" },
    {
      kind: "triggered",
      trigger: { kind: "onEnterBattlefield", what: "self" },
      targets: [{ kind: "unitOrPlayer" }],
      effects: [{ kind: "dealDamage", to: { target: 0 }, amount: 1 }],
      text: "Wenn der Glutwelpe ins Spiel kommt, füge einem Ziel 1 Schaden zu.",
    },
  ],
  rarity: "common",
  set: "core",
};

const tidalRebuke: SpellCard = {
  id: "core.tidal-rebuke",
  name: "Gezeitenschelte",
  type: "spell",
  speed: "fast",
  cost: { generic: 1, tide: 1 },
  targets: [{ kind: "permanent", cardTypes: ["unit"] }],
  effects: [{ kind: "returnToHand", what: { target: 0 } }],
  rulesText: "Bringe eine Unit deiner Wahl auf die Hand ihres Besitzers zurück.",
  rarity: "common",
  set: "core",
};
```

## Nächste Schritte

Regelwerk (v0.3.3), Engine (v0.3.5, 163 Tests grün + 1 bewusst
übersprungener Analyse-Test über Engine+UI+KI), Starter-Kartenset (v0.15,
300 Karten + 3 Token-Definitionen), Spielbrett-UI (v0.1.16) und ein
KI-Gegner mit drei echten Schwierigkeitsstufen (v2.1) sind alle fertig und
end-to-end verifiziert. **Der zuvor hier als „nächster geplanter
Meilenstein" angekündigte KI-Ausbau ist seither abgeschlossen; seit dem
Sweep vom 2026-07-10:**

- **Zwei weitere Regelwerks-Entscheidungen geschlossen** (v0.3.2/v0.3.3,
  beide Bug-Funde anderer Rollen, keine vertagten Abschnitt-10-Punkte):
  9.14 (einheitlicher stiller „Nicht-Permanent-Fizzle" für
  `EffectRecipient "eventSubject"`) und 9.15 (zonenbasierte Todesdefinition
  für `onDeath`/`onUnitDied`, `onDeath{self}` jetzt typ-agnostisch).
- **Engine** hat beide Entscheidungen umgesetzt und dabei drei echte
  Bugfixes geliefert (v0.3.3 firstStrike-Token-Crash, v0.3.4
  Battlefield-Guard für `destroyPermanent`/`returnToHand`/`exilePermanent`,
  v0.3.5 zentraler Tod-Hook in `zones.ts#leaveBattlefield`) — Engine-Testzahl
  119 → 130.
- **Kartenpool** wurde in 9 Batches von 113 auf **300 Karten** ausgebaut
  (v0.7–v0.12) und danach in drei empirischen Bot-Simulations-Runden
  balanciert (v0.13–v0.15): `wild` von 73–75 % auf 64,7 % Siegquote gesenkt,
  `void`s strukturell begründeter, aber nicht einzelkarten-fehlbepreister
  Vorsprung bewusst unangetastet gelassen.
- **Frontend** hat die drei neuen Bot-Stufen angebunden (v0.1.9: Dropdown +
  Badge) und danach ein rein visuelles klassisches Kartenrahmen-Layout
  eingeführt (v0.1.10), ohne Spiellogik/Engine anzufassen.
- **KI-Gegner** wurde vom `ai-opponent-engineer`-Subagenten (fable-5) wie
  geplant zu drei echten Schwierigkeitsstufen ausgebaut (v2: easy/medium/
  hard) und danach um zwei vom 300-Karten-Set aufgedeckte Legalitätsfixes
  sowie ein manuell auslösbares Farb-Balance-Analyse-Tool ergänzt (v2.1) —
  dessen Befund hat die Kartenpool-Balancerunden oben ausgelöst.
- **Außerhalb der 5-Agent-Pipeline:** Ein Nutzer-Vorhaben, Artworks für alle
  300 Karten extern generieren zu lassen (`docs/cards/card-art-brief.md` als
  Stilleitfaden + Prompt-Tabelle, `docs/cards/artworks/` als Ablage) —
  damals (2026-07-18) noch 20 von 300 Bildern fertig, noch nicht ans UI
  angebunden.

**Seit dem letzten Sweep (2026-07-18) zusätzlich, alles im Frontend, keine
Engine-/Model-/Kartenpool-Änderung:**

- **Artwork-Vorhaben abgeschlossen und vollständig ins UI integriert**
  (`docs/frontend-status.md` v0.1.12/v0.1.13): der Nutzer hat inzwischen alle
  300 Artworks fertig generiert (`docs/cards/artworks/`, per Glob
  nachgezählt, bewusst NICHT im Git-Repo, s. `.gitignore`/Artwork-Zeile
  oben). Der Bildpfad wird rein aus der Karten-`id` abgeleitet (kein neues
  Datenfeld), ein selbst geschriebenes Vite-Plugin liefert die Bilder im
  Dev-Server aus und kopiert sie beim Produktions-Build, Fallback auf den
  bisherigen Farbverlauf-Platzhalter falls ein Bild fehlt. v0.1.13 hat den
  Kunstbereich danach deutlich vergrößert (Nutzer-Feedback: Bilder wirkten
  vorher stark beschnitten).
- **Tutorial-Modus zweimal überarbeitet** (`docs/frontend-status.md` v0.1.14,
  v0.1.16): v0.1.14 hat den Startspieler im Tutorial fest auf player1 gesetzt
  (`CreateGameConfig.startingPlayer`), da die KI sonst zufällig zuerst dran
  war und der Nutzer frustriert nichts tun konnte. v0.1.16 ist ein
  kompletter Umbau der bisher nur einmalig-passiven Hinweis-Sprechblasen zu
  einer echten 13-Schritte-Sequenz (`tutorialContent.ts#TUTORIAL_STEPS`):
  Instruktion → visuelle Hervorhebung (`.tutorial-glow`) → Aktion →
  Bestätigung → nächster Schritt, mit „Schritt überspringen"-Sicherheitsnetz
  und rückwirkender Fakten-Erkennung (robust gegenüber Mana-Kurve/
  Bot-Verhalten), deckt Terrain/Mana/Kreatur-Beschwörung/Zielwahl/
  Schadenszauber/Buff-Zauber/Angriff/Kampfschaden/Block/Sieg-Bedingung ab.
- **Neu: Keyword-Glossar** (`docs/frontend-status.md` v0.1.15): Schlüsselwörter
  im Kartentext (z. B. „Todesberührung") werden jetzt in jeder Regeltext-Box
  hervorgehoben (Hover-Tooltip + Klick-Sprechblase), zusätzlich ein globales,
  jederzeit erreichbares „? Schlüsselwörter"-Panel mit allen 9 Keywords,
  unabhängig vom Tutorial-Modus.
- Test-Gesamtzahl 160+1 → **163+1** (die drei Schritte oben brachten
  zusammen 3 neue UI-Tests, s. `docs/frontend-status.md`), `npm run build`/
  `npm run build:ui` laut allen Berichten weiterhin sauber.

**Seit dem letzten Sweep (2026-07-19) zusätzlich, wieder ausschließlich im
Frontend, keine Engine-/Model-/Kartenpool-/KI-Änderung — mit Abstand die
umfangreichste Frontend-Session bisher (`docs/frontend-status.md` v0.1.16 →
v0.1.20):**

- **Größte strukturelle Änderung: echtes Hauptmenü statt Direkteinstieg**
  (v0.1.17). `AppPhase` komplett umgebaut: `mainMenu` (neuer App-Start, vier
  Optionen) → `opponentSelect` (KI-Schwierigkeit mit den drei benannten
  Bot-Personas „Ollo Wackelhand"/„Guntram Eichenfaust"/„Silas Kaltblick" ODER
  2-Spieler-Hotseat) → `deckbuild` (jetzt mit `mode: "newGame" | "standalone"`)
  → `playing`. Bei KI-Wahl wird player2s Deckbau-Screen komplett übersprungen
  (automatisches Zufallsdeck, sofortiger Partiestart nach player1s Deck).
  „Deck Builder" ist ein neuer, eigenständiger Deckbau-Modus ohne
  Partie-Vorbereitung. „Anleitung" ist ein neues, rein statisches
  Nachschlage-Panel (Kartentypen, eingebettetes Keyword-Glossar, Spiel-/
  Deckbau-Tipps).
- **Taverne-Atmosphäre + Szenen-Artwork-Integration** (v0.1.17,
  `docs/scene-art-brief.md` jetzt vollständig umgesetzt statt nur Brief — s.
  dortige Korrektur): ein viewport-breiter Board-Hintergrund
  (`tavern-background.png`, fixiert auf Body-Ebene) sowie ein großformatiges
  Gegner-Porträt (`avatar-<difficulty>.png`) in einer eigenen 220px-Spalte
  rechts neben dem Spielfeld — beides mit CSS-Fallback (Holzmaserung/
  Kerzenschein-Glow), falls eine Bilddatei fehlt. Alle vier Bilddateien liegen
  laut Verzeichnis-Listing bereits unter `docs/scene-art/` (gitignored).
- **Sichtbare Übergänge statt Hard-Cut** (v0.1.17): `document.startViewTransition()`
  (mit Fallback bei fehlender Browser-Unterstützung/`prefers-reduced-motion`)
  lässt Karten zwischen Hand/Battlefield/Friedhof „morphen" statt hart
  wegzuspringen — Bot-Züge dadurch nachvollziehbar statt als Snap. Zusätzlich
  ein Lebenspunkte-„Puls" bei Änderung.
- **Verdeckte Gegner-Hand** (v0.1.17): jede Nicht-„player1"-Hand zeigt nur
  noch Kartenrückseiten + Anzahl statt voller Karteninformation — bewusst
  hingenommene Einschränkung: ein echter zweiter Hotseat-Mensch kann seine
  eigene Hand dadurch aktuell nicht mehr aktiv anklicken (kein echtes
  Pass-and-Play-System gebaut, außerhalb des Auftrags).
- **Zwölf Soundeffekte + Auto-Discovery-Musik-Playlist** (v0.1.17/v0.1.18):
  event-basierte kurze SFX (`docs/sfx/`, CC0-Quellen dokumentiert) sowie eine
  von einer anfangs fest verdrahteten Einzeldatei auf automatische
  Ordner-Erkennung umgestellte Hintergrundmusik (`docs/music/` →
  `/music/index.json`, Titelauswahl-Panel + Wiederholungsmodus
  Einzeltitel/Playlist) — beide über ein auf mehrere Asset-Ordner
  verallgemeinertes Vite-Plugin ausgeliefert.
- **Auto-Pass + Entscheidungs-Spotlight** (v0.1.18, mit Bugfix in v0.1.19):
  Priorität wird automatisch weitergereicht bzw. „keine Angreifer"/„keine
  Blocker" automatisch erklärt, sobald `getLegalActions` keine echte Wahl mehr
  anbietet; steht dagegen eine echte Wahl an, macht ein auffälliges Banner
  statt des bisherigen unauffälligen Buttons darauf aufmerksam. v0.1.19 hat
  einen Bugfix nachgereicht: reine Mana-Fähigkeiten (Terrain fürs Mana
  antippen) zählten fälschlich als „echte Wahl" und verhinderten Auto-Pass
  praktisch komplett.
- **Deck speichern/laden + Deck-Analyse-Panel + „Deck leeren"** (v0.1.20,
  **zum Zeitpunkt dieses Sweeps noch NICHT committet**, s.
  `docs/frontend-status.md` für Details): benannte Deck-Speicherfunktion mit
  beliebig vielen Slots (Name + optionale Beschreibung), ein Mana-Kurve-/
  Farb-/Typverteilungs-Panel im Deckbau-Screen, sowie ein „Deck leeren"-Button.
- Engine-Testzahl unverändert bei **130** (keine Engine-Änderung in dieser
  Session). UI-Testdateien liefern laut Grep-Auszählung **19** einzeln
  benannte Fälle über 12 Dateien (neu: `golden-path.test.ts` — Umbenennung/
  Anpassung der bisherigen Golden-Path-Verifikation auf den Weg über das neue
  Hauptmenü, `main-menu.test.ts`, `rules-guide.test.ts`).
  **Wichtiger Hinweis dieses Sweeps:** `npm test`/`npm run build` konnten in
  dieser documenter-Session mangels Shell-Werkzeug NICHT selbst ausgeführt
  werden (anders als in einigen früheren Sweeps) — alle Testzahlen und
  Verhaltensbehauptungen oben stammen aus direkter Code-/Kommentar-Lektüre
  (`Read`/`Grep`) der tatsächlichen `src/ui/*`-Dateien, nicht aus
  Fertigstellungs-Nachrichten der anderen Rollen übernommen, aber auch nicht
  durch einen echten Testlauf/Browser-Screenshot bestätigt. Ein echter
  `npm test`-Lauf sowie eine Browser-Verifikation der visuellen Änderungen
  (Taverne-Hintergrund, Avatar-Spalte, Animationen, Spotlight-Banner) stehen
  noch aus.

Details je Bereich in `docs/rules-engine.md`, `docs/engine-status.md`,
`docs/cards/starter-set.md`, `docs/frontend-status.md`, `docs/ai-status.md`;
Kurzfassung des Gesamtstands (inkl. dieses Sweeps) in `docs/status.md`.

---

### Weitere offene Punkte, keiner davon blockiert das Spielen

**card-designer:** Kein Hauptauftrag mehr offen — das vereinbarte
Zielvolumen (~300 Karten) ist erreicht und dreifach nachbalanciert
(`docs/cards/starter-set.md`). Optionale, ausdrücklich nicht beauftragte
Kandidaten für ein künftiges Erweiterungsset (siehe dortiger Abschnitt
„Mögliche Richtungen für ein künftiges Erweiterungsset", nur nach
Rücksprache mit game-architect/Orchestrierung zu beginnen):
1. Subtyp-Synergien (Untoter/Wächter/Krieger/Elementarwesen als mechanisch
   relevante Subtypen statt reinem Flavor).
2. Karten mit >1 Zielslot sind weiterhin ungetestet (weder Engine noch UI)
   — falls gewünscht, zieht das Ausbauarbeit auf beiden Seiten nach sich.
3. `void`s strukturelle Stärke (Tod-Trigger-/Entfernungszauber-Dichte) im
   Auge behalten, falls ein künftiger Nachbalancierungs-Anlass entsteht —
   aktuell bewusst nicht angegangen (Begründung: „Balance-Korrektur Runde 3"
   im starter-set.md).

**engine-engineer:**
1. **Offene Rückfrage an game-architect (unverändert seit v0.2.4):** Soll
   `StaticAbility.scope` bei `modifier.kind === "costChange"` künftig eine
   eigene Bedeutung bekommen (aktuell wird nur `modifier.appliesTo`
   ausgewertet, `scope` ignoriert) — nicht blockierend.
2. StaticAbility-Test für `stats`/`grantKeyword` ergänzen (weiterhin ohne
   eigenen Unit-Test mangels Testkarte, siehe `docs/engine-status.md`).
3. Migration von `chooseManaColor`/`chooseDiscard`/`orderScry` auf den
   Pending-Decision-Kanal (rules-engine.md 9.7), sobald Kartenpool das braucht.

**frontend-engineer** (aus `docs/frontend-status.md` „Nächste Schritte",
weiterhin offene Punkte):
1. Dauerhafter Klick-Test für den modalen Trigger-Fall
   (`core.current-diplomat`, `chooseMode`-PendingDecision inkl. Auto-Pick
   und der Ketten-Decision zu `chooseTriggerTargets`) — der Code-Pfad ist
   seit v0.1.6 verdrahtet, ein eigener dauerhafter Test fehlt noch.
2. Mehrfach-Zielslot-UI, sobald Karten mit >1 Zielslot existieren (aktuell
   keine im Pool).
3. `computeEffectiveStats`/`computeEffectiveKeywords` offiziell in den
   `RulesEngine`-Vertrag heben (aktuell bewusster Re-Use einer als „nicht
   stabil" markierten Engine-API).
4. Migration von `chooseManaColor`/`chooseDiscard`/`orderScry` (s.o.) zieht
   jeweils eigene Auswahl-UI (Farbwahl-Buttons, Karten-Mehrfachauswahl,
   Scry-Sortierung) nach sich, sobald die Engine migriert.
5. `botMoveDelayMs` weiterhin nicht über die UI einstellbar (nur Code/Tests)
   — bewusst kein Nutzer-Setting für ein Hobbyprojekt.
6. Deckbau-Screen-Performance bei sehr großem Kartenpool ist ungeprüft: die
   in v0.1.4 dokumentierte Sorge „bei einem künftig deutlich größeren
   Kartenpool (weit über 109) könnte das UI träge werden" ist mit dem
   300-Karten-Pool jetzt tatsächlich eingetreten, aber laut
   `docs/frontend-status.md` bisher nicht mit dem echten 300-Karten-Set neu
   gemessen worden — **documenter-Hinweis 2026-07-18, an frontend-engineer
   zurückgemeldet statt selbst behoben.**
7. Bot-vs-Bot-Zuschauermodus (beide Spieler = KI) — Umschalter existiert
   bisher nur für Spieler 2; mit dem neuen `opponentSelect`-Screen (v0.1.17)
   wäre ein dritter Menüpunkt „Zuschauen" naheliegend, aber nicht beauftragt.
8. ~~Fehlende Übergangsanimationen bei KI-Zügen~~ **erledigt in v0.1.17**
   (`docs/frontend-status.md`) — `document.startViewTransition()` lässt
   Karten zwischen Zonen „morphen" statt hart zu snappen, mit Fallback bei
   fehlender Browser-Unterstützung/`prefers-reduced-motion`.
9. ~~`docs/frontend-status.md` v0.1.20 (benannte Deck-Speicherfunktion,
   Deck-Analyse-Panel, „Deck leeren") war noch NICHT committet~~ **erledigt**
   — beim v0.1.21-Sweep (2026-07-20) per `git log`/`git status` bestätigt:
   Commit `9b81338`.
10. **Neu (documenter-Notiz 2026-07-20):** `npm test`/`npm run build` wurden
    seit v0.1.17 weiterhin nicht durch einen echten Testlauf verifiziert (dem
    documenter stand auch in der v0.1.21-Session kein Shell-Werkzeug zur
    Verfügung, alle Zahlen sind Grep-/Code-Lektüre-basiert plausibilisiert).
    Ebenso steht eine echte Browser-/Screenshot-Verifikation der
    v0.1.17-Optik (Taverne-Hintergrund, Avatar-Spalte, View-Transitions-
    Animationen, Spotlight-Banner) weiterhin aus.
11. **Neu (documenter-Notiz 2026-07-20, v0.1.21):** `src/ui/aiDecks.ts` (7
    kuratierte KI-Archetyp-Decks, s. `docs/frontend-status.md`) hat noch
    keinen dauerhaften automatisierten Test (z. B. „alle sieben Decks
    bestehen `validateDecklist`") — bisher nur per manueller Code-Lektüre/
    Nachrechnen durch den documenter verifiziert, kein Regressionsschutz.

**game-architect (Folgearbeit):**
- Offene Rückfrage vom engine-engineer zu `StaticAbility.scope` bei
  `costChange` (s.o.) — nicht blockierend.
- **Bewusst vertagte, größere Regelwerk-Themen** (`docs/rules-engine.md`
  Abschnitt 10, „Weiterhin offen") — **nur bei konkretem Kartenbedarf
  anzugehen, kein aktiver Auftrag:** mehr als 2 Spieler; Kontrollwechsel/
  Kopier-Effekte/Keyword-Entzug; Double-Strike-Analog; Priority-Fenster
  zwischen den beiden Schadensrunden; trample-Über-Zuteilung; Spielerwahl
  bei der Reihenfolge mehrerer eigener gleichzeitiger Trigger; „Spieler
  erleidet Schaden"-Trigger; London-Mulligan als Upgrade der
  Paris-Variante; „wähle zwei"/konfigurierbare Modusanzahl bei
  Modal-Effekten; vollständig rekursive Cleanup-Sonderregel; Migration von
  `addMana("any")`/`discardCards`-Zusatzkosten/`scry` auf den
  Pending-Decision-Kanal; kombinatorische Enumeration in `getLegalActions`
  (bewusstes Nicht-Ziel); **neu seit v0.3.2/v0.3.3:** „ein beliebiges
  Permanent stirbt"-Beobachter-Trigger (typ-agnostisches Pendant zu
  `onUnitDied`); Graveyard-Zonen-Primitiv für den „Removal-bei-Tod"-Archetyp
  (eigenes, ehrlich benanntes Primitiv statt Umdeutung von
  `exilePermanent`/`returnToHand`).
- Zusätzlich offen (aus engine-engineer/frontend-engineer, siehe oben):
  `StaticAbility.scope`-Bedeutung bei `costChange`,
  `computeEffectiveStats`-Vertragsfrage vom frontend-engineer.

**ai-opponent-engineer** (aus `docs/ai-status.md` Abschnitt 10.5, weiterhin
offene Punkte, keiner blockierend):
1. X-Kosten und Mehrfach-Zielslot-Karten werden von keiner Bot-Stufe
   gecastet (`getLegalActions` enumeriert sie nicht; wäre vertragskonform
   selbst konstruierbar, wie bei Kampf-Deklarationen).
2. Kein echtes Multi-Ply-Minimax/MCTS (hard bleibt 1-Ply mit
   Kampf-Sonderbehandlung); die Infrastruktur (Budget, `safeApply`,
   `evaluateState`) ist dafür vorbereitet.
3. Kein Instant-Speed-Spiel in irgendeiner Stufe.
4. Balance-Empfehlungen aus der Farb-Analyse liegen jetzt größtenteils beim
   card-designer erledigt (drei Runden, s. oben) — das Analyse-Tool kann bei
   Bedarf jederzeit erneut laufen (deterministische Seeds, direkt
   vergleichbare Zahlen).
