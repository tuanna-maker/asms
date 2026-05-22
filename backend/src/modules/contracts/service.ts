import { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { ORDER_BY_CREATED_DESC } from "../../lib/list-order";
import { prisma } from "../../utils/prisma";
import { attachWorkflowToEntity, startInstanceForEntity } from "../workflows/runtime";
import { loadWorkflowSnapshotsByInstanceIds, type WorkflowSnapshot } from "../workflows/instance-snapshot";
import { getContractProductCounts } from "./product-count";
import {
  buildDisplayStatusesFilter,
  sanitizeStoredContractStatus,
  withDisplayStatus,
} from "./display-status";
import { sanitizeStatusSlaHours, toStatusSlaHoursRecord } from "./status-sla";
import {
  applyExecutionSlaOverdueForContract,
  markExecutionSlaOverdueContracts,
  sanitizeExecutionSlaHours,
} from "./execution-sla";
import {
  enrichContractWithStepPayloads,
  upsertStepPayloads,
  type ContractStepPayloadJson,
} from "./step-payload";
import {
  buildTermsFromClauseIds,
  buildTermsFromClauseItems,
  enrichClauseItemsWithTitles,
  normalizeStoredClauseItems,
  type ContractClauseItemInput,
} from "../contract-clauses/build-terms";

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

async function initContractWorkflow(
  contractId: string,
  options: { workflowId?: string | null; actorId?: string | null },
): Promise<boolean> {
  try {
    if (options.workflowId) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { workflowId: options.workflowId },
      });
      await attachWorkflowToEntity({
        moduleKey: "contract",
        entityId: contractId,
        workflowId: options.workflowId,
        actorId: options.actorId ?? null,
      });
      return true;
    }
    const init = await startInstanceForEntity("contract", contractId, options.actorId ?? null);
    return Boolean(init);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[contract] workflow init failed", e);
    return false;
  }
}

async function resolveClauseFields(input: {
  clauseItems?: ContractClauseItemInput[];
  clauseIds?: string[];
}): Promise<{
  clauseIds?: string[];
  clauseItems?: ContractClauseItemInput[];
  terms?: string | null;
}> {
  if (input.clauseItems !== undefined) {
    const built = await buildTermsFromClauseItems(input.clauseItems);
    return {
      clauseIds: built.orderedIds,
      clauseItems: built.clauseItems,
      terms: built.terms,
    };
  }
  if (input.clauseIds !== undefined) {
    const built = await buildTermsFromClauseIds(input.clauseIds);
    const clauseItems = built.orderedIds.map((clauseId) => ({ clauseId, content: "" }));
    return { clauseIds: built.orderedIds, clauseItems, terms: built.terms };
  }
  return {};
}

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
  eligibleFor?: "handover" | "coaching";
}) {
  const where: Prisma.ContractWhereInput = { deletedAt: null };
  const displayStatuses =
    filters.statuses && filters.statuses.length > 0
      ? filters.statuses
      : filters.status
        ? [filters.status]
        : [];
  if (displayStatuses.length > 0) {
    const statusFilter = buildDisplayStatusesFilter(
      displayStatuses as Parameters<typeof buildDisplayStatusesFilter>[0],
    );
    where.AND = [...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []), statusFilter];
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
  if (filters.eligibleFor === "handover") {
    where.handovers = { none: { deletedAt: null } };
  }
  if (filters.eligibleFor === "coaching") {
    where.trainingCourses = { none: { deletedAt: null, courseKind: "coaching" } };
  }

  const rows = await prisma.contract.findMany({
    where,
    orderBy: ORDER_BY_CREATED_DESC,
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
      statusSlaHours: true,
      slaHours: true,
      updatedAt: true,
      progress: true,
      endReminderDays: true,
      contractTypeCode: true,
      workflowId: true,
      workflowInstanceId: true,
      terms: true,
      clauseIds: true,
      customerId: true,
      customer: { select: { id: true, code: true, name: true } },
      workflow: {
        select: { id: true, code: true, name: true, moduleKey: true },
      },
    },
  });
  const overdueIds = await markExecutionSlaOverdueContracts(
    rows.map((row) => ({
      id: row.id,
      status: row.status,
      slaHours: row.slaHours,
      updatedAt: row.updatedAt,
    })),
  );
  const counts = await getContractProductCounts(rows.map((row) => row.id));
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds(
    rows.map((row) => row.workflowInstanceId),
  );
  return rows.map((row) => {
    const status = overdueIds.has(row.id) ? ("late" as const) : row.status;
    return {
      ...withDisplayStatus({ ...row, status }),
      statusSlaHours: toStatusSlaHoursRecord(row.statusSlaHours),
      slaHours: row.slaHours,
      products: counts.get(row.id) ?? 0,
    workflow: row.workflowInstanceId
      ? (workflowMap.get(row.workflowInstanceId) ?? null)
      : null,
    };
  });
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
  await applyExecutionSlaOverdueForContract(resolvedId);
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
      trainingCourses: { where: { deletedAt: null, courseKind: "coaching" } },
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
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds([rest.workflowInstanceId]);
  const workflow: WorkflowSnapshot | null = rest.workflowInstanceId
    ? (workflowMap.get(rest.workflowInstanceId) ?? null)
    : null;
  const enriched = await enrichContractWithStepPayloads(withDisplayStatus(rest));
  const storedClauseItems = (rest as { clauseItems?: Prisma.JsonValue }).clauseItems;
  const normalizedClauseItems = normalizeStoredClauseItems({
    clauseItems: storedClauseItems,
    clauseIds: rest.clauseIds,
  });
  const clauseItemsEnriched = await enrichClauseItemsWithTitles(normalizedClauseItems);
  return {
    ...enriched,
    statusSlaHours: toStatusSlaHoursRecord(rest.statusSlaHours),
    slaHours: rest.slaHours,
    updatedAt: rest.updatedAt,
    clauseItems: clauseItemsEnriched,
    productsList,
    products,
    linkedHandover,
    linkedTraining,
    workflow,
  };
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
    orderBy: ORDER_BY_CREATED_DESC,
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
  endReminderDays?: number;
  status?: string;
  statusSlaHours?: Record<string, number>;
  slaHours?: number | null;
  progress?: number;
  workflowId?: string;
  stepPayloads?: Record<string, ContractStepPayloadJson>;
  terms?: string | null;
  clauseIds?: string[];
  clauseItems?: ContractClauseItemInput[];
  contractTypeCode?: string | null;
  createdById: string;
  actorId?: string | null;
}) {
  if (payload.contractTypeCode) {
    await assertActiveContractTypeCode(payload.contractTypeCode);
  }

  const clauseFields = await resolveClauseFields(
    payload.clauseItems !== undefined
      ? { clauseItems: payload.clauseItems }
      : payload.clauseIds !== undefined
        ? { clauseIds: payload.clauseIds }
        : {},
  );
  const storedStatus = sanitizeStoredContractStatus(payload.status);
  const workflowId = payload.workflowId;
  const statusSlaJson = sanitizeStatusSlaHours(payload.statusSlaHours);
  const slaHours = sanitizeExecutionSlaHours(payload.slaHours);
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
      ...(payload.endReminderDays !== undefined ? { endReminderDays: payload.endReminderDays } : {}),
      ...(storedStatus !== undefined ? { status: storedStatus } : {}),
      ...(statusSlaJson !== undefined ? { statusSlaHours: statusSlaJson } : {}),
      ...(slaHours !== undefined ? { slaHours } : {}),
      ...(workflowId ? { workflowId } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
      ...(clauseFields.clauseIds !== undefined
        ? {
            clauseIds: clauseFields.clauseIds,
            clauseItems: (clauseFields.clauseItems ?? []) as unknown as Prisma.InputJsonValue,
            terms: clauseFields.terms ?? null,
          }
        : payload.terms !== undefined
          ? { terms: payload.terms }
          : {}),
      ...(payload.contractTypeCode !== undefined ? { contractTypeCode: payload.contractTypeCode } : {}),
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });

  const workflowStarted =
    workflowId != null
      ? await initContractWorkflow(created.id, {
          workflowId,
          actorId: payload.actorId ?? payload.createdById,
        })
      : false;

  if (
    workflowStarted &&
    payload.stepPayloads &&
    Object.keys(payload.stepPayloads).length > 0
  ) {
    await upsertStepPayloads(created.id, payload.stepPayloads);
  }

  return getContractDetailService(created.id);
}

