import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().optional(),
  code: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  deadline: z.coerce.date().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  status: z.enum(["todo", "in_progress", "review", "completed", "delayed"]).optional(),
  type: z.enum(["research", "report", "fieldwork", "admin", "review"]).optional(),
  assigneeId: z.string().optional(),
  progress: z.number().int().min(0).max(100).optional(),
});

export const updateTaskSchema = createTaskSchema.partial();

export const listTasksQuerySchema = z.object({
  status: z.enum(["todo", "in_progress", "review", "completed", "delayed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  type: z.enum(["research", "report", "fieldwork", "admin", "review"]).optional(),
  projectId: z.string().optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string().min(1),
});

