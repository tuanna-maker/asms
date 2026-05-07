import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createProductSchema,
  productBomParamSchema,
  productIdParamSchema,
  updateProductBomSchema,
  updateProductSchema,
  upsertProductBomSchema,
} from "./schema";

import {
  createProductService,
  getProductDetailService,
  listProductsService,
  removeProductBomService,
  softDeleteProductService,
  updateProductBomService,
  updateProductService,
  upsertProductBomService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listProductsController(_req: Request, res: Response) {
  const data = await listProductsService();
  return sendSuccess(res, data);
}

export async function createProductController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createProductSchema, req.body);
  const data = await createProductService(payload);
  return sendSuccess(res, data, "Product created");
}

export async function getProductDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(productIdParamSchema, req.params);
  const data = await getProductDetailService(id);
  return sendSuccess(res, data);
}

export async function updateProductController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(productIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateProductSchema, req.body);
  const data = await updateProductService(id, payload as Record<string, unknown>);
  return sendSuccess(res, data, "Product updated");
}

export async function deleteProductController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(productIdParamSchema, req.params);
  const data = await softDeleteProductService(id);
  return sendSuccess(res, data, "Product deleted");
}

export async function upsertProductBomController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(productIdParamSchema, req.params);
  const payload = zodParseOrThrow(upsertProductBomSchema, req.body);
  const data = await upsertProductBomService(id, payload);
  return sendSuccess(res, data, "Product BOM upserted");
}

export async function updateProductBomController(req: Request, res: Response) {
  const { id, materialId } = zodParseOrThrow(productBomParamSchema, req.params);
  const payload = zodParseOrThrow(updateProductBomSchema, req.body);
  const data = await updateProductBomService(id, materialId, payload);
  return sendSuccess(res, data, "Product BOM updated");
}

export async function deleteProductBomController(req: Request, res: Response) {
  const { id, materialId } = zodParseOrThrow(productBomParamSchema, req.params);
  const data = await removeProductBomService(id, materialId);
  return sendSuccess(res, data, "Product BOM deleted");
}
