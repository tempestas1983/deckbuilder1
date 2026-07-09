/**
 * Getriggerte Fähigkeiten: Ereignis -> Pending-Queue -> (beim nächsten
 * Priority-Zeitpunkt) APNAP-Reihenfolge auf den Stack (rules-engine.md 5).
 *
 * v0.2 (rules-engine.md 5 + 9.7): Braucht ein Trigger beim Stacken Ziele,
 * gilt:
 * - genau eine legale Zielbelegung -> automatisch wählen (Komfort-Abkürzung,
 *   liefert dasselbe Ergebnis wie eine Nachfrage);
 * - keine legale Belegung -> Trigger verpufft (wird nicht gestackt);
 * - mehr als eine legale Belegung (mind. ein Slot mehrdeutig) ->
 *   `GameState.pendingDecision = { kind: "chooseTriggerTargets", ... }` wird
 *   gesetzt, das Stacken PAUSIERT (kein weiterer Trigger wird verarbeitet,
 *   keine Priority-Vergabe), bis der Controller mit `resolveDecision`
 *   geantwortet hat (siehe actions.ts). Der frühere v0.1-Auto-Pick ("erstes
 *   legales Ziel" bei jeder Mehrdeutigkeit) ist damit abgelöst.
 */

import type {
  Ability,
  CardPool,
  ChosenTarget,
  ControllerFilter,
  EffectMode,
  GameEvent,
  GameState,
  InstanceId,
  PendingDecision,
  PendingTrigger,
  PlayerId,
  StackObject,
  TriggerCondition,
} from "../model";
import { getDefinition, getDefinitionForInstance } from "./card-defs";
import { nextStackObjectId } from "./ids";
import { enumerateLegalTargets } from "./targets";
import { selectableModeIndices } from "./modal";

function matchesControllerFilter(filter: ControllerFilter, self: PlayerId, other: PlayerId): boolean {
  if (filter === "any") return true;
  if (filter === "own") return self === other;
  return self !== other;
}

export function queueTrigger(
  state: GameState,
  pool: CardPool,
  sourceInstanceId: InstanceId,
  abilityIndex: number,
  condition: TriggerCondition,
  eventSubject?: InstanceId | PlayerId,
): void {
  const card = state.cards[sourceInstanceId];
  if (!card) return;
  const pending: PendingTrigger = {
    sourceInstanceId,
    abilityIndex,
    controller: card.controller,
    condition,
    eventSubject,
    sourceTimestamp: card.permanentState?.timestamp ?? -1,
  };
  state.pendingTriggers.push(pending);
}

function forEachTriggeredAbility(
  state: GameState,
  pool: CardPool,
  instanceId: InstanceId,
  callback: (abilityIndex: number, trigger: TriggerCondition) => void,
): void {
  const card = state.cards[instanceId];
  if (!card) return;
  const def = getDefinition(pool, card.definitionId);
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  abilities.forEach((ability, index) => {
    if (ability.kind === "triggered") callback(index, ability.trigger);
  });
}

export function fireEnterBattlefieldTriggers(
  state: GameState,
  pool: CardPool,
  instanceId: InstanceId,
): void {
  forEachTriggeredAbility(state, pool, instanceId, (index, trigger) => {
    if (trigger.kind === "onEnterBattlefield" && trigger.what === "self") {
      queueTrigger(state, pool, instanceId, index, trigger);
    }
  });
}

/**
 * Feuert Tod-bezogene Trigger, NACHDEM die Unit das Battlefield bereits
 * verlassen hat (permanentState ist weg, aber die CardInstance kann noch
 * existieren [Graveyard] oder ganz gelöscht sein [Token, SBA 7] - deshalb
 * `dyingDefinitionId`/`dyingController` separat statt erneutem State-Lookup).
 */
