# Deckbuilder — Projektübersicht

MTG-artiger Deckbuilder als Hobby-/Lernprojekt. Vier Agent-Rollen:
**game-architect** (Regelwerk + Datenmodell), **engine-engineer** (Spiellogik),
**card-designer** (Kartenpool + Balancing), **frontend-engineer** (UI).

## Aktueller Stand (2026-07-09, Regelwerk v0.2.3 / Modell v0.2.1 / Engine v0.2.4 / Kartenpool 109 Karten / Frontend v0.1.4)

| Artefakt | Pfad | Status |
|---|---|---|
| Regelwerk (Phasen, Priority, Stack, SBAs, Trade-offs) | `docs/rules-engine.md` | **v0.2.3**, verbindlich — Kampf-Ausbau für die Kartenpool-Erweiterung: neuer §6d mit den Keywords `trample`/`firstStrike`/`deathtouch` inkl. voller Kombinatorik-Tabelle (§6d(4)), §7 (SBA 4 um deathtouch erweitert), §9.8 **bewusst revidiert** (Mehrfachblock-Reihenfolge wird jetzt vom **Angreifer** über die neue PendingDecision `orderBlockers` gewählt, statt wie in v0.2.2 vom Verteidiger), neue Entscheidung §9.9 (Trade-offs des Keyword-Pakets), §10 aktualisiert. **Nachtrag im Rahmen von Phase B** (kein Versionssprung, da reine Klärung ohne Datenmodell-Änderung): Der card-designer fand beim Kartenpool-Audit, dass `TriggerCondition.onDamageReceived` im Modell existiert, aber von der Engine an keiner Stelle gefeuert wird; der game-architect hat entschieden, das **nicht** zu implementieren, sondern als „reserviert, noch nicht verdrahtet" zu dokumentieren (§5 neuer Hinweis-Bullet, §6d(4) Fußnote, §10 neuer offener Punkt mit Implementierungsnotizen für eine spätere Umsetzung bei Bedarf) |
| Effekt-/Fähigkeiten-DSL | `src/model/abilities.ts` | Typen fertig (v0.2: guardian final, X-Kosten geklärt, targets-los bestätigt; v0.2.3: `Keyword`-Typ um `trample`/`firstStrike`/`deathtouch` erweitert) |
| Kartendefinitionen (6 Kartentypen, Kosten, Decks) | `src/model/cards.ts` | Typen fertig (v0.2: Aura-attachedTo geklärt) |
| Spielzustand, Stack, Aktionen, Events, Engine-Interface | `src/model/game-state.ts` | Typen fertig (v0.2: PendingDecision/resolveDecision, CreateGameConfig ohne pool, Factory-Vertrag; v0.2.1: resumePriorityTo; v0.2.3: `PendingDecision`/`DecisionChoice` um `orderBlockers` erweitert, `PermanentState.deathtouchDamage`) |
| Zentrale Exports | `src/model/index.ts` | fertig |
| Engine-Implementierung (Kern: Phasen/Priority/Stack/SBA/Trigger/Decisions/Combat inkl. guardian, X, Kampf-Keyword-Paket, costChange) | `src/engine/*`, Status: `docs/engine-status.md` | **v0.2.4 fertig** (83 Tests grün, per `npm test` verifiziert; Testzahl per Grep gegen den Code gegengeprüft: 83 `it(`/`test(`-Vorkommen in `src/engine/__tests__/*.test.ts`) — Kampf-Keyword-Paket `trample`/`firstStrike`/`deathtouch` + `orderBlockers`-PendingDecision (v0.2.3) weiterhin vollständig; **neu in v0.2.4:** `StaticAbility`-Modifier `costChange` implementiert (`stats.ts#computeSpellCostDelta`, verdrahtet in `mana.ts`/`actions.ts`/`legal-actions.ts` an allen Spell-Kostenprüfungsstellen, bewusst NICHT an `activateAbility`), neue `cost-change.test.ts` (6 Tests); offene Rückfrage des engine-engineers an den game-architect, ob `StaticAbility.scope` bei `costChange` künftig eine Bedeutung bekommen soll (aktuell von der Engine bewusst ignoriert, nur `modifier.appliesTo` zählt) — nicht blockierend. `npm run build` sauber |
| Kartenpool / Starter-Set (109 Karten + 3 Token-Definitionen) | `src/cards/starter-set.ts`, `docs/cards/starter-set.md` | **v0.5 fertig, Phase B abgeschlossen** — Kartenzahl per Grep gegen den Code verifiziert (112 `id: "core.…"`-Einträge insgesamt, davon 3 mit `isToken:true`, macht 109 reguläre Karten). In drei Batches von 27 auf 109 ausgebaut: Batch 1 (+29, Fokus Kampf-Keywords `trample`/`firstStrike`/`deathtouch`/bestehende Keywords), Batch 2 (+25 + 3 Token-Defs, Fokus `createToken`/`grantKeyword`-als-Effekt/`tapPermanent`/`untapPermanent`-als-Effekt/`removeCounters`/`discardCards`, Typ-Mix ausgeglichen), Batch 3 (+28, Fokus `costChange`/`scry`/`StaticAbility scope: self`/`opponentUnits`/`allUnits`, schließt fast alle übrigen ungenutzten DSL-Primitive). Alle 9 Keywords und nahezu alle DSL-Primitive jetzt im Pool vertreten (Details `docs/cards/starter-set.md`); dabei fand der card-designer die `onDamageReceived`-Lücke (s. Regelwerk-Zeile oben) |
| UI (Spielbrett, Vite + TypeScript) | `src/ui/*`, Status: `docs/frontend-status.md` | **v0.1.4** — Golden Path + Combat-UI (v0.1.2) + `orderBlockers`-Panel (v0.1.3, per echtem Browser-Test vom documenter bestätigt, s.u.) weiterhin verifiziert; **neu in v0.1.4:** `src/ui/deck.ts#buildDemoDeck` angepasst, damit das Demo-Deck beim jetzt 109 Karten großen Pool nicht auf ~124 Karten/Spieler anwächst — Terrains weiterhin fest 4×, Nicht-Terrain jetzt eine zufällige Stichprobe von bis zu 40 Karten (Fallback auf den vollen Pool bei kleineren Kartenmengen, rückwärtskompatibel zum alten 27-Karten-Stand). Ergebnis bei 109 Pool-Karten: 60 Karten/Spieler (verifiziert per Code-Lesen von `deck.ts` UND per echtem Browser-Test der finalen Demo-Partie durch den documenter: Bibliothek 53 + Hand 7 = 60 Karten/Spieler, keine Konsolenfehler) |
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
   für alle Spielerentscheidungen mitten in der Abwicklung (Trigger-Ziele, später scry/Farbwahl/Modal).

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

