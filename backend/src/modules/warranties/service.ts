import { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { getSettingNumber } from "../system-settings/service";
import { notifyByPreference } from "../notifications/service";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";
import { attachWorkflowToEntity, startInstanceForEntity } from "../workflows/runtime";
import { loadWorkflowSnapshotsByInstanceIds } from "../workflows/instance-snapshot";

import type { CreateWarrantyBody, UpdateWarrantyBody } from "./schema";
import {
  enrichWarrantyWithStepPayloads,
  flatRowToStepPayloadsByIndex,
  getOrderedStepIdsForWarranty,
  loadStepPayloadsMap,
  mergeStepPayloadsToFlat,
  pruneStepPayloadsNotIn,
  upsertStepPayloads,
  type WarrantyStepPayloadJson,
} from "./step-payload";

const WARRANTY_PRIORITY_ENUMS = new Set(["low", "medium", "high", "urgent"]);
const WARRANTY_STATUS_ENUMS = new Set(["open", "processing", "completed", "cancelled"]);

function genWarrantyCode() {
  return `WRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function normDecimal(
  v: number | string | Prisma.Decimal | null | undefined,
): string | null | undefined {
  if (v === undefined) return undefined;
  if (v === null) return null;
  const s =
    typeof v === "number"
      ? String(v)
      : typeof v === "object" && v !== null && "toString" in v
        ? String(v).trim()
        : String(v).trim();
  if (s === "") return null;
  return s;
}

function parseOccurredAt(v: string | null | undefined): Date | null {
  if (v === null || v === undefined || v === "") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveProductIdOptional(idOrCode: string | undefined | null) {
  if (idOrCode == null || idOrCode === "") return null;
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!product) throw new HttpError(404, "Product not found");
  return product.id;
}

async function validateAndResolveMaterialIdsForProduct(productId: string, rawIds: string[]): Promise<string[]> {
  const resolved = new Set<string>();
  for (const raw of rawIds) {
    const material = await prisma.material.findFirst({
      where: { deletedAt: null, OR: [{ id: raw }, { code: raw }] },
      select: { id: true },
    });
    if (!material) throw new HttpError(400, "Material not found", { materialId: raw });
    const bom = await prisma.productBom.findFirst({
      where: { productId, materialId: material.id },
    });
    if (!bom) throw new HttpError(400, "Material not in product BOM", { materialId: raw });
    resolved.add(material.id);
  }
  return [...resolved];
}

async function normalizeWarrantyLinks(input: {
  customerId: string;
  contractId: string | null | undefined;
  productId: string | null;
  materialIds: string[];
}): Promise<{ contractId: string | null; productId: string | null; materialIds: string[] }> {
  let contractResolved: string | null = null;
  const rawContract = input.contractId;
  if (rawContract != null && String(rawContract).trim() !== "") {
    const raw = String(rawContract);
    const c = await prisma.contract.findFirst({
      where: { deletedAt: null, customerId: input.customerId, OR: [{ id: raw }, { code: raw }] },
      select: { id: true },
    });
    if (!c) throw new HttpError(400, "Contract not found for this customer");
    contractResolved = c.id;
  }
  const productResolved = input.productId;
  if (productResolved && !contractResolved) {
    throw new HttpError(400, "productId requires contractId");
  }
  if (productResolved && contractResolved) {
    const link = await prisma.contractProduct.findFirst({
      where: {
        contractId: contractResolved,
        productId: productResolved,
        deletedAt: null,
        product: { deletedAt: null },
      },
      select: { id: true },
    });
    if (!link) throw new HttpError(400, "Product not on contract");
  }
  let materialIds: string[] = [];
  if (input.materialIds.length > 0) {
    if (!productResolved) throw new HttpError(400, "materialIds require productId");
    materialIds = await validateAndResolveMaterialIdsForProduct(productResolved, input.materialIds);
  }
  return { contractId: contractResolved, productId: productResolved, materialIds };
}

async function resolveWarrantyId(idOrCode: string) {
  const row = await prisma.warranty.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Warranty ticket not found");
  return row.id;
}

const warrantyDetailInclude = {
  customer: true,
  product: true,
  contract: { include: { customer: true } },
  assignee: { include: { role: true } },
  documents: {
    where: { deletedAt: null },
    orderBy: { uploadedAt: "desc" as const },
    take: 40,
    select: {
      id: true,
      code: true,
      name: true,
      categoryCode: true,
      fileType: true,
      fileUrl: true,
      uploadedAt: true,
    },
  },
} satisfies Prisma.WarrantyInclude;

export async function listWarrantiesService(filters: {
  statusCode?: string;
  type?: string;
  customerId?: string;
  productId?: string;
}) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.statusCode) where.statusCode = filters.statusCode;
  if (filters.type) where.type = filters.type;
  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.productId) {
    where.productId = await resolveProductIdOptional(filters.productId);
  }

  const rows = await prisma.warranty.findMany({
    where: where as { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      contractId: true,
      customerId: true,
      productId: true,
      createdAt: true,
      issue: true,
      source: true,
      type: true,
      priority: true,
      priorityCode: true,
      status: true,
      statusCode: true,
      workflowStep: true,
      workflowInstanceId: true,
      slaHours: true,
      resolvedAt: true,
      receiptCategory: true,
      occurredAt: true,
      productSerialSnapshot: true,
      rootCause: true,
      handlingPlan: true,
      plannedHours: true,
      costEstimate: true,
      customerDisagreedClose: true,
      executionMode: true,
      outsourcePartner: true,
      outsourceBudget: true,
      outsourceTimeline: true,
      repairDetails: true,
      postRepairAssessment: true,
      handoverNotes: true,
      materialIds: true,
      customer: { select: { id: true, code: true, name: true } },
      product: { select: { id: true, code: true, name: true } },
      assignee: { select: { id: true, fullName: true, role: { select: { code: true } } } },
    },
  });

  const workflowMap = await loadWorkflowSnapshotsByInstanceIds(rows.map((r) => r.workflowInstanceId));

  return rows.map((row) => ({
    ...row,
    workflow: row.workflowInstanceId ? workflowMap.get(row.workflowInstanceId) ?? null : null,
  }));
}

export async function getWarrantyDetailService(id: string) {
  const resolvedId = await resolveWarrantyId(id);
  const ticket = await prisma.warranty.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: warrantyDetailInclude,
  });

  if (!ticket) throw new HttpError(404, "Warranty ticket not found");
  return enrichWarrantyWithStepPayloads(ticket);
}

async function dualWriteStepPayloadsFromFlat(warrantyId: string) {
  const row = await prisma.warranty.findFirst({
    where: { id: warrantyId },
    select: {
      issue: true,
      source: true,
      type: true,
      priorityCode: true,
      statusCode: true,
      receiptCategory: true,
      occurredAt: true,
      productSerialSnapshot: true,
      rootCause: true,
      handlingPlan: true,
      plannedHours: true,
      costEstimate: true,
      customerDisagreedClose: true,
      executionMode: true,
      outsourcePartner: true,
      outsourceBudget: true,
      outsourceTimeline: true,
      repairDetails: true,
      postRepairAssessment: true,
      handoverNotes: true,
    },
  });
  if (!row) return;
  const stepIds = await getOrderedStepIdsForWarranty(warrantyId);
  if (stepIds.length === 0) return;
  const map = flatRowToStepPayloadsByIndex(row, stepIds);
  await upsertStepPayloads(warrantyId, map);
}

async function applyStepPayloadsInput(
  warrantyId: string,
  stepPayloads: Record<string, WarrantyStepPayloadJson> | undefined,
  pruneOrphan?: boolean,
): Promise<Partial<UpdateWarrantyBody>> {
  if (!stepPayloads || Object.keys(stepPayloads).length === 0) {
    if (pruneOrphan) {
      const stepIds = await getOrderedStepIdsForWarranty(warrantyId);
      await pruneStepPayloadsNotIn(warrantyId, stepIds);
    }
    return {};
  }
  const existing = await loadStepPayloadsMap(warrantyId);
  const merged: Record<string, WarrantyStepPayloadJson> = { ...existing };
  for (const [stepId, patch] of Object.entries(stepPayloads)) {
    merged[stepId] = { ...(merged[stepId] ?? {}), ...patch };
  }
  await upsertStepPayloads(warrantyId, stepPayloads);
  const ordered = await getOrderedStepIdsForWarranty(warrantyId);
  if (pruneOrphan) await pruneStepPayloadsNotIn(warrantyId, ordered);
  const flat = mergeStepPayloadsToFlat(merged, ordered);
  const out: Partial<UpdateWarrantyBody> = {};
  if (flat.issue !== undefined) out.issue = flat.issue;
  if (flat.source !== undefined) out.source = flat.source ?? undefined;
  if (flat.type !== undefined) out.type = flat.type as UpdateWarrantyBody["type"];
  if (flat.priorityCode !== undefined) out.priorityCode = flat.priorityCode;
  if (flat.statusCode !== undefined) out.statusCode = flat.statusCode;
  if (flat.receiptCategory !== undefined) out.receiptCategory = flat.receiptCategory as UpdateWarrantyBody["receiptCategory"];
  if (flat.occurredAt !== undefined) {
    out.occurredAt = flat.occurredAt ? flat.occurredAt.toISOString() : null;
  }
  if (flat.productSerialSnapshot !== undefined) out.productSerialSnapshot = flat.productSerialSnapshot;
  if (flat.rootCause !== undefined) out.rootCause = flat.rootCause as UpdateWarrantyBody["rootCause"];
  if (flat.handlingPlan !== undefined) out.handlingPlan = flat.handlingPlan;
  if (flat.plannedHours !== undefined) out.plannedHours = flat.plannedHours;
  if (flat.costEstimate !== undefined) out.costEstimate = normDecimal(flat.costEstimate);
  if (flat.customerDisagreedClose !== undefined) out.customerDisagreedClose = flat.customerDisagreedClose;
  if (flat.executionMode !== undefined) out.executionMode = flat.executionMode as UpdateWarrantyBody["executionMode"];
  if (flat.outsourcePartner !== undefined) out.outsourcePartner = flat.outsourcePartner;
  if (flat.outsourceBudget !== undefined) out.outsourceBudget = normDecimal(flat.outsourceBudget);
  if (flat.outsourceTimeline !== undefined) out.outsourceTimeline = flat.outsourceTimeline;
  if (flat.repairDetails !== undefined) out.repairDetails = flat.repairDetails;
  if (flat.postRepairAssessment !== undefined) out.postRepairAssessment = flat.postRepairAssessment;
  if (flat.handoverNotes !== undefined) out.handoverNotes = flat.handoverNotes;
  return out;
}

export async function createWarrantyService(payload: CreateWarrantyBody) {
  const customerId = await resolveCustomerId(payload.customerId);
  const productId = await resolveProductIdOptional(
    payload.productId === null ? null : (payload.productId ?? undefined),
  );
  const ctx = await normalizeWarrantyLinks({
    customerId,
    contractId: payload.contractId,
    productId,
    materialIds: payload.materialIds ?? [],
  });

  const priorityCode = payload.priorityCode ?? "medium";
  const statusCode = payload.statusCode ?? "open";
  await assertActiveDefinitionCode("warranty_priority", priorityCode, "Mức ưu tiên");
  await assertActiveDefinitionCode("warranty_status", statusCode, "Trạng thái phiếu");

  const slaHours =
    payload.slaHours !== undefined ? payload.slaHours : await getSettingNumber("warranty_sla_default_hours");

  const costEstimate = normDecimal(payload.costEstimate);
  const outsourceBudget = normDecimal(payload.outsourceBudget);

  const ticket = await prisma.warranty.create({
    data: {
      code: genWarrantyCode(),
      contractId: ctx.contractId,
      customerId,
      productId: ctx.productId,
      materialIds: ctx.materialIds,
      assigneeId: payload.assigneeId ?? null,
      issue: payload.issue,
      source: payload.source ?? null,
      type: payload.type,
      resolvedAt: payload.resolvedAt ?? null,
      slaHours,
      priorityCode,
      statusCode,
      ...(WARRANTY_PRIORITY_ENUMS.has(priorityCode)
        ? { priority: priorityCode as "low" | "medium" | "high" | "urgent" }
        : {}),
      ...(WARRANTY_STATUS_ENUMS.has(statusCode)
        ? { status: statusCode as "open" | "processing" | "completed" | "cancelled" }
        : {}),
      ...(payload.workflowStep !== undefined ? { workflowStep: payload.workflowStep } : {}),
      ...(payload.receiptCategory !== undefined ? { receiptCategory: payload.receiptCategory } : {}),
      ...(payload.occurredAt !== undefined ? { occurredAt: parseOccurredAt(payload.occurredAt) } : {}),
      ...(payload.productSerialSnapshot !== undefined ? { productSerialSnapshot: payload.productSerialSnapshot } : {}),
      ...(payload.rootCause !== undefined ? { rootCause: payload.rootCause } : {}),
      ...(payload.handlingPlan !== undefined ? { handlingPlan: payload.handlingPlan } : {}),
      ...(payload.plannedHours !== undefined ? { plannedHours: payload.plannedHours } : {}),
      ...(costEstimate !== undefined ? { costEstimate } : {}),
      ...(payload.customerDisagreedClose !== undefined ? { customerDisagreedClose: payload.customerDisagreedClose } : {}),
      ...(payload.executionMode !== undefined ? { executionMode: payload.executionMode } : {}),
      ...(payload.outsourcePartner !== undefined ? { outsourcePartner: payload.outsourcePartner } : {}),
      ...(outsourceBudget !== undefined ? { outsourceBudget } : {}),
      ...(payload.outsourceTimeline !== undefined ? { outsourceTimeline: payload.outsourceTimeline } : {}),
      ...(payload.repairDetails !== undefined ? { repairDetails: payload.repairDetails } : {}),
      ...(payload.postRepairAssessment !== undefined ? { postRepairAssessment: payload.postRepairAssessment } : {}),
      ...(payload.handoverNotes !== undefined ? { handoverNotes: payload.handoverNotes } : {}),
    },
  });

  await notifyByPreference({
    key: "new_ticket",
    title: `Phiếu bảo hành mới ${ticket.code}`,
    message: ticket.issue,
    link: `/bao-hanh`,
    refType: "warranty",
    refId: ticket.id,
  }).catch((e) => {
    // eslint-disable-next-line no-console
    console.error("[notify] warranty new_ticket failed", e);
  });

  let workflowStarted = false;
  try {
    if (payload.workflowId) {
      await attachWorkflowToEntity({
        moduleKey: "warranty",
        entityId: ticket.id,
        workflowId: payload.workflowId,
        actorId: payload.assigneeId ?? null,
      });
      workflowStarted = true;
    } else {
      const init = await startInstanceForEntity("warranty", ticket.id, payload.assigneeId ?? null);
      if (init) {
        await prisma.warranty.update({
          where: { id: ticket.id },
          data: { workflowInstanceId: init.instanceId, workflowStep: init.firstStepIndex },
        });
        workflowStarted = true;
      }
    }
    if (workflowStarted) {
      if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
        await upsertStepPayloads(ticket.id, payload.stepPayloads as Record<string, WarrantyStepPayloadJson>);
      } else {
        await dualWriteStepPayloadsFromFlat(ticket.id);
      }
      return getWarrantyDetailService(ticket.id);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[warranty] workflow init failed", e);
  }
  if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
    await upsertStepPayloads(ticket.id, payload.stepPayloads as Record<string, WarrantyStepPayloadJson>);
  } else {
    await dualWriteStepPayloadsFromFlat(ticket.id);
  }
  return getWarrantyDetailService(ticket.id);
}

export async function updateWarrantyService(id: string, payload: UpdateWarrantyBody) {
  const resolvedId = await resolveWarrantyId(id);
  const existing = await prisma.warranty.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: {
      id: true,
      workflowInstanceId: true,
      customerId: true,
      contractId: true,
      productId: true,
      materialIds: true,
    },
  });
  if (!existing) throw new HttpError(404, "Warranty ticket not found");

  let ignoreClientWorkflowStep = false;
  if (payload.workflowStep !== undefined && existing.workflowInstanceId) {
    const wi = await prisma.workflowInstance.findFirst({
      where: { id: existing.workflowInstanceId },
      select: { status: true },
    });
    if (wi?.status === "running") ignoreClientWorkflowStep = true;
  }

  const nextCustomerId =
    payload.customerId !== undefined && typeof payload.customerId === "string"
      ? await resolveCustomerId(payload.customerId)
      : existing.customerId;

  let nextContractId: string | null = existing.contractId;
  if (payload.contractId !== undefined) {
    nextContractId = payload.contractId;
  }

  let nextProductId: string | null = existing.productId;
  if (payload.productId !== undefined) {
    nextProductId = await resolveProductIdOptional(
      payload.productId === null ? null : typeof payload.productId === "string" ? payload.productId : String(payload.productId ?? ""),
    );
  }

  if (nextContractId == null || (typeof nextContractId === "string" && nextContractId.trim() === "")) {
    nextContractId = null;
    nextProductId = null;
  }

  const linksUnchanged =
    nextCustomerId === existing.customerId &&
    nextContractId === existing.contractId &&
    nextProductId === existing.productId;

  const materialInput =
    payload.materialIds !== undefined
      ? payload.materialIds
      : linksUnchanged
        ? (existing.materialIds ?? [])
        : [];

  const ctx = await normalizeWarrantyLinks({
    customerId: nextCustomerId,
    contractId: nextContractId,
    productId: nextProductId,
    materialIds: materialInput,
  });

  const priorityCode = typeof payload.priorityCode === "string" ? payload.priorityCode : undefined;
  const statusCode = typeof payload.statusCode === "string" ? payload.statusCode : undefined;
  if (priorityCode !== undefined) {
    await assertActiveDefinitionCode("warranty_priority", priorityCode, "Mức ưu tiên");
  }
  if (statusCode !== undefined) {
    await assertActiveDefinitionCode("warranty_status", statusCode, "Trạng thái phiếu");
  }

  const costEstimate = payload.costEstimate !== undefined ? normDecimal(payload.costEstimate) : undefined;
  const outsourceBudget = payload.outsourceBudget !== undefined ? normDecimal(payload.outsourceBudget) : undefined;

  const fromStepPayloads = await applyStepPayloadsInput(
    resolvedId,
    payload.stepPayloads as Record<string, WarrantyStepPayloadJson> | undefined,
    payload.pruneOrphanStepPayloads,
  );

  const mergedPayload: UpdateWarrantyBody = {
    ...payload,
    ...fromStepPayloads,
  };

  const mergedCostEstimate =
    mergedPayload.costEstimate !== undefined ? normDecimal(mergedPayload.costEstimate) : costEstimate;
  const mergedOutsourceBudget =
    mergedPayload.outsourceBudget !== undefined ? normDecimal(mergedPayload.outsourceBudget) : outsourceBudget;

  const updated = await prisma.warranty.update({
    where: { id: resolvedId },
    data: {
      contractId: ctx.contractId,
      customerId: nextCustomerId,
      productId: ctx.productId,
      materialIds: ctx.materialIds,
      ...(mergedPayload.assigneeId !== undefined ? { assigneeId: mergedPayload.assigneeId } : {}),
      ...(mergedPayload.issue !== undefined ? { issue: mergedPayload.issue } : {}),
      ...(mergedPayload.source !== undefined ? { source: mergedPayload.source } : {}),
      ...(mergedPayload.type !== undefined ? { type: mergedPayload.type } : {}),
      ...(mergedPayload.priorityCode !== undefined
        ? {
            priorityCode: mergedPayload.priorityCode,
            ...(WARRANTY_PRIORITY_ENUMS.has(mergedPayload.priorityCode)
              ? { priority: mergedPayload.priorityCode as "low" | "medium" | "high" | "urgent" }
              : {}),
          }
        : priorityCode !== undefined
          ? {
              priorityCode,
              ...(WARRANTY_PRIORITY_ENUMS.has(priorityCode)
                ? { priority: priorityCode as "low" | "medium" | "high" | "urgent" }
                : {}),
            }
          : {}),
      ...(mergedPayload.statusCode !== undefined
        ? {
            statusCode: mergedPayload.statusCode,
            ...(WARRANTY_STATUS_ENUMS.has(mergedPayload.statusCode)
              ? { status: mergedPayload.statusCode as "open" | "processing" | "completed" | "cancelled" }
              : {}),
          }
        : statusCode !== undefined
          ? {
              statusCode,
              ...(WARRANTY_STATUS_ENUMS.has(statusCode)
                ? { status: statusCode as "open" | "processing" | "completed" | "cancelled" }
                : {}),
            }
          : {}),
      ...(mergedPayload.workflowStep !== undefined && !ignoreClientWorkflowStep
        ? { workflowStep: mergedPayload.workflowStep }
        : {}),
      ...(mergedPayload.slaHours !== undefined ? { slaHours: mergedPayload.slaHours } : {}),
      ...(mergedPayload.resolvedAt !== undefined ? { resolvedAt: mergedPayload.resolvedAt } : {}),
      ...(mergedPayload.receiptCategory !== undefined ? { receiptCategory: mergedPayload.receiptCategory } : {}),
      ...(mergedPayload.occurredAt !== undefined ? { occurredAt: parseOccurredAt(mergedPayload.occurredAt) } : {}),
      ...(mergedPayload.productSerialSnapshot !== undefined
        ? { productSerialSnapshot: mergedPayload.productSerialSnapshot }
        : {}),
      ...(mergedPayload.rootCause !== undefined ? { rootCause: mergedPayload.rootCause } : {}),
      ...(mergedPayload.handlingPlan !== undefined ? { handlingPlan: mergedPayload.handlingPlan } : {}),
      ...(mergedPayload.plannedHours !== undefined ? { plannedHours: mergedPayload.plannedHours } : {}),
      ...(mergedCostEstimate !== undefined ? { costEstimate: mergedCostEstimate } : {}),
      ...(mergedPayload.customerDisagreedClose !== undefined
        ? { customerDisagreedClose: mergedPayload.customerDisagreedClose }
        : {}),
      ...(mergedPayload.executionMode !== undefined ? { executionMode: mergedPayload.executionMode } : {}),
      ...(mergedPayload.outsourcePartner !== undefined ? { outsourcePartner: mergedPayload.outsourcePartner } : {}),
      ...(mergedOutsourceBudget !== undefined ? { outsourceBudget: mergedOutsourceBudget } : {}),
      ...(mergedPayload.outsourceTimeline !== undefined ? { outsourceTimeline: mergedPayload.outsourceTimeline } : {}),
      ...(mergedPayload.repairDetails !== undefined ? { repairDetails: mergedPayload.repairDetails } : {}),
      ...(mergedPayload.postRepairAssessment !== undefined
        ? { postRepairAssessment: mergedPayload.postRepairAssessment }
        : {}),
      ...(mergedPayload.handoverNotes !== undefined ? { handoverNotes: mergedPayload.handoverNotes } : {}),
    },
    include: warrantyDetailInclude,
  });

  if (payload.stepPayloads === undefined && Object.keys(fromStepPayloads).length === 0) {
    await dualWriteStepPayloadsFromFlat(resolvedId);
  }

  return enrichWarrantyWithStepPayloads(updated);
}

export async function softDeleteWarrantyService(id: string) {
  const resolvedId = await resolveWarrantyId(id);
  const existing = await prisma.warranty.findFirst({ where: { id: resolvedId, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Warranty ticket not found");

  await prisma.warranty.update({ where: { id: resolvedId }, data: { deletedAt: new Date() } });
  return { id: resolvedId };
}

export type WarrantyStatsType = "warranty" | "repair" | "maintenance";

/** Cuối ngày theo lịch UTC của cùng ngày lịch với `d` (để `to` từ input type=date không cắt mất phiếu trong ngày). */
function endOfUtcCalendarDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export async function listWarrantyStatsService(query: {
  from: Date;
  to: Date;
  types?: WarrantyStatsType[];
}) {
  const toInclusive = endOfUtcCalendarDay(query.to);

  const typeWhere =
    query.types && query.types.length > 0 ? ({ type: { in: query.types } } as const) : ({} as const);

  const whereBase = {
    deletedAt: null,
    createdAt: { gte: query.from, lte: toInclusive },
    ...typeWhere,
  };

  const productGroups = await prisma.warranty.groupBy({
    by: ["productId"],
    where: { ...whereBase, productId: { not: null } },
    _count: { _all: true },
  });

  const sortedProducts = [...productGroups]
    .filter((r) => r.productId != null)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 25);

  const prodIds = sortedProducts.map((r) => r.productId!);
  const prodMeta =
    prodIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: prodIds }, deletedAt: null },
          select: { id: true, code: true, name: true },
        })
      : [];
  const pm = new Map(prodMeta.map((p) => [p.id, p]));

  /** So sánh enum Postgres an toàn với tham số dạng text (tránh lỗi operator khi IN thuần chuỗi). */
  const typeSql =
    query.types && query.types.length > 0
      ? Prisma.sql`AND w.type::text IN (${Prisma.join(query.types)})`
      : Prisma.empty;

  const materialAgg = await prisma.$queryRaw<Array<{ material_id: string; cnt: bigint }>>(Prisma.sql`
    SELECT u.mid AS material_id, COUNT(*)::bigint AS cnt
    FROM warranties w
    CROSS JOIN LATERAL unnest(COALESCE(w.material_ids, ARRAY[]::text[])) AS u(mid)
    WHERE w.deleted_at IS NULL
      AND w.created_at >= ${query.from}
      AND w.created_at <= ${toInclusive}
      ${typeSql}
    GROUP BY u.mid
    ORDER BY cnt DESC
    LIMIT 25
  `);

  const mids = materialAgg.map((r) => r.material_id).filter(Boolean);
  const mats =
    mids.length > 0
      ? await prisma.material.findMany({
          where: { id: { in: mids }, deletedAt: null },
          select: { id: true, code: true, name: true },
        })
      : [];
  const mm = new Map(mats.map((m) => [m.id, m]));

  return {
    topProducts: sortedProducts.map((r) => ({
      productId: r.productId!,
      ticketCount: r._count._all,
      code: pm.get(r.productId!)?.code ?? r.productId!,
      name: pm.get(r.productId!)?.name ?? "",
    })),
    topMaterials: materialAgg.map((r) => ({
      materialId: r.material_id,
      ticketCount: Number(r.cnt),
      code: mm.get(r.material_id)?.code ?? r.material_id,
      name: mm.get(r.material_id)?.name ?? "",
    })),
  };
}
