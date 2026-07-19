/**
 * Spielerfreundliches Keyword-Glossar (reine Daten, kein Spiellogik-Zutun).
 *
 * Hintergrund (Nutzer-Feedback, s. docs/frontend-status.md): Karten zeigen
 * Schlüsselwörter im Regeltext (z.B. "Todesberührung." bei
 * `core.abyssal-lurker`), aber es gab bisher KEINE Möglichkeit im UI,
 * nachzuschlagen, was ein Schlüsselwort bedeutet. Dieses Modul liefert dafür
 * zwei Dinge:
 *
 * 1. `KEYWORD_GLOSSARY`/`KEYWORD_GLOSSARY_BY_KEYWORD`: pro `Keyword`
 *    (`src/model/abilities.ts`) eine kurze, für Einsteiger verständliche
 *    Erklärung (KEINE Regeltext-Kopie) + die deutschen Wortformen, wie sie
 *    tatsächlich in `CardDefinition.rulesText`-Strings vorkommen (per Grep in
 *    `src/cards/starter-set.ts` ermittelt - z.B. taucht `airborne` mal als
 *    "Flieger" (auf Einheiten-Karten) und mal als "Flugfähigkeit" (von
 *    Zaubersprüchen verliehen) auf; `firstStrike`/`trample` erscheinen im
 *    Kartentext NUR als "Erststurm"/"Trampelschaden", nie als
 *    "Erstschlag"/"Trampeln" - das sind ausschließlich die (unabhängig
 *    entstandenen) `KEYWORD_LABEL`-Badge-Kurzform in `cardInfo.ts`, siehe
 *    dortiger Kommentar).
 * 2. `tokenizeRulesText`: zerlegt einen `rulesText`-String in Text-/Keyword-
 *    Segmente (für die Hervorhebung in der Regeltext-Box, s.
 *    `components/keywordText.ts`) - reines String-Parsing, keine
 *    Spielzustands-Abfrage.
 *
 * Verbindliche Regelsemantik der Keywords: docs/rules-engine.md Abschnitt 6d
 * (Kampf-Keyword-Paket) + die Keyword-Kommentare in `src/model/abilities.ts`.
 * Die Erklärungen hier sind bewusst vereinfacht/umgangssprachlich für
 * Spieler ohne Sammelkartenspiel-Erfahrung - bei Detailfragen (z.B. exakte
 * Schadenszuteilung bei trample+deathtouch) bleibt rules-engine.md die
 * maßgebliche Quelle.
 */

import type { Keyword } from "../model";

export interface KeywordGlossaryEntry {
  keyword: Keyword;
  /** Anzeigename fürs globale Nachschlagewerk (identisch mit der häufigsten Kartentext-Wortform). */
  title: string;
  /**
   * Alle deutschen Wortformen, wie sie tatsächlich in `rulesText`-Strings
   * vorkommen (für die Erkennung/Hervorhebung im Kartentext, s.
   * `tokenizeRulesText`). Reihenfolge irrelevant, Groß-/Kleinschreibung wie
   * im Kartentext (Wortanfang eines Satzes).
   */
  displayTerms: string[];
  /** Kurze, spielerfreundliche Erklärung (1-3 Sätze) - keine Regeltext-Kopie. */
  explanation: string;
}

