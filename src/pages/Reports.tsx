import { useMemo, useState } from "react";
import { BarChart3, Users, FileText, Package, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import { useReportsByYear } from "@/hooks/use-reports-api";

const fallbackContractByCustomer: Array<{ name: string; contracts: number; value: number }> = [];

const contractStatus = [
  { name: "Đang thực hiện", value: 3, fill: "hsl(215, 90%, 50%)" },
  { name: "Hoàn thành", value: 2, fill: "hsl(150, 60%, 45%)" },
  { name: "Chậm tiến độ", value: 1, fill: "hsl(38, 92%, 55%)" },
  { name: "Đã thanh lý", value: 1, fill: "hsl(220, 15%, 70%)" },
];

const fallbackMonthlyTrend = [
  { month: "T1", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T2", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T3", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T4", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T5", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T6", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T7", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T8", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T9", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T10", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T11", contracts: 0, complaints: 0, handovers: 0 },
  { month: "T12", contracts: 0, complaints: 0, handovers: 0 },
];

const fallbackUnitPerformance: Array<{ unit: string; tasks: number; completed: number; onTime: number; satisfaction: number }> = [];

const COLORS = ["hsl(215, 90%, 50%)", "hsl(150, 60%, 45%)", "hsl(38, 92%, 55%)", "hsl(0, 75%, 55%)"];

const Reports = () => {
  const [year, setYear] = useState("2024");
  const { data: apiReports, isLoading, isError, error } = useReportsByYear(year);

  const contractsTotal = apiReports?.contracts.total ?? 0;
  const deliveredTotal = apiReports?.products.deliveredTotal ?? 0;
  const warrantiesTotal = apiReports?.warranties.total ?? 0;
  const customersTotal = apiReports?.customers.total ?? 0;
  const delta = apiReports?.summary_delta;

  const contractStatusPie = useMemo(() => {
    const byStatus = apiReports?.contracts.byStatus ?? {};
    const active = (byStatus.active ?? 0) + (byStatus.draft ?? 0);
    const completed = byStatus.completed ?? 0;
    const late = byStatus.late ?? 0;
    const liquidated = byStatus.liquidated ?? 0;
    return [
      { name: "Đang thực hiện", value: active, fill: "hsl(215, 90%, 50%)" },
      { name: "Hoàn thành", value: completed, fill: "hsl(150, 60%, 45%)" },
      { name: "Chậm tiến độ", value: late, fill: "hsl(38, 92%, 55%)" },
      { name: "Đã thanh lý", value: liquidated, fill: "hsl(220, 15%, 70%)" },
    ];
  }, [apiReports]);
  const contractByCustomer = apiReports?.customer_breakdown?.length ? apiReports.customer_breakdown : fallbackContractByCustomer;

  const monthlyTrend = apiReports?.trends?.monthly?.length ? apiReports.trends.monthly : fallbackMonthlyTrend;
  const unitPerformance = apiReports?.unit_performance?.length ? apiReports.unit_performance : fallbackUnitPerformance;

  const productByLine = useMemo(() => {
    const byType = apiReports?.warranties.byType ?? {};
    const delivered = apiReports?.products.deliveredTotal ?? 0;
    return [
      {
        name: "Bảo hành",
        produced: delivered,
        delivered,
        warranty: byType.warranty ?? 0,
      },
      {
        name: "Sửa chữa",
        produced: delivered,
        delivered,
        warranty: byType.repair ?? 0,
      },
      {
        name: "Bảo trì",
        produced: delivered,
        delivered,
        warranty: byType.maintenance ?? 0,
      },
    ];
  }, [apiReports]);

  const loadError = error instanceof Error ? error.message : "Không tải được dữ liệu báo cáo.";

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-card-foreground">Báo cáo & Thống kê</span>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">Năm 2024</SelectItem>
            <SelectItem value="2023">Năm 2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-card p-4 shadow-sm border border-border/50 text-sm text-muted-foreground">
          Đang tải dữ liệu báo cáo...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng HĐ</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-card-foreground">{contractsTotal}</p>
              <span className={`flex items-center text-xs ${(delta?.contractsPct ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                {(delta?.contractsPct ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {" "}{Math.abs(delta?.contractsPct ?? 0)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success"><Package className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">SP đã giao</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-card-foreground">{deliveredTotal}</p>
              <span className={`flex items-center text-xs ${(delta?.deliveredPct ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                {(delta?.deliveredPct ?? 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {" "}{Math.abs(delta?.deliveredPct ?? 0)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Khiếu nại</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-card-foreground">{warrantiesTotal}</p>
              <span className={`flex items-center text-xs ${(delta?.warrantiesPct ?? 0) <= 0 ? "text-success" : "text-destructive"}`}>
                {(delta?.warrantiesPct ?? 0) <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {" "}{Math.abs(delta?.warrantiesPct ?? 0)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent"><Building2 className="h-6 w-6" /></div>
          <div>
            <p className="text-sm text-muted-foreground">Khách hàng</p>
            <p className="text-2xl font-bold text-card-foreground">{customersTotal}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="customer">
        <TabsList>
          <TabsTrigger value="customer">Theo khách hàng</TabsTrigger>
          <TabsTrigger value="contract">Theo hợp đồng</TabsTrigger>
          <TabsTrigger value="product">Theo sản phẩm</TabsTrigger>
          <TabsTrigger value="unit">Theo đơn vị</TabsTrigger>
        </TabsList>

        <TabsContent value="customer">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
              <h3 className="font-semibold text-card-foreground mb-4">Số hợp đồng theo khách hàng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contractByCustomer}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="contracts" fill="hsl(215, 90%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {contractByCustomer.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-3">Chưa có dữ liệu hợp đồng theo khách hàng.</p>
              ) : null}
            </div>
            <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
              <h3 className="font-semibold text-card-foreground mb-4">Giá trị HĐ theo khách hàng (triệu đ)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={contractByCustomer}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(170, 60%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {contractByCustomer.length === 0 ? (
                <p className="text-sm text-muted-foreground mt-3">Chưa có dữ liệu giá trị hợp đồng theo khách hàng.</p>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contract">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
              <h3 className="font-semibold text-card-foreground mb-4">Trạng thái hợp đồng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={contractStatusPie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {contractStatusPie.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
              <h3 className="font-semibold text-card-foreground mb-4">Xu hướng theo tháng</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="contracts" name="Hợp đồng" stroke="hsl(215, 90%, 50%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="complaints" name="Khiếu nại" stroke="hsl(38, 92%, 55%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="handovers" name="Bàn giao" stroke="hsl(150, 60%, 45%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              {monthlyTrend.every((m) => m.contracts === 0 && m.complaints === 0 && m.handovers === 0) ? (
                <p className="text-sm text-muted-foreground mt-3">Chưa có dữ liệu xu hướng theo tháng trong năm đã chọn.</p>
              ) : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="product">
          <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
            <h3 className="font-semibold text-card-foreground mb-4">Thống kê theo dòng sản phẩm</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={productByLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="produced" name="Sản xuất" fill="hsl(215, 90%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delivered" name="Đã giao" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="warranty" name="BH/SC" fill="hsl(38, 92%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {productByLine.every((p) => p.warranty === 0 && p.delivered === 0) ? (
              <p className="text-sm text-muted-foreground mt-3">Chưa có dữ liệu theo nhóm sản phẩm.</p>
            ) : null}
          </div>
        </TabsContent>

        <TabsContent value="unit">
          <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
            <h3 className="font-semibold text-card-foreground mb-4">Hiệu suất đơn vị thực hiện</h3>
            <div className="space-y-4">
              {unitPerformance.map((u) => (
                <div key={u.unit} className="rounded-lg bg-secondary/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-card-foreground">{u.unit}</span>
                    <span className="text-sm text-muted-foreground">Hài lòng: <span className="font-bold text-success">{u.satisfaction}%</span></span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Nhiệm vụ</p>
                      <p className="text-lg font-bold text-card-foreground">{u.tasks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Hoàn thành</p>
                      <p className="text-lg font-bold text-success">{u.completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Đúng hạn</p>
                      <p className="text-lg font-bold text-primary">{u.onTime}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-success"
                      style={{ width: `${u.tasks > 0 ? (u.completed / u.tasks) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {unitPerformance.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu hiệu suất đơn vị trong năm đã chọn.</p>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
