import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  FileText, Calendar, Clock, CircleDot, DollarSign, Package, Shield, Users,
  Info, ListChecks, Boxes, Files, MessageSquareWarning, Download,
} from "lucide-react";
import { CustomerFeedbackSection } from "@/components/feedback/CustomerFeedbackSection";
import { CONTRACT_STATUS_LABELS } from "@/lib/contract-status";
import {
  computeContractOperationalStatus,
  type DisplayContractStatus,
} from "@/lib/contract-display-status";
import { formatSlaDeadline } from "@/lib/contract-execution-sla";
import { resolveDefinitionLabel } from "@/lib/attribute-definition-map";
import { getProductStatusLabel } from "@/lib/display-labels";
import { resolveUploadUrl } from "@/lib/upload-url";
import { toast } from "sonner";
import { getApiErrorMessage, toastApiError } from "@/lib/api-errors";
import ContractProductDetailDialog from "./ContractProductDetailDialog";
import { useContractDetail, useCreateContract, useUpdateContract } from "@/hooks/use-contracts-api";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import { invalidateContractQueries } from "@/hooks/use-contracts-api";
import { useProductsList } from "@/hooks/use-products-api";
import type { ProductSpec } from "@/hooks/use-products-api";
import { useDeleteDocument, useUploadDocument } from "@/hooks/use-documents-api";
import { api } from "@/lib/api";
import { ContractTermsPicker } from "@/components/contracts/ContractTermsPicker";
import {
  normalizeClauseEntriesFromDetail,
  type ContractClauseEntry,
} from "@/lib/contract-clause-items";

type Contract = {
  id: string; dbId?: string; customer: string; value: number; products: number;
  startDate: string; endDate: string; warrantyEnd: string; status: string; displayStatus?: string; progress: number;
  endReminderDays?: number;
  terms?: string | null;
  clauseIds?: string[];
  clauseItems?: ContractClauseEntry[];
  contractTypeCode?: string | null;
};

type DetailProduct = {
  id?: string;
  code?: string;
  name?: string;
  category?: string | null;
  status?: string | null;
  manufacturer?: string | null;
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
};

type DraftProduct = DetailProduct & {
  id: string;
  totalProduced: number;
  specs: ProductSpec[];
  specValues: Record<string, string>;
};

type DraftDocument = {
  tempId: string;
  name: string;
  file: File;
};

type ContractDetailData = {
  id?: string;
  customerId?: string;
  customer?: { id: string; code: string; name: string };
  title?: string;
  terms?: string | null;
  clauseIds?: string[];
  clauseItems?: ContractClauseEntry[];
  contractTypeCode?: string | null;
  status?: string;
  displayStatus?: string;
  startDate?: string;
  endDate?: string;
  endReminderDays?: number;
  productsList?: DetailProduct[];
  documents?: DetailDocument[];
  linkedHandover?: {
    id: string;
    code: string;
    status: string;
    workflowId?: string | null;
    workflowName?: string | null;
  } | null;
  linkedTraining?: {
    id: string;
    code: string;
    title: string;
    status: string;
    workflowId?: string | null;
    workflowName?: string | null;
  } | null;
  slaHours?: number | null;
  updatedAt?: string;
};

