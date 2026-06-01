import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import {
  assignmentIdParamSchema,
  closeFeedbackSchema,
  createCustomerFeedbackSchema,
  customerFeedbackIdParamSchema,
  linkageOptionsQuerySchema,
  listCustomerFeedbacksQuerySchema,
  noteBodySchema,
  routingPreviewQuerySchema,
  updateAssignmentSchema,
  updateCustomerFeedbackSchema,
  createFeedbackCommentSchema,
  feedbackAnalyticsQuerySchema,
  feedbackAnalyticsCustomerIdParamSchema,
} from "./schema";
import {
  getFeedbackAnalyticsByCustomerService,
  getFeedbackAnalyticsByMaterialService,
  getFeedbackAnalyticsByProductService,
  getFeedbackAnalyticsCustomerDetailService,
} from "./analytics";
import { getFeedbackLinkageOptionsService } from "./linkage-options";

import {
  closeFeedbackServiceWrapped,
  createCustomerFeedbackService,
  getCustomerFeedbackDetailService,
  getFeedbackAssignmentSummaryService,
  listCustomerFeedbacksService,
  previewRoutingService,
  reopenFeedbackServiceWrapped,
  requestCloseFeedbackServiceWrapped,
  softDeleteCustomerFeedbackService,
  updateAssignmentService,
  updateCustomerFeedbackService,
  createFeedbackCommentService,
} from "./service";

function viewerFromReq(req: Request) {
  return {
    userId: req.user?.id ?? "",
    roleCode: req.user?.role ?? null,
  };
}

export async function linkageOptionsController(req: Request, res: Response) {
  const query = zodParseOrThrow(linkageOptionsQuerySchema, req.query);
  const contractIds =
    query.contractIds?.length
      ? query.contractIds
      : query.contractId
        ? [query.contractId]
        : undefined;
  const input: Parameters<typeof getFeedbackLinkageOptionsService>[0] = {
    customerId: query.customerId,
  };
  if (contractIds !== undefined) input.contractIds = contractIds;
  if (query.productIds !== undefined) input.productIds = query.productIds;
  if (query.materialIds !== undefined) input.materialIds = query.materialIds;
  const data = await getFeedbackLinkageOptionsService(input);
  return sendSuccess(res, data);
}

export async function routingPreviewController(req: Request, res: Response) {
  const query = zodParseOrThrow(routingPreviewQuerySchema, req.query);
  const data = await previewRoutingService(query.productIds);
  return sendSuccess(res, data);
}

export async function feedbackSummaryController(req: Request, res: Response) {
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const data = await getFeedbackAssignmentSummaryService(viewer.userId, viewer.roleCode);
  return sendSuccess(res, data);
}

function parseAnalyticsFilters(req: Request) {
  const raw = zodParseOrThrow(feedbackAnalyticsQuerySchema, req.query);
  const filters: Parameters<typeof getFeedbackAnalyticsByCustomerService>[0] = {};
  if (raw.year !== undefined) filters.year = raw.year;
  if (raw.from !== undefined) filters.from = raw.from;
  if (raw.to !== undefined) filters.to = raw.to;
  if (raw.customerId !== undefined) filters.customerId = raw.customerId;
  if (raw.contractId !== undefined) filters.contractId = raw.contractId;
  if (raw.status !== undefined) filters.status = raw.status;
  if (raw.limit !== undefined) filters.limit = raw.limit;
  return filters;
}

export async function feedbackAnalyticsByCustomerController(req: Request, res: Response) {
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const query = parseAnalyticsFilters(req);
  const data = await getFeedbackAnalyticsByCustomerService(query, viewer);
  return sendSuccess(res, data);
}

export async function feedbackAnalyticsByProductController(req: Request, res: Response) {
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const query = parseAnalyticsFilters(req);
  const data = await getFeedbackAnalyticsByProductService(query, viewer);
  return sendSuccess(res, data);
}

