import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";

type Contract = {
  id: string; customer: string; value: number; products: number;
  startDate: string; endDate: string; warrantyEnd: string; status: string; progress: number;
};

interface Props {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Contract) => void;
}

/** DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD for <input type="date" /> */
function toInputDateValue(s: string): string {
  const t = s.trim();
  const vn = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (vn) return `${vn[3]}-${vn[2]}-${vn[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return "";
}

/** YYYY-MM-DD → DD/MM/YYYY for bảng danh sách */
function isoToDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

const ContractEditDialog = ({ contract, open, onOpenChange, onSave }: Props) => {
  const [form, setForm] = useState({ customer: "", value: "", products: "", startDate: "", endDate: "", warrantyEnd: "", status: "", progress: "" });

  useEffect(() => {
    if (contract) {
      setForm({
        customer: contract.customer,
        value: String(contract.value),
        products: String(contract.products),
        startDate: toInputDateValue(contract.startDate),
        endDate: toInputDateValue(contract.endDate),
        warrantyEnd: contract.warrantyEnd === "—" ? "" : toInputDateValue(contract.warrantyEnd),
        status: contract.status,
        progress: String(contract.progress),
      });
    }
  }, [contract]);

  if (!contract) return null;

  const handleSave = () => {
    const startOut = form.startDate ? isoToDisplay(form.startDate) : contract.startDate;
    const endOut = form.endDate ? isoToDisplay(form.endDate) : contract.endDate;
    const warrantyOut = form.warrantyEnd ? isoToDisplay(form.warrantyEnd) : "—";
    onSave({
      ...contract,
      customer: form.customer.trim(),
      value: Number(form.value) || 0,
      products: Number(form.products) || 0,
      startDate: startOut,
      endDate: endOut,
      warrantyEnd: warrantyOut,
      status: form.status,
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Chỉnh sửa hợp đồng {contract.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Khách hàng">
            <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} maxLength={100} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Giá trị (triệu đồng)">
              <Input type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} min={0} />
            </Field>
            <Field label="Số lượng sản phẩm">
              <Input type="number" value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} min={0} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ngày bắt đầu">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="Ngày kết thúc">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bảo hành đến">
              <Input type="date" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} />
            </Field>
            <Field label="Tiến độ (%)">
              <Input type="number" value={form.progress} onChange={(e) => setForm({ ...form, progress: e.target.value })} min={0} max={100} />
            </Field>
          </div>
          <Field label="Trạng thái">
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Đang thực hiện</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="late">Chậm tiến độ</SelectItem>
                <SelectItem value="liquidated">Đã thanh lý</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.customer.trim()}>Lưu thay đổi</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

export default ContractEditDialog;
