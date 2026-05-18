const STYLE_ID = "norovo-style";

const SELECTORS = [
  '[aria-label*="Rovo" i]',
  '[data-testid*="rovo" i]',
  '[id*="rovo" i]',
  '[class*="rovo" i]',
  '[data-vc*="rovo" i]'
];

const SELECTOR_LIST = SELECTORS.join(",\n");

const STYLE_RULES = `${SELECTOR_LIST} { display: none !important; }`;

let observer = null;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = STYLE_RULES;
  (document.head || document.documentElement).appendChild(style);
}

function removeStyle() {
  const style = document.getElementById(STYLE_ID);
  if (style) style.remove();
}

function sweepAndRemove(root) {
  if (!(root instanceof Element)) return;
  if (root.matches && root.matches(SELECTOR_LIST)) {
    root.remove();
    return;
  }
  if (root.querySelectorAll) {
    for (const node of root.querySelectorAll(SELECTOR_LIST)) {
      node.remove();
    }
  }
}

function startObserver() {
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

function stopObserver() {
  if (!observer) return;
  observer.disconnect();
  observer = null;
}

function applyBlock() {
  injectStyle();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
  sweepAndRemove(document.documentElement);
}

function removeBlock() {
  stopObserver();
  removeStyle();
}

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  if (enabled) applyBlock();
});

chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || msg.type !== "norovo:toggle") return;
  if (msg.enabled) applyBlock();
  else removeBlock();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes.enabled) return;
  if (changes.enabled.newValue) applyBlock();
  else removeBlock();
});
