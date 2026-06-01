import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { sendSuccess } from "../../lib/response";
import { writeAudit } from "../../lib/audit";

import {
  advanceInstanceSchema,
  attachWorkflowSchema,
  createWorkflowSchema,
  entityInstanceQuerySchema,
  idParamSchema,
  listWorkflowsQuerySchema,
  reorderStepsSchema,
  stepIdParamSchema,
  updateWorkflowSchema,
  upsertStepSchema,
} from "./schema";
import {
  addStepService,
  createWorkflowService,
  deleteStepService,
  getWorkflowDetailService,
  listWorkflowsService,
  reorderStepsService,
  softDeleteWorkflowService,
  updateStepService,
  updateWorkflowService,
} from "./service";
import {
  advanceInstanceService,
  attachWorkflowToEntity,
  getInstanceByIdService,
  getInstanceForEntity,
} from "./runtime";

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown) {
  const r = schema.safeParse(input);
  if (!r.success) throw new HttpError(400, "Dữ liệu yêu cầu không hợp lệ", r.error.flatten());
  return r.data;
}

export async function listWorkflowsController(req: Request, res: Response) {
  const query = parseOrThrow(listWorkflowsQuerySchema, req.query);
  const data = await listWorkflowsService(query.moduleKey);
  return sendSuccess(res, data);
}

export async function getWorkflowController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const data = await getWorkflowDetailService(id);
  return sendSuccess(res, data);
}

export async function createWorkflowController(req: Request, res: Response) {
  const payload = parseOrThrow(createWorkflowSchema, req.body);
  const input: Parameters<typeof createWorkflowService>[0] = {
    name: payload.name,
    moduleKey: payload.moduleKey,
    actorId: req.user?.id ?? null,
  };
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  const data = await createWorkflowService(input);
  await writeAudit(req, {
    action: "create",
    entity: "workflow",
    entityId: data.id,
    summary: `Tạo quy trình «${data.name}» (${data.moduleKey})`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function updateWorkflowController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const payload = parseOrThrow(updateWorkflowSchema, req.body);
  const input: Parameters<typeof updateWorkflowService>[1] = { actorId: req.user?.id ?? null };
  if (payload.name !== undefined) input.name = payload.name;
  if (payload.moduleKey !== undefined) input.moduleKey = payload.moduleKey;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.isActive !== undefined) input.isActive = payload.isActive;
  if (payload.entityFieldSchema !== undefined) input.entityFieldSchema = payload.entityFieldSchema;
  const data = await updateWorkflowService(id, input);
  await writeAudit(req, {
    action: "update",
    entity: "workflow",
    entityId: data.id,
    summary: `Cập nhật quy trình «${data.name}»`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function deleteWorkflowController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const data = await softDeleteWorkflowService(id);
  await writeAudit(req, {
    action: "delete",
    entity: "workflow",
    entityId: id,
    summary: `Xoá quy trình ${id}`,
  });
  return sendSuccess(res, data);
}

export async function addStepController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const payload = parseOrThrow(upsertStepSchema, req.body);
  const input: Parameters<typeof addStepService>[1] = {
    name: payload.name,
    actionCode: payload.actionCode,
    roleCode: payload.roleCode,
  };
  if (payload.slaHours !== undefined) input.slaHours = payload.slaHours;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.phaseCode !== undefined) input.phaseCode = payload.phaseCode;
  if (payload.requireDocument !== undefined) input.requireDocument = payload.requireDocument;
  if (payload.fieldSchema !== undefined) input.fieldSchema = payload.fieldSchema;
  if (payload.assigneeIds !== undefined) input.assigneeIds = payload.assigneeIds;
  const data = await addStepService(id, input);
  await writeAudit(req, {
    action: "create",
    entity: "workflow_step",
    entityId: data.id,
    summary: `Thêm bước «${data.name}» (quy trình ${id})`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function updateStepController(req: Request, res: Response) {
  const { id, stepId } = parseOrThrow(stepIdParamSchema, req.params);
  const payload = parseOrThrow(upsertStepSchema.partial(), req.body);
  const input: Parameters<typeof updateStepService>[2] = {};
  if (payload.name !== undefined) input.name = payload.name;
  if (payload.actionCode !== undefined) input.actionCode = payload.actionCode;
  if (payload.roleCode !== undefined) input.roleCode = payload.roleCode;
  if (payload.slaHours !== undefined) input.slaHours = payload.slaHours;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.phaseCode !== undefined) input.phaseCode = payload.phaseCode;
  if (payload.requireDocument !== undefined) input.requireDocument = payload.requireDocument;
  if (payload.fieldSchema !== undefined) input.fieldSchema = payload.fieldSchema;
  if (payload.assigneeIds !== undefined) input.assigneeIds = payload.assigneeIds;
  const data = await updateStepService(id, stepId, input);
  await writeAudit(req, {
    action: "update",
    entity: "workflow_step",
    entityId: data.id,
    summary: `Sửa bước «${data.name}» (quy trình ${id})`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function deleteStepController(req: Request, res: Response) {
  const { id, stepId } = parseOrThrow(stepIdParamSchema, req.params);
  const data = await deleteStepService(id, stepId);
  await writeAudit(req, {
    action: "delete",
    entity: "workflow_step",
    entityId: stepId,
    summary: `Xoá bước ${stepId} khỏi quy trình ${id}`,
  });
  return sendSuccess(res, data);
}

export async function reorderStepsController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const payload = parseOrThrow(reorderStepsSchema, req.body);
  const result = await reorderStepsService(id, payload.items);
  await writeAudit(req, {
    action: "reorder",
    entity: "workflow_step",
    entityId: id,
    summary: `Sắp xếp lại các bước của quy trình ${id} (${result.count} mục)`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, result);
}

export async function getInstanceForEntityController(req: Request, res: Response) {
  const query = parseOrThrow(entityInstanceQuerySchema, req.query);
  const data = await getInstanceForEntity(query.moduleKey, query.entityId);
  return sendSuccess(res, data);
}

export async function getInstanceController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const data = await getInstanceByIdService(id);
  return sendSuccess(res, data);
}

export async function attachWorkflowController(req: Request, res: Response) {
  const payload = parseOrThrow(attachWorkflowSchema, req.body);
  const data = await attachWorkflowToEntity({
    moduleKey: payload.moduleKey,
    entityId: payload.entityId,
    workflowId: payload.workflowId,
    actorId: req.user?.id ?? null,
  });
  await writeAudit(req, {
    action: "update",
    entity: "workflow_instance",
    entityId: data.id,
    summary: `Áp dụng quy trình ${data.workflow.code} cho ${payload.moduleKey} ${payload.entityId}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}

export async function advanceInstanceController(req: Request, res: Response) {
  const { id } = parseOrThrow(idParamSchema, req.params);
  const payload = parseOrThrow(advanceInstanceSchema, req.body);
  if (!req.user?.id) {
    throw new HttpError(401, "Yêu cầu xác thực");
  }
  const data = await advanceInstanceService({
    instanceId: id,
    action: payload.action,
    comment: payload.comment ?? null,
    actorId: req.user.id,
    actorRoleCode: req.user.role ?? "",
  });
  await writeAudit(req, {
    action: "advance",
    entity: "workflow_instance",
    entityId: id,
    summary: `Tiến trình ${data.workflow.code}: ${payload.action}`,
    payload: payload as Record<string, unknown>,
  });
  return sendSuccess(res, data);
}
