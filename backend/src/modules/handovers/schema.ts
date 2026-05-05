import { z } from "zod";

const handoverStatusEnum = z.enum(["pending", "active", "completed", "late"]);

export const listHandoversQuerySchema = z.object({
  status: handoverStatusEnum.optional(),
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  search: z.string().optional(),
});

export const handoverIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createHandoverSchema = z.object({
  contractId: z.string().min(1),
  products: z.number().int().nonnegative(),
  currentStep: z.number().int().min(1).max(5).optional(),
  status: handoverStatusEnum.optional(),
  dueDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
});

export const updateHandoverSchema = createHandoverSchema
  .partial()
  .extend({
    completedAt: z.coerce.date().nullable().optional(),
  });
