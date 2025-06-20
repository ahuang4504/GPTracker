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

    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    // console.log("Auth response:", data, error);

    if (error) {
      setError(error.message);
    } else {
      onLogin(); // trigger session refresh
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
      <h2 className="auth-title">{isSignUp ? "Sign Up" : "Log In"}</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleEmailAuth();
        }}
        className="auth-form"
      >
        <input
          type="email"
          placeholder="Email"
          className="auth-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="auth-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="auth-button">
          {isSignUp ? "Sign Up with Email" : "Log In with Email"}
        </button>
      </form>

      <div className="auth-footer">
        <button
          type="button"
          className="auth-text-button"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp ? "Already have an account? Log In" : "No account? Sign Up"}
        </button>

        <button
          type="button"
          className="auth-text-button"
          onClick={handleResetPassword}
        >
          Forgot password?
        </button>

        {resetSent && <p className="auth-success">Reset email sent!</p>}
      </div>

      <div className="auth-divider">OR</div>

      <button
        onClick={async () => {
          await signInWithGoogle();
          onLogin();
        }}
        className="auth-button google"
      >
        Sign In with Google
      </button>

      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}
