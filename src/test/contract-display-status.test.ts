import { describe, expect, it } from "vitest";
import {
  computeContractOperationalStatus,
  resolveContractDisplayStatus,
  suggestContractStatusFromDates,
} from "@/lib/contract-display-status";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("resolveContractDisplayStatus", () => {
  it("returns stored status directly", () => {
    expect(resolveContractDisplayStatus({ status: "completed" })).toBe("completed");
    expect(resolveContractDisplayStatus({ status: "active" })).toBe("active");
    expect(resolveContractDisplayStatus({ status: "late" })).toBe("late");
  });
});

describe("suggestContractStatusFromDates", () => {
  it("suggests active within date range", () => {
    expect(
      suggestContractStatusFromDates({
        startDate: d(2026, 6, 1),
        endDate: d(2026, 12, 31),
        now: d(2026, 6, 15),
      }),
    ).toBe("active");
  });

  it("suggests liquidated after end date", () => {
    expect(
      suggestContractStatusFromDates({
        startDate: d(2026, 1, 1),
        endDate: d(2026, 6, 30),
        now: d(2027, 1, 1),
      }),
    ).toBe("liquidated");
  });
});

describe("computeContractOperationalStatus", () => {
  it("active when start date reached", () => {
    expect(
      computeContractOperationalStatus({
        status: "draft",
        startDate: d(2026, 5, 1),
        endDate: d(2026, 5, 31),
        now: d(2026, 5, 15),
      }),
    ).toBe("active");
  });

  it("liquidated after end date", () => {
    expect(
      computeContractOperationalStatus({
        status: "active",
        startDate: d(2026, 5, 1),
        endDate: d(2026, 5, 13),
        now: d(2026, 5, 29),
      }),
    ).toBe("liquidated");
  });

  it("late when SLA exceeded", () => {
    const updatedAt = new Date(d(2026, 5, 10).getTime());
    expect(
      computeContractOperationalStatus({
        status: "active",
        startDate: d(2026, 5, 1),
        endDate: d(2026, 5, 31),
        slaHours: 24,
        updatedAt,
        now: new Date(updatedAt.getTime() + 25 * 60 * 60 * 1000),
      }),
    ).toBe("late");
  });
});
