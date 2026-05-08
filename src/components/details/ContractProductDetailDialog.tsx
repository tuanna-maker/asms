import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cpu, Download, FileText, FileBox, Layers, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { ProductSpec } from "@/hooks/use-products-api";
import { useUpdateContractProduct } from "@/hooks/use-contracts-api";

type ApiSuccess<T> = { success: true; data: T; message?: string };

type ProductDetailResponse = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  manufacturer: string | null;
  unit: string | null;
  status: string;
  totalProduced: number;
  yearReleased: number | null;
  version: string | null;
  specs?: ProductSpec[];
  bom?: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    serialNumbers?: string[];
  }>;
};

type DocumentRow = {
  id: string;
  code: string;
  name: string;
  fileType: "pdf" | "doc" | "xls" | "img" | "other";
  fileSize: string | null;
  fileUrl: string | null;
};

interface Props {
  contractId: string | null;
  productId: string | null;
  contractCode?: string | null;
  quantity: number;
  specs: ProductSpec[];
  specValues: Record<string, string>;
  editable?: boolean;
  onSaveSpecValues?: (values: Record<string, string>) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContractProductDetailDialog = ({
  contractId,
  productId,
  contractCode,
  quantity,
  specs,
  specValues,
  editable = false,
  onSaveSpecValues,
  open,
  onOpenChange,
}: Props) => {
  const updateContractProduct = useUpdateContractProduct();
  const [valuesDraft, setValuesDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setValuesDraft({ ...specValues });
  }, [open, specValues]);

  const enabled = open && !!productId;

