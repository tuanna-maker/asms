/** Kiểm tra quá SLA thực hiện (đồng bộ logic backend execution-sla.ts). */
export function isContractExecutionSlaOverdue(input: {
  status: string;
  slaHours: number | null | undefined;
  updatedAt: string | Date;
  now?: Date;
}): boolean {
  if (input.slaHours == null || input.slaHours <= 0) return false;
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

export function formatSlaDeadline(updatedAt: string | Date, slaHours: number): string {
  const base = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
  const d = new Date(base.getTime() + slaHours * 60 * 60 * 1000);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}
