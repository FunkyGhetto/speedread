<script lang="ts">
  import { getApiKey, setApiKey, getSelectedModel, setSelectedModel } from "../../state/ai-config.svelte";
  import { initClient, AVAILABLE_MODELS } from "../../ai/claude-client";
  import { saveApiKey } from "../../services/persistence";

  let key = $state(getApiKey());
  let saved = $state(false);

  async function handleSave() {
    setApiKey(key);
    initClient(key);
    await saveApiKey(key);
    saved = true;
    setTimeout(() => { saved = false; }, 2000);
  }

  function handleModelChange(e: Event) {
    setSelectedModel((e.target as HTMLSelectElement).value);
  }
</script>

<div class="ai-settings">
  <div class="setting-row">
    <label>
      <span class="label-text">API Key</span>
      <input type="password" bind:value={key} placeholder="sk-ant-..." />
    </label>
    <button class="save-btn" onclick={handleSave} disabled={!key.trim()}>
      {saved ? "OK" : "Save"}
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

<style>
  .ai-settings {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border, #333);
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

  input, select {
    background: var(--surface, #1a1a1a);
    color: var(--fg, #e5e5e5);
    border: 1px solid var(--border, #333);
    border-radius: 4px;
    padding: 5px 8px;
    font-size: 12px;
  }

  input { font-family: monospace; }
  input:focus, select:focus { outline: none; border-color: var(--accent, #3b82f6); }

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
</style>
