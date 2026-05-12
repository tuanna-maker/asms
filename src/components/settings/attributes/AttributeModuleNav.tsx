import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ATTRIBUTE_MODULES, attributeModulePath, type AttributeModuleKey } from "@/lib/attribute-settings-config";

type AttributeModuleNavProps = {
  activeKey: AttributeModuleKey;
};

export function AttributeModuleNav({ activeKey }: AttributeModuleNavProps) {
  return (
    <nav className="rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="border-b border-border/50 px-4 py-3">
        <p className="text-sm font-semibold text-card-foreground">Thuộc tính theo module</p>
        <p className="text-xs text-muted-foreground">Chọn nhóm tương ứng menu chính</p>
      </div>
      <ul className="max-h-[min(70vh,560px)] overflow-y-auto p-2">
        {ATTRIBUTE_MODULES.map((mod) => (
          <li key={mod.key}>
            <NavLink
              to={attributeModulePath(mod.key)}
              className={({ isActive }) =>
                cn(
                  "block rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive || mod.key === activeKey
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              {mod.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