export function fireDeathTriggers(
  state: GameState,
  pool: CardPool,
  dyingInstanceId: InstanceId,
  dyingDefinitionId: string,
  dyingController: PlayerId,
): void {
  const def = getDefinition(pool, dyingDefinitionId);
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  abilities.forEach((ability, index) => {
    if (ability.kind === "triggered" && ability.trigger.kind === "onDeath" && ability.trigger.what === "self") {
      queueTrigger(state, pool, dyingInstanceId, index, ability.trigger, dyingInstanceId);
    }
  });

  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    for (const instanceId of state.players[playerId].battlefield) {
      forEachTriggeredAbility(state, pool, instanceId, (index, trigger) => {
        if (trigger.kind === "onUnitDied" && matchesControllerFilter(trigger.controller, playerId, dyingController)) {
          queueTrigger(state, pool, instanceId, index, trigger, dyingInstanceId);
        }
      });
    }
  }
}

export function fireUpkeepOrEndStepTriggers(
  state: GameState,
  pool: CardPool,
  kind: "onUpkeep" | "onEndStep",
  activePlayer: PlayerId,
): void {
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    for (const instanceId of state.players[playerId].battlefield) {
      forEachTriggeredAbility(state, pool, instanceId, (index, trigger) => {
        if (trigger.kind === kind) {
          const whoseTurn = trigger.whoseTurn;
          if (whoseTurn === "any" || (whoseTurn === "own" && playerId === activePlayer)) {
            queueTrigger(state, pool, instanceId, index, trigger);
          }
        }
      });
    }
  }
}

export function fireSelfCombatTrigger(
  state: GameState,
  pool: CardPool,
  instanceId: InstanceId,
  kind: "onAttackDeclared" | "onBlockDeclared" | "onDealtCombatDamageToPlayer",
): void {
  forEachTriggeredAbility(state, pool, instanceId, (index, trigger) => {
    if (trigger.kind === kind && trigger.what === "self") {
      queueTrigger(state, pool, instanceId, index, trigger, instanceId);
    }
  });
}

/**
 * `onDamageReceived` (v0.3 verdrahtet, rules-engine.md 5 + Entscheidung 9.10):
 * feuert für `targetInstanceId` (das Permanent, das gerade Schaden > 0
 * erhalten hat - der Aufrufer, `damage.ts#applyDamageToPermanent`, garantiert
 * amount > 0 bereits). Abweichend von `fireSelfCombatTrigger` ist
 * `eventSubject` NICHT die Quelle der Fähigkeit selbst, sondern die
 * SCHADENSQUELLE (`sourceInstanceId`) - ermöglicht Vergeltungs-Designs über
 * `EffectRecipient "eventSubject"` (9.10 Punkt 3). Deshalb eine eigene
 * Feuerfunktion statt eines zusätzlichen Parameters an `fireSelfCombatTrigger`.
 */
export function fireOnDamageReceivedTrigger(
  state: GameState,
  pool: CardPool,
  targetInstanceId: InstanceId,
  sourceInstanceId: InstanceId,
): void {
  forEachTriggeredAbility(state, pool, targetInstanceId, (index, trigger) => {
    if (trigger.kind === "onDamageReceived" && trigger.what === "self") {
      queueTrigger(state, pool, targetInstanceId, index, trigger, sourceInstanceId);
    }
  });
}

export function fireSpellCastTriggers(
  state: GameState,
  pool: CardPool,
  caster: PlayerId,
  /** undefined = keine Spell-Speed (z.B. gecastete Unit/Relic/Enchantment ohne "speed"-Feld). */
  spellSpeed: "fast" | "slow" | undefined,
): void {
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    for (const instanceId of state.players[playerId].battlefield) {
      forEachTriggeredAbility(state, pool, instanceId, (index, trigger) => {
        if (
          trigger.kind === "onSpellCast" &&
          matchesControllerFilter(trigger.caster, playerId, caster) &&
          (trigger.spellSpeed === undefined || trigger.spellSpeed === spellSpeed)
        ) {
          queueTrigger(state, pool, instanceId, index, trigger);
        }
      });
    }
  }
}

