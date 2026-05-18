import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  contractIdParamSchema,
  contractProductParamSchema,
  createContractSchema,
  listContractsQuerySchema,
  setContractProductsSchema,
  updateContractProductSchema,
  updateContractSchema,
} from "./schema";

import {
  createContractService,
  getContractDetailService,
  listContractProductsService,
  listContractsService,
  setContractProductsService,
  softDeleteContractService,
  updateContractProductService,
  updateContractService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listContractsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listContractsQuerySchema, req.query);
  const statuses = Array.isArray(query.statuses)
    ? query.statuses
    : query.statuses
      ? [query.statuses]
      : undefined;
  const filters: Parameters<typeof listContractsService>[0] = {};
  if (query.status !== undefined) filters.status = query.status;
  if (statuses) filters.statuses = statuses;
  if (query.customerId !== undefined) filters.customerId = query.customerId;
  if (query.search !== undefined) filters.search = query.search;
  if (query.contractTypeCode !== undefined) filters.contractTypeCode = query.contractTypeCode;
  if (query.signedFrom !== undefined) filters.signedFrom = query.signedFrom;
  if (query.signedTo !== undefined) filters.signedTo = query.signedTo;
  if (query.createdFrom !== undefined) filters.createdFrom = query.createdFrom;
  if (query.createdTo !== undefined) filters.createdTo = query.createdTo;
  if (query.eligibleFor !== undefined) filters.eligibleFor = query.eligibleFor;
  const data = await listContractsService(filters);
  return sendSuccess(res, data);
}

export async function getContractDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contractIdParamSchema, req.params);
  const data = await getContractDetailService(id);
  return sendSuccess(res, data);
}

export async function getContractProductsController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contractIdParamSchema, req.params);
  const data = await listContractProductsService(id);
  return sendSuccess(res, data);
}

export async function createContractController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createContractSchema, req.body);
  const createdById = req.user?.id;
  if (!createdById) throw new HttpError(401, "Missing user");

  const input: Record<string, unknown> & { createdById: string } = {
    ...payload,
    createdById,
    actorId: createdById,
  };
  if (payload.warrantyEnd === undefined) delete input.warrantyEnd;
  if (payload.status === undefined) delete input.status;
  if (payload.progress === undefined) delete input.progress;

  const data = await createContractService(input as Parameters<typeof createContractService>[0]);
  await writeAudit(req, {
    action: "create",
    entity: "contract",
    entityId: (data as { id?: string }).id ?? null,
    summary: `Tạo hợp đồng ${(data as { code?: string }).code ?? ""}`.trim(),
  });
  return sendSuccess(res, data, "Contract created");
}

export async function updateContractController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contractIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateContractSchema, req.body);
  if (Object.keys(payload).length === 0) throw new HttpError(400, "No fields to update");

  const data = await updateContractService(id, {
    ...(payload as Parameters<typeof updateContractService>[1]),
    actorId: req.user?.id ?? null,
  });
  await writeAudit(req, {
    action: "update",
    entity: "contract",
    entityId: id,
    summary: `Cập nhật hợp đồng ${(data as { code?: string }).code ?? id}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data, "Contract updated");
}

export async function deleteContractController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contractIdParamSchema, req.params);
  const data = await softDeleteContractService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "contract",
    entityId: id,
    summary: `Xoá hợp đồng ${id}`,
  });
  return sendSuccess(res, data, "Contract deleted");
}

export async function setContractProductsController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contractIdParamSchema, req.params);
  const payload = zodParseOrThrow(setContractProductsSchema, req.body);
  const data = await setContractProductsService(id, payload);
  return sendSuccess(res, data, "Contract products updated");
}

export async function updateContractProductController(req: Request, res: Response) {
  const { id, productId } = zodParseOrThrow(contractProductParamSchema, req.params);
  const payload = zodParseOrThrow(updateContractProductSchema, req.body);
  const data = await updateContractProductService(id, productId, payload);
  return sendSuccess(res, data, "Contract product updated");
}

