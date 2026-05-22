import { z } from "zod";

const categorySchema = z
  .string()
  .min(1, "category required")
  .max(128)
  .regex(/^[a-z0-9_.-]+$/i, "category chỉ chứa chữ, số, _, ., -");

const codeSchema = z
  .string()
  .min(1)
  .max(256);

export const listDefinitionsQuerySchema = z.object({
  category: categorySchema,
  includeInactive: z
    .union([z.literal("1"), z.literal("true"), z.literal("0"), z.literal("false")])
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

export const definitionIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createDefinitionSchema = z.object({
  category: categorySchema,
  code: codeSchema,
  label: z.string().min(1).max(512),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  slaHours: z.coerce.number().int().min(0).nullable().optional(),
});

export const updateDefinitionSchema = z.object({
  code: codeSchema.optional(),
  label: z.string().min(1).max(512).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isActive: z.coerce.boolean().optional(),
  slaHours: z.coerce.number().int().min(0).nullable().optional(),
});

export const reorderDefinitionsSchema = z.object({
  category: categorySchema,
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        sortOrder: z.coerce.number().int().nonnegative(),
      }),
    )
    .min(1),
});