export const KEYWORD_GLOSSARY: KeywordGlossaryEntry[] = [
  {
    keyword: "swift",
    title: "Eile",
    displayTerms: ["Eile"],
    explanation:
      "Diese Kreatur darf schon in dem Zug angreifen oder ihre Tap-Fähigkeiten nutzen, in dem sie ins Spiel kommt. " +
      "Normalerweise müssten neue Kreaturen dafür erst eine Runde warten (Beschwörungskrankheit).",
  },
  {
    keyword: "airborne",
    title: "Flieger",
    displayTerms: ["Flieger", "Flugfähigkeit"],
    explanation:
      "Diese Kreatur kann im Kampf nur von Kreaturen mit Flieger oder Reichweite geblockt werden - für alle " +
      "anderen Kreaturen ist sie praktisch unangreifbar.",
  },
  {
    keyword: "reach",
    title: "Reichweite",
    displayTerms: ["Reichweite"],
    explanation:
      "Diese Kreatur darf fliegende Kreaturen (Flieger) blocken, obwohl sie selbst nicht fliegt - ansonsten ist " +
      "sie eine ganz normale Kreatur.",
  },
  {
    keyword: "vigilant",
    title: "Wachsam",
    displayTerms: ["Wachsam"],
    explanation:
      "Diese Kreatur tappt (dreht sich quer) beim Angreifen nicht. Sie bleibt dadurch einsatzbereit und kann im " +
      "selben Zug trotzdem noch blocken oder ihre Tap-Fähigkeiten nutzen.",
  },
  {
    keyword: "lifelink",
    title: "Lebensverbindung",
    displayTerms: ["Lebensverbindung"],
    explanation:
      "Jeder Schaden, den diese Kreatur verursacht - egal ob im Kampf oder durch eine Fähigkeit -, gibt ihrem " +
      "Kontrolleur genauso viele Lebenspunkte zurück.",
  },
  {
    keyword: "guardian",
    title: "Wächter",
    displayTerms: ["Wächter"],
    explanation:
      "Diese Kreatur MUSS einen Angreifer blocken, solange sie ungetappt ist und mindestens ein legaler Block " +
      "für sie möglich ist - sie stellt sich automatisch schützend in den Weg. Beim eigenen Angriff hat das " +
      "Schlüsselwort keine Wirkung.",
  },
  {
    keyword: "trample",
    title: "Trampelschaden",
    displayTerms: ["Trampelschaden"],
    explanation:
      "Übersteigt der Kampfschaden dieser Kreatur das, was nötig wäre, um alle blockenden Kreaturen zu töten, " +
      "geht der übrige Schaden direkt an den verteidigenden Spieler durch, statt zu verpuffen.",
  },
  {
    keyword: "firstStrike",
    title: "Erststurm",
    displayTerms: ["Erststurm"],
    explanation:
      "Diese Kreatur teilt ihren Kampfschaden in einer zusätzlichen, FRÜHEN Runde aus, bevor normale Angreifer " +
      "und Blocker überhaupt zuschlagen. Stirbt die Gegenseite dabei, schlägt sie danach gar nicht mehr zurück.",
  },
  {
    keyword: "deathtouch",
    title: "Todesberührung",
    displayTerms: ["Todesberührung"],
    explanation:
      "Jeder Schaden, den diese Kreatur im Kampf verursacht, reicht aus, um die getroffene Kreatur zu töten - " +
      "egal wie viel Zähigkeit sie hat.",
  },
];

export const KEYWORD_GLOSSARY_BY_KEYWORD: Record<Keyword, KeywordGlossaryEntry> = Object.fromEntries(
  KEYWORD_GLOSSARY.map((entry) => [entry.keyword, entry]),
) as Record<Keyword, KeywordGlossaryEntry>;

/** Ein Segment eines tokenisierten `rulesText` - entweder reiner Text oder ein erkanntes Keyword-Wort. */
export interface RuleTextToken {
  text: string;
  entry?: KeywordGlossaryEntry;
}

// Eine kombinierte Regex aus ALLEN Wortformen aller Keywords, längste zuerst
// (falls je zwei Begriffe sich als Teilstring überlappen sollten - aktuell
// nicht der Fall, aber robust für künftige Erweiterungen). `\b`-Wortgrenzen
// funktionieren hier zuverlässig, da jede Wortform an Anfang/Ende aus einem
// ASCII-Buchstaben besteht (evtl. enthaltene Umlaute liegen immer INNERHALB
// des Treffers, nicht an der Grenze).
const ALL_TERMS: Array<{ term: string; entry: KeywordGlossaryEntry }> = KEYWORD_GLOSSARY.flatMap((entry) =>
  entry.displayTerms.map((term) => ({ term, entry })),
).sort((a, b) => b.term.length - a.term.length);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const KEYWORD_PATTERN =
  ALL_TERMS.length > 0 ? new RegExp(`\\b(${ALL_TERMS.map((t) => escapeRegExp(t.term)).join("|")})\\b`, "g") : undefined;

const TERM_TO_ENTRY: Map<string, KeywordGlossaryEntry> = new Map(ALL_TERMS.map((t) => [t.term, t.entry]));

/**
 * Zerlegt einen Kartentext in Text-/Keyword-Segmente. Reines String-Parsing
 * (kein Spielzustand, keine Regelentscheidung) - für die Hervorhebung der
 * Keyword-Wörter in der Regeltext-Box, s. `components/keywordText.ts`.
 */
export function tokenizeRulesText(rulesText: string): RuleTextToken[] {
  if (!KEYWORD_PATTERN) return [{ text: rulesText }];
  const tokens: RuleTextToken[] = [];
  let lastIndex = 0;
  KEYWORD_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = KEYWORD_PATTERN.exec(rulesText)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ text: rulesText.slice(lastIndex, match.index) });
    }
    const term = match[0];
    tokens.push({ text: term, entry: TERM_TO_ENTRY.get(term) });
    lastIndex = match.index + term.length;
  }
  if (lastIndex < rulesText.length) {
    tokens.push({ text: rulesText.slice(lastIndex) });
  }
  return tokens;
}
