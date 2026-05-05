import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Calendar, Play, Pause, Timer, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDashboardData } from "@/data/dashboardData";
import type { ContractRow } from "@/data/tableData";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import { useReportsByYear } from "@/hooks/use-reports-api";
import OverviewTab from "@/components/dashboard/tabs/OverviewTab";
import CustomerTab from "@/components/dashboard/tabs/CustomerTab";
import RevenueTab from "@/components/dashboard/tabs/RevenueTab";
import ProjectTab from "@/components/dashboard/tabs/ProjectTab";
import AlertTab from "@/components/dashboard/tabs/AlertTab";
import ProductTab from "@/components/dashboard/tabs/ProductTab";
import WarrantyTab from "@/components/dashboard/tabs/WarrantyTab";
import MaterialTab from "@/components/dashboard/tabs/MaterialTab";

const years = ["2026", "2024", "2023", "2022"];
const quarters = [
  { value: "all", label: "Cả năm" },
  { value: "q1", label: "Quý 1" },
  { value: "q2", label: "Quý 2" },
  { value: "q3", label: "Quý 3" },
  { value: "q4", label: "Quý 4" },
];
const DEFAULT_YEAR = "2026";

function formatShortSlash(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function mapContractToOverviewRow(row: {
  code: string;
  title: string;
  value: string | number;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  customer?: { name: string } | null;
}): ContractRow {
  const st = row.status === "completed" ? "completed" : row.status === "late" ? "late" : "active";
  const v = Number(row.value ?? 0);
  const valueTy = v >= 1_000_000 ? v / 1e9 : v;
  return {
    id: row.code,
    name: row.title,
    customer: row.customer?.name ?? "—",
    value: Number.isFinite(valueTy) ? valueTy : 0,
    startDate: formatShortSlash(row.startDate),
    endDate: formatShortSlash(row.endDate),
    status: st,
    progress: Math.round(Number(row.progress ?? 0)),
  };
}

const customers = [
  { value: "all", label: "Tất cả khách hàng" },
  { value: "qk1", label: "Quân khu 1" },
  { value: "qk3", label: "Quân khu 3" },
  { value: "qk5", label: "Quân khu 5" },
  { value: "qk7", label: "Quân khu 7" },
  { value: "qk9", label: "Quân khu 9" },
  { value: "tttm", label: "Bộ TL TTTM" },
];

const tabKeys = ["overview", "customer", "revenue", "project", "product", "warranty", "material", "alerts"] as const;
const intervalOptions = [
  { value: "10", label: "10 giây" },
  { value: "15", label: "15 giây" },
  { value: "30", label: "30 giây" },
  { value: "60", label: "1 phút" },
];

const Index = () => {
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [quarter, setQuarter] = useState("all");
  const [customer, setCustomer] = useState("all");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [autoRotate, setAutoRotate] = useState(false);
  const [rotateInterval, setRotateInterval] = useState("15");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const { data: liveContracts } = useQuery({
    queryKey: qk.contracts.all,
    queryFn: async () => {
      const res = await api.get<
        ApiSuccess<
          Array<{
            code: string;
            title: string;
            value: string | number;
            startDate: string;
            endDate: string;
            status: string;
            progress: number;
            customer?: { name: string } | null;
          }>
        >
      >("/api/v1/contracts");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: reports } = useReportsByYear(year);

  const overviewContractRows = useMemo(
    () => (liveContracts && liveContracts.length > 0 ? liveContracts.map(mapContractToOverviewRow) : undefined),
    [liveContracts],
  );

  const data = useMemo(() => {
    const base = getDashboardData({ year, quarter, customer });
    if (!reports) return base;
    const bs = reports.contracts.byStatus ?? {};
    const draft = typeof bs.draft === "number" ? bs.draft : 0;
    const active = typeof bs.active === "number" ? bs.active : 0;
    const activeContractsCount =
      reports.contracts.total > 0 ? active + draft : base.stats.activeContracts;
    return {
      ...base,
      stats: {
        ...base.stats,
        totalProducts:
          reports.products.deliveredTotal > 0 ? reports.products.deliveredTotal : base.stats.totalProducts,
        activeContracts: activeContractsCount,
        pendingComplaints:
          reports.warranties.total > 0 ? reports.warranties.total : base.stats.pendingComplaints,
      },
    };
  }, [year, quarter, customer, reports]);

  const activeFilters = [year !== DEFAULT_YEAR, quarter !== "all", customer !== "all"].filter(Boolean).length;

  const resetFilters = () => {
    setYear(DEFAULT_YEAR);
    setQuarter("all");
    setCustomer("all");
  };

  const nextTab = useCallback(() => {
    setActiveTab((prev) => {
      const idx = tabKeys.indexOf(prev as typeof tabKeys[number]);
      return tabKeys[(idx + 1) % tabKeys.length];
    });
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(nextTab, Number(rotateInterval) * 1000);
    return () => clearInterval(timer);
  }, [autoRotate, rotateInterval, nextTab]);

  const toggleFullscreen = useCallback(() => {
    if (!dashboardRef.current) return;
    if (!document.fullscreenElement) {
      dashboardRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const startPresentation = () => {
    setAutoRotate(true);
    if (!document.fullscreenElement && dashboardRef.current) {
      dashboardRef.current.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div ref={dashboardRef} className={`space-y-4 ${isFullscreen ? "bg-background p-6 overflow-y-auto h-screen" : ""}`}>
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Filter className="h-4 w-4" />
              Bộ lọc
              {activeFilters > 0 && (
                <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 text-[10px] flex items-center justify-center">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="start">
            <h4 className="text-sm font-semibold text-card-foreground">Lọc dữ liệu</h4>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Năm</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Quý</label>
              <Select value={quarter} onValueChange={setQuarter}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Khách hàng</label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={resetFilters}>
                Xóa bộ lọc
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span className="font-medium text-card-foreground">{year}</span>
          {quarter !== "all" && (
            <Badge variant="secondary" className="text-xs">{quarters.find((q) => q.value === quarter)?.label}</Badge>
          )}
          {customer !== "all" && (
            <Badge variant="secondary" className="text-xs">{customers.find((c) => c.value === customer)?.label}</Badge>
          )}
        </div>

        {/* Auto-rotate controls */}
        <div className="ml-auto flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 h-8">
                <Timer className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">{intervalOptions.find(o => o.value === rotateInterval)?.label}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-2" align="end">
              <p className="text-xs font-medium text-muted-foreground mb-2">Thời gian chuyển tab</p>
              {intervalOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRotateInterval(opt.value)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                    rotateInterval === opt.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant={autoRotate ? "default" : "outline"}
            size="sm"
            className="gap-1.5 h-8"
            onClick={() => autoRotate ? setAutoRotate(false) : startPresentation()}
          >
            {autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-xs">{autoRotate ? "Dừng" : "Trình chiếu"}</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setAutoRotate(false); }} className="w-full">
        <div className="relative">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap h-auto gap-0.5 bg-muted/50 p-1 no-scrollbar">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">CEO Dashboard</TabsTrigger>
            <TabsTrigger value="customer" className="text-xs sm:text-sm">Khách hàng</TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs sm:text-sm">Doanh thu</TabsTrigger>
            <TabsTrigger value="project" className="text-xs sm:text-sm">Dự án</TabsTrigger>
            <TabsTrigger value="product" className="text-xs sm:text-sm">Sản phẩm</TabsTrigger>
            <TabsTrigger value="warranty" className="text-xs sm:text-sm">Bảo hành</TabsTrigger>
            <TabsTrigger value="material" className="text-xs sm:text-sm">Vật tư</TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs sm:text-sm">Cảnh báo</TabsTrigger>
          </TabsList>
          {autoRotate && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted overflow-hidden rounded-full">
              <div
                className="h-full bg-primary rounded-full"
                style={{
                  animation: `progress-bar ${rotateInterval}s linear infinite`,
                }}
              />
            </div>
          )}
        </div>
        <TabsContent value="overview">
          <OverviewTab data={data} contractsTableData={overviewContractRows} />
        </TabsContent>
        <TabsContent value="customer"><CustomerTab data={data} /></TabsContent>
        <TabsContent value="revenue"><RevenueTab data={data} /></TabsContent>
        <TabsContent value="project"><ProjectTab data={data} /></TabsContent>
        <TabsContent value="product"><ProductTab data={data} /></TabsContent>
        <TabsContent value="warranty"><WarrantyTab data={data} /></TabsContent>
        <TabsContent value="material"><MaterialTab data={data} /></TabsContent>
        <TabsContent value="alerts"><AlertTab data={data} /></TabsContent>
      </Tabs>

      <style>{`
        @keyframes progress-bar {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Index;
