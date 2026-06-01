import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CourseWorkflowSection } from "@/components/training/CourseWorkflowSection";
import type { TrainingStepPayloadRecord } from "@/lib/training-step-payload";
import type { WorkflowInstanceListSnapshot } from "@/hooks/use-workflows-api";
import { useDefinitionsList } from "@/hooks/use-definitions-api";
import { api } from "@/lib/api";
import type { ApiSuccess } from "@/lib/api-types";
import { qk } from "@/lib/query-keys";
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
  stepPayloads?: TrainingStepPayloadRecord;
  workflow?: WorkflowInstanceListSnapshot | null;
};

type Props = {
  contractId: string | null;
  customerId?: string | null;
  linkedTraining?: LinkedTrainingSummary | null;
  readOnly?: boolean;
  onSaved?: () => void;
};


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

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["training-course", courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const res = await api.get<ApiSuccess<TrainingDetail>>(`/api/v1/training/${encodeURIComponent(courseId!)}`);
      return res.data.data;
    },
  });

  const [title, setTitle] = useState("");
  const [typeCode, setTypeCode] = useState("internal");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("planned");
  const [selectedWorkflowId, setSelectedWorkflowId] = useState("");
  const [stepPayloads, setStepPayloads] = useState<TrainingStepPayloadRecord>({});

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
      setSelectedWorkflowId(detail.workflow?.workflowId ?? linkedTraining?.workflowId ?? "");
      setStepPayloads(detail.stepPayloads ?? {});
    } else if (isCreateMode && contractId) {
      const d = new Date();
      setStartDate(d.toISOString().slice(0, 10));
      const end = new Date(d);
      end.setMonth(end.getMonth() + 1);
      setEndDate(end.toISOString().slice(0, 10));
      setTitle("");
      setSelectedWorkflowId("");
      setStepPayloads({});
    }
  }, [detail, isCreateMode, contractId, linkedTraining?.workflowId]);

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
        courseKind: "coaching" as const,
        ...(isCreateMode && selectedWorkflowId ? { workflowId: selectedWorkflowId } : {}),
        ...(Object.keys(stepPayloads).length > 0 ? { stepPayloads } : {}),
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
          Khóa HL: <span className="font-mono">{detail?.code ?? linkedTraining?.code}</span>
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

      <CourseWorkflowSection
        open
        courseId={courseId}
        moduleKey="coaching"
        isCreateMode={isCreateMode}
        detailWorkflow={detail?.workflow ?? undefined}
        detailStepPayloads={detail?.stepPayloads}
        selectedWorkflowId={selectedWorkflowId}
        onSelectedWorkflowIdChange={setSelectedWorkflowId}
        stepPayloads={stepPayloads}
        onStepPayloadsChange={setStepPayloads}
        workflowSelectHint="Cấu hình bước tại menu Quy trình → Huấn luyện."
      />

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

    </div>
  );
}
