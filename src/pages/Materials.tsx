import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Package, ArrowRightLeft, ArrowDownToLine, Filter, Eye, Edit, QrCode, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MaterialDetailDialog from "@/components/details/MaterialDetailDialog";
import { useListPagination } from "@/hooks/use-list-pagination";
import ListPaginationBar from "@/components/ui/ListPaginationBar";
import BarcodeScannerDialog from "@/components/scanner/BarcodeScannerDialog";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import {
  useCreateMaterial,
  useCreateMaterialTransfer,
  useDeleteMaterial,
  useDeleteMaterialTransfer,
  useMaterialsList,
  useMaterialTransfersList,
  useUpdateMaterial,
  useUpdateMaterialTransfer,
  type MaterialTransferListRow,
} from "@/hooks/use-materials-api";
import { toast } from "sonner";

type MaterialRow = {
  id: string;
  code: string;
  name: string;
  type: "identified" | "consumable";
  serial: string | null;
  quantity: number;
  available: number;
  unit: string;
  warehouse: string;
};

const FALLBACK_WAREHOUSES: { value: string; label: string }[] = [
  { value: "Kho chính", label: "Kho chính" },
  { value: "Kho phụ", label: "Kho phụ" },
];
const FALLBACK_UNITS: { value: string; label: string }[] = [
  { value: "bộ", label: "Bộ" },
  { value: "cái", label: "Cái" },
  { value: "mét", label: "Mét" },
  { value: "kg", label: "Kilogram" },
];

