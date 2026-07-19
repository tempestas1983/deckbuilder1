/**
 * Kurze, ÜBERLAPPENDE Soundeffekte (Karte spielen, Angriff, Treffer, ...) -
 * s. `./musicPlayer.ts` als Vorbild für das grundlegende Singleton-Prinzip
 * (Modul erzeugt eigene, von render()-Rebuilds unabhängige DOM-Elemente),
 * hier aber bewusst ANDERS als die Musik: statt EINES dauerhaften, loopenden
 * `<audio>`-Elements gibt es pro Sound-Datei ein "Vorlagen"-Element, das bei
 * jedem `playSfx()`-Aufruf per `cloneNode()` dupliziert wird. Grund: mehrere
 * Kampf-Treffer kurz hintereinander (z.B. mehrfacher Blocker-Schaden in
 * derselben Combat-Damage-Runde) müssen sich hörbar ÜBERLAPPEN können - ein
 * wiederverwendetes einzelnes `<audio>`-Element würde beim erneuten
 * `play()` mitten in der vorherigen Wiedergabe einfach zurückspulen/
 * abschneiden statt eine zweite, parallele Wiedergabe zu starten.
 *
 * Dateien liegen unter `docs/sfx/` (s. vite.config.ts#sfxPlugin, liefert sie
 * unter der festen URL `/sfx/<dateiname>.mp3` aus, exakt wie Karten-/Szenen-
 * Artwork und die Hintergrundmusik) - Quell-/Lizenz-Nachweis siehe
 * `docs/sfx/SOURCES.md`.
 *
 * WICHTIG (Testsicherheit, exakt wie musicPlayer.ts): `initSfxPlayer()` wird
 * bewusst NUR aus main.ts aufgerufen, NICHT aus store.ts/render.ts selbst.
 * store.ts ruft zwar `playSfx()`/`playSfxForEvent()` auf (reines Abspielen,
 * kein Element-Erzeugen) - das ist unproblematisch, weil `playSfx()` defensiv
 * ist: solange `initSfxPlayer()` nie lief (z.B. in der UI-Testsuite, die
 * store.ts/render.ts direkt importiert, ohne main.ts zu laden), sind die
 * Vorlagen-Elemente schlicht nicht vorhanden und `playSfx()` ist ein No-Op -
 * kein Crash, kein Aufruf von `HTMLMediaElement#play()` in jsdom (das dort
 * ohnehin nicht wirklich unterstützt wird, s. musicPlayer.ts-Kommentar zu
 * `attemptPlay`).
 */

import { isSfxEnabled } from "./store";

export type SfxName =
  | "card-play"
  | "card-draw"
  | "spell-cast"
  | "attack-swing"
  | "combat-hit"
  | "creature-death"
  | "life-loss"
  | "life-gain"
  | "victory"
  | "defeat"
  | "ui-click"
  | "deck-shuffle";

const SFX_SRC: Record<SfxName, string> = {
  "card-play": "/sfx/card-play.mp3",
  "card-draw": "/sfx/card-draw.mp3",
  "spell-cast": "/sfx/spell-cast.mp3",
  "attack-swing": "/sfx/attack-swing.mp3",
  "combat-hit": "/sfx/combat-hit.mp3",
  "creature-death": "/sfx/creature-death.mp3",
  "life-loss": "/sfx/life-loss.mp3",
  "life-gain": "/sfx/life-gain.mp3",
  victory: "/sfx/victory.mp3",
  defeat: "/sfx/defeat.mp3",
  "ui-click": "/sfx/ui-click.mp3",
  "deck-shuffle": "/sfx/deck-shuffle.mp3",
};

/**
 * `undefined`, solange `initSfxPlayer()` nie lief (s. Dateikommentar) -
 * genau dieser Zustand macht `playSfx()` zu einem sicheren No-Op statt eines
 * Crashes.
 */
let templates: Partial<Record<SfxName, HTMLAudioElement>> | undefined;

function buildTemplates(): Partial<Record<SfxName, HTMLAudioElement>> {
  const map: Partial<Record<SfxName, HTMLAudioElement>> = {};
  for (const name of Object.keys(SFX_SRC) as SfxName[]) {
    const el = document.createElement("audio");
    el.src = SFX_SRC[name];
    el.preload = "auto";
    // Nie ans DOM angehängt (anders als musicPlayer.ts' <audio>-Element) -
    // dient nur als Vorlage zum Klonen, wird selbst nie abgespielt.
    map[name] = el;
  }
  return map;
}

/**
 * Spielt einen kurzen Soundeffekt ab (überlappend, s. Dateikommentar).
 * Defensiv in zwei Richtungen: kein Effekt, solange `initSfxPlayer()` nie
 * lief (Tests, s.o.), und respektiert den eigenständigen SFX-Mute-Zustand
 * (`store.ts#isSfxEnabled`, unabhängig vom Musik-Mute).
 */
export function playSfx(name: SfxName): void {
  if (!templates) return;
  if (!isSfxEnabled()) return;
  const template = templates[name];
  if (!template) return;
  const instance = template.cloneNode(true) as HTMLAudioElement;
  try {
    const result = instance.play() as unknown;
    if (result && typeof (result as Promise<void>).catch === "function") {
      (result as Promise<void>).catch(() => {
        // Autoplay-Policy o.ä. - wie bei musicPlayer.ts bewusst lautlos
        // ignoriert, kein Fehlerzustand.
      });
    }
  } catch {
    // Darf die App nie zum Absturz bringen (s. musicPlayer.ts#attemptPlay).
  }
}

/**
 * Primäre Aktions-Buttons, bei deren Klick `ui-click.mp3` ertönen soll
 * (Auftrag: "lieber zu wenige als zu viele") - `.btn-play` deckt bereits
 * Terrain legen/Spielen/Modus wählen/X wählen/Angriff-Blocks-Abwerfen-
 * Reihenfolge bestätigen/Starthand behalten/Tutorial starten/Deck bestätigen
 * ab (alles primäre "Weiter geht's"-Bestätigungen, s. components/*.ts),
 * `.btn-pass` das "Priorität passen" aus der Statusleiste. Bewusst NICHT
 * die +/- Zähler-Buttons im Deckbau-Kartenpool (`.deck-pool-plus-btn`/
 * `.deck-pool-minus-btn`, ~300 Karten) - würden bei schnellem Durchklicken
 * nur nerven statt zu unterstützen.
 */
const UI_CLICK_SELECTOR = ".btn-play, .btn-pass";

let uiClickListenerAttached = false;

/**
 * Einzelner globaler Klick-Listener (Capture-Phase) statt eines eigenen
 * `playSfx("ui-click")`-Aufrufs in jeder einzelnen Button-Komponente - exakt
 * das gleiche Muster wie musicPlayer.ts#startOnFirstInteraction (ein
 * zentraler, modul-eigener Listener statt über die ganze UI verstreuter
 * Verdrahtung).
 */
function attachUiClickListener(): void {
  if (uiClickListenerAttached) return;
  uiClickListenerAttached = true;
  document.addEventListener(
    "click",
    (ev) => {
      const target = ev.target;
      if (!(target instanceof Element)) return;
      if (target.closest(UI_CLICK_SELECTOR)) playSfx("ui-click");
    },
    true,
  );
}

/**
 * Einmalig aus main.ts aufzurufen (s. Dateikommentar): erzeugt die
 * Vorlagen-`<audio>`-Elemente und richtet den globalen UI-Klick-Listener ein.
 */
export function initSfxPlayer(): void {
  if (!templates) templates = buildTemplates();
  attachUiClickListener();
}
