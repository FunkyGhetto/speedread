import type { ReadingSession } from "../types/config";

let sessionWordTimings = $state<number[]>([]);
let history = $state<ReadingSession[]>([]);

export function getSessionWordTimings() { return sessionWordTimings; }
export function getHistory() { return history; }

export function getAverageWpm(): number {
  if (sessionWordTimings.length === 0) return 0;
  const avgMs = sessionWordTimings.reduce((a, b) => a + b, 0) / sessionWordTimings.length;
  return Math.round(60000 / avgMs);
}

export function getTotalTimeSeconds(): number {
  return sessionWordTimings.reduce((a, b) => a + b, 0) / 1000;
}

export function getTimeSavedPercent(): number {
  if (sessionWordTimings.length === 0) return 0;
  const normalTime = (sessionWordTimings.length / 238) * 60;
  const actualTime = getTotalTimeSeconds();
  if (normalTime <= 0) return 0;
  return Math.round(((normalTime - actualTime) / normalTime) * 100);
}

export function addWordTiming(delayMs: number) {
  sessionWordTimings = [...sessionWordTimings, delayMs];
}

export function resetSession() {
  sessionWordTimings = [];
}

export function finishSession(wordCount: number, targetWpm: number, title: string) {
  const session: ReadingSession = {
    id: crypto.randomUUID(),
    date: new Date().toISOString(),
    title,
    wordCount,
    averageWpm: getAverageWpm(),
    targetWpm,
    totalTimeSeconds: getTotalTimeSeconds(),
    timeSavedPercent: getTimeSavedPercent(),
  };
  history = [...history, session];
  return session;
}

export function loadHistory(sessions: ReadingSession[]) {
  history = sessions;
}
