import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, Shield, Bell, Trash2, Tags, ChevronRight, KeyRound, Sliders, ScrollText, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useRole, type Role } from "@/hooks/use-role";
import { getRolePublicTitle } from "@/lib/role-matrix";
import { PermissionsTab } from "@/components/settings/PermissionsTab";
import { ATTRIBUTE_SETTINGS_BASE_PATH } from "@/lib/attribute-settings-config";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsersList, type UserListItem } from "@/hooks/use-users-api";
import {
  ALL_NOTIFICATION_PREF_KEYS,
  NOTIFICATION_PREF_LABELS,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  type NotificationPrefKey,
} from "@/hooks/use-notification-preferences-api";
import { RolesTab } from "@/components/settings/RolesTab";
import { AuditLogsTab } from "@/components/settings/AuditLogsTab";
import { SystemSettingsTab } from "@/components/settings/SystemSettingsTab";
import { SessionsTab } from "@/components/settings/SessionsTab";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";

const roleBadge = (roleCode: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    admin: { label: "Quản trị", variant: "default" },
    manager: { label: "Quản lý", variant: "secondary" },
    technician: { label: "Kỹ thuật viên", variant: "outline" },
    viewer: { label: "Xem", variant: "outline" },
    sales: { label: "Nhân viên bán hàng", variant: "secondary" },
  };
  const cfg = map[roleCode] || map.viewer;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

function formatLastLogin(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
}

function statusLabel(status: string) {
  if (status === "active") return "Hoạt động";
  if (status === "inactive") return "Ngừng";
  if (status === "suspended") return "Đình chỉ";
  return status;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Quản trị" },
  { value: "manager", label: "Quản lý" },
  { value: "technician", label: "Kỹ thuật viên" },
  { value: "sales", label: "Nhân viên bán hàng" },
  { value: "viewer", label: "Xem" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Ngừng" },
  { value: "suspended", label: "Đình chỉ" },
] as const;

function errMessage(e: unknown) {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof r === "string") return r;
  }
  if (e instanceof Error) return e.message;
  return "Có lỗi xảy ra";
}

function NotificationPrefsPanel({ enabled }: { enabled: boolean }) {
  const { data: prefs = [], isLoading, isError } = useNotificationPreferences(enabled);
  const updatePrefs = useUpdateNotificationPreferences();
  const [local, setLocal] = useState<Partial<Record<NotificationPrefKey, boolean>>>({});

  useEffect(() => {
    if (!prefs.length) return;
    setLocal(Object.fromEntries(prefs.map((p) => [p.key, p.enabled])) as Record<NotificationPrefKey, boolean>);
  }, [prefs]);

  if (!enabled) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <p className="text-sm text-muted-foreground">Đăng nhập để tải và lưu cài đặt thông báo.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <p className="text-sm text-muted-foreground">Đang tải cài đặt…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <p className="text-sm text-destructive">Không tải được cài đặt thông báo từ máy chủ.</p>
      </div>
    );
  }

  const toggle = async (key: NotificationPrefKey, nextEnabled: boolean) => {
    const next = { ...local, [key]: nextEnabled };
    setLocal(next);
    const merged: Array<{ key: NotificationPrefKey; enabled: boolean }> = ALL_NOTIFICATION_PREF_KEYS.map((key) => ({
      key,
      enabled: next[key] ?? true,
    }));
    try {
      await updatePrefs.mutateAsync(merged);
      toast.success("Đã lưu");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50 space-y-4">
      <h3 className="font-semibold text-card-foreground">Cài đặt thông báo</h3>
      {ALL_NOTIFICATION_PREF_KEYS.map((key) => {
        const meta = NOTIFICATION_PREF_LABELS[key];
        return (
          <div key={key} className="flex items-center justify-between rounded-lg bg-secondary/30 p-4 gap-4">
            <div className="min-w-0">
              <p className="font-medium text-card-foreground">{meta.label}</p>
              <p className="text-sm text-muted-foreground">{meta.desc}</p>
            </div>
            <Switch
              checked={local[key] ?? true}
              onCheckedChange={(c) => void toggle(key, c)}
              disabled={updatePrefs.isPending}
            />
          </div>
        );
      })}
    </div>
  );
}

const VALID_TABS = new Set([
  "users",
  "roles",
  "permissions",
  "notifications",
  "system",
  "sessions",
  "audit",
]);

