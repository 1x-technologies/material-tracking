import { describe, expect, it } from "vitest";

function deriveShipmentStatus(pieceStatuses: string[]): string {
  if (pieceStatuses.every((s) => s === "completed")) return "completed";
  if (pieceStatuses.every((s) => s === "delivered" || s === "completed")) return "delivered";
  if (pieceStatuses.some((s) => s === "delivered" || s === "completed"))
    return "partially_delivered";
  if (pieceStatuses.some((s) => s === "in_transit")) return "in_transit";
  return "created";
}

describe("deriveShipmentStatus", () => {
  it("returns created when all pieces are created", () => {
    expect(deriveShipmentStatus(["created", "created", "created"])).toBe("created");
  });

  it("returns in_transit when any piece is in_transit", () => {
    expect(deriveShipmentStatus(["created", "in_transit", "created"])).toBe("in_transit");
  });

  it("returns partially_delivered when some pieces delivered", () => {
    expect(deriveShipmentStatus(["created", "delivered", "created"])).toBe("partially_delivered");
  });

  it("returns delivered when all pieces are delivered or completed", () => {
    expect(deriveShipmentStatus(["delivered", "delivered", "completed"])).toBe("delivered");
  });

  it("returns completed when all pieces are completed", () => {
    expect(deriveShipmentStatus(["completed", "completed"])).toBe("completed");
  });
});
