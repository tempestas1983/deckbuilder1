/**
 * Zonen-Mechanik: Karten zwischen Zonen bewegen, Permanent-Zustand anlegen/
 * verwerfen, Token-Sonderfall (SBA 7: Token verlässt Battlefield -> hört auf
 * zu existieren statt Zonenwechsel).
 */

import type {
  CardInstance,
  GameEvent,
  GameState,
  InstanceId,
  PlayerId,
  PlayerState,
  ZoneName,
} from "../model";
import { getDefinition } from "./card-defs";
import { nextInstanceId, nextTimestamp } from "./ids";
import { fireDeathTriggers } from "./triggers";
import type { CardPool } from "../model";

type OwnedZone = Exclude<ZoneName, "stack">;

const ZONE_ARRAYS: OwnedZone[] = ["library", "hand", "battlefield", "graveyard", "exile"];

/** Findet die aktuelle Zone einer Karte (unter den Owner-Zonen; Stack wird separat behandelt). */
export function findZone(
  state: GameState,
  instanceId: InstanceId,
): { zone: OwnedZone; player: PlayerId; index: number } | undefined {
  for (const playerId of Object.keys(state.players) as PlayerId[]) {
    const player = state.players[playerId];
    for (const zone of ZONE_ARRAYS) {
      const index = player[zone].indexOf(instanceId);
      if (index !== -1) {
        return { zone, player: playerId, index };
      }
    }
  }
  return undefined;
}

/** Entfernt eine InstanceId aus ihrer aktuellen Owner-Zone (falls vorhanden). */
function removeFromCurrentZone(state: GameState, instanceId: InstanceId): OwnedZone | undefined {
  const found = findZone(state, instanceId);
  if (!found) return undefined;
  state.players[found.player][found.zone].splice(found.index, 1);
  return found.zone;
}

/**
 * Bewegt eine Karte in eine Zielzone des angegebenen Spielers (i.d.R. der
 * Owner, "geht nach Hause"). Legt/verwirft PermanentState passend zur Zone.
 * Emittiert ein zoneChanged-Event.
 */
export function moveCard(
  state: GameState,
  events: GameEvent[],
  instanceId: InstanceId,
  toPlayer: PlayerId,
  toZone: OwnedZone,
  position: "top" | "bottom" = "bottom",
): void {
  const card = state.cards[instanceId];
  if (!card) throw new Error(`moveCard: unbekannte InstanceId ${instanceId}`);
  const from = removeFromCurrentZone(state, instanceId) ?? "stack";

  if (toZone === "battlefield") {
    card.permanentState = {
      tapped: false,
      summoningSick: true, // wird unten für Nicht-Units zurückgesetzt
      damageMarked: 0,
      counters: {},
      attachments: [],
      temporaryModifiers: [],
      timestamp: nextTimestamp(state),
    };
  } else {
    // Verlässt (oder betritt nie) das Battlefield -> Permanent-Zustand wird vergessen.
    card.permanentState = undefined;
  }

  const arr = state.players[toPlayer][toZone];
  if (position === "top") {
    arr.unshift(instanceId);
  } else {
    arr.push(instanceId);
  }

  events.push({ kind: "zoneChanged", cardInstanceId: instanceId, from, to: toZone });
}

/**
 * Sonderfall SBA 7 / "Token verlässt Battlefield": Karte wird endgültig
 * gelöscht, statt in eine Zielzone zu wandern. Nutzt kein zoneChanged-Event
 * mit "to", sondern ein eigenes Verhalten (siehe rules-engine.md 7.7).
 */
export function removeTokenPermanently(
  state: GameState,
  events: GameEvent[],
  instanceId: InstanceId,
): void {
  removeFromCurrentZone(state, instanceId);
  events.push({ kind: "zoneChanged", cardInstanceId: instanceId, from: "battlefield", to: "exile" });
  delete state.cards[instanceId];
}

