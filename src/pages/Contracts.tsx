import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDeleteContract } from "@/hooks/use-contracts-api";
import { qk } from "@/lib/query-keys";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import { resolveDefinitionLabel } from "@/lib/attribute-definition-map";
import { CONTRACT_STATUS_LABELS } from "@/lib/contract-status";
import { Plus, Search, Eye, Edit, FileText, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import ContractDetailDialog from "@/components/details/ContractDetailDialog";
import ContractEditDialog from "@/components/details/ContractEditDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { lateProgressRowClass } from "@/lib/late-row-highlight";

type Contract = {
  id: string; dbId?: string; customer: string; value: number; products: number; startDate: string; endDate: string; warrantyEnd: string; status: string; progress: number; terms?: string | null;
  contractTypeCode?: string | null;
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: CONTRACT_STATUS_LABELS.draft ?? "Nháp", variant: "outline" },
  active: { label: CONTRACT_STATUS_LABELS.active ?? "Đang thực hiện", variant: "default" },
  completed: { label: CONTRACT_STATUS_LABELS.completed ?? "Hoàn thành", variant: "secondary" },
  late: { label: CONTRACT_STATUS_LABELS.late ?? "Chậm tiến độ", variant: "destructive" },
  liquidated: { label: CONTRACT_STATUS_LABELS.liquidated ?? "Đã thanh lý", variant: "outline" },
};

