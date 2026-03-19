import type { AiMessage, FileModification } from "../types/ai";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface UndoEntry {
  timestamp: number;
  description: string;
  files: { path: string; content: string }[];
  config: boolean;
}

// Persistent chat state — survives tab switches
let messages = $state<ChatMessage[]>([]);
let chatHistory = $state<AiMessage[]>([]);
let pendingMods = $state<FileModification[]>([]);
let undoStack = $state<UndoEntry[]>([]);

export function getMessages() { return messages; }
export function addMessage(msg: ChatMessage) { messages = [...messages, msg]; }
export function getChatHistory() { return chatHistory; }
export function addChatHistory(userMsg: string, assistantMsg: string) {
  chatHistory = [
    ...chatHistory,
    { role: "user" as const, content: userMsg },
    { role: "assistant" as const, content: assistantMsg },
  ];
}
export function getPendingMods() { return pendingMods; }
export function setPendingMods(mods: FileModification[]) { pendingMods = mods; }
export function removePendingMod(mod: FileModification) {
  pendingMods = pendingMods.filter(m => m !== mod);
}
export function getUndoStack() { return undoStack; }
export function pushUndo(entry: UndoEntry) {
  undoStack = [...undoStack.slice(-19), entry];
}
export function popUndo() {
  const entry = undoStack[undoStack.length - 1];
  undoStack = undoStack.slice(0, -1);
  return entry;
}
