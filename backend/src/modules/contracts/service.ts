import { Prisma } from "@prisma/client";

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

const CONTRACT_TYPE_CATEGORY = "contract_type";

async function assertActiveContractTypeCode(code: string) {
  const row = await prisma.dataDefinition.findFirst({
    where: {
      category: CONTRACT_TYPE_CATEGORY,
      code: code.trim(),
      deletedAt: null,
      isActive: true,
    },
    select: { id: true },
  });
  if (!row) throw new HttpError(400, "Loại hợp đồng không hợp lệ hoặc đã ngừng sử dụng");
}

export async function listContractsService(filters: {
  status?: string;
  statuses?: string[];
  customerId?: string;
  search?: string;
  contractTypeCode?: string;
  signedFrom?: Date;
  signedTo?: Date;
  createdFrom?: Date;
  createdTo?: Date;
  eligibleFor?: "handover" | "training";
}) {
  const where: Prisma.ContractWhereInput = { deletedAt: null };
  if (filters.statuses && filters.statuses.length > 0) {
    where.status = { in: filters.statuses as NonNullable<Prisma.ContractWhereInput["status"]>[] } as NonNullable<Prisma.ContractWhereInput["status"]>;
  } else if (filters.status) {
    where.status = filters.status as NonNullable<Prisma.ContractWhereInput["status"]>;
  }
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.contractTypeCode) where.contractTypeCode = filters.contractTypeCode;
  if (filters.signedFrom || filters.signedTo) {
    where.startDate = {
      ...(filters.signedFrom ? { gte: filters.signedFrom } : {}),
      ...(filters.signedTo ? { lte: filters.signedTo } : {}),
    };
  }
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }
  if (filters.search) {
    const s = filters.search;
    where.OR = [{ code: { contains: s, mode: "insensitive" } }, { title: { contains: s, mode: "insensitive" } }];
  }
  if (filters.eligibleFor) {
    where.handovers = { none: { deletedAt: null } };
    where.trainingCourses = { none: { deletedAt: null } };
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
      contractTypeCode: true,
      workflowId: true,
      terms: true,
      customerId: true,
      customer: { select: { id: true, code: true, name: true } },
      workflow: {
        select: { id: true, code: true, name: true, moduleKey: true },
      },
    },
  });
  const counts = await getContractProductCounts(rows.map((row) => row.id));
  return rows.map((row) => ({ ...row, products: counts.get(row.id) ?? 0 }));
}

function toSpecValues(value: Prisma.JsonValue | null | undefined): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (typeof raw === "string") result[key] = raw;
    else if (raw != null) result[key] = String(raw);
  }
  return result;
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
      workflow: { select: { id: true, code: true, name: true, moduleKey: true } },
    },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  const productsList = contract.contractProducts.map((item) => ({
    ...item.product,
    totalProduced: item.quantity,
    specValues: toSpecValues(item.specValues),
  }));
  const products = productsList.reduce((sum, product) => sum + product.totalProduced, 0);

  const handoverRow = contract.handovers[0] ?? null;
  const trainingRow = contract.trainingCourses[0] ?? null;

  const linkedHandover = handoverRow
    ? {
        id: handoverRow.id,
        code: handoverRow.code,
        status: handoverRow.status,
        startDate: handoverRow.startDate,
        dueDate: handoverRow.dueDate,
        ...(await workflowMetaFromInstanceId(handoverRow.workflowInstanceId)),
      }
    : null;

  const linkedTraining = trainingRow
    ? {
        id: trainingRow.id,
        code: trainingRow.code,
        title: trainingRow.title,
        status: trainingRow.status,
        startDate: trainingRow.startDate,
        endDate: trainingRow.endDate,
        ...(await workflowMetaFromInstanceId(trainingRow.workflowInstanceId)),
      }
    : null;

  const { handovers: _h, trainingCourses: _t, ...rest } = contract;
  return { ...rest, productsList, products, linkedHandover, linkedTraining };
}

