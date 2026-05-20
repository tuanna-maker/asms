import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DashboardPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

const DashboardPagination = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: DashboardPaginationProps) => {
  if (totalItems === 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 pt-2 border-t border-border/50 shrink-0 text-xs text-muted-foreground",
        className,
      )}
    >
      <span className="tabular-nums">
        {totalPages > 1 ? (
          <>
            {start}–{end} / {totalItems}
          </>
        ) : (
          <>Tổng {totalItems}</>
        )}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Trước
          </Button>
          <span className="px-1.5 tabular-nums font-medium text-card-foreground">
            {page}/{totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardPagination;
