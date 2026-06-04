import { useEffect, useMemo, useState } from "react";
import {
  Package,
  MapPin,
  ChevronRight,
  Loader2,
  Save,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import {
  MaterialUpsertFields,
  type MaterialFormValues,
} from "@/components/materials/MaterialUpsertFields";
import { DETAIL_SHEET_CLASS } from "@/lib/detail-sheet-layout";
import {
  useMaterialDetail,
  useMaterialTransfersList,
  useUpdateMaterial,
  type MaterialDetailRow,
} from "@/hooks/use-materials-api";

const TRANSFER_TYPE_LABEL: Record<string, string> = {
  contract: "Hợp đồng",
  warranty: "Bảo hành",
  repair: "Sửa chữa",
};

const TRANSFER_STATUS_LABEL: Record<string, string> = {
  completed: "Hoàn thành",
  processing: "Đang XL",
  pending: "Chờ duyệt",
};

const FALLBACK_WAREHOUSES = [
  { value: "Kho chính", label: "Kho chính" },
  { value: "Kho phụ", label: "Kho phụ" },
];

const FALLBACK_UNITS = [
  { value: "bộ", label: "Bộ" },
  { value: "cái", label: "Cái" },
  { value: "mét", label: "Mét" },
  { value: "kg", label: "Kilogram" },
];

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const EmptyTab = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
    {text}
  </div>
);

interface MaterialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string | null;
  /** true = cùng layout xem chi tiết nhưng tab Tổng quan cho phép sửa */
  editable?: boolean;
}

