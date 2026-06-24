import { isAxiosError } from "axios";
import { toast } from "sonner";

type FieldErrorsShape = {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

function readValidationShape(data: unknown): FieldErrorsShape | null {
  if (!data || typeof data !== "object") return null;
  const nested = (data as { data?: FieldErrorsShape }).data;
  if (nested?.fieldErrors || nested?.formErrors) return nested;
  const direct = data as FieldErrorsShape;
  if (direct.fieldErrors || direct.formErrors) return direct;
  return null;
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const msg = (data as { message?: unknown }).message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : null;
}

/** Tất cả thông báo validation (đã Việt hóa từ server). */
export function getApiValidationMessages(error: unknown): string[] {
  if (!isAxiosError(error) || !error.response) return [];
  const shape = readValidationShape(error.response.data);
  if (!shape) return [];

  const out: string[] = [];
  for (const msgs of Object.values(shape.fieldErrors ?? {})) {
    for (const m of msgs ?? []) {
      if (m && !out.includes(m)) out.push(m);
    }
  }
  for (const m of shape.formErrors ?? []) {
    if (m && !out.includes(m)) out.push(m);
  }
  return out;
}

/** Lấy message lỗi từ Axios / Error — ưu tiên message server tiếng Việt. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.";
    }
    const data = error.response.data;
    const msg = extractMessage(data);
    if (msg) return msg;

    const validation = getApiValidationMessages(error);
    if (validation.length > 0) return validation.join("; ");

    if (error.response.status === 403) return "Bạn không có quyền thực hiện thao tác này";
    if (error.response.status === 404) return "Không tìm thấy dữ liệu yêu cầu";
    if (error.response.status === 409) return "Dữ liệu đã tồn tại hoặc bị trùng";
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export function toastApiError(error: unknown, fallback: string): void {
  const validation = getApiValidationMessages(error);
  if (validation.length > 1) {
    toast.error(validation[0], {
      description: validation.slice(1).join("\n"),
    });
    return;
  }
  toast.error(getApiErrorMessage(error, fallback));
}
