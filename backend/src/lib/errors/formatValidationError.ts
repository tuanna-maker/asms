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
  userId: "người dùng",
  roleCode: "vai trò",
  feedbackAt: "ngày phản ánh",
  name: "tên",
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
};

function fieldLabel(path: string): string {
  const key = path.split(".").pop() ?? path;
  return FIELD_LABELS[key] ?? key;
}

function translateZodMessage(path: string, raw: string): string {
  const label = fieldLabel(path);
  const lower = raw.toLowerCase();
  if (lower.includes("required") || lower === "invalid input") {
    return `Vui lòng nhập hoặc chọn ${label}`;
  }
  if (
    lower.includes("at least") ||
    lower.includes("too small") ||
    lower.includes("minimum")
  ) {
    return `Vui lòng nhập ${label}`;
  }
  if (lower.includes("invalid")) {
    return `${label.charAt(0).toUpperCase() + label.slice(1)} không hợp lệ`;
  }
  return raw;
}

/** Chuyển flatten Zod → message tiếng Việt + giữ details cho FE. */
export function formatValidationFlatten(flatten: ZodFlatten): {
  message: string;
  details: ZodFlatten;
} {
  for (const [path, messages] of Object.entries(flatten.fieldErrors)) {
    const first = messages?.[0];
    if (first) {
      return {
        message: translateZodMessage(path, first),
        details: flatten,
      };
    }
  }
  const formErr = flatten.formErrors[0];
  if (formErr) {
    return { message: translateZodMessage("", formErr), details: flatten };
  }
  return { message: "Dữ liệu gửi lên không hợp lệ", details: flatten };
}

export function formatZodError(error: z.ZodError): { message: string; details: ZodFlatten } {
  return formatValidationFlatten(error.flatten());
}
