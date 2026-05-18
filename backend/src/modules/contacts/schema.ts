import { z } from "zod";

export const createContactSchema = z.object({
  customerId: z.string().min(1),
  fullName: z.string().min(1),
  title: z.string().optional(),
  rank: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  birthday: z.coerce.date().optional().nullable(),
  isPrimary: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  customerId: z.string().min(1).optional(),
});

export const contactIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listContactsQuerySchema = z.object({
  customerId: z.string().optional(),
  search: z.string().optional(),
});
