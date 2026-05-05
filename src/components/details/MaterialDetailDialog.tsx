import { useState } from "react";
import {
  Package, MapPin, ArrowRightLeft, Shield, TrendingDown, Calculator,
  Barcode, QrCode, Radio, Hash, Copy, CheckCircle, Clock, AlertTriangle,
  Wrench, Calendar, ChevronRight, FileText, ExternalLink
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface MaterialIdentifiers {
  serial: string;
  barcode: string;
  qrCode: string;
  rfid: string;
}

interface TransferRecord {
  id: string;
  date: string;
  from: string;
  to: string;
  quantity: number;
  reason: string;
  approvedBy: string;
  status: "completed" | "processing" | "pending";
}

interface WarrantyRecord {
  id: string;
  date: string;
  type: "warranty" | "repair";
  issue: string;
  status: "done" | "processing" | "pending";
  resolvedDate?: string;
  cost?: number;
  vendor?: string;
}

export interface MaterialDetail {
  id: string;
  name: string;
  type: "identified" | "consumable";
  category: string;
  unit: string;
  quantity: number;
  available: number;
  warehouse: string;
  identifiers: MaterialIdentifiers;
  manufacturer: string;
  model: string;
  importDate: string;
  expiryDate: string | null;
  unitPrice: number;
  status: "active" | "storage" | "maintenance" | "decommissioned";
  currentLocation: string;
  installedOn: string | null;
  managedBy: string;
  transfers: TransferRecord[];
  warranties: WarrantyRecord[];
  failureRate: number; // %
  totalFailures: number;
  totalUnits: number;
  mtbf: number; // Mean Time Between Failures (hours)
  depreciationMethod: string;
  usefulLife: number; // years
  purchaseValue: number;
  currentValue: number;
  accumulatedDepreciation: number;
  yearlyDepreciation: number;
}

// Mock detailed data
export const materialDetails: MaterialDetail[] = [
  {
    id: "VT-001",
    name: "Module phát sóng RF-100",
    type: "identified",
    category: "Điện tử RF",
    unit: "cái",
    quantity: 50,
    available: 35,
    warehouse: "Kho chính",
    identifiers: {
      serial: "SN-RF100-042",
      barcode: "6901234567890",
      qrCode: "VT001-RF100-042-2023",
      rfid: "E2003412AC0000000001",
    },
    manufacturer: "Nhà máy Z111",
    model: "RF-100 Rev.C",
    importDate: "15/01/2023",
    expiryDate: "15/01/2028",
    unitPrice: 85000000,
    status: "active",
    currentLocation: "Quân khu 3 - Đại đội 2",
    installedOn: "Đài radar RD-200 (#RD-200-015)",
    managedBy: "Quân khu 3",
    transfers: [
      { id: "DC-T001", date: "15/01/2023", from: "Nhà máy Z111", to: "Kho chính", quantity: 50, reason: "Nhập kho mới theo HĐ-2022-045", approvedBy: "Đ/c Nguyễn Văn A", status: "completed" },
      { id: "DC-T002", date: "20/03/2023", from: "Kho chính", to: "Quân khu 3", quantity: 15, reason: "Trang bị theo HĐ-2023-005", approvedBy: "Đ/c Trần Văn B", status: "completed" },
      { id: "DC-T003", date: "10/07/2023", from: "Kho chính", to: "Quân khu 7", quantity: 8, reason: "Bổ sung trang bị", approvedBy: "Đ/c Lê Văn C", status: "completed" },
      { id: "DC-T004", date: "05/01/2024", from: "Quân khu 7", to: "Xưởng sửa chữa Z111", quantity: 2, reason: "Sửa chữa - hỏng mạch phát", approvedBy: "Đ/c Phạm Văn D", status: "completed" },
      { id: "DC-T005", date: "15/04/2024", from: "Kho chính", to: "Quân khu 1", quantity: 5, reason: "Trang bị bổ sung", approvedBy: "Đ/c Hoàng Văn E", status: "processing" },
    ],
    warranties: [
      { id: "BH-001", date: "10/06/2023", type: "warranty", issue: "Lỗi tần số phát lệch 0.5MHz", status: "done", resolvedDate: "25/06/2023", vendor: "Nhà máy Z111" },
      { id: "BH-002", date: "05/01/2024", type: "repair", issue: "Hỏng mạch khuếch đại công suất", status: "done", resolvedDate: "20/02/2024", cost: 12500000, vendor: "Nhà máy Z111" },
      { id: "BH-003", date: "10/03/2024", type: "warranty", issue: "Nhiễu tín hiệu ở dải 400MHz", status: "processing", vendor: "Nhà máy Z111" },
      { id: "BH-004", date: "01/04/2024", type: "repair", issue: "Thay connector SMA bị oxy hóa", status: "pending", cost: 850000 },
    ],
    failureRate: 4.2,
    totalFailures: 6,
    totalUnits: 50,
    mtbf: 8500,
    depreciationMethod: "Đường thẳng",
    usefulLife: 5,
    purchaseValue: 4250000000,
    currentValue: 3187500000,
    accumulatedDepreciation: 1062500000,
    yearlyDepreciation: 850000000,
  },
  {
    id: "VT-003",
    name: "Bo mạch xử lý DSP-200",
    type: "identified",
    category: "Vi xử lý",
    unit: "cái",
    quantity: 30,
    available: 12,
    warehouse: "Kho phụ",
    identifiers: {
      serial: "SN-DSP200-018",
      barcode: "6901234567891",
      qrCode: "VT003-DSP200-018-2023",
      rfid: "E2003412AC0000000003",
    },
    manufacturer: "Nhà máy Z189",
    model: "DSP-200 Mark II",
    importDate: "20/04/2023",
    expiryDate: "20/04/2030",
    unitPrice: 125000000,
    status: "active",
    currentLocation: "Quân khu 5 - Trung đoàn 2",
    installedOn: "Tổng đài TĐ-500 (#TD-500-004)",
    managedBy: "Quân khu 5",
    transfers: [
      { id: "DC-T010", date: "20/04/2023", from: "Nhà máy Z189", to: "Kho phụ", quantity: 30, reason: "Nhập kho mới", approvedBy: "Đ/c Nguyễn Văn A", status: "completed" },
      { id: "DC-T011", date: "15/06/2023", from: "Kho phụ", to: "Quân khu 5", quantity: 10, reason: "Trang bị theo HĐ-2023-010", approvedBy: "Đ/c Đỗ Văn N", status: "completed" },
      { id: "DC-T012", date: "20/09/2023", from: "Kho phụ", to: "Quân khu 1", quantity: 8, reason: "Trang bị theo HĐ-2023-018", approvedBy: "Đ/c Đỗ Văn F", status: "completed" },
    ],
    warranties: [
      { id: "BH-010", date: "15/08/2023", type: "warranty", issue: "Lỗi firmware gây treo hệ thống", status: "done", resolvedDate: "30/08/2023", vendor: "Nhà máy Z189" },
      { id: "BH-011", date: "02/12/2023", type: "repair", issue: "Thay chip nhớ bị lỗi", status: "done", resolvedDate: "18/12/2023", cost: 8500000, vendor: "Nhà máy Z189" },
    ],
    failureRate: 3.1,
    totalFailures: 3,
    totalUnits: 30,
    mtbf: 12000,
    depreciationMethod: "Đường thẳng",
    usefulLife: 7,
    purchaseValue: 3750000000,
    currentValue: 3214285714,
    accumulatedDepreciation: 535714286,
    yearlyDepreciation: 535714286,
  },
];

// Helper to find detail by material ID, fallback to generated mock
export function getMaterialDetail(materialId: string, materialName: string): MaterialDetail {
  const found = materialDetails.find(d => d.id === materialId);
  if (found) return found;
  
  // Generate mock for materials without detailed data
  return {
    id: materialId,
    name: materialName,
    type: "consumable",
    category: "Vật tư chung",
    unit: "cái",
    quantity: 100,
    available: 60,
    warehouse: "Kho chính",
    identifiers: {
      serial: `SN-${materialId}`,
      barcode: `690${Math.floor(Math.random() * 10000000).toString().padStart(7, "0")}`,
      qrCode: `${materialId}-${Date.now()}`,
      rfid: `E200${Math.floor(Math.random() * 10000000000).toString().padStart(16, "0")}`,
    },
    manufacturer: "Nhà máy Z111",
    model: materialName.split(" ").slice(-1)[0],
    importDate: "01/01/2023",
    expiryDate: null,
    unitPrice: 5000000,
    status: "active",
    currentLocation: "Kho chính",
    installedOn: null,
    managedBy: "Bộ TL TTTM",
    transfers: [
      { id: "DC-X01", date: "01/01/2023", from: "Nhà cung cấp", to: "Kho chính", quantity: 100, reason: "Nhập kho mới", approvedBy: "Đ/c Nguyễn Văn A", status: "completed" },
    ],
    warranties: [],
    failureRate: 1.5,
    totalFailures: 2,
    totalUnits: 100,
    mtbf: 15000,
    depreciationMethod: "Đường thẳng",
    usefulLife: 5,
    purchaseValue: 500000000,
    currentValue: 400000000,
    accumulatedDepreciation: 100000000,
    yearlyDepreciation: 100000000,
  };
}

interface MaterialDetailDialogProps {
  open: boolean;
  onClose: () => void;
  material: MaterialDetail | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Đang sử dụng", variant: "default" },
  storage: { label: "Trong kho", variant: "secondary" },
  maintenance: { label: "Đang sửa chữa", variant: "outline" },
  decommissioned: { label: "Thanh lý", variant: "destructive" },
};

const formatCurrency = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(1)} triệu`;
  return v.toLocaleString("vi-VN") + " đ";
};

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label}`);
};

