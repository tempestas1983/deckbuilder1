/**
 * Zentraler Frontend-"Store": hält die einzige Engine-Instanz + den
 * aktuellen GameState, kapselt dispatch(action) über applyAction und
 * benachrichtigt Subscriber (hier: die render()-Funktion) bei Änderungen.
 *
 * Bewusst kein Redux/Zustand/... - für dieses Board reicht ein simples
 * Observer-Muster; das eigentliche "Modell" bleibt ohnehin die Engine.
 */

import { createRulesEngine } from "../engine";
import { starterSet } from "../cards/starter-set";
import { chooseActionForDifficulty, DEFAULT_BOT_DIFFICULTY, type BotDifficulty } from "../ai";
import { playSfx } from "./sfxPlayer";
import type { CardPool, GameEvent, GameState, InstanceId, Keyword, PlayerAction, PlayerId, RulesEngine } from "../model";
import type { AppPhase, UiMode } from "./types";
import {
  TUTORIAL_STEPS,
  TUTORIAL_STEP_HAND_CARD_IDS,
  tutorialStepIndexOf,
  type TutorialStep,
} from "./tutorialContent";
import { TUTORIAL_DECK_PLAYER1, TUTORIAL_DECK_PLAYER2, TUTORIAL_SEED } from "./tutorialDeck";
import { cardDef } from "./cardInfo";

const pool: CardPool = starterSet;
const engine: RulesEngine = createRulesEngine(pool);

let state: GameState;
let log: string[] = [];
let lastError: string | undefined;
let uiMode: UiMode = { kind: "idle" };

/**
 * Transiente "das ist GERADE passiert"-Menge von InstanceIds (Nutzer-Auftrag:
 * "Nachvollziehbarkeit von KI-Spielzügen ... auch visuell, eine Karte wird
 * gelegt, es wird getappt usw") - befüllt aus den zuletzt verarbeiteten
 * GameEvents (s. collectGlowInstanceIds/processEvents unten), von render.ts
 * über `getRecentActionInstanceIds()` gelesen, um die betroffene(n) Karte(n)
 * kurz optisch hervorzuheben (eigene `.action-glow`-Klasse, s. style.css -
 * bewusst NICHT `.tutorial-glow` wiederverwendet, das dort etwas anderes
 * bedeutet, s. cardTile.ts-Kommentar). Läuft für BEIDE Spieler gleich (kein
 * bot-spezifischer Mechanismus) - einheitlicher, einfacherer Code, und auch
 * bei eigenen Aktionen eine sinnvolle, konsistente Rückmeldung.
 *
 * Leert sich nach RECENT_ACTION_GLOW_MS von selbst (s. markRecentAction) statt
 * bis zum nächsten Event stehen zu bleiben - sonst würde die Hervorhebung
 * einer stillen Karte "kleben bleiben", bis irgendwann ein neues Event kommt.
 */
let recentActionInstanceIds: Set<InstanceId> = new Set();
let recentActionClearTimer: ReturnType<typeof setTimeout> | undefined;
const RECENT_ACTION_GLOW_MS = 1200;

/** s. recentActionInstanceIds oben - für render.ts (cardTile/stackPanel-Hervorhebung). */
export function getRecentActionInstanceIds(): ReadonlySet<InstanceId> {
  return recentActionInstanceIds;
}

/**
 * Fügt neue InstanceIds zur Glow-Menge hinzu und (re-)startet den Auto-Clear-
 * Timer - kommt während desselben Zeitfensters ein weiteres Event für eine
 * ANDERE Karte hinzu, verlängert sich die Anzeigedauer für ALLE aktuell
 * hervorgehobenen Karten gemeinsam (einfacher als Einzel-Ablaufzeiten pro
 * Karte zu verwalten, und in der Praxis unauffällig, da ein einzelner
 * Bot-Schritt ohnehin meist nur 1-2 Events mit InstanceId-Bezug erzeugt).
 */
function markRecentAction(ids: InstanceId[]): void {
  if (ids.length === 0) return;
  for (const id of ids) recentActionInstanceIds.add(id);
  if (recentActionClearTimer !== undefined) clearTimeout(recentActionClearTimer);
  recentActionClearTimer = setTimeout(() => {
    recentActionClearTimer = undefined;
    recentActionInstanceIds = new Set();
    notify();
  }, RECENT_ACTION_GLOW_MS);
  notify();
}

/**
 * Verwirft eine evtl. noch laufende Glow-Anzeige der VORHERIGEN Partie sofort
 * (kein Warten auf den Timer) - wichtig, weil InstanceIds pro Partie neu ab
 * "card1" vergeben werden (s. engine/ids.ts#nextInstanceId), eine stehen-
 * gebliebene alte ID könnte also in der neuen Partie zufällig eine ANDERE,
 * unbeteiligte Karte treffen. Wird von initGame() aufgerufen.
 */
function resetRecentActionGlow(): void {
  if (recentActionClearTimer !== undefined) {
    clearTimeout(recentActionClearTimer);
    recentActionClearTimer = undefined;
  }
  recentActionInstanceIds = new Set();
}

/**
 * App-Ebene-Zustand (siehe types.ts#AppPhase): startet immer im echten
 * Hauptmenü (Titelbildschirm), kein Teil des GameState. Vor dem
 * "echtes Hauptmenü"-Umbau startete die App direkt im Deckbau-Screen für
 * player1 (v0.1.5-Verhalten) - Deckbau ist seitdem nur noch über die
 * Hauptmenü-Optionen "Neues Spiel" (via `opponentSelect`) bzw. "Deck Builder"
 * (direkt, `mode: "standalone"`) erreichbar, s. types.ts#AppPhase für den
 * vollständigen Ablauf. Noch davor (v0.1-v0.1.4) lief hier automatisch eine
 * Demo-Partie, s. docs/frontend-status.md "Nächste Schritte" Punkt 6.
 */
let appPhase: AppPhase = { kind: "mainMenu" };

// ---------------------------------------------------------------------------
// Deck-Persistenz über Sessions hinweg (v0.1.8): localStorage-Fallback für
// die zuletzt bestätigte(n) Deckliste(n), damit ein Seiten-Reload (neues
// store.ts-Modul, decklists startet leer) nicht wieder von einem leeren Deck
// beginnt. Bewusst NUR ein Fallback für den Modul-Start (s. decklists-Init
// unten) - solange die In-Memory-Decklisten innerhalb einer Session bereits
// etwas enthalten (z.B. nach "Neues Spiel"), bleibt das unverändert die
// Quelle der Vorbefüllung (bisheriges v0.1.5-Verhalten).
// ---------------------------------------------------------------------------

const LAST_DECK_STORAGE_KEY: Record<PlayerId, string> = {
  player1: "deckbuilder1.lastDeck.player1",
  player2: "deckbuilder1.lastDeck.player2",
};

/**
 * Liest die zuletzt gespeicherte Deckliste eines Spielers aus localStorage.
 * Defensiv: localStorage kann in privaten Browser-Modi/mit deaktivierten
 * Cookies fehlen oder werfen (SecurityError) - ein Fehler hier darf die App
 * niemals zum Absturz bringen, sondern führt einfach zu "kein gespeichertes
 * Deck gefunden" (leeres Deck als Vorbefüllung, wie schon vor v0.1.8).
 */
function loadDeckFromLocalStorage(player: PlayerId): Record<string, number> | undefined {
  try {
    const raw = window.localStorage.getItem(LAST_DECK_STORAGE_KEY[player]);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return undefined;
    // Grobe Formprüfung (nur string->number-Einträge) statt vollem Schema-
    // Validator - reine UI-Bequemlichkeit, die Engine validiert Decklisten
    // ohnehin nicht selbst (s. deckValidation.ts-Kommentar an anderer Stelle).
    const entries = Object.entries(parsed as Record<string, unknown>).filter(
      (entry): entry is [string, number] => typeof entry[1] === "number",
    );
    return Object.fromEntries(entries);
  } catch {
    return undefined;
  }
}

/** Speichert die Deckliste eines Spielers in localStorage - defensiv, s. loadDeckFromLocalStorage. */
function saveDeckToLocalStorage(player: PlayerId, list: Record<string, number>): void {
  try {
    window.localStorage.setItem(LAST_DECK_STORAGE_KEY[player], JSON.stringify(list));
  } catch {
    // localStorage nicht verfügbar/voll/deaktiviert - einfach ignorieren
    // (Auftrag: "darf die App nicht zum Absturz bringen").
  }
}

/**
 * Zuletzt gesammelte Decklisten pro Spieler. Bleiben bewusst über
 * "Zurück zum Hauptmenü" (s. backToMainMenu) hinweg erhalten,
 * damit der Deckbau-Screen beim erneuten Öffnen als Vorbefüllung dient
 * (bessere UX für wiederholte Testpartien) - kein Hard-Requirement, aber
 * explizit erwünscht laut Auftrag. **Seit v0.1.8**: Start-Wert lädt
 * zusätzlich aus localStorage (Fallback für den allerersten Deckbau-Screen
 * nach einem Seiten-Reload, s. Abschnitt oben) statt immer mit `{}` zu
 * beginnen.
 */
let decklists: Record<PlayerId, Record<string, number>> = {
  player1: loadDeckFromLocalStorage("player1") ?? {},
  player2: loadDeckFromLocalStorage("player2") ?? {},
};

const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Hintergrundmusik-Präferenz (an/aus): reine UI-Einstellung, kein Teil des
// GameState, exakt gleiches Persistenz-Muster wie die Decklisten oben
// (localStorage-Fallback, defensiv gegen fehlendes/deaktiviertes
// localStorage - darf die App nie zum Absturz bringen). Das eigentliche
// `<audio>`-Element inkl. Play/Pause/Browser-Autoplay-Handling lebt bewusst
// NICHT hier, sondern in einem eigenen Singleton-Modul (`./musicPlayer.ts`),
// das sich per `subscribe()` genau wie `render()` an Store-Änderungen hängt -
// so bleibt store.ts frei von DOM-/Audio-API-Zugriffen (reiner Zustand +
// Persistenz), während musicPlayer.ts das dauerhafte, Rebuild-sichere
// `<audio>`-Element verwaltet (s. dortiger Dateikommentar).
// ---------------------------------------------------------------------------

const MUSIC_ENABLED_STORAGE_KEY = "deckbuilder1.musicEnabled";

