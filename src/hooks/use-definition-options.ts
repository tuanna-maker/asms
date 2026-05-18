import { useMemo } from "react";

import { useDefinitionsList, type DefinitionItem } from "@/hooks/use-definitions-api";

export type DefinitionOption = { value: string; label: string };

/**
 * Lấy danh sách giá trị thuộc tính theo `category` để gắn vào ô chọn / lọc.
 *
 * - Trả `value` (mã lưu) và `label` (nhãn hiển thị) đã sắp theo `sortOrder`.
 * - Nếu API chưa có dữ liệu, dùng `fallback` (vd: hằng số seed) để form không bị trống.
 */
export function useDefinitionOptions(
  category: string,
  fallback?: ReadonlyArray<DefinitionOption>,
): DefinitionOption[] {
  const { data: rows = [] } = useDefinitionsList(category);

  return useMemo(() => {
    if (rows.length > 0) {
      return [...rows]
        .sort(sortByOrder)
        .map((row): DefinitionOption => ({ value: row.code, label: row.label }));
    }
    return fallback ? [...fallback] : [];
  }, [rows, fallback]);
}

function sortByOrder(a: DefinitionItem, b: DefinitionItem) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.label.localeCompare(b.label);
}

/**
 * Chuẩn hóa giá trị cũ của «Nguồn phiếu bảo hành» (tiếng Việt có dấu) sang `code`
 * (`customer` / `internal`). Trả nguyên gốc nếu đã đúng `code` hoặc không khớp.
 */
export function normalizeLegacyWarrantySource(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  const lowered = trimmed.toLowerCase();
  if (lowered === "customer" || lowered === "internal") return lowered;
  if (trimmed === "Khách hàng") return "customer";
  if (trimmed === "Nội bộ") return "internal";
  return trimmed;
}
