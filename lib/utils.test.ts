import { describe, expect, it } from "vitest";
import { ageInYears, cn, formatDate, formatINR, hashSeed, pct } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names with a space", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops false, null and undefined", () => {
    expect(cn("a", false, null, undefined, "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("formatINR", () => {
  it("formats a whole rupee amount with no decimals", () => {
    expect(formatINR(18400)).toBe("₹18,400");
  });

  it("uses Indian digit grouping (lakh/crore), not Western thousands", () => {
    // 1,000,000 groups as 10,00,000 in en-IN, not 1,000,000
    expect(formatINR(1000000)).toBe("₹10,00,000");
  });

  it("formats zero", () => {
    expect(formatINR(0)).toBe("₹0");
  });
});

describe("formatDate", () => {
  it("formats a date-only ISO string (YYYY-MM-DD)", () => {
    expect(formatDate("2026-07-16")).toBe("16 Jul 2026");
  });

  it("formats a full ISO timestamp", () => {
    expect(formatDate("2026-01-05T10:30:00.000Z")).toMatch(/5 Jan 2026|4 Jan 2026/);
  });

  it("returns em dash placeholder for empty, garbage or unparseable input", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate("   ")).toBe("—");
    expect(formatDate("not a date")).toBe("—");
    // guards against runtime callers that lie about types
    expect(formatDate(undefined as unknown as string)).toBe("—");
    expect(formatDate(null as unknown as string)).toBe("—");
  });
});

describe("pct", () => {
  it("computes a straightforward percentage", () => {
    expect(pct(50, 100)).toBe(50);
  });

  it("rounds to the nearest whole number", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("clamps at 100 when raised exceeds goal", () => {
    // Regression: campaign totals must never display over 100% funded.
    expect(pct(18400, 12000)).toBe(100);
  });

  it("returns 0 when the goal is zero or negative rather than dividing by zero", () => {
    expect(pct(500, 0)).toBe(0);
    expect(pct(500, -10)).toBe(0);
  });

  it("returns 0 when nothing has been raised", () => {
    expect(pct(0, 5000)).toBe(0);
  });
});

describe("ageInYears", () => {
  it("parses a plain year label", () => {
    expect(ageInYears("~3 years")).toBe(3);
  });

  it("converts a month label to a fraction of a year", () => {
    expect(ageInYears("~4 months")).toBeCloseTo(4 / 12, 5);
  });

  it("converts a week label to a fraction of a year", () => {
    expect(ageInYears("~2 weeks")).toBeCloseTo(2 / 52, 5);
  });

  it("falls back to 2 when the label doesn't match the expected pattern", () => {
    expect(ageInYears("Unknown age")).toBe(2);
    expect(ageInYears("")).toBe(2);
  });
});

describe("hashSeed", () => {
  it("is deterministic for the same input", () => {
    expect(hashSeed("simba")).toBe(hashSeed("simba"));
  });

  it("is always non-negative", () => {
    expect(hashSeed("")).toBeGreaterThanOrEqual(0);
    expect(hashSeed("a very long seed string with punctuation !@#$%")).toBeGreaterThanOrEqual(0);
  });

  it("produces different values for different inputs", () => {
    expect(hashSeed("simba")).not.toBe(hashSeed("muesli"));
  });
});
