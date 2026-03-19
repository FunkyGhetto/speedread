export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface FileModification {
  path: string;
  action: "create" | "modify" | "delete";
  originalContent?: string;
  newContent: string;
  explanation: string;
}