import { WARRANTY_PROCESS_PHASES } from "@/lib/warranty-process-tree";

export type WarrantyStepFormValues = {
  executionMode: string;
};

const EXECUTION_MODE_NONE = "__none__";

export const WARRANTY_STEP3_DOC_HINTS = {
  pending: ["Chọn hình thức thực hiện"],
  outsource: ["BBBG cho đối tác", "BBBG nhận hàng từ đối tác"],
  self: ["Hồ sơ sửa chữa"],
} as const;

export function docHintsForStepIndex(stepIndex: number): string[] {
  return docHintsForWarrantyStep(stepIndex, { executionMode: EXECUTION_MODE_NONE });
}

export function docHintsForWarrantyStep(
  stepIndex: number,
  form: Pick<WarrantyStepFormValues, "executionMode">,
): string[] {
  if (stepIndex === 2) {
    const mode = form.executionMode;
    if (mode === "outsource") return [...WARRANTY_STEP3_DOC_HINTS.outsource];
    if (mode === "self") return [...WARRANTY_STEP3_DOC_HINTS.self];
    return [...WARRANTY_STEP3_DOC_HINTS.pending];
  }
  const phase = WARRANTY_PROCESS_PHASES[stepIndex];
  return phase?.docHints ?? [];
}

export function isGenericNotesStep(stepIndex: number): boolean {
  return stepIndex >= 5;
}

export function clearStep3BranchFields(
  mode: string,
  setters: {
    setOutsourcePartner: (v: string) => void;
    setOutsourceBudget: (v: string) => void;
    setOutsourceTimeline: (v: string) => void;
    setRepairDetails: (v: string) => void;
  },
): void {
  if (mode === "self") {
    setters.setOutsourcePartner("");
    setters.setOutsourceBudget("");
    setters.setOutsourceTimeline("");
  } else if (mode === "outsource") {
    setters.setRepairDetails("");
  }
}

export const ROOT_CAUSE_LABELS: Record<string, string> = {
  manufacturer: "Do nhà SX",
  customer: "Do khách hàng",
  unknown: "Chưa rõ (dữ liệu cũ)",
};
