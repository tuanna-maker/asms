import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";

type Customer = {
  id: string; name: string; contact: string; phone: string;
  email: string; address: string; contracts: number; activeContracts: number;
};

interface Props {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updated: Customer) => void;
}

const CustomerEditDialog = ({ customer, open, onOpenChange, onSave }: Props) => {
  const [form, setForm] = useState({ name: "", contact: "", phone: "", email: "", address: "" });

  useEffect(() => {
    if (customer) {
      setForm({ name: customer.name, contact: customer.contact, phone: customer.phone, email: customer.email, address: customer.address });
    }
  }, [customer]);

  if (!customer) return null;

  const handleSave = () => {
    onSave({ ...customer, name: form.name.trim(), contact: form.contact.trim(), phone: form.phone.trim(), email: form.email.trim(), address: form.address.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Chỉnh sửa khách hàng {customer.id}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Field label="Tên đơn vị">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={100} />
          </Field>
          <Field label="Người liên hệ">
            <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} maxLength={100} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Điện thoại">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={100} />
            </Field>
          </div>
          <Field label="Địa chỉ">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} maxLength={200} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>Lưu thay đổi</Button>
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

export default CustomerEditDialog;
