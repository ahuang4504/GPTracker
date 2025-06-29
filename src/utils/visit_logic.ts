import { getFromStorageRaw, setToStorage } from "./localStorage";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  VisitStorageData,
  SupabaseInvokeResponse,
  VisitCountResponse,
} from "@/types/storage";

// Retry utility with exponential backoff
async function withRetry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

async function pushVisitsInternal(session: Session, syncCounts: boolean): Promise<void> {
  if (!session?.access_token) {
    console.error("No session or access token available for visit sync.");
    return;
  }

  const storage = await getFromStorageRaw<VisitStorageData>([
    "visitCount",
    "lastSyncedCount",
  ]);
  const visitCount = storage.visitCount ?? 0;
  const lastSyncedCount = storage.lastSyncedCount ?? 0;

  const delta = visitCount - lastSyncedCount;
  if (delta <= 0) {
    return;
  }

  const functionName = syncCounts ? "update_visit_count" : "increment_last_visit_count";
  
  try {
    await withRetry(async () => {
      const response = await supabase.functions.invoke<SupabaseInvokeResponse>(
        functionName,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: { delta },
        }
      );
      
      if (response.error) {
        throw new Error(`${syncCounts ? "Visit" : "Last visit"} sync failed: ${JSON.stringify(response.error)}`);
      }
      
      return response;
    }, 3, 1000);

    console.log(`${syncCounts ? "Visit" : "Last visit"} sync successful`);
  } catch (error) {
    console.error(`${syncCounts ? "Visit" : "Last visit"} sync failed after retries:`, error);
    return;
  }

  // SYNC COUNTS NOW (PULL FROM DB AND UPDATE DISPLAY COUNT, LOCAL COUNT, AND LAST SYNCED COUNT)
  if (syncCounts) {
    await readVisits(session);
    const displayStorage = await getFromStorageRaw<VisitStorageData>([
      "displayCount",
    ]);
    const displayCount = displayStorage.displayCount ?? 0;
    await setToStorage({ lastSyncedCount: displayCount });
    await setToStorage({ visitCount: displayCount });
  }
}

export async function pushLastVisits(session: Session): Promise<void> {
  return pushVisitsInternal(session, false);
}

export async function pushVisits(session: Session): Promise<void> {
  return pushVisitsInternal(session, true);
}

export async function readVisits(session: Session): Promise<void> {
  try {
    const { data } = await withRetry(async () => {
      const response = await supabase.functions.invoke<VisitCountResponse>(
        "read_curr_date_visit_count",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {},
        }
      );

      if (response.error) {
        throw new Error(`Failed to fetch count: ${JSON.stringify(response.error)}`);
      }

      return response;
    }, 3, 1000);

    await setToStorage({ displayCount: data?.count ?? 0 });
    console.log("Visit count fetch successful");
  } catch (error) {
    console.error("Failed to fetch count after retries:", error);
  }
}
