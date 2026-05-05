import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";

import { createCrmActivitySchema, listCrmActivitiesQuerySchema } from "./schema";

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveCrmActivityId(id: string) {
  const row = await prisma.crmActivity.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "CRM activity not found");
  return row.id;
}

const listSelect = {
  id: true,
  customerId: true,
  type: true,
  title: true,
  status: true,
  activityAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, code: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
} as const;

export async function listCrmActivitiesService(filters: z.infer<typeof listCrmActivitiesQuerySchema>) {
  const where: {
    deletedAt: null;
    customerId?: string;
    type?: "call" | "email" | "meeting" | "note";
    status?: "scheduled" | "done";
  } = { deletedAt: null };
  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;

  return prisma.crmActivity.findMany({
    where,
    orderBy: { activityAt: "desc" },
    select: listSelect,
  });
}

export async function getCrmActivityDetailService(id: string) {
  const resolvedId = await resolveCrmActivityId(id);
  const row = await prisma.crmActivity.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: listSelect,
  });
  if (!row) throw new HttpError(404, "CRM activity not found");
  return row;
}

export async function createCrmActivityService(
  payload: z.infer<typeof createCrmActivitySchema> & { createdById: string | null }
) {
  const customerId = await resolveCustomerId(payload.customerId);

  return prisma.crmActivity.create({
    data: {
      customerId,
      type: payload.type,
      title: payload.title,
      status: payload.status,
      activityAt: payload.activityAt,
      createdById: payload.createdById,
    },
    select: listSelect,
  });
}

export async function updateCrmActivityService(id: string, payload: Record<string, unknown>) {
  const resolvedId = await resolveCrmActivityId(id);

  const cid = payload.customerId;
  const newCustomerId =
    typeof cid === "string" && cid !== "" ? await resolveCustomerId(cid) : undefined;

  const data: {
    type?: "call" | "email" | "meeting" | "note";
    title?: string;
    status?: "scheduled" | "done";
    activityAt?: Date;
    customerId?: string;
  } = {};
  if (payload.type !== undefined) data.type = payload.type as "call" | "email" | "meeting" | "note";
  if (payload.title !== undefined) data.title = payload.title as string;
  if (payload.status !== undefined) data.status = payload.status as "scheduled" | "done";
  if (payload.activityAt !== undefined) data.activityAt = payload.activityAt as Date;
  if (newCustomerId !== undefined) data.customerId = newCustomerId;

  if (Object.keys(data).length === 0) {
    return getCrmActivityDetailService(resolvedId);
  }

  await prisma.crmActivity.update({ where: { id: resolvedId }, data });
  return getCrmActivityDetailService(resolvedId);
}

export async function softDeleteCrmActivityService(id: string) {
  const resolvedId = await resolveCrmActivityId(id);
  const now = new Date();
  const n = await prisma.crmActivity.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "CRM activity not found");
  return { id: resolvedId };
}
