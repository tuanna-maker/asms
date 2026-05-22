import type { DefinitionItem } from "@/hooks/use-definitions-api";
import type { AttributeRow } from "@/lib/attribute-settings-config";

export function mapDefinitionToAttributeRow(item: DefinitionItem): AttributeRow {
  const updatedByName = item.updatedBy?.fullName ?? null;
  const createdByName = item.createdBy?.fullName ?? null;
  return {
    id: item.id,
    code: item.code,
    name: item.label,
    createdAt: item.createdAt,
    createdBy: createdByName ?? "—",
    updatedAt: item.updatedAt,
    updatedBy: updatedByName ?? "—",
    status: item.isActive ? "active" : "inactive",
    isSystem: item.isSystem,
    slaHours: item.slaHours ?? null,
  };
}

export function resolveDefinitionLabel(items: DefinitionItem[], code: string | null | undefined): string {
  if (!code) return "—";
  const trimmed = String(code).trim();
  const byCode = items.find((item) => item.code === trimmed);
  if (byCode) return byCode.label;
  const byLabel = items.find((item) => item.label === trimmed);
  if (byLabel) return byLabel.label;
  return trimmed;
}

/** Đổi giá trị cũ (có thể là nhãn) sang mã danh mục để lưu API. */
export function resolveDefinitionCode(
  items: DefinitionItem[],
  stored: string | null | undefined,
): string {
  if (!stored) return "";
  const trimmed = String(stored).trim();
  if (!trimmed) return "";
  const byCode = items.find((item) => item.code === trimmed);
  if (byCode) return byCode.code;
  const byLabel = items.find((item) => item.label === trimmed);
  if (byLabel) return byLabel.code;
  return trimmed;
}
