import type { ContractStatus } from "@prisma/client";

import { notifyByPreference } from "../notifications/service";
import { prisma } from "../../utils/prisma";
import { isTerminalContractStatus } from "./display-status";

const SLA_WATCH_STATUSES: ContractStatus[] = ["draft", "active"];

export type ContractSlaClockRow = {
  id: string;
  status: ContractStatus | string;
  slaHours: number | null;
  updatedAt: Date;
};

export function isExecutionSlaOverdue(
  row: ContractSlaClockRow,
  now: Date = new Date(),
): boolean {
  if (row.slaHours == null || row.slaHours <= 0) return false;
  const status = row.status as ContractStatus;
  if (isTerminalContractStatus(status) || status === "late") return false;
  if (!SLA_WATCH_STATUSES.includes(status)) return false;
  const deadlineMs = row.updatedAt.getTime() + row.slaHours * 60 * 60 * 1000;
  return now.getTime() > deadlineMs;
}

export async function markExecutionSlaOverdueContracts(
  rows: ContractSlaClockRow[],
  now: Date = new Date(),
): Promise<Set<string>> {
  const overdueIds = rows
    .filter((row) => isExecutionSlaOverdue(row, now))
    .map((row) => row.id);
  if (overdueIds.length === 0) return new Set();

  const contracts = await prisma.contract.findMany({
    where: { id: { in: overdueIds }, deletedAt: null },
    select: { id: true, code: true, title: true },
  });

  await prisma.contract.updateMany({
    where: { id: { in: overdueIds }, deletedAt: null },
    data: { status: "late" },
  });

  for (const c of contracts) {
    await notifyByPreference({
      key: "contract_execution_sla",
      title: `Hợp đồng ${c.code} quá SLA thực hiện`,
      message: `${c.title} — đã chuyển sang Chậm tiến độ.`,
      link: `/hop-dong`,
      refType: "contract",
      refId: c.id,
    });
  }

  return new Set(overdueIds);
}

export async function applyExecutionSlaOverdueForContract(
  contractId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const row = await prisma.contract.findFirst({
    where: { id: contractId, deletedAt: null },
    select: { id: true, status: true, slaHours: true, updatedAt: true },
  });
  if (!row || !isExecutionSlaOverdue(row, now)) return false;

  const detail = await prisma.contract.findFirst({
    where: { id: row.id, deletedAt: null },
    select: { id: true, code: true, title: true },
  });
  if (!detail) return false;

  await prisma.contract.update({
    where: { id: row.id },
    data: { status: "late" },
  });

  await notifyByPreference({
    key: "contract_execution_sla",
    title: `Hợp đồng ${detail.code} quá SLA thực hiện`,
    message: `${detail.title} — đã chuyển sang Chậm tiến độ.`,
    link: `/hop-dong`,
    refType: "contract",
    refId: detail.id,
  });

  return true;
}

/** Quét toàn bộ HĐ đang theo dõi SLA (cron). */
export async function runContractExecutionSlaScan(now: Date = new Date()): Promise<void> {
  const rows = await prisma.contract.findMany({
    where: {
      deletedAt: null,
      status: { in: ["draft", "active"] },
      slaHours: { not: null, gt: 0 },
    },
    select: { id: true, status: true, slaHours: true, updatedAt: true },
  });
  await markExecutionSlaOverdueContracts(rows, now);
}

export function sanitizeExecutionSlaHours(raw: unknown): number | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.floor(n);
}
