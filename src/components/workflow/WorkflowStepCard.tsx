import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Paperclip,
  Pencil,
  Trash2,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseFieldSchema } from "@/lib/workflow-field-schema";
import type { WorkflowStepItem } from "@/hooks/use-workflows-api";

const ACTION_STYLE: Record<string, { label: string; className: string }> = {
  submit: { label: "Trình ký", className: "bg-sky-100 text-sky-700 hover:bg-sky-100" },
  approve: { label: "Ký duyệt", className: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" },
  sign: { label: "Ký số", className: "bg-violet-100 text-violet-700 hover:bg-violet-100" },
  release: { label: "Ban hành", className: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
};

const PHASE_STYLE: Record<string, { label: string; className: string }> = {
  handover: { label: "Bàn giao", className: "bg-indigo-50 text-indigo-700 border border-indigo-200" },
  training: { label: "Huấn luyện", className: "bg-teal-50 text-teal-700 border border-teal-200" },
  warranty: { label: "Bảo hành", className: "bg-orange-50 text-orange-700 border border-orange-200" },
  other: { label: "Khác", className: "bg-slate-50 text-slate-700 border border-slate-200" },
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Lãnh đạo",
  manager: "Trưởng phòng",
  technician: "Nhân viên kỹ thuật",
  sales: "Nhân viên bán hàng",
  viewer: "Xem",
};

const STRIPE_BY_INDEX = [
  "border-l-sky-400",
  "border-l-emerald-400",
  "border-l-violet-400",
  "border-l-amber-400",
  "border-l-rose-400",
  "border-l-cyan-400",
];

type Props = {
  step: WorkflowStepItem;
  index: number;
  total: number;
  canWrite: boolean;
  canDelete?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
  roleLabel?: string;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
};

export function WorkflowStepCard({
  step,
  index,
  total,
  canWrite,
  canDelete = false,
  onEdit,
  onDelete,
  onMove,
  roleLabel,
  dragHandleProps,
  isDragging,
}: Props) {
  const action = ACTION_STYLE[step.actionCode] ?? {
    label: step.actionCode,
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  };
  const phase = PHASE_STYLE[step.phaseCode] ?? PHASE_STYLE.other!;
  const stripe = STRIPE_BY_INDEX[index % STRIPE_BY_INDEX.length];
  const roleText = roleLabel ?? ROLE_LABEL[step.roleCode] ?? step.roleCode;
  const fieldCount = parseFieldSchema(step.fieldSchema).length;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border/50 border-l-4 bg-card p-3 shadow-sm transition",
        stripe,
        isDragging && "opacity-50 ring-2 ring-primary/40",
      )}
    >
      {canWrite ? (
        <button
          type="button"
          aria-label="Kéo để sắp xếp"
          className="mt-1 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-muted/60 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      ) : null}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-secondary text-sm font-semibold">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-card-foreground">{step.name}</span>
          <Badge variant="secondary" className={action.className}>
            {action.label}
          </Badge>
          <Badge variant="outline" className={phase.className}>
            Giai đoạn: {phase.label}
          </Badge>
          {step.requireDocument ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
              title="Bước này yêu cầu đính kèm tài liệu trước khi duyệt"
            >
              <Paperclip className="h-3 w-3" />
              Yêu cầu tài liệu
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3.5 w-3.5" />
            {roleText}
          </span>
          {(step.assigneeIds?.length ?? 0) > 0 ? (
            <span>{step.assigneeIds.length} người xử lý</span>
          ) : null}
          <span>{fieldCount > 0 ? `${fieldCount} trường nhập` : "Chưa có trường nhập"}</span>
        </div>
        {step.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{step.description}</p>
        ) : null}
      </div>
      {canWrite || canDelete ? (
        <div className="flex shrink-0 items-center gap-1">
          {canWrite ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Lên"
                disabled={index === 0}
                onClick={() => onMove("up")}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Xuống"
                disabled={index === total - 1}
                onClick={() => onMove("down")}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="Sửa" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          ) : null}
          {canDelete ? (
            <Button variant="ghost" size="icon" aria-label="Xoá" onClick={onDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
