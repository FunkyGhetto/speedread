<script lang="ts">
  import {
    getAverageWpm,
    getTotalTimeSeconds,
    getTimeSavedPercent,
    getSessionWordTimings,
  } from "../../state/stats.svelte";
  import { getWpm, getTotalWords } from "../../state/reader.svelte";

  let wordsRead = $derived(getSessionWordTimings().length);
  let avgWpm = $derived(getAverageWpm());
  let totalTime = $derived(getTotalTimeSeconds());
  let timeSaved = $derived(getTimeSavedPercent());

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
</script>

<div class="stats-panel">
  <h3>Statistics</h3>
  <div class="stats-grid">
    <div class="stat">
      <span class="stat-value">{avgWpm}</span>
      <span class="stat-label">Avg WPM</span>
    </div>
    <div class="stat">
      <span class="stat-value">{getWpm()}</span>
      <span class="stat-label">Target WPM</span>
    </div>
    <div class="stat">
      <span class="stat-value">{wordsRead}</span>
      <span class="stat-label">Words Read</span>
    </div>
    <div class="stat">
      <span class="stat-value">{formatTime(totalTime)}</span>
      <span class="stat-label">Time</span>
    </div>
    <div class="stat">
      <span class="stat-value">{getTotalWords()}</span>
      <span class="stat-label">Total Words</span>
    </div>
    <div class="stat">
      <span class="stat-value highlight">{timeSaved > 0 ? `${timeSaved}%` : "--"}</span>
      <span class="stat-label">Time Saved</span>
    </div>
  </div>
</div>

<style>
  .stats-panel {
    padding: 12px 0;
  }

  h3 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted, #888);
    margin: 0 0 10px 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--fg, #e5e5e5);
    font-variant-numeric: tabular-nums;
  }

  .stat-value.highlight {
    color: var(--accent, #3b82f6);
  }

  .stat-label {
    font-size: 11px;
    color: var(--fg-muted, #888);
  }
</style>