const MaterialDetailDialog = ({
  open,
  onOpenChange,
  materialId,
  editable = false,
}: MaterialDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<MaterialFormValues>({
    code: "",
    name: "",
    type: "consumable",
    serial: "",
    quantity: 0,
    available: 0,
    unit: "bộ",
    warehouse: "Kho chính",
    description: "",
  });

  const updateMaterial = useUpdateMaterial();
  const { data: warehouseDefs } = useDefinitionsList("warehouse");
  const { data: unitDefs } = useDefinitionsList("material_unit");

  const warehouseOptions = useMemo(() => {
    const mapped = warehouseDefs?.map((d) => ({ value: d.code, label: d.label }));
    return mapped?.length ? mapped : FALLBACK_WAREHOUSES;
  }, [warehouseDefs]);

  const unitOptions = useMemo(() => {
    const mapped = unitDefs?.map((d) => ({ value: d.code, label: d.label }));
    return mapped?.length ? mapped : FALLBACK_UNITS;
  }, [unitDefs]);

  const { data: apiMaterial, isLoading, isError } = useMaterialDetail(materialId, {
    enabled: open && Boolean(materialId),
  });
  const { data: allTransfers = [] } = useMaterialTransfersList();

  const materialTransfers = useMemo(
    () => (materialId ? allTransfers.filter((t) => t.materialId === materialId) : []),
    [allTransfers, materialId],
  );

  const m = apiMaterial as MaterialDetailRow | null | undefined;

  useEffect(() => {
    if (!open) setActiveTab("general");
  }, [open]);

  useEffect(() => {
    if (!m || !editable) return;
    setEditForm({
      code: m.code,
      name: m.name,
      type: m.type,
      serial: m.serial ?? "",
      quantity: m.quantity,
      available: m.available,
      unit: m.unit,
      warehouse: m.warehouse,
      description: m.description ?? "",
    });
  }, [m, editable, materialId]);

  const displayQuantity = editable ? editForm.quantity : (m?.quantity ?? 0);
  const displayAvailable = editable ? editForm.available : (m?.available ?? 0);
  const usagePct =
    displayQuantity > 0
      ? Math.round(((displayQuantity - displayAvailable) / displayQuantity) * 100)
      : 0;

  const handleSave = async () => {
    if (!m || !materialId) return;
    if (!editForm.name.trim()) {
      toast.error("Nhập tên vật tư");
      return;
    }
    if (editForm.available > editForm.quantity) {
      toast.error("Khả dụng không được lớn hơn tổng số lượng");
      return;
    }
    setSubmitting(true);
    try {
      await updateMaterial.mutateAsync({
        id: materialId,
        payload: {
          name: editForm.name.trim(),
          type: editForm.type,
          serial: editForm.type === "identified" ? editForm.serial.trim() || null : null,
          quantity: editForm.quantity,
          available: editForm.available,
          unit: editForm.unit,
          warehouse: editForm.warehouse,
          description: editForm.description.trim() || undefined,
        },
      });
      toast.success("Đã cập nhật vật tư");
      onOpenChange(false);
    } catch (e) {
      toastApiError(e, "Không cập nhật được vật tư");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  if (!materialId) return null;

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className={`${DETAIL_SHEET_CLASS} flex items-center justify-center`}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải chi tiết vật tư…
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (isError || !m) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className={`${DETAIL_SHEET_CLASS} p-6`}>
          <p className="text-sm text-muted-foreground">Không tải được chi tiết vật tư.</p>
        </SheetContent>
      </Sheet>
    );
  }

  const typeLabel = m.type === "identified" ? "Định danh" : "Tiêu hao";
  const editTypeLabel = editForm.type === "identified" ? "Định danh" : "Tiêu hao";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={`${DETAIL_SHEET_CLASS} p-4 sm:p-6`}>
        <SheetHeader className="space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pr-8">
            <SheetTitle className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg leading-tight">
                    {editable ? `Chỉnh sửa: ${editForm.name || m.name}` : m.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {editable ? editTypeLabel : typeLabel}
                  </Badge>
                </div>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {m.code} • {editable ? editForm.unit : m.unit} • {editable ? editForm.warehouse : m.warehouse}
                </p>
              </div>
            </SheetTitle>
            {editable ? (
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
                  Hủy
                </Button>
                <Button size="sm" onClick={() => void handleSave()} disabled={submitting}>
                  <Save className="h-4 w-4 mr-1.5" />
                  {submitting ? "Đang lưu…" : "Lưu"}
                </Button>
              </div>
            ) : null}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-6 sm:w-full h-auto gap-0">
              <TabsTrigger value="general" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="location" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">
                Vị trí
              </TabsTrigger>
              <TabsTrigger value="transfers" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">
                Điều chuyển
              </TabsTrigger>
              <TabsTrigger value="products" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">
                Sản phẩm
              </TabsTrigger>
              <TabsTrigger value="warranty" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">
                BH & SC
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">
                Phân tích
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general" className="space-y-4 mt-3">
            {editable ? (
              <div className="space-y-4 rounded-xl border border-border/50 bg-card/50 p-4">
                <MaterialUpsertFields
                  values={editForm}
                  onChange={(patch) => setEditForm((s) => ({ ...s, ...patch }))}
                  warehouseOptions={warehouseOptions}
                  unitOptions={unitOptions}
                  codeReadOnly
                />
                <p className="text-xs text-muted-foreground">
                  Ngày tạo: {formatDisplayDate(m.createdAt)} • Đã cấp phát:{" "}
                  {Math.max(0, editForm.quantity - editForm.available).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {[
                  ["Mã vật tư", m.code],
                  ["Tên", m.name],
                  ["Loại", typeLabel],
                  ["Đơn vị", m.unit],
                  ["Kho", m.warehouse],
                  ["Tổng SL", m.quantity.toLocaleString()],
                  ["Khả dụng", m.available.toLocaleString()],
                  ["Đã cấp phát", (m.quantity - m.available).toLocaleString()],
                  ["Ngày tạo", formatDisplayDate(m.createdAt)],
                  ...(m.description ? [["Mô tả", m.description] as [string, string]] : []),
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">{label}</span>
                    <span className="font-medium text-foreground text-right">{value}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Tỷ lệ sử dụng</span>
                <span>{usagePct}%</span>
              </div>
              <Progress value={usagePct} className="h-2" />
            </div>
          </TabsContent>

          <TabsContent value="location" className="mt-3 space-y-3">
            <div className="rounded-xl border border-border/50 p-4 space-y-2 text-sm">
              <h4 className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Vị trí & tồn
              </h4>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kho hiện tại</span>
                <span className="font-medium">{editable ? editForm.warehouse : m.warehouse}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tổng lần điều chuyển</span>
                <span className="font-medium">{materialTransfers.length}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transfers" className="mt-3">
            {materialTransfers.length === 0 ? (
              <EmptyTab text="Chưa có phiếu điều chuyển cho vật tư này." />
            ) : (
              <div className="rounded-xl border border-border/50 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Ngày</TableHead>
                      <TableHead>Từ</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Đến</TableHead>
                      <TableHead className="text-center">SL</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>TT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialTransfers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium text-primary text-xs">{t.code}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDisplayDate(t.transferDate)}
                        </TableCell>
                        <TableCell className="text-xs">{t.fromWarehouse}</TableCell>
                        <TableCell>
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="text-xs">{t.destination}</TableCell>
                        <TableCell className="text-center font-semibold text-xs">{t.quantity}</TableCell>
                        <TableCell className="text-xs">{TRANSFER_TYPE_LABEL[t.type] ?? t.type}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {TRANSFER_STATUS_LABEL[t.status] ?? t.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-3">
            {(m.products ?? []).length === 0 ? (
              <EmptyTab text="Vật tư chưa gắn vào BOM sản phẩm nào." />
            ) : (
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã SP</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Phân loại</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(m.products ?? []).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium text-xs">{p.code}</TableCell>
                        <TableCell className="text-xs">{p.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.category ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="warranty" className="mt-3">
            <EmptyTab text="Lịch sử bảo hành / sửa chữa theo vật tư sẽ được bổ sung từ module Bảo hành." />
          </TabsContent>

          <TabsContent value="analytics" className="mt-3 space-y-3">
            <EmptyTab text="Tỷ lệ hỏng, MTBF và khấu hao chưa có dữ liệu từ hệ thống — xem báo cáo vật tư khi cần." />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default MaterialDetailDialog;
