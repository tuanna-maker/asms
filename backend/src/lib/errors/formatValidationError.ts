import type { z } from "zod";

export type ZodFlatten = {
  formErrors: string[];
  fieldErrors: Record<string, string[]>;
};

const FIELD_LABELS: Record<string, string> = {
  title: "tiêu đề",
  content: "nội dung",
  customerId: "khách hàng",
  contractId: "hợp đồng",
  assignee: "phân công",
  assignees: "phân công",
  userId: "người dùng",
  roleCode: "vai trò",
  feedbackAt: "ngày phản ánh",
  name: "tên",
  fullName: "họ tên",
  code: "mã",
  email: "email",
  password: "mật khẩu",
  issue: "mô tả sự cố",
  body: "nội dung",
  kind: "loại",
  status: "trạng thái",
  productId: "sản phẩm",
  materialId: "vật tư",
  linkageItems: "liên kết SP/VT",
  quantity: "số lượng",
  destination: "đích đến",
  type: "loại",
  unitId: "đơn vị",
  unit: "đơn vị tính",
  warehouse: "kho",
  category: "danh mục",
  categoryCode: "nhóm tài liệu",
  value: "giá trị hợp đồng",
  startDate: "ngày bắt đầu",
  endDate: "ngày kết thúc",
  warrantyEnd: "ngày hết bảo hành",
  yearReleased: "năm phát hành",
  typeCode: "loại khóa học",
  fileType: "định dạng file",
  currentStep: "bước hiện tại",
  progress: "tiến độ",
  activityAt: "thời gian hoạt động",
  workflowStep: "bước quy trình",
  slaHours: "SLA (giờ)",
  plannedHours: "số giờ dự kiến",
  participants: "số học viên",
  totalProduced: "số lượng sản xuất",
  department: "phòng ban",
  managerId: "người quản lý",
  instructorId: "giảng viên",
  location: "địa điểm",
  phone: "số điện thoại",
  address: "địa chỉ",
  description: "mô tả",
  priorityCode: "mức độ ưu tiên",
  assigneeId: "người phụ trách",
  deadline: "hạn hoàn thành",
  projectId: "dự án",
  sourceCode: "nguồn khách hàng",
  companyTypeCode: "loại công ty",
  foundedAt: "ngày thành lập",
  birthday: "ngày sinh",
  transferDate: "ngày điều chuyển",
  attendance: "điểm danh",
  score: "điểm",
  topic: "chủ đề",
  startTime: "giờ bắt đầu",
  endTime: "giờ kết thúc",
  rootCause: "nguyên nhân gốc",
  receiptCategory: "loại tiếp nhận",
  executionMode: "hình thức xử lý",
};

function fieldLabel(path: string): string {
  const key = path.split(".").pop() ?? path;
  return FIELD_LABELS[key] ?? key;
}

function capitalizeVi(label: string): string {
  if (!label) return label;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function extractMaxFromTooBig(raw: string): number | null {
  const m = raw.match(/<=\s*(\d+)/);
  return m ? Number(m[1]) : null;
}

function extractMinFromTooSmall(raw: string): number | null {
  if (/>\s*0\b/.test(raw)) return 1;
  const gte = raw.match(/>=\s*(\d+)/);
  if (gte) return Number(gte[1]);
  const gt = raw.match(/>(?!=)\s*(\d+)/);
  if (gt) return Number(gt[1]) + 1;
  return null;
}

function translateZodMessage(path: string, raw: string): string {
  const label = fieldLabel(path);
  const lower = raw.toLowerCase();

  if (lower.includes("invalid email")) {
    return "Email không hợp lệ";
  }

  if (lower.includes("invalid option")) {
    return `${capitalizeVi(label)} không hợp lệ`;
  }

  if (lower.includes("expected date")) {
    return `Vui lòng chọn ${label}`;
  }

  if (lower.includes("expected number")) {
    if (lower.includes("received string")) {
      return `${capitalizeVi(label)} phải là số`;
    }
    if (lower.includes("<=")) {
      const max = extractMaxFromTooBig(raw);
      if (max !== null) {
        return `${capitalizeVi(label)} không được lớn hơn ${max}`;
      }
    }
    if (lower.includes(">=") || lower.includes(">")) {
      const min = extractMinFromTooSmall(raw);
      if (min !== null && min > 0) {
        return `${capitalizeVi(label)} phải từ ${min} trở lên`;
      }
      if (min === 0) {
        return `${capitalizeVi(label)} không được âm`;
      }
    }
    if (lower.includes("received undefined")) {
      return `Vui lòng nhập hoặc chọn ${label}`;
    }
    return `${capitalizeVi(label)} không hợp lệ`;
  }

  if (
    lower.includes("expected string") ||
    lower.includes("invalid input")
  ) {
    if (lower.includes("received undefined") || lower === "invalid input") {
      return `Vui lòng nhập hoặc chọn ${label}`;
    }
    return `${capitalizeVi(label)} không hợp lệ`;
  }

  if (lower.includes("too big") || lower.includes("maximum")) {
    const max = extractMaxFromTooBig(raw);
    if (max !== null) {
      return `${capitalizeVi(label)} không được lớn hơn ${max}`;
    }
    return `${capitalizeVi(label)} vượt quá giới hạn cho phép`;
  }

  if (lower.includes("too small") || lower.includes("minimum")) {
    if (raw.includes(">0") || raw.includes("> 0")) {
      return `${capitalizeVi(label)} phải lớn hơn 0`;
    }
    const min = extractMinFromTooSmall(raw);
    if (min !== null && min > 1) {
      return `${capitalizeVi(label)} phải từ ${min} trở lên`;
    }
    if (min === 1) {
      return `${capitalizeVi(label)} phải lớn hơn 0`;
    }
    if (min === 0) {
      return `${capitalizeVi(label)} không được âm`;
    }
    return `Vui lòng nhập ${label}`;
  }

  if (lower.includes("required")) {
    return `Vui lòng nhập hoặc chọn ${label}`;
  }

  if (lower.includes("at least")) {
    return `Vui lòng nhập ${label}`;
  }

  if (lower.includes("invalid")) {
    return `${capitalizeVi(label)} không hợp lệ`;
  }

  return raw;
}

function translateFlatten(flatten: ZodFlatten): ZodFlatten {
  const fieldErrors: Record<string, string[]> = {};
  for (const [path, messages] of Object.entries(flatten.fieldErrors)) {
    fieldErrors[path] = (messages ?? []).map((m) => translateZodMessage(path, m));
  }
  return {
    formErrors: flatten.formErrors.map((m) => translateZodMessage("", m)),
    fieldErrors,
  };
}

/** Chuyển flatten Zod → message tiếng Việt + details đã Việt hóa cho FE. */
export function formatValidationFlatten(flatten: ZodFlatten): {
  message: string;
  details: ZodFlatten;
} {
  const translated = translateFlatten(flatten);

  for (const messages of Object.values(translated.fieldErrors)) {
    const first = messages?.[0];
    if (first) {
      return { message: first, details: translated };
    }
  }

  const formErr = translated.formErrors[0];
  if (formErr) {
    return { message: formErr, details: translated };
  }

  return { message: "Dữ liệu gửi lên không hợp lệ", details: translated };
}

export function formatZodError(error: z.ZodError): { message: string; details: ZodFlatten } {
  return formatValidationFlatten(error.flatten());
}
