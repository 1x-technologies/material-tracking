import { describe, expect, it } from "vitest";
import type { LabelData } from "../../components/shipment/LabelPreviewCard";
import { buildBatchZpl, buildLabelZpl } from "./buildLabelZpl";

const testLabel: LabelData = {
  qrCode: "abc123",
  shipmentNumber: "SH-20260401-0001",
  pieceNumber: 1,
  pieceCount: 3,
  senderName: "Ada Lovelace",
  receiverName: "Bob Smith",
  originName: "HA",
  destinationName: "SC",
  priority: "urgent",
  category: "parts",
  description: "Test parts for assembly line",
};

describe("buildLabelZpl", () => {
  it("starts with ^XA and ends with ^XZ", () => {
    const zpl = buildLabelZpl(testLabel);
    expect(zpl.startsWith("^XA")).toBe(true);
    expect(zpl.endsWith("^XZ")).toBe(true);
  });

  it("contains the QR code value", () => {
    const zpl = buildLabelZpl(testLabel);
    expect(zpl).toContain("abc123");
  });

  it("contains the shipment number", () => {
    const zpl = buildLabelZpl(testLabel);
    expect(zpl).toContain("SH-20260401-0001");
  });

  it("contains the piece fraction", () => {
    const zpl = buildLabelZpl(testLabel);
    expect(zpl).toContain("1/3");
  });

  it("contains sender name", () => {
    const zpl = buildLabelZpl(testLabel);
    expect(zpl).toContain("Ada Lovelace");
  });

  it("contains label width 812 and height 609", () => {
    const zpl = buildLabelZpl(testLabel);
    expect(zpl).toContain("812");
    expect(zpl).toContain("609");
  });
});

describe("buildBatchZpl", () => {
  it("contains two ^XA blocks for two labels", () => {
    const zpl = buildBatchZpl([testLabel, testLabel]);
    const xaCount = (zpl.match(/\^XA/g) || []).length;
    expect(xaCount).toBe(2);
  });

  it("contains three ^XA blocks for one label with 3 copies", () => {
    const zpl = buildBatchZpl([testLabel], 3);
    const xaCount = (zpl.match(/\^XA/g) || []).length;
    expect(xaCount).toBe(3);
  });
});
