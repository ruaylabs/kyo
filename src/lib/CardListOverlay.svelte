<script lang="ts">
  import Overlay from "$lib/Overlay.svelte";
  import { onMount, tick } from "svelte";
  import type { Card } from "$lib/types.ts";

  let {
    title,
    cards,
    onclose,
    restore,
    label = "Restore",
    secondaryRestore,
    secondaryLabel,
    oncardclick,
  }: {
    title: string;
    cards: Card[];
    onclose: () => void;
    restore: (card: Card) => void;
    label?: string;
    secondaryRestore?: (card: Card) => void;
    secondaryLabel?: string;
    oncardclick?: (card: Card) => void;
  } = $props();

  let headingEl: HTMLHeadingElement;

  function dialogButtons(): HTMLButtonElement[] {
    return [
      ...(headingEl
        ?.closest(".dialog")
        ?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []),
    ];
  }

  onMount(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogButtons()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab" || e.ctrlKey || e.metaKey || e.altKey) return;
      const buttons = dialogButtons();
      if (!buttons.length) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        index < 0
          ? e.shiftKey
            ? buttons.length - 1
            : 0
          : (index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      buttons[next].focus();
    }

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  });

  // Restoring a card can remove the focused button from the list.
  $effect(() => {
    void cards;
    void tick().then(() => {
      const dialog = headingEl?.closest(".dialog");
      if (dialog?.isConnected && !dialog.contains(document.activeElement)) {
        dialogButtons()[0]?.focus();
      }
    });
  });
</script>

<Overlay {onclose} class="archived-dialog">
  <h3 bind:this={headingEl}>{title}</h3>

  {#if cards.length === 0}
    <p class="empty">no cards</p>
  {:else}
    <div class="list">
      {#each cards as card (card.id)}
        <div class="item">
          <button
            type="button"
            class="card-open"
            disabled={!oncardclick}
            onclick={() => oncardclick?.(card)}
          >
            <span class="item-name">{card.name}</span>
            {#if card.tags.length > 0}
              <span class="tags">
                {#each card.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </span>
            {/if}
          </button>
          <div class="actions">
            <button type="button" class="btn primary small" onclick={() => restore(card)}>
              {label}
            </button>
            {#if secondaryRestore}
              <button type="button" class="btn small" onclick={() => secondaryRestore(card)}>
                {secondaryLabel}
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <button type="button" class="btn primary" onclick={onclose}>Close</button>
</Overlay>

<style>
  :global(.archived-dialog) {
    min-width: 420px;
    max-height: 70vh;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 50vh;
    overflow-y: auto;
  }

  .item {
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
    opacity: 0.7;
  }

  .card-open {
    display: block;
    width: 100%;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .card-open:disabled {
    cursor: default;
  }

  .card-open:not(:disabled):hover {
    background: var(--bg-hover);
  }

  .card-open:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 4px;
  }

  .item-name {
    font-weight: 500;
    font-size: 14px;
    color: var(--text-muted);
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .tag {
    font-size: 11px;
    background: var(--border);
    color: var(--tag-text);
    border-radius: 4px;
    padding: 1px 6px;
  }

  .actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
  }

  .empty {
    text-align: center;
    color: var(--text-empty);
    font-size: 12px;
    padding: 20px 0;
  }
</style>
