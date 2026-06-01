import { z } from "zod";

export const unitIdParamSchema = z.object({ id: z.string().min(1) });

export const createUnitSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  roleCodes: z.array(z.string()).default([]),
  notifyUserIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateUnitSchema = createUnitSchema.partial();

export const createRoutingRuleSchema = z.object({
  unitId: z.string().min(1),
  productId: z.string().optional().nullable(),
  productCategory: z.string().optional().nullable(),
  priority: z.number().int().default(0),
});

export const updateRoutingRuleSchema = createRoutingRuleSchema.partial().omit({ unitId: true });

export const routingRuleIdParamSchema = z.object({ ruleId: z.string().min(1) });

export const previewRoutingQuerySchema = z.object({
  productIds: z.union([z.string(), z.array(z.string())]).transform((v) =>
    Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean),
  ),
});
