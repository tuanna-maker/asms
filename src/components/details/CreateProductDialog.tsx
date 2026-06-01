import { useMemo, useState } from "react";
import { z } from "zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DefenseProduct, ProductSpecField, BOMItem } from "@/data/productsData";
import type { CreateProductPayload, ProductSpec, UpdateProductPayload } from "@/hooks/use-products-api";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import { useMaterialsList } from "@/hooks/use-materials-api";
import { useAttachWorkflow } from "@/hooks/use-workflows-api";
import { ProductWorkflowSection } from "@/components/products/ProductWorkflowSection";
import type { ProductStepPayloadRecord } from "@/lib/product-step-payload";
import { api } from "@/lib/api";
import { FileText, GitBranch, Layers, Plus, Trash2 } from "lucide-react";

const productStatusValues = [
  "developing",
  "producing",
  "produced",
  "inspection_submitted",
  "inspecting",
  "inspection_passed",
  "decision_approved",
  "equip_decided",
  "equipped",
  "stopped",
] as const;

type ProductStatus = (typeof productStatusValues)[number];

const productSchema = z.object({
  id: z.string().trim().regex(/^SP-\d{3,}$/, { message: "Mã SP phải có dạng SP-001" }).max(20),
  code: z.string().trim().nonempty({ message: "Mã quân sự là bắt buộc" }).max(50, { message: "Tối đa 50 ký tự" }),
  name: z.string().trim().nonempty({ message: "Tên sản phẩm là bắt buộc" }).max(150, { message: "Tối đa 150 ký tự" }),
  category: z.string().trim().min(1, { message: "Chọn phân loại" }),
  status: z.enum(productStatusValues),
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
  status: z.enum(productStatusValues).optional(),
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
  onCreate?: (product: DefenseProduct) => void;
  existingIds?: string[];
  apiMode?: boolean;
  onApiCreate?: (payload: CreateProductPayload) => Promise<{ id: string } | void>;
  existingCodes?: string[];
}

const initial = {
  id: "",
  code: "",
  name: "",
  category: "",
  status: "developing" as ProductStatus,
  version: "v1.0",
  unit: "",
  manufacturer: "",
  yearReleased: new Date().getFullYear(),
  totalProduced: 0,
  description: "",
};

function errMessage(e: unknown) {
  return getApiErrorMessage(e, "Có lỗi xảy ra");
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
  const [specs, setSpecs] = useState<ProductSpecField[]>([]);
  const [pendingBom, setPendingBom] = useState<BOMItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [addMaterialQty, setAddMaterialQty] = useState("1");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [stepPayloads, setStepPayloads] = useState<ProductStepPayloadRecord>({});
  const { toast } = useToast();
  const { data: materials = [] } = useMaterialsList();
  const attachWf = useAttachWorkflow();
  const categoryOptions = useDefinitionOptions("product_category");
  const statusOptions = useDefinitionOptions("product_status");

  const categorySelectOptions = useMemo(() => {
    const values = new Set(categoryOptions.map((o) => o.value));
    if (form.category && !values.has(form.category)) {
      return [{ value: form.category, label: form.category }, ...categoryOptions];
    }
    return categoryOptions;
  }, [categoryOptions, form.category]);

  const update = <K extends keyof typeof initial>(k: K, v: (typeof initial)[K]) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k as keyof FormErrors]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addSpec = () => {
    const next = `spec-${specs.length + 1}-${Date.now().toString(36)}`;
    setSpecs((prev) => [...prev, { key: next, label: "" }]);
  };

  const updateSpec = (idx: number, patch: Partial<ProductSpecField>) => {
    setSpecs((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeSpec = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const buildSpecsPayload = (): { ok: true; specs: ProductSpec[] } | { ok: false; message: string } => {
    const cleaned = specs
      .map((s) => ({ key: s.key.trim(), label: s.label.trim(), unit: s.unit?.trim() ?? "" }))
      .filter((s) => s.label.length > 0);
    const seen = new Set<string>();
    for (const spec of cleaned) {
      if (!spec.key) return { ok: false, message: "Mỗi thông số cần có mã (key)" };
      if (seen.has(spec.key)) return { ok: false, message: `Mã thông số trùng nhau: ${spec.key}` };
      seen.add(spec.key);
    }
    return {
      ok: true,
      specs: cleaned.map((s) => ({ key: s.key, label: s.label, ...(s.unit ? { unit: s.unit } : {}) })),
    };
  };

  const availableMaterials = useMemo(() => {
    const existing = new Set(pendingBom.map((b) => b.materialId));
    return materials.filter((m) => !existing.has(m.code));
  }, [materials, pendingBom]);

  const handleAddBom = () => {
    const material = materials.find((m) => m.id === selectedMaterialId);
    const qty = Number(addMaterialQty);
    if (!material || !Number.isFinite(qty) || qty <= 0) return;
    setPendingBom((prev) => [
      ...prev,
      {
        materialId: material.code,
        materialName: material.name,
        quantity: qty,
        unit: material.unit,
        ...(material.serial ? { serialNumbers: [material.serial] } : {}),
      },
    ]);
    setSelectedMaterialId("");
    setAddMaterialQty("1");
  };

  const resetForm = () => {
    setForm(initial);
    setErrors({});
    setSpecs([]);
    setPendingBom([]);
    setSelectedMaterialId("");
    setAddMaterialQty("1");
    setSelectedWorkflowId("");
    setStepPayloads({});
  };

  const afterApiCreate = async (productId: string) => {
    for (const item of pendingBom) {
      await api.post(`/api/v1/products/${encodeURIComponent(productId)}/bom`, {
        materialId: item.materialId,
        quantity: item.quantity,
        ...(item.serialNumbers?.length ? { serialNumbers: item.serialNumbers } : {}),
      });
    }
    if (selectedWorkflowId) {
      try {
        await attachWf.mutateAsync({
          moduleKey: "product",
          entityId: productId,
          workflowId: selectedWorkflowId,
        });
      } catch {
        /* backend có thể đã tự gắn quy trình mặc định khi tạo */
      }
    }
    if (Object.keys(stepPayloads).length > 0) {
      const patch: UpdateProductPayload = { stepPayloads };
      await api.put(`/api/v1/products/${encodeURIComponent(productId)}`, patch);
    }
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
      const specsResult = buildSpecsPayload();
      if (!specsResult.ok) {
        toast({ title: "Lỗi thông số", description: specsResult.message, variant: "destructive" });
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
          ...(specsResult.specs.length > 0 ? { specs: specsResult.specs } : {}),
        };
        const created = await onApiCreate(payload);
        const productId =
          created && typeof created === "object" && "id" in created
            ? created.id
            : undefined;
        if (productId) {
          await afterApiCreate(productId);
        }
        toast({ title: "Đã tạo sản phẩm", description: `${result.data.code} — ${result.data.name}` });
        resetForm();
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
    const specsResult = buildSpecsPayload();
    if (!specsResult.ok) {
      toast({ title: "Lỗi thông số", description: specsResult.message, variant: "destructive" });
      return;
    }
    const newProduct: DefenseProduct = {
      id: d.id,
      code: d.code,
      name: d.name,
      category: d.category,
      status: d.status as DefenseProduct["status"],
      version: d.version,
      unit: d.unit,
      manufacturer: d.manufacturer,
      yearReleased: d.yearReleased,
      totalProduced: d.totalProduced,
      description: d.description || "",
      bom: pendingBom,
      specs: specsResult.specs.map((s) => ({
        key: s.key,
        label: s.label,
        ...(s.unit ? { unit: s.unit } : {}),
      })),
    };
    onCreate(newProduct);
    toast({ title: "Đã tạo sản phẩm", description: `${newProduct.id} - ${newProduct.name}` });
    resetForm();
    onOpenChange(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl">Tạo sản phẩm quốc phòng</SheetTitle>
          <SheetDescription>
            {apiMode
              ? "Nhập thông tin giống màn chỉnh sửa. Mã hệ thống do máy chủ cấp sau khi lưu."
              : "Nhập mã SP và thông tin tổng quan. BOM có thể thêm ở tab Linh kiện."}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className={`grid w-full h-auto ${apiMode ? "grid-cols-4" : "grid-cols-2"}`}>
            <TabsTrigger value="overview">
              <FileText className="h-4 w-4 mr-2 shrink-0" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="specs">
              <Layers className="h-4 w-4 mr-2 shrink-0" />
              Thông số ({specs.length})
            </TabsTrigger>
            {apiMode ? (
              <TabsTrigger value="bom">
                <Layers className="h-4 w-4 mr-2 shrink-0" />
                Linh kiện ({pendingBom.length})
              </TabsTrigger>
            ) : null}
            {apiMode ? (
              <TabsTrigger value="workflow">
                <GitBranch className="h-4 w-4 mr-2 shrink-0" />
                Quy trình
              </TabsTrigger>
            ) : null}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                  <Textarea
                    rows={4}
                    placeholder="Mô tả ngắn về sản phẩm..."
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                    maxLength={500}
                  />
                  {errors.description ? (
                    <p className="text-xs text-destructive mt-1">{errors.description}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {!apiMode ? (
                    <Field label="Mã SP *" error={errors.id}>
                      <Input
                        placeholder="SP-009"
                        value={form.id}
                        onChange={(e) => update("id", e.target.value.toUpperCase())}
                        maxLength={20}
                      />
                    </Field>
                  ) : null}
                  <Field label="Mã quân sự *" error={errors.code}>
                    <Input
                      placeholder="VTĐ-RF300/QP"
                      value={form.code}
                      onChange={(e) => update("code", e.target.value)}
                      maxLength={50}
                      className="font-mono"
                    />
                  </Field>
                  <Field label="Tên sản phẩm *" error={errors.name} className="sm:col-span-2">
                    <Input
                      placeholder="Máy thu phát vô tuyến..."
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      maxLength={150}
                    />
                  </Field>
                  <Field label="Phiên bản" error={errors.version}>
                    <Input
                      placeholder="v1.0"
                      value={form.version}
                      onChange={(e) => update("version", e.target.value)}
                      maxLength={20}
                    />
                  </Field>
                  <Field label="Phân loại *" error={errors.category}>
                    <Select value={form.category} onValueChange={(v) => update("category", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn phân loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorySelectOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Trạng thái" error={errors.status}>
                    <Select
                      value={form.status}
                      onValueChange={(v) => update("status", v as ProductStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((row) => (
                          <SelectItem key={row.value} value={row.value}>
                            {row.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Năm phát hành" error={errors.yearReleased}>
                    <Input
                      type="number"
                      min={1900}
                      max={2100}
                      value={form.yearReleased}
                      onChange={(e) => update("yearReleased", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Đơn vị sử dụng" error={errors.unit}>
                    <Input
                      placeholder="Bộ TL Thông tin"
                      value={form.unit}
                      onChange={(e) => update("unit", e.target.value)}
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Nhà sản xuất" error={errors.manufacturer}>
                    <Input
                      placeholder="Nhà máy Z181"
                      value={form.manufacturer}
                      onChange={(e) => update("manufacturer", e.target.value)}
                      maxLength={100}
                    />
                  </Field>
                  <Field label="Đã sản xuất" error={errors.totalProduced}>
                    <Input
                      type="number"
                      min={0}
                      value={form.totalProduced}
                      onChange={(e) => update("totalProduced", Number(e.target.value))}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Khai báo các trường thông số kỹ thuật (Tên thông số). Giá trị thực tế sẽ được điền theo từng hợp đồng.
                </p>
                {specs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Chưa có thông số nào. Bấm &quot;Thêm thông số&quot; để khai báo.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_auto] gap-2 text-xs text-muted-foreground px-1">
                      <span>Mã (key)</span>
                      <span>Tên thông số</span>
                      <span>Đơn vị</span>
                      <span />
                    </div>
                    {specs.map((s, idx) => (
                      <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
                        <Input
                          value={s.key}
                          placeholder="vd: chieu-cao"
                          onChange={(e) => updateSpec(idx, { key: e.target.value })}
                        />
                        <Input
                          value={s.label}
                          placeholder="vd: Chiều cao"
                          onChange={(e) => updateSpec(idx, { label: e.target.value })}
                        />
                        <Input
                          value={s.unit ?? ""}
                          placeholder="cm, kg..."
                          onChange={(e) => updateSpec(idx, { unit: e.target.value })}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          type="button"
                          className="text-destructive"
                          onClick={() => removeSpec(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                  <Plus className="h-4 w-4 mr-1" /> Thêm thông số
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {apiMode ? (
          <TabsContent value="bom" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Danh sách linh kiện cấu thành (BOM). Có thể thêm trước khi lưu — sẽ gắn vào sản phẩm sau khi tạo.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã VT</TableHead>
                      <TableHead>Tên linh kiện</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead>ĐVT</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingBom.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-6 text-sm">
                          Chưa có linh kiện.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingBom.map((item) => (
                        <TableRow key={item.materialId}>
                          <TableCell className="font-mono font-semibold text-primary">{item.materialId}</TableCell>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              type="button"
                              onClick={() =>
                                setPendingBom((prev) => prev.filter((b) => b.materialId !== item.materialId))
                              }
                            >
                              Xóa
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {apiMode ? (
                  <div className="mt-4 rounded-lg border border-border p-3">
                    <p className="text-sm font-medium mb-3">Thêm linh kiện từ kho vật tư</p>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2">
                      <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn vật tư" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.code} - {m.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        value={addMaterialQty}
                        onChange={(e) => setAddMaterialQty(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddBom}>
                        Thêm
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
          ) : null}

          {apiMode ? (
            <TabsContent value="workflow" className="mt-4 space-y-4">
              <ProductWorkflowSection
                open={open}
                productDbId={null}
                isCreateMode
                detailWorkflow={null}
                selectedWorkflowId={selectedWorkflowId}
                onSelectedWorkflowIdChange={setSelectedWorkflowId}
                stepPayloads={stepPayloads}
                onStepPayloadsChange={setStepPayloads}
              />
            </TabsContent>
          ) : null}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border/50 mt-4 sticky bottom-0 bg-background pb-2">
          <Button variant="outline" type="button" onClick={() => handleClose(false)}>
            Hủy
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? "Đang lưu…" : "Tạo sản phẩm"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const Field = ({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`space-y-1.5 ${className ?? ""}`}>
    <p className="text-xs text-muted-foreground">{label}</p>
    {children}
    {error ? <p className="text-xs text-destructive">{error}</p> : null}
  </div>
);

export default CreateProductDialog;
