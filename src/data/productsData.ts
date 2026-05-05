// Defense products with BOM (Bill of Materials) linking to Vật tư module

export interface BOMItem {
  materialId: string; // links to VT-xxx in Materials
  materialName: string;
  quantity: number;
  unit: string;
  serialNumbers?: string[]; // Serial numbers tracked for installed components
}

export interface ChangeHistoryEntry {
  id: string;
  updatedBy: string;
  updatedAt: string; // ISO date
  changes: { field: string; oldValue: string; newValue: string }[];
  note?: string;
}

export interface ProductDocument {
  id: string;
  name: string;
  type: "Hướng dẫn sử dụng" | "Tài liệu kỹ thuật" | "Bản vẽ" | "Quy trình" | "Khác";
  version: string;
  size: string; // e.g. "2.4 MB"
  uploadedBy: string;
  uploadedAt: string; // ISO date
}

export interface ProductTraining {
  id: string;
  title: string;
  trainer: string;
  date: string; // ISO date
  duration: string; // e.g. "2 ngày"
  participants: number;
  status: "scheduled" | "completed" | "cancelled";
  location?: string;
}

export interface DefenseProduct {
  id: string; // Mã sản phẩm
  code: string; // Mã quân sự
  name: string;
  category: string;
  description: string;
  status: "developing" | "producing" | "equipped" | "stopped";
  version: string;
  unit: string;
  manufacturer: string;
  yearReleased: number;
  totalProduced: number;
  bom: BOMItem[];
  specs: { label: string; value: string }[];
  history?: ChangeHistoryEntry[];
  documents?: ProductDocument[];
  trainings?: ProductTraining[];
}

export const defaultDocuments: ProductDocument[] = [
  { id: "DOC-001", name: "Hướng dẫn sử dụng RF-200.pdf", type: "Hướng dẫn sử dụng", version: "v2.1", size: "3.2 MB", uploadedBy: "Nguyễn Văn An", uploadedAt: "2024-11-15T09:30:00Z" },
  { id: "DOC-002", name: "Tài liệu kỹ thuật chi tiết.pdf", type: "Tài liệu kỹ thuật", version: "v2.0", size: "8.7 MB", uploadedBy: "Trần Thị Bình", uploadedAt: "2024-08-20T10:00:00Z" },
  { id: "DOC-003", name: "Bản vẽ lắp ráp.dwg", type: "Bản vẽ", version: "v1.3", size: "1.5 MB", uploadedBy: "Lê Minh Cường", uploadedAt: "2024-05-12T14:20:00Z" },
  { id: "DOC-004", name: "Quy trình bảo trì định kỳ.pdf", type: "Quy trình", version: "v1.0", size: "2.1 MB", uploadedBy: "Phạm Quốc Đạt", uploadedAt: "2024-03-08T08:00:00Z" },
];

export const defaultTrainings: ProductTraining[] = [
  { id: "TR-001", title: "Đào tạo vận hành cơ bản RF-200", trainer: "Đại úy Nguyễn Văn An", date: "2024-12-15T08:00:00Z", duration: "2 ngày", participants: 24, status: "completed", location: "Trung tâm huấn luyện Z755" },
  { id: "TR-002", title: "Đào tạo bảo trì cấp 1", trainer: "Thiếu tá Trần Thị Bình", date: "2025-01-20T08:00:00Z", duration: "3 ngày", participants: 18, status: "scheduled", location: "Nhà máy Z181" },
  { id: "TR-003", title: "Đào tạo kỹ thuật nâng cao", trainer: "Trung tá Lê Minh Cường", date: "2024-10-05T08:00:00Z", duration: "5 ngày", participants: 12, status: "completed", location: "Học viện KTQS" },
];