const MaterialDetailDialog = ({ open, onClose, material }: MaterialDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState("general");

  if (!material) return null;

  const depreciationPercent = material.purchaseValue > 0
    ? (material.accumulatedDepreciation / material.purchaseValue) * 100
    : 0;

  const remainingLife = Math.max(0, material.usefulLife - (material.accumulatedDepreciation / material.yearlyDepreciation));

  const st = statusConfig[material.status] || statusConfig.active;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto p-4 sm:p-6">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-lg leading-tight">{material.name}</span>
                  <Badge variant={st.variant} className="text-[10px] shrink-0">{st.label}</Badge>
                </div>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">{material.id} • {material.category} • {material.manufacturer}</p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Identification Codes */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 border border-border/50 mt-3">
          {[
            { icon: Hash, label: "Serial", value: material.identifiers.serial },
            { icon: Barcode, label: "Barcode", value: material.identifiers.barcode },
            { icon: QrCode, label: "QR Code", value: material.identifiers.qrCode },
            { icon: Radio, label: "RFID", value: material.identifiers.rfid },
          ].map(({ icon: Icon, label, value }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md hover:bg-background transition-colors text-left group"
              onClick={() => copyToClipboard(value, label)}
              title={`Sao chép ${label}`}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-[11px] sm:text-xs font-mono text-foreground truncate">{value}</p>
              </div>
            </button>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-6 sm:w-full h-auto gap-0">
              <TabsTrigger value="general" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">Tổng quan</TabsTrigger>
              <TabsTrigger value="location" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">Vị trí</TabsTrigger>
              <TabsTrigger value="transfers" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">Điều chuyển</TabsTrigger>
              <TabsTrigger value="warranty" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">BH & SC</TabsTrigger>
              <TabsTrigger value="failure" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">Tỷ lệ hỏng</TabsTrigger>
              <TabsTrigger value="depreciation" className="text-[11px] sm:text-xs px-3 py-1.5 whitespace-nowrap">Khấu hao</TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: General Info */}
          <TabsContent value="general" className="space-y-4 mt-3">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" /> Thông tin chung
                </h4>
                <div className="space-y-2 text-sm">
                  {[
                    ["Mã vật tư", material.id],
                    ["Tên", material.name],
                    ["Phân loại", material.type === "identified" ? "Định danh" : "Tiêu hao"],
                    ["Danh mục", material.category],
                    ["Đơn vị", material.unit],
                    ["Model", material.model],
                    ["Nhà sản xuất", material.manufacturer],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Số lượng & Thời hạn
                </h4>
                <div className="space-y-2 text-sm">
                  {[
                    ["Tổng số lượng", material.quantity.toLocaleString()],
                    ["Khả dụng", material.available.toLocaleString()],
                    ["Đã cấp phát", (material.quantity - material.available).toLocaleString()],
                    ["Kho", material.warehouse],
                    ["Ngày nhập", material.importDate],
                    ["Hạn sử dụng", material.expiryDate || "Không giới hạn"],
                    ["Đơn giá", formatCurrency(material.unitPrice)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Tỷ lệ sử dụng</span>
                    <span>{Math.round(((material.quantity - material.available) / material.quantity) * 100)}%</span>
                  </div>
                  <Progress value={((material.quantity - material.available) / material.quantity) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Location & Status */}
          <TabsContent value="location" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Vị trí hiện tại
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vị trí</span>
                    <span className="font-medium text-foreground">{material.currentLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lắp trên</span>
                    <span className="font-medium text-foreground">{material.installedOn || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đơn vị quản lý</span>
                    <span className="font-medium text-foreground">{material.managedBy}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trạng thái</span>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ArrowRightLeft className="h-4 w-4 text-primary" /> Tóm tắt di chuyển
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng lần điều chuyển</span>
                    <span className="font-medium text-foreground">{material.transfers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hoàn thành</span>
                    <span className="font-medium text-success">{material.transfers.filter(t => t.status === "completed").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đang xử lý</span>
                    <span className="font-medium text-warning">{material.transfers.filter(t => t.status === "processing").length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chờ duyệt</span>
                    <span className="font-medium text-muted-foreground">{material.transfers.filter(t => t.status === "pending").length}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Transfer History */}
          <TabsContent value="transfers" className="mt-3">
            {/* Mobile: card layout */}
            <div className="space-y-2 sm:hidden">
              {material.transfers.map(t => (
                <div key={t.id} className="rounded-lg border border-border/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-primary">{t.id}</span>
                    <Badge variant={t.status === "completed" ? "secondary" : t.status === "processing" ? "default" : "outline"} className="text-[10px]">
                      {t.status === "completed" ? "Hoàn thành" : t.status === "processing" ? "Đang XL" : "Chờ duyệt"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">{t.from}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{t.to}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{t.date}</span>
                    <span>SL: <strong className="text-foreground">{t.quantity}</strong></span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{t.reason}</p>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block rounded-xl border border-border/50 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Từ</TableHead>
                    <TableHead></TableHead>
                    <TableHead>Đến</TableHead>
                    <TableHead className="text-center">SL</TableHead>
                    <TableHead className="hidden sm:table-cell">Lý do</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {material.transfers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-primary text-xs">{t.id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.date}</TableCell>
                      <TableCell className="text-xs">{t.from}</TableCell>
                      <TableCell><ChevronRight className="h-3 w-3 text-muted-foreground" /></TableCell>
                      <TableCell className="text-xs">{t.to}</TableCell>
                      <TableCell className="text-center font-semibold text-xs">{t.quantity}</TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell max-w-[200px] truncate">{t.reason}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === "completed" ? "secondary" : t.status === "processing" ? "default" : "outline"} className="text-[10px]">
                          {t.status === "completed" ? "Hoàn thành" : t.status === "processing" ? "Đang XL" : "Chờ duyệt"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab 4: Warranty & Repair */}
          <TabsContent value="warranty" className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {[
                { label: "Tổng yêu cầu", value: material.warranties.length, icon: Shield, color: "text-primary" },
                { label: "Bảo hành", value: material.warranties.filter(w => w.type === "warranty").length, icon: Shield, color: "text-info" },
                { label: "Sửa chữa", value: material.warranties.filter(w => w.type === "repair").length, icon: Wrench, color: "text-warning" },
                { label: "Hoàn thành", value: material.warranties.filter(w => w.status === "done").length, icon: CheckCircle, color: "text-success" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-2 p-2 sm:p-3 rounded-lg border border-border/50 bg-card">
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${color} shrink-0`} />
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
                    <p className="text-base sm:text-lg font-bold text-card-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Mobile: card layout */}
            <div className="space-y-2 sm:hidden">
              {material.warranties.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Chưa có lịch sử bảo hành / sửa chữa</p>
              ) : material.warranties.map(w => (
                <div key={w.id} className="rounded-lg border border-border/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary">{w.id}</span>
                      <Badge variant={w.type === "warranty" ? "default" : "secondary"} className="text-[10px]">
                        {w.type === "warranty" ? "Bảo hành" : "Sửa chữa"}
                      </Badge>
                    </div>
                    <Badge variant={w.status === "done" ? "secondary" : w.status === "processing" ? "default" : "outline"} className="text-[10px]">
                      {w.status === "done" ? "Xong" : w.status === "processing" ? "Đang XL" : "Chờ"}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground">{w.issue}</p>
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>{w.date}</span>
                    <span>{w.cost ? formatCurrency(w.cost) : w.vendor || ""}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop: table */}
            <div className="hidden sm:block rounded-xl border border-border/50 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Vấn đề</TableHead>
                    <TableHead>Đơn vị xử lý</TableHead>
                    <TableHead>Chi phí</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {material.warranties.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Chưa có lịch sử bảo hành / sửa chữa</TableCell></TableRow>
                  ) : material.warranties.map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium text-primary text-xs">{w.id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.date}</TableCell>
                      <TableCell>
                        <Badge variant={w.type === "warranty" ? "default" : "secondary"} className="text-[10px]">
                          {w.type === "warranty" ? "Bảo hành" : "Sửa chữa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{w.issue}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.vendor || "—"}</TableCell>
                      <TableCell className="text-xs">{w.cost ? formatCurrency(w.cost) : "—"}</TableCell>
                      <TableCell>
                        <Badge variant={w.status === "done" ? "secondary" : w.status === "processing" ? "default" : "outline"} className="text-[10px]">
                          {w.status === "done" ? "Xong" : w.status === "processing" ? "Đang XL" : "Chờ"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tab 5: Failure Rate */}
          <TabsContent value="failure" className="mt-3 space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-xl border border-border/50 p-3 sm:p-4 text-center space-y-1">
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-destructive mx-auto" />
                <p className="text-xl sm:text-3xl font-bold text-card-foreground">{material.failureRate}%</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Tỷ lệ hỏng</p>
                <Progress value={material.failureRate} className="h-1.5 sm:h-2" />
              </div>
              <div className="rounded-xl border border-border/50 p-3 sm:p-4 text-center space-y-1">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-warning mx-auto" />
                <p className="text-xl sm:text-3xl font-bold text-card-foreground">{material.totalFailures}/{material.totalUnits}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Lỗi / Tổng</p>
              </div>
              <div className="rounded-xl border border-border/50 p-3 sm:p-4 text-center space-y-1">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-info mx-auto" />
                <p className="text-xl sm:text-3xl font-bold text-card-foreground">{material.mtbf.toLocaleString()}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground">MTBF (giờ)</p>
                <p className="text-[9px] sm:text-xs text-muted-foreground hidden sm:block">Thời gian TB giữa các lần hỏng</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Phân tích</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đánh giá độ tin cậy</span>
                  <Badge variant={material.failureRate < 3 ? "secondary" : material.failureRate < 5 ? "default" : "destructive"}>
                    {material.failureRate < 3 ? "Tốt" : material.failureRate < 5 ? "Trung bình" : "Cần chú ý"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lỗi bảo hành</span>
                  <span className="font-medium">{material.warranties.filter(w => w.type === "warranty").length} lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lỗi cần sửa chữa</span>
                  <span className="font-medium">{material.warranties.filter(w => w.type === "repair").length} lần</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng chi phí sửa chữa</span>
                  <span className="font-medium text-destructive">
                    {formatCurrency(material.warranties.filter(w => w.cost).reduce((s, w) => s + (w.cost || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 6: Depreciation */}
          <TabsContent value="depreciation" className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <div className="rounded-xl border border-border/50 p-3 sm:p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-primary" /> Thông tin khấu hao
                </h4>
                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                  {[
                    ["Phương pháp", material.depreciationMethod],
                    ["Thời gian hữu dụng", `${material.usefulLife} năm`],
                    ["Giá trị ban đầu", formatCurrency(material.purchaseValue)],
                    ["Khấu hao hàng năm", formatCurrency(material.yearlyDepreciation)],
                    ["Đã khấu hao", formatCurrency(material.accumulatedDepreciation)],
                    ["Giá trị còn lại", formatCurrency(material.currentValue)],
                    ["Thời gian còn lại", `${remainingLife.toFixed(1)} năm`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/50 p-3 sm:p-4 space-y-3">
                <h4 className="text-sm font-semibold text-foreground">Tiến độ khấu hao</h4>
                <div className="flex items-center justify-center">
                  <div className="relative w-28 h-28 sm:w-40 sm:h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" fill="none" strokeWidth="12" className="stroke-muted" />
                      <circle
                        cx="60" cy="60" r="50" fill="none" strokeWidth="12"
                        className="stroke-primary"
                        strokeDasharray={`${depreciationPercent * 3.14} ${314 - depreciationPercent * 3.14}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg sm:text-2xl font-bold text-foreground">{Math.round(depreciationPercent)}%</span>
                      <span className="text-[10px] text-muted-foreground">Đã khấu hao</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Giá trị ban đầu</span>
                    <span className="text-foreground">{formatCurrency(material.purchaseValue)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${depreciationPercent}%` }} />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-success">Còn lại: {formatCurrency(material.currentValue)}</span>
                    <span className="text-destructive">Đã KH: {formatCurrency(material.accumulatedDepreciation)}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default MaterialDetailDialog;
