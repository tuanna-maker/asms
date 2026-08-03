export type ContractOption = {
  id: string;
  code: string;
  title: string | null;
  products?: number;
};

export function buildAssignedContractSets(
  handovers: { contractId: string }[],
  coachingCourses: { contractId?: string | null }[],
) {
  const withHandover = new Set(handovers.map((h) => h.contractId));
  const withCoaching = new Set(
    coachingCourses.map((t) => t.contractId).filter((id): id is string => Boolean(id)),
  );
  return { withHandover, withCoaching };
}

export type ContractEligibilityMode = "handover" | "coaching" | "both";

/**
 * Lọc HĐ còn trống theo ngữ cảnh tạo mới:
 * - handover: chưa có bàn giao (vẫn hiện nếu đã có huấn luyện)
 * - coaching: chưa có huấn luyện (vẫn hiện nếu đã có bàn giao)
 * - both: chưa có cả hai (legacy)
 */
export function filterContractsEligibleForNewLink(
  contracts: ContractOption[],
  sets: ReturnType<typeof buildAssignedContractSets>,
  includeContractId?: string | null,
  mode: ContractEligibilityMode = "both",
): ContractOption[] {
  const eligible = contracts.filter((c) => {
    const hasHandover = sets.withHandover.has(c.id);
    const hasCoaching = sets.withCoaching.has(c.id);
    if (mode === "handover") return !hasHandover;
    if (mode === "coaching") return !hasCoaching;
    return !hasHandover && !hasCoaching;
  });
  if (includeContractId && !eligible.some((c) => c.id === includeContractId)) {
    const extra = contracts.find((c) => c.id === includeContractId);
    if (extra) return [extra, ...eligible];
  }
  return eligible;
}
