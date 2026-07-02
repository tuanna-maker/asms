import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z.string().transform((v) => (v === "" ? undefined : v)).optional(),
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  sourceCode: z.string().min(1).optional(),
  companyTypeCode: z.string().min(1).optional(),
  foundedAt: z.coerce.date().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
  sourceCode: z.string().optional(),
  companyTypeCode: z.string().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export const customerIdParamSchema = z.object({
  id: z.string().min(1),
});
