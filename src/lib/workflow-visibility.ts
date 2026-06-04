/** Module quy trình ẩn khỏi menu Quy trình (vẫn có thể tồn tại trong DB). */
export const HIDDEN_WORKFLOW_MODULE_KEYS = ["contract"] as const;

export type HiddenWorkflowModuleKey = (typeof HIDDEN_WORKFLOW_MODULE_KEYS)[number];

export function isWorkflowModuleHidden(moduleKey: string | undefined): boolean {
  if (!moduleKey) return false;
  return (HIDDEN_WORKFLOW_MODULE_KEYS as readonly string[]).includes(moduleKey);
}
