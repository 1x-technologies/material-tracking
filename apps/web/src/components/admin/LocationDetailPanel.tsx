import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Printer } from "@material-tracking/shared";
import { trpc } from "../../trpc";
import { SidePanel } from "./SidePanel";
import { PrinterList } from "./PrinterList";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";

interface LocationDetailPanelProps {
  locationId: string | null;
  isNew: boolean;
  onClose: () => void;
}

export function LocationDetailPanel({ locationId, isNew, onClose }: LocationDetailPanelProps) {
  const { data: locations } = trpc.admin.listAllLocations.useQuery();
  const utils = trpc.useUtils();

  const location = useMemo(
    () => (locationId ? locations?.find((l) => l.id === locationId) : null),
    [locations, locationId],
  );

  const [name, setName] = useState(location?.name ?? "");
  const [fullName, setFullName] = useState(location?.fullName ?? "");
  const [address, setAddress] = useState(location?.address ?? "");
  const [active, setActive] = useState(location?.active ?? true);
  const [printers, setPrinters] = useState<Printer[]>(location?.printers ?? []);

  // Sync local state when location changes
  useEffect(() => {
    if (isNew) {
      setName("");
      setFullName("");
      setAddress("");
      setActive(true);
      setPrinters([]);
      setArmed(false);
    } else if (location) {
      setName(location.name);
      setFullName(location.fullName);
      setAddress(location.address);
      setActive(location.active);
      setPrinters(location.printers);
      setArmed(false);
    }
  }, [location, isNew]);

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

  const createLocationMutation = trpc.admin.createLocation.useMutation({
    onSuccess: () => {
      toast.success("Location created");
      utils.admin.listAllLocations.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateLocationMutation = trpc.admin.updateLocation.useMutation({
    onSuccess: () => {
      toast.success("Location saved");
      utils.admin.listAllLocations.invalidate();
      onClose();
    },
    onError: (err) => toast.error(err.message),
  });

  const isPending = createLocationMutation.isPending || updateLocationMutation.isPending;

  const isDirty = useMemo(() => {
    if (isNew) {
      return name.trim() !== "" || fullName.trim() !== "" || address.trim() !== "" || printers.length > 0;
    }
    if (!location) return false;
    return (
      name !== location.name ||
      fullName !== location.fullName ||
      address !== location.address ||
      active !== location.active ||
      JSON.stringify(printers) !== JSON.stringify(location.printers)
    );
  }, [isNew, name, fullName, address, active, printers, location]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Discard?")) return;
    }
    onClose();
  }, [isDirty, onClose]);

  const handleSave = () => {
    if (isNew) {
      createLocationMutation.mutate({
        name: name.trim(),
        fullName: fullName.trim(),
        address: address.trim(),
        printers,
      });
    } else if (locationId) {
      updateLocationMutation.mutate({
        id: locationId,
        patch: {
          name: name.trim(),
          fullName: fullName.trim(),
          address: address.trim(),
          active,
          printers,
        },
      });
    }
  };

  const handleDeactivate = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    if (!locationId) return;
    updateLocationMutation.mutate(
      {
        id: locationId,
        patch: { active: false },
      },
      {
        onSuccess: () => {
          toast.success("Location deactivated");
          utils.admin.listAllLocations.invalidate();
          setArmed(false);
        },
      },
    );
  };

  const handleReactivate = () => {
    if (!locationId) return;
    updateLocationMutation.mutate(
      {
        id: locationId,
        patch: { active: true },
      },
      {
        onSuccess: () => {
          toast.success("Location reactivated");
          utils.admin.listAllLocations.invalidate();
        },
      },
    );
  };

  const title = isNew ? "New Location" : (location?.name ?? "Location");
  const saveButtonText = isNew ? "Create Location" : "Save Changes";

  return (
    <SidePanel open={true} onClose={handleClose} title={title}>
      <div className="space-y-6">
        {/* Name */}
        <Input
          label="Name"
          size="sm"
          placeholder="e.g. HA"
          value={name}
          onChange={(v) => setName(v)}
        />

        {/* Full Name */}
        <Input
          label="Full Name"
          size="sm"
          placeholder="e.g. Houston Assembly"
          value={fullName}
          onChange={(v) => setFullName(v)}
        />

        {/* Address */}
        <Input
          label="Address"
          size="sm"
          placeholder="e.g. 123 Main St, Houston, TX"
          value={address}
          onChange={(v) => setAddress(v)}
        />

        {/* Status toggle (only for existing locations) */}
        {!isNew && (
          <div className="border-t border-secondary pt-6" aria-live="polite">
            <p className="mb-3 text-sm font-medium text-secondary">Status</p>
            {active ? (
              <Button
                size="sm"
                color={armed ? "primary-destructive" : "secondary-destructive"}
                onClick={handleDeactivate}
                isDisabled={isPending}
                className="w-full"
              >
                {armed ? "Confirm Deactivate?" : "Deactivate Location"}
              </Button>
            ) : (
              <Button
                size="sm"
                color="secondary"
                onClick={handleReactivate}
                isDisabled={isPending}
                className="w-full"
              >
                Reactivate Location
              </Button>
            )}
          </div>
        )}

        {/* Printers */}
        <PrinterList printers={printers} onChange={setPrinters} />

        {/* Save button */}
        <div className="border-t border-secondary pt-6">
          <Button
            size="md"
            color="primary"
            onClick={handleSave}
            isDisabled={!isDirty || isPending}
            isLoading={isPending}
            className="w-full"
          >
            {saveButtonText}
          </Button>
        </div>
      </div>
    </SidePanel>
  );
}