type UpdateContractPayload = Partial<{
  customerId: string;
  title: string;
  value: number;
  startDate: Date;
  endDate: Date;
  warrantyEnd: Date | null;
  endReminderDays?: number;
  status?: string;
  statusSlaHours?: Record<string, number>;
  slaHours?: number | null;
  progress: number;
  stepPayloads: Record<string, ContractStepPayloadJson>;
  terms: string | null;
  clauseIds?: string[];
  clauseItems?: ContractClauseItemInput[];
  contractTypeCode: string | null;
  actorId: string | null;
}>;

export async function updateContractService(id: string, payload: UpdateContractPayload) {
  const resolvedId = await resolveContractId(id);

  if (payload.contractTypeCode) {
    await assertActiveContractTypeCode(payload.contractTypeCode);
  }

  const clauseFields = await resolveClauseFields(
    payload.clauseItems !== undefined
      ? { clauseItems: payload.clauseItems }
      : payload.clauseIds !== undefined
        ? { clauseIds: payload.clauseIds }
        : {},
  );

  const existing = await prisma.contract.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Contract not found");

  const storedStatus = sanitizeStoredContractStatus(payload.status);
  const statusSlaJson = sanitizeStatusSlaHours(payload.statusSlaHours);
  const slaHours = sanitizeExecutionSlaHours(payload.slaHours);
  await prisma.contract.update({
    where: { id: resolvedId },
    data: {
      ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.value !== undefined ? { value: payload.value as unknown as Prisma.Decimal } : {}),
      ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
      ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      ...(payload.warrantyEnd !== undefined ? { warrantyEnd: payload.warrantyEnd } : {}),
      ...(payload.endReminderDays !== undefined ? { endReminderDays: payload.endReminderDays } : {}),
      ...(storedStatus !== undefined ? { status: storedStatus } : {}),
      ...(statusSlaJson !== undefined ? { statusSlaHours: statusSlaJson } : {}),
      ...(slaHours !== undefined ? { slaHours } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
      ...(clauseFields.clauseIds !== undefined
        ? {
            clauseIds: clauseFields.clauseIds,
            clauseItems: (clauseFields.clauseItems ?? []) as unknown as Prisma.InputJsonValue,
            terms: clauseFields.terms ?? null,
          }
        : payload.terms !== undefined
          ? { terms: payload.terms }
          : {}),
      ...(payload.contractTypeCode !== undefined ? { contractTypeCode: payload.contractTypeCode } : {}),
    },
  });

  if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
    await upsertStepPayloads(resolvedId, payload.stepPayloads);
  }

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
