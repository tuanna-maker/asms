/** Tùy chọn lọc cột khách hàng — lấy từ dữ liệu thật thay vì hardcode. */
export function buildCustomerFilterOptions(names: string[]): Array<{ value: string; label: string }> {
  return [...new Set(names.filter((n) => n && n !== "—"))].sort().map((name) => ({ value: name, label: name }));
}