/** Defensiv wie loadDeckFromLocalStorage: fehlt/ist ungültig der gespeicherte Wert, startet Musik standardmäßig AN. */
function loadMusicEnabledFromLocalStorage(): boolean {
  try {
    const raw = window.localStorage.getItem(MUSIC_ENABLED_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

function saveMusicEnabledToLocalStorage(enabled: boolean): void {
  try {
    window.localStorage.setItem(MUSIC_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    // localStorage nicht verfügbar/voll/deaktiviert - einfach ignorieren (s.o.).
  }
}

let musicEnabled: boolean = loadMusicEnabledFromLocalStorage();

/** Aktuell gewünschter Musik-Zustand (persistiert über Sessions hinweg, s.o.). */
export function isMusicEnabled(): boolean {
  return musicEnabled;
}

/** Mute/Play-Umschalter (Klick auf "An/Aus" im Musik-Panel, s. components/musicPanel.ts). */
export function toggleMusicEnabled(): void {
  musicEnabled = !musicEnabled;
  saveMusicEnabledToLocalStorage(musicEnabled);
  notify();
}

// ---------------------------------------------------------------------------
// Musik-Playlist (Titelauswahl + Wiederholungsmodus): erweitert die simple
// an/aus-Präferenz oben um eine echte Playlist-Steuerung, nachdem der Nutzer
// mehrere Titel unter docs/music/ abgelegt hat (bisher genau eine hartkodierte
// Datei). Drei Teile:
// - `musicTracks`: die Liste der aktuell verfügbaren Dateinamen. NICHT
//   persistiert (kein localStorage) und NICHT hier ermittelt - store.ts macht
//   bewusst keine Netzwerkaufrufe (siehe Datei-Kommentar oben). `musicPlayer.ts`
//   lädt `/music/index.json` (Auto-Discovery, s. vite.config.ts#musicIndexPlugin)
//   und meldet das Ergebnis EINMALIG über `setMusicTracks()` zurück - exakt das
//   gleiche Delegationsmuster wie beim `<audio>`-Element selbst (Zustand hier,
//   Browser-/Netzwerk-API dort).
// - `musicCurrentTrackPreference`: der zuletzt vom Nutzer gewählte Titel
//   (Dateiname), persistiert wie `musicEnabled` oben. `getMusicCurrentTrack()`
//   validiert das gegen die tatsächlich vorhandene Liste und fällt robust auf
//   den ersten verfügbaren Titel zurück, falls die gespeicherte Datei
//   inzwischen gelöscht wurde (Auftrag: "robust ... statt zu crashen").
// - `musicRepeatMode`: "track" (aktuellen Titel in Dauerschleife) oder
//   "playlist" (alle Titel der Reihe nach, danach wieder von vorne) -
//   ebenfalls persistiert. Das eigentliche Umschalten beim `ended`-Event
//   passiert in musicPlayer.ts (dort hängt der Event-Listener am `<audio>`-
//   Element); `advanceToNextMusicTrack()` unten ist nur die reine
//   Index-Arithmetik dafür, damit musicPlayer.ts selbst keine Playlist-Logik
//   duplizieren muss.
// ---------------------------------------------------------------------------

export type MusicRepeatMode = "track" | "playlist";

const MUSIC_CURRENT_TRACK_STORAGE_KEY = "deckbuilder1.musicCurrentTrack";
const MUSIC_REPEAT_MODE_STORAGE_KEY = "deckbuilder1.musicRepeatMode";

function loadMusicCurrentTrackFromLocalStorage(): string | undefined {
  try {
    const raw = window.localStorage.getItem(MUSIC_CURRENT_TRACK_STORAGE_KEY);
    return raw ?? undefined;
  } catch {
    return undefined;
  }
}

function saveMusicCurrentTrackToLocalStorage(track: string): void {
  try {
    window.localStorage.setItem(MUSIC_CURRENT_TRACK_STORAGE_KEY, track);
  } catch {
    // s.o. - localStorage nicht verfügbar/voll/deaktiviert, einfach ignorieren.
  }
}

/** Defensiv wie loadMusicEnabledFromLocalStorage: fehlt/ist der gespeicherte Wert ungültig, startet der Playlist-Modus standardmäßig im Playlist-Loop (alle Titel nacheinander). */
function loadMusicRepeatModeFromLocalStorage(): MusicRepeatMode {
  try {
    const raw = window.localStorage.getItem(MUSIC_REPEAT_MODE_STORAGE_KEY);
    return raw === "track" || raw === "playlist" ? raw : "playlist";
  } catch {
    return "playlist";
  }
}

function saveMusicRepeatModeToLocalStorage(mode: MusicRepeatMode): void {
  try {
    window.localStorage.setItem(MUSIC_REPEAT_MODE_STORAGE_KEY, mode);
  } catch {
    // s.o.
  }
}

let musicTracks: string[] = [];
let musicCurrentTrackPreference: string | undefined = loadMusicCurrentTrackFromLocalStorage();
let musicRepeatMode: MusicRepeatMode = loadMusicRepeatModeFromLocalStorage();
let musicPanelOpen = false;

/** Aktuell bekannte Titel-Liste (Dateinamen unter docs/music/), s.o. - leer, solange musicPlayer.ts noch nicht geladen hat oder der Ordner leer ist. */
export function getMusicTracks(): string[] {
  return musicTracks;
}

/** NUR von musicPlayer.ts nach dem Laden von `/music/index.json` aufgerufen (s.o.) - store.ts selbst führt keine Netzwerkaufrufe aus. */
export function setMusicTracks(tracks: string[]): void {
  musicTracks = tracks;
  notify();
}

/** Aktuell effektiv aktiver Titel (Dateiname), `undefined` solange keiner verfügbar ist (Ordner leer/Liste noch nicht geladen). Fällt robust auf den ersten verfügbaren Titel zurück, falls die gespeicherte Präferenz nicht mehr existiert. */
export function getMusicCurrentTrack(): string | undefined {
  if (musicTracks.length === 0) return undefined;
  if (musicCurrentTrackPreference && musicTracks.includes(musicCurrentTrackPreference)) {
    return musicCurrentTrackPreference;
  }
  return musicTracks[0];
}

/** Gezielte Titelauswahl (Klick auf einen Titel in der Playlist im Musik-Panel). */
export function selectMusicTrack(track: string): void {
  musicCurrentTrackPreference = track;
  saveMusicCurrentTrackToLocalStorage(track);
  notify();
}

export function getMusicRepeatMode(): MusicRepeatMode {
  return musicRepeatMode;
}

export function setMusicRepeatMode(mode: MusicRepeatMode): void {
  musicRepeatMode = mode;
  saveMusicRepeatModeToLocalStorage(mode);
  notify();
}

/** Playlist-Modus, `ended`-Event: wechselt zum nächsten Titel (mit Wrap-Around zum Anfang nach dem letzten). No-op ohne verfügbare Titel. */
export function advanceToNextMusicTrack(): void {
  if (musicTracks.length === 0) return;
  const current = getMusicCurrentTrack();
  const currentIndex = current ? musicTracks.indexOf(current) : -1;
  const nextIndex = (currentIndex + 1) % musicTracks.length;
  const nextTrack = musicTracks[nextIndex];
  if (nextTrack) selectMusicTrack(nextTrack);
}

/** Musik-Panel (Titelauswahl + Wiederholungsmodus, s. components/musicPanel.ts) - analog zu isKeywordGlossaryPanelOpen unten. */
export function isMusicPanelOpen(): boolean {
  return musicPanelOpen;
}

export function toggleMusicPanel(): void {
  musicPanelOpen = !musicPanelOpen;
  notify();
}

export function closeMusicPanel(): void {
  musicPanelOpen = false;
  notify();
}

// ---------------------------------------------------------------------------
// Soundeffekt-Präferenz (an/aus): eigenständiger Mute-Zustand, UNABHÄNGIG von
// `musicEnabled` oben (Auftrag: "eigener Mute-Zustand") - wer z.B. nur die
// Hintergrundmusik stört, aber Karten-/Kampf-Soundeffekte behalten möchte
// (oder umgekehrt), kann beide getrennt umschalten. Exakt gleiches
// Persistenz-/Delegations-Muster wie oben: reiner Zustand + localStorage
// hier in store.ts, das eigentliche Abspielen (inkl. `<audio>`-Element-
// Erzeugung) lebt in `./sfxPlayer.ts` (s. dortiger Dateikommentar für die
// Testsicherheits-Begründung, warum das ein separates, nur explizit aus
// main.ts initialisiertes Modul ist).
// ---------------------------------------------------------------------------

const SFX_ENABLED_STORAGE_KEY = "deckbuilder1.sfxEnabled";

/** Defensiv wie loadMusicEnabledFromLocalStorage: fehlt/ist ungültig der gespeicherte Wert, starten Soundeffekte standardmäßig AN. */
function loadSfxEnabledFromLocalStorage(): boolean {
  try {
    const raw = window.localStorage.getItem(SFX_ENABLED_STORAGE_KEY);
    if (raw === null) return true;
    return raw === "true";
  } catch {
    return true;
  }
}

function saveSfxEnabledToLocalStorage(enabled: boolean): void {
  try {
    window.localStorage.setItem(SFX_ENABLED_STORAGE_KEY, String(enabled));
  } catch {
    // localStorage nicht verfügbar/voll/deaktiviert - einfach ignorieren (s.o.).
  }
}

let sfxEnabled: boolean = loadSfxEnabledFromLocalStorage();

/** Aktuell gewünschter Soundeffekt-Zustand (persistiert über Sessions hinweg, s.o.). */
export function isSfxEnabled(): boolean {
  return sfxEnabled;
}

/** Mute/Play-Umschalter für Soundeffekte (Klick auf den eigenen Button neben dem Musik-Toggle). */
export function toggleSfxEnabled(): void {
  sfxEnabled = !sfxEnabled;
  saveSfxEnabledToLocalStorage(sfxEnabled);
  notify();
}

// ---------------------------------------------------------------------------
// Keyword-Glossar (Nutzer-Feedback: Karten zeigen Schlüsselwörter wie
// "Todesberührung." im Regeltext, ohne dass irgendwo nachschlagbar war, was
// das bedeutet - s. docs/frontend-status.md, neue Version). Bewusst
// UNABHÄNGIG vom Tutorial-Zustand (anders als `tutorialHelpOpen` oben): das
// Glossar muss laut Auftrag in JEDER Partie/im Deckbau verfügbar sein, nicht
// nur im Tutorial-Modus. Zwei getrennte State-Teile:
// - `openKeywordPopover`: welches EINZELNE Keyword aktuell als kleine
//   Klick-Sprechblase angezeigt wird (ausgelöst durch Klick auf ein
//   hervorgehobenes Keyword-Wort im Kartentext, s.
//   components/keywordText.ts#ruleTextNodes).
// - `keywordGlossaryPanelOpen`: das komplette, jederzeit erreichbare
//   Nachschlagewerk ALLER 9 Keywords (eigener "Schlüsselwörter"-Button in
//   der Status-Zeile UND im Deckbau-Screen, s. render.ts/deckBuilder.ts).
// ---------------------------------------------------------------------------

let openKeywordPopover: Keyword | undefined;
let keywordGlossaryPanelOpen = false;

/** Aktuell per Klick geöffnete Keyword-Kurz-Sprechblase, `undefined` = keine. */
export function getOpenKeywordGlossary(): Keyword | undefined {
  return openKeywordPopover;
}

/** Klick auf ein hervorgehobenes Keyword-Wort - öffnet/schließt dessen Sprechblase (Toggle). */
export function toggleKeywordGlossary(keyword: Keyword): void {
  openKeywordPopover = openKeywordPopover === keyword ? undefined : keyword;
  notify();
}

export function closeKeywordGlossary(): void {
  if (openKeywordPopover === undefined) return;
  openKeywordPopover = undefined;
  notify();
}

/** Vollständiges Keyword-Nachschlagewerk (alle 9 Einträge) - jederzeit, auch außerhalb des Tutorials. */
export function isKeywordGlossaryPanelOpen(): boolean {
  return keywordGlossaryPanelOpen;
}

export function toggleKeywordGlossaryPanel(): void {
  keywordGlossaryPanelOpen = !keywordGlossaryPanelOpen;
  notify();
}

export function closeKeywordGlossaryPanel(): void {
  keywordGlossaryPanelOpen = false;
  notify();
}

// ---------------------------------------------------------------------------
// "Anleitung"-Panel (vierter Hauptmenü-Button neben "Neues Spiel"/"Deck
// Builder"/"Tutorial", s. components/mainMenu.ts/rulesGuidePanel.ts):
// Kartentypen/Schlüsselwörter/Tipps zum entspannten Nachlesen außerhalb einer
// Partie. Reiner Anzeige-Zustand, exakt analog zu
// isKeywordGlossaryPanelOpen/toggleKeywordGlossaryPanel oben - bewusst kein
// eigener AppPhase-Screen (s. Dateikommentar rulesGuidePanel.ts).
// ---------------------------------------------------------------------------

let rulesGuideOpen = false;

export function isRulesGuideOpen(): boolean {
  return rulesGuideOpen;
}

export function toggleRulesGuide(): void {
  rulesGuideOpen = !rulesGuideOpen;
  notify();
}

export function closeRulesGuide(): void {
  rulesGuideOpen = false;
  notify();
}

// ---------------------------------------------------------------------------
// Benannte, dauerhaft gespeicherte Decks: erweitert die simple "letzte
// Deckliste pro Spieler"-Persistenz oben (LAST_DECK_STORAGE_KEY, EIN Slot pro
// Spieler, kein Name) um eine echte kleine Deck-Verwaltung - der Nutzer kann
// eine fertig gebaute Deckliste unter einem selbst gewählten Namen (+
// optionaler Beschreibung) sichern und beliebig viele solcher Decks parallel
// vorhalten, um sie später wieder zu laden (s. components/savedDecksPanel.ts
// fürs UI). Gleiches defensives Persistenz-Muster wie überall in dieser
// Datei: try/catch um jeden localStorage-Zugriff, ein Fehler hier darf die
// App nie zum Absturz bringen.
// ---------------------------------------------------------------------------

export interface SavedDeck {
  id: string;
  name: string;
  description?: string;
  decklist: Record<string, number>;
  /** ISO-Zeitstempel (new Date().toISOString()) - dient sowohl der Anzeige als auch der Sortierung (neueste zuerst). */
  savedAt: string;
}

const SAVED_DECKS_STORAGE_KEY = "deckbuilder1.savedDecks";

function isSavedDeckShape(value: unknown): value is SavedDeck {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.savedAt === "string" &&
    typeof v.decklist === "object" &&
    v.decklist !== null &&
    !Array.isArray(v.decklist)
  );
}

/** Defensiv wie loadDeckFromLocalStorage: ungültige/fehlende Daten -> leere Liste statt Absturz. */
function loadSavedDecksFromLocalStorage(): SavedDeck[] {
  try {
    const raw = window.localStorage.getItem(SAVED_DECKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedDeckShape);
  } catch {
    return [];
  }
}

function persistSavedDecks(next: SavedDeck[]): void {
  try {
    window.localStorage.setItem(SAVED_DECKS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage nicht verfügbar/voll/deaktiviert - einfach ignorieren (s.o.).
  }
}

let savedDecks: SavedDeck[] = loadSavedDecksFromLocalStorage();

/** Alle gespeicherten Decks, neueste zuerst (Anzeige-Reihenfolge fürs "Deck laden"-Panel). */
export function listSavedDecks(): SavedDeck[] {
  return [...savedDecks].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Reine Anzeige-/Storage-ID, keine Regelrelevanz - `crypto.randomUUID` ist nicht in jeder Umgebung garantiert (ältere Browser/jsdom), daher ein simpler, kollisionsarmer Fallback. */
function generateSavedDeckId(): string {
  return `deck-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Speichert `decklist` unter `name` (+ optionaler `description`). Existiert
 * bereits ein gespeichertes Deck mit demselben Namen (Vergleich getrimmt,
 * ohne Groß-/Kleinschreibung), wird DESSEN Eintrag überschrieben (gleiche
 * id, neuer `savedAt`-Zeitstempel) statt einen zweiten, gleichnamigen
 * Eintrag anzulegen - kein Bestätigungsdialog nötig, der Rückgabewert
 * `overwritten` erlaubt dem UI trotzdem einen passenden Hinweistext
 * ("aktualisiert" statt "gespeichert"). `name` wird leer/nur-Whitespace
 * NICHT akzeptiert (liefert `undefined` statt eines Eintrags) - das Anlegen
 * eines unbenannten Decks wäre für "Deck laden" später nicht wiederauffindbar;
 * das UI verhindert diesen Fall bereits durch einen deaktivierten
 * "Speichern"-Button, dies ist zusätzlich ein Sicherheitsnetz.
 */
export function saveDeckAs(
  name: string,
  description: string | undefined,
  decklist: Record<string, number>,
): { id: string; overwritten: boolean } | undefined {
  const trimmedName = name.trim();
  if (!trimmedName) return undefined;
  const trimmedDescription = description?.trim();
  const savedAt = new Date().toISOString();
  const existing = savedDecks.find((d) => d.name.trim().toLowerCase() === trimmedName.toLowerCase());
  if (existing) {
    savedDecks = savedDecks.map((d) =>
      d.id === existing.id
        ? { ...d, name: trimmedName, description: trimmedDescription || undefined, decklist: { ...decklist }, savedAt }
        : d,
    );
    persistSavedDecks(savedDecks);
    notify();
    return { id: existing.id, overwritten: true };
  }
  const id = generateSavedDeckId();
  savedDecks = [
    ...savedDecks,
    { id, name: trimmedName, description: trimmedDescription || undefined, decklist: { ...decklist }, savedAt },
  ];
  persistSavedDecks(savedDecks);
  notify();
  return { id, overwritten: false };
}

export function deleteSavedDeck(id: string): void {
  savedDecks = savedDecks.filter((d) => d.id !== id);
  persistSavedDecks(savedDecks);
  notify();
}

/** Lädt ein gespeichertes Deck in die aktuelle Deckliste von `player` (über das bestehende `setDecklist`, s.u.) - No-op, falls die id nicht (mehr) existiert (z.B. in einem zweiten, bereits geschlossenen Tab gelöscht). */
export function loadSavedDeck(player: PlayerId, id: string): void {
  const found = savedDecks.find((d) => d.id === id);
  if (!found) return;
  setDecklist(player, { ...found.decklist });
}

// "Deck speichern"-Formular und "Deck laden"-Liste sind zwei getrennte
// Popover-Panels (s. components/savedDecksPanel.ts) - reiner Anzeige-Zustand,
// analog zu isMusicPanelOpen/isKeywordGlossaryPanelOpen oben. Öffnet eines der
// beiden das jeweils andere, wird es geschlossen (verhindert zwei
// überlappende Popover gleichzeitig) - rein kosmetisch, keine Regelrelevanz.
let saveDeckFormOpen = false;
let loadDeckPanelOpen = false;

export function isSaveDeckFormOpen(): boolean {
  return saveDeckFormOpen;
}

export function toggleSaveDeckForm(): void {
  saveDeckFormOpen = !saveDeckFormOpen;
  if (saveDeckFormOpen) loadDeckPanelOpen = false;
  notify();
}

export function closeSaveDeckForm(): void {
  saveDeckFormOpen = false;
  notify();
}

export function isLoadDeckPanelOpen(): boolean {
  return loadDeckPanelOpen;
}

export function toggleLoadDeckPanel(): void {
  loadDeckPanelOpen = !loadDeckPanelOpen;
  if (loadDeckPanelOpen) saveDeckFormOpen = false;
  notify();
}

export function closeLoadDeckPanel(): void {
  loadDeckPanelOpen = false;
  notify();
}

// ---------------------------------------------------------------------------
// Deck-Analyse-Bereich (Mana-Kurve/Farb-/Typverteilung, s.
// components/deckAnalysis.ts): rein einklappbar, keine Persistenz nötig
// (bewusst kein localStorage-Eintrag, anders als z.B. musicEnabled - das ist
// reine Layout-Bequemlichkeit ohne Bedarf, sie über einen Reload hinweg zu
// merken). Standardmäßig eingeklappt sichtbar (aufgeklappt), da sie direkt
// nützliche Live-Information zum aktuell zusammengestellten Deck liefert.
// ---------------------------------------------------------------------------

let deckAnalysisPanelOpen = true;

export function isDeckAnalysisPanelOpen(): boolean {
  return deckAnalysisPanelOpen;
}

export function toggleDeckAnalysisPanel(): void {
  deckAnalysisPanelOpen = !deckAnalysisPanelOpen;
  notify();
}

export function getPool(): CardPool {
  return pool;
}

export function getState(): GameState {
  return state;
}

export function getLog(): string[] {
  return log;
}

export function getLastError(): string | undefined {
  return lastError;
}

export function getUiMode(): UiMode {
  return uiMode;
}

/** UI-Modus setzen (Targeting/X-Eingabe/Combat/Discard) - löst KEINE Engine-Aktion aus. */
export function setUiMode(mode: UiMode): void {
  uiMode = mode;
  lastError = undefined;
  notify();
}

export function resetUiMode(): void {
  setUiMode({ kind: "idle" });
}

// ---------------------------------------------------------------------------
// App-Ebene: Deckbau- vs. Spielphase (siehe types.ts#AppPhase)
// ---------------------------------------------------------------------------

export function getAppPhase(): AppPhase {
  return appPhase;
}

// ---------------------------------------------------------------------------
// Hauptmenü-Navigation ("echtes Hauptmenü statt Direkteinstieg"-Umbau): die
// drei Hauptmenü-Optionen ("Neues Spiel"/"Deck Builder"/"Tutorial", s.
// components/mainMenu.ts) sowie die Gegner-Auswahl, die "Neues Spiel"
// zwischenschaltet (s. components/opponentSelect.ts). `startTutorial()` unten
// (unverändert gegenüber dem vorherigen Stand, nur jetzt zusätzlich vom
// Hauptmenü statt einem Button im player1-Deckbau-Screen aus erreichbar)
// gehört inhaltlich hierher, bleibt aber an ihrer ursprünglichen Stelle
// weiter unten (Tutorial-Abschnitt), um den dortigen Kontext nicht
// auseinanderzureißen.
// ---------------------------------------------------------------------------

/** "Neues Spiel" im Hauptmenü: zeigt zuerst die Gegner-Auswahl (KI-Schwierigkeit oder "2 Spieler"/Hotseat), bevor player1 mit dem Deckbau beginnt. */
export function startNewGameFlow(): void {
  appPhase = { kind: "opponentSelect" };
  notify();
}

/**
 * "Deck Builder" im Hauptmenü: derselbe Deckbau-Screen wie beim normalen
 * Partie-Einstieg (`deckBuilderScreen`, s. components/deckBuilder.ts), aber
 * im eigenständigen `mode: "standalone"` - der Screen bietet dort statt
 * "Weiter"/"Spiel starten" einen "Zurück zum Hauptmenü"-Button an, es folgt
 * KEINE Partie-Vorbereitung. Nutzt bewusst denselben `decklists.player1`-Slot
 * wie der normale player1-Deckbau (kein separater Speicherort nötig) - die
 * benannte Deck-Verwaltung (SavedDeck, s.u.) ist ohnehin der eigentliche
 * Persistenz-Weg für "in Ruhe Decks zusammenstellen".
 */
export function openDeckBuilderStandalone(): void {
  appPhase = { kind: "deckbuild", player: "player1", mode: "standalone" };
  notify();
}

/**
 * Gegner-Auswahl (s. components/opponentSelect.ts) - Option "KI mit
 * Schwierigkeit `difficulty`": markiert player2 sofort als bot-gesteuert
 * (identisch zu `setBotControlled`/`setBotDifficulty`, die auch der
 * bestehende KI-Umschalter im player2-Deckbau-Screen nutzt) und führt zu
 * player1s Deckbau. Das eigentliche zufällige player2-Deck + der direkte
 * Partiestart (player2-Deckbau-Screen wird dabei komplett übersprungen)
 * passieren erst, sobald player1 sein Deck bestätigt (s.
 * render.ts#renderDeckBuilder, `onConfirm`) - genau wie beim bisherigen
 * "Zufälliges KI-Deck + weiter"-Kurzstart, nur jetzt schon VOR statt NACH
 * player1s eigenem Deckbau ausgelöst.
 */
export function chooseOpponentBot(difficulty: BotDifficulty): void {
  setBotControlled("player2", true);
  setBotDifficulty("player2", difficulty);
  appPhase = { kind: "deckbuild", player: "player1", mode: "newGame" };
  notify();
}

/** Gegner-Auswahl - Option "2 Spieler" (Hotseat): player2 bleibt/wird menschlich gesteuert und baut nach player1 wie gehabt sein eigenes Deck (unverändertes Verhalten). */
export function chooseOpponentHotseat(): void {
  setBotControlled("player2", false);
  appPhase = { kind: "deckbuild", player: "player1", mode: "newGame" };
  notify();
}

/** Aktuell gesammelte Deckliste eines Spielers (Vorbefüllung für den Deckbau-Screen). */
export function getDecklist(player: PlayerId): Record<string, number> {
  return decklists[player];
}

/** Ersetzt die Deckliste eines Spielers (z.B. nach +/- Klick oder "Zufällig füllen"). */
export function setDecklist(player: PlayerId, list: Record<string, number>): void {
  decklists = { ...decklists, [player]: list };
  notify();
}

/**
 * Sequenzieller Deckbau-Ablauf (Auftrag: "Spieler 1 baut zuerst, dann
 * Spieler 2, danach Spiel starten"): Nach player1 geht es weiter zu
 * player2; nach player2 wird direkt die Partie mit beiden gesammelten
 * Decklisten gestartet. Ruft KEINE Engine-Validierung auf - das Gate
 * (min. 40 Karten etc., siehe deckValidation.ts) ist reine UI-Logik, die der
 * Aufrufer (render.ts, "Weiter"/"Spiel starten"-Button) bereits vor dem
 * Enablen des Buttons geprüft hat.
 */
export function confirmDeck(player: PlayerId): void {
  // v0.1.8: Deck-Persistenz über Sessions hinweg - beim Bestätigen im
  // Deckbau-Screen wird die Deckliste zusätzlich in localStorage gesichert
  // (s. Abschnitt oben), damit sie einen Seiten-Reload übersteht. player2
  // wird bewusst NUR gespeichert, wenn er kein bot-gesteuertes Deck ist (ein
  // zufälliges KI-Deck ist keine "vom Nutzer gebaute" Deckliste, die es sich
  // lohnt für die nächste Session vorzubefüllen, s. Auftrag "gerne auch
  // Spieler 2 falls kein Bot").
  if (player === "player1" || !isBotControlled(player)) {
    saveDeckToLocalStorage(player, decklists[player]);
  }
  if (player === "player1") {
    appPhase = { kind: "deckbuild", player: "player2", mode: "newGame" };
    notify();
    return;
  }
  appPhase = { kind: "playing" };
  initGame(decklists.player1, decklists.player2);
}

/** Deckbau-Abkürzung: player2 übernimmt exakt die Deckliste von player1. */
export function copyDeckFromPlayer1(): void {
  setDecklist("player2", { ...decklists.player1 });
}

/**
 * "Zurück zum Hauptmenü" im laufenden Spiel/nach Spielende: zurück zum
 * echten Hauptmenü (`mainMenu`, s. types.ts#AppPhase) statt wie vor dem
 * "echtes Hauptmenü"-Umbau direkt in den player1-Deckbau-Screen zu springen
 * (der hieß diese Funktion vormals `backToDeckbuilder`) - und lange davor
 * (v0.1-v0.1.4) einfach die Seite neu zu laden. Die zuletzt benutzten
 * Decklisten UND die zuletzt gewählte Gegner-Einstellung
 * (botControlledPlayers/botDifficulty, s.u.) bleiben als Vorbefüllung
 * erhalten - ein erneutes "Neues Spiel" im Hauptmenü landet über
 * `opponentSelect` wieder beim gewohnten Ablauf.
 */
export function backToMainMenu(): void {
  // v0.1.11: Tutorial-Modus sauber verlassen (Auftrag Punkt 5, "verändert die
  // normale Partie nicht") - stellt player2s Bot-Einstellungen von VOR dem
  // Tutorial-Start wieder her (s. startTutorial unten), statt player2
  // dauerhaft auf bot-gesteuert/"medium" hängen zu lassen.
  if (tutorialActive) {
    tutorialActive = false;
    tutorialStepIndex = 0;
    tutorialPhase = "instruction";
    tutorialFactsSeen = new Set();
    tutorialSequenceFinished = false;
    tutorialLastBuffTarget = undefined;
    tutorialHelpOpen = false;
    if (preTutorialBotControlled !== undefined) setBotControlled("player2", preTutorialBotControlled);
    if (preTutorialBotDifficulty !== undefined) setBotDifficulty("player2", preTutorialBotDifficulty);
    preTutorialBotControlled = undefined;
    preTutorialBotDifficulty = undefined;
  }
  appPhase = { kind: "mainMenu" };
  // Keyword-Glossar-Popover/-Panel sind reine Anzeige-Overlays ohne
  // Spielstand-Bezug - beim Verlassen der Partie sauber schließen, damit sie
  // nicht unsichtbar "offen" in den nächsten Deckbau-Screen durchschlagen.
  openKeywordPopover = undefined;
  keywordGlossaryPanelOpen = false;
  musicPanelOpen = false;
  saveDeckFormOpen = false;
  loadDeckPanelOpen = false;
  stopBotLoop();
  notify();
}

// ---------------------------------------------------------------------------
// KI-Gegner (v0.1.7): welche Spieler werden von src/ai/simpleBot.ts#chooseAction
// gesteuert statt vom UI-Nutzer? Generisch als Set<PlayerId> (nicht fest auf
// player2), auch wenn der aktuelle Deckbau-Screen die Umschaltung nur für
// player2 anbietet (s. components/deckBuilder.ts) - ein künftiges "beide
// Spieler sind KI" (Bot-vs-Bot-Zuschauermodus) würde ohne weitere
// Store-Änderung funktionieren.
//
// Bewusst KEIN Teil des GameState (die Engine kennt keine "KI"-Spieler, s.
// docs/ai-status.md: chooseAction ist ein reiner externer Konsument) und
// bewusst KEIN eigener Typ in types.ts - analog zur v0.1.5-Entscheidung, den
// AppPhase-Zustand in store.ts "mitzuverwalten" statt einen zweiten
// Beobachter-Mechanismus einzuführen (s. docs/frontend-status.md).
//
// Persistenz-Entscheidung (Auftrag Punkt 5): bleibt über "Zurück zum
// Hauptmenü" (backToMainMenu) hinweg erhalten, exakt wie die gesammelten Decklisten
// (decklists oben) - wer einmal "Spieler 2 von KI steuern lassen" aktiviert
// hat, will das für die naechste Testpartie i.d.R. nicht jedes Mal neu
// anklicken. Nur ein frischer App-Start (Modul-Neuladen) setzt es zurück.
// ---------------------------------------------------------------------------

let botControlledPlayers: Set<PlayerId> = new Set();

export function isBotControlled(player: PlayerId): boolean {
  return botControlledPlayers.has(player);
}

export function setBotControlled(player: PlayerId, controlled: boolean): void {
  const next = new Set(botControlledPlayers);
  if (controlled) next.add(player);
  else next.delete(player);
  botControlledPlayers = next;
  notify();
}

// ---------------------------------------------------------------------------
// KI-Schwierigkeitsstufe (v0.1.9, docs/ai-status.md Abschnitt 9.8): pro
// Spieler unabhängig wählbar (aus src/ai/difficulty.ts#BOT_DIFFICULTIES),
// unabhängig davon, ob der Spieler gerade bot-gesteuert ist - der Wert wird
// nur GENUTZT, wenn isBotControlled(player) true ist (s. runBotStep unten),
// bleibt aber auch sonst gesetzt (z.B. schon gewählt, bevor der KI-Umschalter
// aktiviert wird). Persistenz-Entscheidung identisch zu botControlledPlayers
// oben: bleibt über "Zurück zum Hauptmenü" (backToMainMenu) hinweg erhalten, nur
// ein frischer App-Start (Modul-Neuladen) setzt auf DEFAULT_BOT_DIFFICULTY
// zurück.
// ---------------------------------------------------------------------------

let botDifficulty: Record<PlayerId, BotDifficulty> = {
  player1: DEFAULT_BOT_DIFFICULTY,
  player2: DEFAULT_BOT_DIFFICULTY,
};

export function getBotDifficulty(player: PlayerId): BotDifficulty {
  return botDifficulty[player];
}

export function setBotDifficulty(player: PlayerId, difficulty: BotDifficulty): void {
  botDifficulty = { ...botDifficulty, [player]: difficulty };
  notify();
}

// ---------------------------------------------------------------------------
// Tutorial-Modus (v0.1.11): alternativer Startpfad mit festen, kuratierten
// Decklisten (tutorialDeck.ts) + festem Seed statt des normalen Deckbau-
// Screens, Spieler 2 automatisch bot-gesteuert auf einer ruhigen Stufe
// ("medium" — die unveränderte v1-Heuristik, s. docs/ai-status.md; bewusst
// NICHT "easy", das laut ai-status.md ABSICHTLICH fehlerhaft/zufällig spielt
// und damit für ein Lern-Tutorial eher verwirrender wäre als ein ruhiges,
// vorhersehbares Mittelmaß; explizit NICHT "hard", s. Auftrag), plus
// Overlay-Erklärungen zu den Kernkonzepten (tutorialContent.ts). Verändert die
// normale Partie in keiner Weise — reiner zusätzlicher UI-Zustand + ein
// alternativer initGame()-Aufruf mit anderen Anfangsbedingungen, exakt wie
// jeder andere Partiestart auch.
// ---------------------------------------------------------------------------

const TUTORIAL_BOT_DIFFICULTY: BotDifficulty = "medium";

let tutorialActive = false;
let tutorialHelpOpen = false;

// ---------------------------------------------------------------------------
// Geführte Schritt-Sequenz (v0.1.16, siehe tutorialContent.ts für die
// ausführliche Erklärung des Gesamtkonzepts). Statt lose, einmalig
// auftretender Info-Sprechblasen (v0.1.11-v0.1.15) läuft das Tutorial jetzt
// eine feste Sequenz von `TUTORIAL_STEPS` durch: Instruktion (nicht-modales
// Banner bei Aktions-Schritten, s. `isTutorialModalBubbleShowing` unten) ->
// erwartete Aktion -> Bestätigung (modale Sprechblase) -> nächste Instruktion.
//
// `tutorialFactsSeen` ist bewusst NICHT auf den aktuell aktiven Schritt
// beschränkt: `recomputeTutorialProgress` prüft nach JEDER Aktion `detect`
// für ALLE Schritte (nicht nur den aktiven) und merkt Treffer dauerhaft. Holt
// die Sequenz später einen Schritt ein, dessen Fakt schon vorliegt (z.B. weil
// der Spieler ihn "zufällig früh" erfüllt hat, oder weil der Bot-Gegner
// bereits vor dem eigenen ersten Angriff angegriffen hat und geblockt wurde),
// wird sofort dessen Bestätigung gezeigt statt erneut zu warten - siehe
// tutorialContent.ts-Dateikommentar für die ausführliche Begründung
// (Mana-Kurve/Bot-Verhalten machen die reale Reihenfolge unvorhersehbar).
// ---------------------------------------------------------------------------

let tutorialStepIndex = 0;
let tutorialPhase: "instruction" | "confirmation" = "instruction";
let tutorialFactsSeen: Set<string> = new Set();
/** true, sobald der letzte Schritt ("complete") bestätigt/übersprungen wurde - danach erscheint keine Bubble mehr. */
let tutorialSequenceFinished = false;
/** Zuletzt per Verstärkungszauber (`castBuffSpell`) bezogene eigene Kreatur - fürs Hervorheben während der Bestätigung. */
let tutorialLastBuffTarget: InstanceId | undefined;

// Vorherige Bot-Einstellungen von player2, um sie beim Verlassen des Tutorials
// wiederherzustellen (s. backToMainMenu unten) - das Tutorial soll die
// normale Partie/den normalen Deckbau NICHT dauerhaft verändern (Auftrag
// Punkt 5), auch nicht "Spieler 2 war vorher NICHT bot-gesteuert".
let preTutorialBotControlled: boolean | undefined;
let preTutorialBotDifficulty: BotDifficulty | undefined;

export function isTutorialActive(): boolean {
  return tutorialActive;
}

/** Der aktuell aktive Schritt der Sequenz - `undefined`, wenn das Tutorial inaktiv/durchgelaufen ist. */
export function getTutorialActiveStep(): TutorialStep | undefined {
  if (!tutorialActive || tutorialSequenceFinished) return undefined;
  return TUTORIAL_STEPS[tutorialStepIndex];
}

/** "instruction" (wartet auf die erwartete Aktion) oder "confirmation" (Aktion erkannt, wartet auf "Weiter"). */
export function getTutorialPhase(): "instruction" | "confirmation" {
  return tutorialPhase;
}

/**
 * true, wenn GERADE eine modale Sprechblase gezeigt werden soll (Bestätigung
 * eines Aktions-Schritts ODER die einzige Blase eines bereits erreichten
 * Info-Schritts) - der automatische Bot-Zug-Loop pausiert NUR in diesem Fall
 * (s. scheduleBotStepIfNeeded unten), NICHT während der nicht-modalen
 * Instruktions-Phase eines Aktions-Schritts (die kann sich laut Auftrag über
 * mehrere Züge des Gegners hinziehen, z.B. `declareBlock` - ein Pausieren des
 * Bots wäre dort ein Deadlock, da der Bot ja gerade selbst an der Reihe sein
 * müsste, damit der erwartete Moment überhaupt eintritt).
 */
function isTutorialModalBubbleShowing(): boolean {
  const step = getTutorialActiveStep();
  if (!step) return false;
  if (step.infoOnly) return tutorialFactsSeen.has(step.id);
  return tutorialPhase === "confirmation";
}

/** Für render.ts: siehe `isTutorialModalBubbleShowing` - gleiche Bedingung, öffentlich gemacht. */
export function isTutorialBubbleVisible(): boolean {
  return isTutorialModalBubbleShowing();
}

function resetTutorialStepEntry(): void {
  tutorialPhase = "instruction";
  const step = getTutorialActiveStep();
  // Rückwirkende Erledigung (s. Dateikommentar tutorialContent.ts): der Fakt
  // dieses Schritts liegt evtl. schon vor (z.B. weil der Bot-Gegner früher als
  // erwartet angegriffen hat und geblockt wurde) - dann sofort die
  // Bestätigung zeigen statt erneut zu warten.
  if (step && !step.infoOnly && tutorialFactsSeen.has(step.id)) {
    tutorialPhase = "confirmation";
  }
}

/** Schließt die aktuell gezeigte Bubble (Bestätigung ODER Info-Schritt) und rückt die Sequenz einen Schritt weiter. */
export function dismissTutorialBubble(): void {
  if (!tutorialActive || tutorialSequenceFinished) return;
  if (!isTutorialModalBubbleShowing()) return;
  advanceTutorialStep();
}

/**
 * Sicherheitsnetz (Auftrag: "ein Schritt-überspringen-Link sollte immer
 * verfügbar bleiben") - rückt die Sequenz weiter, UNABHÄNGIG davon, ob die
 * erwartete Aktion je erkannt wurde. Anders als `dismissTutorialBubble` auch
 * nutzbar, während gerade nur die nicht-modale Instruktion (noch keine
 * Bestätigung) angezeigt wird.
 */
export function skipTutorialStep(): void {
  if (!tutorialActive || tutorialSequenceFinished) return;
  advanceTutorialStep();
}

function advanceTutorialStep(): void {
  if (tutorialStepIndex >= TUTORIAL_STEPS.length - 1) {
    tutorialSequenceFinished = true;
    notify();
    triggerAutomation();
    return;
  }
  tutorialStepIndex += 1;
  resetTutorialStepEntry();
  notify();
  // Der Automatik-Loop (Bot-Züge UND automatische Menschen-Pässe, s.
  // triggerAutomation unten) pausiert nur während einer modalen Bubble (s.o.)
  // - nach dem Weiterrücken ggf. weiterspielen lassen.
  triggerAutomation();
}

export function isTutorialHelpOpen(): boolean {
  return tutorialHelpOpen;
}

export function toggleTutorialHelp(): void {
  tutorialHelpOpen = !tutorialHelpOpen;
  notify();
}

export function closeTutorialHelp(): void {
  tutorialHelpOpen = false;
  notify();
}

/** Beschreibt, WAS gerade visuell hervorgehoben werden soll (Karte in der Hand, eigene Terrains, eine konkrete Permanent-Instanz) - reine Anzeige-Ableitung für render.ts, siehe tutorialContent.ts. */
export interface TutorialHighlight {
  handCardDefinitionIds?: readonly string[];
  ownUntappedTerrain?: boolean;
  permanentInstanceId?: InstanceId;
}

export function getTutorialHighlight(): TutorialHighlight | undefined {
  const step = getTutorialActiveStep();
  if (!step) return undefined;
  if (step.id === "castBuffSpell" && tutorialPhase === "confirmation" && tutorialLastBuffTarget) {
    return { permanentInstanceId: tutorialLastBuffTarget };
  }
  if (step.infoOnly || tutorialPhase === "confirmation") return undefined;
  if (step.id === "tapForMana") return { ownUntappedTerrain: true };
  const handIds = TUTORIAL_STEP_HAND_CARD_IDS[step.id];
  return handIds ? { handCardDefinitionIds: handIds } : undefined;
}

/**
 * Bug/Auftrag "Tutorial-Terrain-Sackgasse" (s. tutorialContent.ts#TutorialStep
 * ["mainPhaseOnly"] für die ausführliche Begründung): solange der aktive
 * Tutorial-Schritt `mainPhaseOnly` ist, noch nicht erledigt ist (Phase
 * "instruction") UND player1 GERADE eine dazu passende Kandidatenaktion zur
 * Verfügung hat (aus `legalActions`, keine eigene Legalitätsprüfung - reine
 * Wiedererkennung wie überall sonst in diesem Store), liefert diese Funktion
 * einen Hinweistext statt `undefined` - render.ts sperrt den "Priorität
 * passen"-Button dann genau in diesem Moment (mit dem Text als Tooltip), statt
 * den Spieler unbemerkt aus der Hauptphase (und damit aus der einzig legalen
 * Gelegenheit für diese Aktion) heraus passen zu lassen.
 *
 * Bewusst NUR für player1 (die vom Tutorial geführte, lokale/menschliche
 * Sicht, s. store.ts#startTutorial) - der Bot-Zug-Loop nutzt diesen Button
 * ohnehin nie (er dispatcht automatisiert direkt, s. runBotStep).
 */
export function getTutorialPassPriorityBlockReason(player: PlayerId): string | undefined {
  if (!tutorialActive || tutorialSequenceFinished || player !== "player1") return undefined;
  const step = getTutorialActiveStep();
  if (!step || !step.mainPhaseOnly || tutorialPhase !== "instruction") return undefined;

  const hasPendingCandidate = legalActions(player).some((action) => {
    if (step.id === "playTerrain") return action.kind === "playTerrain";
    if (step.id === "castCreature") {
      if (action.kind !== "castSpell") return false;
      const card = state.cards[action.cardInstanceId];
      const def = card ? pool[card.definitionId] : undefined;
      return def?.type === "unit";
    }
    return false;
  });
  if (!hasPendingCandidate) return undefined;

  return "Schließt zuerst diesen Tutorial-Schritt ab (siehe Anweisung oben) oder überspringt ihn, bevor ihr die Hauptphase verlasst.";
}

/**
 * Prüft nach JEDER Zustandsänderung während einer Tutorial-Partie (menschliche
 * Aktion, automatischer Bot-Zug, `initGame`), welche der in tutorialContent.ts
 * beschriebenen Schritt-Fakten gerade eingetreten sind (ALLE Schritte, nicht
 * nur der aktive - siehe dortiger Dateikommentar), merkt sie dauerhaft und
 * schaltet den aktiven Schritt ggf. von "instruction" auf "confirmation".
 * Reine UI-Ableitung aus dem bereits vorhandenen `GameState`/der ausgeführten
 * `PlayerAction` (delegiert die eigentliche Erkennung an `step.detect`) -
 * keine eigene Regellogik, exakt wie die frühere `maybeQueueTutorialTips`.
 */
function maybeAdvanceTutorialProgress(action: PlayerAction | undefined): void {
  if (!tutorialActive || tutorialSequenceFinished) return;
  const ctx = { state, action, pool };

  for (const step of TUTORIAL_STEPS) {
    if (tutorialFactsSeen.has(step.id)) continue;
    if (!step.detect(ctx)) continue;
    tutorialFactsSeen.add(step.id);
    if (step.id === "castBuffSpell" && action?.kind === "castSpell") {
      const target = action.chosenTargets[0];
      if (target?.kind === "permanent") tutorialLastBuffTarget = target.instanceId;
    }
  }

  // Vorzeitiges Spielende: direkt zum Sieg-/Niederlage-Schritt springen, statt
  // weiter auf einen inzwischen unerreichbaren Zwischenschritt zu warten.
  if (state.winner !== undefined && tutorialStepIndex < tutorialStepIndexOf("winCondition")) {
    tutorialStepIndex = tutorialStepIndexOf("winCondition");
    resetTutorialStepEntry();
    return;
  }

  const activeStep = TUTORIAL_STEPS[tutorialStepIndex];
  if (activeStep && !activeStep.infoOnly && tutorialPhase === "instruction" && tutorialFactsSeen.has(activeStep.id)) {
    tutorialPhase = "confirmation";
  }
}

/**
 * Startet die Tutorial-Partie (Auftrag Punkt 1+2): überspringt den normalen
 * Deckbau-Screen komplett, nutzt die festen Decklisten/den festen Seed aus
 * tutorialDeck.ts, markiert Spieler 2 als bot-gesteuert (ruhige Stufe, s.o.)
 * und setzt den Tutorial-UI-Zustand zurück (frischer Durchlauf zeigt alle
 * Sprechblasen erneut, auch bei wiederholtem Start).
 */
export function startTutorial(): void {
  stopBotLoop();
  preTutorialBotControlled = isBotControlled("player2");
  preTutorialBotDifficulty = getBotDifficulty("player2");
  tutorialActive = true;
  tutorialStepIndex = 0;
  tutorialPhase = "instruction";
  tutorialFactsSeen = new Set();
  tutorialSequenceFinished = false;
  tutorialLastBuffTarget = undefined;
  tutorialHelpOpen = false;
  setBotControlled("player2", true);
  setBotDifficulty("player2", TUTORIAL_BOT_DIFFICULTY);
  appPhase = { kind: "playing" };
  // Auftrag (Tutorial-Verwirrung): player1 (Mensch) beginnt IMMER, statt per
  // Münzwurf ggf. player2 (Bot) den ersten kompletten Zug spielen zu lassen,
  // während der Mensch nur "Priorität passen" klicken kann - genau NUR hier
  // im Tutorial-Pfad; echte Partien (initGame ohne diesen Parameter, s.o.)
  // bleiben zufällig.
  initGame(TUTORIAL_DECK_PLAYER1, TUTORIAL_DECK_PLAYER2, TUTORIAL_SEED, "player1");
}

/**
 * Bestimmt, welcher Spieler gerade tatsächlich handeln muss (Priority, eine
 * an ihn gerichtete PendingDecision, oder eine fällige Combat-/Cleanup-
 * Turn-Based-Action ohne Priority-Fenster) - exakt dieselbe Fallunter-
 * scheidung, die render.ts#autoEnterForcedModes für die UI-Modus-Wahl trifft
 * und die src/ai/__tests__/simpleBot.test.ts#actingPlayer für die
 * Bot-vs-Bot-Simulation verwendet (siehe docs/ai-status.md, "Nutzungsvertrag").
 * `undefined`, wenn niemand handeln muss (z.B. Spielende).
 */
function actingPlayer(s: GameState): PlayerId | undefined {
  if (s.winner !== undefined) return undefined;
  if (s.pendingDecision) return s.pendingDecision.player;
  if (s.priorityPlayer) return s.priorityPlayer;
  if (s.step === "declareAttackers") return s.activePlayer;
  if (s.step === "declareBlockers") return otherPlayerId(s.activePlayer);
  if (s.step === "cleanup" && s.players[s.activePlayer].hand.length > 7) return s.activePlayer;
  return undefined;
}

function otherPlayerId(p: PlayerId): PlayerId {
  return p === "player1" ? "player2" : "player1";
}

/**
 * Verzögerung zwischen zwei automatischen KI-Zügen (Millisekunden). Bewusst
 * > 0 im normalen Betrieb, damit man dem Bot beim Spielen "zusehen" kann
 * (jeder Schritt löst einen eigenen notify()/render()-Aufruf aus, s.u.) -
 * ohne Verzögerung würde ein kompletter Bot-Zug (mehrere Aktionen) innerhalb
 * eines einzigen JS-Ticks laufen und im Browser nie sichtbar zwischengerendert
 * werden. `setBotMoveDelayMs` ist für Tests gedacht (dort auf 0 gesetzt, s.
 * src/ui/__tests__), damit Testläufe nicht auf echte Wartezeiten angewiesen
 * sind - genau DIESE Test-Aufrufstelle/Signatur bleibt unverändert, Tests
 * rufen sie direkt nach dem Store-Import auf und müssen unabhängig vom
 * Preset-Mechanismus unten weiter gewinnen (s. `botMoveDelayMs` als einzige
 * "scharfe" interne Variable).
 *
 * Nutzer-Feedback (v0.1.19, "Spielzüge des Computers sind zu schnell ... ein
 * Mensch hat kaum Chancen, das zu sehen und nachzuvollziehen"): der bisherige
 * Fixwert (320ms) ist jetzt einer von drei über `botSpeedPreset`
 * (s.u.) wählbaren Presets statt eines hartkodierten Werts - "normal" ist der
 * NEUE Standard (900ms, deutlich langsamer als bisher), "schnell" bleibt nah
 * am bisherigen Verhalten. Untergrenze bleibt in jedem Preset bewusst etwas
 * über der View-Transition-Standarddauer (s. render.ts#render/style.css,
 * ~250-260ms) - jeder Bot-Schritt löst über `notify()` einen eigenen
 * `render()`-Aufruf (und damit ggf. eine eigene View Transition) aus; würde
 * der nächste Schritt VOR Abschluss der vorherigen Animation starten, würde
 * deren Übergang mitten in der Bewegung "geskippt" (der Browser bricht eine
 * laufende View Transition beim nächsten `startViewTransition()`-Aufruf
 * sofort ab). Nach oben gibt es keine harte Grenze.
 */
let botMoveDelayMs = 320;

export function setBotMoveDelayMs(ms: number): void {
  botMoveDelayMs = Math.max(0, ms);
}

// ---------------------------------------------------------------------------
// Bot-Geschwindigkeits-Preset (persistiert, analog zu `musicEnabled` weiter
// oben): reine Nutzer-Präferenz, WIE die interne `botMoveDelayMs`-Variable
// oben befüllt wird - der Setter unten ruft intern immer nur
// `setBotMoveDelayMs()` auf, sodass der bestehende Test-Override-Pfad
// (`setBotMoveDelayMs(0)` NACH dem Store-Import) unverändert weiter
// funktioniert und gewinnt, egal welches Preset zuvor/danach aktiv war.
// ---------------------------------------------------------------------------

export type BotSpeedPreset = "fast" | "normal" | "slow";

const BOT_SPEED_DELAYS_MS: Record<BotSpeedPreset, number> = {
  fast: 350,
  normal: 900,
  slow: 1800,
};

export const BOT_SPEED_LABELS: Record<BotSpeedPreset, string> = {
  fast: "Schnell",
  normal: "Normal",
  slow: "Langsam",
};

const BOT_SPEED_STORAGE_KEY = "deckbuilder1.botSpeed";

/** Defensiv wie loadMusicEnabledFromLocalStorage: fehlt/ist ungültig der gespeicherte Wert, startet die Bot-Geschwindigkeit standardmäßig bei "normal" (s.o., neuer langsamerer Standard). */
function loadBotSpeedPresetFromLocalStorage(): BotSpeedPreset {
  try {
    const raw = window.localStorage.getItem(BOT_SPEED_STORAGE_KEY);
    return raw === "fast" || raw === "normal" || raw === "slow" ? raw : "normal";
  } catch {
    return "normal";
  }
}

function saveBotSpeedPresetToLocalStorage(preset: BotSpeedPreset): void {
  try {
    window.localStorage.setItem(BOT_SPEED_STORAGE_KEY, preset);
  } catch {
    // localStorage nicht verfügbar/voll/deaktiviert - einfach ignorieren (s.o.).
  }
}

let botSpeedPreset: BotSpeedPreset = loadBotSpeedPresetFromLocalStorage();
// Init (Auftrag Punkt 4): der persistierte Wert muss auch tatsächlich als
// scharfe Verzögerung angewendet werden, nicht nur beim späteren Umschalten
// im Panel - direkter Aufruf des bestehenden Setters beim Modul-Load. Tests
// rufen `setBotMoveDelayMs(0)` explizit NACH diesem Import auf (s.
// tutorial.test.ts/vs-bot.test.ts/vs-bot-difficulty.test.ts) und überschreiben
// diesen Init-Wert damit zuverlässig wieder.
setBotMoveDelayMs(BOT_SPEED_DELAYS_MS[botSpeedPreset]);

let botSpeedPanelOpen = false;

/** Aktuell gewähltes Bot-Geschwindigkeits-Preset (persistiert über Sessions hinweg, s.o.). */
export function getBotSpeedPreset(): BotSpeedPreset {
  return botSpeedPreset;
}

/** Auswahl im Bot-Geschwindigkeits-Panel (s. components/botSpeedPanel.ts) - wirkt sofort auf den NÄCHSTEN geplanten Bot-Schritt (setTimeout mit dem neuen Wert, s. scheduleBotStepIfNeeded unten). */
export function setBotSpeedPreset(preset: BotSpeedPreset): void {
  botSpeedPreset = preset;
  saveBotSpeedPresetToLocalStorage(preset);
  setBotMoveDelayMs(BOT_SPEED_DELAYS_MS[preset]);
  notify();
}

/** Bot-Geschwindigkeits-Panel (analog zu isMusicPanelOpen oben) - während einer laufenden Partie jederzeit erreichbar, s. render.ts#statusBar. */
export function isBotSpeedPanelOpen(): boolean {
  return botSpeedPanelOpen;
}

export function toggleBotSpeedPanel(): void {
  botSpeedPanelOpen = !botSpeedPanelOpen;
  notify();
}

export function closeBotSpeedPanel(): void {
  botSpeedPanelOpen = false;
  notify();
}

let botTimer: ReturnType<typeof setTimeout> | undefined;

/** true, solange ein automatischer KI-Zug geplant/aussteht ist - für Tests, um auf "Bot ist fertig" zu warten. */
export function isBotThinking(): boolean {
  return botTimer !== undefined;
}

function stopBotLoop(): void {
  if (botTimer !== undefined) {
    clearTimeout(botTimer);
    botTimer = undefined;
  }
}

/**
 * Sicherheitslimit pro "Zyklus" (ab einer menschlichen dispatch()-Aktion bzw.
 * ab initGame() gezählt, s. triggerAutomation) - analog zum 2000er-Aktionslimit
 * der Bot-vs-Bot-Tests (src/ai/__tests__/simpleBot.test.ts), hier niedriger
 * angesetzt, weil pro Zyklus nur EIN Spieler automatisch zieht (der andere
 * ist ja der Mensch, der gerade erst gehandelt hat). Verhindert eine
 * Endlosschleife, falls chooseAction/getLegalActions/applyAction jemals in
 * einen Zustand geraten sollten, der nie wieder beim Menschen landet.
 */
const MAX_BOT_ACTIONS_PER_CYCLE = 1000;
let botCycleGuard = 0;

/**
 * Sicherheitslimit für AUFEINANDERFOLGENDE automatische Menschen-"Pässe" pro
 * Zyklus (s. autoResolvableActionFor/applyAutomaticAction unten) - exakt
 * dasselbe Muster wie MAX_BOT_ACTIONS_PER_CYCLE oben, nur für den neuen
 * "automatisch entscheiden, wenn's keine echte Wahl gibt"-Pfad (Auftrag Teil
 * 1+2). Getrennter Zähler, weil beide Mechanismen unabhängig voneinander
 * (auch abwechselnd) laufen können und je EIGENEN Zyklus ab der letzten
 * echten menschlichen Aktion zählen sollen.
 */
const MAX_AUTO_HUMAN_ACTIONS_PER_CYCLE = 1000;
let autoHumanCycleGuard = 0;

/** Wird nach jeder erfolgreichen menschlichen Aktion (dispatch), nach initGame() UND (mit unverändertem Zähler-Stand) nach jedem automatischen Bot-/Auto-Pass-Schritt selbst aufgerufen - s. triggerAutomation/advanceAutomation unten. */
function triggerAutomation(): void {
  botCycleGuard = 0;
  autoHumanCycleGuard = 0;
  advanceAutomation();
}

/**
 * Gemeinsamer "Nachbrenner" für ZWEI unabhängige Automatik-Mechanismen, die
 * beide dasselbe Ziel haben (kein unnötiger Klick, wo es ohnehin keine echte
 * Wahl gibt):
 * - Bot-gesteuerte Spieler (bestehendes Verhalten, s. scheduleBotStepIfNeeded/
 *   runBotStep): ein ganzer automatischer Zug läuft mit sichtbarer Verzögerung
 *   (botMoveDelayMs) über echte setTimeout()-Ticks.
 * - NICHT-bot-gesteuerte (menschliche/hotseat) Spieler (NEU, Auftrag Teil
 *   1+2): steht laut `legalActions` gerade GAR KEINE echte Alternative zur
 *   Verfügung (nur `passPriority`/`concede`, bzw. beim erzwungenen Kampf-
 *   Deklarationsschritt nur die leere Deklaration), wird diese einzige
 *   sinnvolle Aktion SOFORT synchron ausgelöst (kein Timer, kein Klick nötig)
 *   - s. autoResolvableActionFor/applyAutomaticAction unten.
 * Wird rekursiv über applyAutomaticAction/runBotStep erneut aufgerufen, bis
 * entweder niemand mehr handeln muss, ein bot-gesteuerter Spieler in seinen
 * (asynchronen) Timer-Loop übergeben wurde, oder ein Spieler tatsächlich eine
 * echte Entscheidung treffen muss (dann bleibt es hier stehen).
 */
function advanceAutomation(): void {
  // v0.1.16: Solange eine MODALE Tutorial-Sprechblase aussteht, pausiert JEDE
  // Automatik (Bot UND Auto-Pass) - sonst würde sich das Board unter der
  // gerade gelesenen Erklärung weiterbewegen (s. dismissTutorialBubble/
  // skipTutorialStep oben, die triggerAutomation() nach dem Weiterrücken
  // erneut anstoßen). Die nicht-modale Instruktions-Phase eines Aktions-
  // Schritts pausiert NICHTS (s. isTutorialModalBubbleShowing-Kommentar).
  if (isTutorialModalBubbleShowing()) return;
  const actor = actingPlayer(state);
  if (!actor) return;
  if (isBotControlled(actor)) {
    scheduleBotStepIfNeeded();
    return;
  }
  if (autoHumanCycleGuard >= MAX_AUTO_HUMAN_ACTIONS_PER_CYCLE) {
    // eslint-disable-next-line no-console
    console.error(
      `Auto-Pass-Sicherheitslimit erreicht (${MAX_AUTO_HUMAN_ACTIONS_PER_CYCLE} automatische Aktionen ohne echte ` +
        "menschliche Zwischenaktion) - automatisches Weiterspielen angehalten. Das ist ein Hinweis auf einen Bug, kein normaler Spielverlauf.",
    );
    return;
  }
  const auto = autoResolvableActionFor(actor);
  if (!auto) return; // echte Entscheidung nötig - hier stehenbleiben, s. render.ts
  autoHumanCycleGuard++;
  applyAutomaticAction(auto);
}

/**
 * Liefert die einzige tatsächlich sinnvolle Aktion für `player` GENAU DANN,
 * wenn `legalActions(player)` gerade keine echte Wahl anbietet - `undefined`,
 * sobald mindestens eine echte Alternative existiert (dann muss der Spieler
 * selbst entscheiden). Deckt die zwei in Auftrag Teil 1+2 beschriebenen Fälle
 * ab, beide rein über bereits vorhandene Engine-Anfragen (legalActions) ohne
 * eigene Regellogik:
 *
 * - Priority-Fenster: `hasRealPriorityChoice(player)` (s.u.) ist `false` ->
 *   automatisch passen. Das ist NICHT gleichbedeutend mit "`legalActions`
 *   enthält NUR passPriority/concede" - reine Mana-Fähigkeiten (Terrain fürs
 *   Mana antippen, `isManaAbility: true`) zählen bewusst NICHT als echte Wahl
 *   (Bugfix: Terrains bieten diese Fähigkeit praktisch immer an, auch wenn
 *   der Spieler nichts hat, wofür sich das Mana lohnen würde - s. Kommentar
 *   an hasRealPriorityChoice). Das bestehende Tutorial-Blocking
 *   (getTutorialPassPriorityBlockReason) bleibt unangetastet wirksam - es
 *   greift laut seinem eigenen Kommentar NUR dann, wenn der Spieler eine
 *   passende Kandidatenaktion (playTerrain/castSpell einer Kreatur)
 *   tatsächlich zur Verfügung hat; genau dann liefert hasRealPriorityChoice
 *   bereits `true`, und diese Funktion liefert schon deshalb `undefined`
 *   (keine Automatik, Button bleibt sichtbar/gesperrt wie bisher).
 * - erzwungener Kampf-Deklarationsschritt (declareAttackers/declareBlockers,
 *   kein Priority-Fenster): `combatCandidates` (engine/legal-actions.ts)
 *   liefert GENAU EINEN Kandidaten (die leere Deklaration), wenn keine
 *   einzige eigene Einheit überhaupt als Angreifer/Blocker infrage kommt.
 *   Liefert die Engine dagegen GAR KEINEN Kandidaten (guardian-Mehrfachblock-
 *   Sonderfall, s. legal-actions.ts-Dateikommentar), ist das bewusst KEINE
 *   automatisch lösbare Situation (eine echte, nur nicht enumerierbare
 *   Entscheidung) - hier wird NICHT automatisch entschieden.
 */
function autoResolvableActionFor(player: PlayerId): PlayerAction | undefined {
  if (isBotControlled(player)) return undefined;
  if (state.pendingDecision) return undefined; // Mulligan/chooseMode/orderBlockers/Zielwahl: nie automatisch
  if (state.priorityPlayer === player) {
    return hasRealPriorityChoice(player) ? undefined : { kind: "passPriority", player };
  }
  if (state.step === "declareAttackers" && state.activePlayer === player) {
    const attackerActions = legalActions(player).filter(
      (a): a is Extract<PlayerAction, { kind: "declareAttackers" }> => a.kind === "declareAttackers",
    );
    if (attackerActions.length === 1 && attackerActions[0]!.attackers.length === 0) {
      return { kind: "declareAttackers", player, attackers: [] };
    }
    return undefined;
  }
  if (state.step === "declareBlockers" && otherPlayerId(state.activePlayer) === player) {
    const blockerActions = legalActions(player).filter(
      (a): a is Extract<PlayerAction, { kind: "declareBlockers" }> => a.kind === "declareBlockers",
    );
    if (blockerActions.length === 1 && blockerActions[0]!.blocks.length === 0) {
      return { kind: "declareBlockers", player, blocks: [] };
    }
    return undefined;
  }
  return undefined;
}

/**
 * Wendet eine der oben erkannten, automatisch entscheidbaren Aktionen an -
 * strukturell identisch zu `dispatch`/`runBotStep` (gleiche Events-/Log-/SFX-/
 * Tutorial-Fortschritt-Behandlung), ruft am Ende aber `advanceAutomation()`
 * statt `triggerAutomation()` auf: die Sicherheitszähler dürfen NICHT
 * zurückgesetzt werden, sie zählen laut Auftrag "ab der letzten ECHTEN
 * menschlichen Aktion".
 */
function applyAutomaticAction(action: PlayerAction): void {
  const result = engine.applyAction(state, action);
  if (result.error) {
    // Sollte laut Konstruktion nie eintreten (autoResolvableActionFor liefert
    // ausschließlich von legalActions gelieferte Kandidaten) - reines
    // Sicherheitsnetz analog zu runBotStep unten.
    lastError = result.error;
    // eslint-disable-next-line no-console
    console.error(`Automatische Aktion wurde von der Engine abgelehnt (sollte nicht vorkommen): ${result.error}`);
    notify();
    return;
  }
  lastError = undefined;
  state = result.state;
  uiMode = { kind: "idle" };
  const suppressCardDrawn = batchContainsMulligan(result.events);
  processEvents(result.events, { suppressCardDrawn });
  maybeAdvanceTutorialProgress(action);
  notify();
  advanceAutomation();
}

function scheduleBotStepIfNeeded(): void {
  if (botTimer !== undefined) return; // schon ein Schritt geplant
  // v0.1.16: Solange eine MODALE Tutorial-Sprechblase aussteht, pausiert der
  // automatische Bot-Zug-Loop (s. dismissTutorialBubble/skipTutorialStep
  // oben, die ihn nach dem Weiterrücken wieder anstoßen) - sonst würde sich
  // das Board unter der gerade gelesenen Erklärung weiterbewegen. Die
  // nicht-modale Instruktions-Phase eines Aktions-Schritts pausiert den Bot
  // bewusst NICHT (s. isTutorialModalBubbleShowing-Kommentar).
  if (isTutorialModalBubbleShowing()) return;
  const actor = actingPlayer(state);
  if (!actor || !isBotControlled(actor)) return;
  if (botCycleGuard >= MAX_BOT_ACTIONS_PER_CYCLE) {
    // eslint-disable-next-line no-console
    console.error(
      `KI-Sicherheitslimit erreicht (${MAX_BOT_ACTIONS_PER_CYCLE} automatische Aktionen ohne menschliche ` +
        "Zwischenaktion) - automatisches Spielen angehalten. Das ist ein Hinweis auf einen Bug, kein normaler Spielverlauf.",
    );
    return;
  }
  botTimer = setTimeout(runBotStep, botMoveDelayMs);
}

/**
 * Führt EINEN automatischen KI-Zug aus (`chooseActionForDifficulty` +
 * `applyAction`, siehe src/ai/difficulty.ts - **seit v0.1.9** stufenabhängig
 * über `botDifficulty[actor]` statt immer der v1-Heuristik `chooseAction`,
 * s. Abschnitt oben) und plant danach - falls weiterhin ein bot-gesteuerter
 * Spieler am Zug ist - den nächsten Schritt. `notify()` läuft nach JEDEM
 * einzelnen Schritt (nicht erst am Ende), damit render() den Spielstand nach
 * jedem Bot-Zug aktualisiert (Auftrag Punkt 3: "man kann dem Bot beim Spielen
 * zusehen").
 */
function runBotStep(): void {
  botTimer = undefined;
  const actor = actingPlayer(state);
  if (!actor || !isBotControlled(actor)) return;
  botCycleGuard++;

  const action = chooseActionForDifficulty(engine, pool, state, actor, botDifficulty[actor]);
  const result = engine.applyAction(state, action);
  if (result.error) {
    // Laut docs/ai-status.md sollte chooseAction NIE eine illegale Aktion
    // liefern - dieser Zweig ist ein reines Sicherheitsnetz (kein stiller
    // Endlosversuch derselben Aktion, kein Absturz), kein erwarteter Pfad.
    lastError = result.error;
    // eslint-disable-next-line no-console
    console.error(`KI-Aktion wurde von der Engine abgelehnt (sollte laut Bot-Vertrag nicht vorkommen): ${result.error}`);
    notify();
    return;
  }
  lastError = undefined;
  state = result.state;
  uiMode = { kind: "idle" };
  const suppressCardDrawn = batchContainsMulligan(result.events);
  processEvents(result.events, { suppressCardDrawn });
  maybeAdvanceTutorialProgress(action);
  notify();
  // v0.1.18 (Auftrag Teil 1+2): nicht mehr nur den nächsten Bot-Schritt
  // planen, sondern advanceAutomation() - deckt zusätzlich den Fall ab, dass
  // NACH diesem Bot-Zug ein NICHT-bot-gesteuerter Spieler an der Reihe ist,
  // dessen Priority-/Kampf-Deklarationsfenster gerade keine echte Wahl bietet
  // (dann automatisch weiter, ohne auf einen Klick zu warten). Bewusst NICHT
  // triggerAutomation() (das würde die Sicherheitszähler zurücksetzen - hier
  // handelt es sich um eine Fortsetzung desselben automatischen Zyklus, nicht
  // um eine neue echte menschliche Aktion).
  advanceAutomation();
}

/**
 * Kartenname zu einer InstanceId, defensiv: `cardDef` wirft bei unbekannter
 * InstanceId (s. cardInfo.ts) - kann in Randfällen passieren, wenn ein Event
 * sich auf eine inzwischen endgültig verschwundene Karte bezieht (z.B. ein
 * Token, das per removeTokenPermanently sofort aus state.cards gelöscht
 * wurde, s. engine/zones.ts). Reine Log-/Anzeigehilfe, keine Legalitätslogik.
 */
function cardNameFor(instanceId: InstanceId): string {
  try {
    return cardDef(pool, state, instanceId).name;
  } catch {
    return "eine Karte";
  }
}

/** Wie cardNameFor, aber gibt zusätzlich den Controller zurück (für "X castet Y"-Sätze), falls die Instanz noch bekannt ist. */
function controllerOf(instanceId: InstanceId): PlayerId | undefined {
  return state.cards[instanceId]?.controller;
}

/** `damageDealt.to` ist entweder ein Spieler (Literal "player1"/"player2") oder eine InstanceId - hier textuell aufgelöst. */
function describeDamageTarget(to: InstanceId | PlayerId): string {
  if (to === "player1" || to === "player2") return to;
  return cardNameFor(to);
}

/**
 * Übersetzt ein GameEvent in eine lesbare Log-Zeile (s. Nutzer-Auftrag
 * "Nachvollziehbarkeit von KI-Spielzügen") - reine Textaufbereitung anhand
 * bereits vorhandener Event-Felder (cardInstanceId/sourceInstanceId/...), KEINE
 * neue Regel-/Legalitätslogik. `cardDrawn` bleibt bewusst UNVERÄNDERT ohne
 * Kartennamen (der Inhalt einer gezogenen Karte ist Information über die
 * verdeckte Hand des jeweils ANDEREN Spielers, deren Offenlegung im Log ein
 * Informationsleck wäre, kein Feature). `permanentTapped`/`permanentUntapped`/
 * `countersChanged` bleiben ebenfalls bewusst ohne eigene Log-Zeile (sonst
 * Log-Spam bei jedem einzelnen Mana-Tap) - sie werden stattdessen rein visuell
 * über `recentActionInstanceIds`/`.action-glow` sichtbar gemacht, s.o.
 */
function describeEvent(e: GameEvent): string | undefined {
  switch (e.kind) {
    case "gameStarted":
      return `Partie gestartet - Startspieler: ${e.startingPlayer}`;
    case "turnBegan":
      return `— Zug ${e.turnNumber}: ${e.player} am Zug —`;
    case "stepBegan":
      return `Step: ${e.step}`;
    case "priorityGained":
      return `${e.player} erhält Priority`;
    case "cardDrawn":
      return `${e.player} zieht eine Karte`;
    case "spellCast": {
      const name = cardNameFor(e.cardInstanceId);
      const player = controllerOf(e.cardInstanceId);
      return player ? `${player} castet ${name} (Stack)` : `${name} wird gecastet (Stack)`;
    }
    case "abilityActivated": {
      const name = cardNameFor(e.sourceInstanceId);
      const player = controllerOf(e.sourceInstanceId);
      return player ? `${player} aktiviert eine Fähigkeit von ${name}` : `Fähigkeit von ${name} aktiviert`;
    }
    case "triggerFired": {
      const name = cardNameFor(e.sourceInstanceId);
      return `Ausgelöste Fähigkeit von ${name}`;
    }
    case "decisionRequired":
      return `Entscheidung nötig (${e.decisionKind}) - ${e.player} muss wählen`;
    case "decisionResolved":
      return `Entscheidung aufgelöst (${e.decisionKind})`;
    case "stackObjectResolved":
      return `Stack-Objekt löst auf`;
    case "stackObjectCountered":
      return `Stack-Objekt wurde gecountert`;
    case "stackObjectFizzled":
      return `Stack-Objekt verpufft (kein legales Ziel mehr)`;
    case "zoneChanged": {
      // Nur der Sonderfall "Permanent wird von Hand ins Spiel gebracht"
      // (Terrains, s. engine/actions.ts#playTerrain - Zauber laufen über den
      // Stack, also from: "stack", nicht "hand") wird als eigene Log-Zeile
      // ergänzt (Nutzer-Auftrag: "eine Karte wird gelegt"). ALLE anderen
      // Zonenwechsel bleiben bewusst unbehandelt (undefined) - insbesondere
      // Stack->Battlefield/Graveyard nach Auflösung, das würde sich mit dem
      // bereits vorhandenen stackObjectResolved/unitDied-Log doppeln.
      if (e.from !== "hand" || e.to !== "battlefield") return undefined;
      const name = cardNameFor(e.cardInstanceId);
      const player = controllerOf(e.cardInstanceId);
      return player ? `${player} spielt ${name}` : `${name} wird gespielt`;
    }
    case "damageDealt":
      return `${e.amount} Schaden an ${describeDamageTarget(e.to)}`;
    case "lifeChanged":
      return `${e.player}: Leben ${e.delta >= 0 ? "+" : ""}${e.delta} → ${e.newTotal}`;
    case "unitDied":
      return `Eine Unit ist gestorben`;
    case "attackersDeclared":
      return `Angreifer erklärt (${e.attackers.length})`;
    case "blockersDeclared":
      return `Blocker erklärt (${e.blocks.length})`;
    case "playerLost":
      return `${e.player} verliert das Spiel (${e.reason})`;
    case "gameEnded":
      return `Spiel beendet - Sieger: ${e.winner}`;
    default:
      return undefined;
  }
}

/**
 * PARALLELE Funktion zu `describeEvent` oben (beide werden ausschließlich
 * gemeinsam über `processEvents` unten aufgerufen, gleiches Prinzip: reine
 * Beobachtung der von der Engine bereits gelieferten `GameEvent`s, keine
 * eigene Regel-/Legalitätslogik hier) - übersetzt ein Event in einen kurzen,
 * überlappenden Soundeffekt (s. `./sfxPlayer.ts`).
 * `playSfx()` selbst ist defensiv (No-Op ohne `initSfxPlayer()`/bei
 * `isSfxEnabled() === false`), diese Funktion muss sich darum nicht kümmern.
 *
 * `suppressCardDrawn`: s. Dateikommentar bei den drei Aufrufstellen unten -
 * die 7 `cardDrawn`-Events der Start-/Mulligan-Neuverteilung sollen NICHT
 * einzeln vertont werden (klänge wie ein kaputter Stotter-Effekt statt
 * "Karten austeilen"), normale Zug-für-Zug-Draws im Draw-Step dagegen schon.
 */
function playSfxForEvent(e: GameEvent, opts: { suppressCardDrawn: boolean }): void {
  switch (e.kind) {
    case "cardDrawn":
      if (!opts.suppressCardDrawn) playSfx("card-draw");
      return;
    case "mulliganTaken":
      playSfx("deck-shuffle");
      return;
    case "spellCast":
      // Deckt sowohl Zaubersprüche als auch Kreaturen ab (beide gehen auf
      // den Stack) - s. Auftrag, das ist gewollt, kein Bug. Terrains lösen
      // KEIN spellCast aus (gehen am Stack vorbei, s. zoneChanged-Zweig
      // unten), sondern nur "card-play".
      playSfx("spell-cast");
      return;
    case "zoneChanged":
      // Terrain wird gelegt: einziger Weg, wie eine Karte direkt von der
      // Hand auf das Battlefield wandert, OHNE über den Stack zu gehen
      // (Kreaturen/Zauber nehmen hand->stack, s. engine/actions.ts#castSpell
      // + engine/stack.ts). Reine Beobachtung des bereits von der Engine
      // gelieferten Events, keine eigene Terrain-Erkennung über den Pool.
      if (e.from === "hand" && e.to === "battlefield") playSfx("card-play");
      return;
    case "attackersDeclared":
      playSfx("attack-swing");
      return;
    case "damageDealt":
      playSfx("combat-hit");
      return;
    case "unitDied":
      playSfx("creature-death");
      return;
    case "lifeChanged":
      if (e.delta < 0) playSfx("life-loss");
      else if (e.delta > 0) playSfx("life-gain");
      return;
    case "gameEnded":
      // Aus Sicht player1 (der lokalen menschlichen Sicht, s. bestehende
      // Konvention für "Sieger"/"Verlierer" in render.ts/store.ts) - bei
      // einem Unentschieden ertönt bewusst weder victory noch defeat.
      if (e.winner === "player1") playSfx("victory");
      else if (e.winner === "player2") playSfx("defeat");
      return;
    default:
      return;
  }
}

/** s. `playSfxForEvent`-Dateikommentar: true, wenn dieser Event-Batch die Start-/Mulligan-Neuverteilung ist (7+ cardDrawn ohne einzelne Vertonung). */
function batchContainsMulligan(events: GameEvent[]): boolean {
  return events.some((e) => e.kind === "mulliganTaken");
}

/**
 * Sammelt die InstanceIds, die laut Auftrag ("visuell, eine Karte wird
 * gelegt, es wird getappt usw") gerade optisch hervorgehoben werden sollen -
 * bewusst eine ENGE, explizite Auswahl an Event-Arten (nicht z.B.
 * `damageDealt`/`countersChanged`), um die Hervorhebung auf genau die vom
 * Auftrag genannten Fälle zu beschränken statt das Board bei jedem Event
 * aufblitzen zu lassen.
 */
function collectGlowInstanceIds(e: GameEvent, out: InstanceId[]): void {
  switch (e.kind) {
    case "spellCast":
      out.push(e.cardInstanceId);
      return;
    case "abilityActivated":
    case "triggerFired":
      out.push(e.sourceInstanceId);
      return;
    case "permanentTapped":
      out.push(e.instanceId);
      return;
    case "zoneChanged":
      if (e.from === "hand" && e.to === "battlefield") out.push(e.cardInstanceId);
      return;
    default:
      return;
  }
}

/**
 * Gemeinsame Verarbeitung eines Event-Batches (Log-Zeilen, SFX, visuelles
 * Glow-Highlight) - EINE Implementierung statt vier fast identischer
 * Kopien an den Aufrufstellen (initGame/dispatch/runBotStep/
 * applyAutomaticAction), die bisher leicht hätten auseinanderlaufen können
 * (z.B. wenn nur an drei von vier Stellen ein neues Verhalten ergänzt wird).
 * Erwartet, dass `state` VOR dem Aufruf bereits auf `result.state` gesetzt
 * wurde (describeEvent/cardNameFor lesen den module-scoped `state`).
 */
function processEvents(events: GameEvent[], opts: { suppressCardDrawn: boolean }): void {
  const glowIds: InstanceId[] = [];
  for (const e of events) {
    const t = describeEvent(e);
    if (t) log.push(t);
    playSfxForEvent(e, opts);
    collectGlowInstanceIds(e, glowIds);
  }
  if (log.length > 300) log = log.slice(-300);
  markRecentAction(glowIds);
}

/**
 * Startet die eigentliche Partie aus zwei fertigen Decklisten (aus dem
 * Deckbau-Screen, s. `confirmDeck` oben). Ersetzt die frühere Signatur ohne
 * Parameter, die intern immer `buildDemoDeck` für beide Spieler aufrief
 * (v0.1-v0.1.4) - `buildDemoDeck` (deck.ts) existiert weiterhin, wird jetzt
 * aber vom Deckbau-Screen selbst aufgerufen ("Zufällig füllen"-Button),
 * nicht mehr automatisch hier.
 */
export function initGame(
  deckP1: Record<string, number>,
  deckP2: Record<string, number>,
  seed: number = Math.floor(Math.random() * 1_000_000),
  startingPlayer?: PlayerId,
): void {
  // Eine evtl. noch geplante KI-Aktion der VORHERIGEN Partie darf nicht mehr
  // gegen den neuen State feuern (s. runBotStep, das direkt auf dem
  // modul-scoped `state` arbeitet) - erst stoppen, dann den neuen State
  // setzen, danach ggf. frisch planen (unten).
  stopBotLoop();
  const { state: s, events } = engine.createGame({
    decks: { player1: deckP1, player2: deckP2 },
    seed,
    // v0.1.12: `startingPlayer` wird NUR vom Tutorial-Pfad gesetzt
    // (startTutorial unten, Auftrag "player1 beginnt immer") - für normale
    // Partien bleibt es `undefined`, sodass die Engine weiterhin per
    // Münzwurf entscheidet (s. src/engine/create-game.ts).
    startingPlayer,
    // v0.1.6: skipMulligans wird NICHT mehr gesetzt (Engine-Default `false`,
    // rules-engine.md 1b) - das UI hat jetzt einen echten Mulligan-Dialog
    // (render.ts#actionBanner, pendingDecision.kind === "mulligan"), die
    // vorherige mechanische Not-Anpassung (immer skipMulligans: true) ist
    // damit hinfällig.
  });
  state = s;
  log = [`Seed: ${seed}`];
  lastError = undefined;
  uiMode = { kind: "idle" };
  // s. resetRecentActionGlow-Kommentar: InstanceIds starten pro Partie neu
  // bei "card1" - eine evtl. noch laufende Glow-Anzeige der vorherigen
  // Partie darf nicht in die neue hinein "durchscheinen".
  resetRecentActionGlow();
  // Die initiale Starthand-Verteilung (7 cardDrawn-Events je Spieler) wird
  // NIE einzeln vertont (s. playSfxForEvent-Dateikommentar) - anders als bei
  // den beiden anderen Aufrufstellen kommt hier ohnehin nie ein
  // mulliganTaken-Event vor (createGame nutzt drawCard direkt, nicht den
  // mulligan.ts-Pfad), daher fest `true` statt batchContainsMulligan(events).
  processEvents(events, { suppressCardDrawn: true });
  maybeAdvanceTutorialProgress(undefined);
  notify();
  // v0.1.7: Ist der (nach dem Münzwurf feststehende) erste Akteur bereits
  // bot-gesteuert - z.B. player2 ist KI und beginnt mit der ersten Mulligan-
  // Entscheidung oder direkt mit Priority -, spielt der Bot ab hier
  // automatisch weiter, bis wieder ein Mensch an der Reihe ist. **v0.1.18**:
  // deckt zusätzlich den Fall ab, dass der erste Akteur ein NICHT-bot-
  // gesteuerter Spieler ohne echte Wahl ist (Auftrag Teil 1+2).
  triggerAutomation();
}

/** Legale Aktions-Kandidaten für player im aktuellen State (delegiert an die Engine). */
export function legalActions(player: import("../model").PlayerId): PlayerAction[] {
  return engine.getLegalActions(state, player);
}

/**
 * true, wenn ein `legalActions`-Kandidat als "echte Wahl" bei Priority zählt.
 * Schließt `passPriority`/`concede` aus (das ist keine Wahl, sondern die
 * Standardoption) UND - Bugfix v0.1.19 - reine Mana-Fähigkeiten
 * (`activateAbility` auf einer Ability mit `isManaAbility: true`, i.d.R. das
 * kostenlose Antippen eines Terrains fürs Mana): Terrains bieten diese
 * Fähigkeit praktisch IMMER an, solange sie ungetappt sind, unabhängig davon,
 * ob der Spieler gerade überhaupt etwas hat, wofür sich das Mana lohnen
 * würde. Ohne diesen Ausschluss zählte "ich könnte mein Terrain antippen"
 * fälschlich als echte Entscheidung, obwohl der Spieler faktisch nichts
 * Sinnvolles tun kann - Auto-Pass griff dann nie, und das Spotlight-Banner
 * (render.ts#decisionSpotlightPlayer) erschien ständig unnötig. Das reine
 * Antippen fürs Mana bleibt weiterhin normal manuell klickbar (z.B. um Mana
 * für später im selben Schritt vorzuhalten) - es zählt nur nicht ALLEIN als
 * "hier gibt's was zu entscheiden". Hat der Spieler zusätzlich etwas ANDERES
 * Sinnvolles (bezahlbarer Zauber, Nicht-Mana-Fähigkeit, ausspielbares
 * Terrain), zählt das weiterhin ganz normal als echte Wahl.
 */
function isRealPriorityCandidate(action: PlayerAction): boolean {
  if (action.kind === "passPriority" || action.kind === "concede") return false;
  if (action.kind === "activateAbility") {
    const def = cardDef(getPool(), state, action.sourceInstanceId);
    const ability = "abilities" in def ? def.abilities?.[action.abilityIndex] : undefined;
    if (ability?.kind === "activated" && ability.isManaAbility) return false;
  }
  return true;
}

/**
 * true, wenn `player` bei Priority GERADE eine echte Wahl hat (`legalActions`
 * bietet mehr als nur passPriority/concede/reine-Mana-Fähigkeiten an) -
 * gemeinsam genutzt von autoResolvableActionFor (unten, entscheidet ob
 * automatisch gepasst wird) und render.ts#decidingPlayer (Auftrag Teil 3,
 * entscheidet ob das Spotlight-Banner erscheinen soll). Bewusst hier EINMAL
 * exportiert statt in beiden Modulen dupliziert - zwei unabhängige Kopien
 * derselben Erkennung liefen zuvor genau deshalb auseinander (s. Bugfix-
 * Kommentar an isRealPriorityCandidate oben).
 */
export function hasRealPriorityChoice(player: PlayerId): boolean {
  return legalActions(player).some(isRealPriorityCandidate);
}

/**
 * Wendet eine MENSCHLICHE Aktion an (über die UI ausgelöst). Für automatische
 * KI-Züge wird bewusst NICHT diese Funktion verwendet, sondern die
 * strukturell identische, aber eigene `runBotStep` (oben) - dispatch() bleibt
 * damit "menschlicher Nutzer hat geklickt"-spezifisch (z.B. setzt es uiMode
 * zurück, was für automatische Bot-Züge irrelevant, aber auch unschädlich
 * wäre; der Haupt-Unterschied ist `triggerAutomation()` am Ende, s.u.).
 */
export function dispatch(action: PlayerAction): void {
  const result = engine.applyAction(state, action);
  if (result.error) {
    lastError = result.error;
    notify();
    return;
  }
  lastError = undefined;
  state = result.state;
  uiMode = { kind: "idle" };
  const suppressCardDrawn = batchContainsMulligan(result.events);
  processEvents(result.events, { suppressCardDrawn });
  maybeAdvanceTutorialProgress(action);
  notify();
  // v0.1.7: Nach jeder menschlichen Aktion prüfen, ob jetzt ein bot-
  // gesteuerter Spieler handeln muss - falls ja, automatisch weiterspielen
  // (siehe triggerAutomation/runBotStep oben), bis wieder ein Mensch dran ist
  // oder das Spiel endet. **v0.1.18**: triggerAutomation() deckt zusätzlich
  // den Fall ab, dass JETZT ein NICHT-bot-gesteuerter Spieler ohne echte Wahl
  // an der Reihe ist (Auftrag Teil 1+2: automatisches Passen/"keine
  // Angreifer"/"keine Blocker", wenn das die einzig legale Aktion ist).
  triggerAutomation();
}
