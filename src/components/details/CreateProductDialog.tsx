import { useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DefenseProduct } from "@/data/productsData";
import type { CreateProductPayload } from "@/hooks/use-products-api";

const CATEGORIES = ["Vô tuyến", "Mã hóa", "Trinh sát", "Ra đa", "Chỉ huy", "Vệ tinh", "Chuyển tiếp", "Truyền dẫn"];

const productSchema = z.object({
  id: z.string().trim().regex(/^SP-\d{3,}$/, { message: "Mã SP phải có dạng SP-001" }).max(20),
  code: z.string().trim().nonempty({ message: "Mã quân sự là bắt buộc" }).max(50, { message: "Tối đa 50 ký tự" }),
  name: z.string().trim().nonempty({ message: "Tên sản phẩm là bắt buộc" }).max(150, { message: "Tối đa 150 ký tự" }),
  category: z.enum(CATEGORIES as [string, ...string[]], { errorMap: () => ({ message: "Chọn phân loại" }) }),
  status: z.enum(["developing", "producing", "equipped", "stopped"]),
  version: z.string().trim().nonempty({ message: "Phiên bản là bắt buộc" }).max(20),
  unit: z.string().trim().nonempty({ message: "Đơn vị là bắt buộc" }).max(100),
  manufacturer: z.string().trim().nonempty({ message: "Nhà SX là bắt buộc" }).max(100),
  yearReleased: z.coerce.number().int().min(1990).max(2100),
  totalProduced: z.coerce.number().int().min(0).max(1_000_000),
  description: z.string().trim().max(500, { message: "Tối đa 500 ký tự" }).optional(),
});

const apiProductSchema = z.object({
  code: z.string().trim().min(1, { message: "Mã quân sự là bắt buộc" }).max(50),
  name: z.string().trim().min(1, { message: "Tên sản phẩm là bắt buộc" }).max(150),
  category: z.string().trim().min(1, { message: "Chọn phân loại" }).max(100),
  status: z.enum(["developing", "producing", "equipped", "stopped"]),
  version: z.string().trim().max(20).optional(),
  unit: z.string().trim().max(100).optional(),
  manufacturer: z.string().trim().max(100).optional(),
  yearReleased: z.coerce.number().int().min(1900).max(2100).optional(),
  totalProduced: z.coerce.number().int().min(0).max(1_000_000).optional(),
  description: z.string().trim().max(500).optional(),
});

type FormErrors = Partial<Record<keyof z.infer<typeof productSchema> | keyof z.infer<typeof apiProductSchema> | "api", string>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Catalog demo — chỉ dùng khi không bật apiMode */
  onCreate?: (product: DefenseProduct) => void;
  existingIds?: string[];
  /** Gọi POST /api/v1/products */
  apiMode?: boolean;
  onApiCreate?: (payload: CreateProductPayload) => Promise<void>;
  existingCodes?: string[];
}

const initial = {
  id: "",
  code: "",
  name: "",
  category: "",
  status: "developing" as DefenseProduct["status"],
  version: "v1.0",
  unit: "",
  manufacturer: "",
  yearReleased: new Date().getFullYear(),
  totalProduced: 0,
  description: "",
};

function errMessage(e: unknown) {
  if (e && typeof e === "object" && "response" in e) {
    const r = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
    if (typeof r === "string") return r;
  }
  if (e instanceof Error) return e.message;
  return "Không tạo được sản phẩm";
}

