import type { DocumentCategory, Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import { assertActiveDefinitionCode } from "../definitions/assert-active-code";

const DOCUMENT_CATEGORY_ENUMS = new Set([
  "contract",
  "technical",
  "policy",
  "training",
  "report",
  "other",
]);

function genDocumentCode() {
  return `DOC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

async function resolveDocumentId(idOrCode: string) {
  const doc = await prisma.document.findFirst({
    where: { deletedAt: null, OR: [{ id: idOrCode }, { code: idOrCode }] },
    select: { id: true },
  });
  if (!doc) throw new HttpError(404, "Không tìm thấy tài liệu");
  return doc.id;
}

export async function listDocumentsService(filters: {
  categoryCode?: string;
  fileType?: string;
  ownerId?: string;
  customerId?: string;
  contractId?: string;
  productId?: string;
  projectId?: string;
  trainingCourseId?: string;
  warrantyId?: string;
  name?: string;
}) {
  const where: Prisma.DocumentWhereInput = { deletedAt: null };
  if (filters.categoryCode) where.categoryCode = filters.categoryCode;
  if (filters.fileType) where.fileType = filters.fileType as NonNullable<Prisma.DocumentWhereInput["fileType"]>;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.customerId) where.customerId = filters.customerId;
  if (filters.contractId) where.contractId = filters.contractId;
  if (filters.productId) where.productId = filters.productId;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.trainingCourseId) where.trainingCourseId = filters.trainingCourseId;
  if (filters.warrantyId) where.warrantyId = filters.warrantyId;
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
      categoryCode: true,
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
      warrantyId: true,
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
      warranty: { select: { id: true, code: true, issue: true } },
    },
  });

  if (!doc) throw new HttpError(404, "Không tìm thấy tài liệu");
  return doc;
}

export async function createDocumentService(payload: {
  ownerId?: string;
  customerId?: string;
  contractId?: string;
  productId?: string;
  warrantyId?: string;
  projectId?: string;
  trainingCourseId?: string;
  name: string;
  categoryCode: string;
  fileType: string;
  tags?: string[];
  description?: string;
  fileSize?: string;
  fileUrl?: string;
}) {
  await assertActiveDefinitionCode("document_type", payload.categoryCode, "Loại tài liệu");

  return prisma.document.create({
    data: {
      code: genDocumentCode(),
      ownerId: payload.ownerId ?? null,
      customerId: payload.customerId ?? null,
      contractId: payload.contractId ?? null,
      productId: payload.productId ?? null,
      projectId: payload.projectId ?? null,
      trainingCourseId: payload.trainingCourseId ?? null,
      warrantyId: payload.warrantyId ?? null,
      name: payload.name,
      categoryCode: payload.categoryCode,
      category: (DOCUMENT_CATEGORY_ENUMS.has(payload.categoryCode)
        ? (payload.categoryCode as DocumentCategory)
        : ("other" as DocumentCategory)),
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
  categoryCode: string;
  fileType: string;
  ownerId: string | null;
  customerId: string | null;
  contractId: string | null;
  productId: string | null;
  warrantyId: string | null;
  projectId: string | null;
  trainingCourseId: string | null;
  description: string | null;
  tags: string[];
  fileSize: string | null;
  fileUrl: string | null;
}>;

export async function updateDocumentService(id: string, payload: UpdateDocumentPayload) {
  const resolvedId = await resolveDocumentId(id);

  if (payload.categoryCode !== undefined) {
    await assertActiveDefinitionCode("document_type", payload.categoryCode, "Loại tài liệu");
  }

  const data: Prisma.DocumentUncheckedUpdateInput = {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.categoryCode !== undefined
      ? {
          categoryCode: payload.categoryCode,
          ...(DOCUMENT_CATEGORY_ENUMS.has(payload.categoryCode)
            ? { category: payload.categoryCode as DocumentCategory }
            : {}),
        }
      : {}),
    ...(payload.fileType !== undefined ? { fileType: payload.fileType as NonNullable<Prisma.DocumentUncheckedUpdateInput["fileType"]> } : {}),
    ...(payload.ownerId !== undefined ? { ownerId: payload.ownerId } : {}),
    ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
    ...(payload.contractId !== undefined ? { contractId: payload.contractId } : {}),
    ...(payload.productId !== undefined ? { productId: payload.productId } : {}),
    ...(payload.warrantyId !== undefined ? { warrantyId: payload.warrantyId } : {}),
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
