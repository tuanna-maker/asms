import { useRef, useState } from "react";
import { Check, CircleDot, Download, FileText, History, Paperclip, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { resolveUploadUrl } from "@/lib/upload-url";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { canUserActOnWorkflowStep } from "@/lib/workflow-step-access";
import { workflowStepListItemClass } from "@/components/workflow/WorkflowStepSegments";
import {
  useAdvanceInstance,
  useDeleteInstanceDocument,
  useInstanceDocuments,
  useInstanceForEntity,
  useUploadInstanceDocument,
  type WorkflowEntityModuleKey,
} from "@/hooks/use-workflows-api";

const ROLE_LABEL: Record<string, string> = {
  admin: "Lãnh đạo",
  manager: "Trưởng phòng",
  technician: "Nhân viên kỹ thuật",
  sales: "Nhân viên bán hàng",
  viewer: "Xem",
};

const ACTION_LABEL: Record<string, string> = {
  submit: "Trình ký",
  approve: "Ký duyệt",
  sign: "Ký số",
  release: "Ban hành",
  start: "Khởi tạo",
  reject: "Trả lại",
  skip: "Bỏ qua",
};

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("vi-VN");
}

function errMessage(e: unknown) {
  return getApiErrorMessage(e, "Có lỗi xảy ra");
}

type Props = {
  moduleKey: WorkflowEntityModuleKey;
  entityId: string | null;
  /** Chỉ hiển thị hành động/tài liệu cho bước này (dùng trong tab nội dung phiếu). */
  focusStepId?: string | null;
  /** Ẩn danh sách tất cả bước (đã có tab riêng). */
  compact?: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
}

function toWorkflowDocumentUrl(storagePath: string): string {
  return resolveUploadUrl(storagePath);
}

