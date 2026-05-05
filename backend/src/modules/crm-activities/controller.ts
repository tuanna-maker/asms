import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createCrmActivitySchema,
  crmActivityIdParamSchema,
  listCrmActivitiesQuerySchema,
  updateCrmActivitySchema,
} from "./schema";

import {
  createCrmActivityService,
  getCrmActivityDetailService,
  listCrmActivitiesService,
  softDeleteCrmActivityService,
  updateCrmActivityService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listCrmActivitiesController(req: Request, res: Response) {
  const query = zodParseOrThrow(listCrmActivitiesQuerySchema, req.query);
  const data = await listCrmActivitiesService(query);
  return sendSuccess(res, data);
}

export async function getCrmActivityDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(crmActivityIdParamSchema, req.params);
  const data = await getCrmActivityDetailService(id);
  return sendSuccess(res, data);
}

export async function createCrmActivityController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createCrmActivitySchema, req.body);
  const data = await createCrmActivityService({
    ...payload,
    createdById: req.user?.id ?? null,
  });
  return sendSuccess(res, data, "CRM activity created");
}

export async function updateCrmActivityController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(crmActivityIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateCrmActivitySchema, req.body);
  const data = await updateCrmActivityService(id, payload as Record<string, unknown>);
  return sendSuccess(res, data, "CRM activity updated");
}

export async function deleteCrmActivityController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(crmActivityIdParamSchema, req.params);
  const data = await softDeleteCrmActivityService(id);
  return sendSuccess(res, data, "CRM activity deleted");
}
