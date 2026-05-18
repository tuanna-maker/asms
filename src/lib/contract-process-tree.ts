/**
 * Metadata bước quy trình hợp đồng (5 bước BG&HL) — theo stepIndex, không phân nhánh Dòng H/K.
 */

import { docHintsWithFallback } from "@/lib/workflow-step-meta";

export type ContractProcessPhase = {
  stepIndex: number;
  title: string;
  docHints: string[];
};

export const CONTRACT_STANDARD_PHASES: ContractProcessPhase[] = [
  { stepIndex: 0, title: "Lập Kế hoạch BG", docHints: ["KH Bàn giao"] },
  { stepIndex: 1, title: "Lập Tờ trình kinh phí", docHints: ["TTr xin KP BG"] },
  { stepIndex: 2, title: "Chuẩn bị hàng hóa", docHints: ["Checklist kiểm tra ĐK", "bảo dưỡng", "Hợp đồng"] },
  {
    stepIndex: 3,
    title: "QT huấn luyện",
    docHints: ["KH HL", "TTr HL", "BBBG tạm thời", "Báo cáo KT thực hành", "QĐ công nhận KQ HL"],
  },
  { stepIndex: 4, title: "Bàn giao chính thức", docHints: ["BBBG cuối cùng"] },
];

function defaultContractDocHints(stepIndex: number): string[] {
  return CONTRACT_STANDARD_PHASES.find((p) => p.stepIndex === stepIndex)?.docHints ?? [];
}

export function docHintsForContractStep(stepIndex: number, stepDescription?: string | null): string[] {
  return docHintsWithFallback(stepDescription, stepIndex, defaultContractDocHints);
}
