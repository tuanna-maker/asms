import type { Prisma } from "@prisma/client";

export function sanitizeStatusSlaHours(
  input: Record<string, number> | undefined,
): Prisma.InputJsonValue | undefined {
  if (input === undefined) return undefined;
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(input)) {
    const code = key.trim();
    if (!code) continue;
    const n = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(n) || n < 0) continue;
    out[code] = Math.floor(n);
  }
  return out;
}

export function toStatusSlaHoursRecord(
  value: Prisma.JsonValue | null | undefined,
): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isFinite(n) && n >= 0) result[key] = Math.floor(n);
  }
  return result;
}
