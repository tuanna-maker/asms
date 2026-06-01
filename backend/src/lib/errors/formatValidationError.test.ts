import { describe, expect, it } from "vitest";
import { z } from "zod";

import { formatValidationFlatten, formatZodError } from "./formatValidationError";
import { zodParseOrThrow } from "./zodParse";
import { HttpError } from "./HttpError";

describe("formatValidationError", () => {
  it("maps required field to Vietnamese", () => {
    const schema = z.object({ title: z.string().min(1) });
    const r = schema.safeParse({ title: "" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const { message } = formatZodError(r.error);
      expect(message).toMatch(/tiêu đề/i);
    }
  });

  it("zodParseOrThrow throws HttpError 400 with message", () => {
    const schema = z.object({ customerId: z.string().min(1) });
    try {
      zodParseOrThrow(schema, {});
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError);
      const err = e as HttpError;
      expect(err.statusCode).toBe(400);
      expect(err.message).toMatch(/khách hàng/i);
      expect(err.details).toBeTruthy();
    }
  });

  it("formatValidationFlatten keeps details shape", () => {
    const flat = formatValidationFlatten({
      formErrors: [],
      fieldErrors: { content: ["Required"] },
    });
    expect(flat.message).toMatch(/nội dung/i);
    expect(flat.details.fieldErrors.content).toBeDefined();
  });
});