/**
 * Bewegt eine Karte vom Battlefield in eine Zielzone (graveyard/hand/exile),
 * unter Beachtung der Token-Sonderregel (SBA 7). Owner-basiert ("geht nach
 * Hause"). Rückgabewert: true, wenn die Karte tatsächlich verschoben wurde
 * (false bei Token -> gelöscht statt verschoben; Tod-Trigger feuern in
 * diesem Fall trotzdem, s.u.).
 *
 * v0.3.3 (rules-engine.md 9.15, zentraler Tod-Hook): Ist `toZone ===
 * "graveyard"`, ist das per Definition ein Tod (ursachenunabhängig - SBA 3/4,
 * SBA 5/Aura, `destroyPermanent`, `sacrificeSelf`-Zusatzkosten rufen alle
 * diese Funktion auf), also feuern hier `fireDeathTriggers`. `toZone ===
 * "hand"/"exile"` ist bewusst KEIN Tod (9.15) - dort passiert nichts
 * Zusätzliches. Definition-Id/Controller werden VOR dem eigentlichen Move
 * (Token-Löschung ODER moveCard) gesnapshottet, weil `removeTokenPermanently`
 * die Instanz danach vollständig aus `state.cards` entfernt - der Hook muss
 * aber trotzdem mit den richtigen Werten feuern (analog zum Muster, das
 * `sba.ts` vor diesem Refactor selbst benutzt hat).
 */
export function leaveBattlefield(
  state: GameState,
  pool: CardPool,
  events: GameEvent[],
  instanceId: InstanceId,
  toZone: Exclude<OwnedZone, "battlefield" | "library">,
): { movedToRealZone: boolean } {
  const card = state.cards[instanceId];
  if (!card) throw new Error(`leaveBattlefield: unbekannte InstanceId ${instanceId}`);

  const dyingDefinitionId = card.definitionId;
  const dyingController = card.controller;

  // Attachment-Buchhaltung: verlässt eine angelegte Aura das Battlefield,
  // wird sie aus der attachments-Liste ihres Ziels entfernt (SBA 5 nutzt dies
  // andersherum: fehlt das Ziel selbst, wird die Aura hier entfernt).
  const attachedTo = card.permanentState?.attachedTo;
  if (attachedTo) {
    const target = state.cards[attachedTo];
    if (target?.permanentState) {
      const idx = target.permanentState.attachments.indexOf(instanceId);
      if (idx !== -1) target.permanentState.attachments.splice(idx, 1);
    }
  }
  // Umgekehrt: verlässt ein Permanent das Battlefield, an dem Auren hängen,
  // werden diese in der nächsten SBA-Runde erkannt (attachedTo zeigt dann auf
  // eine Karte ohne permanentState) und selbst entfernt - siehe sba.ts.

  const def = getDefinition(pool, card.definitionId);
  let movedToRealZone: boolean;
  if (def.isToken) {
    removeTokenPermanently(state, events, instanceId);
    movedToRealZone = false;
  } else {
    moveCard(state, events, instanceId, card.owner, toZone);
    movedToRealZone = true;
  }

  if (toZone === "graveyard") {
    fireDeathTriggers(state, pool, events, instanceId, dyingDefinitionId, dyingController);
  }

  return { movedToRealZone };
}

/**
 * Entfernt eine Karte aus ihrer Zone, weil sie (als Teil eines StackObject)
 * auf den Stack gelegt wird. Der Stack trägt keine eigene InstanceId-Liste -
 * die Karte "existiert" auf dem Stack nur über den StackObject-Verweis
 * (siehe CardInstance-Dokumentation in src/model/game-state.ts).
 */
export function moveToStack(state: GameState, events: GameEvent[], instanceId: InstanceId): void {
  const from = removeFromCurrentZone(state, instanceId) ?? "stack";
  events.push({ kind: "zoneChanged", cardInstanceId: instanceId, from, to: "stack" });
}

export function drawCard(state: GameState, events: GameEvent[], player: PlayerId): void {
  const p: PlayerState = state.players[player];
  const top = p.library[0];
  if (top === undefined) {
    p.attemptedDrawFromEmptyLibrary = true;
    return;
  }
  p.library.shift();
  p.hand.push(top);
  events.push({ kind: "cardDrawn", player, cardInstanceId: top });
}

export function createCardInstance(
  state: GameState,
  definitionId: string,
  owner: PlayerId,
): CardInstance {
  const instanceId = nextInstanceId(state);
  const inst: CardInstance = {
    instanceId,
    definitionId,
    owner,
    controller: owner,
  };
  state.cards[instanceId] = inst;
  return inst;
}
