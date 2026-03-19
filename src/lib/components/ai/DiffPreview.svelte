<script lang="ts">
  import { diffLines } from "diff";
  import type { FileModification } from "../../types/ai";

  interface Props {
    modification: FileModification;
    onApply: () => void;
    onReject: () => void;
  }

  let { modification, onApply, onReject }: Props = $props();

  let diffParts = $derived.by(() => {
    if (!modification.originalContent) {
      return [{ added: true, removed: false, value: modification.newContent }];
    }
    return diffLines(modification.originalContent, modification.newContent);
  });
</script>

<div class="diff-preview">
  <div class="diff-header">
    <span class="diff-path">{modification.path}</span>
    <span class="diff-action">{modification.action}</span>
  </div>
  {#if modification.explanation}
    <div class="diff-explanation">{modification.explanation}</div>
  {/if}
  <div class="diff-content">
    {#each diffParts as part}
      <pre class={part.added ? "added" : part.removed ? "removed" : "context"}>{part.value}</pre>
    {/each}
  </div>
  <div class="diff-actions">
    <button class="apply-btn" onclick={onApply}>Apply</button>
    <button class="reject-btn" onclick={onReject}>Reject</button>
  </div>
</div>

<style>
  .diff-preview {
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    overflow: hidden;
    margin: 8px 0;
  }

  .diff-header {
    display: flex;
    justify-content: space-between;
    padding: 6px 10px;
    background: var(--surface, #1a1a1a);
    font-size: 12px;
  }

  .diff-path {
    font-family: monospace;
    color: var(--fg, #e5e5e5);
  }

  .diff-action {
    color: var(--accent, #3b82f6);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 10px;
  }

  .diff-explanation {
    padding: 6px 10px;
    font-size: 12px;
    color: var(--fg-muted, #888);
    border-bottom: 1px solid var(--border, #333);
  }

  .diff-content {
    max-height: 300px;
    overflow-y: auto;
    background: #0d1117;
  }

  pre {
    margin: 0;
    padding: 0 10px;
    font-size: 11px;
    line-height: 1.5;
    font-family: "SF Mono", "Fira Code", monospace;
    white-space: pre-wrap;
    word-break: break-all;
  }

  pre.added {
    background: rgba(46, 160, 67, 0.15);
    color: #56d364;
  }

  pre.removed {
    background: rgba(248, 81, 73, 0.15);
    color: #f85149;
  }

  pre.context {
    color: #8b949e;
  }

  .diff-actions {
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    border-top: 1px solid var(--border, #333);
  }

  .apply-btn {
    padding: 4px 12px;
    background: #238636;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }

  .reject-btn {
    padding: 4px 12px;
    background: transparent;
    color: var(--fg-muted, #888);
    border: 1px solid var(--border, #333);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
</style>
