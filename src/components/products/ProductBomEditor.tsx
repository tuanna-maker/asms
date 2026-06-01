import { Fragment, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ManageSerialNumbersDialog from "@/components/details/ManageSerialNumbersDialog";
import type { BOMItem } from "@/data/productsData";
import { useDefinitionOptions } from "@/hooks/use-definition-options";
import { useRole } from "@/hooks/use-role";
import {
  useDeleteProductBom,
  useUpdateProductBom,
  useUpsertProductBom,
  type ProductListItem,
} from "@/hooks/use-products-api";
import {
  useMaterialDetail,
  useMaterialsList,
  useUpdateMaterial,
  type MaterialListRow,
} from "@/hooks/use-materials-api";
import { qk } from "@/lib/query-keys";

export type ProductBomLine = NonNullable<ProductListItem["bom"]>[number];

const FALLBACK_WAREHOUSES = [
  { value: "Kho chính", label: "Kho chính" },
  { value: "Kho phụ", label: "Kho phụ" },
];
const FALLBACK_UNITS = [
  { value: "bộ", label: "Bộ" },
  { value: "cái", label: "Cái" },
];

export type ProductBomEditorProps = {
  productId: string;
  bom: ProductBomLine[];
  editable: boolean;
  /** immediate: nút Lưu BOM; batch: parent lưu khi submit sản phẩm */
  bomSaveMode?: "immediate" | "batch";
  bomQuantities?: Record<string, string>;
  onBomQuantitiesChange?: (map: Record<string, string>) => void;
  showMaterialAttributes?: boolean;
  contextBanner?: string;
  onBomUpdated?: () => void;
};

function buildQtyMap(bom: ProductBomLine[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of bom) {
    map[item.materialId] = String(item.quantity);
  }
  return map;
}

function MaterialAttributesPanel({
  materialDbId,
  materialCode,
  readOnly,
  onSaved,
}: {
  materialDbId: string;
  materialCode: string;
  readOnly: boolean;
  onSaved: () => void;
}) {
  const { data: detail, isLoading } = useMaterialDetail(materialDbId, { enabled: Boolean(materialDbId) });
  const updateMaterial = useUpdateMaterial();
  const warehouseOptions = useDefinitionOptions("warehouse");
  const unitOptions = useDefinitionOptions("material_unit");

  const whOpts = warehouseOptions.length ? warehouseOptions : FALLBACK_WAREHOUSES;
  const unitOpts = unitOptions.length ? unitOptions : FALLBACK_UNITS;

  const [form, setForm] = useState({
    type: "consumable" as MaterialListRow["type"],
    name: "",
    serial: "",
    quantity: 0,
    available: 0,
    unit: "bộ",
    warehouse: "Kho chính",
  });

  useEffect(() => {
    if (!detail) return;
    setForm({
      type: detail.type,
      name: detail.name,
      serial: detail.serial ?? "",
      quantity: detail.quantity,
      available: detail.available,
      unit: detail.unit,
      warehouse: detail.warehouse,
    });
  }, [detail]);

  const onSave = async () => {
    if (!detail) return;
    try {
      await updateMaterial.mutateAsync({
        id: materialDbId,
        payload: {
          name: form.name.trim(),
          type: form.type,
          serial: form.type === "identified" ? form.serial.trim() || null : null,
          quantity: Math.max(0, Number(form.quantity) || 0),
          available: Math.max(0, Number(form.available) || 0),
          unit: form.unit,
          warehouse: form.warehouse,
        },
      });
      toast.success(`Đã cập nhật vật tư ${materialCode}`);
      onSaved();
    } catch (e) { toastApiError(e, "Không cập nhật được thuộc tính vật tư");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải thuộc tính vật tư…
      </div>
    );
  }

  if (!detail) {
    return <p className="text-sm text-muted-foreground py-2">Không tải được thông tin vật tư.</p>;
  }

  if (readOnly) {
    return (
      <p className="text-xs text-muted-foreground py-2">
        Bạn không có quyền sửa kho vật tư. Mở module Vật tư để chỉnh sửa {materialCode}.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 py-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Loại</Label>
        <Select
          value={form.type}
          onValueChange={(v) => setForm((s) => ({ ...s, type: v as MaterialListRow["type"] }))}
        >
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="consumable">Tiêu hao</SelectItem>
            <SelectItem value="identified">Định danh</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs">Tên</Label>
        <Input className="h-9" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Serial</Label>
        <Input
          className="h-9"
          value={form.serial}
          disabled={form.type !== "identified"}
          onChange={(e) => setForm((s) => ({ ...s, serial: e.target.value }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Tổng SL kho</Label>
        <Input
          className="h-9"
          type="number"
          min={0}
          value={form.quantity}
          onChange={(e) => setForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Khả dụng</Label>
        <Input
          className="h-9"
          type="number"
          min={0}
          value={form.available}
          onChange={(e) => setForm((s) => ({ ...s, available: Number(e.target.value) }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Đơn vị</Label>
        <Select value={form.unit} onValueChange={(v) => setForm((s) => ({ ...s, unit: v }))}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitOpts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Kho</Label>
        <Select value={form.warehouse} onValueChange={(v) => setForm((s) => ({ ...s, warehouse: v }))}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {whOpts.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-2 lg:col-span-3 flex justify-end">
        <Button size="sm" onClick={() => void onSave()} disabled={updateMaterial.isPending}>
          {updateMaterial.isPending ? "Đang lưu…" : "Lưu thuộc tính VT"}
        </Button>
      </div>
    </div>
  );
}

export function ProductBomEditor({
  productId,
  bom,
  editable,
  bomSaveMode = "immediate",
  bomQuantities: controlledQty,
  onBomQuantitiesChange,
  showMaterialAttributes = false,
  contextBanner,
  onBomUpdated,
}: ProductBomEditorProps) {
  const queryClient = useQueryClient();
  const { canDo } = useRole();
  const canEditBom = editable && (canDo("hop-dong", "update") || canDo("san-pham", "update"));
  const canEditMaterial = editable && canDo("vat-tu", "update");

  const { data: materials = [] } = useMaterialsList();
  const updateBom = useUpdateProductBom();
  const upsertBom = useUpsertProductBom();
  const deleteBom = useDeleteProductBom();

  const [internalQty, setInternalQty] = useState<Record<string, string>>({});
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [addMaterialQty, setAddMaterialQty] = useState("1");
  const [savingBom, setSavingBom] = useState(false);
  const [snItem, setSnItem] = useState<BOMItem | null>(null);
  const [snOpen, setSnOpen] = useState(false);
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);

  const isBatch = bomSaveMode === "batch";
  const bomQuantities = isBatch && controlledQty !== undefined ? controlledQty : internalQty;
  const setBomQuantities = (next: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    const resolved = typeof next === "function" ? next(bomQuantities) : next;
    if (isBatch && onBomQuantitiesChange) onBomQuantitiesChange(resolved);
    else setInternalQty(resolved);
  };

  useEffect(() => {
    if (isBatch && controlledQty !== undefined) return;
    setInternalQty(buildQtyMap(bom));
  }, [bom, isBatch, controlledQty]);

  const invalidateBom = () => {
    void queryClient.invalidateQueries({ queryKey: qk.products.all });
    void queryClient.invalidateQueries({ queryKey: ["product-detail-for-contract", productId] });
    void queryClient.invalidateQueries({ queryKey: ["product-detail", productId] });
    onBomUpdated?.();
  };

  const existingMaterialIds = useMemo(() => new Set(bom.map((b) => b.materialId)), [bom]);
  const availableMaterials = useMemo(
    () => materials.filter((m) => !existingMaterialIds.has(m.code)),
    [materials, existingMaterialIds],
  );

  const hasQtyChanges = useMemo(() => {
    for (const item of bom) {
      const next = Number(bomQuantities[item.materialId] ?? item.quantity);
      if (Number.isFinite(next) && next > 0 && next !== item.quantity) return true;
    }
    return false;
  }, [bom, bomQuantities]);

  const handleSaveBomQuantities = async () => {
    if (!canEditBom) return;
    setSavingBom(true);
    try {
      for (const item of bom) {
        const nextQty = Number(bomQuantities[item.materialId] ?? item.quantity);
        if (!Number.isFinite(nextQty) || nextQty <= 0 || nextQty === item.quantity) continue;
        await updateBom.mutateAsync({
          id: productId,
          materialId: item.materialId,
          payload: { quantity: nextQty },
        });
      }
      toast.success("Đã lưu số lượng linh kiện");
      invalidateBom();
    } catch (e) { toastApiError(e, "Không lưu được BOM");
    } finally {
      setSavingBom(false);
    }
  };

  const handleAddBom = async () => {
    if (!canEditBom) return;
    const material = materials.find((m) => m.id === selectedMaterialId);
    const qty = Number(addMaterialQty);
    if (!material || !Number.isFinite(qty) || qty <= 0) {
      toast.error("Chọn vật tư và số lượng hợp lệ");
      return;
    }
    try {
      await upsertBom.mutateAsync({
        id: productId,
        payload: {
          materialId: material.code,
          quantity: qty,
          ...(material.serial ? { serialNumbers: [material.serial] } : {}),
        },
      });
      setSelectedMaterialId("");
      setAddMaterialQty("1");
      toast.success("Đã thêm linh kiện vào BOM");
      invalidateBom();
    } catch (e) { toastApiError(e, "Không thêm được linh kiện");
    }
  };

  const handleRemoveBom = async (materialId: string) => {
    if (!canEditBom) return;
    try {
      await deleteBom.mutateAsync({ id: productId, materialId });
      toast.success("Đã xóa linh kiện khỏi BOM");
      if (expandedMaterialId === materialId) setExpandedMaterialId(null);
      invalidateBom();
    } catch (e) { toastApiError(e, "Không xóa được linh kiện");
    }
  };

  const handleSaveSerials = async (materialId: string, serialNumbers: string[]) => {
    try {
      await updateBom.mutateAsync({
        id: productId,
        materialId,
        payload: { serialNumbers },
      });
      invalidateBom();
    } catch (e) { toastApiError(e, "Không lưu được serial");
    }
  };

  const readOnly = !editable || !canEditBom;

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {contextBanner ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
            {contextBanner}
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Danh sách linh kiện cấu thành (BOM).
          {readOnly ? " Chế độ chỉ xem." : " Chỉnh sửa cập nhật danh mục sản phẩm và kho vật tư."}
        </p>

        {bom.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sản phẩm chưa khai báo linh kiện (BOM).</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {showMaterialAttributes && editable ? <TableHead className="w-8" /> : null}
                <TableHead>Mã VT</TableHead>
                <TableHead>Tên linh kiện</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead className="text-right">Số lượng BOM</TableHead>
                <TableHead>ĐVT</TableHead>
                {editable && canEditBom ? <TableHead className="text-right">Thao tác</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {bom.map((item) => {
                const isExpanded = expandedMaterialId === item.materialId;
                const colSpan =
                  5 +
                  (showMaterialAttributes && editable ? 1 : 0) +
                  (editable && canEditBom ? 1 : 0);

                return (
                  <Fragment key={item.materialId}>
                    <TableRow>
                      {showMaterialAttributes && editable ? (
                        <TableCell className="p-1">
                          {item.materialDbId ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                setExpandedMaterialId(isExpanded ? null : item.materialId)
                              }
                              aria-label="Thuộc tính vật tư"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          ) : null}
                        </TableCell>
                      ) : null}
                      <TableCell className="font-mono text-xs text-primary">{item.materialId}</TableCell>
                      <TableCell>{item.materialName}</TableCell>
                      <TableCell>
                        {(item.serialNumbers?.length ?? 0) > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {item.serialNumbers!.slice(0, 2).map((sn) => (
                              <Badge key={sn} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                {sn}
                              </Badge>
                            ))}
                            {(item.serialNumbers?.length ?? 0) > 2 ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                +{(item.serialNumbers?.length ?? 0) - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Chưa gán</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {readOnly ? (
                          item.quantity
                        ) : (
                          <Input
                            className="h-8 w-20 ml-auto text-right"
                            type="number"
                            min={1}
                            value={bomQuantities[item.materialId] ?? String(item.quantity)}
                            onChange={(e) =>
                              setBomQuantities((prev) => ({
                                ...prev,
                                [item.materialId]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                      {editable && canEditBom ? (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSnItem({
                                  materialId: item.materialId,
                                  materialName: item.materialName,
                                  quantity: Number(bomQuantities[item.materialId] ?? item.quantity) || item.quantity,
                                  unit: item.unit,
                                  serialNumbers: item.serialNumbers ?? [],
                                });
                                setSnOpen(true);
                              }}
                            >
                              SN
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void handleRemoveBom(item.materialId)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      ) : null}
                    </TableRow>
                    {showMaterialAttributes && editable && isExpanded && item.materialDbId ? (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={colSpan} className="py-0 px-4">
                          <MaterialAttributesPanel
                            materialDbId={item.materialDbId}
                            materialCode={item.materialId}
                            readOnly={!canEditMaterial}
                            onSaved={invalidateBom}
                          />
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}

        {editable && canEditBom && bomSaveMode === "immediate" && bom.length > 0 ? (
          <div className="flex justify-end">
            <Button
              onClick={() => void handleSaveBomQuantities()}
              disabled={!hasQtyChanges || savingBom}
            >
              {savingBom ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  Đang lưu…
                </>
              ) : (
                "Lưu số lượng BOM"
              )}
            </Button>
          </div>
        ) : null}

        {editable && canEditBom ? (
          <div className="rounded-lg border border-border p-3">
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
              <Button onClick={() => void handleAddBom()}>Thêm</Button>
            </div>
          </div>
        ) : null}

        {!canEditBom && editable ? (
          <p className="text-xs text-muted-foreground">
            Bạn không có quyền sửa BOM. Liên hệ quản trị để được cấp quyền Hợp đồng hoặc Sản phẩm.
          </p>
        ) : null}
      </CardContent>

      <ManageSerialNumbersDialog
        item={snItem}
        open={snOpen}
        onOpenChange={(o) => {
          setSnOpen(o);
          if (!o) setSnItem(null);
        }}
        onSave={(serialNumbers) => {
          if (!snItem) return;
          void handleSaveSerials(snItem.materialId, serialNumbers);
          setSnOpen(false);
          setSnItem(null);
        }}
      />
    </Card>
  );
}

/** Đọc map số lượng BOM đang chỉnh (batch mode) */
export function getPendingBomQuantityUpdates(
  bom: ProductBomLine[],
  bomQuantities: Record<string, string>,
): Array<{ materialId: string; quantity: number }> {
  const updates: Array<{ materialId: string; quantity: number }> = [];
  for (const item of bom) {
    const nextQty = Number(bomQuantities[item.materialId] ?? item.quantity);
    if (Number.isFinite(nextQty) && nextQty > 0 && nextQty !== item.quantity) {
      updates.push({ materialId: item.materialId, quantity: nextQty });
    }
  }
  return updates;
}
