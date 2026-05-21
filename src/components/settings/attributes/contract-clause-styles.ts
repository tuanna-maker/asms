/** Style dùng chung cho màn Thuộc tính — Điều khoản & nhóm */
export const clauseAttrStyles = {
  section:
    "rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden [&_table]:border-separate [&_table]:border-spacing-0",
  sectionHead:
    "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 border-b border-border/60 bg-muted/25",
  sectionTitle: "font-semibold text-card-foreground tracking-tight",
  sectionDesc: "text-sm text-muted-foreground mt-0.5 leading-relaxed",
  tableHead:
    "h-10 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40 border-b border-border/60",
  tableRow: "border-b border-border/40 hover:bg-muted/20 transition-colors",
  cellCode: "font-mono text-xs text-muted-foreground",
  cellTitle: "font-medium text-foreground",
  cellGroup: "text-sm font-semibold text-primary",
  cellGroupEmpty: "text-sm text-muted-foreground",
  cellOrder: "text-sm tabular-nums text-muted-foreground",
  tableFooter:
    "flex flex-col gap-2 border-t border-border/60 bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
  tableFooterSummary: "inline-flex items-center gap-2 text-sm",
  tableFooterCount:
    "inline-flex min-h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-primary/12 px-2 text-xs font-bold text-primary tabular-nums",
  tableFooterLabel: "text-muted-foreground font-medium",
} as const;

/** Popup chọn điều khoản trên hợp đồng */
export const clausePickerStyles = {
  panel: "flex-1 min-h-0 overflow-y-auto rounded-lg border border-border/60 bg-card",
  headerGrid:
    "grid grid-cols-[2.75rem_minmax(8rem,30%)_1fr] gap-x-0 items-center border-b border-border/60 bg-muted/40 px-0 sticky top-0 z-10",
  headerColCheck: "h-10",
  headerColTitle: "h-10 px-3 flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground",
  headerColContent:
    "h-10 px-3 flex items-center text-xs font-semibold uppercase tracking-wide text-muted-foreground border-l border-border/40",
  groupRow:
    "grid grid-cols-[2.75rem_minmax(8rem,30%)_1fr] gap-x-0 items-stretch bg-primary/8 border-y border-primary/20",
  groupLabel:
    "col-span-2 py-3 pl-4 pr-3 flex items-center border-l-4 border-l-primary font-bold text-base text-foreground tracking-tight",
  clauseRow:
    "grid grid-cols-[2.75rem_minmax(8rem,30%)_1fr] gap-x-0 items-start border-b border-border/30 hover:bg-muted/20 transition-colors",
  clauseCheck: "flex justify-center pt-3.5 pb-3",
  clauseTitle:
    "py-3 px-3 text-sm font-medium text-foreground border-l border-border/30",
  clauseContent:
    "py-3 px-3 text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4 border-l border-border/30",
} as const;
