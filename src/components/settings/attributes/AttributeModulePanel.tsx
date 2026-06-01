import {
  getAttributeModule,
  getVisibleAttributeSections,
  type AttributeModuleKey,
} from "@/lib/attribute-settings-config";
import { AttributeDefinitionSection } from "@/components/settings/attributes/AttributeDefinitionSection";
import { AttributeContractClauseSection } from "@/components/settings/attributes/AttributeContractClauseSection";
import { AttributeContractClauseGroupSection } from "@/components/settings/attributes/AttributeContractClauseGroupSection";
import { useRole } from "@/hooks/use-role";

type AttributeModulePanelProps = {
  moduleKey: AttributeModuleKey;
};

export function AttributeModulePanel({ moduleKey }: AttributeModulePanelProps) {
  const { role } = useRole();
  const canWrite = role === "admin" || role === "manager";
  const moduleDef = getAttributeModule(moduleKey);
  const sections = getVisibleAttributeSections(moduleDef);

  if (sections.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        Module này không có danh mục tuỳ chỉnh trên màn Thuộc tính. Trạng thái và quy trình do hệ thống tự
        quản lý.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-card-foreground px-1">{moduleDef.label}</h2>
      {sections.map((section) => {
        if (section.dataSource === "contract_clauses") {
          return <AttributeContractClauseSection key={section.id} section={section} canWrite={canWrite} />;
        }
        if (section.dataSource === "contract_clause_groups") {
          return (
            <AttributeContractClauseGroupSection key={section.id} section={section} canWrite={canWrite} />
          );
        }
        return (
          <AttributeDefinitionSection
            key={section.id}
            section={section}
            definitionCategory={section.definitionCategory ?? section.id}
            canWrite={canWrite}
          />
        );
      })}
    </div>
  );
}
