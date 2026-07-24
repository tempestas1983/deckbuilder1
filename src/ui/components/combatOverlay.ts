/**
 * Fokussierte Blocker-Zuordnung ("Angriff abwehren").
 *
 * Spielerbericht 2026-07-24 (erste echte Partie): "Die Blocker zu bestimmen
 * ist richtig schwer. Cool und mitreißend wäre, wenn beim Blocken die
 * angreifende Schar in einem hervorgehobenen Fenster gezeigt wird (der Rest
 * leicht ausgeblendet im Hintergrund) und man seine Verteidiger wirklich in
 * Position ZIEHEN kann."
 *
 * Warum das vorher schwer war: Angreifer und Verteidiger standen in zwei
 * verschiedenen Battlefield-Reihen, verstreut zwischen Terrains, Relikten und
 * allem anderen. Ein Block war "erst die eigene Einheit anklicken, dann den
 * Angreifer anklicken" - zwei Klicks quer über den Bildschirm, ohne dass
 * irgendwo sichtbar wurde, welches Paar dabei entsteht. Die einzige
 * Rückmeldung war eine Textzeile ("X blockt Y") im Banner.
 *
 * Diese Ansicht holt genau die am Kampf beteiligten Karten aus dem Board
 * heraus: pro Angreifer ein eigener Ablageplatz, darunter die eigenen
 * Einheiten. Ein Verteidiger wird auf den Angreifer gezogen, den er aufhalten
 * soll - die Zuordnung ist danach als Stapel unter dem Angreifer sichtbar.
 *
 * WICHTIG - der Klickweg bleibt vollständig erhalten (Verteidiger anklicken,
 * dann Angreifer anklicken): HTML5-Drag&Drop gibt es auf Touch-Geräten nicht,
 * und Ziehen ist auch mit Maus nicht für jeden die angenehmste Bedienung. Die
 * beiden Wege teilen sich dieselbe Hervorhebung, sind also kein doppeltes
 * Bedienkonzept, sondern zwei Eingaben für dieselbe Sache.
 *
 * KEINE Regellogik hier drin (Rollen-Vertrag, s. render.ts-Kopf): welcher
 * Verteidiger welchen Angreifer aufhalten darf, kommt fertig von
 * getLegalActions (s. `legalAttackersByBlocker` unten) - diese Datei zeichnet
 * das Ergebnis nur, und applyAction validiert am Ende ohnehin die komplette
 * Kombination.
 */

import type { CardPool, GameState, InstanceId, PlayerAction } from "../../model";
import { cardDef } from "../cardInfo";
import { cardTile } from "./cardTile";
import { h, text } from "../h";

export interface BlockLegality {
  /** Je Verteidiger die Angreifer, die er laut Engine blocken darf. */
  legalAttackersByBlocker: Map<InstanceId, Set<InstanceId>>;
  /** Bietet die Engine "gar nicht blocken" an (= keine guardian-Blockpflicht)? */
  noBlocksOffered: boolean;
}

/**
 * Übersetzt die `declareBlockers`-Kandidaten von getLegalActions in die Form,
 * die diese Ansicht braucht. Reine Umformung - hier wird KEINE Regel
 * ausgewertet, nur umsortiert, was die Engine ohnehin schon gesagt hat.
 *
 * Die beiden Ergebnisse hängen zusammen (s. legal-actions.ts#combatCandidates):
 * die Engine bietet `blocks: []` genau dann an, wenn keine guardian-Blockpflicht
 * besteht - und genau dann enumeriert sie auch für JEDEN Verteidiger alle
 * erlaubten Angreifer. Besteht eine Pflicht, fehlen Einzelpaare teilweise
 * (genau eine Pflicht) oder ganz (mehrere), weil ein einzelnes Paar dann nie
 * für sich allein legal ist. `noBlocksOffered` ist deshalb auch das Signal
 * dafür, ob die Paar-Liste als vollständig gelesen werden darf.
 */
