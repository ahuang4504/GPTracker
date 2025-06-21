import { getFromStorage, setToStorage } from "./utils/localStorage";

let lastTabId: number | null = null;

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated:", activeInfo);
  (async () => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (
        tab.url &&
        tab.url.startsWith("https://chatgpt.com/") &&
        lastTabId !== activeInfo.tabId
      ) {
        console.log("ChatGPT visited - updating visit count");
        await updateVisitCount();
        lastTabId = activeInfo.tabId;
      } else {
        console.log("Tab is not ChatGPT or already handled");
      }
    } catch (err) {
      console.error("Failed to get tab info", err);
    }
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log("Tab updated:", tabId, changeInfo, tab);
  (async () => {
    try {
      if (
        changeInfo.status === "complete" &&
        tab.url?.startsWith("https://chatgpt.com/") &&
        lastTabId !== tabId
      ) {
        console.log("ChatGPT visited - updating visit count");
        await updateVisitCount();
        lastTabId = tabId;
      } else {
        console.log("Tab update not eligible for visit count");
      }
    } catch (err) {
      console.error("Failed to update visit count", err);
    }
  })();
});

async function updateVisitCount() {
  try {
    const { visitCount } = await getFromStorage<{ visitCount: number }>([
      "visitCount",
    ]);
    const newCount = (visitCount ?? 0) + 1;
    await setToStorage({ visitCount: newCount });
  } catch (err) {
    console.error("Failed to update visit count", err);
  }
}
