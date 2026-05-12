import { getAttributeModule, type AttributeModuleKey } from "@/lib/attribute-settings-config";
import { INITIAL_ATTRIBUTE_MODULE_DATA } from "@/lib/attribute-settings-mock";
import { CONTRACT_STATUS_REFERENCE_ROWS } from "@/lib/contract-status";
import { AttributeSectionCard } from "@/components/settings/attributes/AttributeSectionCard";
import { AttributeDefinitionSection } from "@/components/settings/attributes/AttributeDefinitionSection";
import { AttributeEnumSection } from "@/components/settings/attributes/AttributeEnumSection";
import { useRole } from "@/hooks/use-role";

type AttributeModulePanelProps = {
  moduleKey: AttributeModuleKey;
};

export function AttributeModulePanel({ moduleKey }: AttributeModulePanelProps) {
  const { role } = useRole();
  const canWrite = role === "admin";
  const moduleDef = getAttributeModule(moduleKey);
  const sectionData = INITIAL_ATTRIBUTE_MODULE_DATA[moduleKey];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">{moduleDef.label}</h2>
        <p className="text-sm text-muted-foreground">
          Quản lý danh mục thuộc tính cho module {moduleDef.label.toLowerCase()}.
        </p>
      </div>
      {moduleDef.sections.map((section) => {
        if (section.dataSource === "definitions") {
          return (
            <AttributeDefinitionSection
              key={section.id}
              section={section}
              definitionCategory={section.definitionCategory ?? section.id}
              canWrite={canWrite}
            />
          );
        }
        if (section.dataSource === "contractStatusEnum") {
          return <AttributeEnumSection key={section.id} section={section} rows={CONTRACT_STATUS_REFERENCE_ROWS} />;
        }
        return (
          <AttributeSectionCard key={section.id} section={section} rows={sectionData[section.id] ?? []} />
        );
      })}
    </div>
  );
}
