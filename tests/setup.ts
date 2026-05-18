import chromeStub from "sinon-chrome";
import { beforeEach, afterEach } from "vitest";

(globalThis as unknown as { chrome: unknown }).chrome = chromeStub;

beforeEach(() => {
  chromeStub.flush();
});

afterEach(() => {
  document.documentElement.replaceChildren(
    document.createElement("head"),
    document.createElement("body")
  );
});
