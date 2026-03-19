import { calculateDelay } from "./timing";
import type { WordToken } from "../types/word";

export type SchedulerCallbacks = {
  getWords: () => WordToken[];
  getCurrentIndex: () => number;
  getWpm: () => number;
  getIsPlaying: () => boolean;
  setCurrentIndex: (i: number) => void;
  onWordDisplayed: (word: WordToken, actualDelayMs: number) => void;
  onFinished: () => void;
};

let timeoutId: ReturnType<typeof setTimeout> | null = null;
let lastTickTime = 0;

export function startScheduler(cb: SchedulerCallbacks) {
  stopScheduler();
  lastTickTime = performance.now();
  scheduleNext(cb);
}

export function stopScheduler() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function scheduleNext(cb: SchedulerCallbacks) {
  if (!cb.getIsPlaying()) return;

  const words = cb.getWords();
  const idx = cb.getCurrentIndex();
  if (idx >= words.length) {
    cb.onFinished();
    return;
  }

  const word = words[idx];
  const baseDelay = 60000 / cb.getWpm();
  const targetDelay = calculateDelay(word, baseDelay);

  const now = performance.now();
  const drift = now - lastTickTime;
  const adjustedDelay = Math.max(10, targetDelay - (drift - targetDelay));

  timeoutId = setTimeout(() => {
    lastTickTime = performance.now();
    const actualDelay = lastTickTime - now;
    cb.onWordDisplayed(word, actualDelay);
    cb.setCurrentIndex(idx + 1);
    scheduleNext(cb);
  }, idx === 0 ? targetDelay : adjustedDelay);
}
