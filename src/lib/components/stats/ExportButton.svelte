<script lang="ts">
  import { getHistory } from "../../state/stats.svelte";
  import { exportCSV } from "../../services/csv-export";

  async function handleExport() {
    const history = getHistory();
    if (history.length === 0) return;
    await exportCSV(history);
  }
</script>

<button class="export-btn" onclick={handleExport} disabled={getHistory().length === 0}>
  Export CSV
</button>

<style>
  .export-btn {
    padding: 6px 12px;
    background: transparent;
    color: var(--fg-muted, #888);
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
  }

  .export-btn:hover:not(:disabled) {
    background: var(--surface, #1a1a1a);
    color: var(--fg, #e5e5e5);
  }

  .export-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
