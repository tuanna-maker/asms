import { describe, expect, it } from "vitest";
import {
  formatSlaDeadline,
  isContractExecutionSlaOverdue,
} from "@/lib/contract-execution-sla";

describe("isContractExecutionSlaOverdue", () => {
  const updatedAt = "2026-05-20T10:00:00.000Z";

  it("detects overdue for active status", () => {
    expect(
      isContractExecutionSlaOverdue({
        status: "active",
        slaHours: 24,
        updatedAt,
        now: new Date("2026-05-21T11:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("ignores completed status", () => {
    expect(
      isContractExecutionSlaOverdue({
        status: "completed",
        slaHours: 24,
        updatedAt,
        now: new Date("2026-05-25T00:00:00.000Z"),
      }),
    ).toBe(false);
  });
});

describe("formatSlaDeadline", () => {
  it("formats deadline from updatedAt + slaHours", () => {
    const text = formatSlaDeadline("2026-05-20T10:00:00", 2);
    expect(text).toMatch(/\d{2}\/\d{2}\/2026 \d{2}:\d{2}/);
  });
});
