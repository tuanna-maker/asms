import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useWarrantiesList, type WarrantyListRow } from "@/hooks/use-warranties-api";
import { qk } from "@/lib/query-keys";
import { Plus, Search, Shield, Clock, CheckCircle, AlertTriangle, ArrowRight, Eye, Monitor, Pencil } from "lucide-react";
import WarrantyDetailDialog, { type WarrantyTicketUi } from "@/components/details/WarrantyDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const workflowSteps = [
  { label: "Tiếp nhận", key: "receive" },
  { label: "Xử lý/Phân loại", key: "classify" },
  { label: "Lập KH xử lý", key: "plan" },
  { label: "Kiểm tra & CĐ", key: "diagnose" },
  { label: "Thực hiện SC", key: "repair" },
  { label: "Kiểm tra sau SC", key: "verify" },
];

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
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");
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
        <h3 className="font-semibold text-card-foreground mb-4">Quy trình xử lý bảo hành / sửa chữa</h3>
        <div className="flex items-center justify-start overflow-x-auto pb-2 gap-2 sm:gap-3">
          {workflowSteps.map((step, i) => (
            <div key={step.key} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1.5 min-w-[88px] sm:min-w-[105px]">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold">
                  {i + 1}
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-card-foreground text-center leading-tight max-w-[88px] sm:max-w-[105px]">{step.label}</span>
              </div>
              {i < workflowSteps.length - 1 && <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-1 sm:mx-2 mt-[-14px]" />}
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
          <Input placeholder="Tìm phiếu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Tạo phiếu</Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Không tải được danh sách phiếu. Kiểm tra kết nối hoặc quyền truy cập.</p>
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
                    <TableHead>Mã phiếu</TableHead>
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
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDetailMode("view");
                              setSelectedTicket(t);
                            }}
                            aria-label={`Xem ticket ${t.code}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setDetailMode("edit");
                              setSelectedTicket(t);
                            }}
                            aria-label={`Sửa ticket ${t.code}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {!isLoading && !isError && filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">Không có phiếu nào.</p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <WarrantyDetailDialog
        ticket={selectedTicket}
        customerOptions={customerOptions}
        productOptions={productOptions}
        mode={detailMode}
        open={!!selectedTicket}
        onOpenChange={(o) => !o && setSelectedTicket(null)}
      />
      <WarrantyDetailDialog
        ticket={null}
        customerOptions={customerOptions}
        productOptions={productOptions}
        mode="create"
        open={showCreate}
        onOpenChange={setShowCreate}
      />
    </div>
  );
};

export default Warranty;
