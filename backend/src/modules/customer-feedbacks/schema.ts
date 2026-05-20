import { z } from "zod";

const severityEnum = z.enum(["low", "medium", "high"]);
const statusEnum = z.enum(["new", "processing", "resolved"]);

export const createCustomerFeedbackSchema = z.object({
  customerId: z.string().min(1),
  contractId: z.string().optional().nullable(),
  warrantyId: z.string().optional().nullable(),
  title: z.string().min(1),
  content: z.string().min(1),
  severity: severityEnum.default("medium"),
  status: statusEnum.default("new"),
  feedbackAt: z.coerce.date(),
});

export const updateCustomerFeedbackSchema = createCustomerFeedbackSchema.partial();

export const customerFeedbackIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listCustomerFeedbacksQuerySchema = z.object({
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  warrantyId: z.string().optional(),
  severity: severityEnum.optional(),
  status: statusEnum.optional(),
});
