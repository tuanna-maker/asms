/** Bổ sung tham số pool/timeout cho PostgreSQL remote (tránh lỗi timeout ~5s khi mạng chậm). */
export function normalizeDatabaseUrl(url: string): string {
  if (!url) return url;
  try {
    const u = new URL(url.replace(/^postgresql:/, "postgres:"));
    const defaults: Record<string, string> = {
      connect_timeout: "30",
      pool_timeout: "30",
      connection_limit: "10",
    };
    for (const [key, value] of Object.entries(defaults)) {
      if (!u.searchParams.has(key)) u.searchParams.set(key, value);
    }
    u.protocol = "postgresql:";
    return u.toString();
  } catch {
    return url;
  }
}

export function isDatabaseUnreachableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message;
  return (
    msg.includes("Can't reach database server") ||
    msg.includes("Connection timed out") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ETIMEDOUT")
  );
}
