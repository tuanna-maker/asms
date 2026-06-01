import { isAxiosError } from "axios";
import { toast } from "sonner";

type FieldErrorsShape = {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

function extractFieldError(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const nested = (data as { data?: FieldErrorsShape }).data;
  const fieldErrors = nested?.fieldErrors ?? (data as FieldErrorsShape).fieldErrors;
  if (!fieldErrors || typeof fieldErrors !== "object") return null;
  for (const key of Object.keys(fieldErrors)) {
    const first = fieldErrors[key]?.[0];
    if (first) return first;
  }
  return null;
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const msg = (data as { message?: unknown }).message;
  return typeof msg === "string" && msg.trim() ? msg.trim() : null;
}

/** Lấy message lỗi từ Axios / Error — ưu tiên message server tiếng Việt. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) {
      return "Không kết nối được máy chủ. Kiểm tra mạng và thử lại.";
    }
    const data = error.response.data;
    const field = extractFieldError(data);
    if (field) return field;
    const msg = extractMessage(data);
    if (msg) return msg;
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
  toast.error(getApiErrorMessage(error, fallback));
}