/**
 * Legt wartende Trigger in APNAP-Reihenfolge auf den Stack (aktiver Spieler
 * zuerst gelegt -> landet unten -> nicht-aktiver Spieler resolvt zuerst,
 * siehe rules-engine.md Abschnitt 5). Bricht ab (lässt den Rest in
 * `pendingTriggers` liegen), sobald ein Trigger eine PendingDecision braucht
 * (rules-engine.md 9.7) - der nächste Aufruf (nach `resolveDecision`) setzt
 * an der gleichen Stelle fort.
 * Innerhalb eines Spielers: deterministisch nach sourceTimestamp (v0.1-
 * Vereinfachung statt Spielerwahl, siehe rules-engine.md 9.2).
 */
export function flushPendingTriggersToStack(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
): void {
  if (state.pendingTriggers.length === 0 || state.pendingDecision !== undefined) return;

  const active = state.pendingTriggers
    .filter((t) => t.controller === state.activePlayer)
    .sort((a, b) => a.sourceTimestamp - b.sourceTimestamp);
  const nonActive = state.pendingTriggers
    .filter((t) => t.controller !== state.activePlayer)
    .sort((a, b) => a.sourceTimestamp - b.sourceTimestamp);
  const ordered = [...active, ...nonActive];

  for (const trigger of ordered) {
    const idx = state.pendingTriggers.indexOf(trigger);
    if (idx !== -1) state.pendingTriggers.splice(idx, 1);

    const outcome = stackOrDeferTrigger(state, pool, events, trigger);
    if (outcome === "awaitingDecision") {
      // Rest von `ordered` bleibt unverarbeitet in state.pendingTriggers -
      // wird beim nächsten Flush (nach resolveDecision) fortgesetzt.
      return;
    }
  }
}

function buildTriggerStackObject(
  trigger: PendingTrigger,
  chosenTargets: ChosenTarget[],
  chosenMode: number | undefined,
): Omit<Extract<StackObject, { kind: "triggeredAbility" }>, "id"> {
  return {
    kind: "triggeredAbility",
    sourceInstanceId: trigger.sourceInstanceId,
    abilityIndex: trigger.abilityIndex,
    controller: trigger.controller,
    chosenTargets,
    eventSubject: trigger.eventSubject,
    chosenMode,
  };
}

/** Legt einen bereits konkret ausgewählten Trigger auf den Stack (Auto-Pick ODER nach resolveDecision). */
export function pushResolvedTriggerToStack(
  state: GameState,
  events: GameEvent[],
  trigger: Pick<PendingTrigger, "sourceInstanceId" | "abilityIndex" | "controller" | "eventSubject">,
  chosenTargets: ChosenTarget[],
  /** v0.3 (Modal-Trigger, rules-engine.md 4 + 9.13): Index in TriggeredAbility.modes, falls modal. */
  chosenMode?: number,
): void {
  const stackObjectId = nextStackObjectId(state);
  const obj: StackObject = {
    id: stackObjectId,
    ...buildTriggerStackObject(trigger as PendingTrigger, chosenTargets, chosenMode),
  };
  state.stack.push(obj);
  events.push({ kind: "triggerFired", sourceInstanceId: trigger.sourceInstanceId, abilityIndex: trigger.abilityIndex });
}