const transferTypeBadge = (t: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    contract: { label: "Theo HĐ", variant: "default" },
    warranty: { label: "Bảo hành", variant: "secondary" },
    repair: { label: "Sửa chữa", variant: "outline" },
  };
  const cfg = map[t] || map.contract;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const Materials = () => {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [importForm, setImportForm] = useState({
    type: "consumable" as MaterialRow["type"],
    name: "",
    serial: "",
    quantity: 0,
    warehouse: "Kho chính",
    unit: "bộ",
  });

  const { data: apiMaterials } = useMaterialsList();
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

  useEffect(() => {
    if (!warehouseOptions.length) return;
    const allowed = new Set(warehouseOptions.map((o) => o.value));
    setImportForm((s) => (allowed.has(s.warehouse) ? s : { ...s, warehouse: warehouseOptions[0]!.value }));
  }, [warehouseOptions]);

  useEffect(() => {
    if (!unitOptions.length) return;
    const allowed = new Set(unitOptions.map((o) => o.value));
    setImportForm((s) => (allowed.has(s.unit) ? s : { ...s, unit: unitOptions[0]!.value }));
  }, [unitOptions]);

  const { data: transferRows = [], isLoading: isTransfersLoading } = useMaterialTransfersList();
  const createMaterial = useCreateMaterial();
  const createMaterialTransfer = useCreateMaterialTransfer();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const updateMaterialTransfer = useUpdateMaterialTransfer();
  const deleteMaterialTransfer = useDeleteMaterialTransfer();

  useEffect(() => {
    if (!apiMaterials) return;
    setMaterials(
      apiMaterials.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        type: row.type,
        serial: row.serial,
        quantity: Number(row.quantity ?? 0),
        available: Number(row.available ?? 0),
        unit: row.unit,
        warehouse: row.warehouse,
      })),
    );
  }, [apiMaterials]);

  const [search, setSearch] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferSearch, setTransferSearch] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [transferForm, setTransferForm] = useState({
    type: "contract" as "contract" | "warranty" | "repair",
    materialId: "",
    quantity: 0,
    destination: "",
    status: "pending" as "pending" | "processing" | "completed",
  });

  const [editMaterialOpen, setEditMaterialOpen] = useState(false);
  const [editingMaterialRow, setEditingMaterialRow] = useState<MaterialRow | null>(null);
  const [materialDeleteTarget, setMaterialDeleteTarget] = useState<MaterialRow | null>(null);
  const [transferPatchTarget, setTransferPatchTarget] = useState<MaterialTransferListRow | null>(null);
  const [transferDeleteTarget, setTransferDeleteTarget] = useState<MaterialTransferListRow | null>(null);

  const [editMatForm, setEditMatForm] = useState({
    name: "",
    type: "consumable" as MaterialRow["type"],
    serial: "",
    quantity: 0,
    available: 0,
    unit: "",
    warehouse: "",
  });

  useEffect(() => {
    if (!editMaterialOpen || !editingMaterialRow) return;
    setEditMatForm({
      name: editingMaterialRow.name,
      type: editingMaterialRow.type,
      serial: editingMaterialRow.serial ?? "",
      quantity: editingMaterialRow.quantity,
      available: editingMaterialRow.available,
      unit: editingMaterialRow.unit,
      warehouse: editingMaterialRow.warehouse,
    });
  }, [editMaterialOpen, editingMaterialRow]);

  const handleScanResult = (code: string, format: string) => {
    // Search by serial, barcode, qrCode, rfid, or id
    const found = materials.find((m) => {
      const lower = code.toLowerCase();
      return (
        m.id.toLowerCase() === lower ||
        m.code.toLowerCase() === lower ||
        (m.serial?.toLowerCase() === lower)
      );
    });

    if (found) {
      setSelectedMaterialId(found.id);
      setShowDetail(true);
    } else {
      // Fall back to search
      setSearch(code);
    }
  };

  const handleImportMaterial = async () => {
    if (!importForm.name.trim()) {
      toast.error("Vui lòng nhập tên vật tư");
      return;
    }
    if (importForm.quantity <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }
    try {
      await createMaterial.mutateAsync({
        code: `VT-${Date.now().toString().slice(-6)}`,
        name: importForm.name.trim(),
        type: importForm.type,
        serial: importForm.type === "identified" ? (importForm.serial.trim() || undefined) : null,
        quantity: importForm.quantity,
        available: importForm.quantity,
        unit: importForm.unit.trim() || "bộ",
        warehouse: importForm.warehouse,
      });
      toast.success("Nhập vật tư thành công");
      setShowImport(false);
      setImportForm({
        type: "consumable",
        name: "",
        serial: "",
        quantity: 0,
        warehouse: "Kho chính",
        unit: "bộ",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không nhập được vật tư";
      toast.error(msg);
    }
  };

  const filtered = materials.filter(
    (m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.code.toLowerCase().includes(search.toLowerCase())
  );
  const filteredTransfers = transferRows.filter((t) => {
    const q = transferSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      t.code.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.material.name.toLowerCase().includes(q) ||
      t.material.code.toLowerCase().includes(q)
    );
  });

  const materialPagination = useListPagination(filtered, { resetDeps: [search] });
  const transferPagination = useListPagination(filteredTransfers, { resetDeps: [transferSearch] });

  const handleCreateTransfer = async () => {
    if (!transferForm.materialId) {
      toast.error("Vui lòng chọn vật tư");
      return;
    }
    if (transferForm.quantity <= 0) {
      toast.error("Số lượng điều chuyển phải lớn hơn 0");
      return;
    }
    if (!transferForm.destination.trim()) {
      toast.error("Vui lòng nhập đích đến");
      return;
    }

    try {
      await createMaterialTransfer.mutateAsync({
        materialId: transferForm.materialId,
        quantity: transferForm.quantity,
        destination: transferForm.destination.trim(),
        type: transferForm.type,
        status: transferForm.status,
      });
      toast.success("Tạo phiếu điều chuyển thành công");
      setShowTransfer(false);
      setTransferForm({
        type: "contract",
        materialId: "",
        quantity: 0,
        destination: "",
        status: "pending",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không tạo được phiếu điều chuyển";
      toast.error(msg);
    }
  };

  const submitMaterialEdit = async () => {
    if (!editingMaterialRow) return;
    if (!editMatForm.name.trim()) {
      toast.error("Nhập tên vật tư");
      return;
    }
    try {
      await updateMaterial.mutateAsync({
        id: editingMaterialRow.id,
        payload: {
          name: editMatForm.name.trim(),
          type: editMatForm.type,
          serial: editMatForm.type === "identified" ? (editMatForm.serial.trim() || null) : null,
          quantity: editMatForm.quantity,
          available: editMatForm.available,
          unit: editMatForm.unit.trim() || editingMaterialRow.unit,
          warehouse: editMatForm.warehouse.trim() || editingMaterialRow.warehouse,
        },
      });
      toast.success("Đã cập nhật vật tư");
      setEditMaterialOpen(false);
      setEditingMaterialRow(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng vật tư</p>
            <p className="text-2xl font-bold text-card-foreground">{materials.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Định danh</p>
            <p className="text-2xl font-bold text-card-foreground">{materials.filter((m) => m.type === "identified").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Tiêu hao</p>
            <p className="text-2xl font-bold text-card-foreground">{materials.filter((m) => m.type === "consumable").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning"><ArrowRightLeft className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Điều chuyển</p>
            <p className="text-2xl font-bold text-card-foreground">{transferRows.length}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="inventory">
        <TabsList>
          <TabsTrigger value="inventory">Kho vật tư ({materials.length})</TabsTrigger>
          <TabsTrigger value="transfers">Điều chuyển ({transferRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 max-w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm vật tư..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowScanner(true)}>
                <QrCode className="h-4 w-4 mr-1" /> Quét mã
              </Button>
              <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Lọc</Button>
              <Dialog open={showImport} onOpenChange={setShowImport}>
                <DialogTrigger asChild>
                  <Button size="sm"><ArrowDownToLine className="h-4 w-4 mr-1" /> Nhập vật tư</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Nhập vật tư mới</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Loại vật tư</label>
                      <Select value={importForm.type} onValueChange={(v) => setImportForm((s) => ({ ...s, type: v as MaterialRow["type"] }))}>
                        <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumable">Tiêu hao</SelectItem>
                          <SelectItem value="identified">Định danh</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Tên vật tư</label>
                      <Input
                        placeholder="Tên vật tư"
                        value={importForm.name}
                        onChange={(e) => setImportForm((s) => ({ ...s, name: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Serial (nếu có)</label>
                        <Input
                          placeholder="Serial"
                          value={importForm.serial}
                          onChange={(e) => setImportForm((s) => ({ ...s, serial: e.target.value }))}
                          disabled={importForm.type !== "identified"}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Số lượng</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={importForm.quantity}
                          onChange={(e) => setImportForm((s) => ({ ...s, quantity: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Đơn vị tính</label>
                      <Select value={importForm.unit} onValueChange={(v) => setImportForm((s) => ({ ...s, unit: v }))}>
                        <SelectTrigger><SelectValue placeholder="Chọn ĐVT" /></SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Kho</label>
                      <Select value={importForm.warehouse} onValueChange={(v) => setImportForm((s) => ({ ...s, warehouse: v }))}>
                        <SelectTrigger><SelectValue placeholder="Chọn kho" /></SelectTrigger>
                        <SelectContent>
                          {warehouseOptions.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setShowImport(false)}>Hủy</Button>
                      <Button onClick={() => void handleImportMaterial()} disabled={createMaterial.isPending}>
                        {createMaterial.isPending ? "Đang nhập..." : "Nhập kho"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="rounded-xl bg-card border border-border/50 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên vật tư</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead className="text-right">Tổng SL</TableHead>
                  <TableHead className="text-right">Khả dụng</TableHead>
                  <TableHead>ĐVT</TableHead>
                  <TableHead>Kho</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialPagination.pagedItems.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-primary">{m.code}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      <Badge variant={m.type === "identified" ? "default" : "secondary"}>
                        {m.type === "identified" ? "Định danh" : "Tiêu hao"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.serial || "—"}</TableCell>
                    <TableCell className="text-right font-semibold">{m.quantity.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className={m.available < m.quantity * 0.3 ? "text-destructive font-semibold" : "text-card-foreground"}>
                        {m.available.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{m.warehouse}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                          setSelectedMaterialId(m.id);
                          setShowDetail(true);
                        }}><Eye className="h-4 w-4" /></Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingMaterialRow(m);
                            setEditMaterialOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setMaterialDeleteTarget(m)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ListPaginationBar
              className="px-4 pb-4"
              page={materialPagination.page}
              totalPages={materialPagination.totalPages}
              totalItems={materialPagination.total}
              pageSize={materialPagination.pageSize}
              onPageChange={materialPagination.setPage}
            />
          </div>
        </TabsContent>

        <TabsContent value="transfers">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm phiếu điều chuyển..." className="pl-9" value={transferSearch} onChange={(e) => setTransferSearch(e.target.value)} />
            </div>
            <Dialog open={showTransfer} onOpenChange={setShowTransfer}>
              <DialogTrigger asChild>
                <Button size="sm"><ArrowRightLeft className="h-4 w-4 mr-1" /> Tạo điều chuyển</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Tạo phiếu điều chuyển</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Loại điều chuyển</label>
                    <Select value={transferForm.type} onValueChange={(v) => setTransferForm((s) => ({ ...s, type: v as "contract" | "warranty" | "repair" }))}>
                      <SelectTrigger><SelectValue placeholder="Chọn loại" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contract">Theo hợp đồng</SelectItem>
                        <SelectItem value="warranty">Bảo hành</SelectItem>
                        <SelectItem value="repair">Sửa chữa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Vật tư</label>
                    <Select value={transferForm.materialId} onValueChange={(v) => setTransferForm((s) => ({ ...s, materialId: v }))}>
                      <SelectTrigger><SelectValue placeholder="Chọn vật tư" /></SelectTrigger>
                      <SelectContent>
                        {materials.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.code} - {m.name} ({m.available} {m.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Số lượng</label>
                      <Input type="number" placeholder="0" value={transferForm.quantity} onChange={(e) => setTransferForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Đích đến</label>
                      <Input placeholder="Mã HĐ / Ticket" value={transferForm.destination} onChange={(e) => setTransferForm((s) => ({ ...s, destination: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Trạng thái</label>
                    <Select value={transferForm.status} onValueChange={(v) => setTransferForm((s) => ({ ...s, status: v as "pending" | "processing" | "completed" }))}>
                      <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Chờ duyệt</SelectItem>
                        <SelectItem value="processing">Đang xử lý</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setShowTransfer(false)}>Hủy</Button>
                    <Button onClick={() => void handleCreateTransfer()} disabled={createMaterialTransfer.isPending}>
                      {createMaterialTransfer.isPending ? "Đang tạo..." : "Tạo phiếu"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-xl bg-card border border-border/50 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Vật tư</TableHead>
                  <TableHead className="text-center">SL</TableHead>
                  <TableHead>Từ</TableHead>
                  <TableHead>Đến</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right w-44">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTransfersLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : filteredTransfers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Chưa có phiếu điều chuyển.
                    </TableCell>
                  </TableRow>
                ) : transferPagination.pagedItems.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-primary">{t.code}</TableCell>
                    <TableCell>{t.material.name}</TableCell>
                    <TableCell className="text-center font-semibold">{t.quantity}</TableCell>
                    <TableCell className="text-muted-foreground">{t.fromWarehouse}</TableCell>
                    <TableCell className="text-muted-foreground">{t.destination}</TableCell>
                    <TableCell>{transferTypeBadge(t.type)}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(t.transferDate).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>
                      <Select
                        value={t.status}
                        onValueChange={async (v) => {
                          const status = v as MaterialTransferListRow["status"];
                          try {
                            await updateMaterialTransfer.mutateAsync({ id: t.id, payload: { status } });
                            toast.success("Đã cập nhật trạng thái phiếu");
                          } catch {
                            toast.error("Không cập nhật được");
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 text-xs w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ duyệt</SelectItem>
                          <SelectItem value="processing">Đang xử lý</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Đổi loại / đích" onClick={() => setTransferPatchTarget(t)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setTransferDeleteTarget(t)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ListPaginationBar
              className="px-4 pb-4"
              page={transferPagination.page}
              totalPages={transferPagination.totalPages}
              totalItems={transferPagination.total}
              pageSize={transferPagination.pageSize}
              onPageChange={transferPagination.setPage}
              disabled={isTransfersLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      <MaterialDetailDialog
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedMaterialId(null);
        }}
        materialId={selectedMaterialId}
      />

      <BarcodeScannerDialog
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScanResult}
      />

      <Dialog open={editMaterialOpen} onOpenChange={(o) => { setEditMaterialOpen(o); if (!o) setEditingMaterialRow(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Sửa vật tư</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Loại</Label>
              <Select value={editMatForm.type} onValueChange={(v) => setEditMatForm((s) => ({ ...s, type: v as MaterialRow["type"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumable">Tiêu hao</SelectItem>
                  <SelectItem value="identified">Định danh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tên</Label>
              <Input value={editMatForm.name} onChange={(e) => setEditMatForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Serial</Label>
              <Input value={editMatForm.serial} onChange={(e) => setEditMatForm((s) => ({ ...s, serial: e.target.value }))} disabled={editMatForm.type !== "identified"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tổng SL</Label>
                <Input type="number" min={0} value={editMatForm.quantity} onChange={(e) => setEditMatForm((s) => ({ ...s, quantity: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Khả dụng</Label>
                <Input type="number" min={0} value={editMatForm.available} onChange={(e) => setEditMatForm((s) => ({ ...s, available: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Đơn vị</Label>
                <Select value={editMatForm.unit} onValueChange={(v) => setEditMatForm((s) => ({ ...s, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{unitOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kho</Label>
                <Select value={editMatForm.warehouse} onValueChange={(v) => setEditMatForm((s) => ({ ...s, warehouse: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{warehouseOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMaterialOpen(false)}>Hủy</Button>
            <Button onClick={() => void submitMaterialEdit()} disabled={updateMaterial.isPending}>
              {updateMaterial.isPending ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={transferPatchTarget !== null} onOpenChange={(o) => !o && setTransferPatchTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Sửa phiếu điều chuyển</DialogTitle></DialogHeader>
          {transferPatchTarget && (
            <>
              <div className="space-y-3 py-1">
                <div className="space-y-1.5">
                  <Label>Loại phiếu</Label>
                  <Select
                    value={transferPatchTarget.type}
                    onValueChange={(v) =>
                      setTransferPatchTarget((p) => (p ? { ...p, type: v as MaterialTransferListRow["type"] } : p))
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract">Theo hợp đồng</SelectItem>
                      <SelectItem value="warranty">Bảo hành</SelectItem>
                      <SelectItem value="repair">Sửa chữa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Đích đến</Label>
                  <Input
                    value={transferPatchTarget.destination}
                    onChange={(e) => setTransferPatchTarget((p) => (p ? { ...p, destination: e.target.value } : p))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTransferPatchTarget(null)}>Hủy</Button>
                <Button
                  onClick={async () => {
                    const t = transferPatchTarget;
                    if (!t) return;
                    try {
                      await updateMaterialTransfer.mutateAsync({
                        id: t.id,
                        payload: { type: t.type, destination: t.destination.trim() || undefined },
                      });
                      toast.success("Đã cập nhật phiếu");
                      setTransferPatchTarget(null);
                    } catch {
                      toast.error("Không cập nhật được (cần ít nhất một trường thay đổi)");
                    }
                  }}
                  disabled={updateMaterialTransfer.isPending}
                >
                  Lưu
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={materialDeleteTarget !== null} onOpenChange={(o) => !o && setMaterialDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vật tư?</AlertDialogTitle>
            <AlertDialogDescription>
              {materialDeleteTarget ? `${materialDeleteTarget.code} — ${materialDeleteTarget.name}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!materialDeleteTarget) return;
                void deleteMaterial
                  .mutateAsync(materialDeleteTarget.id)
                  .then(() => {
                    toast.success("Đã xóa vật tư");
                    setMaterialDeleteTarget(null);
                  })
                  .catch(() => toast.error("Không xóa được"));
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={transferDeleteTarget !== null} onOpenChange={(o) => !o && setTransferDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy phiếu điều chuyển?</AlertDialogTitle>
            <AlertDialogDescription>
              {transferDeleteTarget ? `Phiếu ${transferDeleteTarget.code} — tồn kho được hoàn trừ khi phiếu chưa hoàn thành.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!transferDeleteTarget) return;
                void deleteMaterialTransfer
                  .mutateAsync(transferDeleteTarget.id)
                  .then(() => {
                    toast.success("Đã xóa phiếu");
                    setTransferDeleteTarget(null);
                  })
                  .catch(() => toast.error("Không xóa được"));
              }}
            >
              Xóa phiếu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Materials;
