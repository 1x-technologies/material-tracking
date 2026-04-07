import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../../trpc";
import { SidePanel } from "./SidePanel";
import { Button } from "@/components/base/buttons/button";
import { NativeSelect } from "@/components/base/select/select-native";

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

  const roleOptions = [
    { label: "No role assigned", value: "" },
    { label: "Admin", value: "admin" },
    { label: "Driver", value: "driver" },
    { label: "Staff", value: "staff" },
  ];

  const locationOptions = [
    { label: "No location assigned", value: "" },
    ...(locations?.map((loc) => ({ label: loc.name, value: loc.id })) ?? []),
  ];

  return (
    <SidePanel
      open={true}
      onClose={handleClose}
      title={user.displayName}
      subtitle={user.email}
    >
      {/* Avatar */}
      <div className="mb-8 flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-brand-solid text-xl font-semibold text-white">
          {initial}
        </div>
      </div>

      {/* Role assignment */}
      <div className="space-y-6">
        <div>
          <NativeSelect
            label="Role"
            size="sm"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            options={roleOptions}
          />
        </div>

        {/* Location assignment */}
        <div>
          <NativeSelect
            label="Location"
            size="sm"
            value={editLocationId}
            onChange={(e) => setEditLocationId(e.target.value)}
            options={locationOptions}
          />
        </div>

        {/* Status section */}
        <div className="border-t border-secondary pt-6" aria-live="polite">
          <p className="mb-3 text-sm font-medium text-secondary">Status</p>
          {editActive ? (
            <Button
              size="sm"
              color={armed ? "primary-destructive" : "secondary-destructive"}
              onClick={handleDeactivate}
              isDisabled={updateUserMutation.isPending}
              className="w-full"
            >
              {armed ? "Confirm Deactivate?" : "Deactivate User"}
            </Button>
          ) : (
            <Button
              size="sm"
              color="secondary"
              onClick={handleReactivate}
              isDisabled={updateUserMutation.isPending}
              className="w-full"
            >
              Reactivate User
            </Button>
          )}
        </div>

        {/* Save button */}
        <div className="border-t border-secondary pt-6">
          <Button
            size="md"
            color="primary"
            onClick={handleSave}
            isDisabled={!isDirty || updateUserMutation.isPending}
            isLoading={updateUserMutation.isPending}
            className="w-full"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </SidePanel>
  );
}
