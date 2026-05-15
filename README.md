# NoRovo

Chrome Extension to disable Rovo when using Atlassian products.

## Install (unpacked)

1. Open `chrome://extensions`.
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this repo's root directory.
4. Visit `https://<your-tenant>.atlassian.net` — Rovo UI should be hidden.

Toggle on/off via the extension popup in the toolbar.

## Scope

Matches `https://*.atlassian.net/*` only. Injects a stylesheet at
`document_start` to hide Rovo elements before paint, plus a
`MutationObserver` to catch nodes added later (e.g. after SPA route
changes). State persists in `chrome.storage.sync`.

