import type { ContractStatus, Prisma } from "@prisma/client";

export type DisplayContractStatus = ContractStatus;

const ALL_STATUSES: ContractStatus[] = ["draft", "active", "completed", "late", "liquidated"];

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
  startDate: Date | string;
  endDate: Date | string;
  now?: Date;
}): ContractStatus {
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
  updatedAt?: Date;
  now?: Date;
}): boolean {
  if (input.slaHours == null || input.slaHours <= 0 || !input.updatedAt) return false;
  if (isTerminalContractStatus(input.status) || input.status === "late") return false;
  if (input.status !== "active" && input.status !== "draft") return false;
  const now = input.now ?? new Date();
  const deadline = input.updatedAt.getTime() + input.slaHours * 60 * 60 * 1000;
  return now.getTime() > deadline;
}

/** Trạng thái vận hành theo ngày + SLA. */
export function computeContractOperationalStatus(input: {
  status: ContractStatus | string;
  startDate?: Date | string;
  endDate?: Date | string;
  slaHours?: number | null;
  updatedAt?: Date;
  now?: Date;
}): ContractStatus {
  const now = input.now ?? new Date();
  const stored = input.status as ContractStatus;

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
  status: ContractStatus | string;
  startDate?: Date | string;
  endDate?: Date | string;
  now?: Date;
}): DisplayContractStatus {
  const stored = input.status as ContractStatus;
  if (ALL_STATUSES.includes(stored)) return stored;
  return "draft";
}

export function buildDisplayStatusFilter(displayStatus: DisplayContractStatus): Prisma.ContractWhereInput {
  return { status: displayStatus };
}

export function buildDisplayStatusesFilter(
  displayStatuses: DisplayContractStatus[],
): Prisma.ContractWhereInput {
  const unique = [...new Set(displayStatuses)];
  if (unique.length === 0) return {};
  if (unique.length === 1) return buildDisplayStatusFilter(unique[0]!);
  return { OR: unique.map((s) => buildDisplayStatusFilter(s)) };
}

export function isTerminalContractStatus(status: string): status is "completed" | "liquidated" {
  return status === "completed" || status === "liquidated";
}

export function sanitizeStoredContractStatus(
  status: string | undefined,
): ContractStatus | undefined {
  if (status === undefined) return undefined;
  if (ALL_STATUSES.includes(status as ContractStatus)) return status as ContractStatus;
  return undefined;
}

export function withDisplayStatus<
  T extends {
    status: ContractStatus;
    startDate?: Date;
    endDate?: Date;
    slaHours?: number | null;
    updatedAt?: Date;
  },
>(row: T, now?: Date): T & { displayStatus: DisplayContractStatus } {
  return {
    ...row,
    displayStatus: computeContractOperationalStatus({ ...row, now }),
  };
}
