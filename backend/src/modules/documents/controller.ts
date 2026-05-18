import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createDocumentSchema,
  documentIdParamSchema,
  listDocumentsQuerySchema,
  updateDocumentSchema,
} from "./schema";

import {
  createDocumentService,
  getDocumentDetailService,
  listDocumentsService,
  softDeleteDocumentService,
  updateDocumentService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listDocumentsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listDocumentsQuerySchema, req.query);
  const input: Record<string, unknown> = {};
  if (query.categoryCode !== undefined) input.categoryCode = query.categoryCode;
  if (query.fileType !== undefined) input.fileType = query.fileType;
  if (query.ownerId !== undefined) input.ownerId = query.ownerId;
  if (query.customerId !== undefined) input.customerId = query.customerId;
  if (query.contractId !== undefined) input.contractId = query.contractId;
  if (query.productId !== undefined) input.productId = query.productId;
  if (query.projectId !== undefined) input.projectId = query.projectId;
  if (query.trainingCourseId !== undefined) input.trainingCourseId = query.trainingCourseId;
  if (query.warrantyId !== undefined) input.warrantyId = query.warrantyId;
  if (query.name !== undefined) input.name = query.name;

  const data = await listDocumentsService(input as Parameters<typeof listDocumentsService>[0]);
  return sendSuccess(res, data);
}

export async function getDocumentDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(documentIdParamSchema, req.params);
  const data = await getDocumentDetailService(id);
  return sendSuccess(res, data);
}

export async function createDocumentController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createDocumentSchema, req.body);
  const input: Record<string, unknown> = { ...payload, tags: payload.tags ?? [] };
  if (payload.ownerId === undefined) delete input.ownerId;
  if (payload.customerId === undefined) delete input.customerId;
  if (payload.contractId === undefined) delete input.contractId;
  if (payload.productId === undefined) delete input.productId;
  if (payload.projectId === undefined) delete input.projectId;
  if (payload.trainingCourseId === undefined) delete input.trainingCourseId;
  if (payload.warrantyId === undefined) delete input.warrantyId;
  if (payload.fileSize === undefined) delete input.fileSize;
  if (payload.fileUrl === undefined) delete input.fileUrl;

  const data = await createDocumentService(input as Parameters<typeof createDocumentService>[0]);
  return sendSuccess(res, data, "Document created");
}

function fileTypeFromName(name: string): "pdf" | "doc" | "xls" | "img" | "other" {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "xls";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "img";
  return "other";
}

export async function uploadDocumentController(req: Request, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw new HttpError(400, "Missing document file");

  const body = req.body as Record<string, string | undefined>;
  const input: Parameters<typeof createDocumentService>[0] = {
    name: body.name?.trim() || file.originalname,
    categoryCode: body.categoryCode ?? body.category ?? "contract",
    fileType: body.fileType ?? fileTypeFromName(file.originalname),
    tags: [],
    fileSize: `${Math.max(1, Math.round(file.size / 1024))} KB`,
    fileUrl: `/api/v1/uploads/documents/${file.filename}`,
  };
  if (body.ownerId) input.ownerId = body.ownerId;
  if (body.customerId) input.customerId = body.customerId;
  if (body.contractId) input.contractId = body.contractId;
  if (body.productId) input.productId = body.productId;
  if (body.projectId) input.projectId = body.projectId;
  if (body.trainingCourseId) input.trainingCourseId = body.trainingCourseId;
  if (body.warrantyId) input.warrantyId = body.warrantyId;
  if (body.description?.trim()) input.description = body.description.trim();

  const data = await createDocumentService(input);

  return sendSuccess(res, data, "Document uploaded");
}

export async function updateDocumentController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(documentIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateDocumentSchema, req.body);

  const data = await updateDocumentService(id, {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.categoryCode !== undefined ? { categoryCode: payload.categoryCode } : {}),
    ...(payload.fileType !== undefined ? { fileType: payload.fileType } : {}),
    ...(payload.ownerId !== undefined ? { ownerId: payload.ownerId } : {}),
    ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
    ...(payload.contractId !== undefined ? { contractId: payload.contractId } : {}),
    ...(payload.productId !== undefined ? { productId: payload.productId } : {}),
    ...(payload.projectId !== undefined ? { projectId: payload.projectId } : {}),
    ...(payload.trainingCourseId !== undefined ? { trainingCourseId: payload.trainingCourseId } : {}),
    ...(payload.warrantyId !== undefined ? { warrantyId: payload.warrantyId } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.tags !== undefined ? { tags: payload.tags } : {}),
    ...(payload.fileSize !== undefined ? { fileSize: payload.fileSize } : {}),
    ...(payload.fileUrl !== undefined ? { fileUrl: payload.fileUrl } : {}),
  });

  return sendSuccess(res, data, "Document updated");
}

export async function deleteDocumentController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(documentIdParamSchema, req.params);
  const data = await softDeleteDocumentService(id);
  return sendSuccess(res, data, "Document deleted");
}

