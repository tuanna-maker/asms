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

/** Gợi ý trạng thái theo ngày (không tính SLA). */
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
  return "liquidated";
}

function isSlaOverdueForStatus(input: {
  status: string;
  slaHours?: number | null;
  updatedAt?: string | Date;
  now?: Date;
}): boolean {
  if (input.slaHours == null || input.slaHours <= 0 || !input.updatedAt) return false;
  if (input.status === "completed" || input.status === "liquidated" || input.status === "late") {
    return false;
  }
  if (input.status !== "active" && input.status !== "draft") return false;
  const updated =
    input.updatedAt instanceof Date ? input.updatedAt : new Date(input.updatedAt);
  if (Number.isNaN(updated.getTime())) return false;
  const now = input.now ?? new Date();
  const deadline = updated.getTime() + input.slaHours * 60 * 60 * 1000;
  return now.getTime() > deadline;
}

/**
 * Trạng thái vận hành: ngày bắt đầu/kết thúc + SLA (ưu tiên quá hạn kết thúc → thanh lý).
 */
export function computeContractOperationalStatus(input: {
  status: string;
  startDate?: string | Date;
  endDate?: string | Date;
  slaHours?: number | null;
  updatedAt?: string | Date;
  now?: Date;
}): DisplayContractStatus {
  const now = input.now ?? new Date();
  const stored = input.status as DisplayContractStatus;

  if (stored === "completed") {
    if (input.endDate) {
      const end = endOfDay(new Date(input.endDate));
      if (!Number.isNaN(end.getTime()) && startOfDay(now) > end) return "liquidated";
    }
    return "completed";
  }

  if (stored === "liquidated") return "liquidated";

  if (input.startDate && input.endDate) {
    const start = startOfDay(new Date(input.startDate));
    const end = endOfDay(new Date(input.endDate));
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const today = startOfDay(now);
      if (today > end) return "liquidated";
      if (isSlaOverdueForStatus(input)) return "late";
      if (today < start) return "draft";
      return "active";
    }
  }

  if (ALL_STATUSES.includes(stored)) return stored;
  return "draft";
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
