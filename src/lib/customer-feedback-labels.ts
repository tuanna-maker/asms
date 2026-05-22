import type { CustomerFeedbackSeverity, CustomerFeedbackStatus } from "@/hooks/use-customer-feedbacks-api";

export const SEVERITY_LABELS: Record<CustomerFeedbackSeverity, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
};

export const STATUS_LABELS: Record<CustomerFeedbackStatus, string> = {
  new: "Mới",
  processing: "Đang xử lý",
  resolved: "Đã xử lý",
};

export const severityVariant: Record<
  CustomerFeedbackSeverity,
  "outline" | "secondary" | "destructive"
> = {
  low: "outline",
  medium: "secondary",
  high: "destructive",
};

export const statusVariant: Record<CustomerFeedbackStatus, "default" | "secondary" | "outline"> = {
  new: "default",
  processing: "secondary",
  resolved: "outline",
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