export function blockLegalityFromActions(actions: readonly PlayerAction[]): BlockLegality {
  const legalAttackersByBlocker = new Map<InstanceId, Set<InstanceId>>();
  let noBlocksOffered = false;
  for (const action of actions) {
    if (action.kind !== "declareBlockers") continue;
    if (action.blocks.length === 0) {
      noBlocksOffered = true;
      continue;
    }
    for (const { blocker, attacker } of action.blocks) {
      const set = legalAttackersByBlocker.get(blocker) ?? new Set<InstanceId>();
      set.add(attacker);
      legalAttackersByBlocker.set(blocker, set);
    }
  }
  return { legalAttackersByBlocker, noBlocksOffered };
}

export interface CombatOverlayOptions {
  /** Angreifende Einheiten, in Board-Reihenfolge. */
  attackers: InstanceId[];
  /** Eigene Einheiten, die als Blocker in Frage kommen (inkl. bereits zugeordneter). */
  defenders: InstanceId[];
  pairs: Array<{ blocker: InstanceId; attacker: InstanceId }>;
  /** Per Klick vorgemerkter Verteidiger (Klickweg), s. UiMode.declaringBlockers. */
  selectedBlocker?: InstanceId;
  /**
   * Je Verteidiger die Angreifer, die er laut Engine blocken DARF - direkt aus
   * den `declareBlockers`-Kandidaten von getLegalActions abgeleitet, nicht hier
   * berechnet (s. render.ts#legalBlockMap).
   *
   * Ein Verteidiger, der hier GAR NICHT auftaucht, ist bewusst NICHT als
   * "kann nicht blocken" zu lesen: die Engine enumeriert bei bestehender
   * guardian-Blockpflicht absichtlich keine Einzelpaare (s.
   * legal-actions.ts#combatCandidates). Nur zusammen mit `noBlocksOffered`
   * (s.u.) ist das Fehlen aussagekräftig.
   */
  legalAttackersByBlocker: Map<InstanceId, Set<InstanceId>>;
  /**
   * Bietet die Engine "gar nicht blocken" an? Sie tut das exakt dann, wenn
   * KEINE guardian-Blockpflicht besteht (legal-actions.ts#combatCandidates) -
   * und genau dann ist `legalAttackersByBlocker` für jeden Verteidiger
   * vollständig. Nur in diesem Fall darf die Ansicht einen Verteidiger als
   * "kann diesen Angreifer nicht aufhalten" sperren; sonst bleibt sie
   * durchlässig und lässt die Engine entscheiden.
   */
  noBlocksOffered: boolean;
  onSelectBlocker: (blocker: InstanceId | undefined) => void;
  onAssign: (blocker: InstanceId, attacker: InstanceId) => void;
  onRemove: (blocker: InstanceId) => void;
  onConfirm: () => void;
  onNone: () => void;
}

/**
 * Aktuell gezogener Verteidiger. Modul-Zustand statt `dataTransfer`, weil (a)
 * `dataTransfer` in jsdom nicht existiert, die Ablage-Logik damit also
 * testbar bleibt, und (b) `dragover` in echten Browsern die Daten aus
 * Sicherheitsgründen ohnehin nicht auslesen darf - für das Hervorheben
 * während des Ziehens bräuchte es diesen Zustand also so oder so.
 *
 * Ein Zug ist eine kurzlebige Geste ohne Store-Änderung: zwischen `dragstart`
 * und `drop` baut render() das DOM nicht neu, der Wert überlebt die Geste
 * also zuverlässig. `dataTransfer` wird zusätzlich befüllt, damit echte
 * Browser ein Drag-Bild zeigen und den Zug überhaupt starten.
 */
let draggedBlocker: InstanceId | undefined;

