/** Snapshot tối thiểu để suy ra tab bước đang active (từ danh sách / instance). */
export type WorkflowStepTabSnapshot = {
  currentStepIndex: number;
  steps: Array<{ id: string }>;
};

/**
 * Chọn tab bước khi mở form: ưu tiên instance live, rồi snapshot danh sách, cuối cùng bước 1.
 */
export function resolveInitialWorkflowStepTabId(
  orderedSteps: Array<{ id: string }>,
  options?: {
    liveCurrentStepId?: string | null;
    snapshot?: WorkflowStepTabSnapshot | null;
  },
): string | undefined {
  if (!orderedSteps.length) return undefined;

  const { liveCurrentStepId, snapshot } = options ?? {};

  if (liveCurrentStepId && orderedSteps.some((s) => s.id === liveCurrentStepId)) {
    return liveCurrentStepId;
  }

  if (snapshot?.currentStepIndex && snapshot.currentStepIndex > 0) {
    const fromSnapshot = snapshot.steps[snapshot.currentStepIndex - 1];
    if (fromSnapshot?.id && orderedSteps.some((s) => s.id === fromSnapshot.id)) {
      return fromSnapshot.id;
    }
  }

  return orderedSteps[0].id;
}
