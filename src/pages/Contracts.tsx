import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCreateContract, useDeleteContract, useUpdateContract } from "@/hooks/use-contracts-api";
import { Plus, Search, Filter, Eye, Edit, FileText, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import ContractDetailDialog from "@/components/details/ContractDetailDialog";
import ContractEditDialog from "@/components/details/ContractEditDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

type Contract = { id: string; customer: string; value: number; products: number; startDate: string; endDate: string; warrantyEnd: string; status: string; progress: number };

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "secondary" },
  late: { label: "Chậm tiến độ", variant: "destructive" },
  liquidated: { label: "Đã thanh lý", variant: "outline" },
};

const Contracts = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    customerId: "",
    title: "",
    value: "",
    products: "",
    startDate: "",
    endDate: "",
    warrantyEnd: "",
  });
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
    customer?: { name: string } | null;
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

  const { data: apiContracts } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<ApiContractRow[]>>("/api/v1/contracts");
      return (res.data.data ?? []).map((row) => ({
        id: row.code,
        customer: row.customer?.name ?? "",
        value: Number(row.value ?? 0),
        products: Number(row.products ?? 0),
        startDate: formatISODate(row.startDate),
        endDate: formatISODate(row.endDate),
        warrantyEnd: row.warrantyEnd ? formatISODate(row.warrantyEnd) : "—",
        status: mapStatus(row.status),
        progress: Number(row.progress ?? 0),
      }));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!apiContracts) return;
    setContracts(apiContracts);
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

  const updateContractMutation = useUpdateContract();
  const createContractMutation = useCreateContract();
  const deleteContractMutation = useDeleteContract();

  function vnDisplayDateToISO(display: string): string | undefined {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
    if (!m) return undefined;
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  function toApiDateString(s: string): string | undefined {
    const t = s.trim();
    if (!t || t === "—") return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    return vnDisplayDateToISO(s);
  }

  const filtered = contracts.filter(
    (c) => c.id.toLowerCase().includes(search.toLowerCase()) || c.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (updated: Contract) => {
    try {
      const startISO = toApiDateString(updated.startDate);
      const endISO = toApiDateString(updated.endDate);
      const warrantyISO = toApiDateString(updated.warrantyEnd);
      await updateContractMutation.mutateAsync({
        id: updated.id,
        payload: {
          title: `Hợp đồng ${updated.id}`,
          value: updated.value,
          products: updated.products,
          status: updated.status as "draft" | "active" | "completed" | "late" | "liquidated",
          progress: updated.progress,
          ...(startISO ? { startDate: startISO } : {}),
          ...(endISO ? { endDate: endISO } : {}),
          ...(warrantyISO ? { warrantyEnd: warrantyISO } : {}),
        },
      });
      toast.success(`Đã cập nhật hợp đồng ${updated.id}`);
    } catch {
      toast.error("Không thể cập nhật hợp đồng");
    }
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

  const handleCreate = async () => {
    if (!createForm.customerId || !createForm.startDate || !createForm.endDate) {
      toast.error("Vui lòng nhập đủ khách hàng và thời gian");
      return;
    }
    try {
      await createContractMutation.mutateAsync({
        customerId: createForm.customerId,
        title: createForm.title.trim() || "Hợp đồng mới",
        value: Number(createForm.value || 0),
        products: Number(createForm.products || 0),
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        warrantyEnd: createForm.warrantyEnd || undefined,
      });
      toast.success("Đã tạo hợp đồng");
      setShowCreate(false);
      setCreateForm({ customerId: "", title: "", value: "", products: "", startDate: "", endDate: "", warrantyEnd: "" });
    } catch {
      toast.error("Không thể tạo hợp đồng");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng hợp đồng</p>
            <p className="text-2xl font-bold text-card-foreground">{contracts.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info"><Clock className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Đang thực hiện</p>
            <p className="text-2xl font-bold text-card-foreground">{contracts.filter((c) => c.status === "active").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Hoàn thành</p>
            <p className="text-2xl font-bold text-card-foreground">{contracts.filter((c) => c.status === "completed" || c.status === "liquidated").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Chậm tiến độ</p>
            <p className="text-2xl font-bold text-card-foreground">{contracts.filter((c) => c.status === "late").length}</p>
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
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Tạo hợp đồng</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Tạo hợp đồng mới</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Khách hàng</label>
                  <Select value={createForm.customerId} onValueChange={(v) => setCreateForm((p) => ({ ...p, customerId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Chọn khách hàng" /></SelectTrigger>
                    <SelectContent>
                      {(customers ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Tiêu đề</label><Input placeholder="Tên hợp đồng" value={createForm.title} onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Giá trị (triệu đồng)</label><Input type="number" placeholder="0" value={createForm.value} onChange={(e) => setCreateForm((p) => ({ ...p, value: e.target.value }))} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Số lượng sản phẩm</label><Input type="number" placeholder="0" value={createForm.products} onChange={(e) => setCreateForm((p) => ({ ...p, products: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Ngày bắt đầu</label><Input type="date" value={createForm.startDate} onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))} /></div>
                  <div className="space-y-2"><label className="text-sm font-medium text-foreground">Ngày kết thúc</label><Input type="date" value={createForm.endDate} onChange={(e) => setCreateForm((p) => ({ ...p, endDate: e.target.value }))} /></div>
                </div>
                <div className="space-y-2"><label className="text-sm font-medium text-foreground">Thời gian bảo hành</label><Input type="date" value={createForm.warrantyEnd} onChange={(e) => setCreateForm((p) => ({ ...p, warrantyEnd: e.target.value }))} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                  <Button onClick={handleCreate}>Tạo hợp đồng</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap">
          <TabsTrigger value="all" className="text-xs sm:text-sm">Tất cả ({contracts.length})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">Đang TH ({contracts.filter((c) => c.status === "active").length})</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Hoàn thành ({contracts.filter((c) => c.status === "completed" || c.status === "liquidated").length})</TabsTrigger>
          <TabsTrigger value="late" className="text-xs sm:text-sm">Chậm TĐ ({contracts.filter((c) => c.status === "late").length})</TabsTrigger>
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

      <ContractDetailDialog contract={selectedContract} open={!!selectedContract} onOpenChange={(o) => !o && setSelectedContract(null)} onSave={handleSave} />
      <ContractEditDialog contract={editingContract} open={!!editingContract} onOpenChange={(o) => !o && setEditingContract(null)} onSave={handleSave} />

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
            <TableCell>{c.customer}</TableCell>
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
              <Badge variant={statusConfig[c.status].variant}>{statusConfig[c.status].label}</Badge>
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
