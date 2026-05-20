import { z } from "zod";

export const createContractSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  value: z.number(),
  products: z.number().int().nonnegative().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  warrantyEnd: z.coerce.date().optional(),
  endReminderDays: z.coerce.number().int().min(0).max(365).optional(),
  status: z.enum(["draft", "active", "completed", "late", "liquidated"]).optional(),
  progress: z.number().int().nonnegative().optional(),
  workflowId: z.string().min(1).optional(),
  stepPayloads: z.record(z.string().min(1), z.record(z.string(), z.unknown())).optional(),
  terms: z.string().optional().nullable(),
  contractTypeCode: z.string().min(1).max(256).optional().nullable(),
});

export const updateContractSchema = createContractSchema
  .partial()
  .extend({
    status: z
      .enum(["draft", "active", "completed", "late", "liquidated"])
      .optional(),
    progress: z.number().int().nonnegative().optional(),
  });

export const contractIdParamSchema = z.object({
  id: z.string().min(1),
});

export const contractProductParamSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
});

export const listContractsQuerySchema = z.object({
  status: z.enum(["draft", "active", "completed", "late", "liquidated"]).optional(),
  statuses: z
    .union([
      z.array(z.enum(["draft", "active", "completed", "late", "liquidated"])),
      z.enum(["draft", "active", "completed", "late", "liquidated"]),
    ])
    .optional(),
  customerId: z.string().optional(),
  search: z.string().optional(),
  contractTypeCode: z.string().min(1).max(256).optional(),
  signedFrom: z.coerce.date().optional(),
  signedTo: z.coerce.date().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
  /** Chỉ HĐ chưa có bàn giao và chưa có khóa huấn luyện active (dùng cho dropdown tạo mới). */
  eligibleFor: z.enum(["handover", "coaching"]).optional(),
});

export const setContractProductsSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().min(1),
      quantity: z.number().int().positive(),
      specValues: z.record(z.string(), z.string()).optional(),
    }),
  ),
});

export const updateContractProductSchema = z
  .object({
    specValues: z.record(z.string(), z.string()).optional(),
    quantity: z.number().int().positive().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "Cần ít nhất một trường cập nhật",
  });
