import { useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
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
import type { AttributeSectionDef } from "@/lib/attribute-settings-config";
import { isValidDefinitionCode, definitionCodeHint } from "@/lib/attribute-code-validation";
import {
  useContractClauseGroupsList,
  useContractClauseUsage,
  useContractClausesList,
  useCreateContractClause,
  useDeleteContractClause,
  useUpdateContractClause,
  type ContractClauseItem,
} from "@/hooks/use-contract-clauses-api";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import { clauseAttrStyles } from "@/components/settings/attributes/contract-clause-styles";
import { cn } from "@/lib/utils";

type Props = {
  section: AttributeSectionDef;
  canWrite: boolean;
};

const emptyForm = () => ({
  code: "",
  title: "",
  isActive: true,
});

export function AttributeContractClauseSection({ section, canWrite }: Props) {
  const { data: rows = [], isLoading } = useContractClausesList({ includeInactive: true });
  const { data: groups = [] } = useContractClauseGroupsList({ includeInactive: true });
  const createMut = useCreateContractClause();
  const updateMut = useUpdateContractClause();
  const deleteMut = useDeleteContractClause();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContractClauseItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: usage } = useContractClauseUsage(deleteId, { enabled: Boolean(deleteId) });

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.title.localeCompare(b.title, "vi")),
    [rows],
  );
  const groupLabelByClauseId = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of groups) {
      for (const m of g.members) {
        if (!map.has(m.clauseId)) map.set(m.clauseId, g.label);
      }
    }
    return map;
  }, [groups]);
  const listPag = usePaginatedSlice(sorted);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: ContractClauseItem) => {
    setEditing(row);
    setForm({
      code: row.code,
      title: row.title,
      isActive: row.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.title.trim()) {
      toast.error("Vui lòng nhập mã và tiêu đề");
      return;
    }
    if (!isValidDefinitionCode(form.code.trim())) {
      toast.error(definitionCodeHint);
      return;
    }
    const nextSortOrder =
      rows.length > 0 ? Math.max(...rows.map((r) => r.sortOrder)) + 1 : 0;
    const payload = {
      code: form.code.trim(),
      title: form.title.trim(),
      content: "",
      isActive: form.isActive,
      ...(!editing ? { sortOrder: nextSortOrder } : {}),
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        toast.success("Đã cập nhật điều khoản");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Đã thêm điều khoản");
      }
      setDialogOpen(false);
    } catch (e) { toastApiError(e, "Không lưu được điều khoản");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success("Đã xóa điều khoản");
      setDeleteId(null);
    } catch (e) { toastApiError(e, "Không xóa được điều khoản");
    }
  };

  return (
    <div className={clauseAttrStyles.section}>
      <div className={clauseAttrStyles.sectionHead}>
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", section.iconClassName)}>
            <section.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className={clauseAttrStyles.sectionTitle}>{section.title}</h3>
            <p className={clauseAttrStyles.sectionDesc}>{section.description}</p>
          </div>
        </div>
        {canWrite ? (
          <Button size="sm" className="gap-1 shrink-0" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Thêm
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải…
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={clauseAttrStyles.tableHead}>Mã</TableHead>
              <TableHead className={clauseAttrStyles.tableHead}>Tiêu đề</TableHead>
              <TableHead className={clauseAttrStyles.tableHead}>Nhóm</TableHead>
              <TableHead className={clauseAttrStyles.tableHead}>Trạng thái</TableHead>
              {canWrite ? (
                <TableHead className={cn(clauseAttrStyles.tableHead, "text-right")}>Thao tác</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="text-center text-muted-foreground py-10">
                  Chưa có điều khoản nào.
                </TableCell>
              </TableRow>
            ) : (
              listPag.pagedItems.map((row) => {
                const groupLabel = groupLabelByClauseId.get(row.id);
                return (
                <TableRow key={row.id} className={clauseAttrStyles.tableRow}>
                  <TableCell className={clauseAttrStyles.cellCode}>{row.code}</TableCell>
                  <TableCell className={clauseAttrStyles.cellTitle}>{row.title}</TableCell>
                  <TableCell className={groupLabel ? clauseAttrStyles.cellGroup : clauseAttrStyles.cellGroupEmpty}>
                    {groupLabel ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Đang dùng" : "Ngừng"}
                    </Badge>
                  </TableCell>
                  {canWrite ? (
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
      )}
      {!isLoading && sorted.length > 0 && (
        <PaginatedTableFooter variant="attribute" {...listPag.footerProps} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa điều khoản" : "Thêm điều khoản"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mã *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Tiêu đề *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <p className="text-xs text-muted-foreground">
              Nội dung chi tiết được nhập trên từng hợp đồng khi chọn mục này.
            </p>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Đang sử dụng</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave()} disabled={createMut.isPending || updateMut.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa điều khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              {usage && usage.count > 0
                ? `Còn ${usage.count} hợp đồng đang dùng mục này.`
                : "Hành động không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
