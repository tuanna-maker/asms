import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, History, Plus, RefreshCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRole } from "@/hooks/use-role";
import {
  useAddStep,
  useDeleteStep,
  useReorderSteps,
  useUpdateStep,
  useUpdateWorkflow,
  useWorkflowDetail,
  type UpsertStepPayload,
  type WorkflowModuleKey,
  type WorkflowStepItem,
} from "@/hooks/use-workflows-api";
import { StepUpsertDialog } from "@/components/workflow/StepUpsertDialog";
import { WorkflowStepCard } from "@/components/workflow/WorkflowStepCard";
import { getModuleStandardStepCount, getModuleStandardSteps } from "@/lib/workflow-field-catalog";

const MODULE_LABEL: Record<WorkflowModuleKey, string> = {
  handover: "Bàn giao",
  warranty: "Bảo hành",
  training: "ĝào tạo",
  coaching: "Huấn luyện",
  contract: "Hợp đồng",
  product: "Sản phẩm",
};

function isValidModule(key: string | undefined): key is WorkflowModuleKey {
  return (
    key === "handover" ||
    key === "warranty" ||
    key === "training" ||
    key === "coaching" ||
    key === "contract" ||
    key === "product"
  );
}

type SortableStepProps = {
  step: WorkflowStepItem;
  index: number;
  total: number;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
};

