import type { WordToken } from "../types/word";
import { getTimingOverrides } from "../state/ai-config.svelte";

const DEFAULTS = {
  sentenceEnd: 1.5,
  clause: 1.25,
  paragraphEnd: 1.8,
  syllables3to4: 1.3,
  syllables5plus: 1.6,
  longWord: 1.2,
};

const MAX_MULTIPLIER = 3.0;

export function calculateDelay(word: WordToken, baseDelayMs: number): number {
  const overrides = getTimingOverrides();
  let multiplier = 1.0;

  if (word.punctuationType === "sentence_end")
    multiplier *= overrides.sentenceEnd ?? DEFAULTS.sentenceEnd;
  if (word.punctuationType === "clause")
    multiplier *= overrides.clause ?? DEFAULTS.clause;
  if (word.isParaEnd)
    multiplier *= overrides.paragraph ?? DEFAULTS.paragraphEnd;
  if (word.syllableCount >= 5) multiplier *= DEFAULTS.syllables5plus;
  else if (word.syllableCount >= 3) multiplier *= DEFAULTS.syllables3to4;
  if (word.raw.length >= 10) multiplier *= DEFAULTS.longWord;

  multiplier = Math.min(multiplier, MAX_MULTIPLIER);
  return Math.round(baseDelayMs * multiplier);
}
