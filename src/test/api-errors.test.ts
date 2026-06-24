import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";

import { getApiErrorMessage, getApiValidationMessages } from "@/lib/api-errors";

describe("getApiErrorMessage", () => {
  it("reads Vietnamese message from response", () => {
    const err = new AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: { success: false, message: "Hợp đồng không thuộc khách hàng này", data: null },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    });
    expect(getApiErrorMessage(err, "fallback")).toBe("Hợp đồng không thuộc khách hàng này");
  });

  it("prefers server message over field errors", () => {
    const err = new AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: {
        success: false,
        message: "Vui lòng nhập tiêu đề",
        data: { fieldErrors: { title: ["Lỗi khác"] }, formErrors: [] },
      },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    });
    expect(getApiErrorMessage(err, "fallback")).toBe("Vui lòng nhập tiêu đề");
  });

  it("joins field errors when message absent", () => {
    const err = new AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: {
        success: false,
        message: "",
        data: {
          fieldErrors: {
            title: ["Vui lòng nhập tiêu đề"],
            customerId: ["Vui lòng chọn khách hàng"],
          },
          formErrors: [],
        },
      },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    });
    expect(getApiValidationMessages(err)).toHaveLength(2);
    expect(getApiErrorMessage(err, "fallback")).toContain("tiêu đề");
    expect(getApiErrorMessage(err, "fallback")).toContain("khách hàng");
  });

  it("uses fallback when no response", () => {
    const err = new AxiosError("Network");
    expect(getApiErrorMessage(err, "Không lưu được")).toMatch(/máy chủ|Không lưu được/);
  });
});