export const defaultHistory: ChangeHistoryEntry[] = [
  {
    id: "H-001",
    updatedBy: "Nguyễn Văn An",
    updatedAt: "2024-11-15T09:30:00Z",
    changes: [
      { field: "Phiên bản", oldValue: "v2.0", newValue: "v2.1" },
      { field: "Trạng thái", oldValue: "Đang sản xuất", newValue: "Đã trang bị" },
    ],
    note: "Hoàn tất kiểm định cấp Bộ, chuyển sang trang bị đại trà.",
  },
  {
    id: "H-002",
    updatedBy: "Trần Thị Bình",
    updatedAt: "2024-08-22T14:15:00Z",
    changes: [
      { field: "Số lượng đã SX", oldValue: "980", newValue: "1250" },
      { field: "Nhà sản xuất", oldValue: "Nhà máy Z181 - Phân xưởng 1", newValue: "Nhà máy Z181" },
    ],
    note: "Cập nhật sản lượng quý III/2024.",
  },
  {
    id: "H-003",
    updatedBy: "Lê Minh Cường",
    updatedAt: "2024-03-10T08:00:00Z",
    changes: [
      { field: "Mô tả", oldValue: "Máy thu phát vô tuyến VHF", newValue: "Máy thu phát vô tuyến cầm tay dải tần VHF/UHF, mã hóa AES-256, dùng cho cấp tiểu đội." },
    ],
    note: "Bổ sung thông tin kỹ thuật theo yêu cầu Cục TC.",
  },
];

