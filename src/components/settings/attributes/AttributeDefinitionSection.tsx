import { useEffect, useMemo, useState } from "react";
import { GripVertical, History, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import type { AttributeRow, AttributeSectionDef } from "@/lib/attribute-settings-config";
import { cn } from "@/lib/utils";
import { mapDefinitionToAttributeRow } from "@/lib/attribute-definition-map";
import {
  useCreateDefinition,
  useDefinitionsList,
  useDefinitionUsage,
  useDeleteDefinition,
  useReorderDefinitions,
  useUpdateDefinition,
  type DefinitionItem,
} from "@/hooks/use-definitions-api";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const CODE_REGEX = /^[A-Za-z0-9._-]+$/;
type StatusFilter = "all" | "active" | "inactive";

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
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
  const reorderDef = useReorderDefinitions();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<DefinitionItem | null>(null);
  const [deleteRow, setDeleteRow] = useState<DefinitionItem | null>(null);
  const [createForm, setCreateForm] = useState({ code: "", label: "", sortOrder: 0, isActive: true });
  const [editForm, setEditForm] = useState({ code: "", label: "", sortOrder: 0, isActive: true });

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [hasDragChanges, setHasDragChanges] = useState(false);

  useEffect(() => {
    setOrderedIds(definitions.map((d) => d.id));
    setHasDragChanges(false);
  }, [definitions]);

  const orderedDefinitions = useMemo(() => {
    const map = new Map(definitions.map((d) => [d.id, d] as const));
    return orderedIds.map((id) => map.get(id)).filter((d): d is DefinitionItem => Boolean(d));
  }, [definitions, orderedIds]);

  const rows = useMemo(
    () => orderedDefinitions.map(mapDefinitionToAttributeRow),
    [orderedDefinitions],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.code.toLowerCase().includes(q) ||
        row.createdBy.toLowerCase().includes(q) ||
        row.updatedBy.toLowerCase().includes(q)
      );
    });
  }, [rows, search, statusFilter]);

  const total = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const isPaginatedView = totalPages > 1 || statusFilter !== "all" || search.trim().length > 0;
  const allowDrag = canWrite && !isPaginatedView;

  const pageRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  const Icon = section.icon;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedIds.indexOf(String(active.id));
    const newIndex = orderedIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    setOrderedIds(arrayMove(orderedIds, oldIndex, newIndex));
    setHasDragChanges(true);
  };

  const saveOrder = async () => {
    try {
      await reorderDef.mutateAsync({
        category: definitionCategory,
        items: orderedIds.map((id, index) => ({ id, sortOrder: index * 10 })),
      });
      toast.success("Đã lưu thứ tự");
      setHasDragChanges(false);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

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
    if (!CODE_REGEX.test(code)) {
      toast.error("Mã chỉ chấp nhận chữ cái Latin, số và ký tự . _ -");
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
    if (!CODE_REGEX.test(code)) {
      toast.error("Mã chỉ chấp nhận chữ cái Latin, số và ký tự . _ -");
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

  const disableInsteadOfDelete = async () => {
    if (!deleteRow) return;
    try {
      await updateDef.mutateAsync({
        id: deleteRow.id,
        payload: { isActive: false },
      });
      toast.success("Đã tắt mục");
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
            placeholder="Tìm theo mã hoặc tên…"
            className="sm:w-52"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Ngừng</SelectItem>
            </SelectContent>
          </Select>
          {canWrite ? (
            <Button onClick={openCreate} disabled={createDef.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              Thêm mới
            </Button>
          ) : null}
        </div>
      </div>

      {hasDragChanges ? (
        <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-amber-50/60 px-4 py-2 text-sm">
          <span className="text-amber-700">Thứ tự đang chỉnh sửa cục bộ. Lưu để áp dụng.</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOrderedIds(definitions.map((d) => d.id));
                setHasDragChanges(false);
              }}
              disabled={reorderDef.isPending}
            >
              Huỷ
            </Button>
            <Button size="sm" onClick={() => void saveOrder()} disabled={reorderDef.isPending}>
              {reorderDef.isPending ? "Đang lưu…" : "Lưu thứ tự"}
            </Button>
          </div>
        </div>
      ) : null}

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
            {allowDrag ? <TableHead className="w-8" /> : null}
            <TableHead className="w-14">STT</TableHead>
            <TableHead className="w-40">Mã</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Người sửa</TableHead>
            <TableHead>Ngày sửa</TableHead>
            <TableHead>Trạng thái</TableHead>
            {canWrite ? <TableHead className="w-32 text-right">Thao tác</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={(canWrite ? 8 : 7) + (allowDrag ? 1 : 0)} className="py-8 text-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline h-5 w-5 animate-spin align-middle" />
                Đang tải…
              </TableCell>
            </TableRow>
          ) : pageRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={(canWrite ? 8 : 7) + (allowDrag ? 1 : 0)} className="py-8 text-center text-sm text-muted-foreground">
                Không có dữ liệu phù hợp.
              </TableCell>
            </TableRow>
          ) : allowDrag ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pageRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
                {pageRows.map((row, index) => (
                  <SortableAttributeRow
                    key={row.id}
                    row={row}
                    index={(currentPage - 1) * pageSize + index}
                    canWrite={canWrite}
                    onEdit={() => {
                      const item = definitions.find((d) => d.id === row.id);
                      if (item) openEdit(item);
                    }}
                    onDelete={() => {
                      const item = definitions.find((d) => d.id === row.id);
                      if (item) setDeleteRow(item);
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            pageRows.map((row, index) => (
              <StaticAttributeRow
                key={row.id}
                row={row}
                index={(currentPage - 1) * pageSize + index}
                canWrite={canWrite}
                onEdit={() => {
                  const item = definitions.find((d) => d.id === row.id);
                  if (item) openEdit(item);
                }}
                onDelete={() => {
                  const item = definitions.find((d) => d.id === row.id);
                  if (item) setDeleteRow(item);
                }}
              />
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

      <DeleteDefinitionDialog
        deleteRow={deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirmDelete={confirmDelete}
        onDisable={disableInsteadOfDelete}
        deleting={deleteDef.isPending || updateDef.isPending}
      />
    </section>
  );
}

type RowProps = {
  row: AttributeRow;
  index: number;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function StaticAttributeRow({ row, index, canWrite, onEdit, onDelete }: RowProps) {
  return <AttributeTableRow row={row} index={index} canWrite={canWrite} onEdit={onEdit} onDelete={onDelete} />;
}

function SortableAttributeRow(props: RowProps) {
  const { row } = props;
  const sortable = useSortable({ id: row.id });
  return (
    <AttributeTableRow
      {...props}
      dragHandleProps={{
        ref: sortable.setNodeRef,
        style: {
          transform: CSS.Transform.toString(sortable.transform),
          transition: sortable.transition,
          backgroundColor: sortable.isDragging ? "rgba(0,0,0,0.03)" : undefined,
        },
        attributes: sortable.attributes,
        listeners: sortable.listeners,
      }}
    />
  );
}

type DragHandleProps = {
  ref: (el: HTMLElement | null) => void;
  style: React.CSSProperties;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
};

function AttributeTableRow({
  row,
  index,
  canWrite,
  onEdit,
  onDelete,
  dragHandleProps,
}: RowProps & { dragHandleProps?: DragHandleProps }) {
  return (
    <TableRow ref={dragHandleProps?.ref ?? undefined} style={dragHandleProps?.style}>
      {dragHandleProps ? (
        <TableCell className="w-8 cursor-grab text-muted-foreground">
          <span {...dragHandleProps.attributes} {...dragHandleProps.listeners} aria-label="Kéo để sắp xếp">
            <GripVertical className="h-4 w-4" />
          </span>
        </TableCell>
      ) : null}
      <TableCell>{index + 1}</TableCell>
      <TableCell className="font-mono text-xs text-muted-foreground">{row.code}</TableCell>
      <TableCell className="font-medium">{row.name}</TableCell>
      <TableCell>{row.updatedBy || "—"}</TableCell>
      <TableCell>{formatDate(row.updatedAt)}</TableCell>
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
            <Button asChild variant="ghost" size="icon" aria-label="Xem lịch sử">
              <Link to={`/cai-dat?tab=audit&entity=definition&entityId=${encodeURIComponent(row.id)}`}>
                <History className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Sửa" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Xóa" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      ) : null}
    </TableRow>
  );
}

type DeleteDialogProps = {
  deleteRow: DefinitionItem | null;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
  onDisable: () => Promise<void> | void;
  deleting: boolean;
};

function DeleteDefinitionDialog({ deleteRow, onClose, onConfirmDelete, onDisable, deleting }: DeleteDialogProps) {
  const { data: usage, isFetching } = useDefinitionUsage(deleteRow?.id ?? null, {
    enabled: Boolean(deleteRow),
  });

  const inUseCount = usage?.count ?? 0;
  const blockDelete = inUseCount > 0;

  return (
    <AlertDialog open={Boolean(deleteRow)} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{blockDelete ? "Không thể xoá" : "Xoá mục?"}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              {deleteRow ? (
                <p>
                  Mục <span className="font-medium">«{deleteRow.label}»</span> ({deleteRow.code}).
                </p>
              ) : null}
              {isFetching ? <p className="text-muted-foreground">Đang kiểm tra số bản ghi đang dùng…</p> : null}
              {inUseCount > 0 ? (
                <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-700">
                  <p>Còn {inUseCount} bản ghi đang dùng giá trị này:</p>
                  <ul className="ml-4 list-disc">
                    {(usage?.breakdown ?? []).map((b) => (
                      <li key={b.entity}>
                        {b.entity}: {b.count}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1">Nên tắt thay vì xoá để giữ lịch sử.</p>
                </div>
              ) : null}
              {!blockDelete ? <p>Mục sẽ bị ẩn khỏi danh mục chọn và không thể khôi phục từ đây.</p> : null}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          {blockDelete ? (
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void onDisable();
              }}
              disabled={deleting}
            >
              {deleting ? "Đang xử lý…" : "Tắt mục"}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void onConfirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Đang xoá…" : "Xoá"}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
