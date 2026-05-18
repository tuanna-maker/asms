import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createDefinitionSchema,
  definitionIdParamSchema,
  listDefinitionsQuerySchema,
  reorderDefinitionsSchema,
  updateDefinitionSchema,
} from "./schema";
import {
  createDefinitionService,
  getDefinitionUsageService,
  listDefinitionsService,
  reorderDefinitionsService,
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
    actorId: req.user?.id ?? null,
  };
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await createDefinitionService(input);
  await writeAudit(req, {
    action: "create",
    entity: "definition",
    entityId: data.id,
    summary: `Thêm «${data.label}» vào nhóm ${data.category}`,
    payload: { category: data.category, code: data.code, label: data.label },
  });
  return sendSuccess(res, data);
}

export async function updateDefinitionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(definitionIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateDefinitionSchema, req.body);
  const input: Parameters<typeof updateDefinitionService>[1] = {
    actorId: req.user?.id ?? null,
  };
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.label !== undefined) input.label = payload.label;
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await updateDefinitionService(id, input);
  await writeAudit(req, {
    action: "update",
    entity: "definition",
    entityId: data.id,
    summary: `Cập nhật «${data.label}» (${data.category})`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function deleteDefinitionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(definitionIdParamSchema, req.params);
  const data = await softDeleteDefinitionService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "definition",
    entityId: id,
    summary: `Xoá định nghĩa ${id}`,
  });
  return sendSuccess(res, data);
}

export async function getDefinitionUsageController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(definitionIdParamSchema, req.params);
  const data = await getDefinitionUsageService(id);
  return sendSuccess(res, data);
}

export async function reorderDefinitionsController(req: Request, res: Response) {
  const payload = zodParseOrThrow(reorderDefinitionsSchema, req.body);
  const result = await reorderDefinitionsService({
    category: payload.category,
    items: payload.items,
    actorId: req.user?.id ?? null,
  });
  await writeAudit(req, {
    action: "reorder",
    entity: "definition",
    summary: `Sắp xếp lại nhóm ${payload.category} (${result.count} mục)`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, result);
}
