import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createWarrantySchema,
  listWarrantiesQuerySchema,
  updateWarrantySchema,
  warrantyIdParamSchema,
} from "./schema";

import {
  createWarrantyService,
  getWarrantyDetailService,
  listWarrantiesService,
  softDeleteWarrantyService,
  updateWarrantyService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listWarrantiesController(req: Request, res: Response) {
  const query = zodParseOrThrow(listWarrantiesQuerySchema, req.query);
  const filters = {
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.type !== undefined ? { type: query.type } : {}),
    ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
    ...(query.productId !== undefined ? { productId: query.productId } : {}),
  };
  const data = await listWarrantiesService(filters);
  return sendSuccess(res, data);
}

export async function getWarrantyDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(warrantyIdParamSchema, req.params);
  const data = await getWarrantyDetailService(id);
  return sendSuccess(res, data);
}

export async function createWarrantyController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createWarrantySchema, req.body);

  const input: any = { ...payload };
  if (payload.contractId === undefined) delete input.contractId;
  if (payload.productId === undefined) delete input.productId;
  if (payload.assigneeId === undefined) delete input.assigneeId;
  if (payload.source === undefined) delete input.source;
  if (payload.priority === undefined) delete input.priority;
  if (payload.status === undefined) delete input.status;
  if (payload.workflowStep === undefined) delete input.workflowStep;
  if (payload.slaHours === undefined) delete input.slaHours;
  if (payload.resolvedAt === undefined) delete input.resolvedAt;

  // default assigneeId = current user if not provided
  if (input.assigneeId === undefined) input.assigneeId = req.user?.id ?? null;

  const data = await createWarrantyService(input);
  return sendSuccess(res, data, "Warranty ticket created");
}

export async function updateWarrantyController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(warrantyIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateWarrantySchema, req.body);

  const data = await updateWarrantyService(id, payload);
  return sendSuccess(res, data, "Warranty ticket updated");
}

export async function deleteWarrantyController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(warrantyIdParamSchema, req.params);
  const data = await softDeleteWarrantyService(id);
  return sendSuccess(res, data, "Warranty ticket deleted");
}

