import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";
import type { createMaterialTransferSchema } from "./schema";

function genMaterialCode() {
  return `MAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function listMaterialsService(filters: {
  search?: string;
  type?: string;
  warehouse?: string;
}) {
  const where: Prisma.MaterialWhereInput = { deletedAt: null };
  if (filters.type) where.type = filters.type as NonNullable<Prisma.MaterialWhereInput["type"]>;
  if (filters.warehouse) where.warehouse = filters.warehouse;
  if (filters.search) {
    const s = filters.search;
    where.OR = [{ code: { contains: s, mode: "insensitive" } }, { name: { contains: s, mode: "insensitive" } }];
  }

  return prisma.material.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      type: true,
      serial: true,
      quantity: true,
      available: true,
      unit: true,
      warehouse: true,
    },
  });
}

export async function getMaterialDetailService(id: string) {
  const material = await prisma.material.findFirst({
    where: { id, deletedAt: null },
    include: {
      products: { where: { deletedAt: null }, select: { id: true, code: true, name: true, category: true } },
    },
  });
  if (!material) throw new HttpError(404, "Material not found");
  return material;
}

export async function createMaterialService(payload: {
  code?: string;
  name: string;
  type: string;
  serial?: string | null;
  quantity: number;
  available?: number;
  unit: string;
  warehouse: string;
  description?: string | null;
}) {
  await assertActiveDefinitionCode("material_unit", payload.unit, "Đơn vị");
  await assertActiveDefinitionCode("warehouse", payload.warehouse, "Kho");
  return prisma.material.create({
    data: {
      code: payload.code ?? genMaterialCode(),
      name: payload.name,
      type: payload.type as Prisma.MaterialCreateInput["type"],
      serial: payload.serial ?? null,
      quantity: payload.quantity,
      available: payload.available ?? payload.quantity,
      unit: payload.unit,
      warehouse: payload.warehouse,
      description: payload.description ?? null,
    },
  });
}

type UpdateMaterialPayload = Partial<{
  code: string;
  name: string;
  type: string;
  serial: string | null;
  quantity: number;
  available: number;
  unit: string;
  warehouse: string;
  description: string | null;
}>;

export async function updateMaterialService(id: string, payload: UpdateMaterialPayload) {
  const existing = await prisma.material.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Material not found");

  if (payload.unit !== undefined) {
    await assertActiveDefinitionCode("material_unit", payload.unit, "Đơn vị");
  }
  if (payload.warehouse !== undefined) {
    await assertActiveDefinitionCode("warehouse", payload.warehouse, "Kho");
  }

  return prisma.material.update({
    where: { id },
    data: {
      ...(payload.code !== undefined ? { code: payload.code } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.type !== undefined ? { type: payload.type as NonNullable<Prisma.MaterialUpdateInput["type"]> } : {}),
      ...(payload.serial !== undefined ? { serial: payload.serial } : {}),
      ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
      ...(payload.available !== undefined ? { available: payload.available } : {}),
      ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
      ...(payload.warehouse !== undefined ? { warehouse: payload.warehouse } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
  });
}

export async function softDeleteMaterialService(id: string) {
  const existing = await prisma.material.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Material not found");

  await prisma.material.update({ where: { id }, data: { deletedAt: new Date() } });
  return { id };
}

type CreateMaterialTransferInput = z.infer<typeof createMaterialTransferSchema>;

function genMaterialTransferCode() {
  return `DC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function listMaterialTransfersService(filters: {
  search?: string;
  type?: string;
  status?: string;
}) {
  const where: Prisma.MaterialTransferWhereInput = { deletedAt: null };
  if (filters.type) where.type = filters.type as NonNullable<Prisma.MaterialTransferWhereInput["type"]>;
  if (filters.status) where.status = filters.status as NonNullable<Prisma.MaterialTransferWhereInput["status"]>;
  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { code: { contains: s, mode: "insensitive" } },
      { destination: { contains: s, mode: "insensitive" } },
      { material: { name: { contains: s, mode: "insensitive" } } },
      { material: { code: { contains: s, mode: "insensitive" } } },
    ];
  }

  return prisma.materialTransfer.findMany({
    where,
    orderBy: [{ transferDate: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      code: true,
      materialId: true,
      quantity: true,
      fromWarehouse: true,
      destination: true,
      type: true,
      status: true,
      transferDate: true,
      material: {
        select: {
          id: true,
          code: true,
          name: true,
          unit: true,
        },
      },
    },
  });
}

export async function createMaterialTransferService(payload: CreateMaterialTransferInput) {
  return prisma.$transaction(async (tx) => {
    const material = await tx.material.findFirst({
      where: { id: payload.materialId, deletedAt: null },
      select: { id: true, warehouse: true },
    });
    if (!material) throw new HttpError(404, "Material not found");

    const updateResult = await tx.material.updateMany({
      where: {
        id: payload.materialId,
        deletedAt: null,
        available: { gte: payload.quantity },
      },
      data: { available: { decrement: payload.quantity } },
    });
    if (updateResult.count === 0) {
      throw new HttpError(400, "Not enough available quantity for transfer");
    }

    const transfer = await tx.materialTransfer.create({
      data: {
        code: genMaterialTransferCode(),
        materialId: payload.materialId,
        quantity: payload.quantity,
        fromWarehouse: material.warehouse,
        destination: payload.destination,
        type: payload.type,
        status: payload.status ?? "pending",
        transferDate: payload.transferDate ?? new Date(),
      },
      select: {
        id: true,
        code: true,
        materialId: true,
        quantity: true,
        fromWarehouse: true,
        destination: true,
        type: true,
        status: true,
        transferDate: true,
      },
    });

    return transfer;
  });
}

const transferListSelect = {
  id: true,
  code: true,
  materialId: true,
  quantity: true,
  fromWarehouse: true,
  destination: true,
  type: true,
  status: true,
  transferDate: true,
  material: {
    select: {
      id: true,
      code: true,
      name: true,
      unit: true,
    },
  },
} as const;

type UpdateTransferInput = Partial<{
  destination: string;
  status: "pending" | "processing" | "completed";
  type: "contract" | "warranty" | "repair";
}>;

export async function updateMaterialTransferService(idOrCode: string, payload: UpdateTransferInput) {
  const row = await prisma.materialTransfer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Material transfer not found");

  const data: Record<string, unknown> = {};
  if (payload.destination !== undefined) data.destination = payload.destination;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.type !== undefined) data.type = payload.type;
  if (Object.keys(data).length === 0) throw new HttpError(400, "No fields to update");

  return prisma.materialTransfer.update({
    where: { id: row.id },
    data: data as object,
    select: transferListSelect,
  });
}

export async function softDeleteMaterialTransferService(idOrCode: string) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.materialTransfer.findFirst({
      where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
      select: { id: true, materialId: true, quantity: true, status: true },
    });
    if (!row) throw new HttpError(404, "Material transfer not found");

    if (row.status !== "completed") {
      await tx.material.update({
        where: { id: row.materialId },
        data: { available: { increment: row.quantity } },
      });
    }

    await tx.materialTransfer.update({
      where: { id: row.id },
      data: { deletedAt: new Date() },
    });

    return { id: row.id };
  });
}

