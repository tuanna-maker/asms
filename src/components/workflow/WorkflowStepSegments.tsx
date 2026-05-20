import { cn } from "@/lib/utils";

export type WorkflowStepSegmentsSnapshot = {
  totalSteps: number;
  currentStepIndex: number;
  status?: "running" | "completed" | "cancelled" | string;
};

type SegmentVariant = "table" | "panel";

type Props = {
  workflow: WorkflowStepSegmentsSnapshot;
  className?: string;
  segmentClassName?: string;
  /** `table`: trong bảng — không viền. `panel`: form chỉnh sửa — có viền nhẹ. */
  variant?: SegmentVariant;
};

export function WorkflowStepSegments({
  workflow,
  className,
  segmentClassName,
  variant = "panel",
}: Props) {
  const { totalSteps, currentStepIndex, status } = workflow;
  const n = Math.max(0, totalSteps);
  if (n === 0) return null;

  const finished = status === "completed";
  const cancelled = status === "cancelled";
  const inTable = variant === "table";

  const segmentState = (i: number): "done" | "pending" => {
    if (finished) return i < n ? "done" : "pending";
    if (cancelled) return "pending";
    if (currentStepIndex <= 0) return "pending";
    return i < currentStepIndex ? "done" : "pending";
  };

  return (
    <div
      className={cn("flex shrink-0", inTable ? "gap-0.5" : "gap-1", className)}
      role="img"
      aria-label={`Tiến trình quy trình ${Math.min(currentStepIndex, n)}/${n} bước`}
    >
      {Array.from({ length: n }, (_, i) => {
        const state = segmentState(i);
        return (
          <div
            key={i}
            className={cn(
              "h-2.5 w-5 shrink-0 rounded-sm",
              inTable
                ? state === "done"
                  ? "bg-primary"
                  : "bg-secondary"
                : cn(
                    "rounded-[3px] border box-border",
                    state === "done"
                      ? "border-primary bg-primary"
                      : "border-border bg-muted/50",
                  ),
              segmentClassName,
            )}
          />
        );
      })}
    </div>
  );
}

type PillProps = WorkflowStepSegmentsSnapshot & {
  label: string;
  emphasis?: boolean;
  className?: string;
  variant?: SegmentVariant;
};

/** Vạch bước + nhãn (bảng danh sách hoặc form). */
export function WorkflowStepProgressPill({
  label,
  emphasis,
  className,
  variant = "panel",
  ...workflow
}: PillProps) {
  const n = Math.max(0, workflow.totalSteps);
  if (n === 0) {
    return <span className="text-xs text-muted-foreground">Chưa gắn quy trình</span>;
  }

  const inTable = variant === "table";

  return (
    <div
      className={cn(
        inTable
          ? "flex flex-col items-start gap-1 py-0.5 max-w-[220px] sm:max-w-[280px]"
          : cn(
              "flex items-start gap-2.5 max-w-[300px] rounded-lg border px-2.5 py-1.5",
              emphasis ? "border-destructive/30 bg-destructive/5" : "border-border/70 bg-muted/30",
            ),
        className,
      )}
    >
      <WorkflowStepSegments workflow={workflow} variant={variant} />
      <span
        className={cn(
          "text-xs leading-snug break-words min-w-0",
          inTable ? "text-muted-foreground" : "text-foreground/85 font-medium",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/** Class tab bước quy trình trong màn chỉnh sửa (gạch dưới khi active). */
export const workflowStepTabTriggerClass =
  "text-xs whitespace-nowrap rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 pb-2 pt-1 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

/** Class từng bước trong panel tiến trình (màn sửa). */
export function workflowStepListItemClass(isDone: boolean, isCurrent: boolean) {
  return cn(
    "flex items-start gap-2 rounded-md border border-border/60 px-2.5 py-2 text-sm",
    isCurrent && "border-amber-300/80 border-l-[3px] border-l-amber-500 bg-amber-50/70",
    isDone && !isCurrent && "border-emerald-300/70 border-l-[3px] border-l-emerald-500 bg-emerald-50/50",
    !isDone && !isCurrent && "border-l-[3px] border-l-border bg-card",
  );
}
