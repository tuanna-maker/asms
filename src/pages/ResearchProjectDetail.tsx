import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, FileText, ListTodo, Package, Users, TrendingUp, Banknote,
  Clock, CheckCircle2, AlertTriangle, Wallet, Scale, FileCheck, Rocket,
  Handshake, LayoutDashboard, CalendarDays, Building2, Layers, Target,
  Pencil, Save, X
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStatusLabel, getStatusColor } from "@/data/researchData";
import type { ResearchProject } from "@/data/researchData";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useMemo } from "react";
import { mapResearchProjectDetail, type ApiResearchProjectDetail } from "@/lib/research-project-mapper";
import { useResearchProjectDetail, useUpdateResearchProject } from "@/hooks/use-research-projects-api";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from "recharts";

const taskStatusLabels: Record<string, string> = {
  not_started: "Chưa bắt đầu",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
  delayed: "Trễ hạn",
  review: "Đang xét duyệt",
};

const taskStatusColors: Record<string, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-info/15 text-info",
  completed: "bg-success/15 text-success",
  delayed: "bg-destructive/15 text-destructive",
  review: "bg-warning/15 text-warning",
};

const priorityLabels: Record<string, string> = {
  low: "Thấp", medium: "Trung bình", high: "Cao", urgent: "Khẩn cấp",
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/15 text-warning",
  high: "bg-accent/15 text-accent",
  urgent: "bg-destructive/15 text-destructive",
};

const deliverableTypes: Record<string, string> = {
  report: "📄 Báo cáo", dataset: "📊 Bộ dữ liệu", model: "🔬 Mô hình",
  software: "💻 Phần mềm", other: "📋 Khác",
};

const formatCurrency = (n: number) => new Intl.NumberFormat("vi-VN").format(n) + " đ";
const formatCurrencyShort = (n: number) => (n / 1e6).toFixed(0) + " tr";

