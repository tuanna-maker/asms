import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

function genWarrantyCode() {
  return `WRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveCustomerId(idOrCode: string) {
  const customer = await prisma.customer.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!customer) throw new HttpError(404, "Customer not found");
  return customer.id;
}

async function resolveProductIdOptional(idOrCode: string | undefined | null) {
  if (idOrCode == null || idOrCode === "") return null;
  const product = await prisma.product.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!product) throw new HttpError(404, "Product not found");
  return product.id;
}

async function resolveWarrantyId(idOrCode: string) {
  const row = await prisma.warranty.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!row) throw new HttpError(404, "Warranty ticket not found");
  return row.id;
}

export async function listWarrantiesService(filters: {
  status?: string;
  type?: string;
  customerId?: string;
  productId?: string;
}) {
  const where: Record<string, unknown> = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.customerId) {
    where.customerId = await resolveCustomerId(filters.customerId);
  }
  if (filters.productId) {
    where.productId = await resolveProductIdOptional(filters.productId);
  }

  return prisma.warranty.findMany({
    where: where as { deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      code: true,
      contractId: true,
      customerId: true,
      productId: true,
      createdAt: true,
      issue: true,
      source: true,
      type: true,
      priority: true,
      status: true,
      workflowStep: true,
      slaHours: true,
      resolvedAt: true,
      customer: { select: { id: true, code: true, name: true } },
      product: { select: { id: true, code: true, name: true } },
      assignee: { select: { id: true, fullName: true, role: { select: { code: true } } } },
    },
  });
}

export async function getWarrantyDetailService(id: string) {
  const resolvedId = await resolveWarrantyId(id);
  const ticket = await prisma.warranty.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      customer: true,
      product: true,
      contract: { include: { customer: true } },
      assignee: { include: { role: true } },
    },
  });

  if (!ticket) throw new HttpError(404, "Warranty ticket not found");
  return ticket;
}

export async function createWarrantyService(payload: {
  contractId?: string;
  customerId: string;
  productId?: string;
  assigneeId?: string;
  issue: string;
  source?: string;
  type: string;
  priority?: string;
  status?: string;
  workflowStep?: number;
  slaHours?: number;
  resolvedAt?: Date;
}) {
  const customerId = await resolveCustomerId(payload.customerId);
  const productId = await resolveProductIdOptional(payload.productId);

  return prisma.warranty.create({
    data: {
      code: genWarrantyCode(),
      contractId: payload.contractId ?? null,
      customerId,
      productId,
      assigneeId: payload.assigneeId ?? null,
      issue: payload.issue,
      source: payload.source ?? null,
      type: payload.type as "warranty" | "repair" | "maintenance",
      resolvedAt: payload.resolvedAt ?? null,
      ...(payload.priority !== undefined ? { priority: payload.priority as "low" | "medium" | "high" | "urgent" } : {}),
      ...(payload.status !== undefined ? { status: payload.status as "open" | "processing" | "completed" | "cancelled" } : {}),
      ...(payload.workflowStep !== undefined ? { workflowStep: payload.workflowStep } : {}),
      ...(payload.slaHours !== undefined ? { slaHours: payload.slaHours } : {}),
    },
  });
}

export async function updateWarrantyService(id: string, payload: Record<string, unknown>) {
  const resolvedId = await resolveWarrantyId(id);
  const existing = await prisma.warranty.findFirst({
    where: { id: resolvedId, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, "Warranty ticket not found");

  const customerId =
    payload.customerId !== undefined && typeof payload.customerId === "string"
      ? await resolveCustomerId(payload.customerId)
      : undefined;
  const productId =
    payload.productId !== undefined
      ? await resolveProductIdOptional(
          typeof payload.productId === "string" ? payload.productId : String(payload.productId ?? "")
        )
      : undefined;

  return prisma.warranty.update({
    where: { id: resolvedId },
    data: {
      ...(payload.contractId !== undefined ? { contractId: payload.contractId as string | null } : {}),
      ...(customerId !== undefined ? { customerId } : {}),
      ...(productId !== undefined ? { productId } : {}),
      ...(payload.assigneeId !== undefined ? { assigneeId: payload.assigneeId as string | null } : {}),
      ...(payload.issue !== undefined ? { issue: payload.issue as string } : {}),
      ...(payload.source !== undefined ? { source: payload.source as string | null } : {}),
      ...(payload.type !== undefined ? { type: payload.type as "warranty" | "repair" | "maintenance" } : {}),
      ...(payload.priority !== undefined ? { priority: payload.priority as "low" | "medium" | "high" | "urgent" } : {}),
      ...(payload.status !== undefined ? { status: payload.status as "open" | "processing" | "completed" | "cancelled" } : {}),
      ...(payload.workflowStep !== undefined ? { workflowStep: payload.workflowStep as number } : {}),
      ...(payload.slaHours !== undefined ? { slaHours: payload.slaHours as number } : {}),
      ...(payload.resolvedAt !== undefined ? { resolvedAt: payload.resolvedAt as Date | null } : {}),
    },
  });
}

export async function softDeleteWarrantyService(id: string) {
  const resolvedId = await resolveWarrantyId(id);
  const existing = await prisma.warranty.findFirst({ where: { id: resolvedId, deletedAt: null }, select: { id: true } });
  if (!existing) throw new HttpError(404, "Warranty ticket not found");

  await prisma.warranty.update({ where: { id: resolvedId }, data: { deletedAt: new Date() } });
  return { id: resolvedId };
}
