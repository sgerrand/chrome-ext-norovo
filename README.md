# NoRovo

Chrome extension that hides Atlassian's Rovo AI assistant on
`*.atlassian.net` web apps (Jira, Confluence, and related surfaces).

If you have no use for Rovo's floating chat launcher, "Ask Rovo"
buttons, or sidebar prompts, NoRovo removes them from view so your
Atlassian workspace stays focused.

## Features

- Hides Rovo UI before first paint — no flash of unwanted content.
- Catches Rovo nodes added after page load (React portals, SPA route
  changes) via a `MutationObserver`.
- One-click on/off toggle from the browser toolbar popup.
- Preference syncs across Chrome profiles via `chrome.storage.sync`.
- Single-host scope: never runs on non-Atlassian pages.

## Install (unpacked)

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (toggle in the top-right).
4. Click **Load unpacked** and select this repo's root directory.
5. Visit `https://<your-tenant>.atlassian.net` — Rovo UI should be
   hidden.

A Chrome Web Store listing is planned but not yet available.

## Usage

Click the NoRovo icon in the Chrome toolbar to open the popup, then
toggle **Block Rovo** on or off. Open tabs update immediately — no
reload required. The setting persists across browser restarts and
syncs to other Chrome profiles signed into the same Google account.

## How it works

The extension is a Manifest V3 content script registered against
`https://*.atlassian.net/*`:

1. **CSS injection at `document_start`.** A stylesheet with
   `display: none !important` rules targeting Rovo selectors is
   appended to `<html>` before the page paints, so Rovo elements never
   render visibly.
2. **MutationObserver.** Atlassian apps are SPAs and Rovo often mounts
   inside React portals appended late or after route changes. An
   observer watches `document.documentElement` for added subtrees and
   removes any matching nodes.
3. **Toggle plumbing.** The popup writes `enabled` to
   `chrome.storage.sync`. The content script listens for both
   `chrome.runtime.onMessage` (sent by the popup to active tabs) and
   `chrome.storage.onChanged` (covers tabs the popup did not reach).

The current selector list is intentionally broad (matches anything
with `rovo` in `aria-label`, `data-testid`, `id`, `class`, or
`data-vc`). This will be tightened to pinned `data-testid` values in
0.2.0 — see [Roadmap](#roadmap).

## Permissions

NoRovo requests the minimum permissions needed:

| Permission | Why |
|---|---|
| `storage` | Persist the on/off toggle in `chrome.storage.sync`. |
| `content_scripts` match `https://*.atlassian.net/*` | Inject the hide stylesheet and observer only on Atlassian tenants. |

No network permissions, no `host_permissions` beyond the content
script match, no telemetry.

## Limitations

- **Selector breadth.** The 0.1.x selector list matches any attribute
  containing "rovo" (case-insensitive). False positives are possible
  if Atlassian uses the substring elsewhere; please open an issue if
  you see something unrelated disappear.
- **Single host.** Only `*.atlassian.net` is matched. Atlassian Cloud
  custom domains and self-hosted Data Center products are not
  currently covered.
- **No network blocking.** Rovo's backend calls still fire; only the
  UI is hidden. See [Roadmap](#roadmap).
- **Shadow DOM.** CSS does not pierce closed shadow roots. The
  observer covers open shadow roots only via the standard tree walk.

## Roadmap

- **0.2.0** — Replace broad substring matchers with pinned
  `data-testid` values verified against live Jira and Confluence DOM.
- **0.3.0** — Optional badge counter showing how many Rovo elements
  were hidden per tab (useful for spotting selector drift). Right-click
  "report this element" context menu to crowd-source selectors.
- **0.4.0** — Opt-in network blocking via `declarativeNetRequest` for
  users who want to suppress Rovo API calls entirely.
- **0.5.0** — Playwright smoke tests against a recorded Atlassian
  session.

## Development

The runtime extension lives at the repo root:

```
manifest.json   # MV3 manifest
content.js      # injects CSS + runs MutationObserver
popup.html      # toolbar popup markup
popup.js        # popup toggle logic
```

Tooling uses [Bun](https://bun.sh) as the package manager and script
runner:

```bash
bun install        # install dev dependencies
bun run lint       # web-ext lint + ESLint
bun run build      # produce .web-ext-artifacts/<name>-<version>.zip
```

Edit a runtime file, then click the reload icon for NoRovo on
`chrome://extensions` to pick up changes. For content-script changes,
also hard-refresh any open Atlassian tab.

## Releases

Releases are driven by [release-please](https://github.com/googleapis/release-please)
via the [release-baton](https://github.com/release-baton/release-baton)
reusable workflow:

1. Merge a Conventional Commit to `main` (`feat:`, `fix:`, `feat!:`,
   etc.).
2. The `Release` workflow opens or updates a release pull request that
   bumps the version in `package.json`, `manifest.json`, and
   `.release-please-manifest.json`, and regenerates `CHANGELOG.md`.
3. Merging the release PR creates a git tag and a GitHub release.
4. The `Release asset` workflow runs on release publication, calls
   `bun run build`, and attaches the packaged extension zip to the
   release.

### Prerequisites

The org that hosts this repository must have a Release Baton GitHub
App registered and installed on the repo, with the following secrets
configured at the organization level:

- `RELEASE_BATON_CLIENT_ID`
- `RELEASE_BATON_PRIVATE_KEY`

See the [release-baton README](https://github.com/release-baton/release-baton#installation)
for the one-time org setup.

## Contributing

Issues and pull requests welcome, especially:

- Selectors verified against live Atlassian tenants — see
  [Selector reconnaissance](#selector-reconnaissance) below.
- Bug reports for false positives (unrelated UI disappearing).
- Reports of Rovo entry points NoRovo misses.

### Selector reconnaissance

The 0.1.x selectors are intentionally broad. To help tighten them in
0.2.0, the repo ships a paste-into-DevTools snippet that dumps every
candidate Rovo node on a live Atlassian page.

1. **Toggle NoRovo OFF** in the popup and reload the tab — otherwise
   the extension hides Rovo before the snippet can see it.
2. Open a Confluence page, Jira issue, or Atlassian Start tab where
   Rovo is visible (the floating chat launcher, "Ask Rovo" buttons,
   side panel, etc.).
3. Open DevTools (Cmd+Opt+I / Ctrl+Shift+I) and switch to the
   **Console**.
4. Paste the contents of [`tools/selector-recon.js`](tools/selector-recon.js)
   and press Enter.
5. The snippet prints a summary, copies a JSON dump to the clipboard,
   and returns it for inspection. Paste the JSON into a NoRovo issue.

The snippet detects whether NoRovo is currently active on the page
and warns you if you forgot step 1.

The snippet is read-only: it does not modify the page, install
listeners, or contact the network.

## License

[GPL-3.0](LICENSE).
