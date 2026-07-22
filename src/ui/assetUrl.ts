/**
 * Präfixiert einen wurzel-relativen Asset-Pfad (SFX, Musik, Karten-/Szenen-
 * Artwork - alles Dateien, die neben `index.html` ausgeliefert werden, s.
 * vite.config.ts) mit dem in Vite konfigurierten `base`. So funktioniert die
 * App sowohl im Dev-Root ("/") als auch unter einem Unterpfad im Deployment
 * (z.B. "/deckbuilder/" im Kids-Games-Hub).
 *
 * `import.meta.env.BASE_URL` endet per Vite-Konvention immer auf "/", daher
 * wird ein evtl. führender Slash des übergebenen Pfads entfernt, bevor beide
 * zusammengesetzt werden (kein doppelter Slash).
 */
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, "");
}
