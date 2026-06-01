import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn() },
    feedbackProductRoutingRule: { findMany: vi.fn() },
  },
}));

import { prisma } from "../../utils/prisma";
import { resolveUnitsFromProductIds } from "./routing";

describe("resolveUnitsFromProductIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves unit by product category", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "p1", category: "Vệ tinh" },
    ] as never);
    vi.mocked(prisma.feedbackProductRoutingRule.findMany).mockResolvedValue([
      {
        productId: null,
        productCategory: "Vệ tinh",
        unit: { id: "u1", code: "BH", name: "Bảo hành" },
      },
    ] as never);

    const units = await resolveUnitsFromProductIds(["p1"]);
    expect(units).toEqual([{ id: "u1", code: "BH", name: "Bảo hành" }]);
  });

  it("prefers product-specific rule over category", async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: "p1", category: "Vệ tinh" },
    ] as never);
    vi.mocked(prisma.feedbackProductRoutingRule.findMany).mockResolvedValue([
      {
        productId: null,
        productCategory: "Vệ tinh",
        unit: { id: "u-cat", code: "CAT", name: "Theo dòng" },
      },
      {
        productId: "p1",
        productCategory: null,
        unit: { id: "u-prod", code: "SP", name: "Theo SP" },
      },
    ] as never);

    const units = await resolveUnitsFromProductIds(["p1"]);
    expect(units.map((u) => u.id)).toEqual(["u-prod"]);
  });
});
