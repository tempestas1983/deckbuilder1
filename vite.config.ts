import { defineConfig, type Plugin } from "vite";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  copyFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

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
 * Liefert extern generierte, gitignorete Bild-/Audio-Assets aus einem
 * `docs/`-Unterordner unter einer festen URL aus (Dev-Middleware + Build-
 * Kopierschritt) - gemeinsame Grundlage für die Asset-Sets, die alle nach
 * demselben "Nutzer legt Dateien lokal ab, UI zeigt sie an, sofern
 * vorhanden" -Workflow funktionieren:
 * - Szenen-Artwork (Board-Hintergrund + Bot-Avatare):
 *   `docs/scene-art/` -> `/scene-art/<datei>.png`
 *   (s. `docs/scene-art-brief.md` + `src/ui/components/sceneArt.ts`)
 * - Hintergrundmusik: `docs/music/` -> `/music/<datei>.mp3`
 *
 * Karten-Artwork (`docs/cards/artworks/`) läuft NICHT über dieses Plugin,
 * sondern über das eigene `cardArtworkPlugin()` weiter unten, das die
 * Quell-PNGs zusätzlich verkleinert/nach WebP transformiert statt sie 1:1
 * durchzureichen (300 Dateien x ~1,6 MB PNG wären sowohl als Rohdaten im
 * Dev-Request als auch 1:1 kopiert im Produktions-Build unnötig groß für
 * die tatsächliche Render-Größe von Kartenkacheln, s. dortiger Kommentar).
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

const CARD_ARTWORK_SOURCE_DIR = join(PROJECT_ROOT, "docs", "cards", "artworks");
const CARD_ARTWORK_URL_PREFIX = "/cards/artworks/";

/**
 * Zielkantenlänge (px) für die ausgelieferten Karten-Artworks. Größtes
 * tatsächlich vorkommendes CSS-Rendermaß ist `.hand-card` mit
 * `clamp(128px, 34vw, 158px)` (s. `src/ui/style.css`) - 480px bietet dafür
 * knapp 3x Headroom über 158px für hochauflösende Tablet-Displays (Retina-/
 * High-DPR-Displays bis ~3x Device-Pixel-Ratio), ohne die ursprüngliche
 * 1024px-Kantenlänge der Quell-PNGs unnötig mitzuschleppen.
 */
const CARD_ARTWORK_TARGET_SIZE = 480;

/**
 * WebP-Qualitätsstufe: 80 ist ein für kleine, nie größer als ~160px
 * dargestellte Kartenkacheln verzeihlicher Kompromiss - sichtbare
 * Kompressionsartefakte fallen bei dieser Anzeigegröße kaum auf, während die
 * Dateigröße gegenüber verlustfrei bzw. sehr hoher Qualität nochmal spürbar
 * sinkt (stichprobenartig gemessen: ~1,6-2,1 MB Quell-PNG -> ~15-40 KB WebP
 * bei 480px/Qualität 80, je nach Bildinhalt).
 */
const CARD_ARTWORK_QUALITY = 80;

/**
 * Gitignorter Cache für die dev-seitig on-the-fly transformierten WebPs,
 * keyed nach Dateiname + Quell-`mtime` + Zielgröße/-qualität (letztere fix,
 * aber im Schlüssel mitgeführt, falls sich `CARD_ARTWORK_TARGET_SIZE`/
 * `CARD_ARTWORK_QUALITY` künftig ändern - dann werden alte Cache-Einträge
 * einfach nicht mehr getroffen statt eine veraltete Datei auszuliefern).
 * Liegt bewusst unter `node_modules/` statt einem eigenen Ordner im
 * Projekt-Root: `node_modules/` ist über `.gitignore` bereits pauschal
 * ausgeschlossen (kein zusätzlicher `.gitignore`-Eintrag nötig) und der
 * Cache-Inhalt ist reine Ableitung, die z.B. bei `rm -rf node_modules`
 * ohnehin verschwinden darf.
 */
const CARD_ARTWORK_CACHE_DIR = join(PROJECT_ROOT, "node_modules", ".cache", "card-artwork-webp");

