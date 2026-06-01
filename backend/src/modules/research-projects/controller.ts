import type { Request, Response } from "express";
import { z } from "zod";

import { HttpError } from "../../lib/errors/HttpError";
import { zodParseOrThrow } from "../../lib/errors/zodParse";
import { sendSuccess } from "../../lib/response";

import {
  createResearchProjectSchema,
  listResearchProjectsQuerySchema,
  researchProjectIdParamSchema,
  updateResearchProjectSchema,
} from "./schema";

import {
  createResearchProjectService,
  getResearchProjectDetailService,
  listResearchProjectsService,
  softDeleteResearchProjectService,
  updateResearchProjectService,
} from "./service";

export async function listResearchProjectsController(req: Request, res: Response) {
  const query = zodParseOrThrow(listResearchProjectsQuerySchema, req.query);
  const data = await listResearchProjectsService(query);
  return sendSuccess(res, data);
}

export async function getResearchProjectDetailController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(researchProjectIdParamSchema, req.params);
  const data = await getResearchProjectDetailService(id);
  return sendSuccess(res, data);
}

export async function createResearchProjectController(req: Request, res: Response) {
  const payload = zodParseOrThrow(createResearchProjectSchema, req.body);
  const data = await createResearchProjectService(payload);
  return sendSuccess(res, data, "Research project created");
}

export async function updateResearchProjectController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(researchProjectIdParamSchema, req.params);
  const payload = zodParseOrThrow(updateResearchProjectSchema, req.body);
  const data = await updateResearchProjectService(id, payload as Record<string, unknown>);
  return sendSuccess(res, data, "Research project updated");
}

export async function deleteResearchProjectController(req: Request, res: Response) {
  const { id } = zodParseOrThrow(researchProjectIdParamSchema, req.params);
  const data = await softDeleteResearchProjectService(id);
  return sendSuccess(res, data, "Research project deleted");
}
