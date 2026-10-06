<script lang="ts">
  import { onMount, tick } from "svelte";
  import { openUrl } from "@tauri-apps/plugin-opener";
  import { extractLinks, type CardLink } from "$lib/links";
  import type { Card } from "$lib/types";
  import type { CardStore } from "$lib/card-store";

  let {
    card,
    store,
    onclose,
  }: {
    card: Card;
    store: CardStore;
    onclose: () => void;
  } = $props();

  let links = $state<CardLink[]>([]);
  let loading = $state(true);
  let error = $state("");
  let query = $state("");
  let selected = $state(0);
  let opening = $state(false);
  let inputEl: HTMLInputElement;
  let listEl: HTMLDivElement;
  let normalizedQuery = $derived(query.trim().toLowerCase());
  let results = $derived(
    links.filter((link) => `${link.label} ${link.url}`.toLowerCase().includes(normalizedQuery)),
  );

  onMount(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    let active = true;
    inputEl.focus();
    links = extractLinks([card.content]);
    void store
      .getComments(card.id)
      .then((comments) => {
        if (active)
          links = extractLinks([card.content, ...comments.map((comment) => comment.body)]);
      })
      .catch(() => {
        if (active) error = "Could not load comment links. Close and try again.";
      })
      .finally(() => {
        if (active) loading = false;
      });
    // Capture keys before board shortcuts, keeping Escape scoped to this palette.
    window.addEventListener("keydown", onKey, true);
    return () => {
      active = false;
      window.removeEventListener("keydown", onKey, true);
      previousFocus?.focus();
    };
  });

  $effect(() => {
    void selected;
    void results;
    void tick().then(() =>
      listEl?.querySelector(".selected")?.scrollIntoView({ block: "nearest" }),
    );
  });

  async function openLink(link: CardLink) {
    if (opening) return;
    opening = true;
    error = "";
    try {
      await openUrl(link.url);
      onclose();
    } catch {
      error = "Could not open this link. Please try again.";
    } finally {
      opening = false;
    }
  }

  function onKey(e: KeyboardEvent) {
    e.stopImmediatePropagation();
    if (e.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onclose();
    } else if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n")) {
      e.preventDefault();
      selected = Math.min(selected + 1, Math.max(0, results.length - 1));
    } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p")) {
      e.preventDefault();
      selected = Math.max(0, selected - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const link = results[selected];
      if (link) void openLink(link);
    } else if (e.key === "Tab") {
      e.preventDefault();
      inputEl.focus();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  class="link-overlay"
  role="dialog"
  aria-modal="true"
  aria-label="Card links"
  tabindex="-1"
  onclick={onclose}
>
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div class="link-palette" role="presentation" onclick={(e) => e.stopPropagation()}>
    <input
      bind:this={inputEl}
      bind:value={query}
      oninput={() => (selected = 0)}
      placeholder="Search card links..."
      aria-label="Search card links"
      autocomplete="off"
      spellcheck="false"
    />
    <div class="list" bind:this={listEl}>
      {#each results as link, i (link.url)}
        <button class:selected={i === selected} disabled={opening} onclick={() => openLink(link)}>
          <span class="label">{link.label}</span>
          <span class="url">{link.url}</span>
        </button>
      {:else}
        <p class="status">
          {loading ? "Loading links..." : query.trim() ? "No matching links" : "No links in this card"}
        </p>
      {/each}
    </div>
    {#if error}
      <p class="status" role="alert">{error}</p>
    {/if}
    <div class="hint">↑ ↓ to select · Enter to open · Esc to close</div>
  </div>
</div>

<style>
  .link-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--overlay);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 12vh;
  }
  .link-palette {
    width: min(560px, 90vw);
    max-height: 60vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  input {
    background: var(--bg-base);
    border: none;
    border-bottom: 1px solid var(--border);
    padding: 14px 16px;
    color: var(--text);
    font: inherit;
    outline: none;
  }
  .list {
    overflow-y: auto;
    min-height: 0;
    padding: 6px;
  }
  button {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 10px 12px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    overflow-wrap: anywhere;
  }
  button.selected,
  button:hover {
    background: var(--bg-hover);
  }
  .label {
    font-size: 14px;
    font-weight: 500;
  }
  .url,
  .hint,
  .status {
    font-size: 12px;
    color: var(--text-dim);
  }
  .status {
    padding: 12px;
    text-align: center;
  }
  .hint {
    padding: 10px 16px;
    border-top: 1px solid var(--border);
  }
</style>
