import { useState } from "react";
import { Package } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
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
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="rounded-2xl border border-secondary bg-primary p-8 shadow-xs">
          {/* App logo */}
          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-solid shadow-xs-skeuomorphic">
              <Package className="size-6 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-primary">Material Tracking</h1>
            <p className="mt-1 text-sm text-tertiary">
              Track shipments, scan packages, manage materials
            </p>
          </div>

          {/* Divider */}
          <hr className="mb-6 border-secondary" />

          {/* Sign-in section */}
          <div className="flex flex-col items-center">
            <p className="mb-5 text-center text-sm text-tertiary">
              Use your 1x.tech company Google account to sign in.
            </p>

            <Button
              size="lg"
              color="primary"
              className="w-full"
              onClick={handleSignIn}
              isDisabled={signingIn}
              isLoading={signingIn}
              showTextWhileLoading
              iconLeading={GoogleIcon}
            >
              Sign in with Google
            </Button>

            {error && (
              <p className="mt-3 text-center text-sm text-error-primary">{error}</p>
            )}
          </div>
        </div>

        {/* Footer text below card */}
        <p className="mt-4 text-center text-xs text-quaternary">
          Access is restricted to authorized 1x.tech accounts.
        </p>
      </div>
    </div>
  );
}

/** Inline Google "G" logo -- small SVG, avoids an external dependency. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.17-2.02H10v3.83h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.24c1.89-1.74 2.98-4.3 2.98-7.33Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.24-2.5c-.9.6-2.04.95-3.38.95-2.6 0-4.8-1.75-5.58-4.1H1.07v2.58A9.99 9.99 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.42 11.91a5.99 5.99 0 0 1 0-3.82V5.51H1.07a9.99 9.99 0 0 0 0 8.98l3.35-2.58Z"
        fill="#FBBC04"
      />
      <path
        d="M10 3.96a5.43 5.43 0 0 1 3.84 1.5L16.7 2.6A9.62 9.62 0 0 0 10 0 9.99 9.99 0 0 0 1.07 5.51l3.35 2.58C5.2 5.71 7.4 3.96 10 3.96Z"
        fill="#EA4335"
      />
    </svg>
  );
}
