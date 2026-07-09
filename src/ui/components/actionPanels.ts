/**
 * Steuer-Panels für die verschiedenen Interaktionsmodi: Ziel-Banner
 * (Targeting/PendingDecision), X-Kosten-Eingabe, Combat-Deklaration
 * (Angreifer/Blocker), Cleanup-Abwurf. Reine Darstellung + Callbacks - die
 * eigentliche Aktion wird immer über store.dispatch (also applyAction)
 * ausgelöst.
 */

import type { EffectMode } from "../../model";
import { h, text } from "../h";

export function targetingBanner(title: string, onCancel?: () => void): HTMLElement {
  return h("div", { class: "action-banner" }, [
    h("span", {}, [text(title)]),
    onCancel ? h("button", { class: "btn btn-cancel", onclick: onCancel }, [text("Abbrechen")]) : undefined,
  ]);
}

export function xInputPanel(
  cardName: string,
  onConfirm: (x: number) => void,
  onCancel: () => void,
): HTMLElement {
  let current = 0;
  const input = h("input", {
    type: "number",
    min: "0",
    value: "0",
    class: "x-input",
    oninput: (ev: Event) => {
      const v = Number((ev.target as HTMLInputElement).value);
      current = Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
    },
  }) as HTMLInputElement;

  return h("div", { class: "action-banner x-input-panel" }, [
    h("span", {}, [text(`X für „${cardName}“ wählen:`)]),
    input,
    h("button", { class: "btn btn-play", onclick: () => onConfirm(current) }, [text("Weiter")]),
    h("button", { class: "btn btn-cancel", onclick: onCancel }, [text("Abbrechen")]),
  ]);
}

export function attackersPanel(
  selectedCount: number,
  onConfirm: () => void,
  onNone: () => void,
): HTMLElement {
  return h("div", { class: "action-banner" }, [
    h("span", {}, [text(`Angreifer wählen (${selectedCount} ausgewählt) - eigene Einheiten anklicken.`)]),
    h("button", { class: "btn btn-play", onclick: onConfirm }, [text("Angriff erklären")]),
    h("button", { class: "btn btn-cancel", onclick: onNone }, [text("Keine Angreifer")]),
  ]);
}

export function blockersPanel(
  pairs: Array<{ blocker: string; attacker: string }>,
  labelFor: (instanceId: string) => string,
  onRemove: (blocker: string) => void,
  onConfirm: () => void,
  onNone: () => void,
): HTMLElement {
  const pairList = pairs.map((p) =>
    h("div", { class: "block-pair" }, [
      text(`${labelFor(p.blocker)} blockt ${labelFor(p.attacker)}`),
      h("button", { class: "btn btn-cancel btn-small", onclick: () => onRemove(p.blocker) }, [text("×")]),
    ]),
  );
  return h("div", { class: "action-banner combat-panel" }, [
    h("span", {}, [text("Blocker zuordnen: erst eigene Einheit, dann Angreifer anklicken.")]),
    h("div", { class: "block-pair-list" }, pairList),
    h("button", { class: "btn btn-play", onclick: onConfirm }, [text("Blocks bestätigen")]),
    h("button", { class: "btn btn-cancel", onclick: onNone }, [text("Keine Blocker")]),
  ]);
}

/**
 * orderBlockers-PendingDecision (rules-engine.md 6d(1)): pro mehrfach
 * geblocktem Angreifer eine Blocker-Liste mit hoch/runter-Buttons statt
 * Drag&Drop - Index 0 wird zuerst mit Schaden bedient. `onMove` bekommt den
 * Index des Angreifers (Position in `attackers`) und des zu verschiebenden
 * Blockers innerhalb dieses Angreifers. Ein Klick auf "Reihenfolge
 * bestätigen" funktioniert ohne jede Umsortierung (Default = die von der
 * Engine vorgeschlagene Deklarationsreihenfolge).
 */
export function orderBlockersPanel(
  attackers: Array<{ attacker: string; blockers: string[] }>,
  labelFor: (instanceId: string) => string,
  onMove: (attackerIndex: number, blockerIndex: number, direction: "up" | "down") => void,
  onConfirm: () => void,
): HTMLElement {
  const attackerBlocks = attackers.map((a, attackerIndex) =>
    h("div", { class: "order-blockers-attacker" }, [
      h("div", { class: "order-blockers-attacker-name" }, [text(`${labelFor(a.attacker)} wird geblockt von:`)]),
      h(
        "div",
        { class: "order-blockers-list" },
        a.blockers.map((blockerId, blockerIndex) =>
          h("div", { class: "order-blockers-entry" }, [
            text(`${blockerIndex + 1}. ${labelFor(blockerId)}`),
            h(
              "button",
              {
                class: "btn btn-small",
                disabled: blockerIndex === 0,
                onclick: () => onMove(attackerIndex, blockerIndex, "up"),
              },
              [text("▲")],
            ),
            h(
              "button",
              {
                class: "btn btn-small",
                disabled: blockerIndex === a.blockers.length - 1,
                onclick: () => onMove(attackerIndex, blockerIndex, "down"),
              },
              [text("▼")],
            ),
          ]),
        ),
      ),
    ]),
  );

  return h("div", { class: "action-banner combat-panel order-blockers-panel" }, [
    h("span", {}, [
      text(
        "Schadensreihenfolge festlegen (Angreifer): Position 1 wird zuerst bedient - relevant für trample und Blocker-Überleben.",
      ),
    ]),
    h("div", { class: "order-blockers-attacker-list" }, attackerBlocks),
    h("button", { class: "btn btn-play", onclick: onConfirm }, [text("Reihenfolge bestätigen")]),
  ]);
}

