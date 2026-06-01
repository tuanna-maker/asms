import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../utils/prisma", () => ({
  prisma: {
    customer: { findFirst: vi.fn() },
    contract: { findMany: vi.fn() },
    contractProduct: { findMany: vi.fn() },
    productBom: { findMany: vi.fn() },
  },
}));

import { prisma } from "../../utils/prisma";
import { getFeedbackLinkageOptionsService } from "./linkage-options";

describe("getFeedbackLinkageOptionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters contracts by selected product", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: "cust1" } as never);
    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { id: "c1", code: "HD-1", title: "HĐ 1" },
      { id: "c2", code: "HD-2", title: "HĐ 2" },
    ] as never);
    vi.mocked(prisma.contractProduct.findMany).mockResolvedValue([
      {
        contractId: "c1",
        product: { id: "p1", code: "SP-1", name: "Sản phẩm 1" },
      },
      {
        contractId: "c2",
        product: { id: "p2", code: "SP-2", name: "Sản phẩm 2" },
      },
    ] as never);
    vi.mocked(prisma.productBom.findMany).mockResolvedValue([
      { productId: "p1", material: { id: "m1", code: "VT-1", name: "Vật tư 1" } },
    ] as never);

    const result = await getFeedbackLinkageOptionsService({
      customerId: "cust1",
      productIds: ["p1"],
    });

    expect(result.contracts.map((c) => c.id)).toEqual(["c1"]);
    expect(result.products.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
    expect(result.materials.map((m) => m.id)).toEqual(["m1"]);
  });

  it("filters products by multiple selected contracts", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: "cust1" } as never);
    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { id: "c1", code: "HD-1", title: "HĐ 1" },
      { id: "c2", code: "HD-2", title: "HĐ 2" },
    ] as never);
    vi.mocked(prisma.contractProduct.findMany).mockResolvedValue([
      {
        contractId: "c1",
        product: { id: "p1", code: "SP-1", name: "Sản phẩm 1" },
      },
      {
        contractId: "c2",
        product: { id: "p2", code: "SP-2", name: "Sản phẩm 2" },
      },
    ] as never);
    vi.mocked(prisma.productBom.findMany).mockResolvedValue([] as never);

    const result = await getFeedbackLinkageOptionsService({
      customerId: "cust1",
      contractIds: ["c1", "c2"],
    });

    expect(result.contracts.map((c) => c.id).sort()).toEqual(["c1", "c2"]);
    expect(result.products.map((p) => p.id).sort()).toEqual(["p1", "p2"]);
  });

  it("dedupes materials when same BOM appears on multiple contracts", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: "cust1" } as never);
    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { id: "c1", code: "HD-1", title: "HĐ 1" },
      { id: "c2", code: "HD-2", title: "HĐ 2" },
    ] as never);
    vi.mocked(prisma.contractProduct.findMany).mockResolvedValue([
      {
        contractId: "c1",
        product: { id: "p1", code: "SP-1", name: "Sản phẩm 1" },
      },
      {
        contractId: "c2",
        product: { id: "p1", code: "SP-1", name: "Sản phẩm 1" },
      },
    ] as never);
    vi.mocked(prisma.productBom.findMany).mockResolvedValue([
      { productId: "p1", material: { id: "m1", code: "VT-1", name: "Vật tư 1" } },
    ] as never);

    const result = await getFeedbackLinkageOptionsService({
      customerId: "cust1",
      productIds: ["p1"],
    });

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0]?.id).toBe("m1");
    expect(result.materials[0]?.contractIds.sort()).toEqual(["c1", "c2"]);
    expect(result.materials[0]?.productIds).toEqual(["p1"]);
  });

  it("dedupes materials by id across different products", async () => {
    vi.mocked(prisma.customer.findFirst).mockResolvedValue({ id: "cust1" } as never);
    vi.mocked(prisma.contract.findMany).mockResolvedValue([
      { id: "c1", code: "HD-1", title: "HĐ 1" },
    ] as never);
    vi.mocked(prisma.contractProduct.findMany).mockResolvedValue([
      {
        contractId: "c1",
        product: { id: "p1", code: "SP-1", name: "Sản phẩm 1" },
      },
      {
        contractId: "c1",
        product: { id: "p2", code: "SP-2", name: "Sản phẩm 2" },
      },
    ] as never);
    vi.mocked(prisma.productBom.findMany).mockResolvedValue([
      { productId: "p1", material: { id: "m1", code: "VT-1", name: "Vật tư 1" } },
      { productId: "p2", material: { id: "m1", code: "VT-1", name: "Vật tư 1" } },
    ] as never);

    const result = await getFeedbackLinkageOptionsService({ customerId: "cust1" });

    expect(result.materials).toHaveLength(1);
    expect(result.materials[0]?.productIds.sort()).toEqual(["p1", "p2"]);
  });
});
