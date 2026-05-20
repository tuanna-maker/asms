import { z } from "zod";

const crudFields = {
  canRead: z.boolean(),
  canCreate: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
};

export const updateRolePermissionsSchema = z.object({
  items: z
    .array(
      z.object({
        roleCode: z.string().min(1),
        moduleKey: z.string().min(1),
        ...crudFields,
      }),
    )
    .min(1),
});
