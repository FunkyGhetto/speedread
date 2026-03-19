<script lang="ts">
  import { isClientReady, AVAILABLE_MODELS, initClient } from "../../ai/claude-client";
  import { processDevRequest, writeSourceFile } from "../../ai/code-modification";
  import { applyConfig, resetConfig, getApiKey, setApiKey, getSelectedModel, setSelectedModel } from "../../state/ai-config.svelte";
  import { saveApiKey } from "../../services/persistence";
  import {
    getMessages, addMessage, getChatHistory, addChatHistory,
    getPendingMods, setPendingMods, removePendingMod,
    getUndoStack, pushUndo, popUndo,
  } from "../../state/dev-chat.svelte";
  import { saveBackup } from "../../services/persistence";
  import DiffPreview from "./DiffPreview.svelte";
  import type { FileModification } from "../../types/ai";
  import type { AiUiConfig } from "../../types/config";

  function renderMd(text: string): string {
    let html = text
      // Escape HTML
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      // Code blocks: ```lang\n...\n```
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_,lang,code) =>
        `<pre><code>${code.trim()}</code></pre>`)
      // Inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Headers
      .replace(/^### (.+)$/gm, "<strong>$1</strong>")
      .replace(/^## (.+)$/gm, "<strong style='font-size:14px'>$1</strong>")
      .replace(/^# (.+)$/gm, "<strong style='font-size:15px'>$1</strong>")
      // Bold + italic
      .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Blockquote
      .replace(/^&gt; (.+)$/gm, "<blockquote>$1</blockquote>")
      // Unordered list
      .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
      // Ordered list
      .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
      // Horizontal rule
      .replace(/^---$/gm, "<hr>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      // Line breaks
      .replace(/\n/g, "<br>");
    // Clean up consecutive <li> into <ul>
    html = html.replace(/(<li>.*?<\/li>(<br>)?)+/g, (match) =>
      "<ul>" + match.replace(/<br>/g, "") + "</ul>");
    return html;
  }

  let input = $state("");
  let loading = $state(false);
  let showSettings = $state(false);
  let apiKeyInput = $state(getApiKey());
  let keySaved = $state(false);
  let clientReady = $state(isClientReady());
  let messagesEl: HTMLDivElement | undefined = $state();

  // Re-sync apiKeyInput when returning to this tab
  $effect(() => {
    apiKeyInput = getApiKey();
    clientReady = isClientReady();
  });

  function scrollToBottom() {
    if (messagesEl) setTimeout(() => { messagesEl!.scrollTop = messagesEl!.scrollHeight; }, 50);
  }

  async function handleSaveKey() {
    setApiKey(apiKeyInput);
    initClient(apiKeyInput);
    await saveApiKey(apiKeyInput);
    clientReady = true;
    keySaved = true;
    setTimeout(() => { keySaved = false; }, 2000);
  }

  function handleModelChange(e: Event) {
    setSelectedModel((e.target as HTMLSelectElement).value);
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    input = "";
    addMessage({ role: "user", text: userMsg });
    loading = true;
    scrollToBottom();

    try {
      const result = await processDevRequest(userMsg, getChatHistory());
      addChatHistory(userMsg, result.rawResponse);

      if (result.configChange) {
        pushUndo({
          timestamp: Date.now(),
          description: `Config: ${userMsg.slice(0, 50)}`,
          files: [],
          config: true,
        });
        applyConfig(result.configChange as AiUiConfig);
      }

      if (result.modifications.length > 0) {
        setPendingMods(result.modifications);
      }
      if (result.textAnswer) {
        addMessage({ role: "assistant", text: result.textAnswer });
      } else if (result.configChange) {
        addMessage({ role: "assistant", text: "Config applied." });
      }
    } catch (e: any) {
      addMessage({ role: "assistant", text: `Error: ${e?.message || e}` });
    } finally {
      loading = false;
      scrollToBottom();
    }
  }

  async function applyMod(mod: FileModification) {
    try {
      if (mod.originalContent) {
        await saveBackup(mod.path, mod.originalContent);
      }
      pushUndo({
        timestamp: Date.now(),
        description: `Code: ${mod.path.split("/").pop()}`,
        files: mod.originalContent ? [{ path: mod.path, content: mod.originalContent }] : [],
        config: false,
      });
      await writeSourceFile(mod.path, mod.newContent);
      removePendingMod(mod);
      addMessage({ role: "assistant", text: `✓ Applied: ${mod.path}` });
      scrollToBottom();
    } catch (e: any) {
      addMessage({ role: "assistant", text: `✗ Failed to apply ${mod.path}: ${e?.message || e}` });
      scrollToBottom();
    }
  }

  function rejectMod(mod: FileModification) {
    removePendingMod(mod);
    addMessage({ role: "assistant", text: `Rejected: ${mod.path}` });
    scrollToBottom();
  }

  async function handleUndo() {
    const stack = getUndoStack();
    if (stack.length === 0) return;
    const entry = popUndo();
    if (!entry) return;
    if (entry.config) {
      resetConfig();
      addMessage({ role: "assistant", text: `Reverted config: "${entry.description}"` });
    } else {
      for (const file of entry.files) {
        await writeSourceFile(file.path, file.content);
      }
      addMessage({ role: "assistant", text: `Reverted: "${entry.description}"` });
    }
    scrollToBottom();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="dev-panel">
  <button class="settings-toggle" onclick={() => (showSettings = !showSettings)}>
    {showSettings ? "▾" : "▸"} Settings
    {#if !clientReady}<span class="badge">No API key</span>{/if}
  </button>

  {#if showSettings}
    <div class="settings-section">
      <div class="setting-row">
        <label>
          <span class="label-text">API Key</span>
          <input type="password" bind:value={apiKeyInput} placeholder="sk-ant-..." />
        </label>
        <button class="save-btn" onclick={handleSaveKey} disabled={!apiKeyInput.trim()}>
          {keySaved ? "OK" : "Save"}
        </button>
      </div>
      <div class="setting-row">
        <label>
          <span class="label-text">Model</span>
          <select value={getSelectedModel()} onchange={handleModelChange}>
            {#each AVAILABLE_MODELS as model}
              <option value={model.id}>{model.label}</option>
            {/each}
          </select>
        </label>
      </div>
    </div>
  {/if}

  <div class="dev-messages" bind:this={messagesEl}>
    {#if getMessages().length === 0}
      <div class="dev-welcome">
        <p>DEV has full control over SpeedRead.</p>
        <p class="hint">Ask questions, request changes, or describe features to add.</p>
      </div>
    {/if}
    {#each getMessages() as msg}
      <div class="msg {msg.role}">
        <span class="msg-role">{msg.role === "user" ? "You" : "DEV"}</span>
        {#if msg.role === "assistant"}
          <div class="msg-md">{@html renderMd(msg.text)}</div>
        {:else}
          <span class="msg-text">{msg.text}</span>
        {/if}
      </div>
    {/each}
    {#if loading}
      <div class="msg assistant"><span class="msg-role">DEV</span><span class="msg-text thinking">Thinking...</span></div>
    {/if}

    {#each getPendingMods() as mod}
      <DiffPreview modification={mod} onApply={() => applyMod(mod)} onReject={() => rejectMod(mod)} />
    {/each}
  </div>

  <div class="dev-footer">
    {#if getUndoStack().length > 0}
      <button class="undo-btn" onclick={handleUndo} title="Undo last DEV change">
        Undo ({getUndoStack().length})
      </button>
    {/if}
    <div class="dev-input">
      <input
        type="text"
        bind:value={input}
        placeholder={clientReady ? "Ask DEV anything..." : "Set API key in settings above"}
        disabled={!clientReady || loading}
        onkeydown={handleKeydown}
      />
      <button class="send-btn" onclick={handleSend} disabled={!input.trim() || !clientReady || loading}>
        Send
      </button>
    </div>
  </div>
</div>

<style>
  .dev-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .settings-toggle {
    padding: 8px 16px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border, #333);
    color: var(--fg-muted, #888);
    font-size: 11px;
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .settings-toggle:hover { color: var(--fg, #e5e5e5); }

  .badge {
    background: #dc2626;
    color: white;
    font-size: 9px;
    padding: 1px 6px;
    border-radius: 8px;
    margin-left: auto;
  }

  .settings-section {
    padding: 10px 16px;
    border-bottom: 1px solid var(--border, #333);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .setting-row {
    display: flex;
    gap: 8px;
    align-items: flex-end;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
  }

  .label-text {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted, #888);
  }

  .settings-section input, .settings-section select {
    background: var(--surface, #1a1a1a);
    color: var(--fg, #e5e5e5);
    border: 1px solid var(--border, #333);
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
  }

  .settings-section input { font-family: monospace; }
  .settings-section input:focus, .settings-section select:focus { outline: none; border-color: var(--accent, #3b82f6); }

  .save-btn {
    padding: 5px 10px;
    background: var(--accent, #3b82f6);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    white-space: nowrap;
  }

  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .dev-messages {
    flex: 1;
    overflow-y: auto;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dev-welcome {
    color: var(--fg-muted, #888);
    font-size: 13px;
    padding: 20px 0;
    text-align: center;
  }

  .dev-welcome .hint {
    font-size: 11px;
    margin-top: 4px;
    opacity: 0.7;
  }

  .msg {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--surface, #1a1a1a);
    font-size: 13px;
    max-width: 90%;
  }

  .msg.user {
    background: var(--accent, #3b82f6);
    color: white;
    align-self: flex-end;
  }

  .msg.assistant { align-self: flex-start; }

  .msg-role {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    opacity: 0.6;
  }

  .msg-text {
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .thinking { opacity: 0.5; }

  /* Markdown rendered content */
  .msg-md {
    line-height: 1.5;
    word-break: break-word;
    font-size: 13px;
  }

  .msg-md :global(p) { margin: 0 0 6px 0; }
  .msg-md :global(p:last-child) { margin-bottom: 0; }
  .msg-md :global(strong) { font-weight: 700; color: var(--fg, #e5e5e5); }
  .msg-md :global(em) { font-style: italic; }
  .msg-md :global(code) {
    background: rgba(255,255,255,0.08);
    padding: 1px 5px;
    border-radius: 3px;
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 11px;
  }
  .msg-md :global(pre) {
    background: rgba(0,0,0,0.3);
    padding: 8px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 4px 0;
  }
  .msg-md :global(pre code) {
    background: none;
    padding: 0;
    font-size: 11px;
  }
  .msg-md :global(ul), .msg-md :global(ol) {
    margin: 4px 0;
    padding-left: 18px;
  }
  .msg-md :global(li) { margin: 2px 0; }
  .msg-md :global(a) { color: var(--accent, #60a5fa); }
  .msg-md :global(h1), .msg-md :global(h2), .msg-md :global(h3) {
    font-size: 13px;
    font-weight: 700;
    margin: 6px 0 2px 0;
  }

  .dev-footer {
    border-top: 1px solid var(--border, #333);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .undo-btn {
    align-self: flex-start;
    padding: 3px 10px;
    background: transparent;
    color: #f59e0b;
    border: 1px solid #f59e0b;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
  }

  .dev-input {
    display: flex;
    gap: 6px;
  }

  .dev-input input {
    flex: 1;
    background: var(--surface, #1a1a1a);
    color: var(--fg, #e5e5e5);
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 13px;
  }

  .dev-input input:focus { outline: none; border-color: var(--accent, #3b82f6); }

  .send-btn {
    padding: 8px 14px;
    background: #238636;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
