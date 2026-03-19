import type { Settings } from "../types/config";

let theme = $state<"light" | "dark" | "system">("system");
let fontSize = $state(32);
let fontFamily = $state("system-ui");
let orpColor = $state("#ff2d00");
let defaultWpm = $state(300);

export function getTheme() { return theme; }
export function getFontSize() { return fontSize; }
export function getFontFamily() { return fontFamily; }
export function getOrpColor() { return orpColor; }
export function getDefaultWpm() { return defaultWpm; }

export function setTheme(v: "light" | "dark" | "system") { theme = v; }
export function setFontSize(v: number) { fontSize = Math.max(16, Math.min(64, v)); }
export function setFontFamily(v: string) { fontFamily = v; }
export function setOrpColor(v: string) { orpColor = v; }
export function setDefaultWpm(v: number) { defaultWpm = Math.max(100, Math.min(1000, v)); }

export function getSettings(): Settings {
  return { theme, fontSize, fontFamily, orpColor, defaultWpm };
}

export function loadSettings(s: Partial<Settings>) {
  if (s.theme) theme = s.theme;
  if (s.fontSize) fontSize = s.fontSize;
  if (s.fontFamily) fontFamily = s.fontFamily;
  if (s.orpColor) orpColor = s.orpColor;
  if (s.defaultWpm) defaultWpm = s.defaultWpm;
}
