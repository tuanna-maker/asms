import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

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
  return sendSuccess(res, data, "User created");
}

export async function updateUserController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(userIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateUserSchema, req.body);
  const data = await updateUserService(id, payload as Record<string, unknown>);
  return sendSuccess(res, data, "User updated");
}

export async function deleteUserController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(userIdParamSchema, req.params);
  const data = await softDeleteUserService(id, req.user?.id ?? null);
  return sendSuccess(res, data, "User deleted");
}
