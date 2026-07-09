/**
 * Winziger Hyperscript-artiger DOM-Helper - kein Framework, nur Komfort, um
 * das UI ohne innerHTML-Strings (XSS-Fallen, unhandliches Escaping) zu bauen.
 * Bewusst gewählt statt React/JSX (siehe docs/frontend-status.md): das Board
 * ist reines "State rein -> DOM raus"-Rendering ohne komplexe Komponenten-
 * Lebenszyklen, dafür reicht Vanilla-TS + ein winziger Helper völlig aus.
 */

export type Attrs = Record<string, string | number | boolean | undefined | ((ev: Event) => void)>;
export type Child = Node | string | undefined | null | false;

export function h(tag: string, attrs: Attrs = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === "class") {
      el.className = String(value);
    } else if (value === true) {
      el.setAttribute(key, "");
    } else {
      el.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === undefined || child === null || child === false) continue;
    el.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

export function text(s: string | number): Text {
  return document.createTextNode(String(s));
}
