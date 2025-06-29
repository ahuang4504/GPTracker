import { isNewDay, formatDate, resetCounts } from "./timeUtils";
import { pushLastVisits } from "./visit_logic";
import { getFromStorageRaw, setToStorage } from "./localStorage";
import type { VisitStorageData, StorageLastDate } from "@/types/storage";
import type { Session } from "@supabase/supabase-js";

class DailyResetManager {
  private static instance: DailyResetManager;
  private lastResetDate: string | null = null;
  private isResetting = false;
  private initialized = false;

  private constructor() {}

  static getInstance(): DailyResetManager {
    if (!this.instance) {
      this.instance = new DailyResetManager();
    }
    return this.instance;
  }

  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const storage = await getFromStorageRaw<StorageLastDate>(["lastDateStr"]);
      this.lastResetDate = storage.lastDateStr ?? null;
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize DailyResetManager:", error);
      this.initialized = true; // Still mark as initialized to prevent infinite loops
    }
  }


  async ensureDailyReset(session?: Session): Promise<void> {
    await this.initialize();
    
    if (this.isResetting) {
      // Wait for ongoing reset to complete
      while (this.isResetting) {
        await new Promise<void>(resolve => setTimeout(resolve, 10));
      }
      return;
    }
    
    const today: string = formatDate(new Date());
    if (this.lastResetDate === today) {
      return; // Already reset today
    }

    this.isResetting = true;
    try {
      if (isNewDay(this.lastResetDate ?? undefined)) {
        // Check for leftover visits and sync them before reset
        if (session) {
          try {
            const storage = await getFromStorageRaw<VisitStorageData>([
              "visitCount",
              "lastSyncedCount",
            ]);
            
            const visitCount = storage.visitCount ?? 0;
            const lastSyncedCount = storage.lastSyncedCount ?? 0;
            
            if (visitCount !== lastSyncedCount) {
              console.log("Syncing leftover visits before daily reset");
              await pushLastVisits(session);
            }
          } catch (error) {
            console.error("Failed to sync leftover visits:", error);
            // Continue with reset even if sync fails
          }
        }
        
        await resetCounts();
        this.lastResetDate = today;
        
        // Store the reset date in Chrome storage
        await setToStorage({ lastDateStr: today });
        
        console.log("Daily reset completed for", today);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to perform daily reset:", errorMessage);
      throw error;
    } finally {
      this.isResetting = false;
    }
  }
}

export const dailyResetManager = DailyResetManager.getInstance();