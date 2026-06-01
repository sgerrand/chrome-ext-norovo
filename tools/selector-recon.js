/*
 * NoRovo selector reconnaissance snippet.
 *
 * Paste this entire file into Chrome DevTools Console on a live
 * Atlassian tab (Confluence page, Jira issue, Atlassian Start, etc.).
 * It queries the same broad selectors the extension uses, captures
 * each candidate element's attributes, trimmed text, and a short CSS
 * path, prints the result, and copies a JSON dump to the clipboard
 * for pasting into a GitHub issue.
 *
 * The snippet is read-only: it does not modify the page, install any
 * listeners, or contact the network.
 */
(() => {
  const SELECTORS = [
    '[aria-label*="Rovo" i]',
    '[data-testid*="rovo" i]',
    '[id*="rovo" i]',
    '[class*="rovo" i]',
    '[data-vc*="rovo" i]'
  ];

  const MAX_PATH_DEPTH = 6;
  const MAX_TEXT_LEN = 80;

  function cssPath(el) {
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && parts.length < MAX_PATH_DEPTH) {
      let part = cur.tagName.toLowerCase();
      if (cur.id) {
        parts.unshift(`${part}#${cur.id}`);
        break;
      }
      const dtid = cur.getAttribute("data-testid");
      if (dtid) {
        part += `[data-testid="${dtid}"]`;
      } else if (cur.parentNode) {
        const sibs = Array.from(cur.parentNode.children).filter(
          (c) => c.tagName === cur.tagName
        );
        if (sibs.length > 1) {
          part += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
        }
      }
      parts.unshift(part);
      cur = cur.parentElement;
    }
    return parts.join(" > ");
  }

  function summary(el) {
    const attrs = {};
    for (const a of el.attributes) attrs[a.name] = a.value;
    const text = (el.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TEXT_LEN);
    return { tag: el.tagName.toLowerCase(), attrs, text, path: cssPath(el) };
  }

  const NOROVO_STYLE_ID = "norovo-style";
  const extensionStyleTag = document.getElementById(NOROVO_STYLE_ID);

  const results = {};
  let total = 0;
  for (const sel of SELECTORS) {
    const nodes = Array.from(document.querySelectorAll(sel)).filter(
      (el) => el.id !== NOROVO_STYLE_ID
    );
    results[sel] = nodes.map(summary);
    total += nodes.length;
  }

  const payload = {
    host: location.host,
    path: location.pathname,
    capturedAt: new Date().toISOString(),
    norovoActive: extensionStyleTag !== null,
    totalMatched: total,
    results
  };

  console.log(
    `%cNoRovo recon%c — ${total} candidate node(s) across ${SELECTORS.length} selectors on ${location.host}`,
    "font-weight:bold;color:#0052cc",
    "color:inherit"
  );

  if (payload.norovoActive && total === 0) {
    console.warn(
      "%cNoRovo is currently active on this page (style#norovo-style detected) and no Rovo candidates were found. The extension is hiding them before recon can see them. Toggle NoRovo OFF in the popup, reload the page, and re-run this snippet.",
      "color:#bf5b00;font-weight:bold"
    );
  } else if (!payload.norovoActive && total === 0) {
    console.warn(
      "%cNo Rovo candidates found and NoRovo is not active. This route may not surface Rovo. Try a Confluence page, a Jira issue detail view, or Atlassian Start.",
      "color:#bf5b00"
    );
  }

  console.dir(payload, { depth: null });

  if (typeof copy === "function") {
    try {
      copy(JSON.stringify(payload, null, 2));
      console.log(
        "%cCopied JSON to clipboard. Paste it into a NoRovo issue.",
        "color:#006644"
      );
    } catch {
      console.warn("Could not copy to clipboard automatically.");
    }
  }

  return payload;
})();
