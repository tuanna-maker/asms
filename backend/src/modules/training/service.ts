import type {
  AttendanceStatus,
  Prisma,
  SessionStatus,
  TrainingStatus,
  TrainingType,
} from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { getContractProductCount, getContractProductCounts } from "../contracts/product-count";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";
import { loadWorkflowSnapshotsByInstanceIds } from "../workflows/instance-snapshot";
import { workflowModuleForCourseKind } from "../../lib/training-course-kind";
import { attachWorkflowToEntity, startInstanceForEntity } from "../workflows/runtime";
import {
  enrichTrainingCourseWithStepPayloads,
  getOrderedStepIdsForCourse,
  pruneStepPayloadsNotIn,
  upsertStepPayloads,
  type TrainingStepPayloadJson,
} from "./step-payload";

const TRAINING_TYPE_ENUMS = new Set(["internal", "external", "online"]);

function genTrainingCode() {
  return `TC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveContractIdOptional(idOrCode: string | undefined) {
  if (idOrCode == null || idOrCode === "") return undefined;
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!contract) throw new HttpError(404, "Không tìm thấy hợp đồng");
  return contract.id;
}

async function assertSingleCoachingPerContract(contractId: string, excludeCourseId?: string) {
  const existing = await prisma.trainingCourse.findFirst({
    where: {
      contractId,
      courseKind: "coaching",
      deletedAt: null,
      ...(excludeCourseId ? { id: { not: excludeCourseId } } : {}),
    },
    select: { id: true, code: true },
  });
  if (existing) {
    throw new HttpError(
      400,
      `Hợp đồng đã có khóa huấn luyện ${existing.code}. Mỗi hợp đồng chỉ được một khóa HL.`,
    );
  }
}

export async function listTrainingCoursesService(filters: {
  status?: string;
  typeCode?: string;
  contractId?: string;
  courseKind?: string;
}) {
  const where: Prisma.TrainingCourseWhereInput = { deletedAt: null };
  if (filters.status) where.status = filters.status as TrainingStatus;
  if (filters.typeCode) where.typeCode = filters.typeCode;
  if (filters.courseKind) where.courseKind = filters.courseKind;
  if (filters.contractId) {
    const resolvedContractId = await resolveContractIdOptional(filters.contractId);
    if (resolvedContractId) where.contractId = resolvedContractId;
  }

  const rows = await prisma.trainingCourse.findMany({
    where,
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
      typeCode: true,
      startDate: true,
      endDate: true,
      participants: true,
      status: true,
      location: true,
      courseKind: true,
      contractId: true,
      workflowInstanceId: true,
      customer: { select: { id: true, code: true, name: true } },
      instructor: { select: { id: true, fullName: true } },
      contract: { select: { id: true, code: true } },
    },
  });
  const counts = await getContractProductCounts(rows.map((row) => row.contractId).filter(Boolean) as string[]);
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds(rows.map((row) => row.workflowInstanceId));
  return rows.map((row) => ({
    ...row,
    participants: row.contractId ? counts.get(row.contractId) ?? 0 : row.participants,
    workflow: row.workflowInstanceId ? workflowMap.get(row.workflowInstanceId) ?? null : null,
  }));
}

export async function getTrainingCourseDetailService(id: string) {
  const course = await prisma.trainingCourse.findFirst({
    where: { id, deletedAt: null },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      instructor: { select: { id: true, fullName: true } },
      trainees: {
        where: { deletedAt: null },
        orderBy: { fullName: "asc" },
      },
      sessions: {
        where: { deletedAt: null },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!course) throw new HttpError(404, "Không tìm thấy khóa huấn luyện");
  let enriched = await enrichTrainingCourseWithStepPayloads(course);
  if (enriched.contractId) {
    const participants = await getContractProductCount(enriched.contractId);
    enriched = { ...enriched, participants };
  }
  const workflowMap = await loadWorkflowSnapshotsByInstanceIds([enriched.workflowInstanceId]);
  const workflow = enriched.workflowInstanceId
    ? (workflowMap.get(enriched.workflowInstanceId) ?? null)
    : null;
  return { ...enriched, workflow };
}

export async function createTrainingCourseService(payload: {
  code?: string;
  contractId?: string;
  customerId?: string;
  instructorId?: string;
  title: string;
  typeCode: string;
  startDate: Date;
  endDate: Date;
  participants?: number;
  status?: string;
  location?: string;
  description?: string;
  workflowId?: string;
  courseKind?: string;
  stepPayloads?: Record<string, TrainingStepPayloadJson>;
  actorId?: string | null;
}) {
  const courseKind = payload.courseKind === "coaching" ? "coaching" : "training";
  const workflowModule = workflowModuleForCourseKind(courseKind);
  const resolvedContractId = await resolveContractIdOptional(payload.contractId);
  if (resolvedContractId && courseKind === "coaching") {
    await assertSingleCoachingPerContract(resolvedContractId);
  }
  const participants = resolvedContractId
    ? await getContractProductCount(resolvedContractId)
    : payload.participants ?? 0;

  await assertActiveDefinitionCode("training_type", payload.typeCode, "Loại đào tạo");

  const created = await prisma.trainingCourse.create({
    data: {
      code: payload.code ?? genTrainingCode(),
      contractId: resolvedContractId ?? null,
      customerId: payload.customerId ?? null,
      instructorId: payload.instructorId ?? null,
      title: payload.title,
      typeCode: payload.typeCode,
      ...(TRAINING_TYPE_ENUMS.has(payload.typeCode)
        ? { type: payload.typeCode as TrainingType }
        : { type: "internal" as TrainingType }),
      startDate: payload.startDate,
      endDate: payload.endDate,
      participants,
      location: payload.location ?? null,
      description: payload.description ?? null,
      courseKind,
      ...(payload.status !== undefined ? { status: payload.status as TrainingStatus } : {}),
    },
    select: {
      id: true,
      code: true,
      courseKind: true,
      title: true,
      type: true,
      typeCode: true,
      startDate: true,
      endDate: true,
      participants: true,
      status: true,
      location: true,
      description: true,
      customerId: true,
      contractId: true,
      instructorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const actorId = payload.actorId ?? payload.instructorId ?? null;
  try {
    if (payload.workflowId) {
      await attachWorkflowToEntity({
        moduleKey: workflowModule,
        entityId: created.id,
        workflowId: payload.workflowId,
        actorId,
      });
    } else {
      const init = await startInstanceForEntity(workflowModule, created.id, actorId);
      if (init) {
        await prisma.trainingCourse.update({
          where: { id: created.id },
          data: { workflowInstanceId: init.instanceId },
        });
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[training] workflow init failed", e);
  }

  if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
    await upsertStepPayloads(created.id, payload.stepPayloads);
    const ordered = await getOrderedStepIdsForCourse(created.id);
    if (ordered.length > 0) await pruneStepPayloadsNotIn(created.id, ordered);
  }

  return getTrainingCourseDetailService(created.id);
}

type UpdateTrainingCoursePayload = Partial<{
  code: string;
  contractId: string | null;
  customerId: string | null;
  instructorId: string | null;
  title: string;
  typeCode: string;
  startDate: Date;
  endDate: Date;
  participants: number;
  status: string;
  location: string | null;
  description: string | null;
  workflowId: string;
  stepPayloads: Record<string, TrainingStepPayloadJson>;
  actorId: string | null;
}>;

export async function updateTrainingCourseService(id: string, payload: UpdateTrainingCoursePayload) {
  const existing = await prisma.trainingCourse.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, contractId: true, courseKind: true },
  });
  if (!existing) throw new HttpError(404, "Không tìm thấy khóa huấn luyện");
  const workflowModule = workflowModuleForCourseKind(existing.courseKind);

  if (payload.typeCode !== undefined) {
    await assertActiveDefinitionCode("training_type", payload.typeCode, "Loại đào tạo");
  }

  const resolvedContractId = await resolveContractIdOptional(
    payload.contractId === null ? undefined : payload.contractId ?? undefined,
  );
  if (resolvedContractId && existing.courseKind === "coaching") {
    await assertSingleCoachingPerContract(resolvedContractId, id);
  }
  const participants = resolvedContractId
    ? await getContractProductCount(resolvedContractId)
    : payload.participants;

  if (payload.workflowId) {
    await attachWorkflowToEntity({
      moduleKey: workflowModule,
      entityId: id,
      workflowId: payload.workflowId,
      actorId: payload.actorId ?? payload.instructorId ?? null,
    });
    const ordered = await getOrderedStepIdsForCourse(id);
    await pruneStepPayloadsNotIn(id, ordered);
  }

  const updated = await prisma.trainingCourse.update({
    where: { id },
    data: {
      ...(payload.code !== undefined ? { code: payload.code } : {}),
      ...(payload.contractId !== undefined ? { contractId: payload.contractId === null ? null : (resolvedContractId ?? null) } : {}),
      ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
      ...(payload.instructorId !== undefined ? { instructorId: payload.instructorId } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.typeCode !== undefined
        ? {
            typeCode: payload.typeCode,
            ...(TRAINING_TYPE_ENUMS.has(payload.typeCode)
              ? { type: payload.typeCode as TrainingType }
              : {}),
          }
        : {}),
      ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
      ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      ...(participants !== undefined ? { participants } : {}),
      ...(payload.status !== undefined ? { status: payload.status as TrainingStatus } : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
      typeCode: true,
      startDate: true,
      endDate: true,
      participants: true,
      status: true,
      location: true,
      description: true,
      customerId: true,
      contractId: true,
      instructorId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (payload.stepPayloads && Object.keys(payload.stepPayloads).length > 0) {
    await upsertStepPayloads(id, payload.stepPayloads);
    const ordered = await getOrderedStepIdsForCourse(id);
    if (ordered.length > 0) await pruneStepPayloadsNotIn(id, ordered);
  }

  return getTrainingCourseDetailService(id);
}

export async function softDeleteTrainingCourseService(id: string) {
  const existing = await prisma.trainingCourse.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Không tìm thấy khóa huấn luyện");

  const now = new Date();
  await prisma.$transaction([
    prisma.trainingCourse.update({
      where: { id },
      data: { deletedAt: now },
    }),
    prisma.trainee.updateMany({
      where: { trainingCourseId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
    prisma.scheduleSession.updateMany({
      where: { trainingCourseId: id, deletedAt: null },
      data: { deletedAt: now },
    }),
  ]);

  return { id };
}

export async function addTraineeService(trainingCourseId: string, payload: {
  fullName: string;
  unit?: string;
  rank?: string;
  attendance: string;
  score?: number;
}) {
  const course = await prisma.trainingCourse.findFirst({
    where: { id: trainingCourseId, deletedAt: null },
    select: { id: true },
  });
  if (!course) throw new HttpError(404, "Không tìm thấy khóa huấn luyện");

  return prisma.trainee.create({
    data: {
      trainingCourseId,
      fullName: payload.fullName,
      unit: payload.unit ?? null,
      rank: payload.rank ?? null,
      attendance: payload.attendance as AttendanceStatus,
      ...(payload.score !== undefined ? { score: payload.score } : {}),
    },
  });
}

export async function updateTraineeService(trainingCourseId: string, traineeId: string, payload: Record<string, unknown>) {
  const row = await prisma.trainee.findFirst({
    where: { id: traineeId, trainingCourseId, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy học viên");

  const data: Record<string, unknown> = {};
  if (payload.fullName !== undefined) data.fullName = payload.fullName;
  if (payload.unit !== undefined) data.unit = payload.unit;
  if (payload.rank !== undefined) data.rank = payload.rank;
  if (payload.attendance !== undefined) data.attendance = payload.attendance;
  if (payload.score !== undefined) data.score = payload.score;

  return prisma.trainee.update({
    where: { id: traineeId },
    data: data as object,
  });
}

export async function softDeleteTraineeService(trainingCourseId: string, traineeId: string) {
  const n = await prisma.trainee.updateMany({
    where: { id: traineeId, trainingCourseId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (n.count === 0) throw new HttpError(404, "Không tìm thấy học viên");
  return { id: traineeId };
}

export async function addScheduleSessionService(trainingCourseId: string, payload: {
  date: Date;
  startTime: string;
  endTime: string;
  topic: string;
  location?: string;
  status?: string;
}) {
  const course = await prisma.trainingCourse.findFirst({
    where: { id: trainingCourseId, deletedAt: null },
    select: { id: true },
  });
  if (!course) throw new HttpError(404, "Không tìm thấy khóa huấn luyện");

  return prisma.scheduleSession.create({
    data: {
      trainingCourseId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      topic: payload.topic,
      location: payload.location ?? null,
      ...(payload.status !== undefined ? { status: payload.status as SessionStatus } : {}),
    },
  });
}

export async function updateScheduleSessionService(trainingCourseId: string, sessionId: string, payload: Record<string, unknown>) {
  const row = await prisma.scheduleSession.findFirst({
    where: { id: sessionId, trainingCourseId, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Không tìm thấy buổi học");

  const data: Record<string, unknown> = {};
  if (payload.date !== undefined) data.date = payload.date;
  if (payload.startTime !== undefined) data.startTime = payload.startTime;
  if (payload.endTime !== undefined) data.endTime = payload.endTime;
  if (payload.topic !== undefined) data.topic = payload.topic;
  if (payload.location !== undefined) data.location = payload.location;
  if (payload.status !== undefined) data.status = payload.status;

  return prisma.scheduleSession.update({
    where: { id: sessionId },
    data: data as object,
  });
}

export async function softDeleteScheduleSessionService(trainingCourseId: string, sessionId: string) {
  const n = await prisma.scheduleSession.updateMany({
    where: { id: sessionId, trainingCourseId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  if (n.count === 0) throw new HttpError(404, "Không tìm thấy buổi học");
  return { id: sessionId };
}

