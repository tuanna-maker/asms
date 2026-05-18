import { z } from "zod";

export const listQuerySchema = z.object({
  anniversaryIds: z
    .string()
    .min(1)
    .transform((s) =>
      s
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(1)).min(1).max(200)),
});

export const subscribeSchema = z.object({
  anniversaryId: z.string().min(1),
});

export const anniversaryIdParamSchema = z.object({
  anniversaryId: z.string().min(1),
});
