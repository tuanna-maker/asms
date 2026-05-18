import type { Request, Response } from "express";
import { z } from "zod";

import { writeAudit } from "../../lib/audit";
import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createAnniversarySchema,
  idParamSchema,
  listQuerySchema,
  updateAnniversarySchema,
} from "./schema";
import {
  createAnniversaryService,
  deleteAnniversaryService,
  listAnniversariesService,
  updateAnniversaryService,
} from "./service";

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const r = schema.safeParse(input);
  if (!r.success) throw new HttpError(400, "Invalid request input", r.error.flatten());
  return r.data;
}

export async function listController(req: Request, res: Response) {
  const query = parseOrThrow(listQuerySchema, req.query);
  const filters: Parameters<typeof listAnniversariesService>[0] = {};
  if (query.customerId !== undefined) filters.customerId = query.customerId;
  if (query.type !== undefined) filters.type = query.type;
  if (query.upcoming !== undefined) filters.upcoming = query.upcoming;
  const data = await listAnniversariesService(filters);
  return sendSuccess(res, data);
}

export async function createController(req: Request, res: Response) {
  const payload = parseOrThrow(createAnniversarySchema, req.body);
  const data = await createAnniversaryService(payload);
  await writeAudit(req, {
    action: "create",
    entity: "customer",
    entityId: payload.customerId,
    summary: `Tạo kỷ niệm «${payload.label}»`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function updateController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const payload = parseOrThrow(updateAnniversarySchema, req.body);
  const data = await updateAnniversaryService(id, payload);
  await writeAudit(req, {
    action: "update",
    entity: "customer",
    entityId: data.customerId,
    summary: `Cập nhật kỷ niệm «${data.label}»`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function deleteController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const data = await deleteAnniversaryService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "customer",
    entityId: id,
    summary: `Xoá kỷ niệm khách hàng`,
  });
  return sendSuccess(res, data);
}
