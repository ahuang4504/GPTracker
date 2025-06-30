import { getFromStorage, setToStorage } from "./utils/localStorage";
import { supabase } from "./utils/supabase";
import { pushVisits, readVisits } from "./utils/visit_logic";
import { getTimeUntil } from "./utils/timeUtils";
import { dailyResetManager } from "./utils/dailyResetManager";

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

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("hourlyPush", { periodInMinutes: 60 });
  chrome.alarms.create("tenMinFetch", { periodInMinutes: 10 });
  chrome.alarms.create("finalPush", {
    when: getTimeUntil(23, 59, 55),
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  await dailyResetManager.ensureDailyReset(session || undefined);

  if (!session) return;

  console.log("Alarm triggered:", alarm.name);
  console.log("Time:", new Date().toLocaleTimeString());

  switch (alarm.name) {
    case "hourlyPush":
    case "finalPush":
      await pushVisits(session);
      break;
    case "tenMinFetch":
      await readVisits(session);
      break;
  }
});
