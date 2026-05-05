import { z } from "zod";

export const createCrmActivitySchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(["call", "email", "meeting", "note"]),
  title: z.string().min(1),
  status: z.enum(["scheduled", "done"]),
  activityAt: z.coerce.date(),
});

export const updateCrmActivitySchema = createCrmActivitySchema.partial();

export const crmActivityIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listCrmActivitiesQuerySchema = z.object({
  customerId: z.string().optional(),
  type: z.enum(["call", "email", "meeting", "note"]).optional(),
  status: z.enum(["scheduled", "done"]).optional(),
});
