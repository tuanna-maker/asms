export type FeedbackSource = "external" | "internal";
export type FeedbackChannel = "phone" | "email" | "direct" | "other";

export type FeedbackIntake = {
  channel?: FeedbackChannel | null;
  contactId?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  customerStatement?: string | null;
  symptom?: string | null;
  whenOccurred?: string | null;
  isBlocking?: boolean | null;
  internalNote?: string | null;
};

export const CHANNEL_LABELS: Record<FeedbackChannel, string> = {
  phone: "Điện thoại",
  email: "Email",
  direct: "Trực tiếp",
  other: "Khác",
};

export const SOURCE_LABELS: Record<FeedbackSource, string> = {
  external: "Khách hàng bên ngoài",
  internal: "Nội bộ",
};

export function emptyIntake(): FeedbackIntake {
  return {};
}
