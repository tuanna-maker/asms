import type { AnniversaryType, Prisma } from "@prisma/client";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import {
  createAnniversarySchema,
  updateAnniversarySchema,
} from "./schema";

const SELECT = {
  id: true,
  customerId: true,
  type: true,
  label: true,
  occursAt: true,
  recurringYearly: true,
  reminderDays: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, code: true, name: true } },
} satisfies Prisma.CustomerAnniversarySelect;

function nextOccurrence(date: Date, recurring: boolean, now: Date): Date {
  if (!recurring) return date;
  const occ = new Date(date);
  const year = now.getFullYear();
  occ.setFullYear(year);
  if (occ.getTime() < now.getTime()) {
    occ.setFullYear(year + 1);
  }
  return occ;
}

export async function listAnniversariesService(filters: {
  customerId?: string;
  type?: string;
  upcoming?: number;
}) {
  const where: Prisma.CustomerAnniversaryWhereInput = {};
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.type) where.type = filters.type as AnniversaryType;
  const rows = await prisma.customerAnniversary.findMany({
    where,
    orderBy: { occursAt: "asc" },
    select: SELECT,
  });
  if (filters.upcoming === undefined) return rows;

  const now = new Date();
  const horizon = new Date(now.getTime() + filters.upcoming * 24 * 60 * 60 * 1000);
  return rows
    .map((row) => {
      const next = nextOccurrence(row.occursAt, row.recurringYearly, now);
      return { ...row, nextOccurrence: next };
    })
    .filter((row) => row.nextOccurrence.getTime() <= horizon.getTime())
    .sort((a, b) => a.nextOccurrence.getTime() - b.nextOccurrence.getTime());
}

export async function createAnniversaryService(
  payload: z.infer<typeof createAnniversarySchema>,
) {
  const customer = await prisma.customer.findUnique({
    where: { id: payload.customerId },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Không tìm thấy khách hàng");
  return prisma.customerAnniversary.create({
    data: {
      customerId: payload.customerId,
      type: payload.type ?? "other",
      label: payload.label,
      occursAt: payload.occursAt,
      ...(payload.recurringYearly !== undefined ? { recurringYearly: payload.recurringYearly } : {}),
      ...(payload.reminderDays !== undefined ? { reminderDays: payload.reminderDays } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
    select: SELECT,
  });
}

export async function updateAnniversaryService(
  id: string,
  payload: z.infer<typeof updateAnniversarySchema>,
) {
  const row = await prisma.customerAnniversary.findUnique({ where: { id } });
  if (!row) throw new HttpError(404, "Không tìm thấy");
  return prisma.customerAnniversary.update({
    where: { id },
    data: {
      ...(payload.type !== undefined ? { type: payload.type } : {}),
      ...(payload.label !== undefined ? { label: payload.label } : {}),
      ...(payload.occursAt !== undefined ? { occursAt: payload.occursAt } : {}),
      ...(payload.recurringYearly !== undefined ? { recurringYearly: payload.recurringYearly } : {}),
      ...(payload.reminderDays !== undefined ? { reminderDays: payload.reminderDays } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
    },
    select: SELECT,
  });
}

export async function deleteAnniversaryService(id: string) {
  await prisma.customerAnniversary.delete({ where: { id } }).catch(() => {
    throw new HttpError(404, "Không tìm thấy");
  });
  return { id };
}
