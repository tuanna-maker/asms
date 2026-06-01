import type { z } from "zod";

import { HttpError } from "./HttpError";
import { formatZodError } from "./formatValidationError";

/** Parse input với schema Zod; lỗi → HttpError 400 + message tiếng Việt. */
export function zodParseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const { message, details } = formatZodError(result.error);
    throw new HttpError(400, message, details);
  }
  return result.data;
}
