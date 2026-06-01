import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRole,
  useDeleteRole,
  useRolesList,
  useUpdateRole,
  type RoleItem,
} from "@/hooks/use-roles-api";

function errMessage(e: unknown) {
  return getApiErrorMessage(e, "Có lỗi xảy ra");
}

type Props = {
  enabled: boolean;
  canWrite: boolean;
};

export function RolesTab({ enabled, canWrite }: Props) {
  const { data: roles = [], isLoading, isError, error, refetch } = useRolesList(enabled);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleItem | null>(null);
  const [deleteRoleRow, setDeleteRoleRow] = useState<RoleItem | null>(null);

  const blankForm = { code: "", name: "", description: "", isActive: true } as const;
  const [createForm, setCreateForm] = useState({ ...blankForm });
  const [editForm, setEditForm] = useState({ ...blankForm });

  useEffect(() => {
    if (!editRole) return;
    setEditForm({
      code: editRole.code,
      name: editRole.name,
      description: editRole.description ?? "",
      isActive: editRole.isActive,
    });
  }, [editRole]);

  const openCreate = () => {
    setCreateForm({ ...blankForm });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!createForm.code.trim() || !createForm.name.trim()) {
      toast.error("Cần nhập mã và tên vai trò");
      return;
    }
    try {
      await createRole.mutateAsync({
        code: createForm.code.trim(),
        name: createForm.name.trim(),
        description: createForm.description.trim() || null,
        isActive: createForm.isActive,
      });
      toast.success("Đã tạo vai trò");
      setCreateOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const submitEdit = async () => {
    if (!editRole) return;
    try {
      await updateRole.mutateAsync({
        id: editRole.id,
        payload: {
          code: editRole.isSystem ? undefined : editForm.code.trim(),
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          isActive: editRole.isSystem ? true : editForm.isActive,
        },
      });
      toast.success("Đã cập nhật vai trò");
      setEditRole(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteRoleRow) return;
    try {
      await deleteRole.mutateAsync(deleteRoleRow.id);
      toast.success("Đã xoá vai trò");
      setDeleteRoleRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div>
          <h3 className="font-semibold text-card-foreground">Vai trò</h3>
          <p className="text-xs text-muted-foreground">
            Vai trò hệ thống (admin, manager, …) chỉ đổi được tên & mô tả; có thể tạo vai trò tuỳ biến để gán cho người dùng.
          </p>
        </div>
        {canWrite ? (
          <Button size="sm" onClick={openCreate}>Thêm vai trò</Button>
        ) : null}
      </div>
      {isError ? (
        <div className="p-4 text-sm text-destructive flex flex-wrap items-center gap-2">
          <span>{error instanceof Error ? error.message : "Không tải được danh sách vai trò."}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>Thử lại</Button>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên hiển thị</TableHead>
            <TableHead>Mô tả</TableHead>
            <TableHead>Người dùng</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Đang tải…</TableCell>
            </TableRow>
          ) : roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có vai trò.</TableCell>
            </TableRow>
          ) : (
            roles.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.description ?? "—"}</TableCell>
                <TableCell>{r.userCount}</TableCell>
                <TableCell>
                  <Badge variant={r.isActive ? "default" : "outline"}>
                    {r.isActive ? "Hoạt động" : "Ngừng"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {r.isSystem ? <Badge variant="secondary">Hệ thống</Badge> : <Badge variant="outline">Tuỳ biến</Badge>}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {canWrite ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setEditRole(r)}>Sửa</Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={r.isSystem || r.userCount > 0}
                        onClick={() => setDeleteRoleRow(r)}
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm vai trò</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Mã *</Label>
              <Input
                value={createForm.code}
                onChange={(e) => setCreateForm((s) => ({ ...s, code: e.target.value }))}
                placeholder="vd. operations"
              />
            </div>
            <div className="space-y-1">
              <Label>Tên hiển thị *</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <div>
                <p className="text-sm font-medium">Hoạt động</p>
                <p className="text-xs text-muted-foreground">Tắt để không cho gán mới.</p>
              </div>
              <Switch
                checked={createForm.isActive}
                onCheckedChange={(v) => setCreateForm((s) => ({ ...s, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Hủy</Button>
            <Button onClick={() => void submitCreate()} disabled={createRole.isPending}>
              {createRole.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editRole} onOpenChange={(o) => (o ? null : setEditRole(null))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sửa vai trò</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Mã</Label>
              <Input
                value={editForm.code}
                onChange={(e) => setEditForm((s) => ({ ...s, code: e.target.value }))}
                disabled={!!editRole?.isSystem}
              />
              {editRole?.isSystem ? (
                <p className="text-xs text-muted-foreground">Vai trò hệ thống không thể đổi mã.</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label>Tên hiển thị *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Mô tả</Label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
              <div>
                <p className="text-sm font-medium">Hoạt động</p>
                <p className="text-xs text-muted-foreground">
                  {editRole?.isSystem ? "Vai trò hệ thống luôn hoạt động." : "Tắt để không cho gán mới."}
                </p>
              </div>
              <Switch
                checked={editRole?.isSystem ? true : editForm.isActive}
                onCheckedChange={(v) => setEditForm((s) => ({ ...s, isActive: v }))}
                disabled={!!editRole?.isSystem}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRole(null)}>Hủy</Button>
            <Button onClick={() => void submitEdit()} disabled={updateRole.isPending}>
              {updateRole.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRoleRow} onOpenChange={(o) => (o ? null : setDeleteRoleRow(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá vai trò?</AlertDialogTitle>
            <AlertDialogDescription>
              Vai trò «{deleteRoleRow?.name}» sẽ bị xoá. Hành động không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Xoá</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
