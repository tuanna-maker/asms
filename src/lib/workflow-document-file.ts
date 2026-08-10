/** Nhận diện loại file tài liệu quy trình để xem / tải. */

export function isImageDocument(mimeType?: string | null, fileName?: string | null): boolean {
  if (mimeType?.startsWith("image/")) return true;
  return Boolean(fileName?.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/i));
}

export function isPdfDocument(mimeType?: string | null, fileName?: string | null): boolean {
  if (mimeType === "application/pdf") return true;
  return Boolean(fileName?.match(/\.pdf$/i));
}

/** Có thể mở xem trên trình duyệt (ảnh / PDF / text). */
export function isBrowserPreviewable(mimeType?: string | null, fileName?: string | null): boolean {
  if (isImageDocument(mimeType, fileName) || isPdfDocument(mimeType, fileName)) return true;
  if (mimeType?.startsWith("text/")) return true;
  return Boolean(fileName?.match(/\.(txt|csv|md|json)$/i));
}

export function triggerFileDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Tải file (blob) — hoạt động cả khi server trả Content-Disposition: inline (ảnh/PDF). */
export async function downloadUploadFile(url: string, fileName: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Tải thất bại (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerFileDownload(objectUrl, fileName);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