export function WorkflowInstancePanel({ moduleKey, entityId, focusStepId, compact }: Props) {
  const { role } = useRole();
  const { user } = useAuth();
  const { data: instance, isLoading } = useInstanceForEntity(moduleKey, entityId);
  const advance = useAdvanceInstance();
  const { data: documents = [] } = useInstanceDocuments(instance?.id);
  const uploadDoc = useUploadInstanceDocument();
  const deleteDoc = useDeleteInstanceDocument();
  const [comment, setComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!entityId) return null;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 text-sm text-muted-foreground">
        Đang tải tiến trình…
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-secondary/10 p-4 text-sm text-muted-foreground">
        Chưa có quy trình áp dụng cho phiếu này.
      </div>
    );
  }

  const currentIndex = instance.workflow.steps.findIndex((s) => s.id === instance.currentStepId);
  const canAct =
    instance.status === "running" &&
    instance.currentStep &&
    canUserActOnWorkflowStep(role, user?.id, instance.currentStep);

  const actionStepId = focusStepId ?? instance.currentStepId;
  const actionStep = actionStepId
    ? (instance.workflow.steps.find((s) => s.id === actionStepId) ?? instance.currentStep)
    : instance.currentStep;
  const stepDocs = documents.filter((d) => actionStepId && d.stepId === actionStepId);
  const allDocs = documents;
  const requireDoc = Boolean(actionStep?.requireDocument);
  const blockedByDocument = requireDoc && stepDocs.length === 0;
  const canActOnFocus =
    instance.status === "running" &&
    actionStep &&
    actionStepId === instance.currentStepId &&
    canUserActOnWorkflowStep(role, user?.id, actionStep);

  const onAct = async (action: "approve" | "reject") => {
    if (action === "approve" && blockedByDocument) {
      toast.error("Cần đính kèm tài liệu trước khi phê duyệt bước này.");
      return;
    }
    try {
      await advance.mutateAsync({
        instanceId: instance.id,
        action,
        comment: comment.trim() || null,
      });
      setComment("");
      toast.success(
        action === "approve"
          ? "Đã phê duyệt bước"
          : moduleKey === "handover"
            ? "Đã hủy bàn giao"
            : "Đã trả lại",
      );
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const onUploadFile = async (file: File) => {
    try {
      await uploadDoc.mutateAsync({
        instanceId: instance.id,
        file,
        stepId: actionStepId ?? null,
      });
      toast.success("Đã đính kèm tài liệu");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const onDeleteDocument = async (documentId: string) => {
    try {
      await deleteDoc.mutateAsync({ instanceId: instance.id, documentId });
      toast.success("Đã xoá tài liệu");
    } catch (e) {
      toast.error(errMessage(e));
    }
  };

  const showAct = compact ? canActOnFocus : canAct;
  const showDocsBlock = Boolean(actionStep);
  /** Cho phép đính kèm cho mọi bước trong lúc quy trình còn chạy. */
  const canUploadDocs = showDocsBlock && instance.status === "running";
  const docStepLabel = compact && actionStep ? actionStep.name : "bước hiện tại";

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4",
        compact && "border-0 bg-transparent p-0 shadow-none",
      )}
    >
      {!compact ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-card-foreground">Tiến trình xử lý</h4>
                <Badge variant="outline" className="text-xs">
                  {instance.workflow.name}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Bắt đầu lúc {formatDateTime(instance.startedAt)}
                {instance.completedAt ? ` · Kết thúc ${formatDateTime(instance.completedAt)}` : ""}
              </p>
            </div>
            {instance.status === "completed" ? (
              <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15">Hoàn tất</Badge>
            ) : instance.status === "cancelled" ? (
              <Badge variant="destructive">Đã trả lại</Badge>
            ) : (
              <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15">Đang xử lý</Badge>
            )}
          </div>

          <ol className="space-y-2">
            {instance.workflow.steps.map((step, idx) => {
              const isDone = currentIndex >= 0 ? idx < currentIndex : instance.status === "completed";
              const isCurrent = idx === currentIndex && instance.status === "running";
              return (
                <li
                  key={step.id}
                  className={workflowStepListItemClass(isDone, isCurrent)}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                      isDone ? "bg-emerald-500" : isCurrent ? "bg-amber-500" : "bg-muted-foreground/60",
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3" /> : isCurrent ? <CircleDot className="h-3 w-3" /> : idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{step.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {ACTION_LABEL[step.actionCode] ?? step.actionCode}
                      </Badge>
                      {step.requireDocument ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          <Paperclip className="h-2.5 w-2.5" />
                          tài liệu
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      <span>{ROLE_LABEL[step.roleCode] ?? step.roleCode}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </>
      ) : null}

      {showDocsBlock ? (
        <div className="rounded-md border border-border/50 bg-secondary/20 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-card-foreground">
              Tài liệu {compact ? `— ${docStepLabel}` : `của ${docStepLabel}`}
              {requireDoc ? <span className="ml-1 text-destructive">(bắt buộc)</span> : null}
            </div>
            {canUploadDocs ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUploadFile(f);
                    e.target.value = "";
                  }}
                />
                <Button variant="outline" size="sm" onClick={onUploadClick} disabled={uploadDoc.isPending}>
                  <Upload className="mr-1 h-4 w-4" />
                  {uploadDoc.isPending ? "Đang tải lên…" : "Đính kèm"}
                </Button>
              </>
            ) : null}
          </div>
          {stepDocs.length === 0 ? (
            <p className="text-xs text-muted-foreground">Chưa có tài liệu nào cho bước này.</p>
          ) : (
            <ul className="space-y-1.5">
              {stepDocs.map((doc) => (
                <li key={doc.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-card px-2 py-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-foreground">{doc.fileName}</span>
                    <span className="ml-1 text-muted-foreground">({formatSize(doc.fileSize)})</span>
                  </span>
                  <a
                    href={toWorkflowDocumentUrl(doc.storagePath)}
                    download={doc.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="icon" aria-label="Tải tài liệu">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                  {doc.uploadedBy ? (
                    <span className="shrink-0 text-muted-foreground">
                      {doc.uploadedBy.fullName} · {formatDateTime(doc.uploadedAt)}
                    </span>
                  ) : (
                    <span className="shrink-0 text-muted-foreground">{formatDateTime(doc.uploadedAt)}</span>
                  )}
                  {canUploadDocs ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Xoá tài liệu"
                      onClick={() => void onDeleteDocument(doc.id)}
                      disabled={deleteDoc.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
      <div className="rounded-md border border-border/50 bg-secondary/10 p-3">
        <div className="mb-2 text-sm font-medium text-card-foreground">
          Tất cả tài liệu đã đính kèm
        </div>
        {allDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có tài liệu nào.</p>
        ) : (
          <ul className="space-y-1.5">
            {allDocs.map((doc) => (
              <li key={`all-${doc.id}`} className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-card px-2 py-1.5 text-xs">
                <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-foreground">{doc.fileName}</span>
                  <span className="ml-1 text-muted-foreground">({formatSize(doc.fileSize)})</span>
                </span>
                <span className="shrink-0 text-muted-foreground">
                  {doc.stepId
                    ? `Bước ${instance.workflow.steps.find((s) => s.id === doc.stepId)?.order ?? "?"}`
                    : "Tài liệu chung"}
                </span>
                <a
                  href={toWorkflowDocumentUrl(doc.storagePath)}
                  download={doc.fileName}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0"
                >
                  <Button variant="ghost" size="icon" aria-label="Tải tài liệu">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAct ? (
        <div className="space-y-2 rounded-md bg-secondary/30 p-3">
          <Textarea
            placeholder="Ghi chú (không bắt buộc)"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => void onAct("reject")} disabled={advance.isPending}>
              <X className="mr-1 h-4 w-4" />
              {moduleKey === "handover" ? "Hủy bàn giao" : "Trả lại"}
            </Button>
            <Button
              size="sm"
              onClick={() => void onAct("approve")}
              disabled={advance.isPending || blockedByDocument}
              title={blockedByDocument ? "Cần đính kèm tài liệu trước khi phê duyệt" : undefined}
            >
              <Check className="mr-1 h-4 w-4" />
              Phê duyệt
            </Button>
          </div>
          {blockedByDocument ? (
            <p className="text-xs text-destructive">
              Bước này yêu cầu tài liệu — vui lòng đính kèm trước khi phê duyệt.
            </p>
          ) : null}
        </div>
      ) : instance.status === "running" && instance.currentStep && !compact ? (
        <div className="rounded-md bg-secondary/20 p-3 text-xs text-muted-foreground">
          Bước hiện tại chờ vai trò{" "}
          <strong>{ROLE_LABEL[instance.currentStep.roleCode] ?? instance.currentStep.roleCode}</strong> xử lý.
        </div>
      ) : compact &&
        instance.status === "running" &&
        actionStep &&
        actionStepId === instance.currentStepId &&
        !showAct ? (
        <div className="rounded-md bg-secondary/20 p-3 text-xs text-muted-foreground">
          Bước này chờ vai trò <strong>{ROLE_LABEL[actionStep.roleCode] ?? actionStep.roleCode}</strong> xử lý.
        </div>
      ) : null}

      {!compact && instance.logs.length > 0 ? (
        <details className="rounded-md bg-secondary/10 px-3 py-2 text-xs">
          <summary className="cursor-pointer text-muted-foreground inline-flex items-center gap-1">
            <History className="h-3.5 w-3.5" /> Nhật ký ({instance.logs.length})
          </summary>
          <ul className="mt-2 space-y-1.5">
            {instance.logs.map((log) => (
              <li key={log.id} className="flex items-start gap-2 text-muted-foreground">
                <span className="w-32 shrink-0 text-foreground">{formatDateTime(log.createdAt)}</span>
                <span className="flex-1">
                  <span className="font-medium text-foreground">{ACTION_LABEL[log.action] ?? log.action}</span>
                  {log.step ? ` · ${log.step.name}` : ""}
                  {log.actor ? ` · ${log.actor.fullName}` : ""}
                  {log.comment ? ` — ${log.comment}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
