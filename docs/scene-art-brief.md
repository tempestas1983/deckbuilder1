# Szenen-Artwork-Briefing (für externe Bildgenerierung)

Dieses Dokument ist die Auftragsgrundlage für die vier Nicht-Karten-Bilder
des Spiels: ein Taverne-Hintergrund fürs Spielbrett und drei Gegner-Avatare
(einer je KI-Schwierigkeitsstufe, siehe `src/ai/difficulty.ts`). Gleiches
Prinzip wie beim Karten-Artwork (`docs/cards/card-art-brief.md`): Bild-
generierung ist nicht Teil dieses Projekts/dieser Werkzeugkette, daher wird
hier extern (Gemini) erzeugt und später eingebunden.

**Status:** Nur der Brief — die Bilder existieren noch nicht, und die
UI-Anbindung (frontend-engineer) ist bewusst noch NICHT beauftragt. Das
passiert erst in einem Folge-Schritt, nachdem die Bilder generiert wurden
(gleiches Muster wie beim Kartenpool: erst Brief, dann Generierung durch
den User, dann separate Einbindung).

**Generierung:** gleiches Skript wie bei den Karten,
`tools/image-generation/gemini_batch_images.py`. Die Prompt-Tabelle liegt
zusätzlich als fertige CSV bei: `tools/image-generation/scene_artwork_prompts.csv`
(Spalten `Filename, AI Prompt` — exakt das vom Skript erwartete Format).
Entweder `CSV_FILE` im Skript kurzzeitig auf diese Datei umstellen, oder sie
vor dem Lauf in `card_artwork_prompts.csv` umbenennen/kopieren.

## Stilleitfaden

**Allgemeiner Look:** gleicher gemalter, digital-painterly Fantasy-Stil wie
die Kartenillustrationen (kein Foto, kein 3D-Render, kein Comic-/Anime-Stil)
— damit Karten, Hintergrund und Avatare wie aus einem Guss wirken.

**Setting:** eine warme, leicht verrauchte Fantasy-Taverne bei Nacht/Abend —
Kerzen- und Fackellicht, Holzbalken, ein abgenutzter Spieltisch, gedämpfte
Goldtöne. Kein modernes/urbanes Setting.

## 1. Spielbrett-Hintergrund

| Dateiname | Seitenverhältnis | Bildbeschreibung |
|---|---|---|
| tavern-background.png | breit, ca. 16:9 | Blick auf einen abgenutzten hölzernen Spieltisch in einer Fantasy-Taverne, von oben/leicht schräg wie für eine Kartenpartie. Warmes Kerzenlicht von den Seiten, Tischplatte mit Kratzern und Ringspuren von Krügen, im unscharfen Hintergrund angedeutet Bierkrüge, ein Kamin und Holzbalken. Bildmitte bleibt relativ ruhig/kontrastarm, da später Spielfeld-Elemente darüber liegen — keine dominanten Objekte in der Mitte, Details eher an den Rändern.

## 2. Gegner-Avatare (einer pro KI-Schwierigkeitsstufe)

Alle drei als Brustporträt, gleicher Bildausschnitt/Beleuchtung, damit sie
als zusammengehöriges Set wirken — nur Person und Ausdruck unterscheiden
sich nach Spielstärke.

| Dateiname | Schwierigkeit | Seitenverhältnis | Bildbeschreibung |
|---|---|---|---|
| avatar-easy.png | Leicht | quadratisch, 1:1 | Ein junger, freundlich-tollpatschiger Taverne-Gast als Kartenspieler, unsicheres/schüchternes Lächeln, hält seine Karten etwas unbeholfen, warmes Licht, harmlos und einladend wirkend — klar erkennbar als Anfänger. |
| avatar-medium.png | Mittel | quadratisch, 1:1 | Ein erfahrener Taverne-Stammgast mittleren Alters als Kartenspieler, ruhiger konzentrierter Blick, souveräne Haltung, wirkt kompetent aber nicht bedrohlich — ein solider, ernstzunehmender Gegner. |
| avatar-hard.png | Schwer | quadratisch, 1:1 | Ein scharf blickender, abgebrühter Kartenhai/Falschspieler-Typ in der Taverne, selbstsicheres/leicht raubtierhaftes Grinsen, im Halbschatten sitzend, wirkt gefährlich und berechnend — klar erkennbar als starker, einschüchternder Gegner. |

## Folgeschritt (noch nicht beauftragt)

Sobald die vier Dateien in `docs/scene-art/` liegen (Ordner analog zu
`docs/cards/artworks/`, ebenfalls gitignored), kann `frontend-engineer` sie
einbinden: `tavern-background.png` als Board-Hintergrund (ergänzt die
zuvor gebaute CSS-Atmosphäre, ersetzt sie nicht zwingend), die drei
Avatare abhängig von `botDifficulty` als großformatiges Charakterporträt in
einer eigenen Spalte rechts neben dem Spielfeld (s. render.ts#boardSection/
opponentAvatarColumn, style.css `.board-opponent-avatar`) - inzwischen
umgesetzt, nicht mehr nur geplant.
