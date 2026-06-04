import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  GraduationCap,
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import { api } from "@/lib/api";
import { TrainingCourse, typeLabel, statusLabel, statusColor } from "@/data/trainingData";
import { useTrainingCourse, useTrainingCourses } from "@/hooks/use-training";
import { courseKindLabel, workflowModuleForCourseKind } from "@/lib/training-course-kind";
import { CourseWorkflowSection } from "@/components/training/CourseWorkflowSection";
import type { TrainingStepPayloadRecord } from "@/lib/training-step-payload";
import { buildTrainingCoursePayload } from "@/lib/training-payload";
import { useAttachWorkflow, useInstanceForEntity, useWorkflowsList } from "@/hooks/use-workflows-api";
import { useModulePermissions } from "@/hooks/use-module-permissions";
import { CustomerSearchSelect } from "@/components/common/CustomerSearchSelect";
import { UserSearchSelect } from "@/components/common/UserSearchSelect";

const emptyTrainingForm = (): Omit<TrainingCourse, "id"> => ({
  title: "",
  type: "internal",
  customerId: null,
  instructorId: null,
  startDate: "",
  endDate: "",
  participants: 0,
  status: "planned",
  description: "",
  location: "",
  contractId: null,
});


const Training = () => {
  const { canCreate, canUpdate, canDelete } = useModulePermissions("dao-tao");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const courses = useTrainingCourses();
  const attachWf = useAttachWorkflow();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<TrainingCourse, "id">>(emptyTrainingForm);
  const [stepPayloads, setStepPayloads] = useState<TrainingStepPayloadRecord>({});

  const { course: editingDetail } = useTrainingCourse(editingId ?? undefined);
  const editingModuleKey = workflowModuleForCourseKind(editingDetail?.courseKind);

  const { data: trainingWorkflows = [] } = useWorkflowsList("training", { enabled: dialogOpen && !editingId });
  const { data: liveInstance } = useInstanceForEntity(editingModuleKey, editingId, {
    enabled: dialogOpen && Boolean(editingId),
  });

  const workflowOptions = useMemo(
    () =>
      trainingWorkflows.filter(
        (w) => w.isActive || w.id === selectedWorkflowId || w.id === liveInstance?.workflowId,
      ),
    [trainingWorkflows, selectedWorkflowId, liveInstance?.workflowId],
  );

  const stats = {
    total: courses.length,
    ongoing: courses.filter((c) => c.status === "ongoing").length,
    completed: courses.filter((c) => c.status === "completed").length,
    participants: courses.reduce((s, c) => s + c.participants, 0),
  };

  const filtered = useMemo(
    () =>
      courses.filter((c) => {
        if (tab !== "all" && c.status !== tab) return false;
        if (
          search &&
          !c.title.toLowerCase().includes(search.toLowerCase()) &&
          !c.id.toLowerCase().includes(search.toLowerCase())
        ) {
          return false;
        }
        return true;
      }),
    [courses, tab, search],
  );

  const coursesPag = usePaginatedSlice(filtered, [tab, search]);

  useEffect(() => {
    if (!dialogOpen || !editingId || !editingDetail) return;
    setSelectedWorkflowId(editingDetail.workflow?.workflowId ?? "");
    setStepPayloads(editingDetail.stepPayloads ?? {});
  }, [dialogOpen, editingId, editingDetail]);

  const openCreate = () => {
    setEditingId(null);
    setSelectedWorkflowId("");
    setStepPayloads({});
    setForm(emptyTrainingForm());
    setDialogOpen(true);
  };

  const openEdit = (c: TrainingCourse) => {
    setEditingId(c.id);
    const { id: _id, trainees: _t, schedule: _s, ...rest } = c;
    setForm(rest);
    setSelectedWorkflowId(c.workflow?.workflowId ?? "");
    setDialogOpen(true);
  };

  const handleWorkflowSelect = (workflowId: string) => {
    if (!editingId) {
      setSelectedWorkflowId(workflowId);
      return;
    }
    if (workflowId === liveInstance?.workflowId) {
      setSelectedWorkflowId(workflowId);
      return;
    }
    setPendingSwitchId(workflowId);
  };

  const confirmSwitch = async () => {
    if (!editingId || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: editingModuleKey,
        entityId: editingId,
        workflowId: pendingSwitchId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setSelectedWorkflowId(pendingSwitchId);
      setPendingSwitchId(null);
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      await qc.invalidateQueries({ queryKey: ["trainingCourse", editingId] });
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không áp dụng được quy trình"));
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.instructorId || !form.startDate) {
      toast.error("Vui lòng điền tiêu đề, chọn giảng viên và ngày bắt đầu");
      return;
    }
    if (!editingId && !selectedWorkflowId) {
      toast.error("Vui lòng chọn quy trình đào tạo");
      return;
    }
    const courseKind = editingDetail?.courseKind ?? "training";
    const payload = buildTrainingCoursePayload(
      form,
      !editingId ? selectedWorkflowId : selectedWorkflowId || undefined,
      courseKind,
      editingId && Object.keys(stepPayloads).length > 0 ? stepPayloads : undefined,
    );
    try {
      if (editingId) {
        await api.put(`/api/v1/training/${editingId}`, payload);
        toast.success("Đã cập nhật khóa đào tạo");
      } else {
        await api.post("/api/v1/training", payload);
        toast.success("Đã tạo khóa đào tạo mới");
      }
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      if (editingId) {
        await qc.invalidateQueries({ queryKey: ["trainingCourse", editingId] });
      }
      setDialogOpen(false);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không thể lưu khóa đào tạo"));
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await api.delete(`/api/v1/training/${deletingId}`);
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      await qc.invalidateQueries({ queryKey: ["trainingCourse", deletingId] });
      toast.success("Đã xóa khóa đào tạo");
      setDeletingId(null);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không thể xóa khóa đào tạo"));
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" /> Đào tạo &amp; Huấn luyện
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý khóa học, huấn luyện nội bộ và khách hàng
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/quy-trinh/training">
              <GitBranch className="h-4 w-4" /> QT đào tạo
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link to="/quy-trinh/coaching">
              <GitBranch className="h-4 w-4" /> QT huấn luyện
            </Link>
          </Button>
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Tạo khóa mới
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-muted-foreground">Tổng khóa</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.ongoing}</div>
              <div className="text-xs text-muted-foreground">Đang diễn ra</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <div className="text-xs text-muted-foreground">Hoàn thành</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Users className="h-5 w-5 text-info" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.participants}</div>
              <div className="text-xs text-muted-foreground">Học viên</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm khóa học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="planned">Kế hoạch</TabsTrigger>
            <TabsTrigger value="ongoing">Đang TH</TabsTrigger>
            <TabsTrigger value="completed">Xong</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                <p>Không có khóa học nào.</p>
                {canCreate && (
                  <Button type="button" variant="outline" size="sm" onClick={openCreate}>
                    <Plus className="mr-1 h-4 w-4" />
                    Tạo khóa mới
                  </Button>
                )}
              </div>
            ) : (
              coursesPag.pagedItems.map((c) => (
                <Card
                  key={c.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/dao-tao/${c.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-mono text-primary">{c.id}</span>
                        <Badge
                          variant={c.courseKind === "coaching" ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {courseKindLabel(c.courseKind)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {typeLabel[c.type]}
                        </Badge>
                        <Badge className={`text-xs ${statusColor[c.status]} border-0`}>
                          {statusLabel[c.status]}
                        </Badge>
                        {c.workflow?.workflowName ? (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <GitBranch className="h-3 w-3" />
                            {c.workflow.workflowName}
                          </Badge>
                        ) : null}
                      </div>
                      <h3 className="font-semibold truncate">{c.title}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-2 text-xs text-muted-foreground">
                        <div>GV: {c.instructorName || "—"}</div>
                        <div>KH: {c.customerName || "—"}</div>
                        {c.location ? <div className="sm:col-span-2">Đơn vị: {c.location}</div> : null}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {c.startDate} → {c.endDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {c.participants} học viên
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => navigate(`/dao-tao/${c.id}`)}
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdate && (
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setDeletingId(c.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
            {filtered.length > 0 && (
              <PaginatedTableFooter className="mt-4" {...coursesPag.footerProps} />
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={`max-h-[90vh] overflow-y-auto ${editingId ? "max-w-3xl" : "max-w-lg"}`}
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Chỉnh sửa khóa đào tạo" : "Tạo khóa đào tạo mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tiêu đề *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            {!editingId ? (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5" /> Quy trình đào tạo *
                </Label>
                <Select value={selectedWorkflowId || undefined} onValueChange={handleWorkflowSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn quy trình" />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowOptions.map((wf) => (
                      <SelectItem key={wf.id} value={wf.id}>
                        {wf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Loại</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as typeof form.type })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Nội bộ</SelectItem>
                    <SelectItem value="external">Khách hàng</SelectItem>
                    <SelectItem value="online">Trực tuyến</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as typeof form.status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Kế hoạch</SelectItem>
                    <SelectItem value="ongoing">Đang TH</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Khách hàng</Label>
              <CustomerSearchSelect
                value={form.customerId ?? null}
                displayName={form.customerName}
                onChange={(id) =>
                  setForm({
                    ...form,
                    customerId: id,
                    customerName: undefined,
                  })
                }
              />
            </div>
            <div>
              <Label>Đơn vị tổ chức</Label>
              <Input
                value={form.location ?? ""}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ví dụ: Học viện Kỹ thuật Quân sự"
              />
            </div>
            <div>
              <Label>Giảng viên *</Label>
              <UserSearchSelect
                value={form.instructorId ?? null}
                displayName={form.instructorName}
                onChange={(id) =>
                  setForm({
                    ...form,
                    instructorId: id,
                    instructorName: undefined,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Ngày kết thúc</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Số học viên</Label>
              <Input
                type="number"
                value={form.participants}
                onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            {editingId ? (
              <CourseWorkflowSection
                open={dialogOpen}
                courseId={editingId}
                moduleKey={editingModuleKey}
                detailWorkflow={editingDetail?.workflow ?? undefined}
                detailStepPayloads={editingDetail?.stepPayloads}
                selectedWorkflowId={selectedWorkflowId}
                onSelectedWorkflowIdChange={setSelectedWorkflowId}
                stepPayloads={stepPayloads}
                onStepPayloadsChange={setStepPayloads}
              />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave}>{editingId ? "Cập nhật" : "Tạo mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingSwitchId} onOpenChange={(o) => !o && setPendingSwitchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đổi quy trình đào tạo?</AlertDialogTitle>
            <AlertDialogDescription>
              Khóa đào tạo sẽ được gắn quy trình mới. Tiến độ bước hiện tại có thể bị thay đổi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmSwitch()}>Áp dụng</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khóa đào tạo?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Training;






