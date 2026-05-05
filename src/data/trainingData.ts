export interface Trainee {
  id: string;
  name: string;
  unit: string;
  rank?: string;
  attendance: "present" | "absent" | "pending";
  score?: number;
}

export interface ScheduleSession {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  topic: string;
  location: string;
  status: "planned" | "done" | "cancelled";
}

export interface TrainingCourse {
  id: string;
  title: string;
  type: "internal" | "external" | "online";
  instructor: string;
  customer: string;
  startDate: string;
  endDate: string;
  participants: number;
  status: "planned" | "ongoing" | "completed";
  description?: string;
  location?: string;
  trainees?: Trainee[];
  schedule?: ScheduleSession[];
}

export const typeLabel = { internal: "Nội bộ", external: "Khách hàng", online: "Online" } as const;
export const statusLabel = { planned: "Lên kế hoạch", ongoing: "Đang diễn ra", completed: "Hoàn thành" } as const;
export const statusColor = {
  planned: "bg-info/10 text-info",
  ongoing: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
} as const;

const sampleTrainees1: Trainee[] = [
  { id: "HV-1", name: "Nguyễn Văn Hùng", unit: "Đại đội 1", rank: "Trung úy", attendance: "present", score: 8.5 },
  { id: "HV-2", name: "Trần Văn Bình", unit: "Đại đội 1", rank: "Thiếu úy", attendance: "present", score: 9.0 },
  { id: "HV-3", name: "Lê Thị Hoa", unit: "Đại đội 2", rank: "Đại úy", attendance: "absent" },
  { id: "HV-4", name: "Phạm Văn Cường", unit: "Đại đội 2", rank: "Trung úy", attendance: "present", score: 7.5 },
];

const sampleSchedule1: ScheduleSession[] = [
  { id: "S-1", date: "2025-04-10", startTime: "08:00", endTime: "11:30", topic: "Giới thiệu thiết bị", location: "Hội trường A", status: "done" },
  { id: "S-2", date: "2025-04-11", startTime: "08:00", endTime: "11:30", topic: "Cấu trúc & nguyên lý", location: "Hội trường A", status: "done" },
  { id: "S-3", date: "2025-04-12", startTime: "13:30", endTime: "16:30", topic: "Thực hành vận hành", location: "Phòng LAB", status: "done" },
  { id: "S-4", date: "2025-04-15", startTime: "08:00", endTime: "11:00", topic: "Kiểm tra cuối khóa", location: "Hội trường A", status: "done" },
];

const sampleTrainees2: Trainee[] = [
  { id: "HV-5", name: "Vũ Đức Minh", unit: "Tiểu đoàn 1", rank: "Đại úy", attendance: "present" },
  { id: "HV-6", name: "Hoàng Thị Lan", unit: "Tiểu đoàn 1", rank: "Trung úy", attendance: "pending" },
  { id: "HV-7", name: "Đỗ Văn Thắng", unit: "Tiểu đoàn 2", rank: "Thiếu tá", attendance: "present" },
];

const sampleSchedule2: ScheduleSession[] = [
  { id: "S-5", date: "2025-04-20", startTime: "08:00", endTime: "11:30", topic: "Tổng quan bảo dưỡng", location: "Phòng họp 1", status: "done" },
  { id: "S-6", date: "2025-04-22", startTime: "08:00", endTime: "11:30", topic: "Quy trình kiểm tra định kỳ", location: "Phòng họp 1", status: "planned" },
  { id: "S-7", date: "2025-04-25", startTime: "13:30", endTime: "16:30", topic: "Kiểm tra & cấp chứng chỉ", location: "Phòng họp 1", status: "planned" },
];

export const initialCourses: TrainingCourse[] = [
  { id: "DT-001", title: "Vận hành thiết bị radar X-2000", type: "internal", instructor: "Nguyễn Văn A", customer: "Quân khu 1", startDate: "2025-04-10", endDate: "2025-04-15", participants: 24, status: "completed", location: "Trung tâm đào tạo", description: "Khóa huấn luyện vận hành cho cán bộ kỹ thuật.", trainees: sampleTrainees1, schedule: sampleSchedule1 },
  { id: "DT-002", title: "Bảo dưỡng định kỳ hệ thống thông tin", type: "external", instructor: "Trần Thị B", customer: "Quân khu 3", startDate: "2025-04-20", endDate: "2025-04-25", participants: 18, status: "ongoing", location: "Khách hàng", description: "Hướng dẫn quy trình bảo dưỡng định kỳ.", trainees: sampleTrainees2, schedule: sampleSchedule2 },
  { id: "DT-003", title: "An toàn lao động - Quý 2/2025", type: "online", instructor: "Lê Văn C", customer: "Nội bộ", startDate: "2025-05-05", endDate: "2025-05-07", participants: 45, status: "planned", location: "MS Teams", trainees: [], schedule: [] },
  { id: "DT-004", title: "Sử dụng phần mềm ERP", type: "internal", instructor: "Phạm Thị D", customer: "Bộ TL TTTM", startDate: "2025-05-12", endDate: "2025-05-14", participants: 30, status: "planned", location: "Phòng đào tạo", trainees: [], schedule: [] },
];
