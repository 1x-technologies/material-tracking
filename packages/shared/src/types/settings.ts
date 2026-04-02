export interface GlobalSettings {
  stalledThresholdHours: number;
  overdueThresholdHours: number;
  agedThresholdHours: number;
  defaultNotificationPrefs: {
    onDelivery: boolean;
    onPickup: boolean;
    onTransit: boolean;
  };
}
