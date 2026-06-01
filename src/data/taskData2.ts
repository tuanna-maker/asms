export interface TaskItem {
  id: string;
  /** Mã công việc (backend) để hiển thị / tìm kiếm */
  code?: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  assignee: string;
  startDate: string;
  deadline: string;
  status: "todo" | "in_progress" | "review" | "completed";
  progress: number;
  projectId?: string;
  projectCode?: string;
  type: "research" | "report" | "fieldwork" | "admin" | "review";
}

export const taskTypeLabels: Record<string, string> = {
  research: "Nghiên cứu",
  report: "Báo cáo",
  fieldwork: "Khảo sát",
  admin: "Hành chính",
  review: "Xét duyệt",
};

export const statusLabels: Record<string, string> = {
  todo: "Chờ thực hiện",
  in_progress: "Đang thực hiện",
  review: "Đang xét duyệt",
  completed: "Hoàn thành",
  delayed: "Trễ hạn",
};

export const priorityLabels: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

export const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-accent/15 text-accent",
  urgent: "bg-destructive/15 text-destructive",
};

export const statusColors: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  review: "bg-warning/15 text-warning",
  completed: "bg-success/15 text-success",
};

export const statusDotColors: Record<string, string> = {
  todo: "bg-muted-foreground",
  in_progress: "bg-info",
  review: "bg-warning",
  completed: "bg-success",
};

export const statusColumnBorder: Record<string, string> = {
  todo: "border-t-muted-foreground",
  in_progress: "border-t-info",
  review: "border-t-warning",
  completed: "border-t-success",
};

export const priorityDotColors: Record<string, string> = {
  low: "bg-muted-foreground",
  medium: "bg-warning",
  high: "bg-accent",
  urgent: "bg-destructive",
};

