import { defineConfig, type Plugin } from "vite";
import { createReadStream, existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Frontend-Build-Setup (frontend-engineer). Vite statt z.B. Webpack/CRA,
 * weil es für ein Hobby-Projekt ohne Zusatzkonfiguration mit reinem
 * TypeScript funktioniert (siehe docs/frontend-status.md für die Begründung,
 * warum Vanilla-TS statt React gewählt wurde).
 */

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
};

/** Von musicIndexPlugin (s.u.) als Musiktitel erkannte Dateiendungen - Teilmenge der Schlüssel aus MIME_BY_EXT oben, auf tatsächlich als Musik erwartete Formate eingegrenzt. */
const MUSIC_TRACK_EXTENSIONS = [".mp3", ".ogg", ".wav", ".m4a"];

/**
 * Liefert extern generierte, gitignorete Bild-Assets aus einem `docs/`-
 * Unterordner unter einer festen URL aus (Dev-Middleware + Build-
 * Kopierschritt) - gemeinsame Grundlage für zwei Asset-Sets, die beide
 * nach demselben "Nutzer legt Dateien lokal ab, UI zeigt sie an, sofern
 * vorhanden" -Workflow funktionieren:
 * - Karten-Artwork: `docs/cards/artworks/` -> `/cards/artworks/<id>.png`
 *   (s. `docs/cards/card-art-brief.md` + `src/ui/components/cardArt.ts`)
 * - Szenen-Artwork (Board-Hintergrund + Bot-Avatare):
 *   `docs/scene-art/` -> `/scene-art/<datei>.png`
 *   (s. `docs/scene-art-brief.md` + `src/ui/components/sceneArt.ts`)
 * - Hintergrundmusik: `docs/music/` -> `/music/<datei>.mp3`
 *
 * `docs/<...>/` liegt bewusst NICHT in `public/` — der Nutzer legt dort
 * laufend neue, extern generierte Bilder ab, und dieser Ablageort/Workflow
 * soll sich durch die UI-Anbindung nicht ändern. Statt die Dateien
 * zusätzlich nach `public/` zu duplizieren/verschieben, übernimmt dieses
 * Plugin die Auslieferung selbst:
 * - **Dev** (`npm run dev`): eine eigene Server-Middleware liest Dateien
 *   direkt aus dem Quellordner und liefert sie unter der o.g. URL aus
 *   (kein Kopieren nötig — neu abgelegte Dateien sind ohne Server-Neustart
 *   sofort verfügbar).
 * - **Build** (`npm run build:ui`): ein Kopierschritt beim Bundle-Abschluss
 *   dupliziert den Quellordner nach `<outDir>/<urlPrefix>`, da ein
 *   Produktions-Build keinen Node-Server mehr hat, der zur Laufzeit
 *   nachschauen könnte.
 */
function staticArtPlugin(opts: { name: string; sourceDir: string; urlPrefix: string; outSubdir: string }): Plugin {
  const { name, sourceDir, urlPrefix, outSubdir } = opts;
  let outDirAbs = "";
  let isBuildCommand = false;
  return {
    name,
    configResolved(config) {
      outDirAbs = resolve(config.root, config.build.outDir);
      // `closeBundle` wird nicht nur bei einem echten `vite build`
      // aufgerufen, sondern u.a. auch von Vitest's eigener, interner
      // Vite-Instanz (die dabei bewusst einen nicht-existenten Platzhalter-
      // Pfad als `build.outDir` durchreicht, um genau solche Plugins zu
      // erwischen, die unbedingt ins Dateisystem schreiben) - deshalb hier
      // explizit auf den echten Build-Befehl prüfen, statt uns auf einen
      // bloßen Hook-Aufruf zu verlassen.
      isBuildCommand = config.command === "build";
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url || !req.url.startsWith(urlPrefix)) {
          next();
          return;
        }
        const rawName = req.url.slice(urlPrefix.length).split("?")[0] ?? "";
        const fileName = decodeURIComponent(rawName);
        // Kein Directory-Traversal über den Dateinamen zulassen.
        if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
          next();
          return;
        }
        const filePath = join(sourceDir, fileName);
        if (!existsSync(filePath)) {
          // Normalfall, solange das jeweilige Bild (noch) nicht abgelegt
          // wurde — einfach durchreichen, damit der Browser ein reguläres
          // 404 sieht (löst im Frontend den jeweiligen CSS-Fallback aus).
          next();
          return;
        }
        const mime = MIME_BY_EXT[extname(fileName).toLowerCase()] ?? "application/octet-stream";
        res.setHeader("Content-Type", mime);
        createReadStream(filePath).pipe(res);
      });
    },
    closeBundle() {
      if (!isBuildCommand) return;
      if (!existsSync(sourceDir)) return;
      const outDir = join(outDirAbs, outSubdir);
      mkdirSync(outDir, { recursive: true });
      for (const entry of readdirSync(sourceDir)) {
        copyFileSync(join(sourceDir, entry), join(outDir, entry));
      }
    },
  };
}

