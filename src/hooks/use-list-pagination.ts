import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_LIST_PAGE_SIZE,
  calcTotalPages,
  slicePage,
} from "@/lib/list-pagination";

export type UseListPaginationOptions = {
  pageSize?: number;
  /** Khi đổi bộ lọc / tìm kiếm — reset về trang 1 */
  resetDeps?: readonly unknown[];
};

export function useListPagination<T>(
  items: T[],
  options?: UseListPaginationOptions,
) {
  const pageSize = options?.pageSize ?? DEFAULT_LIST_PAGE_SIZE;
  const [page, setPage] = useState(1);

  const total = items.length;
  const totalPages = calcTotalPages(total, pageSize);
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resetDeps do caller truyền (search, filter, …)
  }, [total, pageSize, ...(options?.resetDeps ?? [])]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedItems = useMemo(
    () => slicePage(items, safePage, pageSize),
    [items, safePage, pageSize],
  );

  const startIndex = total === 0 ? 0 : (safePage - 1) * pageSize;

  return {
    page: safePage,
    setPage,
    pageSize,
    total,
    totalPages,
    pagedItems,
    startIndex,
  };
}
