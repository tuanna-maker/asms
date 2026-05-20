import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  createCustomerFeedbackSchema,
  customerFeedbackIdParamSchema,
  listCustomerFeedbacksQuerySchema,
  updateCustomerFeedbackSchema,
} from "./schema";

import {
  createCustomerFeedbackService,
  getCustomerFeedbackDetailService,
  listCustomerFeedbacksService,
  softDeleteCustomerFeedbackService,
  updateCustomerFeedbackService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listCustomerFeedbacksController(req: Request, res: Response) {
  const query = zodParseOrThrow(listCustomerFeedbacksQuerySchema, req.query);
  const data = await listCustomerFeedbacksService(query);
  return sendSuccess(res, data);
}

export async function getCustomerFeedbackDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const data = await getCustomerFeedbackDetailService(id);
  return sendSuccess(res, data);
}

export async function createCustomerFeedbackController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createCustomerFeedbackSchema, req.body);
  const data = await createCustomerFeedbackService({
    ...payload,
    createdById: req.user?.id ?? null,
  });
  return sendSuccess(res, data, "Customer feedback created");
}

export async function updateCustomerFeedbackController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateCustomerFeedbackSchema, req.body);
  const data = await updateCustomerFeedbackService(id, payload as Record<string, unknown>);
  return sendSuccess(res, data, "Customer feedback updated");
}

export async function deleteCustomerFeedbackController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const data = await softDeleteCustomerFeedbackService(id);
  return sendSuccess(res, data, "Customer feedback deleted");
}
