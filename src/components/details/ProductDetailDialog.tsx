import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Cpu, FileText, Layers, History, User, Clock, Settings2, FileBox, GraduationCap, Download, Calendar, MapPin, Users as UsersIcon, Plus } from "lucide-react";
import { DefenseProduct, BOMItem, productCategoryColors, defaultHistory, defaultDocuments, defaultTrainings, ProductDocument, ProductTraining } from "@/data/productsData";
import { useNavigate } from "react-router-dom";
import ManageSerialNumbersDialog from "./ManageSerialNumbersDialog";
import AddDocumentDialog from "./AddDocumentDialog";
import ProductImageGallery from "./ProductImageGallery";

interface Props {
  product: DefenseProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateBom?: (productId: string, materialId: string, serialNumbers: string[]) => void;
  onAddDocument?: (productId: string, doc: ProductDocument) => void;
}

const statusMap: Record<DefenseProduct["status"], { label: string; cls: string }> = {
  developing: { label: "Đang phát triển", cls: "bg-warning/10 text-warning border-warning/30" },
  producing: { label: "Đang sản xuất", cls: "bg-info/10 text-info border-info/30" },
  equipped: { label: "Đã trang bị", cls: "bg-success/10 text-success border-success/30" },
  stopped: { label: "Dừng SX", cls: "bg-muted text-muted-foreground border-border" },
};

const ProductDetailDialog = ({ product, open, onOpenChange, onUpdateBom, onAddDocument }: Props) => {
  const navigate = useNavigate();
  const [snItem, setSnItem] = useState<BOMItem | null>(null);
  const [snOpen, setSnOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  if (!product) return null;
  const status = statusMap[product.status];

  const openSn = (item: BOMItem) => { setSnItem(item); setSnOpen(true); };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pr-8">
            <div className="space-y-1 text-left">
              <SheetTitle className="text-xl">{product.name}</SheetTitle>
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
              <Badge variant="outline" className={status.cls}>{status.label}</Badge>
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
                  <p className="text-sm leading-relaxed">{product.description || "—"}</p>
                </div>
              </CardContent>
            </Card>
            <ProductImageGallery productId={product.id} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <InfoCard label="Mã SP" value={product.id} mono />
              <InfoCard label="Mã quân sự" value={product.code} mono />
              <InfoCard label="Phiên bản" value={product.version} />
              <InfoCard label="Phân loại" value={product.category} />
              <InfoCard label="Trạng thái" value={statusMap[product.status].label} />
              <InfoCard label="Năm phát hành" value={product.yearReleased.toString()} />
              <InfoCard label="Đơn vị sử dụng" value={product.unit} />
              <InfoCard label="Nhà sản xuất" value={product.manufacturer} />
              <InfoCard label="Đã sản xuất" value={`${product.totalProduced.toLocaleString()} sp`} />
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
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.bom.map((item) => {
                      const snCount = item.serialNumbers?.length ?? 0;
                      const complete = snCount === item.quantity;
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
                            {snCount > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {item.serialNumbers!.slice(0, 2).map((sn) => (
                                  <Badge key={sn} variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                                    {sn}
                                  </Badge>
                                ))}
                                {snCount > 2 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    +{snCount - 2}
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ml-1 ${complete ? "bg-success/10 text-success border-success/30" : "bg-warning/10 text-warning border-warning/30"}`}
                                >
                                  {snCount}/{item.quantity}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Chưa gán</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell className="text-muted-foreground">{item.unit}</TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="ghost" onClick={() => openSn(item)}>
                              <Settings2 className="h-3.5 w-3.5 mr-1" />
                              Quản lý SN
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="mt-4">
            <Card>
              <CardContent className="pt-6 space-y-2">
                {product.specs.map((s, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{s.label}</span>
                    <span className="text-sm font-medium">{s.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <p className="text-sm text-muted-foreground">
                    Tài liệu kỹ thuật, hướng dẫn sử dụng và quy trình liên quan đến sản phẩm.
                  </p>
                  <Button size="sm" onClick={() => setAddDocOpen(true)} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm tài liệu
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên tài liệu</TableHead>
                      <TableHead>Loại</TableHead>
                      <TableHead>Phiên bản</TableHead>
                      <TableHead>Dung lượng</TableHead>
                      <TableHead>Người tải lên</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...(product.documents ?? defaultDocuments)]
                      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
                      .map((doc: ProductDocument) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileBox className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate max-w-[220px]" title={doc.name}>{doc.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{doc.version}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{doc.size}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p className="font-medium">{doc.uploadedBy}</p>
                            <p className="text-muted-foreground">
                              {new Date(doc.uploadedAt).toLocaleDateString("vi-VN")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost">
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Tải về
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="training" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Các khóa đào tạo, huấn luyện vận hành và bảo trì sản phẩm.
                </p>
                <div className="space-y-3">
                  {(product.trainings ?? defaultTrainings).map((tr: ProductTraining) => {
                    const statusCls =
                      tr.status === "completed"
                        ? "bg-success/10 text-success border-success/30"
                        : tr.status === "scheduled"
                        ? "bg-info/10 text-info border-info/30"
                        : "bg-muted text-muted-foreground border-border";
                    const statusLabel =
                      tr.status === "completed" ? "Đã hoàn thành" : tr.status === "scheduled" ? "Sắp diễn ra" : "Đã hủy";
                    return (
                      <div key={tr.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <GraduationCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm">{tr.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Giảng viên: {tr.trainer}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${statusCls} text-xs shrink-0`}>{statusLabel}</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(tr.date).toLocaleDateString("vi-VN")}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {tr.duration}
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <UsersIcon className="h-3 w-3" />
                            {tr.participants} học viên
                          </div>
                          {tr.location && (
                            <div className="flex items-center gap-1.5 text-muted-foreground truncate" title={tr.location}>
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{tr.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  {(product.history ?? defaultHistory).map((entry, idx) => (
                    <div key={entry.id} className="relative pl-6 pb-4 border-l-2 border-border last:border-l-transparent last:pb-0">
                      <div className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{entry.updatedBy}</span>
                          {idx === 0 && (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-[10px] px-1.5 py-0">
                              Mới nhất
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(entry.updatedAt).toLocaleString("vi-VN", {
                            day: "2-digit", month: "2-digit", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-muted/30 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="hover:bg-transparent">
                              <TableHead className="h-8 text-xs">Trường</TableHead>
                              <TableHead className="h-8 text-xs">Giá trị cũ</TableHead>
                              <TableHead className="h-8 text-xs">Giá trị mới</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.changes.map((c, i) => (
                              <TableRow key={i}>
                                <TableCell className="py-2 text-xs font-medium">{c.field}</TableCell>
                                <TableCell className="py-2 text-xs text-destructive line-through max-w-[200px] truncate" title={c.oldValue}>
                                  {c.oldValue}
                                </TableCell>
                                <TableCell className="py-2 text-xs text-success font-medium max-w-[200px] truncate" title={c.newValue}>
                                  {c.newValue}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {entry.note && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Ghi chú: {entry.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>

      <ManageSerialNumbersDialog
        item={snItem}
        open={snOpen}
        onOpenChange={setSnOpen}
        onSave={(sns) => {
          if (snItem && onUpdateBom) onUpdateBom(product.id, snItem.materialId, sns);
        }}
      />

      <AddDocumentDialog
        open={addDocOpen}
        onOpenChange={setAddDocOpen}
        onAdd={(doc) => onAddDocument?.(product.id, doc)}
      />
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

export default ProductDetailDialog;
