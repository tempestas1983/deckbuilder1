/**
 * Geführte Schritt-Sequenz für den Tutorial-Modus (v0.1.16, s.
 * docs/frontend-status.md — löst die bisherige v0.1.11-v0.1.15-Fassung ab, in
 * der jeder Aktionstyp nur EINMALIG eine lose, passive Info-Sprechblase
 * auslöste, FALLS der Spieler zufällig darüber stolperte). Nutzer-Auftrag:
 * "Instruktion → konkrete erwartete Aktion → kurze Bestätigung/
 * Ergebnis-Erklärung → nächste Instruktion" statt bloßer Info-Häppchen.
 *
 * Jeder `TutorialStep` trägt zusätzlich zu den beiden Anzeige-Texten
 * (`instruction`/`confirmation`) eine `detect`-Funktion, die erkennt, WANN der
 * Schritt "erledigt" ist bzw. (bei reinen Info-Schritten, `infoOnly: true`)
 * WANN sein Moment im Spielverlauf tatsächlich erreicht ist. Das ist bewusst
 * dieselbe Art von Code wie die frühere `store.ts#maybeQueueTutorialTips`
 * (reine WIEDERERKENNUNG bereits von der Engine getroffener Entscheidungen
 * anhand von `PlayerAction`/`GameState` — KEINE eigene Regellogik), nur jetzt
 * pro Schritt colokiert statt in einem zentralen `switch`. `store.ts` bleibt
 * die einzige Stelle, die diese Funktionen tatsächlich AUFRUFT und den
 * Fortschritt verwaltet (Sequenz-Zeiger, "gesehene Fakten", Bot-Pause,
 * Highlight-Auswahl) — hier liegen nur Text + Erkennung.
 *
 * **Wichtig fürs Verständnis der Reihenfolge:** Die hier festgelegte
 * Reihenfolge ist die PÄDAGOGISCHE Präsentationsreihenfolge, NICHT
 * zwangsläufig die chronologische Reihenfolge, in der die zugehörigen
 * Spielmomente mit dem festen `TUTORIAL_SEED` (tutorialDeck.ts) tatsächlich
 * eintreten. Beispiel: `core.fire-jolt` (castDamageSpell) ist mit diesem Seed
 * bereits in Zug 1 bezahlbar (1 Mana, kein Ziel auf dem Feld nötig), während
 * `core.cinder-pup` (die einzige Vanilla-Kreatur des Decks) laut Simulation
 * erst im 4. eigenen Zug gezogen wird — die erste tatsächlich beschworene
 * Kreatur ist mit diesem Seed praktisch immer `core.ember-whelp` (2 Mana, ab
 * Zug 2 bezahlbar). `store.ts` behandelt das über EIN einheitliches Prinzip:
 * `detect` wird nach JEDER Aktion für ALLE Schritte geprüft (nicht nur den
 * gerade aktiven) und das Ergebnis als "bereits gesehener Fakt" gemerkt;
 * erreicht die Sequenz einen Schritt, dessen Fakt schon (aus einem früheren,
 * scheinbar "falschen" Moment) vorliegt, wird sofort dessen Bestätigung
 * gezeigt statt erneut zu warten. Das macht die Sequenz robust gegenüber
 * Mana-Kurve UND gegenüber Bot-Verhalten (z.B. `declareBlock`: der Bot mag
 * schon Züge vorher angreifen, bevor die Sequenz überhaupt bei diesem Schritt
 * ankommt — das geblockt-haben zählt trotzdem).
 */

import type { CardPool, GameState, PlayerAction } from "../model";

export type TutorialStepId =
  | "mulliganIntro"
  | "priorityIntro"
  | "playTerrain"
  | "tapForMana"
  | "castCreature"
  | "chooseTriggerTarget"
  | "castDamageSpell"
  | "castBuffSpell"
  | "declareAttack"
  | "combatDamage"
  | "declareBlock"
  | "winCondition"
  | "complete";

export interface TutorialStepText {
  title: string;
  body: string;
}

