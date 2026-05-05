import { z } from "zod";

export const createContractSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  value: z.number(),
  products: z.number().int().nonnegative(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  warrantyEnd: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "completed", "late", "liquidated"]).optional(),
  progress: z.number().int().nonnegative().optional(),
});

export const updateContractSchema = createContractSchema
  .partial()
  .extend({
    status: z
      .enum(["draft", "active", "completed", "late", "liquidated"])
      .optional(),
    progress: z.number().int().nonnegative().optional(),
  });

export const contractIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listContractsQuerySchema = z.object({
  status: z.enum(["draft", "active", "completed", "late", "liquidated"]).optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
});

