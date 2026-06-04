/** Các màn ẩn khỏi menu và chặn truy cập trực tiếp (mọi vai trò, kể cả admin). */
const HIDDEN_PATH_PREFIXES = ["/de-tai", "/cong-viec", "/dao-tao"] as const;

export function isAppRouteHidden(pathname: string): boolean {
  const path = pathname.split("?")[0]?.split("#")[0] ?? pathname;
  return HIDDEN_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
