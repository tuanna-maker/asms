import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createHandoverSchema,
  handoverIdParamSchema,
  listHandoversQuerySchema,
  updateHandoverSchema,
} from "./schema";

import {
  createHandoverService,
  getHandoverDetailService,
  listHandoversService,
  softDeleteHandoverService,
  updateHandoverService,
} from "./service";

export async function listHandoversController(req: Request, res: Response) {
  const query = zodParseOrThrow(listHandoversQuerySchema, req.query);
  const filters = {
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
    ...(query.contractId !== undefined ? { contractId: query.contractId } : {}),
    ...(query.search !== undefined ? { search: query.search } : {}),
    ...(query.workflowCode !== undefined ? { workflowCode: query.workflowCode } : {}),
  };
  const data = await listHandoversService(filters);
  return sendSuccess(res, data);
}

export async function getHandoverDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(handoverIdParamSchema, req.params);
  const data = await getHandoverDetailService(id);
  return sendSuccess(res, data);
}

export async function createHandoverController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createHandoverSchema, req.body);
  const data = await createHandoverService(payload, req.user?.id ?? null);
  await writeAudit(req, {
    action: "create",
    entity: "handover",
    entityId: (data as { id?: string }).id ?? null,
    summary: `Tạo phiếu bàn giao ${(data as { code?: string }).code ?? ""}`.trim(),
  });
  return sendSuccess(res, data, "Handover created");
}

export async function updateHandoverController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(handoverIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateHandoverSchema, req.body);
  const data = await updateHandoverService(id, payload);
  await writeAudit(req, {
    action: "update",
    entity: "handover",
    entityId: id,
    summary: `Cập nhật phiếu bàn giao ${(data as { code?: string }).code ?? id}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data, "Handover updated");
}

export async function deleteHandoverController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(handoverIdParamSchema, req.params);
  const data = await softDeleteHandoverService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "handover",
    entityId: id,
    summary: `Xoá phiếu bàn giao ${id}`,
  });
  return sendSuccess(res, data, "Handover deleted");
}
