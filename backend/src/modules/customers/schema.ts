import { z } from "zod";

export const createCustomerSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1),
  contactName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const listCustomersQuerySchema = z.object({
  search: z.string().optional(),
});

export const customerIdParamSchema = z.object({
  id: z.string().min(1),
});

