import { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

export type ProductStepPayloadJson = Record<string, unknown>;

function asPayloadRecord(v: unknown): ProductStepPayloadJson {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as ProductStepPayloadJson;
  return {};
}

export async function loadStepPayloadsMap(productId: string): Promise<Record<string, ProductStepPayloadJson>> {
  const rows = await prisma.productStepPayload.findMany({
    where: { productId },
    select: { workflowStepId: true, payload: true },
  });
  const map: Record<string, ProductStepPayloadJson> = {};
  for (const r of rows) {
    map[r.workflowStepId] = asPayloadRecord(r.payload);
  }
  return map;
}

export async function getOrderedStepIdsForProduct(productId: string): Promise<string[]> {
  const p = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
    select: { workflowInstanceId: true },
  });
  if (!p?.workflowInstanceId) return [];
  const inst = await prisma.workflowInstance.findFirst({
    where: { id: p.workflowInstanceId },
    select: {
      workflow: {
        select: { steps: { orderBy: { order: "asc" as const }, select: { id: true } } },
      },
    },
  });
  return inst?.workflow.steps.map((s) => s.id) ?? [];
}

export async function upsertStepPayloads(
  productId: string,
  partial: Record<string, ProductStepPayloadJson>,
): Promise<void> {
  const entries = Object.entries(partial);
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map(([workflowStepId, payload]) =>
      prisma.productStepPayload.upsert({
        where: {
          productId_workflowStepId: { productId, workflowStepId },
        },
        create: {
          productId,
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

export async function pruneStepPayloadsNotIn(productId: string, allowedStepIds: string[]): Promise<number> {
  if (allowedStepIds.length === 0) {
    const r = await prisma.productStepPayload.deleteMany({ where: { productId } });
    return r.count;
  }
  const r = await prisma.productStepPayload.deleteMany({
    where: { productId, workflowStepId: { notIn: allowedStepIds } },
  });
  return r.count;
}

export async function enrichProductWithStepPayloads<T extends { id: string }>(
  product: T,
): Promise<
  T & {
    stepPayloads: Record<string, ProductStepPayloadJson>;
    orphanStepPayloads: Array<{ workflowStepId: string; payload: ProductStepPayloadJson }>;
  }
> {
  const all = await loadStepPayloadsMap(product.id);
  const ordered = await getOrderedStepIdsForProduct(product.id);
  const allowed = new Set(ordered);
  const stepPayloads: Record<string, ProductStepPayloadJson> = {};
  const orphanStepPayloads: Array<{ workflowStepId: string; payload: ProductStepPayloadJson }> = [];
  for (const stepId of ordered) {
    if (all[stepId]) stepPayloads[stepId] = all[stepId];
  }
  for (const [workflowStepId, payload] of Object.entries(all)) {
    if (!allowed.has(workflowStepId)) {
      orphanStepPayloads.push({ workflowStepId, payload });
    }
  }
  return { ...product, stepPayloads, orphanStepPayloads };
}
