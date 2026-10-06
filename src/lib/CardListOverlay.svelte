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
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      const buttons = dialogButtons();
      if (!buttons.length) return;
      const key = e.key.toLowerCase();
      if (key === "tab") {
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
        return;
      }
      if (!["j", "k", "r", "t", " "].includes(key)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (key === " ") return;

      const focusedId = (document.activeElement as HTMLElement | null)?.closest<HTMLElement>(
        ".item",
      )?.dataset.cardId;
      const index = cards.findIndex((card) => card.id === focusedId);
      if (key === "j" || key === "k") {
        const cardButtons = buttons.filter((button) => button.classList.contains("card-open"));
        const next =
          index < 0
            ? key === "j"
              ? 0
              : cardButtons.length - 1
            : Math.max(0, Math.min(index + (key === "j" ? 1 : -1), cardButtons.length - 1));
        cardButtons[next]?.focus();
      } else {
        const card = cards[index];
        if (!card || e.repeat) return;
        if (key === "r") restore(card);
        if (key === "t") secondaryRestore?.(card);
      }
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
  <p class="navigation-hint">
    <kbd class="kbd-inline">j</kbd>/<kbd class="kbd-inline">k</kbd>
    navigate · <kbd class="kbd-inline">Enter</kbd> open · <kbd class="kbd-inline">r</kbd>
    {label.toLowerCase()}
    {#if secondaryRestore}
      · <kbd class="kbd-inline">t</kbd> {secondaryLabel?.toLowerCase()}
    {/if}
    · <kbd class="kbd-inline">Esc</kbd> close
  </p>

  {#if cards.length === 0}
    <p class="empty">no cards</p>
  {:else}
    <div class="list">
      {#each cards as card (card.id)}
        <div class="item" data-card-id={card.id}>
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
            <button
              type="button"
              class="btn"
              aria-label={label}
              title={label}
              onclick={() => restore(card)}
            >
              <kbd class="kbd-inline">r</kbd>
            </button>
            {#if secondaryRestore}
              <button
                type="button"
                class="btn"
                aria-label={secondaryLabel}
                title={secondaryLabel}
                onclick={() => secondaryRestore(card)}
              >
                <kbd class="kbd-inline">t</kbd>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}

  <div class="footer">
    <button type="button" class="btn" onclick={onclose}>Close</button>
  </div>
</Overlay>

<style>
  :global(.archived-dialog) {
    width: min(720px, calc(100vw - 32px));
    box-sizing: border-box;
    max-height: 80vh;
  }

  .navigation-hint {
    margin: 0;
    line-height: 1.8;
    font-size: 12px;
    color: var(--text-dim);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
    overflow-y: auto;
    padding: 6px;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 14px;
  }

  .item:focus-within {
    border-color: var(--accent);
  }

  .card-open {
    display: block;
    flex: 1;
    min-width: 0;
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
    outline: none;
  }

  .item-name {
    overflow-wrap: anywhere;
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
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  .actions .btn {
    padding: 8px;
  }

  .actions .kbd-inline {
    margin-left: 0;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid var(--border);
    padding-top: 12px;
  }

  @media (max-width: 640px) {
    .item {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .actions {
      justify-content: flex-start;
    }
  }

  .kbd-inline {
    font-size: 11px;
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 0 4px;
    margin-left: 4px;
    color: var(--text-dim);
  }

  .empty {
    text-align: center;
    color: var(--text-empty);
    font-size: 12px;
    padding: 20px 0;
  }
</style>
