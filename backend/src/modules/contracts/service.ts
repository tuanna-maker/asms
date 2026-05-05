import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

function genContractCode() {
  return `HD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveContractId(idOrCode: string) {
  const contract = await prisma.contract.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract.id;
}

export async function listContractsService(filters: {
  status?: string;
  customerId?: string;
  search?: string;
}) {
  const where: any = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.search) {
    const s = filters.search;
    where.OR = [{ code: { contains: s, mode: "insensitive" } }, { title: { contains: s, mode: "insensitive" } }];
  }

  return prisma.contract.findMany({
    where,
    orderBy: { startDate: "desc" },
    select: {
      id: true,
      code: true,
      title: true,
      value: true,
      products: true,
      startDate: true,
      endDate: true,
      warrantyEnd: true,
      status: true,
      progress: true,
      customerId: true,
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function getContractDetailService(id: string) {
  const resolvedId = await resolveContractId(id);
  const contract = await prisma.contract.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      customer: { select: { id: true, code: true, name: true } },
      handovers: { where: { deletedAt: null } },
      warranties: { where: { deletedAt: null } },
      productsList: { where: { deletedAt: null } },
      trainingCourses: { where: { deletedAt: null } },
      documents: { where: { deletedAt: null } },
    },
  });
  if (!contract) throw new HttpError(404, "Contract not found");
  return contract;
}

export async function createContractService(payload: {
  customerId: string;
  title: string;
  value: number;
  products: number;
  startDate: Date;
  endDate: Date;
  warrantyEnd?: Date;
  status?: string;
  progress?: number;
  createdById: string;
}) {
  return prisma.contract.create({
    data: {
      code: genContractCode(),
      customerId: payload.customerId,
      createdById: payload.createdById,
      title: payload.title,
      value: payload.value as any,
      products: payload.products,
      startDate: payload.startDate,
      endDate: payload.endDate,
      warrantyEnd: payload.warrantyEnd ?? null,
      ...(payload.status !== undefined ? { status: payload.status as any } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function updateContractService(id: string, payload: any) {
  const resolvedId = await resolveContractId(id);

  return prisma.contract.update({
    where: { id: resolvedId },
    data: {
      ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.value !== undefined ? { value: payload.value as any } : {}),
      ...(payload.products !== undefined ? { products: payload.products } : {}),
      ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
      ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
      ...(payload.warrantyEnd !== undefined ? { warrantyEnd: payload.warrantyEnd } : {}),
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.progress !== undefined ? { progress: payload.progress } : {}),
    },
    include: {
      customer: { select: { id: true, code: true, name: true } },
    },
  });
}

export async function softDeleteContractService(id: string) {
  const resolvedId = await resolveContractId(id);

  const now = new Date();
  await prisma.$transaction([
    prisma.handover.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.warranty.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.product.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.trainingCourse.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.document.updateMany({ where: { contractId: resolvedId, deletedAt: null }, data: { deletedAt: now } }),
    prisma.contract.update({ where: { id: resolvedId }, data: { deletedAt: now } }),
  ]);

  return { id: resolvedId };
}

