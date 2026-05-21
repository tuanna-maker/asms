import { HttpError } from "../../lib/errors/HttpError";
import { ORDER_BY_CREATED_DESC } from "../../lib/list-order";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";

import { createContactSchema, listContactsQuerySchema, updateContactSchema } from "./schema";

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveContactId(id: string) {
  const row = await prisma.contact.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Contact not found");
  return row.id;
}

export async function listContactsService(filters: z.infer<typeof listContactsQuerySchema>) {
  const where: { deletedAt: null; customerId?: string; OR?: object[] } = { deletedAt: null };
  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.search) {
    const s = filters.search;
    where.OR = [
      { fullName: { contains: s, mode: "insensitive" } },
      { email: { contains: s, mode: "insensitive" } },
      { phone: { contains: s, mode: "insensitive" } },
    ];
  }

  return prisma.contact.findMany({
    where,
    orderBy: [{ isPrimary: "desc" }, ORDER_BY_CREATED_DESC],
    select: contactSelect,
  });
}

const contactSelect = {
  id: true,
  customerId: true,
  fullName: true,
  title: true,
  rank: true,
  department: true,
  phone: true,
  email: true,
  birthday: true,
  isPrimary: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, code: true, name: true } },
} as const;

export async function getContactDetailService(id: string) {
  const resolvedId = await resolveContactId(id);
  const row = await prisma.contact.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: contactSelect,
  });
  if (!row) throw new HttpError(404, "Contact not found");
  return row;
}

export async function createContactService(payload: z.infer<typeof createContactSchema>) {
  const customerId = await resolveCustomerId(payload.customerId);
  const isPrimary = payload.isPrimary ?? false;

  return prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.contact.updateMany({
        where: { customerId, deletedAt: null, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    return tx.contact.create({
      data: {
        customerId,
        fullName: payload.fullName,
        title: payload.title ?? null,
        rank: payload.rank ?? null,
        department: payload.department ?? null,
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        birthday: payload.birthday ?? null,
        isPrimary,
        notes: payload.notes ?? null,
      },
      select: contactSelect,
    });
  });
}

export async function updateContactService(id: string, payload: Partial<z.infer<typeof updateContactSchema>>) {
  const resolvedId = await resolveContactId(id);

  const newCustomerId =
    payload.customerId !== undefined ? await resolveCustomerId(payload.customerId) : undefined;

  return prisma.$transaction(async (tx) => {
    const data: {
      fullName?: string;
      title?: string | null;
      rank?: string | null;
      department?: string | null;
      phone?: string | null;
      email?: string | null;
      birthday?: Date | null;
      isPrimary?: boolean;
      notes?: string | null;
      customerId?: string;
    } = {};

    if (payload.fullName !== undefined) data.fullName = payload.fullName;
    if (payload.title !== undefined) data.title = payload.title ?? null;
    if (payload.rank !== undefined) data.rank = payload.rank ?? null;
    if (payload.department !== undefined) data.department = payload.department ?? null;
    if (payload.phone !== undefined) data.phone = payload.phone ?? null;
    if (payload.email !== undefined) data.email = payload.email ?? null;
    if (payload.birthday !== undefined) data.birthday = payload.birthday ?? null;
    if (payload.isPrimary !== undefined) data.isPrimary = payload.isPrimary;
    if (payload.notes !== undefined) data.notes = payload.notes ?? null;
    if (newCustomerId !== undefined) data.customerId = newCustomerId;

    if (Object.keys(data).length > 0) {
      await tx.contact.update({ where: { id: resolvedId }, data });
    }

    const row = await tx.contact.findFirstOrThrow({
      where: { id: resolvedId, deletedAt: null },
      select: { customerId: true },
    });

    if (payload.isPrimary === true) {
      await tx.contact.updateMany({
        where: { customerId: row.customerId, deletedAt: null, id: { not: resolvedId }, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const out = await tx.contact.findFirst({
      where: { id: resolvedId, deletedAt: null },
      select: contactSelect,
    });
    if (!out) throw new HttpError(404, "Contact not found");
    return out;
  });
}

export async function softDeleteContactService(id: string) {
  const resolvedId = await resolveContactId(id);
  const now = new Date();
  const updated = await prisma.contact.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (updated.count === 0) throw new HttpError(404, "Contact not found");
  return { id: resolvedId };
}
