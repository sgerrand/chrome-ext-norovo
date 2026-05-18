import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  STYLE_ID,
  SELECTOR_LIST,
  applyBlock,
  injectStyle,
  removeBlock,
  removeStyle,
  startObserver,
  stopObserver,
  sweepAndRemove
} from "../src/content";

const FIXTURE = readFileSync(
  join(__dirname, "fixtures", "rovo-basic.html"),
  "utf8"
);

function loadFixture(): void {
  const parser = new DOMParser();
  const doc = parser.parseFromString(FIXTURE, "text/html");
  document.documentElement.replaceWith(
    document.adoptNode(doc.documentElement)
  );
}

describe("content script selectors", () => {
  beforeEach(() => {
    loadFixture();
  });

  afterEach(() => {
    removeBlock();
  });

  it("injects a style tag with the expected id and rules", () => {
    injectStyle();
    const style = document.getElementById(STYLE_ID) as HTMLStyleElement;
    expect(style).not.toBeNull();
    expect(style.tagName).toBe("STYLE");
    expect(style.textContent).toContain("display: none !important");
  });

  it("injectStyle is idempotent", () => {
    injectStyle();
    injectStyle();
    const styles = document.querySelectorAll(`#${STYLE_ID}`);
    expect(styles.length).toBe(1);
  });

  it("removeStyle deletes the injected tag", () => {
    injectStyle();
    removeStyle();
    expect(document.getElementById(STYLE_ID)).toBeNull();
  });

  it("matches every Rovo fixture node via SELECTOR_LIST", () => {
    const matched = Array.from(document.querySelectorAll(SELECTOR_LIST));
    expect(
      matched.some(
        (el) => el.getAttribute("data-testid") === "rovo-chat-launcher"
      )
    ).toBe(true);
    expect(
      matched.some((el) => el.getAttribute("aria-label") === "Ask Rovo")
    ).toBe(true);
    expect(
      matched.some((el) => el.classList.contains("rovo-sidebar"))
    ).toBe(true);
    expect(
      matched.some((el) => el.getAttribute("data-vc") === "rovo-side-panel")
    ).toBe(true);
  });

  it("does not match decoy DOM (search, mention)", () => {
    const decoys = document.querySelectorAll("#search-launcher, p");
    for (const decoy of decoys) {
      expect(decoy.matches(SELECTOR_LIST)).toBe(false);
    }
  });
});

describe("content script DOM mutation", () => {
  beforeEach(() => {
    loadFixture();
  });

  afterEach(() => {
    removeBlock();
  });

  it("sweepAndRemove removes a matching root and its descendants", () => {
    const sidebar = document.querySelector(".rovo-sidebar") as HTMLElement;
    expect(sidebar).not.toBeNull();
    sweepAndRemove(sidebar);
    expect(document.querySelector(".rovo-sidebar")).toBeNull();
  });

  it("sweepAndRemove removes Rovo descendants of a non-matching root", () => {
    const main = document.querySelector("main") as HTMLElement;
    sweepAndRemove(main);
    expect(document.querySelector(".rovo-sidebar")).toBeNull();
    expect(document.getElementById("primary-content")).not.toBeNull();
  });

  it("observer removes Rovo nodes added after initial paint", async () => {
    const decoys = Array.from(document.querySelectorAll(SELECTOR_LIST));
    for (const node of decoys) node.remove();

    startObserver();

    const late = document.createElement("div");
    late.setAttribute("data-testid", "rovo-late-mount");
    late.textContent = "late";
    document.body.appendChild(late);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector('[data-testid="rovo-late-mount"]')
    ).toBeNull();
    stopObserver();
  });

  it("applyBlock both injects style and starts observer", async () => {
    applyBlock();
    expect(document.getElementById(STYLE_ID)).not.toBeNull();

    const late = document.createElement("button");
    late.setAttribute("aria-label", "Ask Rovo follow-up");
    document.body.appendChild(late);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      document.querySelector('[aria-label="Ask Rovo follow-up"]')
    ).toBeNull();
  });
});
