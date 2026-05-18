import { z } from "zod";

const handoverStatusEnum = z.enum(["pending", "active", "completed", "late"]);

const handoverFlatFieldsSchema = {
  handoverPlan: z.string().max(10000).optional().nullable(),
  costReportNote: z.string().max(10000).optional().nullable(),
  goodsCheckNote: z.string().max(10000).optional().nullable(),
  trainingPlanNote: z.string().max(10000).optional().nullable(),
  trainingCostReport: z.string().max(10000).optional().nullable(),
  tempHandoverNote: z.string().max(10000).optional().nullable(),
  trainingReportNote: z.string().max(10000).optional().nullable(),
  trainingDecision: z.string().max(10000).optional().nullable(),
  finalHandoverNote: z.string().max(10000).optional().nullable(),
  stepPayloads: z.record(z.string().min(1), z.record(z.string(), z.unknown())).optional(),
  pruneOrphanStepPayloads: z.boolean().optional(),
};

export const listHandoversQuerySchema = z.object({
  status: handoverStatusEnum.optional(),
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  search: z.string().optional(),
  /** Lọc theo mã quy trình (vd. WF_HANDOVER_DONG_H). */
  workflowCode: z.string().min(1).optional(),
});

export const handoverIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createHandoverSchema = z.object({
  contractId: z.string().min(1),
  products: z.number().int().nonnegative().optional(),
  currentStep: z.number().int().min(1).max(99).optional(),
  status: handoverStatusEnum.optional(),
  typeCode: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional(),
  startDate: z.coerce.date().optional(),
  workflowId: z.string().min(1).optional(),
  ...handoverFlatFieldsSchema,
});

export const updateHandoverSchema = createHandoverSchema
  .partial()
  .extend({
    completedAt: z.coerce.date().nullable().optional(),
  });

export type CreateHandoverBody = z.infer<typeof createHandoverSchema>;
export type UpdateHandoverBody = z.infer<typeof updateHandoverSchema>;
