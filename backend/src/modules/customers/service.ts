import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";

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

function buildCustomerWhere(filters: {
  search?: string;
  sourceCode?: string;
  companyTypeCode?: string;
  createdFrom?: Date;
  createdTo?: Date;
}) {
  const where: Prisma.CustomerWhereInput = { deletedAt: null };
  if (filters.search) {
    const s = filters.search;
    where.OR = [{ code: { contains: s, mode: "insensitive" } }, { name: { contains: s, mode: "insensitive" } }];
  }
  if (filters.sourceCode) where.sourceCode = filters.sourceCode;
  if (filters.companyTypeCode) where.companyTypeCode = filters.companyTypeCode;
  if (filters.createdFrom || filters.createdTo) {
    where.createdAt = {
      ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
      ...(filters.createdTo ? { lte: filters.createdTo } : {}),
    };
  }
  return where;
}

export async function listCustomersService(filters: z.infer<typeof listCustomersQuerySchema>) {
  const where = buildCustomerWhere({
    ...(filters.search !== undefined ? { search: filters.search } : {}),
    ...(filters.sourceCode !== undefined ? { sourceCode: filters.sourceCode } : {}),
    ...(filters.companyTypeCode !== undefined ? { companyTypeCode: filters.companyTypeCode } : {}),
    ...(filters.createdFrom !== undefined ? { createdFrom: filters.createdFrom } : {}),
    ...(filters.createdTo !== undefined ? { createdTo: filters.createdTo } : {}),
  });
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
      sourceCode: true,
      companyTypeCode: true,
      foundedAt: true,
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
        select: {
          id: true,
          code: true,
          title: true,
          status: true,
          value: true,
          startDate: true,
          endDate: true,
          progress: true,
        },
      },
      crmActivities: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      warranties: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          code: true,
          issue: true,
          status: true,
          statusCode: true,
          priority: true,
          priorityCode: true,
          createdAt: true,
          resolvedAt: true,
        },
      },
      anniversaries: {
        orderBy: { occursAt: "asc" },
      },
    },
  });

  if (!customer) throw new HttpError(404, "Customer not found");

  const openWarranties = await prisma.warranty.count({
    where: {
      customerId: resolvedId,
      deletedAt: null,
      statusCode: { in: ["open", "processing"] },
    },
  });

  const revenueAggregate = await prisma.contract.aggregate({
    where: { customerId: resolvedId, deletedAt: null, status: { in: ["active", "completed"] } },
    _sum: { value: true },
  });
  const totalActive = await prisma.contract.aggregate({
    where: { customerId: resolvedId, deletedAt: null, status: "active" },
    _sum: { value: true },
  });
  const totalAllContracts = await prisma.contract.aggregate({
    where: { customerId: resolvedId, deletedAt: null },
    _sum: { value: true },
  });

  const costBreakdown = customer.contracts.map((c) => ({
    id: c.id,
    code: c.code,
    title: c.title,
    status: c.status,
    value: Number(c.value),
    startDate: c.startDate,
    endDate: c.endDate,
    progress: c.progress,
  }));

  return {
    ...customer,
    summary: {
      totalContracts: customer.contracts.length,
      activeContracts: customer.contracts.filter((c) => c.status === "active").length,
      revenueTotal: Number(revenueAggregate._sum.value ?? 0),
      activeContractValue: Number(totalActive._sum.value ?? 0),
      totalContractValue: Number(totalAllContracts._sum.value ?? 0),
      openWarranties,
      expenseTotal: customer.expenseTotal ? Number(customer.expenseTotal) : 0,
    },
    costBreakdown,
  };
}

export async function createCustomerService(payload: z.infer<typeof createCustomerSchema>) {
  if (payload.sourceCode) {
    await assertActiveDefinitionCode("customer_source", payload.sourceCode, "Nguồn giới thiệu");
  }
  if (payload.companyTypeCode) {
    await assertActiveDefinitionCode("company_type", payload.companyTypeCode, "Loại công ty");
  }

  return prisma.customer.create({
    data: {
      code: payload.code ?? genCustomerCode(),
      name: payload.name,
      contactName: payload.contactName ?? null,
      phone: payload.phone ?? null,
      email: payload.email ?? null,
      address: payload.address ?? null,
      sourceCode: payload.sourceCode ?? null,
      companyTypeCode: payload.companyTypeCode ?? null,
      foundedAt: payload.foundedAt ?? null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      contactName: true,
      phone: true,
      email: true,
      address: true,
      sourceCode: true,
      companyTypeCode: true,
      foundedAt: true,
      contractsCount: true,
      activeContracts: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateCustomerService(id: string, payload: Partial<z.infer<typeof updateCustomerSchema>>) {
  const resolvedId = await resolveCustomerId(id);

  if (payload.sourceCode !== undefined && payload.sourceCode !== null) {
    await assertActiveDefinitionCode("customer_source", String(payload.sourceCode), "Nguồn giới thiệu");
  }
  if (payload.companyTypeCode !== undefined && payload.companyTypeCode !== null) {
    await assertActiveDefinitionCode("company_type", String(payload.companyTypeCode), "Loại công ty");
  }

  const updated = await prisma.customer.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: {
      ...(payload.code !== undefined ? { code: payload.code } : {}),
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.contactName !== undefined ? { contactName: payload.contactName } : {}),
      ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
      ...(payload.email !== undefined ? { email: payload.email } : {}),
      ...(payload.address !== undefined ? { address: payload.address } : {}),
      ...(payload.sourceCode !== undefined ? { sourceCode: payload.sourceCode } : {}),
      ...(payload.companyTypeCode !== undefined ? { companyTypeCode: payload.companyTypeCode } : {}),
      ...(payload.foundedAt !== undefined ? { foundedAt: payload.foundedAt } : {}),
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

