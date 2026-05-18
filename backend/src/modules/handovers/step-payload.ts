import { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

export type HandoverStepPayloadJson = Record<string, unknown>;

export type HandoverFlatFields = {
  handoverPlan?: string | null;
  costReportNote?: string | null;
  goodsCheckNote?: string | null;
  trainingPlanNote?: string | null;
  trainingCostReport?: string | null;
  trainingReportNote?: string | null;
  trainingDecision?: string | null;
  tempHandoverNote?: string | null;
  finalHandoverNote?: string | null;
};

function asPayloadRecord(v: unknown): HandoverStepPayloadJson {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as HandoverStepPayloadJson;
  return {};
}

/** @deprecated Payload do FE gửi theo fieldSchema; giữ cho đồng bộ cột phẳng legacy */
export function flatRowToStepPayloadsByIndex(
  row: HandoverFlatFields,
  orderedStepIds: string[],
): Record<string, HandoverStepPayloadJson> {
  const out: Record<string, HandoverStepPayloadJson> = {};
  const templates: HandoverStepPayloadJson[] = [
    { handoverPlan: row.handoverPlan ?? null },
    { costReportNote: row.costReportNote ?? null },
    { goodsCheckNote: row.goodsCheckNote ?? null },
    {
      trainingPlanNote: row.trainingPlanNote ?? null,
      trainingCostReport: row.trainingCostReport ?? null,
      tempHandoverNote: row.tempHandoverNote ?? null,
      trainingReportNote: row.trainingReportNote ?? null,
      trainingDecision: row.trainingDecision ?? null,
    },
    { finalHandoverNote: row.finalHandoverNote ?? null },
  ];
  orderedStepIds.forEach((stepId, idx) => {
    if (idx < templates.length) {
      out[stepId] = { ...templates[idx] };
    } else {
      out[stepId] = { notes: null };
    }
  });
  return out;
}

export function mergeStepPayloadsToFlat(
  payloads: Record<string, HandoverStepPayloadJson>,
  orderedStepIds: string[],
): Partial<HandoverFlatFields> {
  const flat: Partial<HandoverFlatFields> = {};
  orderedStepIds.forEach((stepId, idx) => {
    const p = payloads[stepId] ?? {};
    if (idx === 0) {
      if (p.handoverPlan !== undefined) flat.handoverPlan = p.handoverPlan as string | null;
    } else if (idx === 1) {
      if (p.costReportNote !== undefined) flat.costReportNote = p.costReportNote as string | null;
    } else if (idx === 2) {
      if (p.goodsCheckNote !== undefined) flat.goodsCheckNote = p.goodsCheckNote as string | null;
    } else if (idx === 3) {
      if (p.trainingPlanNote !== undefined) flat.trainingPlanNote = p.trainingPlanNote as string | null;
      if (p.trainingCostReport !== undefined) flat.trainingCostReport = p.trainingCostReport as string | null;
      if (p.tempHandoverNote !== undefined) flat.tempHandoverNote = p.tempHandoverNote as string | null;
      if (p.trainingReportNote !== undefined) flat.trainingReportNote = p.trainingReportNote as string | null;
      if (p.trainingDecision !== undefined) flat.trainingDecision = p.trainingDecision as string | null;
    } else if (idx === 4) {
      if (p.finalHandoverNote !== undefined) flat.finalHandoverNote = p.finalHandoverNote as string | null;
    }
  });
  return flat;
}

export async function loadStepPayloadsMap(handoverId: string): Promise<Record<string, HandoverStepPayloadJson>> {
  const rows = await prisma.handoverStepPayload.findMany({
    where: { handoverId },
    select: { workflowStepId: true, payload: true },
  });
  const map: Record<string, HandoverStepPayloadJson> = {};
  for (const r of rows) {
    map[r.workflowStepId] = asPayloadRecord(r.payload);
  }
  return map;
}

export async function getOrderedStepIdsForHandover(handoverId: string): Promise<string[]> {
  const h = await prisma.handover.findFirst({
    where: { id: handoverId, deletedAt: null },
    select: { workflowInstanceId: true },
  });
  if (!h?.workflowInstanceId) return [];
  const inst = await prisma.workflowInstance.findFirst({
    where: { id: h.workflowInstanceId },
    select: {
      workflow: {
        select: {
          steps: { orderBy: { order: "asc" }, select: { id: true } },
        },
      },
    },
  });
  return inst?.workflow.steps.map((s) => s.id) ?? [];
}

export async function upsertStepPayloads(
  handoverId: string,
  partial: Record<string, HandoverStepPayloadJson>,
): Promise<void> {
  const entries = Object.entries(partial);
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map(([workflowStepId, payload]) =>
      prisma.handoverStepPayload.upsert({
        where: {
          handoverId_workflowStepId: { handoverId, workflowStepId },
        },
        create: {
          handoverId,
          workflowStepId,
          payload: payload as Prisma.InputJsonValue,
        },
        update: {
          payload: payload as Prisma.InputJsonValue,
        },
      }),
    ),
  );
}

export async function pruneStepPayloadsNotIn(handoverId: string, allowedStepIds: string[]): Promise<number> {
  if (allowedStepIds.length === 0) {
    const r = await prisma.handoverStepPayload.deleteMany({ where: { handoverId } });
    return r.count;
  }
  const r = await prisma.handoverStepPayload.deleteMany({
    where: { handoverId, workflowStepId: { notIn: allowedStepIds } },
  });
  return r.count;
}

export async function enrichHandoverWithStepPayloads<T extends { id: string }>(
  row: T,
): Promise<
  T & {
    stepPayloads: Record<string, HandoverStepPayloadJson>;
    orphanStepPayloads: Array<{ workflowStepId: string; payload: HandoverStepPayloadJson }>;
  }
> {
  const all = await loadStepPayloadsMap(row.id);
  const ordered = await getOrderedStepIdsForHandover(row.id);
  const allowed = new Set(ordered);
  const stepPayloads: Record<string, HandoverStepPayloadJson> = {};
  const orphanStepPayloads: Array<{ workflowStepId: string; payload: HandoverStepPayloadJson }> = [];
  for (const stepId of ordered) {
    if (all[stepId]) stepPayloads[stepId] = all[stepId];
  }
  for (const [workflowStepId, payload] of Object.entries(all)) {
    if (!allowed.has(workflowStepId)) {
      orphanStepPayloads.push({ workflowStepId, payload });
    }
  }
  return { ...row, stepPayloads, orphanStepPayloads };
}