function cardArtworkPlugin(): Plugin {
  return staticArtPlugin({
    name: "card-artwork-static-serve",
    sourceDir: join(PROJECT_ROOT, "docs", "cards", "artworks"),
    urlPrefix: "/cards/artworks/",
    outSubdir: join("cards", "artworks"),
  });
}

function sceneArtPlugin(): Plugin {
  return staticArtPlugin({
    name: "scene-art-static-serve",
    sourceDir: join(PROJECT_ROOT, "docs", "scene-art"),
    urlPrefix: "/scene-art/",
    outSubdir: "scene-art",
  });
}

const MUSIC_SOURCE_DIR = join(PROJECT_ROOT, "docs", "music");

function musicPlugin(): Plugin {
  return staticArtPlugin({
    name: "music-static-serve",
    sourceDir: MUSIC_SOURCE_DIR,
    urlPrefix: "/music/",
    outSubdir: "music",
  });
}

/** Live-Verzeichnis-Listing von docs/music/, gefiltert auf MUSIC_TRACK_EXTENSIONS, alphabetisch sortiert. Fehlt der Ordner (noch) komplett, liefert das eine leere Liste statt zu crashen (gleicher "Nutzer legt Dateien lokal ab"-Workflow wie beim Rest von staticArtPlugin). */
function listMusicTracks(): string[] {
  if (!existsSync(MUSIC_SOURCE_DIR)) return [];
  return readdirSync(MUSIC_SOURCE_DIR)
    .filter((entry) => MUSIC_TRACK_EXTENSIONS.includes(extname(entry).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "de"));
}

/**
 * Auto-Discovery der Musiktitel unter `docs/music/` (Auftrag: kein manuelles
 * Verdrahten pro Datei) - ein schlanker Zusatz-Handler NEBEN `musicPlugin()`
 * oben statt einer Erweiterung von `staticArtPlugin` selbst, da dessen
 * Middleware/Kopierschritt rein dateibasiert ist (eine URL -> eine Datei) und
 * eine Verzeichnis-Listing-Fähigkeit ein fremder Zusatz wäre.
 *
 * - **Dev**: `/music/index.json` wird bei JEDEM Request live neu ermittelt
 *   (kein Cache) - neu abgelegte/gelöschte Dateien tauchen ohne
 *   Server-Neustart sofort in der Liste auf, exakt das gleiche Versprechen
 *   wie bei den anderen `docs/`-Asset-Ordnern (s. staticArtPlugin-Kommentar).
 * - **Build**: derselbe Inhalt wird als Snapshot zum Build-Zeitpunkt nach
 *   `<outDir>/music/index.json` geschrieben, da ein Produktions-Build keinen
 *   Node-Server mehr hat, der zur Laufzeit nachschauen könnte (musicPlayer.ts
 *   fragt dieselbe URL in Dev UND Build gleichermaßen per fetch() ab).
 */
function musicIndexPlugin(): Plugin {
  let outDirAbs = "";
  let isBuildCommand = false;
  return {
    name: "music-index-json",
    configResolved(config) {
      outDirAbs = resolve(config.root, config.build.outDir);
      // s. staticArtPlugin#configResolved - gleicher Grund für die explizite
      // Prüfung auf den echten Build-Befehl statt uns auf den bloßen
      // closeBundle-Hook-Aufruf zu verlassen (Vitest ruft closeBundle auch
      // mit einem nicht-existenten Platzhalter-outDir auf).
      isBuildCommand = config.command === "build";
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0];
        if (url !== "/music/index.json") {
          next();
          return;
        }
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ tracks: listMusicTracks() }));
      });
    },
    closeBundle() {
      if (!isBuildCommand) return;
      const outDir = join(outDirAbs, "music");
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "index.json"), JSON.stringify({ tracks: listMusicTracks() }));
    },
  };
}

/**
 * Kurze Soundeffekte (`docs/sfx/` -> `/sfx/<datei>.mp3`) - anders als die
 * drei Asset-Ordner oben ist `docs/sfx/` diesmal NICHT gitignored (nur ~330
 * KB Gesamtgröße, kein Platzproblem, s. docs/sfx/SOURCES.md), läuft aber aus
 * Konsistenzgründen über denselben Dev-Middleware+Build-Kopierschritt statt
 * die Dateien nach `public/` zu verschieben oder einen Sonderfall zu bauen.
 */
function sfxPlugin(): Plugin {
  return staticArtPlugin({
    name: "sfx-static-serve",
    sourceDir: join(PROJECT_ROOT, "docs", "sfx"),
    urlPrefix: "/sfx/",
    outSubdir: "sfx",
  });
}

export default defineConfig({
  root: ".",
  plugins: [cardArtworkPlugin(), sceneArtPlugin(), musicPlugin(), musicIndexPlugin(), sfxPlugin()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist-ui",
  },
});
