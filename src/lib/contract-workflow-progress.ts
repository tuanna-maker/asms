/** Tiến độ % suy ra từ bước hiện tại / tổng bước quy trình (1-based index). */
export function progressFromWorkflowSteps(
  currentStepIndex: number,
  totalSteps: number,
): number {
  if (totalSteps <= 0) return 0;
  const idx = Math.max(0, currentStepIndex);
  return Math.min(100, Math.round((idx / totalSteps) * 100));
}

export type WorkflowProgressSnapshot = {
  currentStepIndex: number;
  totalSteps: number;
};
