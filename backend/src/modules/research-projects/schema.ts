import { z } from "zod";

export const createResearchProjectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  department: z.string().optional(),
  fundingSource: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  description: z.string().optional(),
  managerId: z.string().optional(),
});

export const updateResearchProjectSchema = createResearchProjectSchema.partial().extend({
  status: z.enum(["planning", "active", "completed", "suspended"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  budget: z.number().optional(),
  budgetSpent: z.number().optional(),
});

export const researchProjectIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listResearchProjectsQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["planning", "active", "completed", "suspended"]).optional(),
});
