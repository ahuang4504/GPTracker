import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import {
  getFromStorage,
  getSyncStorage,
  setSyncStorage,
  setToStorage,
} from "@/utils/localStorage";
import type { Session } from "@supabase/supabase-js";
import type { SyncStorageData } from "@/types/storage";
import { pushVisits, pushLastVisits } from "@/utils/visit_logic";
import { ensureDailyReset } from "@/utils/dailyReset";
import { VisitChart } from "./VisitChart";

export function Dashboard({
  session,
  setSession,
}: {
  session: Session;
  setSession: (s: Session | null) => void;
}) {
  console.log("Dashboard component rendering...");
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const handleLeftoverCounts = useCallback(async () => {
    if (!session) return;

    try {
      const { hasUnpushedCounts, leftoverCounts, leftoverDate } =
        await getFromStorage<{
          hasUnpushedCounts?: boolean;
          leftoverCounts?: number;
          leftoverDate?: string;
        }>(["hasUnpushedCounts", "leftoverCounts", "leftoverDate"]);

      if (hasUnpushedCounts && leftoverCounts && leftoverCounts > 0) {
        console.log(
          `Found ${leftoverCounts} leftover counts from ${leftoverDate}, syncing...`
        );

        await pushLastVisits(session);

        await setToStorage({
          hasUnpushedCounts: false,
          leftoverCounts: 0,
          leftoverDate: null,
        });

        console.log("Successfully synced leftover counts");
      }
    } catch (error) {
      console.error("Failed to handle leftover counts:", error);
    }
  }, [session]);

  const performSupabaseSync = useCallback(async () => {
    if (!session) return;

    setIsSyncing(true);
    try {
      console.log("Performing Supabase sync...");

      await pushVisits(session);
      console.log("Successfully pushed and synced visits with Supabase");
    } catch (error) {
      console.error("Supabase sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [session]);

  useEffect(() => {
    console.log("Dashboard useEffect running...");
    (async () => {
      try {
        await ensureDailyReset();

        await handleLeftoverCounts();

        await performSupabaseSync();

        const { visitCount } = await getFromStorage<{
          visitCount?: number;
        }>(["visitCount"]);
        console.log("Loaded visitCount from storage:", visitCount);
        setVisitCount(visitCount ?? 0);

        // Load blocking state from sync storage
        const { chatgptBlocked } = await getSyncStorage<SyncStorageData>([
          "chatgptBlocked",
        ]);
        setIsBlocked(chatgptBlocked ?? false);

        console.log("Dashboard useEffect completed");
      } catch (error) {
        console.error("Failed to fetch storage data:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [handleLeftoverCounts, performSupabaseSync]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleBlockingToggle = async () => {
    try {
      const newBlockedState = !isBlocked;
      setIsBlocked(newBlockedState);
      await setSyncStorage({ chatgptBlocked: newBlockedState });
    } catch (error) {
      console.error("Failed to update blocking state:", error);
      setIsBlocked(!isBlocked);
    }
  };

  if (isLoading || isSyncing) {
    return (
      <div className="dashboard">
        <div className="loading-state">
          <h2>Loading...</h2>
          <p>{isSyncing ? "Syncing with cloud..." : "Loading dashboard..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome!</h1>
      <p>You are logged in as {session?.user?.email || "Unknown"}</p>

      <div className="visit-count">
        <p>You have visited ChatGPT {visitCount ?? 0} times today.</p>
      </div>

      <VisitChart session={session} />

      <div className="blocking-toggle">
        <label className="toggle-container">
          <span className="toggle-label">Block ChatGPT Access</span>
          <input
            type="checkbox"
            checked={isBlocked}
            onChange={handleBlockingToggle}
            className="toggle-checkbox"
          />
          <span className="toggle-slider"></span>
        </label>
        {isBlocked && (
          <p className="blocking-status">ChatGPT is currently blocked</p>
        )}
      </div>

      <button onClick={handleLogout} className="auth-button logout">
        Log Out
      </button>
    </div>
  );
}
