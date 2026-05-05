// Mock detailed data for dashboard tables

export interface ContractRow {
  id: string;
  name: string;
  customer: string;
  value: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "late";
  progress: number;
}

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  customer: string;
  status: "producing" | "inspecting" | "equipped";
  quantity: number;
  deliveryDate: string;
}

export interface ComplaintRow {
  id: string;
  customer: string;
  product: string;
  type: "warranty" | "repair";
  description: string;
  status: "processing" | "done";
  createdDate: string;
  resolvedDate: string | null;
  isLate: boolean;
}

export interface HandoverRow {
  id: string;
  contract: string;
  customer: string;
  products: number;
  date: string;
  status: "active" | "completed";
  isLate: boolean;
}

export interface TrainingRow {
  id: string;
  contract: string;
  customer: string;
  topic: string;
  date: string;
  status: "active" | "completed";
  isLate: boolean;
}

export const contractsData: ContractRow[] = [
  { id: "HĐ-2024-001", name: "Cung cấp TB thông tin liên lạc A1", customer: "Quân khu 1", value: 2500, startDate: "01/03/2024", endDate: "01/09/2024", status: "active", progress: 75 },
  { id: "HĐ-2024-002", name: "TB trinh sát điện tử B3", customer: "Quân khu 3", value: 2100, startDate: "01/02/2024", endDate: "31/12/2024", status: "active", progress: 65 },
  { id: "HĐ-2024-003", name: "Hệ thống thông tin chỉ huy C5", customer: "Quân khu 5", value: 3200, startDate: "10/03/2024", endDate: "15/09/2024", status: "late", progress: 45 },
  { id: "HĐ-2024-004", name: "TB mã hóa truyền dẫn D7", customer: "Quân khu 7", value: 4600, startDate: "01/04/2024", endDate: "31/12/2024", status: "active", progress: 38 },
  { id: "HĐ-2024-005", name: "Đài vô tuyến sóng ngắn đa băng", customer: "Quân khu 9", value: 1250, startDate: "20/01/2024", endDate: "30/08/2024", status: "completed", progress: 100 },
  { id: "HĐ-2024-006", name: "Hệ thống chỉ huy tự động tích hợp", customer: "Bộ TL TTTM", value: 8500, startDate: "15/02/2024", endDate: "30/11/2024", status: "active", progress: 55 },
  { id: "HĐ-2024-007", name: "TB liên lạc vệ tinh di động E1", customer: "Quân khu 1", value: 5800, startDate: "01/05/2024", endDate: "31/12/2024", status: "active", progress: 62 },
  { id: "HĐ-2024-008", name: "Phụ kiện bảo trì hệ thống radar", customer: "Quân khu 3", value: 720, startDate: "10/06/2024", endDate: "30/09/2024", status: "completed", progress: 100 },
  { id: "HĐ-2024-009", name: "TB giám sát tần số vô tuyến", customer: "Quân khu 5", value: 1350, startDate: "20/03/2024", endDate: "20/08/2024", status: "late", progress: 72 },
  { id: "HĐ-2024-010", name: "Mạng thông tin quân sự thế hệ mới", customer: "Bộ TL TTTM", value: 12800, startDate: "01/01/2024", endDate: "30/06/2025", status: "active", progress: 42 },
  { id: "HĐ-2024-011", name: "TB định vị và dẫn đường chiến thuật", customer: "Quân khu 7", value: 2150, startDate: "10/04/2024", endDate: "10/11/2024", status: "active", progress: 48 },
  { id: "HĐ-2024-012", name: "Hệ thống truyền dẫn quang dã chiến", customer: "Quân khu 9", value: 3700, startDate: "01/02/2024", endDate: "01/08/2024", status: "completed", progress: 100 },
];

export const productsData: ProductRow[] = [
  { id: "SP-001", name: "Đài vô tuyến R-150M", category: "Vô tuyến", customer: "Quân khu 1", status: "equipped", quantity: 24, deliveryDate: "15/03/2024" },
  { id: "SP-002", name: "Máy mã hóa MK-200", category: "Mã hóa", customer: "Quân khu 3", status: "producing", quantity: 12, deliveryDate: "30/09/2024" },
  { id: "SP-003", name: "TB trinh sát TS-50", category: "Trinh sát", customer: "Quân khu 5", status: "inspecting", quantity: 8, deliveryDate: "20/08/2024" },
  { id: "SP-004", name: "Đài chuyển tiếp CT-100", category: "Chuyển tiếp", customer: "Quân khu 7", status: "producing", quantity: 15, deliveryDate: "31/10/2024" },
  { id: "SP-005", name: "TB thông tin vệ tinh VS-300", category: "Vệ tinh", customer: "Bộ TL TTTM", status: "equipped", quantity: 6, deliveryDate: "01/02/2024" },
  { id: "SP-006", name: "Máy thu phát sóng ngắn SN-80", category: "Vô tuyến", customer: "Quân khu 9", status: "equipped", quantity: 30, deliveryDate: "10/04/2024" },
  { id: "SP-007", name: "Hệ thống chỉ huy CH-500", category: "Chỉ huy", customer: "Quân khu 1", status: "inspecting", quantity: 4, deliveryDate: "15/11/2024" },
  { id: "SP-008", name: "TB liên lạc số LS-120", category: "Số", customer: "Quân khu 3", status: "producing", quantity: 18, deliveryDate: "30/12/2024" },
  { id: "SP-009", name: "Đài ra đa cảnh giới CG-200", category: "Ra đa", customer: "Quân khu 5", status: "equipped", quantity: 3, deliveryDate: "05/06/2024" },
  { id: "SP-010", name: "TB truyền dẫn quang TQ-50", category: "Truyền dẫn", customer: "Quân khu 7", status: "producing", quantity: 10, deliveryDate: "28/11/2024" },
];

