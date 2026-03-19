import type { WordToken } from "../types/word";
import { startScheduler, stopScheduler } from "../engine/scheduler";
import { addWordTiming, finishSession } from "./stats.svelte";
import { logAction } from "./runtime-log.svelte";

let words = $state<WordToken[]>([]);
let currentIndex = $state(0);
let isPlaying = $state(false);
let wpm = $state(300);
let chunkSize = $state(1);
let textTitle = $state("Untitled");

export function getWords() { return words; }
export function getCurrentIndex() { return currentIndex; }
export function getIsPlaying() { return isPlaying; }
export function getWpm() { return wpm; }
export function getChunkSize() { return chunkSize; }
export function getTextTitle() { return textTitle; }
export function getProgress() { return words.length > 0 ? currentIndex / words.length : 0; }
export function getTotalWords() { return words.length; }

export function loadText(tokens: WordToken[], title?: string) {
  stopScheduler();
  words = tokens;
  currentIndex = 0;
  isPlaying = false;
  textTitle = title || "Untitled";
}

export function play() {
  if (words.length === 0) return;
  if (currentIndex >= words.length) currentIndex = 0;
  isPlaying = true;
  logAction("Reader", `Play at ${wpm} WPM, word ${currentIndex}/${words.length}`);
  startScheduler({
    getWords: () => words,
    getCurrentIndex: () => currentIndex,
    getWpm: () => wpm,
    getIsPlaying: () => isPlaying,
    setCurrentIndex: (i) => { currentIndex = i; },
    onWordDisplayed: (word, actualDelayMs) => {
      addWordTiming(actualDelayMs);
    },
    onFinished: () => {
      isPlaying = false;
      logAction("Reader", `Finished reading "${textTitle}" (${words.length} words)`);
      finishSession(words.length, wpm, textTitle);
    },
  });
}

export function pause() {
  isPlaying = false;
  logAction("Reader", `Paused at word ${currentIndex}/${words.length}`);
  stopScheduler();
}

export function toggle() {
  if (isPlaying) pause();
  else play();
}

export function setWpm(value: number) {
  wpm = Math.max(100, Math.min(1000, value));
  if (isPlaying) {
    stopScheduler();
    startScheduler({
      getWords: () => words,
      getCurrentIndex: () => currentIndex,
      getWpm: () => wpm,
      getIsPlaying: () => isPlaying,
      setCurrentIndex: (i) => { currentIndex = i; },
      onWordDisplayed: (_word, actualDelayMs) => { addWordTiming(actualDelayMs); },
      onFinished: () => { isPlaying = false; finishSession(words.length, wpm, textTitle); },
    });
  }
}

export function rewind(n: number) {
  currentIndex = Math.max(0, currentIndex - n);
}

export function skipForward(n: number) {
  currentIndex = Math.min(words.length - 1, currentIndex + n);
}

export function seekTo(index: number) {
  currentIndex = Math.max(0, Math.min(words.length - 1, index));
}

export function setChunkSize(size: number) {
  chunkSize = Math.max(1, Math.min(3, size));
}