/** Kontext, den `detect` zur Erkennung bekommt — reines Auslesen, s. Dateikommentar. */
export interface TutorialDetectContext {
  /** Zustand NACH der Aktion (bzw. nach `initGame`, dann ist `action` `undefined`). */
  state: GameState;
  /** Die gerade angewendete Aktion (Mensch ODER Bot) — `undefined` direkt nach Partiestart. */
  action?: PlayerAction;
  pool: CardPool;
}

export interface TutorialStep {
  id: TutorialStepId;
  /**
   * true = reiner Info-Schritt ohne eigene abwartbare Spieler-Aktion (z.B.
   * Prioritätskonzept, Kampfschaden-Beobachtung, Sieg-/Niederlage-Bedingung,
   * Abschluss) — hier gibt es nur EINE Sprechblase (der `instruction`-Text
   * verdoppelt als Bestätigung); "Weiter" schließt sie und rückt die Sequenz
   * gleichzeitig vor. `confirmation` bleibt bei diesen Schritten ungenutzt.
   */
  infoOnly?: boolean;
  /** Instruktion — wird BEVOR die erwartete Aktion ausgeführt wurde gezeigt (nicht-modales Banner bei Aktions-Schritten, s. store.ts). */
  instruction: TutorialStepText;
  /** Bestätigung/Ergebnis-Erklärung — NACHDEM die erwartete Aktion erkannt wurde (modale Sprechblase). Bei `infoOnly`-Schritten ungenutzt. */
  confirmation: TutorialStepText;
  /**
   * true = die erwartete Aktion dieses Schritts ist nur zu "Hexerei-Timing"
   * legal (eigener Zug, Main-Phase, leerer Stack — spiegelt
   * src/engine/legality.ts#isMainPhaseTimingOk; reines Kennzeichnungsfeld,
   * KEINE eigene Regelentscheidung, s. Dateikommentar oben). Bug/Auftrag
   * "Terrain-Sackgasse": solange dieser Schritt aktiv, noch nicht erledigt
   * ist UND player1 gerade tatsächlich eine passende Kandidatenaktion zur
   * Verfügung hat, blockiert store.ts#getTutorialPassPriorityBlockReason den
   * "Priorität passen"-Button — ein Klick würde sonst unbemerkt die Main-
   * Phase verlassen (z.B. Richtung `declareAttackers`) und die Aktion für
   * den Rest des Zugs unerreichbar machen (bei `playTerrain` sogar für den
   * gesamten Rest der Partie, da nur 1 Terrain pro Zug erlaubt ist), OHNE
   * dass am unverändert weiter angezeigten Instruktionstext noch erkennbar
   * wäre, warum der erwartete Button plötzlich verschwunden ist.
   *
   * Bewusst NICHT gesetzt für `castDamageSpell`/`castBuffSpell`: die
   * zugehörigen Testkarten (core.fire-jolt/core.blazing-frenzy, s.
   * TUTORIAL_STEP_HAND_CARD_IDS unten) sind beide `speed: "fast"`
   * (Spontanzauber) — laut legality.ts#canCastNow bleiben die JEDERZEIT
   * castbar, solange der Spieler Priority hat, auch außerhalb der eigenen
   * Hauptphase/des eigenen Zugs. Das Verlassen der Hauptphase kostet die
   * Aktion dort also nie — dieselbe Sackgassen-Gefahr besteht dort nicht,
   * eine Sperre wäre dort nur unnötig einschränkend.
   */
  mainPhaseOnly?: boolean;
  /**
   * Erkennt, ob dieser Schritt gerade "erledigt"/"jetzt erreicht" ist. Wird
   * von `store.ts` nach JEDER Aktion für JEDEN Schritt aufgerufen (nicht nur
   * den aktiven), s. Dateikommentar oben. Bei Aktions-Schritten typischerweise
   * `action`-basiert, bei Info-Schritten `state`-basiert.
   */
  detect: (ctx: TutorialDetectContext) => boolean;
}

/**
 * Deck-spezifische Handkarten-IDs, deren Handkarte für einen Aktions-Schritt
 * visuell hervorgehoben wird (s. store.ts#getTutorialHighlight,
 * components/handCard.ts). Bewusst hier (statt generisch über `def.type`
 * erraten) und bewusst an `tutorialDeck.ts` gekoppelt — dieselbe bereits
 * bestehende Kopplung wie zwischen tutorialDeck.ts und den früheren
 * TUTORIAL_TIPS (nur Kernkonzept-Karten dieses kuratierten Decks, kein
 * Anspruch auf Generik für beliebige Decks).
 */
