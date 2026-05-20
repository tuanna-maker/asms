/** Payload JSON theo bước — đồng bộ với backend warranty-step-payload.ts */

import { initStepPayloadsForSteps, type FieldDef } from "@/lib/workflow-field-schema";

export type WarrantyStepPayloadRecord = Record<string, Record<string, unknown>>;

export type WarrantyFormSnapshot = {
  issue: string;
  source: "customer" | "internal";
  type: string;
  priority: string;
  status: string;
  receiptCategory: string;
  occurredAtLocal: string;
  productSerialSnapshot: string;
  rootCause: string;
  handlingPlan: string;
  plannedHours: string;
  costEstimate: string;
  customerDisagreedClose: boolean;
  executionMode: string;
  outsourcePartner: string;
  outsourceBudget: string;
  outsourceTimeline: string;
  repairDetails: string;
  postRepairAssessment: string;
  handoverNotes: string;
};

const NONE = "__none__";

function buildStep3Payload(form: WarrantyFormSnapshot): Record<string, unknown> {
  const mode = form.executionMode === NONE ? null : form.executionMode;
  const base: Record<string, unknown> = { executionMode: mode };

  if (mode === "outsource") {
    return {
      ...base,
      outsourcePartner: form.outsourcePartner.trim() || null,
      outsourceBudget: form.outsourceBudget.trim() === "" ? null : form.outsourceBudget.trim(),
      outsourceTimeline: form.outsourceTimeline.trim() || null,
      repairDetails: null,
    };
  }

  if (mode === "self") {
    return {
      ...base,
      outsourcePartner: null,
      outsourceBudget: null,
      outsourceTimeline: null,
      repairDetails: form.repairDetails.trim() || null,
    };
  }

  return {
    ...base,
    outsourcePartner: null,
    outsourceBudget: null,
    outsourceTimeline: null,
    repairDetails: null,
  };
}

export function buildStepPayloadsFromForm(
  orderedStepIds: string[],
  form: WarrantyFormSnapshot,
  genericNotesByStepId: Record<string, string> = {},
): WarrantyStepPayloadRecord {
  const templates: Record<string, unknown>[] = [
    {
      receiptCategory: form.receiptCategory === NONE ? null : form.receiptCategory,
      occurredAt: form.occurredAtLocal ? new Date(form.occurredAtLocal).toISOString() : null,
      productSerialSnapshot: form.productSerialSnapshot.trim() || null,
      issue: form.issue.trim(),
      source: form.source === "customer" ? "Khách hàng" : "Nội bộ",
      type: form.type,
      priorityCode: form.priority,
      statusCode: form.status,
    },
    {
      rootCause: form.rootCause === NONE ? null : form.rootCause,
      handlingPlan: form.handlingPlan.trim() || null,
      plannedHours: form.plannedHours.trim() === "" ? null : Number.parseInt(form.plannedHours, 10),
      costEstimate: form.costEstimate.trim() === "" ? null : form.costEstimate.trim(),
      customerDisagreedClose: form.customerDisagreedClose,
    },
    buildStep3Payload(form),
    { postRepairAssessment: form.postRepairAssessment.trim() || null },
    { handoverNotes: form.handoverNotes.trim() || null },
  ];

  const out: WarrantyStepPayloadRecord = {};
  orderedStepIds.forEach((stepId, idx) => {
    out[stepId] =
      idx < templates.length
        ? { ...templates[idx] }
        : { notes: genericNotesByStepId[stepId]?.trim() || null };
  });
  return out;
}

export function stepTabLabel(order: number, name: string, maxLen = 28): string {
  const n = Math.round(order / 10) || order;
  const short = name.length > maxLen ? `${name.slice(0, maxLen)}…` : name;
  return `${n} · ${short}`;
}

export function initWarrantyStepPayloads(
  steps: Array<{ id: string; fieldSchema?: FieldDef[] | null }>,
  existing?: WarrantyStepPayloadRecord,
): WarrantyStepPayloadRecord {
  return initStepPayloadsForSteps(steps, existing);
}

