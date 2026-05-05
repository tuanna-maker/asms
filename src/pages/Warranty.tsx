import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCreateWarranty, useWarrantiesList, type WarrantyListRow } from "@/hooks/use-warranties-api";
import { qk } from "@/lib/query-keys";
import { Plus, Search, Shield, Clock, CheckCircle, AlertTriangle, ArrowRight, Eye, Monitor } from "lucide-react";
import WarrantyDetailDialog, { type WarrantyTicketUi } from "@/components/details/WarrantyDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const workflowSteps = [
  { label: "Tiếp nhận", key: "receive" },
  { label: "Xử lý/Phân loại", key: "classify" },
  { label: "Lập KH xử lý", key: "plan" },
  { label: "Kiểm tra & CĐ", key: "diagnose" },
  { label: "Thực hiện SC", key: "repair" },
  { label: "Kiểm tra sau SC", key: "verify" },
];

const NO_PRODUCT = "__none__";

const priorityBadge = (p: string) => {
  const map: Record<string, { label: string; className: string }> = {
    urgent: { label: "Khẩn cấp", className: "bg-destructive/15 text-destructive border-destructive/30" },
    high: { label: "Cao", className: "bg-destructive/10 text-destructive border-destructive/20" },
    medium: { label: "Trung bình", className: "bg-warning/10 text-warning border-warning/20" },
    low: { label: "Thấp", className: "bg-success/10 text-success border-success/20" },
  };
  const cfg = map[p] || map.medium;
  return <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${cfg.className}`}>{cfg.label}</span>;
};

const typeBadge = (t: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    warranty: { label: "Bảo hành", variant: "default" },
    repair: { label: "Sửa chữa", variant: "secondary" },
    maintenance: { label: "Bảo trì", variant: "outline" },
  };
  const cfg = map[t] || map.maintenance;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const Warranty = () => {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<WarrantyTicketUi | null>(null);
  const [createForm, setCreateForm] = useState({
    source: "customer" as "customer" | "internal",
    customerId: "",
    productId: NO_PRODUCT,
    issue: "",
    type: "warranty" as "warranty" | "repair" | "maintenance",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
  });
  type ApiSuccess<T> = { success: true; data: T; message?: string };

  function formatISODate(iso: string | null | undefined) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }

  function mapUiStatus(status: string): "processing" | "completed" {
    return status === "completed" ? "completed" : "processing";
  }

  const { data: warrantyRows = [], isLoading, isError } = useWarrantiesList();
  const tickets = useMemo(
    () =>
      warrantyRows.map((row: WarrantyListRow): WarrantyTicketUi => ({
        apiId: row.id,
        code: row.code,
        customer: row.customer?.name ?? row.customer?.code ?? "",
        device: row.product?.name ?? "—",
        issue: row.issue,
        source: row.source ?? "",
        type: row.type,
        priority: row.priority,
        step: Number(row.workflowStep ?? 1),
        backendStatus: row.status,
        tabStatus: mapUiStatus(row.status),
        assignee: row.assignee?.fullName ?? "",
        sla: row.slaHours != null ? `${row.slaHours}h` : "—",
        createdAt: formatISODate(row.createdAt),
      })),
    [warrantyRows],
  );

  const { data: customerOptions = [] } = useQuery({
    queryKey: ["warranty-customers"],
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Array<{ id: string; code: string; name: string }>>>("/api/v1/customers");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: productOptions = [] } = useQuery({
    queryKey: qk.products.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Array<{ id: string; code: string; name: string }>>>("/api/v1/products");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const createWarranty = useCreateWarranty();

  const defaultSla = (p: string) => (p === "high" || p === "urgent" ? 24 : p === "medium" ? 48 : 72);

  const handleCreateTicket = async () => {
    if (!createForm.customerId) {
      toast.error("Vui lòng chọn khách hàng");
      return;
    }
    if (!createForm.issue.trim()) {
      toast.error("Vui lòng mô tả sự cố");
      return;
    }
    try {
      await createWarranty.mutateAsync({
        customerId: createForm.customerId,
        issue: createForm.issue.trim(),
        type: createForm.type,
        priority: createForm.priority,
        source: createForm.source === "customer" ? "Khách hàng" : "Nội bộ",
        status: "open",
        workflowStep: 1,
        slaHours: defaultSla(createForm.priority),
        ...(createForm.productId && createForm.productId !== NO_PRODUCT ? { productId: createForm.productId } : {}),
      });
      toast.success("Đã tạo phiếu yêu cầu");
      setShowCreate(false);
      setCreateForm({
        source: "customer",
        customerId: "",
        productId: NO_PRODUCT,
        issue: "",
        type: "warranty",
        priority: "medium",
      });
    } catch {
      toast.error("Không thể tạo ticket");
    }
  };

  const filtered = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.code.toLowerCase().includes(search.toLowerCase()) ||
          t.customer.toLowerCase().includes(search.toLowerCase()) ||
          t.device.toLowerCase().includes(search.toLowerCase())
      ),
    [tickets, search]
  );

  return (
    <div className="space-y-6">
      {/* Workflow */}
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <h3 className="font-semibold text-card-foreground mb-4">Quy trình xử lý ticket</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2 gap-1">
          {workflowSteps.map((step, i) => (
            <div key={step.key} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-card-foreground text-center max-w-[70px] sm:max-w-[90px]">{step.label}</span>
              </div>
              {i < workflowSteps.length - 1 && <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-1 sm:mx-2 mt-[-20px]" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><AlertTriangle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng ticket</p>
            <p className="text-2xl font-bold text-card-foreground">{tickets.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info"><Shield className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Bảo hành</p>
            <p className="text-2xl font-bold text-card-foreground">{tickets.filter((t) => t.type === "warranty").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning"><Clock className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Đang xử lý</p>
            <p className="text-2xl font-bold text-card-foreground">{tickets.filter((t) => t.tabStatus === "processing").length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success"><CheckCircle className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Hoàn thành</p>
            <p className="text-2xl font-bold text-card-foreground">{tickets.filter((t) => t.tabStatus === "completed").length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Tìm ticket..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Tạo ticket</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Tạo phiếu yêu cầu mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nguồn</Label>
                <Select
                  value={createForm.source}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, source: v as "customer" | "internal" }))}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn nguồn" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Khách hàng</SelectItem>
                    <SelectItem value="internal">Nội bộ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Khách hàng</Label>
                <Select
                  value={createForm.customerId || undefined}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, customerId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn đơn vị" /></SelectTrigger>
                  <SelectContent>
                    {customerOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Thiết bị (tùy chọn)</Label>
                <Select
                  value={createForm.productId}
                  onValueChange={(v) => setCreateForm((p) => ({ ...p, productId: v }))}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn sản phẩm" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PRODUCT}>— Chưa chọn —</SelectItem>
                    {productOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mô tả sự cố</Label>
                <Textarea
                  rows={4}
                  placeholder="Mô tả chi tiết sự cố..."
                  value={createForm.issue}
                  onChange={(e) => setCreateForm((p) => ({ ...p, issue: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phân loại</Label>
                  <Select
                    value={createForm.type}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, type: v as "warranty" | "repair" | "maintenance" }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Loại" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warranty">Bảo hành</SelectItem>
                      <SelectItem value="repair">Sửa chữa</SelectItem>
                      <SelectItem value="maintenance">Bảo trì</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mức độ ưu tiên</Label>
                  <Select
                    value={createForm.priority}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, priority: v as typeof createForm.priority }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Mức độ" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      <SelectItem value="high">Cao</SelectItem>
                      <SelectItem value="medium">Trung bình</SelectItem>
                      <SelectItem value="low">Thấp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button onClick={() => void handleCreateTicket()} disabled={createWarranty.isPending}>
                  Tạo ticket
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Không tải được danh sách ticket. Kiểm tra kết nối hoặc quyền truy cập.</p>
      )}
      {isLoading && !isError && (
        <p className="text-sm text-muted-foreground">Đang tải danh sách…</p>
      )}

      {/* Table */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({tickets.length})</TabsTrigger>
          <TabsTrigger value="processing">Đang xử lý ({tickets.filter((t) => t.tabStatus === "processing").length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn thành ({tickets.filter((t) => t.tabStatus === "completed").length})</TabsTrigger>
        </TabsList>

        {["all", "processing", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="rounded-xl bg-card border border-border/50 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã ticket</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Thiết bị</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Ưu tiên</TableHead>
                    <TableHead>Tiến trình</TableHead>
                    <TableHead>Đơn vị xử lý</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!isLoading && (tab === "all" ? filtered : filtered.filter((t) => t.tabStatus === tab)).map((t) => (
                    <TableRow key={t.apiId}>
                      <TableCell className="font-medium text-primary">{t.code}</TableCell>
                      <TableCell>{t.customer}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4 text-muted-foreground" />
                          {t.device}
                        </div>
                      </TableCell>
                      <TableCell>{typeBadge(t.type)}</TableCell>
                      <TableCell>{priorityBadge(t.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {workflowSteps.map((_, i) => (
                            <div key={i} className={`h-2 w-4 rounded-sm ${i < t.step ? (t.status === "completed" ? "bg-success" : "bg-primary") : "bg-secondary"}`} />
                          ))}
                          <span className="text-xs text-muted-foreground ml-1">{t.step}/{workflowSteps.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.assignee}</TableCell>
                      <TableCell><Badge variant="outline">{t.sla}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTicket(t)}><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!isLoading && !isError && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Không có ticket nào.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <WarrantyDetailDialog ticket={selectedTicket} open={!!selectedTicket} onOpenChange={(o) => !o && setSelectedTicket(null)} />
    </div>
  );
};

export default Warranty;
