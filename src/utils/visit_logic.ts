import { getFromStorageRaw, setToStorage } from "./localStorage";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import type {
  VisitStorageData,
  SupabaseInvokeResponse,
  VisitCountResponse,
} from "@/types/storage";

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
  const res = await supabase.functions.invoke<SupabaseInvokeResponse>(
    functionName,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: { delta },
    }
  );

  if (res.error) {
    console.error(`${syncCounts ? "Visit" : "Last visit"} sync failed:`, res.error);
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
  const { data, error } = await supabase.functions.invoke<VisitCountResponse>(
    "read_curr_date_visit_count",
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: {},
    }
  );

  if (error) {
    console.error("Failed to fetch count:", error);
    return;
  }

  await setToStorage({ displayCount: data?.count ?? 0 });
}
