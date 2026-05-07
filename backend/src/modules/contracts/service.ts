import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { getContractProductCounts } from "./product-count";

function genContractCode() {
  return `HD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveContractId(idOrCode: string) {
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract.id;
}

export async function listContractsService(filters: {
  status?: string;
  customerId?: string;
  search?: string;
}) {
  const where: Prisma.ContractWhereInput = { deletedAt: null };
  if (filters.status) where.status = filters.status as NonNullable<Prisma.ContractWhereInput["status"]>;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) {
    const s = filters.search;
    where.OR = [{ code: { contains: s, mode: "insensitive" } }, { title: { contains: s, mode: "insensitive" } }];
  }

  const rows = await prisma.contract.findMany({
    where,
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      value: true,
      products: true,
      startDate: true,
      endDate: true,
      warrantyEnd: true,
      status: true,
      progress: true,
      terms: true,
      customerId: true,
      customer: { select: { id: true, code: true, name: true } },
    },
  });
  const counts = await getContractProductCounts(rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, products: counts.get(row.id) ?? 0 }));
}

export async function getContractDetailService(id: string) {
  const resolvedId = await resolveContractId(id);
  const contract = await prisma.contract.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      handovers: { where: { deletedAt: null } },
      warranties: { where: { deletedAt: null } },
      contractProducts: {
        where: { deletedAt: null, product: { deletedAt: null } },
        include: { product: true },
      },
      trainingCourses: { where: { deletedAt: null } },
      documents: { where: { deletedAt: null } },
    },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  const productsList = contract.contractProducts.map((item) => ({
    ...item.product,
    totalProduced: item.quantity,
  }));
  const products = productsList.reduce((sum, product) => sum + product.totalProduced, 0);
  return { ...contract, productsList, products };
}

export async function createContractService(payload: {
  customerId: string;
  title: string;
  value: number;
  products?: number;
  startDate: Date;
  endDate: Date;
  warrantyEnd?: Date;
  status?: string;
  progress?: number;
  terms?: string | null;
  createdById: string;
}) {
  return prisma.contract.create({
    data: {
      code: genContractCode(),
      customerId: payload.customerId,
      createdById: payload.createdById,
      title: payload.title,
      value: payload.value as unknown as Prisma.Decimal,
      products: 0,
      startDate: payload.startDate,
      endDate: payload.endDate,
      warrantyEnd: payload.warrantyEnd ?? null,
      ...(payload.status !== undefined ? { status: payload.status as NonNullable<Prisma.ContractCreateInput["status"]> } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
      ...(payload.terms !== undefined ? { terms: payload.terms } : {}),
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

type UpdateContractPayload = Partial<{
  customerId: string;
  title: string;
  value: number;
  startDate: Date;
  endDate: Date;
  warrantyEnd: Date | null;
  status: string;
  progress: number;
  terms: string | null;
}>;

export async function updateContractService(id: string, payload: UpdateContractPayload) {
  const resolvedId = await resolveContractId(id);

  return prisma.contract.update({
    where: { id: resolvedId },
    data: {
      ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.value !== undefined ? { value: payload.value as unknown as Prisma.Decimal } : {}),
      ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
      ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      ...(payload.warrantyEnd !== undefined ? { warrantyEnd: payload.warrantyEnd } : {}),
      ...(payload.status !== undefined ? { status: payload.status as NonNullable<Prisma.ContractUpdateInput["status"]> } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
      ...(payload.terms !== undefined ? { terms: payload.terms } : {}),
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function softDeleteContractService(id: string) {
  const resolvedId = await resolveContractId(id);

  const now = new Date();
  await prisma.$transaction([
    prisma.handover.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.warranty.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.contractProduct.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.trainingCourse.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.document.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.contract.update({ where: { id: resolvedId }, data: { deletedAt: now } }),
  ]);

  return { id: resolvedId };
}

export async function setContractProductsService(
  id: string,
  payload: { products: Array<{ productId: string; quantity: number }> },
) {
  const resolvedId = await resolveContractId(id);

  const productIds = [...new Set(payload.products.map((item) => item.productId))];
  if (productIds.length > 0) {
    const validProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true },
    });
    const validSet = new Set(validProducts.map((item) => item.id));
    const invalid = productIds.filter((productId) => !validSet.has(productId));
    if (invalid.length > 0) throw new HttpError(400, "Invalid products", { invalidProductIds: invalid });
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.contractProduct.updateMany({
      where: { contractId: resolvedId, deletedAt: null },
      data: { deletedAt: now },
    });

    if (payload.products.length === 0) return;

    await tx.contractProduct.createMany({
      data: payload.products.map((item) => ({
        contractId: resolvedId,
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
  });

  const products = await prisma.contractProduct.findMany({
    where: { contractId: resolvedId, deletedAt: null, product: { deletedAt: null } },
    include: { product: true },
  });

  const total = products.reduce((sum, item) => sum + item.quantity, 0);
  await prisma.contract.update({
    where: { id: resolvedId },
    data: { products: total },
  });

  return {
    contractId: resolvedId,
    products: products.map((item) => ({
      ...item.product,
      totalProduced: item.quantity,
    })),
    total,
  };
}

