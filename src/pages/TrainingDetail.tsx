import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, GraduationCap, Calendar, Users, MapPin, User as UserIcon,
  Plus, Edit, Trash2, CheckCircle, XCircle, Clock, FileText,
  CalendarDays, Ban, CircleDot,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { typeLabel, statusLabel, statusColor, Trainee, ScheduleSession } from "@/data/trainingData";
import { useTrainingCourse } from "@/hooks/use-training";
import { buildSessionPayload, buildTraineePayload } from "@/lib/training-payload";

const attendanceLabel = { present: "Có mặt", absent: "Vắng", pending: "Chưa điểm danh" };
const attendanceColor = {
  present: "bg-success/10 text-success",
  absent: "bg-destructive/10 text-destructive",
  pending: "bg-muted text-muted-foreground",
};
const sessionStatusLabel = { planned: "Chưa diễn ra", done: "Đã xong", cancelled: "Đã hủy" };
const sessionStatusColor = {
  planned: "bg-info/10 text-info",
  done: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};
const sessionStatusBorder = {
  planned: "border-l-info",
  done: "border-l-success",
  cancelled: "border-l-destructive",
};
const sessionStatusIcon = {
  planned: CircleDot,
  done: CheckCircle,
  cancelled: Ban,
};

const formatDateHeader = (iso: string) => {
  if (!iso) return iso;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const days = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const getDuration = (start: string, end: string) => {
  if (!start || !end) return "";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h && m ? `${h}h${m}p` : h ? `${h}h` : `${m}p`;
};

const TrainingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { course, isLoading, isError, error } = useTrainingCourse(id);

  const [traineeDialog, setTraineeDialog] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Trainee | null>(null);
  const [traineeForm, setTraineeForm] = useState<Omit<Trainee, "id">>({
    name: "", unit: "", rank: "", attendance: "pending",
  });

  const [sessionDialog, setSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduleSession | null>(null);
  const [sessionForm, setSessionForm] = useState<Omit<ScheduleSession, "id">>({
    date: "", startTime: "08:00", endTime: "11:30", topic: "", location: "", status: "planned",
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">Đang tải chi tiết khóa đào tạo...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-destructive">{error instanceof Error ? error.message : "Không tải được dữ liệu khóa đào tạo."}</p>
        <Button onClick={() => navigate("/dao-tao")}><ArrowLeft className="h-4 w-4 mr-2" /> Quay lại</Button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-muted-foreground">Không tìm thấy khóa đào tạo.</p>
        <Button onClick={() => navigate("/dao-tao")}><ArrowLeft className="h-4 w-4 mr-2" /> Quay lại</Button>
      </div>
    );
  }

  const trainees = course.trainees || [];
  const schedule = course.schedule || [];
  const syncedParticipants = course.participants;

  const traineeStats = {
    total: syncedParticipants,
    present: trainees.filter(t => t.attendance === "present").length,
    absent: trainees.filter(t => t.attendance === "absent").length,
    avgScore: (() => {
      const scored = trainees.filter(t => typeof t.score === "number");
      if (!scored.length) return 0;
      return Math.round((scored.reduce((s, t) => s + (t.score || 0), 0) / scored.length) * 10) / 10;
    })(),
  };

  const refreshCourse = async () => {
    await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
    await qc.invalidateQueries({ queryKey: ["trainingCourse", course.id] });
  };

  const updateStatus = async (status: typeof course.status) => {
    try {
      await api.put(`/api/v1/training/${course.id}`, { status });
      await refreshCourse();
      toast.success(`Đã chuyển trạng thái: ${statusLabel[status]}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thể cập nhật trạng thái";
      toast.error(msg);
    }
  };

  // Trainee CRUD
  const openCreateTrainee = () => {
    setEditingTrainee(null);
    setTraineeForm({ name: "", unit: "", rank: "", attendance: "pending" });
    setTraineeDialog(true);
  };
  const openEditTrainee = (t: Trainee) => {
    setEditingTrainee(t);
    const { id, ...rest } = t;
    setTraineeForm(rest);
    setTraineeDialog(true);
  };
  const saveTrainee = async () => {
    if (!traineeForm.name || !traineeForm.unit) {
      toast.error("Vui lòng điền họ tên và đơn vị");
      return;
    }
    try {
      if (editingTrainee) {
        await api.put(`/api/v1/training/${course.id}/trainees/${editingTrainee.id}`, buildTraineePayload(traineeForm));
      } else {
        await api.post(`/api/v1/training/${course.id}/trainees`, buildTraineePayload(traineeForm));
      }
      await refreshCourse();
      toast.success(editingTrainee ? "Đã cập nhật học viên" : "Đã thêm học viên");
      setTraineeDialog(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không lưu được học viên";
      toast.error(msg);
    }
  };
  const removeTrainee = async (tid: string) => {
    try {
      await api.delete(`/api/v1/training/${course.id}/trainees/${tid}`);
      await refreshCourse();
      toast.success("Đã xóa học viên");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không xóa được học viên";
      toast.error(msg);
    }
  };
  const toggleAttendance = async (tid: string) => {
    const t = trainees.find((x) => x.id === tid);
    if (!t) return;
    const order: Trainee["attendance"][] = ["pending", "present", "absent"];
    const i = order.indexOf(t.attendance);
    const next = order[(i + 1) % order.length];
    try {
      await api.put(`/api/v1/training/${course.id}/trainees/${tid}`, { attendance: next });
      await refreshCourse();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không cập nhật điểm danh";
      toast.error(msg);
    }
  };

  // Schedule CRUD
  const openCreateSession = () => {
    setEditingSession(null);
    setSessionForm({ date: course.startDate, startTime: "08:00", endTime: "11:30", topic: "", location: course.location || "", status: "planned" });
    setSessionDialog(true);
  };
  const openEditSession = (s: ScheduleSession) => {
    setEditingSession(s);
    const { id, ...rest } = s;
    setSessionForm(rest);
    setSessionDialog(true);
  };
  const saveSession = async () => {
    if (!sessionForm.date || !sessionForm.topic) {
      toast.error("Vui lòng điền ngày và nội dung");
      return;
    }
    try {
      if (editingSession) {
        await api.put(`/api/v1/training/${course.id}/sessions/${editingSession.id}`, buildSessionPayload(sessionForm));
      } else {
        await api.post(`/api/v1/training/${course.id}/sessions`, buildSessionPayload(sessionForm));
      }
      await refreshCourse();
      toast.success(editingSession ? "Đã cập nhật buổi học" : "Đã thêm buổi học");
      setSessionDialog(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không lưu được buổi học";
      toast.error(msg);
    }
  };
  const removeSession = async (sid: string) => {
    try {
      await api.delete(`/api/v1/training/${course.id}/sessions/${sid}`);
      await refreshCourse();
      toast.success("Đã xóa buổi học");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không xóa được buổi học";
      toast.error(msg);
    }
  };
  const quickUpdateSessionStatus = async (sid: string, status: ScheduleSession["status"]) => {
    try {
      await api.put(`/api/v1/training/${course.id}/sessions/${sid}`, { status });
      await refreshCourse();
      toast.success(`Đã chuyển: ${sessionStatusLabel[status]}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không cập nhật được trạng thái buổi học";
      toast.error(msg);
    }
  };

  // Nhóm buổi học theo ngày (đã sort sẵn khi thêm/sửa, sort lại để chắc chắn)
  const sortedSchedule = [...schedule].sort(
    (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
  );
  const groupedSchedule = sortedSchedule.reduce<Record<string, ScheduleSession[]>>((acc, s) => {
    (acc[s.date] ||= []).push(s);
    return acc;
  }, {});

  // Thống kê lịch học
  const scheduleStats = {
    total: schedule.length,
    done: schedule.filter(s => s.status === "done").length,
    planned: schedule.filter(s => s.status === "planned").length,
    cancelled: schedule.filter(s => s.status === "cancelled").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dao-tao")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-mono text-primary">{course.id}</span>
              <Badge variant="outline" className="text-xs">{typeLabel[course.type]}</Badge>
              <Badge className={`text-xs ${statusColor[course.status]} border-0`}>{statusLabel[course.status]}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary shrink-0" />
              <span className="truncate">{course.title}</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Label className="text-xs whitespace-nowrap">Trạng thái:</Label>
          <Select value={course.status} onValueChange={(v) => updateStatus(v as typeof course.status)}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Lên kế hoạch</SelectItem>
              <SelectItem value="ongoing">Đang diễn ra</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><UserIcon className="h-3 w-3" /> Giảng viên</div>
          <div className="font-semibold mt-1 truncate">{course.instructor}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Khách hàng</div>
          <div className="font-semibold mt-1 truncate">{course.customer}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Thời gian</div>
          <div className="font-semibold mt-1 text-sm">{course.startDate} → {course.endDate}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Địa điểm</div>
          <div className="font-semibold mt-1 truncate">{course.location || "—"}</div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger value="overview"><FileText className="h-4 w-4 mr-1" /> Tổng quan</TabsTrigger>
          <TabsTrigger value="trainees"><Users className="h-4 w-4 mr-1" /> Học viên ({trainees.length})</TabsTrigger>
          <TabsTrigger value="schedule"><Calendar className="h-4 w-4 mr-1" /> Lịch học ({schedule.length})</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Mô tả khóa học</h3>
            <p className="text-sm text-muted-foreground">{course.description || "Chưa có mô tả."}</p>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div><div><div className="text-2xl font-bold">{traineeStats.total}</div><div className="text-xs text-muted-foreground">Tổng HV</div></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-success/10"><CheckCircle className="h-5 w-5 text-success" /></div><div><div className="text-2xl font-bold">{traineeStats.present}</div><div className="text-xs text-muted-foreground">Có mặt</div></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div><div><div className="text-2xl font-bold">{traineeStats.absent}</div><div className="text-xs text-muted-foreground">Vắng</div></div></div></Card>
            <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-info/10"><GraduationCap className="h-5 w-5 text-info" /></div><div><div className="text-2xl font-bold">{traineeStats.avgScore || "—"}</div><div className="text-xs text-muted-foreground">Điểm TB</div></div></div></Card>
          </div>
        </TabsContent>

        {/* Trainees */}
        <TabsContent value="trainees" className="mt-4">
          <Card className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Danh sách học viên</h3>
              <Button size="sm" onClick={openCreateTrainee}><Plus className="h-4 w-4 mr-1" /> Thêm</Button>
            </div>

            {trainees.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Chưa có học viên nào</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Họ và tên</TableHead>
                        <TableHead>Cấp bậc</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead>Điểm danh</TableHead>
                        <TableHead>Điểm</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trainees.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell>{t.rank || "—"}</TableCell>
                          <TableCell>{t.unit}</TableCell>
                          <TableCell>
                            <button onClick={() => toggleAttendance(t.id)}>
                              <Badge className={`${attendanceColor[t.attendance]} border-0 cursor-pointer`}>
                                {attendanceLabel[t.attendance]}
                              </Badge>
                            </button>
                          </TableCell>
                          <TableCell>{t.score ?? "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => openEditTrainee(t)}><Edit className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => removeTrainee(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-2">
                  {trainees.map((t) => (
                    <Card key={t.id} className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.rank ? `${t.rank} · ` : ""}{t.unit}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => toggleAttendance(t.id)}>
                              <Badge className={`${attendanceColor[t.attendance]} border-0 text-xs`}>
                                {attendanceLabel[t.attendance]}
                              </Badge>
                            </button>
                            {typeof t.score === "number" && <span className="text-xs">Điểm: <b>{t.score}</b></span>}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditTrainee(t)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeTrainee(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </Card>
        </TabsContent>

        {/* Schedule */}
        <TabsContent value="schedule" className="mt-4 space-y-4">
          {/* Thống kê nhanh */}
          {schedule.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><div><div className="text-lg font-bold leading-none">{scheduleStats.total}</div><div className="text-xs text-muted-foreground mt-1">Tổng buổi</div></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /><div><div className="text-lg font-bold leading-none">{scheduleStats.done}</div><div className="text-xs text-muted-foreground mt-1">Đã xong</div></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><CircleDot className="h-4 w-4 text-info" /><div><div className="text-lg font-bold leading-none">{scheduleStats.planned}</div><div className="text-xs text-muted-foreground mt-1">Chưa diễn ra</div></div></div></Card>
              <Card className="p-3"><div className="flex items-center gap-2"><Ban className="h-4 w-4 text-destructive" /><div><div className="text-lg font-bold leading-none">{scheduleStats.cancelled}</div><div className="text-xs text-muted-foreground mt-1">Đã hủy</div></div></div></Card>
            </div>
          )}

          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Lịch học</h3>
              <Button size="sm" onClick={openCreateSession}><Plus className="h-4 w-4 mr-1" /> Thêm buổi</Button>
            </div>

            {schedule.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">Chưa có buổi học nào. Bấm "Thêm buổi" để bắt đầu.</div>
            ) : (
              <div className="space-y-5">
                {Object.entries(groupedSchedule).map(([date, sessions]) => (
                  <div key={date}>
                    {/* Header ngày */}
                    <div className="flex items-center gap-2 mb-2 sticky top-0 bg-card py-1 z-10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold text-card-foreground">{formatDateHeader(date)}</h4>
                      <span className="text-xs text-muted-foreground">({sessions.length} buổi)</span>
                    </div>

                    <div className="space-y-2">
                      {sessions.map((s) => {
                        const StatusIcon = sessionStatusIcon[s.status];
                        const duration = getDuration(s.startTime, s.endTime);
                        return (
                          <Card
                            key={s.id}
                            className={`p-3 border-l-4 ${sessionStatusBorder[s.status]} ${s.status === "cancelled" ? "opacity-70" : ""} hover:shadow-sm transition-shadow`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex gap-3 min-w-0 flex-1">
                                <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg p-2 min-w-[64px] shrink-0">
                                  <span className="text-sm font-bold leading-none">{s.startTime}</span>
                                  <span className="text-[10px] mt-0.5 text-muted-foreground">→ {s.endTime}</span>
                                  {duration && <span className="text-[10px] mt-1 font-medium text-primary">{duration}</span>}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Badge className={`${sessionStatusColor[s.status]} border-0 text-xs gap-1`}>
                                      <StatusIcon className="h-3 w-3" />
                                      {sessionStatusLabel[s.status]}
                                    </Badge>
                                  </div>
                                  <div className={`font-medium ${s.status === "cancelled" ? "line-through" : ""}`}>{s.topic}</div>
                                  {s.location && (
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" /> {s.location}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8" title="Đổi trạng thái">
                                      <StatusIcon className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {(["planned", "done", "cancelled"] as const).map((st) => {
                                      const Icon = sessionStatusIcon[st];
                                      return (
                                        <DropdownMenuItem key={st} onClick={() => quickUpdateSessionStatus(s.id, st)}>
                                          <Icon className="h-4 w-4 mr-2" /> {sessionStatusLabel[st]}
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditSession(s)}><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeSession(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trainee dialog */}
      <Dialog open={traineeDialog} onOpenChange={setTraineeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingTrainee ? "Chỉnh sửa học viên" : "Thêm học viên"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Họ và tên *</Label><Input value={traineeForm.name} onChange={(e) => setTraineeForm({ ...traineeForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cấp bậc</Label><Input value={traineeForm.rank || ""} onChange={(e) => setTraineeForm({ ...traineeForm, rank: e.target.value })} /></div>
              <div><Label>Đơn vị *</Label><Input value={traineeForm.unit} onChange={(e) => setTraineeForm({ ...traineeForm, unit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Điểm danh</Label>
                <Select value={traineeForm.attendance} onValueChange={(v) => setTraineeForm({ ...traineeForm, attendance: v as typeof traineeForm.attendance })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Chưa điểm danh</SelectItem>
                    <SelectItem value="present">Có mặt</SelectItem>
                    <SelectItem value="absent">Vắng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Điểm</Label><Input type="number" step="0.1" value={traineeForm.score ?? ""} onChange={(e) => setTraineeForm({ ...traineeForm, score: e.target.value === "" ? undefined : Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTraineeDialog(false)}>Hủy</Button>
            <Button onClick={saveTrainee}>{editingTrainee ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session dialog */}
      <Dialog open={sessionDialog} onOpenChange={setSessionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingSession ? "Chỉnh sửa buổi học" : "Thêm buổi học"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nội dung *</Label><Input value={sessionForm.topic} onChange={(e) => setSessionForm({ ...sessionForm, topic: e.target.value })} /></div>
            <div><Label>Ngày *</Label><Input type="date" value={sessionForm.date} onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Giờ bắt đầu</Label><Input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })} /></div>
              <div><Label>Giờ kết thúc</Label><Input type="time" value={sessionForm.endTime} onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })} /></div>
            </div>
            <div><Label>Địa điểm</Label><Input value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} /></div>
            <div><Label>Trạng thái</Label>
              <Select value={sessionForm.status} onValueChange={(v) => setSessionForm({ ...sessionForm, status: v as typeof sessionForm.status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Chưa diễn ra</SelectItem>
                  <SelectItem value="done">Đã xong</SelectItem>
                  <SelectItem value="cancelled">Hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionDialog(false)}>Hủy</Button>
            <Button onClick={saveSession}>{editingSession ? "Cập nhật" : "Thêm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingDetail;
