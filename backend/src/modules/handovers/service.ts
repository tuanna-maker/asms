import type { HandoverStatus, Prisma } from "@prisma/client";
import type { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import { createHandoverSchema } from "./schema";

function genHandoverCode() {
  return `BG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveContractId(idOrCode: string) {
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract.id;
}

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveHandoverId(idOrCode: string) {
  const row = await prisma.handover.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Handover not found");
  return row.id;
}

const listSelect = {
  id: true,
  code: true,
  contractId: true,
  customerId: true,
  products: true,
  currentStep: true,
  status: true,
  startDate: true,
  dueDate: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  contract: { select: { id: true, code: true, title: true } },
  customer: { select: { id: true, code: true, name: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.HandoverSelect;

export async function listHandoversService(filters: {
  status?: string;
  customerId?: string;
  contractId?: string;
  search?: string;
}) {
  const where: Prisma.HandoverWhereInput = {
    deletedAt: null,
    ...(filters.status ? { status: filters.status as HandoverStatus } : {}),
  };

  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.contractId) {
    where.contractId = await resolveContractId(filters.contractId);
  }
  if (filters.search) {
    const s = filters.search.trim();
    if (s.length > 0) {
      where.OR = [
        { code: { contains: s, mode: "insensitive" } },
        { contract: { code: { contains: s, mode: "insensitive" } } },
        { customer: { name: { contains: s, mode: "insensitive" } } },
      ];
    }
  }

  return prisma.handover.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: listSelect,
  });
}

export async function getHandoverDetailService(idOrCode: string) {
  const resolvedId = await resolveHandoverId(idOrCode);
  const row = await prisma.handover.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      contract: true,
      customer: true,
      createdBy: { include: { role: true } },
    },
  });
  if (!row) throw new HttpError(404, "Handover not found");
  return row;
}

type CreateHandoverInput = z.infer<typeof createHandoverSchema>;

export async function createHandoverService(payload: CreateHandoverInput, actorId?: string | null) {
  const resolvedContractId = await resolveContractId(payload.contractId);
  const contract = await prisma.contract.findFirst({
    where: { id: resolvedContractId, deletedAt: null },
    select: { id: true, customerId: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");

  const startDate = payload.startDate ?? new Date();
  const dueDate =
    payload.dueDate ?? new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  return prisma.handover.create({
    data: {
      code: genHandoverCode(),
      contractId: contract.id,
      customerId: contract.customerId,
      createdById: actorId ?? null,
      products: payload.products,
      currentStep: payload.currentStep ?? 1,
      status: (payload.status ?? "pending") as "pending" | "active" | "completed" | "late",
      startDate,
      dueDate,
    },
    select: listSelect,
  });
}

export async function updateHandoverService(idOrCode: string, payload: Record<string, unknown>) {
  const resolvedId = await resolveHandoverId(idOrCode);

  const data: Record<string, unknown> = {};
  if (payload.products !== undefined) data.products = payload.products;
  if (payload.currentStep !== undefined) data.currentStep = payload.currentStep;
  if (payload.status !== undefined) data.status = payload.status;
  if (payload.startDate !== undefined) data.startDate = payload.startDate;
  if (payload.dueDate !== undefined) data.dueDate = payload.dueDate;
  if (payload.completedAt !== undefined) data.completedAt = payload.completedAt;

  if (Object.keys(data).length > 0) {
    await prisma.handover.update({ where: { id: resolvedId }, data: data as object });
  }

  const row = await prisma.handover.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: listSelect,
  });
  if (!row) throw new HttpError(404, "Handover not found");
  return row;
}

export async function softDeleteHandoverService(idOrCode: string) {
  const resolvedId = await resolveHandoverId(idOrCode);
  const now = new Date();
  const n = await prisma.handover.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "Handover not found");
  return { id: resolvedId };
}