function SortableStep({ step, index, total, canWrite, onEdit, onDelete, onMove }: SortableStepProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step.id,
    disabled: !canWrite,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <WorkflowStepCard
        step={step}
        index={index}
        total={total}
        canWrite={canWrite}
        onEdit={onEdit}
        onDelete={onDelete}
        onMove={onMove}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

function errMessage(e: unknown) {
  return getApiErrorMessage(e, "Có lỗi xảy ra");
}

const WorkflowEditorPage = () => {
  const params = useParams<{ moduleKey: string; workflowId: string }>();
  const navigate = useNavigate();
  const { role } = useRole();
  const canWrite = role === "admin" || role === "manager";

  const validKey = isValidModule(params.moduleKey) ? params.moduleKey : null;
  const workflowId = params.workflowId ?? "";
  const { data: detail, isLoading, isError, refetch } = useWorkflowDetail(workflowId, {
    enabled: Boolean(workflowId),
  });

  const updateWf = useUpdateWorkflow();
  const addStep = useAddStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const reorderSteps = useReorderSteps();

  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    isActive: true,
  });
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<WorkflowStepItem | null>(null);
  const [deletingStep, setDeletingStep] = useState<WorkflowStepItem | null>(null);
  const [creatingStandardSteps, setCreatingStandardSteps] = useState(false);

  const standardStepCount = validKey ? getModuleStandardStepCount(validKey) : 0;

  useEffect(() => {
    if (!detail) return;
    setForm({
      name: detail.name,
      code: detail.code,
      description: detail.description ?? "",
      isActive: detail.isActive,
    });
  }, [detail]);

  const steps = useMemo(() => detail?.steps ?? [], [detail?.steps]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (!validKey) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6 text-sm text-muted-foreground">
        Nhóm quy trình không hợp lệ.{" "}
        <Link to="/quy-trinh" className="text-primary underline-offset-4 hover:underline">
          Quay lại
        </Link>
      </div>
    );
  }

  const submitWorkflow = async () => {
    const name = form.name.trim();
    if (!name) {
      toast.error("Tên quy trình là bắt buộc");
      return;
    }
    try {
      await updateWf.mutateAsync({
        id: workflowId,
        payload: {
          name,
          description: form.description.trim() || null,
          isActive: form.isActive,
        },
      });
      toast.success("ĝã lưu quy trình");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const handleStepSubmit = async (payload: UpsertStepPayload) => {
    try {
      if (editingStep) {
        await updateStep.mutateAsync({ workflowId, stepId: editingStep.id, payload });
        toast.success("ĝã cập nhật bước");
      } else {
        await addStep.mutateAsync({ workflowId, payload });
        toast.success("ĝã thêm bước");
      }
      setStepDialogOpen(false);
      setEditingStep(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const handleStepDelete = async () => {
    if (!deletingStep) return;
    try {
      await deleteStep.mutateAsync({ workflowId, stepId: deletingStep.id });
      toast.success("ĝã xoá bước");
      setDeletingStep(null);
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const createStandardSteps = async () => {
    if (!validKey) return;
    const standard = getModuleStandardSteps(validKey);
    if (!standard?.length) return;
    setCreatingStandardSteps(true);
    try {
      for (const s of standard) {
        await addStep.mutateAsync({
          workflowId,
          payload: {
            name: s.name,
            actionCode: s.actionCode,
            roleCode: s.roleCode,
            description: s.description ?? null,
            phaseCode: s.phaseCode,
            requireDocument: s.requireDocument ?? false,
            fieldSchema: s.fieldSchema,
          },
        });
      }
      toast.success(`ĝã tạo ${standard.length} bước chuẩn (kèm trường nhập từ màn nghiệp vụ)`);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setCreatingStandardSteps(false);
    }
  };

  const handleMove = async (stepIndex: number, dir: "up" | "down") => {
    const target = dir === "up" ? stepIndex - 1 : stepIndex + 1;
    if (target < 0 || target >= steps.length) return;
    const next = [...steps];
    [next[stepIndex], next[target]] = [next[target]!, next[stepIndex]!];
    const items = next.map((s, idx) => ({ id: s.id, order: (idx + 1) * 10 }));
    try {
      await reorderSteps.mutateAsync({ workflowId, items });
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(steps, oldIndex, newIndex);
    const items = next.map((s, idx) => ({ id: s.id, order: (idx + 1) * 10 }));
    try {
      await reorderSteps.mutateAsync({ workflowId, items });
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const submitting = updateWf.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Quay lại">
            <Link to={`/quy-trinh/${validKey}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-card-foreground">Chỉnh sửa quy trình</h2>
            <p className="text-sm text-muted-foreground">
              Cấu hình luồng xử lý và các bước phê duyệt — {MODULE_LABEL[validKey]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/cai-dat?tab=audit&entity=workflow&entityId=${workflowId}`}>
              <History className="mr-1 h-4 w-4" />
              Lịch sử
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/quy-trinh/${validKey}`)}>
            Hủy
          </Button>
          {canWrite ? (
            <Button onClick={() => void submitWorkflow()} disabled={submitting}>
              <Save className="mr-1 h-4 w-4" />
              {submitting ? "ĝang lưu…" : "Cập nhật quy trình"}
            </Button>
          ) : null}
        </div>
      </div>

      {isError ? (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <span>Không tải được dữ liệu quy trình.</span>
          <Button variant="ghost" size="sm" onClick={() => void refetch()}>
            <RefreshCcw className="mr-1 h-4 w-4" /> Thử lại
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="space-y-4">
          <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="mb-3 border-l-4 border-primary pl-3">
              <h3 className="font-semibold text-card-foreground">Thông tin cấu hình</h3>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wf-name">
                  <span className="text-destructive">*</span> Tên quy trình
                </Label>
                <Input
                  id="wf-name"
                  value={form.name}
                  onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                  disabled={!canWrite || isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-code">Mã quy trình</Label>
                <Input id="wf-code" value={form.code} readOnly disabled className="bg-muted font-mono text-sm" />
                <p className="text-xs text-muted-foreground">Mã do hệ thống tự sinh, không thể chỉnh sửa.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Loại văn bản</Label>
                  <Select disabled value="1">
                    <SelectTrigger>
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{MODULE_LABEL[validKey]}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Trạng thái</Label>
                  <Select
                    value={form.isActive ? "active" : "inactive"}
                    onValueChange={(v) => setForm((s) => ({ ...s, isActive: v === "active" }))}
                    disabled={!canWrite || isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Hoạt động</SelectItem>
                      <SelectItem value="inactive">Ngừng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Lĩnh vực Phân quyờn (Domain)</Label>
                <Select disabled value={validKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={validKey}>{MODULE_LABEL[validKey]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wf-desc">Mô tả</Label>
                <Textarea
                  id="wf-desc"
                  value={form.description}
                  onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
                  rows={3}
                  disabled={!canWrite || isLoading}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <RefreshCcw className="h-4 w-4 text-primary" />
              Tổng quát
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số bước</span>
                <span className="font-semibold text-primary">{steps.length}</span>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-xl border border-border/50 bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="border-l-4 border-primary pl-3">
              <h3 className="font-semibold text-card-foreground">Thiết kế luồng xử lý</h3>
            </div>
            {canWrite ? (
              <div className="flex flex-wrap gap-2">
                {steps.length === 0 && standardStepCount > 0 ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={creatingStandardSteps || addStep.isPending}
                    onClick={() => void createStandardSteps()}
                  >
                    {creatingStandardSteps ? "ĝang tạo…" : `Tạo ${standardStepCount} bước chuẩn`}
                  </Button>
                ) : null}
                <Button
                  onClick={() => {
                    setEditingStep(null);
                    setStepDialogOpen(true);
                  }}
                  disabled={addStep.isPending}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Thêm bước
                </Button>
              </div>
            ) : null}
          </div>

          <div className="space-y-3">
            <div className="flex justify-center">
              <span className="rounded-full bg-emerald-500 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                ◝ BẮT ĝẦU
              </span>
            </div>
            {isLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">ĝang tải các bước…</p>
            ) : steps.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Chưa có bước nào.
                {standardStepCount > 0
                  ? ` Bấm «Tạo ${standardStepCount} bước chuẩn» để thêm luồng giống màn nghiệp vụ (kèm trường nhập).`
                  : ' Bấm «Thêm bước» để bắt đầu.'}
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
                <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {steps.map((step, index) => (
                      <div key={step.id} className="space-y-2">
                        <SortableStep
                          step={step}
                          index={index}
                          total={steps.length}
                          canWrite={canWrite}
                          onEdit={() => {
                            setEditingStep(step);
                            setStepDialogOpen(true);
                          }}
                          onDelete={() => setDeletingStep(step)}
                          onMove={(dir) => void handleMove(index, dir)}
                        />
                        {index < steps.length - 1 ? (
                          <div className="flex justify-center text-muted-foreground">↓</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <div className="flex justify-center">
              <span className="rounded-full bg-slate-700 px-4 py-1 text-xs font-semibold text-white shadow-sm">
                ⊙ KẾT THÚC
              </span>
            </div>
          </div>
        </section>
      </div>

      <StepUpsertDialog
        open={stepDialogOpen}
        onOpenChange={(o) => {
          setStepDialogOpen(o);
          if (!o) setEditingStep(null);
        }}
        initial={editingStep}
        onSubmit={handleStepSubmit}
        submitting={addStep.isPending || updateStep.isPending}
        moduleKey={validKey ?? undefined}
        stepIndex={
          editingStep
            ? Math.max(0, steps.findIndex((s) => s.id === editingStep.id))
            : steps.length
        }
      />

      <AlertDialog open={Boolean(deletingStep)} onOpenChange={(o) => !o && setDeletingStep(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá bước?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingStep ? `Bước «${deletingStep.name}» sẽ bị xoá khời quy trình.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleStepDelete();
              }}
              disabled={deleteStep.isPending}
            >
              {deleteStep.isPending ? "ĝang xoá…" : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default WorkflowEditorPage;
