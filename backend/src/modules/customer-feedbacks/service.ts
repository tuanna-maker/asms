import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

import type { z } from "zod";

import {
  createCustomerFeedbackSchema,
  listCustomerFeedbacksQuerySchema,
} from "./schema";

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveContractId(idOrCode: string) {
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true, customerId: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract;
}

async function resolveWarrantyId(idOrCode: string) {
  const warranty = await prisma.warranty.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true, customerId: true },
  });
  if (!warranty) throw new HttpError(404, "Warranty not found");
  return warranty;
}

async function resolveCustomerFeedbackId(id: string) {
  const row = await prisma.customerFeedback.findFirst({
    where: { id, deletedAt: null },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Customer feedback not found");
  return row.id;
}

const listSelect = {
  id: true,
  customerId: true,
  contractId: true,
  warrantyId: true,
  title: true,
  content: true,
  severity: true,
  status: true,
  feedbackAt: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  customer: { select: { id: true, code: true, name: true } },
  contract: { select: { id: true, code: true, title: true } },
  warranty: { select: { id: true, code: true, issue: true } },
  createdBy: { select: { id: true, fullName: true } },
} as const;

export async function listCustomerFeedbacksService(
  filters: z.infer<typeof listCustomerFeedbacksQuerySchema>,
) {
  const where: {
    deletedAt: null;
    customerId?: string;
    contractId?: string;
    warrantyId?: string;
    severity?: "low" | "medium" | "high";
    status?: "new" | "processing" | "resolved";
  } = { deletedAt: null };

  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.contractId) {
    const contract = await resolveContractId(filters.contractId);
    where.contractId = contract.id;
  }
  if (filters.warrantyId) {
    const warranty = await resolveWarrantyId(filters.warrantyId);
    where.warrantyId = warranty.id;
  }
  if (filters.severity) where.severity = filters.severity;
  if (filters.status) where.status = filters.status;

  return prisma.customerFeedback.findMany({
    where,
    orderBy: { feedbackAt: "desc" },
    select: listSelect,
  });
}

export async function getCustomerFeedbackDetailService(id: string) {
  const resolvedId = await resolveCustomerFeedbackId(id);
  const row = await prisma.customerFeedback.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: listSelect,
  });
  if (!row) throw new HttpError(404, "Customer feedback not found");
  return row;
}

export async function createCustomerFeedbackService(
  payload: z.infer<typeof createCustomerFeedbackSchema> & { createdById: string | null },
) {
  const customerId = await resolveCustomerId(payload.customerId);

  let contractId: string | null = null;
  if (payload.contractId) {
    const contract = await resolveContractId(payload.contractId);
    if (contract.customerId !== customerId) {
      throw new HttpError(400, "Hợp đồng không thuộc khách hàng này");
    }
    contractId = contract.id;
  }

  let warrantyId: string | null = null;
  if (payload.warrantyId) {
    const warranty = await resolveWarrantyId(payload.warrantyId);
    if (warranty.customerId !== customerId) {
      throw new HttpError(400, "Phiếu bảo hành không thuộc khách hàng này");
    }
    warrantyId = warranty.id;
  }

  return prisma.customerFeedback.create({
    data: {
      customerId,
      contractId,
      warrantyId,
      title: payload.title,
      content: payload.content,
      severity: payload.severity,
      status: payload.status,
      feedbackAt: payload.feedbackAt,
      createdById: payload.createdById,
    },
    select: listSelect,
  });
}

export async function updateCustomerFeedbackService(id: string, payload: Record<string, unknown>) {
  const resolvedId = await resolveCustomerFeedbackId(id);

  const existing = await prisma.customerFeedback.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: { customerId: true },
  });
  if (!existing) throw new HttpError(404, "Customer feedback not found");

  const data: {
    title?: string;
    content?: string;
    severity?: "low" | "medium" | "high";
    status?: "new" | "processing" | "resolved";
    feedbackAt?: Date;
    customerId?: string;
    contractId?: string | null;
    warrantyId?: string | null;
  } = {};

  let customerId = existing.customerId;
  if (payload.customerId !== undefined && typeof payload.customerId === "string") {
    customerId = await resolveCustomerId(payload.customerId);
    data.customerId = customerId;
  }

  if (payload.contractId !== undefined) {
    if (payload.contractId === null || payload.contractId === "") {
      data.contractId = null;
    } else if (typeof payload.contractId === "string") {
      const contract = await resolveContractId(payload.contractId);
      if (contract.customerId !== customerId) {
        throw new HttpError(400, "Hợp đồng không thuộc khách hàng này");
      }
      data.contractId = contract.id;
    }
  }

  if (payload.warrantyId !== undefined) {
    if (payload.warrantyId === null || payload.warrantyId === "") {
      data.warrantyId = null;
    } else if (typeof payload.warrantyId === "string") {
      const warranty = await resolveWarrantyId(payload.warrantyId);
      if (warranty.customerId !== customerId) {
        throw new HttpError(400, "Phiếu bảo hành không thuộc khách hàng này");
      }
      data.warrantyId = warranty.id;
    }
  }

  if (payload.title !== undefined) data.title = payload.title as string;
  if (payload.content !== undefined) data.content = payload.content as string;
  if (payload.severity !== undefined) data.severity = payload.severity as "low" | "medium" | "high";
  if (payload.status !== undefined) data.status = payload.status as "new" | "processing" | "resolved";
  if (payload.feedbackAt !== undefined) data.feedbackAt = payload.feedbackAt as Date;

  if (Object.keys(data).length === 0) {
    return getCustomerFeedbackDetailService(resolvedId);
  }

  await prisma.customerFeedback.update({ where: { id: resolvedId }, data });
  return getCustomerFeedbackDetailService(resolvedId);
}

export async function softDeleteCustomerFeedbackService(id: string) {
  const resolvedId = await resolveCustomerFeedbackId(id);
  const now = new Date();
  const n = await prisma.customerFeedback.updateMany({
    where: { id: resolvedId, deletedAt: null },
    data: { deletedAt: now },
  });
  if (n.count === 0) throw new HttpError(404, "Customer feedback not found");
  return { id: resolvedId };
}
