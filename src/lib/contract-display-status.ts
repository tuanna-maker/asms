export type DisplayContractStatus = "draft" | "active" | "completed" | "late" | "liquidated";

const ALL_STATUSES: DisplayContractStatus[] = ["draft", "active", "completed", "late", "liquidated"];

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Gợi ý trạng thái theo ngày (không ghi đè giá trị đã lưu). */
export function suggestContractStatusFromDates(input: {
  startDate: string | Date;
  endDate: string | Date;
  now?: Date;
}): DisplayContractStatus {
  const now = input.now ?? new Date();
  const todayStart = startOfDay(now);
  const start = startOfDay(new Date(input.startDate));
  const end = endOfDay(new Date(input.endDate));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "draft";
  if (todayStart < start) return "draft";
  if (todayStart <= end) return "active";
  return "late";
}

export function resolveContractDisplayStatus(input: {
  status: string;
  startDate?: string | Date;
  endDate?: string | Date;
  now?: Date;
}): DisplayContractStatus {
  const stored = input.status as DisplayContractStatus;
  if (ALL_STATUSES.includes(stored)) return stored;
  return "draft";
}

export function isTerminalContractStatus(status: string): status is "completed" | "liquidated" {
  return status === "completed" || status === "liquidated";
}
