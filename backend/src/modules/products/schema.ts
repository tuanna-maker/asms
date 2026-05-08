import { z } from "zod";

const productStatusEnum = z.enum(["developing", "producing", "equipped", "stopped"]);

export const productSpecSchema = z.object({
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  unit: z.string().max(32).optional(),
});

export const createProductSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  status: productStatusEnum.optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  customerId: z.string().optional(),
  manufacturer: z.string().optional(),
  unit: z.string().optional(),
  yearReleased: z.number().int().min(1900).max(2100).optional(),
  totalProduced: z.number().int().nonnegative().optional(),
  specs: z.array(productSpecSchema).optional(),
});

export const updateProductSchema = createProductSchema.partial().refine((o) => Object.keys(o).length > 0, {
  message: "Cần ít nhất một trường cập nhật",
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const upsertProductBomSchema = z.object({
  materialId: z.string().min(1),
  quantity: z.number().int().positive(),
  serialNumbers: z.array(z.string().min(1)).optional(),
});

export const updateProductBomSchema = z
  .object({
    quantity: z.number().int().positive().optional(),
    serialNumbers: z.array(z.string().min(1)).optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "Cần ít nhất một trường cập nhật",
  });

export const productBomParamSchema = z.object({
  id: z.string().min(1),
  materialId: z.string().min(1),
});
