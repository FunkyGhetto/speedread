<script lang="ts">
  import { getHistory } from "../../state/stats.svelte";

  let sessions = $derived(getHistory());

  let points = $derived.by(() => {
    if (sessions.length === 0) return [];
    const maxWpm = Math.max(...sessions.map(s => s.averageWpm), 300);
    const width = 280;
    const height = 120;
    const padding = 20;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;
    return sessions.map((s, i) => ({
      x: padding + (sessions.length > 1 ? (i / (sessions.length - 1)) * usableW : usableW / 2),
      y: padding + usableH - (s.averageWpm / maxWpm) * usableH,
      wpm: s.averageWpm,
      date: new Date(s.date).toLocaleDateString(),
    }));
  });

  let pathD = $derived(
    points.length > 1
      ? `M ${points.map(p => `${p.x},${p.y}`).join(" L ")}`
      : ""
  );
</script>

<div class="history-graph">
  <h3>History</h3>
  {#if sessions.length === 0}
    <p class="no-data">No reading sessions yet</p>
  {:else}
    <svg viewBox="0 0 280 120" class="graph-svg">
      {#if pathD}
        <path d={pathD} fill="none" stroke="var(--accent, #3b82f6)" stroke-width="2" />
      {/if}
      {#each points as point}
        <circle cx={point.x} cy={point.y} r="4" fill="var(--accent, #3b82f6)" />
        <title>{point.date}: {point.wpm} WPM</title>
      {/each}
    </svg>
  {/if}
</div>

<style>
  .history-graph {
    padding: 12px 0;
  }

  h3 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--fg-muted, #888);
    margin: 0 0 10px 0;
  }

  .no-data {
    font-size: 12px;
    color: var(--fg-muted, #888);
  }

  .graph-svg {
    width: 100%;
    height: auto;
    background: var(--surface, #1a1a1a);
    border-radius: 6px;
  }
</style>
