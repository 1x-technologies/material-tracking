import { Link } from "react-router";

export function AccessDeniedPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      {/* Unicode lock — swap for @untitledui/icons Lock01 when available */}
      <span className="text-5xl text-neutral-400 mb-4" aria-hidden="true">
        🔒
      </span>
      <h2 className="text-lg font-semibold text-neutral-900">Access denied</h2>
      <p className="mt-2 text-md text-neutral-600 max-w-sm">
        You don't have permission to view this page. Contact an administrator if you believe this is
        an error.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
