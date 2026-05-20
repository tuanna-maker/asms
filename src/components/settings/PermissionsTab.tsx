import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { PERMISSION_MODULE_DEFS } from "@/lib/route-module-map";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useRolePermissions,
  useUpdateRolePermissions,
  crudToUpdateItem,
  type RolePermissionsMatrix,
} from "@/hooks/use-role-permissions-api";
import { getRolePublicTitle, SETTINGS_ROLE_ORDER } from "@/lib/role-matrix";
import type { Role } from "@/hooks/use-role";
import type { CrudPermission, PermissionModuleNode } from "@/lib/permission-types";
import {
  flattenPermissionTree,
  getChildKeys,
} from "@/lib/permission-types";

type Props = {
  enabled?: boolean;
  canWrite?: boolean;
};

type CrudAction = keyof CrudPermission;

const CRUD_COLUMNS: Array<{ action: CrudAction; label: string }> = [
  { action: "read", label: "Xem" },
  { action: "create", label: "Tạo" },
  { action: "update", label: "Sửa" },
  { action: "delete", label: "Xóa" },
];

function sortRolesBySettingsOrder(
  roles: RolePermissionsMatrix["roles"],
): RolePermissionsMatrix["roles"] {
  const order = new Map(SETTINGS_ROLE_ORDER.map((code, i) => [code, i]));
  return [...roles].sort((a, b) => {
    const ia = order.get(a.code as Role) ?? 999;
    const ib = order.get(b.code as Role) ?? 999;
    return ia - ib;
  });
}

function allowedParentLabels(
  role: RolePermissionsMatrix["roles"][number],
  modules: PermissionModuleNode[],
): string[] {
  return modules
    .filter((m) => role.permissions[m.key]?.read)
    .map((m) => m.label);
}

function crudEqual(a: CrudPermission, b: CrudPermission): boolean {
  return a.read === b.read && a.create === b.create && a.update === b.update && a.delete === b.delete;
}

/** Gộp cây module từ API với định nghĩa FE (đảm bảo có children/tab con). */
function mergeModuleTree(apiModules: PermissionModuleNode[]): PermissionModuleNode[] {
  return apiModules.map((mod) => {
    const def = PERMISSION_MODULE_DEFS.find((d) => d.key === mod.key);
    const children = mod.children?.length ? mod.children : def?.children;
    return children?.length ? { ...mod, children: [...children] } : mod;
  });
}

