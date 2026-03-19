<script lang="ts">
  import {
    getWords, getCurrentIndex, getIsPlaying,
    getTotalWords, toggle,
  } from "../../state/reader.svelte";

  let containerEl: HTMLDivElement | undefined = $state();
  let wordEl: HTMLDivElement | undefined = $state();
  let orpEl: HTMLSpanElement | undefined = $state();
  let offset = $state(0);

  let currentWord = $derived.by(() => {
    const words = getWords();
    const idx = getCurrentIndex();
    return idx < words.length ? words[idx] : null;
  });

  $effect(() => {
    if (!containerEl || !wordEl || !orpEl || !currentWord) { offset = 0; return; }
    // Reset transform to measure natural position
    wordEl.style.transform = "translateX(0px)";
    // Force layout
    const containerRect = containerEl.getBoundingClientRect();
    const orpRect = orpEl.getBoundingClientRect();
    const viewportCenter = containerRect.left + containerRect.width / 2;
    const orpCenter = orpRect.left + orpRect.width / 2;
    const newOffset = viewportCenter - orpCenter;
    wordEl.style.transform = `translateX(${newOffset}px)`;
    offset = newOffset;
  });

  function handleClick() {
    if (getTotalWords() > 0) toggle();
  }
</script>

<div
  class="rsvp"
  bind:this={containerEl}
  onclick={handleClick}
  role="button"
  tabindex="0"
>
  {#if getTotalWords() > 0}
    <div class="hline top"><div class="vtick"></div></div>
    <div class="hline bot"><div class="vtick"></div></div>
  {/if}

  {#if getTotalWords() === 0}
    <div class="placeholder">open the panel to load text</div>
  {:else if currentWord}
    {@const w = currentWord}
    {@const i = w.orpIndex}
    <div class="word" bind:this={wordEl}>
      <span class="dim">{w.display.slice(0, i)}</span><span class="orp" bind:this={orpEl}>{w.display[i]}</span><span class="dim">{w.display.slice(i + 1)}</span>
    </div>
  {:else if !getIsPlaying() && getCurrentIndex() >= getTotalWords()}
    <div class="placeholder">done</div>
  {:else}
    <div class="placeholder">press space</div>
  {/if}
</div>

<style>
  .rsvp {
    width: 100%;
    height: 100%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    cursor: pointer;
    overflow: hidden;
    font-family: "Google Sans Flex", "Helvetica Neue", "Arial", sans-serif;
  }

  .hline {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(255, 255, 255, 0.08);
  }
  .hline.top { top: calc(50% - 80px); }
  .hline.bot { top: calc(50% + 80px); }

  .vtick {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 18px;
    background: rgba(255, 255, 255, 0.08);
  }
  .hline.top .vtick { top: 100%; }
  .hline.bot .vtick { bottom: 100%; }

  .word {
    font-size: 72px;
    font-weight: 100;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  .dim {
    color: var(--fg, #e5e5e5);
    opacity: 0.75;
  }

  .orp {
    color: #a93226;
    opacity: 1;
    font-weight: 700;
  }

  .placeholder {
    color: var(--fg-muted, #444);
    font-size: 18px;
    font-weight: 100;
    letter-spacing: 0.1em;
  }
</style>
