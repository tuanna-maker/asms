import type { Prisma, TaskPriority, TaskStatus, TaskType } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

function genTaskCode() {
  return `TK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveTaskId(idOrCode: string) {
  const task = await prisma.task.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!task) throw new HttpError(404, "Task not found");
  return task.id;
}

export async function listTasksService(filters: {
  status?: string;
  priority?: string;
  type?: string;
  projectId?: string;
}) {
  const where: Prisma.TaskWhereInput = { deletedAt: null };
  if (filters.status) where.status = filters.status as TaskStatus;
  if (filters.priority) where.priority = filters.priority as TaskPriority;
  if (filters.type) where.type = filters.type as TaskType;
  if (filters.projectId) where.projectId = filters.projectId;

  return prisma.task.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      type: true,
      progress: true,
      startDate: true,
      deadline: true,
      projectId: true,
      project: { select: { id: true, code: true, name: true } },
      assigneeId: true,
      assignee: { select: { id: true, fullName: true, role: { select: { code: true } } } },
    },
  });
}

export async function getTaskDetailService(id: string) {
  const resolvedId = await resolveTaskId(id);
  const task = await prisma.task.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      project: true,
      assignee: { include: { role: true } },
    },
  });
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

export async function createTaskService(payload: {
  projectId?: string;
  code?: string;
  title: string;
  description?: string;
  startDate?: Date;
  deadline?: Date;
  priority?: string;
  status?: string;
  type?: string;
  assigneeId?: string;
  progress?: number;
}) {
  return prisma.task.create({
    data: {
      code: payload.code ?? genTaskCode(),
      projectId: payload.projectId ?? null,
      assigneeId: payload.assigneeId ?? null,
      title: payload.title,
      description: payload.description ?? null,
      startDate: payload.startDate ?? null,
      deadline: payload.deadline ?? null,
      ...(payload.priority ? { priority: payload.priority as TaskPriority } : {}),
      ...(payload.status ? { status: payload.status as TaskStatus } : {}),
      ...(payload.type ? { type: payload.type as TaskType } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
    },
  });
}

type UpdateTaskPayload = Partial<{
  projectId: string | null;
  code: string;
  title: string;
  description: string | null;
  startDate: Date | null;
  deadline: Date | null;
  priority: string;
  status: string;
  type: string;
  assigneeId: string | null;
  progress: number;
}>;

export async function updateTaskService(id: string, payload: UpdateTaskPayload) {
  const resolvedId = await resolveTaskId(id);

  return prisma.task.update({
    where: { id: resolvedId },
    data: {
      ...(payload.projectId !== undefined ? { projectId: payload.projectId } : {}),
      ...(payload.code !== undefined ? { code: payload.code } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
      ...(payload.deadline !== undefined ? { deadline: payload.deadline } : {}),
      ...(payload.priority !== undefined ? { priority: payload.priority as TaskPriority } : {}),
      ...(payload.status !== undefined ? { status: payload.status as TaskStatus } : {}),
      ...(payload.type !== undefined ? { type: payload.type as TaskType } : {}),
      ...(payload.assigneeId !== undefined ? { assigneeId: payload.assigneeId } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
    },
  });
}

export async function softDeleteTaskService(id: string) {
  const resolvedId = await resolveTaskId(id);
  await prisma.task.update({ where: { id: resolvedId }, data: { deletedAt: new Date() } });
  return { id: resolvedId };
}

