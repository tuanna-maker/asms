import { z } from "zod";

export const updateSystemSettingsSchema = z.object({
  items: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.unknown(),
      }),
    )
    .min(1),
});
