import type { HandoverStatus, Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { getContractProductCount, getContractProductCounts } from "../contracts/product-count";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";
import { attachWorkflowToEntity, startInstanceForEntity } from "../workflows/runtime";
import { loadWorkflowSnapshotsByInstanceIds, type WorkflowSnapshot } from "../workflows/instance-snapshot";

import type { CreateHandoverBody, UpdateHandoverBody } from "./schema";
import {
  enrichHandoverWithStepPayloads,
  flatRowToStepPayloadsByIndex,
  getOrderedStepIdsForHandover,
  loadStepPayloadsMap,
  mergeStepPayloadsToFlat,
  pruneStepPayloadsNotIn,
  upsertStepPayloads,
  type HandoverStepPayloadJson,
} from "./step-payload";

function genHandoverCode() {
  return `BG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveContractId(idOrCode: string) {
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract.id;
}

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveHandoverId(idOrCode: string) {
  const row = await prisma.handover.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Handover not found");
  return row.id;
}

const flatSelect = {
  handoverPlan: true,
  costReportNote: true,
  goodsCheckNote: true,
  trainingPlanNote: true,
  trainingCostReport: true,
  trainingReportNote: true,
  trainingDecision: true,
  tempHandoverNote: true,
  finalHandoverNote: true,
} as const;

const listSelect = {
  id: true,
  code: true,
  contractId: true,
  customerId: true,
  products: true,
  currentStep: true,
  status: true,
  typeCode: true,
  workflowInstanceId: true,
  startDate: true,
  dueDate: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  contract: { select: { id: true, code: true, title: true } },
  customer: { select: { id: true, code: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.HandoverSelect;

type HandoverFlatBody = Pick<
  CreateHandoverBody,
  | "handoverPlan"
  | "costReportNote"
  | "goodsCheckNote"
  | "trainingPlanNote"
  | "trainingCostReport"
  | "trainingReportNote"
  | "trainingDecision"
  | "tempHandoverNote"
  | "finalHandoverNote"
>;

function flatFieldsFromBody(body: Partial<HandoverFlatBody>): Prisma.HandoverUpdateInput {
  const data: Prisma.HandoverUpdateInput = {};
  if (body.handoverPlan !== undefined) data.handoverPlan = body.handoverPlan;
  if (body.costReportNote !== undefined) data.costReportNote = body.costReportNote;
  if (body.goodsCheckNote !== undefined) data.goodsCheckNote = body.goodsCheckNote;
  if (body.trainingPlanNote !== undefined) data.trainingPlanNote = body.trainingPlanNote;
  if (body.trainingCostReport !== undefined) data.trainingCostReport = body.trainingCostReport;
  if (body.trainingReportNote !== undefined) data.trainingReportNote = body.trainingReportNote;
  if (body.trainingDecision !== undefined) data.trainingDecision = body.trainingDecision;
  if (body.tempHandoverNote !== undefined) data.tempHandoverNote = body.tempHandoverNote;
  if (body.finalHandoverNote !== undefined) data.finalHandoverNote = body.finalHandoverNote;
  return data;
}

async function dualWriteStepPayloadsFromFlat(handoverId: string) {
  const row = await prisma.handover.findFirst({
    where: { id: handoverId },
    select: flatSelect,
  });
  if (!row) return;
  const stepIds = await getOrderedStepIdsForHandover(handoverId);
  if (stepIds.length === 0) return;
  const map = flatRowToStepPayloadsByIndex(row, stepIds);
  await upsertStepPayloads(handoverId, map);
}

async function applyStepPayloadsInput(
  handoverId: string,
  stepPayloads: Record<string, HandoverStepPayloadJson> | undefined,
  pruneOrphan?: boolean,
): Promise<Partial<HandoverFlatBody>> {
  if (!stepPayloads || Object.keys(stepPayloads).length === 0) {
    if (pruneOrphan) {
      const stepIds = await getOrderedStepIdsForHandover(handoverId);
      await pruneStepPayloadsNotIn(handoverId, stepIds);
    }
    return {};
  }
  const existing = await loadStepPayloadsMap(handoverId);
  const merged: Record<string, HandoverStepPayloadJson> = { ...existing };
  for (const [stepId, patch] of Object.entries(stepPayloads)) {
    merged[stepId] = { ...(merged[stepId] ?? {}), ...patch };
  }
  const toUpsert: Record<string, HandoverStepPayloadJson> = {};
  for (const stepId of Object.keys(stepPayloads)) {
    toUpsert[stepId] = merged[stepId] ?? {};
  }
  await upsertStepPayloads(handoverId, toUpsert);
  const ordered = await getOrderedStepIdsForHandover(handoverId);
  if (pruneOrphan) await pruneStepPayloadsNotIn(handoverId, ordered);
  const flat = mergeStepPayloadsToFlat(merged, ordered);
  const out: Partial<HandoverFlatBody> = {};
  if (flat.handoverPlan !== undefined) out.handoverPlan = flat.handoverPlan;
  if (flat.costReportNote !== undefined) out.costReportNote = flat.costReportNote;
  if (flat.goodsCheckNote !== undefined) out.goodsCheckNote = flat.goodsCheckNote;
  if (flat.trainingPlanNote !== undefined) out.trainingPlanNote = flat.trainingPlanNote;
  if (flat.trainingCostReport !== undefined) out.trainingCostReport = flat.trainingCostReport;
  if (flat.tempHandoverNote !== undefined) out.tempHandoverNote = flat.tempHandoverNote;
  if (flat.trainingReportNote !== undefined) out.trainingReportNote = flat.trainingReportNote;
  if (flat.trainingDecision !== undefined) out.trainingDecision = flat.trainingDecision;
  if (flat.finalHandoverNote !== undefined) out.finalHandoverNote = flat.finalHandoverNote;
  return out;
}

export async function listHandoversService(filters: {
  status?: string;
  customerId?: string;
  contractId?: string;
  search?: string;
  workflowCode?: string;
}) {
  const where: Prisma.HandoverWhereInput = {
    deletedAt: null,
    ...(filters.status ? { status: filters.status as HandoverStatus } : {}),
  };

  if (filters.workflowCode) {
    const code = filters.workflowCode.trim();
    const instanceRows = await prisma.workflowInstance.findMany({
      where: {
        moduleKey: "handover",
        workflow: { code: { equals: code, mode: "insensitive" }, deletedAt: null },
      },
      select: { id: true },
    });
    const instanceIds = instanceRows.map((r) => r.id);
    if (instanceIds.length === 0) return [];
    where.workflowInstanceId = { in: instanceIds };
  }

  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.contractId) {
    where.contractId = await resolveContractId(filters.contractId);
  }
  if (filters.search) {
    const s = filters.search.trim();
    if (s.length > 0) {
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { contract: { code: { contains: s, mode: "insensitive" } } },
        { customer: { name: { contains: s, mode: "insensitive" } } },
      ];
    }
  }

  const rows = await prisma.handover.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: listSelect,
  });
  const counts = await getContractProductCounts(rows.map((row) => row.contractId));
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds(rows.map((row) => row.workflowInstanceId));
  return rows.map((row) => ({
    ...row,
    products: counts.get(row.contractId) ?? 0,
    workflow: row.workflowInstanceId ? workflowMap.get(row.workflowInstanceId) ?? null : null,
  }));
}

export async function getHandoverDetailService(idOrCode: string) {
  const resolvedId = await resolveHandoverId(idOrCode);
  const row = await prisma.handover.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      contract: true,
      customer: true,
      createdBy: { include: { role: true } },
    },
  });
  if (!row) throw new HttpError(404, "Handover not found");
  const products = await getContractProductCount(row.contractId);
  const enriched = await enrichHandoverWithStepPayloads(row);
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds([row.workflowInstanceId]);
  const workflow: WorkflowSnapshot | null = row.workflowInstanceId
    ? workflowMap.get(row.workflowInstanceId) ?? null
    : null;
  return { ...enriched, products, workflow };
}

async function assertSingleHandoverPerContract(contractId: string, excludeHandoverId?: string) {
  const existing = await prisma.handover.findFirst({
    where: {
      contractId,
      deletedAt: null,
      ...(excludeHandoverId ? { id: { not: excludeHandoverId } } : {}),
    },
    select: { id: true, code: true },
  });
  if (existing) {
    throw new HttpError(
      400,
      `Hợp đồng đã có bàn giao ${existing.code}. Mỗi hợp đồng chỉ được một phiếu bàn giao.`,
    );
  }
}

export async function createHandoverService(payload: CreateHandoverBody, actorId?: string | null) {
  const resolvedContractId = await resolveContractId(payload.contractId);
  const contract = await prisma.contract.findFirst({
    where: { id: resolvedContractId, deletedAt: null },
    select: { id: true, customerId: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");

  await assertSingleHandoverPerContract(contract.id);

  const startDate = payload.startDate ?? new Date();
  const dueDate =
    payload.dueDate ?? new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
  const products = await getContractProductCount(contract.id);

  if (payload.typeCode !== undefined) {
    await assertActiveDefinitionCode("handover_type", payload.typeCode, "Loại bàn giao");
  }

  const created = await prisma.handover.create({
    data: {
      code: genHandoverCode(),
      contractId: contract.id,
      customerId: contract.customerId,
      createdById: actorId ?? null,
      products,
      currentStep: payload.currentStep ?? 1,
      status: (payload.status ?? "pending") as HandoverStatus,
      typeCode: payload.typeCode ?? null,
      startDate,
      dueDate,
      handoverPlan: payload.handoverPlan ?? null,
      costReportNote: payload.costReportNote ?? null,
      goodsCheckNote: payload.goodsCheckNote ?? null,
      trainingPlanNote: payload.trainingPlanNote ?? null,
      trainingCostReport: payload.trainingCostReport ?? null,
      trainingReportNote: payload.trainingReportNote ?? null,
      trainingDecision: payload.trainingDecision ?? null,
      tempHandoverNote: payload.tempHandoverNote ?? null,
      finalHandoverNote: payload.finalHandoverNote ?? null,
    },
    select: listSelect,
  });

  let workflowStarted = false;
  try {
    if (payload.workflowId) {
      await attachWorkflowToEntity({
        moduleKey: "handover",
        entityId: created.id,
        workflowId: payload.workflowId,
        actorId: actorId ?? null,
      });
      workflowStarted = true;
    } else {
      const init = await startInstanceForEntity("handover", created.id, actorId ?? null);
      if (init) {
        await prisma.handover.update({
          where: { id: created.id },
          data: {
            workflowInstanceId: init.instanceId,
            currentStep: init.firstStepIndex,
          },
        });
        workflowStarted = true;
      }
    }
    if (workflowStarted) {
      if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
        await upsertStepPayloads(created.id, payload.stepPayloads as Record<string, HandoverStepPayloadJson>);
        const fromPayloads = await applyStepPayloadsInput(created.id, payload.stepPayloads as Record<string, HandoverStepPayloadJson>);
        await prisma.handover.update({
          where: { id: created.id },
          data: flatFieldsFromBody(fromPayloads),
        });
      } else {
        await dualWriteStepPayloadsFromFlat(created.id);
      }
      return getHandoverDetailService(created.id);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[handover] workflow init failed", e);
  }

  if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
    await upsertStepPayloads(created.id, payload.stepPayloads as Record<string, HandoverStepPayloadJson>);
    const fromPayloads = await applyStepPayloadsInput(created.id, payload.stepPayloads as Record<string, HandoverStepPayloadJson>);
    await prisma.handover.update({
      where: { id: created.id },
      data: flatFieldsFromBody(fromPayloads),
    });
  } else {
    await dualWriteStepPayloadsFromFlat(created.id);
  }
  return getHandoverDetailService(created.id);
}

export async function updateHandoverService(idOrCode: string, payload: UpdateHandoverBody) {
  const resolvedId = await resolveHandoverId(idOrCode);

  const existing = await prisma.handover.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: { workflowInstanceId: true, contractId: true },
  });
  if (!existing) throw new HttpError(404, "Handover not found");

  if (payload.contractId !== undefined) {
    const nextContractId = await resolveContractId(payload.contractId);
    if (nextContractId !== existing.contractId) {
      await assertSingleHandoverPerContract(nextContractId, resolvedId);
    }
  }

  let ignoreClientCurrentStep = false;
  if (payload.currentStep !== undefined && existing.workflowInstanceId) {
    const wi = await prisma.workflowInstance.findFirst({
      where: { id: existing.workflowInstanceId },
      select: { status: true },
    });
    if (wi?.status === "running") ignoreClientCurrentStep = true;
  }

  const fromStepPayloads = await applyStepPayloadsInput(
    resolvedId,
    payload.stepPayloads as Record<string, HandoverStepPayloadJson> | undefined,
    payload.pruneOrphanStepPayloads,
  );

  const mergedFlat: Partial<HandoverFlatBody> = {
    ...(payload.handoverPlan !== undefined ? { handoverPlan: payload.handoverPlan } : {}),
    ...(payload.costReportNote !== undefined ? { costReportNote: payload.costReportNote } : {}),
    ...(payload.goodsCheckNote !== undefined ? { goodsCheckNote: payload.goodsCheckNote } : {}),
    ...(payload.trainingPlanNote !== undefined ? { trainingPlanNote: payload.trainingPlanNote } : {}),
    ...(payload.trainingCostReport !== undefined ? { trainingCostReport: payload.trainingCostReport } : {}),
    ...(payload.tempHandoverNote !== undefined ? { tempHandoverNote: payload.tempHandoverNote } : {}),
    ...(payload.trainingReportNote !== undefined ? { trainingReportNote: payload.trainingReportNote } : {}),
    ...(payload.trainingDecision !== undefined ? { trainingDecision: payload.trainingDecision } : {}),
    ...(payload.finalHandoverNote !== undefined ? { finalHandoverNote: payload.finalHandoverNote } : {}),
    ...fromStepPayloads,
  };

  const data: Prisma.HandoverUpdateInput = {
    ...flatFieldsFromBody(mergedFlat),
  };
  if (payload.currentStep !== undefined && !ignoreClientCurrentStep) {
    data.currentStep = payload.currentStep;
  }
  if (payload.status !== undefined) data.status = payload.status as HandoverStatus;
  if (payload.typeCode !== undefined) {
    if (payload.typeCode !== null) {
      await assertActiveDefinitionCode("handover_type", String(payload.typeCode), "Loại bàn giao");
    }
    data.typeCode = payload.typeCode;
  }
  if (payload.startDate !== undefined) data.startDate = payload.startDate;
  if (payload.dueDate !== undefined) data.dueDate = payload.dueDate;
  if (payload.completedAt !== undefined) data.completedAt = payload.completedAt;

  if (Object.keys(data).length > 0) {
    await prisma.handover.update({ where: { id: resolvedId }, data });
  }

  if (payload.stepPayloads === undefined && Object.keys(fromStepPayloads).length === 0) {
    await dualWriteStepPayloadsFromFlat(resolvedId);
  }

  return getHandoverDetailService(resolvedId);
}

export async function softDeleteHandoverService(idOrCode: string) {
  const resolvedId = await resolveHandoverId(idOrCode);
  const now = new Date();
  const n = await prisma.handover.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "Handover not found");
  return { id: resolvedId };
}