/**
 * Wandelt eine Karten-Artwork-Quelldatei (`docs/cards/artworks/<id>.png`) in
 * ein verkleinertes WebP um (s. `CARD_ARTWORK_TARGET_SIZE`/`_QUALITY` oben)
 * und liefert das Ergebnis als Buffer zurück - Cache-Treffer werden direkt
 * von der Platte gelesen, sonst wird per `sharp` transformiert und das
 * Ergebnis für künftige Aufrufe (Dev: nächster Request derselben Datei;
 * Build: Vitest/wiederholte Builds ohne Quelländerung) auf der Platte
 * abgelegt.
 */
async function transformCardArtworkToWebp(sourcePath: string): Promise<Buffer> {
  const stat = statSync(sourcePath);
  const id = basename(sourcePath, extname(sourcePath));
  const cacheFileName = `${id}.${stat.mtimeMs}.${CARD_ARTWORK_TARGET_SIZE}.${CARD_ARTWORK_QUALITY}.webp`;
  const cachePath = join(CARD_ARTWORK_CACHE_DIR, cacheFileName);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }
  const buffer = await sharp(sourcePath)
    .resize(CARD_ARTWORK_TARGET_SIZE, CARD_ARTWORK_TARGET_SIZE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: CARD_ARTWORK_QUALITY })
    .toBuffer();
  mkdirSync(CARD_ARTWORK_CACHE_DIR, { recursive: true });
  writeFileSync(cachePath, buffer);
  return buffer;
}

/**
 * Eigenständiges Pendant zu `staticArtPlugin` NUR für Karten-Artwork: liefert
 * nicht die Quell-PNGs 1:1 aus, sondern verkleinerte, neu komprimierte WebPs
 * (s. `transformCardArtworkToWebp` oben) - Begründung/Zielgröße s.
 * `CARD_ARTWORK_TARGET_SIZE`-Kommentar. Die Quelldateien unter
 * `docs/cards/artworks/` bleiben dabei unverändert (vom Nutzer gepflegter
 * Ablageort, s. `docs/cards/card-art-brief.md`) - transformiert wird jeweils
 * nur die ausgelieferte Kopie:
 * - **Dev**: die Middleware transformiert on-the-fly und cached das Ergebnis
 *   (s. `CARD_ARTWORK_CACHE_DIR`), damit nicht bei jedem Request neu
 *   komprimiert wird.
 * - **Build**: `closeBundle` transformiert einmalig alle Quelldateien und
 *   schreibt die WebPs direkt nach `<outDir>/cards/artworks/` - kein
 *   Kopieren der (deutlich größeren) PNG-Rohdaten in den Produktions-Output.
 */
function cardArtworkPlugin(): Plugin {
  let outDirAbs = "";
  let isBuildCommand = false;
  return {
    name: "card-artwork-webp-serve",
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
        if (!req.url || !req.url.startsWith(CARD_ARTWORK_URL_PREFIX)) {
          next();
          return;
        }
        const rawName = req.url.slice(CARD_ARTWORK_URL_PREFIX.length).split("?")[0] ?? "";
        const fileName = decodeURIComponent(rawName);
        // Kein Directory-Traversal über den Dateinamen zulassen; ausgeliefert
        // wird ausschließlich `.webp` (s. artworkFileName() in cardArt.ts) -
        // alles andere durchreichen statt zu versuchen, es zu transformieren.
        if (
          !fileName ||
          fileName.includes("/") ||
          fileName.includes("\\") ||
          fileName.includes("..") ||
          extname(fileName).toLowerCase() !== ".webp"
        ) {
          next();
          return;
        }
        const sourcePath = join(CARD_ARTWORK_SOURCE_DIR, `${basename(fileName, ".webp")}.png`);
        if (!existsSync(sourcePath)) {
          // Normalfall, solange das jeweilige Artwork (noch) nicht abgelegt
          // wurde — einfach durchreichen, damit der Browser ein reguläres
          // 404 sieht (löst im Frontend den CSS-Fallback aus, s. cardArt.ts).
          next();
          return;
        }
        transformCardArtworkToWebp(sourcePath)
          .then((buffer) => {
            res.setHeader("Content-Type", "image/webp");
            res.end(buffer);
          })
          .catch((err) => next(err));
      });
    },
    closeBundle() {
      if (!isBuildCommand) return;
      if (!existsSync(CARD_ARTWORK_SOURCE_DIR)) return;
      const outDir = join(outDirAbs, "cards", "artworks");
      mkdirSync(outDir, { recursive: true });
      const entries = readdirSync(CARD_ARTWORK_SOURCE_DIR).filter(
        (entry) => extname(entry).toLowerCase() === ".png",
      );
      return (async () => {
        for (const entry of entries) {
          const buffer = await transformCardArtworkToWebp(join(CARD_ARTWORK_SOURCE_DIR, entry));
          const outName = `${basename(entry, extname(entry))}.webp`;
          writeFileSync(join(outDir, outName), buffer);
        }
      })();
    },
  };
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