const Contracts = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [signedFrom, setSignedFrom] = useState<string>("");
  const [signedTo, setSignedTo] = useState<string>("");
  const [createdFromContract, setCreatedFromContract] = useState<string>("");
  const [createdToContract, setCreatedToContract] = useState<string>("");

  type ApiSuccess<T> = { success: true; data: T; message?: string };
  type ApiContractRow = {
    id: string;
    code: string;
    title: string;
    value: string | number;
    products: number;
    startDate: string;
    endDate: string;
    warrantyEnd: string | null;
    status: string;
    progress: number;
    terms?: string | null;
    contractTypeCode?: string | null;
    customer?: { id: string; code: string; name: string } | null;
  };

  function formatISODate(iso: string | Date | null | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function mapStatus(uiStatus: string): Contract["status"] {
    return uiStatus as Contract["status"];
  }

  function normalizeCustomer(value: unknown): string {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const maybeName = (value as { name?: unknown }).name;
      if (typeof maybeName === "string") return maybeName;
    }
    return "";
  }
  const {
    data: apiContracts,
    isLoading: contractsLoading,
    isError: contractsError,
  } = useQuery({
    queryKey: ["contracts", typeFilter, statusFilter, signedFrom, signedTo, createdFromContract, createdToContract],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("contractTypeCode", typeFilter);
      if (statusFilter !== "all") params.set("statuses", statusFilter);
      if (signedFrom) params.set("signedFrom", signedFrom);
      if (signedTo) params.set("signedTo", signedTo);
      if (createdFromContract) params.set("createdFrom", createdFromContract);
      if (createdToContract) params.set("createdTo", createdToContract);
      const qs = params.toString();
      const res = await api.get<ApiSuccess<ApiContractRow[]>>(
        qs ? `/api/v1/contracts?${qs}` : "/api/v1/contracts",
      );
      return res.data.data ?? [];
    },
    select: (rows: Array<ApiContractRow | Contract>) =>
      (rows ?? []).map((row) => {
        const maybeUi = row as Partial<Contract>;
        const isUiShape = typeof maybeUi.id === "string" && "customer" in maybeUi && !("code" in (row as ApiContractRow));
        if (isUiShape) {
          return {
            id: maybeUi.id ?? "",
            ...(typeof maybeUi.dbId === "string" ? { dbId: maybeUi.dbId } : {}),
            customer: normalizeCustomer(maybeUi.customer),
            value: Number(maybeUi.value ?? 0),
            products: Number(maybeUi.products ?? 0),
            startDate: String(maybeUi.startDate ?? "—"),
            endDate: String(maybeUi.endDate ?? "—"),
            warrantyEnd: String(maybeUi.warrantyEnd ?? "—"),
            status: mapStatus(String(maybeUi.status ?? "active")),
            progress: Number(maybeUi.progress ?? 0),
            terms: typeof maybeUi.terms === "string" ? maybeUi.terms : null,
            contractTypeCode: typeof maybeUi.contractTypeCode === "string" ? maybeUi.contractTypeCode : null,
          } satisfies Contract;
        }

        const apiRow = row as ApiContractRow;
        return {
          id: apiRow.code,
          dbId: apiRow.id,
          customer: normalizeCustomer(apiRow.customer),
          value: Number(apiRow.value ?? 0),
          products: Number(apiRow.products ?? 0),
          startDate: formatISODate(apiRow.startDate),
          endDate: formatISODate(apiRow.endDate),
          warrantyEnd: apiRow.warrantyEnd ? formatISODate(apiRow.warrantyEnd) : "—",
          status: mapStatus(apiRow.status),
          progress: Number(apiRow.progress ?? 0),
          terms: typeof apiRow.terms === "string" ? apiRow.terms : null,
          contractTypeCode: typeof apiRow.contractTypeCode === "string" ? apiRow.contractTypeCode : null,
        } satisfies Contract;
      }),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const contracts = useMemo<Contract[]>(() => {
    return Array.isArray(apiContracts) ? apiContracts : [];
  }, [apiContracts]);

  const { data: customers } = useQuery({
    queryKey: ["contracts-customers"],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Array<{ id: string; code: string; name: string }>>>("/api/v1/customers");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: contractTypeOptions = [] } = useDefinitionsList("contract_type");

  const deleteContractMutation = useDeleteContract();
  const contractsWithProductTotals = contracts;

  const filtered = contractsWithProductTotals.filter((c) => {
    const id = String(c.id ?? "").toLowerCase();
    const customer = String(c.customer ?? "").toLowerCase();
    const keyword = search.toLowerCase();
    return id.includes(keyword) || customer.includes(keyword);
  });

  const handleContractSaved = (patch: { id: string; contractTypeCode: string | null }) => {
    const applyPatch = (row: Contract | null) =>
      row && row.id === patch.id ? { ...row, contractTypeCode: patch.contractTypeCode } : row;
    setEditingContract(applyPatch);
    setSelectedContract(applyPatch);
    void queryClient.invalidateQueries({ queryKey: qk.contracts.all, refetchType: "all" });
  };

  const handleConfirmDeleteContract = async () => {
    const code = deletingContractId;
    if (!code) return;
    try {
      await deleteContractMutation.mutateAsync(code);
      toast.success(`Đã xóa hợp đồng ${code}`);
      setDeletingContractId(null);
      if (selectedContract?.id === code) setSelectedContract(null);
      if (editingContract?.id === code) setEditingContract(null);
    } catch {
      toast.error("Không thể xóa hợp đồng");
    }
  };

  return (
    <div className="space-y-6">
      {contractsLoading && (
        <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
          Đang tải dữ liệu hợp đồng...
        </div>
      )}
      {contractsError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Không thể tải danh sách hợp đồng. Vui lòng thử tải lại trang.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng hợp đồng</p>
            <p className="text-2xl font-bold text-card-foreground">{contractsWithProductTotals.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info"><Clock className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Đang thực hiện</p>
            <p className="text-2xl font-bold text-card-foreground">{contractsWithProductTotals.filter((c) => c.status === "active").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Hoàn thành</p>
            <p className="text-2xl font-bold text-card-foreground">{contractsWithProductTotals.filter((c) => c.status === "completed" || c.status === "liquidated").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Chậm tiến độ</p>
            <p className="text-2xl font-bold text-card-foreground">{contractsWithProductTotals.filter((c) => c.status === "late").length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Tìm hợp đồng..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Loại hợp đồng" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {contractTypeOptions.map((item) => (
                  <SelectItem key={item.id} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {(["draft", "active", "completed", "late", "liquidated"] as const).map((code) => (
                  <SelectItem key={code} value={code}>
                    {statusConfig[code]?.label ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Tạo hợp đồng</Button>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-border/50 bg-card/40 p-3 lg:flex-row lg:items-center lg:gap-4">
<div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Ký từ</span>
            <Input
              type="date"
              value={signedFrom}
              onChange={(e) => setSignedFrom(e.target.value)}
              className="h-7 w-[140px]"
            />
            <span className="text-xs text-muted-foreground">đến</span>
            <Input
              type="date"
              value={signedTo}
              onChange={(e) => setSignedTo(e.target.value)}
              className="h-7 w-[140px]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Tạo từ</span>
            <Input
              type="date"
              value={createdFromContract}
              onChange={(e) => setCreatedFromContract(e.target.value)}
              className="h-7 w-[140px]"
            />
            <span className="text-xs text-muted-foreground">đến</span>
            <Input
              type="date"
              value={createdToContract}
              onChange={(e) => setCreatedToContract(e.target.value)}
              className="h-7 w-[140px]"
            />
          </div>
          {(statusFilter !== "all" || signedFrom || signedTo || createdFromContract || createdToContract) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => {
                setStatusFilter("all");
                setSignedFrom("");
                setSignedTo("");
                setCreatedFromContract("");
                setCreatedToContract("");
              }}
            >
              Xoá bộ lọc
            </Button>
          )}
        </div>
      </div>

      <ContractTable
        contracts={filtered}
        contractTypeOptions={contractTypeOptions}
        onView={setSelectedContract}
        onEdit={setEditingContract}
        onRequestDelete={setDeletingContractId}
      />

      <ContractDetailDialog contract={selectedContract} open={!!selectedContract} onOpenChange={(o) => !o && setSelectedContract(null)} />
      <ContractEditDialog
        contract={editingContract}
        open={!!editingContract}
        onOpenChange={(o) => !o && setEditingContract(null)}
        onContractSaved={handleContractSaved}
      />
      <ContractEditDialog
        contract={null}
        open={showCreate}
        onOpenChange={setShowCreate}
        mode="create"
        customers={customers ?? []}
      />

      <AlertDialog open={!!deletingContractId} onOpenChange={(o) => !o && setDeletingContractId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa hợp đồng?</AlertDialogTitle>
            <AlertDialogDescription>
              Hợp đồng <span className="font-medium text-foreground">{deletingContractId}</span> sẽ được đánh dấu xóa mềm trên hệ thống. Bạn có chắc chắn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmDeleteContract()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ContractTable = ({
  contracts,
  contractTypeOptions,
  onView,
  onEdit,
  onRequestDelete,
}: {
  contracts: Contract[];
  contractTypeOptions: Array<{ id: string; code: string; label: string }>;
  onView: (c: Contract) => void;
  onEdit: (c: Contract) => void;
  onRequestDelete: (contractCode: string) => void;
}) => (
  <div className="rounded-xl bg-card border border-border/50 shadow-sm">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã HĐ</TableHead>
          <TableHead>Loại</TableHead>
          <TableHead>Khách hàng</TableHead>
          <TableHead className="text-right">Giá trị (tr)</TableHead>
          <TableHead className="text-center">SP</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead>Tiến độ</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Thao tác</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contracts.map((c) => (
          <TableRow key={c.id} className={lateProgressRowClass(c.status)}>
            <TableCell className="font-medium text-primary">{c.id}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {resolveDefinitionLabel(contractTypeOptions, c.contractTypeCode)}
            </TableCell>
            <TableCell>{typeof c.customer === "string" ? c.customer : ""}</TableCell>
            <TableCell className="text-right font-semibold">{c.value.toLocaleString()}</TableCell>
            <TableCell className="text-center">{c.products}</TableCell>
            <TableCell className="text-sm text-muted-foreground">
              <div>{c.startDate} – {c.endDate}</div>
              <div className="text-xs">BH: {c.warrantyEnd}</div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div className="h-2 w-20 rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${c.progress}%` }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{c.progress}%</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={(statusConfig[c.status] ?? statusConfig.active).variant}>
                {(statusConfig[c.status] ?? statusConfig.active).label}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onView(c)} aria-label="Xem"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(c)} aria-label="Sửa"><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRequestDelete(c.id)} aria-label="Xóa"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default Contracts;
