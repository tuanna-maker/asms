import { getAttributeModule, type AttributeModuleKey } from "@/lib/attribute-settings-config";
import { AttributeDefinitionSection } from "@/components/settings/attributes/AttributeDefinitionSection";
import { useRole } from "@/hooks/use-role";

type AttributeModulePanelProps = {
  moduleKey: AttributeModuleKey;
};

export function AttributeModulePanel({ moduleKey }: AttributeModulePanelProps) {
  const { role } = useRole();
  const canWrite = role === "admin" || role === "manager";
  const moduleDef = getAttributeModule(moduleKey);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm">
        <h2 className="text-lg font-semibold text-card-foreground">{moduleDef.label}</h2>
        <p className="text-sm text-muted-foreground">
          Quản lý danh mục thuộc tính cho module {moduleDef.label.toLowerCase()}.
        </p>
      </div>
      {moduleDef.sections.map((section) => (
        <AttributeDefinitionSection
          key={section.id}
          section={section}
          definitionCategory={section.definitionCategory ?? section.id}
          canWrite={canWrite}
        />
      ))}
    </div>
  );
}
