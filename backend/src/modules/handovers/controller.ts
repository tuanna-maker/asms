import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createHandoverSchema,
  handoverIdParamSchema,
  listHandoversQuerySchema,
  updateHandoverSchema,
} from "./schema";

import {
  createHandoverService,
  getHandoverDetailService,
  listHandoversService,
  softDeleteHandoverService,
  updateHandoverService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listHandoversController(req: Request, res: Response) {
  const query = zodParseOrThrow(listHandoversQuerySchema, req.query);
  const filters = {
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
    ...(query.contractId !== undefined ? { contractId: query.contractId } : {}),
    ...(query.search !== undefined ? { search: query.search } : {}),
  };
  const data = await listHandoversService(filters);
  return sendSuccess(res, data);
}

export async function getHandoverDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(handoverIdParamSchema, req.params);
  const data = await getHandoverDetailService(id);
  return sendSuccess(res, data);
}

export async function createHandoverController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createHandoverSchema, req.body);
  const data = await createHandoverService(payload, req.user?.id ?? null);
  return sendSuccess(res, data, "Handover created");
}

export async function updateHandoverController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(handoverIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateHandoverSchema, req.body);
  const data = await updateHandoverService(id, payload as Record<string, unknown>);
  return sendSuccess(res, data, "Handover updated");
}

export async function deleteHandoverController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(handoverIdParamSchema, req.params);
  const data = await softDeleteHandoverService(id);
  return sendSuccess(res, data, "Handover deleted");
}
