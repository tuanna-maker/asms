import { HttpError } from "../../lib/errors/HttpError";
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
    orderBy: [{ isPrimary: "desc" }, { fullName: "asc" }],
    select: {
      id: true,
      customerId: true,
      fullName: true,
      title: true,
      phone: true,
      email: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function getContactDetailService(id: string) {
  const resolvedId = await resolveContactId(id);
  const row = await prisma.contact.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: {
      id: true,
      customerId: true,
      fullName: true,
      title: true,
      phone: true,
      email: true,
      isPrimary: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, code: true, name: true } },
    },
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
        phone: payload.phone ?? null,
        email: payload.email ?? null,
        isPrimary,
      },
      select: {
        id: true,
        customerId: true,
        fullName: true,
        title: true,
        phone: true,
        email: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, code: true, name: true } },
      },
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
      phone?: string | null;
      email?: string | null;
      isPrimary?: boolean;
      customerId?: string;
    } = {};

    if (payload.fullName !== undefined) data.fullName = payload.fullName;
    if (payload.title !== undefined) data.title = payload.title ?? null;
    if (payload.phone !== undefined) data.phone = payload.phone ?? null;
    if (payload.email !== undefined) data.email = payload.email ?? null;
    if (payload.isPrimary !== undefined) data.isPrimary = payload.isPrimary;
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
      select: {
        id: true,
        customerId: true,
        fullName: true,
        title: true,
        phone: true,
        email: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        customer: { select: { id: true, code: true, name: true } },
      },
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
