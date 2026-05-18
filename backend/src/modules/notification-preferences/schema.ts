import { z } from "zod";

export const notificationPrefKeyEnum = z.enum([
  "contract_expiry",
  "new_ticket",
  "task_late",
  "material_low",
  "warranty_expiry",
  "training_upcoming",
  "repair_scheduled",
  "customer_anniversary",
]);

export const putNotificationPrefsSchema = z.object({
  preferences: z.array(
    z.object({
      key: notificationPrefKeyEnum,
      enabled: z.boolean(),
    })
  ).min(1),
});
