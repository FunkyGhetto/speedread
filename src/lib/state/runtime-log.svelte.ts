import {
  getWords, getCurrentIndex, getIsPlaying, getWpm,
  getChunkSize, getTextTitle, getTotalWords
} from "./reader.svelte";
import {
  getAverageWpm, getTotalTimeSeconds, getTimeSavedPercent,
  getSessionWordTimings, getHistory
} from "./stats.svelte";
import { getTheme, getFontSize, getFontFamily } from "./settings.svelte";
import { getAiConfig, getApiKey, getSelectedModel } from "./ai-config.svelte";
import { getBookmarks } from "./bookmarks.svelte";

export interface LogEntry {
  timestamp: number;
  type: "error" | "action" | "state";
  source: string;
  message: string;
}

let logs = $state<LogEntry[]>([]);
const MAX_LOGS = 50;

export function getLogs() { return logs; }

export function log(type: LogEntry["type"], source: string, message: string) {
  logs = [...logs.slice(-(MAX_LOGS - 1)), { timestamp: Date.now(), type, source, message }];
}

export function logError(source: string, message: string) {
  log("error", source, message);
}

export function logAction(source: string, message: string) {
  log("action", source, message);
}

export function clearLogs() {
  logs = [];
}

export function getAppSnapshot(): string {
  const readerState = {
    isPlaying: getIsPlaying(),
    wpm: getWpm(),
    currentIndex: getCurrentIndex(),
    totalWords: getTotalWords(),
    chunkSize: getChunkSize(),
    textTitle: getTextTitle(),
  };

  const statsState = {
    averageWpm: getAverageWpm(),
    totalTimeSeconds: getTotalTimeSeconds(),
    timeSavedPercent: getTimeSavedPercent(),
    wordsTimedThisSession: getSessionWordTimings().length,
    totalHistorySessions: getHistory().length,
  };

  const settingsState = {
    theme: getTheme(),
    fontSize: getFontSize(),
    fontFamily: getFontFamily(),
  };

  const aiState = {
    apiKeySet: !!getApiKey(),
    selectedModel: getSelectedModel(),
    configOverrides: getAiConfig(),
    bookmarkCount: getBookmarks().length,
  };

  const recentLogs = logs.slice(-25).map(l => {
    const time = new Date(l.timestamp).toLocaleTimeString();
    return `[${time}] ${l.type.toUpperCase()} (${l.source}): ${l.message}`;
  });

  return [
    "=== APP RUNTIME STATE ===",
    "",
    "Reader: " + JSON.stringify(readerState),
    "Stats: " + JSON.stringify(statsState),
    "Settings: " + JSON.stringify(settingsState),
    "AI: " + JSON.stringify(aiState),
    "",
    "=== RECENT LOGS (" + recentLogs.length + ") ===",
    ...recentLogs,
  ].join("\n");
}
