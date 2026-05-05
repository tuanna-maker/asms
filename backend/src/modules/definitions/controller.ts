import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createDefinitionSchema,
  definitionIdParamSchema,
  listDefinitionsQuerySchema,
  updateDefinitionSchema,
} from "./schema";
import {
  createDefinitionService,
  listDefinitionsService,
  softDeleteDefinitionService,
  updateDefinitionService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listDefinitionsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listDefinitionsQuerySchema, req.query);
  const data = await listDefinitionsService({
    category: query.category,
    includeInactive: Boolean(query.includeInactive),
  });
  return sendSuccess(res, data);
}

export async function createDefinitionController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createDefinitionSchema, req.body);
  const input: Parameters<typeof createDefinitionService>[0] = {
    category: payload.category,
    code: payload.code,
    label: payload.label,
  };
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await createDefinitionService(input);
  return sendSuccess(res, data);
}

export async function updateDefinitionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(definitionIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateDefinitionSchema, req.body);
  const input: Parameters<typeof updateDefinitionService>[1] = {};
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.label !== undefined) input.label = payload.label;
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await updateDefinitionService(id, input);
  return sendSuccess(res, data);
}

export async function deleteDefinitionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(definitionIdParamSchema, req.params);
  const data = await softDeleteDefinitionService(id);
  return sendSuccess(res, data);
}