const CreateProductDialog = ({
  open,
  onOpenChange,
  onCreate,
  existingIds = [],
  apiMode,
  onApiCreate,
  existingCodes = [],
}: Props) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const update = <K extends keyof typeof initial>(k: K, v: (typeof initial)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const handleSubmit = async () => {
    if (apiMode && onApiCreate) {
      const result = apiProductSchema.safeParse({
        code: form.code.trim(),
        name: form.name.trim(),
        category: form.category,
        status: form.status,
        version: form.version.trim() || undefined,
        unit: form.unit.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined,
        yearReleased: form.yearReleased,
        totalProduced: form.totalProduced,
        description: form.description.trim() || undefined,
      });
      if (!result.success) {
        const fieldErrors: FormErrors = {};
        result.error.errors.forEach((err) => {
          const key = err.path[0] as keyof FormErrors;
          if (key && !fieldErrors[key]) fieldErrors[key] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
      if (existingCodes.includes(result.data.code)) {
        setErrors({ code: "Mã quân sự đã tồn tại trong danh sách" });
        return;
      }
      setSubmitting(true);
      try {
        const payload: CreateProductPayload = {
          code: result.data.code,
          name: result.data.name,
          category: result.data.category,
          status: result.data.status,
          ...(result.data.version !== undefined ? { version: result.data.version } : {}),
          ...(result.data.unit !== undefined ? { unit: result.data.unit } : {}),
          ...(result.data.manufacturer !== undefined ? { manufacturer: result.data.manufacturer } : {}),
          ...(result.data.yearReleased !== undefined ? { yearReleased: result.data.yearReleased } : {}),
          ...(result.data.totalProduced !== undefined ? { totalProduced: result.data.totalProduced } : {}),
          ...(result.data.description !== undefined ? { description: result.data.description } : {}),
        };
        await onApiCreate(payload);
        toast({ title: "Đã tạo sản phẩm", description: `${result.data.code} — ${result.data.name}` });
        setForm(initial);
        setErrors({});
        onOpenChange(false);
      } catch (e) {
        toast({ title: "Lỗi", description: errMessage(e), variant: "destructive" });
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!onCreate) return;

    const result = productSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof FormErrors;
        if (key && !fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (existingIds.includes(result.data.id)) {
      setErrors({ id: "Mã SP đã tồn tại" });
      return;
    }
    const d = result.data;
    const newProduct: DefenseProduct = {
      id: d.id,
      code: d.code,
      name: d.name,
      category: d.category,
      status: d.status,
      version: d.version,
      unit: d.unit,
      manufacturer: d.manufacturer,
      yearReleased: d.yearReleased,
      totalProduced: d.totalProduced,
      description: d.description || "",
      bom: [],
      specs: [],
    };
    onCreate(newProduct);
    toast({ title: "Đã tạo sản phẩm", description: `${newProduct.id} - ${newProduct.name}` });
    setForm(initial);
    setErrors({});
    onOpenChange(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      setForm(initial);
      setErrors({});
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo sản phẩm quốc phòng</DialogTitle>
          <DialogDescription>
            {apiMode
              ? "Dữ liệu được lưu qua API. Mã nội bộ do hệ thống cấp (CUID)."
              : "Nhập thông tin tổng quan. BOM (linh kiện) có thể thêm sau."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {!apiMode ? (
            <Field label="Mã SP *" error={errors.id}>
              <Input placeholder="SP-009" value={form.id} onChange={(e) => update("id", e.target.value.toUpperCase())} maxLength={20} />
            </Field>
          ) : null}
          <Field label="Mã quân sự *" error={errors.code}>
            <Input placeholder="VTĐ-RF300/QP" value={form.code} onChange={(e) => update("code", e.target.value)} maxLength={50} />
          </Field>

          <div className={apiMode ? "md:col-span-2" : "md:col-span-2"}>
            <Field label="Tên sản phẩm *" error={errors.name}>
              <Input placeholder="Máy thu phát vô tuyến..." value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={150} />
            </Field>
          </div>

          <Field label="Phân loại *" error={errors.category}>
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger><SelectValue placeholder="Chọn phân loại" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Trạng thái *" error={errors.status}>
            <Select value={form.status} onValueChange={(v) => update("status", v as DefenseProduct["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="developing">Đang phát triển</SelectItem>
                <SelectItem value="producing">Đang sản xuất</SelectItem>
                <SelectItem value="equipped">Đã trang bị</SelectItem>
                <SelectItem value="stopped">Dừng SX</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={apiMode ? "Phiên bản" : "Phiên bản *"} error={errors.version}>
            <Input placeholder="v1.0" value={form.version} onChange={(e) => update("version", e.target.value)} maxLength={20} />
          </Field>
          <Field label="Năm phát hành *" error={errors.yearReleased}>
            <Input type="number" min={1990} max={2100} value={form.yearReleased} onChange={(e) => update("yearReleased", Number(e.target.value))} />
          </Field>

          <Field label={apiMode ? "Đơn vị sử dụng" : "Đơn vị sử dụng *"} error={errors.unit}>
            <Input placeholder="Bộ TL Thông tin" value={form.unit} onChange={(e) => update("unit", e.target.value)} maxLength={100} />
          </Field>
          <Field label={apiMode ? "Nhà sản xuất" : "Nhà sản xuất *"} error={errors.manufacturer}>
            <Input placeholder="Nhà máy Z181" value={form.manufacturer} onChange={(e) => update("manufacturer", e.target.value)} maxLength={100} />
          </Field>

          <Field label="Số lượng đã SX" error={errors.totalProduced}>
            <Input type="number" min={0} value={form.totalProduced} onChange={(e) => update("totalProduced", Number(e.target.value))} />
          </Field>

          <div className="md:col-span-2">
            <Field label="Mô tả" error={errors.description}>
              <Textarea rows={3} placeholder="Mô tả ngắn về sản phẩm..." value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={500} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Hủy</Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Đang lưu…" : "Tạo sản phẩm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label className="text-sm">{label}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default CreateProductDialog;
