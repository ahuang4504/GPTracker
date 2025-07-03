import { ensureDailyReset } from "./utils/dailyReset";

let lastVisitTime: number = 0;
const VISIT_THROTTLE_MS = 5000; // 5 seconds between counts
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

chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated:", activeInfo);
  (async () => {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      
      // Check if this is a ChatGPT tab and enough time has passed
      if (tab.url && tab.url.startsWith("https://chatgpt.com/")) {
        const now = Date.now();
        if (now - lastVisitTime > VISIT_THROTTLE_MS) {
          console.log("ChatGPT visited - updating visit count");
          await updateVisitCount();
          lastVisitTime = now;
        } else {
          console.log("ChatGPT visit throttled - too recent");
        }
      } else {
        console.log("Tab is not ChatGPT, URL:", tab.url);
      }
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
      if (
        changeInfo.status === "complete" &&
        tab.url?.startsWith("https://chatgpt.com/")
      ) {
        const now = Date.now();
        if (now - lastVisitTime > VISIT_THROTTLE_MS) {
          console.log("ChatGPT page loaded - updating visit count");
          await updateVisitCount();
          lastVisitTime = now;
        } else {
          console.log("ChatGPT page load throttled - too recent");
        }
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
    console.log("Visit count updated to:", newCount);
  } catch (err) {
    console.error("Failed to update visit count", err);
  } finally {
    visitCountUpdateInProgress = false;
  }
}

// No messaging needed - popup handles Supabase operations directly

// Daily reset logic moved to utils/dailyReset.ts for shared use

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
