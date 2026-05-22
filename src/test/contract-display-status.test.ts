import { describe, expect, it } from "vitest";
import {
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

  it("suggests late after end date", () => {
    expect(
      suggestContractStatusFromDates({
        startDate: d(2026, 1, 1),
        endDate: d(2026, 6, 30),
        now: d(2027, 1, 1),
      }),
    ).toBe("late");
  });
});
