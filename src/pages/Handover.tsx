import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Truck, ClipboardCheck, Package, GraduationCap, FileCheck, CheckCircle, Clock, ArrowRight, Plus, Pencil, Trash2 } from "lucide-react";
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
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
import { useDeleteHandover, useHandoversList, type HandoverListItem } from "@/hooks/use-handovers-api";
import { useTrainingCoursesQuery } from "@/hooks/use-training";
import { HandoverUpsertDialog } from "@/components/handover/HandoverUpsertDialog";

const steps = [
  { icon: ClipboardCheck, label: "Lập & phê duyệt kế hoạch", key: "plan" },
  { icon: FileCheck, label: "Lập & phê duyệt tờ trình", key: "ttr" },
  { icon: Package, label: "Chuẩn bị hàng hóa", key: "prepare" },
  { icon: Truck, label: "Bàn giao", key: "handover" },
  { icon: GraduationCap, label: "Huấn luyện", key: "training" },
];

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
  const { data: handoverRows = [], isLoading, isError, error } = useHandoversList();
  const { data: trainingRows = [], isLoading: isTrainingLoading, isError: isTrainingError, error: trainingError } = useTrainingCoursesQuery();
  const { data: contractOptions = [] } = useQuery({
    queryKey: qk.contracts.all,
    queryFn: async () => {
      const res = await api.get<ApiSuccess<Array<{ id: string; code: string; title: string | null; products: number }>>>("/api/v1/contracts");
      return res.data.data ?? [];
    },
    staleTime: 60_000,
  });

  const [upsertOpen, setUpsertOpen] = useState(false);
  const [editingHandover, setEditingHandover] = useState<HandoverListItem | null>(null);
  const [deletingHandover, setDeletingHandover] = useState<HandoverListItem | null>(null);
  const [trainingCreateOpen, setTrainingCreateOpen] = useState(false);
  const [trainingSubmitting, setTrainingSubmitting] = useState(false);
  const [trainingEditingId, setTrainingEditingId] = useState<string | null>(null);
  const [deletingTrainingId, setDeletingTrainingId] = useState<string | null>(null);
  const [trainingForm, setTrainingForm] = useState({
    title: "",
    contractId: "",
    type: "internal" as "internal" | "external" | "online",
    status: "planned" as "planned" | "ongoing" | "completed",
    startDate: "",
    endDate: "",
    participants: 0,
    location: "",
    description: "",
  });
  const deleteHandover = useDeleteHandover();

  const syncedContractOptions = contractOptions;
  const syncedHandoverRows = handoverRows;
  const syncedTrainingRows = trainingRows;

  const activeCount = syncedHandoverRows.filter((h) => h.status === "active").length;
  const completedCount = syncedHandoverRows.filter((h) => h.status === "completed").length;

  const resetTrainingForm = () =>
    setTrainingForm({
      title: "",
      contractId: "",
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
    try {
      setTrainingSubmitting(true);
      const payload = {
        title: trainingForm.title.trim(),
        type: trainingForm.type,
        status: trainingForm.status,
        startDate: trainingForm.startDate,
        endDate: trainingForm.endDate || trainingForm.startDate,
        participants: Number(trainingForm.participants || 0),
        contractId: trainingForm.contractId || undefined,
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
      {/* Workflow Steps */}
      <div className="rounded-xl bg-card p-5 shadow-sm border border-border/50">
        <h3 className="font-semibold text-card-foreground mb-4">Quy trình bàn giao & huấn luyện</h3>
        <div className="flex items-center justify-start overflow-x-auto pb-2 gap-2 sm:gap-3">
          {steps.map((step, i) => (
            <div key={step.key} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1.5 min-w-[88px] sm:min-w-[110px]">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-card-foreground text-center leading-tight max-w-[88px] sm:max-w-[110px]">{step.label}</span>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground mx-1 sm:mx-2 mt-[-16px]" />}
            </div>
          ))}
        </div>
      </div>

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
                  <TableHead className="px-4 py-3">Trạng thái</TableHead>
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
                  syncedHandoverRows.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="px-4 py-3.5 font-medium text-primary align-middle">{h.code}</TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground align-middle text-center lg:text-left break-words">{h.contract.code}</TableCell>
                      <TableCell className="px-4 py-3.5 align-middle text-center lg:text-left break-words">{h.customer.name}</TableCell>
                      <TableCell className="px-4 py-3.5 text-center align-middle">{h.products}</TableCell>
                      <TableCell className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5">
                          <div className="flex gap-0.5">
                            {steps.map((_, i) => (
                              <div key={i} className={`h-2 w-5 rounded-sm ${i < h.currentStep ? "bg-primary" : "bg-secondary"}`} />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {steps[Math.min(Math.max(h.currentStep, 1) - 1, steps.length - 1)].label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-muted-foreground align-middle">
                        {formatShortDate(h.startDate)} – {formatShortDate(h.dueDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 align-middle">{statusBadge(h.status)}</TableCell>
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
                  <TableHead className="px-4 py-3">Thời gian</TableHead>
                  <TableHead className="px-4 py-3">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isTrainingLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Đang tải…
                    </TableCell>
                  </TableRow>
                ) : syncedTrainingRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Chưa có dữ liệu huấn luyện.
                    </TableCell>
                  </TableRow>
                ) : (
                  syncedTrainingRows.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-4 py-3.5 font-medium text-primary align-middle">{t.id}</TableCell>
                      <TableCell className="px-4 py-3.5 text-muted-foreground align-middle text-center lg:text-left break-words">{t.title}</TableCell>
                      <TableCell className="px-4 py-3.5 align-middle text-center lg:text-left break-words">{t.customer || "-"}</TableCell>
                      <TableCell className="px-4 py-3.5 text-center align-middle">{t.participants}</TableCell>
                      <TableCell className="px-4 py-3.5 text-sm text-muted-foreground align-middle">
                        {formatShortDate(t.startDate)} – {formatShortDate(t.endDate)}
                      </TableCell>
                      <TableCell className="px-4 py-3.5 align-middle">{statusBadge(t.status)}</TableCell>
                      <TableCell className="px-4 py-3.5 text-right align-middle">
                        <div className="flex justify-end gap-1">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Hợp đồng liên kết</Label>
                <Select value={trainingForm.contractId || "__none__"} onValueChange={(v) => setTrainingForm((prev) => ({ ...prev, contractId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn hợp đồng" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không liên kết</SelectItem>
                    {syncedContractOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.code} — {c.title || "—"}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <Button onClick={() => void handleSaveTraining()} disabled={trainingSubmitting}>
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

      <HandoverUpsertDialog
        open={upsertOpen}
        onOpenChange={(o) => {
          setUpsertOpen(o);
          if (!o) setEditingHandover(null);
        }}
        contracts={syncedContractOptions}
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
