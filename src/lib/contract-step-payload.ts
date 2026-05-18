import { initStepPayloadsForSteps, type FieldDef } from "@/lib/workflow-field-schema";

export type ContractStepPayloadRecord = Record<string, Record<string, unknown>>;

export type ContractStepFormValues = {
  planDate: string;
  planNotes: string;
  budgetAmount: string;
  budgetJustification: string;
  checklistItems: string;
  maintenanceNotes: string;
  trainingPlan: string;
  trainingProposal: string;
  tempHandoverDate: string;
  tempHandoverNotes: string;
  trainingReport: string;
  trainingCertDecision: string;
  handoverDate: string;
  handoverNotes: string;
};

export function emptyContractStepForm(): ContractStepFormValues {
  return {
    planDate: "",
    planNotes: "",
    budgetAmount: "",
    budgetJustification: "",
    checklistItems: "",
    maintenanceNotes: "",
    trainingPlan: "",
    trainingProposal: "",
    tempHandoverDate: "",
    tempHandoverNotes: "",
    trainingReport: "",
    trainingCertDecision: "",
    handoverDate: "",
    handoverNotes: "",
  };
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

function templateForStepIndex(stepIndex: number, form: ContractStepFormValues): Record<string, unknown> {
  switch (stepIndex) {
    case 0:
      return {
        planDate: form.planDate.trim() || null,
        planNotes: form.planNotes.trim() || null,
      };
    case 1:
      return {
        budgetAmount: form.budgetAmount.trim() || null,
        budgetJustification: form.budgetJustification.trim() || null,
      };
    case 2:
      return {
        checklistItems: form.checklistItems.trim() || null,
        maintenanceNotes: form.maintenanceNotes.trim() || null,
      };
    case 3:
      return {
        trainingPlan: form.trainingPlan.trim() || null,
        trainingProposal: form.trainingProposal.trim() || null,
        tempHandoverDate: form.tempHandoverDate.trim() || null,
        tempHandoverNotes: form.tempHandoverNotes.trim() || null,
        trainingReport: form.trainingReport.trim() || null,
        trainingCertDecision: form.trainingCertDecision.trim() || null,
      };
    case 4:
      return {
        handoverDate: form.handoverDate.trim() || null,
        handoverNotes: form.handoverNotes.trim() || null,
      };
    default:
      return { notes: null };
  }
}

export function buildContractStepPayloads(
  orderedStepIds: string[],
  form: ContractStepFormValues,
): ContractStepPayloadRecord {
  const out: ContractStepPayloadRecord = {};
  orderedStepIds.forEach((stepId, idx) => {
    out[stepId] = templateForStepIndex(idx, form);
  });
  return out;
}

export function contractStepFormFromPayloads(
  payloads: Record<string, Record<string, unknown>>,
  orderedStepIds: string[],
): ContractStepFormValues {
  const form = emptyContractStepForm();
  orderedStepIds.forEach((stepId, idx) => {
    const p = payloads[stepId] ?? {};
    if (idx === 0) {
      form.planDate = str(p.planDate);
      form.planNotes = str(p.planNotes);
    } else if (idx === 1) {
      form.budgetAmount = str(p.budgetAmount);
      form.budgetJustification = str(p.budgetJustification);
    } else if (idx === 2) {
      form.checklistItems = str(p.checklistItems);
      form.maintenanceNotes = str(p.maintenanceNotes);
    } else if (idx === 3) {
      form.trainingPlan = str(p.trainingPlan);
      form.trainingProposal = str(p.trainingProposal);
      form.tempHandoverDate = str(p.tempHandoverDate);
      form.tempHandoverNotes = str(p.tempHandoverNotes);
      form.trainingReport = str(p.trainingReport);
      form.trainingCertDecision = str(p.trainingCertDecision);
    } else if (idx === 4) {
      form.handoverDate = str(p.handoverDate);
      form.handoverNotes = str(p.handoverNotes);
    }
  });
  return form;
}

export function contractStepTabLabel(order: number, name: string, maxLen = 24): string {
  const n = Math.round(order / 10) || order;
  const short = name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
  return `${n} · ${short}`;
}

export function initContractStepPayloads(
  steps: Array<{ id: string; fieldSchema?: FieldDef[] | null }>,
  existing?: ContractStepPayloadRecord,
): ContractStepPayloadRecord {
  return initStepPayloadsForSteps(steps, existing);
}
