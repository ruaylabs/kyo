import { openUrl } from "@tauri-apps/plugin-opener";
import { marked } from "marked";

export interface CardLink {
  url: string;
  label: string;
}

const domainPattern = String.raw`(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}(?![\w-])(?::\d{1,5})?(?:[/?#][^\s<>"']*)?`;
const bareDomain = new RegExp(`^${domainPattern}$`, "i");
// Do not match inside email addresses, URL schemes, or relative paths.
const bareDomainScan = new RegExp(`(?<![\\w@./:\\-])${domainPattern}`, "gi");

/** Extract browser links from Markdown, including bare domains and HTML anchors. */
export function extractLinks(bodies: string[]): CardLink[] {
  const links = new Map<string, CardLink>();
  const parser = new DOMParser();

  function addLink(href: string, text: string) {
    try {
      const url = new URL(bareDomain.test(href) ? `https://${href}` : href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      const label = text.trim() || url.href;
      const existing = links.get(url.href);
      if (!existing || existing.label === existing.url) {
        links.set(url.href, { url: url.href, label });
      }
    } catch {
      // Relative links and invalid URLs cannot be opened in the browser.
    }
  }

  for (const body of bodies) {
    const document = parser.parseFromString(marked.parse(body, { async: false }), "text/html");
    for (const anchor of document.querySelectorAll("a[href]")) {
      addLink(anchor.getAttribute("href") ?? "", anchor.textContent ?? "");
    }

    const nodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (nodes.nextNode()) {
      const node = nodes.currentNode;
      if (node.parentElement?.closest("a, code, pre, script, style")) continue;
      const matches = (node.textContent ?? "").matchAll(bareDomainScan);
      for (const match of matches) {
        let href = match[0];
        let previous: string;
        do {
          previous = href;
          href = href.replace(/[.,!?;:]+$/, "");
          // Remove prose delimiters without stripping balanced pairs inside URL paths.
          for (const [open, close] of [
            ["(", ")"],
            ["[", "]"],
            ["{", "}"],
          ]) {
            while (href.endsWith(close) && href.split(close).length > href.split(open).length) {
              href = href.slice(0, -1);
            }
          }
        } while (href !== previous);
        addLink(href, href);
      }
    }
  }
  return [...links.values()];
}

/** Click handler for rendered markdown content. Opens external links in the OS browser. */
export function handleMarkdownClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  const anchor = target.closest("a");
  if (anchor?.href) {
    e.preventDefault();
    openUrl(anchor.href);
  }
}
