<script lang="ts">
  import RsvpDisplay from "./lib/components/reader/RsvpDisplay.svelte";
  import SidePanel from "./lib/components/layout/SidePanel.svelte";
  import InputPanel from "./lib/components/input/InputPanel.svelte";
  import StatsPanel from "./lib/components/stats/StatsPanel.svelte";
  import HistoryGraph from "./lib/components/stats/HistoryGraph.svelte";
  import ExportButton from "./lib/components/stats/ExportButton.svelte";
  import DevModePanel from "./lib/components/ai/DevModePanel.svelte";
  import { toggle, rewind, skipForward, getWpm, setWpm } from "./lib/state/reader.svelte";
  import { applyTheme, watchSystemTheme } from "./lib/services/theme";
  import { getTheme, getSettings, loadSettings } from "./lib/state/settings.svelte";
  import * as persistence from "./lib/services/persistence";
  import { getHistory, loadHistory } from "./lib/state/stats.svelte";
  import { getBookmarks, loadBookmarks } from "./lib/state/bookmarks.svelte";
  import { getAiConfig, loadAiConfig, setApiKey, getApiKey, getSelectedModel, setSelectedModel } from "./lib/state/ai-config.svelte";
  import { initClient } from "./lib/ai/claude-client";

  let panelOpen = $state(false);
  let activeTab = $state<"input" | "stats" | "dev">("input");
  let loaded = $state(false);

  $effect(() => { applyTheme(getTheme()); });

  $effect(() => {
    const cleanup = watchSystemTheme(() => {
      if (getTheme() === "system") applyTheme("system");
    });
    return cleanup;
  });

  // Load persisted data on mount
  $effect(() => {
    (async () => {
      const settings = await persistence.loadSettings();
      if (settings) loadSettings(settings);
      const history = await persistence.loadHistory();
      if (history) loadHistory(history);
      const bookmarks = await persistence.loadBookmarks();
      if (bookmarks) loadBookmarks(bookmarks);
      const aiConfig = await persistence.loadAiConfig();
      if (aiConfig) loadAiConfig(aiConfig);
      const apiKey = await persistence.loadApiKey();
      if (apiKey) { setApiKey(apiKey); initClient(apiKey); }
      const model = await persistence.loadSelectedModel();
      if (model) setSelectedModel(model);
      loaded = true;
    })();
  });

  // Auto-save with debounce
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    if (!loaded) return;
    const _ = [getSettings(), getHistory(), getBookmarks(), getAiConfig(), getSelectedModel()];
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      await persistence.saveSettings(getSettings());
      await persistence.saveHistory(getHistory());
      await persistence.saveBookmarks(getBookmarks());
      await persistence.saveAiConfig(getAiConfig());
      const key = getApiKey();
      if (key) await persistence.saveApiKey(key);
      await persistence.saveSelectedModel(getSelectedModel());
    }, 1000);
  });

  function handleWheel(e: WheelEvent) {
    // Always adjust WPM on scroll, regardless of which area
    e.preventDefault();
    const delta = e.deltaY < 0 ? 25 : -25;
    setWpm(getWpm() + delta);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
    switch (e.code) {
      case "Space":
        e.preventDefault();
        toggle();
        break;
      case "ArrowLeft":
        e.preventDefault();
        rewind(e.shiftKey ? 10 : 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        skipForward(e.shiftKey ? 10 : 1);
        break;
      case "Escape":
        if (panelOpen) { panelOpen = false; e.preventDefault(); }
        break;
      case "Tab":
        if (e.ctrlKey || e.metaKey) { panelOpen = !panelOpen; e.preventDefault(); }
        break;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} onwheel={handleWheel} />

<div class="app" class:panel-open={panelOpen}>
  <main class="reader-area">
    <RsvpDisplay />
  </main>

  <SidePanel open={panelOpen} onToggle={() => (panelOpen = !panelOpen)}>
    <div class="panel-tabs">
      <button class:active={activeTab === "input"} onclick={() => (activeTab = "input")}>Input</button>
      <button class:active={activeTab === "stats"} onclick={() => (activeTab = "stats")}>Stats</button>
      <button class:active={activeTab === "dev"} onclick={() => (activeTab = "dev")}>DEV</button>
    </div>

    <div class="panel-body">
      {#if activeTab === "input"}
        <InputPanel />
      {:else if activeTab === "stats"}
        <div class="stats-content">
          <StatsPanel />
          <HistoryGraph />
          <div class="export-row"><ExportButton /></div>
        </div>
      {:else if activeTab === "dev"}
        <DevModePanel />
      {/if}
    </div>
  </SidePanel>
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: padding-right 0.25s ease;
  }

  .app.panel-open {
    padding-right: 360px;
  }

  .reader-area {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .panel-tabs {
    display: flex;
    border-bottom: 1px solid var(--border, #333);
    flex-shrink: 0;
  }

  .panel-tabs button {
    flex: 1;
    padding: 10px 4px;
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

  .panel-tabs button.active {
    color: var(--accent, #60a5fa);
    border-bottom-color: var(--accent, #60a5fa);
  }

  .panel-tabs button:hover:not(.active) {
    color: var(--fg, #e5e5e5);
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  .stats-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .export-row {
    padding-top: 8px;
  }
</style>
