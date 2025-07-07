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

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(
        `Attempt ${attempt} failed, retrying in ${delay}ms:`,
        lastError.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

async function pushVisitsInternal(
  session: Session,
  syncCounts: boolean
): Promise<void> {
  if (!session?.access_token) {
    console.error("No session or access token available for visit sync.");
    return;
  }

  let delta: number;

  if (syncCounts) {
    // Regular sync: calculate delta from current counts
    const storage = await getFromStorageRaw<VisitStorageData>([
      "visitCount",
      "lastSyncedCount",
    ]);
    const visitCount = storage.visitCount ?? 0;
    const lastSyncedCount = storage.lastSyncedCount ?? 0;
    delta = visitCount - lastSyncedCount;
    console.log(`[SYNC] Calculating delta: visitCount(${visitCount}) - lastSyncedCount(${lastSyncedCount}) = ${delta}`);
  } else {
    // Push last visits: use stored leftover counts
    const storage = await getFromStorageRaw<{ leftoverCounts?: number }>([
      "leftoverCounts",
    ]);
    delta = storage.leftoverCounts ?? 0;
    console.log(`[SYNC] Using leftover counts delta: ${delta}`);
  }

  if (delta <= 0) {
    return;
  }

  const functionName = syncCounts
    ? "update_visit_count"
    : "increment_last_visit_count";

  try {
    await withRetry(
      async () => {
        const response =
          await supabase.functions.invoke<SupabaseInvokeResponse>(
            functionName,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              body: { delta },
            }
          );

        if (response.error) {
          throw new Error(
            `${
              syncCounts ? "Visit" : "Last visit"
            } sync failed: ${JSON.stringify(response.error)}`
          );
        }

        return response;
      },
      3,
      1000
    );

    console.log(`[SYNC] ${syncCounts ? "Visit" : "Last visit"} sync successful - pushed delta: ${delta}`);
  } catch (error) {
    console.error(
      `${syncCounts ? "Visit" : "Last visit"} sync failed after retries:`,
      error
    );
    throw error;
  }

  if (syncCounts) {
    await readVisits(session);
    console.log("Sync completed: visitCount and lastSyncedCount updated from cloud");
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
    const { data } = await withRetry(
      async () => {
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
          throw new Error(
            `Failed to fetch count: ${JSON.stringify(response.error)}`
          );
        }

        return response;
      },
      3,
      1000
    );

    const cloudCount = data?.count ?? 0;
    console.log(`[SYNC] Updating local storage with cloud count: ${cloudCount}`);
    await setToStorage({ 
      visitCount: cloudCount,
      lastSyncedCount: cloudCount 
    });
    console.log("Visit count fetch successful");
  } catch (error) {
    console.error("Failed to fetch count after retries:", error);
  }
}
