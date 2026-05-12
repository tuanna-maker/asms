import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AttributeSectionDef } from "@/lib/attribute-settings-config";
import { cn } from "@/lib/utils";
import { mapDefinitionToAttributeRow } from "@/lib/attribute-definition-map";
import {
  useCreateDefinition,
  useDefinitionsList,
  useDeleteDefinition,
  useUpdateDefinition,
  type DefinitionItem,
} from "@/hooks/use-definitions-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN");
}

function errMessage(e: unknown) {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof r === "string") return r;
  }
  if (e instanceof Error) return e.message;
  return "Có lỗi xảy ra";
}

type AttributeDefinitionSectionProps = {
  section: AttributeSectionDef;
  definitionCategory: string;
  canWrite: boolean;
};

export function AttributeDefinitionSection({ section, definitionCategory, canWrite }: AttributeDefinitionSectionProps) {
  const { data: definitions = [], isLoading, isError, error, refetch } = useDefinitionsList(definitionCategory, {
    includeInactive: true,
  });
  const createDef = useCreateDefinition();
  const updateDef = useUpdateDefinition();
  const deleteDef = useDeleteDefinition();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<DefinitionItem | null>(null);
  const [deleteRow, setDeleteRow] = useState<DefinitionItem | null>(null);
  const [createForm, setCreateForm] = useState({ code: "", label: "", sortOrder: 0, isActive: true });
  const [editForm, setEditForm] = useState({ code: "", label: "", sortOrder: 0, isActive: true });

  const rows = useMemo(() => definitions.map(mapDefinitionToAttributeRow), [definitions]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.createdBy.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const Icon = section.icon;

  const openCreate = () => {
    setCreateForm({
      code: "",
      label: "",
      sortOrder: definitions.length ? Math.max(...definitions.map((r) => r.sortOrder)) + 10 : 0,
      isActive: true,
    });
    setCreateOpen(true);
  };

  const openEdit = (item: DefinitionItem) => {
    setEditForm({
      code: item.code,
      label: item.label,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setEditRow(item);
  };

  const submitCreate = async () => {
    const code = createForm.code.trim();
    const label = createForm.label.trim();
    if (!code || !label) {
      toast.error("Mã và tên hiển thị là bắt buộc.");
      return;
    }
    try {
      await createDef.mutateAsync({
        category: definitionCategory,
        code,
        label,
        sortOrder: Number.isFinite(createForm.sortOrder) ? createForm.sortOrder : 0,
        isActive: createForm.isActive,
      });
      toast.success("Đã thêm mục");
      setCreateOpen(false);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const submitEdit = async () => {
    if (!editRow) return;
    const code = editForm.code.trim();
    const label = editForm.label.trim();
    if (!code || !label) {
      toast.error("Mã và tên hiển thị là bắt buộc.");
      return;
    }
    try {
      await updateDef.mutateAsync({
        id: editRow.id,
        payload: {
          code,
          label,
          sortOrder: Number.isFinite(editForm.sortOrder) ? editForm.sortOrder : 0,
          isActive: editForm.isActive,
        },
      });
      toast.success("Đã cập nhật");
      setEditRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteRow) return;
    try {
      await deleteDef.mutateAsync(deleteRow.id);
      toast.success("Đã xóa mục");
      setDeleteRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  return (
    <section className="rounded-xl border border-border/50 bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border/50 p-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", section.iconClassName)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-card-foreground">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Vui lòng nhập"
            className="sm:w-52"
          />
          {canWrite ? (
            <Button onClick={openCreate} disabled={createDef.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Thêm mới
            </Button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 text-sm text-destructive">
          <span>{error instanceof Error ? error.message : "Không tải được danh sách."}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">STT</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Người tạo</TableHead>
            <TableHead>Trạng thái</TableHead>
            {canWrite ? <TableHead className="w-24 text-right">Thao tác</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={canWrite ? 6 : 5} className="py-8 text-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline h-5 w-5 animate-spin align-middle" />
                Đang tải…
              </TableCell>
            </TableRow>
          ) : pageRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canWrite ? 6 : 5} className="py-8 text-center text-sm text-muted-foreground">
                Không có dữ liệu phù hợp.
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell>{formatDate(row.createdAt)}</TableCell>
                <TableCell>{row.createdBy}</TableCell>
                <TableCell>
                  {row.status === "active" ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">Hoạt động</Badge>
                  ) : (
                    <Badge variant="secondary">Ngừng</Badge>
                  )}
                </TableCell>
                {canWrite ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Sửa"
                        onClick={() => {
                          const item = definitions.find((d) => d.id === row.id);
                          if (item) openEdit(item);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Xóa"
                        onClick={() => {
                          const item = definitions.find((d) => d.id === row.id);
                          if (item) setDeleteRow(item);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex flex-col gap-3 border-t border-border/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Tổng {total} mục</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Hiển thị</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value) as (typeof PAGE_SIZE_OPTIONS)[number]);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-8 w-[88px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>/ trang</span>
          </div>
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className={currentPage <= 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-2 text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                  className={currentPage >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm mới — {section.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="attr-def-code">Mã (lưu hệ thống)</Label>
              <Input
                id="attr-def-code"
                value={createForm.code}
                onChange={(e) => setCreateForm((s) => ({ ...s, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attr-def-label">Tên hiển thị</Label>
              <Input
                id="attr-def-label"
                value={createForm.label}
                onChange={(e) => setCreateForm((s) => ({ ...s, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attr-def-sort">Thứ tự</Label>
              <Input
                id="attr-def-sort"
                type="number"
                value={createForm.sortOrder}
                onChange={(e) => setCreateForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <Label htmlFor="attr-def-active-create">Hoạt động</Label>
              <Switch
                id="attr-def-active-create"
                checked={createForm.isActive}
                onCheckedChange={(v) => setCreateForm((s) => ({ ...s, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void submitCreate()} disabled={createDef.isPending}>
              {createDef.isPending ? "Đang lưu…" : "Thêm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editRow)} onOpenChange={(o) => !o && setEditRow(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sửa — {section.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="attr-edit-code">Mã (lưu hệ thống)</Label>
              <Input
                id="attr-edit-code"
                value={editForm.code}
                onChange={(e) => setEditForm((s) => ({ ...s, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attr-edit-label">Tên hiển thị</Label>
              <Input
                id="attr-edit-label"
                value={editForm.label}
                onChange={(e) => setEditForm((s) => ({ ...s, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attr-edit-sort">Thứ tự</Label>
              <Input
                id="attr-edit-sort"
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <Label htmlFor="attr-def-active-edit">Hoạt động</Label>
              <Switch
                id="attr-def-active-edit"
                checked={editForm.isActive}
                onCheckedChange={(v) => setEditForm((s) => ({ ...s, isActive: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setEditRow(null)}>
              Hủy
            </Button>
            <Button type="button" onClick={() => void submitEdit()} disabled={updateDef.isPending}>
              {updateDef.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteRow)} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mục?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow ? `Mục «${deleteRow.label}» sẽ bị ẩn khỏi danh mục chọn.` : ""}
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
              disabled={deleteDef.isPending}
            >
              {deleteDef.isPending ? "Đang xóa…" : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
