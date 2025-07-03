import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { AuthPanel } from "@/components/authPanel";
import { Dashboard } from "@/components/dashboard";
import type { Session } from "@supabase/supabase-js";
import { listenToAuthChanges } from "./utils/authListener";
import "./App.css";

function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = listenToAuthChanges(setSession);

    return () => subscription.unsubscribe();
  }, []);

  console.log("App rendering, session:", session ? "exists" : "null");

  if (!session) {
    console.log("Showing AuthPanel");
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

  console.log("Showing Dashboard");
  return <Dashboard session={session} setSession={setSession} />;
}

export default App;
