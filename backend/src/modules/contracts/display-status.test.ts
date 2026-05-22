import { describe, expect, it } from "vitest";
import {
  buildDisplayStatusFilter,
  resolveContractDisplayStatus,
  suggestContractStatusFromDates,
} from "./display-status";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("resolveContractDisplayStatus (backend)", () => {
  it("returns stored status directly", () => {
    expect(
      resolveContractDisplayStatus({
        status: "liquidated",
        startDate: d(2024, 1, 1),
        endDate: d(2024, 6, 1),
      }),
    ).toBe("liquidated");
    expect(resolveContractDisplayStatus({ status: "active" })).toBe("active");
  });
});

describe("suggestContractStatusFromDates", () => {
  const now = d(2026, 6, 15);

  it("suggests active when within date range", () => {
    expect(
      suggestContractStatusFromDates({
        startDate: d(2026, 1, 1),
        endDate: d(2026, 12, 31),
        now,
      }),
    ).toBe("active");
  });
});

describe("buildDisplayStatusFilter", () => {
  it("filters by stored status column", () => {
    expect(buildDisplayStatusFilter("late")).toEqual({ status: "late" });
  });
});
