import { useAuthContext } from '../context/AuthContext';

export function SignInPage() {
  const { signIn } = useAuthContext();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Material Tracking
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-neutral-900">
          Sign in to continue
        </h2>
        <p className="mt-2 text-base text-neutral-600">
          Use your company Google account to access Material Tracking.
        </p>
        <button
          onClick={signIn}
          className="mt-8 w-full rounded-md bg-brand-600 px-4 py-3 text-base font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
