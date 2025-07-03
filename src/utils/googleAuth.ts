import { supabase } from "@/utils/supabase";

export async function signInWithGoogle() {
  return new Promise((resolve, reject) => {
    const redirectTo = chrome.identity.getRedirectURL("callback");
    
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    }).then(({ data, error }) => {
      if (error || !data?.url) {
        console.error("Error starting Google login:", error);
        reject({ error: error || new Error("No auth URL received") });
        return;
      }

      chrome.identity.launchWebAuthFlow(
        {
          url: data.url,
          interactive: true,
        },
        async (redirectUrl) => {
          if (!redirectUrl) {
            console.error("No redirect URL received from auth flow");
            reject({ error: new Error("No redirect URL received") });
            return;
          }
          if (chrome.runtime.lastError) {
            console.error("Login failed:", chrome.runtime.lastError.message);
            reject({ error: new Error(chrome.runtime.lastError.message) });
            return;
          }

          try {
            const hash = new URL(redirectUrl).hash.substring(1);
            const params = new URLSearchParams(hash);

            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (!access_token || !refresh_token) {
              console.error("Missing access or refresh token in redirect URL");
              reject({ error: new Error("Missing tokens in redirect URL") });
              return;
            }

            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (sessionError) {
              console.error("Could not finish login:", sessionError.message);
              reject({ error: sessionError });
            } else {
              console.log("Google login successful!");
              resolve({ data: sessionData, error: null });
            }
          } catch (err) {
            console.error("Error processing auth callback:", err);
            reject({ error: err });
          }
        }
      );
    }).catch(reject);
  });
}
