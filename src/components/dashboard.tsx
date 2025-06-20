import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { getFromStorage } from "@/utils/localStorage";
import type { Session } from "@supabase/supabase-js";

export function Dashboard({
  session,
  setSession,
}: {
  session: Session;
  setSession: (s: Session | null) => void;
}) {
  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { visitCount } = await getFromStorage<{ visitCount: number }>([
          "visitCount",
        ]);
        setVisitCount(visitCount ?? 0);
      } catch (error) {
        console.error("Failed to fetch visit count:", error);
      }
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  return (
    <div className="dashboard">
      <h1>Welcome!</h1>
      <p>You are logged in as {session!.user.email}</p>
      <div className="visit-count">
        <p>You have visited ChatGPT {visitCount || 0} times.</p>
      </div>
      <button onClick={handleLogout} className="auth-button logout">
        Log Out
      </button>
    </div>
  );
}
