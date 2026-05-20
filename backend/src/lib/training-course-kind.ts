/** Loại khóa — khớp module quy trình: training (đào tạo) | coaching (huấn luyện) */
export type TrainingCourseKind = "training" | "coaching";

export type TrainingWorkflowModuleKey = TrainingCourseKind;

export function parseCourseKind(value: string | null | undefined): TrainingCourseKind {
  return value === "coaching" ? "coaching" : "training";
}

export function workflowModuleForCourseKind(kind: string | null | undefined): TrainingWorkflowModuleKey {
  return parseCourseKind(kind);
}
