import { z } from "zod";

export const createContractSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  value: z.number(),
  products: z.number().int().nonnegative().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  warrantyEnd: z.coerce.date().optional(),
  status: z.enum(["draft", "active", "completed", "late", "liquidated"]).optional(),
  progress: z.number().int().nonnegative().optional(),
  terms: z.string().optional().nullable(),
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

export const setContractProductsSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
    }),
  ),
});

