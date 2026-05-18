import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import { listAuditLogsQuerySchema } from "./schema";
import { listAuditLogsService } from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listAuditLogsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listAuditLogsQuerySchema, req.query);
  const filters: Parameters<typeof listAuditLogsService>[0] = {};
  if (query.actorId !== undefined) filters.actorId = query.actorId;
  if (query.entity !== undefined) filters.entity = query.entity;
  if (query.entityId !== undefined) filters.entityId = query.entityId;
  if (query.action !== undefined) filters.action = query.action;
  if (query.search !== undefined) filters.search = query.search;
  if (query.from !== undefined) filters.from = query.from;
  if (query.to !== undefined) filters.to = query.to;
  if (query.page !== undefined) filters.page = query.page;
  if (query.pageSize !== undefined) filters.pageSize = query.pageSize;
  const data = await listAuditLogsService(filters);
  return sendSuccess(res, data);
}