export const mockTasks: TaskItem[] = [
  { id: "tk-001", title: "Khảo sát hiện trạng hệ thống QC", description: "Khảo sát toàn bộ quy trình kiểm tra chất lượng hiện tại tại các nhà máy", priority: "high", assignee: "Trần Thị Bình", startDate: "2025-01-15", deadline: "2025-03-30", status: "completed", progress: 100, projectId: "rp-001", projectCode: "NCKH.DL.2025.02.06", type: "fieldwork" },
  { id: "tk-002", title: "Thu thập và xử lý dữ liệu huấn luyện", description: "Thu thập dữ liệu sản xuất từ các dây chuyền, xử lý và chuẩn hóa cho huấn luyện AI", priority: "high", assignee: "Lê Hoàng Cường", startDate: "2025-03-01", deadline: "2025-06-30", status: "in_progress", progress: 60, projectId: "rp-001", projectCode: "NCKH.DL.2025.02.06", type: "research" },
  { id: "tk-003", title: "Xây dựng mô hình AI dự báo", description: "Phát triển và huấn luyện mô hình AI dự báo chất lượng sản phẩm", priority: "urgent", assignee: "Nguyễn Văn An", startDate: "2025-06-01", deadline: "2025-12-31", status: "todo", progress: 0, projectId: "rp-001", projectCode: "NCKH.DL.2025.02.06", type: "research" },
  { id: "tk-004", title: "Phát triển API tích hợp", description: "Xây dựng API để tích hợp mô hình AI vào hệ thống quản lý chất lượng", priority: "medium", assignee: "Đỗ Minh Tuấn", startDate: "2025-09-01", deadline: "2026-03-30", status: "todo", progress: 0, projectId: "rp-001", projectCode: "NCKH.DL.2025.02.06", type: "research" },
  { id: "tk-005", title: "Xây dựng kiến trúc hệ thống Big Data", description: "Thiết kế kiến trúc tổng thể hệ thống Big Data cho dự báo vật liệu", priority: "high", assignee: "Vũ Trung Hải", startDate: "2025-02-01", deadline: "2025-08-30", status: "in_progress", progress: 40, projectId: "rp-003", projectCode: "NCKH.DL.2025.02.07", type: "research" },
  { id: "tk-006", title: "Phát triển module thu thập dữ liệu", description: "Phát triển module tự động thu thập dữ liệu từ nhiều nguồn", priority: "medium", assignee: "Đỗ Minh Tuấn", startDate: "2025-06-01", deadline: "2025-12-31", status: "todo", progress: 0, projectId: "rp-003", projectCode: "NCKH.DL.2025.02.07", type: "research" },
  { id: "tk-007", title: "Thu thập dữ liệu tồn kho 5 năm", description: "Tổng hợp và phân tích dữ liệu tồn kho vật tư trong 5 năm qua", priority: "high", assignee: "Lê Quang Hưng", startDate: "2024-02-01", deadline: "2024-06-30", status: "completed", progress: 100, projectId: "rp-005", projectCode: "NCKH.2024.02.04", type: "fieldwork" },
  { id: "tk-008", title: "Xây dựng mô hình tối ưu hóa", description: "Phát triển mô hình toán học tối ưu hóa quản lý tồn kho đa mục tiêu", priority: "high", assignee: "Phạm Thị Thu", startDate: "2024-07-01", deadline: "2025-06-30", status: "in_progress", progress: 55, projectId: "rp-005", projectCode: "NCKH.2024.02.04", type: "research" },
  { id: "tk-009", title: "Khảo sát thực địa các điểm sạt lở", description: "Đi thực địa khảo sát, đo đạc và lấy mẫu tại các công trình kho bãi bị sạt lở", priority: "high", assignee: "Bùi Quốc Việt", startDate: "2025-02-01", deadline: "2025-06-30", status: "in_progress", progress: 70, projectId: "rp-006", projectCode: "KXBN-07.25", type: "fieldwork" },
  { id: "tk-010", title: "Đánh giá thực trạng nguồn vật tư", description: "Tổng hợp, đánh giá thực trạng nguồn vật tư chiến lược tại các đơn vị", priority: "high", assignee: "Hoàng Đức Mạnh", startDate: "2024-01-15", deadline: "2024-06-30", status: "completed", progress: 100, projectId: "rp-007", projectCode: "KHBN-14.24", type: "fieldwork" },
  { id: "tk-011", title: "Xây dựng phương án bảo vệ", description: "Đề xuất phương án tổng thể bảo vệ nguồn vật tư chiến lược", priority: "medium", assignee: "Thân Văn Đôn", startDate: "2024-07-01", deadline: "2025-12-30", status: "in_progress", progress: 50, projectId: "rp-007", projectCode: "KHBN-14.24", type: "research" },
  { id: "tk-012", title: "Viết báo cáo tiến độ Q2/2025", description: "Tổng hợp báo cáo tiến độ các đề tài nghiên cứu quý 2 năm 2025", priority: "medium", assignee: "Phạm Thị Thu", startDate: "2025-06-15", deadline: "2025-07-05", status: "review", progress: 80, type: "report" },
  { id: "tk-013", title: "Chuẩn bị hồ sơ nghiệm thu đề tài KHBN-14.24", description: "Chuẩn bị đầy đủ hồ sơ, tài liệu cho hội đồng nghiệm thu", priority: "urgent", assignee: "Thân Văn Đôn", startDate: "2025-10-01", deadline: "2025-11-30", status: "todo", progress: 0, projectId: "rp-007", projectCode: "KHBN-14.24", type: "admin" },
  { id: "tk-014", title: "Thử nghiệm và đánh giá mô hình", description: "Thử nghiệm mô hình AI trên dữ liệu thực tế và đánh giá hiệu năng", priority: "medium", assignee: "Trần Thị Bình", startDate: "2026-01-01", deadline: "2026-05-30", status: "todo", progress: 0, projectId: "rp-001", projectCode: "NCKH.DL.2025.02.06", type: "research" },
];
