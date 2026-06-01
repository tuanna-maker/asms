import { getAttributeModule, type AttributeModuleKey } from "@/lib/attribute-settings-config";
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

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-card-foreground px-1">{moduleDef.label}</h2>
      {moduleDef.sections.map((section) => {
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
