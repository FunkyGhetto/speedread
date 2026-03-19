import Anthropic from "@anthropic-ai/sdk";
import type { AiMessage } from "../types/ai";

let client: Anthropic | null = null;

export const AVAILABLE_MODELS = [
  { id: "claude-opus-4-6", label: "Opus 4.6 (latest, most capable)" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 (latest, fast)" },
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5 (fastest)" },
  { id: "claude-opus-4-5-20251101", label: "Opus 4.5" },
  { id: "claude-sonnet-4-5-20250929", label: "Sonnet 4.5" },
  { id: "claude-opus-4-1-20250805", label: "Opus 4.1" },
  { id: "claude-sonnet-4-20250514", label: "Sonnet 4" },
  { id: "claude-opus-4-20250514", label: "Opus 4" },
] as const;

export function initClient(apiKey: string) {
  client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function isClientReady(): boolean {
  return client !== null;
}

export async function sendMessage(
  systemPrompt: string,
  messages: AiMessage[],
  model: string = "claude-sonnet-4-6"
): Promise<string> {
  if (!client) throw new Error("Set your API key first.");
  const response = await client.messages.create({
    model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
  });
  const block = response.content[0];
  return block.type === "text" ? block.text : "";
}