export const complaintsData: ComplaintRow[] = [
  { id: "KN-001", customer: "Quân khu 1", product: "Đài vô tuyến R-150M", type: "warranty", description: "Lỗi module phát sóng", status: "processing", createdDate: "10/05/2024", resolvedDate: null, isLate: false },
  { id: "KN-002", customer: "Quân khu 3", product: "Máy mã hóa MK-200", type: "repair", description: "Hỏng bàn phím nhập", status: "done", createdDate: "15/03/2024", resolvedDate: "20/04/2024", isLate: false },
  { id: "KN-003", customer: "Quân khu 5", product: "TB trinh sát TS-50", type: "warranty", description: "Màn hình không hiển thị", status: "processing", createdDate: "01/06/2024", resolvedDate: null, isLate: true },
  { id: "KN-004", customer: "Quân khu 7", product: "Đài chuyển tiếp CT-100", type: "warranty", description: "Nhiễu tín hiệu đầu ra", status: "done", createdDate: "20/02/2024", resolvedDate: "10/03/2024", isLate: false },
  { id: "KN-005", customer: "Bộ TL TTTM", product: "TB thông tin vệ tinh VS-300", type: "repair", description: "Lỗi anten thu", status: "processing", createdDate: "25/04/2024", resolvedDate: null, isLate: true },
  { id: "KN-006", customer: "Quân khu 9", product: "Máy thu phát SN-80", type: "warranty", description: "Pin không sạc được", status: "done", createdDate: "12/01/2024", resolvedDate: "28/01/2024", isLate: false },
  { id: "KN-007", customer: "Quân khu 1", product: "Hệ thống CH-500", type: "repair", description: "Lỗi phần mềm điều khiển", status: "processing", createdDate: "08/07/2024", resolvedDate: null, isLate: false },
  { id: "KN-008", customer: "Quân khu 3", product: "TB liên lạc số LS-120", type: "warranty", description: "Lỗi kết nối mạng", status: "done", createdDate: "03/04/2024", resolvedDate: "15/05/2024", isLate: true },
];

export const handoversData: HandoverRow[] = [
  { id: "BG-001", contract: "HĐ-2024-001", customer: "Quân khu 1", products: 24, date: "30/06/2024", status: "completed", isLate: false },
  { id: "BG-002", contract: "HĐ-2024-005", customer: "Quân khu 9", products: 30, date: "30/08/2024", status: "completed", isLate: false },
  { id: "BG-003", contract: "HĐ-2024-002", customer: "Quân khu 3", products: 8, date: "15/09/2024", status: "active", isLate: false },
  { id: "BG-004", contract: "HĐ-2024-006", customer: "Bộ TL TTTM", products: 4, date: "30/10/2024", status: "active", isLate: true },
  { id: "BG-005", contract: "HĐ-2024-004", customer: "Quân khu 7", products: 10, date: "15/11/2024", status: "active", isLate: false },
  { id: "BG-006", contract: "HĐ-2024-003", customer: "Quân khu 5", products: 8, date: "15/09/2024", status: "active", isLate: true },
];

export const trainingsData: TrainingRow[] = [
  { id: "HL-001", contract: "HĐ-2024-001", customer: "Quân khu 1", topic: "Vận hành đài R-150M", date: "15/07/2024", status: "completed", isLate: false },
  { id: "HL-002", contract: "HĐ-2024-005", customer: "Quân khu 9", topic: "Sử dụng máy SN-80", date: "15/09/2024", status: "completed", isLate: false },
  { id: "HL-003", contract: "HĐ-2024-002", customer: "Quân khu 3", topic: "Vận hành TB trinh sát", date: "30/10/2024", status: "active", isLate: false },
  { id: "HL-004", contract: "HĐ-2024-006", customer: "Bộ TL TTTM", topic: "Hệ thống chỉ huy tự động", date: "15/12/2024", status: "active", isLate: true },
  { id: "HL-005", contract: "HĐ-2024-004", customer: "Quân khu 7", topic: "Bảo trì TB mã hóa", date: "30/11/2024", status: "active", isLate: false },
];
