import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../../trpc";
import { Spinner } from "../ui/Spinner";
import { InputNumber } from "@/components/base/input/input-number";
import { Toggle } from "@/components/base/toggle/toggle";
import { Button } from "@/components/base/buttons/button";

export function SettingsForm() {
  const { data: settings, isLoading } = trpc.admin.getSettings.useQuery();
  const utils = trpc.useUtils();

  const [stalledHours, setStalledHours] = useState(4);
  const [overdueHours, setOverdueHours] = useState(24);
  const [agedHours, setAgedHours] = useState(24);
  const [defaultPrefs, setDefaultPrefs] = useState({
    onDelivery: true,
    onPickup: true,
    onTransit: false,
  });

  // Initialize from query data
  useEffect(() => {
    if (settings) {
      setStalledHours(settings.stalledThresholdHours);
      setOverdueHours(settings.overdueThresholdHours);
      setAgedHours(settings.agedThresholdHours);
      setDefaultPrefs(settings.defaultNotificationPrefs);
    }
  }, [settings]);

  const updateSettingsMutation = trpc.admin.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.admin.getSettings.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const isDirty = useMemo(() => {
    if (!settings) return false;
    return (
      stalledHours !== settings.stalledThresholdHours ||
      overdueHours !== settings.overdueThresholdHours ||
      agedHours !== settings.agedThresholdHours ||
      defaultPrefs.onDelivery !== settings.defaultNotificationPrefs.onDelivery ||
      defaultPrefs.onPickup !== settings.defaultNotificationPrefs.onPickup ||
      defaultPrefs.onTransit !== settings.defaultNotificationPrefs.onTransit
    );
  }, [settings, stalledHours, overdueHours, agedHours, defaultPrefs]);

  const handleSave = () => {
    updateSettingsMutation.mutate({
      stalledThresholdHours: stalledHours,
      overdueThresholdHours: overdueHours,
      agedThresholdHours: agedHours,
      defaultNotificationPrefs: defaultPrefs,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Threshold card */}
      <div className="rounded-xl border border-secondary bg-primary p-6">
        <h2 className="text-lg font-semibold text-primary">Exception Thresholds</h2>
        <p className="mt-1 text-sm text-tertiary">
          Configure when shipments are flagged as stalled, overdue, or aged
        </p>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
          <InputNumber
            label="Stalled (hours)"
            size="sm"
            minValue={1}
            value={stalledHours}
            onChange={(v) => setStalledHours(v)}
            orientation="horizontal"
          />
          <InputNumber
            label="Overdue (hours)"
            size="sm"
            minValue={1}
            value={overdueHours}
            onChange={(v) => setOverdueHours(v)}
            orientation="horizontal"
          />
          <InputNumber
            label="Aged (hours)"
            size="sm"
            minValue={1}
            value={agedHours}
            onChange={(v) => setAgedHours(v)}
            orientation="horizontal"
          />
        </div>
      </div>

      {/* Notification card */}
      <div className="rounded-xl border border-secondary bg-primary p-6">
        <h2 className="text-lg font-semibold text-primary">Default Notification Preferences</h2>
        <p className="mt-1 text-sm text-tertiary">
          Set default email notification preferences for new users
        </p>

        <div className="mt-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary">Delivery notifications</p>
              <p className="text-sm text-tertiary">Notify when packages are delivered</p>
            </div>
            <Toggle
              isSelected={defaultPrefs.onDelivery}
              onChange={(checked) => setDefaultPrefs({ ...defaultPrefs, onDelivery: checked })}
              size="sm"
            />
          </div>

          <div className="border-t border-secondary" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary">Pickup notifications</p>
              <p className="text-sm text-tertiary">Notify when packages are picked up</p>
            </div>
            <Toggle
              isSelected={defaultPrefs.onPickup}
              onChange={(checked) => setDefaultPrefs({ ...defaultPrefs, onPickup: checked })}
              size="sm"
            />
          </div>

          <div className="border-t border-secondary" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary">In-transit notifications</p>
              <p className="text-sm text-tertiary">Notify when packages enter transit</p>
            </div>
            <Toggle
              isSelected={defaultPrefs.onTransit}
              onChange={(checked) => setDefaultPrefs({ ...defaultPrefs, onTransit: checked })}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Save button */}
      <Button
        size="md"
        color="primary"
        onClick={handleSave}
        isDisabled={!isDirty || updateSettingsMutation.isPending}
        isLoading={updateSettingsMutation.isPending}
      >
        Save Settings
      </Button>
    </div>
  );
}
