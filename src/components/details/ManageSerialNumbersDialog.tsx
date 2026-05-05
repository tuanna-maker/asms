import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Check, X, Pencil, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { BOMItem } from "@/data/productsData";

interface Props {
  item: BOMItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (serialNumbers: string[]) => void;
}

const ManageSerialNumbersDialog = ({ item, open, onOpenChange, onSave }: Props) => {
  const [serials, setSerials] = useState<string[]>([]);
  const [newSn, setNewSn] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (open && item) {
      setSerials(item.serialNumbers ?? []);
      setNewSn("");
      setEditIndex(null);
      setEditValue("");
    }
  }, [open, item]);

  if (!item) return null;

  const handleAdd = () => {
    const v = newSn.trim();
    if (!v) return;
    if (serials.includes(v)) {
      toast({ title: "SN trùng lặp", description: `${v} đã tồn tại trong danh sách.`, variant: "destructive" });
      return;
    }
    if (serials.length >= item.quantity) {
      toast({ title: "Vượt quá số lượng", description: `Linh kiện này chỉ có ${item.quantity} đơn vị.`, variant: "destructive" });
      return;
    }
    setSerials([...serials, v]);
    setNewSn("");
  };

  const handleDelete = (idx: number) => {
    setSerials(serials.filter((_, i) => i !== idx));
  };

  const startEdit = (idx: number) => {
    setEditIndex(idx);
    setEditValue(serials[idx]);
  };

  const confirmEdit = () => {
    if (editIndex === null) return;
    const v = editValue.trim();
    if (!v) return;
    if (serials.some((s, i) => i !== editIndex && s === v)) {
      toast({ title: "SN trùng lặp", variant: "destructive" });
      return;
    }
    const next = [...serials];
    next[editIndex] = v;
    setSerials(next);
    setEditIndex(null);
    setEditValue("");
  };

  const handleSave = () => {
    onSave(serials);
    toast({ title: "Đã lưu", description: `Cập nhật ${serials.length} SN cho ${item.materialId}.` });
    onOpenChange(false);
  };

  const remaining = item.quantity - serials.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý Serial Number</DialogTitle>
          <DialogDescription>
            <span className="font-mono font-semibold text-primary">{item.materialId}</span> — {item.materialName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Số lượng: <span className="font-medium text-foreground">{item.quantity} {item.unit}</span></span>
            <Badge variant="outline" className={remaining === 0 ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}>
              Đã gán {serials.length}/{item.quantity}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Nhập Serial Number..."
              value={newSn}
              onChange={(e) => setNewSn(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
              className="font-mono"
            />
            <Button onClick={handleAdd} disabled={!newSn.trim() || serials.length >= item.quantity}>
              <Plus className="h-4 w-4 mr-1" />Thêm
            </Button>
          </div>

          <div className="border border-border rounded-md max-h-72 overflow-y-auto">
            {serials.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                <AlertTriangle className="h-5 w-5 mx-auto mb-2 opacity-50" />
                Chưa gán Serial Number nào
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {serials.map((sn, idx) => (
                  <li key={idx} className="flex items-center gap-2 px-3 py-2">
                    <span className="text-xs text-muted-foreground w-6">{idx + 1}.</span>
                    {editIndex === idx ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), confirmEdit())}
                          className="h-8 font-mono text-sm"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={confirmEdit}><Check className="h-4 w-4 text-success" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditIndex(null)}><X className="h-4 w-4" /></Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 font-mono text-sm">{sn}</span>
                        <Button size="sm" variant="ghost" onClick={() => startEdit(idx)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(idx)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleSave}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSerialNumbersDialog;
