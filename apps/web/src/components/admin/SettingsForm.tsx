import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { trpc } from "../../trpc";
import { Spinner } from "../ui/Spinner";

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
    <div className="max-w-xl space-y-6 py-4">
      {/* Threshold card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Exception Thresholds</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Configure when shipments are flagged as stalled, overdue, or aged
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="stalled-hours" className="block text-sm font-medium text-neutral-700 mb-1">
              Stalled (hours)
            </label>
            <input
              id="stalled-hours"
              type="number"
              min={1}
              value={stalledHours}
              onChange={(e) => setStalledHours(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="overdue-hours" className="block text-sm font-medium text-neutral-700 mb-1">
              Overdue (hours)
            </label>
            <input
              id="overdue-hours"
              type="number"
              min={1}
              value={overdueHours}
              onChange={(e) => setOverdueHours(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="aged-hours" className="block text-sm font-medium text-neutral-700 mb-1">
              Aged (hours)
            </label>
            <input
              id="aged-hours"
              type="number"
              min={1}
              value={agedHours}
              onChange={(e) => setAgedHours(Number(e.target.value))}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notification card */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Default Notification Preferences</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Set default email notification preferences for new users
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">Delivery notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={defaultPrefs.onDelivery}
              onClick={() => setDefaultPrefs({ ...defaultPrefs, onDelivery: !defaultPrefs.onDelivery })}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                defaultPrefs.onDelivery ? "bg-brand-600" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  defaultPrefs.onDelivery ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">Pickup notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={defaultPrefs.onPickup}
              onClick={() => setDefaultPrefs({ ...defaultPrefs, onPickup: !defaultPrefs.onPickup })}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                defaultPrefs.onPickup ? "bg-brand-600" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  defaultPrefs.onPickup ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-sm text-neutral-700">In-transit notifications</span>
            <button
              type="button"
              role="switch"
              aria-checked={defaultPrefs.onTransit}
              onClick={() => setDefaultPrefs({ ...defaultPrefs, onTransit: !defaultPrefs.onTransit })}
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors ${
                defaultPrefs.onTransit ? "bg-brand-600" : "bg-neutral-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  defaultPrefs.onTransit ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || updateSettingsMutation.isPending}
        className={`rounded-md px-6 py-2 text-sm font-semibold transition-colors ${
          isDirty
            ? "bg-brand-600 text-white hover:bg-brand-700"
            : "bg-neutral-100 text-neutral-400"
        } disabled:bg-neutral-100 disabled:text-neutral-400`}
      >
        {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
