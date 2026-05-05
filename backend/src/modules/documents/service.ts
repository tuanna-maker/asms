import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

function genDocumentCode() {
  return `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveDocumentId(idOrCode: string) {
  const doc = await prisma.document.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc.id;
}

export async function listDocumentsService(filters: {
  category?: string;
  fileType?: string;
  ownerId?: string;
  customerId?: string;
  contractId?: string;
  productId?: string;
  projectId?: string;
  trainingCourseId?: string;
  name?: string;
}) {
  const where: any = { deletedAt: null };
  if (filters.category) where.category = filters.category;
  if (filters.fileType) where.fileType = filters.fileType;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.contractId) where.contractId = filters.contractId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.trainingCourseId) where.trainingCourseId = filters.trainingCourseId;
  if (filters.name) {
    const s = filters.name;
    where.name = { contains: s, mode: "insensitive" };
  }

  return prisma.document.findMany({
    where,
    orderBy: { uploadedAt: "desc" },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      fileType: true,
      fileSize: true,
      fileUrl: true,
      tags: true,
      description: true,
      uploadedAt: true,
      ownerId: true,
      owner: { select: { id: true, fullName: true } },
      customerId: true,
      contractId: true,
      productId: true,
      projectId: true,
      trainingCourseId: true,
    },
  });
}

export async function getDocumentDetailService(id: string) {
  const resolvedId = await resolveDocumentId(id);
  const doc = await prisma.document.findFirst({
    where: { id: resolvedId, deletedAt: null },
    include: {
      owner: { select: { id: true, fullName: true, email: true, role: { select: { code: true } } } },
      customer: { select: { id: true, code: true, name: true } },
      contract: { select: { id: true, code: true, title: true, status: true } },
      product: { select: { id: true, code: true, name: true, category: true } },
      project: { select: { id: true, code: true, name: true } },
      trainingCourse: { select: { id: true, code: true, title: true, type: true, status: true } },
    },
  });

  if (!doc) throw new HttpError(404, "Document not found");
  return doc;
}

export async function createDocumentService(payload: {
  ownerId?: string;
  customerId?: string;
  contractId?: string;
  productId?: string;
  projectId?: string;
  trainingCourseId?: string;
  name: string;
  category: string;
  fileType: string;
  tags?: string[];
  description?: string;
  fileSize?: string;
  fileUrl?: string;
}) {
  return prisma.document.create({
    data: {
      code: genDocumentCode(),
      ownerId: payload.ownerId ?? null,
      customerId: payload.customerId ?? null,
      contractId: payload.contractId ?? null,
      productId: payload.productId ?? null,
      projectId: payload.projectId ?? null,
      trainingCourseId: payload.trainingCourseId ?? null,
      name: payload.name,
      category: payload.category as any,
      fileType: payload.fileType as any,
      tags: payload.tags ?? [],
      description: payload.description ?? null,
      fileSize: payload.fileSize ?? null,
      fileUrl: payload.fileUrl ?? null,
    },
  });
}

export async function updateDocumentService(id: string, payload: any) {
  const resolvedId = await resolveDocumentId(id);

  return prisma.document.update({
    where: { id: resolvedId },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.category !== undefined ? { category: payload.category } : {}),
      ...(payload.fileType !== undefined ? { fileType: payload.fileType } : {}),
      ...(payload.ownerId !== undefined ? { ownerId: payload.ownerId } : {}),
      ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
      ...(payload.contractId !== undefined ? { contractId: payload.contractId } : {}),
      ...(payload.productId !== undefined ? { productId: payload.productId } : {}),
      ...(payload.projectId !== undefined ? { projectId: payload.projectId } : {}),
      ...(payload.trainingCourseId !== undefined ? { trainingCourseId: payload.trainingCourseId } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
      ...(payload.fileSize !== undefined ? { fileSize: payload.fileSize } : {}),
      ...(payload.fileUrl !== undefined ? { fileUrl: payload.fileUrl } : {}),
    },
  });
}

export async function softDeleteDocumentService(id: string) {
  const resolvedId = await resolveDocumentId(id);

  await prisma.document.update({ where: { id: resolvedId }, data: { deletedAt: new Date() } });
  return { id: resolvedId };
}

