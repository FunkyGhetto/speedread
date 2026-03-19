import type { Settings, ReadingSession, Bookmark, AiUiConfig } from "../types/config";

let tauriFs: typeof import("@tauri-apps/plugin-fs") | null = null;

async function getFs() {
  if (!tauriFs) {
    try {
      tauriFs = await import("@tauri-apps/plugin-fs");
    } catch {
      return null;
    }
  }
  return tauriFs;
}

async function ensureDir(dir: string = "speedread") {
  const fs = await getFs();
  if (!fs) return;
  try {
    await fs.mkdir(dir, { baseDir: fs.BaseDirectory.AppData, recursive: true });
  } catch { /* already exists */ }
}

async function writeJson(filename: string, data: unknown) {
  const fs = await getFs();
  if (!fs) return;
  try {
    await ensureDir();
    await fs.writeTextFile(`speedread/${filename}`, JSON.stringify(data, null, 2), {
      baseDir: fs.BaseDirectory.AppData,
    });
  } catch (e) {
    console.warn(`[persistence] Failed to write ${filename}:`, e);
  }
}

async function readJson<T>(filename: string): Promise<T | null> {
  const fs = await getFs();
  if (!fs) return null;
  try {
    const text = await fs.readTextFile(`speedread/${filename}`, {
      baseDir: fs.BaseDirectory.AppData,
    });
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: Settings) { await writeJson("settings.json", settings); }
export async function loadSettings(): Promise<Settings | null> { return readJson<Settings>("settings.json"); }

export async function saveHistory(sessions: ReadingSession[]) { await writeJson("history.json", sessions); }
export async function loadHistory(): Promise<ReadingSession[] | null> { return readJson<ReadingSession[]>("history.json"); }

export async function saveBookmarks(bookmarks: Bookmark[]) { await writeJson("bookmarks.json", bookmarks); }
export async function loadBookmarks(): Promise<Bookmark[] | null> { return readJson<Bookmark[]>("bookmarks.json"); }

export async function saveAiConfig(config: AiUiConfig) { await writeJson("ai-config.json", config); }
export async function loadAiConfig(): Promise<AiUiConfig | null> { return readJson<AiUiConfig>("ai-config.json"); }

export async function saveApiKey(key: string) { await writeJson("api-key.json", { key }); }
export async function loadApiKey(): Promise<string | null> {
  const data = await readJson<{ key: string }>("api-key.json");
  return data?.key || null;
}

export async function saveSelectedModel(model: string) { await writeJson("selected-model.json", { model }); }
export async function loadSelectedModel(): Promise<string | null> {
  const data = await readJson<{ model: string }>("selected-model.json");
  return data?.model || null;
}

// === Backup system for DEV code changes ===

export async function saveBackup(filename: string, content: string): Promise<string | null> {
  const fs = await getFs();
  if (!fs) return null;
  try {
    await ensureDir("speedread/backups");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeName = filename.replace(/\//g, "_");
    const backupName = `${timestamp}_${safeName}`;
    await fs.writeTextFile(`speedread/backups/${backupName}`, content, {
      baseDir: fs.BaseDirectory.AppData,
    });
    return backupName;
  } catch (e) {
    console.warn(`[persistence] Failed to save backup for ${filename}:`, e);
    return null;
  }
}

export async function listBackups(): Promise<string[]> {
  const fs = await getFs();
  if (!fs) return [];
  try {
    const entries = await fs.readDir("speedread/backups", { baseDir: fs.BaseDirectory.AppData });
    return entries
      .filter(e => e.name && !e.isDirectory)
      .map(e => e.name!)
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function readBackup(backupName: string): Promise<string | null> {
  const fs = await getFs();
  if (!fs) return null;
  try {
    return await fs.readTextFile(`speedread/backups/${backupName}`, {
      baseDir: fs.BaseDirectory.AppData,
    });
  } catch {
    return null;
  }
}
