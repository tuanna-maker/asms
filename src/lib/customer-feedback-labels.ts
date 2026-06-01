import type { CustomerFeedbackSeverity, CustomerFeedbackStatus } from "@/hooks/use-customer-feedbacks-api";
import { ROLE_LABELS, type Role } from "@/hooks/use-role";

export const SEVERITY_LABELS: Record<CustomerFeedbackSeverity, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export const STATUS_LABELS: Record<CustomerFeedbackStatus, string> = {
  new: "Mới",
  assigned: "Đã giao",
  in_progress: "Đang xử lý",
  pending_close: "Chờ đóng",
  resolved: "Đã đóng",
  reopened: "Mở lại",
};

export const severityVariant: Record<
  CustomerFeedbackSeverity,
  "outline" | "secondary" | "destructive"
> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

export const statusVariant: Record<
  CustomerFeedbackStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  new: "default",
  assigned: "secondary",
  in_progress: "secondary",
  pending_close: "outline",
  resolved: "outline",
  reopened: "destructive",
};

export function formatFeedbackDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function toDateInputValue(value?: string): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function isFeedbackOverdue(row: {
  status: CustomerFeedbackStatus;
  slaDueAt: string | null;
}): boolean {
  if (row.status === "resolved" || !row.slaDueAt) return false;
  return new Date(row.slaDueAt).getTime() < Date.now();
}

export type FeedbackCommentKind = "issue" | "fix" | "note";

export const COMMENT_KIND_LABELS: Record<FeedbackCommentKind, string> = {
  issue: "Sự cố",
  fix: "Đã sửa",
  note: "Ghi chú",
};

export const TIMELINE_EVENT_LABELS: Record<string, string> = {
  created: "Tạo phản ánh",
  assigned: "Đã giao đơn vị",
  unit_updated: "Cập nhật đơn vị",
  pending_close: "Chờ đóng",
  resolved: "Đã đóng",
  reopened: "Mở lại",
};

export function formatAssigneeLabel(row: {
  assigneeType?: string | null;
  assignedUser?: { fullName: string } | null;
  assignedRoleCode?: string | null;
}): string {
  if (row.assigneeType === "user" && row.assignedUser?.fullName) {
    return row.assignedUser.fullName;
  }
  if (row.assigneeType === "role" && row.assignedRoleCode) {
    const code = row.assignedRoleCode as Role;
    return ROLE_LABELS[code] ?? row.assignedRoleCode;
  }
  return "—";
}
