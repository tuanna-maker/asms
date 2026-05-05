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
  const input: any = {};
  if (query.category !== undefined) input.category = query.category;
  if (query.fileType !== undefined) input.fileType = query.fileType;
  if (query.ownerId !== undefined) input.ownerId = query.ownerId;
  if (query.customerId !== undefined) input.customerId = query.customerId;
  if (query.contractId !== undefined) input.contractId = query.contractId;
  if (query.productId !== undefined) input.productId = query.productId;
  if (query.projectId !== undefined) input.projectId = query.projectId;
  if (query.trainingCourseId !== undefined) input.trainingCourseId = query.trainingCourseId;
  if (query.name !== undefined) input.name = query.name;

  const data = await listDocumentsService(input);
  return sendSuccess(res, data);
}

export async function getDocumentDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(documentIdParamSchema, req.params);
  const data = await getDocumentDetailService(id);
  return sendSuccess(res, data);
}

export async function createDocumentController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createDocumentSchema, req.body);
  const input: any = { ...payload, tags: payload.tags ?? [] };
  if (payload.ownerId === undefined) delete input.ownerId;
  if (payload.customerId === undefined) delete input.customerId;
  if (payload.contractId === undefined) delete input.contractId;
  if (payload.productId === undefined) delete input.productId;
  if (payload.projectId === undefined) delete input.projectId;
  if (payload.trainingCourseId === undefined) delete input.trainingCourseId;
  if (payload.fileSize === undefined) delete input.fileSize;
  if (payload.fileUrl === undefined) delete input.fileUrl;

  const data = await createDocumentService(input);
  return sendSuccess(res, data, "Document created");
}

export async function updateDocumentController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(documentIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateDocumentSchema, req.body);

  const data = await updateDocumentService(id, {
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
  });

  return sendSuccess(res, data, "Document updated");
}

export async function deleteDocumentController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(documentIdParamSchema, req.params);
  const data = await softDeleteDocumentService(id);
  return sendSuccess(res, data, "Document deleted");
}

