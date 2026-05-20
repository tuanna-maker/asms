import { Prisma } from "@prisma/client";

import { prisma } from "../../utils/prisma";

export type TrainingStepPayloadJson = Record<string, unknown>;

function asPayloadRecord(v: unknown): TrainingStepPayloadJson {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as TrainingStepPayloadJson;
  return {};
}

export async function loadStepPayloadsMap(
  trainingCourseId: string,
): Promise<Record<string, TrainingStepPayloadJson>> {
  const rows = await prisma.trainingCourseStepPayload.findMany({
    where: { trainingCourseId },
    select: { workflowStepId: true, payload: true },
  });
  const map: Record<string, TrainingStepPayloadJson> = {};
  for (const r of rows) {
    map[r.workflowStepId] = asPayloadRecord(r.payload);
  }
  return map;
}

export async function getOrderedStepIdsForCourse(trainingCourseId: string): Promise<string[]> {
  const course = await prisma.trainingCourse.findFirst({
    where: { id: trainingCourseId, deletedAt: null },
    select: { workflowInstanceId: true },
  });
  if (!course?.workflowInstanceId) return [];
  const inst = await prisma.workflowInstance.findFirst({
    where: { id: course.workflowInstanceId },
    select: {
      workflow: {
        select: { steps: { orderBy: { order: "asc" as const }, select: { id: true } } },
      },
    },
  });
  return inst?.workflow.steps.map((s) => s.id) ?? [];
}

export async function upsertStepPayloads(
  trainingCourseId: string,
  partial: Record<string, TrainingStepPayloadJson>,
): Promise<void> {
  const entries = Object.entries(partial);
  if (entries.length === 0) return;
  await prisma.$transaction(
    entries.map(([workflowStepId, payload]) =>
      prisma.trainingCourseStepPayload.upsert({
        where: {
          trainingCourseId_workflowStepId: { trainingCourseId, workflowStepId },
        },
        create: {
          trainingCourseId,
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

export async function pruneStepPayloadsNotIn(
  trainingCourseId: string,
  allowedStepIds: string[],
): Promise<number> {
  if (allowedStepIds.length === 0) {
    const r = await prisma.trainingCourseStepPayload.deleteMany({ where: { trainingCourseId } });
    return r.count;
  }
  const r = await prisma.trainingCourseStepPayload.deleteMany({
    where: { trainingCourseId, workflowStepId: { notIn: allowedStepIds } },
  });
  return r.count;
}

export async function enrichTrainingCourseWithStepPayloads<T extends { id: string }>(
  course: T,
): Promise<
  T & {
    stepPayloads: Record<string, TrainingStepPayloadJson>;
    orphanStepPayloads: Array<{ workflowStepId: string; payload: TrainingStepPayloadJson }>;
  }
> {
  const all = await loadStepPayloadsMap(course.id);
  const ordered = await getOrderedStepIdsForCourse(course.id);
  const allowed = new Set(ordered);
  const stepPayloads: Record<string, TrainingStepPayloadJson> = {};
  const orphanStepPayloads: Array<{ workflowStepId: string; payload: TrainingStepPayloadJson }> = [];
  for (const stepId of ordered) {
    if (all[stepId]) stepPayloads[stepId] = all[stepId];
  }
  for (const [workflowStepId, payload] of Object.entries(all)) {
    if (!allowed.has(workflowStepId)) {
      orphanStepPayloads.push({ workflowStepId, payload });
    }
  }
  return { ...course, stepPayloads, orphanStepPayloads };
}