function stackOrDeferTrigger(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  trigger: PendingTrigger,
): "stacked" | "fizzled" | "awaitingDecision" {
  // v0.3 (rules-engine.md 5 + 9.10 Punkt 4): Die Quelle kann durch SBA 7
  // (Token verlässt das Battlefield) inzwischen vollständig gelöscht sein -
  // dann ist kein Definitions-Lookup mehr möglich; der Trigger verpufft
  // (dokumentierte Vereinfachung statt eines Crashes).
  if (!state.cards[trigger.sourceInstanceId]) return "fizzled";

  const def = getDefinitionForInstance(pool, state, trigger.sourceInstanceId);
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  const ability = abilities[trigger.abilityIndex];
  if (!ability || ability.kind !== "triggered") return "fizzled";

  if (ability.modes && ability.modes.length > 0) {
    return stackOrDeferModalTrigger(state, pool, events, trigger, ability.modes);
  }

  const specs = ability.targets ?? [];
  if (specs.length === 0) {
    pushResolvedTriggerToStack(state, events, trigger, []);
    return "stacked";
  }

  const optionsPerSlot = specs.map((spec) => enumerateLegalTargets(state, pool, spec, trigger.controller));
  if (optionsPerSlot.some((opts) => opts.length === 0)) {
    // Kein legales Ziel für mind. einen Slot -> Trigger verpufft (analog "kein legales Ziel beim Ansagen").
    return "fizzled";
  }
  if (optionsPerSlot.every((opts) => opts.length === 1)) {
    // Genau eine legale Belegung je Slot -> Komfort-Abkürzung ohne Nachfrage (rules-engine.md 5).
    const chosenTargets = optionsPerSlot.map((opts) => opts[0]!);
    pushResolvedTriggerToStack(state, events, trigger, chosenTargets);
    return "stacked";
  }

  // Mindestens ein Slot ist mehrdeutig -> Spielerentscheidung einholen (9.7).
  state.pendingDecision = {
    kind: "chooseTriggerTargets",
    player: trigger.controller,
    sourceInstanceId: trigger.sourceInstanceId,
    abilityIndex: trigger.abilityIndex,
    eventSubject: trigger.eventSubject,
  };
  events.push({ kind: "decisionRequired", player: trigger.controller, decisionKind: "chooseTriggerTargets" });
  return "awaitingDecision";
}

type TriggerRef = Pick<PendingTrigger, "sourceInstanceId" | "abilityIndex" | "controller" | "eventSubject">;

/**
 * Modus-Wahl für einen modalen Trigger (rules-engine.md 4 + 9.13): kein
 * wählbarer Modus -> Trigger verpufft; genau ein wählbarer Modus ->
 * Komfort-Auto-Pick (analog Zielwahl); mehrere wählbare Modi ->
 * PendingDecision "chooseMode".
 */
function stackOrDeferModalTrigger(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  trigger: TriggerRef,
  modes: EffectMode[],
): "stacked" | "fizzled" | "awaitingDecision" {
  const selectable = selectableModeIndices(state, pool, modes, trigger.controller);
  if (selectable.length === 0) return "fizzled";
  if (selectable.length === 1) {
    return stackModalTriggerWithMode(state, pool, events, trigger, modes, selectable[0]!);
  }
  state.pendingDecision = {
    kind: "chooseMode",
    player: trigger.controller,
    sourceInstanceId: trigger.sourceInstanceId,
    abilityIndex: trigger.abilityIndex,
    eventSubject: trigger.eventSubject,
    selectableModes: selectable,
  };
  events.push({ kind: "decisionRequired", player: trigger.controller, decisionKind: "chooseMode" });
  return "awaitingDecision";
}

/**
 * Wählt die Ziele für einen BEREITS feststehenden Modus (Auto-Pick oder nach
 * der "chooseMode"-Decision) und legt den Trigger bei Erfolg auf den Stack.
 *
 * v0.3.1 (rules-engine.md 9.13, Nachtrag - Architect-Entscheidung zum zuvor
 * gemeldeten Modellkonflikt): Ist die Zielwahl für den gewählten Modus selbst
 * mehrdeutig (mind. ein Slot mit > 1 legaler Option), wird die volle
 * MTG-analoge Ketten-Decision aufgebaut - `pendingDecision = {
 * kind: "chooseTriggerTargets", ..., chosenMode: modeIndex }`. Das additive
 * Feld `chosenMode` an `PendingDecision "chooseTriggerTargets"` persistiert
 * den bereits gewählten Modus über den zweiten `resolveDecision`-Roundtrip
 * hinweg; beim Auflösen liest `actions.ts` `decision.chosenMode` (NICHT die
 * Spieler-Antwort - dort gibt es bewusst kein Gegenstück) und übernimmt ihn
 * unverändert als `StackObject.chosenMode`. Der frühere Interims-Auto-Pick
 * ("erstes legales Ziel" bei modus-interner Mehrdeutigkeit) ist damit
 * abgelöst - Auto-Pick bleibt weiterhin die Komfort-Abkürzung für den Fall
 * "genau eine legale Belegung je Slot" (identisch zu nicht-modalen Triggern).
 */
