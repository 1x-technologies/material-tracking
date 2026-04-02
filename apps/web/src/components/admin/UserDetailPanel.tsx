import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../../trpc";
import { SidePanel } from "./SidePanel";

interface UserDetailPanelProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailPanel({ userId, onClose }: UserDetailPanelProps) {
  const { data: users } = trpc.admin.listUsers.useQuery();
  const { data: locations } = trpc.admin.listAllLocations.useQuery();
  const utils = trpc.useUtils();

  const user = useMemo(() => users?.find((u) => u.uid === userId), [users, userId]);

  const [editRole, setEditRole] = useState<string>(user?.role ?? "");
  const [editLocationId, setEditLocationId] = useState<string>(user?.locationId ?? "");
  const [editActive, setEditActive] = useState<boolean>(user?.active !== false);

  // Sync local state when user data changes (e.g., after switching user)
  useEffect(() => {
    if (user) {
      setEditRole(user.role ?? "");
      setEditLocationId(user.locationId ?? "");
      setEditActive(user.active !== false);
      setArmed(false);
    }
  }, [user]);

  // Armed state for deactivation double-confirm
  const [armed, setArmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (armed) {
      timerRef.current = setTimeout(() => setArmed(false), 5000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [armed]);

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      utils.admin.listUsers.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const isDirty = useMemo(() => {
    if (!user) return false;
    const origRole = user.role ?? "";
    const origLocation = user.locationId ?? "";
    const origActive = user.active !== false;
    return editRole !== origRole || editLocationId !== origLocation || editActive !== origActive;
  }, [user, editRole, editLocationId, editActive]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard?")) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleSave = () => {
    if (!user) return;
    updateUserMutation.mutate({
      uid: userId,
      patch: {
        role: editRole === "" ? null : (editRole as "admin" | "driver" | "staff"),
        locationId: editLocationId,
        active: editActive,
      },
    });
  };

  const handleDeactivate = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    // Second click: immediately deactivate
    updateUserMutation.mutate(
      {
        uid: userId,
        patch: { active: false },
      },
      {
        onSuccess: () => {
          toast.success("User updated");
          utils.admin.listUsers.invalidate();
          setArmed(false);
        },
      },
    );
  };

  const handleReactivate = () => {
    updateUserMutation.mutate(
      {
        uid: userId,
        patch: { active: true },
      },
      {
        onSuccess: () => {
          toast.success("User updated");
          utils.admin.listUsers.invalidate();
        },
      },
    );
  };

  if (!user) return null;

  const initial = user.displayName.charAt(0).toUpperCase() || "?";

  return (
    <SidePanel
      open={true}
      onClose={handleClose}
      title={user.displayName}
      subtitle={user.email}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center justify-center size-16 rounded-full bg-brand-600 text-white text-xl font-semibold">
          {initial}
        </div>
      </div>

      {/* Role assignment */}
      <div className="border-b border-neutral-100 py-4">
        <label htmlFor="user-role" className="block text-sm font-semibold text-neutral-900 mb-2">
          Role
        </label>
        <select
          id="user-role"
          value={editRole}
          onChange={(e) => setEditRole(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        >
          <option value="">No role assigned</option>
          <option value="admin">Admin</option>
          <option value="driver">Driver</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      {/* Location assignment */}
      <div className="border-b border-neutral-100 py-4">
        <label htmlFor="user-location" className="block text-sm font-semibold text-neutral-900 mb-2">
          Location
        </label>
        <select
          id="user-location"
          value={editLocationId}
          onChange={(e) => setEditLocationId(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
        >
          <option value="">No location assigned</option>
          {locations?.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status toggle */}
      <div className="border-b border-neutral-100 py-4" aria-live="polite">
        <p className="text-sm font-semibold text-neutral-900 mb-2">Status</p>
        {editActive ? (
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={updateUserMutation.isPending}
            className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              armed
                ? "bg-red-600 text-white hover:bg-red-700"
                : "border border-red-300 text-red-700 hover:bg-red-50"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {armed ? "Confirm Deactivate?" : "Deactivate User"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReactivate}
            disabled={updateUserMutation.isPending}
            className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reactivate User
          </button>
        )}
      </div>

      {/* Save button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || updateUserMutation.isPending}
          className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            isDirty
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "bg-neutral-100 text-neutral-400"
          } disabled:bg-neutral-100 disabled:text-neutral-400`}
        >
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </SidePanel>
  );
}
