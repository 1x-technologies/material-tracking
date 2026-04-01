import { describe, expect, it } from "vitest";
import {
  type ShipmentEmailData,
  buildAgedReminderEmail,
  buildDeliveredEmail,
  buildInTransitEmail,
  buildPickedUpEmail,
} from "../lib/emailTemplates";

const sampleData: ShipmentEmailData = {
  shipmentNumber: "SH-20260401-0001",
  status: "delivered",
  pieceCount: 3,
  senderName: "Alice Sender",
  receiverName: "Bob Receiver",
  detailUrl: "https://material-tracking.web.app/shipments/abc123",
};

describe("Email Template Builders", () => {
  describe("buildDeliveredEmail", () => {
    it("produces subject with shipment number and Delivered", () => {
      const result = buildDeliveredEmail(sampleData);
      expect(result.subject).toContain(sampleData.shipmentNumber);
      expect(result.subject).toContain("Delivered");
    });

    it("produces HTML with all shipment details", () => {
      const result = buildDeliveredEmail(sampleData);
      expect(result.html).toContain(sampleData.shipmentNumber);
      expect(result.html).toContain(sampleData.senderName);
      expect(result.html).toContain(sampleData.receiverName);
      expect(result.html).toContain(String(sampleData.pieceCount));
      expect(result.html).toContain(sampleData.detailUrl);
    });
  });

  describe("buildPickedUpEmail", () => {
    it("produces subject with Picked Up", () => {
      const result = buildPickedUpEmail({ ...sampleData, status: "picked_up" });
      expect(result.subject).toContain("Picked Up");
    });

    it("produces HTML with shipment details", () => {
      const result = buildPickedUpEmail({ ...sampleData, status: "picked_up" });
      expect(result.html).toContain(sampleData.shipmentNumber);
      expect(result.html).toContain(sampleData.senderName);
      expect(result.html).toContain(sampleData.receiverName);
    });
  });

  describe("buildInTransitEmail", () => {
    it("produces subject with In Transit", () => {
      const result = buildInTransitEmail({ ...sampleData, status: "in_transit" });
      expect(result.subject).toContain("In Transit");
    });

    it("produces HTML with shipment details", () => {
      const result = buildInTransitEmail({ ...sampleData, status: "in_transit" });
      expect(result.html).toContain(sampleData.shipmentNumber);
    });
  });

  describe("buildAgedReminderEmail", () => {
    it("produces subject with Reminder and shipment number", () => {
      const result = buildAgedReminderEmail({ ...sampleData, hoursAged: 36 });
      expect(result.subject).toContain("Reminder");
      expect(result.subject).toContain(sampleData.shipmentNumber);
    });

    it("produces HTML with hours aged info", () => {
      const result = buildAgedReminderEmail({ ...sampleData, hoursAged: 36 });
      expect(result.html).toContain("36 hours");
    });

    it("shows days when 48+ hours aged", () => {
      const result = buildAgedReminderEmail({ ...sampleData, hoursAged: 72 });
      expect(result.html).toContain("3 days");
    });

    it("includes pickup prompt", () => {
      const result = buildAgedReminderEmail({ ...sampleData, hoursAged: 36 });
      expect(result.html).toContain("awaiting pickup");
    });
  });
});

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
