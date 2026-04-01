import { useAuthContext } from "../../context/AuthContext";

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  driver: "Driver",
  staff: "Staff",
};

export function TopBar() {
  const { user, appUser, signOutUser } = useAuthContext();

  return (
    <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-neutral-900">Material Tracking</h1>

      {user && (
        <div className="flex items-center gap-3">
          {appUser?.role && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
              {roleLabelMap[appUser.role] ?? appUser.role}
            </span>
          )}
          <span className="text-sm text-neutral-700 hidden sm:block">
            {appUser?.displayName || user.displayName || user.email}
          </span>
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || "User"}
              className="h-8 w-8 rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-semibold">
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
          )}
          <button
            type="button"
            onClick={signOutUser}
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
