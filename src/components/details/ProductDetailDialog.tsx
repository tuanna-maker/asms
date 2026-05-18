import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, FileText, Layers, FileBox, Download, Plus, GraduationCap, Calendar, Clock, MapPin, Users as UsersIcon, History, User, Trash2 } from "lucide-react";
import { DefenseProduct, BOMItem, productCategoryColors, ProductSpecField } from "@/data/productsData";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import { useNavigate } from "react-router-dom";
import ProductImageGallery from "./ProductImageGallery";
import type { UpdateProductPayload } from "@/hooks/use-products-api";
import { useMaterialsList } from "@/hooks/use-materials-api";
import { useAuditLogs } from "@/hooks/use-audit-logs-api";
import { useDeleteDocument, useUploadDocument } from "@/hooks/use-documents-api";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  product: DefenseProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateBomQuantity?: (productId: string, materialId: string, quantity: number) => Promise<void>;
  onRemoveBom?: (productId: string, materialId: string) => Promise<void>;
  onAddBom?: (productId: string, item: BOMItem) => Promise<void>;
  editable?: boolean;
  onSaveEdits?: (id: string, payload: UpdateProductPayload) => Promise<void>;
}

const statusMap: Record<string, { label: string; cls: string }> = {
  developing: { label: "Đang phát triển", cls: "bg-warning/10 text-warning border-warning/30" },
  producing: { label: "Đang sản xuất", cls: "bg-info/10 text-info border-info/30" },
  produced: { label: "Sản xuất xong", cls: "bg-info/10 text-info border-info/30" },
  inspection_submitted: { label: "Đã trình nghiệm thu", cls: "bg-warning/10 text-warning border-warning/30" },
  inspecting: { label: "Đang nghiệm thu", cls: "bg-warning/10 text-warning border-warning/30" },
  inspection_passed: { label: "Nghiệm thu xong", cls: "bg-success/10 text-success border-success/30" },
  decision_approved: { label: "QĐ phê duyệt KQ", cls: "bg-success/10 text-success border-success/30" },
  equip_decided: { label: "Có QĐ trang bị", cls: "bg-success/10 text-success border-success/30" },
  equipped: { label: "Đã trang bị", cls: "bg-success/10 text-success border-success/30" },
  stopped: { label: "Dừng SX", cls: "bg-muted text-muted-foreground border-border" },
};

const defaultStatusBadge = { label: "Không xác định", cls: "bg-muted text-muted-foreground border-border" };
type ApiSuccess<T> = { success: true; data: T; message?: string };
type ApiProductDetail = {
  id: string;
  code: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
  contracts?: Array<{
    id: string;
    code: string;
    title: string;
    quantity: number;
    trainings: Array<{
      id: string;
      code: string;
      title: string;
      startDate: string;
      endDate: string;
      participants: number;
      status: "planned" | "ongoing" | "completed" | "cancelled";
      location: string | null;
      trainer: string;
    }>;
  }>;
};
type ProductDocumentRow = {
  id: string;
  code: string;
  name: string;
  fileType: "pdf" | "doc" | "xls" | "img" | "other";
  fileSize: string | null;
  fileUrl: string | null;
  uploadedAt: string;
  owner: { id: string; fullName: string } | null;
};

