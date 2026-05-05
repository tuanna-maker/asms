import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

function genTrainingCode() {
  return `TC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export async function listTrainingCoursesService(filters: {
  status?: string;
  type?: string;
}) {
  const where: any = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;

  return prisma.trainingCourse.findMany({
    where,
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
      startDate: true,
      endDate: true,
      participants: true,
      status: true,
      location: true,
      customer: { select: { id: true, code: true, name: true } },
      contract: { select: { id: true, code: true } },
    },
  });
}

export async function getTrainingCourseDetailService(id: string) {
  const course = await prisma.trainingCourse.findFirst({
    where: { id, deletedAt: null },
    include: {
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

  if (!course) throw new HttpError(404, "Training course not found");
  return course;
}

export async function createTrainingCourseService(payload: {
  code?: string;
  contractId?: string;
  customerId?: string;
  instructorId?: string;
  title: string;
  type: string;
  startDate: Date;
  endDate: Date;
  participants?: number;
  status?: string;
  location?: string;
  description?: string;
}) {
  const created = await prisma.trainingCourse.create({
    data: {
      code: payload.code ?? genTrainingCode(),
      contractId: payload.contractId ?? null,
      customerId: payload.customerId ?? null,
      instructorId: payload.instructorId ?? null,
      title: payload.title,
      type: payload.type as any,
      startDate: payload.startDate,
      endDate: payload.endDate,
      participants: payload.participants ?? 0,
      location: payload.location ?? null,
      description: payload.description ?? null,
      ...(payload.status !== undefined ? { status: payload.status as any } : {}),
    },
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
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

  return created;
}

export async function updateTrainingCourseService(id: string, payload: any) {
  const existing = await prisma.trainingCourse.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Training course not found");

  const updated = await prisma.trainingCourse.update({
    where: { id },
    data: {
      ...(payload.code !== undefined ? { code: payload.code } : {}),
      ...(payload.contractId !== undefined ? { contractId: payload.contractId } : {}),
      ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
      ...(payload.instructorId !== undefined ? { instructorId: payload.instructorId } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
      ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      ...(payload.participants !== undefined ? { participants: payload.participants } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.location !== undefined ? { location: payload.location } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
    },
    select: {
      id: true,
      code: true,
      title: true,
      type: true,
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

  return updated;
}

export async function softDeleteTrainingCourseService(id: string) {
  const existing = await prisma.trainingCourse.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Training course not found");

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
  if (!course) throw new HttpError(404, "Training course not found");

  return prisma.trainee.create({
    data: {
      trainingCourseId,
      fullName: payload.fullName,
      unit: payload.unit ?? null,
      rank: payload.rank ?? null,
      attendance: payload.attendance as any,
      ...(payload.score !== undefined ? { score: payload.score } : {}),
    },
  });
}

export async function updateTraineeService(trainingCourseId: string, traineeId: string, payload: Record<string, unknown>) {
  const row = await prisma.trainee.findFirst({
    where: { id: traineeId, trainingCourseId, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Trainee not found");

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
  if (n.count === 0) throw new HttpError(404, "Trainee not found");
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
  if (!course) throw new HttpError(404, "Training course not found");

  return prisma.scheduleSession.create({
    data: {
      trainingCourseId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
      topic: payload.topic,
      location: payload.location ?? null,
      ...(payload.status !== undefined ? { status: payload.status as any } : {}),
    },
  });
}

export async function updateScheduleSessionService(trainingCourseId: string, sessionId: string, payload: Record<string, unknown>) {
  const row = await prisma.scheduleSession.findFirst({
    where: { id: sessionId, trainingCourseId, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Session not found");

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
  if (n.count === 0) throw new HttpError(404, "Session not found");
  return { id: sessionId };
}

