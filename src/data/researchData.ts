export interface ResearchProject {
  /** Mã/route UI (code) */
  id: string;
  /** UUID Prisma để PUT/DELETE ổn định (ưu tiên hơn code) */
  backendId?: string;
  code: string;
  name: string;
  manager: string;
  department: string;
  fundingSource: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "completed" | "suspended";
  progress: number;
  description: string;
  members: string[];
  tasks: ResearchTask[];
  deliverables: ResearchDeliverable[];
  budget: number;
  budgetSpent: number;
  budgetItems: BudgetItem[];
  councilMembers: CouncilMember[];
  basisItems: BasisItem[];
  deploymentItems: DeploymentItem[];
  cooperationItems: CooperationItem[];
}

export interface ResearchTask {
  id: string;
  title: string;
  assignee: string;
  startDate: string;
  endDate: string;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  progress: number;
  priority?: "low" | "medium" | "high" | "urgent";
  description?: string;
}

export interface ResearchDeliverable {
  id: string;
  title: string;
  assignee: string;
  deadline: string;
  status: "not_started" | "in_progress" | "review" | "completed";
  type: "report" | "dataset" | "model" | "software" | "other";
  progress: number;
  description?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  spent: number;
  note?: string;
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  organization: string;
  expertise: string;
}

export interface BasisItem {
  id: string;
  code: string;
  title: string;
  type: string;
  issuer: string;
  date: string;
}

export interface DeploymentItem {
  id: string;
  title: string;
  description: string;
  target: string;
  timeline: string;
  status: "planning" | "in_progress" | "completed";
}

export interface CooperationItem {
  id: string;
  partner: string;
  type: string;
  content: string;
  status: "active" | "pending" | "completed";
  startDate: string;
}

const statusLabels: Record<string, string> = {
  planning: "Kế hoạch",
  active: "Đang thực hiện",
  completed: "Hoàn thành",
  suspended: "Tạm dừng",
};

const statusColors: Record<string, string> = {
  planning: "bg-warning/15 text-warning",
  active: "bg-info/15 text-info",
  completed: "bg-success/15 text-success",
  suspended: "bg-muted text-muted-foreground",
};

export const getStatusLabel = (status: string) => statusLabels[status] || status;
export const getStatusColor = (status: string) => statusColors[status] || "bg-muted text-muted-foreground";

