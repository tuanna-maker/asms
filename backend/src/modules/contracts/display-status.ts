import type { ContractStatus, Prisma } from "@prisma/client";

export type DisplayContractStatus = ContractStatus;

const TERMINAL: ContractStatus[] = ["completed", "liquidated"];

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

export function resolveContractDisplayStatus(input: {
  status: ContractStatus | string;
  startDate: Date | string;
  endDate: Date | string;
  now?: Date;
}): DisplayContractStatus {
  const stored = input.status as ContractStatus;
  if (stored === "completed" || stored === "liquidated") {
    return stored;
  }

  const now = input.now ?? new Date();
  const todayStart = startOfDay(now);
  const start = startOfDay(new Date(input.startDate));
  const end = endOfDay(new Date(input.endDate));

  if (todayStart < start) return "draft";
  if (todayStart <= end) return "active";
  return "late";
}

function nonTerminalWhere(): Prisma.ContractWhereInput {
  return { status: { notIn: TERMINAL } };
}

export function buildDisplayStatusFilter(
  displayStatus: DisplayContractStatus,
  now: Date = new Date(),
): Prisma.ContractWhereInput {
  if (displayStatus === "completed" || displayStatus === "liquidated") {
    return { status: displayStatus };
  }

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  if (displayStatus === "draft") {
    return {
      AND: [nonTerminalWhere(), { startDate: { gt: todayEnd } }],
    };
  }

  if (displayStatus === "active") {
    return {
      AND: [
        nonTerminalWhere(),
        { startDate: { lte: todayEnd } },
        { endDate: { gte: todayStart } },
      ],
    };
  }

  // late
  return {
    AND: [nonTerminalWhere(), { endDate: { lt: todayStart } }],
  };
}

export function buildDisplayStatusesFilter(
  displayStatuses: DisplayContractStatus[],
  now: Date = new Date(),
): Prisma.ContractWhereInput {
  const unique = [...new Set(displayStatuses)];
  if (unique.length === 0) return {};
  if (unique.length === 1) return buildDisplayStatusFilter(unique[0]!, now);
  return { OR: unique.map((s) => buildDisplayStatusFilter(s, now)) };
}

export function isTerminalContractStatus(status: string): status is "completed" | "liquidated" {
  return status === "completed" || status === "liquidated";
}

export function sanitizeStoredContractStatus(
  status: string | undefined,
): ContractStatus | undefined {
  if (status === undefined) return undefined;
  if (isTerminalContractStatus(status)) return status;
  if (status === "draft") return "draft";
  return undefined;
}

export function withDisplayStatus<T extends { status: ContractStatus; startDate: Date; endDate: Date }>(
  row: T,
  now?: Date,
): T & { displayStatus: DisplayContractStatus } {
  const resolvedNow = now ?? new Date();
  return {
    ...row,
    displayStatus: resolveContractDisplayStatus({
      status: row.status,
      startDate: row.startDate,
      endDate: row.endDate,
      now: resolvedNow,
    }),
  };
}
