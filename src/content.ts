export const STYLE_ID = "norovo-style";

export const SELECTORS: readonly string[] = [
  '[aria-label*="Rovo" i]',
  '[data-testid*="rovo" i]',
  '[id*="rovo" i]',
  '[class*="rovo" i]',
  '[data-vc*="rovo" i]'
];

export const SELECTOR_LIST = SELECTORS.join(",\n");

export const STYLE_RULES = `${SELECTOR_LIST} { display: none !important; }`;

let observer: MutationObserver | null = null;

export function injectStyle(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLE_RULES;
  (document.head || document.documentElement).appendChild(style);
}

export function removeStyle(): void {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

export function sweepAndRemove(root: Node): void {
  if (!(root instanceof Element)) return;
  if (root.id === STYLE_ID) return;
  if (root.matches(SELECTOR_LIST)) {
    root.remove();
    return;
  }
  for (const node of root.querySelectorAll(SELECTOR_LIST)) {
    if (node.id === STYLE_ID) continue;
    node.remove();
  }
}

export function startObserver(): void {
  if (observer) return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        sweepAndRemove(node);
      }
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true
  });
}

export function stopObserver(): void {
  if (!observer) return;
  observer.disconnect();
  observer = null;
}

export function applyBlock(): void {
  injectStyle();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
  sweepAndRemove(document.documentElement);
}

export function removeBlock(): void {
  stopObserver();
  removeStyle();
}

export function init(): void {
  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (enabled) applyBlock();
  });

  chrome.runtime.onMessage.addListener((msg: unknown) => {
    if (
      !msg ||
      typeof msg !== "object" ||
      (msg as { type?: unknown }).type !== "norovo:toggle"
    ) {
      return;
    }
    if ((msg as { enabled?: boolean }).enabled) applyBlock();
    else removeBlock();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync" || !changes.enabled) return;
    if (changes.enabled.newValue) applyBlock();
    else removeBlock();
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  init();
}
