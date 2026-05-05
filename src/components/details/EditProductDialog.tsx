import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DefenseProduct } from "@/data/productsData";
import type { UpdateProductPayload } from "@/hooks/use-products-api";
import { toast } from "sonner";

const CATEGORIES = ["Vô tuyến", "Mã hóa", "Trinh sát", "Ra đa", "Chỉ huy", "Vệ tinh", "Chuyển tiếp", "Truyền dẫn"];

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: DefenseProduct | null;
  onSave: (id: string, payload: UpdateProductPayload) => Promise<void>;
};

export function EditProductDialog({ open, onOpenChange, product, onSave }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<DefenseProduct["status"]>("developing");
  const [version, setVersion] = useState("");
  const [unit, setUnit] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [yearReleased, setYearReleased] = useState(new Date().getFullYear());
  const [totalProduced, setTotalProduced] = useState(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open || !product) return;
    setName(product.name);
    setCategory(product.category);
    setStatus(product.status);
    setVersion(product.version ?? "");
    setUnit(product.unit ?? "");
    setManufacturer(product.manufacturer ?? "");
    setYearReleased(product.yearReleased ?? new Date().getFullYear());
    setTotalProduced(product.totalProduced);
    setDescription(product.description ?? "");
  }, [open, product]);

  const submit = async () => {
    if (!product) return;
    if (!name.trim()) return;
    const cat = (category || product.category).trim();
    if (!cat) return;
    setSubmitting(true);
    try {
      await onSave(product.id, {
        name: name.trim(),
        category: cat,
        status,
        version: version.trim() || undefined,
        unit: unit.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        yearReleased,
        totalProduced,
        description: description.trim() || undefined,
      });
      toast.success("Đã cập nhật sản phẩm");
      onOpenChange(false);
    } catch {
      toast.error("Không cập nhật được sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa sản phẩm</DialogTitle>
          <DialogDescription>Mã quân sự: {product?.code ?? "—"} · ID: {product?.id?.slice(0, 8)}…</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Tên sản phẩm *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Phân loại *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(CATEGORIES.includes(category) ? CATEGORIES : [category, ...CATEGORIES]).map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Trạng thái</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DefenseProduct["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="developing">Đang phát triển</SelectItem>
                <SelectItem value="producing">Đang sản xuất</SelectItem>
                <SelectItem value="equipped">Đã trang bị</SelectItem>
                <SelectItem value="stopped">Dừng SX</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Phiên bản</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Năm phát hành</Label>
            <Input type="number" min={1900} max={2100} value={yearReleased} onChange={(e) => setYearReleased(Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label>Đơn vị sử dụng</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Nhà sản xuất</Label>
            <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Số lượng đã SX</Label>
            <Input type="number" min={0} value={totalProduced} onChange={(e) => setTotalProduced(Number(e.target.value))} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => void submit()} disabled={submitting || !product}>{submitting ? "Đang lưu…" : "Lưu"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
