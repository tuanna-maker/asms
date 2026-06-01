import { z } from "zod";

export const createWarrantySchema = z.object({
  contractId: z.string().optional().nullable(),
  customerId: z.string().min(1),
  productId: z.string().optional().nullable(),
  /** Vật tư BOM của thiết bị (id hoặc mã), tùy chọn */
  materialIds: z.array(z.string().min(1)).max(100).optional(),
  assigneeId: z.string().optional().nullable(),
  issue: z.string().min(1),
  type: z.enum(["warranty", "repair", "maintenance"]),
  priorityCode: z.string().min(1).optional(),
  source: z.string().optional(),
  statusCode: z.string().min(1).optional(),
  /** Đồng bộ với bước quy trình (1-based); có thể >5 nếu workflow định nghĩa nhiều bước. */
  workflowStep: z.number().int().min(1).max(99).optional(),
  /** Quy trình áp dụng khi tạo — nếu có thì gắn instance theo workflow này thay vì auto-resolve. */
  workflowId: z.string().min(1).optional(),
  slaHours: z.number().int().nonnegative().optional(),
  resolvedAt: z.coerce.date().optional(),
  receiptCategory: z.enum(["incident", "technical_support"]).optional().nullable(),
  occurredAt: z.string().optional().nullable(),
  productSerialSnapshot: z.string().optional().nullable(),
  rootCause: z.enum(["manufacturer", "customer", "unknown"]).optional().nullable(),
  handlingPlan: z.string().optional().nullable(),
  plannedHours: z.number().int().nonnegative().optional().nullable(),
  costEstimate: z.union([z.number(), z.string(), z.null()]).optional(),
  customerDisagreedClose: z.boolean().optional(),
  executionMode: z.enum(["self", "outsource"]).optional().nullable(),
  outsourcePartner: z.string().optional().nullable(),
  outsourceBudget: z.union([z.number(), z.string(), z.null()]).optional(),
  outsourceTimeline: z.string().optional().nullable(),
  repairDetails: z.string().optional().nullable(),
  postRepairAssessment: z.string().optional().nullable(),
  handoverNotes: z.string().optional().nullable(),
  /** Nội dung theo workflowStepId — merge partial khi PUT */
  stepPayloads: z.record(z.string().min(1), z.record(z.string(), z.unknown())).optional(),
  /** Khi đổi quy trình: xóa payload stepId không còn trong QT mới */
  pruneOrphanStepPayloads: z.boolean().optional(),
});

export const updateWarrantySchema = createWarrantySchema.partial();

export type CreateWarrantyBody = z.infer<typeof createWarrantySchema>;
export type UpdateWarrantyBody = z.infer<typeof updateWarrantySchema>;

export const warrantyIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listWarrantiesQuerySchema = z.object({
  statusCode: z.string().optional(),
  type: z.enum(["warranty", "repair", "maintenance"]).optional(),
  customerId: z.string().optional(),
  productId: z.string().optional(),
});
