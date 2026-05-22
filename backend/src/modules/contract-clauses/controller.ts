import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  clauseIdParamSchema,
  createClauseSchema,
  createGroupSchema,
  groupIdParamSchema,
  listClausesQuerySchema,
  listGroupsQuerySchema,
  reorderClausesSchema,
  reorderGroupsSchema,
  setGroupMembersSchema,
  updateClauseSchema,
  updateGroupSchema,
} from "./schema";
import {
  createClauseGroupService,
  createClauseService,
  getClauseUsageService,
  listClauseGroupsService,
  listClausesService,
  reorderClauseGroupsService,
  reorderClausesService,
  setClauseGroupMembersService,
  softDeleteClauseGroupService,
  softDeleteClauseService,
  updateClauseGroupService,
  updateClauseService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listClausesController(req: Request, res: Response) {
  const query = zodParseOrThrow(listClausesQuerySchema, req.query);
  const data = await listClausesService(Boolean(query.includeInactive));
  return sendSuccess(res, data);
}

export async function createClauseController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createClauseSchema, req.body);
  const input: Parameters<typeof createClauseService>[0] = {
    code: payload.code,
    title: payload.title,
    content: payload.content,
    actorId: req.user?.id ?? null,
  };
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await createClauseService(input);
  await writeAudit(req, {
    action: "create",
    entity: "contract_clause",
    entityId: data.id,
    summary: `Thêm điều khoản «${data.title}»`,
    payload: { code: data.code },
  });
  return sendSuccess(res, data);
}

export async function updateClauseController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(clauseIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateClauseSchema, req.body);
  const input: Parameters<typeof updateClauseService>[1] = { actorId: req.user?.id ?? null };
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.title !== undefined) input.title = payload.title;
  if (payload.content !== undefined) input.content = payload.content;
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await updateClauseService(id, input);
  await writeAudit(req, {
    action: "update",
    entity: "contract_clause",
    entityId: data.id,
    summary: `Cập nhật điều khoản «${data.title}»`,
  });
  return sendSuccess(res, data);
}

export async function deleteClauseController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(clauseIdParamSchema, req.params);
  const data = await softDeleteClauseService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "contract_clause",
    entityId: data.id,
    summary: "Xóa điều khoản",
  });
  return sendSuccess(res, data);
}

export async function reorderClausesController(req: Request, res: Response) {
  const payload = zodParseOrThrow(reorderClausesSchema, req.body);
  const data = await reorderClausesService(payload.orderedIds);
  return sendSuccess(res, data);
}

export async function getClauseUsageController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(clauseIdParamSchema, req.params);
  const data = await getClauseUsageService(id);
  return sendSuccess(res, data);
}

export async function listClauseGroupsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listGroupsQuerySchema, req.query);
  const data = await listClauseGroupsService(Boolean(query.includeInactive));
  return sendSuccess(res, data);
}

export async function createClauseGroupController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createGroupSchema, req.body);
  const input: Parameters<typeof createClauseGroupService>[0] = {
    code: payload.code,
    label: payload.label,
    actorId: req.user?.id ?? null,
  };
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await createClauseGroupService(input);
  await writeAudit(req, {
    action: "create",
    entity: "contract_clause_group",
    entityId: data.id,
    summary: `Thêm nhóm điều khoản «${data.label}»`,
    payload: { code: data.code },
  });
  return sendSuccess(res, data);
}

export async function updateClauseGroupController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(groupIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateGroupSchema, req.body);
  const input: Parameters<typeof updateClauseGroupService>[1] = { actorId: req.user?.id ?? null };
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.label !== undefined) input.label = payload.label;
  if (payload.sortOrder !== undefined) input.sortOrder = payload.sortOrder;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await updateClauseGroupService(id, input);
  await writeAudit(req, {
    action: "update",
    entity: "contract_clause_group",
    entityId: data.id,
    summary: `Cập nhật nhóm «${data.label}»`,
  });
  return sendSuccess(res, data);
}

export async function deleteClauseGroupController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(groupIdParamSchema, req.params);
  const data = await softDeleteClauseGroupService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "contract_clause_group",
    entityId: data.id,
    summary: "Xóa nhóm điều khoản",
  });
  return sendSuccess(res, data);
}

export async function reorderClauseGroupsController(req: Request, res: Response) {
  const payload = zodParseOrThrow(reorderGroupsSchema, req.body);
  const data = await reorderClauseGroupsService(payload.orderedIds);
  return sendSuccess(res, data);
}

export async function setClauseGroupMembersController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(groupIdParamSchema, req.params);
  const payload = zodParseOrThrow(setGroupMembersSchema, req.body);
  const data = await setClauseGroupMembersService(id, payload.clauseIds);
  await writeAudit(req, {
    action: "update",
    entity: "contract_clause_group",
    entityId: data.id,
    summary: `Gán ${payload.clauseIds.length} điều khoản vào nhóm «${data.label}»`,
  });
  return sendSuccess(res, data);
}