async function workflowMetaFromInstanceId(workflowInstanceId: string | null) {
  if (!workflowInstanceId) {
    return { workflowId: null as string | null, workflowName: null as string | null };
  }
  const inst = await prisma.workflowInstance.findFirst({
    where: { id: workflowInstanceId },
    select: { workflow: { select: { id: true, name: true } } },
  });
  return {
    workflowId: inst?.workflow?.id ?? null,
    workflowName: inst?.workflow?.name ?? null,
  };
}

export async function listContractProductsService(idOrCode: string) {
  const resolvedId = await resolveContractId(idOrCode);
  const rows = await prisma.contractProduct.findMany({
    where: { contractId: resolvedId, deletedAt: null, product: { deletedAt: null } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      quantity: true,
      product: { select: { id: true, code: true, name: true } },
    },
  });
  return {
    items: rows.map((r) => ({
      contractProductId: r.id,
      productId: r.product.id,
      code: r.product.code,
      name: r.product.name,
      quantity: r.quantity,
    })),
  };
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
  contractTypeCode?: string | null;
  createdById: string;
  actorId?: string | null;
}) {
  if (payload.contractTypeCode) {
    await assertActiveContractTypeCode(payload.contractTypeCode);
  }

  const created = await prisma.contract.create({
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
      ...(payload.contractTypeCode !== undefined ? { contractTypeCode: payload.contractTypeCode } : {}),
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });

  return getContractDetailService(created.id);
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
  contractTypeCode: string | null;
  actorId: string | null;
}>;

export async function updateContractService(id: string, payload: UpdateContractPayload) {
  const resolvedId = await resolveContractId(id);

  if (payload.contractTypeCode) {
    await assertActiveContractTypeCode(payload.contractTypeCode);
  }

  const existing = await prisma.contract.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Contract not found");

  await prisma.contract.update({
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
      ...(payload.contractTypeCode !== undefined ? { contractTypeCode: payload.contractTypeCode } : {}),
    },
  });

  return getContractDetailService(resolvedId);
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
  payload: {
    products: Array<{ productId: string; quantity: number; specValues?: Record<string, string> | undefined }>;
  },
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

    for (const item of payload.products) {
      await tx.contractProduct.create({
        data: {
          contractId: resolvedId,
          productId: item.productId,
          quantity: item.quantity,
          specValues: (item.specValues ?? {}) as Prisma.InputJsonValue,
        },
      });
    }
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
      specValues: toSpecValues(item.specValues),
    })),
    total,
  };
}

export async function updateContractProductService(
  contractIdOrCode: string,
  productIdOrCode: string,
  payload: { specValues?: Record<string, string> | undefined; quantity?: number | undefined },
) {
  const resolvedContractId = await resolveContractId(contractIdOrCode);

  const product = await prisma.product.findFirst({
    where: { deletedAt: null, OR: [{ id: productIdOrCode }, { code: productIdOrCode }] },
    select: { id: true },
  });
  if (!product) throw new HttpError(404, "Product not found");

  const link = await prisma.contractProduct.findFirst({
    where: {
      contractId: resolvedContractId,
      productId: product.id,
      deletedAt: null,
    },
    select: { id: true },
  });
  if (!link) throw new HttpError(404, "Contract product link not found");

  const data: Prisma.ContractProductUpdateInput = {};
  if (payload.specValues !== undefined) {
    data.specValues = payload.specValues as Prisma.InputJsonValue;
  }
  if (payload.quantity !== undefined) {
    data.quantity = payload.quantity;
  }

  const updated = await prisma.contractProduct.update({
    where: { id: link.id },
    data,
    include: { product: true },
  });

  if (payload.quantity !== undefined) {
    const total = await prisma.contractProduct.aggregate({
      where: { contractId: resolvedContractId, deletedAt: null, product: { deletedAt: null } },
      _sum: { quantity: true },
    });
    await prisma.contract.update({
      where: { id: resolvedContractId },
      data: { products: total._sum.quantity ?? 0 },
    });
  }

  return {
    contractId: resolvedContractId,
    productId: product.id,
    quantity: updated.quantity,
    specValues: toSpecValues(updated.specValues),
    product: updated.product,
  };
}