export const TUTORIAL_STEP_HAND_CARD_IDS: Partial<Record<TutorialStepId, readonly string[]>> = {
  playTerrain: ["core.flame-ridge"],
  castCreature: ["core.cinder-pup", "core.ember-whelp", "core.wildfire-boar"],
  castDamageSpell: ["core.fire-jolt"],
  castBuffSpell: ["core.blazing-frenzy"],
};

function isPlayer1Action(action: PlayerAction | undefined): boolean {
  return !!action && action.player === "player1";
}

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "mulliganIntro",
    infoOnly: true,
    instruction: {
      title: "Starthand & Mulligan",
      body:
        "Ihr seht gleich eure Starthand mit 7 Karten. Gefällt sie euch nicht, dürft ihr einmal einen Mulligan " +
        "nehmen (neu mischen, neue 7 Karten ziehen, danach eine Karte abwerfen). Für dieses Tutorial reicht es, " +
        "die Starthand ganz normal zu behalten.",
    },
    confirmation: { title: "", body: "" },
    detect: () => true,
  },
  {
    id: "priorityIntro",
    infoOnly: true,
    instruction: {
      title: "Mana, Phasen & Priorität",
      body:
        "Ein Zug läuft durch mehrere feste Phasen/Schritte (Upkeep, Draw, Main, Combat, ...). In jedem Schritt " +
        "bekommen beide Spieler nacheinander \"Priorität\" — ihr DÜRFT etwas tun (Karte spielen, Fähigkeit " +
        "aktivieren), müsst aber nicht. \"Priorität passen\" heißt \"ich möchte gerade nichts (weiteres) tun\". " +
        "Beide Spieler wechseln sich außerdem mit ganzen Zügen ab: Ist der Gegner am Zug, bekommt ihr trotzdem " +
        "regelmäßig Priorität, habt aber meist nichts zu tun — dann einfach passen, bis ihr wieder selbst dran seid.",
    },
    confirmation: { title: "", body: "" },
    detect: (ctx) => ctx.state.priorityPlayer !== undefined && !ctx.state.pendingDecision,
  },
  {
    id: "playTerrain",
    mainPhaseOnly: true,
    instruction: {
      title: "Terrain spielen",
      body:
        "Legt jetzt das hervorgehobene Terrain (Flammenkuppe) aus eurer Hand: Klickt dazu auf der Handkarte den " +
        "Button \"Terrain legen\". Pro Zug dürft ihr genau eines spielen — es ist eure Manaquelle für den Rest " +
        "der Partie.",
    },
    confirmation: {
      title: "Terrain gespielt",
      body:
        "Die Flammenkuppe liegt jetzt auf eurem Spielfeld. Als Nächstes zeigen wir, wie ihr daraus tatsächlich " +
        "Mana bekommt.",
    },
    detect: (ctx) => ctx.action?.kind === "playTerrain" && isPlayer1Action(ctx.action),
  },
  {
    id: "tapForMana",
    instruction: {
      title: "Terrain für Mana antippen",
      body:
        "Klickt jetzt auf die hervorgehobene Flammenkuppe auf eurem Spielfeld — das tappt (dreht) sie und " +
        "erzeugt 1 Flamme-Mana in eurem Manapool.",
    },
    confirmation: {
      title: "Mana erzeugt",
      body:
        "Ihr habt jetzt 1 Flamme-Mana im Manapool — damit könnt ihr eine Karte bezahlen. Wichtig: der Manapool " +
        "leert sich am Ende jedes Schritts wieder, bezahlt also am besten gleich im selben Zug.",
    },
    detect: (ctx) => {
      if (ctx.action?.kind !== "activateAbility" || !isPlayer1Action(ctx.action)) return false;
      const card = ctx.state.cards[ctx.action.sourceInstanceId];
      const def = card ? ctx.pool[card.definitionId] : undefined;
      const ability = def && "abilities" in def ? def.abilities?.[ctx.action.abilityIndex] : undefined;
      return ability?.kind === "activated" && !!ability.isManaAbility;
    },
  },
  {
    id: "castCreature",
    mainPhaseOnly: true,
    instruction: {
      title: "Eine Kreatur beschwören",
      body:
        "Sobald ihr genug Mana UND eine Kreatur auf der Hand habt (hervorgehoben, z.B. Glutwelpe oder " +
        "Glutpfote), spielt sie aus. Reicht das Mana diesen Zug noch nicht, ist das kein Problem — holt es " +
        "einfach in einem der nächsten Züge nach.",
    },
    confirmation: {
      title: "Kreatur beschworen",
      body:
        "Eure Kreatur ist jetzt auf dem Spielfeld, hat aber noch \"Beschwörungskrankheit\" — sie kann DIESEN " +
        "Zug noch nicht angreifen. Ab eurem nächsten Zug ist sie einsatzbereit.",
    },
    detect: (ctx) => {
      if (ctx.action?.kind !== "castSpell" || !isPlayer1Action(ctx.action)) return false;
      const card = ctx.state.cards[ctx.action.cardInstanceId];
      const def = card ? ctx.pool[card.definitionId] : undefined;
      return def?.type === "unit";
    },
  },
  {
    id: "chooseTriggerTarget",
    instruction: {
      title: "Ziel für eine Fähigkeit wählen",
      body:
        "Manche Kreaturen lösen beim Ins-Spiel-Kommen eine Fähigkeit aus, die ein Ziel braucht (die Glutwelpe " +
        "z.B. fügt einem Ziel 1 Schaden zu). Tippt das markierte Ziel auf dem Spielbrett an, um es zu wählen.",
    },
    confirmation: {
      title: "Ziel gewählt",
      body: "Die Fähigkeit hat ihr Ziel getroffen. Genau so wählt ihr auch bei Zaubersprüchen mit Ziel ein Ziel aus.",
    },
    detect: (ctx) =>
      ctx.action?.kind === "resolveDecision" &&
      ctx.action.choice.kind === "chooseTriggerTargets" &&
      isPlayer1Action(ctx.action),
  },
  {
    id: "castDamageSpell",
    instruction: {
      title: "Schadenszauber wirken",
      body:
        "Wirkt jetzt einen Zauberspruch mit Schaden (hervorgehoben: Feuerstoß) auf eine gegnerische Kreatur " +
        "oder direkt auf den Gegner.",
    },
    confirmation: {
      title: "Schaden verursacht",
      body:
        "Der Zauberspruch hat seinen Effekt ausgelöst und landet danach auf dem Friedhof — anders als Kreaturen " +
        "bleibt er NICHT auf dem Spielfeld liegen.",
    },
    detect: (ctx) => {
      if (ctx.action?.kind !== "castSpell" || !isPlayer1Action(ctx.action)) return false;
      const card = ctx.state.cards[ctx.action.cardInstanceId];
      const def = card ? ctx.pool[card.definitionId] : undefined;
      return def?.type === "spell" && def.effects.some((e) => e.kind === "dealDamage");
    },
  },
  {
    id: "castBuffSpell",
    instruction: {
      title: "Eigene Kreatur verstärken",
      body: "Wirkt jetzt einen Verstärkungszauber (hervorgehoben: Lodernder Rausch) auf eine eigene Kreatur.",
    },
    confirmation: {
      title: "Kreatur verstärkt",
      body:
        "Schaut auf die hervorgehobene Karte: Kraft/Zähigkeit unten rechts sind jetzt bis zum Ende des Zuges " +
        "höher. Danach fällt der Bonus automatisch wieder weg.",
    },
    detect: (ctx) => {
      if (ctx.action?.kind !== "castSpell" || !isPlayer1Action(ctx.action)) return false;
      const card = ctx.state.cards[ctx.action.cardInstanceId];
      const def = card ? ctx.pool[card.definitionId] : undefined;
      if (def?.type !== "spell" || !def.effects.some((e) => e.kind === "modifyStats")) return false;
      const target = ctx.action.chosenTargets[0];
      return !!target && target.kind === "permanent" && ctx.state.cards[target.instanceId]?.controller === "player1";
    },
  },
  {
    id: "declareAttack",
    instruction: {
      title: "Angreifer erklären",
      body:
        "Sobald eine eurer Kreaturen einsatzbereit ist (keine Beschwörungskrankheit mehr, ungetappt), könnt " +
        "ihr in der Angriffsphase angreifen: Kreatur anklicken, dann \"Angriff erklären\" bestätigen — der " +
        "Angriff geht gegen den gegnerischen Spieler.",
    },
    confirmation: {
      title: "Angriff erklärt",
      body: "Eure Angreifer sind jetzt getappt und wurden dem Gegner gemeldet — er darf jetzt blocken.",
    },
    detect: (ctx) =>
      ctx.action?.kind === "declareAttackers" && isPlayer1Action(ctx.action) && ctx.action.attackers.length > 0,
  },
  {
    id: "combatDamage",
    infoOnly: true,
    instruction: {
      title: "Kampfschaden",
      body:
        "Der Kampfschaden wird jetzt automatisch abgerechnet: ungeblockte Angreifer treffen den verteidigenden " +
        "Spieler direkt, geblockte Angreifer treffen stattdessen ihren Blocker (und umgekehrt).",
    },
    confirmation: { title: "", body: "" },
    detect: (ctx) => ctx.state.step === "combatDamage",
  },
  {
    id: "declareBlock",
    instruction: {
      title: "Blocken",
      body:
        "Sobald der Gegner angreift, könnt ihr blocken: eine eigene ungetappte Kreatur anklicken, dann den " +
        "Angreifer anklicken, den sie abfangen soll. Das kann ein paar Züge dauern, bis der Gegner tatsächlich " +
        "angreift — spielt bis dahin einfach normal weiter (z.B. \"Priorität passen\", wenn nichts zu tun ist).",
    },
    confirmation: {
      title: "Geblockt",
      body: "Eure Kreatur hat den Angreifer abgefangen — der Kampfschaden geht jetzt gegen sie statt gegen euer Leben.",
    },
    detect: (ctx) =>
      ctx.action?.kind === "declareBlockers" && isPlayer1Action(ctx.action) && ctx.action.blocks.length > 0,
  },
  {
    id: "winCondition",
    infoOnly: true,
    instruction: {
      title: "Sieg & Niederlage",
      body:
        "Fällt das Leben eines Spielers auf 0 (oder muss er von einem leeren Deck ziehen), verliert er sofort " +
        "die Partie. Behaltet also euer Leben (oben in der Statuszeile) im Blick.",
    },
    confirmation: { title: "", body: "" },
    detect: () => true,
  },
  {
    id: "complete",
    infoOnly: true,
    instruction: {
      title: "Bereit fürs echte Spiel!",
      body:
        "Das waren die wichtigsten Grundlagen: Terrain & Mana, Kreaturen & Beschwörungskrankheit, Zielwahl, " +
        "Schadens- und Verstärkungszauber, Angreifen & Blocken. Dieses Demo-Deck deckt bewusst nur die " +
        "Kernmechaniken ab — im vollen Kartenpool gibt es noch mehr (X-Kosten, modale Sprüche, mehrere Ziele " +
        "gleichzeitig u.v.m.). Ihr könnt diese Partie gerne zu Ende spielen oder jederzeit über \"Zurück zum " +
        "Hauptmenü\" aussteigen und ein echtes Deck bauen — alle Erklärungen bleiben über den \"? Hilfe\"-Button " +
        "weiterhin abrufbar.",
    },
    confirmation: { title: "", body: "" },
    detect: () => true,
  },
];

const STEP_INDEX_BY_ID: Record<TutorialStepId, number> = Object.fromEntries(
  TUTORIAL_STEPS.map((step, index) => [step.id, index]),
) as Record<TutorialStepId, number>;

export function tutorialStepIndexOf(id: TutorialStepId): number {
  return STEP_INDEX_BY_ID[id];
}

export function tutorialStepAt(index: number): TutorialStep | undefined {
  return TUTORIAL_STEPS[index];
}
