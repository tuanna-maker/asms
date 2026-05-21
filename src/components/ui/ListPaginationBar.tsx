import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { pageRangeLabel } from "@/lib/list-pagination";
import { cn } from "@/lib/utils";

export interface ListPaginationBarProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  disabled?: boolean;
  /** Ẩn khi chỉ có 1 trang và ít hơn pageSize (mặc định true) */
  hideWhenSinglePage?: boolean;
  /** Kiểu hiển thị dòng tổng (dùng cho màn Thuộc tính) */
  variant?: "default" | "attribute";
}

const ListPaginationBar = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
  disabled = false,
  hideWhenSinglePage = true,
  variant = "default",
}: ListPaginationBarProps) => {
  if (totalItems === 0) return null;

  const totalSummary =
    variant === "attribute" ? (
      <span className="inline-flex items-center gap-2 text-sm">
        <span className="text-muted-foreground font-medium">Tổng</span>
        <span className="inline-flex min-h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-primary/12 px-2 text-xs font-bold text-primary tabular-nums">
          {totalItems}
        </span>
        <span className="text-muted-foreground font-medium">mục</span>
      </span>
    ) : (
      <p className="text-sm text-muted-foreground">Tổng {totalItems} mục</p>
    );

  if (hideWhenSinglePage && totalPages <= 1 && totalItems <= pageSize) {
    return (
      <div
        className={cn(
          variant === "attribute"
            ? "border-t border-border/60 bg-muted/25 px-4 py-3"
            : undefined,
          className,
        )}
      >
        {totalSummary}
      </div>
    );
  }

  return (
    <div
      className={cn(
        variant === "attribute"
          ? "flex flex-col gap-2 border-t border-border/60 bg-muted/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          : "flex flex-col gap-2 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      {variant === "attribute" ? (
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="text-muted-foreground font-medium">
            {pageRangeLabel(page, pageSize, totalItems)}
          </span>
          <span className="text-border">·</span>
          <span className="text-muted-foreground font-medium">Tổng</span>
          <span className="inline-flex min-h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-primary/12 px-2 text-xs font-bold text-primary tabular-nums">
            {totalItems}
          </span>
          <span className="text-muted-foreground font-medium">mục</span>
        </span>
      ) : (
        <p className="text-sm text-muted-foreground">
          {pageRangeLabel(page, pageSize, totalItems)} / {totalItems} mục
        </p>
      )}
      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!disabled && page > 1) onPageChange(page - 1);
                }}
                className={page <= 1 || disabled ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground tabular-nums">
                {page} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (!disabled && page < totalPages) onPageChange(page + 1);
                }}
                className={page >= totalPages || disabled ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default ListPaginationBar;
