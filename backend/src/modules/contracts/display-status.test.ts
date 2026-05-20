import { describe, expect, it } from "vitest";
import { buildDisplayStatusFilter, resolveContractDisplayStatus } from "./display-status";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("resolveContractDisplayStatus (backend)", () => {
  it("matches frontend rules for terminal override", () => {
    expect(
      resolveContractDisplayStatus({
        status: "liquidated",
        startDate: d(2024, 1, 1),
        endDate: d(2024, 6, 1),
        now: d(2026, 1, 1),
      }),
    ).toBe("liquidated");
  });
});

describe("buildDisplayStatusFilter", () => {
  const now = d(2026, 6, 15);

  it("late filter excludes terminal statuses", () => {
    const filter = buildDisplayStatusFilter("late", now);
    expect(filter).toMatchObject({
      AND: expect.arrayContaining([
        { status: { notIn: ["completed", "liquidated"] } },
      ]),
    });
  });
});
