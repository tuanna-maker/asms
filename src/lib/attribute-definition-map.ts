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
  };
}

export function resolveDefinitionLabel(items: DefinitionItem[], code: string | null | undefined): string {
  if (!code) return "—";
  const match = items.find((item) => item.code === code);
  return match?.label ?? code;
}
