import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "./schema";

import {
  createTaskService,
  getTaskDetailService,
  listTasksService,
  softDeleteTaskService,
  updateTaskService,
} from "./service";

export async function listTasksController(req: Request, res: Response) {
  const query = zodParseOrThrow(listTasksQuerySchema, req.query);
  const input: { status?: string; priorityCode?: string; type?: string; projectId?: string } = {};
  if (query.status !== undefined) input.status = query.status;
  if (query.priorityCode !== undefined) input.priorityCode = query.priorityCode;
  if (query.type !== undefined) input.type = query.type;
  if (query.projectId !== undefined) input.projectId = query.projectId;
  const data = await listTasksService(input);
  return sendSuccess(res, data);
}

export async function getTaskDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(taskIdParamSchema, req.params);
  const data = await getTaskDetailService(id);
  return sendSuccess(res, data);
}

export async function createTaskController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createTaskSchema, req.body);
  const input: Parameters<typeof createTaskService>[0] = { title: payload.title };
  if (payload.projectId !== undefined) input.projectId = payload.projectId;
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.startDate !== undefined) input.startDate = payload.startDate;
  if (payload.deadline !== undefined) input.deadline = payload.deadline;
  if (payload.priorityCode !== undefined) input.priorityCode = payload.priorityCode;
  if (payload.status !== undefined) input.status = payload.status;
  if (payload.type !== undefined) input.type = payload.type;
  if (payload.assigneeId !== undefined) input.assigneeId = payload.assigneeId;
  if (payload.progress !== undefined) input.progress = payload.progress;
  const data = await createTaskService(input);
  return sendSuccess(res, data, "Task created");
}

export async function updateTaskController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(taskIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateTaskSchema, req.body);
  const input: Parameters<typeof updateTaskService>[1] = {};
  if (payload.projectId !== undefined) input.projectId = payload.projectId;
  if (payload.code !== undefined) input.code = payload.code;
  if (payload.title !== undefined) input.title = payload.title;
  if (payload.description !== undefined) input.description = payload.description;
  if (payload.startDate !== undefined) input.startDate = payload.startDate;
  if (payload.deadline !== undefined) input.deadline = payload.deadline;
  if (payload.priorityCode !== undefined) input.priorityCode = payload.priorityCode;
  if (payload.status !== undefined) input.status = payload.status;
  if (payload.type !== undefined) input.type = payload.type;
  if (payload.assigneeId !== undefined) input.assigneeId = payload.assigneeId;
  if (payload.progress !== undefined) input.progress = payload.progress;
  if (Object.keys(input).length === 0) throw new HttpError(400, "No fields to update");
  const data = await updateTaskService(id, input);
  return sendSuccess(res, data, "Task updated");
}

export async function deleteTaskController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(taskIdParamSchema, req.params);
  const data = await softDeleteTaskService(id);
  return sendSuccess(res, data, "Task deleted");
}

