import { HttpError } from "../../lib/errors/HttpError";
import { prisma } from "../../utils/prisma";
import {
  PERMISSION_MODULES,
  VALID_MODULE_KEYS,
  flattenPermissionModules,
  fullCrud,
  getDefaultCrudForModule,
  type CrudPermission,
} from "../../config/role-permissions-defaults";

export type CrudAction = keyof CrudPermission;

/** Cache in-memory theo roleCode — invalidate khi admin cập nhật matrix. */
const permissionsCache = new Map<string, Record<string, CrudPermission>>();

export function invalidateRolePermissionsCache(roleCode?: string) {
  if (roleCode) {
    permissionsCache.delete(roleCode);
  } else {
    permissionsCache.clear();
  }
}

async function loadPermissionsForRole(roleCode: string): Promise<Record<string, CrudPermission>> {
  const cached = permissionsCache.get(roleCode);
  if (cached) return cached;

  await ensureRolePermissionsSeeded();
  const flat = flattenPermissionModules();
  const role = await prisma.role.findFirst({
    where: { code: roleCode, deletedAt: null, isActive: true },
    select: {
      permissions: { select: SELECT_CRUD },
    },
  });

  const map: Record<string, CrudPermission> = {};
  for (const mod of flat) {
    if (roleCode === "admin") {
      map[mod.key] = fullCrud();
      continue;
    }
    const row = role?.permissions.find((p) => p.moduleKey === mod.key);
    map[mod.key] = row ? rowToCrud(row) : getDefaultCrudForModule(roleCode, mod.key);
  }

  permissionsCache.set(roleCode, map);
  return map;
}

function resolveCrudForModule(
  permissions: Record<string, CrudPermission>,
  roleCode: string,
  moduleKey: string,
): CrudPermission {
  if (permissions[moduleKey]) return permissions[moduleKey];
  return getDefaultCrudForModule(roleCode, moduleKey);
}

const SELECT_CRUD = {
  moduleKey: true,
  canRead: true,
  canCreate: true,
  canUpdate: true,
  canDelete: true,
} as const;

function rowToCrud(row: {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}): CrudPermission {
  return {
    read: row.canRead,
    create: row.canCreate,
    update: row.canUpdate,
    delete: row.canDelete,
  };
}

function crudToDb(crud: CrudPermission) {
  return {
    canRead: crud.read,
    canCreate: crud.create,
    canUpdate: crud.update,
    canDelete: crud.delete,
  };
}

/** Admin luôn có toàn quyền — đồng bộ DB sau seed/cập nhật. */
export async function syncAdminFullPermissions() {
  const adminRole = await prisma.role.findFirst({
    where: { code: "admin", deletedAt: null },
    select: { id: true },
  });
  if (!adminRole) return;

  const flat = flattenPermissionModules();
  const crud = fullCrud();
  for (const mod of flat) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_moduleKey: { roleId: adminRole.id, moduleKey: mod.key },
      },
      create: {
        roleId: adminRole.id,
        moduleKey: mod.key,
        ...crudToDb(crud),
      },
      update: crudToDb(crud),
    });
  }
}

export async function ensureRolePermissionsSeeded() {
  const roles = await prisma.role.findMany({
    where: { deletedAt: null },
    select: { id: true, code: true },
  });

  const flat = flattenPermissionModules();
  const existingCount = await prisma.rolePermission.count();

  if (existingCount === 0) {
    const rows: Array<{
      roleId: string;
      moduleKey: string;
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
    }> = [];
    for (const role of roles) {
      for (const mod of flat) {
        const crud = getDefaultCrudForModule(role.code, mod.key);
        rows.push({
          roleId: role.id,
          moduleKey: mod.key,
          ...crudToDb(crud),
        });
      }
    }
    if (rows.length > 0) {
      await prisma.rolePermission.createMany({ data: rows, skipDuplicates: true });
    }
    await syncAdminFullPermissions();
    return;
  }

  for (const role of roles) {
    for (const mod of flat) {
      const existing = await prisma.rolePermission.findUnique({
        where: { roleId_moduleKey: { roleId: role.id, moduleKey: mod.key } },
      });
      if (!existing) {
        const crud = getDefaultCrudForModule(role.code, mod.key);
        await prisma.rolePermission.create({
          data: { roleId: role.id, moduleKey: mod.key, ...crudToDb(crud) },
        });
      }
    }
  }

  await syncAdminFullPermissions();
}

export async function listRolePermissionsService() {
  await ensureRolePermissionsSeeded();

  const flat = flattenPermissionModules();
  const roles = await prisma.role.findMany({
    where: { deletedAt: null, isActive: true },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      permissions: { select: SELECT_CRUD },
    },
  });

  return {
    modules: PERMISSION_MODULES,
    roles: roles.map((r) => ({
      code: r.code,
      name: r.name,
      permissions: Object.fromEntries(
        flat.map((m) => {
          if (r.code === "admin") return [m.key, fullCrud()];
          const row = r.permissions.find((p) => p.moduleKey === m.key);
          return [
            m.key,
            row ? rowToCrud(row) : getDefaultCrudForModule(r.code, m.key),
          ];
        }),
      ),
    })),
  };
}

export async function updateRolePermissionsService(
  items: Array<{
    roleCode: string;
    moduleKey: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  }>,
) {
  const itemsToApply = items.filter((item) => item.roleCode !== "admin");

  for (const item of itemsToApply) {
    if (!VALID_MODULE_KEYS.has(item.moduleKey)) {
      throw new HttpError(400, `Module không hợp lệ: ${item.moduleKey}`);
    }
    const role = await prisma.role.findFirst({
      where: { code: item.roleCode, deletedAt: null },
      select: { id: true },
    });
    if (!role) throw new HttpError(404, `Không tìm thấy vai trò: ${item.roleCode}`);

    await prisma.rolePermission.upsert({
      where: {
        roleId_moduleKey: { roleId: role.id, moduleKey: item.moduleKey },
      },
      create: {
        roleId: role.id,
        moduleKey: item.moduleKey,
        canRead: item.canRead,
        canCreate: item.canCreate,
        canUpdate: item.canUpdate,
        canDelete: item.canDelete,
      },
      update: {
        canRead: item.canRead,
        canCreate: item.canCreate,
        canUpdate: item.canUpdate,
        canDelete: item.canDelete,
      },
    });
  }

  invalidateRolePermissionsCache();
  await syncAdminFullPermissions();
  return listRolePermissionsService();
}

/** Kiểm tra roleCode có quyền thực hiện action trên moduleKey không. */
export async function roleCanPerformAction(
  roleCode: string,
  moduleKey: string,
  action: CrudAction,
): Promise<boolean> {
  if (roleCode === "admin") return true;

  const role = await prisma.role.findFirst({
    where: { code: roleCode, deletedAt: null, isActive: true },
    select: { id: true },
  });
  if (!role) return false;

  const permissions = await loadPermissionsForRole(roleCode);
  const crud = resolveCrudForModule(permissions, roleCode, moduleKey);
  return crud[action];
}

/** Kiểm tra roleCode có quyền đọc moduleKey không. */
export async function roleCanAccessModule(roleCode: string, moduleKey: string): Promise<boolean> {
  return roleCanPerformAction(roleCode, moduleKey, "read");
}