export function PermissionsTab({ enabled = true, canWrite = false }: Props) {
  const { data, isLoading } = useRolePermissions(enabled);
  const updateMut = useUpdateRolePermissions();

  const [detailRoleCode, setDetailRoleCode] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState<Record<string, CrudPermission> | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const prevDetailRoleCodeRef = useRef<string | null>(null);

  const matrix = data ?? null;
  const roles = useMemo(
    () => (matrix ? sortRolesBySettingsOrder(matrix.roles) : []),
    [matrix],
  );
  const modules = useMemo(
    () => mergeModuleTree(matrix?.modules ?? []),
    [matrix?.modules],
  );
  const flatRows = useMemo(() => flattenPermissionTree(modules), [modules]);

  const detailRole = detailRoleCode
    ? roles.find((r) => r.code === detailRoleCode)
    : null;

  useEffect(() => {
    if (!detailRoleCode) {
      setDetailDraft(null);
      setExpandedKeys({});
      prevDetailRoleCodeRef.current = null;
      return;
    }
    const role = roles.find((r) => r.code === detailRoleCode);
    if (role) {
      setDetailDraft(structuredClone(role.permissions) as Record<string, CrudPermission>);
    }
    if (prevDetailRoleCodeRef.current !== detailRoleCode) {
      setExpandedKeys({});
      prevDetailRoleCodeRef.current = detailRoleCode;
    }
  }, [detailRoleCode, roles]);

  const visibleRows = useMemo(
    () =>
      flatRows.filter(
        (row) => !row.isChild || (row.parentKey != null && expandedKeys[row.parentKey]),
      ),
    [flatRows, expandedKeys],
  );

  const toggleExpand = (parentKey: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [parentKey]: !prev[parentKey],
    }));
  };

  const detailDirty = useMemo(() => {
    if (!detailRole || !detailDraft) return false;
    return flatRows.some((row) => {
      const orig = detailRole.permissions[row.key];
      const draft = detailDraft[row.key];
      if (!orig || !draft) return false;
      return !crudEqual(orig, draft);
    });
  }, [detailRole, detailDraft, flatRows]);

  const openDetail = (roleCode: string) => {
    setExpandedKeys({});
    prevDetailRoleCodeRef.current = null;
    setDetailRoleCode(roleCode);
  };
  const closeDetail = () => {
    setDetailRoleCode(null);
    setExpandedKeys({});
    prevDetailRoleCodeRef.current = null;
  };

  const setCrud = (moduleKey: string, action: CrudAction, checked: boolean) => {
    setDetailDraft((prev) => {
      if (!prev) return prev;
      const current = prev[moduleKey] ?? {
        read: false,
        create: false,
        update: false,
        delete: false,
      };
      return {
        ...prev,
        [moduleKey]: { ...current, [action]: checked },
      };
    });
  };

  const toggleParentAction = (parentKey: string, action: CrudAction, checked: boolean) => {
    const childKeys = getChildKeys(modules, parentKey);
    setDetailDraft((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      const parentCrud = { ...(next[parentKey] ?? { read: false, create: false, update: false, delete: false }), [action]: checked };
      next[parentKey] = parentCrud;
      for (const ck of childKeys) {
        const childCrud = { ...(next[ck] ?? { read: false, create: false, update: false, delete: false }), [action]: checked };
        next[ck] = childCrud;
      }
      return next;
    });
  };

  const onSaveDetail = async () => {
    if (!detailRoleCode || !detailDraft) return;
    const items = flatRows.map((row) =>
      crudToUpdateItem(detailRoleCode, row.key, detailDraft[row.key] ?? {
        read: false,
        create: false,
        update: false,
        delete: false,
      }),
    );
    try {
      await updateMut.mutateAsync(items);
      toast.success("Đã lưu phân quyền");
      closeDetail();
    } catch {
      toast.error("Không lưu được phân quyền");
    }
  };

  if (isLoading || !matrix) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Đang tải phân quyền…
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50 space-y-4">
        <div className="space-y-1">
          <h3 className="font-semibold text-card-foreground">Phân quyền theo vai trò</h3>
          <p className="text-sm text-muted-foreground">
            Ma trận quyền truy cập theo vai trò, khớp với menu chính. Để gán vai trò cho từng người, dùng tab{" "}
            <span className="font-medium text-foreground">Người dùng</span> →{" "}
            <span className="font-medium text-foreground">Sửa</span>.
            {canWrite ? (
              <>
                {" "}
                Nhấn <span className="font-medium text-foreground">Xem chi tiết</span> để chỉnh Xem / Tạo / Sửa / Xóa
                từng màn và màn con.
              </>
            ) : null}
          </p>
        </div>

        {roles.map((r) => {
          const labels = allowedParentLabels(r, modules);
          return (
            <div key={r.code} className="rounded-lg bg-secondary/30 p-4">
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <span className="font-medium text-card-foreground">
                  {getRolePublicTitle(r.code as Role) || r.name}
                </span>
                <Button variant="outline" size="sm" type="button" onClick={() => openDetail(r.code)}>
                  Xem chi tiết
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {labels.length > 0 ? (
                  labels.map((label) => (
                    <Badge key={label} variant="outline">
                      {label}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">Chưa có quyền truy cập màn hình nào</span>
                )}
              </div>
            </div>
          );
        })}

        <p className="text-xs text-muted-foreground pt-1">
          Quản trị và Quản lý được chỉnh sửa danh mục Thuộc tính; chỉ Quản trị quản lý người dùng và phân quyền.
        </p>
      </div>

      <Dialog open={detailRoleCode !== null} onOpenChange={(o) => !o && closeDetail()}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Quyền truy cập —{" "}
              {detailRole
                ? getRolePublicTitle(detailRole.code as Role) || detailRole.name
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-x-auto overflow-y-auto pr-1 -mr-1 min-h-0 flex-1">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Mục / trang</TableHead>
                  {CRUD_COLUMNS.map((col) => (
                    <TableHead key={col.action} className="text-center w-16 text-xs">
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map((row) => {
                  const crud = detailDraft?.[row.key] ?? {
                    read: false,
                    create: false,
                    update: false,
                    delete: false,
                  };
                  const childCount = !row.isChild ? getChildKeys(modules, row.key).length : 0;
                  const isExpandableParent = !row.isChild && childCount > 0;
                  const isExpanded = isExpandableParent && Boolean(expandedKeys[row.key]);
                  return (
                    <TableRow
                      key={row.key}
                      className={cn(
                        row.isChild ? "bg-muted/20" : undefined,
                        isExpandableParent && "cursor-pointer hover:bg-muted/40",
                      )}
                      onClick={
                        isExpandableParent
                          ? () => toggleExpand(row.key)
                          : undefined
                      }
                    >
                      <TableCell
                        className={
                          row.isChild
                            ? "font-normal text-muted-foreground pl-10"
                            : "font-medium"
                        }
                      >
                        {isExpandableParent ? (
                          <div
                            className="flex items-center gap-1.5 text-left w-full select-none"
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span>{row.label}</span>
                            <span className="text-xs text-muted-foreground font-normal">
                              ({childCount})
                            </span>
                          </div>
                        ) : row.isChild ? (
                          <span className="pl-6">↳ {row.label}</span>
                        ) : (
                          row.label
                        )}
                      </TableCell>
                      {CRUD_COLUMNS.map((col) => (
                        <TableCell
                          key={col.action}
                          className="text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canWrite ? (
                            <Switch
                              checked={crud[col.action]}
                              onCheckedChange={(v) => {
                                if (!row.isChild && row.parentKey === undefined) {
                                  const hasChildren = getChildKeys(modules, row.key).length > 0;
                                  if (hasChildren) {
                                    toggleParentAction(row.key, col.action, v);
                                  } else {
                                    setCrud(row.key, col.action, v);
                                  }
                                } else {
                                  setCrud(row.key, col.action, v);
                                }
                              }}
                              aria-label={`${row.label} — ${col.label}`}
                            />
                          ) : (
                            <Badge
                              variant={crud[col.action] ? "default" : "secondary"}
                              className="text-[10px] px-1.5"
                            >
                              {crud[col.action] ? "Có" : "—"}
                            </Badge>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-muted-foreground shrink-0">
            {canWrite
              ? "Nhấn tên màn để xổ ra/thu gọn tab con. Bật/tắt quyền màn cha áp dụng cho tất cả tab con; có thể chỉnh riêng từng tab sau đó."
              : "Chỉ quản trị viên được chỉnh sửa phân quyền."}
          </p>
          <DialogFooter className="shrink-0 sm:justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeDetail}>
              {canWrite ? "Hủy" : "Đóng"}
            </Button>
            {canWrite ? (
              <Button
                type="button"
                onClick={() => void onSaveDetail()}
                disabled={!detailDirty || updateMut.isPending}
              >
                {updateMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Lưu
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