function stackModalTriggerWithMode(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  trigger: TriggerRef,
  modes: EffectMode[],
  modeIndex: number,
): "stacked" | "fizzled" | "awaitingDecision" {
  const mode = modes[modeIndex];
  if (!mode) return "fizzled";
  const specs = mode.targets ?? [];
  if (specs.length === 0) {
    pushResolvedTriggerToStack(state, events, trigger, [], modeIndex);
    return "stacked";
  }
  const optionsPerSlot = specs.map((spec) => enumerateLegalTargets(state, pool, spec, trigger.controller));
  if (optionsPerSlot.some((opts) => opts.length === 0)) {
    // Kein legales Ziel für mind. einen Slot -> Trigger verpufft (analog "kein legales Ziel beim Ansagen").
    return "fizzled";
  }
  if (optionsPerSlot.every((opts) => opts.length === 1)) {
    // Genau eine legale Belegung je Slot -> Komfort-Abkürzung ohne Nachfrage (rules-engine.md 5).
    const chosenTargets = optionsPerSlot.map((opts) => opts[0]!);
    pushResolvedTriggerToStack(state, events, trigger, chosenTargets, modeIndex);
    return "stacked";
  }

  // Mindestens ein Slot ist mehrdeutig -> Ketten-Decision MIT dem bereits
  // gewählten Modus (v0.3.1, s. Doku-Block oben).
  state.pendingDecision = {
    kind: "chooseTriggerTargets",
    player: trigger.controller,
    sourceInstanceId: trigger.sourceInstanceId,
    abilityIndex: trigger.abilityIndex,
    eventSubject: trigger.eventSubject,
    chosenMode: modeIndex,
  };
  events.push({ kind: "decisionRequired", player: trigger.controller, decisionKind: "chooseTriggerTargets" });
  return "awaitingDecision";
}

/**
 * Wird von `actions.ts#perform` nach `resolveDecision` mit `kind: "chooseMode"`
 * aufgerufen, um den gewählten Modus eines Triggers weiterzuverarbeiten.
 * Rückgabewert signalisiert dem Aufrufer, ob direkt fortgefahren werden darf
 * (`"stacked"`/`"fizzled"`) oder ob `stackModalTriggerWithMode` bereits eine
 * Ketten-Decision "chooseTriggerTargets" gesetzt hat (`"awaitingDecision"` -
 * dann darf `actions.ts` `state.pendingDecision` NICHT überschreiben/leeren).
 */
export function resolveChosenModeForTrigger(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  decision: Extract<PendingDecision, { kind: "chooseMode" }>,
  modeIndex: number,
): "stacked" | "fizzled" | "awaitingDecision" {
  const def = getDefinitionForInstance(pool, state, decision.sourceInstanceId);
  const abilities = "abilities" in def ? def.abilities ?? [] : [];
  const ability = abilities[decision.abilityIndex] as Extract<Ability, { kind: "triggered" }> | undefined;
  if (!ability || ability.kind !== "triggered" || !ability.modes) return "fizzled"; // durch Validierung bereits ausgeschlossen
  return stackModalTriggerWithMode(
    state,
    pool,
    events,
    {
      sourceInstanceId: decision.sourceInstanceId,
      abilityIndex: decision.abilityIndex,
      controller: decision.player,
      eventSubject: decision.eventSubject,
    },
    ability.modes,
    modeIndex,
  );
}
