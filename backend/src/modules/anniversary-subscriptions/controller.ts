import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import {
  anniversaryIdParamSchema,
  listQuerySchema,
  subscribeSchema,
} from "./schema";
import {
  listSubscriptionsForUser,
  subscribeAnniversaryService,
  unsubscribeAnniversaryService,
} from "./service";

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const r = schema.safeParse(input);
  if (!r.success) throw new HttpError(400, "Invalid request input", r.error.flatten());
  return r.data;
}

function requireUserId(req: Request): string {
  const id = req.user?.id;
  if (!id) throw new HttpError(401, "Missing user");
  return id;
}

export async function listSubscriptionsController(req: Request, res: Response) {
  const userId = requireUserId(req);
  const { anniversaryIds } = parseOrThrow(listQuerySchema, req.query);
  const subscribedIds = await listSubscriptionsForUser(userId, anniversaryIds);
  return sendSuccess(res, { subscribedIds });
}

export async function subscribeController(req: Request, res: Response) {
  const userId = requireUserId(req);
  const { anniversaryId } = parseOrThrow(subscribeSchema, req.body);
  const data = await subscribeAnniversaryService(userId, anniversaryId);
  return sendSuccess(res, data);
}

export async function unsubscribeController(req: Request, res: Response) {
  const userId = requireUserId(req);
  const { anniversaryId } = parseOrThrow(anniversaryIdParamSchema, req.params);
  const data = await unsubscribeAnniversaryService(userId, anniversaryId);
  return sendSuccess(res, data);
}
