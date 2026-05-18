import type { Request, Response } from "express";

import { writeAudit } from "../../lib/audit";
import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createInstanceDocument,
  deleteInstanceDocument,
  listInstanceDocuments,
} from "./service";

export async function listDocumentsController(req: Request, res: Response) {
  const instanceId = String(req.params.id ?? "");
  if (!instanceId) throw new HttpError(400, "Thiếu instanceId");
  const data = await listInstanceDocuments(instanceId);
  return sendSuccess(res, data);
}

export async function uploadDocumentController(req: Request, res: Response) {
  const instanceId = String(req.params.id ?? "");
  if (!instanceId) throw new HttpError(400, "Thiếu instanceId");
  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw new HttpError(400, "Thiếu file đính kèm");

  const body = req.body as Record<string, string | undefined>;
  const stepId = body.stepId?.trim() || null;

  const data = await createInstanceDocument({
    instanceId,
    stepId,
    fileName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype,
    storagePath: file.path,
    uploadedById: req.user?.id ?? null,
  });

  await writeAudit(req, {
    action: "update",
    entity: "workflow_instance",
    entityId: instanceId,
    summary: `Đính kèm tài liệu «${data.fileName}» vào quy trình`,
    payload: { documentId: data.id, stepId },
  });

  return sendSuccess(res, data);
}

export async function deleteDocumentController(req: Request, res: Response) {
  const instanceId = String(req.params.id ?? "");
  const documentId = String(req.params.docId ?? "");
  if (!instanceId || !documentId) throw new HttpError(400, "Thiếu tham số");
  const data = await deleteInstanceDocument(instanceId, documentId);
  await writeAudit(req, {
    action: "delete",
    entity: "workflow_instance",
    entityId: instanceId,
    summary: `Xoá tài liệu khỏi quy trình`,
    payload: { documentId },
  });
  return sendSuccess(res, data);
}
