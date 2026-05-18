import { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

/** Payload JSON lưu theo bước — gộp template 0..4 + notes cho bước thừa. */
export type WarrantyStepPayloadJson = Record<string, unknown>;

export type WarrantyFlatBhFields = {
  issue?: string;
  source?: string | null;
  type?: string;
  priorityCode?: string;
  statusCode?: string;
  receiptCategory?: string | null;
  occurredAt?: Date | null;
  productSerialSnapshot?: string | null;
  rootCause?: string | null;
  handlingPlan?: string | null;
  plannedHours?: number | null;
  costEstimate?: Prisma.Decimal | string | null;
  customerDisagreedClose?: boolean;
  executionMode?: string | null;
  outsourcePartner?: string | null;
  outsourceBudget?: Prisma.Decimal | string | null;
  outsourceTimeline?: string | null;
  repairDetails?: string | null;
  postRepairAssessment?: string | null;
  handoverNotes?: string | null;
};

function asPayloadRecord(v: unknown): WarrantyStepPayloadJson {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as WarrantyStepPayloadJson;
  return {};
}

/** @deprecated Payload do FE gửi theo fieldSchema; giữ cho đồng bộ cột phẳng legacy */
export function flatRowToStepPayloadsByIndex(
  row: WarrantyFlatBhFields,
  orderedStepIds: string[],
): Record<string, WarrantyStepPayloadJson> {
  const out: Record<string, WarrantyStepPayloadJson> = {};
  const templates: WarrantyStepPayloadJson[] = [
    {
      receiptCategory: row.receiptCategory ?? null,
      occurredAt: row.occurredAt ? row.occurredAt.toISOString() : null,
      productSerialSnapshot: row.productSerialSnapshot ?? null,
      issue: row.issue ?? "",
      source: row.source ?? null,
      type: row.type ?? null,
      priorityCode: row.priorityCode ?? null,
      statusCode: row.statusCode ?? null,
    },
    {
      rootCause: row.rootCause ?? null,
      handlingPlan: row.handlingPlan ?? null,
      plannedHours: row.plannedHours ?? null,
      costEstimate: row.costEstimate != null ? String(row.costEstimate) : null,
      customerDisagreedClose: row.customerDisagreedClose ?? false,
    },
    {
      executionMode: row.executionMode ?? null,
      outsourcePartner: row.outsourcePartner ?? null,
      outsourceBudget: row.outsourceBudget != null ? String(row.outsourceBudget) : null,
      outsourceTimeline: row.outsourceTimeline ?? null,
      repairDetails: row.repairDetails ?? null,
    },
    { postRepairAssessment: row.postRepairAssessment ?? null },
    { handoverNotes: row.handoverNotes ?? null },
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
  payloads: Record<string, WarrantyStepPayloadJson>,
  orderedStepIds: string[],
): Partial<WarrantyFlatBhFields> {
  const flat: Partial<WarrantyFlatBhFields> = {};
  orderedStepIds.forEach((stepId, idx) => {
    const p = payloads[stepId] ?? {};
    if (idx === 0) {
      if (p.receiptCategory !== undefined) flat.receiptCategory = p.receiptCategory as string | null;
      if (p.occurredAt !== undefined) {
        const raw = p.occurredAt;
        flat.occurredAt =
          raw === null || raw === ""
            ? null
            : new Date(String(raw));
      }
      if (p.productSerialSnapshot !== undefined) flat.productSerialSnapshot = p.productSerialSnapshot as string | null;
      if (p.issue !== undefined) flat.issue = String(p.issue ?? "");
      if (p.source !== undefined) flat.source = p.source as string | null;
      if (p.type !== undefined) flat.type = p.type as string;
      if (p.priorityCode !== undefined) flat.priorityCode = p.priorityCode as string;
      if (p.statusCode !== undefined) flat.statusCode = p.statusCode as string;
    } else if (idx === 1) {
      if (p.rootCause !== undefined) flat.rootCause = p.rootCause as string | null;
      if (p.handlingPlan !== undefined) flat.handlingPlan = p.handlingPlan as string | null;
      if (p.plannedHours !== undefined) {
        const ph = p.plannedHours;
        flat.plannedHours =
          ph === null || ph === "" ? null : typeof ph === "number" ? ph : Number.parseInt(String(ph), 10);
      }
      if (p.costEstimate !== undefined) flat.costEstimate = p.costEstimate as string | null;
      if (p.customerDisagreedClose !== undefined) flat.customerDisagreedClose = Boolean(p.customerDisagreedClose);
    } else if (idx === 2) {
      if (p.executionMode !== undefined) flat.executionMode = p.executionMode as string | null;
      if (p.outsourcePartner !== undefined) flat.outsourcePartner = p.outsourcePartner as string | null;
      if (p.outsourceBudget !== undefined) flat.outsourceBudget = p.outsourceBudget as string | null;
      if (p.outsourceTimeline !== undefined) flat.outsourceTimeline = p.outsourceTimeline as string | null;
      if (p.repairDetails !== undefined) flat.repairDetails = p.repairDetails as string | null;
    } else if (idx === 3) {
      if (p.postRepairAssessment !== undefined) flat.postRepairAssessment = p.postRepairAssessment as string | null;
    } else if (idx === 4) {
      if (p.handoverNotes !== undefined) flat.handoverNotes = p.handoverNotes as string | null;
    }
  });
  return flat;
}

export async function loadStepPayloadsMap(warrantyId: string): Promise<Record<string, WarrantyStepPayloadJson>> {
  const rows = await prisma.warrantyStepPayload.findMany({
    where: { warrantyId },
    select: { workflowStepId: true, payload: true },
  });
  const map: Record<string, WarrantyStepPayloadJson> = {};
  for (const r of rows) {
    map[r.workflowStepId] = asPayloadRecord(r.payload);
  }
  return map;
}

export async function getOrderedStepIdsForWarranty(warrantyId: string): Promise<string[]> {
  const w = await prisma.warranty.findFirst({
    where: { id: warrantyId, deletedAt: null },
    select: {
      workflowInstanceId: true,
    },
  });
  if (!w?.workflowInstanceId) return [];
  const inst = await prisma.workflowInstance.findFirst({
    where: { id: w.workflowInstanceId },
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
  warrantyId: string,
  partial: Record<string, WarrantyStepPayloadJson>,
): Promise<void> {
  const entries = Object.entries(partial);
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map(([workflowStepId, payload]) =>
      prisma.warrantyStepPayload.upsert({
        where: {
          warrantyId_workflowStepId: { warrantyId, workflowStepId },
        },
        create: {
          warrantyId,
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

/** Xóa payload không còn trong định nghĩa quy trình hiện tại (sau đổi QT). */
export async function pruneStepPayloadsNotIn(warrantyId: string, allowedStepIds: string[]): Promise<number> {
  if (allowedStepIds.length === 0) {
    const r = await prisma.warrantyStepPayload.deleteMany({ where: { warrantyId } });
    return r.count;
  }
  const r = await prisma.warrantyStepPayload.deleteMany({
    where: { warrantyId, workflowStepId: { notIn: allowedStepIds } },
  });
  return r.count;
}

export async function enrichWarrantyWithStepPayloads<T extends { id: string }>(
  ticket: T,
): Promise<T & { stepPayloads: Record<string, WarrantyStepPayloadJson>; orphanStepPayloads: Array<{ workflowStepId: string; payload: WarrantyStepPayloadJson }> }> {
  const all = await loadStepPayloadsMap(ticket.id);
  const ordered = await getOrderedStepIdsForWarranty(ticket.id);
  const allowed = new Set(ordered);
  const stepPayloads: Record<string, WarrantyStepPayloadJson> = {};
  const orphanStepPayloads: Array<{ workflowStepId: string; payload: WarrantyStepPayloadJson }> = [];
  for (const stepId of ordered) {
    if (all[stepId]) stepPayloads[stepId] = all[stepId];
  }
  for (const [workflowStepId, payload] of Object.entries(all)) {
    if (!allowed.has(workflowStepId)) {
      orphanStepPayloads.push({ workflowStepId, payload });
    }
  }
  return { ...ticket, stepPayloads, orphanStepPayloads };
}
