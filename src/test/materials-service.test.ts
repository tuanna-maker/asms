import { describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    material: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    materialTransfer: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../backend/src/utils/prisma", () => ({
  prisma: prismaMock,
}));

import {
  createMaterialTransferService,
  listMaterialTransfersService,
} from "../../backend/src/modules/materials/service";
import { HttpError } from "../../backend/src/lib/errors/HttpError";

describe("materials transfer service", () => {
  it("lists transfers by query filters", async () => {
    prismaMock.materialTransfer.findMany.mockResolvedValue([
      { id: "mt-1", code: "DC-1", destination: "HD-001" },
    ]);

    const rows = await listMaterialTransfersService({
      search: "HD-001",
      type: "contract",
      status: "pending",
    });

    expect(rows).toHaveLength(1);
    expect(prismaMock.materialTransfer.findMany).toHaveBeenCalledOnce();
  });

  it("creates transfer and decrements material availability", async () => {
    prismaMock.material.findFirst.mockResolvedValue({
      id: "mat-1",
      warehouse: "Kho chính",
      available: 10,
    });

    const tx = {
      materialTransfer: {
        create: vi.fn().mockResolvedValue({ id: "mt-1", code: "DC-100" }),
      },
      material: {
        findFirst: vi.fn().mockResolvedValue({ id: "mat-1", warehouse: "Kho chính" }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    prismaMock.$transaction.mockImplementation(async (cb: (client: unknown) => Promise<unknown>) => cb(tx));

    const created = await createMaterialTransferService({
      materialId: "mat-1",
      quantity: 3,
      destination: "HD-001",
      type: "contract",
      status: "pending",
    });

    expect(created).toMatchObject({ id: "mt-1" });
    expect(tx.materialTransfer.create).toHaveBeenCalledOnce();
    expect(tx.material.updateMany).toHaveBeenCalledWith({
      where: { id: "mat-1", deletedAt: null, available: { gte: 3 } },
      data: { available: { decrement: 3 } },
    });
  });

  it("throws when stock is insufficient", async () => {
    const tx = {
      materialTransfer: {
        create: vi.fn(),
      },
      material: {
        findFirst: vi.fn().mockResolvedValue({ id: "mat-1", warehouse: "Kho chính" }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prismaMock.$transaction.mockImplementation(async (cb: (client: unknown) => Promise<unknown>) => cb(tx));

    await expect(
      createMaterialTransferService({
        materialId: "mat-1",
        quantity: 5,
        destination: "HD-002",
        type: "contract",
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
