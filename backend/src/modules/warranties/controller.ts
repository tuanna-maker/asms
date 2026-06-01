import type { Request, Response } from "express";

import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createWarrantySchema,
  listWarrantiesQuerySchema,
  updateWarrantySchema,
  warrantyIdParamSchema,
} from "./schema";

import {
  createWarrantyService,
  getWarrantyDetailService,
  listWarrantiesService,
  softDeleteWarrantyService,
  updateWarrantyService,
} from "./service";

export async function listWarrantiesController(req: Request, res: Response) {
  const query = zodParseOrThrow(listWarrantiesQuerySchema, req.query);
  const filters = {
    ...(query.statusCode !== undefined ? { statusCode: query.statusCode } : {}),
    ...(query.type !== undefined ? { type: query.type } : {}),
    ...(query.customerId !== undefined ? { customerId: query.customerId } : {}),
    ...(query.productId !== undefined ? { productId: query.productId } : {}),
  };
  const data = await listWarrantiesService(filters);
  return sendSuccess(res, data);
}

export async function getWarrantyDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(warrantyIdParamSchema, req.params);
  const data = await getWarrantyDetailService(id);
  return sendSuccess(res, data);
}

export async function createWarrantyController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createWarrantySchema, req.body);

  const data = await createWarrantyService({
    ...payload,
    assigneeId: payload.assigneeId ?? req.user?.id ?? null,
  });
  await writeAudit(req, {
    action: "create",
    entity: "warranty",
    entityId: (data as { id?: string }).id ?? null,
    summary: `Tạo phiếu bảo hành ${(data as { code?: string }).code ?? ""}`.trim(),
  });
  return sendSuccess(res, data, "Warranty ticket created");
}

export async function updateWarrantyController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(warrantyIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateWarrantySchema, req.body);

  const data = await updateWarrantyService(id, payload);
  await writeAudit(req, {
    action: "update",
    entity: "warranty",
    entityId: id,
    summary: `Cập nhật phiếu bảo hành ${(data as { code?: string }).code ?? id}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data, "Warranty ticket updated");
}

export async function deleteWarrantyController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(warrantyIdParamSchema, req.params);
  const data = await softDeleteWarrantyService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "warranty",
    entityId: id,
    summary: `Xoá phiếu bảo hành ${id}`,
  });
  return sendSuccess(res, data, "Warranty ticket deleted");
}