export async function feedbackAnalyticsByMaterialController(req: Request, res: Response) {
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const query = parseAnalyticsFilters(req);
  const data = await getFeedbackAnalyticsByMaterialService(query, viewer);
  return sendSuccess(res, data);
}

export async function feedbackAnalyticsCustomerDetailController(req: Request, res: Response) {
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const { customerId } = zodParseOrThrow(feedbackAnalyticsCustomerIdParamSchema, req.params);
  const query = parseAnalyticsFilters(req);
  const data = await getFeedbackAnalyticsCustomerDetailService(customerId, query, viewer);
  return sendSuccess(res, data);
}

export async function listCustomerFeedbacksController(req: Request, res: Response) {
  const query = zodParseOrThrow(listCustomerFeedbacksQuerySchema, req.query);
  const data = await listCustomerFeedbacksService(query, viewerFromReq(req));
  return sendSuccess(res, data);
}

export async function getCustomerFeedbackDetailController(req: Request, res: Response) {
  try {
    const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
    const data = await getCustomerFeedbackDetailService(id, viewerFromReq(req));
    return sendSuccess(res, data);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    // eslint-disable-next-line no-console
    console.error("[customer-feedbacks] get detail failed", err);
    throw err;
  }
}

export async function createCustomerFeedbackController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createCustomerFeedbackSchema, req.body);
  const data = await createCustomerFeedbackService(
    {
      ...payload,
      createdById: req.user?.id ?? null,
    },
    viewerFromReq(req),
  );
  return sendSuccess(res, data, "Customer feedback created");
}

export async function createFeedbackCommentController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const payload = zodParseOrThrow(createFeedbackCommentSchema, req.body);
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const data = await createFeedbackCommentService(id, viewer, payload);
  return sendSuccess(res, data, "Đã ghi cập nhật");
}

export async function updateCustomerFeedbackController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateCustomerFeedbackSchema, req.body);
  const data = await updateCustomerFeedbackService(
    id,
    payload as Record<string, unknown>,
    viewerFromReq(req),
  );
  return sendSuccess(res, data, "Customer feedback updated");
}

export async function deleteCustomerFeedbackController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const data = await softDeleteCustomerFeedbackService(id);
  return sendSuccess(res, data, "Customer feedback deleted");
}

export async function updateAssignmentController(req: Request, res: Response) {
  const { assignmentId } = zodParseOrThrow(assignmentIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateAssignmentSchema, req.body);
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const input: Parameters<typeof updateAssignmentService>[3] = {};
  if (payload.status !== undefined) input.status = payload.status;
  if (payload.responseNote !== undefined && payload.responseNote !== null) {
    input.responseNote = payload.responseNote;
  }
  const data = await updateAssignmentService(assignmentId, viewer.userId, viewer.roleCode, input);
  return sendSuccess(res, data, "Đã cập nhật");
}

export async function requestCloseController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const body = zodParseOrThrow(noteBodySchema, req.body ?? {});
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const data = await requestCloseFeedbackServiceWrapped(id, viewer.userId, viewer.roleCode, body.note ?? undefined);
  return sendSuccess(res, data, "Đã chuyển chờ đóng");
}

export async function closeFeedbackController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const body = zodParseOrThrow(closeFeedbackSchema, req.body);
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const input: Parameters<typeof closeFeedbackServiceWrapped>[3] = {
    customerVerified: body.customerVerified,
  };
  if (body.note !== undefined && body.note !== null) input.note = body.note;
  const data = await closeFeedbackServiceWrapped(id, viewer.userId, viewer.roleCode, input);
  return sendSuccess(res, data, "Đã đóng phản ánh");
}

export async function reopenFeedbackController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(customerFeedbackIdParamSchema, req.params);
  const body = zodParseOrThrow(noteBodySchema, req.body ?? {});
  const viewer = viewerFromReq(req);
  if (!viewer.userId) throw new HttpError(401, "Unauthorized");
  const data = await reopenFeedbackServiceWrapped(id, viewer.userId, viewer.roleCode, body.note ?? undefined);
  return sendSuccess(res, data, "Đã mở lại");
}
