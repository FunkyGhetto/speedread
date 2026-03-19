import type { AiUiConfig } from "../types/config";

let aiConfig = $state<AiUiConfig>({});
let apiKey = $state("");
let selectedModel = $state("claude-sonnet-4-6");

// Rsvp overrides
let bionicBoldRatio = $state(0.4);
let orpGuideVisible = $state(true);

// Timing overrides (null = use defaults)
let timingSentenceEnd = $state<number | null>(null);
let timingClause = $state<number | null>(null);
let timingParagraph = $state<number | null>(null);

export function getAiConfig() { return aiConfig; }
export function getApiKey() { return apiKey; }
export function setApiKey(key: string) { apiKey = key; }
export function getSelectedModel() { return selectedModel; }
export function setSelectedModel(model: string) { selectedModel = model; }
export function getBionicBoldRatio() { return bionicBoldRatio; }
export function getOrpGuideVisible() { return orpGuideVisible; }
export function getTimingOverrides() {
  return {
    sentenceEnd: timingSentenceEnd,
    clause: timingClause,
    paragraph: timingParagraph,
  };
}

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

export function applyConfig(partial: AiUiConfig) {
  aiConfig = deepMerge(aiConfig, partial as Record<string, any>) as AiUiConfig;
  const root = document.documentElement;

  if (partial.colors) {
    const c = partial.colors;
    if (c.background) root.style.setProperty("--bg", c.background);
    if (c.foreground) root.style.setProperty("--fg", c.foreground);
    if (c.orpColor) root.style.setProperty("--orp-color", c.orpColor);
    if (c.accent) root.style.setProperty("--accent", c.accent);
    if (c.surface) root.style.setProperty("--surface", c.surface);
  }
  if (partial.fonts) {
    const f = partial.fonts;
    if (f.family) root.style.setProperty("--font-family", f.family);
    if (f.size) root.style.setProperty("--rsvp-font-size", f.size + "px");
    if (f.weight) root.style.setProperty("--font-weight", String(f.weight));
    if (f.letterSpacing) root.style.setProperty("--letter-spacing", f.letterSpacing + "em");
  }
  if (partial.rsvp) {
    if (partial.rsvp.bionicBoldRatio !== undefined) bionicBoldRatio = partial.rsvp.bionicBoldRatio;
    if (partial.rsvp.orpGuideVisible !== undefined) orpGuideVisible = partial.rsvp.orpGuideVisible;
  }
  if (partial.timing) {
    if (partial.timing.sentenceEndMultiplier !== undefined) timingSentenceEnd = partial.timing.sentenceEndMultiplier;
    if (partial.timing.clauseMultiplier !== undefined) timingClause = partial.timing.clauseMultiplier;
    if (partial.timing.paragraphMultiplier !== undefined) timingParagraph = partial.timing.paragraphMultiplier;
  }
}

export function resetConfig() {
  aiConfig = {};
  bionicBoldRatio = 0.4;
  orpGuideVisible = true;
  timingSentenceEnd = null;
  timingClause = null;
  timingParagraph = null;
  document.documentElement.removeAttribute("style");
}

export function loadAiConfig(config: AiUiConfig) {
  if (config && Object.keys(config).length > 0) applyConfig(config);
}
