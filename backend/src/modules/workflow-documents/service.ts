import fs from "fs";
import path from "path";

import type { Prisma } from "@prisma/client";

import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";

const SELECT = {
  id: true,
  instanceId: true,
  stepId: true,
  fileName: true,
  fileSize: true,
  mimeType: true,
  storagePath: true,
  uploadedById: true,
  uploadedAt: true,
  uploadedBy: { select: { id: true, fullName: true } },
} satisfies Prisma.WorkflowInstanceDocumentSelect;

async function assertInstance(instanceId: string) {
  const inst = await prisma.workflowInstance.findUnique({
    where: { id: instanceId },
    select: { id: true },
  });
  if (!inst) throw new HttpError(404, "Không tìm thấy phiên xử lý");
}

export async function listInstanceDocuments(instanceId: string) {
  await assertInstance(instanceId);
  return prisma.workflowInstanceDocument.findMany({
    where: { instanceId },
    orderBy: { uploadedAt: "desc" },
    select: SELECT,
  });
}

export async function createInstanceDocument(input: {
  instanceId: string;
  stepId: string | null;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  uploadedById: string | null;
}) {
  await assertInstance(input.instanceId);
  if (input.stepId) {
    const step = await prisma.workflowStep.findUnique({
      where: { id: input.stepId },
      select: { id: true },
    });
    if (!step) throw new HttpError(404, "Không tìm thấy bước trong quy trình");
  }
  return prisma.workflowInstanceDocument.create({
    data: {
      instanceId: input.instanceId,
      stepId: input.stepId,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      storagePath: input.storagePath,
      uploadedById: input.uploadedById,
    },
    select: SELECT,
  });
}

export async function deleteInstanceDocument(instanceId: string, documentId: string) {
  const doc = await prisma.workflowInstanceDocument.findUnique({
    where: { id: documentId },
    select: { id: true, instanceId: true, storagePath: true },
  });
  if (!doc || doc.instanceId !== instanceId) {
    throw new HttpError(404, "Không tìm thấy tài liệu");
  }
  await prisma.workflowInstanceDocument.delete({ where: { id: documentId } });
  try {
    const absPath = path.isAbsolute(doc.storagePath)
      ? doc.storagePath
      : path.join(process.cwd(), doc.storagePath);
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[workflow-documents] failed to remove file", e);
  }
  return { id: documentId };
}
