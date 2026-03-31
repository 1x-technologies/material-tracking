import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h2 className="text-2xl font-semibold text-neutral-900">Page not found</h2>
      <p className="mt-2 text-base text-neutral-600">
        The page you're looking for doesn't exist. Go back to the dashboard.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
