import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck, GraduationCap, CheckCircle, Clock, Plus, Pencil, Trash2, Inbox, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import { PaginatedTableFooter, usePaginatedSlice } from "@/components/common/PaginatedTableFooter";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import { useDeleteHandover, useHandoversList, type HandoverListItem } from "@/hooks/use-handovers-api";
import { useRole } from "@/hooks/use-role";
import { useTrainingCoursesQuery } from "@/hooks/use-training";
import { CourseWorkflowSection } from "@/components/training/CourseWorkflowSection";
import type { TrainingStepPayloadRecord } from "@/lib/training-step-payload";
import { useWorkflowsList } from "@/hooks/use-workflows-api";
import type { TrainingCourse } from "@/data/trainingData";
import { HandoverUpsertDialog } from "@/components/handover/HandoverUpsertDialog";
import { WorkflowStepProgressPill } from "@/components/workflow/WorkflowStepSegments";
import {
  buildAssignedContractSets,
  filterContractsEligibleForNewLink,
  NO_ELIGIBLE_CONTRACTS_HINT,
} from "@/lib/contract-eligibility";
import { lateProgressRowClass } from "@/lib/late-row-highlight";

type NeedsProcessingRow =
  | { kind: "handover"; item: HandoverListItem }
  | { kind: "training"; item: TrainingCourse };

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      response?: { data?: { message?: string; data?: { fieldErrors?: Record<string, string[]> } } };
      message?: string;
    };
    const fieldErrors = maybe.response?.data?.data?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const firstKey = Object.keys(fieldErrors)[0];
      const firstValue = firstKey ? fieldErrors[firstKey]?.[0] : undefined;
      if (firstValue) return firstValue;
    }
    if (maybe.response?.data?.message) return maybe.response.data.message;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

const statusBadge = (status: string) => {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Đang thực hiện", variant: "default" },
    ongoing: { label: "Đang thực hiện", variant: "default" },
    completed: { label: "Hoàn thành", variant: "secondary" },
    late: { label: "Chậm tiến độ", variant: "destructive" },
    pending: { label: "Chưa bắt đầu", variant: "outline" },
    planned: { label: "Chưa bắt đầu", variant: "outline" },
    cancelled: { label: "Đã hủy", variant: "destructive" },
  };
  const cfg = map[status] || map.pending;
  return <Badge variant={cfg.variant} className="px-3 py-1 text-xs leading-tight rounded-full">{cfg.label}</Badge>;
};

