import { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

export type ContractStepPayloadJson = Record<string, unknown>;

function asPayloadRecord(v: unknown): ContractStepPayloadJson {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as ContractStepPayloadJson;
  return {};
}

export async function loadStepPayloadsMap(contractId: string): Promise<Record<string, ContractStepPayloadJson>> {
  const rows = await prisma.contractStepPayload.findMany({
    where: { contractId },
    select: { workflowStepId: true, payload: true },
  });
  const map: Record<string, ContractStepPayloadJson> = {};
  for (const r of rows) {
    map[r.workflowStepId] = asPayloadRecord(r.payload);
  }
  return map;
}

export async function getOrderedStepIdsForContract(contractId: string): Promise<string[]> {
  const c = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: { workflowId: true },
  });
  if (!c?.workflowId) return [];
  const steps = await prisma.workflowStep.findMany({
    where: { workflowId: c.workflowId },
    orderBy: { order: "asc" },
    select: { id: true },
  });
  return steps.map((s) => s.id);
}

export async function upsertStepPayloads(
  contractId: string,
  partial: Record<string, ContractStepPayloadJson>,
): Promise<void> {
  const entries = Object.entries(partial);
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map(([workflowStepId, payload]) =>
      prisma.contractStepPayload.upsert({
        where: {
          contractId_workflowStepId: { contractId, workflowStepId },
        },
        create: {
          contractId,
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

export async function pruneStepPayloadsNotIn(contractId: string, allowedStepIds: string[]): Promise<number> {
  if (allowedStepIds.length === 0) {
    const r = await prisma.contractStepPayload.deleteMany({ where: { contractId } });
    return r.count;
  }
  const r = await prisma.contractStepPayload.deleteMany({
    where: { contractId, workflowStepId: { notIn: allowedStepIds } },
  });
  return r.count;
}

export async function enrichContractWithStepPayloads<T extends { id: string }>(
  contract: T,
): Promise<
  T & {
    stepPayloads: Record<string, ContractStepPayloadJson>;
    orphanStepPayloads: Array<{ workflowStepId: string; payload: ContractStepPayloadJson }>;
  }
> {
  const all = await loadStepPayloadsMap(contract.id);
  const ordered = await getOrderedStepIdsForContract(contract.id);
  const allowed = new Set(ordered);
  const stepPayloads: Record<string, ContractStepPayloadJson> = {};
  const orphanStepPayloads: Array<{ workflowStepId: string; payload: ContractStepPayloadJson }> = [];
  for (const stepId of ordered) {
    if (all[stepId]) stepPayloads[stepId] = all[stepId];
  }
  for (const [workflowStepId, payload] of Object.entries(all)) {
    if (!allowed.has(workflowStepId)) {
      orphanStepPayloads.push({ workflowStepId, payload });
    }
  }
  return { ...contract, stepPayloads, orphanStepPayloads };
}