/** Đồng bộ payload bước 0..4 vào state header (dual-write legacy) */
export function applyWarrantyPayloadsToFormState(
  steps: Array<{ id: string }>,
  payloads: WarrantyStepPayloadRecord,
  setters: {
    setIssue: (v: string) => void;
    setReceiptCategory: (v: string) => void;
    setOccurredAtLocal: (v: string) => void;
    setProductSerialSnapshot: (v: string) => void;
    setSource: (v: "customer" | "internal") => void;
    setType: (v: string) => void;
    setPriority: (v: string) => void;
    setStatus: (v: WarrantyFormSnapshot["status"]) => void;
    setRootCause: (v: string) => void;
    setHandlingPlan: (v: string) => void;
    setPlannedHours: (v: string) => void;
    setCostEstimate: (v: string) => void;
    setCustomerDisagreedClose: (v: boolean) => void;
    setExecutionMode: (v: string) => void;
    setOutsourcePartner: (v: string) => void;
    setOutsourceBudget: (v: string) => void;
    setOutsourceTimeline: (v: string) => void;
    setRepairDetails: (v: string) => void;
    setPostRepairAssessment: (v: string) => void;
    setHandoverNotes: (v: string) => void;
  },
) {
  const p0 = payloads[steps[0]?.id ?? ""] ?? {};
  if (p0.issue != null) setters.setIssue(String(p0.issue));
  if (p0.receiptCategory != null) setters.setReceiptCategory(String(p0.receiptCategory));
  if (p0.occurredAt != null) {
    const d = new Date(String(p0.occurredAt));
    setters.setOccurredAtLocal(Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 16));
  }
  if (p0.productSerialSnapshot != null) setters.setProductSerialSnapshot(String(p0.productSerialSnapshot ?? ""));
  if (p0.source != null) {
    const s = String(p0.source);
    setters.setSource(s === "Nội bộ" || s === "internal" ? "internal" : "customer");
  }
  if (p0.type != null) setters.setType(String(p0.type));
  if (p0.priorityCode != null) setters.setPriority(String(p0.priorityCode));
  if (p0.statusCode != null) {
    setters.setStatus(String(p0.statusCode) as WarrantyFormSnapshot["status"]);
  }

  const p1 = payloads[steps[1]?.id ?? ""] ?? {};
  if (p1.rootCause != null) setters.setRootCause(String(p1.rootCause) || NONE);
  if (p1.handlingPlan != null) setters.setHandlingPlan(String(p1.handlingPlan ?? ""));
  if (p1.plannedHours != null) setters.setPlannedHours(p1.plannedHours === null ? "" : String(p1.plannedHours));
  if (p1.costEstimate != null) setters.setCostEstimate(String(p1.costEstimate ?? ""));
  if (p1.customerDisagreedClose != null) setters.setCustomerDisagreedClose(Boolean(p1.customerDisagreedClose));

  const p2 = payloads[steps[2]?.id ?? ""] ?? {};
  if (p2.executionMode != null) setters.setExecutionMode(String(p2.executionMode) || NONE);
  if (p2.outsourcePartner != null) setters.setOutsourcePartner(String(p2.outsourcePartner ?? ""));
  if (p2.outsourceBudget != null) setters.setOutsourceBudget(String(p2.outsourceBudget ?? ""));
  if (p2.outsourceTimeline != null) setters.setOutsourceTimeline(String(p2.outsourceTimeline ?? ""));
  if (p2.repairDetails != null) setters.setRepairDetails(String(p2.repairDetails ?? ""));

  const p3 = payloads[steps[3]?.id ?? ""] ?? {};
  if (p3.postRepairAssessment != null) setters.setPostRepairAssessment(String(p3.postRepairAssessment ?? ""));

  const p4 = payloads[steps[4]?.id ?? ""] ?? {};
  if (p4.handoverNotes != null) setters.setHandoverNotes(String(p4.handoverNotes ?? ""));
}

