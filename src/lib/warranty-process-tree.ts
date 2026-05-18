/**
 * Cây 5 giai đoạn BH/SC — một nguồn cho timeline, nhãn bước và gợi ý biên bản/tài liệu.
 * Khớp WF_WARRANTY_DEFAULT (bước 1–5) và các trường lưu trên phiếu.
 */

export type WarrantyProcessPhaseId = 1 | 2 | 3 | 4 | 5;

export type WarrantyProcessDataBranch = {
  label: string;
  items: string[];
};

export type WarrantyProcessPhase = {
  id: WarrantyProcessPhaseId;
  key: string;
  title: string;
  /** Gợi ý loại biên bản / chứng từ nên đính kèm (màn Tài liệu + warrantyId) */
  docHints: string[];
  /** Nhánh dữ liệu chính theo sơ đồ nghiệp vụ */
  dataBranches: WarrantyProcessDataBranch[];
};

export const WARRANTY_PHASE_COUNT = 5;

export const WARRANTY_PROCESS_PHASES: WarrantyProcessPhase[] = [
  {
    id: 1,
    key: "receive",
    title: "Tiếp nhận yêu cầu",
    docHints: ["Phiếu tiếp nhận / log cuộc gọi", "Ảnh hiện trạng thiết bị", "Serial & model (snapshot)"],
    dataBranches: [
      {
        label: "Nguồn",
        items: ["Nội bộ", "Khách hàng"],
      },
      {
        label: "Phân loại",
        items: ["Sự cố, hỏng hóc", "Kỹ thuật"],
      },
    ],
  },
  {
    id: 2,
    key: "analysis",
    title: "Phân tích, đề xuất PA và KH BHSC",
    docHints: ["BB KT CLSP trước BHSC", "Phiếu YC BHSC", "Kế hoạch BHSC"],
    dataBranches: [
      {
        label: "Phân tích & PA",
        items: [
          "Đánh giá nguyên nhân (Do nhà SX / Do khách hàng)",
          "Phương án xử lý (PA)",
          "Thời gian xử lý (dự kiến)",
          "Chi phí (nếu có)",
        ],
      },
      {
        label: "Thống nhất với KH",
        items: ["KH không đồng ý PA → đóng sự cố"],
      },
    ],
  },
  {
    id: 3,
    key: "execute",
    title: "Thực hiện BHSC",
    docHints: ["BBBG cho đối tác", "BBBG nhận hàng từ đối tác", "Hồ sơ sửa chữa"],
    dataBranches: [
      {
        label: "Thuê đối tác ngoài",
        items: ["Đối tác", "Kinh phí", "Thời gian"],
      },
      {
        label: "Tự thực hiện",
        items: ["Nội dung sửa chữa"],
      },
    ],
  },
  {
    id: 4,
    key: "post_check",
    title: "Kiểm tra sau BHSC",
    docHints: ["BB KTCL sau BHSC"],
    dataBranches: [
      {
        label: "Đánh giá sau BHSC",
        items: ["Đánh giá hàng sau SC với khách hàng"],
      },
    ],
  },
  {
    id: 5,
    key: "handover",
    title: "Bàn giao SP cho KH",
    docHints: ["BBBG hàng hóa"],
    dataBranches: [
      {
        label: "Bàn giao",
        items: ["Ghi chú bàn giao"],
      },
    ],
  },
];

export function warrantyPhaseTitle(step1To5: number): string {
  const s = Math.min(Math.max(Math.round(step1To5), 1), WARRANTY_PHASE_COUNT);
  return WARRANTY_PROCESS_PHASES[s - 1]?.title ?? `Bước ${s}`;
}
