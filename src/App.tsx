import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { AuthPanel } from "@/components/authPanel";
import type { Session } from "@supabase/supabase-js";
import { getFromStorage } from "./utils";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  const [visitCount, setVisitCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        const { visitCount } = await getFromStorage<{ visitCount: number }>([
          "visitCount",
        ]);
        setVisitCount(visitCount ?? 0);
      } catch (error) {
        console.error("Failed to fetch visit count:", error);
      }
    };

    fetchVisitCount();
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!session) {
    return (
      <AuthPanel
        onLogin={() =>
          supabase.auth
            .getSession()
            .then(({ data }) => setSession(data.session))
        }
      />
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome!</h1>
      <p>You are logged in as {session.user.email}</p>
      <div className="visit-count">
        <p>You have visited ChatGPT {visitCount || 0} times.</p>
      </div>
      <button onClick={handleLogout} className="auth-button logout">
        Log Out
      </button>
    </div>
  );
}

export default App;