const ProductDetailDialog = ({ product, open, onOpenChange, onUpdateBomQuantity, onRemoveBom, onAddBom, editable = false, onSaveEdits }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { data: materials = [] } = useMaterialsList();
  const categoryOptions = useDefinitionOptions("product_category");
  const statusOptions = useDefinitionOptions("product_status");
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const categorySelectOptions = useMemo(() => {
    const values = new Set(categoryOptions.map((o) => o.value));
    if (category && !values.has(category)) {
      return [{ value: category, label: category }, ...categoryOptions];
    }
    return categoryOptions;
  }, [category, categoryOptions]);
  const [status, setStatus] = useState<DefenseProduct["status"]>("developing");
  const [version, setVersion] = useState("");
  const [unit, setUnit] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [yearReleased, setYearReleased] = useState(new Date().getFullYear());
  const [totalProduced, setTotalProduced] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [addMaterialQty, setAddMaterialQty] = useState("1");
  const [bomQuantities, setBomQuantities] = useState<Record<string, string>>({});
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [specsDraft, setSpecsDraft] = useState<ProductSpecField[]>([]);

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
    const qtyMap: Record<string, string> = {};
    for (const item of product.bom) {
      qtyMap[item.materialId] = String(item.quantity);
    }
    setBomQuantities(qtyMap);
    setSpecsDraft(
      (product.specs ?? []).map((s) => ({
        key: s.key,
        label: s.label,
        ...(s.unit ? { unit: s.unit } : {}),
      })),
    );
  }, [open, product]);

  const { data: productDocuments = [], isLoading: isDocumentsLoading, isFetching: isDocumentsFetching } = useQuery({
    queryKey: ["product-documents", product?.id],
    enabled: open && !!product?.id,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ProductDocumentRow[]>>(`/api/v1/documents?productId=${encodeURIComponent(product!.id)}`);
      return res.data.data ?? [];
    },
  });
  const { data: productDetail } = useQuery({
    queryKey: ["product-detail", product?.id],
    enabled: open && !!product?.id,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ApiProductDetail>>(`/api/v1/products/${encodeURIComponent(product!.id)}`);
      return res.data.data;
    },
  });

  const statusBadge = statusMap[editable ? status : product?.status ?? "developing"] ?? defaultStatusBadge;

  const handleSave = async () => {
    if (!product || !editable || !onSaveEdits) return;
    if (!name.trim() || !category.trim()) {
      toast.error("Vui lòng nhập tên và phân loại sản phẩm");
      return;
    }
    const cleanedSpecs = specsDraft
      .map((s) => ({
        key: s.key.trim(),
        label: s.label.trim(),
        unit: s.unit?.trim() ?? "",
      }))
      .filter((s) => s.label.length > 0);
    const seen = new Set<string>();
    for (const spec of cleanedSpecs) {
      if (!spec.key) {
        toast.error("Mỗi thông số cần có mã (key)");
        return;
      }
      if (seen.has(spec.key)) {
        toast.error(`Mã thông số trùng nhau: ${spec.key}`);
        return;
      }
      seen.add(spec.key);
    }
    setSubmitting(true);
    try {
      await onSaveEdits(product.id, {
        name: name.trim(),
        category: category.trim(),
        status,
        version: version.trim() || undefined,
        unit: unit.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        yearReleased,
        totalProduced,
        description: description.trim() || undefined,
        specs: cleanedSpecs.map((s) => ({
          key: s.key,
          label: s.label,
          ...(s.unit ? { unit: s.unit } : {}),
        })),
      });
      if (onUpdateBomQuantity) {
        for (const item of product.bom) {
          const nextQty = Number(bomQuantities[item.materialId] ?? item.quantity);
          if (Number.isFinite(nextQty) && nextQty > 0 && nextQty !== item.quantity) {
            await onUpdateBomQuantity(product.id, item.materialId, nextQty);
          }
        }
      }
      toast.success("Đã cập nhật sản phẩm");
      onOpenChange(false);
    } catch {
      toast.error("Không cập nhật được sản phẩm");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBom = async () => {
    if (!product || !onAddBom) return;
    const material = materials.find((m) => m.id === selectedMaterialId);
    const qty = Number(addMaterialQty);
    if (!material || !Number.isFinite(qty) || qty <= 0) return;
    try {
      await onAddBom(product.id, {
        materialId: material.code,
        materialName: material.name,
        quantity: qty,
        unit: material.unit,
        ...(material.serial ? { serialNumbers: [material.serial] } : {}),
      });
      setSelectedMaterialId("");
      setAddMaterialQty("1");
      toast.success("Đã thêm linh kiện vào BOM");
    } catch {
      toast.error("Không thêm được linh kiện");
    }
  };

  const handleRemoveBom = async (materialId: string) => {
    if (!product || !onRemoveBom) return;
    try {
      await onRemoveBom(product.id, materialId);
      toast.success("Đã xóa linh kiện khỏi BOM");
    } catch {
      toast.error("Không xóa được linh kiện");
    }
  };

  const toDocType = (file: File): "pdf" | "doc" | "xls" | "img" | "other" => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (["doc", "docx"].includes(ext)) return "doc";
    if (["xls", "xlsx", "csv"].includes(ext)) return "xls";
    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "img";
    return "other";
  };

  const handleUploadDocument = async () => {
    if (!product || !docName.trim() || !docFile) return;
    try {
      await uploadDocument.mutateAsync({
        file: docFile,
        productId: product.id,
        ownerId: user?.id,
        name: docName.trim(),
        categoryCode: "technical",
        fileType: toDocType(docFile),
      });
      await queryClient.invalidateQueries({ queryKey: ["product-documents", product.id] });
      setDocName("");
      setDocFile(null);
      toast.success("Đã thêm tài liệu");
    } catch {
      toast.error("Không thể thêm tài liệu");
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!product) return;
    try {
      await deleteDocument.mutateAsync(docId);
      await queryClient.invalidateQueries({ queryKey: ["product-documents", product.id] });
      toast.success("Đã xóa tài liệu");
    } catch {
      toast.error("Không thể xóa tài liệu");
    }
  };

  const availableMaterials = useMemo(() => {
    const existingMaterialIds = new Set((product?.bom ?? []).map((item) => item.materialId));
    return materials.filter((material) => !existingMaterialIds.has(material.code));
  }, [materials, product?.bom]);
  const productContracts = useMemo(() => productDetail?.contracts ?? [], [productDetail?.contracts]);
  const { data: productAudit } = useAuditLogs(
    { entity: "product", entityId: product?.id ?? "", pageSize: 30 },
    open && Boolean(product?.id),
  );

  const historyEvents = useMemo(() => {
    if (!product) return [];
    const events: Array<{ id: string; user: string; at: string; title: string; description?: string }> = [];
    for (const row of productAudit?.rows ?? []) {
      events.push({
        id: `audit-${row.id}`,
        user: row.actorName ?? row.actorEmail ?? "Hệ thống",
        at: row.createdAt,
        title: row.summary ?? row.action,
      });
    }
    if (productDetail?.createdAt) {
      events.push({
        id: "created",
        user: "Hệ thống",
        at: productDetail.createdAt,
        title: "Tạo sản phẩm",
        description: `${product.code} - ${product.name}`,
      });
    }
    if (productDetail?.updatedAt && productDetail.updatedAt !== productDetail.createdAt) {
      events.push({
        id: "updated",
        user: "Hệ thống",
        at: productDetail.updatedAt,
        title: "Cập nhật sản phẩm",
      });
    }
    for (const doc of productDocuments) {
      events.push({
        id: `doc-${doc.id}`,
        user: doc.owner?.fullName ?? "Không rõ",
        at: doc.uploadedAt,
        title: "Tải lên tài liệu",
        description: doc.name,
      });
    }
    return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [product, productDetail, productDocuments, productAudit?.rows]);

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pr-8">
            <div className="space-y-1 text-left">
              <SheetTitle className="text-xl">{editable ? `Chỉnh sửa ${product.name}` : product.name}</SheetTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="font-mono font-semibold text-primary">{product.id}</span>
                <span>•</span>
                <span className="font-mono">{product.code}</span>
                <span>•</span>
                <span>v{product.version}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={productCategoryColors[product.category]}>{product.category}</Badge>
              <Badge variant="outline" className={statusBadge.cls}>{statusBadge.label}</Badge>
              {editable ? (
                <Button size="sm" onClick={() => void handleSave()} disabled={submitting}>
                  {submitting ? "Đang lưu..." : "Lưu"}
                </Button>
              ) : null}
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-2">
          <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full h-auto">
            <TabsTrigger value="overview"><FileText className="h-4 w-4 mr-2" />Tổng quan</TabsTrigger>
            <TabsTrigger value="bom"><Layers className="h-4 w-4 mr-2" />Linh kiện ({product.bom.length})</TabsTrigger>
            <TabsTrigger value="specs"><Cpu className="h-4 w-4 mr-2" />Thông số</TabsTrigger>
            <TabsTrigger value="documents"><FileBox className="h-4 w-4 mr-2" />Tài liệu</TabsTrigger>
            <TabsTrigger value="training"><GraduationCap className="h-4 w-4 mr-2" />Đào tạo</TabsTrigger>
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2" />Lịch sử</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                  {editable ? (
                    <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
                  ) : (
                    <p className="text-sm leading-relaxed">{product.description || "—"}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <ProductImageGallery productId={product.id} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoCard label="Mã SP" value={product.id} mono />
              <InfoCard label="Mã quân sự" value={product.code} mono />
              {editable ? (
                <>
                  <EditableInfoCard label="Tên sản phẩm">
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </EditableInfoCard>
                  <EditableInfoCard label="Phiên bản">
                    <Input value={version} onChange={(e) => setVersion(e.target.value)} />
                  </EditableInfoCard>
                  <EditableInfoCard label="Phân loại">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue placeholder="Chọn phân loại" /></SelectTrigger>
                      <SelectContent>
                        {categorySelectOptions.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditableInfoCard>
                  <EditableInfoCard label="Trạng thái">
                    <Select value={status} onValueChange={(v) => setStatus(v as DefenseProduct["status"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((row) => (
                          <SelectItem key={row.value} value={row.value}>{row.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </EditableInfoCard>
                  <EditableInfoCard label="Năm phát hành">
                    <Input type="number" min={1900} max={2100} value={yearReleased} onChange={(e) => setYearReleased(Number(e.target.value) || new Date().getFullYear())} />
                  </EditableInfoCard>
                  <EditableInfoCard label="Đơn vị sử dụng">
                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
                  </EditableInfoCard>
                  <EditableInfoCard label="Nhà sản xuất">
                    <Input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
                  </EditableInfoCard>
                  <EditableInfoCard label="Đã sản xuất">
                    <Input type="number" min={0} value={totalProduced} onChange={(e) => setTotalProduced(Number(e.target.value) || 0)} />
                  </EditableInfoCard>
                </>
              ) : (
                <>
                  <InfoCard label="Phiên bản" value={product.version} />
                  <InfoCard label="Phân loại" value={product.category} />
                  <InfoCard label="Trạng thái" value={(statusMap[product.status] ?? defaultStatusBadge).label} />
                  <InfoCard label="Năm phát hành" value={product.yearReleased.toString()} />
                  <InfoCard label="Đơn vị sử dụng" value={product.unit} />
                  <InfoCard label="Nhà sản xuất" value={product.manufacturer} />
                  <InfoCard label="Đã sản xuất" value={`${product.totalProduced.toLocaleString()} sp`} />
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bom" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Danh sách linh kiện cấu thành (BOM). Click mã linh kiện để xem chi tiết trong module Vật tư.
                </p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã VT</TableHead>
                      <TableHead>Tên linh kiện</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead>ĐVT</TableHead>
                      {editable ? <TableHead className="text-right">Thao tác</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.bom.map((item) => {
                      return (
                        <TableRow key={item.materialId}>
                          <TableCell
                            className="font-mono font-semibold text-primary cursor-pointer hover:underline"
                            onClick={() => { onOpenChange(false); navigate("/vat-tu"); }}
                          >
                            {item.materialId}
                          </TableCell>
                          <TableCell>{item.materialName}</TableCell>
                          <TableCell>
                            {(item.serialNumbers?.length ?? 0) > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {item.serialNumbers!.slice(0, 2).map((sn) => (
                                  <Badge key={sn} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                    {sn}
                                  </Badge>
                                ))}
                                {(item.serialNumbers?.length ?? 0) > 2 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    +{(item.serialNumbers?.length ?? 0) - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Chưa gán</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {editable ? (
                              <Input
                                className="h-8 w-20 ml-auto text-right"
                                type="number"
                                min={1}
                                value={bomQuantities[item.materialId] ?? String(item.quantity)}
                                onChange={(e) => setBomQuantities((prev) => ({ ...prev, [item.materialId]: e.target.value }))}
                              />
                            ) : (
                              item.quantity
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                          {editable ? (
                            <TableCell className="text-right">
                              <Button size="sm" variant="destructive" onClick={() => void handleRemoveBom(item.materialId)}>
                                Xóa
                              </Button>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {editable ? (
                  <div className="mt-4 rounded-lg border border-border p-3">
                    <p className="text-sm font-medium mb-3">Thêm linh kiện từ kho vật tư</p>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2">
                      <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                        <SelectTrigger><SelectValue placeholder="Chọn vật tư" /></SelectTrigger>
                        <SelectContent>
                          {availableMaterials.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.code} - {m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" min={1} value={addMaterialQty} onChange={(e) => setAddMaterialQty(e.target.value)} />
                      <Button onClick={() => void handleAddBom()}>Thêm</Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  Khai báo các trường thông số kỹ thuật (Tên thông số). Giá trị thực tế sẽ được điền theo từng hợp đồng.
                </p>
                {editable ? (
                  <div className="space-y-2">
                    {specsDraft.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                        Chưa có thông số nào. Bấm "Thêm thông số" để khai báo.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_auto] gap-2 text-xs text-muted-foreground px-1">
                          <span>Mã (key)</span>
                          <span>Tên thông số</span>
                          <span>Đơn vị</span>
                          <span></span>
                        </div>
                        {specsDraft.map((spec, idx) => (
                          <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_auto] gap-2 items-center">
                            <Input
                              value={spec.key}
                              placeholder="vd: chieu-cao"
                              onChange={(e) =>
                                setSpecsDraft((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, key: e.target.value } : s)),
                                )
                              }
                            />
                            <Input
                              value={spec.label}
                              placeholder="vd: Chiều cao"
                              onChange={(e) =>
                                setSpecsDraft((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, label: e.target.value } : s)),
                                )
                              }
                            />
                            <Input
                              value={spec.unit ?? ""}
                              placeholder="cm, kg..."
                              onChange={(e) =>
                                setSpecsDraft((prev) =>
                                  prev.map((s, i) => (i === idx ? { ...s, unit: e.target.value } : s)),
                                )
                              }
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => setSpecsDraft((prev) => prev.filter((_, i) => i !== idx))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = `spec-${specsDraft.length + 1}-${Date.now().toString(36)}`;
                        setSpecsDraft((prev) => [...prev, { key: next, label: "" }]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Thêm thông số
                    </Button>
                  </div>
                ) : product.specs.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                    Sản phẩm chưa khai báo thông số.
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/60">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên thông số</TableHead>
                          <TableHead>Đơn vị</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {product.specs.map((s) => (
                          <TableRow key={s.key}>
                            <TableCell className="font-mono text-xs text-muted-foreground">{s.key}</TableCell>
                            <TableCell className="text-sm">{s.label}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{s.unit ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {productDocuments.length === 0 ? (
                  isDocumentsLoading ? (
                    <div className="space-y-2">
                      <div className="h-16 rounded-lg border border-border/60 bg-muted/40 animate-pulse" />
                      <div className="h-16 rounded-lg border border-border/60 bg-muted/40 animate-pulse" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4">
                      Chưa có tài liệu cho sản phẩm này.
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {isDocumentsFetching ? <p className="text-xs text-muted-foreground">Đang đồng bộ danh sách tài liệu...</p> : null}
                    {productDocuments.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{d.name}</p>
                          <p className="text-xs text-muted-foreground">{d.fileType.toUpperCase()}{d.fileSize ? ` • ${d.fileSize}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {d.fileUrl ? (
                            <a href={d.fileUrl} target="_blank" rel="noreferrer">
                              <Button size="sm" variant="outline"><Download className="h-3.5 w-3.5 mr-1" />Tải</Button>
                            </a>
                          ) : null}
                          {editable ? (
                            <Button size="sm" variant="destructive" onClick={() => void handleDeleteDocument(d.id)} disabled={deleteDocument.isPending}>
                              Xóa
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {editable ? (
                  <div className="mt-4 rounded-lg border border-border/60 bg-card p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-card-foreground">Thêm tài liệu đính kèm</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Tên tài liệu</p>
                        <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Ví dụ: HDSD sản phẩm" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">File đính kèm</p>
                        <Input type="file" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => void handleUploadDocument()} disabled={uploadDocument.isPending || deleteDocument.isPending}>
                        {uploadDocument.isPending ? "Đang thêm..." : "Thêm tài liệu"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Các khóa đào tạo, huấn luyện vận hành và bảo trì sản phẩm.
                </p>
                {productContracts.length > 0 ? (
                  <div className="space-y-4">
                    {productContracts.map((contract) => (
                      <div key={contract.id} className="rounded-xl border border-border bg-muted/20 p-4">
                        <p className="text-sm font-semibold text-card-foreground">
                          {contract.title} <span className="text-muted-foreground">({contract.code})</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Số lượng trong hợp đồng: {contract.quantity}
                        </p>
                        {contract.trainings.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border/60 bg-background/60 p-3 text-xs text-muted-foreground">
                            Hợp đồng này chưa có khóa đào tạo.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {contract.trainings.map((course) => {
                              const statusCls =
                                course.status === "completed"
                                  ? "bg-success/10 text-success border-success/30"
                                  : course.status === "planned" || course.status === "ongoing"
                                  ? "bg-info/10 text-info border-info/30"
                                  : "bg-muted text-muted-foreground border-border";
                              const statusLabel =
                                course.status === "completed"
                                  ? "Đã hoàn thành"
                                  : course.status === "planned"
                                  ? "Sắp diễn ra"
                                  : course.status === "ongoing"
                                  ? "Đang diễn ra"
                                  : "Đã hủy";
                              const start = new Date(course.startDate);
                              const end = new Date(course.endDate);
                              const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1);
                              return (
                                <div key={course.id} className="rounded-lg border border-border bg-background/60 p-4 space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="flex items-start gap-2">
                                      <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                      <div>
                                        <p className="font-medium text-sm">{course.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Giảng viên: {course.trainer}</p>
                                      </div>
                                    </div>
                                    <Badge variant="outline" className={`${statusCls} text-xs shrink-0`}>{statusLabel}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border text-xs">
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      {start.toLocaleDateString("vi-VN")}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <Clock className="h-3 w-3" />
                                      {durationDays} ngày
                                    </div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                      <UsersIcon className="h-3 w-3" />
                                      {course.participants} học viên
                                    </div>
                                    {course.location ? (
                                      <div className="flex items-center gap-1.5 text-muted-foreground truncate" title={course.location}>
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{course.location}</span>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/60 bg-background/60 p-4 text-sm text-muted-foreground">
                    Sản phẩm này chưa được gắn hợp đồng nào, nên chưa có dữ liệu đào tạo.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Nhật ký các lần cập nhật thông tin sản phẩm.
                </p>
                <div className="space-y-4">
                  {historyEvents.length === 0 ? (
                    <div className="text-sm text-muted-foreground rounded-lg border border-dashed border-border p-4">
                      Chưa có dữ liệu lịch sử.
                    </div>
                  ) : historyEvents.map((entry, idx) => (
                    <div key={entry.id} className="relative pl-6 pb-4 border-l-2 border-border last:border-l-transparent last:pb-0">
                      <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{entry.user}</span>
                          {idx === 0 && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] px-1.5 py-0">
                              Mới nhất
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.at).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-muted/30 p-3">
                        <p className="text-sm font-medium text-card-foreground">{entry.title}</p>
                        {entry.description ? <p className="text-xs text-muted-foreground mt-1">{entry.description}</p> : null}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

const InfoCard = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <Card>
    <CardContent className="pt-4 pb-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-sm font-medium ${mono ? "font-mono text-primary" : ""}`}>{value}</p>
    </CardContent>
  </Card>
);

const EditableInfoCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Card>
    <CardContent className="pt-4 pb-4 space-y-1.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </CardContent>
  </Card>
);

export default ProductDetailDialog;
