import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import { updateRolePermissionsSchema } from "./schema";
import {
  listRolePermissionsService,
  updateRolePermissionsService,
} from "./service";

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listRolePermissionsController(_req: Request, res: Response) {
  const data = await listRolePermissionsService();
  return sendSuccess(res, data);
}

export async function updateRolePermissionsController(req: Request, res: Response) {
  const { items } = parseOrThrow(updateRolePermissionsSchema, req.body);
  const data = await updateRolePermissionsService(items);
  return sendSuccess(res, data, "Đã cập nhật phân quyền");
}
