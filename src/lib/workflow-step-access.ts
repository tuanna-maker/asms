/** Kiểm tra user có quyền thao tác bước quy trình (khớp backend runtime). */
export function canUserActOnWorkflowStep(
  userRole: string,
  userId: string | undefined,
  step: { roleCode: string; assigneeIds?: string[] },
): boolean {
  if (userRole === "admin") return true;
  const assignees = step.assigneeIds ?? [];
  if (assignees.length > 0) {
    return Boolean(userId && assignees.includes(userId));
  }
  return userRole === step.roleCode;
}

/** Snapshot danh sách (bảo hành / bàn giao) — chỉ hiện mục cần xử lý khi được phân công. */
export function canUserActOnWorkflowSnapshot(
  userRole: string,
  userId: string | undefined,
  workflow: {
    status: string;
    currentStepRoleCode: string | null;
    currentStepAssigneeIds?: string[];
  } | null | undefined,
): boolean {
  if (!workflow || workflow.status !== "running" || !workflow.currentStepRoleCode) {
    return false;
  }
  return canUserActOnWorkflowStep(userRole, userId, {
    roleCode: workflow.currentStepRoleCode,
    assigneeIds: workflow.currentStepAssigneeIds,
  });
}
