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

/** Gợi ý trạng thái theo ngày (không ghi đè giá trị đã lưu). */
export function suggestContractStatusFromDates(input: {
  startDate: Date | string;
  endDate: Date | string;
  now?: Date;
}): ContractStatus {
  const now = input.now ?? new Date();
  const todayStart = startOfDay(now);
  const start = startOfDay(new Date(input.startDate));
  const end = endOfDay(new Date(input.endDate));

  if (todayStart < start) return "draft";
  if (todayStart <= end) return "active";
  return "late";
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

export function withDisplayStatus<T extends { status: ContractStatus }>(
  row: T,
): T & { displayStatus: DisplayContractStatus } {
  return {
    ...row,
    displayStatus: resolveContractDisplayStatus({ status: row.status }),
  };
}
