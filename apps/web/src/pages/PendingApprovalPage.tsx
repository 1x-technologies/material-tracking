import { useAuthContext } from "../context/AuthContext";

export function PendingApprovalPage() {
  const { signOutUser } = useAuthContext();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md p-6 text-center">
        <span className="text-5xl text-neutral-400 mb-4 block" aria-hidden="true">
          {"\u23F3"}
        </span>
        <h1 className="text-lg font-semibold text-neutral-900">
          Account Pending Approval
        </h1>
        <p className="text-sm text-neutral-600 max-w-sm text-center mt-2">
          Your account is pending approval. An administrator will assign your role shortly.
        </p>
        <button
          type="button"
          onClick={signOutUser}
          className="mt-6 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
