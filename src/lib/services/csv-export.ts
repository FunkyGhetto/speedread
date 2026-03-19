import type { ReadingSession } from "../types/config";

export function sessionsToCSV(sessions: ReadingSession[]): string {
  const headers = ["Date", "Title", "Words", "Avg WPM", "Target WPM", "Time (s)", "Time Saved %"];
  const rows = sessions.map(s => [
    s.date,
    `"${s.title.replace(/"/g, '""')}"`,
    s.wordCount,
    s.averageWpm,
    s.targetWpm,
    s.totalTimeSeconds.toFixed(1),
    s.timeSavedPercent,
  ].join(","));
  return [headers.join(","), ...rows].join("\n");
}

export async function exportCSV(sessions: ReadingSession[]) {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      defaultPath: "speedread-stats.csv",
      filters: [{ name: "CSV", extensions: ["csv"] }],
    });
    if (path) {
      await writeTextFile(path, sessionsToCSV(sessions));
    }
  } catch {
    const csv = sessionsToCSV(sessions);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "speedread-stats.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
}
