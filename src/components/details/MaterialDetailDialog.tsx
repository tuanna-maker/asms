import { useMemo, useState } from "react";
import {
  Package,
  MapPin,
  ArrowRightLeft,
  Shield,
  TrendingDown,
  Calculator,
  Barcode,
  QrCode,
  Radio,
  Hash,
  Calendar,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  useMaterialDetail,
  useMaterialTransfersList,
  type MaterialDetailRow,
  type MaterialTransferListRow,
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

function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

const copyToClipboard = (text: string, label: string) => {
  if (!text || text === "—") return;
  navigator.clipboard.writeText(text);
  toast.success(`Đã sao chép ${label}`);
};

const EmptyTab = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-8 text-center text-sm text-muted-foreground">
    {text}
  </div>
);

interface MaterialDetailDialogProps {
  open: boolean;
  onClose: () => void;
  materialId: string | null;
}

const MaterialDetailDialog = ({ open, onClose, materialId }: MaterialDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState("general");
  const { data: apiMaterial, isLoading, isError } = useMaterialDetail(materialId, {
    enabled: open && Boolean(materialId),
  });
  const { data: allTransfers = [] } = useMaterialTransfersList();

  const materialTransfers = useMemo(
    () => (materialId ? allTransfers.filter((t) => t.materialId === materialId) : []),
    [allTransfers, materialId],
  );

  const m = apiMaterial as MaterialDetailRow | null | undefined;
  const usagePct =
    m && m.quantity > 0 ? Math.round(((m.quantity - m.available) / m.quantity) * 100) : 0;

  if (!open) return null;

  if (!materialId) return null;

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl flex items-center justify-center">
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
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-6">
          <p className="text-sm text-muted-foreground">Không tải được chi tiết vật tư.</p>
        </SheetContent>
      </Sheet>
    );
  }

  const typeLabel = m.type === "identified" ? "Định danh" : "Tiêu hao";

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
                  <span className="text-base sm:text-lg leading-tight">{m.name}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {typeLabel}
                  </Badge>
                </div>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {m.code} • {m.unit} • {m.warehouse}
                </p>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50 border border-border/50 mt-3">
          {[
            { icon: Hash, label: "Serial", value: m.serial ?? "—" },
            { icon: Barcode, label: "Mã vật tư", value: m.code },
            { icon: QrCode, label: "QR / Mã", value: m.code },
            { icon: Radio, label: "RFID", value: "—" },
          ].map(({ icon: Icon, label, value }) => (
            <button
              key={label}
              type="button"
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
                <span className="font-medium">{m.warehouse}</span>
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
