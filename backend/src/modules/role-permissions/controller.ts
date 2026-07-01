import type { Request, Response } from "express";

import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import { updateRolePermissionsSchema } from "./schema";import {
  listRolePermissionsService,
  updateRolePermissionsService,
} from "./service";

function parseOrThrow<T>(schema: import("zod").ZodType<T>, input: unknown) {
  return zodParseOrThrow(schema, input);
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
