import { z } from "zod";

export const createDocumentSchema = z.object({
  ownerId: z.string().optional(),
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  productId: z.string().optional(),
  warrantyId: z.string().optional(),
  projectId: z.string().optional(),
  trainingCourseId: z.string().optional(),
  name: z.string().min(1),
  categoryCode: z.string().min(1),
  fileType: z.enum(["pdf", "doc", "xls", "img", "other"]),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
  fileSize: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const updateDocumentSchema = createDocumentSchema.partial();

export const documentIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listDocumentsQuerySchema = z.object({
  categoryCode: z.string().optional(),
  fileType: z.enum(["pdf", "doc", "xls", "img", "other"]).optional(),
  ownerId: z.string().optional(),
  customerId: z.string().optional(),
  contractId: z.string().optional(),
  productId: z.string().optional(),
  projectId: z.string().optional(),
  trainingCourseId: z.string().optional(),
  warrantyId: z.string().optional(),
  name: z.string().optional(),
});

