import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";

export function SignInPage() {
  const { signIn } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signIn();
    } catch (err) {
      if (err instanceof Error && err.message.includes("popup-closed-by-user")) {
        return;
      }
      setError(
        err instanceof Error ? err.message : "Sign-in failed. Please try again.",
      );
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md p-6 text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">Material Tracking</h1>
        <h2 className="mt-2 text-xl font-semibold text-neutral-900">Sign in to continue</h2>
        <p className="mt-2 text-base text-neutral-600">
          Use your 1x.tech company Google account to access Material Tracking.
        </p>
        <button
          type="button"
          onClick={handleSignIn}
          disabled={signingIn}
          aria-busy={signingIn}
          className="mt-8 w-full rounded-md bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60"
        >
          {signingIn ? "Signing in…" : "Sign in with Google"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
