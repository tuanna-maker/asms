import type { Prisma } from "@prisma/client";
import { z } from "zod";

export const feedbackIntakeSchema = z.object({
  channel: z.enum(["phone", "email", "direct", "other"]).optional().nullable(),
  contactId: z.string().optional().nullable(),
  contactName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  customerStatement: z.string().optional().nullable(),
  symptom: z.string().optional().nullable(),
  whenOccurred: z.string().optional().nullable(),
  isBlocking: z.boolean().optional().nullable(),
  internalNote: z.string().optional().nullable(),
});

export type FeedbackIntake = z.infer<typeof feedbackIntakeSchema>;

export function parseIntakeJson(value: Prisma.JsonValue | null | undefined): FeedbackIntake {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = feedbackIntakeSchema.safeParse(value);
  return result.success ? result.data : {};
}

export function intakeToJson(intake: FeedbackIntake): Prisma.InputJsonValue {
  return intake as Prisma.InputJsonValue;
}
