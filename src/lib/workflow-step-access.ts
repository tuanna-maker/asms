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
