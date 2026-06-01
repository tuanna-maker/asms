import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import {
  createScheduleSessionSchema,
  createTraineeSchema,
  createTrainingCourseSchema,
  listTrainingQuerySchema,
  sessionIdParamSchema,
  traineeIdParamSchema,
  trainingIdParamSchema,
  updateScheduleSessionSchema,
  updateTraineeSchema,
  updateTrainingCourseSchema,
} from "./schema";

import {
  addScheduleSessionService,
  addTraineeService,
  createTrainingCourseService,
  getTrainingCourseDetailService,
  listTrainingCoursesService,
  softDeleteScheduleSessionService,
  softDeleteTraineeService,
  softDeleteTrainingCourseService,
  updateScheduleSessionService,
  updateTraineeService,
  updateTrainingCourseService,
} from "./service";

export async function listTrainingCoursesController(req: Request, res: Response) {
  const query = zodParseOrThrow(listTrainingQuerySchema, req.query);
  const filters = {
    ...(query.status !== undefined ? { status: query.status } : {}),
    ...(query.typeCode !== undefined ? { typeCode: query.typeCode } : {}),
    ...(query.contractId !== undefined ? { contractId: query.contractId } : {}),
    ...(query.courseKind !== undefined ? { courseKind: query.courseKind } : {}),
  };

  const data = await listTrainingCoursesService(filters);
  return sendSuccess(res, data);
}

export async function getTrainingCourseDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const data = await getTrainingCourseDetailService(id);
  return sendSuccess(res, data);
}

export async function createTrainingCourseController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createTrainingCourseSchema, req.body);
  const normalizedPayload = {
    ...(payload.code !== undefined ? { code: payload.code } : {}),
    ...(payload.contractId !== undefined ? { contractId: payload.contractId } : {}),
    ...(payload.customerId !== undefined ? { customerId: payload.customerId } : {}),
    ...(payload.instructorId !== undefined ? { instructorId: payload.instructorId } : {}),
    title: payload.title,
    typeCode: payload.typeCode,
    startDate: payload.startDate,
    endDate: payload.endDate,
    ...(payload.participants !== undefined ? { participants: payload.participants } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
    ...(payload.location !== undefined ? { location: payload.location } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.workflowId !== undefined ? { workflowId: payload.workflowId } : {}),
    ...(payload.courseKind !== undefined ? { courseKind: payload.courseKind } : {}),
    ...(payload.stepPayloads !== undefined ? { stepPayloads: payload.stepPayloads } : {}),
    actorId: (req as { user?: { id?: string } }).user?.id ?? null,
  };

  const data = await createTrainingCourseService(normalizedPayload);
  return sendSuccess(res, data, "Training course created");
}

export async function updateTrainingCourseController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateTrainingCourseSchema, req.body);
  if (Object.keys(payload).length === 0) throw new HttpError(400, "No fields to update");
  const data = await updateTrainingCourseService(id, {
    ...(payload as Parameters<typeof updateTrainingCourseService>[1]),
    actorId: (req as { user?: { id?: string } }).user?.id ?? null,
  });
  return sendSuccess(res, data, "Training course updated");
}

export async function deleteTrainingCourseController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const data = await softDeleteTrainingCourseService(id);
  return sendSuccess(res, data, "Training course deleted");
}

export async function addTraineeController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const payload = zodParseOrThrow(createTraineeSchema, req.body);
  const normalizedPayload = {
    fullName: payload.fullName,
    attendance: payload.attendance,
    ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
    ...(payload.rank !== undefined ? { rank: payload.rank } : {}),
    ...(payload.score !== undefined ? { score: payload.score } : {}),
  };

  const data = await addTraineeService(id, normalizedPayload);
  return sendSuccess(res, data, "Trainee added");
}

export async function updateTraineeController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const { traineeId } = zodParseOrThrow(traineeIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateTraineeSchema, req.body);
  const data = await updateTraineeService(id, traineeId, payload as Record<string, unknown>);
  return sendSuccess(res, data, "Trainee updated");
}

export async function deleteTraineeController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const { traineeId } = zodParseOrThrow(traineeIdParamSchema, req.params);
  const data = await softDeleteTraineeService(id, traineeId);
  return sendSuccess(res, data, "Trainee deleted");
}

export async function addScheduleSessionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const payload = zodParseOrThrow(createScheduleSessionSchema, req.body);
  const normalizedPayload = {
    date: payload.date,
    startTime: payload.startTime,
    endTime: payload.endTime,
    topic: payload.topic,
    ...(payload.location !== undefined ? { location: payload.location } : {}),
    ...(payload.status !== undefined ? { status: payload.status } : {}),
  };

  const data = await addScheduleSessionService(id, normalizedPayload);
  return sendSuccess(res, data, "Session scheduled");
}

export async function updateScheduleSessionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const { sessionId } = zodParseOrThrow(sessionIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateScheduleSessionSchema, req.body);
  const data = await updateScheduleSessionService(id, sessionId, payload as Record<string, unknown>);
  return sendSuccess(res, data, "Session updated");
}

export async function deleteScheduleSessionController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(trainingIdParamSchema, req.params);
  const { sessionId } = zodParseOrThrow(sessionIdParamSchema, req.params);
  const data = await softDeleteScheduleSessionService(id, sessionId);
  return sendSuccess(res, data, "Session deleted");
}

