import type { Request, Response } from "express";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";

import { materialDefectsQuerySchema, reportsQuerySchema } from "./schema";
import {
  getBadgesService,
  getDashboardSummaryService,
  getMaterialDefectsService,
  getReportsByProductLineService,
  getReportsFeedbackByCustomerService,
  getReportsFeedbackByProductLineService,
  getReportsService,
  type ReportDateFilters,
} from "./service";

function parseDateFilters(query: {
  year?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  customerId?: string | undefined;
}): ReportDateFilters {
  const filters: ReportDateFilters = {};
  if (query.year != null && query.year !== "") filters.year = query.year;
  if (query.from != null && query.from !== "") filters.from = query.from;
  if (query.to != null && query.to !== "") filters.to = query.to;
  if (query.customerId != null && query.customerId !== "") filters.customerId = query.customerId;
  return filters;
}

export async function getDashboardSummaryController(req: Request, res: Response) {
  const query = reportsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const data = await getDashboardSummaryService(parseDateFilters(query.data));
  return sendSuccess(res, data);
}

export async function getReportsController(req: Request, res: Response) {
  const query = reportsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const data = await getReportsService(parseDateFilters(query.data));
  return sendSuccess(res, data);
}

export async function getReportsByProductLineController(req: Request, res: Response) {
  const query = reportsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const data = await getReportsByProductLineService(parseDateFilters(query.data));
  return sendSuccess(res, data);
}

export async function getReportsFeedbackByCustomerController(req: Request, res: Response) {
  const query = reportsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const data = await getReportsFeedbackByCustomerService(parseDateFilters(query.data));
  return sendSuccess(res, data);
}

export async function getReportsFeedbackByProductLineController(req: Request, res: Response) {
  const query = reportsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const data = await getReportsFeedbackByProductLineService(parseDateFilters(query.data));
  return sendSuccess(res, data);
}

export async function getMaterialDefectsController(req: Request, res: Response) {
  const query = materialDefectsQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, "Invalid request input", query.error.flatten());
  const data = await getMaterialDefectsService({
    ...parseDateFilters(query.data),
    ...(query.data.limit != null ? { limit: query.data.limit } : {}),
  });
  return sendSuccess(res, data);
}

export async function getBadgesController(req: Request, res: Response) {
  const userId = (req as { user?: { id?: string } }).user?.id ?? null;
  const data = await getBadgesService({ userId });
  return sendSuccess(res, data);
}
