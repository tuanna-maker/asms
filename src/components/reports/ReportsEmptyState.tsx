export function ReportsEmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
