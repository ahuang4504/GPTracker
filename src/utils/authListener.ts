import { supabase } from "@/utils/supabase";
import type { Session } from "@supabase/supabase-js";

export const listenToAuthChanges = (
  setSession: (session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });
};
