import { z } from "zod";

export const createMaterialSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["identified", "consumable"]),
  serial: z.string().nullable().optional(),
  quantity: z.number().int().nonnegative(),
  available: z.number().int().nonnegative().optional(),
  unit: z.string().min(1),
  warehouse: z.string().min(1),
  description: z.string().optional(),
});

export const updateMaterialSchema = createMaterialSchema.partial();

export const materialIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listMaterialsQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(["identified", "consumable"]).optional(),
  warehouse: z.string().optional(),
});

const materialTransferTypeEnum = z.enum(["contract", "warranty", "repair"]);
const materialTransferStatusEnum = z.enum(["pending", "processing", "completed"]);

export const listMaterialTransfersQuerySchema = z.object({
  search: z.string().optional(),
  type: materialTransferTypeEnum.optional(),
  status: materialTransferStatusEnum.optional(),
});

export const createMaterialTransferSchema = z.object({
  materialId: z.string().min(1),
  quantity: z.number().int().positive(),
  destination: z.string().min(1),
  type: materialTransferTypeEnum,
  status: materialTransferStatusEnum.optional(),
  transferDate: z.coerce.date().optional(),
});

export const updateMaterialTransferSchema = z
  .object({
    destination: z.string().min(1).optional(),
    status: materialTransferStatusEnum.optional(),
    type: materialTransferTypeEnum.optional(),
  })
  .refine((o) => o.destination !== undefined || o.status !== undefined || o.type !== undefined, {
    message: "Provide at least one of destination, status, type",
  });

export const materialTransferIdParamSchema = z.object({
  id: z.string().min(1),
});

