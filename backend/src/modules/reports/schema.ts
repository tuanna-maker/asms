import { z } from "zod";

export const reportDateQuerySchema = z.object({
  year: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  customerId: z.string().optional(),
});

export const reportsQuerySchema = reportDateQuerySchema;

export const materialDefectsQuerySchema = reportDateQuerySchema.extend({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

