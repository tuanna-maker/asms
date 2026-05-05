import { z } from "zod";

export const createWarrantySchema = z.object({
  contractId: z.string().optional(),
  customerId: z.string().min(1),
  productId: z.string().optional(),
  assigneeId: z.string().optional(),
  issue: z.string().min(1),
  type: z.enum(["warranty", "repair", "maintenance"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  source: z.string().optional(),
  status: z.enum(["open", "processing", "completed", "cancelled"]).optional(),
  workflowStep: z.number().int().nonnegative().optional(),
  slaHours: z.number().int().nonnegative().optional(),
  resolvedAt: z.coerce.date().optional(),
});

export const updateWarrantySchema = createWarrantySchema.partial();

export const warrantyIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listWarrantiesQuerySchema = z.object({
  status: z.enum(["open", "processing", "completed", "cancelled"]).optional(),
  type: z.enum(["warranty", "repair", "maintenance"]).optional(),
  customerId: z.string().optional(),
  productId: z.string().optional(),
});

