import { initStepPayloadsForSteps, type FieldDef } from "@/lib/workflow-field-schema";

export type TrainingStepPayloadRecord = Record<string, Record<string, unknown>>;

export function trainingStepTabLabel(order: number, name: string, maxLen = 24): string {
  const n = Math.round(order / 10) || order;
  const short = name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
  return `${n} · ${short}`;
}

export function initTrainingStepPayloads(
  steps: Array<{ id: string; fieldSchema?: FieldDef[] | null }>,
  existing?: TrainingStepPayloadRecord,
): TrainingStepPayloadRecord {
  return initStepPayloadsForSteps(steps, existing);
}
