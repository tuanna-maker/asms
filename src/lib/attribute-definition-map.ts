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
    createdBy: createdByName ?? (item.isSystem ? "Hệ thống" : "—"),
    updatedAt: item.updatedAt,
    updatedBy: updatedByName ?? (item.isSystem ? "Hệ thống" : "—"),
    status: item.isActive ? "active" : "inactive",
    isSystem: item.isSystem,
  };
}

export function resolveDefinitionLabel(items: DefinitionItem[], code: string | null | undefined): string {
  if (!code) return "—";
  const match = items.find((item) => item.code === code);
  return match?.label ?? code;
}
