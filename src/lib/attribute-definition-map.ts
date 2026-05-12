import type { DefinitionItem } from "@/hooks/use-definitions-api";
import type { AttributeRow } from "@/lib/attribute-settings-config";

export function mapDefinitionToAttributeRow(item: DefinitionItem): AttributeRow {
  return {
    id: item.id,
    name: item.label,
    createdAt: item.createdAt,
    createdBy: "—",
    status: item.isActive ? "active" : "inactive",
  };
}

export function resolveDefinitionLabel(items: DefinitionItem[], code: string | null | undefined): string {
  if (!code) return "—";
  const match = items.find((item) => item.code === code);
  return match?.label ?? code;
}
