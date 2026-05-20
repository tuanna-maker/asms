import { useMemo, useState } from "react";
import { Link2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  useContractClausesList,
  useCreateContractClauseGroup,
  useDeleteContractClauseGroup,
  useSetContractClauseGroupMembers,
  useUpdateContractClauseGroup,
  type ContractClauseGroupItem,
} from "@/hooks/use-contract-clauses-api";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";

type Props = {
  section: AttributeSectionDef;
  canWrite: boolean;
};

const emptyForm = () => ({
  code: "",
  label: "",
  sortOrder: "0",
  isActive: true,
});

export function AttributeContractClauseGroupSection({ section, canWrite }: Props) {
  const { data: groups = [], isLoading } = useContractClauseGroupsList({ includeInactive: true });
  const { data: allClauses = [] } = useContractClausesList({ includeInactive: false });
  const createMut = useCreateContractClauseGroup();
  const updateMut = useUpdateContractClauseGroup();
  const deleteMut = useDeleteContractClauseGroup();
  const setMembersMut = useSetContractClauseGroupMembers();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [editing, setEditing] = useState<ContractClauseGroupItem | null>(null);
  const [membersGroup, setMembersGroup] = useState<ContractClauseGroupItem | null>(null);
  const [selectedClauseIds, setSelectedClauseIds] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...groups].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label)),
    [groups],
  );
  const listPag = usePaginatedSlice(sorted);

  const activeClauses = useMemo(
    () => [...allClauses].filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder),
    [allClauses],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: ContractClauseGroupItem) => {
    setEditing(row);
    setForm({
      code: row.code,
      label: row.label,
      sortOrder: String(row.sortOrder),
      isActive: row.isActive,
    });
    setDialogOpen(true);
  };

  const openMembers = (row: ContractClauseGroupItem) => {
    setMembersGroup(row);
    setSelectedClauseIds(row.members.map((m) => m.clauseId));
    setMembersOpen(true);
  };

  const toggleClause = (clauseId: string, checked: boolean) => {
    setSelectedClauseIds((prev) =>
      checked ? [...new Set([...prev, clauseId])] : prev.filter((id) => id !== clauseId),
    );
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.label.trim()) {
      toast.error("Vui lòng nhập mã và tên nhóm");
      return;
    }
    if (!isValidDefinitionCode(form.code.trim())) {
      toast.error(definitionCodeHint);
      return;
    }
    const payload = {
      code: form.code.trim(),
      label: form.label.trim(),
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, payload });
        toast.success("Đã cập nhật nhóm");
      } else {
        await createMut.mutateAsync(payload);
        toast.success("Đã thêm nhóm");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Không lưu được nhóm");
    }
  };

  const handleSaveMembers = async () => {
    if (!membersGroup) return;
    try {
      await setMembersMut.mutateAsync({ groupId: membersGroup.id, clauseIds: selectedClauseIds });
      toast.success("Đã gán điều khoản vào nhóm");
      setMembersOpen(false);
    } catch {
      toast.error("Không gán được điều khoản");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMut.mutateAsync(deleteId);
      toast.success("Đã xóa nhóm");
      setDeleteId(null);
    } catch {
      toast.error("Không xóa được nhóm");
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-b border-border/50">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${section.iconClassName}`}>
            <section.icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">{section.title}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
        </div>
        {canWrite ? (
          <Button size="sm" className="gap-1 shrink-0" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Thêm nhóm
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
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên nhóm</TableHead>
              <TableHead>Số ĐK</TableHead>
              <TableHead>Trạng thái</TableHead>
              {canWrite ? <TableHead className="text-right">Thao tác</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canWrite ? 5 : 4} className="text-center text-muted-foreground py-8">
                  Chưa có nhóm nào.
                </TableCell>
              </TableRow>
            ) : (
              listPag.pagedItems.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.code}</TableCell>
                  <TableCell>{row.label}</TableCell>
                  <TableCell>{row.members.length}</TableCell>
                  <TableCell>
                    <Badge variant={row.isActive ? "default" : "secondary"}>
                      {row.isActive ? "Đang dùng" : "Ngừng"}
                    </Badge>
                  </TableCell>
                  {canWrite ? (
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" title="Gán điều khoản" onClick={() => openMembers(row)}>
                        <Link2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteId(row.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
      {!isLoading && sorted.length > 0 && (
        <PaginatedTableFooter className="mt-3" {...listPag.footerProps} />
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa nhóm" : "Thêm nhóm"}</DialogTitle>
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
              <Label>Tên nhóm *</Label>
              <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            </div>
            <div>
              <Label>Thứ tự</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label>Đang sử dụng</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleSave()}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gán điều khoản — {membersGroup?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {activeClauses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có điều khoản active. Thêm tại mục Điều khoản.</p>
            ) : (
              activeClauses.map((c) => (
                <label key={c.id} className="flex items-start gap-2 rounded-md border p-2 cursor-pointer">
                  <Checkbox
                    checked={selectedClauseIds.includes(c.id)}
                    onCheckedChange={(v) => toggleClause(c.id, v === true)}
                  />
                  <span className="text-sm">
                    <span className="font-medium">{c.title}</span>
                    <span className="text-muted-foreground font-mono text-xs ml-1">({c.code})</span>
                  </span>
                </label>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void handleSaveMembers()} disabled={setMembersMut.isPending}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhóm?</AlertDialogTitle>
            <AlertDialogDescription>Hành động không thể hoàn tác.</AlertDialogDescription>
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
