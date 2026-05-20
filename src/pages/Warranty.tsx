import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { api } from "@/lib/api";
import { useWarrantiesList, type WarrantyListRow, useWarrantyStats } from "@/hooks/use-warranties-api";
import type { WorkflowInstanceListSnapshot } from "@/hooks/use-workflows-api";
import { cn } from "@/lib/utils";
import { Plus, Search, Eye, Pencil, Inbox } from "lucide-react";
import { useRole } from "@/hooks/use-role";
import WarrantyDetailDialog, { type WarrantyTicketUi } from "@/components/details/WarrantyDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { WorkflowStepProgressPill } from "@/components/workflow/WorkflowStepSegments";
      
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

function warrantyListErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) {
      return "Tài khoản không có quyền xem danh sách phiếu bảo hành. Cần vai trò Quản trị, Quản lý hoặc Kỹ thuật viên trên máy chủ.";
    }
    if (status === 401) {
      return "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.";
    }
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string") {
      return (data as { message: string }).message;
    }
  }
  return "Không tải được danh sách phiếu. Kiểm tra kết nối hoặc quyền truy cập.";
}

function warrantyStatsErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 403) return "Không có quyền xem thống kê.";
    if (status === 401) return "Phiên đăng nhập hết hạn — vui lòng đăng nhập lại.";
    const data = error.response?.data;
    if (data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string") {
      return (data as { message: string }).message;
    }
    if (status === 400) return "Tham số không hợp lệ (từ ngày / đến ngày / loại phiếu).";
    if (status === 500) {
      return "Lỗi máy chủ khi tính thống kê. Thường do chưa chạy migration thêm cột material_ids trên bảng warranties — chạy prisma migrate rồi thử lại.";
    }
  }
  return "Không tải được thống kê. Kiểm tra kết nối hoặc thử lại sau.";
}

const typeBadge = (t: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
    warranty: { label: "Bảo hành", variant: "default" },
    repair: { label: "Sửa chữa", variant: "secondary" },
    maintenance: { label: "Bảo trì", variant: "outline" },
  };
  const cfg = map[t] || map.maintenance;
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

function WarrantyListProgressPill({
  workflow,
  emphasis,
}: {
  workflow: WorkflowInstanceListSnapshot;
  emphasis: boolean;
}) {
  const { totalSteps, currentStepIndex, status, currentStepName } = workflow;
  const label =
    status === "completed"
      ? totalSteps > 0 && currentStepName
        ? `${totalSteps}/${totalSteps} · ${currentStepName}`
        : "Hoàn tất"
      : status === "cancelled"
        ? "Đã hủy"
        : currentStepIndex > 0
          ? `${currentStepIndex}/${totalSteps} · ${currentStepName ?? "—"}`
          : "Chưa bắt đầu";

  return (
    <WorkflowStepProgressPill
      variant="table"
      totalSteps={totalSteps}
      currentStepIndex={currentStepIndex}
      status={status}
      label={label}
      emphasis={emphasis}
    />
  );
}

const tabStatusBadge = (status: "processing" | "completed") =>
  status === "completed" ? (
    <Badge variant="secondary">Hoàn thành</Badge>
  ) : (
    <Badge variant="default">Đang xử lý</Badge>
  );

