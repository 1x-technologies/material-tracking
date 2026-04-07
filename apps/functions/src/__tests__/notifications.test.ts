import { describe, expect, it } from "vitest";

interface NotificationPrefs {
  onTransit: boolean;
  onDelivery: boolean;
  onPickup: boolean;
}

function shouldNotify(newStatus: string, prefs: NotificationPrefs): boolean {
  if (newStatus === "delivered" && prefs.onDelivery) return true;
  if (newStatus === "picked_up" && prefs.onPickup) return true;
  if (newStatus === "in_transit" && prefs.onTransit) return true;
  return false;
}

describe("Notification Decision Logic", () => {
  it("notifies on delivery when onDelivery is true", () => {
    expect(shouldNotify("delivered", { onDelivery: true, onPickup: false, onTransit: false })).toBe(true);
  });

  it("skips delivery when onDelivery is false", () => {
    expect(shouldNotify("delivered", { onDelivery: false, onPickup: false, onTransit: false })).toBe(false);
  });

  it("notifies on pickup when onPickup is true", () => {
    expect(shouldNotify("picked_up", { onDelivery: false, onPickup: true, onTransit: false })).toBe(true);
  });

  it("skips pickup when onPickup is false", () => {
    expect(shouldNotify("picked_up", { onDelivery: false, onPickup: false, onTransit: false })).toBe(false);
  });

  it("notifies on in_transit when onTransit is true", () => {
    expect(shouldNotify("in_transit", { onDelivery: false, onPickup: false, onTransit: true })).toBe(true);
  });

  it("skips in_transit when onTransit is false", () => {
    expect(shouldNotify("in_transit", { onDelivery: false, onPickup: false, onTransit: false })).toBe(false);
  });

  it("does not notify for partially_delivered", () => {
    expect(shouldNotify("partially_delivered", { onDelivery: true, onPickup: true, onTransit: true })).toBe(false);
  });

  it("does not notify for created", () => {
    expect(shouldNotify("created", { onDelivery: true, onPickup: true, onTransit: true })).toBe(false);
  });

  it("does not notify for cancelled", () => {
    expect(shouldNotify("cancelled", { onDelivery: true, onPickup: true, onTransit: true })).toBe(false);
  });
});

function shouldSendAgedReminder(lastReminderAt: Date | null, now: Date): boolean {
  if (!lastReminderAt) return true;
  return now.getTime() - lastReminderAt.getTime() >= 24 * 60 * 60 * 1000;
}

describe("Aged Reminder Throttle Logic", () => {
  const now = new Date("2026-04-01T12:00:00Z");

  it("sends reminder when never reminded (null)", () => {
    expect(shouldSendAgedReminder(null, now)).toBe(true);
  });

  it("sends reminder when last reminder was 25 hours ago", () => {
    const lastReminder = new Date(now.getTime() - 25 * 60 * 60 * 1000);
    expect(shouldSendAgedReminder(lastReminder, now)).toBe(true);
  });

  it("skips reminder when last reminder was 12 hours ago", () => {
    const lastReminder = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    expect(shouldSendAgedReminder(lastReminder, now)).toBe(false);
  });

  it("sends reminder at exactly 24 hours boundary", () => {
    const lastReminder = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(shouldSendAgedReminder(lastReminder, now)).toBe(true);
  });
});
