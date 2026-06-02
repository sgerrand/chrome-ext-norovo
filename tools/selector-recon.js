/*
 * NoRovo selector reconnaissance snippet.
 *
 * Paste this entire file into Chrome DevTools Console on a live
 * Atlassian tab (Confluence page, Jira issue, Atlassian Start, etc.).
 * It queries a set of AI-related substrings (Atlassian's actual Rovo
 * markup does not always contain the word "rovo" — the testid that
 * surfaces the chat launcher uses "conversation-assistant" and
 * "ai-mate", for example) across the same attributes the extension's
 * selectors check, captures each candidate element's attributes,
 * trimmed text, CSS path, and a short ancestor trail, prints a
 * summary, and copies a JSON dump to the clipboard for pasting into
 * a NoRovo issue.
 *
 * For meaningful results, toggle NoRovo OFF in the popup and reload
 * the page first — otherwise the extension has already removed the
 * nodes the snippet is trying to find.
 *
 * The snippet is read-only: it does not modify the page, install any
 * listeners, or contact the network.
 */
(() => {
  const KEYWORDS = [
    "rovo",
    "conversation-assistant",
    "ai-mate",
    "ai-assistant",
    "ai-agent",
    "atlassian-intelligence"
  ];
  const ATTRIBUTES = ["aria-label", "data-testid", "id", "class", "data-vc"];
  const SELECTORS = KEYWORDS.flatMap((kw) =>
    ATTRIBUTES.map((attr) => `[${attr}*="${kw}" i]`)
  );

  const NOROVO_STYLE_ID = "norovo-style";
  const MAX_PATH_DEPTH = 6;
  const MAX_TEXT_LEN = 80;
  const MAX_ANCESTOR_DEPTH = 4;
  const MAX_CLASS_TOKENS = 4;

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

  function shortClasses(value) {
    if (!value) return undefined;
    const tokens = value.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return undefined;
    const head = tokens.slice(0, MAX_CLASS_TOKENS).join(" ");
    return tokens.length > MAX_CLASS_TOKENS ? `${head} …` : head;
  }

  function ancestorTrail(el) {
    const trail = [];
    let cur = el.parentElement;
    while (cur && trail.length < MAX_ANCESTOR_DEPTH) {
      trail.push({
        tag: cur.tagName.toLowerCase(),
        testid: cur.getAttribute("data-testid") ?? undefined,
        ariaLabel: cur.getAttribute("aria-label") ?? undefined,
        role: cur.getAttribute("role") ?? undefined,
        classes: shortClasses(cur.getAttribute("class"))
      });
      cur = cur.parentElement;
    }
    return trail;
  }

  function summary(el, matchedBy) {
    const attrs = {};
    for (const a of el.attributes) attrs[a.name] = a.value;
    const text = (el.textContent || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, MAX_TEXT_LEN);
    return {
      tag: el.tagName.toLowerCase(),
      attrs,
      text,
      path: cssPath(el),
      matchedBy: Array.from(matchedBy),
      ancestors: ancestorTrail(el)
    };
  }

  const matchSelectors = new Map();
  for (const sel of SELECTORS) {
    for (const node of document.querySelectorAll(sel)) {
      if (node.id === NOROVO_STYLE_ID) continue;
      let set = matchSelectors.get(node);
      if (!set) {
        set = new Set();
        matchSelectors.set(node, set);
      }
      set.add(sel);
    }
  }

  const matches = Array.from(matchSelectors, ([el, sels]) =>
    summary(el, sels)
  );

  const extensionStyleTag = document.getElementById(NOROVO_STYLE_ID);
  const payload = {
    host: location.host,
    path: location.pathname,
    capturedAt: new Date().toISOString(),
    norovoActive: extensionStyleTag !== null,
    keywords: KEYWORDS,
    attributes: ATTRIBUTES,
    totalMatched: matches.length,
    matches
  };

  console.log(
    `%cNoRovo recon%c — ${matches.length} candidate node(s) across ${SELECTORS.length} selectors on ${location.host}`,
    "font-weight:bold;color:#0052cc",
    "color:inherit"
  );

  if (payload.norovoActive && matches.length === 0) {
    console.warn(
      "%cNoRovo is currently active on this page (style#norovo-style detected) and no candidates were found. The extension is hiding them before recon can see them. Toggle NoRovo OFF in the popup, reload the page, and re-run this snippet.",
      "color:#bf5b00;font-weight:bold"
    );
  } else if (!payload.norovoActive && matches.length === 0) {
    console.warn(
      "%cNo candidates found and NoRovo is not active. This route may not surface Rovo. Try a Confluence page, a Jira issue detail view, or Atlassian Start.",
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
