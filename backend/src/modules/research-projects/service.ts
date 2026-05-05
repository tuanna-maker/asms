import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";

import { createResearchProjectSchema, listResearchProjectsQuerySchema } from "./schema";

async function resolveResearchProjectId(idOrCode: string) {
  const row = await prisma.researchProject.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Research project not found");
  return row.id;
}

const listSelect = {
  id: true,
  code: true,
  name: true,
  department: true,
  fundingSource: true,
  startDate: true,
  endDate: true,
  status: true,
  progress: true,
  budget: true,
  budgetSpent: true,
  description: true,
  createdAt: true,
  updatedAt: true,
  manager: { select: { id: true, fullName: true } },
  _count: { select: { tasks: true } },
} as const;

export async function listResearchProjectsService(filters: z.infer<typeof listResearchProjectsQuerySchema>) {
  const where: Prisma.ResearchProjectWhereInput = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { name: { contains: s, mode: "insensitive" } },
      { code: { contains: s, mode: "insensitive" } },
    ];
  }

  return prisma.researchProject.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    select: listSelect,
  });
}

export async function getResearchProjectDetailService(idOrCode: string) {
  const resolvedId = await resolveResearchProjectId(idOrCode);
  const row = await prisma.researchProject.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: {
      ...listSelect,
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          status: true,
          progress: true,
          priority: true,
          startDate: true,
          deadline: true,
          assignee: { select: { id: true, fullName: true } },
        },
      },
    },
  });
  if (!row) throw new HttpError(404, "Research project not found");
  return row;
}

export async function createResearchProjectService(payload: z.infer<typeof createResearchProjectSchema>) {
  return prisma.researchProject.create({
    data: {
      code: payload.code,
      name: payload.name,
      department: payload.department ?? null,
      fundingSource: payload.fundingSource ?? null,
      startDate: payload.startDate,
      endDate: payload.endDate,
      description: payload.description ?? null,
      ...(payload.managerId ? { managerId: payload.managerId } : {}),
    },
    select: listSelect,
  });
}

export async function updateResearchProjectService(idOrCode: string, payload: Record<string, unknown>) {
  const resolvedId = await resolveResearchProjectId(idOrCode);

  const data: Record<string, unknown> = {};
  if (payload.code !== undefined) data.code = payload.code;
  if (payload.name !== undefined) data.name = payload.name;
  if (payload.department !== undefined) data.department = payload.department;
  if (payload.fundingSource !== undefined) data.fundingSource = payload.fundingSource;
  if (payload.startDate !== undefined) data.startDate = payload.startDate;
  if (payload.endDate !== undefined) data.endDate = payload.endDate;
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.progress !== undefined) data.progress = payload.progress;
  if (payload.managerId !== undefined) data.managerId = payload.managerId;
  if (payload.budget !== undefined) data.budget = payload.budget;
  if (payload.budgetSpent !== undefined) data.budgetSpent = payload.budgetSpent;

  if (Object.keys(data).length > 0) {
    await prisma.researchProject.update({ where: { id: resolvedId }, data: data as object });
  }

  return getResearchProjectDetailService(resolvedId);
}

export async function softDeleteResearchProjectService(idOrCode: string) {
  const resolvedId = await resolveResearchProjectId(idOrCode);
  const now = new Date();
  const n = await prisma.researchProject.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "Research project not found");
  await prisma.task.updateMany({
    where: { projectId: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  return { id: resolvedId };
}
