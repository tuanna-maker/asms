import { z } from "zod";

export const reportsQuerySchema = z.object({
  year: z.string().optional(),
});

