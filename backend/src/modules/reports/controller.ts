import type { Request, Response } from "express";

import { zodParseOrThrow } from "../../lib/errors/zodParse";
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
  const query = zodParseOrThrow(reportsQuerySchema, req.query);
  const data = await getDashboardSummaryService(parseDateFilters(query));
  return sendSuccess(res, data);
}

export async function getReportsController(req: Request, res: Response) {
  const query = zodParseOrThrow(reportsQuerySchema, req.query);
  const data = await getReportsService(parseDateFilters(query));
  return sendSuccess(res, data);
}

export async function getReportsByProductLineController(req: Request, res: Response) {
  const query = zodParseOrThrow(reportsQuerySchema, req.query);
  const data = await getReportsByProductLineService(parseDateFilters(query));
  return sendSuccess(res, data);
}

export async function getReportsFeedbackByCustomerController(req: Request, res: Response) {
  const query = zodParseOrThrow(reportsQuerySchema, req.query);
  const data = await getReportsFeedbackByCustomerService(parseDateFilters(query));
  return sendSuccess(res, data);
}

export async function getReportsFeedbackByProductLineController(req: Request, res: Response) {
  const query = zodParseOrThrow(reportsQuerySchema, req.query);
  const data = await getReportsFeedbackByProductLineService(parseDateFilters(query));
  return sendSuccess(res, data);
}

export async function getMaterialDefectsController(req: Request, res: Response) {
  const query = zodParseOrThrow(materialDefectsQuerySchema, req.query);
  const data = await getMaterialDefectsService({
    ...parseDateFilters(query),
    ...(query.limit != null ? { limit: query.limit } : {}),
  });
  return sendSuccess(res, data);
}

export async function getBadgesController(req: Request, res: Response) {
  const userId = (req as { user?: { id?: string } }).user?.id ?? null;
  const data = await getBadgesService({ userId });
  return sendSuccess(res, data);
}