function InfoRow({ label, value, mono, icon, badge }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode; badge?: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-2 py-1">
      <span className="text-muted-foreground flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground/60">{icon}</span>}
        {label}
      </span>
      {badge ? (
        <Badge className={`${badge} border-0 text-[10px]`}>{value}</Badge>
      ) : (
        <span className={`font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
      )}
    </div>
  );
}

const ResearchProjectDetail = () => {
  const rawParam = useParams().id;
  const id = rawParam ? decodeURIComponent(rawParam) : undefined;
  const isMobile = useIsMobile();
  const { data: apiDetail, isLoading, isError } = useResearchProjectDetail(id);
  const project = useMemo(
    () => (apiDetail ? mapResearchProjectDetail(apiDetail as ApiResearchProjectDetail) : null) as ResearchProject | null,
    [apiDetail]
  );
  const updateMutation = useUpdateResearchProject();

  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState("");

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">Đang tải đề tài…</div>
    );
  }

  if (isError || !project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy đề tài</p>
        <Link to="/de-tai" className="text-primary text-sm hover:underline mt-2 inline-block">← Quay lại danh sách</Link>
      </div>
    );
  }

  const completedTasks = project.tasks.filter(t => t.status === "completed").length;
  const completedDeliverables = project.deliverables.filter(d => d.status === "completed").length;
  const totalBudget =
    project.budgetItems.length > 0 ? project.budgetItems.reduce((s, i) => s + i.amount, 0) : project.budget;
  const totalSpent =
    project.budgetItems.length > 0 ? project.budgetItems.reduce((s, i) => s + i.spent, 0) : project.budgetSpent;
  const budgetPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const start = new Date(project.startDate).getTime();
  const end = new Date(project.endDate).getTime();
  const now = Date.now();
  const timePct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  const daysTotal = Math.ceil((end - start) / 86400000);
  const daysElapsed = Math.min(daysTotal, Math.max(0, Math.ceil((now - start) / 86400000)));
  const daysLeft = Math.max(0, daysTotal - daysElapsed);
  const isOnTrack = project.progress >= timePct - 10;

  // Chart data
  const taskStatusCounts = [
    { name: "Chưa bắt đầu", value: project.tasks.filter(t => t.status === "not_started").length, fill: "hsl(var(--muted-foreground))" },
    { name: "Đang thực hiện", value: project.tasks.filter(t => t.status === "in_progress").length, fill: "hsl(var(--info))" },
    { name: "Hoàn thành", value: project.tasks.filter(t => t.status === "completed").length, fill: "hsl(var(--success))" },
    { name: "Trễ hạn", value: project.tasks.filter(t => t.status === "delayed").length, fill: "hsl(var(--destructive))" },
  ].filter(s => s.value > 0);

  const budgetChartData = project.budgetItems.map(b => ({
    name: b.category,
    "Phân bổ": b.amount / 1e6,
    "Đã chi": b.spent / 1e6,
  }));

  const deployStatusColor = (s: string) =>
    s === "completed" ? "bg-success/15 text-success" : s === "in_progress" ? "bg-info/15 text-info" : "bg-warning/15 text-warning";

  const coopStatusColor = (s: string) =>
    s === "active" ? "bg-success/15 text-success" : s === "pending" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4">
      <Link to="/de-tai" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs font-mono text-muted-foreground">{project.code}</span>
          <h1 className="text-lg sm:text-xl font-bold text-foreground mt-1 leading-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.department} • {project.manager}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Badge className={`${getStatusColor(project.status)} border-0`}>{getStatusLabel(project.status)}</Badge>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Tiến độ</span>
              <span className="font-bold font-mono text-foreground">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="w-28 h-2 mt-1" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className={`flex-wrap h-auto gap-1 ${isMobile ? "grid grid-cols-4" : ""}`}>
          <TabsTrigger value="overview" className="gap-1.5 text-xs"><LayoutDashboard className="w-3.5 h-3.5" />{!isMobile && "Tổng quan"}</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5 text-xs"><ListTodo className="w-3.5 h-3.5" />{!isMobile && "Công việc"}</TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1.5 text-xs"><Package className="w-3.5 h-3.5" />{!isMobile && "Sản phẩm"}</TabsTrigger>
          <TabsTrigger value="budget" className="gap-1.5 text-xs"><Wallet className="w-3.5 h-3.5" />{!isMobile && "Chi phí"}</TabsTrigger>
          <TabsTrigger value="council" className="gap-1.5 text-xs"><Scale className="w-3.5 h-3.5" />{!isMobile && "Hội đồng"}</TabsTrigger>
          <TabsTrigger value="basis" className="gap-1.5 text-xs"><FileCheck className="w-3.5 h-3.5" />{!isMobile && "Sở cứ"}</TabsTrigger>
          <TabsTrigger value="deployment" className="gap-1.5 text-xs"><Rocket className="w-3.5 h-3.5" />{!isMobile && "Triển khai"}</TabsTrigger>
          <TabsTrigger value="cooperation" className="gap-1.5 text-xs"><Handshake className="w-3.5 h-3.5" />{!isMobile && "Hợp tác"}</TabsTrigger>
          <TabsTrigger value="members" className="gap-1.5 text-xs"><Users className="w-3.5 h-3.5" />{!isMobile && "Thành viên"}</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW ===== */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Summary */}
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-primary" /> Tóm tắt đề tài
              </h3>
              {!editingSummary ? (
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground" onClick={() => { setSummaryDraft(project.description); setEditingSummary(true); }}>
                  <Pencil className="w-3 h-3" /> Sửa
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingSummary(false)}><X className="w-3.5 h-3.5" /></Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs text-primary"
                    disabled={updateMutation.isPending}
                    onClick={() => {
                      void (async () => {
                        try {
                          await updateMutation.mutateAsync({
                            id: project.code,
                            payload: { description: summaryDraft },
                          });
                          setEditingSummary(false);
                          toast.success("Đã lưu tóm tắt");
                        } catch {
                          toast.error("Không thể lưu");
                        }
                      })();
                    }}
                  >
                    <Save className="w-3 h-3" /> Lưu
                  </Button>
                </div>
              )}
            </div>
            {editingSummary ? (
              <Textarea value={summaryDraft} onChange={e => setSummaryDraft(e.target.value)} rows={4} className="text-sm resize-none" autoFocus />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-primary">{project.progress}%</p>
                <p className="text-[10px] text-muted-foreground">Tiến độ</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{project.tasks.length}</p>
                <p className="text-[10px] text-muted-foreground">Công việc</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{project.deliverables.length}</p>
                <p className="text-[10px] text-muted-foreground">Sản phẩm</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{project.members.length}</p>
                <p className="text-[10px] text-muted-foreground">Thành viên</p>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Tiến độ", value: `${project.progress}%`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10", sub: `${daysLeft} ngày còn lại` },
              { label: "Tổng kinh phí", value: formatCurrency(totalBudget), icon: Banknote, color: "text-success", bg: "bg-success/10", sub: `Đã sử dụng: ${budgetPct}%` },
              { label: "Công việc", value: `${completedTasks}/${project.tasks.length}`, icon: ListTodo, color: "text-info", bg: "bg-info/10", sub: "Hoàn thành" },
              { label: "Sản phẩm", value: `${completedDeliverables}/${project.deliverables.length}`, icon: Layers, color: "text-warning", bg: "bg-warning/10", sub: "Hoàn thành" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-card border border-border/50 p-3 sm:p-4 shadow-sm group hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-xl font-bold font-mono">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Info Grid + Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm lg:col-span-2">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><LayoutDashboard className="w-4 h-4 text-primary" /> Thông tin chung</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                <InfoRow label="Mã đề tài" value={project.code} mono icon={<FileText className="w-3.5 h-3.5" />} />
                <InfoRow label="Phòng/ban" value={project.department} icon={<Building2 className="w-3.5 h-3.5" />} />
                <InfoRow label="Chủ nhiệm" value={project.manager} icon={<Users className="w-3.5 h-3.5" />} />
                <InfoRow label="Nguồn kinh phí" value={project.fundingSource} icon={<Banknote className="w-3.5 h-3.5" />} />
                <InfoRow label="Ngày bắt đầu" value={project.startDate} mono icon={<CalendarDays className="w-3.5 h-3.5" />} />
                <InfoRow label="Ngày kết thúc" value={project.endDate} mono icon={<CalendarDays className="w-3.5 h-3.5" />} />
                <InfoRow label="Trạng thái" value={getStatusLabel(project.status)} badge={getStatusColor(project.status)} />
                <InfoRow label="Thành viên" value={`${project.members.length} người`} icon={<Users className="w-3.5 h-3.5" />} />
              </div>
              {project.description && (
                <div className="pt-3 mt-3 border-t border-border/50">
                  <p className="text-xs text-muted-foreground leading-relaxed">{project.description}</p>
                </div>
              )}
            </div>

            {/* Timeline Ring */}
            <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary" /> Tiến độ thời gian</h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="relative w-28 h-28 mx-auto">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" className="stroke-muted" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" className="stroke-primary" strokeWidth="8" strokeDasharray={`${project.progress * 2.64} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold font-mono">{project.progress}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời gian đã qua</span>
                    <span className="font-mono font-medium">{timePct}% ({daysElapsed}/{daysTotal})</span>
                  </div>
                  <Progress value={timePct} className="h-1.5" />
                  <div className={`flex items-center gap-1.5 mt-2 text-xs font-medium ${isOnTrack ? "text-success" : "text-warning"}`}>
                    {isOnTrack ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    {isOnTrack ? "Đúng tiến độ" : "Chậm tiến độ"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Task pie chart */}
            <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Target className="w-4 h-4 text-primary" /> Công việc theo trạng thái</h3>
              {taskStatusCounts.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={taskStatusCounts} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                      {taskStatusCounts.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Chưa có công việc</p>
              )}
            </div>

            {/* Budget bar chart */}
            <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Wallet className="w-4 h-4 text-primary" /> Biểu đồ kinh phí</h3>
              {budgetChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={budgetChartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" unit="tr" />
                    <RechartsTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `${v} tr đ`} />
                    <Bar dataKey="Phân bổ" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.3} />
                    <Bar dataKey="Đã chi" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Chưa có dữ liệu</p>
              )}
            </div>

            {/* Deliverable progress */}
            <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><Layers className="w-4 h-4 text-primary" /> Tiến độ sản phẩm</h3>
              {project.deliverables.length > 0 ? (
                <div className="space-y-3">
                  {project.deliverables.map(d => (
                    <div key={d.id}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium truncate max-w-[70%]">{d.title}</span>
                        <span className={`font-mono font-bold ${d.progress >= 80 ? "text-success" : d.progress >= 40 ? "text-info" : "text-warning"}`}>{d.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${d.progress}%`, background: d.progress >= 80 ? "hsl(var(--success))" : d.progress >= 40 ? "hsl(var(--info))" : "hsl(var(--warning))" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-8">Chưa có sản phẩm</p>
              )}
            </div>
          </div>

          {/* Recent Tasks Table */}
          {project.tasks.length > 0 && (
            <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3"><ListTodo className="w-4 h-4 text-primary" /> Danh sách công việc</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left py-3 px-3 font-medium">Công việc</th>
                      {!isMobile && <th className="text-left py-3 px-3 font-medium">Người thực hiện</th>}
                      {!isMobile && <th className="text-left py-3 px-3 font-medium">Ưu tiên</th>}
                      {!isMobile && <th className="text-left py-3 px-3 font-medium">Hạn</th>}
                      <th className="text-left py-3 px-3 font-medium">Trạng thái</th>
                      <th className="text-left py-3 px-3 font-medium">Tiến độ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.tasks.map(tk => (
                      <tr key={tk.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3 font-medium">{tk.title}</td>
                        {!isMobile && <td className="py-3 px-3 text-muted-foreground text-xs">{tk.assignee}</td>}
                        {!isMobile && <td className="py-3 px-3"><Badge className={`${priorityColors[tk.priority || "medium"]} border-0 text-[10px]`}>{priorityLabels[tk.priority || "medium"]}</Badge></td>}
                        {!isMobile && <td className="py-3 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{tk.endDate}</td>}
                        <td className="py-3 px-3"><Badge className={`${taskStatusColors[tk.status]} border-0 text-[10px]`}>{taskStatusLabels[tk.status]}</Badge></td>
                        <td className="py-3 px-3 w-28">
                          <div className="flex items-center gap-2">
                            <Progress value={tk.progress} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-mono text-muted-foreground">{tk.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ===== TASKS ===== */}
        <TabsContent value="tasks" className="mt-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><ListTodo className="w-4 h-4 text-primary" /> Công việc ({project.tasks.length})</h3>
          {project.tasks.length === 0 ? (
            <div className="rounded-xl bg-card border border-border/50 p-8 text-center text-muted-foreground text-sm shadow-sm">Chưa có công việc</div>
          ) : (
            <div className="space-y-3">
              {project.tasks.map(tk => (
                <div key={tk.id} className="rounded-xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm">{tk.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{tk.assignee} • <span className="font-mono">{tk.startDate} → {tk.endDate}</span></p>
                      {tk.description && <p className="text-xs text-muted-foreground mt-1">{tk.description}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <div className="flex items-center gap-1.5">
                        <Progress value={tk.progress} className="w-16 h-1.5" />
                        <span className="text-[10px] font-mono text-muted-foreground">{tk.progress}%</span>
                      </div>
                      <Badge className={`${taskStatusColors[tk.status]} border-0 text-[10px]`}>{taskStatusLabels[tk.status]}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== DELIVERABLES ===== */}
        <TabsContent value="deliverables" className="mt-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Sản phẩm ({project.deliverables.length})</h3>
          {project.deliverables.length === 0 ? (
            <div className="rounded-xl bg-card border border-border/50 p-8 text-center text-muted-foreground text-sm shadow-sm">Chưa có sản phẩm</div>
          ) : (
            <div className="space-y-3">
              {project.deliverables.map(d => (
                <div key={d.id} className="rounded-xl bg-card border border-border/50 p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`${d.type === "report" ? "bg-primary/15 text-primary" : d.type === "dataset" ? "bg-info/15 text-info" : d.type === "model" ? "bg-warning/15 text-warning" : "bg-accent/15 text-accent"} border-0 text-[10px]`}>
                          {deliverableTypes[d.type]}
                        </Badge>
                        <Badge className={`${taskStatusColors[d.status]} border-0 text-[10px]`}>{taskStatusLabels[d.status]}</Badge>
                      </div>
                      <h4 className="font-medium text-sm">{d.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{d.assignee} • <span className="font-mono">{d.deadline}</span></p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={d.progress} className="w-24 h-1.5" />
                        <span className="text-[10px] font-mono text-muted-foreground">{d.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== BUDGET ===== */}
        <TabsContent value="budget" className="mt-4">
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4"><Wallet className="w-4 h-4 text-primary" /> Chi phí đề tài</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 pb-4 border-b border-border/50">
              <div className="text-center">
                <p className="text-lg font-bold font-mono">{formatCurrencyShort(totalBudget)}</p>
                <p className="text-[10px] text-muted-foreground">Tổng kinh phí</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-destructive">{formatCurrencyShort(totalSpent)}</p>
                <p className="text-[10px] text-muted-foreground">Đã sử dụng</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-mono text-success">{formatCurrencyShort(totalBudget - totalSpent)}</p>
                <p className="text-[10px] text-muted-foreground">Còn lại</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Hạng mục</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Phân bổ</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Đã chi</th>
                    <th className="text-right py-3 px-3 font-medium text-muted-foreground text-xs">Còn lại</th>
                    <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs w-28">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {project.budgetItems.map(b => {
                    const pct = b.amount > 0 ? Math.round((b.spent / b.amount) * 100) : 0;
                    return (
                      <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-3 font-medium">{b.category}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs whitespace-nowrap">{formatCurrency(b.amount)}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs whitespace-nowrap">{formatCurrency(b.spent)}</td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-success whitespace-nowrap">{formatCurrency(b.amount - b.spent)}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="h-1.5 flex-1" />
                            <span className="text-[10px] font-mono">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ===== COUNCIL ===== */}
        <TabsContent value="council" className="mt-4">
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4"><Scale className="w-4 h-4 text-primary" /> Hội đồng thẩm định</h3>
            {project.councilMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có thông tin hội đồng</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Họ tên</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Vai trò</th>
                      {!isMobile && <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Đơn vị</th>}
                      {!isMobile && <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Chuyên môn</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {project.councilMembers.map(m => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-xs">
                              {m.name.split(" ").slice(-1)[0]?.[0]}
                            </div>
                            <span className="font-medium">{m.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <Badge className={`${m.role === "Chủ tịch" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"} border-0 text-[10px]`}>{m.role}</Badge>
                        </td>
                        {!isMobile && <td className="py-3 px-3 text-muted-foreground text-xs">{m.organization}</td>}
                        {!isMobile && <td className="py-3 px-3 text-muted-foreground text-xs">{m.expertise}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== BASIS ===== */}
        <TabsContent value="basis" className="mt-4">
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4"><FileCheck className="w-4 h-4 text-primary" /> Sở cứ thực hiện</h3>
            {project.basisItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có sở cứ</p>
            ) : (
              <div className="space-y-3">
                {project.basisItems.map(b => (
                  <div key={b.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <FileCheck className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge className="bg-accent/15 text-accent border-0 text-[10px]">{b.type}</Badge>
                          <span className="font-mono text-xs text-primary font-medium">{b.code}</span>
                        </div>
                        <h4 className="font-medium text-sm">{b.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">Cơ quan ban hành: {b.issuer} • <span className="font-mono">{b.date}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== DEPLOYMENT ===== */}
        <TabsContent value="deployment" className="mt-4">
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4"><Rocket className="w-4 h-4 text-primary" /> Triển khai ứng dụng</h3>
            {project.deploymentItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có kế hoạch triển khai</p>
            ) : (
              <div className="space-y-3">
                {project.deploymentItems.map(d => (
                  <div key={d.id} className="p-4 rounded-lg border border-border/50 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Rocket className="w-4 h-4 text-info" />
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{d.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{d.description}</p>
                        </div>
                      </div>
                      <Badge className={`${deployStatusColor(d.status)} border-0 text-[10px] shrink-0`}>
                        {d.status === "completed" ? "Hoàn thành" : d.status === "in_progress" ? "Đang thực hiện" : "Kế hoạch"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 ml-11 mt-2 text-xs text-muted-foreground">
                      <span>🎯 Đối tượng: <span className="text-foreground font-medium">{d.target}</span></span>
                      <span>📅 Thời gian: <span className="font-mono">{d.timeline}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== COOPERATION ===== */}
        <TabsContent value="cooperation" className="mt-4">
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="font-semibold text-sm flex items-center gap-2 mb-4"><Handshake className="w-4 h-4 text-primary" /> Hợp tác chuyển giao</h3>
            {project.cooperationItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Chưa có thông tin hợp tác</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Đối tác</th>
                      <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Hình thức</th>
                      {!isMobile && <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Nội dung</th>}
                      <th className="text-center py-3 px-3 font-medium text-muted-foreground text-xs">Trạng thái</th>
                      {!isMobile && <th className="text-left py-3 px-3 font-medium text-muted-foreground text-xs">Bắt đầu</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {project.cooperationItems.map(c => (
                      <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                              <Handshake className="w-4 h-4 text-warning" />
                            </div>
                            <span className="font-medium">{c.partner}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3"><Badge className="bg-accent/15 text-accent border-0 text-[10px]">{c.type}</Badge></td>
                        {!isMobile && <td className="py-3 px-3 text-muted-foreground text-xs max-w-[250px]">{c.content}</td>}
                        <td className="py-3 px-3 text-center">
                          <Badge className={`${coopStatusColor(c.status)} border-0 text-[10px]`}>
                            {c.status === "active" ? "Đang hoạt động" : c.status === "pending" ? "Chờ duyệt" : "Hoàn thành"}
                          </Badge>
                        </td>
                        {!isMobile && <td className="py-3 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{c.startDate}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== MEMBERS ===== */}
        <TabsContent value="members" className="mt-4">
          <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm">
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary" /> Thành viên ({project.members.length})
            </h3>
            <div className="space-y-2">
              {project.members.map((m, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {m.split(" ").slice(-1)[0]?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m}</p>
                    <p className="text-xs text-muted-foreground">{i === 0 ? "Chủ nhiệm đề tài" : "Thành viên"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResearchProjectDetail;
