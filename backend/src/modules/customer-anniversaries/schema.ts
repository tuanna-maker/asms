import { z } from "zod";

const anniversaryTypeEnum = z.enum([
  "traditional_day",
  "medal_day",
  "leader_birthday",
  "other",
]);

export const createAnniversarySchema = z.object({
  customerId: z.string().min(1),
  type: anniversaryTypeEnum.optional(),
  label: z.string().min(1).max(255),
  occursAt: z.coerce.date(),
  recurringYearly: z.boolean().optional(),
  reminderDays: z.coerce.number().int().min(0).max(365).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateAnniversarySchema = z.object({
  type: anniversaryTypeEnum.optional(),
  label: z.string().min(1).max(255).optional(),
  occursAt: z.coerce.date().optional(),
  recurringYearly: z.boolean().optional(),
  reminderDays: z.coerce.number().int().min(0).max(365).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const listQuerySchema = z.object({
  customerId: z.string().optional(),
  type: anniversaryTypeEnum.optional(),
  upcoming: z.coerce.number().int().min(0).max(365).optional(),
});

export const idParamSchema = z.object({ id: z.string().min(1) });