/** Gộp state header vào payload trước khi lưu */
export function mergeWarrantyFormIntoStepPayloads(
  steps: Array<{ id: string }>,
  payloads: WarrantyStepPayloadRecord,
  form: WarrantyFormSnapshot,
): WarrantyStepPayloadRecord {
  const out = { ...payloads };
  const mergeStep = (stepId: string | undefined, patch: Record<string, unknown>) => {
    if (!stepId) return;
    out[stepId] = { ...(out[stepId] ?? {}), ...patch };
  };

  mergeStep(steps[0]?.id, {
    issue: form.issue.trim(),
    receiptCategory: form.receiptCategory === NONE ? null : form.receiptCategory,
    occurredAt: form.occurredAtLocal ? new Date(form.occurredAtLocal).toISOString() : null,
    productSerialSnapshot: form.productSerialSnapshot.trim() || null,
    source: form.source === "customer" ? "Khách hàng" : "Nội bộ",
    type: form.type,
    priorityCode: form.priority,
    statusCode: form.status,
  });

  mergeStep(steps[1]?.id, {
    rootCause: form.rootCause === NONE ? null : form.rootCause,
    handlingPlan: form.handlingPlan.trim() || null,
    plannedHours: form.plannedHours.trim() === "" ? null : Number.parseInt(form.plannedHours, 10),
    costEstimate: form.costEstimate.trim() === "" ? null : form.costEstimate.trim(),
    customerDisagreedClose: form.customerDisagreedClose,
  });

  mergeStep(steps[2]?.id, buildStep3Payload(form));

  mergeStep(steps[3]?.id, {
    postRepairAssessment: form.postRepairAssessment.trim() || null,
  });

  mergeStep(steps[4]?.id, {
    handoverNotes: form.handoverNotes.trim() || null,
  });

  return out;
}

/** Trích field header phiếu BH từ payload các bước (khi lưu qua form động). */
export function pickWarrantyHeaderFromStepPayloads(
  steps: Array<{ id: string }>,
  payloads: WarrantyStepPayloadRecord,
): {
  issue?: string;
  type?: string;
  priorityCode?: string;
  statusCode?: string;
  source?: "customer" | "internal";
  receiptCategory?: string | null;
  occurredAt?: string | null;
  productSerialSnapshot?: string | null;
  rootCause?: string | null;
  handlingPlan?: string | null;
  plannedHours?: number | null;
  costEstimate?: string | null;
  customerDisagreedClose?: boolean;
  executionMode?: "self" | "outsource" | null;
  outsourcePartner?: string | null;
  outsourceBudget?: string | null;
  outsourceTimeline?: string | null;
  repairDetails?: string | null;
  postRepairAssessment?: string | null;
  handoverNotes?: string | null;
} {
  const out: ReturnType<typeof pickWarrantyHeaderFromStepPayloads> = {};

  const p0 = payloads[steps[0]?.id ?? ""] ?? {};
  if (p0.issue != null) out.issue = String(p0.issue).trim();
  if (p0.type != null) out.type = String(p0.type);
  if (p0.priorityCode != null) out.priorityCode = String(p0.priorityCode);
  if (p0.statusCode != null) out.statusCode = String(p0.statusCode);
  if (p0.source != null) {
    const s = String(p0.source);
    out.source = s === "Nội bộ" || s === "internal" ? "internal" : "customer";
  }
  if (p0.receiptCategory !== undefined) {
    out.receiptCategory = p0.receiptCategory == null ? null : String(p0.receiptCategory);
  }
  if (p0.occurredAt !== undefined) {
    out.occurredAt = p0.occurredAt == null ? null : String(p0.occurredAt);
  }
  if (p0.productSerialSnapshot !== undefined) {
    out.productSerialSnapshot =
      p0.productSerialSnapshot == null ? null : String(p0.productSerialSnapshot);
  }

  const p1 = payloads[steps[1]?.id ?? ""] ?? {};
  if (p1.rootCause !== undefined) {
    out.rootCause = p1.rootCause == null ? null : String(p1.rootCause);
  }
  if (p1.handlingPlan !== undefined) {
    out.handlingPlan = p1.handlingPlan == null ? null : String(p1.handlingPlan);
  }
  if (p1.plannedHours !== undefined) {
    const ph = p1.plannedHours;
    out.plannedHours =
      ph == null || ph === "" ? null : typeof ph === "number" ? ph : Number.parseInt(String(ph), 10);
    if (out.plannedHours != null && Number.isNaN(out.plannedHours)) out.plannedHours = null;
  }
  if (p1.costEstimate !== undefined) {
    out.costEstimate = p1.costEstimate == null ? null : String(p1.costEstimate);
  }
  if (p1.customerDisagreedClose !== undefined) {
    out.customerDisagreedClose = Boolean(p1.customerDisagreedClose);
  }

  const p2 = payloads[steps[2]?.id ?? ""] ?? {};
  if (p2.executionMode !== undefined) {
    const mode = p2.executionMode == null ? null : String(p2.executionMode);
    out.executionMode = mode === "self" || mode === "outsource" ? mode : null;
  }
  if (p2.outsourcePartner !== undefined) {
    out.outsourcePartner = p2.outsourcePartner == null ? null : String(p2.outsourcePartner);
  }
  if (p2.outsourceBudget !== undefined) {
    out.outsourceBudget = p2.outsourceBudget == null ? null : String(p2.outsourceBudget);
  }
  if (p2.outsourceTimeline !== undefined) {
    out.outsourceTimeline = p2.outsourceTimeline == null ? null : String(p2.outsourceTimeline);
  }
  if (p2.repairDetails !== undefined) {
    out.repairDetails = p2.repairDetails == null ? null : String(p2.repairDetails);
  }

  const p3 = payloads[steps[3]?.id ?? ""] ?? {};
  if (p3.postRepairAssessment !== undefined) {
    out.postRepairAssessment =
      p3.postRepairAssessment == null ? null : String(p3.postRepairAssessment);
  }

  const p4 = payloads[steps[4]?.id ?? ""] ?? {};
  if (p4.handoverNotes !== undefined) {
    out.handoverNotes = p4.handoverNotes == null ? null : String(p4.handoverNotes);
  }

  return out;
}

