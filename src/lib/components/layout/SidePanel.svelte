<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    onToggle: () => void;
    children: Snippet;
  }

  let { open, onToggle, children }: Props = $props();
</script>

<div class="side-panel" class:open>
  <button class="panel-toggle" onclick={onToggle} title={open ? "Close panel (Esc)" : "Open panel"}>
    {open ? "\u276F" : "\u276E"}
  </button>
  <div class="panel-drawer" class:open>
    {#if open}
      <div class="panel-content">
        {@render children()}
      </div>
    {/if}
  </div>
</div>

<style>
  .side-panel {
    position: fixed;
    top: 0;
    right: 0;
    height: 100%;
    z-index: 100;
    display: flex;
    pointer-events: none;
  }

  .side-panel.open {
    pointer-events: auto;
  }

  .panel-toggle {
    position: fixed;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 64px;
    background: var(--surface, #1a1a1a);
    border: 1px solid var(--border, #333);
    border-right: none;
    border-radius: 8px 0 0 8px;
    color: var(--fg-muted, #888);
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s, right 0.25s ease;
    z-index: 101;
    pointer-events: auto;
  }

  .side-panel.open .panel-toggle {
    right: 360px;
  }

  .panel-toggle:hover {
    background: var(--border, #333);
    color: var(--fg, #e5e5e5);
  }

  .panel-drawer {
    position: fixed;
    top: 0;
    right: -360px;
    width: 360px;
    height: 100%;
    background: var(--bg, #0a0a0a);
    border-left: 1px solid var(--border, #262626);
    transition: right 0.25s ease;
    pointer-events: auto;
  }

  .panel-drawer.open {
    right: 0;
  }

  .panel-content {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
</style>
