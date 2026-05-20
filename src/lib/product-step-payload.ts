import { initStepPayloadsForSteps, type FieldDef } from "@/lib/workflow-field-schema";

export type ProductStepPayloadRecord = Record<string, Record<string, unknown>>;

export function productStepTabLabel(order: number, name: string, maxLen = 24): string {
  const n = Math.round(order / 10) || order;
  const short = name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
  return `${n} · ${short}`;
}

export function initProductStepPayloads(
  steps: Array<{ id: string; fieldSchema?: FieldDef[] | null }>,
  existing?: ProductStepPayloadRecord,
): ProductStepPayloadRecord {
  return initStepPayloadsForSteps(steps, existing);
}
