// Mock data for equipment tracking with full details

export interface EquipmentTransferHistory {
  date: string;
  from: string;
  to: string;
  reason: string;
  approvedBy: string;
}

export interface MaintenanceRecord {
  date: string;
  type: "scheduled" | "unscheduled";
  description: string;
  status: "done" | "pending" | "overdue";
  nextDate?: string;
}

export interface Equipment {
  id: string;
  name: string;
  serial: string;
  category: string;
  status: "active" | "storage" | "transferring" | "maintenance" | "decommissioned";
  currentLocation: string;
  installedOn: string | null; // parent device
  managedBy: string;
  importDate: string;
  expiryDate: string | null;
  imageUrl?: string;
  attachments: string[];
  transferHistory: EquipmentTransferHistory[];
  maintenance: MaintenanceRecord[];
}

export const equipmentData: Equipment[] = [
  {
    id: "TB-001",
    name: "Bộ xử lý tín hiệu SX-500",
    serial: "SN-SX500-0042",
    category: "Điện tử",
    status: "active",
    currentLocation: "Quân khu 3 - Đại đội 2",
    installedOn: "Đài radar RD-200 (#RD-200-015)",
    managedBy: "Quân khu 3",
    importDate: "12/01/2023",
    expiryDate: "12/01/2028",
    attachments: ["Hướng dẫn sử dụng.pdf", "Phiếu kiểm định.pdf"],
    transferHistory: [
      { date: "12/01/2023", from: "Nhà máy Z111", to: "Kho chính", reason: "Nhập kho mới", approvedBy: "Nguyễn Văn A" },
      { date: "15/03/2023", from: "Kho chính", to: "Quân khu 3 - Đại đội 2", reason: "Trang bị theo HĐ-2023-005", approvedBy: "Trần Văn B" },
    ],
    maintenance: [
      { date: "15/09/2023", type: "scheduled", description: "Bảo dưỡng định kỳ 6 tháng", status: "done", nextDate: "15/03/2024" },
      { date: "15/03/2024", type: "scheduled", description: "Bảo dưỡng định kỳ 6 tháng", status: "done", nextDate: "15/09/2024" },
    ],
  },
  {
    id: "TB-002",
    name: "Nguồn điện công suất PS-120",
    serial: "SN-PS120-0018",
    category: "Nguồn điện",
    status: "transferring",
    currentLocation: "Đang điều chuyển → Quân khu 7",
    installedOn: null,
    managedBy: "Bộ TL TTTM",
    importDate: "05/06/2022",
    expiryDate: "05/06/2027",
    attachments: ["Biên bản nghiệm thu.pdf"],
    transferHistory: [
      { date: "05/06/2022", from: "Nhà máy Z119", to: "Kho chính", reason: "Nhập kho mới", approvedBy: "Lê Văn C" },
      { date: "20/10/2022", from: "Kho chính", to: "Quân khu 5 - Trung đoàn 1", reason: "Trang bị theo HĐ-2022-012", approvedBy: "Phạm Văn D" },
      { date: "10/04/2024", from: "Quân khu 5", to: "Quân khu 7", reason: "Điều chuyển theo kế hoạch", approvedBy: "Hoàng Văn E" },
    ],
    maintenance: [
      { date: "05/12/2022", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "done" },
      { date: "05/06/2023", type: "unscheduled", description: "Thay thế tụ điện hỏng", status: "done" },
      { date: "05/12/2023", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "done" },
      { date: "05/06/2024", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "overdue", nextDate: "05/06/2024" },
    ],
  },
  {
    id: "TB-003",
    name: "Anten thu phát AT-300",
    serial: "SN-AT300-0007",
    category: "Anten",
    status: "active",
    currentLocation: "Quân khu 1 - Tiểu đoàn 3",
    installedOn: "Xe thông tin XTT-100 (#XTT-100-003)",
    managedBy: "Quân khu 1",
    importDate: "20/08/2023",
    expiryDate: null,
    attachments: ["Sơ đồ lắp đặt.pdf", "Chứng chỉ hiệu chuẩn.pdf"],
    transferHistory: [
      { date: "20/08/2023", from: "Nhà máy Z111", to: "Kho chính", reason: "Nhập kho", approvedBy: "Nguyễn Văn A" },
      { date: "01/10/2023", from: "Kho chính", to: "Quân khu 1 - Tiểu đoàn 3", reason: "Trang bị theo HĐ-2023-018", approvedBy: "Đỗ Văn F" },
    ],
    maintenance: [
      { date: "01/04/2024", type: "scheduled", description: "Kiểm tra hiệu chuẩn", status: "done", nextDate: "01/10/2024" },
    ],
  },
  {
    id: "TB-004",
    name: "Modul mã hóa MH-50",
    serial: "SN-MH50-0033",
    category: "Bảo mật",
    status: "storage",
    currentLocation: "Kho chính",
    installedOn: null,
    managedBy: "Bộ TL TTTM",
    importDate: "15/11/2023",
    expiryDate: "15/11/2026",
    attachments: ["Hồ sơ kỹ thuật.pdf"],
    transferHistory: [
      { date: "15/11/2023", from: "Nhà máy Z189", to: "Kho chính", reason: "Nhập kho mới", approvedBy: "Nguyễn Văn A" },
    ],
    maintenance: [
      { date: "15/05/2024", type: "scheduled", description: "Kiểm tra định kỳ", status: "pending", nextDate: "15/05/2024" },
    ],
  },
  {
    id: "TB-005",
    name: "Bộ khuếch đại KĐ-800",
    serial: "SN-KD800-0012",
    category: "Điện tử",
    status: "maintenance",
    currentLocation: "Xưởng sửa chữa - Nhà máy Z111",
    installedOn: null,
    managedBy: "Quân khu 9",
    importDate: "10/03/2022",
    expiryDate: "10/03/2027",
    attachments: ["Phiếu sửa chữa.pdf"],
    transferHistory: [
      { date: "10/03/2022", from: "Nhà máy Z111", to: "Kho chính", reason: "Nhập kho", approvedBy: "Lê Văn C" },
      { date: "25/05/2022", from: "Kho chính", to: "Quân khu 9 - Trung đoàn 5", reason: "Trang bị theo HĐ-2022-008", approvedBy: "Trần Văn G" },
      { date: "02/02/2024", from: "Quân khu 9", to: "Xưởng sửa chữa Z111", reason: "Sửa chữa - lỗi công suất", approvedBy: "Phạm Văn H" },
    ],
    maintenance: [
      { date: "10/09/2022", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "done" },
      { date: "10/03/2023", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "done" },
      { date: "02/02/2024", type: "unscheduled", description: "Sửa chữa lỗi công suất đầu ra", status: "pending" },
    ],
  },
  {
    id: "TB-006",
    name: "Cáp quang đặc chủng CQ-10",
    serial: "SN-CQ10-0055",
    category: "Cáp/Dây",
    status: "active",
    currentLocation: "Quân khu 7 - Đại đội 5",
    installedOn: "Hệ thống truyền dẫn TD-400 (#TD-400-008)",
    managedBy: "Quân khu 7",
    importDate: "01/07/2023",
    expiryDate: "01/07/2033",
    attachments: [],
    transferHistory: [
      { date: "01/07/2023", from: "Nhà máy Z119", to: "Kho chính", reason: "Nhập kho", approvedBy: "Nguyễn Văn A" },
      { date: "15/08/2023", from: "Kho chính", to: "Quân khu 7 - Đại đội 5", reason: "Trang bị theo HĐ-2023-012", approvedBy: "Lê Văn I" },
    ],
    maintenance: [],
  },
  {
    id: "TB-007",
    name: "Màn hình hiển thị MH-22",
    serial: "SN-MH22-0091",
    category: "Hiển thị",
    status: "decommissioned",
    currentLocation: "Kho thanh lý",
    installedOn: null,
    managedBy: "Bộ TL TTTM",
    importDate: "15/02/2020",
    expiryDate: "15/02/2024",
    attachments: ["Biên bản thanh lý.pdf"],
    transferHistory: [
      { date: "15/02/2020", from: "Nhà máy Z111", to: "Kho chính", reason: "Nhập kho", approvedBy: "Hoàng Văn K" },
      { date: "10/04/2020", from: "Kho chính", to: "Quân khu 5 - Tiểu đoàn 1", reason: "Trang bị", approvedBy: "Trần Văn L" },
      { date: "20/03/2024", from: "Quân khu 5", to: "Kho thanh lý", reason: "Hết hạn sử dụng", approvedBy: "Nguyễn Văn M" },
    ],
    maintenance: [
      { date: "15/08/2020", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "done" },
      { date: "15/02/2021", type: "scheduled", description: "Bảo dưỡng định kỳ", status: "done" },
    ],
  },
  {
    id: "TB-008",
    name: "Bộ chuyển đổi giao thức CĐ-60",
    serial: "SN-CD60-0028",
    category: "Mạng",
    status: "active",
    currentLocation: "Quân khu 5 - Trung đoàn 2",
    installedOn: "Tổng đài TĐ-500 (#TD-500-004)",
    managedBy: "Quân khu 5",
    importDate: "08/09/2023",
    expiryDate: "08/09/2028",
    attachments: ["Hướng dẫn cấu hình.pdf"],
    transferHistory: [
      { date: "08/09/2023", from: "Nhà máy Z189", to: "Kho phụ", reason: "Nhập kho", approvedBy: "Nguyễn Văn A" },
      { date: "20/11/2023", from: "Kho phụ", to: "Quân khu 5 - Trung đoàn 2", reason: "Trang bị theo HĐ-2023-022", approvedBy: "Đỗ Văn N" },
    ],
    maintenance: [
      { date: "20/05/2024", type: "scheduled", description: "Cập nhật firmware", status: "pending", nextDate: "20/05/2024" },
    ],
  },
];

export const statusConfig: Record<Equipment["status"], { label: string; color: string }> = {
  active: { label: "Đang sử dụng", color: "bg-success/10 text-success border-success/30" },
  storage: { label: "Trong kho", color: "bg-info/10 text-info border-info/30" },
  transferring: { label: "Đang điều chuyển", color: "bg-warning/10 text-warning border-warning/30" },
  maintenance: { label: "Đang sửa chữa", color: "bg-accent/10 text-accent border-accent/30" },
  decommissioned: { label: "Thanh lý", color: "bg-muted text-muted-foreground border-muted" },
};
