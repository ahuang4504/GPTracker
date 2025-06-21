import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { AuthPanel } from "@/components/authPanel";
import { Dashboard } from "@/components/dashboard";
import type { Session } from "@supabase/supabase-js";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);

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

  return <Dashboard session={session} setSession={setSession} />;
}

export default App;