const SettingsPage = () => {
  const { isAuthenticated, isLoading: authLoading, user: authUser } = useAuth();
  const { role } = useRole();
  const canWriteUsers = role === "admin";
  const { data: users = [], isLoading, isError, error, refetch } = useUsersList(!authLoading && isAuthenticated);
  const usersPag = usePaginatedSlice(users);
  const location = useLocation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(location.search);
  const tabParam = urlParams.get("tab");
  const entityParam = urlParams.get("entity");
  const entityIdParam = urlParams.get("entityId");
  const initialTab = tabParam && VALID_TABS.has(tabParam) ? tabParam : "users";
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (tabParam && VALID_TABS.has(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleTabChange = (next: string) => {
    setActiveTab(next);
    const params = new URLSearchParams(location.search);
    if (next === "audit") {
      params.set("tab", "audit");
    } else {
      params.delete("tab");
      params.delete("entity");
      params.delete("entityId");
    }
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" }, { replace: true });
  };

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserListItem | null>(null);
  const [deleteUserRow, setDeleteUserRow] = useState<UserListItem | null>(null);

  const [createForm, setCreateForm] = useState({
    fullName: "",
    email: "",
    password: "",
    roleCode: "viewer" as (typeof ROLE_OPTIONS)[number]["value"],
    status: "active" as (typeof STATUS_OPTIONS)[number]["value"],
  });

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    roleCode: "viewer" as (typeof ROLE_OPTIONS)[number]["value"],
    status: "active" as (typeof STATUS_OPTIONS)[number]["value"],
    password: "",
  });

  const openCreate = () => {
    setCreateForm({ fullName: "", email: "", password: "", roleCode: "viewer", status: "active" });
    setCreateOpen(true);
  };

  const openEdit = (u: UserListItem) => {
    setEditForm({
      fullName: u.fullName,
      email: u.email,
      roleCode: u.role.code as (typeof ROLE_OPTIONS)[number]["value"],
      status: u.status,
      password: "",
    });
    setEditUser(u);
  };

  const submitCreate = async () => {
    try {
      await createUser.mutateAsync({
        fullName: createForm.fullName.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        roleCode: createForm.roleCode,
        status: createForm.status,
      });
      toast.success("Đã tạo người dùng");
      setCreateOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const submitEdit = async () => {
    if (!editUser) return;
    try {
      const payload: {
        fullName: string;
        email: string;
        roleCode: (typeof ROLE_OPTIONS)[number]["value"];
        status: (typeof STATUS_OPTIONS)[number]["value"];
        password?: string;
      } = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        roleCode: editForm.roleCode,
        status: editForm.status,
      };
      if (editForm.password.trim().length > 0) {
        if (editForm.password.trim().length < 8) {
          toast.error("Mật khẩu mới cần ít nhất 8 ký tự");
          return;
        }
        payload.password = editForm.password;
      }
      await updateUser.mutateAsync({ id: editUser.id, payload });
      toast.success("Đã cập nhật người dùng");
      setEditUser(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteUserRow) return;
    try {
      await deleteUser.mutateAsync(deleteUserRow.id);
      toast.success("Đã xóa người dùng");
      setDeleteUserRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to={ATTRIBUTE_SETTINGS_BASE_PATH}
        className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 shadow-sm transition-colors hover:bg-secondary/30"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Tags className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-card-foreground">Thuộc tính</p>
            <p className="text-sm text-muted-foreground">Danh mục thuộc tính theo từng module nghiệp vụ</p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </Link>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Người dùng</TabsTrigger>
          <TabsTrigger value="roles"><KeyRound className="h-4 w-4 mr-1" /> Vai trò</TabsTrigger>
          <TabsTrigger value="permissions"><Shield className="h-4 w-4 mr-1" /> Phân quyền</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1" /> Thông báo</TabsTrigger>
          <TabsTrigger value="system"><Sliders className="h-4 w-4 mr-1" /> Hệ thống</TabsTrigger>
          <TabsTrigger value="sessions"><Smartphone className="h-4 w-4 mr-1" /> Phiên đăng nhập</TabsTrigger>
          {role === "admin" ? (
            <TabsTrigger value="audit"><ScrollText className="h-4 w-4 mr-1" /> Nhật ký</TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="users">
          <div className="rounded-xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-semibold text-card-foreground">Danh sách người dùng</h3>
              {canWriteUsers ? (
                <Button size="sm" onClick={openCreate}>
                  Thêm người dùng
                </Button>
              ) : null}
            </div>
            {isError ? (
              <div className="p-4 text-sm text-destructive flex flex-wrap items-center gap-2">
                <span>{error instanceof Error ? error.message : "Không tải được danh sách."}</span>
                <Button variant="outline" size="sm" onClick={() => void refetch()}>
                  Thử lại
                </Button>
              </div>
            ) : null}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đăng nhập cuối</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Chưa có người dùng hoặc chưa đăng nhập.
                    </TableCell>
                  </TableRow>
                ) : (
                  usersPag.pagedItems.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{roleBadge(u.role.code)}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "active" ? "default" : "outline"}>{statusLabel(u.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatLastLogin(u.lastLoginAt)}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {canWriteUsers ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              disabled={authUser?.id === u.id}
                              onClick={() => setDeleteUserRow(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <PaginatedTableFooter className="px-4 pb-4" {...usersPag.footerProps} disabled={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab enabled={!authLoading && isAuthenticated} canWrite={role === "admin"} />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab enabled={!authLoading && isAuthenticated} canWrite={role === "admin"} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationPrefsPanel enabled={!authLoading && isAuthenticated} />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettingsTab enabled={!authLoading && isAuthenticated} canWrite={role === "admin"} />
        </TabsContent>

        <TabsContent value="sessions">
          <SessionsTab enabled={!authLoading && isAuthenticated} />
        </TabsContent>

        {role === "admin" ? (
          <TabsContent value="audit">
            <AuditLogsTab
              enabled={!authLoading && isAuthenticated}
              initialEntity={entityParam}
              initialEntityId={entityIdParam}
            />
          </TabsContent>
        ) : null}
      </Tabs>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cu-name">Họ tên</Label>
              <Input
                id="cu-name"
                value={createForm.fullName}
                onChange={(e) => setCreateForm((s) => ({ ...s, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-email">Email</Label>
              <Input
                id="cu-email"
                type="email"
                autoComplete="off"
                value={createForm.email}
                onChange={(e) => setCreateForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cu-pass">Mật khẩu (tối thiểu 8 ký tự)</Label>
              <Input
                id="cu-pass"
                type="password"
                autoComplete="new-password"
                value={createForm.password}
                onChange={(e) => setCreateForm((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <Select
                value={createForm.roleCode}
                onValueChange={(v) =>
                  setCreateForm((s) => ({ ...s, roleCode: v as (typeof ROLE_OPTIONS)[number]["value"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={createForm.status}
                onValueChange={(v) =>
                  setCreateForm((s) => ({ ...s, status: v as (typeof STATUS_OPTIONS)[number]["value"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button
              onClick={() => void submitCreate()}
              disabled={
                createUser.isPending
                || !createForm.fullName.trim()
                || !createForm.email.trim()
                || createForm.password.length < 8
              }
            >
              {createUser.isPending ? "Đang lưu…" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editUser)} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa người dùng</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="eu-name">Họ tên</Label>
              <Input
                id="eu-name"
                value={editForm.fullName}
                onChange={(e) => setEditForm((s) => ({ ...s, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eu-email">Email</Label>
              <Input
                id="eu-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((s) => ({ ...s, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eu-pass">Mật khẩu mới (để trống nếu giữ nguyên)</Label>
              <Input
                id="eu-pass"
                type="password"
                autoComplete="new-password"
                value={editForm.password}
                onChange={(e) => setEditForm((s) => ({ ...s, password: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <Select
                value={editForm.roleCode}
                onValueChange={(v) =>
                  setEditForm((s) => ({ ...s, roleCode: v as (typeof ROLE_OPTIONS)[number]["value"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Trạng thái</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) =>
                  setEditForm((s) => ({ ...s, status: v as (typeof STATUS_OPTIONS)[number]["value"] }))
                }
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Hủy</Button>
            <Button
              onClick={() => void submitEdit()}
              disabled={updateUser.isPending || !editForm.fullName.trim() || !editForm.email.trim()}
            >
              {updateUser.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteUserRow)} onOpenChange={(o) => !o && setDeleteUserRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa người dùng?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteUserRow ? `Tài khoản ${deleteUserRow.email} sẽ bị vô hiệu hóa (soft delete).` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsPage;
