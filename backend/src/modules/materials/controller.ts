import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  createMaterialTransferSchema,
  createMaterialSchema,
  listMaterialTransfersQuerySchema,
  listMaterialsQuerySchema,
  materialIdParamSchema,
  materialTransferIdParamSchema,
  updateMaterialSchema,
  updateMaterialTransferSchema,
} from "./schema";

import {
  createMaterialTransferService,
  createMaterialService,
  getMaterialDetailService,
  listMaterialTransfersService,
  listMaterialsService,
  softDeleteMaterialService,
  softDeleteMaterialTransferService,
  updateMaterialService,
  updateMaterialTransferService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listMaterialsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listMaterialsQuerySchema, req.query);
  const input: { search?: string; type?: string; warehouse?: string } = {};
  if (query.search !== undefined) input.search = query.search;
  if (query.type !== undefined) input.type = query.type;
  if (query.warehouse !== undefined) input.warehouse = query.warehouse;

  const data = await listMaterialsService(input);
  return sendSuccess(res, data);
}

export async function getMaterialDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(materialIdParamSchema, req.params);
  const data = await getMaterialDetailService(id);
  return sendSuccess(res, data);
}

export async function createMaterialController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createMaterialSchema, req.body);
  const input: Parameters<typeof createMaterialService>[0] = {
    code: payload.code,
    name: payload.name,
    type: payload.type,
    serial: payload.serial ?? null,
    quantity: payload.quantity,
    unit: payload.unit,
    warehouse: payload.warehouse,
    description: payload.description ?? null,
  };
  if (payload.available !== undefined) input.available = payload.available;

  const data = await createMaterialService(input);
  await writeAudit(req, {
    action: "create",
    entity: "material",
    entityId: (data as { id?: string }).id ?? null,
    summary: `Tạo vật tư ${(data as { code?: string }).code ?? ""}`.trim(),
  });
  return sendSuccess(res, data, "Material created");
}

export async function updateMaterialController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(materialIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateMaterialSchema, req.body);
  const data = await updateMaterialService(id, payload as Parameters<typeof updateMaterialService>[1]);
  await writeAudit(req, {
    action: "update",
    entity: "material",
    entityId: id,
    summary: `Cập nhật vật tư ${(data as { code?: string }).code ?? id}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data, "Material updated");
}

export async function deleteMaterialController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(materialIdParamSchema, req.params);
  const data = await softDeleteMaterialService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "material",
    entityId: id,
    summary: `Xoá vật tư ${id}`,
  });
  return sendSuccess(res, data, "Material deleted");
}

export async function listMaterialTransfersController(req: Request, res: Response) {
  const query = zodParseOrThrow(listMaterialTransfersQuerySchema, req.query);
  const input: { search?: string; type?: string; status?: string } = {};
  if (query.search !== undefined) input.search = query.search;
  if (query.type !== undefined) input.type = query.type;
  if (query.status !== undefined) input.status = query.status;

  const data = await listMaterialTransfersService(input);
  return sendSuccess(res, data);
}

export async function createMaterialTransferController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createMaterialTransferSchema, req.body);
  const data = await createMaterialTransferService(payload);
  await writeAudit(req, {
    action: "create",
    entity: "material_transfer",
    entityId: (data as { id?: string }).id ?? null,
    summary: `Tạo phiếu xuất vật tư ${(data as { code?: string }).code ?? ""}`.trim(),
  });
  return sendSuccess(res, data, "Material transfer created");
}

export async function updateMaterialTransferController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(materialTransferIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateMaterialTransferSchema, req.body);
  const patch: {
    destination?: string;
    status?: "pending" | "processing" | "completed";
    type?: "contract" | "warranty" | "repair";
  } = {};
  if (payload.destination !== undefined) patch.destination = payload.destination;
  if (payload.status !== undefined) patch.status = payload.status;
  if (payload.type !== undefined) patch.type = payload.type;
  const data = await updateMaterialTransferService(id, patch);
  await writeAudit(req, {
    action: "update",
    entity: "material_transfer",
    entityId: id,
    summary: `Cập nhật phiếu xuất vật tư ${id}`,
    payload: patch as Record<string, unknown>,
  });
  return sendSuccess(res, data, "Material transfer updated");
}

export async function deleteMaterialTransferController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(materialTransferIdParamSchema, req.params);
  const data = await softDeleteMaterialTransferService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "material_transfer",
    entityId: id,
    summary: `Huỷ phiếu xuất vật tư ${id}`,
  });
  return sendSuccess(res, data, "Material transfer cancelled");
}

