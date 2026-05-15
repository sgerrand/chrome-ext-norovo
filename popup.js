const checkbox = document.getElementById("enabled");

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  checkbox.checked = enabled;
});

checkbox.addEventListener("change", async () => {
  const enabled = checkbox.checked;
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
});
