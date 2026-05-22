import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    contract: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("../notifications/service", () => ({
  notifyByPreference: vi.fn(),
}));

import { prisma } from "../../utils/prisma";
import { notifyByPreference } from "../notifications/service";
import { markExecutionSlaOverdueContracts } from "./execution-sla";

describe("markExecutionSlaOverdueContracts notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifies when contracts marked late", async () => {
    const updatedAt = new Date("2026-05-20T10:00:00Z");
    const now = new Date("2026-05-22T10:00:00Z");

    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { id: "c1", code: "HD-001", title: "Hợp đồng A" },
    ] as never);
    vi.mocked(prisma.contract.updateMany).mockResolvedValue({ count: 1 });

    const ids = await markExecutionSlaOverdueContracts(
      [{ id: "c1", status: "active", slaHours: 24, updatedAt }],
      now,
    );

    expect(ids.has("c1")).toBe(true);
    expect(notifyByPreference).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "contract_execution_sla",
        refId: "c1",
        refType: "contract",
      }),
    );
  });
});