export const defenseProducts: DefenseProduct[] = [
  {
    id: "SP-001",
    code: "VTĐ-RF200/QP",
    name: "Máy thu phát vô tuyến chiến thuật RF-200",
    category: "Vô tuyến",
    description: "Máy thu phát vô tuyến cầm tay dải tần VHF/UHF, mã hóa AES-256, dùng cho cấp tiểu đội.",
    status: "equipped",
    version: "v2.1",
    unit: "Z755 - Bộ Quốc phòng",
    manufacturer: "Nhà máy Z181",
    yearReleased: 2022,
    totalProduced: 1250,
    bom: [
      { materialId: "VT-001", materialName: "Module phát sóng RF-100", quantity: 1, unit: "cái", serialNumbers: ["SN-RF100-A2401"] },
      { materialId: "VT-003", materialName: "Bo mạch xử lý DSP-200", quantity: 1, unit: "cái", serialNumbers: ["SN-DSP200-B1187"] },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 1, unit: "cái", serialNumbers: ["SN-PSU24-C0921"] },
      { materialId: "VT-008", materialName: "IC khuếch đại công suất PA-50W", quantity: 2, unit: "cái", serialNumbers: ["SN-PA50-D3301", "SN-PA50-D3302"] },
      { materialId: "VT-010", materialName: "Anten logarit 30-1000MHz", quantity: 1, unit: "cái", serialNumbers: ["SN-ANT-E5512"] },
      { materialId: "VT-004", materialName: "Connector SMA 50Ω", quantity: 6, unit: "cái" },
      { materialId: "VT-013", materialName: "Pin lithium CR123A 3V", quantity: 4, unit: "cái" },
    ],
    specs: [
      { label: "Dải tần", value: "30-512 MHz" },
      { label: "Công suất phát", value: "5W" },
      { label: "Mã hóa", value: "AES-256" },
      { label: "Trọng lượng", value: "1.2 kg" },
      { label: "IP rating", value: "IP67" },
    ],
  },
  {
    id: "SP-002",
    code: "MMH-AES512/QP",
    name: "Thiết bị mã hóa thoại AES-512",
    category: "Mã hóa",
    description: "Module mã hóa thoại đầu cuối, tích hợp cho mạng truyền tin chiến lược.",
    status: "producing",
    version: "v1.3",
    unit: "Bộ TL Thông tin",
    manufacturer: "Nhà máy Z755",
    yearReleased: 2023,
    totalProduced: 320,
    bom: [
      { materialId: "VT-003", materialName: "Bo mạch xử lý DSP-200", quantity: 2, unit: "cái" },
      { materialId: "VT-014", materialName: "Bộ chuyển đổi A/D 16-bit", quantity: 1, unit: "cái" },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 1, unit: "cái" },
      { materialId: "VT-011", materialName: "Tụ điện tantal 100μF/25V", quantity: 24, unit: "cái" },
      { materialId: "VT-015", materialName: "Vỏ nhôm chống nước IP67", quantity: 1, unit: "cái" },
    ],
    specs: [
      { label: "Thuật toán", value: "AES-512, RSA-4096" },
      { label: "Tốc độ", value: "256 kbps" },
      { label: "Giao diện", value: "RJ45, RS-232" },
      { label: "Nhiệt độ HĐ", value: "-20°C đến +60°C" },
    ],
  },
  {
    id: "SP-003",
    code: "TS-OPT300/QP",
    name: "Hệ thống trinh sát quang điện tử OPT-300",
    category: "Trinh sát",
    description: "Hệ thống quan sát quang điện tử ngày/đêm tích hợp đo xa laser, dùng cho xe thiết giáp.",
    status: "equipped",
    version: "v3.0",
    unit: "Tổng cục CNQP",
    manufacturer: "Viện KHCNQS",
    yearReleased: 2021,
    totalProduced: 85,
    bom: [
      { materialId: "VT-007", materialName: "Cảm biến nhiệt độ PT-100", quantity: 4, unit: "cái" },
      { materialId: "VT-014", materialName: "Bộ chuyển đổi A/D 16-bit", quantity: 2, unit: "cái" },
      { materialId: "VT-003", materialName: "Bo mạch xử lý DSP-200", quantity: 3, unit: "cái" },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 2, unit: "cái" },
      { materialId: "VT-009", materialName: "Cáp quang single-mode SM-9/125", quantity: 12, unit: "mét" },
      { materialId: "VT-015", materialName: "Vỏ nhôm chống nước IP67", quantity: 1, unit: "cái" },
    ],
    specs: [
      { label: "Tầm quan sát ngày", value: "10 km" },
      { label: "Tầm quan sát đêm", value: "5 km" },
      { label: "Đo xa laser", value: "Đến 15 km" },
      { label: "Độ phóng đại", value: "2x - 30x" },
    ],
  },
  {
    id: "SP-004",
    code: "RDR-X100/QP",
    name: "Ra đa cảnh giới tầm thấp X-100",
    category: "Ra đa",
    description: "Ra đa cảnh giới mục tiêu bay thấp, băng X, cự ly phát hiện 40 km.",
    status: "developing",
    version: "v0.9-beta",
    unit: "Quân chủng PK-KQ",
    manufacturer: "Viện Ra đa",
    yearReleased: 2024,
    totalProduced: 12,
    bom: [
      { materialId: "VT-001", materialName: "Module phát sóng RF-100", quantity: 4, unit: "cái" },
      { materialId: "VT-008", materialName: "IC khuếch đại công suất PA-50W", quantity: 8, unit: "cái" },
      { materialId: "VT-003", materialName: "Bo mạch xử lý DSP-200", quantity: 6, unit: "cái" },
      { materialId: "VT-012", materialName: "Bộ lọc SAW 433MHz", quantity: 4, unit: "cái" },
      { materialId: "VT-002", materialName: "Cáp tín hiệu đồng trục RG-58", quantity: 80, unit: "mét" },
      { materialId: "VT-010", materialName: "Anten logarit 30-1000MHz", quantity: 2, unit: "cái" },
    ],
    specs: [
      { label: "Băng tần", value: "X-band (8-12 GHz)" },
      { label: "Tầm phát hiện", value: "40 km" },
      { label: "Độ chính xác", value: "±10 m" },
      { label: "Tốc độ quét", value: "12 vòng/phút" },
    ],
  },
  {
    id: "SP-005",
    code: "CH-CMD500/QP",
    name: "Trung tâm chỉ huy cơ động CMD-500",
    category: "Chỉ huy",
    description: "Hệ thống chỉ huy điều hành tác chiến cấp lữ đoàn, tích hợp bản đồ số.",
    status: "producing",
    version: "v2.0",
    unit: "Bộ Tổng Tham mưu",
    manufacturer: "Viettel HighTech",
    yearReleased: 2023,
    totalProduced: 28,
    bom: [
      { materialId: "VT-003", materialName: "Bo mạch xử lý DSP-200", quantity: 4, unit: "cái" },
      { materialId: "VT-001", materialName: "Module phát sóng RF-100", quantity: 2, unit: "cái" },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 3, unit: "cái" },
      { materialId: "VT-009", materialName: "Cáp quang single-mode SM-9/125", quantity: 200, unit: "mét" },
      { materialId: "VT-007", materialName: "Cảm biến nhiệt độ PT-100", quantity: 6, unit: "cái" },
    ],
    specs: [
      { label: "Số trạm làm việc", value: "8 trạm" },
      { label: "Bản đồ", value: "GIS 3D thời gian thực" },
      { label: "Liên kết", value: "Vệ tinh + 4G/5G + VHF" },
      { label: "Triển khai", value: "< 30 phút" },
    ],
  },
  {
    id: "SP-006",
    code: "VT-SAT2K/QP",
    name: "Trạm vệ tinh di động SAT-2K",
    category: "Vệ tinh",
    description: "Trạm thu phát vệ tinh Ku-band cơ động trên xe, dùng cho liên lạc chiến lược.",
    status: "equipped",
    version: "v1.5",
    unit: "Cục Tác chiến",
    manufacturer: "Viettel HighTech",
    yearReleased: 2020,
    totalProduced: 45,
    bom: [
      { materialId: "VT-001", materialName: "Module phát sóng RF-100", quantity: 2, unit: "cái" },
      { materialId: "VT-008", materialName: "IC khuếch đại công suất PA-50W", quantity: 4, unit: "cái" },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 2, unit: "cái" },
      { materialId: "VT-002", materialName: "Cáp tín hiệu đồng trục RG-58", quantity: 25, unit: "mét" },
      { materialId: "VT-004", materialName: "Connector SMA 50Ω", quantity: 12, unit: "cái" },
    ],
    specs: [
      { label: "Băng tần", value: "Ku-band (12-18 GHz)" },
      { label: "Đường kính anten", value: "1.2 m" },
      { label: "Tốc độ dữ liệu", value: "20 Mbps" },
      { label: "Triển khai", value: "< 15 phút" },
    ],
  },
  {
    id: "SP-007",
    code: "CT-RPT100/QP",
    name: "Trạm chuyển tiếp vô tuyến RPT-100",
    category: "Chuyển tiếp",
    description: "Trạm chuyển tiếp tự động VHF/UHF mở rộng vùng phủ sóng cho mạng vô tuyến chiến thuật.",
    status: "producing",
    version: "v2.2",
    unit: "Bộ TL Thông tin",
    manufacturer: "Nhà máy Z181",
    yearReleased: 2022,
    totalProduced: 180,
    bom: [
      { materialId: "VT-001", materialName: "Module phát sóng RF-100", quantity: 2, unit: "cái" },
      { materialId: "VT-008", materialName: "IC khuếch đại công suất PA-50W", quantity: 2, unit: "cái" },
      { materialId: "VT-010", materialName: "Anten logarit 30-1000MHz", quantity: 2, unit: "cái" },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 1, unit: "cái" },
      { materialId: "VT-015", materialName: "Vỏ nhôm chống nước IP67", quantity: 1, unit: "cái" },
    ],
    specs: [
      { label: "Dải tần", value: "136-174 / 400-470 MHz" },
      { label: "Công suất", value: "25W" },
      { label: "Vùng phủ", value: "Đến 50 km" },
      { label: "Nguồn", value: "AC/DC + Pin dự phòng" },
    ],
  },
  {
    id: "SP-008",
    code: "TD-FO10G/QP",
    name: "Hệ thống truyền dẫn quang FO-10G",
    category: "Truyền dẫn",
    description: "Thiết bị truyền dẫn quang 10Gbps, dùng cho mạng truyền số liệu cấp chiến lược.",
    status: "equipped",
    version: "v1.8",
    unit: "Bộ TL Thông tin",
    manufacturer: "Viettel HighTech",
    yearReleased: 2021,
    totalProduced: 220,
    bom: [
      { materialId: "VT-009", materialName: "Cáp quang single-mode SM-9/125", quantity: 500, unit: "mét" },
      { materialId: "VT-003", materialName: "Bo mạch xử lý DSP-200", quantity: 2, unit: "cái" },
      { materialId: "VT-005", materialName: "Bộ nguồn switching 24V/10A", quantity: 1, unit: "cái" },
      { materialId: "VT-014", materialName: "Bộ chuyển đổi A/D 16-bit", quantity: 1, unit: "cái" },
    ],
    specs: [
      { label: "Tốc độ", value: "10 Gbps" },
      { label: "Khoảng cách", value: "Đến 80 km" },
      { label: "Số kênh", value: "16 kênh DWDM" },
      { label: "MTBF", value: "100,000 giờ" },
    ],
  },
];

export const productCategoryColors: Record<string, string> = {
  "Vô tuyến": "bg-info/10 text-info border-info/30",
  "Mã hóa": "bg-destructive/10 text-destructive border-destructive/30",
  "Trinh sát": "bg-warning/10 text-warning border-warning/30",
  "Ra đa": "bg-primary/10 text-primary border-primary/30",
  "Chỉ huy": "bg-success/10 text-success border-success/30",
  "Vệ tinh": "bg-accent text-accent-foreground border-border",
  "Chuyển tiếp": "bg-muted text-muted-foreground border-border",
  "Truyền dẫn": "bg-secondary text-secondary-foreground border-border",
};
