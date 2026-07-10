# Deckbuilder — Projektübersicht

MTG-artiger Deckbuilder als Hobby-/Lernprojekt. Fünf Agent-Rollen:
**game-architect** (Regelwerk + Datenmodell), **engine-engineer** (Spiellogik),
**card-designer** (Kartenpool + Balancing), **frontend-engineer** (UI),
**ai-opponent-engineer** (KI-Gegner, `src/ai/*`, s. „Nächste Schritte" für den
aktuellen Stand). Ein `documenter`-Subagent hält diese Übersicht sowie
`docs/status.md`/`docs/rules-engine.md` aktuell.

## Aktueller Stand (2026-07-10, Regelwerk v0.3.1 / Modell v0.2.1 mit v0.3-Erweiterungen / Engine v0.3.2 / Kartenpool 113 Karten / Frontend v0.1.8 / KI-Gegner v1)

| Artefakt | Pfad | Status |
|---|---|---|
| Regelwerk (Phasen, Priority, Stack, SBAs, Trade-offs) | `docs/rules-engine.md` | **v0.3.1**, verbindlich — Kampf-Ausbau für die Kartenpool-Erweiterung: neuer §6d mit den Keywords `trample`/`firstStrike`/`deathtouch` inkl. voller Kombinatorik-Tabelle (§6d(4)), §7 (SBA 4 um deathtouch erweitert), §9.8 **bewusst revidiert** (Mehrfachblock-Reihenfolge wird jetzt vom **Angreifer** über die neue PendingDecision `orderBlockers` gewählt, statt wie in v0.2.2 vom Verteidiger), neue Entscheidung §9.9 (Trade-offs des Keyword-Pakets). **v0.3-Update (vier vertagte Abschnitt-10-Punkte geschlossen, Entscheidungen 9.10–9.13):** `onDamageReceived` verdrahtet (feuert pro Schadensereignis > 0 bei Kampf- UND Effekt-Schaden, `eventSubject` = Schadensquelle — der frühere „reserviert, nicht verwenden"-Status ist aufgehoben); Mulligan-Regel (neuer §1b, klassische Paris-Variante, streng sequentiell, neue PendingDecision `mulligan`); X-Kosten auf aktivierten Fähigkeiten (`chosenX` jetzt auch an `activateAbility`, Verbot für Mana-Fähigkeiten); Modal-Effekte „wähle eines —" (neuer Typ `EffectMode`/`modes` auf `SpellCard`/`ActivatedAbility`/`TriggeredAbility`, Moduswahl vor X/Ziele, neue PendingDecision `chooseMode` nur für Trigger). **v0.3.1-Nachtrag:** Modellkonflikt in der Ketten-Decision `chooseMode` → `chooseTriggerTargets` behoben (additives `chosenMode?: number` an `PendingDecision "chooseTriggerTargets"`). §10 bereinigt — die großen, weiterhin bewusst vertagten Themen (>2 Spieler, Kontrollwechsel/Kopier-Effekte, Double-Strike-Analog, London-Mulligan-Upgrade, „wähle zwei" bei Modal-Effekten u. a.) bleiben dort dokumentiert, nur bei konkretem Kartenbedarf anzugehen |
| Effekt-/Fähigkeiten-DSL | `src/model/abilities.ts` | Typen fertig (v0.2: guardian final, X-Kosten geklärt, targets-los bestätigt; v0.2.3: `Keyword`-Typ um `trample`/`firstStrike`/`deathtouch` erweitert; v0.3: neuer Typ `EffectMode` + `modes`-Feld für Modal-Effekte) |
| Kartendefinitionen (6 Kartentypen, Kosten, Decks) | `src/model/cards.ts` | Typen fertig (v0.2: Aura-attachedTo geklärt; v0.3: `SpellCard.modes` für Modal-Effekte) |
| Spielzustand, Stack, Aktionen, Events, Engine-Interface | `src/model/game-state.ts` | Typen fertig (v0.2: PendingDecision/resolveDecision, CreateGameConfig ohne pool, Factory-Vertrag; v0.2.1: resumePriorityTo; v0.2.3: `PendingDecision`/`DecisionChoice` um `orderBlockers` erweitert, `PermanentState.deathtouchDamage`; v0.3: `PendingDecision`/`DecisionChoice` +`mulligan`/`chooseMode`, `chosenX`/`chosenMode` an Aktionen/Stack-Objekten, `PlayerState.mulligans`, `CreateGameConfig.skipMulligans`, Event `mulliganTaken`; v0.3.1: additives `chosenMode?: number` an `chooseTriggerTargets`) |
| Zentrale Exports | `src/model/index.ts` | fertig |
| Engine-Implementierung (Kern: Phasen/Priority/Stack/SBA/Trigger/Decisions/Combat inkl. guardian, X, Kampf-Keyword-Paket, costChange, Mulligan, Modal-Effekte) | `src/engine/*`, Status: `docs/engine-status.md` | **v0.3.2 fertig** — `costChange` (v0.2.4) sowie alle vier v0.3-Regelwerkspunkte umgesetzt: `damage.ts#applyDamageToPermanent` (`onDamageReceived`, zentraler Helfer für Kampf- UND Effekt-Schaden), `mulligan.ts` (Paris-Mulligan), `chosenX` an `activateAbility`, `modal.ts` (Modal-Effekte inkl. `chooseMode`-Decision). **v0.3.2 (echter Bugfix, gefunden beim Bot-Stresstest des neuen KI-Moduls):** `legal-actions.ts#activateAbilityCandidates` prüfte nur `tap`, nicht alle vier `AdditionalCost`-Varianten auf Bezahlbarkeit — behoben (`additionalCostsPayable`), neue Regressionstests. Engine-Testzahl (nur `src/engine/__tests__/*`) 83 → 119 (per Grep nachgezählt); zusammen mit UI+KI läuft `npm test` auf **141 Tests gesamt**. Offene Rückfrage an den game-architect (unverändert): ob `StaticAbility.scope` bei `costChange` künftig eine Bedeutung bekommen soll — nicht blockierend |
| Kartenpool / Starter-Set (113 Karten + 3 Token-Definitionen) | `src/cards/starter-set.ts`, `docs/cards/starter-set.md` | **v0.6 fertig** — Kartenzahl per Grep gegen den Code verifiziert (116 `id: "core.…"`-Einträge insgesamt, davon 3 mit `isToken:true`, macht 113 reguläre Karten). Zielgröße (≥100 Karten) seit Phase B (v0.5, 109 Karten) erreicht; **v0.6-Update** fügt 4 Demo-/Abnahmekarten für die vier neuen v0.3-Regelwerksmechaniken hinzu: `core.void-covenant` (modaler Spell), `core.current-diplomat` (modaler ETB-Trigger), `core.thornrage-boar` (`onDamageReceived`-Vergeltung), `core.cinderwrack-engine` (X-Kosten-Fähigkeit) |
| UI (Spielbrett, Vite + TypeScript) | `src/ui/*`, Status: `docs/frontend-status.md` | **v0.1.8** — Golden Path + Combat-UI weiterhin verifiziert; **v0.1.5:** dauerhafte UI-Regressionstests im Repo (`src/ui/__tests__/`, jsdom als Dev-Dependency) + echter Deckbau-Screen vor Spielstart (sequenziell Spieler 1/2, Validierung, „Zufällig füllen"-Button) statt automatischer Demo-Partie; **v0.1.6:** echte Mulligan-UI, Modus-Wahl-UI für modale Karten/Fähigkeiten/Trigger, X-Kosten-UI auf `activateAbility` verallgemeinert; **v0.1.7:** „Spieler 2 = KI"-Anbindung an `src/ai/simpleBot.ts` (Umschalter im Deckbau-Screen, automatischer Zug-Loop, „KI"-Badge); **v0.1.8:** `concede`-Button pro Spieler (`window.confirm`-Bestätigung) + `localStorage`-Persistenz der zuletzt bestätigten Decklisten über einen Seiten-Reload hinweg. `npm test` läuft laut allen Berichten auf 141/141, `npm run build`/`build:ui` sauber |
| KI-Gegner (regelbasierter Bot, spielt ausschließlich über die öffentliche `RulesEngine`-Schnittstelle) | `src/ai/simpleBot.ts`, Status: `docs/ai-status.md` | **v1 fertig** — `chooseAction(engine, pool, state, player)` nutzt nur `getLegalActions`/`applyAction`, keine Engine-Interna; einfache Score-Heuristiken ohne Lookahead. Fand beim Bot-vs-Bot-Stresstest über den vollen Kartenpool einen echten Engine-Bug (s. Engine-Zeile oben, v0.3.2) und meldete ihn statt selbst in die Engine einzugreifen. 11 dauerhafte Tests (`src/ai/__tests__/simpleBot.test.ts`, 10 benannte Seeds + 1 Stichprobe über 3 weitere Seeds = 13 vollständige Partien). Bewusst **keine** Schwierigkeitsstufen — Fundament für den neuen `ai-opponent-engineer`-Subagenten, s. „Nächste Schritte" |
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

Regelwerk (v0.3.1), Engine (v0.3.2, 141 Tests gesamt über Engine+UI+KI),
Starter-Kartenset (v0.6, 113 Karten + 3 Token-Definitionen), Spielbrett-UI
(v0.1.8) und ein einfacher regelbasierter KI-Gegner (v1) sind alle fertig
und end-to-end verifiziert. **Phase A („Kampf ausbauen") und Phase B
(„Kartenpool auf 100+ Karten") waren bereits vorher abgeschlossen; seither
zusätzlich:**

- **Vier Regelwerks-Punkte aus Abschnitt 10 geschlossen** (v0.3/v0.3.1):
  `onDamageReceived` verdrahtet, Mulligan-Regel (Paris-Variante), X-Kosten
  auf aktivierten Fähigkeiten, Modal-Effekte „wähle eines —" (inkl. eines
  v0.3.1-Nachtrags, der einen Modellkonflikt in der Ketten-Decision
  `chooseMode` → `chooseTriggerTargets` behebt).
- **Engine** hat alle vier Punkte umgesetzt (v0.3/v0.3.1) und dabei über
  Bot-Stresstests einen echten Bugfix gefunden und behoben (v0.3.2:
  `legal-actions.ts` prüfte bei `activateAbility` nicht alle Zusatzkosten).
- **Kartenpool** um 4 Demo-/Abnahmekarten für die vier neuen Mechaniken
  erweitert (v0.6, 109 → 113 Karten).
- **Frontend** hat in vier Schritten (v0.1.5–v0.1.8) nachgezogen: dauerhafte
  UI-Tests + echte Deckbau-UI, Mulligan-/Modal-/X-Kosten-UI, KI-Anbindung
  („Spieler 2 = KI"), `concede`-Button + `localStorage`-Deck-Persistenz.
- **Neu: ein einfacher, regelbasierter KI-Gegner** (`src/ai/simpleBot.ts`,
  v1, `docs/ai-status.md`) — spielt ausschließlich über die öffentliche
  `RulesEngine`-Schnittstelle, bewusst ohne Schwierigkeitsstufen.
- **Neu: ein fünfter Subagent `ai-opponent-engineer`**
  (`.claude/agents/ai-opponent-engineer.md`, Modell `claude-fable-5`) für
  den Ausbau dieses Bots — s. „Nächster geplanter Meilenstein" unten.

Details je Bereich in `docs/rules-engine.md`, `docs/engine-status.md`,
`docs/cards/starter-set.md`, `docs/frontend-status.md`, `docs/ai-status.md`;
Kurzfassung des Gesamtstands (inkl. dieses Meilensteins) in `docs/status.md`.

---

### Nächster geplanter Meilenstein: KI-Gegner-Ausbau (noch nicht gestartet)

Der neue **`ai-opponent-engineer`**-Subagent soll `src/ai/*` von der
aktuellen v1 (eine feste Heuristik, kein Lookahead) zu **drei spürbar
unterschiedlichen Schwierigkeitsstufen** ausbauen — explizit vom Nutzer
gewünscht, aber **bewusst für eine künftige Session zurückgestellt**, kein
Teil dieses Sweeps. Ausgangspunkt sind die in `docs/ai-status.md`
Abschnitt 6 dokumentierten bekannten v1-Schwächen:

1. Kein Lookahead / keine Board-State-Tiefenanalyse (reine
   Ein-Schritt-Heuristiken).
2. Ignoriert statische Fähigkeiten anderer Permanents bei der
   Stat-/Keyword-Schätzung (Anthems, Debuffs, fremd gewährte Keywords).
3. Kein Kombo-/Synergieverständnis (Karten werden isoliert bewertet).
4. Keine Instant-Speed-Taktik (hält nie proaktiv Mana für Reaktionen offen).
5. Modale Karten werden nur über die „günstigste Option"-Baseline bewertet,
   nicht über den tatsächlichen Effekt des gewählten Modus.
6. Grobe Ziel-Optimierung bei Removal (nur Power+Toughness, keine
   Bedrohlichkeits-/Keyword-Bewertung).
7. Guardian/Airborne/Reach-Erkennung bei Blockern nutzt nur Basis-Keywords,
   keine statischen Fremd-Grants.
8. Grobe Discard-Heuristik ohne Kontextbewertung.

Der Auftrag an `ai-opponent-engineer` umfasst laut Subagent-Definition
zusätzlich: Performance-Budget für teurere Heuristiken (Minimax/Suche,
kein spürbares UI-Einfrieren), automatisierte Bot-vs-Bot-Sanity-Checks
(„höhere Stufe schlägt niedrigere tendenziell"), eine strikte
Konsumenten-Grenze (nur `getLegalActions`/`applyAction`, keine
Engine-/Model-Änderungen — echte Schnittstellenlücken werden gemeldet statt
eigenmächtig eingebaut), sowie kein eigenes UI (ein
Schwierigkeitsgrad-Regler wird in Absprache mit frontend-engineer an diesen
übergeben — `docs/frontend-status.md` „Nächste Schritte" Punkt 10 hält
bereits fest, dass der Deckbau-Screen dafür einen zweiten Umschalter
bräuchte).

---

### Weitere offene Punkte, keiner davon blockiert das Spielen

**card-designer:** Kein Hauptauftrag mehr offen — Zielgröße (≥100 Karten)
erreicht, praktisch alle DSL-Primitive und alle 9 Keywords sind im Pool
vertreten (`docs/cards/starter-set.md`). Optionale Kandidaten für einen
möglichen weiteren Batch, weiterhin „kein Blocker":
1. `onAttackDeclared`/`onBlockDeclared`-Trigger (verdrahtet, aber ungenutzt).
2. `modifyStats` mit `duration: "permanent"` (bisher nur `endOfTurn`
   demonstriert).
3. Karten mit >1 Zielslot sind weiterhin ungetestet (weder Engine noch UI)
   — falls gewünscht, zieht das Ausbauarbeit auf beiden Seiten nach sich.

**engine-engineer:**
1. **Offene Rückfrage an game-architect (unverändert seit v0.2.4):** Soll
   `StaticAbility.scope` bei `modifier.kind === "costChange"` künftig eine
   eigene Bedeutung bekommen (aktuell wird nur `modifier.appliesTo`
   ausgewertet, `scope` ignoriert) — nicht blockierend.
2. StaticAbility-Test für `stats`/`grantKeyword` ergänzen (weiterhin ohne
   eigenen Unit-Test, siehe `docs/engine-status.md` Lücke 7).
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
5. **Bot-Schwierigkeitsstufe/-Timing ist noch nicht im UI einstellbar**
   (`botMoveDelayMs` nur über Code/Tests) — wird relevant, sobald der
   `ai-opponent-engineer`-Ausbau (s. oben) mehrere Stufen liefert.

**game-architect (Folgearbeit):**
- Offene Rückfrage vom engine-engineer zu `StaticAbility.scope` bei
  `costChange` (s.o.) — nicht blockierend.
- **Bewusst vertagte, größere Regelwerk-Themen** (`docs/rules-engine.md`
  Abschnitt 10, „Weiterhin offen") — **nur bei konkretem Kartenbedarf
  anzugehen, kein aktiver Auftrag:** mehr als 2 Spieler; Kontrollwechsel/
  Kopier-Effekte/Keyword-Entzug; Double-Strike-Analog (teilt in beiden
  Schadensrunden aus); Priority-Fenster zwischen den beiden Schadensrunden
  (9.9 Punkt 2); trample-Über-Zuteilung (9.9 Punkt 3, Spielerwahl „mehr als
  letal an einen Blocker"); Spielerwahl bei der Reihenfolge mehrerer
  eigener gleichzeitiger Trigger; „Spieler erleidet Schaden"-Trigger (das
  Spieler-Pendant zu `onDamageReceived`); London-Mulligan als Upgrade der
  Paris-Variante (9.11 Option B); „wähle zwei"/konfigurierbare Modusanzahl
  bei Modal-Effekten (9.13 Punkt 4); vollständig rekursive
  Cleanup-Sonderregel; Migration von `addMana("any")`/`discardCards`-
  Zusatzkosten/`scry` auf den Pending-Decision-Kanal; kombinatorische
  Enumeration in `getLegalActions` (bewusstes Nicht-Ziel).
- Zusätzlich offen (aus engine-engineer/frontend-engineer, siehe oben):
  `StaticAbility.scope`-Bedeutung bei `costChange`,
  `computeEffectiveStats`-Vertragsfrage vom frontend-engineer.

**ai-opponent-engineer:** s. „Nächster geplanter Meilenstein" oben — der
eigentliche Hauptauftrag dieser Rolle, noch nicht begonnen.
