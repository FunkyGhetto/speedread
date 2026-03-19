<script lang="ts">
  import { tokenize } from "../../engine/tokenizer";
  import { loadText, play } from "../../state/reader.svelte";
  import { resetSession } from "../../state/stats.svelte";
  import { logAction, logError } from "../../state/runtime-log.svelte";

  let inputMode = $state<"text" | "url" | "file">("text");
  let text = $state("");
  let url = $state("");
  let loading = $state(false);
  let error = $state("");

  function handleLoadText() {
    if (!text.trim()) return;
    error = "";
    const tokens = tokenize(text);
    const title = text.slice(0, 40).trim() + (text.length > 40 ? "..." : "");
    logAction("Input", `Loaded text "${title}" (${tokens.length} words)`);
    resetSession();
    loadText(tokens, title);
  }

  function normalizeUrl(input: string): string {
    let u = input.trim();
    if (u && !/^https?:\/\//i.test(u)) u = "https://" + u;
    return u;
  }

  async function handleFetchUrl() {
    if (!url.trim()) return;
    const fetchUrl = normalizeUrl(url);
    loading = true;
    error = "";
    logAction("Input", `Fetching URL: ${fetchUrl}`);
    try {
      const isTauri = "__TAURI_INTERNALS__" in window;
      if (!isTauri) throw new Error("URL fetch requires the Tauri desktop app. Run with 'npx tauri dev'.");
      const { invoke } = await import("@tauri-apps/api/core");
      const result = await invoke("fetch_and_parse_url", { url: fetchUrl }) as { title: string; text: string };
      if (!result.text.trim()) throw new Error("Could not extract article text.");
      logAction("Input", `Loaded "${result.title}" (${result.text.split(/\s+/).length} words)`);
      const tokens = tokenize(result.text);
      resetSession();
      loadText(tokens, result.title || url);
    } catch (e: any) {
      error = e?.message || "Failed to fetch URL";
      logError("Input", `${fetchUrl}: ${error}`);
    }
    loading = false;
  }

  async function handleFileUpload() {
    error = "";
    try {
      const isTauri = "__TAURI_INTERNALS__" in window;
      if (!isTauri) throw new Error("File upload requires the Tauri desktop app.");
      const { open } = await import("@tauri-apps/plugin-dialog");
      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const path = await open({
        multiple: false,
        filters: [{ name: "Text files", extensions: ["txt", "md", "html", "csv", "json", "xml", "rtf", "log"] }],
      });
      if (!path) return;
      loading = true;
      const filePath = typeof path === "string" ? path : path;
      const content = await readTextFile(filePath as string);
      if (!content.trim()) throw new Error("File is empty.");
      const name = (filePath as string).split("/").pop() || "file";
      logAction("Input", `Loaded file "${name}" (${content.split(/\s+/).length} words)`);
      const tokens = tokenize(content);
      resetSession();
      loadText(tokens, name);
    } catch (e: any) {
      error = e?.message || "Failed to read file";
      logError("Input", error);
    }
    loading = false;
  }

  function handleTextKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleLoadText();
  }

  function handleUrlKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") handleFetchUrl();
  }
</script>

<div class="input-panel">
  <div class="input-modes">
    <button class:active={inputMode === "text"} onclick={() => (inputMode = "text")}>Text</button>
    <button class:active={inputMode === "url"} onclick={() => (inputMode = "url")}>URL</button>
    <button class:active={inputMode === "file"} onclick={() => (inputMode = "file")}>File</button>
  </div>

  {#if inputMode === "text"}
    <textarea bind:value={text} placeholder="Paste text here..." rows={8} onkeydown={handleTextKeydown}></textarea>
    <button class="action-btn" onclick={handleLoadText} disabled={!text.trim()}>Load Text</button>
  {:else if inputMode === "url"}
    <input type="text" bind:value={url} placeholder="paste a link" onkeydown={handleUrlKeydown} />
    <button class="action-btn" onclick={handleFetchUrl} disabled={!url.trim() || loading}>
      {loading ? "Fetching..." : "Fetch Article"}
    </button>
  {:else}
    <div class="file-section">
      <p class="file-hint">Supports: .txt, .md, .html, .csv, .json, .xml, .rtf</p>
      <button class="action-btn" onclick={handleFileUpload} disabled={loading}>
        {loading ? "Reading..." : "Choose File"}
      </button>
    </div>
  {/if}

  {#if error}
    <div class="input-error">{error}</div>
  {/if}
</div>

<style>
  .input-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
  }

  .input-modes {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border, #333);
  }

  .input-modes button {
    flex: 1;
    padding: 8px;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--fg-muted, #888);
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
  }

  .input-modes button.active {
    color: var(--accent, #60a5fa);
    border-bottom-color: var(--accent, #60a5fa);
  }

  textarea {
    width: 100%;
    resize: vertical;
    background: var(--surface, #1a1a1a);
    color: var(--fg, #e5e5e5);
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    padding: 10px;
    font-family: inherit;
    font-size: 13px;
    line-height: 1.5;
  }

  textarea:focus, input:focus {
    outline: none;
    border-color: var(--accent, #3b82f6);
  }

  input[type="text"] {
    width: 100%;
    background: var(--surface, #1a1a1a);
    color: var(--fg, #e5e5e5);
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    padding: 10px;
    font-size: 13px;
  }

  .action-btn {
    padding: 10px 16px;
    background: var(--accent, #3b82f6);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .file-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px 0;
  }

  .file-hint {
    font-size: 12px;
    color: var(--fg-muted, #888);
  }

  .input-error {
    color: #ef4444;
    font-size: 12px;
    padding: 4px 0;
  }
</style>
