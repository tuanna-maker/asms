export function buildStatusSlaFormState(
  definitions: Array<{ code: string; slaHours?: number | null }>,
  saved: Record<string, number> | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const d of definitions) {
    const fromSaved = saved?.[d.code];
    if (fromSaved !== undefined && Number.isFinite(fromSaved)) {
      out[d.code] = String(fromSaved);
    } else if (d.slaHours != null && d.slaHours >= 0) {
      out[d.code] = String(d.slaHours);
    } else {
      out[d.code] = "";
    }
  }
  return out;
}

export function parseStatusSlaHoursForm(form: Record<string, string>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, raw] of Object.entries(form)) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const n = Number(trimmed);
    if (Number.isFinite(n) && n >= 0) out[code] = Math.floor(n);
  }
  return out;
}
