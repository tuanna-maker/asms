/** Số bản ghi mặc định mỗi trang cho danh sách / bảng */
export const DEFAULT_LIST_PAGE_SIZE = 20;

export function calcTotalPages(totalItems: number, pageSize: number): number {
  if (totalItems <= 0) return 1;
  return Math.ceil(totalItems / pageSize);
}

export function slicePage<T>(items: T[], page: number, pageSize: number): T[] {
  const totalPages = calcTotalPages(items.length, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function pageRangeLabel(page: number, pageSize: number, total: number): string {
  if (total === 0) return "0";
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return `${start}–${end}`;
}
