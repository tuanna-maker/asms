export type ContractOption = {
  id: string;
  code: string;
  title: string | null;
  products?: number;
};

export function buildAssignedContractSets(
  handovers: { contractId: string }[],
  trainings: { contractId?: string | null }[],
) {
  const withHandover = new Set(handovers.map((h) => h.contractId));
  const withTraining = new Set(
    trainings.map((t) => t.contractId).filter((id): id is string => Boolean(id)),
  );
  return { withHandover, withTraining };
}

/** HĐ chưa có bàn giao và chưa có huấn luyện (cho tạo mới từ màn list). */
export function filterContractsEligibleForNewLink(
  contracts: ContractOption[],
  sets: ReturnType<typeof buildAssignedContractSets>,
  includeContractId?: string | null,
): ContractOption[] {
  const eligible = contracts.filter(
    (c) => !sets.withHandover.has(c.id) && !sets.withTraining.has(c.id),
  );
  if (includeContractId && !eligible.some((c) => c.id === includeContractId)) {
    const extra = contracts.find((c) => c.id === includeContractId);
    if (extra) return [extra, ...eligible];
  }
  return eligible;
}

export const NO_ELIGIBLE_CONTRACTS_HINT =
  "Không còn hợp đồng trống (chưa có bàn giao và huấn luyện). Tạo hợp đồng mới hoặc mở Hợp đồng để bổ sung.";
