import { defineConfig } from "vite";

/**
 * Frontend-Build-Setup (frontend-engineer). Vite statt z.B. Webpack/CRA,
 * weil es für ein Hobby-Projekt ohne Zusatzkonfiguration mit reinem
 * TypeScript funktioniert (siehe docs/frontend-status.md für die Begründung,
 * warum Vanilla-TS statt React gewählt wurde).
 */
export default defineConfig({
  root: ".",
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist-ui",
  },
});
