import { useState, useEffect, useCallback, useRef } from "react";
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
  const hasInitialized = useRef<boolean>(false);

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

  const syncInProgress = useRef<boolean>(false);
  
  const performSupabaseSync = useCallback(async () => {
    if (!session || syncInProgress.current) return;

    syncInProgress.current = true;
    setIsSyncing(true);
    try {
      console.log("Performing Supabase sync...");

      await pushVisits(session);
      console.log("Successfully pushed and synced visits with Supabase");
    } catch (error) {
      console.error("Supabase sync failed:", error);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [session]);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    
    hasInitialized.current = true;
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
      <div className="dashboard-header">
        <div className="dashboard-title-row">
          <img src="/chatgpt.svg" className="chatgpt-icon" alt="" />
          <h1>Welcome!</h1>
        </div>
        <span className="login-status">({session?.user?.email || "Unknown"})</span>
      </div>

      <div className="visit-count">
        <p>► You have visited ChatGPT <span style={{textDecoration: 'underline'}}>{visitCount ?? 0}</span> times today.</p>
      </div>

      <VisitChart session={session} />

      <div className="blocking-toggle">
        <label className="toggle-container">
          <span className="toggle-label">► Block ChatGPT Access</span>
          <input
            type="checkbox"
            checked={isBlocked}
            onChange={handleBlockingToggle}
            className="toggle-checkbox"
          />
          <span className="toggle-slider">
            <span className="toggle-text toggle-off">Off</span>
            <span className="toggle-text toggle-on">On</span>
          </span>
        </label>
      </div>

      <div className="logout-section">
        <a onClick={handleLogout} className="logout-link">
          ► Log Out
        </a>
      </div>
      
      <div className="gptracker-logo-container">
        <img src="/GPTracker.png" className="gptracker-logo" alt="GPTracker" />
      </div>
    </div>
  );
}
