import { z } from "zod";

const productStatusEnum = z.enum(["developing", "producing", "equipped", "stopped"]);

export const createProductSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  status: productStatusEnum.optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  manufacturer: z.string().optional(),
  unit: z.string().optional(),
  yearReleased: z.number().int().min(1900).max(2100).optional(),
  totalProduced: z.number().int().nonnegative().optional(),
});

export const updateProductSchema = createProductSchema.partial().refine((o) => Object.keys(o).length > 0, {
  message: "Cần ít nhất một trường cập nhật",
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});
