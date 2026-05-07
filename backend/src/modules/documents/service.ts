import type { Prisma } from "@prisma/client";

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
  const where: Prisma.DocumentWhereInput = { deletedAt: null };
  if (filters.category) where.category = filters.category as NonNullable<Prisma.DocumentWhereInput["category"]>;
  if (filters.fileType) where.fileType = filters.fileType as NonNullable<Prisma.DocumentWhereInput["fileType"]>;
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
      category: payload.category as Prisma.DocumentCreateInput["category"],
      fileType: payload.fileType as Prisma.DocumentCreateInput["fileType"],
      tags: payload.tags ?? [],
      description: payload.description ?? null,
      fileSize: payload.fileSize ?? null,
      fileUrl: payload.fileUrl ?? null,
    },
  });
}

type UpdateDocumentPayload = Partial<{
  name: string;
  category: string;
  fileType: string;
  ownerId: string | null;
  customerId: string | null;
  contractId: string | null;
  productId: string | null;
  projectId: string | null;
  trainingCourseId: string | null;
  description: string | null;
  tags: string[];
  fileSize: string | null;
  fileUrl: string | null;
}>;

export async function updateDocumentService(id: string, payload: UpdateDocumentPayload) {
  const resolvedId = await resolveDocumentId(id);

  const data: Prisma.DocumentUncheckedUpdateInput = {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.category !== undefined ? { category: payload.category as NonNullable<Prisma.DocumentUncheckedUpdateInput["category"]> } : {}),
    ...(payload.fileType !== undefined ? { fileType: payload.fileType as NonNullable<Prisma.DocumentUncheckedUpdateInput["fileType"]> } : {}),
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
  };

  return prisma.document.update({
    where: { id: resolvedId },
    data,
  });
}

export async function softDeleteDocumentService(id: string) {
  const resolvedId = await resolveDocumentId(id);

  await prisma.document.update({ where: { id: resolvedId }, data: { deletedAt: new Date() } });
  return { id: resolvedId };
}

