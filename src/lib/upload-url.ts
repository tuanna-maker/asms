/**
 * Build authenticated URL for protected upload files (JWT via query string for img/src).
 */
const ACCESS_TOKEN_KEYS = ["erp-access-token", "accessToken", "token", "jwt"];

function getAccessToken(): string | null {
  for (const k of ACCESS_TOKEN_KEYS) {
    const v = localStorage.getItem(k);
    if (v) return v;
  }
  return null;
}

export function resolveUploadUrl(pathOrUrl: string): string {
  const normalized = pathOrUrl.replace(/\\/g, "/");
  let rel = normalized;

  const uploadsMarker = "/uploads/";
  const idx = normalized.lastIndexOf(uploadsMarker);
  if (idx >= 0) {
    rel = normalized.slice(idx + uploadsMarker.length);
  } else if (normalized.startsWith("uploads/")) {
    rel = normalized.slice("uploads/".length);
  } else if (normalized.startsWith("/api/v1/uploads/")) {
    rel = normalized.slice("/api/v1/uploads/".length);
  }

  const base = import.meta.env.VITE_API_URL as string | undefined;
  const prefix = base?.replace(/\/$/, "") ?? "";
  const url = new URL(`${prefix}/api/v1/uploads/${rel}`, window.location.origin);

  const token = getAccessToken();
  if (token) {
    url.searchParams.set("token", token);
  }

  return url.pathname + url.search;
}
