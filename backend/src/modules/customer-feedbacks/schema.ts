import { z } from "zod";

import { feedbackIntakeSchema } from "./intake";

const severityEnum = z.enum(["low", "medium", "high"]);
const assigneeTypeEnum = z.enum(["user", "role"]);

export const feedbackAssigneeSchema = z.object({
  type: assigneeTypeEnum,
  userId: z.string().optional().nullable(),
  roleCode: z.string().optional().nullable(),
});
const statusEnum = z.enum([
  "new",
  "assigned",
  "in_progress",
  "pending_close",
  "resolved",
  "reopened",
]);
const sourceEnum = z.enum(["external", "internal"]);
const assignmentStatusEnum = z.enum(["pending", "in_progress", "done"]);

const linkageInputSchema = z.object({
  productId: z.string().min(1),
  materialId: z.string().optional().nullable(),
});

export const createCustomerFeedbackSchema = z.object({
  customerId: z.string().min(1),
  contractId: z.string().optional().nullable(),
  title: z.string().min(1),
  content: z.string().min(1),
  assignee: feedbackAssigneeSchema,
  source: sourceEnum.default("external"),
  intake: feedbackIntakeSchema.optional().default({}),
  feedbackAt: z.coerce.date(),
  linkageItems: z.array(linkageInputSchema).optional().default([]),
});

export const updateCustomerFeedbackSchema = z.object({
  customerId: z.string().min(1).optional(),
  contractId: z.string().optional().nullable(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  assignee: feedbackAssigneeSchema.optional().nullable(),
  source: sourceEnum.optional(),
  intake: feedbackIntakeSchema.optional(),
  feedbackAt: z.coerce.date().optional(),
  linkageItems: z.array(linkageInputSchema).optional(),
});

export const customerFeedbackIdParamSchema = z.object({
  id: z.string().min(1),
});

export const assignmentIdParamSchema = z.object({
  id: z.string().min(1),
  assignmentId: z.string().min(1),
});

export const listCustomerFeedbacksQuerySchema = z.object({
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  warrantyId: z.string().optional(),
  unitId: z.string().optional(),
  status: statusEnum.optional(),
  assignedToMe: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
  search: z.string().optional(),
  feedbackFrom: z.coerce.date().optional(),
  feedbackTo: z.coerce.date().optional(),
  myUnits: z
    .union([z.literal("true"), z.literal("false"), z.boolean()])
    .optional()
    .transform((v) => v === true || v === "true"),
});

export const updateAssignmentSchema = z.object({
  status: assignmentStatusEnum.optional(),
  responseNote: z.string().optional().nullable(),
});

export const closeFeedbackSchema = z.object({
  customerVerified: z.boolean(),
  note: z.string().optional().nullable(),
});

export const noteBodySchema = z.object({
  note: z.string().optional().nullable(),
});

export const createFeedbackCommentSchema = z.object({
  kind: z.enum(["issue", "fix"]),
  body: z.string().min(1),
});

function parseIdList(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  const s = String(raw).trim();
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

export const linkageOptionsQuerySchema = z.object({
  customerId: z.string().min(1),
  contractId: z.string().optional(),
  contractIds: z.preprocess(parseIdList, z.array(z.string())).optional(),
  productIds: z.preprocess(parseIdList, z.array(z.string())).optional(),
  materialIds: z.preprocess(parseIdList, z.array(z.string())).optional(),
});

export const routingPreviewQuerySchema = z.object({
  productIds: z.preprocess(parseIdList, z.array(z.string()).min(1)),
});

export const feedbackAnalyticsQuerySchema = z.object({
  year: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  status: statusEnum.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const feedbackAnalyticsCustomerIdParamSchema = z.object({
  customerId: z.string().min(1),
});
