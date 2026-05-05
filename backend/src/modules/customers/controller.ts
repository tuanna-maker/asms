import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createCustomerSchema,
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
} from "./schema";

import {
  createCustomerService,
  getCustomerDetailService,
  listCustomersService,
  softDeleteCustomerService,
  updateCustomerService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listCustomersController(req: Request, res: Response) {
  const query = zodParseOrThrow(listCustomersQuerySchema, req.query);
  const data = await listCustomersService(query);
  return sendSuccess(res, data);
}

export async function getCustomerDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerIdParamSchema, req.params);
  const data = await getCustomerDetailService(id);
  return sendSuccess(res, data);
}

export async function createCustomerController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createCustomerSchema, req.body);
  const data = await createCustomerService(payload);
  return sendSuccess(res, data, "Customer created");
}

export async function updateCustomerController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateCustomerSchema, req.body);
  const data = await updateCustomerService(id, payload);
  return sendSuccess(res, data, "Customer updated");
}

export async function deleteCustomerController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerIdParamSchema, req.params);
  const data = await softDeleteCustomerService(id);
  return sendSuccess(res, data, "Customer deleted");
}