Regelwerk (v0.2.3), Engine (v0.2.4, 83 Tests), Starter-Kartenset (v0.5, 109
Karten + 3 Token-Definitionen) und Spielbrett-UI (v0.1.4) sind alle fertig
und end-to-end verifiziert. **Sowohl Phase A („Kampf ausbauen") als auch
Phase B („Kartenpool auf 100+ Karten") sind damit abgeschlossen:**

- **Phase A:** Kampf für den End-to-End-Test gehärtet (v0.2.2) und um vier
  neue Mechaniken erweitert (v0.2.3) — `trample`, `firstStrike`,
  `deathtouch` sowie die angreifergewählte Mehrfachblock-Reihenfolge
  (`orderBlockers`, löst die v0.2.2-Vereinfachung „Verteidiger-Wahl" ab).
- **Phase B:** Der card-designer hat den Kartenpool in drei Batches von 27
  auf 109 Karten ausgebaut (`src/cards/starter-set.ts`); der
  engine-engineer hat dafür als Lückenschluss den `costChange`-Static-
  Modifier implementiert (v0.2.4); der frontend-engineer hat das
  Demo-Deck-Sampling angepasst, damit es bei 109 Pool-Karten nicht auf
  ~124 Karten/Spieler anwächst (v0.1.4, jetzt 60 Karten/Spieler); der
  game-architect hat eine dabei gefundene Engine-Lücke
  (`onDamageReceived` feuert nirgends) geprüft und bewusst als „reserviert,
  noch nicht verdrahtet" vertagt statt sie zu implementieren.

Details je Bereich in `docs/engine-status.md`, `docs/cards/starter-set.md`,
`docs/frontend-status.md`; Kurzfassung des Gesamtstands in `docs/status.md`.

**Offene Punkte, keiner davon blockiert das Spielen** (Quelle für die
game-architect-Punkte: `docs/rules-engine.md` Abschnitt 10, dort im Detail
inkl. Implementierungsnotizen):

### card-designer
Kein Hauptauftrag mehr offen — Zielgröße (≥100 Karten) erreicht, praktisch
alle DSL-Primitive und alle 9 Keywords sind jetzt im Pool vertreten (siehe
`docs/cards/starter-set.md`, Abschnitte „Keywords: Abdeckung im Pool" und
„Nicht verwendete DSL-Primitive"). Optionale Kandidaten für einen
möglichen weiteren Batch, laut card-designer explizit „kein Blocker":
1. `onAttackDeclared`/`onBlockDeclared`-Trigger (vollständig in der Engine
   verdrahtet, aber bislang keine Karte nutzt sie).
2. `EffectRecipient` `eventSubject` (z.B. „wenn eine gegnerische Kreatur
   stirbt, verbanne sie").
3. `modifyStats` mit `duration: "permanent"` (bisher nur `endOfTurn`
   demonstriert).
4. Karten mit >1 Zielslot sind weiterhin ungetestet (weder Engine noch UI)
   — falls gewünscht, zieht das Ausbauarbeit auf beiden Seiten nach sich.

### engine-engineer
1. **`onDamageReceived` verdrahten, falls eine künftige Karte es braucht**
   (rules-engine.md 10, mit konkreten Implementierungsnotizen: Anknüpfpunkte
   `combat.ts#dealCombatDamageRound` und `effects.ts#dealDamageToPermanent`,
   Semantik Schaden ≤ 0 feuert nicht, Trigger feuert auch bei letalem
   Schaden) — bewusst vertagt, kein aktueller Bedarf im Pool.
2. **Offene Rückfrage an game-architect:** Soll `StaticAbility.scope` bei
   `modifier.kind === "costChange"` künftig eine eigene Bedeutung bekommen
   (aktuell wird nur `modifier.appliesTo` ausgewertet, `scope` ignoriert),
   siehe `docs/engine-status.md` „Offene Fragen" Punkt 3 — nicht
   blockierend.
3. StaticAbility-Test für `stats`/`grantKeyword` ergänzen (weiterhin ohne
   eigenen Unit-Test, siehe `docs/engine-status.md` Lücke 7).
4. Migration von `chooseManaColor`/`chooseDiscard`/`orderScry` auf den
   Pending-Decision-Kanal (rules-engine.md 9.7), sobald Kartenpool das braucht.
5. Mana-Fähigkeiten mit X-Kosten (rules-engine.md 10, bestätigter offener Punkt).

### frontend-engineer
1. UI-Tests dauerhaft ins Repo (Vitest+jsdom) statt nur manueller Verifikation.
2. `concede`-Button ergänzen.
3. `computeEffectiveStats`/`computeEffectiveKeywords` offiziell in den
   `RulesEngine`-Vertrag heben (aktuell bewusster Re-Use einer als „nicht
   stabil" markierten Engine-API, siehe `docs/frontend-status.md` Grenzfall).
4. Mehrfach-Zielslot-Unterstützung in der `xTarget`-UI, sobald Karten das brauchen.
5. **`vigilant`/`trample`/`firstStrike`/`deathtouch` echt im Browser
   nachverifizieren** — der Kartenpool enthält jetzt (seit Phase B, Batch 1)
   echte Karten mit allen vier Keywords, die frühere Blockade („keine
   Testkarte im Demo-Deck") ist damit aufgehoben; bisher nur gegen
   Engine-Test-Fixtures im DOM verifiziert (v0.1.3), noch nicht gegen die
   echten Pool-Karten im echten Demo-Deck (diese landen nur über die
   Zufallsstichprobe aus `deck.ts` im jeweiligen Spiel, nicht garantiert).
6. Deckbau-UI (Decklist-Auswahl statt fest codiertem Demo-Deck) — klar
   außerhalb bisheriger Schritte, aber die nächste naheliegende Ausbaustufe
   angesichts der jetzt 109 Pool-Karten.

### game-architect (Folgearbeit)
- Verbleibende offene Punkte: rules-engine.md Abschnitt 10 („Weiterhin
  offen"), aktueller Stand (nicht geraten, direkt aus dem Dokument
  übernommen): `onDamageReceived`-Verdrahtung bei Bedarf (s.o.,
  Implementierungsnotizen bereits hinterlegt), Mulligan-Regel (weiterhin
  keine), mehr als 2 Spieler, Kontrollwechsel/Kopier-Effekte/
  Keyword-Entzug, Double-Strike-Analog, Priority-Fenster zwischen den
  beiden Schadensrunden (9.9 Punkt 2), trample-Über-Zuteilung (9.9 Punkt 3,
  Spielerwahl „mehr als letal an einen Blocker"), Spielerwahl bei der
  Reihenfolge mehrerer eigener gleichzeitiger Trigger, Modal-Effekte,
  X-Kosten auf aktivierten Fähigkeiten, vollständig rekursive
  Cleanup-Sonderregel, Migration von `addMana("any")`/`discardCards`-
  Zusatzkosten/`scry` auf den Pending-Decision-Kanal, kombinatorische
  Enumeration in `getLegalActions` (bewusstes Nicht-Ziel).
- Zusätzlich offen (aus engine-engineer/frontend-engineer, siehe oben):
  `StaticAbility.scope`-Bedeutung bei `costChange`,
  `computeEffectiveStats`-Vertragsfrage vom frontend-engineer.
- Nächste erwartbare Anfragen: entweder aus einem optionalen vierten
  Kartenpool-Batch (card-designer-Kandidaten s.o.) oder aus einem
  Deckbau-UI-Vorstoß des frontend-engineers.