/**
 * Erzeugt den Quelltext des Service Workers (offline-fähiges PWA-Caching,
 * s. `serviceWorkerPlugin()` unten) als reinen, unkompilierten JS-String -
 * der Service Worker läuft außerhalb des Vite-Modulgraphen (eigener
 * Browser-Kontext, kein `import`), daher wird er bewusst nicht durch den
 * TS-Compiler/Vite-Bundler geschickt, sondern hier direkt als Text gebaut und
 * unverändert ausgeliefert.
 *
 * Strategie: Runtime-Caching statt eines festen Precache-Manifests. Precaching
 * würde bedeuten, bei jedem Build alle tatsächlich erzeugten Bundle-Dateinamen
 * (contenthash-basiert, ändern sich pro Build) UND alle ~300 Karten-Artwork-
 * Dateien unter `docs/cards/artworks/` (laufend vom Nutzer erweiterbar, s.
 * `cardArtworkPlugin` oben) in eine Liste einzutragen und synchron zu halten -
 * das wäre für dieses Hobby-Projekt unnötig wartungsaufwändig und
 * fehleranfällig (vergisst man eine Datei, bricht Offline-Betrieb dafür
 * lautlos). Runtime-Caching braucht dagegen keine Dateiliste: alles, was
 * innerhalb des Scopes tatsächlich einmal erfolgreich geladen wurde
 * (Bundles, Karten-/Szenen-Artwork, Musik, SFX, Manifest, Icons - alle laufen
 * unter `/deckbuilder/...`, s. Plugins oben), landet automatisch im Cache und
 * steht danach offline zur Verfügung. Der Preis: die allererste Anzeige einer
 * Datei erfordert zwingend eine Netzwerkverbindung - für ein Kinder-Hub-Spiel,
 * das ohnehin online installiert wird, ein akzeptabler Kompromiss.
 *
 * Cache-Versionierung: `version` (s. Aufrufer) ist ein Build-Zeitstempel und
 * fließt in `CACHE_NAME` UND damit in den Bytestream dieser Datei selbst ein -
 * jeder `vite build` erzeugt dadurch ein inhaltlich anderes `sw.js`. Browser
 * erkennen Service-Worker-Updates über einen reinen Byte-Vergleich der Datei,
 * lösen darüber zuverlässig den install -> activate-Lifecycle aus, und
 * `activate` unten löscht dabei jeden Cache, dessen Name nicht mehr zur
 * aktuellen `CACHE_NAME` passt (= jeder Stand eines vorherigen Deploys) - so
 * bleiben nach einem neuen `./deploy-build.sh` keine alten JS-/CSS-Bundles im
 * Cache hängen.
 */
