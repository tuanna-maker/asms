import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createRoleSchema,
  listRolesQuerySchema,
  roleIdParamSchema,
  updateRoleSchema,
} from "./schema";
import {
  createRoleService,
  getRoleService,
  listRolesService,
  softDeleteRoleService,
  updateRoleService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listRolesController(req: Request, res: Response) {
  const query = zodParseOrThrow(listRolesQuerySchema, req.query);
  const data = await listRolesService({
    ...(query.search !== undefined ? { search: query.search } : {}),
    includeInactive: Boolean(query.includeInactive),
  });
  return sendSuccess(res, data);
}

export async function getRoleController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(roleIdParamSchema, req.params);
  const data = await getRoleService(id);
  return sendSuccess(res, data);
}

export async function createRoleController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createRoleSchema, req.body);
  const data = await createRoleService({
    code: payload.code,
    name: payload.name,
    description: payload.description ?? null,
    ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
  });
  await writeAudit(req, {
    action: "create",
    entity: "role",
    entityId: data.id,
    summary: `Tạo vai trò ${data.code}`,
    payload: { code: data.code, name: data.name },
  });
  return sendSuccess(res, data, "Role created");
}

export async function updateRoleController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(roleIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateRoleSchema, req.body);
  const input: Parameters<typeof updateRoleService>[1] = {};
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.name !== undefined) input.name = payload.name;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await updateRoleService(id, input);
  await writeAudit(req, {
    action: "update",
    entity: "role",
    entityId: data.id,
    summary: `Cập nhật vai trò ${data.code}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data, "Role updated");
}

export async function deleteRoleController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(roleIdParamSchema, req.params);
  const data = await softDeleteRoleService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "role",
    entityId: id,
    summary: `Xoá vai trò ${id}`,
  });
  return sendSuccess(res, data, "Role deleted");
}
