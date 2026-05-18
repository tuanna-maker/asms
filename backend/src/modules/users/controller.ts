import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema,
} from "./schema";

import {
  createUserService,
  getUserDetailService,
  listUsersService,
  softDeleteUserService,
  updateUserService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listUsersController(req: Request, res: Response) {
  const query = zodParseOrThrow(listUsersQuerySchema, req.query);
  const filters = {
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.roleCode !== undefined ? { roleCode: query.roleCode } : {}),
    ...(query.search !== undefined ? { search: query.search } : {}),
  };
  const data = await listUsersService(filters);
  return sendSuccess(res, data);
}

export async function getUserDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(userIdParamSchema, req.params);
  const data = await getUserDetailService(id);
  return sendSuccess(res, data);
}

export async function createUserController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createUserSchema, req.body);
  const data = await createUserService(payload);
  await writeAudit(req, {
    action: "create",
    entity: "user",
    entityId: data.id,
    summary: `Tạo người dùng ${data.email}`,
    payload: { email: data.email, role: data.role.code },
  });
  return sendSuccess(res, data, "User created");
}

export async function updateUserController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(userIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateUserSchema, req.body);
  const safe = { ...(payload as Record<string, unknown>) };
  if (safe.password) safe.password = "***";
  const data = await updateUserService(id, payload as Record<string, unknown>);
  await writeAudit(req, {
    action: "update",
    entity: "user",
    entityId: data.id,
    summary: `Cập nhật người dùng ${data.email}`,
    payload: safe,
  });
  return sendSuccess(res, data, "User updated");
}

export async function deleteUserController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(userIdParamSchema, req.params);
  const data = await softDeleteUserService(id, req.user?.id ?? null);
  await writeAudit(req, {
    action: "delete",
    entity: "user",
    entityId: id,
    summary: `Xoá người dùng ${id}`,
  });
  return sendSuccess(res, data, "User deleted");
}
