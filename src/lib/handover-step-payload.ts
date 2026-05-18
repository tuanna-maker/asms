/** Payload JSON theo bước bàn giao — đồng bộ backend handovers/step-payload.ts */

import { initStepPayloadsForSteps, type FieldDef } from "@/lib/workflow-field-schema";

export type HandoverStepPayloadRecord = Record<string, Record<string, unknown>>;

export type HandoverFormSnapshot = {
  handoverPlan: string;
  costReportNote: string;
  goodsCheckNote: string;
  trainingPlanNote: string;
  trainingCostReport: string;
  tempHandoverNote: string;
  trainingReportNote: string;
  trainingDecision: string;
  finalHandoverNote: string;
};

/** @deprecated Dùng stepPayloads động từ fieldSchema */
export function buildStepPayloadsFromForm(
  orderedStepIds: string[],
  form: HandoverFormSnapshot,
  _workflowCode?: string | null,
  _workflowName?: string | null,
  genericNotesByStepId: Record<string, string> = {},
): HandoverStepPayloadRecord {
  const templates: Record<string, unknown>[] = [
    { handoverPlan: form.handoverPlan.trim() || null },
    { costReportNote: form.costReportNote.trim() || null },
    { goodsCheckNote: form.goodsCheckNote.trim() || null },
    {
      trainingPlanNote: form.trainingPlanNote.trim() || null,
      trainingCostReport: form.trainingCostReport.trim() || null,
      tempHandoverNote: form.tempHandoverNote.trim() || null,
      trainingReportNote: form.trainingReportNote.trim() || null,
      trainingDecision: form.trainingDecision.trim() || null,
    },
    { finalHandoverNote: form.finalHandoverNote.trim() || null },
  ];

  const out: HandoverStepPayloadRecord = {};
  orderedStepIds.forEach((stepId, idx) => {
    out[stepId] =
      idx < templates.length
        ? { ...templates[idx] }
        : { notes: genericNotesByStepId[stepId]?.trim() || null };
  });
  return out;
}

export function initHandoverStepPayloads(
  steps: Array<{ id: string; fieldSchema?: FieldDef[] | null }>,
  existing?: HandoverStepPayloadRecord,
): HandoverStepPayloadRecord {
  return initStepPayloadsForSteps(steps, existing);
}

export function stepTabLabel(order: number, name: string, maxLen = 28): string {
  const n = Math.round(order / 10) || order;
  const short = name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
  return `${n} · ${short}`;
}

export function emptyHandoverForm(): HandoverFormSnapshot {
  return {
    handoverPlan: "",
    costReportNote: "",
    goodsCheckNote: "",
    trainingPlanNote: "",
    trainingCostReport: "",
    tempHandoverNote: "",
    trainingReportNote: "",
    trainingDecision: "",
    finalHandoverNote: "",
  };
}

export function handoverFormFromDetail(detail: {
  handoverPlan?: string | null;
  costReportNote?: string | null;
  goodsCheckNote?: string | null;
  trainingPlanNote?: string | null;
  trainingCostReport?: string | null;
  tempHandoverNote?: string | null;
  trainingReportNote?: string | null;
  trainingDecision?: string | null;
  finalHandoverNote?: string | null;
  stepPayloads?: HandoverStepPayloadRecord;
}, orderedStepIds: string[]): HandoverFormSnapshot {
  const base = emptyHandoverForm();
  const merged = { ...base };
  orderedStepIds.forEach((stepId, idx) => {
    const p = detail.stepPayloads?.[stepId] ?? {};
    if (idx === 0 && p.handoverPlan != null) merged.handoverPlan = String(p.handoverPlan ?? "");
    if (idx === 1 && p.costReportNote != null) merged.costReportNote = String(p.costReportNote ?? "");
    if (idx === 2 && p.goodsCheckNote != null) merged.goodsCheckNote = String(p.goodsCheckNote ?? "");
    if (idx === 3) {
      if (p.trainingPlanNote != null) merged.trainingPlanNote = String(p.trainingPlanNote ?? "");
      if (p.trainingCostReport != null) merged.trainingCostReport = String(p.trainingCostReport ?? "");
      if (p.tempHandoverNote != null) merged.tempHandoverNote = String(p.tempHandoverNote ?? "");
      if (p.trainingReportNote != null) merged.trainingReportNote = String(p.trainingReportNote ?? "");
      if (p.trainingDecision != null) merged.trainingDecision = String(p.trainingDecision ?? "");
    }
    if (idx === 4 && p.finalHandoverNote != null) merged.finalHandoverNote = String(p.finalHandoverNote ?? "");
  });
  if (detail.handoverPlan) merged.handoverPlan = detail.handoverPlan;
  if (detail.costReportNote) merged.costReportNote = detail.costReportNote;
  if (detail.goodsCheckNote) merged.goodsCheckNote = detail.goodsCheckNote;
  if (detail.trainingPlanNote) merged.trainingPlanNote = detail.trainingPlanNote;
  if (detail.trainingCostReport) merged.trainingCostReport = detail.trainingCostReport;
  if (detail.tempHandoverNote) merged.tempHandoverNote = detail.tempHandoverNote;
  if (detail.trainingReportNote) merged.trainingReportNote = detail.trainingReportNote;
  if (detail.trainingDecision) merged.trainingDecision = detail.trainingDecision;
  if (detail.finalHandoverNote) merged.finalHandoverNote = detail.finalHandoverNote;
  return merged;
}
