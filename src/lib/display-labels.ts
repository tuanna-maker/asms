import { CONTRACT_STATUS_LABELS } from "@/lib/contract-status";

/** Nhãn tiếng Việt cho mã trạng thái / loại (fallback khi danh mục chưa có nhãn). */
export const DISPLAY_CODE_LABELS: Record<string, string> = {
  ...CONTRACT_STATUS_LABELS,

  dashboard: "Bảng điều khiển",

  // Vai trò / người dùng
  admin: "Quản trị",
  manager: "Quản lý",
  technician: "Kỹ thuật viên",
  sales: "Nhân viên bán hàng",
  viewer: "Người xem",
  inactive: "Ngừng hoạt động",

  // Sản phẩm
  developing: "Đang phát triển",
  producing: "Đang sản xuất",
  produced: "Sản xuất xong",
  inspection_submitted: "Đã trình nghiệm thu",
  inspecting: "Đang nghiệm thu",
  inspection_passed: "Nghiệm thu xong",
  decision_approved: "QĐ phê duyệt",
  equip_decided: "Có QĐ trang bị",
  equipped: "Đã trang bị",
  stopped: "Dừng sản xuất",

  // Vật tư
  consumable: "Tiêu hao",
  identified: "Định danh",
  storage: "Trong kho",
  transferring: "Đang điều chuyển",
  maintenance: "Bảo trì",
  decommissioned: "Thanh lý",

  // Phiếu / chuyển trạng thái
  pending: "Chờ xử lý",
  processing: "Đang xử lý",

  // Công việc
  todo: "Chờ thực hiện",
  not_started: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  review: "Đang xét duyệt",
  delayed: "Trễ hạn",

  // Đào tạo
  planned: "Lên kế hoạch",
  ongoing: "Đang diễn ra",
  internal: "Nội bộ",
  external: "Bên ngoài",
  online: "Trực tuyến",

  // Đề tài NC
  planning: "Kế hoạch",
  suspended: "Tạm dừng",

  // Quy trình
  running: "Đang xử lý",
  cancelled: "Đã hủy",

  // Bảo hành / loại
  warranty: "Bảo hành",
  repair: "Sửa chữa",
  urgent: "Khẩn cấp",
  high: "Cao",
  medium: "Trung bình",
  low: "Thấp",
  open: "Đang mở",
  closed: "Đã đóng",

  // Loại công việc
  research: "Nghiên cứu",
  report: "Báo cáo",
  fieldwork: "Khảo sát",
  admin_task: "Hành chính",

  // Tài liệu
  pdf: "PDF",
  doc: "Word",
  xls: "Excel",
  img: "Hình ảnh",
  other: "Khác",

  // CRM liên hệ
  lead: "Tiềm năng",
  prospect: "Triển vọng",
  customer: "Khách hàng",
};

export function formatDisplayLabel(code: string | null | undefined): string {
  if (code == null) return "—";
  const trimmed = String(code).trim();
  if (!trimmed) return "—";
  return DISPLAY_CODE_LABELS[trimmed] ?? trimmed;
}

export function getProductStatusLabel(status: string | null | undefined): string {
  return formatDisplayLabel(status);
}
