import { describe, expect, it } from "vitest";
import { resolveContractDisplayStatus } from "@/lib/contract-display-status";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("resolveContractDisplayStatus", () => {
  it("returns completed when stored completed even after end date", () => {
    const now = d(2026, 6, 1);
    expect(
      resolveContractDisplayStatus({
        status: "completed",
        startDate: d(2025, 1, 1),
        endDate: d(2025, 12, 31),
        now,
      }),
    ).toBe("completed");
  });

  it("returns liquidated when stored liquidated even after end date", () => {
    const now = d(2026, 6, 1);
    expect(
      resolveContractDisplayStatus({
        status: "liquidated",
        startDate: d(2025, 1, 1),
        endDate: d(2025, 12, 31),
        now,
      }),
    ).toBe("liquidated");
  });

  it("returns draft before start date", () => {
    const now = d(2026, 5, 1);
    expect(
      resolveContractDisplayStatus({
        status: "active",
        startDate: d(2026, 6, 1),
        endDate: d(2026, 12, 31),
        now,
      }),
    ).toBe("draft");
  });

  it("returns active within date range", () => {
    const now = d(2026, 6, 15);
    expect(
      resolveContractDisplayStatus({
        status: "draft",
        startDate: d(2026, 6, 1),
        endDate: d(2026, 12, 31),
        now,
      }),
    ).toBe("active");
  });

  it("returns late after end date when not terminal", () => {
    const now = d(2027, 1, 1);
    expect(
      resolveContractDisplayStatus({
        status: "active",
        startDate: d(2026, 1, 1),
        endDate: d(2026, 6, 30),
        now,
      }),
    ).toBe("late");
  });
});
