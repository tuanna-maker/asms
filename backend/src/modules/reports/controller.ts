import type { Request, Response } from "express";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import { reportsQuerySchema } from "./schema";
import { getReportsService } from "./service";

export async function getReportsController(req: Request, res: Response) {
  const query = reportsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const filters: { year?: string } = {};
  if (query.data.year !== undefined) filters.year = query.data.year;
  const data = await getReportsService(filters);
  return sendSuccess(res, data);
}