interface Props {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "edit" | "create";
  initialTab?: string;
  customers?: Array<{ id: string; code: string; name: string }>;
  onContractSaved?: (patch: { id: string; contractTypeCode: string | null }) => void;
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

function toDocType(file: File): "pdf" | "doc" | "xls" | "img" | "other" {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv"].includes(ext)) return "xls";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "img";
  return "other";
}


const ContractEditDialog = ({
  contract,
  open,
  onOpenChange,
  mode = "edit",
  initialTab = "info",
  customers = [],
  onContractSaved,
}: Props) => {
  const isCreateMode = mode === "create";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [form, setForm] = useState({
    customerId: "",
    customer: "",
    title: "",
    value: "",
    products: "",
    startDate: "",
    endDate: "",
    warrantyEnd: "",
    status: "draft" as DisplayContractStatus,
    slaHours: "",
    progress: "0",
    endReminderDays: "7",
    terms: "",
    contractTypeCode: "",
  });
  const [clauseItems, setClauseItems] = useState<ContractClauseEntry[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [draftProducts, setDraftProducts] = useState<DraftProduct[]>([]);
  const [draftExistingDocuments, setDraftExistingDocuments] = useState<DetailDocument[]>([]);
  const [draftNewDocuments, setDraftNewDocuments] = useState<DraftDocument[]>([]);
  const [removedDocumentIds, setRemovedDocumentIds] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<DraftProduct | null>(null);
  const { data: detailData, isLoading: detailLoading } = useContractDetail(!isCreateMode && open ? contract?.id ?? null : null);
  const { data: allProducts = [] } = useProductsList(open);
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const { data: contractTypeOptions = [] } = useDefinitionsList("contract_type");
  const { data: contractStatusOptions = [] } = useDefinitionsList("contract_status");
  const statusManualOverrideRef = useRef(false);
  const detail = detailData as ContractDetailData | null;
  const uploadDocument = useUploadDocument();
  const deleteDocument = useDeleteDocument();
  const productsList = useMemo<DetailProduct[]>(() => (detail?.productsList ?? []) as DetailProduct[], [detail]);
  const productMapById = useMemo(
    () => new Map(allProducts.filter((p) => !!p.id).map((p) => [p.id, p])),
    [allProducts],
  );
  const productTotal = useMemo(
    () => draftProducts.reduce((sum, product) => sum + (Number(product.totalProduced) || 0), 0),
    [draftProducts],
  );
  const documentsList = useMemo<DetailDocument[]>(() => (detail?.documents ?? []) as DetailDocument[], [detail]);
  const combinedDraftDocuments = useMemo(
    () => [
      ...draftExistingDocuments,
      ...draftNewDocuments.map((doc) => ({
        code: doc.tempId,
        name: doc.name,
        fileType: toDocType(doc.file),
        fileSize: `${Math.max(1, Math.round(doc.file.size / 1024))} KB`,
        fileUrl: null as string | null,
      })),
    ],
    [draftExistingDocuments, draftNewDocuments],
  );
  useEffect(() => {
    if (!open || !contract || isCreateMode) return;
    setForm({
      customerId: "",
      customer: contract.customer,
      title: "",
      value: String(contract.value),
      products: String(contract.products),
      startDate: toInputDateValue(contract.startDate),
      endDate: toInputDateValue(contract.endDate),
      warrantyEnd: contract.warrantyEnd === "—" ? "" : toInputDateValue(contract.warrantyEnd),
      status: (contract.displayStatus ?? contract.status ?? "draft") as DisplayContractStatus,
      slaHours: "",
      progress: String(contract.progress),
      endReminderDays: String(contract.endReminderDays ?? 7),
      terms: contract.terms ?? "",
      contractTypeCode: contract.contractTypeCode ?? "",
    });
    setClauseItems(
      normalizeClauseEntriesFromDetail({
        clauseItems: contract.clauseItems,
        clauseIds: contract.clauseIds,
      }),
    );
  }, [open, contract?.id, isCreateMode]);

  useEffect(() => {
    if (!open) return;
    const tab = initialTab === "handover" || initialTab === "training" ? "info" : initialTab;
    setActiveTab(tab);
  }, [open, initialTab]);

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
      status: "draft",
      slaHours: "",
      progress: "0",
      endReminderDays: "7",
      terms: "",
      contractTypeCode: "",
    });
    setClauseItems([]);
    setSelectedProductId("");
    setAddQuantity("1");
    setDocName("");
    setDocFile(null);
    setDraftProducts([]);
    setDraftExistingDocuments([]);
    setDraftNewDocuments([]);
    setRemovedDocumentIds([]);
    setSelectedProduct(null);
  }, [open, isCreateMode]);

  useEffect(() => {
    if (!open || isCreateMode || !detail) return;
    setClauseItems(
      normalizeClauseEntriesFromDetail({
        clauseItems: detail.clauseItems as ContractClauseEntry[] | undefined,
        clauseIds: detail.clauseIds,
      }),
    );
  }, [open, isCreateMode, detail?.id, detail?.clauseIds, detail?.clauseItems]);

  useEffect(() => {
    if (!open || isCreateMode || !detail) return;
    const cid = detail.customerId ?? detail.customer?.id ?? "";
    const loaded = (detail.displayStatus ?? detail.status ?? "draft") as DisplayContractStatus;
    statusManualOverrideRef.current = loaded === "completed";
    setForm((f) => ({
      ...f,
      ...(cid ? { customerId: cid } : {}),
      ...(detail.customer?.name ? { customer: detail.customer.name } : {}),
      ...(detail.title ? { title: detail.title } : {}),
      status: loaded,
      slaHours:
        detail.slaHours != null && detail.slaHours >= 0 ? String(detail.slaHours) : "",
    }));
    if (typeof detail.endReminderDays === "number") {
      setForm((f) => ({ ...f, endReminderDays: String(detail.endReminderDays) }));
    }
  }, [
    open,
    isCreateMode,
    detail?.id,
    detail?.customerId,
    detail?.customer,
    detail?.title,
    detail?.endReminderDays,
    detail?.status,
    detail?.displayStatus,
    detail?.slaHours,
  ]);

  useEffect(() => {
    if (!open) return;
    if (isCreateMode) {
      setDraftProducts([]);
      setDraftExistingDocuments([]);
      setDraftNewDocuments([]);
      setRemovedDocumentIds([]);
      return;
    }
    const mappedProducts = (productsList ?? [])
      .filter((p): p is DetailProduct & { id: string } => typeof p.id === "string" && p.id.trim() !== "")
      .map((p) => ({
        ...p,
        id: p.id,
        totalProduced: Number(p.totalProduced) || 0,
        specs: (p.specs ?? []) as ProductSpec[],
        specValues: { ...(p.specValues ?? {}) },
      }));
    setDraftProducts(mappedProducts);
    setDraftExistingDocuments(documentsList);
    setDraftNewDocuments([]);
    setRemovedDocumentIds([]);
    setSelectedProduct(null);
  }, [open, isCreateMode, productsList, documentsList]);

  useEffect(() => {
    if (!open || draftProducts.length === 0) return;
    setDraftProducts((items) =>
      items.map((item) => {
        const latest = productMapById.get(item.id);
        if (!latest) return item;
        return {
          ...item,
          code: latest.code ?? item.code,
          name: latest.name ?? item.name,
          category: latest.category ?? item.category,
          manufacturer: latest.manufacturer ?? item.manufacturer,
          status: latest.status ?? item.status,
          specs: (latest.specs ?? item.specs ?? []) as ProductSpec[],
        };
      }),
    );
  }, [open, draftProducts.length, productMapById]);

  const progressValue = Math.min(100, Math.max(0, Number(form.progress) || 0));

  const slaHoursValue = useMemo(() => {
    const raw = (form.slaHours ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
  }, [form.slaHours]);

  const suggestedStatus = useMemo(
    () =>
      computeContractOperationalStatus({
        status: "draft",
        startDate: form.startDate,
        endDate: form.endDate,
        slaHours: slaHoursValue,
        updatedAt: detail?.updatedAt ?? new Date().toISOString(),
      }),
    [form.startDate, form.endDate, slaHoursValue, detail?.updatedAt],
  );

  const slaOverduePreview = form.status === "late" || suggestedStatus === "late";

  const statusSelectOptions = useMemo(() => {
    if (contractStatusOptions.length > 0) {
      return contractStatusOptions.map((item) => ({
        value: item.code,
        label: resolveDefinitionLabel(contractStatusOptions, item.code),
      }));
    }
    return (Object.keys(CONTRACT_STATUS_LABELS) as DisplayContractStatus[]).map((code) => ({
      value: code,
      label: CONTRACT_STATUS_LABELS[code] ?? code,
    }));
  }, [contractStatusOptions]);

  useEffect(() => {
    if (!open) {
      statusManualOverrideRef.current = false;
      return;
    }
    if (form.status === "completed" || statusManualOverrideRef.current) return;
    if (!form.startDate || !form.endDate) return;
    setForm((f) => (f.status === suggestedStatus ? f : { ...f, status: suggestedStatus }));
  }, [open, suggestedStatus, form.startDate, form.endDate, form.status]);

  if (!contract && !isCreateMode) return null;
  const contractCode = contract?.id ?? "";
  const contractDbId = typeof detail?.id === "string" && detail.id.trim() ? detail.id : contract?.dbId ?? contractCode;
  const feedbackCustomerId =
    (detail?.customerId ?? detail?.customer?.id ?? form.customerId) || null;
  const assignedProductIds = new Set(draftProducts.map((p) => p.id));
  const productOptions = allProducts.filter(
    (p) =>
      !!p.id &&
      p.id.trim() !== "" &&
      !assignedProductIds.has(p.id),
  );

  const syncProductsToContract = async (targetContractId: string) => {
    await api.put(`/api/v1/contracts/${encodeURIComponent(targetContractId)}/products`, {
      products: draftProducts.map((product) => {
        const cleanedValues: Record<string, string> = {};
        const allowedKeys = new Set(product.specs.map((s) => s.key));
        for (const [key, val] of Object.entries(product.specValues ?? {})) {
          if (!allowedKeys.has(key)) continue;
          const trimmed = String(val ?? "").trim();
          if (trimmed.length > 0) cleanedValues[key] = trimmed;
        }
        return {
          productId: product.id,
          quantity: Math.max(1, Number(product.totalProduced) || 1),
          ...(Object.keys(cleanedValues).length > 0 ? { specValues: cleanedValues } : {}),
        };
      }),
    });
  };

  const syncDocumentsToContract = async (targetContractId: string) => {
    for (const docId of removedDocumentIds) {
      await deleteDocument.mutateAsync(docId);
    }
    for (const doc of draftNewDocuments) {
      await uploadDocument.mutateAsync({
        file: doc.file,
        contractId: targetContractId,
        name: doc.name.trim(),
        categoryCode: "contract",
        fileType: toDocType(doc.file),
      });
    }
  };

  const handleCreateContract = async () => {
    if (!isCreateMode) return;
    if (!form.customerId || !form.startDate || !form.endDate) {
      toast.error("Vui lòng nhập đủ khách hàng và thời gian");
      return;
    }
    try {
      const created = await createContract.mutateAsync({
        customerId: form.customerId,
        title: form.title.trim() || "Hợp đồng mới",
        value: Number(form.value || 0),
        products: Math.max(0, Number(productTotal) || 0),
        startDate: form.startDate,
        endDate: form.endDate,
        warrantyEnd: form.warrantyEnd || undefined,
        endReminderDays: Math.max(0, Number(form.endReminderDays) || 7),
        status: form.status,
        slaHours: slaHoursValue,
        progress: progressValue,
        clauseItems: clauseItems.map((e) => ({ clauseId: e.clauseId, content: e.content })),
        ...(form.contractTypeCode.trim() ? { contractTypeCode: form.contractTypeCode.trim() } : {}),
      });
      const createdPayload = (created as { data?: { data?: { id?: string; code?: string } } })?.data?.data;
      const createdContractId = createdPayload?.id ?? createdPayload?.code;
      if (createdContractId) {
        await syncProductsToContract(createdContractId);
        await syncDocumentsToContract(createdContractId);
      } else if (draftProducts.length > 0 || draftNewDocuments.length > 0) {
        toast.warning("Đã tạo hợp đồng nhưng chưa liên kết được sản phẩm/tài liệu. Vui lòng mở lại để lưu bổ sung.");
      }
      toast.success("Đã tạo hợp đồng");
      onOpenChange(false);
    } catch (e) {
      toastApiError(e, "Không thể tạo hợp đồng");
    }
  };

  const handleAddProduct = async () => {
    const qty = Number(addQuantity);
    if (!selectedProductId) {
      toast.error("Vui lòng chọn sản phẩm");
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      toast.error("Số lượng phải lớn hơn 0");
      return;
    }
    const selected = allProducts.find((p) => p.id === selectedProductId);
    if (!selected) {
      toast.error("Không tìm thấy sản phẩm đã chọn");
      return;
    }
    setDraftProducts((items) => {
      const existed = items.find((item) => item.id === selected.id);
      if (existed) {
        return items.map((item) =>
          item.id === selected.id
            ? { ...item, totalProduced: Math.max(1, Number(item.totalProduced) + qty) }
            : item,
        );
      }
      return [
        ...items,
        {
          id: selected.id,
          code: selected.code,
          name: selected.name,
          category: selected.category,
          status: selected.status,
          manufacturer: selected.manufacturer,
          totalProduced: qty,
          specs: (selected.specs ?? []) as ProductSpec[],
          specValues: {},
        },
      ];
    });
    setSelectedProductId("");
    setAddQuantity("1");
  };

  const handleRemoveProduct = (product: DraftProduct) => {
    const productId = product.id;
    if (!productId) {
      toast.error("Không xác định được sản phẩm để xóa");
      return;
    }
    setDraftProducts((items) => items.filter((item) => item.id !== productId));
  };

  const handleSaveContract = async () => {
    if (isCreateMode || !contractCode) return;
    if (!form.startDate || !form.endDate) {
      toast.error("Vui lòng nhập ngày bắt đầu và kết thúc");
      return;
    }
    const savedTypeCode = form.contractTypeCode.trim() || null;
    try {
      await updateContract.mutateAsync({
        id: contractCode,
        payload: {
          value: Number(form.value || 0),
          startDate: form.startDate,
          endDate: form.endDate,
          warrantyEnd: form.warrantyEnd || undefined,
          endReminderDays: Math.max(0, Number(form.endReminderDays) || 7),
          progress: progressValue,
          status: form.status,
          slaHours: slaHoursValue,
          clauseItems: clauseItems.map((e) => ({ clauseId: e.clauseId, content: e.content })),
          contractTypeCode: savedTypeCode,
        },
      });
      onContractSaved?.({ id: contractCode, contractTypeCode: savedTypeCode });
      try {
        await syncProductsToContract(contractCode);
        await syncDocumentsToContract(contractDbId);
      } catch {
        toast.warning("Đã lưu hợp đồng nhưng chưa đồng bộ xong sản phẩm hoặc tài liệu.");
      }
      toast.success("Đã cập nhật hợp đồng");
      onOpenChange(false);
    } catch (e) {
      toastApiError(e, "Không thể cập nhật hợp đồng");
    }
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
    setDraftNewDocuments((items) => [
      ...items,
      {
        tempId: `draft-${Date.now()}-${items.length}`,
        name: docName.trim(),
        file: docFile,
      },
    ]);
    setDocName("");
    setDocFile(null);
  };

  const handleDeleteDocument = (doc: DetailDocument) => {
    const docId = doc.id ?? doc.code;
    if (!docId) {
      toast.error("Không xác định được tài liệu để xóa");
      return;
    }
    const isDraft = docId.startsWith("draft-");
    if (isDraft) {
      setDraftNewDocuments((items) => items.filter((item) => item.tempId !== docId));
      return;
    }
    setDraftExistingDocuments((items) => items.filter((item) => (item.id ?? item.code) !== docId));
    setRemovedDocumentIds((items) => (items.includes(docId) ? items : [...items, docId]));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[75vw] xl:max-w-[1140px] p-0 flex flex-col gap-0 overflow-hidden">
        <SheetHeader className="flex h-16 flex-row items-center justify-between border-b border-border/50 px-6 pr-14 space-y-0 shrink-0 gap-3">
          <SheetTitle className="flex items-center gap-2 text-left leading-6 m-0 min-w-0">
            <FileText className="h-5 w-5 text-primary shrink-0" aria-hidden="true" />
            <span className="truncate leading-6">
              {isCreateMode ? "Tạo hợp đồng mới" : `Chỉnh sửa hợp đồng ${contractCode}`}
            </span>
          </SheetTitle>
          <Button
            onClick={() => void (isCreateMode ? handleCreateContract() : handleSaveContract())}
            disabled={isCreateMode ? createContract.isPending : updateContract.isPending}
          >
            {isCreateMode
              ? (createContract.isPending ? "Đang tạo..." : "Tạo hợp đồng")
              : (updateContract.isPending ? "Đang lưu..." : "Lưu")}
          </Button>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="border-b border-border/50 px-6 shrink-0 overflow-x-auto">
            <TabsList className="h-11 w-max min-w-full bg-transparent p-0 gap-1">
              <TabTrigger value="info" icon={<Info className="h-4 w-4" />} label="Thông tin chung" />
              <TabTrigger value="terms" icon={<ListChecks className="h-4 w-4" />} label="Điều khoản & Điều kiện" />
              <TabTrigger value="products" icon={<Boxes className="h-4 w-4" />} label="Danh mục sản phẩm" />
              <TabTrigger value="docs" icon={<Files className="h-4 w-4" />} label="Tài liệu" />
              {!isCreateMode ? (
                <TabTrigger value="feedback" icon={<MessageSquareWarning className="h-4 w-4" />} label="Phản ánh" />
              ) : null}
            </TabsList>
          </div>

          <div className="relative min-h-0 flex-1">
          <TabsContent value="info" className="absolute inset-0 mt-0 overflow-y-auto p-6 space-y-6">
            <div className="flex flex-wrap items-end justify-end gap-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoItem icon={<FileText className="h-4 w-4" />} label="Loại hợp đồng">
                <Select
                  value={form.contractTypeCode || "__none__"}
                  onValueChange={(v) => setForm({ ...form, contractTypeCode: v === "__none__" ? "" : v })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn loại hợp đồng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không chọn</SelectItem>
                    {contractTypeOptions.map((item) => (
                      <SelectItem key={item.id} value={item.code}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InfoItem>
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
              <InfoItem icon={<Calendar className="h-4 w-4" />} label="Nhắc trước hạn kết thúc (ngày)">
                <Input
                  type="number"
                  min={0}
                  max={365}
                  value={form.endReminderDays}
                  onChange={(e) => setForm({ ...form, endReminderDays: e.target.value })}
                />
              </InfoItem>
              <InfoItem icon={<CircleDot className="h-4 w-4" />} label="Trạng thái">
                <Select
                  value={form.status}
                  onValueChange={(v) => {
                    const next = v as DisplayContractStatus;
                    statusManualOverrideRef.current = next === "completed";
                    setForm({ ...form, status: next });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusSelectOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.status === "completed" ? (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Đã chọn Hoàn thành — không tự đổi theo ngày/SLA.
                  </p>
                ) : null}
              </InfoItem>
              <InfoItem icon={<Clock className="h-4 w-4" />} label="SLA thực hiện (giờ)">
                <Input
                  type="number"
                  min={0}
                  placeholder="VD: 72"
                  value={form.slaHours ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, slaHours: e.target.value }))}
                />
                {slaHoursValue != null && slaHoursValue > 0 && detail?.updatedAt && form.status !== "liquidated" ? (
                  <p
                    className={`text-[11px] mt-1 ${slaOverduePreview ? "text-destructive font-medium" : "text-muted-foreground"}`}
                  >
                    {slaOverduePreview
                      ? "Đã quá hạn SLA kể từ lần cập nhật cuối."
                      : `Hạn SLA: ${formatSlaDeadline(detail.updatedAt, slaHoursValue)}`}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Quá SLA mà chưa cập nhật → Chậm tiến độ; quá ngày kết thúc → Đã thanh lý.
                  </p>
                )}
              </InfoItem>
            </div>
          </TabsContent>

          <TabsContent value="terms" className="absolute inset-0 mt-0 overflow-y-auto p-6">
            <ContractTermsPicker value={clauseItems} onChange={setClauseItems} />
          </TabsContent>

          <TabsContent value="products" className="absolute inset-0 mt-0 overflow-y-auto p-6">
            <>
            {detailLoading && !isCreateMode && draftProducts.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải danh mục sản phẩm...</div>
            ) : draftProducts.length === 0 ? (
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
                    {draftProducts.map((p, idx) => (
                      <TableRow key={p.id ?? p.code ?? idx}>
                        <TableCell className="font-medium">{p.code ?? "—"}</TableCell>
                        <TableCell>{p.name ?? "—"}</TableCell>
                        <TableCell>{p.category ?? "—"}</TableCell>
                        <TableCell>{p.manufacturer ?? "—"}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min={1}
                            value={String(p.totalProduced ?? 0)}
                            onChange={(e) =>
                              setDraftProducts((items) =>
                                items.map((item) =>
                                  item.id === p.id
                                    ? { ...item, totalProduced: Math.max(1, Number(e.target.value) || 1) }
                                    : item,
                                ),
                              )
                            }
                            className="ml-auto h-8 w-24 text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right">{getProductStatusLabel(p.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProduct(p)}
                            >
                              Chi tiết
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void handleRemoveProduct(p)}
                            >
                              Xóa
                            </Button>
                          </div>
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
                >
                  Thêm sản phẩm
                </Button>
              </div>
            </div>
            </>
          </TabsContent>

          <TabsContent value="docs" className="absolute inset-0 mt-0 overflow-y-auto p-6">
            <>
            {detailLoading && !isCreateMode && combinedDraftDocuments.length === 0 ? (
              <div className="text-sm text-muted-foreground">Đang tải tài liệu...</div>
            ) : combinedDraftDocuments.length === 0 ? (
              <EmptyHint text="Hợp đồng chưa có tài liệu đính kèm." />
            ) : (
              <div className="space-y-2">
                {combinedDraftDocuments.map((d, i) => (
                  <div key={d.id ?? d.code ?? i} className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-card-foreground truncate">{d.name ?? "Tài liệu"}</p>
                      <p className="text-xs text-muted-foreground">
                        {(d.fileType ?? "—").toString().toUpperCase()}
                        {d.fileSize ? ` • ${d.fileSize}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.fileUrl ? (
                        <a
                          href={resolveUploadUrl(d.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                        >
                          <Download className="h-4 w-4" /> Tải về
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {d.id ? "Chưa có file" : "Lưu để tải về"}
                        </span>
                      )}
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
          </TabsContent>

          {!isCreateMode ? (
            <TabsContent value="feedback" className="absolute inset-0 mt-0 overflow-y-auto p-6">
              {feedbackCustomerId && contractDbId ? (
                <CustomerFeedbackSection
                  customerId={feedbackCustomerId}
                  contractId={contractDbId}
                />
              ) : detailLoading ? (
                <p className="text-sm text-muted-foreground">Đang tải thông tin hợp đồng…</p>
              ) : (
                <p className="text-sm text-muted-foreground">Chọn khách hàng để quản lý phản ánh.</p>
              )}
            </TabsContent>
          ) : null}

          </div>
        </Tabs>
      </SheetContent>
      <ContractProductDetailDialog
        contractId={contractDbId ?? null}
        contractCode={contractCode || null}
        productId={selectedProduct?.id ?? null}
        quantity={Number(selectedProduct?.totalProduced) || 0}
        specs={selectedProduct?.specs ?? []}
        specValues={selectedProduct?.specValues ?? {}}
        editable
        onSaveSpecValues={(values) => {
          if (!selectedProduct?.id) return;
          setDraftProducts((items) =>
            items.map((item) =>
              item.id === selectedProduct.id
                ? { ...item, specValues: values }
                : item,
            ),
          );
        }}
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