const Warranty = () => {
  const { role } = useRole();
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState<"list" | "stats">("list");
  const [statsFrom, setStatsFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 89);
    return d.toISOString().slice(0, 10);
  });
  const [statsTo, setStatsTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [statsTypeWarranty, setStatsTypeWarranty] = useState(true);
  const [statsTypeRepair, setStatsTypeRepair] = useState(true);
  const [statsTypeMaintenance, setStatsTypeMaintenance] = useState(false);

  const statsTypesParam = useMemo(() => {
    const t: string[] = [];
    if (statsTypeWarranty) t.push("warranty");
    if (statsTypeRepair) t.push("repair");
    if (statsTypeMaintenance) t.push("maintenance");
    if (t.length === 0 || t.length === 3) return undefined;
    return t.join(",");
  }, [statsTypeWarranty, statsTypeRepair, statsTypeMaintenance]);

  const { data: statsData, isLoading: statsLoading, isError: statsError, error: statsErr } = useWarrantyStats(
    { from: statsFrom, to: statsTo, types: statsTypesParam },
    mainTab === "stats",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<WarrantyTicketUi | null>(null);
  const [detailMode, setDetailMode] = useState<"view" | "edit">("view");

  const sheetOpen = showCreate || selectedTicket !== null;
  const sheetMode = showCreate ? "create" : detailMode;
  const sheetTicket = showCreate ? null : selectedTicket;

  const closeSheet = () => {
    setShowCreate(false);
    setSelectedTicket(null);
  };
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

  const { data: warrantyRows = [], isLoading, isError, error } = useWarrantiesList();
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
        workflow: row.workflow ?? null,
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

  const statLine = useMemo(() => {
    const total = tickets.length;
    const proc = tickets.filter((t) => t.tabStatus === "processing").length;
    const done = tickets.filter((t) => t.tabStatus === "completed").length;
    const wr = tickets.filter((t) => t.type === "warranty").length;
    const rp = tickets.filter((t) => t.type === "repair").length;
    const mt = tickets.filter((t) => t.type === "maintenance").length;
    return { total, proc, done, wr, rp, mt };
  }, [tickets]);

  const needsProcessingTickets = useMemo(
    () =>
      tickets.filter(
        (t) =>
          t.workflow?.status === "running" &&
          t.workflow.currentStepRoleCode === role,
      ),
    [tickets, role],
  );

  const openTicketEdit = (t: WarrantyTicketUi) => {
    setShowCreate(false);
    setDetailMode("edit");
    setSelectedTicket(t);
  };

  return (
    <div className="space-y-6">
      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "list" | "stats")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Danh sách phiếu</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6 mt-4">
      {!isLoading && needsProcessingTickets.length > 0 ? (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Cần xử lí</h3>
          <Badge variant="secondary" className="ml-1">
            {needsProcessingTickets.length}
          </Badge>
        </div>
          <div className="rounded-lg border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Loại</TableHead>
                  <TableHead className="px-4 py-3">Mã phiếu</TableHead>
                  <TableHead className="px-4 py-3">Quy trình</TableHead>
                  <TableHead className="px-4 py-3">Bước hiện tại</TableHead>
                  <TableHead className="px-4 py-3">Khách hàng</TableHead>
                  <TableHead className="px-4 py-3">Ngày tạo</TableHead>
                  <TableHead className="px-4 py-3 text-center">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3 text-right w-24">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsProcessingTickets.map((t) => (
                  <TableRow key={t.apiId}>
                    <TableCell className="px-4 py-3.5">{typeBadge(t.type)}</TableCell>
                    <TableCell className="px-4 py-3.5 font-medium text-primary">{t.code}</TableCell>
                    <TableCell className="px-4 py-3.5 text-xs text-muted-foreground">
                      {t.workflow?.workflowName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm">
                      {t.workflow?.currentStepName ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-sm">{t.customer}</TableCell>
                    <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">{t.createdAt}</TableCell>
                    <TableCell className="px-4 py-3.5 text-center">{tabStatusBadge(t.tabStatus)}</TableCell>
                    <TableCell className="px-4 py-3.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openTicketEdit(t)}
                        aria-label={`Sửa phiếu ${t.code}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
      </div>
      ) : null}

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Tìm phiếu..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button
              className="shrink-0"
              onClick={() => {
                setSelectedTicket(null);
                setShowCreate(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo phiếu
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tổng <span className="font-medium text-foreground">{statLine.total}</span> phiếu · Đang xử lý{" "}
            <span className="font-medium text-foreground">{statLine.proc}</span> · Hoàn thành{" "}
            <span className="font-medium text-foreground">{statLine.done}</span>
            <span className="hidden sm:inline">
              {" "}
              · BH / SC / BT: <span className="font-medium text-foreground">{statLine.wr}</span> /{" "}
              <span className="font-medium text-foreground">{statLine.rp}</span> /{" "}
              <span className="font-medium text-foreground">{statLine.mt}</span>
            </span>
          </p>

          {isError && <p className="text-sm text-destructive">{warrantyListErrorMessage(error)}</p>}
          {isLoading && !isError && <p className="text-sm text-muted-foreground">Đang tải danh sách…</p>}

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tất cả ({tickets.length})</TabsTrigger>
              <TabsTrigger value="processing">Đang xử lý ({tickets.filter((t) => t.tabStatus === "processing").length})</TabsTrigger>
              <TabsTrigger value="completed">Hoàn thành ({tickets.filter((t) => t.tabStatus === "completed").length})</TabsTrigger>
            </TabsList>

            {["all", "processing", "completed"].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div className="rounded-lg border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã phiếu</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Thiết bị</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Ưu tiên</TableHead>
                        <TableHead className="min-w-[200px] sm:min-w-[240px]">Tiến trình</TableHead>
                        <TableHead>Đơn vị xử lý</TableHead>
                        <TableHead>SLA</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!isLoading &&
                        (tab === "all" ? filtered : filtered.filter((t) => t.tabStatus === tab)).map((t) => (
                          <TableRow
                            key={t.apiId}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setShowCreate(false);
                              setDetailMode("view");
                              setSelectedTicket(t);
                            }}
                          >
                            <TableCell className="font-medium text-primary">{t.code}</TableCell>
                            <TableCell>{t.customer}</TableCell>
                            <TableCell>{t.device}</TableCell>
                            <TableCell>{typeBadge(t.type)}</TableCell>
                            <TableCell>{priorityBadge(t.priority)}</TableCell>
                            <TableCell className="align-top py-3">
                              {t.workflow ? (
                                <WarrantyListProgressPill
                                  workflow={t.workflow}
                                  emphasis={
                                    t.tabStatus === "processing" && (t.priority === "urgent" || t.priority === "high")
                                  }
                                />
                              ) : (
                                <span className="text-xs text-muted-foreground">Chưa gắn quy trình</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{t.assignee}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t.sla}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => {
                                    setShowCreate(false);
                                    setDetailMode("edit");
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
                                    setShowCreate(false);
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
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
                <div className="space-y-1">
                  <Label htmlFor="wst-from">Từ ngày (createdAt)</Label>
                  <Input id="wst-from" type="date" value={statsFrom} onChange={(e) => setStatsFrom(e.target.value)} className="w-[11rem]" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="wst-to">Đến ngày</Label>
                  <Input id="wst-to" type="date" value={statsTo} onChange={(e) => setStatsTo(e.target.value)} className="w-[11rem]" />
                </div>
                <div className="space-y-2">
                  <Label>Loại phiếu</Label>
                  <div className="flex flex-wrap gap-3 items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={statsTypeWarranty} onCheckedChange={(c) => setStatsTypeWarranty(c === true)} />
                      Bảo hành
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={statsTypeRepair} onCheckedChange={(c) => setStatsTypeRepair(c === true)} />
                      Sửa chữa
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={statsTypeMaintenance} onCheckedChange={(c) => setStatsTypeMaintenance(c === true)} />
                      Bảo trì
                    </label>
                  </div>
                </div>
              </div>
              {statsError && <p className="text-sm text-destructive">{warrantyStatsErrorMessage(statsErr)}</p>}
              {statsLoading && !statsError && <p className="text-sm text-muted-foreground">Đang tải thống kê…</p>}
              {!statsLoading && !statsError && statsData && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Thiết bị hay ghi nhận nhất</h3>
                    <div className="rounded-lg border border-border/60 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã / tên</TableHead>
                            <TableHead className="text-right w-24">Số phiếu</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statsData.topProducts.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-muted-foreground text-sm">
                                Không có dữ liệu (cần phiếu có gắn thiết bị).
                              </TableCell>
                            </TableRow>
                          ) : (
                            statsData.topProducts.map((r) => (
                              <TableRow key={r.productId}>
                                <TableCell>
                                  <div className="font-medium">{r.name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{r.code}</div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{r.ticketCount}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">Vật tư được ghi nhận nhiều nhất</h3>
                    <div className="rounded-lg border border-border/60 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã / tên</TableHead>
                            <TableHead className="text-right w-24">Lần ghi</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statsData.topMaterials.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={2} className="text-muted-foreground text-sm">
                                Không có dữ liệu (cần phiếu có chọn vật tư BOM).
                              </TableCell>
                            </TableRow>
                          ) : (
                            statsData.topMaterials.map((r) => (
                              <TableRow key={r.materialId}>
                                <TableCell>
                                  <div className="font-medium">{r.name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{r.code}</div>
                                </TableCell>
                                <TableCell className="text-right tabular-nums">{r.ticketCount}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <WarrantyDetailDialog
        ticket={sheetTicket}
        customerOptions={customerOptions}
        mode={sheetMode}
        open={sheetOpen}
        onOpenChange={(o) => {
          if (!o) closeSheet();
        }}
      />
    </div>
  );
};

export default Warranty;
