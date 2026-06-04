import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useCanWriteModule } from "@/hooks/use-module-permissions";
import {
  useCreateWorkflow,
  useDeleteWorkflow,
  useWorkflowsList,
  type CreateWorkflowPayload,
  type WorkflowListItem,
  type WorkflowModuleKey,
} from "@/hooks/use-workflows-api";
import { useListPagination } from "@/hooks/use-list-pagination";
import ListPaginationBar from "@/components/ui/ListPaginationBar";
import { isWorkflowModuleHidden } from "@/lib/workflow-visibility";

const MODULE_LABEL: Record<WorkflowModuleKey, string> = {
  handover: "Bàn giao",
  warranty: "Bảo hành",
  training: "Đào tạo",
  coaching: "Huấn luyện",
  contract: "Hợp đồng (tổng hợp)",
  product: "Sản phẩm",
};

function isValidModule(key: string | undefined): key is WorkflowModuleKey {
  return (
    key === "handover" ||
    key === "warranty" ||
    key === "training" ||
    key === "coaching" ||
    key === "contract" ||
    key === "product"
  );
}

function errMessage(e: unknown) {
  return getApiErrorMessage(e, "Có lỗi xảy ra");
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

const WorkflowListPage = () => {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const navigate = useNavigate();
  const canWrite = useCanWriteModule("quy-trinh");

  const validKey =
    isValidModule(moduleKey) && !isWorkflowModuleHidden(moduleKey) ? moduleKey : null;
  const { data: workflows = [], isLoading } = useWorkflowsList(validKey ?? undefined, {
    enabled: Boolean(validKey),
  });
  const createWf = useCreateWorkflow();
  const deleteWf = useDeleteWorkflow();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<WorkflowListItem | null>(null);
  const [form, setForm] = useState({ name: "", description: "", isActive: true });

  const rows = useMemo(() => workflows, [workflows]);

  const {
    pagedItems: pagedRows,
    page: wfPage,
    setPage: setWfPage,
    totalPages: wfTotalPages,
    total: wfTotal,
    pageSize: wfPageSize,
    startIndex: wfStartIndex,
  } = useListPagination(rows);

  if (!validKey) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        Nhóm quy trình không hợp lệ.{" "}
        <Link to="/quy-trinh" className="text-primary underline-offset-4 hover:underline">
          Quay lại
        </Link>
      </div>
    );
  }

  const openCreate = () => {
    setForm({ name: "", description: "", isActive: true });
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Tên quy trình là bắt buộc");
      return;
    }
    try {
      const payload: CreateWorkflowPayload = {
        name,
        moduleKey: validKey,
        isActive: form.isActive,
      };
      const description = form.description.trim();
      if (description) payload.description = description;
      const res = await createWf.mutateAsync(payload);
      toast.success("Đã tạo quy trình");
      setCreateOpen(false);
      const created = res.data.data;
      if (created?.id) {
        navigate(`/quy-trinh/${validKey}/${created.id}`);
      }
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteWf.mutateAsync(deleteRow.id);
      toast.success("Đã xoá quy trình");
      setDeleteRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/quy-trinh">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Tất cả nhóm
          </Link>
        </Button>
        {canWrite ? (
          <Button onClick={openCreate} disabled={createWf.isPending}>
            <Plus className="mr-1 h-4 w-4" />
            Thêm quy trình
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-border/50 bg-card shadow-sm">
        <div className="border-b border-border/50 p-4">
          <h2 className="text-lg font-semibold text-card-foreground">Quy trình — {MODULE_LABEL[validKey]}</h2>
          <p className="text-sm text-muted-foreground">
            Danh sách quy trình được áp dụng cho module {MODULE_LABEL[validKey].toLowerCase()}.
            {validKey === "training"
              ? " Chuẩn 3 bước: Lên kế hoạch khoá đào tạo → Phê duyệt nội dung → Tổng kết và đóng khoá."
              : validKey === "product"
                ? " Chuẩn 3 bước: Đang sản xuất → Nghiệm thu cấp Bộ → Đưa vào trang bị."
                : null}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">STT</TableHead>
              <TableHead className="w-40">Mã</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead className="w-20 text-center">Bước</TableHead>
              <TableHead className="w-32">Trạng thái</TableHead>
              <TableHead className="w-40">Cập nhật</TableHead>
              <TableHead className="w-40 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có quy trình nào.
                </TableCell>
              </TableRow>
            ) : (
              pagedRows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{wfStartIndex + index + 1}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/quy-trinh/${validKey}/${row.id}`}
                        className="hover:text-primary hover:underline"
                      >
                        {row.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{row.stepCount}</TableCell>
                  <TableCell>
                    {row.isActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">Hoạt động</Badge>
                    ) : (
                      <Badge variant="secondary">Ngừng</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon" aria-label="Lịch sử">
                        <Link to={`/cai-dat?tab=audit&entity=workflow&entityId=${row.id}`}>
                          <History className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon" aria-label="Sửa">
                        <Link to={`/quy-trinh/${validKey}/${row.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      {canWrite ? (
                        <Button variant="ghost" size="icon" aria-label="Xoá" onClick={() => setDeleteRow(row)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ListPaginationBar
          className="px-4 pb-4"
          page={wfPage}
          totalPages={wfTotalPages}
          totalItems={wfTotal}
          pageSize={wfPageSize}
          onPageChange={setWfPage}
          disabled={isLoading}
        />
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm quy trình — {MODULE_LABEL[validKey]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="wf-name">Tên quy trình</Label>
              <Input id="wf-name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground">Mã quy trình sẽ được hệ thống tự sinh sau khi tạo.</p>
            <div className="space-y-1.5">
              <Label htmlFor="wf-desc">Mô tả</Label>
              <Textarea
                id="wf-desc"
                value={form.description}
                onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <Label htmlFor="wf-active">Hoạt động</Label>
              <Switch
                id="wf-active"
                checked={form.isActive}
                onCheckedChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void submitCreate()} disabled={createWf.isPending}>
              {createWf.isPending ? "Đang lưu…" : "Tạo và mở"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteRow)} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá quy trình?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow
                ? `Quy trình «${deleteRow.name}» (${deleteRow.code}) sẽ bị xoá.`
                : ""}
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
              disabled={deleteWf.isPending}
            >
              {deleteWf.isPending ? "Đang xoá…" : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkflowListPage;
