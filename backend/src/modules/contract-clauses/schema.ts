import { z } from "zod";

export const listClausesQuerySchema = z.object({
  includeInactive: z
    .union([z.literal("1"), z.literal("true"), z.literal(true)])
    .optional()
    .transform((v) => v === "1" || v === "true" || v === true),
});

export const clauseIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createClauseSchema = z.object({
  code: z.string().min(1).max(64),
  title: z.string().min(1).max(256),
  content: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateClauseSchema = createClauseSchema.partial().extend({
  code: z.string().min(1).max(64).optional(),
});

export const reorderClausesSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const createGroupSchema = z.object({
  code: z.string().min(1).max(64),
  label: z.string().min(1).max(256),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  code: z.string().min(1).max(64).optional(),
});

export const reorderGroupsSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1),
});

export const setGroupMembersSchema = z.object({
  clauseIds: z.array(z.string().min(1)),
});

export const groupIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listGroupsQuerySchema = listClausesQuerySchema;