const Handover = () => {
  const qc = useQueryClient();
  const { role } = useRole();
  const { data: handoverRows = [], isLoading, isError, error } = useHandoversList();
  const { data: trainingRows = [], isLoading: isTrainingLoading, isError: isTrainingError, error: trainingError } =
    useTrainingCoursesQuery({ courseKind: "coaching" });

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState<HandoverListItem | null>(null);
  const [deletingHandover, setDeletingHandover] = useState<HandoverListItem | null>(null);
  const [trainingCreateOpen, setTrainingCreateOpen] = useState(false);
  const [trainingSubmitting, setTrainingSubmitting] = useState(false);
  const [trainingEditingId, setTrainingEditingId] = useState<string | null>(null);
  const [deletingTrainingId, setDeletingTrainingId] = useState<string | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);
  const [workflowCourseId, setWorkflowCourseId] = useState<string | null>(null);
  const [workflowSelectedId, setWorkflowSelectedId] = useState("");
  const [workflowStepPayloads, setWorkflowStepPayloads] = useState<TrainingStepPayloadRecord>({});
  const [workflowSaving, setWorkflowSaving] = useState(false);

  const { data: workflowCourseDetail } = useQuery({
    queryKey: ["trainingCourse", workflowCourseId],
    enabled: Boolean(workflowCourseId) && workflowDialogOpen,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<TrainingCourse & { stepPayloads?: TrainingStepPayloadRecord }>>(
        `/api/v1/training/${encodeURIComponent(workflowCourseId!)}`,
      );
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!workflowDialogOpen || !workflowCourseDetail) return;
    setWorkflowSelectedId(workflowCourseDetail.workflow?.workflowId ?? "");
    setWorkflowStepPayloads(workflowCourseDetail.stepPayloads ?? {});
  }, [workflowDialogOpen, workflowCourseDetail]);

  const { data: trainingWorkflows = [] } = useWorkflowsList("coaching");
  const { data: contractOptions = [] } = useQuery({
    queryKey: qk.contracts.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Array<{ id: string; code: string; title: string | null; products: number }>>>("/api/v1/contracts");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  const [trainingForm, setTrainingForm] = useState({
    title: "",
    contractId: "",
    workflowId: "",
    type: "internal" as "internal" | "external" | "online",
    status: "planned" as "planned" | "ongoing" | "completed",
    startDate: "",
    endDate: "",
    participants: 0,
    location: "",
    description: "",
  });
  const deleteHandover = useDeleteHandover();

  const syncedHandoverRows = handoverRows;
  const syncedTrainingRows = trainingRows;
  const handoverPag = usePaginatedSlice(syncedHandoverRows);
  const trainingPag = usePaginatedSlice(syncedTrainingRows);

  const assignedContractSets = useMemo(
    () => buildAssignedContractSets(syncedHandoverRows, syncedTrainingRows),
    [syncedHandoverRows, syncedTrainingRows],
  );

  const handoverDialogContracts = useMemo(
    () =>
      filterContractsEligibleForNewLink(
        contractOptions,
        assignedContractSets,
        editingHandover?.contractId,
      ),
    [contractOptions, assignedContractSets, editingHandover?.contractId],
  );

  const trainingDialogContracts = useMemo(
    () =>
      filterContractsEligibleForNewLink(
        contractOptions,
        assignedContractSets,
        trainingEditingId ? trainingForm.contractId || null : null,
      ),
    [contractOptions, assignedContractSets, trainingEditingId, trainingForm.contractId],
  );

  const trainingCreateBlocked =
    !trainingEditingId && trainingDialogContracts.length === 0;

  const trainingWorkflowOptions = useMemo(
    () =>
      trainingWorkflows.filter(
        (w) =>
          w.isActive ||
          w.id === trainingForm.workflowId,
      ),
    [trainingWorkflows, trainingForm.workflowId],
  );

  const needsProcessingRows = useMemo<NeedsProcessingRow[]>(() => {
    const matchRole = (roleCode: string | null | undefined) => roleCode === role;

    const handovers: NeedsProcessingRow[] = syncedHandoverRows
      .filter(
        (h) =>
          h.workflow?.status === "running" &&
          matchRole(h.workflow.currentStepRoleCode),
      )
      .map((h) => ({ kind: "handover", item: h }));

    const trainings: NeedsProcessingRow[] = syncedTrainingRows
      .filter(
        (t) =>
          t.workflow?.status === "running" &&
          matchRole(t.workflow.currentStepRoleCode),
      )
      .map((t) => ({ kind: "training", item: t }));

    return [...handovers, ...trainings];
  }, [syncedHandoverRows, syncedTrainingRows, role]);

  const activeCount = syncedHandoverRows.filter((h) => h.status === "active").length;
  const completedCount = syncedHandoverRows.filter((h) => h.status === "completed").length;

  const resetTrainingForm = () =>
    setTrainingForm({
      title: "",
      contractId: "",
      workflowId: "",
      type: "internal",
      status: "planned",
      startDate: "",
      endDate: "",
      participants: 0,
      location: "",
      description: "",
    });

  const openCreateTraining = () => {
    setTrainingEditingId(null);
    resetTrainingForm();
    setTrainingCreateOpen(true);
  };

  const openEditTraining = (course: (typeof syncedTrainingRows)[number]) => {
    setTrainingEditingId(course.id);
    setTrainingForm({
      title: course.title ?? "",
      contractId: course.contractId ?? "",
      workflowId: course.workflow?.workflowId ?? "",
      type: course.type ?? "internal",
      status: course.status ?? "planned",
      startDate: course.startDate ?? "",
      endDate: course.endDate ?? "",
      participants: Number(course.participants ?? 0),
      location: course.location ?? "",
      description: course.description ?? "",
    });
    setTrainingCreateOpen(true);
  };

  const handleSaveTraining = async () => {
    if (!trainingForm.title.trim() || !trainingForm.startDate) {
      toast.error("Vui lòng nhập tiêu đề và ngày bắt đầu");
      return;
    }
    if (!trainingEditingId && !trainingForm.contractId) {
      toast.error("Chọn hợp đồng chưa có bàn giao và huấn luyện");
      return;
    }
    try {
      setTrainingSubmitting(true);
      const payload = {
        title: trainingForm.title.trim(),
        typeCode: trainingForm.type,
        courseKind: "coaching" as const,
        status: trainingForm.status,
        startDate: trainingForm.startDate,
        endDate: trainingForm.endDate || trainingForm.startDate,
        participants: Number(trainingForm.participants || 0),
        contractId: trainingForm.contractId || undefined,
        workflowId: trainingForm.workflowId || undefined,
        location: trainingForm.location.trim() || undefined,
        description: trainingForm.description.trim() || undefined,
      };
      if (trainingEditingId) {
        await api.put(`/api/v1/training/${trainingEditingId}`, payload);
      } else {
        await api.post("/api/v1/training", payload);
      }
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      if (trainingEditingId) {
        await qc.invalidateQueries({ queryKey: ["trainingCourse", trainingEditingId] });
      }
      toast.success(trainingEditingId ? "Đã cập nhật bài huấn luyện" : "Đã tạo bài huấn luyện");
      setTrainingCreateOpen(false);
      setTrainingEditingId(null);
      resetTrainingForm();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          trainingEditingId ? "Không thể cập nhật bài huấn luyện" : "Không thể tạo bài huấn luyện",
        ),
      );
    } finally {
      setTrainingSubmitting(false);
    }
  };

  const openWorkflowDialog = (course: TrainingCourse) => {
    setWorkflowCourseId(course.id);
    setWorkflowDialogOpen(true);
  };

  const saveWorkflowDialog = async () => {
    if (!workflowCourseId) return;
    setWorkflowSaving(true);
    try {
      await api.put(`/api/v1/training/${workflowCourseId}`, {
        ...(workflowSelectedId ? { workflowId: workflowSelectedId } : {}),
        ...(Object.keys(workflowStepPayloads).length > 0 ? { stepPayloads: workflowStepPayloads } : {}),
      });
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      await qc.invalidateQueries({ queryKey: ["trainingCourse", workflowCourseId] });
      toast.success("Đã lưu quy trình huấn luyện");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không lưu được quy trình"));
    } finally {
      setWorkflowSaving(false);
    }
  };

  const handleDeleteTraining = async () => {
    if (!deletingTrainingId) return;
    try {
      await api.delete(`/api/v1/training/${deletingTrainingId}`);
      await qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      await qc.invalidateQueries({ queryKey: ["trainingCourse", deletingTrainingId] });
      toast.success("Đã xóa bài huấn luyện");
      setDeletingTrainingId(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa bài huấn luyện"));
    }
  };

  return (
    <div className="space-y-6">
      {!isLoading && !isTrainingLoading && needsProcessingRows.length > 0 ? (
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Inbox className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-card-foreground">Cần xử lí</h3>
          <Badge variant="secondary" className="ml-1">
            {needsProcessingRows.length}
          </Badge>
        </div>
          <div className="rounded-lg border border-border/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Loại</TableHead>
                  <TableHead className="px-4 py-3">Mã</TableHead>
                  <TableHead className="px-4 py-3">Bước hiện tại</TableHead>
                  <TableHead className="px-4 py-3">Thời gian</TableHead>
                  <TableHead className="px-4 py-3 text-center min-w-[8rem]">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3 text-right w-24">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsProcessingRows.map((row) => {
                  if (row.kind === "handover") {
                    const h = row.item;
                    return (
                      <TableRow key={`h-${h.id}`} className={lateProgressRowClass(h.status)}>
                        <TableCell className="px-4 py-3.5">
                          <Badge variant="outline">Bàn giao</Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3.5 font-medium text-primary">{h.code}</TableCell>
                        <TableCell className="px-4 py-3.5 text-sm">
                          {h.workflow?.currentStepName ?? "—"}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                          {formatShortDate(h.startDate)} – {formatShortDate(h.dueDate)}
                        </TableCell>
                        <TableCell className="px-4 py-3.5 text-center">{statusBadge(h.status)}</TableCell>
                        <TableCell className="px-4 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingHandover(h);
                              setUpsertOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  const t = row.item;
                  return (
                    <TableRow key={`t-${t.id}`}>
                      <TableCell className="px-4 py-3.5">
                        <Badge variant="outline">Huấn luyện</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 font-medium text-primary">{t.code ?? t.id}</TableCell>
                      <TableCell className="px-4 py-3.5 text-sm">
                        {t.workflow?.currentStepName ?? "—"}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-muted-foreground">
                        {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-center">{statusBadge(t.status)}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTraining(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
      </div>
      ) : null}
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng bàn giao</p>
            <p className="text-2xl font-bold text-card-foreground">{syncedHandoverRows.length}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10 text-info">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Đang thực hiện</p>
            <p className="text-2xl font-bold text-card-foreground">{activeCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hoàn thành</p>
            <p className="text-2xl font-bold text-card-foreground">{completedCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-card p-4 shadow-sm border border-border/50">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Đợt huấn luyện</p>
            <p className="text-2xl font-bold text-card-foreground">{syncedTrainingRows.length}</p>
          </div>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Không tải được danh sách bàn giao."}
        </p>
      )}
      {isTrainingError && (
        <p className="text-sm text-destructive" role="alert">
          {trainingError instanceof Error ? trainingError.message : "Không tải được danh sách huấn luyện."}
        </p>
      )}

      <Tabs defaultValue="handover">
        <TabsList>
          <TabsTrigger value="handover">Bàn giao ({syncedHandoverRows.length})</TabsTrigger>
          <TabsTrigger value="training">Huấn luyện ({syncedTrainingRows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="handover">
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setEditingHandover(null);
                setUpsertOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Thêm bàn giao
            </Button>
          </div>
          <div className="rounded-xl bg-card border border-border/50 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Mã</TableHead>
                  <TableHead className="px-4 py-3 text-center lg:text-left">Hợp đồng</TableHead>
                  <TableHead className="px-4 py-3 text-center lg:text-left">Khách hàng</TableHead>
                  <TableHead className="px-4 py-3 text-center">SP</TableHead>
                  <TableHead className="px-4 py-3">Bước hiện tại</TableHead>
                  <TableHead className="px-4 py-3">Thời gian</TableHead>
                  <TableHead className="px-4 py-3 text-center min-w-[8rem]">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3 text-right w-28">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : syncedHandoverRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Chưa có bàn giao. Nhấn «Thêm bàn giao» để tạo mới.
                    </TableCell>
                  </TableRow>
                ) : (
                  handoverPag.pagedItems.map((h) => (
                    <TableRow key={h.id} className={lateProgressRowClass(h.status)}>
                      <TableCell className="px-4 py-3.5 font-medium text-primary align-middle">{h.code}</TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground align-middle text-center lg:text-left break-words">{h.contract.code}</TableCell>
                      <TableCell className="px-4 py-3.5 align-middle text-center lg:text-left break-words">{h.customer.name}</TableCell>
                      <TableCell className="px-4 py-3.5 text-center align-middle">{h.products}</TableCell>
                      <TableCell className="px-4 py-3.5 align-middle">
                        {h.workflow && h.workflow.totalSteps > 0 ? (
                          <WorkflowStepProgressPill
                            variant="table"
                            totalSteps={h.workflow.totalSteps}
                            currentStepIndex={h.workflow.currentStepIndex}
                            status={h.workflow.status}
                            label={
                              h.workflow.status === "completed"
                                ? h.workflow.currentStepName
                                  ? `${h.workflow.totalSteps}/${h.workflow.totalSteps} · ${h.workflow.currentStepName}`
                                  : "Hoàn tất"
                                : h.workflow.currentStepIndex > 0
                                  ? `${h.workflow.currentStepIndex}/${h.workflow.totalSteps} · ${h.workflow.currentStepName ?? "—"}`
                                  : "Đã đóng"
                            }
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">Chưa gắn quy trình</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-muted-foreground align-middle">
                        {formatShortDate(h.startDate)} – {formatShortDate(h.dueDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 align-middle text-center min-w-[8rem]">{statusBadge(h.status)}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right align-middle">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingHandover(h);
                              setUpsertOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingHandover(h)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <PaginatedTableFooter className="px-4 pb-4" {...handoverPag.footerProps} disabled={isLoading} />
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div className="flex justify-end mb-3">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={openCreateTraining}
            >
              <Plus className="h-4 w-4" />
              Tạo huấn luyện
            </Button>
          </div>
          <div className="rounded-xl bg-card border border-border/50 shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4 py-3">Mã</TableHead>
                  <TableHead className="px-4 py-3 text-center lg:text-left">Khóa học</TableHead>
                  <TableHead className="px-4 py-3 text-center lg:text-left">Khách hàng</TableHead>
                  <TableHead className="px-4 py-3 text-center">Học viên</TableHead>
                  <TableHead className="px-4 py-3">Bước hiện tại</TableHead>
                  <TableHead className="px-4 py-3">Thời gian</TableHead>
                  <TableHead className="px-4 py-3 text-center min-w-[8rem]">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTrainingLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : syncedTrainingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Chưa có dữ liệu huấn luyện.
                    </TableCell>
                  </TableRow>
                ) : (
                  trainingPag.pagedItems.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-4 py-3.5 font-medium text-primary align-middle">{t.code ?? t.id}</TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground align-middle text-center lg:text-left break-words">{t.title}</TableCell>
                      <TableCell className="px-4 py-3.5 align-middle text-center lg:text-left break-words">{t.customer || "-"}</TableCell>
                      <TableCell className="px-4 py-3.5 text-center align-middle">{t.participants}</TableCell>
                      <TableCell className="px-4 py-3.5 text-sm align-middle">
                        {t.workflow?.currentStepName ?? (t.workflow ? "—" : "Chưa gắn quy trình")}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-muted-foreground align-middle">
                        {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 align-middle text-center min-w-[8rem]">{statusBadge(t.status)}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right align-middle">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Xử lý quy trình"
                            onClick={() => openWorkflowDialog(t)}
                          >
                            <GitBranch className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditTraining(t)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingTrainingId(t.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <PaginatedTableFooter
              className="px-4 pb-4"
              {...trainingPag.footerProps}
              disabled={isTrainingLoading}
            />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={trainingCreateOpen} onOpenChange={setTrainingCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{trainingEditingId ? "Sửa bài huấn luyện" : "Tạo bài huấn luyện"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tiêu đề *</Label>
              <Input
                value={trainingForm.title}
                onChange={(e) => setTrainingForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Nhập tên khóa huấn luyện"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Quy trình áp dụng</Label>
              <Select
                value={trainingForm.workflowId || undefined}
                onValueChange={(v) => setTrainingForm((prev) => ({ ...prev, workflowId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn quy trình huấn luyện" />
                </SelectTrigger>
                <SelectContent>
                  {trainingWorkflowOptions.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hợp đồng liên kết *</Label>
                <Select
                  value={trainingForm.contractId || undefined}
                  onValueChange={(v) => setTrainingForm((prev) => ({ ...prev, contractId: v }))}
                  disabled={Boolean(trainingEditingId) || trainingCreateBlocked}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        trainingCreateBlocked
                          ? "Không có HĐ khả dụng"
                          : "Chọn hợp đồng"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingDialogContracts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.title || "—"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {trainingCreateBlocked ? (
                  <p className="text-xs text-muted-foreground">{NO_ELIGIBLE_CONTRACTS_HINT}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label>Loại</Label>
                <Select value={trainingForm.type} onValueChange={(v) => setTrainingForm((prev) => ({ ...prev, type: v as "internal" | "external" | "online" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Nội bộ</SelectItem>
                    <SelectItem value="external">Khách hàng</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu *</Label>
                <Input type="date" value={trainingForm.startDate} onChange={(e) => setTrainingForm((prev) => ({ ...prev, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <Input type="date" value={trainingForm.endDate} onChange={(e) => setTrainingForm((prev) => ({ ...prev, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Số học viên</Label>
                <Input type="number" min={0} value={trainingForm.participants} onChange={(e) => setTrainingForm((prev) => ({ ...prev, participants: Number(e.target.value || 0) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Trạng thái</Label>
                <Select value={trainingForm.status} onValueChange={(v) => setTrainingForm((prev) => ({ ...prev, status: v as "planned" | "ongoing" | "completed" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Kế hoạch</SelectItem>
                    <SelectItem value="ongoing">Đang thực hiện</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Địa điểm</Label>
              <Input value={trainingForm.location} onChange={(e) => setTrainingForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="Địa điểm huấn luyện" />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea rows={3} value={trainingForm.description} onChange={(e) => setTrainingForm((prev) => ({ ...prev, description: e.target.value }))} placeholder="Mô tả ngắn nội dung khóa học" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainingCreateOpen(false)}>Hủy</Button>
            <Button
              onClick={() => void handleSaveTraining()}
              disabled={trainingSubmitting || trainingCreateBlocked}
            >
              {trainingSubmitting ? "Đang lưu..." : trainingEditingId ? "Cập nhật huấn luyện" : "Tạo huấn luyện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingTrainingId} onOpenChange={(o) => !o && setDeletingTrainingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài huấn luyện?</AlertDialogTitle>
            <AlertDialogDescription>Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void handleDeleteTraining()}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={workflowDialogOpen}
        onOpenChange={(open) => {
          setWorkflowDialogOpen(open);
          if (!open) setWorkflowCourseId(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quy trình huấn luyện</DialogTitle>
          </DialogHeader>
          {workflowCourseId ? (
            <CourseWorkflowSection
              open={workflowDialogOpen}
              courseId={workflowCourseId}
              moduleKey="coaching"
              detailWorkflow={workflowCourseDetail?.workflow ?? undefined}
              detailStepPayloads={workflowCourseDetail?.stepPayloads}
              selectedWorkflowId={workflowSelectedId}
              onSelectedWorkflowIdChange={setWorkflowSelectedId}
              stepPayloads={workflowStepPayloads}
              onStepPayloadsChange={setWorkflowStepPayloads}
            />
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setWorkflowDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={() => void saveWorkflowDialog()} disabled={workflowSaving}>
              {workflowSaving ? "Đang lưu…" : "Lưu quy trình"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HandoverUpsertDialog
        open={upsertOpen}
        onOpenChange={(o) => {
          setUpsertOpen(o);
          if (!o) setEditingHandover(null);
        }}
        contracts={handoverDialogContracts}
        editing={editingHandover}
      />

      <AlertDialog open={deletingHandover !== null} onOpenChange={(o) => !o && setDeletingHandover(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bàn giao?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingHandover ? `Phiếu ${deletingHandover.code} sẽ bị gỡ khỏi danh sách.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deletingHandover) return;
                const id = deletingHandover.id;
                void deleteHandover
                  .mutateAsync(id)
                  .then(() => {
                    toast.success("Đã xóa bàn giao");
                    setDeletingHandover(null);
                  })
                  .catch(() => toast.error("Không xóa được"));
              }}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Handover;
