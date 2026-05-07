import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";

import { createCustomerSchema, listCustomersQuerySchema, updateCustomerSchema } from "./schema";

function genCustomerCode() {
  return `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

function buildCustomerWhere(filters: { search?: string }) {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (filters.search) {
    const s = filters.search;
    where.OR = [{ code: { contains: s, mode: "insensitive" } }, { name: { contains: s, mode: "insensitive" } }];
  }
  return where;
}

export async function listCustomersService(filters: z.infer<typeof listCustomersQuerySchema>) {
  const search = (filters as { search?: string }).search;
  const where = buildCustomerWhere(search !== undefined ? { search } : {});
  return prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      contactName: true,
      phone: true,
      email: true,
      address: true,
      contractsCount: true,
      activeContracts: true,
    },
  });
}

export async function getCustomerDetailService(id: string) {
  const resolvedId = await resolveCustomerId(id);
  const customer = await prisma.customer.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      contacts: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
      },
      contracts: {
        where: { deletedAt: null },
        select: { id: true, code: true, title: true, status: true, value: true, startDate: true, endDate: true, progress: true },
      },
    },
  });

  if (!customer) throw new HttpError(404, "Customer not found");
  return customer;
}

export async function createCustomerService(payload: z.infer<typeof createCustomerSchema>) {
  return prisma.customer.create({
    data: {
      code: payload.code ?? genCustomerCode(),
      name: payload.name,
      contactName: payload.contactName ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      contactName: true,
      phone: true,
      email: true,
      address: true,
      contractsCount: true,
      activeContracts: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateCustomerService(id: string, payload: Partial<z.infer<typeof updateCustomerSchema>>) {
  const resolvedId = await resolveCustomerId(id);
  const updated = await prisma.customer.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: {
      ...(payload.code !== undefined ? { code: payload.code } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.contactName !== undefined ? { contactName: payload.contactName } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
    },
  });

  if (updated.count === 0) throw new HttpError(404, "Customer not found");

  return getCustomerDetailService(resolvedId);
}

export async function softDeleteCustomerService(id: string) {
  const resolvedId = await resolveCustomerId(id);

  const now = new Date();
  await prisma.$transaction([
    prisma.customer.update({ where: { id: resolvedId }, data: { deletedAt: now } }),
    prisma.contact.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.crmActivity.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.contract.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.handover.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.warranty.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.product.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.trainingCourse.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.document.updateMany({ where: { customerId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
  ]);

  return { id: resolvedId };
}

