import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, GraduationCap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkflowInstancePanel } from "@/components/workflow/WorkflowInstancePanel";
import {
  useAttachWorkflow,
  useInstanceForEntity,
  useWorkflowsList,
} from "@/hooks/use-workflows-api";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
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

export type LinkedTrainingSummary = {
  id: string;
  code: string;
  title: string;
  status: string;
  workflowId?: string | null;
  workflowName?: string | null;
  startDate?: string;
  endDate?: string;
};

type TrainingDetail = {
  id: string;
  code: string;
  title: string;
  typeCode: string;
  startDate: string;
  endDate: string;
  status: string;
  location?: string | null;
  description?: string | null;
  contractId?: string | null;
};

type Props = {
  contractId: string | null;
  customerId?: string | null;
  linkedTraining?: LinkedTrainingSummary | null;
  readOnly?: boolean;
  onSaved?: () => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null) {
    const maybe = error as { response?: { data?: { message?: string } }; message?: string };
    if (maybe.response?.data?.message) return maybe.response.data.message;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

export function ContractTrainingSection({
  contractId,
  customerId,
  linkedTraining,
  readOnly = false,
  onSaved,
}: Props) {
  const qc = useQueryClient();
  const courseId = linkedTraining?.id ?? null;

  const { data: trainingTypes = [] } = useDefinitionsList("training_type");
  const { data: trainingWorkflows = [] } = useWorkflowsList("training");
  const attachWf = useAttachWorkflow();

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["training-course", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<TrainingDetail>>(`/api/v1/training/${encodeURIComponent(courseId!)}`);
      return res.data.data;
    },
  });

  const { data: liveInstance } = useInstanceForEntity("training", courseId, {
    enabled: Boolean(courseId),
  });

  const [title, setTitle] = useState("");
  const [typeCode, setTypeCode] = useState("internal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [pendingSwitchId, setPendingSwitchId] = useState<string | null>(null);

  const isCreateMode = !courseId;

  useEffect(() => {
    if (detail) {
      setTitle(detail.title);
      setTypeCode(detail.typeCode || "internal");
      setStartDate(detail.startDate?.slice(0, 10) ?? "");
      setEndDate(detail.endDate?.slice(0, 10) ?? "");
      setLocation(detail.location ?? "");
      setDescription(detail.description ?? "");
      setStatus(detail.status);
      setSelectedWorkflowId(liveInstance?.workflowId ?? linkedTraining?.workflowId ?? "");
    } else if (isCreateMode && contractId) {
      const d = new Date();
      setStartDate(d.toISOString().slice(0, 10));
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      setEndDate(end.toISOString().slice(0, 10));
      setTitle("");
      setSelectedWorkflowId("");
    }
  }, [detail, isCreateMode, contractId, liveInstance?.workflowId, linkedTraining?.workflowId]);

  const workflowOptions = useMemo(
    () =>
      trainingWorkflows.filter(
        (w) => w.isActive || w.id === selectedWorkflowId || w.id === liveInstance?.workflowId,
      ),
    [trainingWorkflows, selectedWorkflowId, liveInstance?.workflowId],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!contractId) throw new Error("Chưa có hợp đồng");
      const body = {
        title: title.trim(),
        typeCode,
        startDate: new Date(`${startDate}T12:00:00`).toISOString(),
        endDate: new Date(`${endDate}T12:00:00`).toISOString(),
        contractId,
        ...(customerId ? { customerId } : {}),
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        status,
        ...(isCreateMode && selectedWorkflowId ? { workflowId: selectedWorkflowId } : {}),
      };
      if (isCreateMode) {
        const res = await api.post<ApiSuccess<TrainingDetail>>("/api/v1/training", body);
        return res.data.data;
      }
      const res = await api.put<ApiSuccess<TrainingDetail>>(
        `/api/v1/training/${encodeURIComponent(courseId!)}`,
        body,
      );
      return res.data.data;
    },
    onSuccess: () => {
      if (contractId) {
        void qc.invalidateQueries({ queryKey: [...qk.contracts.all, "detail", contractId] });
        void qc.invalidateQueries({ queryKey: ["training-by-contract", contractId] });
      }
      void qc.invalidateQueries({ queryKey: ["trainingCourses"] });
      toast.success(isCreateMode ? "Đã tạo khóa huấn luyện" : "Đã cập nhật huấn luyện");
      onSaved?.();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Không lưu được huấn luyện")),
  });

  const handleWorkflowSelect = (workflowId: string) => {
    if (isCreateMode) {
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
    if (!courseId || !pendingSwitchId) return;
    try {
      await attachWf.mutateAsync({
        moduleKey: "training",
        entityId: courseId,
        workflowId: pendingSwitchId,
      });
      toast.success("Đã áp dụng quy trình mới");
      setPendingSwitchId(null);
      setSelectedWorkflowId(pendingSwitchId);
      onSaved?.();
    } catch (e) {
      toast.error(getApiErrorMessage(e, "Không áp dụng được quy trình"));
    }
  };

  if (!contractId) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Lưu hợp đồng trước, sau đó tạo khóa huấn luyện tại tab này.
      </p>
    );
  }

  if (readOnly && linkedTraining) {
    return (
      <div className="space-y-3 rounded-lg border border-border/50 bg-muted/20 p-4">
        <p className="text-sm">
          <span className="font-medium">{linkedTraining.code}</span>
          {" — "}
          {linkedTraining.title}
          {linkedTraining.workflowName ? ` · ${linkedTraining.workflowName}` : ""}
        </p>
      </div>
    );
  }

  if (detailLoading && courseId) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2 py-6">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải huấn luyện…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {courseId ? (
        <p className="text-xs text-muted-foreground">
          Khoa HL: <span className="font-mono">{detail?.code ?? linkedTraining?.code}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Mỗi hợp đồng chỉ một khóa huấn luyện.</p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Tên khóa / đợt huấn luyện</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên" />
        </div>
        <div className="space-y-1.5">
          <Label>Loại đào tạo</Label>
          <Select value={typeCode} onValueChange={setTypeCode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {trainingTypes.map((t) => (
                <SelectItem key={t.id} value={t.code}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" /> Quy trình huấn luyện
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
        <div className="space-y-1.5">
          <Label>Ngày bắt đầu</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Ngày kết thúc</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Trạng thái</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Kế hoạch</SelectItem>
              <SelectItem value="ongoing">Đang diễn ra</SelectItem>
              <SelectItem value="completed">Hoàn thành</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Địa điểm</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Mô tả</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
        </div>
      </div>

      {courseId && selectedWorkflowId ? (
        <div className="rounded-lg border border-border/50 p-4">
          <p className="text-sm font-medium mb-3 flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Tiến độ quy trình
          </p>
          <WorkflowInstancePanel moduleKey="training" entityId={courseId} compact />
        </div>
      ) : isCreateMode && !selectedWorkflowId ? (
        <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
          Chọn quy trình huấn luyện trước khi lưu.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            if (isCreateMode && !selectedWorkflowId) {
              toast.error("Chọn quy trình huấn luyện");
              return;
            }
            if (!title.trim()) {
              toast.error("Nhập tên khóa huấn luyện");
              return;
            }
            saveMutation.mutate();
          }}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? "Đang lưu…" : courseId ? "Lưu huấn luyện" : "Tạo huấn luyện"}
        </Button>
      </div>

      <AlertDialog open={Boolean(pendingSwitchId)} onOpenChange={(o) => !o && setPendingSwitchId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ap dung quy trinh khac?</AlertDialogTitle>
            <AlertDialogDescription>
              Tien trinh hien tai se dong va tao lai tu buoc dau. Ban co chac?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={attachWf.isPending}>Huy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmSwitch();
              }}
              disabled={attachWf.isPending}
            >
              {attachWf.isPending ? "Dang ap dung..." : "Ap dung"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
