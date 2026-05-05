import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateDefinition,
  useDefinitionsList,
  useDeleteDefinition,
  useUpdateDefinition,
  type DefinitionItem,
} from "@/hooks/use-definitions-api";

const PRESETS = [
  { slug: "warehouse", title: "Kho / vị trí", description: "Hiển thị trong ô chọn «Kho» khi nhập vật tư." },
  { slug: "material_unit", title: "Đơn vị vật tư", description: "Hiển thị trong ô chọn ĐVT trên Form nhập kho." },
] as const;

type PresetValue = (typeof PRESETS)[number]["slug"] | "custom";

function errMessage(e: unknown) {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof r === "string") return r;
  }
  if (e instanceof Error) return e.message;
  return "Có lỗi xảy ra";
}

function categoryValid(slug: string) {
  return /^[a-z0-9_.-]{1,128}$/i.test(slug.trim());
}

export function DataDefinitionsTab({ canWrite }: { canWrite: boolean }) {
  const [preset, setPreset] = useState<PresetValue>("warehouse");
  const [customCategory, setCustomCategory] = useState("");

  const categorySlug = useMemo(() => {
    if (preset === "custom") return customCategory.trim();
    return preset;
  }, [preset, customCategory]);

  const { data: rows = [], isLoading, isError, error, refetch } = useDefinitionsList(categorySlug, {
    includeInactive: true,
    enabled: preset !== "custom" || categoryValid(customCategory),
  });

  const createDef = useCreateDefinition();
  const updateDef = useUpdateDefinition();
  const deleteDef = useDeleteDefinition();

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<DefinitionItem | null>(null);
  const [deleteRow, setDeleteRow] = useState<DefinitionItem | null>(null);

  const [createForm, setCreateForm] = useState({
    code: "",
    label: "",
    sortOrder: 0,
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    code: "",
    label: "",
    sortOrder: 0,
    isActive: true,
  });

  const openCreate = () => {
    setCreateForm({ code: "", label: "", sortOrder: rows.length ? Math.max(...rows.map((r) => r.sortOrder)) + 10 : 0, isActive: true });
    setCreateOpen(true);
  };

  const openEdit = (r: DefinitionItem) => {
    setEditForm({ code: r.code, label: r.label, sortOrder: r.sortOrder, isActive: r.isActive });
    setEditRow(r);
  };

  const submitCreate = async () => {
    if (!categorySlug || !categoryValid(categorySlug)) {
      toast.error("Nhập nhóm hợp lệ (chữ, số, _, ., -).");
      return;
    }
    const code = createForm.code.trim();
    const label = createForm.label.trim();
    if (!code || !label) {
      toast.error("Mã và nhãn hiển thị là bắt buộc.");
      return;
    }
    try {
      await createDef.mutateAsync({
        category: categorySlug,
        code,
        label,
        sortOrder: Number.isFinite(createForm.sortOrder) ? createForm.sortOrder : 0,
        isActive: createForm.isActive,
      });
      toast.success("Đã thêm giá trị");
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
      toast.error("Mã và nhãn hiển thị là bắt buộc.");
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
      toast.success("Đã xóa định nghĩa");
      setDeleteRow(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const queryEnabled = preset !== "custom" || (customCategory.trim().length > 0 && categoryValid(customCategory));

  return (
    <div className="rounded-xl bg-card border border-border/50 shadow-sm space-y-4 p-4 sm:p-5">
      <div className="space-y-1">
        <h3 className="font-semibold text-card-foreground">Định nghĩa dữ liệu</h3>
        <p className="text-sm text-muted-foreground">
          Giá trị «Mã» được lưu vào chứng từ và danh mục; «Nhãn» chỉ để hiển thị. Thêm nhóm mới bằng «Nhóm tùy chỉnh» — dùng tên không dấu, ví dụ{" "}
          <code className="text-xs">product_grade</code>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Nhóm dữ liệu</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as PresetValue)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn nhóm" />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.title} ({p.slug})
                </SelectItem>
              ))}
              <SelectItem value="custom">Nhóm tùy chỉnh…</SelectItem>
            </SelectContent>
          </Select>
          {preset !== "custom" ? (
            <p className="text-xs text-muted-foreground">{PRESETS.find((p) => p.slug === preset)?.description}</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="custom-cat">Mã nhóm (slug)</Label>
              <Input
                id="custom-cat"
                placeholder="vd: contract_payment_term"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
              {!categoryValid(customCategory) && customCategory.trim().length > 0 ? (
                <p className="text-xs text-destructive">Chỉ dùng chữ, số, _, ., - (tối đa 128 ký tự).</p>
              ) : null}
            </div>
          )}
        </div>
        <div className="flex items-end gap-2">
          {canWrite ? (
            <Button type="button" onClick={() => openCreate()} disabled={!queryEnabled || createDef.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Thêm giá trị
            </Button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <div className="text-sm text-destructive flex flex-wrap items-center gap-2">
          <span>{error instanceof Error ? error.message : "Không tải được danh sách."}</span>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : null}

      {!queryEnabled ? (
        <div className="text-sm text-muted-foreground py-6 text-center">Chọn hoặc nhập nhóm để xem và chỉnh sửa định nghĩa.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã (lưu hệ thống)</TableHead>
              <TableHead>Nhãn hiển thị</TableHead>
              <TableHead className="w-24 text-right">Thứ tự</TableHead>
              <TableHead className="w-28">Kích hoạt</TableHead>
              {canWrite ? <TableHead className="text-right w-36">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="py-12 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin inline mr-2 align-middle" />
                  Đang tải…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="py-8 text-center text-muted-foreground">
                  Chưa có giá trị cho nhóm này.{canWrite ? " Nhấn «Thêm giá trị» hoặc chạy seed bootstrap để có dữ liệu gốc." : ""}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.code}</TableCell>
                  <TableCell className="text-muted-foreground">{r.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={r.isActive ? "default" : "outline"}>{r.isActive ? "Bật" : "Tắt"}</Badge>
                  </TableCell>
                  {canWrite ? (
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" type="button" onClick={() => openEdit(r)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteRow(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm giá trị — {categorySlug}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="def-code">Mã (giá trị lưu)</Label>
              <Input id="def-code" value={createForm.code} onChange={(e) => setCreateForm((s) => ({ ...s, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="def-label">Nhãn hiển thị</Label>
              <Input id="def-label" value={createForm.label} onChange={(e) => setCreateForm((s) => ({ ...s, label: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="def-sort">Thứ tự sắp xếp</Label>
              <Input
                id="def-sort"
                type="number"
                value={createForm.sortOrder}
                onChange={(e) => setCreateForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <Label htmlFor="def-active-create">Đang kích hoạt</Label>
              <Switch
                id="def-active-create"
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
            <DialogTitle>Sửa định nghĩa</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="edit-code">Mã (giá trị lưu)</Label>
              <Input id="edit-code" value={editForm.code} onChange={(e) => setEditForm((s) => ({ ...s, code: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-label">Nhãn hiển thị</Label>
              <Input id="edit-label" value={editForm.label} onChange={(e) => setEditForm((s) => ({ ...s, label: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-sort">Thứ tự sắp xếp</Label>
              <Input
                id="edit-sort"
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm((s) => ({ ...s, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2">
              <Label htmlFor="def-active-edit">Đang kích hoạt</Label>
              <Switch
                id="def-active-edit"
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
            <AlertDialogTitle>Xóa định nghĩa?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteRow ? `Mã «${deleteRow.code}» sẽ bị ẩn và không hiện trong form chọn nữa. Dữ liệu vật tư đã lưu vẫn giữ giá trị cũ.` : ""}
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
    </div>
  );
}
