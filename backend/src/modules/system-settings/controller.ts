import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import { updateSystemSettingsSchema } from "./schema";
import { listSystemSettingsService, updateSystemSettingsService } from "./service";

function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, "Invalid request input", result.error.flatten());
  return result.data;
}

export async function listSystemSettingsController(_req: Request, res: Response) {
  const data = await listSystemSettingsService();
  return sendSuccess(res, data);
}

export async function updateSystemSettingsController(req: Request, res: Response) {
  const payload = zodParseOrThrow(updateSystemSettingsSchema, req.body);
  const data = await updateSystemSettingsService(payload.items, req.user?.id ?? null);
  await writeAudit(req, {
    action: "settings_update",
    entity: "system_setting",
    summary: `Cập nhật ${payload.items.length} cấu hình`,
    payload: { keys: payload.items.map((i) => i.key) },
  });
  return sendSuccess(res, data, "System settings updated");
}
