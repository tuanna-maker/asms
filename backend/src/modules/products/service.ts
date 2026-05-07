import { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { syncContractProductCounts } from "../contracts/product-count";

import { createProductSchema } from "./schema";
import type { z } from "zod";

type CreateProductInput = z.infer<typeof createProductSchema>;

const listSelect = {
  id: true,
  code: true,
  name: true,
  category: true,
  status: true,
  version: true,
  description: true,
  manufacturer: true,
  unit: true,
  yearReleased: true,
  totalProduced: true,
  customerId: true,
  contractId: true,
} satisfies Prisma.ProductSelect;

async function resolveCustomerIdOptional(idOrCode: string | undefined) {
  if (idOrCode == null || idOrCode === "") return null;
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveContractIdOptional(idOrCode: string | undefined) {
  if (idOrCode == null || idOrCode === "") return null;
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract.id;
}

export async function listProductsService() {
  return prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: listSelect,
  });
}

async function resolveProductId(idOrCode: string) {
  const row = await prisma.product.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Product not found");
  return row.id;
}

export async function getProductDetailService(idOrCode: string) {
  const id = await resolveProductId(idOrCode);
  const row = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: listSelect,
  });
  if (!row) throw new HttpError(404, "Product not found");
  return row;
}

export async function updateProductService(idOrCode: string, payload: Record<string, unknown>) {
  const id = await resolveProductId(idOrCode);
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    select: { contractId: true },
  });
  if (!existing) throw new HttpError(404, "Product not found");

  const data: Record<string, unknown> = {};
  if (payload.code !== undefined) data.code = payload.code;
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.category !== undefined) data.category = payload.category;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.version !== undefined) data.version = payload.version;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.manufacturer !== undefined) data.manufacturer = payload.manufacturer;
  if (payload.unit !== undefined) data.unit = payload.unit;
  if (payload.yearReleased !== undefined) data.yearReleased = payload.yearReleased;
  if (payload.totalProduced !== undefined) data.totalProduced = payload.totalProduced;

  if (payload.customerId !== undefined) {
    const v = payload.customerId;
    data.customerId =
      v === null || v === "" ? null : await resolveCustomerIdOptional(String(v));
  }
  if (payload.contractId !== undefined) {
    const v = payload.contractId;
    data.contractId =
      v === null || v === "" ? null : await resolveContractIdOptional(String(v));
  }

  if (payload.code !== undefined) {
    const dup = await prisma.product.findFirst({
      where: { code: String(payload.code), deletedAt: null, NOT: { id } },
      select: { id: true },
    });
    if (dup) throw new HttpError(409, "Product code already exists");
  }

  if (Object.keys(data).length === 0) throw new HttpError(400, "No fields to update");

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: data as object,
      select: listSelect,
    });
    await syncContractProductCounts([existing.contractId, updated.contractId]);
    return updated;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Product code already exists");
    }
    throw e;
  }
}

export async function softDeleteProductService(idOrCode: string) {
  const id = await resolveProductId(idOrCode);
  const deleted = await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { contractId: true },
  });
  await syncContractProductCounts([deleted.contractId]);
  return { id };
}

export async function createProductService(payload: CreateProductInput) {
  const dup = await prisma.product.findFirst({
    where: { code: payload.code, deletedAt: null },
    select: { id: true },
  });
  if (dup) throw new HttpError(409, "Product code already exists");

  const customerId = await resolveCustomerIdOptional(payload.customerId);
  const contractId = await resolveContractIdOptional(payload.contractId);

  try {
    const created = await prisma.product.create({
      data: {
        code: payload.code,
        name: payload.name,
        category: payload.category,
        status: (payload.status ?? "developing") as "developing" | "producing" | "equipped" | "stopped",
        version: payload.version ?? null,
        description: payload.description ?? null,
        manufacturer: payload.manufacturer ?? null,
        unit: payload.unit ?? null,
        yearReleased: payload.yearReleased ?? null,
        totalProduced: payload.totalProduced ?? 0,
        customerId,
        contractId,
      },
      select: listSelect,
    });
    await syncContractProductCounts([created.contractId]);
    return created;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new HttpError(409, "Product code already exists");
    }
    throw e;
  }
}