export type WarrantyHeaderFromPayloads = ReturnType<typeof pickWarrantyHeaderFromStepPayloads>;

/** Map header trích từ bước → payload cột legacy warranty (buildBhPayload). */
export function buildBhPayloadFromStepHeader(h: WarrantyHeaderFromPayloads) {
  return {
    receiptCategory:
      h.receiptCategory === undefined
        ? undefined
        : (h.receiptCategory as "incident" | "technical_support" | null),
    occurredAt: h.occurredAt === undefined ? undefined : h.occurredAt,
    productSerialSnapshot: h.productSerialSnapshot === undefined ? undefined : h.productSerialSnapshot,
    rootCause:
      h.rootCause === undefined
        ? undefined
        : (h.rootCause as "manufacturer" | "customer" | "unknown" | null),
    handlingPlan: h.handlingPlan === undefined ? undefined : h.handlingPlan,
    plannedHours: h.plannedHours === undefined ? undefined : h.plannedHours,
    costEstimate: h.costEstimate === undefined ? undefined : h.costEstimate,
    customerDisagreedClose: h.customerDisagreedClose,
    executionMode: h.executionMode === undefined ? undefined : h.executionMode,
    outsourcePartner: h.outsourcePartner === undefined ? undefined : h.outsourcePartner,
    outsourceBudget: h.outsourceBudget === undefined ? undefined : h.outsourceBudget,
    outsourceTimeline: h.outsourceTimeline === undefined ? undefined : h.outsourceTimeline,
    repairDetails: h.repairDetails === undefined ? undefined : h.repairDetails,
    postRepairAssessment: h.postRepairAssessment === undefined ? undefined : h.postRepairAssessment,
    handoverNotes: h.handoverNotes === undefined ? undefined : h.handoverNotes,
  };
}
