import { describe, expect, it } from "vitest";
import { pieceFraction, truncateDescription } from "./labelFormatters";

describe("pieceFraction", () => {
  it("formats fraction for multi-piece shipment", () => {
    expect(pieceFraction(1, 5)).toBe("1/5");
  });

  it("formats single-piece shipment as 1/1", () => {
    expect(pieceFraction(1, 1)).toBe("1/1");
  });

  it("handles double-digit piece numbers", () => {
    expect(pieceFraction(3, 10)).toBe("3/10");
  });
});

describe("truncateDescription", () => {
  it("returns short descriptions unchanged", () => {
    expect(truncateDescription("Short")).toBe("Short");
  });

  it("truncates long descriptions to 60 chars with ellipsis", () => {
    const long = "A".repeat(80);
    const result = truncateDescription(long);
    expect(result.length).toBe(60);
    expect(result.endsWith("…")).toBe(true);
  });

  it("respects custom maxLength", () => {
    const long = "A".repeat(80);
    const result = truncateDescription(long, 40);
    expect(result.length).toBe(40);
    expect(result.endsWith("…")).toBe(true);
  });

  it("returns exact-length descriptions unchanged", () => {
    const exact = "B".repeat(60);
    expect(truncateDescription(exact)).toBe(exact);
  });
});
