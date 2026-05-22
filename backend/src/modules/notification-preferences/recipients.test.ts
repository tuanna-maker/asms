import { beforeEach, describe, expect, it, vi } from "vitest";

import { resolveRecipientUserIds } from "./service";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    user: { findMany: vi.fn() },
  },
}));

import { prisma } from "../../utils/prisma";

describe("resolveRecipientUserIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes users without pref row (opt-out default on)", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: "u1", notificationPreferences: [] },
      { id: "u2", notificationPreferences: [{ enabled: true }] },
      { id: "u3", notificationPreferences: [{ enabled: false }] },
    ] as never);

    const ids = await resolveRecipientUserIds("contract_expiry");
    expect(ids).toEqual(["u1", "u2"]);
  });
});
