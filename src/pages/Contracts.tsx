import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDeleteContract } from "@/hooks/use-contracts-api";
import { useProductsList } from "@/hooks/use-products-api";
import { Plus, Search, Filter, Eye, Edit, FileText, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import ContractDetailDialog from "@/components/details/ContractDetailDialog";
import ContractEditDialog from "@/components/details/ContractEditDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Contract = {
  id: string; dbId?: string; customer: string; value: number; products: number; startDate: string; endDate: string; warrantyEnd: string; status: string; progress: number; terms?: string | null
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "secondary" },
  late: { label: "Chậm tiến độ", variant: "destructive" },
  liquidated: { label: "Đã thanh lý", variant: "outline" },
};

const Contracts = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContractId, setDeletingContractId] = useState<string | null>(null);

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
    if (uiStatus === "draft") return "active";
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
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ApiContractRow[]>>("/api/v1/contracts");
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
        } satisfies Contract;
      }),
    staleTime: 60_000,
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

  const deleteContractMutation = useDeleteContract();
  const { data: products = [] } = useProductsList();

  const productCountByContract = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (!product.contractId) continue;
      counts.set(product.contractId, (counts.get(product.contractId) ?? 0) + (Number(product.totalProduced) || 0));
    }
    return counts;
  }, [products]);

  const contractsWithProductTotals = useMemo(
    () =>
      contracts.map((contract) => ({
        ...contract,
        products: contract.dbId ? productCountByContract.get(contract.dbId) ?? 0 : contract.products,
      })),
    [contracts, productCountByContract],
  );

  const filtered = contractsWithProductTotals.filter((c) => {
    const id = String(c.id ?? "").toLowerCase();
    const customer = String(c.customer ?? "").toLowerCase();
    const keyword = search.toLowerCase();
    return id.includes(keyword) || customer.includes(keyword);
  });

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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm hợp đồng..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1" /> Lọc</Button>
          <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Tạo hợp đồng</Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="text-xs sm:text-sm">Tất cả ({contractsWithProductTotals.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">Đang TH ({contractsWithProductTotals.filter((c) => c.status === "active").length})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Hoàn thành ({contractsWithProductTotals.filter((c) => c.status === "completed" || c.status === "liquidated").length})</TabsTrigger>
          <TabsTrigger value="late" className="text-xs sm:text-sm">Chậm TĐ ({contractsWithProductTotals.filter((c) => c.status === "late").length})</TabsTrigger>
        </TabsList>
        {["all", "active", "completed", "late"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <ContractTable
              contracts={tab === "all" ? filtered : tab === "completed" ? filtered.filter((c) => c.status === "completed" || c.status === "liquidated") : filtered.filter((c) => c.status === tab)}
              onView={setSelectedContract}
              onEdit={setEditingContract}
              onRequestDelete={setDeletingContractId}
            />
          </TabsContent>
        ))}
      </Tabs>

      <ContractDetailDialog contract={selectedContract} open={!!selectedContract} onOpenChange={(o) => !o && setSelectedContract(null)} />
      <ContractEditDialog contract={editingContract} open={!!editingContract} onOpenChange={(o) => !o && setEditingContract(null)} />
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
  onView,
  onEdit,
  onRequestDelete,
}: {
  contracts: Contract[];
  onView: (c: Contract) => void;
  onEdit: (c: Contract) => void;
  onRequestDelete: (contractCode: string) => void;
}) => (
  <div className="rounded-xl bg-card border border-border/50 shadow-sm">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Mã HĐ</TableHead>
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
          <TableRow key={c.id}>
            <TableCell className="font-medium text-primary">{c.id}</TableCell>
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
