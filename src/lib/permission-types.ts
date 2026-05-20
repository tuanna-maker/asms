export type CrudPermission = {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type PermissionModuleChild = { key: string; label: string };

export type PermissionModuleNode = {
  key: string;
  label: string;
  children?: PermissionModuleChild[];
};

export type PermissionRow = {
  key: string;
  label: string;
  parentKey?: string;
  isChild: boolean;
};

export function flattenPermissionTree(
  modules: PermissionModuleNode[],
): PermissionRow[] {
  const rows: PermissionRow[] = [];
  for (const mod of modules) {
    rows.push({ key: mod.key, label: mod.label, isChild: false });
    if (mod.children) {
      for (const child of mod.children) {
        rows.push({
          key: child.key,
          label: child.label,
          parentKey: mod.key,
          isChild: true,
        });
      }
    }
  }
  return rows;
}

export function getChildKeys(
  modules: PermissionModuleNode[],
  parentKey: string,
): string[] {
  const parent = modules.find((m) => m.key === parentKey);
  return parent?.children?.map((c) => c.key) ?? [];
}
