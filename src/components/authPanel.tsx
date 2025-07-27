import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { signInWithGoogle } from "@/utils/googleAuth";

interface Props {
  onLogin: () => void;
}

export function AuthPanel({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleEmailAuth = async () => {
    setError(null);
    if (!email || !password) {
      setError("Please fill out all fields.");
      return;
    }

    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (data.user && data.session) {
      // Verify auth state before calling onLogin
      onLogin();
    } else {
      setError("Authentication failed. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    setError(null);
    if (!email) {
      setError("Enter your email to reset password.");
      return;
    }
    const redirectTo = chrome.identity.getRedirectURL("callback");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="login-container">
      <div className="auth-header">
        <img src="/chatgpt.svg" className="chatgpt-icon" alt="" />
        <h2 className="auth-title">► {isSignUp ? "Sign Up" : "Log In"}</h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEmailAuth();
        }}
        className="auth-form"
      >
        <input
          type="email"
          placeholder="► Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="► Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="auth-button">
          ► {isSignUp ? "Sign Up with Email" : "Log In with Email"}
        </button>
      </form>

      <div className="auth-footer">
        <button
          type="button"
          className="auth-text-button"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          ► {isSignUp ? "Already have an account? Log In" : "No account? Sign Up"}
        </button>

        <button
          type="button"
          className="auth-text-button"
          onClick={handleResetPassword}
        >
          ► Forgot password?
        </button>

        {resetSent && <p className="auth-success">Reset email sent!</p>}
      </div>

      <div className="auth-divider">OR</div>

      <div className="google-auth-container">
        <button
          onClick={async () => {
            try {
              const result = (await signInWithGoogle()) as {
                data?: { user?: unknown; session?: unknown };
                error?: { message: string };
              };
              if (result.error) {
                setError(result.error.message);
              } else if (result.data?.user && result.data?.session) {
                // Verify auth state before calling onLogin
                onLogin();
              } else {
                setError("Google authentication failed. Please try again.");
              }
            } catch (err) {
              setError(`Google authentication failed. Please try again: ${err}`);
            }
          }}
          className="auth-button google"
        >
          ► Sign In with Google
        </button>
        <img src="/sparkle.png" className="sparkle-icon sparkle-google" alt="" />
      </div>

      {error && <p className="auth-error">{error}</p>}
      
      <div className="gptracker-logo-container">
        <img src="/GPTracker.png" className="gptracker-logo" alt="GPTracker" />
      </div>
    </div>
  );
}
