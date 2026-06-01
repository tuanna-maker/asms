import type { Request, Response } from "express";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import { syncPendingFeedbackNotificationsForUser } from "../customer-feedbacks/feedback-notification-sync";

import {
  listNotificationsService,
  markAllReadService,
  markReadService,
  unreadCountService,
} from "./service";

function requireUserId(req: Request): string {
  const id = req.user?.id;
  if (!id) throw new HttpError(401, "Missing user");
  return id;
}

export async function listNotificationsController(req: Request, res: Response) {
  const userId = requireUserId(req);
  await syncPendingFeedbackNotificationsForUser(userId, req.user?.role ?? null);
  const unread = req.query.unread === "1" || req.query.unread === "true";
  const limit = Number(req.query.limit ?? 50);
  const data = await listNotificationsService(userId, { unread, limit });
  return sendSuccess(res, data);
}

export async function unreadCountController(req: Request, res: Response) {
  const userId = requireUserId(req);
  await syncPendingFeedbackNotificationsForUser(userId, req.user?.role ?? null);
  const count = await unreadCountService(userId);
  return sendSuccess(res, { count });
}

export async function markReadController(req: Request, res: Response) {
  const userId = requireUserId(req);
  const id = String(req.params.id ?? "");
  if (!id) throw new HttpError(400, "Missing id");
  const data = await markReadService(userId, id);
  return sendSuccess(res, data);
}

export async function markAllReadController(req: Request, res: Response) {
  const userId = requireUserId(req);
  const data = await markAllReadService(userId);
  return sendSuccess(res, data);
}
