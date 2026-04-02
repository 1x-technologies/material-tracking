import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Printer } from "@material-tracking/shared";
import { trpc } from "../../trpc";
import { SidePanel } from "./SidePanel";
import { PrinterList } from "./PrinterList";

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
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="loc-name" className="block text-sm font-semibold text-neutral-900 mb-1">
            Name
          </label>
          <input
            id="loc-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. HA"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="loc-fullname" className="block text-sm font-semibold text-neutral-900 mb-1">
            Full Name
          </label>
          <input
            id="loc-fullname"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Houston Assembly"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Address */}
        <div>
          <label htmlFor="loc-address" className="block text-sm font-semibold text-neutral-900 mb-1">
            Address
          </label>
          <input
            id="loc-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 123 Main St, Houston, TX"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
          />
        </div>

        {/* Status toggle (only for existing locations) */}
        {!isNew && (
          <div className="border-t border-neutral-100 pt-4" aria-live="polite">
            <p className="text-sm font-semibold text-neutral-900 mb-2">Status</p>
            {active ? (
              <button
                type="button"
                onClick={handleDeactivate}
                disabled={isPending}
                className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  armed
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "border border-red-300 text-red-700 hover:bg-red-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {armed ? "Confirm Deactivate?" : "Deactivate Location"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReactivate}
                disabled={isPending}
                className="w-full rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reactivate Location
              </button>
            )}
          </div>
        )}

        {/* Printers */}
        <PrinterList printers={printers} onChange={setPrinters} />

        {/* Save button */}
        <div className="pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isPending}
            className={`w-full rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              isDirty
                ? "bg-brand-600 text-white hover:bg-brand-700"
                : "bg-neutral-100 text-neutral-400"
            } disabled:bg-neutral-100 disabled:text-neutral-400`}
          >
            {isPending ? "Saving..." : saveButtonText}
          </button>
        </div>
      </div>
    </SidePanel>
  );
}
