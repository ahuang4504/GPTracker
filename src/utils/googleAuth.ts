import { supabase } from "@/utils/supabase";

export async function signInWithGoogle() {
  const redirectTo = chrome.identity.getRedirectURL("callback");
  // console.log("Redirect URL for Google login:", redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data?.url) {
    console.error("Error starting Google login:", error);
    return;
  }

  // console.log(data);

  chrome.identity.launchWebAuthFlow(
    {
      url: data.url,
      interactive: true,
    },
    async (redirectUrl) => {
      // console.log("Redirect URL:", redirectUrl);
      if (!redirectUrl) {
        console.error("No redirect URL received from auth flow");
        return;
      }
      if (chrome.runtime.lastError) {
        console.error("Login failed:", chrome.runtime.lastError.message);
        return;
      }

      const hash = new URL(redirectUrl).hash.substring(1); // remove leading "#"
      const params = new URLSearchParams(hash);

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        console.error("Missing access or refresh token in redirect URL");
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error("Could not finish login:", error.message);
      } else {
        console.log("Google login successful!");
      }
    }
  );
}
