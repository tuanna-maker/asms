import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import { putNotificationPrefsSchema } from "./schema";
import { listNotificationPreferencesForUser, upsertNotificationPreferencesForUser } from "./service";

export async function listNotificationPreferencesController(req: Request, res: Response) {
  const uid = req.user?.id;
  if (!uid) throw new HttpError(401, "Unauthorized");
  const data = await listNotificationPreferencesForUser(uid);
  return sendSuccess(res, data);
}

export async function putNotificationPreferencesController(req: Request, res: Response) {
  const uid = req.user?.id;
  if (!uid) throw new HttpError(401, "Unauthorized");
  const body = zodParseOrThrow(putNotificationPrefsSchema, req.body);
  const data = await upsertNotificationPreferencesForUser(uid, body.preferences);
  return sendSuccess(res, data, "Đã lưu cài đặt thông báo");
}
