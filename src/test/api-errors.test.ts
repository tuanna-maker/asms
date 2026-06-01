import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";

import { getApiErrorMessage } from "@/lib/api-errors";

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

  it("reads first field error from flatten details", () => {
    const err = new AxiosError("fail", undefined, undefined, undefined, {
      status: 400,
      data: {
        success: false,
        message: "Dữ liệu không hợp lệ",
        data: { fieldErrors: { title: ["Vui lòng nhập tiêu đề"] }, formErrors: [] },
      },
      statusText: "Bad Request",
      headers: {},
      config: {} as never,
    });
    expect(getApiErrorMessage(err, "fallback")).toBe("Vui lòng nhập tiêu đề");
  });

  it("uses fallback when no response", () => {
    const err = new AxiosError("Network");
    expect(getApiErrorMessage(err, "Không lưu được")).toMatch(/máy chủ|Không lưu được/);
  });
});
