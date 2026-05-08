import { useState, useMemo } from "react";
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
import ContractProductDetailDialog from "./ContractProductDetailDialog";
import { useContractDetail } from "@/hooks/use-contracts-api";
import type { ProductSpec } from "@/hooks/use-products-api";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "secondary" },
  late: { label: "Chậm tiến độ", variant: "destructive" },
  liquidated: { label: "Đã thanh lý", variant: "outline" },
};

const trainingStatusLabel: Record<string, string> = {
  planned: "Lên kế hoạch",
  ongoing: "Đang diễn ra",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

type Contract = {
  id: string; dbId?: string; customer: string; value: number; products: number;
  startDate: string; endDate: string; warrantyEnd: string; status: string; progress: number;
  terms?: string | null;
};

type DetailProduct = {
  id?: string;
  code?: string;
  name?: string;
  category?: string | null;
  status?: string | null;
  manufacturer?: string | null;
  unit?: string | null;
  totalProduced?: number | null;
  specs?: ProductSpec[];
  specValues?: Record<string, string>;
};

type DetailDocument = {
  id?: string;
  code?: string;
  name?: string;
  fileType?: string | null;
  fileSize?: string | null;
  fileUrl?: string | null;
  category?: string | null;
};

type DetailTraining = {
  id?: string;
  code?: string;
  title?: string;
  type?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  participants?: number | null;
  status?: string | null;
  location?: string | null;
};

type ContractDetailData = {
  terms?: string | null;
  productsList?: DetailProduct[];
  documents?: DetailDocument[];
  trainingCourses?: DetailTraining[];
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

interface Props {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractDetailDialog = ({ contract, open, onOpenChange }: Props) => {
  const [editing, setEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DetailProduct | null>(null);

  const { data: detailData, isLoading: detailLoading } = useContractDetail(open ? contract?.id ?? null : null);
  const detail = detailData as ContractDetailData | null;

  const productsList = useMemo<DetailProduct[]>(
    () => (detail?.productsList ?? []) as DetailProduct[],
    [detail],
  );
  const productTotal = useMemo(
    () => (detail ? productsList.reduce((sum, product) => sum + (Number(product.totalProduced) || 0), 0) : contract?.products ?? 0),
    [contract?.products, detail, productsList],
  );
  const documentsList = useMemo<DetailDocument[]>(
    () => (detail?.documents ?? []) as DetailDocument[],
    [detail],
  );
  const trainingList = useMemo<DetailTraining[]>(
    () => (detail?.trainingCourses ?? []) as DetailTraining[],
    [detail],
  );

  if (!contract) return null;
  const cfg = statusConfig[contract.status] || statusConfig.active;
  const termsText = (detail?.terms ?? contract.terms ?? "").trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[75vw] xl:max-w-[1140px] p-0 flex flex-col gap-0 overflow-hidden"
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
              <InfoItem icon={<Package className="h-4 w-4" />} label="Số lượng sản phẩm" value={`${productTotal} sản phẩm`} />
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
            {detailLoading && !termsText ? (
              <div className="text-sm text-muted-foreground">Đang tải điều khoản hợp đồng...</div>
            ) : termsText ? (
              <div className="rounded-lg border border-border/60 bg-card p-4">
                <p className="text-sm text-card-foreground whitespace-pre-wrap leading-relaxed">{termsText}</p>
              </div>
            ) : (
              <EmptyHint text="Hợp đồng chưa có điều khoản. Hãy chỉnh sửa hợp đồng để bổ sung." />
            )}
          </TabsContent>

          {/* Danh mục sản phẩm */}
          <TabsContent value="products" className="flex-1 overflow-y-auto p-6 mt-0">
            {detailLoading && productsList.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải danh mục sản phẩm...</div>
            ) : productsList.length === 0 ? (
              <EmptyHint text="Hợp đồng chưa có sản phẩm gắn kèm." />
            ) : (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã SP</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>Phân loại</TableHead>
                      <TableHead>Hãng sản xuất</TableHead>
                      <TableHead className="text-right">Số lượng</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsList.map((p, idx) => (
                      <TableRow key={p.id ?? p.code ?? idx}>
                        <TableCell className="font-medium">{p.code ?? "—"}</TableCell>
                        <TableCell>{p.name ?? "—"}</TableCell>
                        <TableCell>{p.category ?? "—"}</TableCell>
                        <TableCell>{p.manufacturer ?? "—"}</TableCell>
                        <TableCell className="text-right">{p.totalProduced ?? 0}</TableCell>
                        <TableCell className="text-right">{p.status ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedProduct(p)}
                            disabled={!p.id}
                          >
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Tài liệu */}
          <TabsContent value="docs" className="flex-1 overflow-y-auto p-6 mt-0">
            {detailLoading && documentsList.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải tài liệu...</div>
            ) : documentsList.length === 0 ? (
              <EmptyHint text="Hợp đồng chưa có tài liệu đính kèm." />
            ) : (
              <div className="space-y-2">
                {documentsList.map((d, i) => (
                  <div key={d.id ?? d.code ?? i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-card-foreground truncate">{d.name ?? "Tài liệu"}</p>
                        <p className="text-xs text-muted-foreground">
                          {(d.fileType ?? "—").toString().toUpperCase()}
                          {d.fileSize ? ` • ${d.fileSize}` : ""}
                        </p>
                      </div>
                    </div>
                    {d.fileUrl ? (
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline shrink-0"
                      >
                        <Download className="h-4 w-4" /> Tải về
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">Chưa có file</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Đào tạo & Huấn luyện */}
          <TabsContent value="training" className="flex-1 overflow-y-auto p-6 space-y-3 mt-0">
            {detailLoading && trainingList.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải khóa đào tạo...</div>
            ) : trainingList.length === 0 ? (
              <EmptyHint text="Hợp đồng chưa có khóa đào tạo nào." />
            ) : (
              trainingList.map((t, i) => {
                const statusKey = String(t.status ?? "planned");
                return (
                  <div key={t.id ?? t.code ?? i} className="rounded-lg border border-border/60 bg-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-semibold text-card-foreground">{t.title ?? "Khóa đào tạo"}</h4>
                      <Badge variant={statusKey === "completed" ? "secondary" : "default"}>
                        {trainingStatusLabel[statusKey] ?? statusKey}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <p><span className="text-card-foreground font-medium">Mã khóa:</span> {t.code ?? "—"}</p>
                      <p><span className="text-card-foreground font-medium">Bắt đầu:</span> {formatDate(t.startDate)}</p>
                      <p><span className="text-card-foreground font-medium">Kết thúc:</span> {formatDate(t.endDate)}</p>
                      <p><span className="text-card-foreground font-medium">Hình thức:</span> {t.type ?? "—"}</p>
                      <p><span className="text-card-foreground font-medium">Học viên:</span> {t.participants ?? 0}</p>
                      <p><span className="text-card-foreground font-medium">Địa điểm:</span> {t.location ?? "—"}</p>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
      <ContractEditDialog
        contract={contract}
        open={editing}
        onOpenChange={setEditing}
      />
      <ContractProductDetailDialog
        contractId={(detailData as { id?: string } | null)?.id ?? contract.dbId ?? contract.id}
        contractCode={contract.id}
        productId={selectedProduct?.id ?? null}
        quantity={Number(selectedProduct?.totalProduced) || 0}
        specs={selectedProduct?.specs ?? []}
        specValues={selectedProduct?.specValues ?? {}}
        editable={false}
        open={!!selectedProduct}
        onOpenChange={(next) => {
          if (!next) setSelectedProduct(null);
        }}
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

const EmptyHint = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center">
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default ContractDetailDialog;
