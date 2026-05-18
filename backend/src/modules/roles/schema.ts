import { z } from "zod";

export const listRolesQuerySchema = z.object({
  search: z.string().optional(),
  includeInactive: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

export const roleIdParamSchema = z.object({
  id: z.string().min(1),
});

const codeSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9_-]+$/i, "Mã vai trò chỉ chứa chữ, số, _, -");

export const createRoleSchema = z.object({
  code: codeSchema,
  name: z.string().min(1).max(128),
  description: z.string().max(512).optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

export const updateRoleSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().min(1).max(128).optional(),
  description: z.string().max(512).nullish(),
  isActive: z.coerce.boolean().optional(),
});
