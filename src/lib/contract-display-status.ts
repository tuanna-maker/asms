export type DisplayContractStatus = "draft" | "active" | "completed" | "late" | "liquidated";

const TERMINAL: DisplayContractStatus[] = ["completed", "liquidated"];

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
  status: string;
  startDate: string | Date;
  endDate: string | Date;
  now?: Date;
}): DisplayContractStatus {
  const stored = input.status as DisplayContractStatus;
  if (stored === "completed" || stored === "liquidated") {
    return stored;
  }

  const now = input.now ?? new Date();
  const todayStart = startOfDay(now);
  const start = startOfDay(new Date(input.startDate));
  const end = endOfDay(new Date(input.endDate));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "draft";
  }

  if (todayStart < start) return "draft";
  if (todayStart <= end) return "active";
  return "late";
}

export function isTerminalContractStatus(status: string): status is "completed" | "liquidated" {
  return status === "completed" || status === "liquidated";
}
