import { describe, expect, it } from "vitest";
import {
  type SlackNotificationData,
  buildAgedReminderSlackMessage,
  buildCompletedSlackMessage,
  buildDeliveredSlackMessage,
  buildInTransitSlackMessage,
  buildSignatureRequestSlackMessage,
  shipmentDetailUrl,
} from "../lib/slackTemplates";

const sampleData: SlackNotificationData = {
  shipmentNumber: "SH-20260401-0001",
  status: "delivered",
  pieceCount: 3,
  senderName: "Alice Sender",
  receiverName: "Bob Receiver",
  detailUrl: "https://manufacturing-472518.web.app/shipments/abc123",
};

function findBlockByType(blocks: object[], type: string): Record<string, unknown> | undefined {
  return blocks.find((b) => (b as Record<string, unknown>).type === type) as
    | Record<string, unknown>
    | undefined;
}

function findActionButton(blocks: object[], buttonText: string): Record<string, unknown> | undefined {
  const actionsBlock = findBlockByType(blocks, "actions") as
    | { elements?: Array<Record<string, unknown>> }
    | undefined;
  if (!actionsBlock?.elements) return undefined;
  return actionsBlock.elements.find(
    (el) =>
      (el.text as { text?: string })?.text === buttonText,
  );
}

describe("buildDeliveredSlackMessage", () => {
  it("includes shipment number and Delivered in text", () => {
    const result = buildDeliveredSlackMessage(sampleData);
    expect(result.text).toContain(sampleData.shipmentNumber);
    expect(result.text).toContain("Delivered");
  });

  it("has a header block with Delivered", () => {
    const result = buildDeliveredSlackMessage(sampleData);
    const header = findBlockByType(result.blocks, "header") as {
      text?: { text?: string };
    };
    expect(header).toBeDefined();
    expect(header?.text?.text).toContain("Delivered");
    expect(header?.text?.text).toContain(sampleData.shipmentNumber);
  });

  it("has a section block with fields", () => {
    const result = buildDeliveredSlackMessage(sampleData);
    const section = findBlockByType(result.blocks, "section") as {
      fields?: Array<{ text: string }>;
    };
    expect(section).toBeDefined();
    expect(section?.fields).toBeDefined();
    expect(section!.fields!.length).toBeGreaterThanOrEqual(4);
  });

  it("has a View Shipment button with detailUrl", () => {
    const result = buildDeliveredSlackMessage(sampleData);
    const button = findActionButton(result.blocks, "View Shipment");
    expect(button).toBeDefined();
    expect(button?.url).toBe(sampleData.detailUrl);
  });

  it("returns blocks array with at least 2 elements", () => {
    const result = buildDeliveredSlackMessage(sampleData);
    expect(result.blocks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("buildCompletedSlackMessage", () => {
  it("includes shipment number and Completed in text", () => {
    const result = buildCompletedSlackMessage({ ...sampleData, status: "completed" });
    expect(result.text).toContain(sampleData.shipmentNumber);
    expect(result.text).toContain("Completed");
  });

  it("has a header block with Completed", () => {
    const result = buildCompletedSlackMessage({ ...sampleData, status: "completed" });
    const header = findBlockByType(result.blocks, "header") as {
      text?: { text?: string };
    };
    expect(header).toBeDefined();
    expect(header?.text?.text).toContain("Completed");
  });

  it("has a View Shipment button", () => {
    const result = buildCompletedSlackMessage({ ...sampleData, status: "completed" });
    const button = findActionButton(result.blocks, "View Shipment");
    expect(button).toBeDefined();
    expect(button?.url).toBe(sampleData.detailUrl);
  });
});

describe("buildInTransitSlackMessage", () => {
  it("includes shipment number and In Transit in text", () => {
    const result = buildInTransitSlackMessage({ ...sampleData, status: "in_transit" });
    expect(result.text).toContain(sampleData.shipmentNumber);
    expect(result.text).toContain("In Transit");
  });

  it("has a header block with In Transit", () => {
    const result = buildInTransitSlackMessage({ ...sampleData, status: "in_transit" });
    const header = findBlockByType(result.blocks, "header") as {
      text?: { text?: string };
    };
    expect(header).toBeDefined();
    expect(header?.text?.text).toContain("In Transit");
  });

  it("has a View Shipment button", () => {
    const result = buildInTransitSlackMessage({ ...sampleData, status: "in_transit" });
    const button = findActionButton(result.blocks, "View Shipment");
    expect(button).toBeDefined();
    expect(button?.url).toBe(sampleData.detailUrl);
  });
});

describe("buildAgedReminderSlackMessage", () => {
  it("includes Reminder in text", () => {
    const result = buildAgedReminderSlackMessage({ ...sampleData, hoursAged: 36 });
    expect(result.text).toContain("Reminder");
  });

  it("shows hours when hoursAged is less than 48", () => {
    const result = buildAgedReminderSlackMessage({ ...sampleData, hoursAged: 36 });
    expect(result.text).toContain("36 hours");
  });

  it("shows days when hoursAged is 48 or more", () => {
    const result = buildAgedReminderSlackMessage({ ...sampleData, hoursAged: 72 });
    expect(result.text).toContain("3 days");
  });

  it("has blocks containing awaiting pickup text", () => {
    const result = buildAgedReminderSlackMessage({ ...sampleData, hoursAged: 36 });
    const sectionTexts = result.blocks
      .filter((b) => (b as Record<string, unknown>).type === "section")
      .map((b) => {
        const section = b as { text?: { text?: string } };
        return section.text?.text ?? "";
      })
      .join(" ");
    expect(sectionTexts).toContain("awaiting pickup");
  });

  it("has a View Shipment button", () => {
    const result = buildAgedReminderSlackMessage({ ...sampleData, hoursAged: 36 });
    const button = findActionButton(result.blocks, "View Shipment");
    expect(button).toBeDefined();
  });
});

describe("buildSignatureRequestSlackMessage", () => {
  const signData = {
    shipmentNumber: "SH-20260401-0001",
    signUrl: "https://manufacturing-472518.web.app/sign/abc123",
    receiverName: "Bob Receiver",
  };

  it("includes Signature requested in text", () => {
    const result = buildSignatureRequestSlackMessage(signData);
    expect(result.text).toContain("Signature requested");
    expect(result.text).toContain(signData.shipmentNumber);
  });

  it("has a header block with Signature Requested", () => {
    const result = buildSignatureRequestSlackMessage(signData);
    const header = findBlockByType(result.blocks, "header") as {
      text?: { text?: string };
    };
    expect(header).toBeDefined();
    expect(header?.text?.text).toContain("Signature Requested");
  });

  it("has a Sign Now button with primary style and signUrl", () => {
    const result = buildSignatureRequestSlackMessage(signData);
    const button = findActionButton(result.blocks, "Sign Now");
    expect(button).toBeDefined();
    expect(button?.style).toBe("primary");
    expect(button?.url).toBe(signData.signUrl);
  });

  it("has action_id sign_shipment on the Sign Now button", () => {
    const result = buildSignatureRequestSlackMessage(signData);
    const button = findActionButton(result.blocks, "Sign Now");
    expect(button?.action_id).toBe("sign_shipment");
  });
});

describe("shipmentDetailUrl", () => {
  it("returns BASE_URL + /shipments/ + shipmentId", () => {
    const result = shipmentDetailUrl("test-id");
    expect(result).toBe("https://manufacturing-472518.web.app/shipments/test-id");
  });
});
