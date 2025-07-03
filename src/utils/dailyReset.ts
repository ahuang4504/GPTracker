import { getFromStorage, setToStorage } from "./localStorage";
import { formatDate } from "./timeUtils";

/**
 * Shared daily reset logic for both background script and popup
 * Checks if it's a new day and resets counts while preserving unsynced data
 */
export async function ensureDailyReset(): Promise<void> {
  try {
    const { lastDateStr, visitCount, lastSyncedCount } = await getFromStorage<{
      lastDateStr?: string;
      visitCount?: number;
      lastSyncedCount?: number;
    }>(["lastDateStr", "visitCount", "lastSyncedCount"]);
    
    const today = formatDate(new Date());

    if (lastDateStr !== today) {
      console.log("New day detected, preserving counts for eventual sync");

      // Store unsynced delta as leftover for eventual consistency
      const delta = (visitCount ?? 0) - (lastSyncedCount ?? 0);

      if (delta > 0) {
        await setToStorage({
          leftoverCounts: delta,
          leftoverDate: lastDateStr || "unknown",
          hasUnpushedCounts: true,
        });
        console.log(
          `Preserved ${delta} unsynced counts from ${lastDateStr} as leftover`
        );
      }

      // Reset current day counts
      await setToStorage({
        visitCount: 0,
        lastSyncedCount: 0,
        lastDateStr: today,
      });
      
      console.log(`Daily reset completed for ${today}`);
    }
  } catch (error) {
    console.error("Failed to perform daily reset:", error);
  }
}