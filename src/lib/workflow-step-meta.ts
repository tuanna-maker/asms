/** Parse gợi ý chứng từ từ WorkflowStep.description (seed / editor). */

const HINT_PREFIX = /^gợi ý\s*:\s*/i;

/** Tách gợi ý: dòng "Gợi ý: a · b" hoặc toàn bộ description nếu ngắn. */
export function parseDocHints(stepDescription?: string | null): string[] {
  const raw = (stepDescription ?? "").trim();
  if (!raw) return [];

  const lines = raw.split(/\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (HINT_PREFIX.test(line)) {
      const body = line.replace(HINT_PREFIX, "").trim();
      if (!body) return [];
      return body
        .split(/[·|]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (lines.length === 1 && lines[0]!.length < 120) {
    return lines[0]!
      .split(/[·|]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}

export function docHintsWithFallback(
  stepDescription: string | null | undefined,
  stepIndex: number,
  fallback: (index: number) => string[],
): string[] {
  const parsed = parseDocHints(stepDescription);
  if (parsed.length > 0) return parsed;
  return fallback(stepIndex);
}
