/** Metadata 5 bước Bàn giao & HL — theo stepIndex, không phân nhánh Dòng H/K. */

import { docHintsWithFallback } from "@/lib/workflow-step-meta";

export type HandoverProcessPhaseId = 1 | 2 | 3 | 4 | 5;

export type HandoverProcessPhase = {
  id: HandoverProcessPhaseId;
  key: string;
  title: string;
  docHints: string[];
};

export const HANDOVER_PHASE_COUNT = 5;

/** Gợi ý mặc định khi bước quy trình chưa có description. */
export const HANDOVER_STANDARD_PHASES: HandoverProcessPhase[] = [
  { id: 1, key: "plan", title: "Lập Kế hoạch BG", docHints: ["KH Bàn giao"] },
  { id: 2, key: "cost_report", title: "Lập Tờ trình kinh phí", docHints: ["TTr xin KP BG"] },
  {
    id: 3,
    key: "prepare_goods",
    title: "Chuẩn bị hàng hóa",
    docHints: ["Checklist kiểm tra ĐK", "bảo dưỡng", "Hợp đồng"],
  },
  {
    id: 4,
    key: "training",
    title: "QT huấn luyện",
    docHints: ["KH HL", "TTr HL", "BBBG tạm thời", "Báo cáo KT thực hành", "QĐ công nhận KQ HL"],
  },
  { id: 5, key: "final_handover", title: "Bàn giao chính thức", docHints: ["BBBG cuối cùng"] },
];

function defaultHandoverDocHints(stepIndex: number): string[] {
  return HANDOVER_STANDARD_PHASES[stepIndex]?.docHints ?? [];
}

export function docHintsForHandoverStep(stepIndex: number, stepDescription?: string | null): string[] {
  return docHintsWithFallback(stepDescription, stepIndex, defaultHandoverDocHints);
}