function buildServiceWorkerSource(version: string): string {
  return `// Automatisch erzeugt von serviceWorkerPlugin() in vite.config.ts bei
// jedem "vite build" - nicht von Hand bearbeiten, Änderungen gehören in
// buildServiceWorkerSource() dort.
const CACHE_NAME = "deckbuilder-runtime-${version}";

// Scope dynamisch aus der eigenen URL ableiten (z.B.
// "https://host/deckbuilder/sw.js" -> "/deckbuilder/") statt hartkodiert -
// funktioniert damit unveraendert unter jedem Sub-Path/Origin und beruehrt
// keine anderen Apps im selben Kids-Games-Hub-Origin (Malen, Tetris, ...).
const SCOPE_PATH = new URL(".", self.location.href).pathname;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell = await caches.match(SCOPE_PATH);
    if (shell) return shell;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  // Range-Requests (Audio-Seeking bei Musik/SFX, s. musicPlayer.ts/
  // sfxPlayer.ts) nie aus dem Cache bedienen - eine gecachte 206-Partial-
  // Response waere bei einem anderen angefragten Bytebereich falsch.
  if (request.headers.has("range")) return;

  const url = new URL(request.url);
  // Nur same-origin UND nur innerhalb des eigenen Scopes behandeln - andere
  // Hub-Apps im selben Origin (Malen, Tetris, ...) bleiben unberuehrt.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE_PATH)) return;

  // App-Shell (index.html / Navigations-Requests): network-first, damit nach
  // einem neuen Deploy bei bestehender Verbindung sofort die aktuelle HTML
  // (mit neuen Bundle-Hashes) geladen wird; offline faellt es auf die zuletzt
  // gecachte Version zurueck.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Alles andere (gehashte JS-/CSS-Bundles, Karten-/Szenen-Artwork, Musik,
  // SFX, Manifest, Icons): cache-first mit Runtime-Caching-Fallback, s.
  // Datei-Kommentar oben.
  event.respondWith(cacheFirst(request));
});
`;
}

/**
 * Registriert `buildServiceWorkerSource()` als eigenständige Build-Ausgabe
 * `<outDir>/sw.js`. Nur im Produktions-Build aktiv (kein Dev-Middleware-
 * Gegenstueck): main.ts registriert den Service Worker bewusst nur, wenn
 * `import.meta.env.PROD` ist (s. dortiger Kommentar) - ein Service Worker im
 * Vite-Dev-Server wuerde ansonsten Modul-/Asset-Fetches abfangen und cachen,
 * was mit Vites eigenem HMR (Hot Module Replacement, das auf frischen,
 * unveraenderten Netzwerk-Antworten pro Edit beruht) kollidieren wuerde.
 */
function serviceWorkerPlugin(): Plugin {
  let outDirAbs = "";
  let isBuildCommand = false;
  return {
    name: "service-worker-generate",
    configResolved(config) {
      outDirAbs = resolve(config.root, config.build.outDir);
      // s. staticArtPlugin#configResolved - gleicher Grund fuer die explizite
      // Pruefung auf den echten Build-Befehl statt uns auf den bloßen
      // closeBundle-Hook-Aufruf zu verlassen (Vitest ruft closeBundle auch
      // mit einem nicht-existenten Platzhalter-outDir auf).
      isBuildCommand = config.command === "build";
    },
    closeBundle() {
      if (!isBuildCommand) return;
      mkdirSync(outDirAbs, { recursive: true });
      const version = String(Date.now());
      writeFileSync(join(outDirAbs, "sw.js"), buildServiceWorkerSource(version));
    },
  };
}

export default defineConfig(({ command }) => ({
  root: ".",
  // Im Produktions-Build läuft die App unter dem Unterpfad `/deckbuilder/` des
  // Kids-Games-Hubs (nginx, single origin) — `base` sorgt dafür, dass die von
  // Vite gebündelten Assets UND die über `asset()` (s. src/ui/assetUrl.ts)
  // aufgelösten SFX-/Musik-/Artwork-URLs dieses Präfix erhalten. Im Dev-Server
  // (`vite`) bleibt es beim Root "/", damit die oben registrierten
  // Asset-Middlewares (`/sfx/`, `/music/`, ...) unverändert greifen.
  base: command === "build" ? "/deckbuilder/" : "/",
  plugins: [
    cardArtworkPlugin(),
    sceneArtPlugin(),
    musicPlugin(),
    musicIndexPlugin(),
    sfxPlugin(),
    serviceWorkerPlugin(),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist-ui",
  },
}));
