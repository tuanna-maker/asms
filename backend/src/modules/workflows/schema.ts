import { z } from "zod";

const MODULE_KEYS = ["handover", "warranty", "training", "coaching", "contract", "product"] as const;
const ENTITY_MODULE_KEYS = ["handover", "warranty", "training", "coaching", "contract", "product"] as const;
export const moduleKeySchema = z.enum(MODULE_KEYS);
export const entityModuleKeySchema = z.enum(ENTITY_MODULE_KEYS);

const codeSchema = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[A-Za-z0-9._-]+$/, "Mã chỉ chứa chữ Latin, số, ., _, -");

export const idParamSchema = z.object({ id: z.string().min(1) });

export const listWorkflowsQuerySchema = z.object({
  moduleKey: moduleKeySchema.optional(),
});

export const createWorkflowSchema = z.object({
  code: codeSchema.optional(),
  name: z.string().min(1).max(255),
  moduleKey: moduleKeySchema,
  description: z.string().max(2000).optional(),
  isActive: z.coerce.boolean().optional(),
});

const fieldOptionSchema = z.object({
  value: z.string().min(1).max(128),
  label: z.string().min(1).max(255),
});

const fieldDefSchema = z.object({
  key: z.string().min(1).max(128).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, "Mã trường: chữ Latin, số, _"),
  label: z.string().min(1).max(255),
  type: z.enum(["text", "textarea", "number", "date", "select", "boolean"]),
  required: z.boolean().optional(),
  placeholder: z.string().max(500).optional(),
  definitionCategory: z.string().max(64).optional(),
  options: z.array(fieldOptionSchema).optional(),
  showWhen: z
    .object({
      field: z.string().min(1).max(128),
      value: z.union([z.string(), z.array(z.string())]),
    })
    .optional(),
  dataSource: z.enum(["contract", "handover_status", "readonly_text"]).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  moduleKey: moduleKeySchema.optional(),
  description: z.string().max(2000).nullable().optional(),
  isActive: z.coerce.boolean().optional(),
  entityFieldSchema: z.array(fieldDefSchema).nullable().optional(),
});

export const upsertStepSchema = z.object({
  name: z.string().min(1).max(255),
  actionCode: z.string().min(1).max(64),
  roleCode: z.string().min(1).max(64),
  assigneeIds: z.array(z.string().min(1)).optional(),
  slaHours: z.coerce.number().int().nonnegative().nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  phaseCode: z.string().min(1).max(64).optional(),
  requireDocument: z.coerce.boolean().optional(),
  fieldSchema: z.array(fieldDefSchema).nullable().optional(),
});

export const reorderStepsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        order: z.coerce.number().int().nonnegative(),
      }),
    )
    .min(1),
});

export const stepIdParamSchema = z.object({
  id: z.string().min(1),
  stepId: z.string().min(1),
});

export const advanceInstanceSchema = z.object({
  action: z.enum(["approve", "reject", "skip"]),
  comment: z.string().max(2000).optional(),
});

export const entityInstanceQuerySchema = z.object({
  moduleKey: entityModuleKeySchema,
  entityId: z.string().min(1),
});

export const attachWorkflowSchema = z.object({
  moduleKey: entityModuleKeySchema,
  entityId: z.string().min(1),
  workflowId: z.string().min(1),
});
