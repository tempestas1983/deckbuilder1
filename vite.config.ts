import { defineConfig, type Plugin } from "vite";
import { createReadStream, existsSync, mkdirSync, readdirSync, copyFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Frontend-Build-Setup (frontend-engineer). Vite statt z.B. Webpack/CRA,
 * weil es für ein Hobby-Projekt ohne Zusatzkonfiguration mit reinem
 * TypeScript funktioniert (siehe docs/frontend-status.md für die Begründung,
 * warum Vanilla-TS statt React gewählt wurde).
 */

const PROJECT_ROOT = fileURLToPath(new URL(".", import.meta.url));
const ARTWORK_SOURCE_DIR = join(PROJECT_ROOT, "docs", "cards", "artworks");
const ARTWORK_URL_PREFIX = "/cards/artworks/";
const ARTWORK_OUT_SUBDIR = join("cards", "artworks");

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/**
 * Liefert die extern generierten Karten-Artworks aus `docs/cards/artworks/`
 * unter `/cards/artworks/<datei>` aus (s. `docs/cards/card-art-brief.md` +
 * `src/ui/components/cardArt.ts`).
 *
 * `docs/cards/artworks/` liegt bewusst NICHT in `public/` — der Nutzer legt
 * dort laufend neue, extern generierte Bilder ab, und dieser Ablageort/
 * Workflow soll sich durch die UI-Anbindung nicht ändern. Statt die Dateien
 * zusätzlich nach `public/` zu duplizieren/verschieben, übernimmt dieses
 * Plugin die Auslieferung selbst:
 * - **Dev** (`npm run dev`): eine eigene Server-Middleware liest Dateien
 *   direkt aus `docs/cards/artworks/` und liefert sie unter der o.g. URL aus
 *   (kein Kopieren nötig — neu abgelegte Dateien sind ohne Server-Neustart
 *   sofort verfügbar).
 * - **Build** (`npm run build:ui`): ein Kopierschritt beim Bundle-Abschluss
 *   dupliziert `docs/cards/artworks/*` nach `<outDir>/cards/artworks/`, da
 *   ein Produktions-Build keinen Node-Server mehr hat, der zur Laufzeit
 *   nachschauen könnte.
 */
function cardArtworkPlugin(): Plugin {
  let outDirAbs = "";
  let isBuildCommand = false;
  return {
    name: "card-artwork-static-serve",
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
        if (!req.url || !req.url.startsWith(ARTWORK_URL_PREFIX)) {
          next();
          return;
        }
        const rawName = req.url.slice(ARTWORK_URL_PREFIX.length).split("?")[0] ?? "";
        const fileName = decodeURIComponent(rawName);
        // Kein Directory-Traversal über den Dateinamen zulassen.
        if (!fileName || fileName.includes("/") || fileName.includes("\\") || fileName.includes("..")) {
          next();
          return;
        }
        const filePath = join(ARTWORK_SOURCE_DIR, fileName);
        if (!existsSync(filePath)) {
          // Normalfall für die meisten der 300 Karten (Artwork fehlt noch) —
          // einfach durchreichen, damit der Browser ein reguläres 404 sieht
          // (löst im Frontend den Fallback auf den Farbverlauf aus).
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
      if (!existsSync(ARTWORK_SOURCE_DIR)) return;
      const outDir = join(outDirAbs, ARTWORK_OUT_SUBDIR);
      mkdirSync(outDir, { recursive: true });
      for (const entry of readdirSync(ARTWORK_SOURCE_DIR)) {
        copyFileSync(join(ARTWORK_SOURCE_DIR, entry), join(outDir, entry));
      }
    },
  };
}

export default defineConfig({
  root: ".",
  plugins: [cardArtworkPlugin()],
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist-ui",
  },
});