export function combatOverlay(state: GameState, pool: CardPool, opts: CombatOverlayOptions): HTMLElement {
  const blockersByAttacker = new Map<InstanceId, InstanceId[]>();
  for (const pair of opts.pairs) {
    blockersByAttacker.set(pair.attacker, [...(blockersByAttacker.get(pair.attacker) ?? []), pair.blocker]);
  }
  const pairedBlockers = new Set(opts.pairs.map((p) => p.blocker));

  /**
   * Darf `blocker` auf `attacker` abgelegt werden? Siehe
   * `legalAttackersByBlocker`/`noBlocksOffered`: nur wenn die Engine für
   * diesen Verteidiger überhaupt etwas enumeriert hat (oder es gar keine
   * Enumeration gibt), wird gesperrt - im Zweifel durchlassen und die Engine
   * entscheiden lassen.
   */
  const canBlock = (blocker: InstanceId, attacker: InstanceId): boolean => {
    const allowed = opts.legalAttackersByBlocker.get(blocker);
    if (allowed) return allowed.has(attacker);
    return !opts.noBlocksOffered;
  };

  /** Verteidiger, der laut Engine gar keinen der Angreifer aufhalten kann. */
  const isUseless = (blocker: InstanceId): boolean =>
    opts.noBlocksOffered && !opts.legalAttackersByBlocker.has(blocker);

  // Alle Ablageplätze einmal einsammeln, damit `dragstart` sie ohne
  // Neu-Rendern direkt einfärben kann (s. Kommentar bei `draggedBlocker`).
  const slotNodes: Array<{ attacker: InstanceId; node: HTMLElement }> = [];

  const highlightFor = (blocker: InstanceId | undefined): void => {
    for (const { attacker, node } of slotNodes) {
      node.classList.remove("combat-slot-ok", "combat-slot-blocked", "combat-slot-hover");
      if (!blocker) continue;
      node.classList.add(canBlock(blocker, attacker) ? "combat-slot-ok" : "combat-slot-blocked");
    }
  };

  const attackerSlots = opts.attackers.map((attackerId) => {
    const assigned = blockersByAttacker.get(attackerId) ?? [];

    const assignedNodes = assigned.map((blockerId) =>
      h("div", { class: "combat-assigned" }, [
        cardTile(state, pool, blockerId),
        h(
          "button",
          {
            class: "btn btn-cancel btn-small combat-remove-btn",
            type: "button",
            title: `„${cardDef(pool, state, blockerId).name}“ wieder aus dem Kampf nehmen.`,
            onclick: (ev: Event) => {
              ev.stopPropagation();
              opts.onRemove(blockerId);
            },
          },
          [text("×")],
        ),
      ]),
    );

    const slot = h(
      "div",
      {
        class: `combat-attacker-slot${assigned.length > 0 ? " combat-attacker-slot-blocked" : ""}`,
        "data-attacker": attackerId,
        // Klickweg: mit vorgemerktem Verteidiger ordnet ein Klick auf den
        // Angreifer zu - identisch zum bisherigen Zwei-Klick-Ablauf.
        onclick: () => {
          const blocker = opts.selectedBlocker;
          if (!blocker) return;
          if (!canBlock(blocker, attackerId)) return;
          opts.onAssign(blocker, attackerId);
        },
        ondragover: (ev: Event) => {
          if (!draggedBlocker || !canBlock(draggedBlocker, attackerId)) return;
          // Ohne preventDefault lehnt der Browser die Ablage ab (HTML5-DnD).
          ev.preventDefault();
          slot.classList.add("combat-slot-hover");
        },
        ondragleave: () => slot.classList.remove("combat-slot-hover"),
        ondrop: (ev: Event) => {
          ev.preventDefault();
          slot.classList.remove("combat-slot-hover");
          const blocker = draggedBlocker;
          draggedBlocker = undefined;
          if (!blocker || !canBlock(blocker, attackerId)) return;
          opts.onAssign(blocker, attackerId);
        },
      },
      [
        h("div", { class: "combat-slot-attacker" }, [cardTile(state, pool, attackerId)]),
        h("div", { class: "combat-slot-blockers" }, [
          ...assignedNodes,
          assigned.length === 0
            ? h("div", { class: "combat-slot-empty" }, [text("Verteidiger hierher ziehen")])
            : undefined,
        ]),
      ],
    );
    slotNodes.push({ attacker: attackerId, node: slot });
    return slot;
  });

  // Vorauswahl aus dem Klickweg sofort sichtbar machen (dieselbe Optik wie
  // während eines Zuges - ein Bedienkonzept, zwei Eingabearten).
  highlightFor(opts.selectedBlocker);

  const defenderNodes = opts.defenders.map((blockerId) => {
    const used = pairedBlockers.has(blockerId);
    const useless = !used && isUseless(blockerId);
    const selected = opts.selectedBlocker === blockerId;
    const draggable = !used && !useless;

    const classes = ["combat-defender"];
    if (used) classes.push("combat-defender-used");
    if (useless) classes.push("combat-defender-useless");
    if (selected) classes.push("combat-defender-selected");

    const name = cardDef(pool, state, blockerId).name;
    return h(
      "div",
      {
        class: classes.join(" "),
        // Ausdrücklich "true"/"false" als STRING: `draggable` ist ein
        // aufgezähltes HTML-Attribut, ein leerer Wert (den h() für `true`
        // setzen würde) ist ungültig und fällt auf "nicht ziehbar" zurück.
        draggable: draggable ? "true" : "false",
        "data-blocker": blockerId,
        title: used
          ? `„${name}“ blockt bereits - über das × am Angreifer wieder herausnehmen.`
          : useless
            ? `„${name}“ kann keinen der Angreifer aufhalten.`
            : `„${name}“ auf einen Angreifer ziehen - oder anklicken und dann den Angreifer anklicken.`,
        onclick: () => {
          if (used || useless) return;
          opts.onSelectBlocker(selected ? undefined : blockerId);
        },
        ondragstart: (ev: Event) => {
          if (!draggable) return;
          draggedBlocker = blockerId;
          (ev as DragEvent).dataTransfer?.setData("text/plain", blockerId);
          highlightFor(blockerId);
        },
        ondragend: () => {
          draggedBlocker = undefined;
          highlightFor(opts.selectedBlocker);
        },
      },
      [cardTile(state, pool, blockerId)],
    );
  });

  const assignedCount = opts.pairs.length;
  const unblocked = opts.attackers.length - blockersByAttacker.size;

  return h("div", { class: "combat-overlay" }, [
    h("div", { class: "combat-focus" }, [
      h("div", { class: "combat-focus-head" }, [
        h("div", { class: "combat-focus-title" }, [text("Angriff abwehren")]),
        h("div", { class: "combat-focus-sub" }, [
          text(
            `${opts.attackers.length} ${opts.attackers.length === 1 ? "Angreifer" : "Angreifer"} · ` +
              `${assignedCount} ${assignedCount === 1 ? "Block" : "Blocks"} zugeordnet · ` +
              `${unblocked} ungeblockt`,
          ),
        ]),
      ]),
      h("div", { class: "combat-attacker-row" }, attackerSlots),
      h("div", { class: "combat-defender-head" }, [
        text(
          defenderNodes.length > 0
            ? "Deine Einheiten - auf einen Angreifer ziehen (oder anklicken, dann den Angreifer anklicken)"
            : "Du hast keine Einheiten, die blocken könnten.",
        ),
      ]),
      h("div", { class: "combat-defender-row" }, defenderNodes),
      h("div", { class: "combat-focus-actions" }, [
        h("button", { class: "btn btn-play combat-confirm-btn", type: "button", onclick: opts.onConfirm }, [
          text(assignedCount > 0 ? `Blocks bestätigen (${assignedCount})` : "Ohne Block weiter"),
        ]),
        // "Keine Blocker" bietet die Engine nur ohne guardian-Blockpflicht an
        // (s. noBlocksOffered) - mit Pflicht wäre der Klick sicher ein Fehler,
        // also gar nicht erst als Ausweg anbieten.
        opts.noBlocksOffered
          ? h("button", { class: "btn btn-cancel combat-none-btn", type: "button", onclick: opts.onNone }, [
              text("Keine Blocker"),
            ])
          : h("div", { class: "combat-focus-forced" }, [
              text("Ein Wächter muss blocken - „keine Blocker“ ist hier nicht möglich."),
            ]),
      ]),
    ]),
  ]);
}
