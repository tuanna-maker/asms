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
}: ListPaginationBarProps) => {
  if (totalItems === 0) return null;
  if (hideWhenSinglePage && totalPages <= 1 && totalItems <= pageSize) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>Tổng {totalItems} mục</p>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-border/50 pt-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        {pageRangeLabel(page, pageSize, totalItems)} / {totalItems} mục
      </p>
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
