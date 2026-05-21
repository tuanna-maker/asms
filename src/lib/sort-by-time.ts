/** Lấy timestamp từ chuỗi ISO / Date; không hợp lệ → 0 */
export function getTimeMs(value: unknown): number {
  if (value == null || value === "") return 0;
  const t = new Date(String(value)).getTime();
  return Number.isNaN(t) ? 0 : t;
}

type TimeKey<T> = keyof T | ((row: T) => unknown);

function resolveValue<T>(row: T, key: TimeKey<T>): unknown {
  return typeof key === "function" ? key(row) : row[key];
}

/** Sắp xếp mới nhất trước; thử lần lượt các trường thời gian. */
export function sortByNewestFirst<T>(items: readonly T[], ...keys: TimeKey<T>[]): T[] {
  const resolved =
    keys.length > 0
      ? keys
      : (["createdAt", "updatedAt", "activityAt", "feedbackAt", "uploadedAt", "startDate"] as TimeKey<T>[]);

  return [...items].sort((a, b) => {
    for (const key of resolved) {
      const diff = getTimeMs(resolveValue(b, key)) - getTimeMs(resolveValue(a, key));
      if (diff !== 0) return diff;
    }
    return 0;
  });
}

/** Tự phát hiện cột thời gian phổ biến trên object */
export function detectTimeSortKey(sample: Record<string, unknown>): string | null {
  for (const key of ["createdAt", "updatedAt", "activityAt", "feedbackAt", "uploadedAt", "createdDate", "startDate"]) {
    if (key in sample && sample[key] != null) return key;
  }
  return null;
}