export const mockResearchProjects: ResearchProject[] = [
  {
    id: "rp-001",
    code: "NCKH.DL.2025.02.06",
    name: "Nghiên cứu ứng dụng công nghệ AI trong giám sát và dự báo chất lượng sản phẩm quốc phòng",
    manager: "Nguyễn Văn An",
    department: "Phòng NC&PT",
    fundingSource: "Ngân sách nhà nước",
    startDate: "2025-01-01",
    endDate: "2026-08-30",
    status: "active",
    progress: 25,
    description: "Nghiên cứu ứng dụng trí tuệ nhân tạo (AI) và học máy (Machine Learning) trong việc giám sát, dự báo và nâng cao chất lượng sản phẩm quốc phòng. Đề tài tập trung vào việc xây dựng mô hình dự báo lỗi sản phẩm, tối ưu hóa quy trình kiểm tra chất lượng và phát triển hệ thống cảnh báo sớm.",
    members: ["Nguyễn Văn An", "Trần Thị Bình", "Lê Hoàng Cường", "Đỗ Minh Tuấn"],
    tasks: [
      { id: "t1", title: "Khảo sát hiện trạng hệ thống QC", assignee: "Trần Thị Bình", startDate: "2025-01-15", endDate: "2025-03-30", status: "completed", progress: 100, priority: "high", description: "Khảo sát toàn bộ quy trình kiểm tra chất lượng hiện tại" },
      { id: "t2", title: "Thu thập và xử lý dữ liệu huấn luyện", assignee: "Lê Hoàng Cường", startDate: "2025-03-01", endDate: "2025-06-30", status: "in_progress", progress: 60, priority: "high" },
      { id: "t3", title: "Xây dựng mô hình AI dự báo", assignee: "Nguyễn Văn An", startDate: "2025-06-01", endDate: "2025-12-31", status: "not_started", progress: 0, priority: "urgent" },
      { id: "t3b", title: "Phát triển API tích hợp", assignee: "Đỗ Minh Tuấn", startDate: "2025-09-01", endDate: "2026-03-30", status: "not_started", progress: 0, priority: "medium" },
      { id: "t3c", title: "Thử nghiệm và đánh giá mô hình", assignee: "Trần Thị Bình", startDate: "2026-01-01", endDate: "2026-05-30", status: "not_started", progress: 0, priority: "medium" },
    ],
    deliverables: [
      { id: "d1", title: "Báo cáo khảo sát hiện trạng", assignee: "Trần Thị Bình", deadline: "2025-04-15", status: "completed", type: "report", progress: 100, description: "Báo cáo tổng hợp hiện trạng QC" },
      { id: "d2", title: "Bộ dữ liệu huấn luyện đã xử lý", assignee: "Lê Hoàng Cường", deadline: "2025-07-15", status: "in_progress", type: "dataset", progress: 55 },
      { id: "d3", title: "Mô hình AI dự báo chất lượng", assignee: "Nguyễn Văn An", deadline: "2026-01-30", status: "not_started", type: "model", progress: 0 },
      { id: "d3b", title: "Phần mềm tích hợp hệ thống", assignee: "Đỗ Minh Tuấn", deadline: "2026-05-30", status: "not_started", type: "software", progress: 0 },
    ],
    budget: 2500000000,
    budgetSpent: 620000000,
    budgetItems: [
      { id: "b1", category: "Nhân công", amount: 800000000, spent: 280000000 },
      { id: "b2", category: "Thiết bị", amount: 600000000, spent: 150000000 },
      { id: "b3", category: "Vật liệu", amount: 400000000, spent: 120000000 },
      { id: "b4", category: "Đi lại", amount: 200000000, spent: 50000000 },
      { id: "b5", category: "Quản lý", amount: 300000000, spent: 20000000 },
      { id: "b6", category: "Chi phí khác", amount: 200000000, spent: 0 },
    ],
    councilMembers: [
      { id: "c1", name: "PGS.TS Nguyễn Hữu Đức", role: "Chủ tịch", organization: "Viện KHCNQS", expertise: "Trí tuệ nhân tạo" },
      { id: "c2", name: "TS. Trần Quốc Bảo", role: "Phản biện 1", organization: "Học viện KTQS", expertise: "Xử lý tín hiệu" },
      { id: "c3", name: "TS. Lê Minh Hoàng", role: "Phản biện 2", organization: "ĐH Bách Khoa", expertise: "Machine Learning" },
      { id: "c4", name: "ThS. Phạm Văn Nam", role: "Thư ký", organization: "Phòng NC&PT", expertise: "Quản lý dự án" },
    ],
    basisItems: [
      { id: "bs1", code: "QĐ-2025/BQP-001", title: "Quyết định phê duyệt đề tài NCKH cấp Bộ năm 2025", type: "Quyết định", issuer: "Bộ Quốc phòng", date: "2024-12-15" },
      { id: "bs2", code: "HD-2025/NCPT-006", title: "Hợp đồng thực hiện đề tài nghiên cứu khoa học", type: "Hợp đồng", issuer: "Phòng NC&PT", date: "2025-01-05" },
    ],
    deploymentItems: [
      { id: "dp1", title: "Triển khai thử nghiệm tại nhà máy Z111", description: "Lắp đặt hệ thống giám sát AI tại dây chuyền sản xuất thử nghiệm", target: "Nhà máy Z111", timeline: "Q3/2026", status: "planning" },
      { id: "dp2", title: "Đào tạo nhân sự vận hành", description: "Tổ chức khóa đào tạo sử dụng hệ thống AI cho cán bộ KCS", target: "Phòng KCS", timeline: "Q4/2026", status: "planning" },
    ],
    cooperationItems: [
      { id: "co1", partner: "Học viện Kỹ thuật Quân sự", type: "Nghiên cứu chung", content: "Phối hợp nghiên cứu thuật toán AI và chia sẻ dữ liệu huấn luyện", status: "active", startDate: "2025-02-01" },
      { id: "co2", partner: "Viện Công nghệ Thông tin", type: "Hỗ trợ kỹ thuật", content: "Hỗ trợ hạ tầng tính toán hiệu năng cao cho huấn luyện mô hình", status: "pending", startDate: "2025-06-01" },
    ],
  },
  {
    id: "rp-002",
    code: "NCKH.SC.2026",
    name: "Nghiên cứu xây dựng hệ thống dự báo, cảnh báo sớm nguồn cung vật tư chiến lược",
    manager: "Phạm Thị Thu",
    department: "Phòng Vật tư",
    fundingSource: "Ngân sách Bộ",
    startDate: "2026-01-01",
    endDate: "2027-09-30",
    status: "planning",
    progress: 5,
    description: "Nghiên cứu phương pháp dự báo nhu cầu vật tư chiến lược, xây dựng hệ thống cảnh báo sớm về biến động nguồn cung.",
    members: ["Phạm Thị Thu", "Hoàng Đức Mạnh"],
    tasks: [
      { id: "t4", title: "Phân tích dữ liệu lịch sử tiêu thụ", assignee: "Hoàng Đức Mạnh", startDate: "2026-02-01", endDate: "2026-05-30", status: "not_started", progress: 0, priority: "high" },
    ],
    deliverables: [
      { id: "d4", title: "Báo cáo phân tích xu hướng vật tư", assignee: "Phạm Thị Thu", deadline: "2026-06-30", status: "not_started", type: "report", progress: 0 },
    ],
    budget: 1800000000,
    budgetSpent: 0,
    budgetItems: [
      { id: "b7", category: "Nhân công", amount: 600000000, spent: 0 },
      { id: "b8", category: "Thiết bị", amount: 500000000, spent: 0 },
      { id: "b9", category: "Quản lý", amount: 200000000, spent: 0 },
    ],
    councilMembers: [],
    basisItems: [],
    deploymentItems: [],
    cooperationItems: [],
  },
  {
    id: "rp-003",
    code: "NCKH.DL.2025.02.07",
    name: "Nghiên cứu xây dựng hệ thống cảnh báo, dự báo sớm nguồn cung vật liệu sử dụng dữ liệu lớn",
    manager: "Vũ Trung Hải",
    department: "Phòng NC&PT",
    fundingSource: "Ngân sách nhà nước",
    startDate: "2025-01-01",
    endDate: "2027-06-30",
    status: "active",
    progress: 15,
    description: "Nghiên cứu ứng dụng công nghệ dữ liệu lớn (Big Data) và phân tích dự báo để cảnh báo sớm biến động nguồn cung vật liệu chiến lược.",
    members: ["Vũ Trung Hải", "Đỗ Minh Tuấn", "Nguyễn Thu Hà"],
    tasks: [
      { id: "t5", title: "Xây dựng kiến trúc hệ thống Big Data", assignee: "Vũ Trung Hải", startDate: "2025-02-01", endDate: "2025-08-30", status: "in_progress", progress: 40, priority: "high" },
      { id: "t6", title: "Phát triển module thu thập dữ liệu", assignee: "Đỗ Minh Tuấn", startDate: "2025-06-01", endDate: "2025-12-31", status: "not_started", progress: 0, priority: "medium" },
    ],
    deliverables: [
      { id: "d5", title: "Thiết kế kiến trúc hệ thống", assignee: "Vũ Trung Hải", deadline: "2025-09-15", status: "in_progress", type: "report", progress: 35 },
    ],
    budget: 3200000000,
    budgetSpent: 480000000,
    budgetItems: [
      { id: "b10", category: "Nhân công", amount: 1000000000, spent: 200000000 },
      { id: "b11", category: "Thiết bị", amount: 1200000000, spent: 200000000 },
      { id: "b12", category: "Vật liệu", amount: 500000000, spent: 80000000 },
    ],
    councilMembers: [
      { id: "c5", name: "PGS.TS Hoàng Minh Sơn", role: "Chủ tịch", organization: "ĐH Bách Khoa", expertise: "Big Data" },
      { id: "c6", name: "TS. Nguyễn Thanh Hùng", role: "Phản biện 1", organization: "Viện CNTT", expertise: "Data Analytics" },
    ],
    basisItems: [
      { id: "bs3", code: "QĐ-2025/BQP-007", title: "Quyết định phê duyệt đề tài Big Data", type: "Quyết định", issuer: "Bộ Quốc phòng", date: "2024-12-20" },
    ],
    deploymentItems: [],
    cooperationItems: [
      { id: "co3", partner: "FPT Software", type: "Chuyển giao công nghệ", content: "Hỗ trợ nền tảng Big Data và đào tạo kỹ thuật", status: "active", startDate: "2025-03-01" },
    ],
  },
  {
    id: "rp-004",
    code: "NCKH.DL.2026.02.05",
    name: "Nghiên cứu thiết kế, chế tạo và thử nghiệm thiết bị đo tự động liên tục các thông số kỹ thuật sản phẩm",
    manager: "Vũ Trung Hải",
    department: "Phòng KCS",
    fundingSource: "Ngân sách Bộ",
    startDate: "2026-01-01",
    endDate: "2028-06-30",
    status: "planning",
    progress: 5,
    description: "Nghiên cứu thiết kế và chế tạo thiết bị đo tự động các thông số kỹ thuật quan trọng của sản phẩm quốc phòng.",
    members: ["Vũ Trung Hải", "Trần Minh Đức"],
    tasks: [],
    deliverables: [
      { id: "d6", title: "Bản thiết kế thiết bị đo", assignee: "Vũ Trung Hải", deadline: "2026-12-30", status: "not_started", type: "other", progress: 0 },
    ],
    budget: 950000000,
    budgetSpent: 0,
    budgetItems: [{ id: "b13", category: "Thiết bị", amount: 600000000, spent: 0 }, { id: "b14", category: "Nhân công", amount: 350000000, spent: 0 }],
    councilMembers: [],
    basisItems: [],
    deploymentItems: [],
    cooperationItems: [],
  },
  {
    id: "rp-005",
    code: "NCKH.2024.02.04",
    name: "Nghiên cứu xác lập luận cứ khoa học và thực tiễn trong quản lý tích trữ vật tư đa mục tiêu",
    manager: "Phạm Thị Thu",
    department: "Phòng Vật tư",
    fundingSource: "Ngân sách nhà nước",
    startDate: "2024-01-01",
    endDate: "2026-07-30",
    status: "active",
    progress: 30,
    description: "Nghiên cứu xây dựng cơ sở khoa học cho việc quản lý tồn kho vật tư theo nhiều mục tiêu đồng thời.",
    members: ["Phạm Thị Thu", "Lê Quang Hưng", "Nguyễn Thành Nam"],
    tasks: [
      { id: "t7", title: "Thu thập dữ liệu tồn kho 5 năm", assignee: "Lê Quang Hưng", startDate: "2024-02-01", endDate: "2024-06-30", status: "completed", progress: 100, priority: "high" },
      { id: "t8", title: "Xây dựng mô hình tối ưu hóa", assignee: "Phạm Thị Thu", startDate: "2024-07-01", endDate: "2025-06-30", status: "in_progress", progress: 55, priority: "high" },
    ],
    deliverables: [
      { id: "d7", title: "Báo cáo phân tích dữ liệu tồn kho", assignee: "Lê Quang Hưng", deadline: "2024-07-15", status: "completed", type: "report", progress: 100 },
      { id: "d8", title: "Phần mềm tối ưu hóa tồn kho", assignee: "Nguyễn Thành Nam", deadline: "2025-12-30", status: "in_progress", type: "software", progress: 30 },
    ],
    budget: 1500000000,
    budgetSpent: 450000000,
    budgetItems: [{ id: "b15", category: "Nhân công", amount: 700000000, spent: 250000000 }, { id: "b16", category: "Thiết bị", amount: 400000000, spent: 100000000 }, { id: "b17", category: "Quản lý", amount: 200000000, spent: 100000000 }],
    councilMembers: [{ id: "c7", name: "GS.TS Trần Đại Nghĩa", role: "Chủ tịch", organization: "Viện Hậu cần", expertise: "Quản lý chuỗi cung ứng" }],
    basisItems: [{ id: "bs4", code: "QĐ-2024/BQP-004", title: "Quyết định phê duyệt đề tài quản lý vật tư", type: "Quyết định", issuer: "Bộ Quốc phòng", date: "2023-12-10" }],
    deploymentItems: [{ id: "dp3", title: "Áp dụng thí điểm tại Kho K52", description: "Triển khai phần mềm tối ưu tồn kho tại kho K52", target: "Kho K52", timeline: "Q1/2026", status: "planning" }],
    cooperationItems: [],
  },
  {
    id: "rp-006",
    code: "KXBN-07.25",
    name: "Nghiên cứu diễn biến sạt lở bờ kè, đề xuất giải pháp quản lý và ứng phó với sạt lở công trình kho bãi",
    manager: "Thân Văn Đôn",
    department: "Phòng Hạ tầng",
    fundingSource: "Ngân sách đơn vị",
    startDate: "2025-01-01",
    endDate: "2027-06-30",
    status: "active",
    progress: 20,
    description: "Nghiên cứu nguyên nhân và diễn biến sạt lở tại các công trình kho bãi, đề xuất giải pháp kỹ thuật phòng ngừa.",
    members: ["Thân Văn Đôn", "Bùi Quốc Việt"],
    tasks: [{ id: "t9", title: "Khảo sát thực địa các điểm sạt lở", assignee: "Bùi Quốc Việt", startDate: "2025-02-01", endDate: "2025-06-30", status: "in_progress", progress: 70, priority: "high" }],
    deliverables: [{ id: "d9", title: "Bản đồ phân vùng nguy cơ sạt lở", assignee: "Thân Văn Đôn", deadline: "2025-12-30", status: "not_started", type: "other", progress: 0 }],
    budget: 1200000000,
    budgetSpent: 240000000,
    budgetItems: [{ id: "b18", category: "Nhân công", amount: 500000000, spent: 150000000 }, { id: "b19", category: "Thiết bị", amount: 400000000, spent: 90000000 }],
    councilMembers: [],
    basisItems: [],
    deploymentItems: [],
    cooperationItems: [],
  },
  {
    id: "rp-007",
    code: "KHBN-14.24",
    name: "Nghiên cứu đề xuất giải pháp bảo vệ, phòng ngừa, hạn chế giảm thiểu tình trạng cạn kiệt vật tư chiến lược",
    manager: "Thân Văn Đôn",
    department: "Phòng Vật tư",
    fundingSource: "Ngân sách Bộ",
    startDate: "2024-01-01",
    endDate: "2026-07-30",
    status: "active",
    progress: 40,
    description: "Đánh giá thực trạng và đề xuất giải pháp tổng thể bảo vệ nguồn vật tư chiến lược cho ngành quốc phòng.",
    members: ["Thân Văn Đôn", "Hoàng Đức Mạnh", "Trần Thị Bình"],
    tasks: [
      { id: "t10", title: "Đánh giá thực trạng nguồn vật tư", assignee: "Hoàng Đức Mạnh", startDate: "2024-01-15", endDate: "2024-06-30", status: "completed", progress: 100, priority: "high" },
      { id: "t11", title: "Xây dựng phương án bảo vệ", assignee: "Thân Văn Đôn", startDate: "2024-07-01", endDate: "2025-12-30", status: "in_progress", progress: 50, priority: "medium" },
    ],
    deliverables: [
      { id: "d10", title: "Báo cáo thực trạng vật tư chiến lược", assignee: "Hoàng Đức Mạnh", deadline: "2024-07-15", status: "completed", type: "report", progress: 100 },
      { id: "d11", title: "Đề án giải pháp tổng thể", assignee: "Thân Văn Đôn", deadline: "2026-03-30", status: "in_progress", type: "report", progress: 35 },
    ],
    budget: 2200000000,
    budgetSpent: 880000000,
    budgetItems: [{ id: "b20", category: "Nhân công", amount: 900000000, spent: 450000000 }, { id: "b21", category: "Đi lại", amount: 400000000, spent: 200000000 }, { id: "b22", category: "Quản lý", amount: 300000000, spent: 230000000 }],
    councilMembers: [{ id: "c8", name: "PGS.TS Lê Văn Thắng", role: "Chủ tịch", organization: "Cục Quân khí", expertise: "Quản lý vật tư QP" }],
    basisItems: [{ id: "bs5", code: "QĐ-2024/CQK-014", title: "Quyết định giao nhiệm vụ NCKH", type: "Quyết định", issuer: "Cục Quân khí", date: "2023-12-25" }],
    deploymentItems: [],
    cooperationItems: [{ id: "co4", partner: "Cục Kỹ thuật các Quân khu", type: "Khảo sát thực tế", content: "Phối hợp khảo sát thực trạng vật tư tại các đơn vị", status: "active", startDate: "2024-02-01" }],
  },
  {
    id: "rp-008",
    code: "NCKH.DL.2026.02.06",
    name: "Nghiên cứu xây dựng hệ thống thông minh giám sát và cảnh báo hạn hán thiếu nước thời gian thực trên cơ sở IoT",
    manager: "Phan Quang Thức",
    department: "Phòng NC&PT",
    fundingSource: "Ngân sách nhà nước",
    startDate: "2026-01-01",
    endDate: "2028-06-30",
    status: "planning",
    progress: 5,
    description: "Nghiên cứu xây dựng hệ thống IoT giám sát và cảnh báo hạn hán, thiếu nước thời gian thực.",
    members: ["Phan Quang Thức", "Đỗ Minh Tuấn"],
    tasks: [],
    deliverables: [{ id: "d12", title: "Thiết kế hệ thống IoT", assignee: "Phan Quang Thức", deadline: "2026-12-30", status: "not_started", type: "other", progress: 0 }],
    budget: 2800000000,
    budgetSpent: 0,
    budgetItems: [{ id: "b23", category: "Thiết bị IoT", amount: 1500000000, spent: 0 }, { id: "b24", category: "Nhân công", amount: 800000000, spent: 0 }],
    councilMembers: [],
    basisItems: [],
    deploymentItems: [],
    cooperationItems: [],
  },
  {
    id: "rp-009",
    code: "TB-CT/CN07/25-26",
    name: "Nghiên cứu ứng dụng công nghệ số, xây dựng hệ thống quản lý hoạt động điều tra tài nguyên phục vụ công nghiệp quốc phòng",
    manager: "Nhữ Thị Linh",
    department: "Phòng CNTT",
    fundingSource: "Ngân sách Bộ",
    startDate: "2025-05-01",
    endDate: "2027-04-30",
    status: "planning",
    progress: 0,
    description: "Nghiên cứu xây dựng nền tảng số hóa quản lý hoạt động điều tra, khảo sát tài nguyên phục vụ sản xuất quốc phòng.",
    members: ["Nhữ Thị Linh", "Nguyễn Văn An"],
    tasks: [],
    deliverables: [{ id: "d13", title: "Phần mềm quản lý tài nguyên", assignee: "Nhữ Thị Linh", deadline: "2027-01-30", status: "not_started", type: "software", progress: 0 }],
    budget: 1600000000,
    budgetSpent: 0,
    budgetItems: [{ id: "b25", category: "Nhân công", amount: 800000000, spent: 0 }, { id: "b26", category: "Phần mềm", amount: 500000000, spent: 0 }],
    councilMembers: [],
    basisItems: [],
    deploymentItems: [],
    cooperationItems: [],
  },
];
