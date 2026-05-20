import ListPaginationBar from "@/components/ui/ListPaginationBar";
import { useListPagination } from "@/hooks/use-list-pagination";

interface PaginatedTableFooterProps {
  totalItems: number;
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
}

/** Chân bảng phân trang — dùng khi hook pagination nằm ở component cha */
export function PaginatedTableFooter(props: PaginatedTableFooterProps) {
  return <ListPaginationBar {...props} />;
}

interface UsePaginatedSliceResult<T> {
  pagedItems: T[];
  page: number;
  setPage: (page: number) => void;
  total: number;
  totalPages: number;
  pageSize: number;
  startIndex: number;
  footerProps: PaginatedTableFooterProps;
}

/** Hook + props footer cho danh sách đã lọc */
export function usePaginatedSlice<T>(
  items: T[],
  resetDeps?: readonly unknown[],
): UsePaginatedSliceResult<T> {
  const { pagedItems, page, setPage, total, totalPages, pageSize, startIndex } = useListPagination(items, {
    resetDeps,
  });
  return {
    pagedItems,
    page,
    setPage,
    total,
    totalPages,
    pageSize,
    startIndex,
    footerProps: {
      page,
      totalPages,
      totalItems: total,
      pageSize,
      onPageChange: setPage,
    },
  };
}
