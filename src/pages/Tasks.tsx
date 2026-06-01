import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Plus, LayoutGrid, List, Calendar, Search, Filter, CheckCircle2,
  Clock, AlertTriangle, ListTodo, Users, CalendarDays, ChevronLeft, ChevronRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCreateTask, useDeleteTask, useTasksList, useUpdateTask } from "@/hooks/use-tasks-api";
import {
  statusLabels, priorityLabels, priorityColors, statusColors,
  statusDotColors, statusColumnBorder, priorityDotColors, taskTypeLabels,
  type TaskItem
} from "@/data/taskData2";
import TaskDialog from "@/components/tasks/TaskDialog";
import { toast } from "sonner";
import { toastApiError } from "@/lib/api-errors";
import { DEFAULT_LIST_PAGE_SIZE } from "@/lib/list-pagination";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";

type ViewMode = "kanban" | "list" | "calendar";
const statuses: TaskItem["status"][] = ["todo", "in_progress", "review", "completed"];

const Tasks = () => {
  const isMobile = useIsMobile();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [view, setView] = useState<ViewMode>("kanban");
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [search, setSearch] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  function toDateInputValue(iso: string | Date | null | undefined) {
    if (!iso) return "";
    const d = typeof iso === "string" ? new Date(iso) : iso;
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toISOString().slice(0, 10);
  }

  function mapUiStatus(status: string): TaskItem["status"] {
    if (status === "completed") return "completed";
    if (status === "review") return "review";
    if (status === "todo") return "todo";
    // Backend can return "delayed" or other intermediate states
    return status === "in_progress" || status === "delayed" ? "in_progress" : "todo";
  }

  const { data: apiTasks = [] } = useTasksList();

  useEffect(() => {
    setTasks(
      apiTasks.map((row) => ({
        id: row.code,
        title: row.title,
        description: row.description ?? "",
        priority: row.priority,
        assignee: row.assignee?.fullName ?? "",
        startDate: toDateInputValue(row.startDate),
        deadline: toDateInputValue(row.deadline),
        status: mapUiStatus(row.status),
        progress: Number(row.progress ?? 0),
        projectId: row.projectId ?? undefined,
        projectCode: row.project?.code ?? undefined,
        type: row.type,
      })),
    );
  }, [apiTasks]);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const filteredTasks = useMemo(() =>
    tasks.filter(tk => {
      const matchSearch = !search ||
        tk.title.toLowerCase().includes(search.toLowerCase()) ||
        tk.assignee.toLowerCase().includes(search.toLowerCase()) ||
        tk.code?.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === "all" || tk.priority === filterPriority;
      const matchType = filterType === "all" || tk.type === filterType;
      return matchSearch && matchPriority && matchType;
    }), [tasks, search, filterPriority, filterType]);

  const tasksListPag = usePaginatedSlice(filteredTasks, [search, filterPriority, filterType]);

  // Stats
  const completedCount = tasks.filter(t => t.status === "completed").length;
  const inProgressCount = tasks.filter(t => t.status === "in_progress").length;
  const overdueCount = tasks.filter(t => t.status !== "completed" && new Date(t.deadline) < new Date()).length;
  const avgProgress = tasks.length > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0;

  const handleSave = useCallback(async (data: Partial<TaskItem>) => {
    if (!data.title?.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    try {
      if (editingTask) {
        await updateTaskMutation.mutateAsync({
          id: editingTask.id,
          payload: {
            title: data.title,
            description: data.description,
            status: data.status,
            priorityCode: data.priority,
            type: data.type,
            progress: data.progress,
            startDate: data.startDate,
            deadline: data.deadline,
          },
        });
        setEditingTask(null);
        toast.success("Đã cập nhật công việc");
      } else {
        await createTaskMutation.mutateAsync({
          title: data.title || "",
          description: data.description,
          status: data.status,
          priorityCode: data.priority,
          type: data.type,
          progress: data.progress,
          startDate: data.startDate,
          deadline: data.deadline,
        });
        toast.success("Đã tạo công việc");
      }
    } catch (e) {
      toastApiError(e, "Không thể lưu công việc");
    }
  }, [createTaskMutation, editingTask, updateTaskMutation]);

  const handleDeleteTask = useCallback(
    async (id: string) => {
      try {
        await deleteTaskMutation.mutateAsync(id);
        setEditingTask(null);
        setShowDialog(false);
        toast.success("Đã xóa công việc");
      } catch (e) {
        toastApiError(e, "Không xóa được công việc");
      }
    },
    [deleteTaskMutation],
  );

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days: { date: Date; inMonth: boolean }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) days.push({ date: new Date(year, month, -i), inMonth: false });
    for (let d = 1; d <= lastDay.getDate(); d++) days.push({ date: new Date(year, month, d), inMonth: true });
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) days.push({ date: new Date(year, month + 1, i), inMonth: false });
    return days;
  }, [calendarMonth]);

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredTasks.filter(tk => tk.deadline === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Quản lý công việc</h1>
          <p className="text-sm text-muted-foreground">{filteredTasks.length} / {tasks.length} công việc</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {([
              { mode: "kanban" as const, icon: LayoutGrid, label: "Kanban" },
              { mode: "list" as const, icon: List, label: "Danh sách" },
              { mode: "calendar" as const, icon: Calendar, label: "Lịch" },
            ]).map(v => (
              <button
                key={v.mode}
                onClick={() => setView(v.mode)}
                className={`px-2 sm:px-3 py-1.5 text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-colors ${view === v.mode ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary"}`}
              >
                <v.icon className="w-3.5 h-3.5" />
                {!isMobile && <span>{v.label}</span>}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowDialog(true)} size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo mới</span>
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Hoàn thành", value: `${completedCount}/${tasks.length}`, icon: CheckCircle2, color: "text-success", bg: "bg-success/10", sub: `${tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%` },
          { label: "Đang thực hiện", value: String(inProgressCount), icon: Clock, color: "text-info", bg: "bg-info/10", sub: "Đang xử lý" },
          { label: "Quá hạn", value: String(overdueCount), icon: AlertTriangle, color: overdueCount > 0 ? "text-destructive" : "text-success", bg: overdueCount > 0 ? "bg-destructive/10" : "bg-success/10", sub: overdueCount > 0 ? "Cần xử lý" : "Đúng tiến độ" },
          { label: "Tiến độ TB", value: `${avgProgress}%`, icon: ListTodo, color: "text-primary", bg: "bg-primary/10", sub: "Tổng thể" },
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-0 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm công việc..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-9 w-[130px] text-xs shrink-0"><SelectValue placeholder="Ưu tiên" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả ưu tiên</SelectItem>
              {Object.entries(priorityLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 w-[130px] text-xs shrink-0"><SelectValue placeholder="Loại" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {Object.entries(taskTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Kanban ── */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-4">
          {statuses.map(status => {
            const statusTasks = filteredTasks.filter(tk => tk.status === status);
            return (
              <div key={status} className={`rounded-xl border-t-[3px] ${statusColumnBorder[status]} p-3 bg-card/50`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusDotColors[status]}`} />
                    <h3 className="text-sm font-semibold">{statusLabels[status]}</h3>
                  </div>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5 font-mono">{statusTasks.length}</span>
                </div>
                <div className="space-y-2 min-h-[60px]">
                  {statusTasks.slice(0, DEFAULT_LIST_PAGE_SIZE).map(tk => (
                    <div
                      key={tk.id}
                      onClick={() => { setEditingTask(tk); setShowDialog(true); }}
                      className="p-3 rounded-lg border border-border/50 bg-card transition-all group cursor-pointer hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${priorityDotColors[tk.priority]}`} />
                        <Badge className={`${priorityColors[tk.priority]} border-0 text-[10px]`}>{priorityLabels[tk.priority]}</Badge>
                        {tk.projectCode && (
                          <span className="text-[10px] font-mono text-muted-foreground/70 ml-auto">{tk.projectCode}</span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors">{tk.title}</h4>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Users className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{tk.assignee}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span className="flex items-center gap-1 font-mono">
                          <CalendarDays className="w-3 h-3" />
                          {tk.deadline}
                        </span>
                        <span className="font-mono font-medium">{tk.progress}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${tk.progress}%`,
                          background: tk.progress >= 80 ? "hsl(var(--success))" : tk.progress >= 40 ? "hsl(var(--info))" : "hsl(var(--warning))",
                        }} />
                      </div>
                    </div>
                  ))}
                  {statusTasks.length > DEFAULT_LIST_PAGE_SIZE && (
                    <p className="text-center py-2 text-[10px] text-muted-foreground">
                      +{statusTasks.length - DEFAULT_LIST_PAGE_SIZE} công việc — chuyển sang chế độ Danh sách
                    </p>
                  )}
                  {statusTasks.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground/50">Trống</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── List ── */}
      {view === "list" && (
        <div className="rounded-xl bg-card border border-border/50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Công việc</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Ưu tiên</th>
                  {!isMobile && <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Người thực hiện</th>}
                  {!isMobile && <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Đề tài</th>}
                  {!isMobile && <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Hạn</th>}
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Trạng thái</th>
                  <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground w-28">Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {tasksListPag.pagedItems.map(tk => {
                  const isOverdue = tk.status !== "completed" && new Date(tk.deadline) < new Date();
                  return (
                    <tr
                      key={tk.id}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => { setEditingTask(tk); setShowDialog(true); }}
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDotColors[tk.priority]}`} />
                          <span className="font-medium">{tk.title}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3"><Badge className={`${priorityColors[tk.priority]} border-0 text-[10px]`}>{priorityLabels[tk.priority]}</Badge></td>
                      {!isMobile && (
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-[9px] font-semibold">{tk.assignee.split(" ").pop()?.[0]}</span>
                            </div>
                            <span className="text-muted-foreground text-xs">{tk.assignee}</span>
                          </div>
                        </td>
                      )}
                      {!isMobile && (
                        <td className="py-2.5 px-3">
                          {tk.projectCode ? (
                            <span className="text-[10px] font-mono text-primary bg-primary/10 rounded px-1.5 py-0.5">{tk.projectCode}</span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                      )}
                      {!isMobile && (
                        <td className="py-2.5 px-3">
                          <span className={`font-mono text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            {isOverdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                            {tk.deadline}
                          </span>
                        </td>
                      )}
                      <td className="py-2.5 px-3"><Badge className={`${statusColors[tk.status]} border-0 text-[10px]`}>{statusLabels[tk.status]}</Badge></td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${tk.progress}%`, background: tk.progress >= 80 ? "hsl(var(--success))" : tk.progress >= 40 ? "hsl(var(--info))" : "hsl(var(--warning))" }} />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground w-7 text-right">{tk.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">Không có công việc nào</div>
          )}
          <PaginatedTableFooter className="px-4 pb-4" {...tasksListPag.footerProps} />
        </div>
      )}

      {/* ── Calendar ── */}
      {view === "calendar" && (
        <div className="rounded-xl bg-card border border-border/50 p-4 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">
              {calendarMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
            </h3>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => setCalendarMonth(new Date())}>Hôm nay</Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(d => (
              <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 border-t border-l border-border/50">
            {calendarDays.map((day, i) => {
              const dayTasks = getTasksForDate(day.date);
              const today = isToday(day.date);
              return (
                <div
                  key={i}
                  className={`border-b border-r border-border/50 min-h-[80px] sm:min-h-[90px] p-1.5 transition-colors ${!day.inMonth ? "bg-muted/30" : "hover:bg-muted/20"} ${today ? "bg-primary/5" : ""}`}
                >
                  <div className={`text-xs font-mono mb-1 ${today ? "w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold" : !day.inMonth ? "text-muted-foreground/40" : "text-muted-foreground"}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(tk => (
                      <div
                        key={tk.id}
                        onClick={() => { setEditingTask(tk); setShowDialog(true); }}
                        className={`text-[9px] px-1 py-0.5 rounded truncate font-medium cursor-pointer ${tk.status === "completed" ? "bg-success/15 text-success" : tk.priority === "urgent" ? "bg-destructive/15 text-destructive" : tk.priority === "high" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"}`}
                        title={tk.title}
                      >
                        {tk.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-[9px] text-muted-foreground text-center">+{dayTasks.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <TaskDialog
        open={showDialog}
        onOpenChange={open => { setShowDialog(open); if (!open) setEditingTask(null); }}
        onSave={handleSave}
        editTask={editingTask}
        onDelete={editingTask ? () => void handleDeleteTask(editingTask.id) : undefined}
      />
    </div>
  );
};

export default Tasks;
