import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateHandover, useUpdateHandover, type HandoverListItem } from "@/hooks/use-handovers-api";

type ContractOption = { id: string; code: string; title: string | null; products: number };

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  contracts: ContractOption[];
  editing: HandoverListItem | null;
};

function toDateInput(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

export function HandoverUpsertDialog({ open, onOpenChange, contracts, editing }: Props) {
  const createH = useCreateHandover();
  const updateH = useUpdateHandover();

  const [contractId, setContractId] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [status, setStatus] = useState<"pending" | "active" | "completed" | "late">("pending");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setContractId(editing.contractId);
      setCurrentStep(editing.currentStep);
      setStatus(editing.status);
      setStartDate(toDateInput(editing.startDate));
      setDueDate(toDateInput(editing.dueDate));
    } else {
      const d = new Date();
      setContractId(contracts[0]?.id ?? "");
      setCurrentStep(1);
      setStatus("pending");
      setStartDate(d.toISOString().slice(0, 10));
      setDueDate(d.toISOString().slice(0, 10));
    }
  }, [open, editing, contracts]);

  const selectedContract = contracts.find((contract) => contract.id === contractId);
  const productCount = selectedContract?.products ?? editing?.products ?? 0;

  const submit = async () => {
    if (!contractId) {
      toast.error("Chọn hợp đồng");
      return;
    }
    const start = startDate ? new Date(`${startDate}T12:00:00`).toISOString() : undefined;
    const due = dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : undefined;
    try {
      if (editing) {
        await updateH.mutateAsync({
          id: editing.id,
          payload: {
            currentStep,
            status,
            startDate: start,
            dueDate: due,
            ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}),
          },
        });
        toast.success("Đã cập nhật bàn giao");
      } else {
        await createH.mutateAsync({
          contractId,
          currentStep,
          status,
          startDate: start,
          dueDate: due,
        });
        toast.success("Đã tạo bàn giao");
      }
      onOpenChange(false);
    } catch {
      toast.error(editing ? "Không cập nhật được" : "Không tạo được");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa bàn giao" : "Thêm bàn giao"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <Label>Hợp đồng</Label>
            <Select value={contractId} onValueChange={setContractId} disabled={Boolean(editing)}>
              <SelectTrigger><SelectValue placeholder="Chọn HĐ" /></SelectTrigger>
              <SelectContent>
                {contracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.code} — {c.title || "—"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Số sản phẩm</Label>
              <Input type="number" min={0} value={productCount} readOnly className="bg-muted/50" />
              <p className="text-xs text-muted-foreground">Tự động tính từ danh mục sản phẩm của hợp đồng.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Bước (1–5)</Label>
              <Input type="number" min={1} max={5} value={currentStep} onChange={(e) => setCurrentStep(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Chưa bắt đầu</SelectItem>
                <SelectItem value="active">Đang thực hiện</SelectItem>
                <SelectItem value="late">Chậm tiến độ</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ngày bắt đầu</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hạn hoàn thành</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="button" onClick={() => void submit()} disabled={createH.isPending || updateH.isPending}>
            {(createH.isPending || updateH.isPending) ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
