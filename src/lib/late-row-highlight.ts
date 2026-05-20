/** Dòng «Chậm tiến độ» — chỉ màn Hợp đồng & Bàn giao & HL dùng nháy đỏ. */
export function isLateProgressStatus(status: string | null | undefined): boolean {
  return status === "late";
}

export function lateProgressRowClass(status: string | null | undefined): string | undefined {
  return isLateProgressStatus(status) ? "animate-pulse-soft isolate" : undefined;
}
