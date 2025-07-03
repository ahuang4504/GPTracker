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
// Auth listener not needed - managed by parent App component
import { pushVisits, pushLastVisits } from "@/utils/visit_logic";
import { ensureDailyReset } from "@/utils/dailyReset";

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

        // Push leftover counts to Supabase
        await pushLastVisits(session);

        // Clear leftover flags
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

      // Push current local visits to Supabase (this also reads updated count)
      await pushVisits(session);
      console.log("Successfully pushed and synced visits with Supabase");
    } catch (error) {
      console.error("Supabase sync failed:", error);
      // Don't throw - let the app continue working with local data
    } finally {
      setIsSyncing(false);
    }
  }, [session]);

  useEffect(() => {
    console.log("Dashboard useEffect running...");
    (async () => {
      try {
        // Ensure daily reset is performed before loading data
        await ensureDailyReset();

        await handleLeftoverCounts();

        await performSupabaseSync();

        // Load visit count directly from storage
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

  const handleManualSync = async () => {
    await performSupabaseSync();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  // Removed duplicate useEffect - visit count is already loaded in the main useEffect above

  const handleBlockingToggle = async () => {
    try {
      const newBlockedState = !isBlocked;
      setIsBlocked(newBlockedState);
      await setSyncStorage({ chatgptBlocked: newBlockedState });
    } catch (error) {
      console.error("Failed to update blocking state:", error);
      // Revert state on error
      setIsBlocked(!isBlocked);
    }
  };

  return (
    <div className="dashboard">
      <h1>Welcome!</h1>
      <p>You are logged in as {session?.user?.email || "Unknown"}</p>

      <div className="visit-count">
        <p>You have visited ChatGPT {visitCount ?? 0} times.</p>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="auth-button"
          style={{
            marginTop: "0.5rem",
            fontSize: "0.9rem",
            padding: "0.5rem 1rem",
          }}
        >
          {isSyncing ? "Syncing..." : "Sync with Cloud"}
        </button>
      </div>

      {!isLoading && (
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
      )}

      <button onClick={handleLogout} className="auth-button logout">
        Log Out
      </button>
    </div>
  );
}
