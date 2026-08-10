import { useRef, useState, type ReactNode } from "react";
import {
  Check,
  CircleDot,
  Download,
  Eye,
  FileText,
  History,
  ImageIcon,
  Paperclip,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { resolveUploadUrl } from "@/lib/upload-url";
import {
  downloadUploadFile,
  isBrowserPreviewable,
  isImageDocument,
} from "@/lib/workflow-document-file";
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
  type WorkflowInstanceDocument,
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

type ImagePreviewState = { url: string; fileName: string } | null;

function toWorkflowDocumentUrl(storagePath: string): string {
  return resolveUploadUrl(storagePath);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 102.4) / 10} KB`;
  return `${Math.round(bytes / 104857.6) / 10} MB`;
}

function WorkflowDocumentActions({
  doc,
  onPreviewImage,
  canDelete,
  deleting,
  onDelete,
}: {
  doc: WorkflowInstanceDocument;
  onPreviewImage: (state: ImagePreviewState) => void;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
}) {
  const url = toWorkflowDocumentUrl(doc.storagePath);
  const isImage = isImageDocument(doc.mimeType, doc.fileName);
  const canPreview = isBrowserPreviewable(doc.mimeType, doc.fileName);

  const onView = () => {
    if (isImage) {
      onPreviewImage({ url, fileName: doc.fileName });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const onDownload = () => {
    void downloadUploadFile(url, doc.fileName).catch(() => {
      toast.error("Không tải được tài liệu");
    });
  };

  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {canPreview ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={isImage ? "Xem ảnh" : "Xem tài liệu"}
          title={isImage ? "Xem ảnh" : "Xem tài liệu"}
          onClick={onView}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        aria-label="Tải về"
        title="Tải về"
        onClick={onDownload}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      {canDelete && onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Xoá tài liệu"
          onClick={onDelete}
          disabled={deleting}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      ) : null}
    </div>
  );
}

function DocumentListItem({
  doc,
  meta,
  onPreviewImage,
  canDelete,
  deleting,
  onDelete,
}: {
  doc: WorkflowInstanceDocument;
  meta?: ReactNode;
  onPreviewImage: (state: ImagePreviewState) => void;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: () => void;
}) {
  const url = toWorkflowDocumentUrl(doc.storagePath);
  const isImage = isImageDocument(doc.mimeType, doc.fileName);

  return (
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md bg-card px-2 py-1.5 text-xs">
      {isImage ? (
        <button
          type="button"
          className="h-9 w-9 shrink-0 overflow-hidden rounded border border-border/60 bg-muted"
          onClick={() => onPreviewImage({ url, fileName: doc.fileName })}
          title="Xem ảnh"
        >
          <img src={url} alt={doc.fileName} className="h-full w-full object-cover" />
        </button>
      ) : (
        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      )}
      <button
        type="button"
        className="min-w-0 flex-1 truncate text-left hover:underline"
        onClick={() => {
          if (isImage) onPreviewImage({ url, fileName: doc.fileName });
          else if (isBrowserPreviewable(doc.mimeType, doc.fileName)) {
            window.open(url, "_blank", "noopener,noreferrer");
          } else {
            void downloadUploadFile(url, doc.fileName).catch(() => {
              toast.error("Không tải được tài liệu");
            });
          }
        }}
        title={doc.fileName}
      >
        <span className="font-medium text-foreground">{doc.fileName}</span>
        <span className="ml-1 text-muted-foreground">({formatSize(doc.fileSize)})</span>
      </button>
      {meta}
      <WorkflowDocumentActions
        doc={doc}
        onPreviewImage={onPreviewImage}
        canDelete={canDelete}
        deleting={deleting}
        onDelete={onDelete}
      />
    </li>
  );
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
  const [imagePreview, setImagePreview] = useState<ImagePreviewState>(null);
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
  /** Cho phép đính kèm khi quy trình còn chạy. */
  const canUploadDocs = showDocsBlock && instance.status === "running";
  const docStepLabel = compact && actionStep ? actionStep.name : "bước hiện tại";

  const docsSection = showDocsBlock ? (
    <div
      className={cn(
        "rounded-md border p-3",
        requireDoc
          ? "border-amber-300/80 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"
          : "border-border/50 bg-secondary/10",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-card-foreground">
          <Paperclip className="h-4 w-4" />
          Tài liệu {compact ? `— ${docStepLabel}` : `của ${docStepLabel}`}
          {requireDoc ? <span className="ml-1 text-destructive">(bắt buộc)</span> : null}
        </div>
      </div>

      {canUploadDocs ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onUploadFile(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={onUploadClick}
            disabled={uploadDoc.isPending}
            className={cn(
              "mb-3 flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 py-4 text-center transition-colors",
              requireDoc
                ? "border-amber-400 bg-white/70 hover:bg-amber-50 dark:bg-background/40 dark:hover:bg-amber-950/40"
                : "border-border bg-background/50 hover:bg-muted/40",
              uploadDoc.isPending && "opacity-60",
            )}
          >
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {uploadDoc.isPending ? "Đang tải lên…" : "Chọn hoặc kéo thả file để đính kèm"}
            </span>
            <span className="text-[11px] text-muted-foreground">PDF, ảnh, Word, Excel — tối đa 25MB</span>
          </button>
        </>
      ) : (
        <p className="mb-2 text-xs text-muted-foreground">
          {instance.status !== "running"
            ? "Quy trình đã đóng — không thể đính kèm thêm."
            : "Không thể đính kèm tài liệu ở trạng thái hiện tại."}
        </p>
      )}

      {stepDocs.length === 0 ? (
        <p className={cn("text-xs", requireDoc ? "text-destructive" : "text-muted-foreground")}>
          {requireDoc ? "Chưa có tài liệu — bắt buộc đính kèm trước khi phê duyệt." : "Chưa có tài liệu nào cho bước này."}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {stepDocs.map((doc) => (
            <DocumentListItem
              key={doc.id}
              doc={doc}
              onPreviewImage={setImagePreview}
              canDelete={canUploadDocs}
              deleting={deleteDoc.isPending}
              onDelete={() => void onDeleteDocument(doc.id)}
              meta={
                doc.uploadedBy ? (
                  <span className="shrink-0 text-muted-foreground">
                    {doc.uploadedBy.fullName} · {formatDateTime(doc.uploadedAt)}
                  </span>
                ) : (
                  <span className="shrink-0 text-muted-foreground">{formatDateTime(doc.uploadedAt)}</span>
                )
              }
            />
          ))}
        </ul>
      )}
    </div>
  ) : null;

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4",
        compact && "border-0 bg-transparent p-0 shadow-none",
      )}
    >
      {compact ? docsSection : null}

      {!compact ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium text-card-foreground">Tiến trình quy trình</div>
            <Badge variant={instance.status === "running" ? "default" : "secondary"}>
              {instance.status === "running"
                ? "Đang chạy"
                : instance.status === "completed"
                  ? "Hoàn thành"
                  : "Đã đóng"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {instance.workflow.name} · Bước {currentIndex >= 0 ? currentIndex + 1 : "—"}/
            {instance.workflow.steps.length}
          </p>
          <ol className="space-y-1.5">
            {instance.workflow.steps.map((step, idx) => {
              const isCurrent = step.id === instance.currentStepId;
              const isDone = currentIndex >= 0 && idx < currentIndex;
              return (
                <li key={step.id} className={workflowStepListItemClass(isCurrent)}>
                  <span className="mt-0.5 shrink-0">
                    {isDone ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : isCurrent ? (
                      <CircleDot className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="inline-block h-4 w-4 rounded-full border border-muted-foreground/40" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground">
                      {idx + 1}. {step.name}
                    </div>
                    <div className="text-muted-foreground">
                      {ROLE_LABEL[step.roleCode] ?? step.roleCode}
                      {step.requireDocument ? " · Cần tài liệu" : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ) : null}

      {!compact ? docsSection : null}
      <div className="rounded-md border border-border/50 bg-secondary/10 p-3">
        <div className="mb-2 text-sm font-medium text-card-foreground">
          Tất cả tài liệu đã đính kèm
        </div>
        {allDocs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có tài liệu nào.</p>
        ) : (
          <ul className="space-y-1.5">
            {allDocs.map((doc) => (
              <DocumentListItem
                key={`all-${doc.id}`}
                doc={doc}
                onPreviewImage={setImagePreview}
                meta={
                  <span className="shrink-0 text-muted-foreground">
                    {doc.stepId
                      ? `Bước ${instance.workflow.steps.find((s) => s.id === doc.stepId)?.order ?? "?"}`
                      : "Tài liệu chung"}
                  </span>
                }
              />
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
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-card-foreground">
            <History className="h-4 w-4" />
            Nhật ký
          </div>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
            {instance.logs.slice(0, 20).map((log) => (
              <li key={log.id} className="rounded bg-card/60 px-2 py-1">
                <span className="font-medium text-foreground">
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                {log.step ? ` · ${log.step.name}` : ""}
                {log.actor ? ` · ${log.actor.fullName}` : ""}
                <span className="ml-1">{formatDateTime(log.createdAt)}</span>
                {log.comment ? <div className="mt-0.5 italic">{log.comment}</div> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Dialog open={Boolean(imagePreview)} onOpenChange={(o) => !o && setImagePreview(null)}>
        <DialogContent className="max-w-4xl gap-3 overflow-hidden p-4 sm:rounded-lg">
          <DialogHeader className="space-y-1 pr-8 text-left">
            <DialogTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{imagePreview?.fileName ?? "Xem ảnh"}</span>
            </DialogTitle>
          </DialogHeader>
          {imagePreview ? (
            <div className="flex max-h-[75vh] flex-col gap-3">
              <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-md bg-muted/40 p-2">
                <img
                  src={imagePreview.url}
                  alt={imagePreview.fileName}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void downloadUploadFile(imagePreview.url, imagePreview.fileName).catch(() => {
                      toast.error("Không tải được ảnh");
                    });
                  }}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Tải về
                </Button>
                <Button type="button" size="sm" onClick={() => setImagePreview(null)}>
                  Đóng
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
