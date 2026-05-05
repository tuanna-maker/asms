import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  contactIdParamSchema,
  createContactSchema,
  listContactsQuerySchema,
  updateContactSchema,
} from "./schema";

import {
  createContactService,
  getContactDetailService,
  listContactsService,
  softDeleteContactService,
  updateContactService,
} from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listContactsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listContactsQuerySchema, req.query);
  const data = await listContactsService(query);
  return sendSuccess(res, data);
}

export async function getContactDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contactIdParamSchema, req.params);
  const data = await getContactDetailService(id);
  return sendSuccess(res, data);
}

export async function createContactController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createContactSchema, req.body);
  const data = await createContactService(payload);
  return sendSuccess(res, data, "Contact created");
}

export async function updateContactController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contactIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateContactSchema, req.body);
  const data = await updateContactService(id, payload);
  return sendSuccess(res, data, "Contact updated");
}

export async function deleteContactController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(contactIdParamSchema, req.params);
  const data = await softDeleteContactService(id);
  return sendSuccess(res, data, "Contact deleted");
}
