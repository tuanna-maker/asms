import { describe, expect, it } from "vitest";
import { isExecutionSlaOverdue, sanitizeExecutionSlaHours } from "./execution-sla";

describe("isExecutionSlaOverdue", () => {
  const updatedAt = new Date("2026-05-20T10:00:00Z");

  it("returns false when slaHours is null or zero", () => {
    expect(
      isExecutionSlaOverdue({ id: "1", status: "active", slaHours: null, updatedAt }),
    ).toBe(false);
    expect(
      isExecutionSlaOverdue({ id: "1", status: "active", slaHours: 0, updatedAt }),
    ).toBe(false);
  });

  it("returns false for terminal or late status", () => {
    const now = new Date("2026-05-25T10:00:00Z");
    expect(
      isExecutionSlaOverdue(
        { id: "1", status: "completed", slaHours: 24, updatedAt },
        now,
      ),
    ).toBe(false);
    expect(
      isExecutionSlaOverdue({ id: "1", status: "late", slaHours: 24, updatedAt }, now),
    ).toBe(false);
  });

  it("returns true when past deadline for draft/active", () => {
    const now = new Date("2026-05-21T11:01:00Z");
    expect(
      isExecutionSlaOverdue(
        { id: "1", status: "active", slaHours: 24, updatedAt },
        now,
      ),
    ).toBe(true);
    expect(
      isExecutionSlaOverdue(
        { id: "1", status: "active", slaHours: 24, updatedAt },
        new Date("2026-05-21T09:59:00Z"),
      ),
    ).toBe(false);
  });
});

describe("sanitizeExecutionSlaHours", () => {
  it("normalizes valid numbers and null", () => {
    expect(sanitizeExecutionSlaHours(undefined)).toBeUndefined();
    expect(sanitizeExecutionSlaHours(null)).toBeNull();
    expect(sanitizeExecutionSlaHours(72.9)).toBe(72);
    expect(sanitizeExecutionSlaHours("48")).toBe(48);
    expect(sanitizeExecutionSlaHours(-1)).toBeUndefined();
  });
});