/**
 * pendingDecision.kind === "mulligan" (rules-engine.md 1b, Entscheidung
 * 9.11, Paris-Variante): einfaches Ja/Nein-Banner - keine Ziel-/Kartenwahl
 * nötig. `timesMulliganed` bestimmt die aktuelle bzw. eine bei Mulligan neue
 * Handgröße (7 - timesMulliganed bzw. eine weniger).
 */
export function mulliganPanel(
  player: string,
  timesMulliganed: number,
  onKeep: () => void,
  onMulligan: () => void,
): HTMLElement {
  const handSize = 7 - timesMulliganed;
  return h("div", { class: "action-banner mulligan-panel" }, [
    h("span", {}, [
      text(
        `${player}: Starthand mit ${handSize} Karte(n) behalten, oder mulliganen (neu mischen, ${handSize - 1} Karte(n) ziehen)?`,
      ),
    ]),
    h("button", { class: "btn btn-play", onclick: onKeep }, [text("Starthand behalten")]),
    h("button", { class: "btn btn-cancel", onclick: onMulligan }, [text("Mulligan (neu mischen)")]),
  ]);
}

/**
 * Modus-Wahl für einen modalen Spell/eine modale aktivierte Fähigkeit (v0.3,
 * rules-engine.md 4 + 9.13): `chosenMode` ist Teil der castSpell-/
 * activateAbility-Aktion (atomar) - dieses Panel sammelt nur die
 * Nutzereingabe, bevor render.ts daraus ggf. X-/Zielwahl anschließt oder
 * direkt dispatcht. `mode.text` als Label, Fallback "Modus N" falls die
 * Karte keinen anzeigetext hat.
 */
export function modeSelectPanel(
  sourceName: string,
  modes: EffectMode[],
  onChoose: (modeIndex: number) => void,
  onCancel: () => void,
): HTMLElement {
  const buttons = modes.map((m, i) =>
    h("button", { class: "btn btn-play mode-select-btn", onclick: () => onChoose(i) }, [text(m.text ?? `Modus ${i + 1}`)]),
  );
  return h("div", { class: "action-banner mode-select-panel" }, [
    h("span", {}, [text(`Modus für „${sourceName}“ wählen - wähle eins:`)]),
    h("div", { class: "mode-select-list" }, buttons),
    h("button", { class: "btn btn-cancel", onclick: onCancel }, [text("Abbrechen")]),
  ]);
}

/**
 * pendingDecision.kind === "chooseMode" (v0.3, nur für getriggerte
 * Fähigkeiten, rules-engine.md 4 + 9.13): analog zu modeSelectPanel, aber
 * nur die laut `selectableModes` aktuell wählbaren Modi werden angeboten und
 * die Antwort geht als resolveDecision raus - kein Abbrechen möglich (die
 * Decision ist verpflichtend, wie orderBlockers/mulligan).
 */
export function chooseModeDecisionPanel(
  sourceName: string,
  modes: EffectMode[],
  selectableModes: number[],
  onChoose: (modeIndex: number) => void,
): HTMLElement {
  const buttons = selectableModes.map((i) =>
    h("button", { class: "btn btn-play mode-select-btn", onclick: () => onChoose(i) }, [text(modes[i]?.text ?? `Modus ${i + 1}`)]),
  );
  return h("div", { class: "action-banner mode-select-panel" }, [
    h("span", {}, [text(`Getriggerte Fähigkeit von „${sourceName}“: Modus wählen -`)]),
    h("div", { class: "mode-select-list" }, buttons),
  ]);
}

export function discardPanel(required: number, selectedCount: number, onConfirm: () => void): HTMLElement {
  return h("div", { class: "action-banner" }, [
    h("span", {}, [
      text(`Handkartenlimit überschritten: ${selectedCount}/${required} zum Abwerfen ausgewählt (Handkarten anklicken).`),
    ]),
    h("button", { class: "btn btn-play", disabled: selectedCount !== required, onclick: onConfirm }, [text("Abwerfen bestätigen")]),
  ]);
}
