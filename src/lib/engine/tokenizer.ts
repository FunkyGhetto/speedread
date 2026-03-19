import type { WordToken } from "../types/word";
import { calculateOrpIndex } from "./orp";

function countSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z\u00E0-\u00F6\u00F8-\u00FF]/g, "");
  if (cleaned.length <= 3) return 1;
  const vowelGroups = cleaned.match(/[aeiouy\u00E0-\u00F6\u00F8-\u00FF]+/g);
  let count = vowelGroups ? vowelGroups.length : 1;
  if (cleaned.endsWith("e") && count > 1) count--;
  if (cleaned.endsWith("le") && !cleaned.endsWith("ale")) count++;
  return Math.max(1, count);
}

function detectPunctuation(word: string): WordToken["punctuationType"] {
  const trimmed = word.trimEnd();
  const last = trimmed[trimmed.length - 1];
  if (!last) return "none";
  if (".!?".includes(last)) return "sentence_end";
  if (",;:".includes(last)) return "clause";
  return "none";
}

/** Allowed characters: letters, numbers, and . , ? ! ( ) : ; */
const ALLOWED_RE = /[^\p{L}\p{N}.,?!():;]/gu;

/** Strip all disallowed symbols from display string */
function sanitizeDisplay(word: string): string {
  return word.replace(ALLOWED_RE, "");
}

/** Extract only the letter/number core for ORP calculation */
function lettersOnly(word: string): string {
  return word.replace(/[^\p{L}\p{N}]/gu, "");
}

/** Check if a token is purely symbols (no letters or digits) */
function isPureSymbol(word: string): boolean {
  return !/[\p{L}\p{N}]/u.test(word);
}

export function tokenize(text: string): WordToken[] {
  // Split purely on whitespace — a word is what's between spaces
  const allWords = text.split(/\s+/).filter(Boolean);
  const tokens: WordToken[] = [];
  let index = 0;

  for (let wi = 0; wi < allWords.length; wi++) {
    const raw = allWords[wi];

    // Skip standalone symbols (no letters/numbers)
    if (isPureSymbol(raw)) continue;

    // Sanitize: keep letters, numbers, and allowed punctuation only
    const display = sanitizeDisplay(raw);
    if (!display) continue;
    const letters = lettersOnly(raw);
    if (!letters) continue;

    // Find the ORP position in the full display string
    const orpLetterIndex = calculateOrpIndex(letters);
    let orpDisplayIndex = 0;
    let letterCount = 0;
    for (let ci = 0; ci < display.length; ci++) {
      if (/[\p{L}\p{N}]/u.test(display[ci])) {
        if (letterCount === orpLetterIndex) {
          orpDisplayIndex = ci;
          break;
        }
        letterCount++;
      }
    }

    const token: WordToken = {
      raw,
      display,
      orpIndex: orpDisplayIndex,
      delay: 0,
      punctuationType: detectPunctuation(raw),
      syllableCount: countSyllables(raw),
      isParaEnd: false,
      index,
    };
    tokens.push(token);
    index++;
  }

  return tokens;
}
