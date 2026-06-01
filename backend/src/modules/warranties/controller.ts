import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createWarrantySchema,
  listWarrantiesQuerySchema,
  updateWarrantySchema,
  warrantyIdParamSchema,
  warrantyStatsQuerySchema,
} from "./schema";

import {
  createWarrantyService,
  getWarrantyDetailService,
  listWarrantiesService,
  listWarrantyStatsService,
  softDeleteWarrantyService,
  updateWarrantyService,
} from "./service";

function parseWarrantyStatsTypes(input: unknown): ("warranty" | "repair" | "maintenance")[] | undefined {
  if (input == null || input === "") return undefined;
  const allowed = new Set<string>(["warranty", "repair", "maintenance"]);
  if (Array.isArray(input)) {
    const out = input.filter((t): t is "warranty" | "repair" | "maintenance" => typeof t === "string" && allowed.has(t));
    return out.length ? out : undefined;
  }
  if (typeof input === "string") {
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
    const out = parts.filter((p): p is "warranty" | "repair" | "maintenance" => allowed.has(p));
    return out.length ? out : undefined;
  }
  return undefined;
}

export async function listWarrantyStatsController(req: Request, res: Response) {
  const parsed = zodParseOrThrow(warrantyStatsQuerySchema, req.query);
  const types = parseWarrantyStatsTypes(parsed.types);
  const data = await listWarrantyStatsService({
    from: parsed.from,
    to: parsed.to,
    ...(types && types.length > 0 ? { types } : {}),
  });
  return sendSuccess(res, data);
}

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

