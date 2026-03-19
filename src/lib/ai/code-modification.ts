import { sendMessage } from "./claude-client";
import { SYSTEM_PROMPT_DEV } from "./prompts";
import type { AiMessage, FileModification } from "../types/ai";
import type { AiUiConfig } from "../types/config";
import { getAppSnapshot, logError } from "../state/runtime-log.svelte";
import { getSelectedModel } from "../state/ai-config.svelte";

async function tauriInvoke(cmd: string, args: Record<string, unknown>): Promise<unknown> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke(cmd, args);
}

export async function listSourceFiles(): Promise<string[]> {
  try { return await tauriInvoke("list_source_files", { dir: "src" }) as string[]; }
  catch (e: any) { logError("FileOps", `listSourceFiles failed: ${e?.message || e}`); return []; }
}

export async function readSourceFile(path: string): Promise<string> {
  try { return await tauriInvoke("read_source_file", { path }) as string; }
  catch (e: any) { logError("FileOps", `readSourceFile(${path}) failed: ${e?.message || e}`); return ""; }
}

export async function writeSourceFile(path: string, content: string): Promise<void> {
  await tauriInvoke("write_source_file", { path, content });
}

export async function fetchWebPage(url: string): Promise<{ url: string; text: string }> {
  try {
    return await tauriInvoke("fetch_web_page", { url }) as { url: string; text: string };
  } catch (e: any) {
    logError("WebFetch", `fetchWebPage(${url}) failed: ${e?.message || e}`);
    return { url, text: `Error fetching: ${e?.message || e}` };
  }
}

export interface DevResponse {
  modifications: FileModification[];
  configChange: AiUiConfig | null;
  textAnswer: string;
  rawResponse: string;
}

export async function processDevRequest(
  userMessage: string,
  conversationHistory: AiMessage[]
): Promise<DevResponse> {
  const snapshot = getAppSnapshot();
  const model = getSelectedModel();

  const fileList = await listSourceFiles();
  const relevantFiles = selectRelevantFiles(userMessage, fileList);
  const fileContents: { path: string; content: string }[] = [];
  for (const f of relevantFiles.slice(0, 5)) {
    const content = await readSourceFile(f);
    if (content) fileContents.push({ path: f, content });
  }

  // Fetch any URLs mentioned in the user message
  const urlRegex = /https?:\/\/[^\s"'<>]+/g;
  const urls = userMessage.match(urlRegex) || [];
  const webResults: string[] = [];
  for (const url of urls.slice(0, 2)) {
    const result = await fetchWebPage(url);
    webResults.push(`--- WEB: ${result.url} ---\n${result.text}`);
  }

  const contextMsg = [
    snapshot,
    "",
    "=== RELEVANT SOURCE FILES ===",
    ...fileContents.map(f => `--- ${f.path} ---\n${f.content}`),
    ...(webResults.length > 0 ? ["", "=== WEB CONTENT ===", ...webResults] : []),
    "",
    "---",
    "User message: " + userMessage,
  ].join("\n");

  const messages: AiMessage[] = [
    ...conversationHistory,
    { role: "user", content: contextMsg },
  ];
  const response = await sendMessage(SYSTEM_PROMPT_DEV, messages, model);

  const modifications = parseModifications(response, fileContents);
  const configChange = parseConfigChange(response);
  const textAnswer = response
    .replace(/```json[\s\S]*?```/g, "")
    .replace(/```config[\s\S]*?```/g, "")
    .trim();

  return { modifications, configChange, textAnswer, rawResponse: response };
}

function parseConfigChange(response: string): AiUiConfig | null {
  const match = response.match(/```config\n([\s\S]*?)\n```/);
  if (!match) return null;
  try { return JSON.parse(match[1]); }
  catch { return null; }
}

function selectRelevantFiles(query: string, files: string[]): string[] {
  const q = query.toLowerCase();
  const scored = files.map(f => {
    let score = 0;
    const fl = f.toLowerCase();
    if (fl.includes(".svelte")) score += 2;
    if (q.includes("stat") && fl.includes("stat")) score += 5;
    if (q.includes("theme") && (fl.includes("theme") || fl.includes("setting"))) score += 5;
    if (q.includes("reader") && fl.includes("reader")) score += 5;
    if (q.includes("display") && fl.includes("rsvp")) score += 5;
    if (q.includes("ai") && fl.includes("ai")) score += 5;
    if (q.includes("input") && fl.includes("input")) score += 5;
    if (q.includes("url") && fl.includes("url")) score += 5;
    if (q.includes("error") || q.includes("feil")) score += 2;
    if (fl.includes("app.svelte")) score += 3;
    if (fl.includes("state/")) score += 2;
    if (fl.includes("prompt")) score += 3;
    return { file: f, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map(s => s.file);
}

function parseModifications(
  response: string,
  existingFiles: { path: string; content: string }[]
): FileModification[] {
  const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
  if (!jsonMatch) return [];
  try {
    const mods = JSON.parse(jsonMatch[1]) as Array<{
      path: string; action: string; content: string; explanation: string;
    }>;
    return mods.map(m => ({
      path: m.path,
      action: (m.action || "modify") as FileModification["action"],
      originalContent: existingFiles.find(f => f.path === m.path)?.content,
      newContent: m.content,
      explanation: m.explanation || "",
    }));
  } catch { return []; }
}
