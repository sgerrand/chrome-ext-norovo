export async function broadcastToggle(enabled: boolean): Promise<void> {
  await chrome.storage.sync.set({ enabled });
  const tabs = await chrome.tabs.query({ url: "*://*.atlassian.net/*" });
  for (const tab of tabs) {
    if (tab.id === undefined) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "norovo:toggle", enabled });
    } catch {
      // Tab has no live content script (e.g. not yet loaded). Ignore.
    }
  }
}

export function init(): void {
  const checkbox = document.getElementById("enabled") as HTMLInputElement | null;
  if (!checkbox) return;

  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    checkbox.checked = enabled;
  });

  checkbox.addEventListener("change", () => {
    void broadcastToggle(checkbox.checked);
  });
}

if (typeof chrome !== "undefined" && chrome.runtime?.id) {
  init();
}
