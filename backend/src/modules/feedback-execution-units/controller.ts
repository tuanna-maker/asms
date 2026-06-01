import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import {
  createRoutingRuleSchema,
  createUnitSchema,
  routingRuleIdParamSchema,
  unitIdParamSchema,
  updateRoutingRuleSchema,
  updateUnitSchema,
} from "./schema";
import {
  createFeedbackExecutionUnitService,
  createRoutingRuleService,
  deleteFeedbackExecutionUnitService,
  deleteRoutingRuleService,
  listFeedbackExecutionUnitsService,
  listRoutingRulesService,
  updateFeedbackExecutionUnitService,
  updateRoutingRuleService,
} from "./service";

export async function listUnitsController(_req: Request, res: Response) {
  const data = await listFeedbackExecutionUnitsService();
  return sendSuccess(res, data);
}

export async function createUnitController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createUnitSchema, req.body);
  const data = await createFeedbackExecutionUnitService(payload);
  return sendSuccess(res, data, "Đã tạo đơn vị");
}

export async function updateUnitController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(unitIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateUnitSchema, req.body);
  const data = await updateFeedbackExecutionUnitService(id, payload);
  return sendSuccess(res, data, "Đã cập nhật đơn vị");
}

export async function deleteUnitController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(unitIdParamSchema, req.params);
  const data = await deleteFeedbackExecutionUnitService(id);
  return sendSuccess(res, data, "Đã xóa đơn vị");
}

export async function listRoutingRulesController(req: Request, res: Response) {
  const unitId = typeof req.query.unitId === "string" ? req.query.unitId : undefined;
  const data = await listRoutingRulesService(unitId);
  return sendSuccess(res, data);
}

export async function createRoutingRuleController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createRoutingRuleSchema, req.body);
  const data = await createRoutingRuleService(payload);
  return sendSuccess(res, data, "Đã tạo rule");
}

export async function updateRoutingRuleController(req: Request, res: Response) {
  const { ruleId } = zodParseOrThrow(routingRuleIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateRoutingRuleSchema, req.body);
  const data = await updateRoutingRuleService(ruleId, payload);
  return sendSuccess(res, data, "Đã cập nhật rule");
}

export async function deleteRoutingRuleController(req: Request, res: Response) {
  const { ruleId } = zodParseOrThrow(routingRuleIdParamSchema, req.params);
  const data = await deleteRoutingRuleService(ruleId);
  return sendSuccess(res, data, "Đã xóa rule");
}