  const { data: productDetail } = useQuery({
    queryKey: ["product-detail-for-contract", productId],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ProductDetailResponse>>(
        `/api/v1/products/${encodeURIComponent(productId!)}`,
      );
      return res.data.data;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["product-documents-for-contract", productId],
    enabled,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<DocumentRow[]>>(
        `/api/v1/documents?productId=${encodeURIComponent(productId!)}`,
      );
      return res.data.data ?? [];
    },
  });

  const bom = useMemo(() => productDetail?.bom ?? [], [productDetail?.bom]);

  const hasChanges = useMemo(() => {
    const allKeys = new Set<string>([
      ...specs.map((s) => s.key),
      ...Object.keys(valuesDraft),
      ...Object.keys(specValues),
    ]);
    for (const key of allKeys) {
      const current = (valuesDraft[key] ?? "").trim();
      const original = (specValues[key] ?? "").trim();
      if (current !== original) return true;
    }
    return false;
  }, [valuesDraft, specValues, specs]);

  const handleSave = async () => {
    const cleaned: Record<string, string> = {};
    const allowed = new Set(specs.map((s) => s.key));
    for (const [key, val] of Object.entries(valuesDraft)) {
      if (!allowed.has(key)) continue;
      const trimmed = String(val ?? "").trim();
      if (trimmed.length > 0) cleaned[key] = trimmed;
    }
    if (editable && onSaveSpecValues) {
      onSaveSpecValues(cleaned);
      toast.success("Đã cập nhật thông số");
      onOpenChange(false);
      return;
    }
    if (!contractId || !productId) return;
    try {
      await updateContractProduct.mutateAsync({
        contractId,
        productId,
        payload: { specValues: cleaned },
      });
      toast.success("Đã cập nhật thông số");
      onOpenChange(false);
    } catch {
      toast.error("Không thể cập nhật thông số");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl h-[80vh] p-0 flex flex-col gap-0 overflow-hidden">
        <DialogHeader className="flex h-16 flex-row items-center justify-between border-b border-border/50 px-6 pr-10 space-y-0 shrink-0 gap-3">
          <DialogTitle className="flex items-center gap-2 text-left leading-6 m-0 min-w-0">
            <Package className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate leading-6">
              {productDetail ? `${productDetail.code} - ${productDetail.name}` : "Chi tiết sản phẩm"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border/50 px-6 shrink-0 overflow-x-auto">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabTrigger value="overview" icon={<FileText className="h-4 w-4" />} label="Tổng quan" />
              <TabTrigger value="bom" icon={<Layers className="h-4 w-4" />} label="Linh kiện" />
              <TabTrigger value="specs" icon={<Cpu className="h-4 w-4" />} label="Thông số" />
              <TabTrigger value="docs" icon={<FileBox className="h-4 w-4" />} label="Tài liệu" />
            </TabsList>
          </div>

          <TabsContent value="overview" className="flex-1 overflow-y-auto p-6 mt-0 space-y-3">
            {productDetail ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <InfoCell label="Mã sản phẩm" value={productDetail.code} mono />
                <InfoCell label="Tên" value={productDetail.name} />
                <InfoCell label="Phân loại" value={productDetail.category} />
                <InfoCell label="Hãng sản xuất" value={productDetail.manufacturer ?? "—"} />
                <InfoCell label="Phiên bản" value={productDetail.version ?? "—"} />
                <InfoCell label="Số lượng trong hợp đồng" value={String(quantity)} />
                {contractCode ? <InfoCell label="Hợp đồng" value={contractCode} mono /> : null}
                <div className="sm:col-span-2 rounded-lg bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Mô tả</p>
                  <p className="text-sm whitespace-pre-wrap">{productDetail.description ?? "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Đang tải thông tin sản phẩm...</p>
            )}
          </TabsContent>

          <TabsContent value="bom" className="flex-1 overflow-y-auto p-6 mt-0">
            <Card>
              <CardContent className="pt-6">
                {bom.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sản phẩm chưa khai báo linh kiện (BOM).</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã VT</TableHead>
                        <TableHead>Tên linh kiện</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead className="text-right">Số lượng</TableHead>
                        <TableHead>ĐVT</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bom.map((item) => (
                        <TableRow key={item.materialId}>
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
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="flex-1 overflow-y-auto p-6 mt-0 space-y-4">
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {editable
                ? "Bạn có thể chỉnh sửa giá trị thông số trong popup này. Các tab còn lại chỉ đọc."
                : "Màn xem chỉ cho phép xem thông số, không thể chỉnh sửa."}
            </div>
            {specs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                Sản phẩm chưa khai báo trường thông số. Hãy bổ sung ở màn danh mục sản phẩm trước.
              </div>
            ) : (
              <div className="space-y-2">
                {specs.map((spec) => (
                  <div
                    key={spec.key}
                    className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{spec.label}</p>
                      {spec.unit ? <p className="text-xs text-muted-foreground">Đơn vị: {spec.unit}</p> : null}
                    </div>
                    {editable ? (
                      <Input
                        value={valuesDraft[spec.key] ?? ""}
                        placeholder={`Nhập giá trị${spec.unit ? ` (${spec.unit})` : ""}`}
                        onChange={(e) => setValuesDraft((prev) => ({ ...prev, [spec.key]: e.target.value }))}
                      />
                    ) : (
                      <div className="h-10 rounded-md border border-input bg-muted/30 px-3 flex items-center text-sm">
                        {(valuesDraft[spec.key] ?? "").trim() || "—"}
                      </div>
                    )}
                  </div>
                ))}
                {editable ? (
                  <div className="flex justify-end">
                    <Button onClick={() => void handleSave()} disabled={!hasChanges || updateContractProduct.isPending}>
                      {updateContractProduct.isPending ? "Đang lưu..." : "Lưu thông số"}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="docs" className="flex-1 overflow-y-auto p-6 mt-0">
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sản phẩm chưa có tài liệu đính kèm.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(d.fileType ?? "—").toUpperCase()}
                        {d.fileSize ? ` • ${d.fileSize}` : ""}
                      </p>
                    </div>
                    {d.fileUrl ? (
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="shrink-0">
                        <Button size="sm" variant="outline">
                          <Download className="h-3.5 w-3.5 mr-1" /> Tải
                        </Button>
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground shrink-0">Chưa có file</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
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

const InfoCell = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div className="rounded-lg bg-muted/50 p-3">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-sm font-medium ${mono ? "font-mono text-primary" : ""}`}>{value}</p>
  </div>
);

export default ContractProductDetailDialog;
