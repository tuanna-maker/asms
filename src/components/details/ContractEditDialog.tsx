import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Calendar, DollarSign, Package, Shield, Users,
  Info, ListChecks, Boxes, Files, GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import { useContractDetail, useCreateContract, useUpdateContract } from "@/hooks/use-contracts-api";
import { useProductsList, useUpdateProduct } from "@/hooks/use-products-api";
import { useDeleteDocument, useUploadDocument } from "@/hooks/use-documents-api";

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
  totalProduced?: number | null;
};

type DetailDocument = {
  id?: string;
  code?: string;
  name?: string;
  fileType?: string | null;
  fileSize?: string | null;
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
  id?: string;
  terms?: string | null;
  productsList?: DetailProduct[];
  documents?: DetailDocument[];
  trainingCourses?: DetailTraining[];
};

interface Props {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "edit" | "create";
  customers?: Array<{ id: string; code: string; name: string }>;
}

/** DD/MM/YYYY or YYYY-MM-DD → YYYY-MM-DD for <input type="date" /> */
function toInputDateValue(s: string): string {
  const t = s.trim();
  const vn = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (vn) return `${vn[3]}-${vn[2]}-${vn[1]}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return "";
}

/** YYYY-MM-DD → DD/MM/YYYY for bảng danh sách */
function isoToDisplay(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

const ALLOWED_DOCUMENT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "csv"];
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

function splitTerms(value: string | null | undefined) {
  const text = (value ?? "").replace(/\r\n/g, "\n").trim();
  if (!text) return [""];
  return text.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
}

function joinTerms(items: string[]) {
  const text = items.map((item) => item.trim()).filter(Boolean).join("\n\n");
  return text || null;
}

const ContractEditDialog = ({ contract, open, onOpenChange, mode = "edit", customers = [] }: Props) => {
  const queryClient = useQueryClient();
  const isCreateMode = mode === "create";
  const [form, setForm] = useState({
    customerId: "",
    customer: "",
    title: "",
    value: "",
    products: "",
    startDate: "",
    endDate: "",
    warrantyEnd: "",
    status: "active",
    progress: "0",
    terms: "",
  });
  const [termItems, setTermItems] = useState<string[]>([""]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const { data: detailData, isLoading: detailLoading } = useContractDetail(!isCreateMode && open ? contract?.id ?? null : null);
  const { data: allProducts = [] } = useProductsList(open);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const updateProduct = useUpdateProduct();
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const detail = detailData as ContractDetailData | null;
  const productsList = useMemo<DetailProduct[]>(() => (detail?.productsList ?? []) as DetailProduct[], [detail]);
  const productTotal = useMemo(
    () => (detail ? productsList.reduce((sum, product) => sum + (Number(product.totalProduced) || 0), 0) : contract?.products ?? 0),
    [contract?.products, detail, productsList],
  );
  const documentsList = useMemo<DetailDocument[]>(() => (detail?.documents ?? []) as DetailDocument[], [detail]);
  const trainingList = useMemo<DetailTraining[]>(() => (detail?.trainingCourses ?? []) as DetailTraining[], [detail]);

  useEffect(() => {
    if (contract && !isCreateMode) {
      setForm({
        customerId: "",
        customer: contract.customer,
        title: "",
        value: String(contract.value),
        products: String(contract.products),
        startDate: toInputDateValue(contract.startDate),
        endDate: toInputDateValue(contract.endDate),
        warrantyEnd: contract.warrantyEnd === "—" ? "" : toInputDateValue(contract.warrantyEnd),
        status: contract.status,
        progress: String(contract.progress),
        terms: contract.terms ?? "",
      });
      setTermItems(splitTerms(contract.terms));
    }
  }, [contract, isCreateMode]);

  useEffect(() => {
    if (!open || !isCreateMode) return;
    setForm({
      customerId: "",
      customer: "",
      title: "",
      value: "",
      products: "0",
      startDate: "",
      endDate: "",
      warrantyEnd: "",
      status: "active",
      progress: "0",
      terms: "",
    });
    setTermItems([""]);
    setSelectedProductId("");
    setAddQuantity("1");
    setDocName("");
    setDocFile(null);
  }, [open, isCreateMode]);

  useEffect(() => {
    if (!open || isCreateMode) return;
    const terms = detail?.terms ?? contract?.terms ?? "";
    setTermItems(splitTerms(terms));
  }, [open, detail?.terms, contract?.terms, isCreateMode]);

  if (!contract && !isCreateMode) return null;
  const contractCode = contract?.id ?? "";
  const termsText = (detail?.terms ?? form.terms ?? "").trim();
  const progressValue = Math.min(100, Math.max(0, Number(form.progress) || 0));
  const contractDbId = typeof detail?.id === "string" && detail.id.trim() ? detail.id : contract?.dbId ?? contractCode;
  const productOptions = allProducts.filter(
    (p) => !!p.id && p.id.trim() !== "" && (!p.contractId || p.contractId === contractDbId || p.contractId === contractCode),
  );

  const handleCreateContract = async () => {
    if (!isCreateMode) return;
    if (!form.customerId || !form.startDate || !form.endDate) {
      toast.error("Vui lòng nhập đủ khách hàng và thời gian");
      return;
    }
    try {
      await createContract.mutateAsync({
        customerId: form.customerId,
        title: form.title.trim() || "Hợp đồng mới",
        value: Number(form.value || 0),
        startDate: form.startDate,
        endDate: form.endDate,
        warrantyEnd: form.warrantyEnd || undefined,
        status: "active",
        progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
        terms: joinTerms(termItems),
      });
      toast.success("Đã tạo hợp đồng");
      onOpenChange(false);
    } catch {
      toast.error("Không thể tạo hợp đồng");
    }
  };

  const handleAddProduct = async () => {
    if (isCreateMode || !contractCode) {
      toast.error("Vui lòng tạo hợp đồng trước khi thêm sản phẩm");
      return;
    }
    const qty = Number(addQuantity);
    if (!selectedProductId) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }

    try {
      await updateProduct.mutateAsync({
        id: selectedProductId,
        payload: { contractId: contractCode, totalProduced: qty },
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });

      setSelectedProductId("");
      setAddQuantity("1");
      toast.success("Đã thêm sản phẩm vào hợp đồng");
    } catch {
      toast.error("Không thể thêm sản phẩm vào hợp đồng");
    }
  };

  const handleRemoveProduct = async (product: DetailProduct) => {
    const productId = product.id;
    if (!productId) {
      toast.error("Không xác định được sản phẩm để xóa");
      return;
    }
    try {
      await updateProduct.mutateAsync({
        id: productId,
        payload: { contractId: "" },
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("Đã xóa sản phẩm khỏi hợp đồng");
    } catch {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const handleChangeTerm = (index: number, value: string) => {
    setTermItems((items) => items.map((item, i) => (i === index ? value : item)));
  };

  const handleAddTerm = () => {
    setTermItems((items) => [...items, ""]);
  };

  const handlePersistTerms = async (items = termItems) => {
    if (isCreateMode || !contractCode) return;
    try {
      await updateContract.mutateAsync({
        id: contractCode,
        payload: { terms: joinTerms(items) },
      });
      await queryClient.invalidateQueries({ queryKey: ["contracts", "detail", contractCode] });
    } catch {
      toast.error("Không thể lưu điều khoản hợp đồng");
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

  const handleSelectDocumentFile = (file: File | null) => {
    if (!file) {
      setDocFile(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext)) {
      toast.error("Chỉ hỗ trợ PDF, ảnh PNG/JPG/WebP, Word, Excel hoặc CSV");
      setDocFile(null);
      return;
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      toast.error("File đính kèm không được vượt quá 10MB");
      setDocFile(null);
      return;
    }

    setDocFile(file);
    if (!docName.trim()) {
      setDocName(file.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleAddDocument = async () => {
    if (!docName.trim()) {
      toast.error("Vui lòng nhập tên tài liệu");
      return;
    }
    if (!docFile) {
      toast.error("Vui lòng chọn file đính kèm");
      return;
    }
    try {
      await uploadDocument.mutateAsync({
        file: docFile,
        contractId: contractDbId,
        name: docName.trim(),
        category: "contract",
        fileType: toDocType(docFile),
      });
      if (contractCode) {
        await queryClient.invalidateQueries({ queryKey: ["contracts", "detail", contractCode] });
      }
      setDocName("");
      setDocFile(null);
      toast.success("Đã thêm tài liệu đính kèm");
    } catch {
      toast.error("Không thể thêm tài liệu");
    }
  };

  const handleDeleteDocument = async (doc: DetailDocument) => {
    const docId = doc.id ?? doc.code;
    if (!docId) {
      toast.error("Không xác định được tài liệu để xóa");
      return;
    }
    try {
      await deleteDocument.mutateAsync(docId);
      if (contractCode) {
        await queryClient.invalidateQueries({ queryKey: ["contracts", "detail", contractCode] });
      }
      toast.success("Đã xóa tài liệu");
    } catch {
      toast.error("Không thể xóa tài liệu");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-3xl p-0 flex flex-col gap-0 overflow-hidden">
        <SheetHeader className="flex h-16 flex-row items-center justify-between border-b border-border/50 px-6 pr-14 space-y-0 shrink-0 gap-3">
          <SheetTitle className="flex items-center gap-2 text-left leading-6 m-0 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate leading-6">
              {isCreateMode ? "Tạo hợp đồng mới" : `Chỉnh sửa hợp đồng ${contractCode}`}
            </span>
          </SheetTitle>
          {isCreateMode ? (
            <Button onClick={() => void handleCreateContract()} disabled={createContract.isPending}>
              {createContract.isPending ? "Đang tạo..." : "Tạo hợp đồng"}
            </Button>
          ) : null}
        </SheetHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-border/50 px-6 shrink-0 overflow-x-auto">
            <TabsList className="h-11 bg-transparent p-0 gap-1">
              <TabTrigger value="info" icon={<Info className="h-4 w-4" />} label="Thông tin chung" />
              <TabTrigger value="terms" icon={<ListChecks className="h-4 w-4" />} label="Điều khoản & Điều kiện" />
              <TabTrigger value="products" icon={<Boxes className="h-4 w-4" />} label="Danh mục sản phẩm" />
              <TabTrigger value="docs" icon={<Files className="h-4 w-4" />} label="Tài liệu" />
              <TabTrigger value="training" icon={<GraduationCap className="h-4 w-4" />} label="Đào tạo & Huấn luyện" />
            </TabsList>
          </div>

          <TabsContent value="info" className="flex-1 overflow-y-auto p-6 space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang thực hiện</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="late">Chậm tiến độ</SelectItem>
                  <SelectItem value="liquidated">Đã thanh lý</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Tiến độ:</span>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="w-20 h-8"
                  value={form.progress}
                  onChange={(e) => setForm({ ...form, progress: e.target.value })}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div className="h-3 rounded-full bg-primary transition-all" style={{ width: `${progressValue}%` }} />
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem icon={<Users className="h-4 w-4" />} label="Khách hàng">
                {isCreateMode ? (
                  <Select value={form.customerId} onValueChange={(v) => setForm({ ...form, customerId: v })}>
                    <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={form.customer} readOnly className="bg-muted/50" />
                )}
              </InfoItem>
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Tiêu đề hợp đồng">
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nhập tiêu đề hợp đồng" />
              </InfoItem>
              <InfoItem icon={<DollarSign className="h-4 w-4" />} label="Giá trị hợp đồng">
                <Input type="number" min={0} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
              </InfoItem>
              <InfoItem icon={<Package className="h-4 w-4" />} label="Số lượng sản phẩm">
                <Input type="number" min={0} value={productTotal} readOnly className="bg-muted/50" />
              </InfoItem>
              <InfoItem icon={<Shield className="h-4 w-4" />} label="Bảo hành đến">
                <Input type="date" value={form.warrantyEnd} onChange={(e) => setForm({ ...form, warrantyEnd: e.target.value })} />
              </InfoItem>
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày bắt đầu">
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </InfoItem>
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Ngày kết thúc">
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </InfoItem>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="flex-1 overflow-y-auto p-6 space-y-4 mt-0">
            {isCreateMode && (
              <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                Bạn có thể nhập điều khoản trước; dữ liệu sẽ lưu khi bấm "Tạo hợp đồng".
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-card-foreground">Điều khoản & điều kiện</h4>
                <p className="text-xs text-muted-foreground">Mỗi điều khoản được nhập trong một trường riêng.</p>
              </div>
              <Button size="sm" onClick={handleAddTerm}>
                Thêm điều khoản
              </Button>
            </div>
            <div className="space-y-3">
              {termItems.map((term, index) => (
                <div key={index} className="rounded-lg border border-border/60 bg-card p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Điều khoản {index + 1}</p>
                  <Textarea
                    rows={3}
                    value={term}
                    onChange={(e) => handleChangeTerm(index, e.target.value)}
                    onBlur={() => {
                      if (!isCreateMode) {
                        void handlePersistTerms();
                      }
                    }}
                    placeholder={termsText ? undefined : "Nhập nội dung điều khoản..."}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="products" className="flex-1 overflow-y-auto p-6 mt-0">
            {isCreateMode ? (
              <EmptyHint text="Vui lòng tạo hợp đồng trước, sau đó quay lại để gắn danh mục sản phẩm." />
            ) : (
              <>
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
                            variant="destructive"
                            onClick={() => void handleRemoveProduct(p)}
                            disabled={updateProduct.isPending}
                          >
                            Xóa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-4 rounded-lg border border-border/60 bg-card p-4">
              <h4 className="text-sm font-semibold text-card-foreground mb-3">Thêm sản phẩm</h4>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sản phẩm</p>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sản phẩm từ màn Sản phẩm" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.code} - {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Số lượng</p>
                  <Input
                    type="number"
                    min={1}
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => void handleAddProduct()}
                  disabled={updateProduct.isPending}
                >
                  Thêm sản phẩm
                </Button>
              </div>
            </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="docs" className="flex-1 overflow-y-auto p-6 mt-0">
            {isCreateMode ? (
              <EmptyHint text="Vui lòng tạo hợp đồng trước, sau đó quay lại để thêm tài liệu đính kèm." />
            ) : (
              <>
            {detailLoading && documentsList.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải tài liệu...</div>
            ) : documentsList.length === 0 ? (
              <EmptyHint text="Hợp đồng chưa có tài liệu đính kèm." />
            ) : (
              <div className="space-y-2">
                {documentsList.map((d, i) => (
                  <div key={d.id ?? d.code ?? i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{d.name ?? "Tài liệu"}</p>
                      <p className="text-xs text-muted-foreground">
                        {(d.fileType ?? "—").toString().toUpperCase()}
                        {d.fileSize ? ` • ${d.fileSize}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline">Tài liệu</Badge>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDeleteDocument(d)}
                        disabled={deleteDocument.isPending}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-lg border border-border/60 bg-card p-4 space-y-3">
              <h4 className="text-sm font-semibold text-card-foreground">Thêm tài liệu đính kèm</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tên tài liệu</p>
                  <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="Ví dụ: BB nghiệm thu đợt 1" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">File đính kèm</p>
                  <Input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,application/pdf,image/png,image/jpeg,image/webp"
                    onChange={(e) => handleSelectDocumentFile(e.target.files?.[0] ?? null)}
                  />
                  {docFile ? (
                    <p className="text-xs text-muted-foreground">
                      Đã chọn: {docFile.name} ({Math.max(1, Math.round(docFile.size / 1024))} KB)
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => void handleAddDocument()} disabled={uploadDocument.isPending}>
                  Thêm tài liệu
                </Button>
              </div>
            </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="training" className="flex-1 overflow-y-auto p-6 space-y-3 mt-0">
            {isCreateMode ? (
              <EmptyHint text="Vui lòng tạo hợp đồng trước, sau đó quay lại để liên kết khóa đào tạo." />
            ) : (
              <>
            {detailLoading && trainingList.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải khóa đào tạo...</div>
            ) : trainingList.length === 0 ? (
              <EmptyHint text="Hợp đồng chưa có khóa đào tạo nào." />
            ) : (
              trainingList.map((t, i) => (
                <div key={t.id ?? t.code ?? i} className="rounded-lg border border-border/60 bg-card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-card-foreground">{t.title ?? "Khóa đào tạo"}</h4>
                    <Badge variant={String(t.status) === "completed" ? "secondary" : "default"}>{t.status ?? "planned"}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <p><span className="text-card-foreground font-medium">Mã khóa:</span> {t.code ?? "—"}</p>
                    <p><span className="text-card-foreground font-medium">Bắt đầu:</span> {t.startDate ? isoToDisplay(t.startDate.slice(0, 10)) : "—"}</p>
                    <p><span className="text-card-foreground font-medium">Kết thúc:</span> {t.endDate ? isoToDisplay(t.endDate.slice(0, 10)) : "—"}</p>
                    <p><span className="text-card-foreground font-medium">Hình thức:</span> {t.type ?? "—"}</p>
                    <p><span className="text-card-foreground font-medium">Học viên:</span> {t.participants ?? 0}</p>
                    <p><span className="text-card-foreground font-medium">Địa điểm:</span> {t.location ?? "—"}</p>
                  </div>
                </div>
              ))
            )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
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

const InfoItem = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
  <div className="space-y-2">
    <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="w-full">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        {children}
      </div>
    </div>
  </div>
);

const EmptyHint = ({ text }: { text: string }) => (
  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center">
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default ContractEditDialog;
