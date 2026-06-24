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

  it("translates too big number limit", () => {
    const schema = z.object({ currentStep: z.number().int().max(99) });
    const r = schema.safeParse({ currentStep: 150 });
    expect(r.success).toBe(false);
    if (!r.success) {
      const { message, details } = formatZodError(r.error);
      expect(message).toBe("Bước hiện tại không được lớn hơn 99");
      expect(details.fieldErrors.currentStep?.[0]).toMatch(/không được lớn hơn 99/);
    }
  });

  it("translates invalid enum option", () => {
    const schema = z.object({ type: z.enum(["warranty", "repair"]) });
    const r = schema.safeParse({ type: "broken" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const { message } = formatZodError(r.error);
      expect(message).toMatch(/loại không hợp lệ/i);
    }
  });

  it("translates all field errors in details", () => {
    const schema = z.object({
      fullName: z.string().min(1),
      email: z.string().email(),
    });
    const r = schema.safeParse({ fullName: "", email: "bad" });
    expect(r.success).toBe(false);
    if (!r.success) {
      const { details } = formatZodError(r.error);
      expect(details.fieldErrors.fullName?.[0]).toMatch(/họ tên/i);
      expect(details.fieldErrors.email?.[0]).toBe("Email không hợp lệ");
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

  it("formatValidationFlatten keeps translated details shape", () => {
    const flat = formatValidationFlatten({
      formErrors: [],
      fieldErrors: { content: ["Required"] },
    });
    expect(flat.message).toMatch(/nội dung/i);
    expect(flat.details.fieldErrors.content?.[0]).toMatch(/nội dung/i);
  });
});
