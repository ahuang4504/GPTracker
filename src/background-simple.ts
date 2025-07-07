import { ensureDailyReset } from "./utils/dailyReset";

let lastActiveTabId: number | null = null;
let lastActiveWasChatGPT = false;
const visitedTabs = new Map<number, number>(); // tabId -> last visit timestamp
const SAME_TAB_THROTTLE_MS = 5000; // 5 seconds for same tab
let visitCountUpdateInProgress = false;

// Inline storage functions to get around chrome extension not liking imports
async function getSyncStorage<T = Record<string, unknown>>(
  keys: string[]
): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result as T);
    });
  });
}

async function getFromStorage<T = Record<string, unknown>>(
  keys: string[]
): Promise<T> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => {
      resolve(result as T);
    });
  });
}

async function setToStorage(items: { [key: string]: unknown }): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => resolve());
  });
}

// Helper function to check if tab visit is within throttle period
function isWithinThrottle(tabId: number): boolean {
  const lastVisit = visitedTabs.get(tabId);
  return lastVisit !== undefined && (Date.now() - lastVisit < SAME_TAB_THROTTLE_MS);
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated:", activeInfo);
  (async () => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      const currentTabId = activeInfo.tabId;
      const isChatGPTTab = !!(tab.url && tab.url.startsWith("https://chatgpt.com/"));
      
      if (isChatGPTTab) {
        const shouldCount = 
          !lastActiveWasChatGPT || // Coming from non-ChatGPT tab
          lastActiveTabId !== currentTabId || // Different ChatGPT tab
          !isWithinThrottle(currentTabId); // Same tab but throttle expired
        
        if (shouldCount) {
          console.log("ChatGPT visited - updating visit count (onActivated)");
          console.log("Reason:", !lastActiveWasChatGPT ? "from non-ChatGPT" : lastActiveTabId !== currentTabId ? "different tab" : "throttle expired");
          await updateVisitCount();
          visitedTabs.set(currentTabId, Date.now());
        } else {
          console.log("ChatGPT visit throttled - same tab within throttle period");
        }
      } else {
        console.log("Tab is not ChatGPT, URL:", tab.url);
      }
      
      // Update tracking state
      lastActiveTabId = currentTabId;
      lastActiveWasChatGPT = isChatGPTTab;
    } catch (err) {
      console.error("Failed to get tab info", err);
    }
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    console.log("Tab updated:", tabId, changeInfo, tab);
  }
  (async () => {
    try {
      // Only count if:
      // 1. Page finished loading
      // 2. It's a ChatGPT URL
      // 3. This tab is currently active
      // 4. We haven't counted this tab recently
      if (
        changeInfo.status === "complete" &&
        tab.url?.startsWith("https://chatgpt.com/") &&
        tabId === lastActiveTabId &&
        !isWithinThrottle(tabId)
      ) {
        console.log("ChatGPT page loaded - updating visit count (onUpdated)");
        await updateVisitCount();
        visitedTabs.set(tabId, Date.now());
        lastActiveWasChatGPT = true;
      } else {
        console.log("Tab update not eligible for visit count");
      }
    } catch (err) {
      console.error("Failed to update visit count", err);
    }
  })();
});

async function updateVisitCount() {
  if (visitCountUpdateInProgress) {
    console.log("Visit count update already in progress, skipping");
    return;
  }

  visitCountUpdateInProgress = true;
  console.log("=== Starting visit count update ===");
  try {
    await ensureDailyReset();

    const { chatgptBlocked } = await getSyncStorage<{
      chatgptBlocked?: boolean;
    }>(["chatgptBlocked"]);

    if (chatgptBlocked === true) {
      console.log("ChatGPT is blocked, not counting visit");
      return;
    }

    const { visitCount } = await getFromStorage<{ visitCount?: number }>([
      "visitCount",
    ]);
    const newCount = (visitCount ?? 0) + 1;
    await setToStorage({ visitCount: newCount });
    console.log("=== Visit count updated from", visitCount, "to:", newCount, "===");
  } catch (err) {
    console.error("Failed to update visit count", err);
  } finally {
    visitCountUpdateInProgress = false;
    console.log("=== Visit count update completed ===");
  }
}

// No messaging needed - popup handles Supabase operations directly

// Daily reset logic moved to utils/dailyReset.ts for shared use

// Cleanup closed tabs from tracking
chrome.tabs.onRemoved.addListener((tabId) => {
  visitedTabs.delete(tabId);
  if (lastActiveTabId === tabId) {
    lastActiveTabId = null;
    lastActiveWasChatGPT = false;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dailyReset", {
    when: getTomorrowMidnight(),
    periodInMinutes: 24 * 60,
  });

  ensureDailyReset();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "dailyReset") {
    await ensureDailyReset();
  }
});

function getTomorrowMidnight(): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

console.log("Background script loaded successfully");
