// import { isNewDay, formatDate, resetCounts } from "./timeUtils";
// import { pushLastVisits } from "./visit_logic";
// import { getFromStorageRaw, setToStorage } from "./localStorage";
// import type { VisitStorageData, StorageLastDate } from "@/types/storage";
// import type { Session } from "@supabase/supabase-js";

// class DailyResetManager {
//   private static instance: DailyResetManager;
//   private lastResetDate: string | null = null;
//   private isResetting = false;

//   private constructor() {}

//   static getInstance(): DailyResetManager {
//     if (!this.instance) {
//       this.instance = new DailyResetManager();
//     }
//     return this.instance;
//   }

//   async ensureDailyReset(session?: Session): Promise<void> {

//     if (this.isResetting) {
//       // Wait for ongoing reset to complete with timeout
//       let waitTime = 0;
//       const maxWaitTime = 5000; // 5 seconds maximum wait
//       while (this.isResetting && waitTime < maxWaitTime) {
//         await new Promise<void>((resolve) => setTimeout(resolve, 100));
//         waitTime += 100;
//       }
      
//       if (this.isResetting) {
//         console.warn("Daily reset is taking too long, proceeding anyway");
//         this.isResetting = false; // Force reset the flag
//       }
//       return;
//     }

//     const today: string = formatDate(new Date());
//     if (this.lastResetDate === today) {
//       return;
//     }

//     this.isResetting = true;
//     try {
//         // Check for leftover visits and sync them before reset
//         if (session) {
//           try {
//             const storage = await getFromStorageRaw<VisitStorageData>([
//               "visitCount",
//               "lastSyncedCount",
//             ]);

//             const visitCount = storage.visitCount ?? 0;
//             const lastSyncedCount = storage.lastSyncedCount ?? 0;

//             if (visitCount !== lastSyncedCount) {
//               console.log("Syncing leftover visits before daily reset");
//               await pushLastVisits(session);
//             }
//           } catch (error) {
//             console.error("Failed to sync leftover visits:", error);
//           }
//         }

//         await resetCounts();
//         this.lastResetDate = today;

//         await setToStorage({ lastDateStr: today });

//         console.log("Daily reset completed for", today);
//       }
//     } catch (error) {
//       const errorMessage =
//         error instanceof Error ? error.message : String(error);
//       console.error("Failed to perform daily reset:", errorMessage);
//       throw error;
//     } finally {
//       this.isResetting = false;
//     }
//   }

// export const dailyResetManager = DailyResetManager.getInstance();
