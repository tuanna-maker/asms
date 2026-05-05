import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Calendar, DollarSign, Package, Shield, Users,
  Info, ListChecks, Boxes, Files, GraduationCap, Download, Edit,
} from "lucide-react";
import ContractEditDialog from "./ContractEditDialog";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "secondary" },
  late: { label: "Chậm tiến độ", variant: "destructive" },
  liquidated: { label: "Đã thanh lý", variant: "outline" },
};

type Contract = {
  id: string; customer: string; value: number; products: number;
  startDate: string; endDate: string; warrantyEnd: string; status: string; progress: number;
};

interface Props {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (updated: Contract) => void;
}

const ContractDetailDialog = ({ contract, open, onOpenChange, onSave }: Props) => {
  const [editing, setEditing] = useState(false);
  if (!contract) return null;
  const cfg = statusConfig[contract.status] || statusConfig.active;

  const handleSave = (updated: Contract) => {
    if (onSave) onSave(updated);
    else toast.success(`Đã cập nhật hợp đồng ${updated.id}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="flex h-16 flex-row items-center justify-between border-b border-border/50 px-6 pr-14 space-y-0 shrink-0 gap-3">
          <SheetTitle className="flex items-center gap-2 text-left leading-6 m-0 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate leading-6">Chi tiết hợp đồng {contract.id}</span>
          </SheetTitle>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            <Edit className="h-4 w-4" /> Chỉnh sửa
          </Button>
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border/50 px-6 shrink-0 overflow-x-auto">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabTrigger value="info" icon={<Info className="h-4 w-4" />} label="Thông tin chung" />
              <TabTrigger value="terms" icon={<ListChecks className="h-4 w-4" />} label="Điều khoản chính" />
              <TabTrigger value="products" icon={<Boxes className="h-4 w-4" />} label="Danh mục sản phẩm" />
              <TabTrigger value="docs" icon={<Files className="h-4 w-4" />} label="Tài liệu" />
              <TabTrigger value="training" icon={<GraduationCap className="h-4 w-4" />} label="Đào tạo & Huấn luyện" />
            </TabsList>
          </div>

          {/* Thông tin chung */}
          <TabsContent value="info" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <Badge variant={cfg.variant} className="text-sm px-3 py-1">{cfg.label}</Badge>
              <span className="text-sm font-medium text-muted-foreground">Tiến độ: {contract.progress}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${contract.progress}%` }} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={<Users className="h-4 w-4" />} label="Khách hàng" value={contract.customer} />
              <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Giá trị hợp đồng" value={`${contract.value.toLocaleString()} triệu đồng`} />
              <InfoItem icon={<Package className="h-4 w-4" />} label="Số lượng sản phẩm" value={`${contract.products} sản phẩm`} />
              <InfoItem icon={<Shield className="h-4 w-4" />} label="Bảo hành đến" value={contract.warrantyEnd} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày bắt đầu" value={contract.startDate} />
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày kết thúc" value={contract.endDate} />
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold text-card-foreground mb-3">Lịch sử hoạt động</h4>
              <div className="space-y-3">
                {[
                  { date: contract.startDate, text: "Ký hợp đồng", done: true },
                  { date: "—", text: "Sản xuất & kiểm tra", done: contract.progress >= 40 },
                  { date: "—", text: "Bàn giao sản phẩm", done: contract.progress >= 70 },
                  { date: contract.endDate, text: "Nghiệm thu & thanh lý", done: contract.progress === 100 },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`mt-0.5 h-3 w-3 rounded-full shrink-0 ${item.done ? "bg-primary" : "bg-secondary"}`} />
                    <div>
                      <p className={`text-sm ${item.done ? "text-card-foreground font-medium" : "text-muted-foreground"}`}>{item.text}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Điều khoản chính */}
          <TabsContent value="terms" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
            {[
              { title: "Phạm vi cung cấp", content: `Cung cấp ${contract.products} sản phẩm cùng dịch vụ lắp đặt, vận hành thử và bàn giao theo đúng tiêu chuẩn kỹ thuật đã thống nhất.` },
              { title: "Giá trị & thanh toán", content: `Tổng giá trị hợp đồng ${contract.value.toLocaleString()} triệu đồng. Thanh toán theo 3 đợt: 30% tạm ứng, 60% sau bàn giao, 10% sau nghiệm thu.` },
              { title: "Tiến độ thực hiện", content: `Bắt đầu từ ${contract.startDate} và hoàn thành chậm nhất ${contract.endDate}. Phạt chậm tiến độ 0,1%/ngày trên giá trị hợp đồng.` },
              { title: "Bảo hành & hỗ trợ", content: `Bảo hành đến ${contract.warrantyEnd}. Hỗ trợ kỹ thuật 24/7 trong toàn bộ thời gian bảo hành.` },
              { title: "Điều khoản chấm dứt", content: "Hai bên có quyền chấm dứt hợp đồng nếu bên còn lại vi phạm nghiêm trọng và không khắc phục trong vòng 30 ngày kể từ khi nhận thông báo." },
            ].map((t, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-4">
                <h4 className="text-sm font-semibold text-card-foreground mb-1.5">{i + 1}. {t.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.content}</p>
              </div>
            ))}
          </TabsContent>

          {/* Danh mục sản phẩm */}
          <TabsContent value="products" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="rounded-lg border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã SP</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead className="text-right">Số lượng</TableHead>
                    <TableHead className="text-right">Đơn giá (triệu)</TableHead>
                    <TableHead className="text-right">Thành tiền (triệu)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleProducts(contract).map((p) => (
                    <TableRow key={p.code}>
                      <TableCell className="font-medium">{p.code}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{p.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{(p.qty * p.price).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Tài liệu */}
          <TabsContent value="docs" className="flex-1 overflow-y-auto p-6 mt-0">
            <div className="space-y-2">
              {sampleDocs.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.type} • {d.size}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0">
                    <Download className="h-4 w-4" /> Tải về
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Đào tạo & Huấn luyện */}
          <TabsContent value="training" className="flex-1 overflow-y-auto p-6 space-y-3 mt-0">
            {sampleTraining.map((t, i) => (
              <div key={i} className="rounded-lg border border-border/60 bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm font-semibold text-card-foreground">{t.title}</h4>
                  <Badge variant={t.status === "Hoàn thành" ? "secondary" : "default"}>{t.status}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <p><span className="text-card-foreground font-medium">Giảng viên:</span> {t.trainer}</p>
                  <p><span className="text-card-foreground font-medium">Ngày:</span> {t.date}</p>
                  <p><span className="text-card-foreground font-medium">Học viên:</span> {t.attendees}</p>
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
      <ContractEditDialog
        contract={contract}
        open={editing}
        onOpenChange={setEditing}
        onSave={handleSave}
      />
    </Sheet>
  );
};

const TabTrigger = ({ value, icon, label }: { value: string; icon: React.ReactNode; label: string }) => (
  <TabsTrigger
    value={value}
    className="h-11 rounded-none border-b-2 border-transparent bg-transparent px-3 text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none gap-1.5 whitespace-nowrap"
  >
    {icon}
    <span className="text-sm">{label}</span>
  </TabsTrigger>
);

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
    <div className="text-primary mt-0.5">{icon}</div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-card-foreground">{value}</p>
    </div>
  </div>
);

const sampleProducts = (c: Contract) => {
  const unit = Math.max(1, Math.round(c.value / Math.max(1, c.products)));
  return [
    { code: "SP-001", name: "Thiết bị chính loại A", qty: Math.ceil(c.products / 2), price: unit },
    { code: "SP-002", name: "Phụ kiện đi kèm", qty: Math.floor(c.products / 3) || 1, price: Math.max(1, Math.round(unit * 0.4)) },
    { code: "SP-003", name: "Module mở rộng", qty: Math.floor(c.products / 4) || 1, price: Math.max(1, Math.round(unit * 0.6)) },
  ];
};

const sampleDocs = [
  { name: "Hợp đồng gốc.pdf", type: "PDF", size: "1.2 MB" },
  { name: "Phụ lục kỹ thuật.docx", type: "DOCX", size: "480 KB" },
  { name: "Biên bản bàn giao.pdf", type: "PDF", size: "820 KB" },
  { name: "Bảng báo giá chi tiết.xlsx", type: "XLSX", size: "210 KB" },
];

const sampleTraining = [
  { title: "Hướng dẫn vận hành cơ bản", trainer: "Nguyễn Văn A", date: "12/03/2025", attendees: "15 người", status: "Hoàn thành" },
  { title: "Đào tạo bảo trì định kỳ", trainer: "Trần Thị B", date: "20/04/2025", attendees: "8 người", status: "Hoàn thành" },
  { title: "Huấn luyện xử lý sự cố nâng cao", trainer: "Lê Văn C", date: "05/06/2025", attendees: "Dự kiến 10 người", status: "Sắp diễn ra" },
];

export default ContractDetailDialog;
